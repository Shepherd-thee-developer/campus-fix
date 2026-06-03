const express = require('express');
const authMiddleware = require('../middleware/auth');
const db = require('../db/pool');
const upload = require('../middleware/upload');

const router = express.Router();

// GET all requests (admin sees all, user sees own)
router.get('/', authMiddleware, async (req, res) => {
  const isAdmin = req.user.role === 'admin';
  let query = 'SELECT * FROM maintenance_requests';
  const params = [];
  if (!isAdmin) {
    query += ' WHERE user_id = $1';
    params.push(req.user.id);
  }
  query += ' ORDER BY created_at DESC';
  const result = await db.query(query, params);
  res.json(result.rows);
});

// POST new request with optional image
router.post('/', authMiddleware, upload.single('image'), async (req, res) => {
  const { title } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
  try {
    const result = await db.query(
      'INSERT INTO maintenance_requests (title, user_id, image_url) VALUES ($1, $2, $3) RETURNING *',
      [title, req.user.id, imageUrl]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create request' });
  }
});

// PUT update request (admin only)
router.put('/:id', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }
  const { status, assigned_to } = req.body;
  const result = await db.query(
    'UPDATE maintenance_requests SET status = $1, assigned_to = $2 WHERE id = $3 RETURNING *',
    [status, assigned_to, req.params.id]
  );
  res.json(result.rows[0]);
});

// DELETE a maintenance request (admin only)
router.delete('/:id', authMiddleware, async (req, res) => {
  // Only admins can delete
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid request ID' });
  }
  try {
    // Optional: get image_url to delete file
    const imageResult = await db.query('SELECT image_url FROM maintenance_requests WHERE id = $1', [id]);
    if (imageResult.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }
    const imageUrl = imageResult.rows[0].image_url;
    // Delete from database
    await db.query('DELETE FROM maintenance_requests WHERE id = $1', [id]);
    // Delete image file if exists (optional)
    if (imageUrl) {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(__dirname, '..', imageUrl);
      fs.unlink(filePath, (err) => {
        if (err) console.error('Failed to delete image file:', err);
      });
    }
    res.status(204).send(); // No content
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: 'Failed to delete request' });
  }
});
module.exports = router;