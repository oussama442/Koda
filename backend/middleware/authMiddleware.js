const jwt = require('jsonwebtoken');
const db = require('../config/db');

exports.verifyToken = (req, res, next) => {
    let token = req.header('Authorization');
    
    if (token && token.startsWith('Bearer ')) {
        token = token.slice(7);
    } else if (!token && req.query.token) {
        token = req.query.token;
    }

    if (!token) {
        return res.status(401).json({ message: 'Access Denied: No Token Provided' });
    }

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

exports.isAdmin = (req, res, next) => {
    if (req.user && (req.user.role === 'Admin' || req.user.is_global_admin)) {
        next();
    } else {
        res.status(403).json({ message: 'Access Forbidden: Requires Admin Role' });
    }
};

exports.hasPermission = (requiredPermission) => {
    return async (req, res, next) => {
        try {
            // Global admins bypass permission checks
            if (req.user && (req.user.role === 'Admin' || req.user.is_global_admin)) {
                return next();
            }

            // Determine project_id from params, body, or query
            const projectId = req.params.project_id || req.body.project_id || req.query.project_id;

            if (!projectId) {
                return res.status(400).json({ message: 'Project ID is required for permission check' });
            }

            // Check if user is the project manager (chef_projet)
            const [project] = await db.query('SELECT chef_projet_id FROM projects WHERE id = ?', [projectId]);
            if (project.length > 0 && project[0].chef_projet_id === req.user.id) {
                return next(); // Project manager has all permissions
            }

            // Check if user has the specific permission through their role in the project
            const [rows] = await db.query(`
                SELECT p.permission_name 
                FROM project_members pm
                JOIN role_permissions rp ON pm.role_id = rp.role_id
                JOIN permissions p ON rp.permission_id = p.id
                WHERE pm.project_id = ? AND pm.user_id = ? AND p.permission_name = ?
            `, [projectId, req.user.id, requiredPermission]);

            if (rows.length > 0) {
                return next();
            }

            return res.status(403).json({ message: `Access Forbidden: Requires ${requiredPermission} permission` });
        } catch (error) {
            return res.status(500).json({ message: 'Error checking permissions' });
        }
    };
};
