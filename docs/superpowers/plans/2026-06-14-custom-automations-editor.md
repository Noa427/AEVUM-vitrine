# Éditeur riche automatisations custom + limite 10 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Donner au modal de création d'automatisation personnalisée (`#auto-modal` dans `customize.astro`) la même UX que l'éditeur de templates par défaut (onglets "Rédiger" / "Générer avec l'IA"), et limiter à 10 le nombre d'automatisations personnalisées par formation (front + back).

**Architecture:** Réutilisation des classes CSS globales existantes (`.editor-tabs`, `.editor-tab`, `.tab-panel`, `.generation-result`, `.ai-error`, `.btn-generate`) et duplication du pattern JS déjà utilisé dans `initCustomEditor()` (génération IA + "Utiliser ce contenu") adapté au contexte du modal. Limite 10 : check frontend (désactivation bouton) + check backend (comptage avant insert).

**Tech Stack:** Astro 6 (SSR), TypeScript, vanilla JS (scripts inline), Express + Supabase (backend séparé `AEVUM_LOGI_INFOPRENEUR/backend`).

---

## Spec de référence

`docs/superpowers/specs/2026-06-14-custom-automations-editor-design.md`

## Fichiers concernés

- Modifier : `src/pages/client/customize.astro`
  - Frontmatter (~ligne 124-129) : calcul `autoLimitReached`
  - HTML modal (~lignes 1442-1492) : structure onglets + bouton désactivé
  - JS `initAutomations()` (~lignes 2122-2215) : switch onglets, génération IA, reset à l'ouverture
- Modifier : `../AEVUM_LOGI_INFOPRENEUR/backend/src/routes/clientAuth.ts` (~lignes 581-604) : check de comptage avant insert
- Modifier : `e2e/mock-backend.mjs` : ajouter route `/client/ai/generate`
- Modifier : `e2e/client-portal.spec.ts` : nouveaux scénarios (génération IA dans le modal, limite atteinte)

---

### Task 1: Backend — limite 10 sur POST /client/automations/custom

**Files:**
- Modify: `../AEVUM_LOGI_INFOPRENEUR/backend/src/routes/clientAuth.ts:581-604`

- [ ] **Step 1: Lire le handler actuel pour confirmer le point d'insertion**

Le handler `POST /client/automations/custom` (ligne 581) calcule déjà `formationId` via `getFormationContext` (ligne 585) avant les validations de `trigger_type`. Le check de comptage doit s'insérer juste après cette ligne, avant les validations existantes.

- [ ] **Step 2: Ajouter le check de comptage**

Remplacer (lignes 585-593) :

```ts
  const { formationId, unauthorized } = await getFormationContext(clientId, req)
  if (unauthorized) return res.status(403).json({ error: 'Formation introuvable ou accès refusé' })

  if (trigger_type === 'delay_after_purchase' && trigger_delay_days == null) {
    return res.status(400).json({ error: 'trigger_delay_days requis pour delay_after_purchase' })
  }
  if (trigger_type === 'specific_date' && !trigger_date) {
    return res.status(400).json({ error: 'trigger_date requis pour specific_date' })
  }
```

par :

```ts
  const { formationId, unauthorized } = await getFormationContext(clientId, req)
  if (unauthorized) return res.status(403).json({ error: 'Formation introuvable ou accès refusé' })

  if (trigger_type === 'delay_after_purchase' && trigger_delay_days == null) {
    return res.status(400).json({ error: 'trigger_delay_days requis pour delay_after_purchase' })
  }
  if (trigger_type === 'specific_date' && !trigger_date) {
    return res.status(400).json({ error: 'trigger_date requis pour specific_date' })
  }

  let countQuery = supabase
    .from('custom_automations')
    .select('id', { count: 'exact', head: true })
    .eq('client_id', clientId)
  if (formationId) countQuery = countQuery.eq('formation_id', formationId)
  const { count, error: countError } = await countQuery
  if (countError) return res.status(500).json({ error: countError.message })
  if ((count ?? 0) >= 10) {
    return res.status(400).json({ error: 'Limite de 10 automatisations personnalisées atteinte' })
  }
```

- [ ] **Step 3: Vérification manuelle**

