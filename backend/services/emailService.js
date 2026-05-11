const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

exports.sendNotificationEmail = async (to, subject, text) => {
    try {
        const info = await transporter.sendMail({
            from: `"Koda ERP" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text
        });
        console.log('Email sent: %s', info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending email:', error);
        // Don't throw, just log. Email failure shouldn't crash the app logic.
    }
};
