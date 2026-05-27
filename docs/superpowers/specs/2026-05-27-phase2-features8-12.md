# Spec — Phase 2 Features 8–12 (Frontend uniquement)

**Date :** 2026-05-27
**Repo :** AEVUM/Vitrine (Astro 6, TypeScript strict, CSS pur)
**Prérequis :** backend Phase 2 déployé sur Render
**Base commit :** fcdb1cd

---

## Périmètre

5 features frontend ajoutant tracking email, multi-formation, guide deliverability, et deux nouvelles sections dans customize.astro.

---

## Feature 8 — Tracking ouvertures et clics

### Modification : `src/pages/client/dashboard.astro`

**Type `StatsData`** — ajouter :
```typescript
  open_rate_this_month?: number;
  click_rate_this_month?: number;
```

**2 nouvelles stat-cards** — insérer après la card "Taux de récupération" :
```astro
<div class="stat-card card">
  <p class="stat-label">Taux d'ouverture</p>
  <p class="stat-value">{stats?.open_rate_this_month ?? 0} %</p>
  <p class="stat-period">30 derniers jours</p>
</div>
<div class="stat-card card">
  <p class="stat-label">Taux de clic</p>
  <p class="stat-value">{stats?.click_rate_this_month ?? 0} %</p>
  <p class="stat-period">30 derniers jours</p>
</div>
```

**CSS** — ajouter dans `<style>` :
```css
.stat-period { font-size: 0.6875rem; color: var(--gray); margin-top: 0.25rem; text-transform: none; letter-spacing: 0; }
```

La grille reste `repeat(3, 1fr)` (8 cards = 2 rangées de 3 + 1 rangée de 2, acceptable).

### Modification : `src/pages/client/students.astro`

**Drawer — email history items** : pour chaque email dans `detail.emails_history`, ajouter les indicateurs d'engagement.

La grille passe de `64px 100px 1fr` à `64px 100px 1fr auto`.

La génération HTML dans le template string JavaScript :
```javascript
`<li class="drawer-history-item">
  <span class="dh-date">${h.date ? new Date(h.date).toLocaleDateString('fr-FR', { dateStyle: 'short' }) : '—'}</span>
  <span class="dh-type">${h.type || '—'}</span>
  <span class="dh-subject">${h.subject || '—'}</span>
  <span class="dh-engagement">
    ${h.opened_at ? `<span class="dh-opened" title="Ouvert le ${new Date(h.opened_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}">✓</span>` : ''}
    ${h.clicked_at ? `<span class="dh-clicked" title="Cliqué le ${new Date(h.clicked_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}">🔗</span>` : ''}
  </span>
</li>`
```

**CSS** — ajouter :
```css
.drawer-history-item { grid-template-columns: 64px 100px 1fr auto; }
.dh-engagement { display: flex; gap: 4px; align-items: center; }
.dh-opened { color: #10B981; font-size: 0.8125rem; cursor: help; }
.dh-clicked { font-size: 0.8125rem; cursor: help; }
```

**Commit :** `feat(tracking): add open rate/click rate stats and drawer engagement icons (F8)`

---

## Feature 9 — Multi-formation

### Nouveaux fichiers API

**`src/pages/api/formation-create.ts`** — POST
Body : `{ name: string; stripe_product_id?: string }`
Forward → `POST ${AEVUM_URL}/client/formations`

**`src/pages/api/formation-update.ts`** — PUT
Body : `{ id: string; name: string }`
Forward → `PUT ${AEVUM_URL}/client/formations/${body.id}` avec `{ name }`

**`src/pages/api/formation-delete.ts`** — DELETE
Body : `{ id: string }`
Forward → `DELETE ${AEVUM_URL}/client/formations/${body.id}`

Pattern identique aux autres routes proxy : `prerender = false`, `getClientFromCookie`, `AbortController 8000ms`, `jsonRes`.

### Modification : `src/layouts/ClientLayout.astro`

