const FavoriteCurrency = require('../models/FavoriteCurrency');
const axios = require('axios');

// Añadir una moneda a favoritas
const addFavoriteCurrency = async (req, res) => {
  try {
    const { currency, nickname, priority, isDefault } = req.body;
    const userId = req.user.userId;

    // Validaciones
    if (!currency) {
      return res.status(400).json({ error: 'Debes especificar la moneda' });
    }

    if (currency.length !== 3) {
      return res.status(400).json({ error: 'La moneda debe tener exactamente 3 caracteres' });
    }

    // Verificar que la moneda sea válida consultando la API
    try {
      const response = await axios.get(`https://api.frankfurter.app/latest?from=${currency.toUpperCase()}`);

      if (!response.data.rates) {
        return res.status(400).json({ error: 'Moneda no válida o no soportada' });
      }

      const newFavoriteCurrency = new FavoriteCurrency({
        user: userId,
        currency: currency.toUpperCase(),
        nickname: nickname || '',
        priority: priority || 1,
        isDefault: isDefault || false
      });

      await newFavoriteCurrency.save();

      res.status(201).json({
        message: 'Moneda añadida a favoritas exitosamente',
        favoriteCurrency: newFavoriteCurrency,
        description: `${currency.toUpperCase()} añadida como moneda favorita`
      });

    } catch (apiError) {
      return res.status(400).json({ error: 'Moneda no válida o no disponible' });
    }

  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Esta moneda ya está en tus favoritas' });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Error al añadir la moneda a favoritas' });
  }
};

// Listar monedas favoritas del usuario con tipos de cambio vs EUR/USD
const getFavoriteCurrencies = async (req, res) => {
  try {
    const userId = req.user.userId;
    const baseCurrency = req.query.base || 'EUR'; // Base para comparar (EUR por defecto)

    const favoriteCurrencies = await FavoriteCurrency.find({ user: userId })
      .sort({ priority: 1, createdAt: -1 });

    if (favoriteCurrencies.length === 0) {
      return res.json({
        count: 0,
        favoriteCurrencies: [],
        message: 'No tienes monedas favoritas aún'
      });
    }

    // Obtener tipos de cambio para todas las monedas favoritas
    const currenciesWithRates = await Promise.all(
      favoriteCurrencies.map(async (favCurrency) => {
        try {
          // Obtener tipo de cambio vs la moneda base
          const response = await axios.get(`https://api.frankfurter.app/latest?from=${baseCurrency}&to=${favCurrency.currency}`);
          const rateToBase = response.data.rates[favCurrency.currency];

          // Obtener tipo de cambio inverso
          const responseInverse = await axios.get(`https://api.frankfurter.app/latest?from=${favCurrency.currency}&to=${baseCurrency}`);
          const rateFromBase = responseInverse.data.rates[baseCurrency];

          return {
            id: favCurrency._id,
            currency: favCurrency.currency,
            nickname: favCurrency.nickname,
            priority: favCurrency.priority,
            isDefault: favCurrency.isDefault,
            rates: {
              [`${baseCurrency}_to_${favCurrency.currency}`]: rateToBase || 'N/A',
              [`${favCurrency.currency}_to_${baseCurrency}`]: rateFromBase || 'N/A'
            },
            createdAt: favCurrency.createdAt,
            updatedAt: favCurrency.updatedAt
          };
        } catch (error) {
          return {
            id: favCurrency._id,
            currency: favCurrency.currency,
            nickname: favCurrency.nickname,
            priority: favCurrency.priority,
            isDefault: favCurrency.isDefault,
            rates: {
              [`${baseCurrency}_to_${favCurrency.currency}`]: 'Error',
              [`${favCurrency.currency}_to_${baseCurrency}`]: 'Error'
            },
            createdAt: favCurrency.createdAt,
            updatedAt: favCurrency.updatedAt
          };
        }
      })
    );

    res.json({
      count: currenciesWithRates.length,
      baseCurrency,
      favoriteCurrencies: currenciesWithRates
    });

  } catch (error) {
    res.status(500).json({ error: 'Error al obtener las monedas favoritas' });
  }
};

// Eliminar una moneda favorita
const deleteFavoriteCurrency = async (req, res) => {
  try {
    const userId = req.user.userId;
    const favoriteCurrencyId = req.params.id;

    const result = await FavoriteCurrency.deleteOne({ _id: favoriteCurrencyId, user: userId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Moneda favorita no encontrada' });
    }

    res.json({ message: 'Moneda favorita eliminada exitosamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar la moneda favorita' });
  }
};

// Actualizar una moneda favorita (nickname, priority, isDefault)
const updateFavoriteCurrency = async (req, res) => {
  try {
    const userId = req.user.userId;
    const favoriteCurrencyId = req.params.id;
    const { nickname, priority, isDefault } = req.body;

    const favoriteCurrency = await FavoriteCurrency.findOne({ _id: favoriteCurrencyId, user: userId });

    if (!favoriteCurrency) {
      return res.status(404).json({ error: 'Moneda favorita no encontrada' });
    }

    // Actualizar campos permitidos
    if (typeof nickname !== 'undefined') favoriteCurrency.nickname = nickname;
    if (typeof priority !== 'undefined') favoriteCurrency.priority = priority;
    if (typeof isDefault !== 'undefined') favoriteCurrency.isDefault = isDefault;

    await favoriteCurrency.save();

    res.json({
      message: 'Moneda favorita actualizada exitosamente',
      favoriteCurrency
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar la moneda favorita' });
  }
};

// Obtener lista simplificada para dropdowns
const getFavoriteCurrenciesForDropdown = async (req, res) => {
  try {
    const userId = req.user.userId;

    const favoriteCurrencies = await FavoriteCurrency.find({ user: userId })
      .sort({ priority: 1, currency: 1 })
      .select('currency nickname isDefault');

    const simplified = favoriteCurrencies.map(fav => ({
      code: fav.currency,
      name: fav.nickname || fav.currency,
      isDefault: fav.isDefault
    }));

    res.json(simplified);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener monedas para dropdown' });
  }
};

module.exports = {
  addFavoriteCurrency,
  getFavoriteCurrencies,
  deleteFavoriteCurrency,
  updateFavoriteCurrency,
  getFavoriteCurrenciesForDropdown
};
