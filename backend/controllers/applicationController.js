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

exports.getAll = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM applications WHERE deleted_at IS NULL ORDER BY id DESC');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getById = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query('SELECT * FROM applications WHERE id = ? AND deleted_at IS NULL', [id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Not found' });
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.create = async (req, res) => {
    try {
        const { name, description, current_status, github_repo_url } = req.body;
        const [result] = await db.query(
            'INSERT INTO applications (name, description, current_status, github_repo_url) VALUES (?, ?, ?, ?)',
            [req.body.name, req.body.description, req.body.current_status, req.body.github_repo_url]
        );
        res.status(201).json({ id: result.insertId, message: 'Created successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, current_status, github_repo_url } = req.body;
        await db.query(
            'UPDATE applications SET name = ?, description = ?, current_status = ?, github_repo_url = ? WHERE id = ?',
            [req.body.name, req.body.description, req.body.current_status, req.body.github_repo_url, id]
        );
        res.json({ message: 'Updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.remove = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('UPDATE applications SET deleted_at = NOW() WHERE id = ?', [id]);
        res.json({ message: 'Deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