Démarrer le backend localement (`npm run dev` dans `AEVUM_LOGI_INFOPRENEUR/backend`), créer 10 automatisations via l'UI ou `curl -X POST .../client/automations/custom`, vérifier que la 11e renvoie `400 { error: 'Limite de 10 automatisations personnalisées atteinte' }`. Pas de suite de tests automatisés existante pour `clientAuth.ts` — vérification manuelle uniquement.

- [ ] **Step 4: Commit (dans le repo backend)**

```bash
cd ../AEVUM_LOGI_INFOPRENEUR
git add backend/src/routes/clientAuth.ts
git commit -m "feat(backend): limite 10 automatisations personnalisées par formation"
```

⚠️ Ce repo a d'autres fichiers modifiés (`backend/src/routes/clients.ts`, `dashboard.ts`, `frontend/...`, `backend/src/utils/pricing.ts`) appartenant à un autre travail en cours — ne **pas** les ajouter au commit. Stage uniquement `backend/src/routes/clientAuth.ts`.

---

### Task 2: Frontend — calcul `autoLimitReached` + bandeau/désactivation bouton

**Files:**
- Modify: `src/pages/client/customize.astro:124-129` (frontmatter)
- Modify: `src/pages/client/customize.astro:1440-1450` (HTML section header)

- [ ] **Step 1: Ajouter le calcul après le chargement de `customAutomations`**

Dans le frontmatter, après (ligne 124-128) :

```ts
let customAutomations: CustomAutomation[] = [];
if (customAutoResult.status === 'fulfilled' && customAutoResult.value.ok) {
  const arr = await customAutoResult.value.json().catch(() => []);
  customAutomations = Array.isArray(arr) ? arr : [];
}
```

ajouter :

```ts
const autoLimitReached = customAutomations.length >= 10;
```

- [ ] **Step 2: Désactiver le bouton et afficher le message**

Remplacer (lignes 1440-1449) :

```astro
      <div class="auto-section-header">
        <h2 class="auto-section-title">Mes automatisations personnalisées</h2>
        <button type="button" class="btn btn-primary" id="btn-open-auto-modal">+ Créer une automatisation</button>
      </div>

      {errorType === 'create_automation' && (
        <div class="auto-create-error" id="auto-create-error" role="alert">
          <strong>Erreur lors de la création :</strong> {errorMsg}
        </div>
      )}
```

par :

```astro
      <div class="auto-section-header">
        <h2 class="auto-section-title">Mes automatisations personnalisées</h2>
        <button type="button" class="btn btn-primary" id="btn-open-auto-modal" disabled={autoLimitReached}>+ Créer une automatisation</button>
      </div>

      {autoLimitReached && (
        <p class="auto-limit-msg" role="status">
          Limite de 10 automatisations personnalisées atteinte. Supprimez-en une pour en créer une nouvelle.
        </p>
      )}

      {errorType === 'create_automation' && (
        <div class="auto-create-error" id="auto-create-error" role="alert">
          <strong>Erreur lors de la création :</strong> {errorMsg}
        </div>
      )}
```

- [ ] **Step 3: Ajouter le style `.auto-limit-msg`**

Chercher la règle CSS `.auto-empty` (proche de `.auto-list`, ~ligne 3327) et ajouter juste après :

```css
.auto-limit-msg {
  margin: 0 0 1rem;
  padding: 0.75rem 1rem;
  border-radius: var(--radius-sm);
  background: rgba(245, 158, 11, 0.15);
  color: #F59E0B;
  font-size: 0.875rem;
}
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/client/customize.astro
git commit -m "feat(customize): limite 10 automatisations perso (front)"
```

---

### Task 3: Frontend — restructurer le modal de création avec onglets Rédiger/Générer IA

**Files:**
- Modify: `src/pages/client/customize.astro:1453-1492`

- [ ] **Step 1: Remplacer la structure du formulaire du modal**

Remplacer le bloc (lignes 1453-1492) :

