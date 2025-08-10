const express = require('express');
const router = express.Router();
const axios = require('axios');

router.get('/', async (req, res) => {
  try {
    const response = await axios.get('https://api.frankfurter.app/currencies');
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'No se pudo obtener el listado de monedas.' });
  }
});

router.get('/ultimo', async (req, res) => {
  const { from, to } = req.query;
  if (!from || !to) {
    return res.status(400).json({ error: 'Debes indicar los parámetros from y to.' });
  }
  try {
    const response = await axios.get(`https://api.frankfurter.app/latest?from=${from}&to=${to}`);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'No se pudo obtener el último cambio.' });
  }
});

module.exports = router;
