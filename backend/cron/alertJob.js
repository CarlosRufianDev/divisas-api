const cron = require('node-cron');
const Alert = require('../models/Alert');
const axios = require('axios');
const nodemailer = require('nodemailer');
require('dotenv').config();

// Configura el transportador de correo
const transporter = nodemailer.createTransport({ // ✅ CORREGIDO: sin 'r'
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// ===== FUNCIONES AUXILIARES =====

// Obtener cotización actual
async function getCurrentRate(from, to) {
  try {
    const response = await axios.get(`https://api.frankfurter.app/latest?from=${from}&to=${to}`);
    return response.data.rates[to];
  } catch (error) {
    console.error(`❌ Error obteniendo cotización ${from}/${to}:`, error.message);
    return null;
  }
}

// Obtener cotización histórica
async function getHistoricalRate(from, to, date) {
  try {
    const formattedDate = date.toISOString().slice(0, 10);
    const response = await axios.get(`https://api.frankfurter.app/${formattedDate}?from=${from}&to=${to}`);
    return response.data.rates[to];
  } catch (error) {
    console.error(`❌ Error obteniendo cotización histórica ${from}/${to} para ${formattedDate}:`, error.message);
    return null;
  }
}

// Enviar email
async function sendEmail(to, subject, html) {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      html
    });
    console.log(`📧 Email enviado a ${to}: ${subject}`);
    return true;
  } catch (error) {
    console.error(`❌ Error enviando email a ${to}:`, error.message);
    return false;
  }
}

// ===== PROCESADORES DE ALERTAS =====

// Procesar alertas programadas
async function processScheduledAlerts() {
  const now = new Date();
  const currentHour = now.getHours();

  console.log(`⏰ Procesando alertas programadas para las ${currentHour}:00...`);

  try {
    const alerts = await Alert.find({
      alertType: 'scheduled',
      hour: currentHour,
      isActive: true
    });

    console.log(`📋 Encontradas ${alerts.length} alertas programadas para esta hora`);

    for (const alert of alerts) {
      const shouldSend = !alert.lastSent ||
        (now - new Date(alert.lastSent)) >= (alert.intervalDays * 24 * 60 * 60 * 1000);

      if (shouldSend) {
        const currentRate = await getCurrentRate(alert.from, alert.to);

        if (currentRate) {
          const pastDate = new Date(now - alert.intervalDays * 24 * 60 * 60 * 1000);
          const pastRate = await getHistoricalRate(alert.from, alert.to, pastDate);

          let changeText = '';
          if (pastRate) {
            const diff = currentRate - pastRate;
            const percent = ((diff / pastRate) * 100).toFixed(2);
            const arrow = diff > 0 ? '📈' : diff < 0 ? '📉' : '➡️';
            changeText = `
              <p><strong>Cambio en ${alert.intervalDays} días:</strong></p>
              <p>${pastRate} → ${currentRate} ${arrow} ${percent > 0 ? '+' : ''}${percent}%</p>
            `;
          }

          const subject = `🔔 Reporte ${alert.from}/${alert.to} - ${currentRate}`;
          const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2196F3;">📊 Reporte de Divisas</h2>
              <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3>${alert.from} → ${alert.to}</h3>
                <p style="font-size: 24px; color: #333; margin: 10px 0;">
                  <strong>${currentRate}</strong>
                </p>
                ${changeText}
              </div>
              <p style="color: #666; font-size: 12px;">
                Esta alerta se repite cada ${alert.intervalDays} días a las ${alert.hour}:00.
                <br>Enviado por DivisasPro el ${now.toLocaleString('es-ES')}
              </p>
            </div>
          `;

          const sent = await sendEmail(alert.email, subject, html);

          if (sent) {
            alert.lastSent = now;
            await alert.save();
            console.log(`✅ Alerta programada enviada: ${alert.from}/${alert.to} a ${alert.email}`);
          }
        }
      }
    }
  } catch (error) {
    console.error('❌ Error procesando alertas programadas:', error);
  }
}

// Procesar alertas por porcentaje
async function processPercentageAlerts() {
  console.log('📊 Procesando alertas por porcentaje...');

  try {
    const alerts = await Alert.find({
      alertType: 'percentage',
      isActive: true
    });

    console.log(`📋 Encontradas ${alerts.length} alertas por porcentaje`);

    for (const alert of alerts) {
      const currentRate = await getCurrentRate(alert.from, alert.to);

      if (currentRate && alert.baselineRate) {
        const diff = currentRate - alert.baselineRate;
        const percentChange = Math.abs((diff / alert.baselineRate) * 100);

        const shouldTrigger = percentChange >= alert.percentageThreshold;
        const directionMatch =
          alert.percentageDirection === 'both' ||
          (alert.percentageDirection === 'up' && diff > 0) ||
          (alert.percentageDirection === 'down' && diff < 0);

        // Solo enviar si no se ha enviado en las últimas 2 horas
        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
        const recentlySent = alert.lastSent && new Date(alert.lastSent) > twoHoursAgo;

        if (shouldTrigger && directionMatch && !recentlySent) {
          const arrow = diff > 0 ? '📈' : '📉';
          const sign = diff > 0 ? '+' : '';

          const subject = `🚨 Alerta ${arrow} ${alert.from}/${alert.to} cambió ${sign}${percentChange.toFixed(2)}%`;
          const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #FF5722;">🚨 Alerta de Porcentaje Activada</h2>
              <div style="background: #fff3e0; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #FF5722;">
                <h3>${alert.from} → ${alert.to}</h3>
                <p style="font-size: 18px; margin: 10px 0;">
                  <strong>Precio base:</strong> ${alert.baselineRate}<br>
                  <strong>Precio actual:</strong> ${currentRate} ${arrow}<br>
                  <strong>Cambio:</strong> ${sign}${percentChange.toFixed(2)}% 
                  (umbral: ${alert.percentageThreshold}%)
                </p>
              </div>
              <p style="color: #666; font-size: 12px;">
                Alerta configurada para cambios ${alert.percentageDirection === 'both' ? 'en ambas direcciones' : alert.percentageDirection === 'up' ? 'de subida' : 'de bajada'} del ${alert.percentageThreshold}%.
                <br>Enviado por DivisasPro el ${new Date().toLocaleString('es-ES')}
              </p>
            </div>
          `;

          const sent = await sendEmail(alert.email, subject, html);

          if (sent) {
            alert.lastSent = new Date();
            await alert.save();
            console.log(`✅ Alerta por porcentaje enviada: ${alert.from}/${alert.to} ${sign}${percentChange.toFixed(2)}% a ${alert.email}`);
          }
        }
      }
    }
  } catch (error) {
    console.error('❌ Error procesando alertas por porcentaje:', error);
  }
}

