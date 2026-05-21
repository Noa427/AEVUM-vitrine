import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    env: {
      JWT_SECRET: 'test-secret-at-least-32-chars-long!!',
      AEVUM_URL: 'http://localhost:3001',
    },
  },
});
