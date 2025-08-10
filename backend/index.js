require('dotenv').config();

// Solo cargar cron jobs fuera de tests
if (process.env.NODE_ENV !== 'test') {
  require('./cron/cleanupJob');
  require('./cron/alertJob');
}

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

const authRoutes = require('./routes/auth');
const convertRoutes = require('./routes/convert');
const alertRoutes = require('./routes/alert');
const monedasRoutes = require('./routes/monedas');
const dashboardRoutes = require('./routes/dashboard');
const calculatorRoutes = require('./routes/calculator');
const favoritesRoutes = require('./routes/favorites');
const favoriteCurrenciesRoutes = require('./routes/favoriteCurrencies');
const activityLogsRoutes = require('./routes/activityLogs');
const exchangeController = require('./controllers/exchangeController');
const Conversion = require('./models/Conversion');

// Rutas
app.use('/api', convertRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/monedas', monedasRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/calculator', calculatorRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/favorite-currencies', favoriteCurrenciesRoutes);
app.use('/api/activity-logs', activityLogsRoutes);
app.get('/api/exchange/rates', exchangeController.getExchangeRates);

// Health
app.get('/health', (req, res) => res.json({ status: 'ok' }));

module.exports = app;

// Arranque sólo fuera de tests
if (require.main === module) {
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => console.log('API listening on', PORT));

  if (process.env.MONGODB_URI) {
    mongoose.connect(process.env.MONGODB_URI)
      .then(async () => {
        console.log('✅ Conectado a MongoDB');
        try {
          const sixtyDaysAgo = new Date();
          sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
          const result = await Conversion.deleteMany({ createdAt: { $lt: sixtyDaysAgo } });
          console.log(`🧹 Limpieza inicial: ${result.deletedCount} registros eliminados`);
        } catch (err) {
          console.error('❌ Error limpieza inicial:', err.message);
        }
      })
      .catch(err => console.error('❌ Error conectando a MongoDB:', err.message));
  } else {
    console.warn('⚠ MONGODB_URI no definido');
  }
}
