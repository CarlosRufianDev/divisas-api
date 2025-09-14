// 🌍 MAPEO COMPLETO DE FLAGS PARA TODAS LAS DIVISAS DE FRANKFURTER + ADICIONALES
export const CURRENCY_FLAGS: { [key: string]: string } = {
  ARS: '🇦🇷', // Argentine Peso (agregado manualmente - no está en Frankfurter)
  AUD: '🇦🇺', // Australian Dollar
  BGN: '🇧🇬', // Bulgarian Lev
  BRL: '🇧🇷', // Brazilian Real
  CAD: '🇨🇦', // Canadian Dollar
  CHF: '🇨🇭', // Swiss Franc
  CLP: '🇨🇱', // Chilean Peso
  CNY: '🇨🇳', // Chinese Renminbi Yuan
  COP: '🇨🇴', // Colombian Peso
  CZK: '🇨🇿', // Czech Koruna
  DKK: '🇩🇰', // Danish Krone
  EGP: '🇪🇬', // Egyptian Pound
  EUR: '🇪🇺', // Euro
  GBP: '🇬🇧', // British Pound
  HKD: '🇭🇰', // Hong Kong Dollar
  HUF: '🇭🇺', // Hungarian Forint
  IDR: '🇮🇩', // Indonesian Rupiah
  ILS: '🇮🇱', // Israeli New Sheqel
  INR: '🇮🇳', // Indian Rupee
  ISK: '🇮🇸', // Icelandic Króna
  JPY: '🇯🇵', // Japanese Yen
  KRW: '🇰🇷', // South Korean Won
  KWD: '🇰🇼', // Kuwaiti Dinar
  MXN: '🇲🇽', // Mexican Peso
  MYR: '🇲🇾', // Malaysian Ringgit
  NOK: '🇳🇴', // Norwegian Krone
  NZD: '🇳🇿', // New Zealand Dollar
  PEN: '🇵🇪', // Peruvian Sol
  PHP: '🇵🇭', // Philippine Peso
  PLN: '🇵🇱', // Polish Złoty
  RON: '🇷🇴', // Romanian Leu
  RUB: '🇷🇺', // Russian Ruble
  SEK: '🇸🇪', // Swedish Krona
  SGD: '🇸🇬', // Singapore Dollar
  THB: '🇹🇭', // Thai Baht
  TRY: '🇹🇷', // Turkish Lira
  USD: '🇺🇸', // United States Dollar
  UYU: '🇺🇾', // Uruguayan Peso
  VND: '🇻🇳', // Vietnamese Dong
  ZAR: '🇿🇦', // South African Rand
};

// 🌟 DIVISAS ADICIONALES NO DISPONIBLES EN FRANKFURTER
export const ADDITIONAL_CURRENCIES = [
  { code: 'ARS', name: 'Argentine Peso', flag: '🇦🇷' },
  { code: 'COP', name: 'Colombian Peso', flag: '🇨🇴' },
  { code: 'CLP', name: 'Chilean Peso', flag: '🇨🇱' },
  { code: 'PEN', name: 'Peruvian Sol', flag: '🇵🇪' },
  { code: 'UYU', name: 'Uruguayan Peso', flag: '🇺🇾' },
  { code: 'RUB', name: 'Russian Ruble', flag: '🇷🇺' },
  { code: 'EGP', name: 'Egyptian Pound', flag: '🇪🇬' },
  { code: 'VND', name: 'Vietnamese Dong', flag: '🇻🇳' },
  { code: 'KWD', name: 'Kuwaiti Dinar', flag: '🇰🇼' },
];

// 🌟 DIVISAS PRINCIPALES PARA USUARIOS NO AUTENTICADOS (TOP 8)
export const LIMITED_CURRENCIES = [
  'USD',
  'EUR',
  'JPY',
  'GBP',
  'CHF',
  'CAD',
  'AUD',
  'CNY',
];
