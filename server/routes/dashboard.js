const express = require('express');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/dashboard/stats
 * Returns aggregate statistics for the dashboard:
 * - Total counts for each resource
 * - People grouped by category
 * - Projects grouped by status
 * - Publications grouped by year
 * - Inventory grouped by class
 * - Recent 5 entries from each table
 */
router.get('/stats', authenticate, (req, res) => {
  try {
    const db = req.app.locals.db;

    // Total counts
    const totalPeople = db.prepare('SELECT COUNT(*) as count FROM people').get().count;
    const totalProjects = db.prepare('SELECT COUNT(*) as count FROM projects').get().count;
    const totalPublications = db.prepare('SELECT COUNT(*) as count FROM publications').get().count;
    const totalInventory = db.prepare('SELECT COUNT(*) as count FROM inventory').get().count;

    // People grouped by category
    const peopleByCategory = db.prepare(
      'SELECT category, COUNT(*) as count FROM people GROUP BY category ORDER BY count DESC'
    ).all();

    // People grouped by status
    const peopleByStatus = db.prepare(
      'SELECT status, COUNT(*) as count FROM people GROUP BY status ORDER BY count DESC'
    ).all();

    // Projects grouped by status
    const projectsByStatus = db.prepare(
      'SELECT status, COUNT(*) as count FROM projects GROUP BY status ORDER BY count DESC'
    ).all();

    // Projects grouped by report_status
    const projectsByReportStatus = db.prepare(
      'SELECT report_status, COUNT(*) as count FROM projects GROUP BY report_status ORDER BY count DESC'
    ).all();

    // Publications grouped by year
    const publicationsByYear = db.prepare(
      'SELECT year, COUNT(*) as count FROM publications GROUP BY year ORDER BY year DESC'
    ).all();

    // Inventory grouped by class
    const inventoryByClass = db.prepare(
      'SELECT inventory_class, COUNT(*) as count, SUM(price * qty) as total_value FROM inventory GROUP BY inventory_class ORDER BY count DESC'
    ).all();

    // Recent 5 entries from each table
    const recentPeople = db.prepare(
      'SELECT * FROM people ORDER BY id DESC LIMIT 5'
    ).all();

    const recentProjects = db.prepare(
      'SELECT * FROM projects ORDER BY id DESC LIMIT 5'
    ).all();

    const recentPublications = db.prepare(`
      SELECT pub.*, proj.project_name
      FROM publications pub
      LEFT JOIN projects proj ON pub.project_id = proj.id
      ORDER BY pub.id DESC LIMIT 5
    `).all();

    const recentInventory = db.prepare(
      'SELECT * FROM inventory ORDER BY id DESC LIMIT 5'
    ).all();

    res.json({
      totals: {
        people: totalPeople,
        projects: totalProjects,
        publications: totalPublications,
        inventory: totalInventory
      },
      peopleByCategory,
      peopleByStatus,
      projectsByStatus,
      projectsByReportStatus,
      publicationsByYear,
      inventoryByClass,
      recent: {
        people: recentPeople,
        projects: recentProjects,
        publications: recentPublications,
        inventory: recentInventory
      }
    });
  } catch (err) {
    console.error('Error fetching dashboard stats:', err.message);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics.' });
  }
});

module.exports = router;
