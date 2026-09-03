const db = require('../config/db');
const { createNotification } = require('./notificationController');

exports.getMemberOptions = async (req, res) => {
    const projectId = Number(req.params.project_id);
    if (!/^\d+$/.test(req.params.project_id) || !Number.isSafeInteger(projectId) || projectId < 1 || projectId > 2147483647) {
        return res.status(400).json({ message: 'Project ID must be a positive integer between 1 and 2147483647' });
    }

    try {
        const [projects] = await db.query(
            'SELECT chef_projet_id FROM projects WHERE id = ? AND deleted_at IS NULL',
            [projectId]
        );
        if (!projects.length) return res.status(404).json({ message: 'Project not found' });

        // Selector access follows the same rule as adding a project member.
        const isAdmin = req.user.role === 'Admin';
        const isChef = projects[0].chef_projet_id === req.user.id;
        if (!isAdmin && !isChef) {
            return res.status(403).json({ message: 'Forbidden: Only Admin or Project Manager can load member options' });
        }

        const [[users], [roles]] = await Promise.all([
            db.query('SELECT id, full_name FROM users WHERE deleted_at IS NULL ORDER BY full_name, id'),
            db.query('SELECT id, role_name FROM roles ORDER BY role_name, id')
        ]);
        res.json({ users, roles });
    } catch (error) {
        res.status(500).json({ message: 'Unable to load member options' });
    }
};

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

        // Notify the user
        const [projInfo] = await db.query('SELECT name FROM projects WHERE id = ?', [project_id]);
        await createNotification(
            user_id,
            'Nouveau Projet',
            `Vous avez été ajouté à l'équipe du projet: ${projInfo[0].name}`,
            'Project',
            `/projects/${project_id}/members`
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
