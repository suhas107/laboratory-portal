const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'laboratory.db');
const db = new Database(dbPath);

try {
  console.log('Running migration: Add 2FA columns to users table...');
  db.exec('ALTER TABLE users ADD COLUMN two_factor_secret TEXT;');
  db.exec('ALTER TABLE users ADD COLUMN two_factor_enabled INTEGER DEFAULT 0;');
  console.log('Migration completed successfully.');
} catch (err) {
  if (err.message.includes('duplicate column name')) {
    console.log('Columns already exist. Migration skipped.');
  } else {
    console.error('Migration failed:', err.message);
  }
} finally {
  db.close();
}