```astro
          <form method="POST" class="auto-create-form" data-astro-reload style="display:flex;flex-direction:column;gap:0.75rem">
            <input type="hidden" name="action" value="create_automation" />
            <label class="form-label">Nom</label>
            <input type="text" name="auto_name" class="form-input" placeholder="Ex : Upsell J+14" required />
            <label class="form-label">Déclencheur</label>
            <select name="trigger_type" id="modal-trigger-type" class="form-input">
              <option value="delay_after_purchase">X jours après l'achat</option>
              <option value="specific_date">Date précise</option>
              <option value="payment_failed">Après un paiement échoué</option>
            </select>
            <div id="modal-days-field">
              <label class="form-label">Nombre de jours</label>
              <input type="number" name="trigger_days" class="form-input" min="1" placeholder="Ex : 14" />
            </div>
            <div id="modal-date-field" style="display:none">
              <label class="form-label">Date</label>
              <input type="date" name="trigger_date" class="form-input" />
            </div>
            <label class="form-label">Sujet de l'email</label>
            <input type="text" name="auto_subject" class="form-input" placeholder="Sujet..." required />
            <label class="form-label">Corps de l'email</label>
            <textarea name="auto_body" class="form-input cust-textarea modal-body-textarea" rows={5} placeholder="Corps..." required></textarea>
            <div class="cust-hints">
              <p class="cust-hints-label">Variables disponibles — cliquez pour insérer :</p>
              <div class="cust-hints-list">
                {['{{nom}}', '{{prenom}}', '{{email}}', '{{nom_formation}}', '{{lien_acces}}'].map((v) => (
                  <code class="cust-hint modal-hint" data-var={v}>{v}</code>
                ))}
              </div>
            </div>
            <button type="button" class="btn btn-secondary" id="modal-improve-btn" disabled>🔧 Améliorer avec l'IA</button>
            <p class="ai-error" id="modal-improve-error"></p>
            <div style="display:flex;gap:0.75rem;margin-top:0.5rem">
              <button type="submit" class="btn btn-primary">Créer</button>
              <button type="button" class="btn btn-secondary" id="btn-close-auto-modal">Annuler</button>
            </div>
          </form>
```

par :

```astro
          <form method="POST" class="auto-create-form" data-astro-reload style="display:flex;flex-direction:column;gap:0.75rem">
            <input type="hidden" name="action" value="create_automation" />
            <label class="form-label">Nom</label>
            <input type="text" name="auto_name" class="form-input" placeholder="Ex : Upsell J+14" required />
            <label class="form-label">Déclencheur</label>
            <select name="trigger_type" id="modal-trigger-type" class="form-input">
              <option value="delay_after_purchase">X jours après l'achat</option>
              <option value="specific_date">Date précise</option>
              <option value="payment_failed">Après un paiement échoué</option>
            </select>
            <div id="modal-days-field">
              <label class="form-label">Nombre de jours</label>
              <input type="number" name="trigger_days" class="form-input" min="1" placeholder="Ex : 14" />
            </div>
            <div id="modal-date-field" style="display:none">
              <label class="form-label">Date</label>
              <input type="date" name="trigger_date" class="form-input" />
            </div>

            <div class="editor-tabs">
              <button type="button" class="editor-tab active" data-tab="manual">✏️ Rédiger moi-même</button>
              <button type="button" class="editor-tab" data-tab="generate">✨ Générer avec l'IA</button>
            </div>

            <div class="tab-panel" data-panel="manual">
              <label class="form-label">Sujet de l'email</label>
              <input type="text" name="auto_subject" class="form-input" placeholder="Sujet..." required />
              <label class="form-label">Corps de l'email</label>
              <textarea name="auto_body" class="form-input cust-textarea modal-body-textarea" rows={5} placeholder="Corps..." required></textarea>
              <div class="cust-hints">
                <p class="cust-hints-label">Variables disponibles — cliquez pour insérer :</p>
                <div class="cust-hints-list">
                  {['{{nom}}', '{{prenom}}', '{{email}}', '{{nom_formation}}', '{{lien_acces}}'].map((v) => (
                    <code class="cust-hint modal-hint" data-var={v}>{v}</code>
                  ))}
                </div>
              </div>
              <button type="button" class="btn btn-secondary" id="modal-improve-btn" disabled>🔧 Améliorer avec l'IA</button>
              <p class="ai-error" id="modal-improve-error"></p>
            </div>

            <div class="tab-panel hidden" data-panel="generate">
              <input type="text" class="form-input gen-formation"
                     placeholder="Nom de votre formation (ex: Maîtriser Instagram)" />
              <select class="form-input gen-tone">
                <option value="chaleureux">Chaleureux et bienveillant</option>
                <option value="professionnel">Professionnel et direct</option>
                <option value="motivant">Motivant et dynamique</option>
              </select>
              <input type="text" class="form-input gen-objective"
                     placeholder="Objectif de cet email (ex: rassurer, engager, fidéliser)" />
              <button type="button" class="btn btn-primary btn-generate"
                      style="align-self:flex-start">✨ Générer l'email</button>
              <p class="ai-error gen-error"></p>
              <div class="generation-result hidden">
                <input type="text" class="form-input subject-preview"
                       readonly placeholder="Sujet généré" />
                <textarea class="form-input body-preview" rows={4}
                          readonly placeholder="Contenu généré"></textarea>
                <button type="button" class="btn btn-secondary btn-use-result"
                        style="align-self:flex-start">Utiliser ce contenu →</button>
              </div>
            </div>

            <div style="display:flex;gap:0.75rem;margin-top:0.5rem">
              <button type="submit" class="btn btn-primary">Créer</button>
              <button type="button" class="btn btn-secondary" id="btn-close-auto-modal">Annuler</button>
            </div>
          </form>
```

