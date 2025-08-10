module.exports = {
  root: true,
  env: { node: true, es2022: true },
  extends: ['standard'],
  parserOptions: { ecmaVersion: 'latest' },
  rules: {
    'no-console': 'off',
    'promise/param-names': 'off',
    'n/no-unsupported-features/es-builtins': 'off'
  },
  ignorePatterns: ['node_modules/', 'coverage/']
}
