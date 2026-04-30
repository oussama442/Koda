const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
    try {
        const db = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        await db.query('ALTER TABLE projects MODIFY application_id INT NULL');
        
        console.log('projects table modified successfully!');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
run();
