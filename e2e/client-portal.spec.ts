import { test, expect } from '@playwright/test';
import { TEST_EMAIL, TEST_PASSWORD } from './fixtures.mjs';

test.describe('Portail client — parcours complet', () => {
  test('login → customize → édition template → renommage → automatisation perso', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('#email', TEST_EMAIL);
    await page.fill('#password', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/client\/dashboard$/);

    // Aller sur la page de personnalisation
    await page.goto('/client/customize');
    await expect(page.locator('main h1')).toContainText('Personnaliser les templates');

    // Éditer + sauvegarder le template "Bienvenue" (onboarding j0, actif par défaut)
    const welcomePanel = page.locator('#panel-template_onboarding_j0');
    await welcomePanel.locator('.subject-input').fill('Bienvenue chez nous !');
    await welcomePanel.locator('.body-input').fill('Bonjour {{nom}}, bienvenue dans la formation.');
    await welcomePanel.locator('.cust-save-btn').click();

    await expect(page.locator('#panel-template_onboarding_j0 .success-msg')).toBeVisible();
    await expect(page.locator('#panel-template_onboarding_j0 .subject-input')).toHaveValue('Bienvenue chez nous !');

    // Renommer l'onglet
    const welcomePanelAfterSave = page.locator('#panel-template_onboarding_j0');
    await welcomePanelAfterSave.locator('.btn-section-rename').click();
    await welcomePanelAfterSave.locator('.section-rename-input').fill("Email d'accueil perso");
    await welcomePanelAfterSave.locator('.btn-rename-save').click();

    await expect(page.locator('#tab-template_onboarding_j0')).toHaveText("Email d'accueil perso");
    await expect(welcomePanelAfterSave.locator('.section-title')).toHaveText("Email d'accueil perso");

    // Basculer sur l'onglet "Automatisations"
    await page.locator('.cat-tab[data-cat="automations"]').click();
    await expect(page.locator('[data-cat-panel="automations"]')).toBeVisible();

    // Créer une automatisation personnalisée
    await page.locator('#btn-open-auto-modal').click();
    await expect(page.locator('#auto-modal')).toBeVisible();
    await page.fill('input[name="auto_name"]', 'Relance personnalisée');
    await page.fill('input[name="trigger_days"]', '7');
    await page.fill('input[name="auto_subject"]', 'Un petit coucou');
    await page.fill('textarea[name="auto_body"]', 'Bonjour {{nom}}, comment ça va ?');
    await page.locator('#auto-modal button[type="submit"]').click();

    // Le formulaire recharge la page sur l'onglet par défaut ; revenir sur Automatisations
    await page.locator('.cat-tab[data-cat="automations"]').click();
    const autoItem = page.locator('.auto-item', { hasText: 'Relance personnalisée' });
    await expect(autoItem).toBeVisible();

    // Toggle actif → inactif
    const toggleBtn = autoItem.locator('.btn-auto-toggle');
    await expect(toggleBtn).toHaveText('Actif');
    await toggleBtn.click();
    await expect(toggleBtn).toHaveText('Inactif');

    // Suppression
    await autoItem.locator('.btn-auto-delete').click();
    await expect(page.locator('#delete-modal')).toBeVisible();
    await page.locator('#btn-delete-confirm').click();
    await expect(page.locator('.auto-item', { hasText: 'Relance personnalisée' })).toHaveCount(0);
  });

  test('création automatisation via génération IA', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', TEST_EMAIL);
    await page.fill('#password', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/client\/dashboard$/);

    await page.goto('/client/customize');
    await page.locator('.cat-tab[data-cat="automations"]').click();

    await page.locator('#btn-open-auto-modal').click();
    const modal = page.locator('#auto-modal');
    await expect(modal).toBeVisible();

    await page.fill('input[name="auto_name"]', 'Upsell généré IA');
    await page.fill('input[name="trigger_days"]', '14');

    // Onglet "Générer avec l'IA"
    await modal.locator('.editor-tab[data-tab="generate"]').click();
    await expect(modal.locator('[data-panel="generate"]')).toBeVisible();
    await modal.locator('.gen-formation').fill('Maîtriser Instagram');
    await modal.locator('.btn-generate').click();

    await expect(modal.locator('.generation-result')).toBeVisible();
    await modal.locator('.btn-use-result').click();

    // Retour sur l'onglet manuel avec le contenu généré
    await expect(modal.locator('[data-panel="manual"]')).toBeVisible();
    await expect(modal.locator('input[name="auto_subject"]')).toHaveValue(/Sujet généré pour Maîtriser Instagram/);
    await expect(modal.locator('textarea[name="auto_body"]')).toHaveValue(/contenu généré/);

    await modal.locator('button[type="submit"]').click();

    await page.locator('.cat-tab[data-cat="automations"]').click();
    await expect(page.locator('.auto-item', { hasText: 'Upsell généré IA' })).toBeVisible();
  });
});
