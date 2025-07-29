const Alert = require('../models/Alert');
const axios = require('axios');

// Crear alerta programada (la que ya existía)
const createScheduledAlert = async (req, res) => {
  try {
    const { from, to, intervalDays, hour, email } = req.body;
    const userId = req.user.userId;

    // Validaciones
    if (!from || !to || !intervalDays || hour === undefined || !email) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    if (intervalDays < 1 || intervalDays > 365) {
      return res.status(400).json({ error: 'El intervalo debe estar entre 1 y 365 días' });
    }

    if (hour < 0 || hour > 23) {
      return res.status(400).json({ error: 'La hora debe estar entre 0 y 23' });
    }

    if (from === to) {
      return res.status(400).json({ error: 'Las monedas de origen y destino deben ser diferentes' });
    }

    const newAlert = new Alert({
      user: userId,
      from,
      to,
      intervalDays,
      hour,
      email,
      alertType: 'scheduled'
    });

    await newAlert.save();

    res.status(201).json({
      message: 'Alerta programada creada exitosamente',
      alert: newAlert
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al crear la alerta programada' });
  }
};

// Crear alerta por porcentaje de variación
const createPercentageAlert = async (req, res) => {
  try {
    const { from, to, email, percentageThreshold, percentageDirection } = req.body;
    const userId = req.user.userId;

    // Validaciones
    if (!from || !to || !email || !percentageThreshold) {
      return res.status(400).json({ error: 'Debes especificar monedas, email y porcentaje de variación' });
    }

    if (percentageThreshold <= 0 || percentageThreshold > 50) {
      return res.status(400).json({ error: 'El porcentaje debe estar entre 0.1% y 50%' });
    }

    if (from === to) {
      return res.status(400).json({ error: 'Las monedas de origen y destino deben ser diferentes' });
    }

    // Obtener el tipo de cambio actual como referencia
    const response = await axios.get(`https://api.frankfurter.app/latest?from=${from}&to=${to}`);
    const currentRate = response.data.rates[to];

    if (!currentRate) {
      return res.status(400).json({ error: 'Par de monedas no soportado' });
    }

    const newAlert = new Alert({
      user: userId,
      from,
      to,
      email,
      alertType: 'percentage',
      percentageThreshold,
      percentageDirection: percentageDirection || 'both',
      baselineRate: currentRate,
      isActive: true
    });

    await newAlert.save();

    res.status(201).json({
      message: 'Alerta por porcentaje creada exitosamente',
      alert: newAlert,
      description: `Te avisaremos si ${from}/${to} ${percentageDirection === 'up' ? 'sube' : percentageDirection === 'down' ? 'baja' : 'cambia'} más del ${percentageThreshold}% desde ${currentRate}`
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al crear la alerta por porcentaje' });
  }
};

// Crear alerta por precio objetivo
const createTargetAlert = async (req, res) => {
  try {
    const { from, to, email, targetRate, targetDirection } = req.body;
    const userId = req.user.userId;

    // Validaciones
    if (!from || !to || !email || !targetRate) {
      return res.status(400).json({ error: 'Debes especificar monedas, email y precio objetivo' });
    }

    if (targetRate <= 0) {
      return res.status(400).json({ error: 'El precio objetivo debe ser mayor a 0' });
    }

    if (from === to) {
      return res.status(400).json({ error: 'Las monedas de origen y destino deben ser diferentes' });
    }

    // Obtener el tipo de cambio actual para comparar
    const response = await axios.get(`https://api.frankfurter.app/latest?from=${from}&to=${to}`);
    const currentRate = response.data.rates[to];

    if (!currentRate) {
      return res.status(400).json({ error: 'Par de monedas no soportado' });
    }

    const newAlert = new Alert({
      user: userId,
      from,
      to,
      email,
      alertType: 'target',
      targetRate,
      targetDirection: targetDirection || 'exact',
      isActive: true
    });

    await newAlert.save();

    const directionText = {
      'above': `cuando llegue por encima de ${targetRate}`,
      'below': `cuando baje por debajo de ${targetRate}`,
      'exact': `cuando llegue exactamente a ${targetRate}`
    };

    res.status(201).json({
      message: 'Alerta por precio objetivo creada exitosamente',
      alert: newAlert,
      currentRate,
      description: `Te avisaremos cuando ${from}/${to} ${directionText[targetDirection || 'exact']} (actualmente: ${currentRate})`
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al crear la alerta por precio objetivo' });
  }
};

// Listar alertas del usuario
const getAlerts = async (req, res) => {
  try {
    const userId = req.user.userId;
    const alerts = await Alert.find({ user: userId }).sort({ createdAt: -1 });

    res.json({
      count: alerts.length,
      alerts
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener las alertas' });
  }
};

// Actualizar alerta
const updateAlert = async (req, res) => {
  try {
    const userId = req.user.userId;
    const alertId = req.params.id;
    const updates = req.body;

    const alert = await Alert.findOne({ _id: alertId, user: userId });

    if (!alert) {
      return res.status(404).json({ error: 'Alerta no encontrada' });
    }

    Object.assign(alert, updates);
    await alert.save();

    res.json({
      message: 'Alerta actualizada exitosamente',
      alert
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar la alerta' });
  }
};

// Eliminar alerta
const deleteAlert = async (req, res) => {
  try {
    const userId = req.user.userId;
    const alertId = req.params.id;

    const result = await Alert.deleteOne({ _id: alertId, user: userId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Alerta no encontrada' });
    }

    res.json({ message: 'Alerta eliminada exitosamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar la alerta' });
  }
};

module.exports = {
  createScheduledAlert,
  createPercentageAlert,
  createTargetAlert,
  getAlerts,
  updateAlert,
  deleteAlert
};