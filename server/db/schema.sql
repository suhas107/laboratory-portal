-- Laboratory Management Web Portal - Database Schema
-- All tables use SQLite with TEXT dates stored as ISO strings

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK(role IN ('admin', 'viewer')),
  two_factor_secret TEXT,
  two_factor_enabled INTEGER DEFAULT 0,
  is_approved INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS people (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('Lab Admin','Scientist','Technician','Post Doc','RA','SRF','JRF','Project Assistant','PhD Student','MSc Student')),
  email TEXT,
  phone TEXT,
  date_of_joining TEXT,
  date_of_relieving TEXT,
  status TEXT DEFAULT 'Active' CHECK(status IN ('Active','Relieved')),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_name TEXT NOT NULL,
  project_code TEXT UNIQUE NOT NULL,
  type_of_project TEXT NOT NULL,
  funding_source TEXT,
  date_of_start TEXT,
  date_of_closing TEXT,
  report_status TEXT DEFAULT 'Pending' CHECK(report_status IN ('Pending','Submitted','Approved','Overdue')),
  status TEXT DEFAULT 'Active' CHECK(status IN ('Active','Completed','On Hold')),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS publications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  project_id INTEGER,
  year INTEGER NOT NULL,
  journal TEXT NOT NULL,
  naas_score REAL,
  authors TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS inventory (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_name TEXT NOT NULL,
  inventory_class TEXT NOT NULL CHECK(inventory_class IN ('Permanent Equipment','Semi-Permanent','Chemicals','Glassware','Plastic Ware','Miscellaneous')),
  date_of_purchase TEXT,
  make TEXT,
  model TEXT,
  cat_no TEXT,
  qty INTEGER DEFAULT 0,
  price REAL DEFAULT 0,
  total_qty_in_stock INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
