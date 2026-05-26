# Spec — Phase 1 Features 1–6 (Frontend uniquement)

**Date :** 2026-05-26  
**Repo :** AEVUM/Vitrine (Astro 6, TypeScript strict, CSS pur)  
**Prérequis :** backend Phase 1 déployé sur Render

---

## Périmètre

6 features frontend ajoutant de nouvelles capacités au portail client existant, sans modifier la stack ni les conventions établies.

---

## Feature 1 — Envoi de test

### Nouveau fichier : `src/pages/api/test-send.ts`

Route proxy SSR. Pattern identique à `config-update.ts` :
- `export const prerender = false`
- `POST` handler
- Auth via cookie → `getClientFromCookie`
- Parse body JSON `{ config_type: string }`
- Validation : `config_type` requis
- Forward POST → `${AEVUM_URL}/client/test-send` avec `Authorization: Bearer`
- `AbortController` 8000 ms
- Retourne `jsonRes(await res.json().catch(() => ({})), res.status)`

### Modification : `src/pages/client/customize.astro`

Sur chaque carte template (les 6 onglets : Bienvenue/J+3/J+7/Relance J+1/J+3/J+7) :

**Bouton** `"M'envoyer un aperçu"` positionné à côté du bouton Sauvegarder, **en dehors du `<form>` principal**. Attributs :
- `data-testbtn` pour sélection JS
- `data-config-type="{config_type}"` : config type de l'onglet
- `data-email="{auth.email}"` : email SSR injecté pour le message de feedback

**Comportement JS** (wrapper dans `document.addEventListener('astro:page-load', fn)`, guard `dataset.initialized`) :
1. Clic → désactiver bouton, texte `"Envoi en cours…"`
2. `fetch('/api/test-send', { method: 'POST', body: JSON.stringify({ config_type }) })`
3. Succès : afficher `"Email de test envoyé à {email}"` pendant 3 s → disparaît
4. Erreur : afficher message d'erreur retourné (ou message générique) pendant 3 s
5. Réactiver le bouton dans tous les cas

Feedback : `<span>` adjacent au bouton, display none par défaut, show/hide par JS.

---

## Feature 2 — Mode pause global

### Nouveaux fichiers API

**`src/pages/api/pause-enable.ts`** — POST  
Body : `{ duration_days: number }`  
Validation : `duration_days` requis, doit être dans `[1, 3, 7, 14, 30]`  
Forward → `POST ${AEVUM_URL}/client/pause` avec `{ duration_days }`

**`src/pages/api/pause-disable.ts`** — POST  
Pas de body  
Forward → `DELETE ${AEVUM_URL}/client/pause` (sémantique : désactiver la pause)

### Modification : `src/pages/client/settings.astro`

**Frontmatter** : ajouter un fetch `/client/me` après l'auth guard :
```ts
let meData: { paused_until?: string | null } | null = null;
const meRes = await fetch(`${import.meta.env.AEVUM_URL}/client/me`, {
  headers: { Authorization: `Bearer ${auth.token}` },
  signal: AbortSignal.timeout(8000),
}).catch(() => null);
if (meRes?.status === 401) { /* delete cookie + redirect */ }
if (meRes?.ok) meData = await meRes.json().catch(() => null);
const pausedUntil: string | null = meData?.paused_until ?? null;
```

Gérer également les POST pour `action === 'pause_enable'` et `action === 'pause_disable'` dans le bloc `if (Astro.request.method === 'POST')` existant, en appelant les routes API backend directement (même pattern que les autres actions SSR).

**Section "Mode pause"** insérée entre les sections existantes (après email, avant danger zone) :

- **Pas de pause active** (`pausedUntil === null`) :
  ```html
  <form method="POST" action="/client/settings">
    <input type="hidden" name="action" value="pause_enable" />
    <select name="duration_days" class="form-input">
      <option value="1">1 jour</option>
      <option value="3">3 jours</option>
      <option value="7">7 jours</option>
      <option value="14">14 jours</option>
      <option value="30">30 jours</option>
    </select>
    <button type="submit" class="btn btn-secondary">Activer la pause</button>
  </form>
  ```

