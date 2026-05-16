const jwt = require('jsonwebtoken');

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
