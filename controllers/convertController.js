const axios = require('axios');
const Conversion = require('../models/Conversion');
const buildFilters = require('../utils/buildFilters');


const convertCurrency = async (req, res) => {
  const { from, to, amount } = req.body;

  // Validaciones básicas
  if (!from || !to || amount === undefined) {
    return res.status(400).json({ error: 'Faltan parámetros: from, to o amount' });
  }

  if (typeof from !== 'string' || typeof to !== 'string' || typeof amount !== 'number') {
    return res.status(400).json({ error: 'Tipos inválidos. from y to deben ser strings, amount debe ser número.' });
  }

  if (from.length !== 3 || to.length !== 3) {
    return res.status(400).json({ error: 'Los códigos de moneda deben tener 3 letras (por ejemplo, USD, EUR).' });
  }

  if (amount <= 0) {
    return res.status(400).json({ error: 'La cantidad debe ser mayor que 0.' });
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
// Este controlador maneja la conversión de moneda.
// Valida los parámetros de entrada, realiza la conversión utilizando una API externa y guarda el resultado en la base de datos.


const getHistory = async (req, res) => {
  try {
    // Construir filtros a partir de la query
    // Utiliza la función buildFilters para crear un objeto de filtros basado en los parámetros de la query.
    // Esto permite filtrar las conversiones por moneda, fecha, etc.
    const filters = buildFilters(req.query);

    // Extraer page y limit de la query, con valores por defecto
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Contar total de resultados con los filtros aplicados
    const total = await Conversion.countDocuments(filters);

    // Buscar resultados con filtros, orden y paginación
    const conversions = await Conversion.find(filters)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
      
    res.json({
      total,
      page,
      pages: Math.ceil(total / limit),
      results: conversions
      
    });
  } catch (error) {
    console.error('Error al obtener historial paginado:', error.message);
    res.status(500).json({ error: 'Error al obtener historial paginado' });
  }
};
// Este controlador maneja la conversión de moneda y el historial de conversiones.
// Utiliza axios para hacer peticiones a una API externa y mongoose para interactuar con la base de datos.
// El método convertCurrency valida los parámetros de entrada, realiza la conversión y guarda el resultado



const deleteAllHistory = async (req, res) => {
  try {
    const result = await Conversion.deleteMany({});
    res.json({ message: 'Historial eliminado correctamente', deletedCount: result.deletedCount });
  } catch (error) {
    console.error('Error al borrar historial:', error.message);
    res.status(500).json({ error: 'Error al borrar historial de conversiones' });
  }
};
// Este controlador maneja la eliminación del historial de conversiones.



const deleteById = async (req, res) => {
  const { id } = req.params;

  try {
    const deleted = await Conversion.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ error: 'Conversión no encontrada' });
    }

    res.json({ message: 'Conversión eliminada correctamente', deleted });
  } catch (error) {
    console.error('Error al eliminar por ID:', error.message);
    res.status(500).json({ error: 'Error al eliminar la conversión' });
  }
};
// Este controlador maneja la eliminación de una conversión específica por ID.


module.exports = { convertCurrency, getHistory, deleteAllHistory, deleteById };
// Exporta los métodos convertCurrency, getHistory y deleteAllHistory para ser utilizados en las rutas.
// Estos métodos permiten convertir monedas, obtener el historial de conversiones y eliminar todo el historial respectivamente

