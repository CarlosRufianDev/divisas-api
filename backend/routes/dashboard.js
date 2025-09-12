const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/authMiddleware');
const { getDashboard, getUserStats, getFavoriteTrends, logCurrencyFilter } = require('../controllers/dashboardController'); // ✅ IMPORTAR TODAS

router.get('/', requireAuth, getDashboard);
router.get('/stats', requireAuth, getUserStats); // ✅ NUEVA RUTA
router.get('/trends', requireAuth, getFavoriteTrends); // ✅ NUEVA RUTA
router.post('/log-filter', requireAuth, logCurrencyFilter); // 🆕 NUEVA RUTA PARA LOGGING

module.exports = router;
