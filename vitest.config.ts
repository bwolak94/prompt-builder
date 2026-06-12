import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/test/', 'src/db/types.ts', '**/*.astro'],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      'astro:middleware': resolve(__dirname, './src/__mocks__/astro-middleware.ts'),
    },
  },
});
