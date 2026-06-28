const express = require('express');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

const VALID_CLASSES = [
  'Permanent Equipment', 'Semi-Permanent', 'Chemicals',
  'Glassware', 'Plastic Ware', 'Miscellaneous'
];

/**
 * GET /api/inventory
 * List all inventory items with optional filters: ?search=, ?inventory_class=
 */
router.get('/', authenticate, (req, res) => {
  try {
    const db = req.app.locals.db;
    const { search, inventory_class } = req.query;

    let sql = 'SELECT * FROM inventory WHERE 1=1';
    const params = [];

    if (search) {
      sql += ' AND (item_name LIKE ? OR make LIKE ? OR model LIKE ? OR cat_no LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (inventory_class) {
      sql += ' AND inventory_class = ?';
      params.push(inventory_class);
    }

    sql += ' ORDER BY id DESC';

    const items = db.prepare(sql).all(...params);
    res.json({ data: items, total: items.length });
  } catch (err) {
    console.error('Error fetching inventory:', err.message);
    res.status(500).json({ error: 'Failed to fetch inventory items.' });
  }
});

/**
 * GET /api/inventory/:id
 * Get a single inventory item by ID.
 */
router.get('/:id', authenticate, (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;

    const item = db.prepare('SELECT * FROM inventory WHERE id = ?').get(id);
    if (!item) {
      return res.status(404).json({ error: 'Inventory item not found.' });
    }

    res.json({ data: item });
  } catch (err) {
    console.error('Error fetching inventory item:', err.message);
    res.status(500).json({ error: 'Failed to fetch inventory item.' });
  }
});

/**
 * POST /api/inventory
 * Create a new inventory item (admin only).
 */
router.post('/', authenticate, requireAdmin, (req, res) => {
  try {
    const db = req.app.locals.db;
    const {
      item_name, inventory_class, date_of_purchase, make, model,
      cat_no, qty, price, total_qty_in_stock
    } = req.body;

    if (!item_name || !inventory_class) {
      return res.status(400).json({ error: 'item_name and inventory_class are required.' });
    }

    if (!VALID_CLASSES.includes(inventory_class)) {
      return res.status(400).json({ error: `Invalid inventory_class. Must be one of: ${VALID_CLASSES.join(', ')}` });
    }

    if (qty !== undefined && (typeof qty !== 'number' || qty < 0)) {
      return res.status(400).json({ error: 'qty must be a non-negative number.' });
    }

    if (price !== undefined && (typeof price !== 'number' || price < 0)) {
      return res.status(400).json({ error: 'price must be a non-negative number.' });
    }

    const stmt = db.prepare(`
      INSERT INTO inventory (item_name, inventory_class, date_of_purchase, make, model,
        cat_no, qty, price, total_qty_in_stock)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      item_name, inventory_class, date_of_purchase || null,
      make || null, model || null, cat_no || null,
      qty || 0, price || 0, total_qty_in_stock || 0
    );

    const newItem = db.prepare('SELECT * FROM inventory WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ message: 'Inventory item created successfully.', data: newItem });
  } catch (err) {
    console.error('Error creating inventory item:', err.message);
    res.status(500).json({ error: 'Failed to create inventory item.' });
  }
});

/**
 * PUT /api/inventory/:id
 * Update an inventory item (admin only).
 */
router.put('/:id', authenticate, requireAdmin, (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;
    const {
      item_name, inventory_class, date_of_purchase, make, model,
      cat_no, qty, price, total_qty_in_stock
    } = req.body;

    const existing = db.prepare('SELECT * FROM inventory WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Inventory item not found.' });
    }

    if (inventory_class && !VALID_CLASSES.includes(inventory_class)) {
      return res.status(400).json({ error: `Invalid inventory_class. Must be one of: ${VALID_CLASSES.join(', ')}` });
    }

    if (qty !== undefined && (typeof qty !== 'number' || qty < 0)) {
      return res.status(400).json({ error: 'qty must be a non-negative number.' });
    }

    if (price !== undefined && (typeof price !== 'number' || price < 0)) {
      return res.status(400).json({ error: 'price must be a non-negative number.' });
    }

    const stmt = db.prepare(`
      UPDATE inventory
      SET item_name = ?, inventory_class = ?, date_of_purchase = ?, make = ?, model = ?,
          cat_no = ?, qty = ?, price = ?, total_qty_in_stock = ?
      WHERE id = ?
    `);

    stmt.run(
      item_name || existing.item_name,
      inventory_class || existing.inventory_class,
      date_of_purchase !== undefined ? date_of_purchase : existing.date_of_purchase,
      make !== undefined ? make : existing.make,
      model !== undefined ? model : existing.model,
      cat_no !== undefined ? cat_no : existing.cat_no,
      qty !== undefined ? qty : existing.qty,
      price !== undefined ? price : existing.price,
      total_qty_in_stock !== undefined ? total_qty_in_stock : existing.total_qty_in_stock,
      id
    );

    const updated = db.prepare('SELECT * FROM inventory WHERE id = ?').get(id);
    res.json({ message: 'Inventory item updated successfully.', data: updated });
  } catch (err) {
    console.error('Error updating inventory item:', err.message);
    res.status(500).json({ error: 'Failed to update inventory item.' });
  }
});

/**
 * DELETE /api/inventory/:id
 * Delete an inventory item (admin only).
 */
router.delete('/:id', authenticate, requireAdmin, (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;

    const existing = db.prepare('SELECT * FROM inventory WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Inventory item not found.' });
    }

    db.prepare('DELETE FROM inventory WHERE id = ?').run(id);
    res.json({ message: 'Inventory item deleted successfully.' });
  } catch (err) {
    console.error('Error deleting inventory item:', err.message);
    res.status(500).json({ error: 'Failed to delete inventory item.' });
  }
});

module.exports = router;
