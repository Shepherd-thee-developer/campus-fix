const express = require('express');
const pool = require('../db/pool');
const db = require('../db');  // this loads db/index.js
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const router = express.Router();
const authMiddleware = require('../middleware/auth');

// Get all users (admin only)
router.get('/stats', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  const statusQuery = await db.query(
    `SELECT status, COUNT(*) FROM maintenance_requests GROUP BY status`
  );
  const trendQuery = await db.query(`
    SELECT DATE(created_at) as date, COUNT(*) 
    FROM maintenance_requests 
    WHERE created_at >= NOW() - INTERVAL '7 days'
    GROUP BY DATE(created_at)
    ORDER BY date
  `);
  res.json({ status: statusQuery.rows, trend: trendQuery.rows });
});

// Delete any request (admin only)
router.delete('/requests/:id', auth, admin, async (req, res) => {
  try {
    await pool.query('DELETE FROM requests WHERE id = $1', [req.params.id]);
    res.json({ msg: 'Request deleted by admin' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update any request status (admin only)
router.put('/requests/:id/status', auth, admin, async (req, res) => {
  const { status } = req.body;
  try {
    const result = await pool.query(
      'UPDATE requests SET status = $1 WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET all maintenance requests (admin only)
router.get('/requests', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }
  const result = await db.query('SELECT * FROM maintenance_requests ORDER BY created_at DESC');
  res.json(result.rows);
});

module.exports = router;