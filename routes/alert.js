// filepath: c:\PROYECTOS\divisas-api\routes\alert.js
const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/authMiddleware');
const Alert = require('../models/Alert');

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
      email: req.user.email
    });
    res.json({ message: 'Alerta creada', alert });
  } catch (err) {
    res.status(500).json({ error: 'No se pudo crear la alerta' });
  }
});

// Borrar una alerta por ID (solo el dueño puede)
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

// Editar una alerta por ID (solo el dueño puede)
router.put('/:id', requireAuth, async (req, res) => {
  const { from, to, intervalDays, hour } = req.body;

  // Validaciones básicas
  if (from && to && from === to) {
    return res.status(400).json({ error: 'La moneda de origen y destino deben ser diferentes' });
  }
  if (typeof intervalDays !== 'undefined' && (isNaN(intervalDays) || intervalDays < 1)) {
    return res.status(400).json({ error: 'intervalDays debe ser un número mayor o igual a 1' });
  }
  if (typeof hour !== 'undefined' && (isNaN(hour) || hour < 0 || hour > 23)) {
    return res.status(400).json({ error: 'hour debe ser un número entre 0 y 23' });
  }

  try {
    const alert = await Alert.findById(req.params.id);
    if (!alert) {
      return res.status(404).json({ error: 'Alerta no encontrada' });
    }
    if (alert.user.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'No autorizado para editar esta alerta' });
    }

    // Solo actualiza los campos enviados
    if (from) alert.from = from;
    if (to) alert.to = to;
    if (intervalDays) alert.intervalDays = intervalDays;
    if (typeof hour !== 'undefined') alert.hour = hour;

    await alert.save();
    res.json({ message: 'Alerta actualizada', alert });
  } catch (error) {
    res.status(500).json({ error: 'Error al editar la alerta' });
  }
});

// Listar alertas del usuario autenticado, con filtros opcionales
router.get('/', requireAuth, async (req, res) => {
  const { from, to, hour } = req.query;
  const filter = { user: req.user.userId };

  if (from) filter.from = from.toUpperCase();
  if (to) filter.to = to.toUpperCase();
  if (typeof hour !== 'undefined') filter.hour = Number(hour);

  try {
    const alerts = await Alert.find(filter).sort({ hour: 1, createdAt: -1 });
    // Formatea la respuesta para mostrar solo los campos relevantes
    const result = alerts.map(alert => ({
      id: alert._id,
      from: alert.from,
      to: alert.to,
      intervalDays: alert.intervalDays,
      hour: alert.hour,
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

module.exports = router;