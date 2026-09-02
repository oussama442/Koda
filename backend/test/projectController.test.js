const test = require('node:test');
const assert = require('node:assert/strict');

// Replace the SQL boundary before loading the controller, so tests never load
// database credentials, create a connection pool, or contact a real database.
function loadController(query) {
    const dbPath = require.resolve('../config/db');
    const controllerPath = require.resolve('../controllers/projectController');
    const previousDb = require.cache[dbPath];
    const previousController = require.cache[controllerPath];
    require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: { query } };
    delete require.cache[controllerPath];
    try {
        return require(controllerPath);
    } finally {
        if (previousDb) require.cache[dbPath] = previousDb;
        else delete require.cache[dbPath];
        if (previousController) require.cache[controllerPath] = previousController;
        else delete require.cache[controllerPath];
    }
}

async function invoke(method, body, { role = 'Admin', queryError } = {}) {
    const queries = [];
    const controller = loadController(async (sql, params) => {
        queries.push({ sql, params });
        if (queryError) throw queryError;
        return [{ insertId: 42, affectedRows: 1 }];
    });
    const response = {
        statusCode: 200,
        status(code) { this.statusCode = code; return this; },
        json(value) { this.body = value; return this; }
    };
    await controller[method]({ body, user: { id: 7, role }, params: { id: '42' } }, response);
    return { response, queries };
}

function validBody(overrides = {}) {
    return {
        application_id: 12,
        name: 'Project test',
        description: 'Project scope',
        start_date: '2026-09-03',
        end_date: '2026-12-31',
        chef_projet_id: 7,
        ...overrides
    };
}

for (const method of ['create', 'update']) {
    test(`${method} rejects a missing or invalid application without writing SQL`, async () => {
        for (const application_id of [undefined, null, '', ' ', 0, -1, 1.5, 2147483648, 'invalid', '1e2', '0x10', true, [], {}]) {
            const { response, queries } = await invoke(method, validBody({ application_id }));
            assert.equal(response.statusCode, 400, `application_id=${JSON.stringify(application_id)}`);
            assert.match(response.body.message, /application/i);
            assert.equal(queries.length, 0);
        }
    });

    test(`${method} normalizes numeric IDs and empty optional values before writing`, async () => {
        const { response, queries } = await invoke(method, validBody({
            application_id: '12', start_date: '', end_date: ' ', chef_projet_id: ''
        }));
        assert.equal(response.statusCode, method === 'create' ? 201 : 200);
        assert.equal(queries.length, 1);
        assert.deepEqual(queries[0].params.slice(0, 6), [12, 'Project test', 'Project scope', null, null, null]);
        assert.match(queries[0].sql, method === 'create' ? /^INSERT INTO projects/ : /^UPDATE projects SET/);
        if (method === 'create') assert.equal(response.body.id, 42);
        else assert.equal(queries[0].params[6], '42');
    });

    test(`${method} accepts omitted or null optional dates and manager`, async () => {
        for (const empty of [undefined, null]) {
            const { response, queries } = await invoke(method, validBody({
                start_date: empty, end_date: empty, chef_projet_id: empty
            }));
            assert.equal(response.statusCode, method === 'create' ? 201 : 200);
            assert.deepEqual(queries[0].params.slice(3, 6), [null, null, null]);
        }
    });

    test(`${method} rejects invalid manager IDs without writing SQL`, async () => {
        for (const chef_projet_id of [0, -2, 1.2, 2147483648, 'null', '1e2', false, [], {}]) {
            const { response, queries } = await invoke(method, validBody({ chef_projet_id }));
            assert.equal(response.statusCode, 400, `chef_projet_id=${JSON.stringify(chef_projet_id)}`);
            assert.match(response.body.message, /manager|chef_projet_id/i);
            assert.equal(queries.length, 0);
        }
    });

    test(`${method} requires a nonblank name of at most 150 characters`, async () => {
        for (const name of [undefined, null, '', '   ', 42, [], 'x'.repeat(151)]) {
            const { response, queries } = await invoke(method, validBody({ name }));
            assert.equal(response.statusCode, 400, `name=${JSON.stringify(name)}`);
            assert.match(response.body.message, /name/i);
            assert.equal(queries.length, 0);
        }
    });

    test(`${method} trims the name and accepts the SQL character limit`, async () => {
        const name = '\u{1F4CB}'.repeat(150);
        const { response, queries } = await invoke(method, validBody({ name: ` ${name} ` }));
        assert.equal(response.statusCode, method === 'create' ? 201 : 200);
        assert.equal(queries[0].params[1], name);
    });

    test(`${method} rejects malformed or impossible SQL dates without writing`, async () => {
        for (const field of ['start_date', 'end_date']) {
            for (const invalid of ['2026-02-30', '2025-02-29', '2026-13-01', '0000-00-00', '0999-12-31', '03/09/2026', '2026-09-03T00:00:00.000Z', 20260903, true]) {
                const { response, queries } = await invoke(method, validBody({ [field]: invalid }));
                assert.equal(response.statusCode, 400, `${field}=${JSON.stringify(invalid)}`);
                assert.match(response.body.message, new RegExp(field));
                assert.equal(queries.length, 0);
            }
        }
    });

    test(`${method} preserves valid leap dates and accepts signed SQL INT boundaries`, async () => {
        const { response, queries } = await invoke(method, validBody({
            application_id: 2147483647, chef_projet_id: '2147483647',
            start_date: '2024-02-29', end_date: '9999-12-31'
        }));
        assert.equal(response.statusCode, method === 'create' ? 201 : 200);
        assert.deepEqual(queries[0].params.slice(3, 6), ['2024-02-29', '9999-12-31', 2147483647]);
    });

    test(`${method} reports a nonexistent application as a client error`, async () => {
        const queryError = Object.assign(new Error('Foreign key constraint fails'), { code: 'ER_NO_REFERENCED_ROW_2', errno: 1452 });
        const { response } = await invoke(method, validBody(), { queryError });
        assert.equal(response.statusCode, 400);
        assert.match(response.body.message, /application.*(exist|found|valid)/i);
    });

    test(`${method} preserves admin-only access before validating input`, async () => {
        const { response, queries } = await invoke(method, validBody({ application_id: null }), { role: 'User' });
        assert.equal(response.statusCode, 403);
        assert.equal(queries.length, 0);
    });

    test(`${method} keeps unexpected database failures as server errors`, async () => {
        const { response } = await invoke(method, validBody(), { queryError: new Error('Database unavailable') });
        assert.equal(response.statusCode, 500);
    });
}
