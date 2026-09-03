# Project Member Options Implementation Plan

> **For agentic workers:** Implement the backend and frontend tasks in parallel, then review the combined change before committing and pushing.

**Goal:** Let an assigned, non-admin Chef de projet choose users and roles when adding members to their project.

**Architecture:** Add a project-scoped, authenticated read endpoint that applies the same Admin/designated-manager rule as membership creation. The team page uses this endpoint after loading its project and checking management access. Global user and role administration retains its existing authorization.

**Tech Stack:** Express, mysql2/MariaDB, Angular, RxJS, Node test runner, Angular HttpTestingController/Vitest.

## Global Constraints

- Modify only the team-member selection flow and its verification.
- Keep the existing 21-table schema; use a disposable database for integration writes.
- Do not expose password hashes, email addresses, permission definitions, or admin flags in selector options.
- Keep the existing French UI and numeric membership IDs.
- Commit and push to the authorized `oussama442/Koda` remote after review and verification.

## Task 1: Project-scoped backend options

**Files:**
- Modify: `backend/controllers/projectMemberController.js`
- Modify: `backend/routes/projectMemberRoutes.js`
- Create: `backend/test/projectMemberRoutes.test.js`
- Modify: `backend/test/database.integration.test.js`

**Interface:**

```text
GET /api/project-members/:project_id/options
Authorization: Bearer <token>
200 { users: [{ id: number, full_name: string }], roles: [{ id: number, role_name: string }] }
400 invalid positive SQL INT project ID
401 missing/invalid authentication
403 authenticated caller is neither Admin nor designated project manager
404 project missing or soft deleted
500 option lookup failed
```

- [x] Write route tests using real Express/JWT middleware and a substituted SQL boundary: assigned Chef and Admin succeed; unrelated users and a role label without manager assignment do not; missing/invalid tokens fail; global user/role lists and mutations still reject the Chef.
- [x] Run `node --test test/projectMemberRoutes.test.js` from `backend`; the missing endpoint must produce failing success/access assertions.
- [x] Implement `getMemberOptions`, validate the project ID, and query the active project before reading options. Select only `id, full_name` from active users and `id, role_name` from roles, with deterministic name/ID ordering. Register `router.get('/:project_id/options', verifyToken, controller.getMemberOptions)`.
- [x] Extend the existing disposable MariaDB integration fixture to verify active-user filtering, exact response fields, designated-Chef membership creation with returned numeric IDs, denied access for another project's manager, and archived-project rejection. Stub outbound notification email for these synthetic users.
- [x] Run the focused route tests and the opt-in integration test; expect all assertions to pass without writing to `koda_db`.

## Task 2: Team-page options and regression coverage

**Files:**
- Modify: `frontend/src/app/services/project-member.service.ts`
- Modify: `frontend/src/app/projects/project-members/project-members.ts`
- Create: `frontend/src/app/projects/project-members/project-members.spec.ts`

**Interface:**

```typescript
getMemberOptions(projectId: number): Observable<{
  users: { id: number; full_name: string }[];
  roles: { id: number; role_name: string }[];
}>
```

- [x] Write HTTP/component tests for a designated non-admin Chef loading options, selecting a candidate/role, and posting numeric `project_id`, `user_id`, and `role_id`; also cover Admin, nonmanager, failed lookup, and route changes.
- [x] Run `npm test -- --watch=false --include=src/app/projects/project-members/project-members.spec.ts` from `frontend`; confirm the old admin-only requests cause the expected failures.
- [x] Replace UserService/RoleService dependencies in the team page with `getMemberOptions`. Fetch only after project authorization is known. Reset selections and options and cancel obsolete requests on navigation; show loading/failure feedback and disable submission until options are ready.
- [x] Run the focused frontend tests and confirm they pass.

## Task 3: Review, publish, and refresh

- [x] Run backend `npm test`, frontend `npm test -- --watch=false`, frontend `npm run build`, and `git diff --check`.
- [x] Obtain an independent review of the changed files and resolve actionable findings.
- [x] Restart the verified existing local backend process and check the API and local frontend responses.
Publication follows this reviewed snapshot: stage only the intended files, commit the fix, push `main`, and verify the remote commit matches local HEAD.

## Verification results

- Backend: 71 passing tests; the opt-in real MariaDB integration test passed separately.
- Frontend: 23 passing tests, including 7 team-page regressions; production build passed.
- Independent backend and frontend review: approved with no actionable findings.
- Local smoke checks: API and frontend login return 200; the new endpoint requires authentication (401 without a token).