- **Pause active** (`pausedUntil !== null`) :
  ```html
  <div class="pause-active-banner">
    Pause active jusqu'au {formatDate(pausedUntil)}
  </div>
  <form method="POST" action="/client/settings">
    <input type="hidden" name="action" value="pause_disable" />
    <button type="submit" class="btn btn-secondary">Reprendre maintenant</button>
  </form>
  ```

`formatDate` : `new Date(iso).toLocaleDateString('fr-FR', { dateStyle: 'long' })`

### Modification : `src/pages/client/dashboard.astro`

**Frontmatter** : ajouter `/client/me` dans `Promise.allSettled` (5e appel).  
Extraire `paused_until` de la réponse.

**Bandeau** : si `paused_until` présent, afficher **avant** les stat-cards :
```html
<div class="pause-banner">
  ⏸ Toutes vos automatisations sont en pause jusqu'au {date fr-FR}.
  <a href="/client/settings">Gérer</a>
</div>
```
Style : fond ambre `rgba(245,158,11,0.12)`, border `rgba(245,158,11,0.30)`, couleur `#F59E0B`, `border-radius: var(--r-sm)`, `padding: 0.875rem 1.25rem`.

---

## Feature 3 — Bibliothèque de templates

### Modification : `src/pages/client/customize.astro` (client-side uniquement)

**Objet statique `TEMPLATE_LIBRARY`** défini en haut du `<script>` client :

Structure :
```ts
const TEMPLATE_LIBRARY: Record<
  'video' | 'coaching_1to1' | 'groupe_prive' | 'bootcamp',
  Record<string, { subject: string; body: string }>
> = { ... }
```

Config types couverts : `template_onboarding_j0`, `template_onboarding_j3`, `template_onboarding_j7`, `template_failed_payment_j1`, `template_failed_payment_j3`, `template_failed_payment_j7`.

Labels des types de formation affichés dans le panneau :
- `video` → "Formation vidéo en ligne"
- `coaching_1to1` → "Coaching individuel (1-to-1)"
- `groupe_prive` → "Groupe privé / mastermind"
- `bootcamp` → "Bootcamp intensif"

**24 templates intégraux** (4 types × 6 emails, rédigés en français, ton professionnel et chaleureux) :

Variables utilisées par template :
- `j0` : `{{nom}}`, `{{nom_formation}}`, `{{lien_acces}}`, `{{mot_de_passe}}`
- `j3`, `j7` : `{{nom}}`, `{{nom_formation}}`
- `failed_j1`, `j3`, `j7` : `{{nom}}`, `{{montant}}`, `{{lien_paiement}}`

Les corps de templates utilisent des sauts de ligne (`\n`) pour la lisibilité dans le textarea.

**Bouton "📚 Bibliothèque"** sur chaque onglet de template, à côté des onglets Manuel/IA.

**Panneau bibliothèque** :
- `position: fixed`, `inset: 0`, `z-index: 200`
- Overlay semi-transparent + panneau droit (400px de large, scroll interne)
- 4 groupes dépliables `<details>/<summary>` (un par type de formation)
- Chaque groupe ouvert affiche le template correspondant au `config_type` de l'onglet actif uniquement
- Format affiché : aperçu sujet + 2–3 premières lignes du corps + bouton "Utiliser ce template"

**Au clic "Utiliser ce template"** :
1. Si sujet OU corps non vides → `confirm('Écraser le contenu actuel ?')`
2. Injecter `subject` dans `input[name="subject"]` de l'éditeur Manuel
3. Injecter `body` dans `textarea[name="body"]` de l'éditeur Manuel
4. Basculer vers onglet Manuel si mode IA actif
5. Fermer le panneau

**Fermeture** : clic sur overlay ou bouton ✕ dans le panneau.

Guard `dataset.initialized` sur le bouton bibliothèque.

---

## Feature 4 — Gestion blacklist

### Nouveaux fichiers API

**`src/pages/api/blacklist-add.ts`** — POST  
Body : `{ email: string; reason?: string }`  
Validation : `email` requis, format email basique  
Forward → `POST ${AEVUM_URL}/client/blacklist`

