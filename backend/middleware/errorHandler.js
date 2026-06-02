const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  if (err.code === 'ENOENT') {
    return res.status(500).json({ error: 'Uploads folder missing' });
  }
  if (err.code === '23502') { // PostgreSQL not-null violation
    return res.status(400).json({ error: `Missing required field: ${err.column}` });
  }
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  }

  res.status(500).json({ error: err.message });
};

module.exports = errorHandler;