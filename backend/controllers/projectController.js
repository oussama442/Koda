const db = require('../config/db');
const { projectValues, ProjectInputError } = require('../utils/projectInput');

function respondToWriteError(error, res) {
    if (error instanceof ProjectInputError) {
        return res.status(400).json({ message: error.message });
    }
    if (error.code === 'ER_NO_REFERENCED_ROW_2' || error.errno === 1452) {
        return res.status(400).json({ message: 'The selected application does not exist. Choose a valid application.' });
    }
    return res.status(500).json({ message: error.message });
}

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

        const values = projectValues(req.body);
        const [result] = await db.query(
            'INSERT INTO projects (application_id, name, description, start_date, end_date, chef_projet_id) VALUES (?, ?, ?, ?, ?, ?)',
            values
        );
        res.status(201).json({ id: result.insertId, message: 'Created successfully' });
    } catch (error) {
        respondToWriteError(error, res);
    }
};

exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Only Admin can update project owner/core details
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ message: 'Only Admin can modify project core details' });
        }

        const values = projectValues(req.body);
        await db.query(
            'UPDATE projects SET application_id = ?, name = ?, description = ?, start_date = ?, end_date = ?, chef_projet_id = ? WHERE id = ?',
            [...values, id]
        );
        res.json({ message: 'Updated successfully' });
    } catch (error) {
        respondToWriteError(error, res);
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
