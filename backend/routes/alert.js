const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/authMiddleware');
const Alert = require('../models/Alert');
const {
  createScheduledAlert,
  createPercentageAlert,
  createTargetAlert,
  getAlerts,
  updateAlert,
  deleteAlert,
  sendTestAlert
} = require('../controllers/alertController');

// ===== RUTAS ORIGINALES (mantener compatibilidad) =====

// Crear alerta programada (ruta original - mantener para compatibilidad)
router.post('/', requireAuth, async (req, res) => {
  const { from, to, intervalDays, hour } = req.body;

  // Validaciones básicas
  if (!from || !to) {
    return res.status(400).json({ error: 'Faltan monedas origen o destino' });
  }
  if (from === to) {
    return res.status(400).json({ error: 'La moneda de origen y destino deben ser diferentes' });
  }
  if (typeof intervalDays !== 'undefined' && (isNaN(intervalDays) || intervalDays < 1)) {
    return res.status(400).json({ error: 'intervalDays debe ser un número mayor o igual a 1' });
  }
  if (typeof hour !== 'undefined' && (isNaN(hour) || hour < 0 || hour > 23)) {
    return res.status(400).json({ error: 'hour debe ser un número entre 0 y 23' });
  }

  try {
    const alert = await Alert.create({
      user: req.user.userId,
      from,
      to,
      intervalDays: intervalDays || 1,
      hour: typeof hour === 'number' && hour >= 0 && hour <= 23 ? hour : 8,
      email: req.user.email,
      alertType: 'scheduled' // Asegurar que se marca como programada
    });
    res.json({ message: 'Alerta creada', alert });
  } catch (err) {
    res.status(500).json({ error: 'No se pudo crear la alerta' });
  }
});

// ===== NUEVAS RUTAS MEJORADAS =====

// Crear alerta programada (nueva versión del controlador)
router.post('/scheduled', requireAuth, createScheduledAlert);

// Crear alerta por porcentaje
router.post('/percentage', requireAuth, createPercentageAlert);

// Crear alerta por precio objetivo
router.post('/target', requireAuth, createTargetAlert);

// ===== RUTAS COMUNES =====

// Listar alertas del usuario (actualizada para mostrar nuevos campos)
router.get('/', requireAuth, getAlerts);

// Actualizar alerta (mantener funcionalidad original)
router.put('/:id', requireAuth, updateAlert);

// Eliminar alerta
router.delete('/:id', requireAuth, deleteAlert);

// Enviar test de alerta
router.post('/:id/test', requireAuth, sendTestAlert);

module.exports = router;
