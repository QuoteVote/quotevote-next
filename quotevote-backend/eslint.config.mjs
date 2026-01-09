import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';

/** @type {import('eslint').Linter.Config[]} */
export default [
  { files: ['**/*.{js,mjs,cjs,ts}'] },
  { languageOptions: { globals: globals.node } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.test.{js,ts}', '**/__tests__/**/*.{js,ts}', '**/__mocks__/**/*.{js,ts}'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
  },
  {
    ignores: ['dist/'], // Ignore built files
  },
];
