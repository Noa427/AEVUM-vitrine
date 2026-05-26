# AEVUM Vitrine — CLAUDE.md

## Stack
- Astro 6, `output: 'static'` + `@astrojs/vercel` (hybrid SSR)
- TypeScript strict, ESM, Node ≥ 22
- Pas de framework UI — HTML/CSS pur, CSS variables globales
- `<ClientRouter />` (View Transitions Astro) présent dans les deux layouts
- Backend repo : `../AEVUM_LOGI_INFOPRENEUR/backend/` (accessible depuis ce workspace)

## SSR
- Pages statiques (marketing) : pas de `prerender`
- Pages dynamiques : `export const prerender = false;` obligatoire en tête de fichier
- `import.meta.env.AEVUM_URL` = URL backend Render
- `import.meta.env.JWT_SECRET` = secret JWT (même valeur que le backend)

## Auth
```ts
// src/lib/auth.ts
getClientFromCookie(request: Request): Promise<AuthPayload | null>
// AuthPayload = { clientId: string; email: string; token: string }
// token = JWT brut → utiliser comme Bearer
```
Cookie : `aevum_token` (HttpOnly, Secure, SameSite=strict, maxAge=604800)

**Pattern auth guard dans chaque page SSR :**
```ts
const auth = await getClientFromCookie(Astro.request);
if (!auth) return Astro.redirect('/login');
```

**Pattern 401 backend :**
```ts
if (res.status === 401) {
  Astro.cookies.delete('aevum_token', { path: '/' });
  return Astro.redirect('/login');
}
```

## Backend API (`AEVUM_URL` + `Authorization: Bearer ${auth.token}`)
| Route | Méthode | Usage |
|-------|---------|-------|
| `/client/login` | POST `{email,password}` → `{token}` | login |
| `/client/me` | GET | infos compte |
| `/client/stats` | GET | `{emails_this_month, total_emails, recouvrement_envoyes, upsells_envoyes}` |
| `/client/automations` | GET | `{onboarding, recouvrement, support_ia, upsell, sender_name}` |
| `/client/history?limit=N` | GET | `[{date, action, details?}]` |
| `/client/configs` | GET | `[{config_type, value}]` |
| `/client/configs` | PUT `{config_type, value}` | update config |
| `/client/settings/password` | POST `{currentPassword, newPassword}` | |
| `/client/settings/email` | POST `{currentPassword, newEmail}` | |
| `/client/ai/generate` | POST `{emailType, formationName, tone, objective}` → `{subject, body}` | IA génération |
| `/client/ai/improve` | POST `{content, emailType}` → `{subject, body}` | IA amélioration |

Config types : `sender_name`, `template_onboarding_j0`, `template_onboarding_j3`, `template_onboarding_j7`, `template_failed_payment_j1`, `template_failed_payment_j3`, `template_failed_payment_j7`

**Templates par défaut (définis dans `customize.astro` → `DEFAULT_TEMPLATES`) :**
- `template_onboarding_j0` : sujet "Bienvenue {{nom}}, voici vos accès"
- `template_onboarding_j3` : sujet "{{nom}}, comment se passe votre début ?"
- `template_onboarding_j7` : sujet "{{nom}} — votre première semaine"
- `template_failed_payment_j1` : sujet "Action requise — problème de paiement" (ton empathique)
- `template_failed_payment_j3` : sujet "{{nom}}, votre accès sera suspendu…" (ton direct)
- `template_failed_payment_j7` : sujet "Dernier avertissement — suspension de votre accès" (ton ferme)