**Frontmatter** — ajouter après les imports :
```typescript
import { getClientFromCookie } from '../lib/auth';

const auth = await getClientFromCookie(Astro.request);

type Formation = { id: string; name: string; stripe_product_id?: string; created_at: string };
let formations: Formation[] = [];

if (auth) {
  try {
    const res = await fetch(`${import.meta.env.AEVUM_URL}/client/formations`, {
      headers: { Authorization: `Bearer ${auth.token}` },
      signal: AbortSignal.timeout(6000),
    });
    if (res.ok) {
      const data = await res.json().catch(() => []);
      formations = Array.isArray(data) ? data : [];
    }
  } catch { /* non-fatal */ }
}

const selectedFormationId = Astro.cookies.get('aevum_formation_id')?.value ?? '';
const showFormationSelector = formations.length > 1;
const showFormationsLink = formations.length > 1;
```

**HTML — sélecteur en haut de sidebar** : insérer dans `.cl-sidebar`, avant les nav links :
```astro
{showFormationSelector && (
  <div class="formation-selector-wrap">
    <select class="formation-select" id="formation-select">
      {formations.map((f) => (
        <option value={f.id} selected={f.id === selectedFormationId}>{f.name}</option>
      ))}
    </select>
  </div>
)}
```

**Lien "Formations"** — insérer dans `<nav class="cl-nav">`, visible seulement si `showFormationsLink` :
```astro
{showFormationsLink && (
  <a href="/client/formations" class:list={['cl-link', { 'cl-link--active': p.startsWith('/client/formations') }]}>
    <!-- SVG layers icon -->
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
    Formations
  </a>
)}
```

**Script client** — dans le `<script>` existant du layout (ou en créer un), dans `astro:page-load` :
```javascript
const sel = document.getElementById('formation-select');
if (sel && !sel.dataset.initialized) {
  sel.dataset.initialized = 'true';
  sel.addEventListener('change', () => {
    document.cookie = `aevum_formation_id=${sel.value}; path=/; SameSite=Strict; Max-Age=86400`;
    window.location.reload();
  });
}
```

**CSS** :
```css
.formation-selector-wrap {
  padding: 0.75rem 1rem 0.5rem;
  border-bottom: 1px solid var(--line);
}
.formation-select {
  width: 100%;
  background: var(--bg-2);
  border: 1px solid var(--line-2);
  border-radius: var(--r-sm);
  color: var(--fg);
  font-size: 0.875rem;
  padding: 6px 8px;
  font-family: var(--sans);
  cursor: pointer;
}
```

**Prefetch** — ajouter dans `<head>` :
```astro
{showFormationsLink && <link rel="prefetch" href="/client/formations" />}
```

### Modification : 5 pages client

Dans le frontmatter de `dashboard.astro`, `customize.astro`, `students.astro`, `history.astro`, `blacklist.astro` :

```typescript
const formationId = Astro.cookies.get('aevum_formation_id')?.value ?? null;
const formationHeaders = formationId ? { 'X-Formation-Id': formationId } : {};
```

Puis dans chaque `fetch` ou `headers` vers le backend :
```typescript
const headers = { Authorization: `Bearer ${auth.token}`, ...formationHeaders };
```

(Remplace les `headers` existants dans chaque page.)

### Nouveau fichier : `src/pages/client/formations.astro`

**Frontmatter** :
- Auth guard
- Gérer POST actions : `create_formation`, `delete_formation`, `rename_formation` (même pattern que settings.astro)
- Fetch GET `/client/formations` après le POST éventuel
- `fmtDate` helper

**Template HTML** :
```
En-tête : titre "Mes formations" + accent-line

Formulaire de création (card) :
  - input name (required)
  - input stripe_product_id (optionnel, placeholder "prod_...")
  - bouton "Créer"
  - messages success/error SSR

Liste des formations (card) :
  Tableau : Nom / Stripe Product ID / Date de création / Actions
  Chaque ligne :
    - Nom affiché avec bouton ✏️ → rename inline (form POST action=rename_formation avec id + new_name)
    - stripe_product_id ou "—"
    - Date formatée fr-FR
    - Bouton "Supprimer" → modal confirm overlay (même pattern que blacklist.astro retrait)
      → form POST action=delete_formation avec id
```

