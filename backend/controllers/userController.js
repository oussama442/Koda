const db = require('../config/db');
const bcrypt = require('bcryptjs');

exports.getUsers = async (req, res) => {
    try {
        const [users] = await db.query('SELECT id, full_name, username, email, is_global_admin, avatar, created_at FROM users WHERE deleted_at IS NULL');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getUser = async (req, res) => {
    try {
        const { id } = req.params;
        const [users] = await db.query('SELECT id, full_name, username, email, is_global_admin, avatar FROM users WHERE id = ? AND deleted_at IS NULL', [id]);
        if (users.length === 0) return res.status(404).json({ message: 'User not found' });
        res.json(users[0]);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createUser = async (req, res) => {
    try {
        const { full_name, username, email, password, is_global_admin } = req.body;
        
        if (!password) {
            return res.status(400).json({ message: 'Password is required' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await db.query(
            'INSERT INTO users (full_name, username, email, password, is_global_admin) VALUES (?, ?, ?, ?, ?)',
            [full_name, username, email, hashedPassword, is_global_admin ? 1 : 0]
        );
        res.status(201).json({ id: result.insertId, full_name, username, email });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { full_name, username, email, is_global_admin } = req.body;
        await db.query(
            'UPDATE users SET full_name = ?, username = ?, email = ?, is_global_admin = ? WHERE id = ?',
            [full_name, username, email, is_global_admin, id]
        );
        res.json({ message: 'User updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const id = req.user.id; // From authMiddleware
        const { full_name, email, password } = req.body;
        
        let query = 'UPDATE users SET full_name = ?, email = ?';
        let params = [full_name, email];
        
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            query += ', password = ?';
            params.push(hashedPassword);
        }
        
        query += ' WHERE id = ?';
        params.push(id);
        
        await db.query(query, params);
        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Fetch the user to get their current username and email
        const [users] = await db.query('SELECT username, email FROM users WHERE id = ?', [id]);
        
        if (users.length > 0) {
            const user = users[0];
            const timestamp = Date.now();
            
            // Scramble to free up the unique index for future registrations
            const scrambledUsername = `deleted_${timestamp}_${user.username}`;
            const scrambledEmail = `deleted_${timestamp}_${user.email}`;
            
            // Soft delete and update email/username strings
            await db.query(
                'UPDATE users SET username = ?, email = ?, deleted_at = NOW() WHERE id = ?', 
                [scrambledUsername, scrambledEmail, id]
            );
            res.json({ message: 'User deleted and credentials freed successfully' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.uploadAvatar = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        const avatarUrl = `/uploads/avatars/${req.file.filename}`;
        await db.query('UPDATE users SET avatar = ? WHERE id = ?', [avatarUrl, req.user.id]);
        res.json({ message: 'Avatar updated successfully', avatar: avatarUrl });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
