const mysql = require('mysql2/promise');
const path = require('node:path');
const { databaseConfig, initializeDatabase } = require('../database/schema');

async function main() {
    require('dotenv').config({ path: path.join(__dirname, '../.env'), quiet: true });
    const { database, ...serverConfig } = databaseConfig();
    const connection = await mysql.createConnection(serverConfig);
    try {
        const result = await initializeDatabase(connection, database);
        console.log(`Initialized ${result.tableCount} tables in ${result.database}. No existing tables or records were replaced.`);
    } finally {
        await connection.end();
    }
}

if (require.main === module) {
    main().catch((error) => {
        console.error(`Initialization stopped: ${error.message}`);
        console.error('No automatic cleanup is performed. If DDL started, inspect the named database before proceeding; see database/README.md.');
        process.exitCode = 1;
    });
}

module.exports = { main, initializeDatabase };
