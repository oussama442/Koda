# Koda persistence class diagram

[`koda-class-diagram.mmd`](koda-class-diagram.mmd) models the current schema: 20 classes, 143 attributes, 29 SQL foreign-key associations and 3 logical references used by the code.

The unused `improvements` table was removed on 2026-09-04. `ImprovementRequest` still represents the active `improvement_requests` table.

- Attribute `[0..1]` means nullable; types are simplified.
- Solid lines represent declared SQL foreign keys. Dashed lines identify code references without a SQL foreign-key constraint.
- Each class maps to the table named in its preceding Mermaid comment. No methods, inheritance or ownership composition are inferred.
- A document requires at least one project, task or incident parent; multiple parents are allowed by the CHECK constraint.

Copy the source into draw.io's Mermaid editor. Verify a local database against the same schema with `npm run db:check` from `backend`.
