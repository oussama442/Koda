const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

// Opt-in only: all writes target a newly created, uniquely named disposable database.
test('real MariaDB schema initialization and project/document/member flows', {
    skip: process.env.KODA_DB_INTEGRATION !== '1'
}, async () => {
    const mysql = require('mysql2/promise');
    const { initializeDatabase, checkSchema, databaseConfig } = require('../database/schema');
    const { database: configuredDatabase, ...config } = databaseConfig(process.env);
    const testDatabase = `koda_schema_test_${randomUUID().replaceAll('-', '')}`;
    assert.match(testDatabase, /^koda_schema_test_[a-f0-9]{32}$/);
    assert.notEqual(testDatabase, configuredDatabase);
    const connection = await mysql.createConnection(config);
    let created = false;
    const files = [];
    const res = () => ({ statusCode: 200, status(code) { this.statusCode = code; return this; },
        json(body) { this.body = body; return this; } });
    const upload = body => {
        const filePath = path.join(os.tmpdir(), `koda-integration-${randomUUID()}.txt`);
        fs.writeFileSync(filePath, 'synthetic attachment');
        files.push(filePath);
        return { body, user: { id: 1 }, file: { path: filePath, filename: path.basename(filePath),
            originalname: 'fixture.txt', mimetype: 'text/plain', size: 20 } };
    };
    try {
        // No IF NOT EXISTS: never take ownership of a pre-existing database.
        await connection.query(`CREATE DATABASE \`${testDatabase}\``);
        created = true;
        const initialized = await initializeDatabase(connection, testDatabase);
        assert.equal(initialized.tableCount, 21);
        assert.equal((await checkSchema(connection, testDatabase)).ok, true);
        await assert.rejects(initializeDatabase(connection, testDatabase), /empty|exist|refus/i);
        const [[identity]] = await connection.query('SELECT DATABASE() AS name');
        assert.equal(identity.name, testDatabase);

        await connection.query("INSERT INTO applications (id, name, current_status) VALUES (1, 'Fixture app', 'Active'), (2, 'Other app', 'Active')");
        await connection.query("INSERT INTO users (id, full_name, username, email, password) VALUES (1, 'Fixture user', 'fixture', 'fixture@example.invalid', 'not-a-login-hash')");
        await connection.query("INSERT INTO improvement_requests (id, application_id, user_id, title) VALUES (1, 1, 1, 'Fixture request')");

        const dbPath = require.resolve('../config/db');
        require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: connection };
        const projects = require('../controllers/projectController');
        const documents = require('../controllers/documentController');
        const projectBody = { application_id: '1', name: 'Fixture project', start_date: '', end_date: '', chef_projet_id: null };
        let result = res();
        await projects.create({ user: { role: 'Admin' }, body: projectBody }, result);
        assert.equal(result.statusCode, 201);
        const projectId = result.body.id;
        const [[project]] = await connection.query('SELECT application_id, start_date, end_date, chef_projet_id FROM projects WHERE id = ?', [projectId]);
        assert.deepEqual(project, { application_id: 1, start_date: null, end_date: null, chef_projet_id: null });
        result = res();
        await projects.update({ user: { role: 'Admin' }, params: { id: projectId }, body: { ...projectBody, start_date: '2026-09-03' } }, result);
        assert.equal(result.statusCode, 200);
        result = res();
        await projects.create({ user: { role: 'Admin' }, body: { ...projectBody, application_id: '999' } }, result);
        assert.equal(result.statusCode, 400, 'real foreign-key error is mapped to a validation response');

        let req = upload({ project_id: String(projectId), improvement_id: '1' });
        result = res();
        await documents.uploadDocument(req, result);
        assert.equal(result.statusCode, 201);
        const [[document]] = await connection.query('SELECT project_id, improvement_id FROM documents WHERE id = ?', [result.body.id]);
        assert.deepEqual(document, { project_id: projectId, improvement_id: 1 });

        req = upload({ improvement_id: '1' });
        result = res();
        await documents.uploadDocument(req, result);
        assert.equal(result.statusCode, 400);
        assert.equal(fs.existsSync(req.file.path), false);
        // Independently prove the baseline preserves the live CHECK.
        await assert.rejects(connection.query("INSERT INTO documents (file_name, storage_path, improvement_id) VALUES ('fixture.txt', 'fixture.txt', 1)"), error => error.errno === 4025);

        req = upload({ project_id: '999' });
        result = res();
        await documents.uploadDocument(req, result);
        assert.equal(result.statusCode, 400);
        assert.equal(fs.existsSync(req.file.path), false);

        await connection.query("INSERT INTO projects (id, application_id, name) VALUES (99, 2, 'Other project')");
        req = upload({ project_id: '99', improvement_id: '1' });
        result = res();
        await documents.uploadDocument(req, result);
        assert.equal(result.statusCode, 400);
        assert.equal(fs.existsSync(req.file.path), false);

        await connection.query("INSERT INTO tasks (id, project_id, title) VALUES (1, ?, 'Fixture task')", [projectId]);
        req = upload({ task_id: '1', improvement_id: '1' });
        result = res();
        await documents.uploadDocument(req, result);
        assert.equal(result.statusCode, 201);
        result = res();
        await documents.getDocumentsByType({ params: { type: 'tasks', id: 1 } }, result);
        assert.equal(result.body.length, 1);

        // Real selector queries must exclude deleted users and return only the
        // fields needed by the team page. Synthetic member additions never email.
        await connection.query("INSERT INTO users (id, full_name, username, email, password, deleted_at) VALUES (2, 'Candidate user', 'candidate', 'candidate@example.invalid', 'not-a-login-hash', NULL), (3, 'Deleted user', 'deleted', 'deleted@example.invalid', 'not-a-login-hash', NOW())");
        await connection.query("INSERT INTO roles (id, role_name) VALUES (1, 'Developer')");
        await connection.query('UPDATE projects SET chef_projet_id = 1 WHERE id = ?', [projectId]);
        await connection.query('UPDATE projects SET chef_projet_id = 2 WHERE id = 99');
        const notifications = [];
        const notificationPath = require.resolve('../controllers/notificationController');
        require.cache[notificationPath] = {
            id: notificationPath, filename: notificationPath, loaded: true,
            exports: { createNotification: async (...args) => { notifications.push(args); } }
        };
        const projectMembers = require('../controllers/projectMemberController');
        assert.equal(typeof projectMembers.getMemberOptions, 'function');
        const manager = { id: 1, role: 'User' };
        result = res();
        await projectMembers.getMemberOptions({ params: { project_id: String(projectId) }, user: manager }, result);
        assert.equal(result.statusCode, 200);
        assert.deepEqual(result.body, {
            users: [{ id: 2, full_name: 'Candidate user' }, { id: 1, full_name: 'Fixture user' }],
            roles: [{ id: 1, role_name: 'Developer' }]
        });
        const selectedMember = {
            project_id: projectId, user_id: result.body.users[0].id, role_id: result.body.roles[0].id
        };
        result = res();
        await projectMembers.addMember({ body: selectedMember, user: manager }, result);
        assert.equal(result.statusCode, 201);
        const [members] = await connection.query('SELECT project_id, user_id, role_id FROM project_members WHERE project_id = ?', [projectId]);
        assert.deepEqual(members, [selectedMember]);
        assert.equal(notifications.length, 1);
        assert.equal(notifications[0][0], selectedMember.user_id);

        result = res();
        await projectMembers.getMemberOptions({ params: { project_id: '99' }, user: manager }, result);
        assert.equal(result.statusCode, 403);

        await connection.query('UPDATE projects SET deleted_at = NOW() WHERE id = ?', [projectId]);
        for (const user of [manager, { id: 1, role: 'Admin' }]) {
            result = res();
            await projectMembers.getMemberOptions({ params: { project_id: String(projectId) }, user }, result);
            assert.equal(result.statusCode, 404, 'archived projects must not expose member options');
        }
    } finally {
        try {
            for (const file of files) fs.rmSync(file, { force: true });
        } finally {
            try {
                if (created) await connection.query(`DROP DATABASE \`${testDatabase}\``);
            } finally {
                await connection.end();
            }
        }
    }
});