Notes :
- `auto_subject`/`auto_body` restent les `name` attendus par le handler `create_automation` (customize.astro:25-30) — inchangés, juste déplacés dans le tab-panel "manual".
- `type="button"` ajouté sur `.btn-generate`/`.btn-use-result` pour ne pas soumettre le formulaire.

- [ ] **Step 2: Commit**

```bash
git add src/pages/client/customize.astro
git commit -m "feat(customize): structure onglets Rediger/Generer IA dans modal creation automatisation"
```

---

### Task 4: Frontend JS — switch onglets, génération IA, "Utiliser ce contenu", reset à l'ouverture

**Files:**
- Modify: `src/pages/client/customize.astro:2122-2215` (`initAutomations`)

- [ ] **Step 1: Ajouter le switch d'onglets et la génération IA dans `initAutomations`**

Localiser le bloc existant (lignes 2154-2187, juste après la déclaration de `daysInput`/`updateTriggerVisibility`) :

```ts
    const modalTextarea    = modal.querySelector<HTMLTextAreaElement>('.modal-body-textarea');
    const modalSubjectInput = modal.querySelector<HTMLInputElement>('input[name="auto_subject"]');
    const modalImproveBtn   = document.getElementById('modal-improve-btn') as HTMLButtonElement | null;
    const modalImproveError = document.getElementById('modal-improve-error');

    function updateModalImproveState() {
      if (modalImproveBtn) {
        modalImproveBtn.disabled = !modalTextarea?.value.trim();
      }
    }
    modalTextarea?.addEventListener('input', updateModalImproveState);
```

Juste après ce bloc (avant `modalImproveBtn?.addEventListener('click', ...)`), ajouter :

```ts
    const modalTabs   = modal.querySelectorAll<HTMLButtonElement>('.editor-tab');
    const modalPanels = modal.querySelectorAll<HTMLElement>('.tab-panel');
    modalTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        modalTabs.forEach((t) => t.classList.remove('active'));
        modalPanels.forEach((p) => p.classList.add('hidden'));
        tab.classList.add('active');
        modal.querySelector<HTMLElement>(`[data-panel="${tab.dataset.tab}"]`)?.classList.remove('hidden');
      });
    });

    const modalGenBtn    = modal.querySelector<HTMLButtonElement>('.btn-generate');
    const modalGenError  = modal.querySelector<HTMLElement>('.gen-error');
    modalGenBtn?.addEventListener('click', async () => {
      const formationName = modal.querySelector<HTMLInputElement>('.gen-formation')?.value.trim() ?? '';
      const tone          = modal.querySelector<HTMLSelectElement>('.gen-tone')?.value ?? 'chaleureux';
      const objective     = modal.querySelector<HTMLInputElement>('.gen-objective')?.value.trim() ?? '';
      if (modalGenError) { modalGenError.textContent = ''; modalGenError.classList.remove('visible'); }
      modalGenBtn.classList.add('loading');
      modalGenBtn.textContent = 'Génération en cours...';
      try {
        const res  = await fetch('/api/ai-generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emailType: 'custom_automation', formationName, tone, objective }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.subject) throw new Error();
        const result  = modal.querySelector<HTMLElement>('.generation-result');
        const subPrev = modal.querySelector<HTMLInputElement>('.subject-preview');
        const bodPrev = modal.querySelector<HTMLTextAreaElement>('.body-preview');
        if (subPrev) subPrev.value = data.subject;
        if (bodPrev) bodPrev.value = data.body;
        result?.classList.remove('hidden');
      } catch {
        if (modalGenError) { modalGenError.textContent = 'Erreur de génération'; modalGenError.classList.add('visible'); }
      } finally {
        modalGenBtn.classList.remove('loading');
        modalGenBtn.textContent = '✨ Générer l\'email';
      }
    });

    modal.querySelector<HTMLElement>('.btn-use-result')?.addEventListener('click', () => {
      const subject = modal.querySelector<HTMLInputElement>('.subject-preview')?.value ?? '';
      const body    = modal.querySelector<HTMLTextAreaElement>('.body-preview')?.value  ?? '';
      if (modalSubjectInput) modalSubjectInput.value = subject;
      if (modalTextarea)     modalTextarea.value     = body;
      updateModalImproveState();
      modal.querySelector<HTMLButtonElement>('[data-tab="manual"]')?.click();
    });
```

