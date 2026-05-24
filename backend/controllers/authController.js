const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
    try {
        const { login, password } = req.body; // login can be username or email

        if (!login || !password) {
            return res.status(400).json({ message: 'Username/Email and password are required' });
        }

        // Search for user by username or email
        const [users] = await db.query(
            'SELECT * FROM users WHERE username = ? OR email = ?',
            [login, login]
        );

        if (users.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const user = users[0];

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate JWT
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.is_global_admin ? 'Admin' : 'User' },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                full_name: user.full_name,
                username: user.username,
                email: user.email,
                is_global_admin: user.is_global_admin,
                avatar: user.avatar
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getMe = async (req, res) => {
    // This would be called with a verifyToken middleware
    try {
        const [users] = await db.query('SELECT id, full_name, username, email, is_global_admin, avatar FROM users WHERE id = ?', [req.user.id]);
        if (users.length === 0) return res.status(404).json({ message: 'User not found' });
        res.json(users[0]);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