## Pages client (toutes SSR)
| URL | Fichier | Description |
|-----|---------|-------------|
| `/login` | `src/pages/login.astro` | Page publique — `BaseLayout` |
| `/client` | `src/pages/client/index.astro` | Redirect → `/client/dashboard` |
| `/client/dashboard` | `src/pages/client/dashboard.astro` | Stats (`0` si null), automations avec badges 3 états (Actif/Partiellement actif/Non configuré), 5 dernières activités |
| `/client/history` | `src/pages/client/history.astro` | Tableau Date/Type/Détails, pagination JS 50/page si >50 entrées |
| `/client/customize` | `src/pages/client/customize.astro` | Éditeur 3 modes (Manuel + Générer IA), bannière défaut, badges variables |
| `/client/settings` | `src/pages/client/settings.astro` | Email actuel (readonly), changement mdp + email, logout danger |

## Layouts

### `BaseLayout` — pages marketing
```astro
<BaseLayout title="..." description="..." canonical="/chemin">
```
Utilisé par : `/`, `/features`, `/pricing`, `/contact`, `/comment-ca-marche`, `/login`, pages légales.

### `ClientLayout` — portail client
```astro
<ClientLayout title="..." description="..." canonical="/chemin" email={auth.email}>
```
Utilisé par toutes les pages `/client/*` sauf `/login`.

Fournit : sidebar fixe 220px (logo, 4 liens nav, email + logout), topbar hamburger mobile (<860px), skip-link accessibilité, `<ClientRouter />`, prefetch des 4 pages client, `astro:before-swap` ferme le drawer mobile.

