import { test, expect } from '@playwright/test';

test.describe('Garde auth /client/*', () => {
  test('accès à /client/dashboard sans cookie redirige vers /login', async ({ page }) => {
    await page.goto('/client/dashboard');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('accès à /client/customize sans cookie redirige vers /login', async ({ page }) => {
    await page.goto('/client/customize');
    await expect(page).toHaveURL(/\/login$/);
  });
});
