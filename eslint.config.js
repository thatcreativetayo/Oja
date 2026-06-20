const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const globals = require('globals');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    files: ['*.config.js', 'babel.config.js', 'metro.config.js', 'tailwind.config.js'],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    rules: {
      'react/display-name': 'off',
    },
  },
]);
