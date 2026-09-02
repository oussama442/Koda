const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const toolingPath = path.join(__dirname, '../database/schema.js');
const schema = fs.existsSync(toolingPath) ? require(toolingPath) : {};
const baselinePath = path.join(__dirname, '../database/schema.sql');

function tooling() {
    assert.equal(typeof schema.initializeDatabase, 'function', 'Safe schema initialization must be available');
    return schema;
}

test('initialization requires an explicit database name before issuing any query', async () => {
    const { initializeDatabase } = tooling();
    const queries = [];
    const connection = { query: async (sql) => { queries.push(sql); return [[]]; } };
    await assert.rejects(initializeDatabase(connection, ''), /DB_NAME.*explicit/i);
    await assert.rejects(initializeDatabase(connection, 'koda_db`; DROP DATABASE x'), /database name/i);
    assert.deepEqual(queries, []);
});

test('initialization refuses a nonempty schema before executing DDL', async () => {
    const { initializeDatabase } = tooling();
    const queries = [];
    const connection = {
        async query(sql) {
            queries.push(sql);
            if (/information_schema\.SCHEMATA/i.test(sql)) return [[{ SCHEMA_NAME: 'koda_db' }]];
            return [[{ object_count: 1 }]];
        }
    };
    await assert.rejects(initializeDatabase(connection, 'koda_db'), /not empty/i);
    assert.ok(queries.length > 0);
    assert.ok(queries.every((sql) => /^\s*SELECT\b/i.test(sql)), 'No CREATE, DROP, ALTER, or USE may precede the guard');
});

test('initialization creates only the baseline in a newly named empty database', async () => {
    const { initializeDatabase, readBaseline } = tooling();
    const queries = [];
    const connection = {
        async query(sql) {
            queries.push(sql);
            if (/information_schema\.SCHEMATA/i.test(sql)) return [[]];
            if (/information_schema\./i.test(sql)) return [[{ object_count: 0 }]];
            return [[]];
        }
    };
    const result = await initializeDatabase(connection, 'koda_schema_test_explicit');
    const creates = queries.filter((sql) => /^CREATE TABLE\b/i.test(sql));
    assert.equal(result.tableCount, 21);
    assert.deepEqual(creates, [...readBaseline().values()]);
    assert.equal(queries.filter((sql) => /^CREATE DATABASE\b/i.test(sql)).length, 1);
    assert.ok(!queries.some((sql) => /\b(?:DROP|INSERT|DELETE|UPDATE|ALTER)\s+(?:DATABASE|TABLE|INTO|FROM)\b/i.test(sql)));
    assert.ok(!queries.some((sql) => /FOREIGN_KEY_CHECKS/i.test(sql)));
});

