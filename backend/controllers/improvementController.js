const db = require('../config/db');

exports.createImprovementRequest = async (req, res) => {
    try {
        const { application_id, title, description, priority } = req.body;
        const userId = req.user.id;

        const [result] = await db.query(
            'INSERT INTO improvement_requests (application_id, user_id, title, description, priority, status) VALUES (?, ?, ?, ?, ?, ?)',
            [application_id, userId, title, description, priority, 'Proposed']
        );

        res.status(201).json({ id: result.insertId, message: 'Improvement request created' });
    } catch (error) {
        console.error('Error creating improvement request:', error);
        res.status(500).json({ message: 'Error creating improvement request' });
    }
};

exports.getImprovementRequests = async (req, res) => {
    try {
        const { application_id } = req.query;
        let query = 'SELECT ir.*, a.name as application_name, u.username FROM improvement_requests ir JOIN applications a ON ir.application_id = a.id JOIN users u ON ir.user_id = u.id WHERE ir.deleted_at IS NULL';
        let params = [];

        if (application_id) {
            query += ' AND ir.application_id = ?';
            params.push(application_id);
        }

        const [requests] = await db.query(query, params);
        res.json(requests);
    } catch (error) {
        console.error('Error fetching improvement requests:', error);
        res.status(500).json({ message: 'Error fetching improvement requests' });
    }
};

exports.updateImprovementStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        await db.query('UPDATE improvement_requests SET status = ? WHERE id = ?', [status, id]);
        res.json({ message: 'Improvement request status updated' });
    } catch (error) {
        console.error('Error updating improvement status:', error);
        res.status(500).json({ message: 'Error updating improvement status' });
    }
};
