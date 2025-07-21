// filepath: c:\PROYECTOS\divisas-api\routes\alert.js
const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/authMiddleware');
const Alert = require('../models/Alert');

router.post('/', requireAuth, async (req, res) => {
  const { from, to, intervalDays } = req.body;
  try {
    const alert = await Alert.create({
      user: req.user.userId,
      from,
      to,
      intervalDays: intervalDays || 1,
      email: req.user.email
    });
    res.json({ message: 'Alerta creada', alert });
  } catch (err) {
    res.status(500).json({ error: 'No se pudo crear la alerta' });
  }
});

module.exports = router;