module.exports = function errorHandler(err, req, res, _next) {
  const status = err.status || 500;
  const isProd = process.env.NODE_ENV === 'production';

  // Normalizar mensajes CORS
  if (err.message === 'CORS_NOT_ALLOWED') {
    return res.status(403).json({
      error: 'Origen no permitido',
      requestId: req.requestId
    });
  }

  // Estructura uniforme
  const payload = {
    error: status >= 500 ? 'Internal Server Error' : err.message || 'Error',
    requestId: req.requestId
  };

  if (!isProd && err.stack) {
    payload.stack = err.stack;
  }

  console.error(`[${req.requestId}]`, err);
  res.status(status).json(payload);
};