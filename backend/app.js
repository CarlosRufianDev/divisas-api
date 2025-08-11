const express = require('express');
const app = express();

// Middlewares globales
app.use(express.json());

// rutas principales bajo /api/
app.use('/api/auth', require('./routes/auth'));
app.use('/api/alert', require('./routes/alert'));
app.use('/api/activity-logs', require('./routes/activityLogs'));
app.use('/api/calculator', require('./routes/calculator'));
app.use('/api/convert', require('./routes/convert'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/favorites', require('./routes/favorites'));
app.use('/api/favorite-currencies', require('./routes/favoriteCurrencies'));
app.use('/api/monedas', require('./routes/monedas'));

// Healthcheck
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Manejo de rutas no encontradas (404)
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

module.exports = app;
