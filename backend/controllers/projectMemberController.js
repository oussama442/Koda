const db = require('../config/db');

exports.addMember = async (req, res) => {
    try {
        const { project_id, user_id, role_id } = req.body;
        
        // Only Admin or Chef Projet can add members
        const [project] = await db.query('SELECT chef_projet_id FROM projects WHERE id = ?', [project_id]);
        if (!project.length) return res.status(404).json({ message: 'Project not found' });
        
        const isAdmin = req.user.role === 'Admin';
        const isChef = project[0].chef_projet_id === req.user.id;
        
        if (!isAdmin && !isChef) {
            return res.status(403).json({ message: 'Forbidden: Only Admin or Project Manager can add members' });
        }

        await db.query(
            'INSERT INTO project_members (project_id, user_id, role_id) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE role_id = ?',
            [project_id, user_id, role_id, role_id]
        );
        
        res.status(201).json({ message: 'Member added successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getMembers = async (req, res) => {
    try {
        const { project_id } = req.params;
        const [members] = await db.query(`
            SELECT pm.*, u.full_name, u.email, r.role_name 
            FROM project_members pm
            JOIN users u ON pm.user_id = u.id
            JOIN roles r ON pm.role_id = r.id
            WHERE pm.project_id = ?
        `, [project_id]);
        res.json(members);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.removeMember = async (req, res) => {
    try {
        const { project_id, user_id } = req.params;
        
        // Permission check
        const [project] = await db.query('SELECT chef_projet_id FROM projects WHERE id = ?', [project_id]);
        const isAdmin = req.user.role === 'Admin';
        const isChef = project[0].chef_projet_id === req.user.id;
        
        if (!isAdmin && !isChef) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        await db.query('DELETE FROM project_members WHERE project_id = ? AND user_id = ?', [project_id, user_id]);
        res.json({ message: 'Member removed successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