**POST handlers (SSR)** :
```typescript
if (action === 'create_formation') {
  // fetch POST /client/formations avec { name, stripe_product_id }
  return Astro.redirect('/client/formations');
}
if (action === 'rename_formation') {
  // fetch PUT /client/formations/:id avec { name }
  return Astro.redirect('/client/formations');
}
if (action === 'delete_formation') {
  // fetch DELETE /client/formations/:id
  return Astro.redirect('/client/formations');
}
```

Ajouter dans ClientLayout.astro `<link rel="prefetch" href="/client/formations" />` (conditionnel, déjà prévu ci-dessus).

**Commit :** `feat(multi-formation): add formation selector, API routes, formations page (F9)`

---

## Feature 10 — Setup deliverability guidé

### Nouveau fichier : `src/pages/client/deliverability.astro`

**Frontmatter** :
- Auth guard
- Fetch `GET /client/me` → extraire `dkim_public_key?: string`
- Fetch `GET /client/configs` → extraire `sender_name` depuis les configs (clé `sender_name`, parser la valeur JSON si nécessaire)

**Structure HTML — stepper 5 étapes** :
```astro
<div class="del-stepper">
  {[1,2,3,4,5].map((n) => (
    <div class={`del-step`} data-step={n}>
      <div class="del-step-indicator">
        <span class="del-step-num">{n}</span>
      </div>
      <div class="del-step-content">
        <!-- contenu par étape -->
      </div>
    </div>
  ))}
</div>
```

**CSS clé du stepper** :
```css
.del-stepper { display: flex; flex-direction: column; gap: 0; }
.del-step { display: flex; gap: 1.25rem; padding: 1.5rem 0; border-bottom: 1px solid var(--line); }
.del-step-indicator {
  flex-shrink: 0;
  width: 32px; height: 32px; border-radius: 50%;
  border: 2px solid var(--line-2);
  display: flex; align-items: center; justify-content: center;
}
.del-step-num { font-size: 0.875rem; font-weight: 600; color: var(--fg-muted); }
.del-step.step--done .del-step-indicator {
  background: #10B981; border-color: #10B981;
}
.del-step.step--done .del-step-num { color: #fff; }
```

**Bouton "Marquer comme complété"** dans chaque étape (sauf étape 5 où il est "Terminer") :
```html
<button type="button" class="btn btn-secondary del-complete-btn" data-step="N">
  Étape suivante →
</button>
```

**JS — `initDeliverability()`** : wrappé dans `astro:page-load` :
```javascript
function initDeliverability() {
  const STORAGE_KEY = 'aevum_deliverability_steps';
  let done: number[] = [];
  try { done = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]'); } catch {}

  // Apply saved state
  done.forEach((n) => {
    document.querySelector(`.del-step[data-step="${n}"]`)?.classList.add('step--done');
  });

  document.querySelectorAll<HTMLButtonElement>('.del-complete-btn').forEach((btn) => {
    if (btn.dataset.initialized) return;
    btn.dataset.initialized = 'true';
    btn.addEventListener('click', () => {
      const step = parseInt(btn.dataset.step!);
      if (!done.includes(step)) done.push(step);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(done));
      btn.closest('.del-step')?.classList.add('step--done');
    });
  });
}
```

**Contenu des étapes** :

**Étape 1 — Votre configuration actuelle :**
- Affiche le `sender_name` récupéré depuis les configs
- Explication 3-4 lignes : domaine custom = confiance + délivrabilité + branding

