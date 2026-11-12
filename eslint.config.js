import js from '@eslint/js';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import globals from 'globals';
import stylistic from '@stylistic/eslint-plugin';
import esImport from 'eslint-plugin-import-x';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', '.yarn', 'eslint.config.js'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parser: tseslint.parser,
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
        project: ['./tsconfig.eslint.json'],
      },
    },
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooks,
      import: esImport,
      '@typescript-eslint': tseslint.plugin,
      'jsx-a11y': jsxA11y,
      '@stylistic': stylistic,
    },
    settings: {
      'import-x/resolver': {
        typescript: {
          project: './tsconfig.json',
        },
      },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'no-console': 'error',
      'no-var': 'error',
      semi: 'error',
      'linebreak-style': 'off',
      'no-trailing-spaces': 'error',
      'no-multiple-empty-lines': ['error', { max: 1, maxEOF: 0 }],
      'space-infix-ops': 'off',
      'object-curly-spacing': 'off',
      'comma-spacing': 'off',
      'arrow-spacing': 'off',
      'key-spacing': 'off',
      'sort-imports': ['error', {
        ignoreCase: true,
        ignoreDeclarationSort: true,
        ignoreMemberSort: false,
        memberSyntaxSortOrder: ['none', 'all', 'multiple', 'single'],
      }],
      'no-multi-spaces': 'error',
      '@stylistic/indent': ['error', 2],
      'no-restricted-imports': ['error', {
        patterns: [{ group: ['../../../*'], message: '절대경로로 변경해주세요.' }],
      }],
      'import/no-cycle': ['error', { maxDepth: 4 }],
      'react/self-closing-comp': 'error',
      'import/order': ['error', {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'object', 'unknown', 'type'],
        pathGroups: [
          { pattern: '@/**', group: 'internal', position: 'after' },
          { pattern: '**/*.module.scss', group: 'type', position: 'after' },
        ],
        pathGroupsExcludedImportTypes: [],
      }],
      'brace-style': ['error', '1tbs', { allowSingleLine: true }],
      'jsx-quotes': ['error', 'prefer-double'],
      quotes: ['error', 'single'],
      'import/newline-after-import': ['error', { count: 1 }],
      '@stylistic/jsx-first-prop-new-line': ['error', 'multiline-multiprop'],
      '@stylistic/jsx-max-props-per-line': ['error', { maximum: 1, when: 'multiline' }],
      '@stylistic/jsx-closing-bracket-location': ['error', 'line-aligned'],
      'object-property-newline': ['error', { allowAllPropertiesOnSameLine: true }],
      '@stylistic/jsx-closing-tag-location': 'error',
      'react/button-has-type': 'error',
      '@stylistic/jsx-curly-spacing': ['error', { when: 'never', children: true }],
      'padded-blocks': ['error', 'never'],
      'object-shorthand': ['error', 'always'],
      radix: ['error', 'always'],
      '@stylistic/jsx-tag-spacing': ['error', { beforeSelfClosing: 'always', beforeClosing: 'never' }],
      'jsx-a11y/label-has-associated-control': [2, { labelAttributes: ['htmlFor'], depth: 3 }],
      'comma-dangle': ['error', 'always-multiline'],
      '@stylistic/keyword-spacing': ['error', { before: true, after: true }],
      '@stylistic/space-infix-ops': ['error'],
      '@stylistic/object-curly-spacing': ['error', 'always'],
      '@stylistic/comma-spacing': ['error', { before: false, after: true }],
      '@stylistic/arrow-spacing': ['error', { before: true, after: true }],
      '@stylistic/key-spacing': ['error', { beforeColon: false, afterColon: true, mode: 'strict' }],
      '@stylistic/space-in-parens': ['error', 'never'],
      'no-useless-rename': ['error'],
      '@typescript-eslint/no-unused-vars': ['error', { ignoreRestSiblings: true, argsIgnorePattern: '^_' }],
      '@typescript-eslint/dot-notation': 'error',
    },
  },
);