**`src/pages/api/blacklist-remove.ts`** — DELETE  
Body : `{ email: string }`  
Validation : `email` requis  
Forward → `DELETE ${AEVUM_URL}/client/blacklist` avec body `{ email }`

### Nouveau fichier : `src/pages/client/blacklist.astro`

**Frontmatter** :
- Auth guard
- Gérer POST (action `add_blacklist`) en SSR : fetch `POST /client/blacklist`, set `addSuccess`/`addError`
- Fetch GET `/client/blacklist` après le POST éventuel → `blacklist: Array<{ email, reason, created_at }>`

**Template HTML** :
```
En-tête : titre "Blacklist" + accent-line
Formulaire d'ajout (form method POST) :
  - input email (type email, required)
  - input raison (type text, optionnel)
  - bouton "Ajouter"
  - messages success/error SSR

Tableau :
  - Colonnes : Email / Raison / Date d'ajout / Action
  - Raison : "—" si absente
  - Date : formatée fr-FR (dateStyle: 'short')
  - Action : bouton "Retirer" par ligne
    → au clic JS : remplace le bouton par "Confirmer ? [Oui] [Non]" inline
    → Oui : fetch DELETE /api/blacklist-remove, supprimer la ligne du DOM
    → Non : restaurer le bouton "Retirer"

Pagination JS si > 50 entrées (même pattern que history.astro)
```

Respect du design system : classes `card`, `form-input`, `btn`, `btn-primary`, `btn-secondary`, `form-group`, `form-label`, `success-msg`.

Guard `dataset.initialized` sur les boutons "Retirer".

### Modification : `src/layouts/ClientLayout.astro`

Ajouter dans `<nav class="cl-nav">` :

```html
<a href="/client/blacklist" class:list={['cl-link', { 'cl-link--active': p.startsWith('/client/blacklist') }]}>
  <!-- SVG : icône "no" ou "ban" (cercle barré) -->
  Blacklist
</a>
```

Icône SVG `ban` (cercle barré, 17×17, stroke currentColor stroke-width 2) :
```svg
<circle cx="12" cy="12" r="9"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
```

Ajouter `<link rel="prefetch" href="/client/blacklist" />` dans `<head>`.

---

## Feature 5 — Dashboard ROI dunning

### Modification : `src/pages/client/dashboard.astro`

**Type `StatsData`** : ajouter `recouvrement_montant_recupere?: number` et `recouvrement_taux?: number`.

**Grille stats** : ajouter 2 nouvelles `stat-card` après les existantes :

```html
<div class="stat-card">
  <div class="stat-label">Récupéré ce mois</div>
  <div class="stat-value">
    {(stats?.recouvrement_montant_recupere ?? 0)
      .toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} €
  </div>
</div>

<div class="stat-card">
  <div class="stat-label">Taux de récupération</div>
  <div class="stat-value">
    {stats?.recouvrement_taux ?? 0} %
  </div>
</div>
```

**Ligne de contexte** sous les stat-cards :
```html
<p class="stats-context">
  Calculé sur les paiements récupérés après relance automatique.
</p>
```
Style `.stats-context` : `font-size: 12px; color: var(--fg-muted); margin-top: 0.5rem;`

---

## Feature 6 — Panel de gestion des élèves

### Nouveau fichier : `src/pages/api/send-manual.ts`

POST proxy :  
Body : `{ student_id: string; config_type: string }`  
Validation : les deux champs requis  
Forward → `POST ${AEVUM_URL}/client/send-manual` avec `{ student_id, config_type }`

### Nouveau fichier : `src/pages/client/students.astro`

**Frontmatter** :
- Auth guard
- `Promise.allSettled` : GET `/client/students?page=1&limit=50` + GET `/client/configs`
- Extraire `students: Student[]` et `configs: ConfigEntry[]`
- Type `Student = { id: string; name: string; email: string; status: 'actif' | 'en_dunning' | 'suspendu' | 'blackliste'; created_at: string; emails_received: number; last_action?: string }`

