const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const express = require('express');

// Isolate SQL at the module boundary; controller, routing and file cleanup run unchanged.
let query;
const dbPath = require.resolve('../config/db');
require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: {
    query: (...args) => query(...args)
} };
const controller = require('../controllers/documentController');
const temporaryFiles = [];
afterEach(() => {
    for (const file of temporaryFiles.splice(0)) fs.rmSync(file, { force: true });
});

function response() {
    return { statusCode: 200, status(code) { this.statusCode = code; return this; },
        json(body) { this.body = body; return this; } };
}
function request(body) {
    const filePath = path.join(os.tmpdir(), `koda-doc-test-${process.pid}-${temporaryFiles.length}-${Date.now()}.txt`);
    fs.writeFileSync(filePath, 'test attachment');
    temporaryFiles.push(filePath);
    return { body, user: { id: 9 }, file: { path: filePath, filename: path.basename(filePath),
        originalname: 'notes.txt', mimetype: 'text/plain', size: 15 } };
}

for (const body of [{}, { improvement_id: '7' }, { project_id: 'null' },
    { project_id: '-1' }, { task_id: '1.5' }, { incident_id: '2147483648' },
    { project_id: ['1', '2'] }, { project_id: true }, { project_id: '1', improvement_id: 'oops' }]) {
    test(`invalid document parents are rejected and staged file removed: ${JSON.stringify(body)}`, async () => {
        let calls = 0;
        query = async () => { calls++; return [{ insertId: 11 }]; };
        const req = request(body);
        const res = response();
        await controller.uploadDocument(req, res);
        assert.equal(res.statusCode, 400);
        assert.equal(calls, 0, 'invalid input must not reach SQL');
        assert.equal(fs.existsSync(req.file.path), false);
    });
}

test('improvement attachments retain both the selected project and request link', async () => {
    let inserted;
    query = async (sql, values) => {
        if (/INSERT INTO documents/.test(sql)) { inserted = values; return [{ insertId: 11 }]; }
        return [[{ application_id: 3 }]];
    };
    const req = request({ project_id: '2', improvement_id: '7' });
    const res = response();
    await controller.uploadDocument(req, res);
    assert.equal(res.statusCode, 201);
    assert.deepEqual(inserted.slice(0, 5), [2, null, null, 7, 9]);
    assert.equal(fs.existsSync(req.file.path), true);
});

for (const parent of ['project_id', 'task_id', 'incident_id']) {
    test(`improvement cannot attach to a ${parent} from another application`, async () => {
        let inserted = false;
        query = async sql => {
            if (/INSERT/.test(sql)) { inserted = true; return [{ insertId: 11 }]; }
            return [[{ application_id: /FROM improvement_requests/.test(sql) ? 3 : 4 }]];
        };
        const req = request({ [parent]: '2', improvement_id: '7' });
        const res = response();
        await controller.uploadDocument(req, res);
        assert.equal(res.statusCode, 400);
        assert.equal(inserted, false);
        assert.equal(fs.existsSync(req.file.path), false);
    });
}

test('a missing or deleted improvement request is rejected', async () => {
    query = async () => [[]];
    const req = request({ project_id: '2', improvement_id: '7' });
    const res = response();
    await controller.uploadDocument(req, res);
    assert.equal(res.statusCode, 400);
    assert.equal(fs.existsSync(req.file.path), false);
});

test('missing foreign-key parent returns 400 and cleans up the uploaded file', async () => {
    query = async () => { throw Object.assign(new Error('missing parent'), { code: 'ER_NO_REFERENCED_ROW_2' }); };
    const req = request({ project_id: '2' });
    const res = response();
    await controller.uploadDocument(req, res);
    assert.equal(res.statusCode, 400);
    assert.equal(fs.existsSync(req.file.path), false);
});

test('database failure does not leave an orphan file', async (t) => {
    t.mock.method(console, 'error', () => {});
    query = async () => { throw new Error('database unavailable'); };
    const req = request({ project_id: '2' });
    const res = response();
    await controller.uploadDocument(req, res);
    assert.equal(res.statusCode, 500);
    assert.equal(fs.existsSync(req.file.path), false);
});

test('long Office MIME types fit the existing file_format column using the extension', async () => {
    let inserted;
    query = async (sql, values) => { inserted = values; return [{ insertId: 11 }]; };
    const req = request({ project_id: '2' });
    req.file.originalname = 'report.docx';
    req.file.mimetype = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    const res = response();
    await controller.uploadDocument(req, res);
    assert.equal(res.statusCode, 201);
    assert.equal(inserted[7], 'docx');
});

test('task document listing uses the task parent', async () => {
    let actual;
    query = async (sql, params) => { actual = { sql, params }; return [[{ id: 11 }]]; };
    const res = response();
    await controller.getDocumentsByType({ params: { type: 'tasks', id: '2' } }, res);
    assert.equal(res.statusCode, 200);
    assert.match(actual.sql, /d\.task_id = \?/);
    assert.deepEqual(res.body, [{ id: 11 }]);
});

test('legacy /project/:id route remains reachable', async () => {
    const authPath = require.resolve('../middleware/authMiddleware');
    require.cache[authPath] = { id: authPath, filename: authPath, loaded: true,
        exports: { verifyToken: (req, res, next) => next() } };
    query = async () => [[{ id: 11 }]];
    const app = express();
    app.use('/api/documents', require('../routes/documentRoutes'));
    const server = app.listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    try {
        const result = await fetch(`http://127.0.0.1:${server.address().port}/api/documents/project/2`);
        assert.equal(result.status, 200);
        assert.deepEqual(await result.json(), [{ id: 11 }]);
    } finally {
        await new Promise(resolve => server.close(resolve));
    }
});
