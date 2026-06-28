const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const { authenticate, requireAdmin, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/auth/login
 * Authenticate user and return JWT token, or prompt for 2FA if enabled.
 */
router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    const db = req.app.locals.db;
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const isValidPassword = bcrypt.compareSync(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    if (user.is_approved !== 1) {
      return res.status(403).json({ error: 'Your account is pending admin approval. Please check back later.' });
    }

    const tokenPayload = {
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      role: user.role
    };

    if (user.two_factor_enabled === 1) {
      // 2FA is enabled, issue a temporary token strictly for the /login/verify step
      const tempToken = jwt.sign({ ...tokenPayload, is2faPending: true }, JWT_SECRET, { expiresIn: '5m' });
      return res.json({ requires2FA: true, tempToken, message: '2FA code required.' });
    }

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '24h' });

    res.json({
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Internal server error during login.' });
  }
});

/**
 * POST /api/auth/login/verify
 * Finalize login by verifying the 6-digit TOTP code.
 */
router.post('/login/verify', (req, res) => {
  try {
    const { tempToken, code } = req.body;

    if (!tempToken || !code) {
      return res.status(400).json({ error: 'Temporary token and 2FA code are required.' });
    }

    let payload;
    try {
      payload = jwt.verify(tempToken, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: 'Temporary token expired or invalid.' });
    }

    if (!payload.is2faPending) {
      return res.status(400).json({ error: 'Invalid token type for 2FA verification.' });
    }

    const db = req.app.locals.db;
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(payload.id);

    if (!user || user.two_factor_enabled !== 1) {
      return res.status(400).json({ error: '2FA is not enabled for this user.' });
    }

    const isValid = speakeasy.totp.verify({
      secret: user.two_factor_secret,
      encoding: 'base32',
      token: code,
      window: 1 // Allow 1 step before/after (30 sec tolerance)
    });
    
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid 2FA code.' });
    }

    const finalTokenPayload = {
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      role: user.role
    };

    const token = jwt.sign(finalTokenPayload, JWT_SECRET, { expiresIn: '24h' });

    res.json({
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role: user.role
      }
    });
  } catch (err) {
    console.error('2FA verification error:', err.message);
    res.status(500).json({ error: 'Internal server error during 2FA verification.' });
  }
});

/**
 * POST /api/auth/2fa/setup
 * Generates a new 2FA secret and QR code for the authenticated user.
 */
router.post('/2fa/setup', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const db = req.app.locals.db;
    
    // Generate new secret
    const secret = speakeasy.generateSecret({ name: `ICAR-IIRR LabPortal (${req.user.username})` });
    
    // Save the secret temporarily (they must verify it to enable it)
    db.prepare('UPDATE users SET two_factor_secret = ? WHERE id = ?').run(secret.base32, userId);
    
    // Generate QR code data URL
    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);
    
    res.json({ secret: secret.base32, qrCodeUrl });
  } catch (err) {
    console.error('2FA setup error:', err.message);
    res.status(500).json({ error: 'Failed to setup 2FA.' });
  }
});

/**
 * POST /api/auth/2fa/enable
 * Verifies the user's first code to permanently enable 2FA on their account.
 */
router.post('/2fa/enable', authenticate, (req, res) => {
  try {
    const { code } = req.body;
    const userId = req.user.id;
    
    if (!code) {
      return res.status(400).json({ error: '2FA code is required.' });
    }

    const db = req.app.locals.db;
    const user = db.prepare('SELECT two_factor_secret FROM users WHERE id = ?').get(userId);

    if (!user || !user.two_factor_secret) {
      return res.status(400).json({ error: '2FA setup not initiated.' });
    }

    const isValid = speakeasy.totp.verify({
      secret: user.two_factor_secret,
      encoding: 'base32',
      token: code,
      window: 1
    });
    
    if (isValid) {
      db.prepare('UPDATE users SET two_factor_enabled = 1 WHERE id = ?').run(userId);
      res.json({ message: '2FA has been successfully enabled.' });
    } else {
      res.status(400).json({ error: 'Invalid verification code.' });
    }
  } catch (err) {
    console.error('2FA enable error:', err.message);
    res.status(500).json({ error: 'Failed to enable 2FA.' });
  }
});

