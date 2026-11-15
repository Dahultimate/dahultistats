import js from '@eslint/js'
import prettier from 'eslint-config-prettier'
import pluginVue from 'eslint-plugin-vue'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'playwright-report', 'test-results'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  {
    files: ['**/*.vue'],
    languageOptions: { parserOptions: { parser: tseslint.parser } },
  },
  {
    rules: {
      'no-console': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      'sort-imports': ['error', { ignoreDeclarationSort: true, ignoreCase: true }],
      // TypeScript vérifie déjà les variables globales (DOM, Node).
      'no-undef': 'off',
    },
  },
  {
    // Le domaine reste du TypeScript pur : ni Vue, ni navigateur.
    files: ['src/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: ['vue', 'pinia', 'vue-router', '@/services/*', '@/stores/*', '@/components/*'],
        },
      ],
      'no-restricted-globals': ['error', 'window', 'document', 'localStorage', 'navigator'],
    },
  },
  prettier,
)
