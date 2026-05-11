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
        const [rows] = await db.query('SELECT * FROM incidents WHERE deleted_at IS NULL ORDER BY id DESC');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getById = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query('SELECT * FROM incidents WHERE id = ? AND deleted_at IS NULL', [id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Not found' });
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.create = async (req, res) => {
    try {
        const { application_id, user_id, title, description, status } = req.body;
        const [result] = await db.query(
            'INSERT INTO incidents (application_id, user_id, title, description, status) VALUES (?, ?, ?, ?, ?)',
            [req.body.application_id, req.body.user_id, req.body.title, req.body.description, req.body.status]
        );
        res.status(201).json({ id: result.insertId, message: 'Created successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const { application_id, user_id, title, description, status } = req.body;
        await db.query(
            'UPDATE incidents SET application_id = ?, user_id = ?, title = ?, description = ?, status = ? WHERE id = ?',
            [req.body.application_id, req.body.user_id, req.body.title, req.body.description, req.body.status, id]
        );
        res.json({ message: 'Updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.remove = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('UPDATE incidents SET deleted_at = NOW() WHERE id = ?', [id]);
        res.json({ message: 'Deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
<<<<<<< HEAD
=======

exports.getCorrectiveActions = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query(`
            SELECT c.*, u.full_name as executor_name 
            FROM corrective_actions c
            LEFT JOIN users u ON c.user_id = u.id
            WHERE c.incident_id = ?
            ORDER BY c.executed_at DESC
        `, [id]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.addCorrectiveAction = async (req, res) => {
    try {
        const { id } = req.params;
        const { description } = req.body;
        const user_id = req.user ? req.user.id : null; // Assuming verifyToken sets req.user
        
        await db.query(
            'INSERT INTO corrective_actions (incident_id, user_id, description) VALUES (?, ?, ?)',
            [id, user_id, description]
        );
        res.status(201).json({ message: 'Corrective action added successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
>>>>>>> 11e8399 (feat: upload latest version of Koda ERP with full module integration and glassmorphism UI)