- [ ] **Step 2: Réinitialiser l'onglet et le résultat de génération à l'ouverture**

Remplacer `openModal()` (lignes 2189-2196) :

```ts
    function openModal() {
      const form = modal?.querySelector<HTMLFormElement>('.auto-create-form');
      form?.reset();
      if (triggerSelect) triggerSelect.value = 'delay_after_purchase';
      updateTriggerVisibility();
      updateModalImproveState();
      modal?.classList.remove('hidden');
    }
```

par :

```ts
    function openModal() {
      const form = modal?.querySelector<HTMLFormElement>('.auto-create-form');
      form?.reset();
      if (triggerSelect) triggerSelect.value = 'delay_after_purchase';
      updateTriggerVisibility();
      updateModalImproveState();
      modal?.querySelector<HTMLButtonElement>('[data-tab="manual"]')?.click();
      modal?.querySelector<HTMLElement>('.generation-result')?.classList.add('hidden');
      if (modalGenError) { modalGenError.textContent = ''; modalGenError.classList.remove('visible'); }
      modal?.classList.remove('hidden');
    }
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/client/customize.astro
git commit -m "feat(customize): generation IA et reset onglets dans modal creation automatisation"
```

---

### Task 5: E2E — mock `/client/ai/generate` + scénario génération IA dans le modal

**Files:**
- Modify: `e2e/mock-backend.mjs`
- Modify: `e2e/client-portal.spec.ts`

- [ ] **Step 1: Ajouter la route mock `/client/ai/generate`**

Dans `e2e/mock-backend.mjs`, après le bloc `GET /client/automations/custom` (après ligne 103, avant `POST /client/automations/custom` ligne 105), ajouter :

```js
    if (req.method === 'POST' && pathname === '/client/ai/generate') {
      const body = await readJsonBody(req);
      return json(res, 200, {
        subject: `Sujet généré pour ${body.formationName || 'votre formation'}`,
        body: `Bonjour {{nom}}, contenu généré (${body.tone}, ${body.objective}).`,
      });
    }
```

- [ ] **Step 2: Ajouter le scénario E2E dans `client-portal.spec.ts`**

Le test existant (`e2e/client-portal.spec.ts:39-46`) crée déjà une automatisation via l'onglet "manual" (actif par défaut, donc inchangé). Ajouter un nouveau test dans le même `describe`, après le test existant (après ligne 64, avant la fermeture du `describe` à la ligne 65) :

```ts
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
```

- [ ] **Step 3: Lancer les tests E2E**

```bash
npm run test:e2e
```

Expected: tous les tests passent (le test existant `login → customize → ...` + le nouveau `création automatisation via génération IA`).

- [ ] **Step 4: Commit**

```bash
git add e2e/mock-backend.mjs e2e/client-portal.spec.ts
git commit -m "test(e2e): generation IA dans modal creation automatisation custom"
```

---

### Task 6: E2E — scénario limite 10 atteinte

