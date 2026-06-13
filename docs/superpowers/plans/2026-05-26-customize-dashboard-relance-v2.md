# Customize & Dashboard — Relance v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer l'onglet unique "Relance paiement" par 3 onglets distincts (J+1/J+3/J+7), afficher des badges d'état réels sur le dashboard en croisant le booléen backend avec les configs JSON, et ajouter un bouton "Améliorer avec l'IA" dans le modal de création d'automatisation.

**Architecture:** Tout se passe dans deux fichiers Astro SSR existants. Pas de nouveaux fichiers ni de nouvelles routes API — les routes proxy existantes (`/api/config-update`, `/api/ai-improve`) gèrent déjà les nouveaux config_types de manière générique. Le JS côté client est générique sur `card.dataset.config` : l'ajout des 3 nouveaux onglets ne nécessite aucun changement JS dans `initEditor()` ni `initConfigTabs()`.

**Tech Stack:** Astro 6 SSR, TypeScript strict, HTML/CSS pur, fetch browser, `Promise.allSettled`.

---

## Fichiers modifiés

| Fichier | Modifications |
|---|---|
| `src/pages/client/customize.astro` | `EMAIL_CONFIGS`, `VARIABLE_HINTS`, `DEFAULT_TEMPLATES`, `allDefaultTemplates` ; bouton IA dans le modal |
| `src/pages/client/dashboard.astro` | 4e appel `Promise.allSettled`, calcul état Onboarding/Recouvrement, badge `.badge-partiel` |

---

## Task 1 : Mise à jour EMAIL_CONFIGS, VARIABLE_HINTS, DEFAULT_TEMPLATES dans customize.astro

**Files:**
- Modify: `src/pages/client/customize.astro:124-176`

- [ ] **Step 1 : Remplacer `VARIABLE_HINTS` — supprimer l'entrée `template_failed_payment`, ajouter les 3 nouvelles**

Localiser le bloc (lignes ~124-129) et le remplacer :

```ts
const VARIABLE_HINTS: Record<string, string[]> = {
  template_onboarding_j0: ['{{nom}}', '{{prenom}}', '{{email}}', '{{nom_formation}}', '{{lien_acces}}', '{{mot_de_passe}}'],
  template_onboarding_j3: ['{{nom}}', '{{prenom}}', '{{email}}', '{{nom_formation}}', '{{lien_acces}}'],
  template_onboarding_j7: ['{{nom}}', '{{prenom}}', '{{email}}', '{{nom_formation}}', '{{lien_acces}}'],
  template_failed_payment_j1: ['{{nom}}', '{{prenom}}', '{{email}}', '{{montant}}', '{{lien_paiement}}'],
  template_failed_payment_j3: ['{{nom}}', '{{prenom}}', '{{email}}', '{{montant}}', '{{lien_paiement}}'],
  template_failed_payment_j7: ['{{nom}}', '{{prenom}}', '{{email}}', '{{montant}}', '{{lien_paiement}}'],
};
```

- [ ] **Step 2 : Remplacer `EMAIL_CONFIGS` — supprimer `template_failed_payment`, ajouter les 3 nouveaux**

Localiser le bloc (lignes ~131-136) et le remplacer :

```ts
const EMAIL_CONFIGS = [
  { key: 'template_onboarding_j0', label: "Email de bienvenue (envoyé immédiatement après l'achat)", tabLabel: 'Bienvenue' },
  { key: 'template_onboarding_j3', label: "Email J+3 (3 jours après l'achat)",                       tabLabel: 'J+3' },
  { key: 'template_onboarding_j7', label: "Email J+7 (7 jours après l'achat)",                        tabLabel: 'J+7' },
  { key: 'template_failed_payment_j1', label: 'Relance paiement J+1 (1 jour après l\'échec)',          tabLabel: 'Relance J+1' },
  { key: 'template_failed_payment_j3', label: 'Relance paiement J+3 (3 jours après l\'échec)',         tabLabel: 'Relance J+3' },
  { key: 'template_failed_payment_j7', label: 'Relance paiement J+7 (7 jours après l\'échec)',         tabLabel: 'Relance J+7' },
] as const;
```

