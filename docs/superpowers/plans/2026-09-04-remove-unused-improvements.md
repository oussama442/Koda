# Remove unused improvements table Implementation Plan

> **For agentic workers:** Execute the bounded schema cleanup sequentially, with independent review of the repository changes.

**Goal:** Remove the unused local `koda_db.improvements` table and keep the schema baseline, tests and current Mermaid diagram consistent.

**Architecture:** The active improvement API and document validation use `improvement_requests`. Removing the separate empty table needs no API or UI change. Schema initialization and read-only verification consume `backend/database/schema.sql` dynamically.

**Tech Stack:** MariaDB 10.4.32, Node.js, node:test, Mermaid.

## Global Constraints

- Target only local `koda_db.improvements`; keep `improvement_requests` and all other application data.
- Before DROP, verify zero rows and no FK, view, routine, trigger or event dependency; save and verify a restorable schema backup outside Git.
- If the table is populated or a dependency is found, stop before DROP and resolve that concrete condition.
- Preserve the historical September 3 plan and the previous dated diagram pack.
- Expected result: 20 tables, 143 columns, 29 foreign keys, 20 primary keys, 4 unique constraints, 1 CHECK.

## Task 1: Update the baseline contract

- [x] Change expected table/PK counts from 21 to 20 and column count from 150 to 143 in `backend/test/schema.test.js`; require `improvement_requests` and absence of `improvements`.
- [x] Change the missing-table comparison example to `improvement_requests`; keep enum-case comparison coverage using an independent `fixture` CREATE TABLE with enum('Pending','Done'). Change the disposable integration-test expected table count to 20.
- [x] Run `node --test test/schema.test.js` from backend and verify the existing 21-table baseline fails the new count assertions.
- [x] Remove exactly `CREATE TABLE improvements` from `backend/database/schema.sql`, updating its date/count header. Update current README files and the obsolete document-controller comment.
- [x] Run backend tests and independently review the patch for unintended changes.

## Task 2: Back up and remove the empty local table

- [x] Read the live definition and row count, inspect all database dependencies, and write the CREATE TABLE statement into a new timestamped folder under workspace `_koda_backups`.
- [x] Verify the saved statement matches SHOW CREATE TABLE and contains no DROP or application records; recheck empty table and unchanged definition immediately before executing `DROP TABLE koda_db.improvements` with foreign-key checks enabled.
- [x] Run `node scripts/check_schema.js`; verify the active improvement list still responds and all four existing request records remain.

## Task 3: Update the current diagram

- [x] Preserve the previous Mermaid source in the backup directory. Generate current Mermaid without the unused Improvement class and its note, retaining all 143 attributes and 32 relationships.
- [x] Render the Mermaid file and compare its classes/attributes against the remaining live schema. Identify the older PDF/PlantUML pack as the historical pre-removal snapshot.

## Completion evidence

- The local unused table contained zero rows and had no foreign-key, view, routine, trigger or event dependency.
- A verified restore SQL and before/after manifest were saved outside Git under workspace `_koda_backups/2026-09-04T03-58-51-824Z-remove-improvements/`.
- Only `koda_db.improvements` was dropped. Definitions and row counts of all remaining tables were unchanged; all four improvement request records matched their pre-removal digest.
- `node scripts/check_schema.js` reports the live database matches all 20 baseline tables.
- Updated schema tests first failed on the former 21-table baseline. All 71 regular backend tests then passed; the opt-in real MariaDB integration test also passed in its own disposable database.
- The improvement list controller returned 200 and four requests against the local database.
- Mermaid rendered successfully; all 20 classes and 143 attributes matched live column names, simplified types and nullability. The diagram retains 29 SQL FK associations and 3 logical references.
- Independent read-only review found no blocking issue. No runtime feature or authentication behavior changed.
