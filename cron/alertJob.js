const cron = require('node-cron');
const Alert = require('../models/Alert');
const axios = require('axios');
const nodemailer = require('nodemailer');
require('dotenv').config();

// Configura el transportador de correo
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Cron: cada día a las 8am
cron.schedule('0 8 * * *', async () => {
  const alerts = await Alert.find({}).populate('user');
  for (const alert of alerts) {
    // Solo si toca enviar (por intervalo)
    const now = new Date();
    if (
      !alert.lastSent ||
      (now - alert.lastSent) / (1000 * 60 * 60 * 24) >= alert.intervalDays
    ) {
      // Consulta precio actual y de hace intervalDays
      const today = now.toISOString().slice(0, 10);
      const past = new Date(now - alert.intervalDays * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);

      // API Frankfurter para histórico
      const urlToday = `${process.env.API_URL}?from=${alert.from}&to=${alert.to}&date=${today}`;
      const urlPast = `${process.env.API_URL}?from=${alert.from}&to=${alert.to}&date=${past}`;

      try {
        const resToday = await axios.get(urlToday);
        const resPast = await axios.get(urlPast);

        const rateToday = resToday.data.rates[alert.to];
        const ratePast = resPast.data.rates[alert.to];

        if (rateToday && ratePast) {
          const diff = rateToday - ratePast;
          const percent = ((diff / ratePast) * 100).toFixed(2);

          // Enviar email
          await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: alert.email,
            subject: `Alerta de variación ${alert.from}/${alert.to}`,
            html: `<h2>Hola${alert.user && alert.user.name ? `, ${alert.user.name}` : ''} 👋</h2>
                   <p>La variación de ${alert.from} a ${alert.to} en los últimos ${alert.intervalDays} días es de ${percent}% (${ratePast} → ${rateToday})</p>`
          });

          // Actualiza lastSent
          alert.lastSent = now;
          await alert.save();
        }
      } catch (err) {
        console.error('Error enviando alerta:', err.message);
      }
    }
  }
});

module.exports = cron;