## customize.astro — état actuel (shipped)
- 7 configs : `sender_name` (section indépendante), 6 templates email (onglets horizontaux : Bienvenue, J+3, J+7, Relance J+1, Relance J+3, Relance J+7)
- **Éditeur** : onglet "✏️ Rédiger moi-même" + onglet "✨ Générer avec l'IA" (branché sur `/api/ai-generate`, `/api/ai-improve`)
- **Bouton "Améliorer avec l'IA"** : branché sur `/api/ai-improve` (présent dans chaque carte template ET dans le modal de création d'automatisation)
- **Section "mail par défaut"** : collapsible "Voir le template par défaut ▾" + bouton "Utiliser ce template" dans chaque carte
- **Sauvegarde** : form POST SSR → `value = JSON.stringify({subject, body, active, label?})` (via `.hidden-value` intercepté avant submit)
- **Rétrocompat** : `parseConfig()` gère ancien format plain-text → `{subject:'', body: rawString, active: true}`
- **Toggle actif/inactif** : par template, persisté via `/api/config-update` PUT avec `active` dans le JSON ; les panneaux inactifs sont désactivés visuellement (opacity 0.6)
- **Rename** : double-clic sur onglet (contenteditable) OU bouton ✏️ dans la section (inline input), sauvegarde via `/api/config-update` PUT
- **Bannière** : visible si `allDefaultTemplates` (les 6 templates tous vides), dismissible via sessionStorage `aevum_banner_dismissed`
- **Variables** disponibles par template :
  - onboarding j0 : `{{nom}}` `{{prenom}}` `{{email}}` `{{nom_formation}}` `{{lien_acces}}` `{{mot_de_passe}}`
  - onboarding j3/j7 : idem sans `{{mot_de_passe}}`
  - failed_payment_j1/j3/j7 : `{{nom}}` `{{prenom}}` `{{email}}` `{{montant}}` `{{lien_paiement}}`
- **Automatisations personnalisées** : modal création (form POST SSR `action=create_automation`) avec bouton "Améliorer avec l'IA" (désactivé si corps vide), liste + toggle actif/inactif (`/api/automation-toggle` PUT), rename inline (`/api/automation-update` PUT), suppression avec modal confirm (`/api/automation-delete` DELETE)

## API routes proxy (`src/pages/api/`)
Toutes SSR (`prerender = false`). Pattern : auth via cookie → parse body → fetch backend avec Bearer token → forward réponse.
Utilitaire partagé : `src/lib/api.ts` → `jsonRes(data, status)`.

| Fichier | Méthode | Backend |
|---------|---------|---------|
| `ai-generate.ts` | POST | `/client/ai/generate` |
| `ai-improve.ts` | POST | `/client/ai/improve` |
| `config-update.ts` | PUT | `/client/configs` |
| `automation-toggle.ts` | PUT | `/client/automations/custom/:id` (`{active}`) |
| `automation-update.ts` | PUT | `/client/automations/custom/:id` (`{name}`) |
| `automation-delete.ts` | DELETE | `/client/automations/custom/:id` |

## dashboard.astro — état actuel (shipped)
- `Promise.allSettled` sur 4 appels : stats, automations, history, **configs**
- Badges onboarding/recouvrement à 3 états calculés via `computeStatus()` :
  - `'actif'` : booléen backend true + tous les templates actifs (ou aucun sauvegardé → defaults)
  - `'partiel'` : booléen backend true + certains templates désactivés
  - `'off'` : booléen backend false
- CSS `.badge-partiel` : fond ambre `rgba(245,158,11,0.15)`, couleur `#F59E0B`
- Graceful degradation : si `/client/configs` échoue → `configs = {}` → comportement identique à avant
- Support IA et Upsell : inchangés (pas de configs JSON associées)

## TODO — prochaine session
- Déploiement Vercel : vérifier variables d'env `AEVUM_URL` + `JWT_SECRET` en production
- Tests E2E portail client (login → customize → save template → rename → delete automation)

## CSS
`global.css` est intentionnellement vide — tous les styles sont injectés via `<style is:global>` dans les layouts (pattern Astro, bypasse les caches).

### Classes utilitaires disponibles dans les pages client
`section`, `container`, `card`, `btn`, `btn-primary`, `btn-secondary`, `form-group`, `form-label`, `form-input`, `success-msg`, `accent-line`, `grid-2`, `grid-3`

### Design system v3 — B&W premium
- Fond : `--bg: #0a0a0f`
- Cartes : `--bg-1: #12151f`, border-radius `--r-lg: 16px`
- Logo / boutons primaires : blanc (`--ink: #fafafa`) — pas de bleu
- Accents IA/action : bleu `#2E8BF0` (tabs actifs uniquement)
- Grille de fond : `body::before` (`position: fixed`, grid 96px, mask radial)
- Fonts : Inter uniquement (client), Inter + Instrument Serif (marketing) — chargées en **async** (`media="print" onload`)

### Variables clés (aliases legacy utilisés dans les pages)
`--primary`, `--light`, `--gray`, `--gray-light`, `--gray-border`, `--dark-card`, `--dark-elevated`, `--success`, `--success-light`, `--radius-sm`, `--radius-lg`, `--transition`

## .env (ne jamais commiter)
```
PUBLIC_CONTACT_FORM_URL=   # Formspree
AEVUM_URL=                 # URL Render backend
JWT_SECRET=                # même secret que le backend
```

## Tests
```bash
npm test        # vitest — src/lib/auth.test.ts (6 tests JWT)
npm run build   # vérification TypeScript + build Vercel
```

## Conventions
- Appels parallèles : `Promise.allSettled` (jamais `Promise.all` pour des API indépendantes)
- Guard array avant `.map` : `Array.isArray(data) ? data : []`
- Pas de trim sur les mots de passe
- Erreurs non-JSON : `.catch(() => ({}))`
- `null` sur les données optionnelles avant affichage : optional chaining `?.`
- Stats nulles/undefined → afficher `'0'`, pas `'—'`
- Scripts JS dans les pages client : wrapper dans une fonction + `document.addEventListener('astro:page-load', fn)` pour ré-init après View Transitions
- Guard double listeners : `if (card.dataset.initialized) return; card.dataset.initialized = 'true';`
- Sauvegarde templates : form POST SSR avec `hidden-value = JSON.stringify({subject, body})`
- API routes proxy Astro (`src/pages/api/*.ts`) pour les appels backend nécessitant le Bearer token depuis JS client
