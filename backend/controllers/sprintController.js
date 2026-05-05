const db = require('../config/db');

exports.getAll = async (req, res) => {
    try {
        const { project_id } = req.query;
        let query = 'SELECT * FROM sprints WHERE deleted_at IS NULL';
        const params = [];
        
        if (project_id) {
            query += ' AND project_id = ?';
            params.push(project_id);
        }
        
        query += ' ORDER BY start_date DESC';
        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getById = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query('SELECT * FROM sprints WHERE id = ? AND deleted_at IS NULL', [id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Sprint not found' });
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.create = async (req, res) => {
    try {
        const { project_id, name, duration_weeks, start_date, end_date, status } = req.body;
        const [result] = await db.query(
            'INSERT INTO sprints (project_id, name, duration_weeks, start_date, end_date, status) VALUES (?, ?, ?, ?, ?, ?)',
            [project_id, name, duration_weeks, start_date, end_date, status || 'Planned']
        );
        res.status(201).json({ id: result.insertId, message: 'Sprint created successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, duration_weeks, start_date, end_date, status } = req.body;
        await db.query(
            'UPDATE sprints SET name = ?, duration_weeks = ?, start_date = ?, end_date = ?, status = ? WHERE id = ?',
            [name, duration_weeks, start_date, end_date, status, id]
        );
        res.json({ message: 'Sprint updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.remove = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('UPDATE sprints SET deleted_at = NOW() WHERE id = ?', [id]);
        res.json({ message: 'Sprint deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
