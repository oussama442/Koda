const db = require('../config/db');

exports.getAll = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM deployments ORDER BY id DESC');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getById = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query('SELECT * FROM deployments WHERE id = ?', [id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Not found' });
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.create = async (req, res) => {
    try {
        const { application_id, version, deployed_at, pre_deploy_actions, post_deploy_actions } = req.body;
        const [result] = await db.query(
            'INSERT INTO deployments (application_id, version, deployed_at, pre_deploy_actions, post_deploy_actions) VALUES (?, ?, ?, ?, ?)',
            [req.body.application_id, req.body.version, req.body.deployed_at, req.body.pre_deploy_actions, req.body.post_deploy_actions]
        );
        res.status(201).json({ id: result.insertId, message: 'Created successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const { application_id, version, deployed_at, pre_deploy_actions, post_deploy_actions } = req.body;
        await db.query(
            'UPDATE deployments SET application_id = ?, version = ?, deployed_at = ?, pre_deploy_actions = ?, post_deploy_actions = ? WHERE id = ?',
            [req.body.application_id, req.body.version, req.body.deployed_at, req.body.pre_deploy_actions, req.body.post_deploy_actions, id]
        );
        res.json({ message: 'Updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.remove = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM deployments WHERE id = ?', [id]);
        res.json({ message: 'Deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
