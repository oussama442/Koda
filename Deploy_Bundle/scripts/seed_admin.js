const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function seed() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    console.log('Seeding roles and admin user...');

    // 1. Seed Roles
    const roles = ['Admin', 'Project Manager', 'Developer', 'Tester'];
    for (const role of roles) {
        await connection.query('INSERT IGNORE INTO roles (role_name) VALUES (?)', [role]);
    }

    // 2. Hash Password
    const hashedPassword = await bcrypt.hash('12345', 10);

    // 3. Seed Admin User
    const [existing] = await connection.query('SELECT * FROM users WHERE username = ?', ['admin']);
    
    if (existing.length === 0) {
        await connection.query(
            'INSERT INTO users (full_name, username, email, password, is_global_admin) VALUES (?, ?, ?, ?, ?)',
            ['System Admin', 'admin', 'admin@koda.com', hashedPassword, true]
        );
        console.log('Admin user created successfully!');
    } else {
        console.log('Admin user already exists.');
    }

    await connection.end();
    console.log('Seeding complete!');
}

seed().catch(err => {
    console.error('Seeding failed:');
    console.error(err);
});
