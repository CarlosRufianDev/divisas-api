const axios = require('axios');

const multipleConversion = async (req, res) => {
  try {
    const { from, amount, currencies } = req.body;

    // Validaciones
    if (!from || !amount || !currencies || !Array.isArray(currencies)) {
      return res.status(400).json({ error: 'Debes especificar la moneda de origen, cantidad y monedas de destino' });
    }

    if (amount <= 0) {
      return res.status(400).json({ error: 'La cantidad debe ser mayor a 0' });
    }

    // Construir URL para Frankfurter
    const targetCurrencies = currencies.join(',');
    const response = await axios.get(`https://api.frankfurter.app/latest?from=${from}&to=${targetCurrencies}`);

    const conversions = [];
    for (const [currency, rate] of Object.entries(response.data.rates)) {
      conversions.push({
        from,
        to: currency,
        amount,
        result: Number((amount * rate).toFixed(2)),
        rate
      });
    }

    res.json({
      baseAmount: amount,
      baseCurrency: from,
      conversions,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al realizar la conversión múltiple' });
  }
};

const reverseConversion = async (req, res) => {
  try {
    const { from, to, targetAmount } = req.body;

    // Validaciones
    if (!from || !to || !targetAmount) {
      return res.status(400).json({ error: 'Debes especificar la moneda de origen, destino y cantidad objetivo' });
    }

    if (targetAmount <= 0) {
      return res.status(400).json({ error: 'La cantidad objetivo debe ser mayor a 0' });
    }

    if (from === to) {
      return res.status(400).json({ error: 'Las monedas de origen y destino deben ser diferentes' });
    }

    // Obtener el tipo de cambio
    const response = await axios.get(`https://api.frankfurter.app/latest?from=${from}&to=${to}`);
    const rate = response.data.rates[to];

    if (!rate) {
      return res.status(400).json({ error: 'El par de monedas solicitado no está disponible' });
    }

    // Cálculo inverso: ¿cuánto necesito en 'from' para obtener 'targetAmount' en 'to'?
    const requiredAmount = Number((targetAmount / rate).toFixed(2));

    res.json({
      from,
      to,
      targetAmount,
      requiredAmount,
      rate,
      description: `Para obtener ${targetAmount} ${to}, necesitas ${requiredAmount} ${from}`,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al calcular la conversión inversa' });
  }
};

const comparePairs = async (req, res) => {
  try {
    const { pairs } = req.body;

    // Validaciones
    if (!pairs || !Array.isArray(pairs) || pairs.length === 0) {
      return res.status(400).json({ error: 'Debes proporcionar al menos un par de monedas para comparar' });
    }

    // Validar estructura de cada par
    for (const pair of pairs) {
      if (!pair.from || !pair.to) {
        return res.status(400).json({ error: 'Cada par debe especificar moneda de origen y destino' });
      }
      if (pair.from === pair.to) {
        return res.status(400).json({ error: `No puedes comparar la misma moneda: ${pair.from} → ${pair.to}` });
      }
    }

    const comparisons = [];

    for (const pair of pairs) {
      try {
        const response = await axios.get(`https://api.frankfurter.app/latest?from=${pair.from}&to=${pair.to}`);
        const rate = response.data.rates[pair.to];

        if (rate) {
          comparisons.push({
            from: pair.from,
            to: pair.to,
            rate,
            description: `1 ${pair.from} = ${rate} ${pair.to}`
          });
        }
      } catch (err) {
        // Si falla un par, lo omitimos pero seguimos con los demás
        comparisons.push({
          from: pair.from,
          to: pair.to,
          rate: null,
          error: 'Par no disponible'
        });
      }
    }

    res.json({
      comparisons,
      total: comparisons.length,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al comparar los pares de monedas' });
  }
};

const historicalRate = async (req, res) => {
  try {
    const { from, to, date } = req.body;

    // Validaciones
    if (!from || !to || !date) {
      return res.status(400).json({ error: 'Debes especificar moneda de origen, destino y fecha' });
    }

    if (from === to) {
      return res.status(400).json({ error: 'Las monedas de origen y destino deben ser diferentes' });
    }

    // Validar formato de fecha (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({ error: 'La fecha debe tener el formato YYYY-MM-DD (ejemplo: 2025-01-15)' });
    }

    // Validar que la fecha no sea futura
    const requestedDate = new Date(date);
    const today = new Date();
    if (requestedDate > today) {
      return res.status(400).json({ error: 'No se pueden consultar fechas futuras' });
    }

    // Consultar el histórico en Frankfurter
    const response = await axios.get(`https://api.frankfurter.app/${date}?from=${from}&to=${to}`);
    const rate = response.data.rates[to];

    if (!rate) {
      return res.status(400).json({ error: 'El par de monedas no está disponible para esa fecha' });
    }

    res.json({
      from,
      to,
      date,
      rate,
      description: `El ${date}, 1 ${from} = ${rate} ${to}`,
      timestamp: new Date()
    });
  } catch (error) {
    if (error.response && error.response.status === 400) {
      return res.status(400).json({ error: 'Fecha no válida o datos no disponibles para esa fecha' });
    }
    res.status(500).json({ error: 'Error al consultar el histórico de tipos de cambio' });
  }
};

module.exports = {
  multipleConversion,
  reverseConversion,
  comparePairs,
  historicalRate
};
