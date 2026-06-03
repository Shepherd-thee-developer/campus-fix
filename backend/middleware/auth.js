const jwt = require('jsonwebtoken');
const db = require('../db/pool'); // or your db module

module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  console.log('Auth header:', authHeader);  // DEBUG

  if (!authHeader) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  console.log('Token:', token);  // DEBUG

  try {
    // Check blacklist (if table exists)
    const blacklistCheck = await db.query('SELECT * FROM token_blacklist WHERE token = $1', [token]);
    if (blacklistCheck.rows.length > 0) {
      return res.status(401).json({ error: 'Token invalidated' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded user:', decoded);  // DEBUG
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Auth error:', err.message);
    return res.status(401).json({ error: 'Invalid token' });
  }
};