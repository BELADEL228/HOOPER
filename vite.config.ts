/// <reference types="vitest" />
import path from 'node:path';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    react(),
    ...(process.env.VITEST ? [] : [tailwindcss()]),
  ],

  publicDir: path.resolve(import.meta.dirname, 'public'),

  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
  },

  optimizeDeps: {
    include: ['recharts'],
  },

  test: {
    environment: 'jsdom',
    pool: 'forks',
    setupFiles: ['./apps/web/src/__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      exclude: [
        'node_modules/**',
        'apps/web/src/__tests__/**',
        'apps/web/src/main.tsx',
        '*.config.*',
        'backend/**',
        'apps/api/**',
        'ai-service/**',
      ],
      thresholds: {
        lines: 40,
        functions: 40,
      },
    },
    include: ['apps/web/src/__tests__/**/*.{test,spec}.{ts,tsx}'],
    globals: true,
  },

  build: {
    sourcemap: true,
  },
});