- [ ] **Step 3 : Remplacer `DEFAULT_TEMPLATES` — supprimer `template_failed_payment`, ajouter les 3 nouveaux**

Localiser le bloc (lignes ~153-170) et le remplacer :

```ts
const DEFAULT_TEMPLATES: Record<string, { subject: string; body: string }> = {
  template_onboarding_j0: {
    subject: "Bienvenue {{nom}}, voici vos accès",
    body: "Bonjour {{nom}},\n\nVotre achat est confirmé.\nEmail : {{email}}\nMot de passe : {{mot_de_passe}}\nAccès : {{lien_acces}}\n\nÀ très vite,",
  },
  template_onboarding_j3: {
    subject: "{{nom}}, comment se passe votre début ?",
    body: "Bonjour {{nom}},\n\nCela fait 3 jours que vous avez rejoint {{nom_formation}}. Avez-vous pu commencer ?\n\nN'hésitez pas à répondre si vous avez une question.\n\nÀ bientôt,",
  },
  template_onboarding_j7: {
    subject: "{{nom}} — votre première semaine",
    body: "Bonjour {{nom}},\n\nUne semaine déjà ! Vous avez accès à l'intégralité de {{nom_formation}}.\n\nÀ bientôt,",
  },
  template_failed_payment_j1: {
    subject: "Action requise — problème de paiement",
    body: "Bonjour {{nom}},\n\nNous avons rencontré un problème avec votre paiement de {{montant}}. Cela arrive — nous sommes là pour vous aider.\n\nMettez à jour vos informations de paiement pour conserver votre accès :\n{{lien_paiement}}\n\nÀ très vite,",
  },
  template_failed_payment_j3: {
    subject: "{{nom}}, votre accès sera suspendu sans action de votre part",
    body: "Bonjour {{nom}},\n\nNous n'avons toujours pas pu prélever {{montant}} sur votre moyen de paiement. Sans régularisation, votre accès sera suspendu dans les prochains jours.\n\nRéglez la situation ici :\n{{lien_paiement}}\n\nÀ bientôt,",
  },
  template_failed_payment_j7: {
    subject: "Dernier avertissement — suspension de votre accès",
    body: "Bonjour {{nom}},\n\nMalgré nos relances, le paiement de {{montant}} n'a pas pu être effectué. Votre accès va être suspendu sous 24h.\n\nPour éviter la suspension, réglez maintenant :\n{{lien_paiement}}\n\nCordialement,",
  },
};
```

- [ ] **Step 4 : Mettre à jour `allDefaultTemplates` pour couvrir les 6 clés**

La ligne actuelle (ligne ~172) :
```ts
const allDefaultTemplates = EMAIL_CONFIGS.every(({ key }) => !configs[key]);
```
Ne change pas — elle itère sur `EMAIL_CONFIGS` qui contient maintenant 6 entrées. Vérifier visuellement que la ligne est bien celle-là (elle doit rester inchangée).

- [ ] **Step 5 : Vérifier le build TypeScript**

```bash
npm run build
```

Résultat attendu : aucune erreur TypeScript, build réussi. Si erreur de type sur `key` (le type `as const` devient un union plus large) — vérifier que `VARIABLE_HINTS`, `DEFAULT_TEMPLATES` sont bien typés `Record<string, ...>` et non avec un union littéral strict.

- [ ] **Step 6 : Commit**

```bash
git add src/pages/client/customize.astro
git commit -m "feat(customize): replace failed_payment tab with 3 relance tabs (J+1/J+3/J+7)"
```

---

## Task 2 : Bouton "Améliorer avec l'IA" dans le modal de création (customize.astro)

**Files:**
- Modify: `src/pages/client/customize.astro` — section HTML du modal + `initAutomations()` dans `<script>`

- [ ] **Step 1 : Ajouter le bouton IA et le message d'erreur dans le HTML du modal**

