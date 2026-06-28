const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'lab-portal-secret-key-2024';

/**
 * Authentication middleware - verifies JWT Bearer token.
 * Adds decoded user payload to req.user on success.
 */
function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: 'Access denied. No authorization header provided.' });
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({ error: 'Access denied. Invalid authorization format. Use: Bearer <token>' });
    }

    const token = parts[1];

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token has expired. Please login again.' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token. Please login again.' });
    }
    return res.status(500).json({ error: 'Authentication failed.' });
  }
}

/**
 * Admin authorization middleware - must be used AFTER authenticate.
 * Checks that the authenticated user has the 'admin' role.
 */
function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
  }

  next();
}

module.exports = { authenticate, requireAdmin, JWT_SECRET };
