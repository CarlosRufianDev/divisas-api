const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/authMiddleware');
const { getDashboard, getUserStats, getFavoriteTrends } = require('../controllers/dashboardController'); // ✅ IMPORTAR TODAS

router.get('/', requireAuth, getDashboard);
router.get('/stats', requireAuth, getUserStats);    // ✅ NUEVA RUTA
router.get('/trends', requireAuth, getFavoriteTrends); // ✅ NUEVA RUTA

module.exports = router;