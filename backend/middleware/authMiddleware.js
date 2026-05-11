const jwt = require('jsonwebtoken');

exports.verifyToken = (req, res, next) => {
<<<<<<< HEAD
    const token = req.header('Authorization');
    if (!token) return res.status(401).json({ message: 'Access Denied: No Token Provided' });

    try {
        const tokenString = token.startsWith('Bearer ') ? token.slice(7) : token;
        const verified = jwt.verify(tokenString, process.env.JWT_SECRET);
        req.user = verified;
        next();
    } catch (err) {
        res.status(400).json({ message: 'Invalid Token' });
=======
    let token = req.header('Authorization')?.split(' ')[1];

    if (!token && req.query.token) {
        token = req.query.token;
    }

    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token is not valid' });
>>>>>>> 11e8399 (feat: upload latest version of Koda ERP with full module integration and glassmorphism UI)
    }
};

exports.isAdmin = (req, res, next) => {
<<<<<<< HEAD
    if (req.user && req.user.role === 'Admin') {
        next();
    } else {
        res.status(403).json({ message: 'Access Forbidden: Requires Admin Role' });
=======
    if (req.user && req.user.is_global_admin) {
        next();
    } else {
        res.status(403).json({ message: 'Access denied: Administrators only' });
>>>>>>> 11e8399 (feat: upload latest version of Koda ERP with full module integration and glassmorphism UI)
    }
};
