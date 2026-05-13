const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        // GUEST MODE: No token provided, proceed without attaching user
        req.user = null;
        return next();
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');
        req.user = decoded; // Attach user payload to request
        next();
    } catch (error) {
        // If token is invalid or expired, log them out implicitly by treating them as a guest
        // OR we can choose to reject the request. For this chatbot, we'll treat invalid tokens as guests.
        req.user = null;
        next();
    }
};

const isAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Access denied. Authentication required.' });
    }
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }
    next();
};

module.exports = { verifyToken, isAdmin };
