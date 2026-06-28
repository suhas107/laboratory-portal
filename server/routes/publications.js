const express = require('express');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/publications
 * List all publications with optional filters: ?search=, ?year=, ?project_id=
 * JOINs with projects table to include project_name.
 */
router.get('/', authenticate, (req, res) => {
  try {
    const db = req.app.locals.db;
    const { search, year, project_id } = req.query;

    let sql = `
      SELECT pub.*, proj.project_name, proj.project_code
      FROM publications pub
      LEFT JOIN projects proj ON pub.project_id = proj.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      sql += ' AND (pub.title LIKE ? OR pub.journal LIKE ? OR pub.authors LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (year) {
      sql += ' AND pub.year = ?';
      params.push(parseInt(year, 10));
    }

    if (project_id) {
      sql += ' AND pub.project_id = ?';
      params.push(parseInt(project_id, 10));
    }

    sql += ' ORDER BY pub.year DESC, pub.id DESC';

    const publications = db.prepare(sql).all(...params);
    res.json({ data: publications, total: publications.length });
  } catch (err) {
    console.error('Error fetching publications:', err.message);
    res.status(500).json({ error: 'Failed to fetch publications.' });
  }
});

/**
 * GET /api/publications/:id
 * Get a single publication by ID with project details.
 */
router.get('/:id', authenticate, (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;

    const publication = db.prepare(`
      SELECT pub.*, proj.project_name, proj.project_code
      FROM publications pub
      LEFT JOIN projects proj ON pub.project_id = proj.id
      WHERE pub.id = ?
    `).get(id);

    if (!publication) {
      return res.status(404).json({ error: 'Publication not found.' });
    }

    res.json({ data: publication });
  } catch (err) {
    console.error('Error fetching publication:', err.message);
    res.status(500).json({ error: 'Failed to fetch publication.' });
  }
});

/**
 * POST /api/publications
 * Create a new publication (admin only).
 */
router.post('/', authenticate, requireAdmin, (req, res) => {
  try {
    const db = req.app.locals.db;
    const { title, project_id, year, journal, naas_score, authors } = req.body;

    if (!title || !year || !journal) {
      return res.status(400).json({ error: 'title, year, and journal are required.' });
    }

    if (!Number.isInteger(year) || year < 1900 || year > 2100) {
      return res.status(400).json({ error: 'year must be a valid integer between 1900 and 2100.' });
    }

    // Validate project_id exists if provided
    if (project_id) {
      const project = db.prepare('SELECT id FROM projects WHERE id = ?').get(project_id);
      if (!project) {
        return res.status(400).json({ error: 'Referenced project does not exist.' });
      }
    }

    const stmt = db.prepare(`
      INSERT INTO publications (title, project_id, year, journal, naas_score, authors)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      title, project_id || null, year, journal,
      naas_score || null, authors || null
    );

    const newPub = db.prepare(`
      SELECT pub.*, proj.project_name, proj.project_code
      FROM publications pub
      LEFT JOIN projects proj ON pub.project_id = proj.id
      WHERE pub.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json({ message: 'Publication created successfully.', data: newPub });
  } catch (err) {
    console.error('Error creating publication:', err.message);
    res.status(500).json({ error: 'Failed to create publication.' });
  }
});

/**
 * PUT /api/publications/:id
 * Update a publication (admin only).
 */
router.put('/:id', authenticate, requireAdmin, (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;
    const { title, project_id, year, journal, naas_score, authors } = req.body;

    const existing = db.prepare('SELECT * FROM publications WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Publication not found.' });
    }

    const updatedYear = year !== undefined ? year : existing.year;
    if (!Number.isInteger(updatedYear) || updatedYear < 1900 || updatedYear > 2100) {
      return res.status(400).json({ error: 'year must be a valid integer between 1900 and 2100.' });
    }

    // Validate project_id if provided and changed
    if (project_id !== undefined && project_id !== null && project_id !== existing.project_id) {
      const project = db.prepare('SELECT id FROM projects WHERE id = ?').get(project_id);
      if (!project) {
        return res.status(400).json({ error: 'Referenced project does not exist.' });
      }
    }

    const stmt = db.prepare(`
      UPDATE publications
      SET title = ?, project_id = ?, year = ?, journal = ?, naas_score = ?, authors = ?
      WHERE id = ?
    `);

    stmt.run(
      title || existing.title,
      project_id !== undefined ? project_id : existing.project_id,
      updatedYear,
      journal || existing.journal,
      naas_score !== undefined ? naas_score : existing.naas_score,
      authors !== undefined ? authors : existing.authors,
      id
    );

    const updated = db.prepare(`
      SELECT pub.*, proj.project_name, proj.project_code
      FROM publications pub
      LEFT JOIN projects proj ON pub.project_id = proj.id
      WHERE pub.id = ?
    `).get(id);

    res.json({ message: 'Publication updated successfully.', data: updated });
  } catch (err) {
    console.error('Error updating publication:', err.message);
    res.status(500).json({ error: 'Failed to update publication.' });
  }
});

/**
 * DELETE /api/publications/:id
 * Delete a publication (admin only).
 */
router.delete('/:id', authenticate, requireAdmin, (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;

    const existing = db.prepare('SELECT * FROM publications WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Publication not found.' });
    }

    db.prepare('DELETE FROM publications WHERE id = ?').run(id);
    res.json({ message: 'Publication deleted successfully.' });
  } catch (err) {
    console.error('Error deleting publication:', err.message);
    res.status(500).json({ error: 'Failed to delete publication.' });
  }
});

module.exports = router;
