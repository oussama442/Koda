const db = require('../config/db');

// List all roles
exports.getAllRoles = async (req, res) => {
    try {
        const [roles] = await db.query('SELECT * FROM roles ORDER BY role_name');
        res.json(roles);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get single role with permissions
exports.getRoleById = async (req, res) => {
    try {
        const { id } = req.params;
        const [roles] = await db.query('SELECT * FROM roles WHERE id = ?', [id]);
        
        if (roles.length === 0) {
            return res.status(404).json({ message: 'Role not found' });
        }

        const [permissions] = await db.query(
            `SELECT p.id, p.permission_name 
             FROM permissions p
             JOIN role_permissions rp ON p.id = rp.permission_id
             WHERE rp.role_id = ?`,
            [id]
        );

        res.json({
            ...roles[0],
            permissions: permissions.map(p => p.id)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create role
exports.createRole = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const { role_name, permissions } = req.body;

        const [result] = await connection.query(
            'INSERT INTO roles (role_name) VALUES (?)',
            [role_name]
        );
        const roleId = result.insertId;

        if (permissions && permissions.length > 0) {
            const values = permissions.map(pId => [roleId, pId]);
            await connection.query(
                'INSERT INTO role_permissions (role_id, permission_id) VALUES ?',
                [values]
            );
        }

        await connection.commit();
        res.status(201).json({ id: roleId, role_name });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ message: error.message });
    } finally {
        connection.release();
    }
};

// Update role
exports.updateRole = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const { id } = req.params;
        const { role_name, permissions } = req.body;

        await connection.query(
            'UPDATE roles SET role_name = ? WHERE id = ?',
            [role_name, id]
        );

        // Update permissions: Delete existing and re-insert
        await connection.query('DELETE FROM role_permissions WHERE role_id = ?', [id]);

        if (permissions && permissions.length > 0) {
            const values = permissions.map(pId => [id, pId]);
            await connection.query(
                'INSERT INTO role_permissions (role_id, permission_id) VALUES ?',
                [values]
            );
        }

        await connection.commit();
        res.json({ message: 'Role updated successfully' });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ message: error.message });
    } finally {
        connection.release();
    }
};

// Delete role
exports.deleteRole = async (req, res) => {
    try {
        const { id } = req.params;
        // Check if role is assigned to any user first? 
        // In this schema, project_members use role_id.
        const [members] = await db.query('SELECT * FROM project_members WHERE role_id = ?', [id]);
        if (members.length > 0) {
            return res.status(400).json({ message: 'Cannot delete role assigned to project members' });
        }

        await db.query('DELETE FROM roles WHERE id = ?', [id]);
        res.json({ message: 'Role deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// List all available permissions
exports.getAllPermissions = async (req, res) => {
    try {
        const [permissions] = await db.query('SELECT * FROM permissions ORDER BY permission_name');
        res.json(permissions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
