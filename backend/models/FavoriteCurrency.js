const mongoose = require('mongoose');

const favoriteCurrencySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  currency: {
    type: String,
    required: true,
    uppercase: true,
    minlength: 3,
    maxlength: 3,
    validate: {
      validator: function(v) {
        // Lista de monedas soportadas por Frankfurter
        const supportedCurrencies = [
          'AUD', 'BGN', 'BRL', 'CAD', 'CHF', 'CNY', 'CZK', 'DKK', 'EUR', 'GBP', 'HKD',
          'HUF', 'IDR', 'ILS', 'INR', 'ISK', 'JPY', 'KRW', 'MXN', 'MYR', 'NOK', 'NZD',
          'PHP', 'PLN', 'RON', 'SEK', 'SGD', 'THB', 'TRY', 'USD', 'ZAR'
        ];
        return supportedCurrencies.includes(v);
      },
      message: 'Moneda no soportada'
    }
  },
  nickname: {
    type: String,
    default: ''
  }, // Ej: "Mi moneda principal", "Para viajes", etc.
  priority: {
    type: Number,
    default: 1,
    min: 1,
    max: 10
  }, // Para ordenar en dropdowns (1 = más importante)
  isDefault: {
    type: Boolean,
    default: false
  }, // Solo una puede ser la predeterminada por usuario

  // Para evitar duplicados de la misma moneda por usuario
  userCurrency: {
    type: String,
    unique: true
  }
}, {
  timestamps: true
});

// Crear índice compuesto antes de guardar para evitar duplicados
favoriteCurrencySchema.pre('save', function(next) {
  this.userCurrency = `${this.user}_${this.currency}`;
  next();
});

// Middleware para asegurar que solo hay una moneda predeterminada por usuario
favoriteCurrencySchema.pre('save', async function(next) {
  if (this.isDefault) {
    // Si esta moneda se marca como predeterminada, quitar la marca de las demás
    await this.constructor.updateMany(
      { user: this.user, _id: { $ne: this._id } },
      { isDefault: false }
    );
  }
  next();
});

module.exports = mongoose.model('FavoriteCurrency', favoriteCurrencySchema);
