const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/authMiddleware');
const {
  getActivityLogs,
  getActivityStats,
  getAvailableActions
} = require('../controllers/activityLogController');

// Todas las rutas requieren autenticación
router.use(requireAuth);

// Obtener logs de actividad del usuario (con filtros y paginación)
// Query params: action, days, limit, page
router.get('/', getActivityLogs);

// Obtener estadísticas de actividad del usuario
// Query params: days
router.get('/stats', getActivityStats);

// Obtener lista de acciones disponibles para filtros
router.get('/actions', getAvailableActions);

module.exports = router;
