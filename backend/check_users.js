const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function check() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'koda_db'
    });
    
    const [users] = await connection.query('SELECT id, username, email FROM users');
    console.log('USERS IN DB:');
    console.table(users);
    
    await connection.end();
}

check().catch(console.error);