Localiser dans `#auto-modal` le bloc des boutons Créer/Annuler (lignes ~398-401) :
```html
<div style="display:flex;gap:0.75rem;margin-top:0.5rem">
  <button type="submit" class="btn btn-primary">Créer</button>
  <button type="button" class="btn btn-secondary" id="btn-close-auto-modal">Annuler</button>
</div>
```

Remplacer par :
```html
<button type="button" class="btn btn-secondary" id="modal-improve-btn" disabled>🔧 Améliorer avec l'IA</button>
<p class="ai-error" id="modal-improve-error"></p>
<div style="display:flex;gap:0.75rem;margin-top:0.5rem">
  <button type="submit" class="btn btn-primary">Créer</button>
  <button type="button" class="btn btn-secondary" id="btn-close-auto-modal">Annuler</button>
</div>
```

- [ ] **Step 2 : Ajouter la logique JS dans `initAutomations()`, après le bloc des hints variables**

Localiser la fin du bloc hints dans `initAutomations()` (après la boucle `.modal-hint`) et avant `document.querySelectorAll<HTMLButtonElement>('.btn-auto-toggle')`. Insérer :

```ts
const modalSubjectInput = modal.querySelector<HTMLInputElement>('input[name="auto_subject"]');
const modalImproveBtn   = document.getElementById('modal-improve-btn') as HTMLButtonElement | null;
const modalImproveError = document.getElementById('modal-improve-error');

function updateModalImproveState() {
  if (modalImproveBtn) {
    modalImproveBtn.disabled = !modalTextarea?.value.trim();
  }
}
modalTextarea?.addEventListener('input', updateModalImproveState);

modalImproveBtn?.addEventListener('click', async () => {
  const subject = modalSubjectInput?.value ?? '';
  const body    = modalTextarea?.value    ?? '';
  if (modalImproveError) { modalImproveError.textContent = ''; modalImproveError.classList.remove('visible'); }
  if (modalImproveBtn)   { modalImproveBtn.disabled = true; modalImproveBtn.textContent = 'Amélioration en cours...'; }
  try {
    const res  = await fetch('/api/ai-improve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: `Sujet : ${subject}\n\nCorps :\n${body}`, emailType: 'custom_automation' }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.subject) throw new Error();
    if (modalSubjectInput) modalSubjectInput.value = data.subject;
    if (modalTextarea)     modalTextarea.value     = data.body;
  } catch {
    if (modalImproveError) { modalImproveError.textContent = "Erreur d'amélioration"; modalImproveError.classList.add('visible'); }
  } finally {
    if (modalImproveBtn) { modalImproveBtn.textContent = '🔧 Améliorer avec l\'IA'; }
    updateModalImproveState();
  }
});
```

- [ ] **Step 3 : S'assurer que `updateModalImproveState()` est appelé lors du reset du modal**

Dans la fonction `openModal()` existante, ajouter l'appel après `form?.reset()` :
```ts
function openModal() {
  const form = modal?.querySelector<HTMLFormElement>('.auto-create-form');
  form?.reset();
  if (triggerSelect) triggerSelect.value = 'delay_after_purchase';
  updateTriggerVisibility();
  updateModalImproveState();  // ← ajouter cette ligne
  modal?.classList.remove('hidden');
}
```

- [ ] **Step 4 : Vérifier le build TypeScript**

```bash
npm run build
```

Résultat attendu : aucune erreur. Le bouton `id="modal-improve-btn"` est un `HTMLButtonElement` récupéré via `getElementById` — le cast est nécessaire et déjà fourni dans le code.

- [ ] **Step 5 : Commit**

```bash
git add src/pages/client/customize.astro
git commit -m "feat(customize): add AI improve button in automation creation modal"
```

---

## Task 3 : Badges d'état réel sur le dashboard (dashboard.astro)

**Files:**
- Modify: `src/pages/client/dashboard.astro:30-63` (section frontmatter `Promise.allSettled` + parsing) et HTML des cartes onboarding/recouvrement + style CSS

- [ ] **Step 1 : Ajouter le type `ConfigEntry` et les variables `configs`/`configsResult` dans le frontmatter**

