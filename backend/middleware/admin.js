// backend/middleware/admin.js
module.exports = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next(); // user is admin, proceed
  } else {
    res.status(403).json({ error: 'Admin access required' });
  }
};