const axios = require('axios');

const convertCurrency = async (req, res) => {
  const { from, to, amount } = req.body;

  if (!from || !to || !amount) {
    return res.status(400).json({ error: 'Faltan parámetros: from, to o amount' });
  }

  try {
    const apiUrl = `${process.env.API_URL}?amount=${amount}&from=${from}&to=${to}`;
    console.log('URL solicitada:', apiUrl);
    const response = await axios.get(apiUrl);

    // Frankfurter responde con rates: { "EUR": valor }
    if (!response.data.rates || response.data.rates[to] === undefined) {
      console.log('Respuesta inesperada de la API:', response.data);
      return res.status(400).json({ error: 'No se encontró la tasa de cambio para la moneda solicitada.' });
    }

    const rate = response.data.rates[to] / amount; // Frankfurter devuelve el monto convertido, no el rate directo
    const result = response.data.rates[to];

    res.json({
      from,
      to,
      amount,
      rate,
      result: result.toFixed(2)
    });

    // Aquí podrías guardar en MongoDB el historial
  } catch (error) {
    console.error('Error al convertir:', error.message);
    res.status(500).json({ error: 'Error al obtener el tipo de cambio' });
  }
};

module.exports = { convertCurrency };