**Étape 2 — Record SPF :**
- `<code>` block avec la valeur SPF (placeholder : `v=spf1 include:spf.aevum.io ~all` — à remplacer par la vraie valeur lors de l'implémentation)
- Bouton "Copier" (navigator.clipboard)
- 4 accordéons `<details><summary>` : OVH / Ionos / Gandi / Cloudflare avec instructions d'ajout DNS

**Étape 3 — Record DKIM :**
- Si `dkim_public_key` présent → `<pre>` scrollable avec la clé + bouton "Copier"
- Si absent → encart "Contactez le support pour obtenir votre clé DKIM personnalisée"
- 4 accordéons fournisseurs identiques à l'étape 2

**Étape 4 — Record DMARC :**
- Valeur recommandée : `v=DMARC1; p=quarantine; rua=mailto:dmarc@[votre-domaine]`
- Tableau 3 lignes : `p=none` (surveillance), `p=quarantine` (recommandé), `p=reject` (strict)

**Étape 5 — Tester votre deliverability :**
- Lien `https://www.mail-tester.com/` en bouton externe
- Instructions : "Envoyez un email test depuis AEVUM vers l'adresse mail-tester.com générée, puis cliquez 'Voir mon score'"
- Grille interprétation : `>9/10` = excellent ✓, `7-9/10` = correct ⚠, `<7/10` = problème ✗

### Modification : `src/pages/client/settings.astro`

Ajouter après la section Mode pause, avant la zone Déconnexion :
```astro
<div class="card settings-card">
  <h2 class="settings-card-title">Deliverability</h2>
  <p style="color:var(--gray-light);font-size:0.9375rem;margin:0 0 1rem">
    Configurez SPF, DKIM et DMARC pour maximiser la livraison de vos emails.
  </p>
  <a href="/client/deliverability" class="btn btn-secondary" style="align-self:flex-start;display:inline-block">
    Voir le guide →
  </a>
</div>
```

Ajouter dans ClientLayout.astro `<link rel="prefetch" href="/client/deliverability" />` (inconditionnel).
Ajouter lien "Deliverability" dans la nav sidebar du ClientLayout.

**Commit :** `feat(deliverability): add deliverability guide page (F10)`

---

## Feature 11 — Récupération abandons checkout

### Modification : `src/pages/client/customize.astro`

**Ajout dans `EMAIL_CONFIGS` ou section séparée :**

La section "Récupération paniers abandonnés" est une *section indépendante* (hors du tableau `EMAIL_CONFIGS`) insérée dans le HTML entre la section templates standards et la section custom automations.

Elle réutilise exactement le même markup qu'une `.cust-card` standard mais dans un `<section>` séparé avec un titre de section propre.

**Config type :** `template_checkout_abandon`

**Variables disponibles** : `{{nom}}` `{{prenom}}` `{{email}}` `{{nom_formation}}` `{{lien_checkout}}`

**Structure HTML** :
```astro
<!-- F11 — Checkout abandon -->
<div class="section-divider">
  <span>Récupération paniers abandonnés</span>
</div>

<div class="cust-card card checkout-abandon-card"
     data-config="template_checkout_abandon"
     data-active={checkoutAbandonConfig?.active ?? false}
     data-subject={checkoutAbandonConfig?.subject ?? ''}
     data-body={checkoutAbandonConfig?.body ?? ''}
     data-label={checkoutAbandonConfig?.label ?? 'Panier abandonné'}>

  <div class="card-header">
    <div class="card-header-left">
      <h2 class="card-title">Email de récupération</h2>
      <p class="card-note">Envoyé 30 min après qu'un prospect quitte le paiement sans finaliser son achat.</p>
    </div>
    <label class="toggle-switch" title="Activer/désactiver">
      <input type="checkbox" class="toggle-input" {checkoutAbandonConfig?.active ? 'checked' : ''} />
      <span class="toggle-track"></span>
    </label>
  </div>

  <!-- Éditeur Manuel + IA identique aux cust-cards — avec les 5 variables spécifiques -->
  <!-- Variables badges : {{nom}} {{prenom}} {{email}} {{nom_formation}} {{lien_checkout}} -->
  <!-- Bouton test send + Bouton bibliothèque (F3) -->

  <form class="save-form" method="POST" data-config-type="template_checkout_abandon">
    <input type="hidden" name="config_type" value="template_checkout_abandon" />
    <input type="hidden" name="value" class="hidden-value" />
    <!-- éditeur tabs (manual/IA) complet -->
    <button type="submit" class="btn btn-primary">Sauvegarder</button>
  </form>

  <!-- Test send wrap -->
  <div class="test-send-wrap">
    <button type="button" class="btn btn-secondary btn-test-send"
            data-config-type="template_checkout_abandon"
            data-email={auth.email}>
      📧 M'envoyer un aperçu
    </button>
    <span class="test-send-feedback" aria-live="polite"></span>
  </div>
</div>
```

**Frontmatter** — ajouter extraction de `template_checkout_abandon` depuis les configs SSR :
```typescript
const checkoutAbandonRaw = configs?.find((c) => c.config_type === 'template_checkout_abandon');
const checkoutAbandonConfig = checkoutAbandonRaw ? parseConfig(checkoutAbandonRaw.value) : null;
```

(La fonction `parseConfig` existe déjà dans le frontmatter de customize.astro.)

**JS** — la fonction `initEditor()` existante cible les `.cust-card` — elle s'appliquera automatiquement si la checkout-abandon card porte cette classe. Vérifier que le selector `document.querySelectorAll('.cust-card')` englobe bien la nouvelle carte.

**Commit :** `feat(customize): add checkout abandon section (F11)`

---

## Feature 12 — Demandes de témoignage automatiques

### Modification : `src/pages/client/customize.astro`

**Inséré après la section F11, avant les custom automations.**

**Config types :**
- `testimonial_url` — champ text simple
- `template_testimonial_j30` — template J+30
- `template_testimonial_j60` — template J+60

**Variables disponibles** : `{{nom}}` `{{prenom}}` `{{nom_formation}}` `{{lien_temoignage}}`

**Structure HTML** :
```astro
<!-- F12 — Témoignages -->
<div class="section-divider">
  <span>Demandes de témoignage</span>
</div>

<!-- Champ URL -->
<div class="card testimonial-url-card">
  <h2 class="card-title">URL de votre formulaire de collecte</h2>
  <p class="card-note">Envoyé automatiquement 30 ou 60 jours après l'inscription d'un élève actif.</p>
  <form class="save-form" method="POST" data-config-type="testimonial_url">
    <input type="hidden" name="config_type" value="testimonial_url" />
    <input type="hidden" name="value" class="hidden-value" />
    <div class="form-group">
      <input type="url" name="url-display" class="form-input testimonial-url-input"
             placeholder="https://typeform.com/to/..."
             value={testimonialUrlConfig?.body ?? ''} />
    </div>
    <button type="submit" class="btn btn-primary">Sauvegarder</button>
  </form>
</div>

<!-- Tabs J+30 / J+60 -->
<div class="testimonial-tabs-header">
  <button class="testi-tab active" data-testi-tab="j30">À J+30</button>
  <button class="testi-tab" data-testi-tab="j60">À J+60</button>
</div>

<!-- Panel J+30 -->
<div class="cust-card card" data-config="template_testimonial_j30" ... >
  <!-- toggle + éditeur Manuel/IA complet + test send -->
</div>

<!-- Panel J+60 (hidden initially) -->
<div class="cust-card card" data-config="template_testimonial_j60" ... style="display:none">
  <!-- toggle + éditeur Manuel/IA complet + test send -->
</div>
```

**Frontmatter** — extraire :
```typescript
const testimonialUrlRaw = configs?.find((c) => c.config_type === 'testimonial_url');
const testimonialUrlConfig = testimonialUrlRaw ? parseConfig(testimonialUrlRaw.value) : null;
const testimonialJ30Raw = configs?.find((c) => c.config_type === 'template_testimonial_j30');
const testimonialJ30Config = testimonialJ30Raw ? parseConfig(testimonialJ30Raw.value) : null;
const testimonialJ60Raw = configs?.find((c) => c.config_type === 'template_testimonial_j60');
const testimonialJ60Config = testimonialJ60Raw ? parseConfig(testimonialJ60Raw.value) : null;
```

**JS — tabs témoignages** : dans `astro:page-load` wrapper :
```javascript
// F12 — testimonial tabs
document.querySelectorAll('.testi-tab').forEach((tab) => {
  if (tab.dataset.initialized) return;
  tab.dataset.initialized = 'true';
  tab.addEventListener('click', () => {
    const target = tab.dataset.testiTab!;
    document.querySelectorAll('.testi-tab').forEach((t) => t.classList.remove('active'));
    tab.classList.add('active');
    // show/hide panels
    document.querySelector(`[data-config="template_testimonial_j30"]`)!.style.display = target === 'j30' ? '' : 'none';
    document.querySelector(`[data-config="template_testimonial_j60"]`)!.style.display = target === 'j60' ? '' : 'none';
  });
});
```

**Sauvegarde `testimonial_url`** : le champ URL est un cas particulier — ce n'est pas un template `{subject, body, active}`. La valeur sauvegardée est simplement l'URL brute. Le `hidden-value` interceptor JS doit gérer ce cas en lisant `.testimonial-url-input` et en sérialisant `JSON.stringify({ body: input.value, subject: '', active: true })` (pour uniformité avec `parseConfig`).

**CSS** :
```css
.testimonial-tabs-header { display: flex; gap: 0.5rem; margin: 1rem 0 0; }
.testi-tab {
  padding: 8px 20px; border-radius: 8px 8px 0 0; border: 1px solid var(--line-2);
  background: transparent; color: var(--fg-muted); font-family: var(--sans);
  font-size: 0.875rem; font-weight: 500; cursor: pointer; border-bottom: none;
}
.testi-tab.active { background: var(--bg-1); color: var(--fg); border-color: var(--line); }
.testimonial-url-card { padding: 1.5rem 2rem; margin-bottom: 1rem; }
```

**Commit :** `feat(customize): add testimonial requests section (F12)`

---

## Conventions respectées (toutes les features)

- `export const prerender = false` en tête de chaque fichier SSR
- `getClientFromCookie` + redirect si non authentifié
- 401 backend → `Astro.cookies.delete` + redirect
- `AbortController` / `AbortSignal.timeout` 8000ms sur tous les fetch backend
- `Promise.allSettled` pour appels parallèles
- `Array.isArray(data) ? data : []` avant tout `.map`
- `document.addEventListener('astro:page-load', fn)` pour ré-init View Transitions
- Guard `dataset.initialized` sur tous les handlers JS

---

## Fichiers modifiés / créés

**Créer :**
- `src/pages/api/formation-create.ts`
- `src/pages/api/formation-update.ts`
- `src/pages/api/formation-delete.ts`
- `src/pages/client/formations.astro`
- `src/pages/client/deliverability.astro`

**Modifier :**
- `src/pages/client/dashboard.astro` — F8 + F9
- `src/pages/client/students.astro` — F8 + F9
- `src/pages/client/history.astro` — F9 (formationHeaders)
- `src/pages/client/blacklist.astro` — F9 (formationHeaders)
- `src/pages/client/customize.astro` — F9 + F11 + F12
- `src/layouts/ClientLayout.astro` — F9 + F10
- `src/pages/client/settings.astro` — F10

---

## Self-review

- Aucun TBD critique (la valeur SPF est un placeholder explicitement signalé)
- F9 cookie bridge : cohérent (écrit client → lu SSR via `Astro.cookies`)
- F12 tabs J+30/J+60 : résolution de la coquille J+7 → J+60 documentée
- `testimonial_url` sérialisation : pattern dérogatoire explicitement documenté
- Scope correct : 5 nouveaux fichiers, 7 modifiés
- La grille stats avec 8 cards (3-col) produit une rangée incomplète — acceptable, pattern courant
