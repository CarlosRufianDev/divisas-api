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
  deleteAlert 
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
router.post('/scheduled', createScheduledAlert);

// Crear alerta por porcentaje
router.post('/percentage', requireAuth, (req, res, next) => {
  console.log('🎯 Ejecutando ruta /percentage...');
  console.log('🎯 Usuario autenticado:', req.user);
  createPercentageAlert(req, res, next);
});

// Crear alerta por precio objetivo
router.post('/target', requireAuth, createTargetAlert);

// ===== RUTAS COMUNES =====

// Listar alertas del usuario (actualizada para mostrar nuevos campos)
router.get('/', requireAuth, async (req, res) => {
  const { from, to, hour } = req.query;
  const filter = { user: req.user.userId };

  if (from) filter.from = from.toUpperCase();
  if (to) filter.to = to.toUpperCase();
  if (typeof hour !== 'undefined') filter.hour = Number(hour);

  try {
    const alerts = await Alert.find(filter).sort({ hour: 1, createdAt: -1 });
    // Formatea la respuesta para mostrar todos los campos relevantes
    const result = alerts.map(alert => ({
      id: alert._id,
      from: alert.from,
      to: alert.to,
      alertType: alert.alertType || 'scheduled',
      // Campos para alertas programadas
      intervalDays: alert.intervalDays,
      hour: alert.hour,
      // Campos para alertas por porcentaje
      percentageThreshold: alert.percentageThreshold,
      percentageDirection: alert.percentageDirection,
      baselineRate: alert.baselineRate,
      // Campos para alertas por precio objetivo
      targetRate: alert.targetRate,
      targetDirection: alert.targetDirection,
      // Campos comunes
      isActive: alert.isActive,
      lastSent: alert.lastSent,
      email: alert.email,
      createdAt: alert.createdAt,
      updatedAt: alert.updatedAt
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'No se pudieron obtener las alertas' });
  }
});

// Actualizar alerta (mantener funcionalidad original)
router.put('/:id', requireAuth, async (req, res) => {
  const updates = req.body;

  try {
    const alert = await Alert.findById(req.params.id);
    if (!alert) {
      return res.status(404).json({ error: 'Alerta no encontrada' });
    }
    if (alert.user.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'No autorizado para editar esta alerta' });
    }

    // Actualizar campos permitidos
    Object.assign(alert, updates);
    await alert.save();
    
    res.json({ message: 'Alerta actualizada', alert });
  } catch (error) {
    res.status(500).json({ error: 'Error al editar la alerta' });
  }
});

// Eliminar alerta
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);
    if (!alert) {
      return res.status(404).json({ error: 'Alerta no encontrada' });
    }
    if (alert.user.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'No autorizado para borrar esta alerta' });
    }
    await alert.deleteOne();
    res.json({ message: 'Alerta eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al borrar la alerta' });
  }
});

module.exports = router;