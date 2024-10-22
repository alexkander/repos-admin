module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json',
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 2021,
  },
  plugins: [
    '@typescript-eslint',
    'react',
    'react-hooks',
    'jest',
    'simple-import-sort',
    'tailwindcss',
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:jest/recommended',
    'plugin:prettier/recommended',
    'prettier',
  ],
  env: {
    browser: true,
    node: true,
    jest: true,
    es6: true,
  },
  settings: {
    react: {
      version: 'detect',
    },
    'import/resolver': {
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      },
    },
  },
  ignorePatterns: ['.eslintrc.js', 'next.config.js', 'out/**/*', '.next/**/*'],
  rules: {
    'prettier/prettier': ['error', require('./.prettierrc.js')],
    'react/prop-types': 'off',
    'react/react-in-jsx-scope': 'off',
    'no-duplicate-imports': 'error',
    'simple-import-sort/imports': 'error',
    'simple-import-sort/exports': 'error',
    '@typescript-eslint/no-unused-vars': [
      'error',
      { destructuredArrayIgnorePattern: '^_' },
    ],
    '@typescript-eslint/no-explicit-any': 'off',
    'no-console': 'warn',
    'no-param-reassign': 'off',
    'tailwindcss/classnames-order': 'error',
    'tailwindcss/no-custom-classname': 'error',
  },
  overrides: [
    {
      files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
      rules: {
        'import/no-extraneous-dependencies': ['error', { devDependencies: true }],
      },
    },
  ],
};