/**
 * POST /api/auth/register
 * Create a new user (admin only).
 */
router.post('/register', authenticate, requireAdmin, (req, res) => {
  try {
    const { username, password, full_name, role } = req.body;

    if (!username || !password || !full_name) {
      return res.status(400).json({ error: 'Username, password, and full_name are required.' });
    }

    if (username.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters long.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const validRoles = ['admin', 'viewer'];
    const userRole = role || 'viewer';
    if (!validRoles.includes(userRole)) {
      return res.status(400).json({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
    }

    const db = req.app.locals.db;

    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existing) {
      return res.status(409).json({ error: 'Username already exists.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const password_hash = bcrypt.hashSync(password, salt);

    const stmt = db.prepare(
      'INSERT INTO users (username, password_hash, full_name, role) VALUES (?, ?, ?, ?)'
    );
    const result = stmt.run(username, password_hash, full_name, userRole);

    res.status(201).json({
      message: 'User registered successfully.',
      user: {
        id: result.lastInsertRowid,
        username,
        full_name,
        role: userRole
      }
    });
  } catch (err) {
    console.error('Registration error:', err.message);
    res.status(500).json({ error: 'Internal server error during registration.' });
  }
});
/**
 * POST /api/auth/signup
 * Public endpoint for self-registration. New users get role='viewer' and is_approved=0.
 */
router.post('/signup', (req, res) => {
  try {
    const { username, password, full_name } = req.body;

    if (!username || !password || !full_name) {
      return res.status(400).json({ error: 'Username, password, and full name are required.' });
    }
    if (username.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const db = req.app.locals.db;
    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existing) {
      return res.status(409).json({ error: 'Username already taken.' });
    }

    const password_hash = bcrypt.hashSync(password, 10);
    const stmt = db.prepare(
      'INSERT INTO users (username, password_hash, full_name, role, is_approved) VALUES (?, ?, ?, ?, ?)'
    );
    stmt.run(username, password_hash, full_name, 'viewer', 0);

    res.status(201).json({ message: 'Registration submitted! Awaiting admin approval.' });
  } catch (err) {
    console.error('Signup error:', err.message);
    res.status(500).json({ error: 'Internal server error during registration.' });
  }
});

/**
 * GET /api/auth/users
 * Admin-only. Returns all users with their approval status.
 */
router.get('/users', authenticate, requireAdmin, (req, res) => {
  try {
    const db = req.app.locals.db;
    const users = db.prepare(
      'SELECT id, username, full_name, role, is_approved, two_factor_enabled FROM users ORDER BY is_approved ASC, id DESC'
    ).all();
    res.json(users);
  } catch (err) {
    console.error('Get users error:', err.message);
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
});

/**
 * PUT /api/auth/users/:id/approve
 * Admin-only. Approves a pending user.
 */
router.put('/users/:id/approve', authenticate, requireAdmin, (req, res) => {
  try {
    const db = req.app.locals.db;
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    db.prepare('UPDATE users SET is_approved = 1 WHERE id = ?').run(req.params.id);
    res.json({ message: `User ${user.username} has been approved.` });
  } catch (err) {
    console.error('Approve user error:', err.message);
    res.status(500).json({ error: 'Failed to approve user.' });
  }
});

/**
 * PUT /api/auth/users/:id/reject
 * Admin-only. Rejects (deletes) a pending user.
 */
router.put('/users/:id/reject', authenticate, requireAdmin, (req, res) => {
  try {
    const db = req.app.locals.db;
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    if (user.role === 'admin') {
      return res.status(403).json({ error: 'Cannot delete an admin user.' });
    }
    db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
    res.json({ message: `User ${user.username} has been removed.` });
  } catch (err) {
    console.error('Reject user error:', err.message);
    res.status(500).json({ error: 'Failed to reject user.' });
  }
});

module.exports = router;
