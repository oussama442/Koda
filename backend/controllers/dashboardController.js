const db = require('../config/db');

exports.getOverview = async (req, res) => {
    try {
        // Stats basicas
        const [[criticalIncidents]] = await db.query("SELECT COUNT(*) as count FROM incidents WHERE status = 'Critical' AND deleted_at IS NULL");
        const [[appsCount]] = await db.query("SELECT COUNT(*) as count FROM applications WHERE deleted_at IS NULL");
        const [[projectsCount]] = await db.query("SELECT COUNT(*) as count FROM projects WHERE deleted_at IS NULL");
        const [[usersCount]] = await db.query("SELECT COUNT(*) as count FROM users WHERE deleted_at IS NULL");
        
        // Task stats
        const [taskStats] = await db.query("SELECT status, COUNT(*) as count FROM tasks WHERE deleted_at IS NULL GROUP BY status");
        
        // Recent activities
        const [recentDeployments] = await db.query(`
            SELECT d.*, a.name as app_name 
            FROM deployments d 
            LEFT JOIN applications a ON d.application_id = a.id 
            ORDER BY d.deployed_at DESC LIMIT 5
        `);

        const [recentTasks] = await db.query(`
            SELECT t.*, p.name as project_name 
            FROM tasks t 
            LEFT JOIN projects p ON t.project_id = p.id 
            WHERE t.deleted_at IS NULL 
            ORDER BY t.created_at DESC LIMIT 5
        `);

        const [recentIncidents] = await db.query(`
            SELECT i.*, a.name as app_name 
            FROM incidents i 
            LEFT JOIN applications a ON i.application_id = a.id 
            WHERE i.deleted_at IS NULL 
            ORDER BY i.created_at DESC LIMIT 5
        `);

        res.json({
            stats: {
                criticalIncidents: criticalIncidents.count,
                totalApplications: appsCount.count,
                totalProjects: projectsCount.count,
                totalUsers: usersCount.count,
                tasks: taskStats
            },
            recent: {
                deployments: recentDeployments,
                tasks: recentTasks,
                incidents: recentIncidents
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
