import eslintPluginAstro from 'eslint-plugin-astro';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  // TypeScript rules
  ...tseslint.configs.recommended,

  // Astro rules (flat config variant)
  ...eslintPluginAstro.configs['flat/recommended'],

  // React hooks rules
  {
    plugins: {
      'react-hooks': reactHooksPlugin,
    },
    rules: {
      ...reactHooksPlugin.configs.recommended.rules,
    },
  },

  // Project-wide custom rules
  {
    rules: {
      // Enforce no implicit any — fail fast on type errors
      '@typescript-eslint/no-explicit-any': 'error',
      // Allow unused vars prefixed with _ (common pattern for intentional ignores)
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // Enforce type imports for better tree-shaking
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      // Disallow non-null assertions — use type guards instead
      '@typescript-eslint/no-non-null-assertion': 'error',
    },
  },

  // Astro env.d.ts: triple-slash references are the official Astro pattern
  // and the empty App.Locals interface is intentionally populated incrementally by middleware
  {
    files: ['src/env.d.ts'],
    rules: {
      '@typescript-eslint/triple-slash-reference': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
    },
  },

  // Global ignores
  {
    ignores: ['dist/', '.astro/', 'node_modules/', 'src/db/types.ts'],
  },
);
