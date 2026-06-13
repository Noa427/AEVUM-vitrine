import { defineConfig, devices } from '@playwright/test';
import { APP_PORT, MOCK_PORT, JWT_SECRET } from './e2e/fixtures.mjs';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: `http://localhost:${APP_PORT}`,
  },
  webServer: [
    {
      command: 'node e2e/mock-backend.mjs',
      port: MOCK_PORT,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: `npm run dev -- --port ${APP_PORT}`,
      port: APP_PORT,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      env: {
        AEVUM_URL: `http://localhost:${MOCK_PORT}`,
        JWT_SECRET,
        PUBLIC_CONTACT_FORM_URL: 'https://example.com',
      },
    },
  ],
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
