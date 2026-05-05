const db = require('../config/db');

exports.getAll = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT p.*, a.name as application_name, u.full_name as chef_projet_name 
            FROM projects p
            LEFT JOIN applications a ON p.application_id = a.id
            LEFT JOIN users u ON p.chef_projet_id = u.id
            WHERE p.deleted_at IS NULL 
            ORDER BY p.id DESC
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getById = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query(`
            SELECT p.*, u.full_name as chef_projet_name 
            FROM projects p 
            LEFT JOIN users u ON p.chef_projet_id = u.id
            WHERE p.id = ? AND p.deleted_at IS NULL
        `, [id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Not found' });
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.create = async (req, res) => {
    try {
        // Only Admin can create projects
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ message: 'Only Admin can create projects' });
        }

        const { application_id, name, description, start_date, end_date, chef_projet_id } = req.body;
        const [result] = await db.query(
            'INSERT INTO projects (application_id, name, description, start_date, end_date, chef_projet_id) VALUES (?, ?, ?, ?, ?, ?)',
            [application_id, name, description, start_date, end_date, chef_projet_id || null]
        );
        res.status(201).json({ id: result.insertId, message: 'Created successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const { application_id, name, description, start_date, end_date, chef_projet_id } = req.body;
        
        // Only Admin can update project owner/core details
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ message: 'Only Admin can modify project core details' });
        }

        await db.query(
            'UPDATE projects SET application_id = ?, name = ?, description = ?, start_date = ?, end_date = ?, chef_projet_id = ? WHERE id = ?',
            [application_id, name, description, start_date, end_date, chef_projet_id || null, id]
        );
        res.json({ message: 'Updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.remove = async (req, res) => {
    try {
        const { id } = req.params;
        if (req.user.role !== 'Admin') return res.status(403).json({ message: 'Forbidden' });
        
        await db.query('UPDATE projects SET deleted_at = NOW() WHERE id = ?', [id]);
        res.json({ message: 'Deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
