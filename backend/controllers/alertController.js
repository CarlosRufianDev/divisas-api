const Alert = require('../models/Alert');
const axios = require('axios');

// Crear alerta programada
const createScheduledAlert = async (req, res) => {
  try {
    const { from, to, email, intervalDays, hour } = req.body;
    const userId = req.user.userId;

    // Validaciones básicas
    if (!from || !to || !email || !intervalDays || typeof hour === 'undefined') {
      return res.status(400).json({ 
        error: 'Faltan campos requeridos: from, to, email, intervalDays, hour' 
      });
    }

    // Validar formato de divisas
    if (from.length !== 3 || to.length !== 3) {
      return res.status(400).json({ 
        error: 'Las divisas deben tener exactamente 3 caracteres' 
      });
    }

    if (from.toUpperCase() === to.toUpperCase()) {
      return res.status(400).json({ 
        error: 'Las divisas de origen y destino no pueden ser iguales' 
      });
    }

    // Validar rangos
    if (intervalDays < 1 || intervalDays > 365) {
      return res.status(400).json({ 
        error: 'El intervalo debe estar entre 1 y 365 días' 
      });
    }

    if (hour < 0 || hour > 23) {
      return res.status(400).json({ 
        error: 'La hora debe estar entre 0 y 23' 
      });
    }

    // Verificar que no existe una alerta idéntica
    const existingAlert = await Alert.findOne({
      user: userId,
      from: from.toUpperCase(),
      to: to.toUpperCase(),
      alertType: 'scheduled',
      intervalDays,
      hour,
      isActive: true
    });

    if (existingAlert) {
      return res.status(400).json({ 
        error: 'Ya existe una alerta programada idéntica activa' 
      });
    }

    // Crear la alerta
    const alert = new Alert({
      user: userId,
      from: from.toUpperCase(),
      to: to.toUpperCase(),
      alertType: 'scheduled',
      intervalDays: Number(intervalDays),
      hour: Number(hour),
      email: email.toLowerCase(),
      isActive: true
    });

    await alert.save();

    console.log(`✅ Alerta programada creada: ${from}/${to} cada ${intervalDays} días a las ${hour}:00`);

    res.status(201).json({
      message: 'Alerta programada creada exitosamente',
      alert: {
        _id: alert._id,
        from: alert.from,
        to: alert.to,
        alertType: alert.alertType,
        intervalDays: alert.intervalDays,
        hour: alert.hour,
        email: alert.email,
        isActive: alert.isActive,
        createdAt: alert.createdAt
      },
      description: `Te enviaremos un email cada ${intervalDays} días a las ${hour}:00 con la cotización ${from}/${to}`
    });

  } catch (error) {
    console.error('❌ Error creando alerta programada:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        error: 'Datos de entrada inválidos',
        details: error.message 
      });
    }
    
    res.status(500).json({ 
      error: 'Error interno del servidor al crear la alerta programada' 
    });
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

// Enviar test de alerta
const sendTestAlert = async (req, res) => {
  try {
    const userId = req.user.userId;
    const alertId = req.params.id;

    // Buscar la alerta
    const alert = await Alert.findOne({ _id: alertId, user: userId });
    if (!alert) {
      return res.status(404).json({ error: 'Alerta no encontrada' });
    }

    // Obtener cotización actual
    const response = await axios.get(`https://api.frankfurter.app/latest?from=${alert.from}&to=${alert.to}`);
    const currentRate = response.data.rates[alert.to];

    if (!currentRate) {
      return res.status(400).json({ error: 'No se pudo obtener la cotización actual' });
    }

    console.log(`📧 TEST EMAIL a ${alert.email}: ${alert.from}/${alert.to} = ${currentRate}`);
    console.log(`🔍 GMAIL CONFIG: ${process.env.EMAIL_USER} / ${process.env.EMAIL_PASS ? 'PASSWORD_SET' : 'NO_PASSWORD'}`);

    // ✅ AÑADIR: ENVIAR EMAIL REAL CON NODEMAILER
    const nodemailer = require('nodemailer');
    
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Crear contenido del email
    const alertTypeText = {
      'scheduled': `Programada (cada ${alert.intervalDays} días a las ${alert.hour}:00)`,
      'percentage': `Por porcentaje (±${alert.percentageThreshold}% desde ${alert.baselineRate})`,
      'target': `Por precio objetivo (${alert.targetDirection} ${alert.targetRate})`
    };

    const subject = `🧪 Test de Alerta - ${alert.from}/${alert.to} = ${currentRate}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2196F3;">🧪 Test de Alerta DivisasPro</h2>
        
        <div style="background: #f0f8ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2196F3;">
          <h3 style="margin-top: 0;">${alert.from} → ${alert.to}</h3>
          <p style="font-size: 24px; color: #333; margin: 10px 0;">
            <strong>${currentRate}</strong>
          </p>
          <p><strong>Tipo de alerta:</strong> ${alertTypeText[alert.alertType] || alert.alertType}</p>
          <p><strong>Estado:</strong> ${alert.isActive ? '✅ Activa' : '❌ Inactiva'}</p>
        </div>

        <div style="background: #f9f9f9; padding: 15px; border-radius: 6px; font-size: 12px; color: #666;">
          <p><strong>📧 Este es un email de prueba</strong></p>
          <p>Tu alerta está configurada correctamente y funcionando.</p>
          <p>Enviado desde DivisasPro el ${new Date().toLocaleString('es-ES')}</p>
        </div>
      </div>
    `;

    // ✅ ENVIAR EMAIL REAL
    const emailResult = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: alert.email,
      subject: subject,
      html: html
    });

    console.log(`✅ EMAIL TEST REAL ENVIADO: ${emailResult.messageId}`);
    console.log(`✅ Gmail Response: ${emailResult.response}`);
    
    // Actualizar lastSent
    alert.lastSent = new Date();
    await alert.save();

    res.json({
      message: 'Email de prueba enviado exitosamente',
      alert: {
        _id: alert._id,
        from: alert.from,
        to: alert.to,
        email: alert.email,
        currentRate,
        lastSent: alert.lastSent
      },
      emailInfo: {
        messageId: emailResult.messageId,
        response: emailResult.response
      },
      description: `Test real enviado a ${alert.email} con cotización ${alert.from}/${alert.to} = ${currentRate}`
    });

  } catch (error) {
    console.error('❌ Error enviando test de alerta:', error);
    res.status(500).json({ 
      error: 'Error al enviar el email de prueba',
      details: error.message 
    });
  }
};

module.exports = {
  createScheduledAlert,
  createPercentageAlert,
  createTargetAlert,
  updateAlert,
  deleteAlert,
  sendTestAlert,
  getAlerts
};