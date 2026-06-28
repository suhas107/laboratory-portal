const express = require('express');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

const VALID_REPORT_STATUSES = ['Pending', 'Submitted', 'Approved', 'Overdue'];
const VALID_STATUSES = ['Active', 'Completed', 'On Hold'];

/**
 * GET /api/projects
 * List all projects with optional filters: ?search=, ?type=, ?status=, ?report_status=
 */
router.get('/', authenticate, (req, res) => {
  try {
    const db = req.app.locals.db;
    const { search, type, status, report_status } = req.query;

    let sql = 'SELECT * FROM projects WHERE 1=1';
    const params = [];

    if (search) {
      sql += ' AND (project_name LIKE ? OR project_code LIKE ? OR funding_source LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (type) {
      sql += ' AND type_of_project = ?';
      params.push(type);
    }

    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }

    if (report_status) {
      sql += ' AND report_status = ?';
      params.push(report_status);
    }

    sql += ' ORDER BY id DESC';

    const projects = db.prepare(sql).all(...params);
    res.json({ data: projects, total: projects.length });
  } catch (err) {
    console.error('Error fetching projects:', err.message);
    res.status(500).json({ error: 'Failed to fetch projects.' });
  }
});

/**
 * GET /api/projects/:id
 * Get a single project by ID.
 */
router.get('/:id', authenticate, (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;

    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    res.json({ data: project });
  } catch (err) {
    console.error('Error fetching project:', err.message);
    res.status(500).json({ error: 'Failed to fetch project.' });
  }
});

/**
 * POST /api/projects
 * Create a new project (admin only).
 */
router.post('/', authenticate, requireAdmin, (req, res) => {
  try {
    const db = req.app.locals.db;
    const {
      project_name, project_code, type_of_project, funding_source,
      date_of_start, date_of_closing, report_status, status
    } = req.body;

    if (!project_name || !project_code || !type_of_project) {
      return res.status(400).json({ error: 'project_name, project_code, and type_of_project are required.' });
    }

    const projectStatus = status || 'Active';
    if (!VALID_STATUSES.includes(projectStatus)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` });
    }

    const projectReportStatus = report_status || 'Pending';
    if (!VALID_REPORT_STATUSES.includes(projectReportStatus)) {
      return res.status(400).json({ error: `Invalid report_status. Must be one of: ${VALID_REPORT_STATUSES.join(', ')}` });
    }

    // Check for duplicate project_code
    const existing = db.prepare('SELECT id FROM projects WHERE project_code = ?').get(project_code);
    if (existing) {
      return res.status(409).json({ error: 'A project with this project_code already exists.' });
    }

    const stmt = db.prepare(`
      INSERT INTO projects (project_name, project_code, type_of_project, funding_source,
        date_of_start, date_of_closing, report_status, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      project_name, project_code, type_of_project,
      funding_source || null, date_of_start || null, date_of_closing || null,
      projectReportStatus, projectStatus
    );

    const newProject = db.prepare('SELECT * FROM projects WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ message: 'Project created successfully.', data: newProject });
  } catch (err) {
    console.error('Error creating project:', err.message);
    res.status(500).json({ error: 'Failed to create project.' });
  }
});

/**
 * PUT /api/projects/:id
 * Update a project (admin only).
 */
router.put('/:id', authenticate, requireAdmin, (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;
    const {
      project_name, project_code, type_of_project, funding_source,
      date_of_start, date_of_closing, report_status, status
    } = req.body;

    const existing = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` });
    }

    if (report_status && !VALID_REPORT_STATUSES.includes(report_status)) {
      return res.status(400).json({ error: `Invalid report_status. Must be one of: ${VALID_REPORT_STATUSES.join(', ')}` });
    }

    // Check for duplicate project_code if it's being changed
    if (project_code && project_code !== existing.project_code) {
      const duplicate = db.prepare('SELECT id FROM projects WHERE project_code = ? AND id != ?').get(project_code, id);
      if (duplicate) {
        return res.status(409).json({ error: 'A project with this project_code already exists.' });
      }
    }

    const stmt = db.prepare(`
      UPDATE projects
      SET project_name = ?, project_code = ?, type_of_project = ?, funding_source = ?,
          date_of_start = ?, date_of_closing = ?, report_status = ?, status = ?
      WHERE id = ?
    `);

    stmt.run(
      project_name || existing.project_name,
      project_code || existing.project_code,
      type_of_project || existing.type_of_project,
      funding_source !== undefined ? funding_source : existing.funding_source,
      date_of_start !== undefined ? date_of_start : existing.date_of_start,
      date_of_closing !== undefined ? date_of_closing : existing.date_of_closing,
      report_status || existing.report_status,
      status || existing.status,
      id
    );

    const updated = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
    res.json({ message: 'Project updated successfully.', data: updated });
  } catch (err) {
    console.error('Error updating project:', err.message);
    res.status(500).json({ error: 'Failed to update project.' });
  }
});

/**
 * DELETE /api/projects/:id
 * Delete a project (admin only).
 */
router.delete('/:id', authenticate, requireAdmin, (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;

    const existing = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    db.prepare('DELETE FROM projects WHERE id = ?').run(id);
    res.json({ message: 'Project deleted successfully.' });
  } catch (err) {
    console.error('Error deleting project:', err.message);
    res.status(500).json({ error: 'Failed to delete project.' });
  }
});

module.exports = router;
