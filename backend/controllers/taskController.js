const db = require('../config/db');

exports.getAll = async (req, res) => {
    try {
        const { project_id, sprint_id } = req.query;
        let query = `
            SELECT t.*, u.full_name as assigned_user_name, s.name as sprint_name 
            FROM tasks t 
            LEFT JOIN users u ON t.user_id = u.id 
            LEFT JOIN sprints s ON t.sprint_id = s.id 
            WHERE t.deleted_at IS NULL
        `;
        const params = [];
        
        if (project_id) {
            query += ' AND t.project_id = ?';
            params.push(project_id);
        }
        if (sprint_id) {
            query += ' AND t.sprint_id = ?';
            params.push(sprint_id);
        }
        
        query += ' ORDER BY t.created_at DESC';
        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getById = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query('SELECT * FROM tasks WHERE id = ? AND deleted_at IS NULL', [id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Task not found' });
        
        // Get comments too
        const [comments] = await db.query(`
            SELECT tc.*, u.full_name as user_name 
            FROM task_comments tc 
            LEFT JOIN users u ON tc.user_id = u.id 
            WHERE tc.task_id = ? 
            ORDER BY tc.created_at DESC
        `, [id]);
        
        res.json({ ...rows[0], comments });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.create = async (req, res) => {
    try {
        const { project_id, sprint_id, user_id, title, description, status, start_date, end_date } = req.body;
        const [result] = await db.query(
            'INSERT INTO tasks (project_id, sprint_id, user_id, title, description, status, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [project_id, sprint_id || null, user_id || null, title, description, status || 'To Do', start_date || null, end_date || null]
        );
        res.status(201).json({ id: result.insertId, message: 'Task created successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const { sprint_id, user_id, title, description, story_points, status, start_date, end_date, comment } = req.body;
        
        // Get current status to check for changes
        const [current] = await db.query('SELECT status FROM tasks WHERE id = ?', [id]);
        
        await db.query(
            'UPDATE tasks SET sprint_id = ?, user_id = ?, title = ?, description = ?, status = ?, start_date = ?, end_date = ? WHERE id = ?',
            [sprint_id || null, user_id || null, title, description, status, start_date || null, end_date || null, id]
        );

        // If status changed and a comment was provided, save it
        if (comment && current[0].status !== status) {
            await db.query(
                'INSERT INTO task_comments (task_id, user_id, comment) VALUES (?, ?, ?)',
                [id, req.user ? req.user.id : null, comment]
            );
        }

        res.json({ message: 'Task updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.remove = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('UPDATE tasks SET deleted_at = NOW() WHERE id = ?', [id]);
        res.json({ message: 'Task deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.addComment = async (req, res) => {
    try {
        const { id } = req.params; // task_id
        const { comment } = req.body;
        const user_id = req.user ? req.user.id : null;

        await db.query(
            'INSERT INTO task_comments (task_id, user_id, comment) VALUES (?, ?, ?)',
            [id, user_id, comment]
        );
        res.status(201).json({ message: 'Comment added successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