test('baseline preserves the 21-table schema and orders every FK parent first', () => {
    const { readBaseline } = tooling();
    const baseline = readBaseline();
    const ddl = fs.readFileSync(baselinePath, 'utf8');
    assert.equal(baseline.size, 21);
    assert.equal((ddl.match(/^  `\w+` /gm) || []).length, 150);
    assert.equal((ddl.match(/\bFOREIGN KEY\b/g) || []).length, 29);
    assert.equal((ddl.match(/\bPRIMARY KEY\b/g) || []).length, 21);
    assert.equal((ddl.match(/\bUNIQUE KEY\b/g) || []).length, 4);
    assert.equal((ddl.match(/\bCHECK\s*\(/g) || []).length, 1);
    const seen = new Set();
    for (const [name, statement] of baseline) {
        for (const reference of statement.matchAll(/REFERENCES `([^`]+)`/g)) {
            assert.ok(seen.has(reference[1]), `${name} must follow ${reference[1]}`);
        }
        seen.add(name);
    }
    assert.ok(baseline.has('improvements') && baseline.has('improvement_requests'));
    assert.doesNotMatch(baseline.get('improvements'), /FOREIGN KEY/);
    assert.match(baseline.get('documents'), /CHECK \(`project_id` is not null or `task_id` is not null or `incident_id` is not null\)/);
});

test('drift comparison ignores formatting and the next auto-increment value', () => {
    const { readBaseline, compareSchemas } = tooling();
    const expected = readBaseline();
    const actual = new Map([...expected].map(([name, sql]) => [name, sql.replace(/\n/g, ' ').replace('ENGINE=InnoDB', 'ENGINE=InnoDB AUTO_INCREMENT=417')]));
    assert.deepEqual(compareSchemas(expected, actual), { missingTables: [], unexpectedTables: [], changedTables: [] });
});

for (const [label, table, mutate] of [
    ['column nullability', 'projects', (sql) => sql.replace('`application_id` int(11) NOT NULL', '`application_id` int(11) DEFAULT NULL')],
    ['missing column', 'notifications', (sql) => sql.replace('  `reference_id` int(11) DEFAULT NULL,\n', '')],
    ['column type', 'users', (sql) => sql.replace('`avatar` varchar(255)', '`avatar` varchar(150)')],
    ['foreign-key delete rule', 'tasks', (sql) => sql.replace('ON DELETE SET NULL', 'ON DELETE CASCADE')],
    ['unique constraint', 'roles', (sql) => sql.replace('UNIQUE KEY', 'KEY')],
    ['document CHECK', 'documents', (sql) => sql.replace('or `incident_id` is not null', 'or `improvement_id` is not null')],
    ['enum string case', 'improvements', (sql) => sql.replace("'Pending'", "'pending'")],
    ['extra column', 'roles', (sql) => sql.replace('  PRIMARY KEY', '  `extra` int(11) DEFAULT NULL,\n  PRIMARY KEY')]
]) {
    test(`drift comparison detects ${label}`, () => {
        const { readBaseline, compareSchemas } = tooling();
        const expected = readBaseline();
        const actual = new Map(expected);
        actual.set(table, mutate(actual.get(table)));
        assert.deepEqual(compareSchemas(expected, actual).changedTables, [table]);
    });
}

test('drift comparison reports missing and unexpected tables separately', () => {
    const { readBaseline, compareSchemas } = tooling();
    const expected = readBaseline();
    const actual = new Map(expected);
    actual.delete('improvements');
    actual.set('unexpected', 'CREATE TABLE `unexpected` (`id` int NOT NULL)');
    assert.deepEqual(compareSchemas(expected, actual), { missingTables: ['improvements'], unexpectedTables: ['unexpected'], changedTables: [] });
});

test('schema verification reads metadata and SHOW CREATE only', async () => {
    const { readBaseline, checkSchema } = tooling();
    const baseline = readBaseline();
    const queries = [];
    const connection = {
        async query(sql, params) {
            queries.push(sql);
            if (/information_schema\.TABLES/i.test(sql)) {
                assert.deepEqual(params, ['koda_db']);
                return [[...baseline.keys()].map((TABLE_NAME) => ({ TABLE_NAME, TABLE_TYPE: 'BASE TABLE' }))];
            }
            const name = sql.match(/^SHOW CREATE TABLE `koda_db`\.`([^`]+)`$/)?.[1];
            assert.ok(name, `Unexpected query: ${sql}`);
            return [[{ Table: name, 'Create Table': baseline.get(name) }]];
        }
    };
    const report = await checkSchema(connection, 'koda_db');
    assert.equal(report.ok, true);
    assert.equal(report.expectedTableCount, 21);
    assert.equal(report.actualTableCount, 21);
    assert.ok(queries.every((sql) => /^\s*(SELECT|SHOW)\b/.test(sql)));
});

test('tool configuration has no database-name fallback and validates its port', () => {
    const { databaseConfig } = tooling();
    assert.throws(() => databaseConfig({}), /DB_NAME.*explicit/i);
    assert.throws(() => databaseConfig({ DB_NAME: 'koda_test', DB_PORT: 'not-a-port' }), /DB_PORT/);
    assert.equal(databaseConfig({ DB_NAME: 'koda_test', DB_PORT: '3307' }).port, 3307);
});

test('runtime database pool honors DB_PORT with the same default as the tools', () => {
    const source = fs.readFileSync(path.join(__dirname, '../config/db.js'), 'utf8');
    for (const [DB_PORT, expectedPort] of [['3307', 3307], [undefined, 3306]]) {
        let options;
        vm.runInNewContext(source, {
            __dirname: path.join(__dirname, '../config'),
            process: { env: { DB_NAME: 'koda_schema_test_explicit', DB_PORT } },
            module: { exports: {} },
            require(name) {
                if (name === 'mysql2/promise') return { createPool(config) { options = config; return {}; } };
                if (name === 'dotenv') return { config() {} };
                if (name === 'path') return path;
                throw new Error(`Unexpected dependency: ${name}`);
            }
        });
        assert.equal(options.port, expectedPort);
    }
});