// Procesar alertas por precio objetivo
async function processTargetAlerts() {
  console.log('🎯 Procesando alertas por precio objetivo...');

  try {
    const alerts = await Alert.find({
      alertType: 'target',
      isActive: true
    });

    console.log(`📋 Encontradas ${alerts.length} alertas por precio objetivo`);

    for (const alert of alerts) {
      const currentRate = await getCurrentRate(alert.from, alert.to);

      if (currentRate && alert.targetRate) {
        let triggered = false;

        switch (alert.targetDirection) {
          case 'above':
            triggered = currentRate > alert.targetRate;
            break;
          case 'below':
            triggered = currentRate < alert.targetRate;
            break;
          case 'exact':
            // Considerar "exacto" si está dentro del 0.1%
            const tolerance = alert.targetRate * 0.001;
            triggered = Math.abs(currentRate - alert.targetRate) <= tolerance;
            break;
        }

        // Solo enviar si no se ha enviado en las últimas 4 horas
        const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);
        const recentlySent = alert.lastSent && new Date(alert.lastSent) > fourHoursAgo;

        if (triggered && !recentlySent) {
          const comparison = alert.targetDirection === 'above'
            ? 'por encima de'
            : alert.targetDirection === 'below' ? 'por debajo de' : 'cerca de';

          const subject = `🎯 ¡Objetivo alcanzado! ${alert.from}/${alert.to} está ${comparison} ${alert.targetRate}`;
          const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #4CAF50;">🎯 ¡Precio Objetivo Alcanzado!</h2>
              <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4CAF50;">
                <h3>${alert.from} → ${alert.to}</h3>
                <p style="font-size: 18px; margin: 10px 0;">
                  <strong>Precio objetivo:</strong> ${comparison} ${alert.targetRate}<br>
                  <strong>Precio actual:</strong> ${currentRate} ✅
                </p>
              </div>
              <p style="color: #666; font-size: 12px;">
                Esta alerta se disparó cuando el precio ${comparison} ${alert.targetRate}.
                <br>Enviado por DivisasPro el ${new Date().toLocaleString('es-ES')}
              </p>
            </div>
          `;

          const sent = await sendEmail(alert.email, subject, html);

          if (sent) {
            alert.lastSent = new Date();
            // Desactivar alerta objetivo una vez alcanzada
            alert.isActive = false;
            await alert.save();
            console.log(`✅ Alerta por precio objetivo enviada y desactivada: ${alert.from}/${alert.to} ${comparison} ${alert.targetRate} a ${alert.email}`);
          }
        }
      }
    }
  } catch (error) {
    console.error('❌ Error procesando alertas por precio objetivo:', error);
  }
}

// ===== JOBS PROGRAMADOS =====

// Job principal - cada hora en punto (0 minutos)
cron.schedule('0 * * * *', async () => {
  console.log(`\n🔔 [${new Date().toISOString()}] Procesamiento principal de alertas...`);

  try {
    await processScheduledAlerts();
    console.log('✅ Procesamiento principal completado\n');
  } catch (error) {
    console.error('❌ Error en procesamiento principal:', error);
  }
});

// Job frecuente para alertas críticas - cada 15 minutos
cron.schedule('*/15 * * * *', async () => {
  console.log(`🔍 [${new Date().toISOString()}] Verificación de alertas críticas...`);
  try {
    await processPercentageAlerts();
    await processTargetAlerts();
  } catch (error) {
    console.error('❌ Error en verificación crítica:', error);
  }
});

// Estadísticas del sistema
setInterval(async () => {
  try {
    const activeAlerts = await Alert.countDocuments({ isActive: true });
    const totalAlerts = await Alert.countDocuments();
    console.log(`📊 Sistema: ${activeAlerts}/${totalAlerts} alertas activas`);
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
  }
}, 60 * 60 * 1000); // Cada hora

// AÑADIR AL FINAL de alertJob.js:

// Test de conexión Gmail
transporter.verify(function(error, success) {
  if (error) {
    console.log('❌ Error de conexión Gmail:', error);
  } else {
    console.log('✅ Gmail configurado correctamente - Listo para enviar emails');
  }
});

console.log('🚀 Sistema de alertas iniciado:');
console.log('   📅 Alertas programadas: cada hora en punto');
console.log('   📊 Alertas críticas (porcentaje + objetivo): cada 15 minutos');

module.exports = cron;
