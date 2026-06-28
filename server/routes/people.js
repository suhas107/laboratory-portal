const express = require('express');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

const VALID_CATEGORIES = [
  'Lab Admin', 'Scientist', 'Technician', 'Post Doc', 'RA',
  'SRF', 'JRF', 'Project Assistant', 'PhD Student', 'MSc Student'
];
const VALID_STATUSES = ['Active', 'Relieved'];

/**
 * GET /api/people
 * List all people with optional filters: ?search=, ?category=, ?status=
 */
router.get('/', authenticate, (req, res) => {
  try {
    const db = req.app.locals.db;
    const { search, category, status } = req.query;

    let sql = 'SELECT * FROM people WHERE 1=1';
    const params = [];

    if (search) {
      sql += ' AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }

    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }

    sql += ' ORDER BY id DESC';

    const people = db.prepare(sql).all(...params);
    res.json({ data: people, total: people.length });
  } catch (err) {
    console.error('Error fetching people:', err.message);
    res.status(500).json({ error: 'Failed to fetch people.' });
  }
});

/**
 * GET /api/people/:id
 * Get a single person by ID.
 */
router.get('/:id', authenticate, (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;

    const person = db.prepare('SELECT * FROM people WHERE id = ?').get(id);
    if (!person) {
      return res.status(404).json({ error: 'Person not found.' });
    }

    res.json({ data: person });
  } catch (err) {
    console.error('Error fetching person:', err.message);
    res.status(500).json({ error: 'Failed to fetch person.' });
  }
});

/**
 * POST /api/people
 * Create a new person (admin only).
 */
router.post('/', authenticate, requireAdmin, (req, res) => {
  try {
    const db = req.app.locals.db;
    const { name, category, email, phone, date_of_joining, date_of_relieving, status } = req.body;

    if (!name || !category) {
      return res.status(400).json({ error: 'Name and category are required.' });
    }

    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({ error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}` });
    }

    const personStatus = status || 'Active';
    if (!VALID_STATUSES.includes(personStatus)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` });
    }

    const stmt = db.prepare(`
      INSERT INTO people (name, category, email, phone, date_of_joining, date_of_relieving, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      name, category, email || null, phone || null,
      date_of_joining || null, date_of_relieving || null, personStatus
    );

    const newPerson = db.prepare('SELECT * FROM people WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ message: 'Person created successfully.', data: newPerson });
  } catch (err) {
    console.error('Error creating person:', err.message);
    res.status(500).json({ error: 'Failed to create person.' });
  }
});

/**
 * PUT /api/people/:id
 * Update a person (admin only).
 */
router.put('/:id', authenticate, requireAdmin, (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;
    const { name, category, email, phone, date_of_joining, date_of_relieving, status } = req.body;

    const existing = db.prepare('SELECT * FROM people WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Person not found.' });
    }

    if (category && !VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({ error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}` });
    }

    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` });
    }

    const stmt = db.prepare(`
      UPDATE people
      SET name = ?, category = ?, email = ?, phone = ?,
          date_of_joining = ?, date_of_relieving = ?, status = ?
      WHERE id = ?
    `);

    stmt.run(
      name || existing.name,
      category || existing.category,
      email !== undefined ? email : existing.email,
      phone !== undefined ? phone : existing.phone,
      date_of_joining !== undefined ? date_of_joining : existing.date_of_joining,
      date_of_relieving !== undefined ? date_of_relieving : existing.date_of_relieving,
      status || existing.status,
      id
    );

    const updated = db.prepare('SELECT * FROM people WHERE id = ?').get(id);
    res.json({ message: 'Person updated successfully.', data: updated });
  } catch (err) {
    console.error('Error updating person:', err.message);
    res.status(500).json({ error: 'Failed to update person.' });
  }
});

/**
 * DELETE /api/people/:id
 * Delete a person (admin only).
 */
router.delete('/:id', authenticate, requireAdmin, (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;

    const existing = db.prepare('SELECT * FROM people WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Person not found.' });
    }

    db.prepare('DELETE FROM people WHERE id = ?').run(id);
    res.json({ message: 'Person deleted successfully.' });
  } catch (err) {
    console.error('Error deleting person:', err.message);
    res.status(500).json({ error: 'Failed to delete person.' });
  }
});

module.exports = router;
