const Favorite = require('../models/Favorite');
const axios = require('axios');

// Añadir un par a favoritos
const addFavorite = async (req, res) => {
  try {
    const { from, to, nickname } = req.body;
    const userId = req.user.userId;

    // Validaciones
    if (!from || !to) {
      return res.status(400).json({ error: 'Debes especificar las monedas de origen y destino' });
    }

    if (from.length !== 3 || to.length !== 3) {
      return res.status(400).json({ error: 'Las monedas deben tener exactamente 3 caracteres' });
    }

    if (from.toLowerCase() === to.toLowerCase()) {
      return res.status(400).json({ error: 'Las monedas de origen y destino deben ser diferentes' });
    }

    // Verificar que el par de monedas sea válido consultando la API
    try {
      const response = await axios.get(`https://api.frankfurter.app/latest?from=${from.toUpperCase()}&to=${to.toUpperCase()}`);
      const currentRate = response.data.rates[to.toUpperCase()];
      
      if (!currentRate) {
        return res.status(400).json({ error: 'Par de monedas no soportado por la API' });
      }

      const newFavorite = new Favorite({
        user: userId,
        from: from.toUpperCase(),
        to: to.toUpperCase(),
        nickname: nickname || ''
      });

      await newFavorite.save();

      res.status(201).json({
        message: 'Par añadido a favoritos exitosamente',
        favorite: newFavorite,
        currentRate,
        description: `${from.toUpperCase()}/${to.toUpperCase()} = ${currentRate}`
      });

    } catch (apiError) {
      return res.status(400).json({ error: 'Par de monedas no válido o no disponible' });
    }

  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Este par ya está en tus favoritos' });
    }
    res.status(500).json({ error: 'Error al añadir el par a favoritos' });
  }
};

// Listar favoritos del usuario con tipos de cambio actuales
const getFavorites = async (req, res) => {
  try {
    const userId = req.user.userId;
    const favorites = await Favorite.find({ user: userId }).sort({ createdAt: -1 });

    if (favorites.length === 0) {
      return res.json({
        count: 0,
        favorites: [],
        message: 'No tienes pares favoritos aún'
      });
    }

    // Obtener tipos de cambio actuales para todos los favoritos
    const favoritesWithRates = await Promise.all(
      favorites.map(async (favorite) => {
        try {
          const response = await axios.get(`https://api.frankfurter.app/latest?from=${favorite.from}&to=${favorite.to}`);
          const currentRate = response.data.rates[favorite.to];
          
          return {
            id: favorite._id,
            from: favorite.from,
            to: favorite.to,
            nickname: favorite.nickname,
            currentRate: currentRate || 'N/A',
            pair: `${favorite.from}/${favorite.to}`,
            createdAt: favorite.createdAt,
            updatedAt: favorite.updatedAt
          };
        } catch (error) {
          return {
            id: favorite._id,
            from: favorite.from,
            to: favorite.to,
            nickname: favorite.nickname,
            currentRate: 'Error',
            pair: `${favorite.from}/${favorite.to}`,
            createdAt: favorite.createdAt,
            updatedAt: favorite.updatedAt
          };
        }
      })
    );

    res.json({
      count: favoritesWithRates.length,
      favorites: favoritesWithRates
    });

  } catch (error) {
    res.status(500).json({ error: 'Error al obtener los favoritos' });
  }
};

// Eliminar un favorito
const deleteFavorite = async (req, res) => {
  try {
    const userId = req.user.userId;
    const favoriteId = req.params.id;

    const result = await Favorite.deleteOne({ _id: favoriteId, user: userId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Favorito no encontrado' });
    }

    res.json({ message: 'Favorito eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar el favorito' });
  }
};

// Actualizar nickname de un favorito
const updateFavorite = async (req, res) => {
  try {
    const userId = req.user.userId;
    const favoriteId = req.params.id;
    const { nickname } = req.body;

    const favorite = await Favorite.findOne({ _id: favoriteId, user: userId });

    if (!favorite) {
      return res.status(404).json({ error: 'Favorito no encontrado' });
    }

    favorite.nickname = nickname || '';
    await favorite.save();

    res.json({
      message: 'Favorito actualizado exitosamente',
      favorite
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar el favorito' });
  }
};

module.exports = {
  addFavorite,
  getFavorites,
  deleteFavorite,
  updateFavorite
};