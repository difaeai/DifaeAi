module.exports = {
  env: {
    node: true,
    es2022: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: ['./tsconfig.json'],
  },
  plugins: ['@typescript-eslint', 'security'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'plugin:security/recommended', 'prettier'],
  rules: {
    'security/detect-object-injection': 'off',
  },
  ignorePatterns: ['dist', 'node_modules'],
};
