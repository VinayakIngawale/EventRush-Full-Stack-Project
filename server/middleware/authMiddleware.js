const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
    // Check for token in x-auth-token or Authorization header
    let token = req.header('x-auth-token');

    if (!token && req.header('Authorization')) {
        const authHeader = req.header('Authorization');
        if (authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7).trim();
        } else {
            token = authHeader.trim();
        }
    }

    // Check if no token
    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    const secret = process.env.JWT_SECRET || 'thisisareallylongandsecretstringforjwt';

    // Verify token
    try {
        const decoded = jwt.verify(token, secret);
        req.user = decoded.user;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ msg: 'Token expired, please log in again' });
        }
        res.status(401).json({ msg: 'Token is not valid' });
    }
};
