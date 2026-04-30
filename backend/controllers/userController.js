const mysql = require('mysql2/promise');
require('dotenv').config();

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

exports.getUsers = async (req, res) => {
    try {
        const [users] = await db.query('SELECT id, full_name, username, email, is_global_admin, created_at FROM users WHERE deleted_at IS NULL');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getUser = async (req, res) => {
    try {
        const { id } = req.params;
        const [users] = await db.query('SELECT id, full_name, username, email, is_global_admin FROM users WHERE id = ? AND deleted_at IS NULL', [id]);
        if (users.length === 0) return res.status(404).json({ message: 'User not found' });
        res.json(users[0]);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createUser = async (req, res) => {
    try {
        const { full_name, username, email, password, is_global_admin } = req.body;
        const [result] = await db.query(
            'INSERT INTO users (full_name, username, email, password, is_global_admin) VALUES (?, ?, ?, ?, ?)',
            [full_name, username, email, password, is_global_admin || false]
        );
        res.status(201).json({ id: result.insertId, full_name, username, email });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { full_name, username, email, is_global_admin } = req.body;
        await db.query(
            'UPDATE users SET full_name = ?, username = ?, email = ?, is_global_admin = ? WHERE id = ?',
            [full_name, username, email, is_global_admin, id]
        );
        res.json({ message: 'User updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        // Soft delete
        await db.query('UPDATE users SET deleted_at = NOW() WHERE id = ?', [id]);
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
