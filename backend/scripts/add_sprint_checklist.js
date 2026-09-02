// Compatibility entry point: both sprint tables are part of the checked-in baseline.
console.log('add_sprint_checklist.js now verifies the schema only. Use npm run db:init for a new empty database or db:check for an existing one.');
require('./check_schema').run();
