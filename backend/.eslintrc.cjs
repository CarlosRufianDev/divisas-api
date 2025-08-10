module.exports = {
  root: true,
  env: { node: true, es2022: true },
  extends: ['standard'],
  parserOptions: { ecmaVersion: 'latest' },
  rules: {
    // Permitimos ; para no hacer refactor masivo ahora
    semi: 'off',
    // Evitar miles de diffs ahora
    'space-before-function-paren': 'off',
    'no-multiple-empty-lines': ['warn', { max: 3 }],
    'no-trailing-spaces': 'warn',
    'object-shorthand': 'off',
    // Mantén logs (los revisarás luego)
    'no-console': 'off'
  },
  ignorePatterns: ['node_modules/', 'coverage/']
};