**Files:**
- Modify: `e2e/client-portal.spec.ts`

- [ ] **Step 1: Ajouter un test qui seed 10 automatisations via l'API mock avant de charger la page**

Ajouter après le test de la Task 5 :

```ts
  test('limite de 10 automatisations personnalisées atteinte', async ({ page, request }) => {
    await page.goto('/login');
    await page.fill('#email', TEST_EMAIL);
    await page.fill('#password', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/client\/dashboard$/);

    // Créer 10 automatisations via le modal pour atteindre la limite
    await page.goto('/client/customize');
    await page.locator('.cat-tab[data-cat="automations"]').click();
    for (let i = 1; i <= 10; i++) {
      await page.locator('#btn-open-auto-modal').click();
      const modal = page.locator('#auto-modal');
      await page.fill('input[name="auto_name"]', `Automatisation ${i}`);
      await page.fill('input[name="trigger_days"]', '1');
      await page.fill('input[name="auto_subject"]', `Sujet ${i}`);
      await page.fill('textarea[name="auto_body"]', `Corps ${i}`);
      await modal.locator('button[type="submit"]').click();
      await page.locator('.cat-tab[data-cat="automations"]').click();
    }

    await expect(page.locator('#btn-open-auto-modal')).toBeDisabled();
    await expect(page.locator('.auto-limit-msg')).toContainText('Limite de 10 automatisations personnalisées atteinte');
  });
```

⚠️ Le mock-backend (`e2e/mock-backend.mjs`) n'implémente pas le check de comptage sur `POST /client/automations/custom` (limite gérée côté vrai backend, Task 1). Ce test vérifie uniquement le comportement **frontend** (`autoLimitReached` calculé à partir de la longueur de `customAutomations` retournée par le mock). C'est suffisant pour couvrir le design frontend ; le check backend (Task 1) reste non couvert par E2E — documenté dans le spec.

- [ ] **Step 2: Lancer les tests E2E**

```bash
npm run test:e2e
```

Expected: les 3 tests du fichier passent.

- [ ] **Step 3: Commit**

```bash
git add e2e/client-portal.spec.ts
git commit -m "test(e2e): limite 10 automatisations personnalisees (front)"
```

---

### Task 7: Vérification finale

- [ ] **Step 1: Build TypeScript + Vercel**

```bash
npm run build
```

Expected: build vert (Astro 6 + adapter Vercel, vérification TS).

- [ ] **Step 2: Tests unitaires**

```bash
npm test
```

Expected: les 5 tests `src/lib/auth.test.ts` passent (aucun changement dans ce périmètre).

- [ ] **Step 3: Tests E2E complets**

```bash
npm run test:e2e
```

Expected: tous les tests `e2e/*.spec.ts` passent (auth-guard + client-portal, incluant les 2 nouveaux scénarios).

- [ ] **Step 4: Vérification visuelle manuelle (dev server)**

```bash
npm run dev
```

Ouvrir `/client/customize`, onglet "Automatisations", cliquer "+ Créer une automatisation" : vérifier visuellement les onglets "✏️ Rédiger moi-même" / "✨ Générer avec l'IA", la génération IA (si `AEVUM_URL` pointe vers un backend réel ou de dev), et que "Utiliser ce contenu →" remplit correctement sujet/corps et bascule sur l'onglet manuel.

---

## Self-Review

- **Spec coverage** : modal onglets (Task 3-4), génération IA + "Utiliser ce contenu" (Task 4), limite 10 front (Task 2) + back (Task 1), tests E2E (Task 5-6). ✅ couvre toutes les sections du spec.
- **Placeholders** : aucun TBD — tout le code est complet et copié des patterns existants (`initCustomEditor`, `.btn-generate` des cartes template).
- **Cohérence des types/sélecteurs** : `.btn-generate`, `.gen-formation`, `.gen-tone`, `.gen-objective`, `.generation-result`, `.subject-preview`, `.body-preview`, `.btn-use-result`, `.gen-error` réutilisent les classes CSS globales déjà stylées (pas de nouvelle classe CSS sauf `.auto-limit-msg`, ajoutée en Task 2 Step 3). `modalSubjectInput`/`modalTextarea` (Task 1 existant) réutilisés tels quels en Task 4.
