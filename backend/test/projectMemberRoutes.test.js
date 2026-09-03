const { test, before, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const express = require('express');
const jwt = require('jsonwebtoken');

// Exercise the real routes and authentication without opening the live database
// or sending notifications. Only the database and notification boundaries vary.
function loadRoutes(query, createNotification) {
    const replacements = new Map([
        [require.resolve('../config/db'), { query }],
        [require.resolve('../controllers/notificationController'), { createNotification }]
    ]);
    const paths = [...replacements.keys(), ...[
        '../middleware/authMiddleware',
        '../controllers/projectMemberController', '../routes/projectMemberRoutes',
        '../controllers/userController', '../routes/userRoutes',
        '../controllers/roleController', '../routes/roleRoutes'
    ].map(modulePath => require.resolve(modulePath))];
    const previous = new Map(paths.map(modulePath => [modulePath, require.cache[modulePath]]));
    for (const modulePath of paths) delete require.cache[modulePath];
    for (const [modulePath, exports] of replacements) {
        require.cache[modulePath] = { id: modulePath, filename: modulePath, loaded: true, exports };
    }
    try {
        return {
            members: require('../routes/projectMemberRoutes'),
            users: require('../routes/userRoutes'),
            roles: require('../routes/roleRoutes')
        };
    } finally {
        for (const [modulePath, cached] of previous) {
            if (cached) require.cache[modulePath] = cached;
            else delete require.cache[modulePath];
        }
    }
}

const chef = { id: 7, role: 'User' };
const admin = { id: 1, role: 'Admin' };
const options = {
    users: [{ id: 7, full_name: 'Project manager' }, { id: 9, full_name: 'Candidate user' }],
    roles: [{ id: 3, role_name: 'Developer' }]
};
const originalSecret = process.env.JWT_SECRET;
let state;
let server;
let baseUrl;

before(async () => {
    process.env.JWT_SECRET = `project-member-test-${randomUUID()}`;
    const routes = loadRoutes(async (sql, params = []) => {
        state.queries.push({ sql, params });
        if (state.failQueries) throw new Error('SQL boundary unavailable: private connection details');
        if (/\bFROM projects\b/i.test(sql)) {
            const projects = {
                12: { chef_projet_id: 7, name: 'Managed project' },
                13: { chef_projet_id: 8, name: 'Another project' },
                14: { chef_projet_id: null, name: 'Unassigned project' }
            };
            return [projects[params[0]] ? [projects[params[0]]] : []];
        }
        if (/\bFROM users\b/i.test(sql)) return [options.users];
        if (/\bFROM roles\b/i.test(sql)) return [options.roles];
        if (/^INSERT INTO project_members/i.test(sql)) {
            state.members.push({ project_id: params[0], user_id: params[1], role_id: params[2] });
            return [{ affectedRows: 1 }];
        }
        throw new Error(`Unexpected test query: ${sql}`);
    }, async (...args) => { state.notifications.push(args); });
    const app = express();
    app.use(express.json());
    app.use('/api/project-members', routes.members);
    app.use('/api/users', routes.users);
    app.use('/api/roles', routes.roles);
    server = await new Promise(resolve => {
        const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
    });
    baseUrl = `http://127.0.0.1:${server.address().port}`;
});

beforeEach(() => {
    state = { queries: [], members: [], notifications: [], failQueries: false };
});

after(async () => {
    if (server) {
        server.closeAllConnections();
        await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    }
    if (originalSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalSecret;
});

async function request(method, path, user = chef, body) {
    const headers = {};
    if (user) headers.Authorization = `Bearer ${typeof user === 'string' ? user : jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '1m' })}`;
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    const response = await fetch(`${baseUrl}${path}`, {
        method, headers, body: body === undefined ? undefined : JSON.stringify(body)
    });
    const text = await response.text();
    return { status: response.status, body: response.headers.get('content-type')?.includes('application/json') ? JSON.parse(text) : text };
}

test('the designated non-admin Chef can load member options and add a selected user', async () => {
    const lookup = await request('GET', '/api/project-members/12/options');
    assert.equal(lookup.status, 200);
    assert.deepEqual(lookup.body, options);
    const member = { project_id: 12, user_id: lookup.body.users[1].id, role_id: lookup.body.roles[0].id };
    const added = await request('POST', '/api/project-members', chef, member);
    assert.equal(added.status, 201);
    assert.deepEqual(state.members, [member]);
    assert.equal(state.notifications.length, 1);
    assert.equal(state.notifications[0][0], member.user_id);
});

test('an Admin can load member options for a project managed by another user', async () => {
    const result = await request('GET', '/api/project-members/13/options', admin);
    assert.equal(result.status, 200);
    assert.deepEqual(result.body, options);
});

test('an Admin can load options for a project with no assigned manager', async () => {
    assert.equal((await request('GET', '/api/project-members/14/options', admin)).status, 200);
});

for (const user of [{ id: 9, role: 'User' }, { id: 8, role: 'User' }, { id: 9, role: 'Chef de projet' }]) {
    test(`user ${user.id} with role ${user.role} cannot load another manager's options`, async () => {
        const result = await request('GET', '/api/project-members/12/options', user);
        assert.equal(result.status, 403);
        assert.equal(state.queries.length, 1, 'authorization must precede user/role lookups');
        assert.equal(state.members.length, 0);
    });
}

test('a non-admin cannot load options for an unassigned project', async () => {
    assert.equal((await request('GET', '/api/project-members/14/options')).status, 403);
    assert.equal(state.queries.length, 1);
});

test('missing or invalid authentication does not read the database', async () => {
    for (const token of [null, 'invalid-test-token']) {
        assert.equal((await request('GET', '/api/project-members/12/options', token)).status, 401);
    }
    assert.equal(state.queries.length, 0);
});

test('invalid project IDs fail before any SQL lookup', async () => {
    for (const projectId of ['0', '-1', '1.5', '1e2', '0x10', '2147483648', 'invalid']) {
        assert.equal((await request('GET', `/api/project-members/${projectId}/options`)).status, 400, projectId);
    }
    assert.equal(state.queries.length, 0);
});

test('a nonexistent project returns 404 before loading option lists', async () => {
    const result = await request('GET', '/api/project-members/999/options');
    assert.equal(result.status, 404);
    assert.deepEqual(result.body, { message: 'Project not found' });
    assert.equal(state.queries.length, 1);
});

test('a failed lookup returns a generic error without SQL connection details', async () => {
    state.failQueries = true;
    const result = await request('GET', '/api/project-members/12/options');
    assert.equal(result.status, 500);
    assert.deepEqual(result.body, { message: 'Unable to load member options' });
});

test('global user and role administration remains unavailable to a project manager', async () => {
    for (const [method, path] of [
        ['GET', '/api/users'], ['GET', '/api/users/9'],
        ['POST', '/api/users'], ['PUT', '/api/users/9'], ['DELETE', '/api/users/9'],
        ['GET', '/api/roles'], ['GET', '/api/roles/permissions'], ['GET', '/api/roles/3'],
        ['POST', '/api/roles'], ['PUT', '/api/roles/3'], ['DELETE', '/api/roles/3']
    ]) {
        assert.equal((await request(method, path, chef, method === 'GET' ? undefined : {})).status, 403, `${method} ${path}`);
    }
    assert.equal(state.queries.length, 0);
});

test('membership creation still rejects a manager of a different project', async () => {
    const result = await request('POST', '/api/project-members', chef, { project_id: 13, user_id: 9, role_id: 3 });
    assert.equal(result.status, 403);
    assert.equal(state.members.length, 0);
    assert.equal(state.notifications.length, 0);
});
