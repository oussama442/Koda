const mysql = require('mysql2/promise');
const path = require('node:path');
const { databaseConfig, checkSchema } = require('../database/schema');

async function main() {
    require('dotenv').config({ path: path.join(__dirname, '../.env'), quiet: true });
    const config = databaseConfig();
    const connection = await mysql.createConnection(config);
    try {
        const report = await checkSchema(connection, config.database);
        if (report.ok) console.log(`Schema matches: ${report.database}, ${report.actualTableCount} tables. Read-only verification complete.`);
        else {
            console.error(`Schema drift detected in ${report.database}. No changes made.`);
            for (const [label, names] of [['Missing tables', report.missingTables], ['Unexpected tables/views', report.unexpectedTables], ['Changed definitions', report.changedTables]]) {
                if (names.length) console.error(`${label}: ${names.join(', ')}`);
            }
            process.exitCode = 1;
        }
        return report;
    } finally {
        await connection.end();
    }
}

function run() {
    return main().catch((error) => {
        console.error(`Schema verification failed: ${error.message}`);
        process.exitCode = 1;
    });
}

if (require.main === module) run();
module.exports = { main, run, checkSchema };
