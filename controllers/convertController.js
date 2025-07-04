const axios = require('axios');
const Conversion = require('../models/Conversion');
const buildFilters = require('../utils/buildFilters');


const convertCurrency = async (req, res) => {
  const { from, to, amount } = req.body;

  if (!from || !to || !amount) {
    return res.status(400).json({ error: 'Faltan parámetros: from, to o amount' });
  }

  try {
    const apiUrl = `${process.env.API_URL}?amount=${amount}&from=${from}&to=${to}`;
    console.log('URL solicitada:', apiUrl);
    const response = await axios.get(apiUrl);

    if (!response.data.rates || response.data.rates[to] === undefined) {
      console.log('Respuesta inesperada de la API:', response.data);
      return res.status(400).json({ error: 'No se encontró la tasa de cambio para la moneda solicitada.' });
    }

    const rate = response.data.rates[to] / amount;
    const result = response.data.rates[to];

    // Guardar en MongoDB antes de enviar la respuesta
    await Conversion.create({
      from,
      to,
      amount,
      rate,
      result
    });

    res.json({
      from,
      to,
      amount,
      rate,
      result: result.toFixed(2)
    });
  } catch (error) {
    console.error('Error al convertir:', error.message);
    res.status(500).json({ error: 'Error al obtener el tipo de cambio' });
  }
};

const getHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    if (isNaN(pageNum) || isNaN(limitNum) || pageNum < 1 || limitNum < 1) {
      return res.status(400).json({ error: 'Parámetros de paginación inválidos' });
    }

    const filters = buildFilters(req.query);
    const total = await Conversion.countDocuments(filters);
    const conversions = await Conversion.find(filters)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    res.json({
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      results: conversions
    });
  } catch (error) {
    console.error('Error al filtrar historial:', error.message);
    res.status(500).json({ error: 'Error al filtrar el historial' });
  }
};



module.exports = { convertCurrency, getHistory };

