const db = require('../config/db');

const checkSprintAccess = async (userId, userRole, sprintId, projectId = null) => {
    if (userRole === 'Admin') return true;
    
    let pid = projectId;
    if (!pid && sprintId) {
        const [sprints] = await db.query('SELECT project_id FROM sprints WHERE id = ?', [sprintId]);
        if (sprints.length > 0) {
            pid = sprints[0].project_id;
        }
    }
    
    if (!pid) return false;
    
    // Check if the user is the chef_projet_id of the project
    const [projects] = await db.query('SELECT chef_projet_id FROM projects WHERE id = ?', [pid]);
    if (projects.length > 0 && projects[0].chef_projet_id == userId) {
        return true;
    }
    
    // Check if user has Developer or Admin role in project_members
    const [members] = await db.query(`
        SELECT pm.*, r.role_name 
        FROM project_members pm
        LEFT JOIN roles r ON pm.role_id = r.id
        WHERE pm.project_id = ? AND pm.user_id = ?
    `, [pid, userId]);
    
    if (members.length > 0) {
        const role = members[0].role_name;
        if (role === 'Admin' || role === 'Project Manager') {
            return true;
        }
    }
    
    return false;
};

exports.getAll = async (req, res) => {
    try {
        const { project_id } = req.query;
        let query = `
            SELECT s.*, p.name as project_name, p.chef_projet_id 
            FROM sprints s
            LEFT JOIN projects p ON s.project_id = p.id
            WHERE s.deleted_at IS NULL
        `;
        const params = [];
        
        if (project_id) {
            query += ' AND s.project_id = ?';
            params.push(project_id);
        }
        
        query += ' ORDER BY s.start_date DESC';
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
        
        const hasAccess = await checkSprintAccess(req.user.id, req.user.role, null, project_id);
        if (!hasAccess) {
            return res.status(403).json({ message: 'Access Denied: Requires project admin or project manager rights' });
        }

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
        
        const hasAccess = await checkSprintAccess(req.user.id, req.user.role, id);
        if (!hasAccess) {
            return res.status(403).json({ message: 'Access Denied: Requires project admin or project manager rights' });
        }

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
        
        const hasAccess = await checkSprintAccess(req.user.id, req.user.role, id);
        if (!hasAccess) {
            return res.status(403).json({ message: 'Access Denied: Requires project admin or project manager rights' });
        }

        await db.query('UPDATE sprints SET deleted_at = NOW() WHERE id = ?', [id]);
        res.json({ message: 'Sprint deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- New Checklist & History Features ---

exports.getChecklist = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query('SELECT * FROM sprint_checklists WHERE sprint_id = ?', [id]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateChecklist = async (req, res) => {
    try {
        const { id } = req.params;
        const { items } = req.body; // Array of { item_name, is_checked }
        
        const hasAccess = await checkSprintAccess(req.user.id, req.user.role, id);
        if (!hasAccess) {
            return res.status(403).json({ message: 'Access Denied: Requires project admin or project manager rights' });
        }
        
        // Get existing IDs to find what to delete
        const [existing] = await db.query('SELECT id FROM sprint_checklists WHERE sprint_id = ?', [id]);
        const incomingIds = items.filter(i => i.id).map(i => i.id);
        const toDelete = existing.filter(e => !incomingIds.includes(e.id)).map(e => e.id);

        if (toDelete.length > 0) {
            await db.query('DELETE FROM sprint_checklists WHERE id IN (?)', [toDelete]);
        }

        for (const item of items) {
            if (item.id) {
                await db.query(
                    'UPDATE sprint_checklists SET item_name = ?, is_checked = ? WHERE id = ? AND sprint_id = ?',
                    [item.item_name, item.is_checked ? 1 : 0, item.id, id]
                );
            } else {
                await db.query(
                    'INSERT INTO sprint_checklists (sprint_id, item_name, is_checked) VALUES (?, ?, ?)',
                    [id, item.item_name, item.is_checked ? 1 : 0]
                );
            }
        }

        // Fetch tasks to log their status
        const [tasks] = await db.query('SELECT title, status FROM tasks WHERE sprint_id = ? AND deleted_at IS NULL', [id]);
        const taskSummary = tasks.map(t => `${t.title} (${t.status})`).join(', ');

        // Log the change
        await db.query(
            'INSERT INTO sprint_history (sprint_id, action, details, changed_by) VALUES (?, ?, ?, ?)',
            [id, 'CHECKLIST_UPDATE', `Checklist mise à jour. Tâches actuelles: ${taskSummary || 'Aucune'}`, req.user.id]
        );

        res.json({ message: 'Checklist updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getHistory = async (req, res) => {
    try {
        const { id } = req.params;
        const [history] = await db.query(
        `SELECT h.*, u.full_name as user_name 
         FROM sprint_history h 
         LEFT JOIN users u ON h.changed_by = u.id 
         WHERE h.sprint_id = ? 
         ORDER BY h.changed_at DESC`,
        [id]
      );  res.json(history);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.delay = async (req, res) => {
    try {
        const { id } = req.params;
        const { new_start_date, new_end_date, reason } = req.body;
        const userId = req.user.id;
        
        const hasAccess = await checkSprintAccess(req.user.id, req.user.role, id);
        if (!hasAccess) {
            return res.status(403).json({ message: 'Access Denied: Requires project admin or project manager rights' });
        }
        
        await db.query(
            'UPDATE sprints SET start_date = ?, end_date = ? WHERE id = ?',
            [new_start_date, new_end_date, id]
        );

        // Fetch tasks for logging
        const [tasks] = await db.query('SELECT title, status FROM tasks WHERE sprint_id = ? AND deleted_at IS NULL', [id]);
        const taskSummary = tasks.map(t => `${t.title} (${t.status})`).join(', ');

        // Log to history
        await db.query(
            'INSERT INTO sprint_history (sprint_id, action, details, changed_by) VALUES (?, ?, ?, ?)',
            [id, 'DELAYED', `Sprint reporté: ${reason}. Nouvelles dates: ${new_start_date} - ${new_end_date}. État des tâches: ${taskSummary || 'Aucune'}`, userId]
        );

        res.json({ message: 'Sprint delayed and logged successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.close = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const hasAccess = await checkSprintAccess(req.user.id, req.user.role, id);
        if (!hasAccess) {
            return res.status(403).json({ message: 'Access Denied: Requires project admin or project manager rights' });
        }

        // 1. Fetch tasks to log their status before unassigning
        const [tasks] = await db.query('SELECT id, title, status FROM tasks WHERE sprint_id = ? AND deleted_at IS NULL', [id]);
        
        const doneTasks = tasks.filter(t => t.status === 'Done');
        const pendingTasks = tasks.filter(t => t.status !== 'Done');
        
        const summary = `Sprint clôturé. Tâches terminées: ${doneTasks.length}, Tâches retournées au backlog: ${pendingTasks.length}. Détails: ${tasks.map(t => `${t.title} [${t.status}]`).join(', ')}`;

        // 2. Return unfinished tasks to backlog (sprint_id = NULL)
        if (pendingTasks.length > 0) {
            await db.query(
                'UPDATE tasks SET sprint_id = NULL WHERE id IN (?)',
                [pendingTasks.map(t => t.id)]
            );
        }

        // 3. Update sprint status
        await db.query(
            "UPDATE sprints SET status = 'Completed' WHERE id = ?",
            [id]
        );

        // 4. Log to history
        await db.query(
            'INSERT INTO sprint_history (sprint_id, action, details, changed_by) VALUES (?, ?, ?, ?)',
            [id, 'CLOSED', summary, userId]
        );

        res.json({ message: 'Sprint closed successfully', tasksMoved: pendingTasks.length });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
