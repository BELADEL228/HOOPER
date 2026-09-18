import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Environnement Node.js pour les tests backend (pas de DOM)
    environment: 'node',
    // Fichiers de test
    include: ['src/__tests__/**/*.{test,spec}.ts'],
    // Couverture de code
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      include: ['src/**/*.ts'],
      exclude: ['src/__tests__/**', 'src/server.ts'],
      thresholds: {
        lines: 30,
        functions: 30,
      },
    },
    // Timeout plus long pour les tests d'intégration (BD)
    testTimeout: 15000,
    hookTimeout: 15000,
  },
});
