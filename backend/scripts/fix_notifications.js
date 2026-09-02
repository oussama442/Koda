// Compatibility entry point: the old table replacement would destroy notifications.
console.log('fix_notifications.js now verifies the schema only. Use npm run db:check; review database/README.md for planned schema changes.');
require('./check_schema').run();