**Template labels** (mapping statique pour le select "Envoyer un email") :
```ts
const TEMPLATE_LABELS: Record<string, string> = {
  template_onboarding_j0:       'Bienvenue (J+0)',
  template_onboarding_j3:       'Suivi J+3',
  template_onboarding_j7:       'Première semaine (J+7)',
  template_failed_payment_j1:   'Relance paiement J+1',
  template_failed_payment_j3:   'Relance paiement J+3',
  template_failed_payment_j7:   'Relance paiement J+7',
};
```

**Template HTML** :
```
En-tête : titre "Élèves" + accent-line + compteur total

4 pills filtres (Tous / En dunning / Suspendus / Blacklistés)
Barre recherche (input text, filtre JS sur nom+email en temps réel)

Tableau :
  Colonnes : Nom / Email / Statut / Date inscription / Emails reçus / Dernière action
  Badges statut :
    actif       → fond rgba(16,185,129,0.15), couleur #10B981
    en_dunning  → fond rgba(245,158,11,0.15), couleur #F59E0B
    suspendu    → fond rgba(239,68,68,0.15), couleur #EF4444
    blackliste  → fond rgba(100,100,100,0.15), couleur #888888
  Lignes cliquables : cursor pointer, hover léger

Drawer latéral (position fixed, right 0, top 0, width 380px, height 100vh) :
  Overlay semi-transparent (position fixed, inset 0, z-index 49)
  Drawer (z-index 50, bg var(--bg-1), border-left 1px solid var(--line), padding 1.5rem, overflow-y auto)
  Header : Nom + email + bouton ✕
  Statut badge + Date inscription
  Section "Historique emails" : liste chronologique (type, sujet, date)
  Section "Envoyer un email" :
    select (options depuis configs disponibles, labels lisibles)
    bouton "Envoyer"
    → clic : confirm inline "Cet email sera envoyé immédiatement à [email]. Confirmer ?"
      avec boutons Oui/Non
    → Oui : fetch /api/send-manual, feedback succès/erreur dans le drawer
```

Chargement du détail élève : au clic sur ligne → fetch GET `/client/students/:id` → remplir le drawer.

Guard `dataset.initialized` sur les listeners de lignes, pills, recherche.

### Modification : `src/layouts/ClientLayout.astro`

Ajouter dans `<nav>` :

```html
<a href="/client/students" class:list={['cl-link', { 'cl-link--active': p.startsWith('/client/students') }]}>
  <!-- SVG : icône users/personnes -->
  Élèves
</a>
```

Icône SVG `users` (17×17) :
```svg
<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
<circle cx="9" cy="7" r="4"/>
<path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
<path d="M16 3.13a4 4 0 0 1 0 7.75"/>
```

Ajouter `<link rel="prefetch" href="/client/students" />` dans `<head>`.

---

## Conventions respectées (toutes les features)

- `export const prerender = false` en tête de chaque fichier SSR
- `getClientFromCookie` + redirect si non authentifié
- 401 backend → `Astro.cookies.delete` + redirect
- `AbortController` 8000 ms sur tous les fetch backend
- `Promise.allSettled` pour appels parallèles
- `Array.isArray(data) ? data : []` avant tout `.map`
- `document.addEventListener('astro:page-load', fn)` pour ré-init View Transitions
- Guard `if (el.dataset.initialized) return; el.dataset.initialized = 'true'`
- Design system : `--bg-1`, `--line`, `--r-lg`, `--fg-muted`, `var(--success)`, classes `btn`, `card`, `form-input`, `form-label`, `form-group`, `success-msg`
- CSS dans `<style is:global>` dans chaque page (pas de fichiers CSS séparés)

---

## Checklist de vérification

- [ ] `npm run build` sans erreur TypeScript
- [ ] Envoi de test : email reçu avec préfixe [TEST]
- [ ] Mode pause : bandeau visible sur dashboard, formulaire bascule après activation
- [ ] Bibliothèque : 4 types, injection fonctionne, confirm si champs non vides
- [ ] Blacklist : ajout SSR, retrait inline sans rechargement, suppression DOM
- [ ] Stat ROI : valeurs "0 €" / "0 %" si nulles
- [ ] Drawer élèves : ouverture, chargement détail, envoi manuel avec confirmation
- [ ] Guard `dataset.initialized` présent partout où requis
- [ ] Toutes les pages respectent le design system B&W
