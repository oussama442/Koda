const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function reset() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'koda_db'
    });
    
    const hashedPassword = await bcrypt.hash('12345', 10);
    await connection.query('UPDATE users SET password = ? WHERE username = ?', [hashedPassword, 'admin']);
    console.log('Password successfully reset to 12345');
    
    await connection.end();
}

reset().catch(console.error);
