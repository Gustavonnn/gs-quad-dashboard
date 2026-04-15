import js from '@eslint/js'
import reactHooksPlugin from 'eslint-plugin-react-hooks'
import reactRefreshPlugin from 'eslint-plugin-react-refresh'
import prettier from 'eslint-config-prettier'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**', 'e2e/**', '*.config.js', '_legacy/**', 'downloaded_js.js'],
  },
  // TypeScript files
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      'react-hooks': reactHooksPlugin,
      'react-refresh': reactRefreshPlugin,
    },
    rules: {
      ...reactHooksPlugin.configs.recommended.rules,
      ...reactRefreshPlugin.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      'react/prop-types': 'off',
      'react/display-name': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  // JS files
  {
    files: ['**/*.js', '**/*.jsx'],
    ...js.configs.recommended,
    languageOptions: {
      globals: {
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        process: 'readonly',
        HTMLElement: 'readonly',
        IntersectionObserver: 'readonly',
        ResizeObserver: 'readonly',
        Element: 'readonly',
        Node: 'readonly',
        SVGElement: 'readonly',
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-undef': 'off',
    },
  },
  prettier
)