Après le bloc des types existants (ligne ~24) et avant `let stats`, ajouter :
```ts
type ConfigEntry = { config_type: string; value: string };
let configs: Record<string, { active: boolean }> = {};
```

- [ ] **Step 2 : Ajouter `configsResult` dans le `Promise.allSettled`**

Remplacer (lignes ~30-34) :
```ts
const [statsResult, autoResult, histResult] = await Promise.allSettled([
  fetch(`${base}/client/stats`, { headers, signal: AbortSignal.timeout(8000) }),
  fetch(`${base}/client/automations`, { headers, signal: AbortSignal.timeout(8000) }),
  fetch(`${base}/client/history?limit=5`, { headers, signal: AbortSignal.timeout(8000) }),
]);
```

Par :
```ts
const [statsResult, autoResult, histResult, configsResult] = await Promise.allSettled([
  fetch(`${base}/client/stats`, { headers, signal: AbortSignal.timeout(8000) }),
  fetch(`${base}/client/automations`, { headers, signal: AbortSignal.timeout(8000) }),
  fetch(`${base}/client/history?limit=5`, { headers, signal: AbortSignal.timeout(8000) }),
  fetch(`${base}/client/configs`, { headers, signal: AbortSignal.timeout(8000) }),
]);
```

- [ ] **Step 3 : Mettre à jour le check 401 pour inclure `configsResult`**

Remplacer (lignes ~36-41) :
```ts
const responses = [statsResult, autoResult, histResult];
const fulfilled = responses.filter((r): r is PromiseFulfilledResult<Response> => r.status === 'fulfilled');
if (fulfilled.some((r) => r.value.status === 401)) {
```

Par :
```ts
const responses = [statsResult, autoResult, histResult, configsResult];
const fulfilled = responses.filter((r): r is PromiseFulfilledResult<Response> => r.status === 'fulfilled');
if (fulfilled.some((r) => r.value.status === 401)) {
```

- [ ] **Step 4 : Parser `configsResult` après le parsing de `histResult` (ligne ~52)**

Après le bloc `if (histResult.status === 'fulfilled' ...)`, ajouter :
```ts
if (configsResult.status === 'fulfilled' && configsResult.value.ok) {
  const arr: ConfigEntry[] = await configsResult.value.json().catch(() => []);
  if (Array.isArray(arr)) {
    for (const c of arr) {
      try {
        const parsed = JSON.parse(c.value);
        configs[c.config_type] = { active: parsed.active !== false };
      } catch {
        configs[c.config_type] = { active: true };
      }
    }
  }
}
```

- [ ] **Step 5 : Calculer les états Onboarding et Recouvrement**

Après le bloc de parsing `configs`, ajouter la fonction helper et les calculs :
```ts
function computeStatus(
  backendActive: boolean | undefined,
  keys: string[],
  configs: Record<string, { active: boolean }>
): 'actif' | 'partiel' | 'off' {
  if (!backendActive) return 'off';
  const hasConfigs = keys.some((k) => k in configs);
  if (!hasConfigs) return 'actif';
  const activeCount = keys.filter((k) => configs[k]?.active !== false).length;
  if (activeCount === keys.length) return 'actif';
  if (activeCount === 0) return 'off';
  return 'partiel';
}

const onboardingStatus  = computeStatus(
  automations?.onboarding,
  ['template_onboarding_j0', 'template_onboarding_j3', 'template_onboarding_j7'],
  configs
);
const recouvrementStatus = computeStatus(
  automations?.recouvrement,
  ['template_failed_payment_j1', 'template_failed_payment_j3', 'template_failed_payment_j7'],
  configs
);
```

- [ ] **Step 6 : Mettre à jour le HTML des cartes Onboarding et Recouvrement**

