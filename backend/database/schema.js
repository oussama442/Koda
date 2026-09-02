const fs = require('node:fs');
const path = require('node:path');

const BASELINE_PATH = path.join(__dirname, 'schema.sql');
const SQL_TOKENS = /'(?:''|\\[\s\S]|[^'\\])*'|"(?:""|\\[\s\S]|[^"\\])*"|`(?:``|[^`])*`|--[^\r\n]*|\/\*[\s\S]*?\*\/|\s+|[a-zA-Z_][a-zA-Z_0-9$]*|\d+(?:\.\d+)?|[^\s]/g;

function tokens(sql) {
    return (sql.match(SQL_TOKENS) || []).filter((token) => !token.startsWith('--') && !token.startsWith('/*'));
}

function readBaseline(filePath = BASELINE_PATH) {
    const tables = new Map();
    let statement = '';
    const add = () => {
        const sql = statement.trim();
        statement = '';
        if (!sql) return;
        const name = sql.match(/^CREATE\s+TABLE\s+`([^`]+)`\s*\(/i)?.[1];
        if (!name || tables.has(name)) throw new Error('The schema baseline must contain unique CREATE TABLE statements only.');
        tables.set(name, sql);
    };
    for (const token of tokens(fs.readFileSync(filePath, 'utf8'))) {
        if (token === ';') add();
        else statement += token;
    }
    add();
    if (!tables.size) throw new Error('The schema baseline is empty.');
    return tables;
}

function canonicalDDL(sql) {
    const parts = tokens(sql).filter((token) => !/^\s+$/.test(token) && token !== ';');
    const normalized = [];
    let depth = 0;
    for (let i = 0; i < parts.length; i++) {
        const token = parts[i];
        // The next generated row ID is data state, not schema. Keep column AUTO_INCREMENT.
        if (depth === 0 && /^auto_increment$/i.test(token) && parts[i + 1] === '=' && /^\d+$/.test(parts[i + 2] || '')) {
            i += 2;
            continue;
        }
        if (token === '(') depth++;
        if (token === ')') depth--;
        normalized.push(/^[`'"]/.test(token) ? token : token.toLowerCase());
    }
    return normalized.join(' ');
}

function compareSchemas(expected, actual) {
    return {
        missingTables: [...expected.keys()].filter((name) => !actual.has(name)).sort(),
        unexpectedTables: [...actual.keys()].filter((name) => !expected.has(name)).sort(),
        changedTables: [...expected.keys()].filter((name) => actual.has(name) && canonicalDDL(expected.get(name)) !== canonicalDDL(actual.get(name))).sort()
    };
}

function validateDatabaseName(database) {
    if (typeof database !== 'string' || !database.trim()) throw new Error('DB_NAME must be explicitly configured.');
    if (!/^[a-zA-Z_][a-zA-Z_0-9]{0,63}$/.test(database)) throw new Error('Invalid database name: use 1-64 letters, digits, or underscores, starting with a letter or underscore.');
    return database;
}

function quoteIdentifier(name) {
    return '`' + name.replace(/`/g, '``') + '`';
}

function databaseConfig(env = process.env) {
    const database = validateDatabaseName(env.DB_NAME);
    const port = Number(env.DB_PORT || 3306);
    if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('DB_PORT must be an integer between 1 and 65535.');
    return {
        host: env.DB_HOST || '127.0.0.1',
        port,
        user: env.DB_USER || 'root',
        password: env.DB_PASSWORD || '',
        database,
        connectTimeout: 10000,
        multipleStatements: false
    };
}

async function initializeDatabase(connection, database) {
    validateDatabaseName(database);
    const baseline = readBaseline();
    const [objects] = await connection.query(`SELECT
        (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = ?) +
        (SELECT COUNT(*) FROM information_schema.ROUTINES WHERE ROUTINE_SCHEMA = ?) +
        (SELECT COUNT(*) FROM information_schema.TRIGGERS WHERE TRIGGER_SCHEMA = ?) +
        (SELECT COUNT(*) FROM information_schema.EVENTS WHERE EVENT_SCHEMA = ?) AS object_count`,
    [database, database, database, database]);
    if (Number(objects[0]?.object_count) !== 0) {
        throw new Error(`Database ${database} is not empty; initialization refused. Use db:check for an existing database.`);
    }
    const [schemas] = await connection.query('SELECT SCHEMA_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = ?', [database]);
    if (!schemas.length) {
        await connection.query(`CREATE DATABASE ${quoteIdentifier(database)} CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci`);
    }
    await connection.query(`USE ${quoteIdentifier(database)}`);
    // DDL auto-commits in MariaDB. Stop on the first failure; never drop or retry tables.
    for (const statement of baseline.values()) await connection.query(statement);
    return { database, tableCount: baseline.size };
}

async function checkSchema(connection, database) {
    validateDatabaseName(database);
    const expected = readBaseline();
    const [rows] = await connection.query('SELECT TABLE_NAME, TABLE_TYPE FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? ORDER BY TABLE_NAME', [database]);
    const actual = new Map();
    for (const row of rows) {
        if (row.TABLE_TYPE !== 'BASE TABLE') {
            actual.set(row.TABLE_NAME, `Unexpected object type: ${row.TABLE_TYPE}`);
            continue;
        }
        const [definition] = await connection.query(`SHOW CREATE TABLE ${quoteIdentifier(database)}.${quoteIdentifier(row.TABLE_NAME)}`);
        if (typeof definition[0]?.['Create Table'] !== 'string') throw new Error(`Cannot read the table definition for ${row.TABLE_NAME}.`);
        actual.set(row.TABLE_NAME, definition[0]['Create Table']);
    }
    const drift = compareSchemas(expected, actual);
    return {
        ok: Object.values(drift).every((names) => names.length === 0),
        database,
        expectedTableCount: expected.size,
        actualTableCount: actual.size,
        ...drift
    };
}

module.exports = { readBaseline, canonicalDDL, compareSchemas, databaseConfig, initializeDatabase, checkSchema };
