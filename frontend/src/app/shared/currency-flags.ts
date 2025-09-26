// 🌍 MAPEO COMPLETO DE FLAGS PARA TODAS LAS DIVISAS DE FRANKFURTER + ADICIONALES
export const CURRENCY_FLAGS: Record<string, string> = {
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

// 🌟 DIVISAS ADICIONALES NO DISPONIBLES EN FRANKFURTER (ORDENADAS ALFABÉTICAMENTE)
export const ADDITIONAL_CURRENCIES = [
  { code: 'ARS', name: 'Argentine Peso', flag: '🇦🇷', symbol: '$' },
  { code: 'CLP', name: 'Chilean Peso', flag: '🇨�', symbol: '$' },
  { code: 'COP', name: 'Colombian Peso', flag: '🇨�', symbol: '$' },
  { code: 'EGP', name: 'Egyptian Pound', flag: '🇬', symbol: '£' },
  { code: 'KWD', name: 'Kuwaiti Dinar', flag: '��', symbol: 'د.ك' },
  { code: 'PEN', name: 'Peruvian Sol', flag: '��', symbol: 'S/' },
  { code: 'RUB', name: 'Russian Ruble', flag: '��', symbol: '₽' },
  { code: 'UYU', name: 'Uruguayan Peso', flag: '��', symbol: '$U' },
  { code: 'VND', name: 'Vietnamese Dong', flag: '��', symbol: '₫' },
];

// 🌟 DIVISAS PRINCIPALES PARA USUARIOS NO AUTENTICADOS (TOP 8 - ORDENADAS ALFABÉTICAMENTE)
export const LIMITED_CURRENCIES = [
  'AUD',
  'CAD',
  'CHF',
  'CNY',
  'EUR',
  'GBP',
  'JPY',
  'USD',
];
