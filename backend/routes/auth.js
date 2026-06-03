const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db/pool');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  const { email, password, name, role } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  try {
    const hashed = await bcrypt.hash(password, 10);
    // Changed 'password_hash' to 'password' (adjust to your actual column name)
    const result = await db.query(
      'INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, role',
      [email, hashed, name, role || 'user']
    );
    res.status(201).json({ user: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  console.log('Login attempt:', req.body);
  const { email, password } = req.body;
  try {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const user = result.rows[0];
    // Changed 'user.password_hash' to 'user.password'
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    res.json({ token, user: { id: user.id, email: user.email, role: user.role, name: user.name } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Logout (blacklist token)
router.post('/logout', authMiddleware, async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(400).json({ error: 'No token provided' });
  }
  try {
    const decoded = jwt.decode(token);
    const expiresAt = new Date(decoded.exp * 1000);
    // Ensure token_blacklist table exists (create if not)
    await db.query(
      'INSERT INTO token_blacklist (token, expires_at) VALUES ($1, $2)',
      [token, expiresAt]
    );
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ error: 'Logout failed' });
  }
});

module.exports = router;