**Onboarding** — remplacer le bloc conditionnel existant (lignes ~110-120) :
```astro
{onboardingStatus === 'actif' ? (
  <div class="auto-card card">
    <p class="auto-name">Onboarding J0 / J3 / J7</p>
    <span class="auto-badge badge-actif">Actif</span>
  </div>
) : onboardingStatus === 'partiel' ? (
  <div class="auto-card card">
    <p class="auto-name">Onboarding J0 / J3 / J7</p>
    <span class="auto-badge badge-partiel">Partiellement actif</span>
  </div>
) : (
  <a href="/client/customize" class="auto-card auto-card--link card">
    <p class="auto-name">Onboarding J0 / J3 / J7</p>
    <span class="auto-badge badge-off">Non configuré →</span>
  </a>
)}
```

**Recouvrement** — remplacer le bloc conditionnel existant (lignes ~122-132) :
```astro
{recouvrementStatus === 'actif' ? (
  <div class="auto-card card">
    <p class="auto-name">Recouvrement impayés</p>
    <span class="auto-badge badge-actif">Actif</span>
  </div>
) : recouvrementStatus === 'partiel' ? (
  <div class="auto-card card">
    <p class="auto-name">Recouvrement impayés</p>
    <span class="auto-badge badge-partiel">Partiellement actif</span>
  </div>
) : (
  <a href="/client/customize" class="auto-card auto-card--link card">
    <p class="auto-name">Recouvrement impayés</p>
    <span class="auto-badge badge-off">Non configuré →</span>
  </a>
)}
```

- [ ] **Step 7 : Ajouter le style `.badge-partiel` dans le CSS**

Dans le bloc `<style>`, après `.badge-off { ... }` (ligne ~223), ajouter :
```css
.badge-partiel { background: rgba(245,158,11,0.15); color: #F59E0B; }
```

- [ ] **Step 8 : Vérifier le build TypeScript**

```bash
npm run build
```

Résultat attendu : aucune erreur. Si TypeScript se plaint du type de `automations?.onboarding` (qui peut être `boolean | undefined`), la fonction `computeStatus` accepte `boolean | undefined` — c'est déjà le cas dans la signature.

- [ ] **Step 9 : Commit**

```bash
git add src/pages/client/dashboard.astro
git commit -m "feat(dashboard): add real badge states using configs (actif/partiel/off)"
```

---

## Self-Review

**Spec coverage :**
- [x] Mod 1 : 3 nouveaux config_types dans EMAIL_CONFIGS/VARIABLE_HINTS/DEFAULT_TEMPLATES ✓ (Task 1)
- [x] Mod 1 : Tons J+1 empathique / J+3 direct / J+7 ferme ✓ (Task 1, Step 3)
- [x] Mod 1 : allDefaultTemplates couvre les 6 clés ✓ (Task 1, Step 4)
- [x] Mod 2 : 4e appel GET /client/configs dans Promise.allSettled ✓ (Task 3, Step 2)
- [x] Mod 2 : Logique onboarding actif/partiel/off ✓ (Task 3, Step 5-6)
- [x] Mod 2 : Logique recouvrement actif/partiel/off avec j1/j3/j7 ✓ (Task 3, Step 5-6)
- [x] Mod 2 : Fallback silencieux si /client/configs échoue ✓ (Task 3, Step 4 — configs reste `{}`)
- [x] Mod 2 : badge-partiel style ambre ✓ (Task 3, Step 7)
- [x] Mod 3 : Bouton IA dans modal, désactivé si textarea vide ✓ (Task 2)
- [x] Mod 3 : appel /api/ai-improve avec emailType custom_automation ✓ (Task 2, Step 2)
- [x] Mod 3 : reset du bouton à l'ouverture du modal ✓ (Task 2, Step 3)
- [x] npm run build à chaque task ✓

**Placeholder scan :** Aucun TBD, TODO ou "similar to task N". Tous les blocs de code sont complets.

**Type consistency :**
- `ConfigEntry` défini en Task 3 Step 1, utilisé en Step 4 ✓
- `computeStatus` défini et utilisé dans le même Step 5 ✓
- `onboardingStatus` / `recouvrementStatus` définis en Step 5, utilisés en Step 6 ✓
- `modalImproveBtn` / `modalImproveError` définis et utilisés dans Task 2 Step 2-3 ✓
