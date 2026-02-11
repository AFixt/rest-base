module.exports = {
  env: {
    node: true,
    es2022: true,
    jest: true,
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'commonjs',
  },
  ignorePatterns: ['*.d.ts', 'node_modules/', 'coverage/', 'dist/', 'build/'],
  rules: {
    // Code quality
    'no-console': 'off',
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'prefer-const': 'error',
    'no-var': 'error',

    // Security rules
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',

    // Best practices
    eqeqeq: ['error', 'always'],
    curly: ['warn', 'all'],
  },
};
