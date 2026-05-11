const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function initDB() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        connectTimeout: 10000
    });

    console.log('Attempting to connect to 127.0.0.1...');

    // Create database if it doesn't exist
    await connection.query(`DROP DATABASE IF EXISTS ${process.env.DB_NAME || 'koda_db'}`);
    await connection.query(`CREATE DATABASE ${process.env.DB_NAME || 'koda_db'}`);
    console.log(`Database ${process.env.DB_NAME || 'koda_db'} recreated.`);

    await connection.query(`USE ${process.env.DB_NAME || 'koda_db'}`);

    // Read SQL file
    const sqlPath = path.join(__dirname, '../../the_idea/database.txt');
    let sql = fs.readFileSync(sqlPath, 'utf8');

    // Remove multi-line comments
    sql = sql.replace(/\/\*[\s\S]*?\*\//g, '');
    
    // Remove single-line comments
    sql = sql.split('\n').map(line => line.replace(/--.*$/, '')).join('\n');

    // Split by semicolon
    const statements = sql
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0);

    console.log(`Executing ${statements.length} SQL statements...`);

    for (const statement of statements) {
        try {
            await connection.query(statement);
        } catch (error) {
            console.error(`Error executing statement: ${statement.substring(0, 50)}...`);
            console.error(error.message);
        }
    }

    console.log('Database initialization complete!');
    await connection.end();
}

initDB().catch(err => {
    console.error('Failed to initialize database:');
    console.error(err);
    process.exit(1);
});
