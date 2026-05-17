// @ts-check
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

/**
 * Flat-config ESLint setup. Strict rule set tuned for a NestJS + TypeScript
 * server: catches common safety issues (no-floating-promises, no-explicit-any,
 * unsafe-* family) while staying friendly to decorator-heavy DI code.
 */
export default tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**', '.eslintcache'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // --- Real safety rules: kept strict ---
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'separate-type-imports' },
      ],
      // Templating numbers/booleans into log messages is normal.
      '@typescript-eslint/restrict-template-expressions': [
        'error',
        { allowNumber: true, allowBoolean: true },
      ],
      'no-empty': ['error', { allowEmptyCatch: true }],
      'preserve-caught-error': 'off',

      // --- Stylistic / noisy: relaxed for pragmatism ---
      // Async port methods often have no `await` (stubs, sync impls behind an async contract).
      '@typescript-eslint/require-await': 'off',
      // We intentionally use bracket access on `process.env` for type-safety
      // with `noUncheckedIndexedAccess`.
      '@typescript-eslint/dot-notation': 'off',
      // Generic identity functions like `enqueue<T>(name, payload: T)` are clearer.
      '@typescript-eslint/no-unnecessary-type-parameters': 'off',
      // Defensive `if (x)` checks against runtime nulls in framework boundaries are fine.
      '@typescript-eslint/no-unnecessary-condition': 'off',
      // We use `(x as unknown as Y)` deliberately at framework boundaries.
      '@typescript-eslint/no-unnecessary-type-assertion': 'warn',
      // Nest constructor injection / decorator patterns.
      '@typescript-eslint/no-extraneous-class': 'off',
      '@typescript-eslint/no-useless-constructor': 'off',
      // Returning a `void` expression from an arrow shorthand is fine in handlers.
      '@typescript-eslint/no-confusing-void-expression': 'off',
      // Record vs index-signature is style.
      '@typescript-eslint/consistent-indexed-object-style': 'off',
      // We use `Object.assign` and dynamic param mapping in a few adapters.
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/non-nullable-type-assertion-style': 'off',
      // @nestjs/terminus 11 marks old HealthIndicator deprecated but the
      // replacement isn't stable across versions yet.
      '@typescript-eslint/no-deprecated': 'off',
      // Logical OR for falsy-empty-string defaults is intentional in places.
      '@typescript-eslint/prefer-nullish-coalescing': 'warn',
      '@typescript-eslint/prefer-optional-chain': 'warn',
      'no-useless-escape': 'warn',
    },
  },
  {
    files: ['**/*.spec.ts', 'test/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/require-await': 'off',
    },
  },
  {
    files: ['eslint.config.mjs'],
    languageOptions: { parserOptions: { project: null } },
  },
  prettier,
);
