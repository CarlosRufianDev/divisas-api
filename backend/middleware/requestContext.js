const { randomUUID } = require('crypto');

module.exports = function requestContext(req, res, next) {
  const id = randomUUID();
  req.requestId = id;
  res.setHeader('X-Request-Id', id);
  const start = Date.now();

  res.on('finish', () => {
    const ms = Date.now() - start;
    if (process.env.NODE_ENV !== 'test') {
      console.log(`[${id}] ${req.method} ${req.originalUrl} ${res.statusCode} ${ms}ms`);
    }
  });

  next();
};