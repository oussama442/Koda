# Live Schema Alignment Implementation Plan

> **For agentic workers:** Execute the independent tasks below with delegated workers and review the integrated changes before pushing.

**Goal:** Make the application's database writes and setup scripts agree with the verified 21-table `koda_db` schema.

**Architecture:** Keep the live schema as the source of truth. Validate project and document input before SQL writes, provide the required project context for improvement attachments, and check in a schema-only baseline with safe setup and read-only verification commands.

**Tech Stack:** Express 5, mysql2, MariaDB 10.4, Angular 21, Node test runner and Vitest.

## Global constraints

- Do not change the live database or its records.
- Keep `improvements` and `improvement_requests` separate; the current improvement feature uses `improvement_requests`.
- Preserve the documents CHECK requiring a project, task, or incident.
- Add no credentials, uploaded files, or record exports to Git.
- Push the tested changes to the existing `oussama442/Koda` remote.

## Task 1: Project writes

Files: `backend/controllers/projectController.js`, `backend/test/projectController.test.js`, `frontend/src/app/projects/project-form/project-form.ts`, and its component spec.

- [ ] Add failing controller tests for missing/invalid application IDs and empty optional dates; assert an invalid request returns 400 without an INSERT/UPDATE.
- [ ] Normalize optional manager/date values to SQL NULL; require a positive application ID for create and update; map foreign-key failures to a clear 400 response.
- [ ] Add a required application selector using numeric/null Angular values. Keep optional manager values compatible with SQL NULL.
- [ ] Run `node --test test/projectController.test.js` and the focused frontend spec.

Representative behavior:

```js
assert.equal(response.statusCode, 400); // application_id: null
assert.equal(writes.length, 0);
assert.deepEqual(insertParams.slice(3, 6), [null, null, null]); // optional dates and manager
```

## Task 2: Document writes and retrieval

Files: `backend/controllers/documentController.js`, `backend/routes/documentRoutes.js`, `backend/test/documentController.test.js`, `frontend/src/app/components/shared-documents.ts`, and its component spec.

- [ ] Add failing tests for missing parent, improvement-only upload, invalid parent IDs, successful improvement + project upload, rejected-file cleanup, task retrieval, and the legacy project route.
- [ ] Parse parent IDs as positive SQL INTs; require at least one of project/task/incident. Verify improvement IDs refer to active `improvement_requests` and their chosen project/task/incident belongs to the same application. Reject invalid requests with 400 and remove any staged upload on failure.
- [ ] Expose a project selector for improvement attachments, restricted to projects of that improvement's application. Disable upload until selected; display upload/load failures. Forward task IDs on task pages.
- [ ] Register the legacy project route before the generic route; use a consistent absolute uploads directory.
- [ ] Run the document controller tests and focused frontend spec.

Representative behavior:

```js
assert.equal(response.statusCode, 400); // improvement_id alone
assert.equal(fs.existsSync(stagedFile), false);
assert.equal(response.statusCode, 201); // improvement_id + matching project_id
```

## Task 3: Schema baseline and tooling

Files: `backend/database/schema.sql`, `backend/scripts/init_db.js`, `backend/scripts/check_schema.js`, `backend/scripts/fix_notifications.js`, `backend/alterDB.js`, `backend/test/schema.test.js`, `backend/package.json`, `backend/.env.example`, and database setup documentation.

- [ ] Copy the verified schema-only DDL, ordered so referenced tables are created first. Preserve all 21 tables, 150 columns, 29 foreign keys, and the document CHECK.
- [ ] Add tests proving initialization refuses a nonempty schema before executing DDL and that drift comparison notices column/constraint differences.
- [ ] Replace the old DROP-based initializer with initialization of an explicitly named empty database; replace legacy drift/destructive scripts with read-only verification and guidance.
- [ ] Provide `npm test`, `npm run db:init`, and `npm run db:check`. Document DB configuration and the distinction between the two improvement tables.
- [ ] Run schema unit tests and read-only verification against local `koda_db`. Check initialization and representative inserts only in a disposable database with an explicitly distinct name.

## Task 4: Integration and delivery

- [ ] Run backend tests and the frontend build/test suite; resolve any failures caused by the changes.
- [ ] Independently review the diff for schema fidelity, unintended database writes, regressions, and secret/data leakage.
- [ ] Commit the scoped files, push to `origin/main`, and verify the remote commit SHA matches local HEAD.
