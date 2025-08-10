module.exports = {
  env: { node: true, es2022: true, jest: true },
  extends: ['standard'],
  parserOptions: { ecmaVersion: 'latest' },
  rules: {
    semi: 'off',
    'space-before-function-paren': 'off',
    'no-console': 'off',
    'no-trailing-spaces': 'warn',
    'padded-blocks': 'off'
  },
  ignorePatterns: ['node_modules/', 'coverage/']
};
