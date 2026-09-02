# Koda Project

Angular frontend and Express API backed by MariaDB.

## Run locally

1. Start MariaDB and configure `backend/.env` using `backend/.env.example`. Set a private random `JWT_SECRET` and your database credentials.
2. In `backend`, run `npm ci`, then `npm run db:check` to verify an existing database and `npm start` to start the API on port 5000.
3. In a second terminal, run `npm ci` and `npm start` in `frontend`. Open [localhost:4200](http://localhost:4200) and sign in with your existing account.

For a new, empty database, use `npm run db:init` in `backend` before starting the API. Initialization creates schema only; it does not import users or records. See [database setup](backend/database/README.md) for the verified 21-table baseline, constraints, and read-only drift checks.

## Verify changes

```sh
cd backend
npm test
cd ../frontend
npm test -- --watch=false
npm run build
```

The backend integration test is opt-in. Set `KODA_DB_INTEGRATION=1` and run `node --test test/database.integration.test.js` from `backend`, with DB connection settings available in the environment. It creates and removes only its own uniquely named temporary database; the configured application database is not modified. The test connection needs permission to create and drop that temporary database.

Improvement attachments require an explicitly selected project from the same application because the database requires a document to link to a project, task, or incident. The current improvement feature uses `improvement_requests`; the separate `improvements` table is retained in the schema.
