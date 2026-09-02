// Compatibility entry point: projects.application_id is required in the baseline.
console.log('alterDB.js now verifies the schema only. Use npm run db:check; project/application nullability is not changed.');
require('./scripts/check_schema').run();
