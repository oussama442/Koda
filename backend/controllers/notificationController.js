const db = require('../config/db');
const emailService = require('../services/emailService');

exports.getNotifications = async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
            [req.user.id]
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        await db.query(
            'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
            [req.params.id, req.user.id]
        );
        res.json({ message: 'Notification marked as read' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.markAllAsRead = async (req, res) => {
    try {
        await db.query(
            'UPDATE notifications SET is_read = TRUE WHERE user_id = ?',
            [req.user.id]
        );
        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Helper for other controllers
exports.createNotification = async (userId, title, message, type, link) => {
    try {
        console.log(`Creating notification for user ${userId}: ${title}`);
        await db.query(
            'INSERT INTO notifications (user_id, title, message, type, link) VALUES (?, ?, ?, ?, ?)',
            [userId, title, message, type, link]
        );
        console.log('Notification created successfully');

        // Query user email to send an email alert
        const [users] = await db.query('SELECT email FROM users WHERE id = ?', [userId]);
        if (users.length > 0 && users[0].email) {
            console.log(`Sending email notification to ${users[0].email}`);
            await emailService.sendNotificationEmail(
                users[0].email,
                `[Koda ERP] ${title}`,
                `${message}\n\nAccédez-y ici: http://localhost:4200${link}`
            );
        }

        return true;
    } catch (error) {
        console.error('Failed to create notification:', error);
        return false;
    }
};
