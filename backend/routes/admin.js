const express = require('express');
const pool = require('../db/pool');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const router = express.Router();

// Get all users (admin only)
router.get('/users', auth, admin, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, email, role FROM users ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
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

module.exports = router;