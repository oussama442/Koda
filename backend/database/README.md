# Database setup and verification

`schema.sql` is the schema-only baseline captured from the live `koda_db` MariaDB 10.4.32 database on 2026-09-02 and updated on 2026-09-04 to remove the unused `improvements` table. It contains 20 tables, 143 columns, 29 foreign keys, 20 primary keys, 4 unique constraints, and one document CHECK. No credentials or record data are included. Tables are ordered so every referenced table already exists; foreign-key checks stay enabled.

## Configuration

From `backend`, copy `.env.example` to `.env`. Set `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, and an explicit `DB_NAME`. The command-line tools load this file relative to `backend`, regardless of the current directory. Existing environment variables take precedence. No database name is supplied by default.

Use a database account permitted to read all relevant schema metadata. Initialization additionally needs CREATE privileges. Do not commit `.env` or credentials.

## Existing database: verify only

```sh
npm run db:check
```

This reads `information_schema.TABLES` and `SHOW CREATE TABLE`; it never reads application records or executes schema/data mutations. It compares every expected table definition, including columns and their order, types, nullability, defaults, keys, foreign keys and delete actions, CHECK constraints, engine, and character settings. Formatting, SQL keyword case, and the next table AUTO_INCREMENT counter are ignored; quoted identifiers and string values are preserved. Unexpected tables/views are also reported. A mismatch or connection error returns a nonzero exit code and makes no changes.

The comparison is designed for the captured MariaDB version. Another server version may format equivalent definitions differently; review reported differences before considering a migration.

The local database cleanup on 2026-09-04 removed the empty, unused `improvements` table after verifying it had no dependencies and saving its restorable definition. The active `improvement_requests` table and its records were retained. Existing copies with the old table will report it as unexpected: neither `db:check` nor `db:init` removes it automatically. Back up and review any such database before applying an explicit migration.

## New empty database: initialize

Choose a new name such as `koda_dev_new` explicitly in `DB_NAME`, then run:

```sh
npm run db:init
npm run db:check
```

Initialization first checks for existing tables, views, routines, triggers, and events. It refuses a nonempty database before any DDL. If the named database does not exist, it creates it; otherwise it uses the empty database. It then creates the baseline tables. It has no DROP, reset, force, data seed, or automatic migration option.

MariaDB DDL auto-commits. If one CREATE fails, execution stops immediately and already created tables remain. Inspect that explicitly named database and the error; rerunning will refuse the now-nonempty database. The tool never destroys partially created or pre-existing objects to retry.

## Relationships that must stay distinct

- The improvement API and attachment validation use `improvement_requests`. The unused legacy `improvements` table was removed from the baseline; the `/api/improvements` route is unchanged.
- `projects.application_id` and `notifications.user_id` are required. Notifications retain `reference_id` and `reference_type`.
- A document must have at least one non-null `project_id`, `task_id`, or `incident_id`. An `improvement_id` alone does not satisfy the database CHECK. Multiple parents are permitted by that CHECK.
- `documents.improvement_id`, `documents.user_id`, and `projects.chef_projet_id` have no SQL foreign key. The application must validate their logical relationships.

## Legacy commands and tests

`scripts/fix_notifications.js`, `scripts/add_sprint_checklist.js`, and `alterDB.js` are now read-only verification aliases. They do not drop notifications, create selected tables, or change project nullability. Use reviewed, explicit migration scripts for any future schema change; do not run historical setup snippets against an existing database.

```sh
npm test
```

The schema unit tests use in-memory connections and do not contact a database. Any integration test must opt into a uniquely named disposable database distinct from `koda_db`; never use production records for test writes.
