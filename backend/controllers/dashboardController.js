const mysql = require('mysql2/promise');
require('dotenv').config();

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

exports.getOverview = async (req, res) => {
    try {
        const [criticalIncidents] = await db.query("SELECT COUNT(*) as count FROM incidents WHERE status = 'Critical' AND deleted_at IS NULL");
        const [recentDeployments] = await db.query("SELECT * FROM deployments ORDER BY deployed_at DESC LIMIT 5");
        const [appsCount] = await db.query("SELECT COUNT(*) as count FROM applications WHERE deleted_at IS NULL");
        const [projectsCount] = await db.query("SELECT COUNT(*) as count FROM projects WHERE deleted_at IS NULL");

        res.json({
            criticalIncidents: criticalIncidents[0].count,
            recentDeployments: recentDeployments,
            totalApplications: appsCount[0].count,
            totalProjects: projectsCount[0].count
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
