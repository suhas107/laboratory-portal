require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const app = express();
const PORT = process.env.PORT || 5000;

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
});

// ---------------------------------------------------------------------------
// Database Initialization
// ---------------------------------------------------------------------------
const dbPath = path.join(__dirname, 'db', 'laboratory.db');
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Read and execute schema
const schemaPath = path.join(__dirname, 'db', 'schema.sql');
const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
db.exec(schemaSql);
console.log('✓ Database schema initialized.');

// Seed data if users table is empty
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
if (userCount.count === 0) {
  const bcrypt = require('bcryptjs'); // Only require if needed for seeding
  const adminUser = process.env.ADMIN_USERNAME || 'admin';
  const adminPass = process.env.ADMIN_PASSWORD || 'admin123';
  const adminName = process.env.ADMIN_FULL_NAME || 'Admin';
  
  const hashedPassword = bcrypt.hashSync(adminPass, 10);
  
  const stmt = db.prepare(`
    INSERT INTO users (username, password_hash, full_name, role, is_approved, two_factor_enabled, two_factor_secret)
    VALUES (?, ?, ?, 'admin', 1, 0, NULL)
  `);
  stmt.run(adminUser, hashedPassword, adminName);
  
  console.log(`✓ Initial Admin account created (${adminUser}). 2FA is disabled for first login.`);
} else {
  console.log('✓ Database already contains data. Skipping seed.');
}

// Store db instance on app for route access
app.locals.db = db;

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
const authRoutes = require('./routes/auth');
const peopleRoutes = require('./routes/people');
const projectsRoutes = require('./routes/projects');
const publicationsRoutes = require('./routes/publications');
const inventoryRoutes = require('./routes/inventory');
const dashboardRoutes = require('./routes/dashboard');
const reportsRoutes = require('./routes/reports');
const { initCronJobs } = require('./services/cron');

app.use('/api/auth', authRoutes);
app.use('/api/people', peopleRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/publications', publicationsRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportsRoutes);

// Health check endpoint (no auth required)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// ---------------------------------------------------------------------------
// Error Handling
// ---------------------------------------------------------------------------

// 404 handler for unmatched API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: `API endpoint not found: ${req.method} ${req.originalUrl}` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error.' });
});

// ---------------------------------------------------------------------------
// Start Server
// ---------------------------------------------------------------------------
app.listen(PORT, () => {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  ICAR-IIRR Laboratory Management Portal - Backend');
  console.log(`  Server running on http://localhost:${PORT}`);
  console.log(`  Database: ${dbPath}`);
  console.log('═══════════════════════════════════════════════════════');
  
  // Start background jobs
  initCronJobs();
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down gracefully...');
  db.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nShutting down gracefully...');
  db.close();
  process.exit(0);
});

module.exports = app;
