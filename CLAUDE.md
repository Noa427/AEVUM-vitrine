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

## Multi-formations
Cookie `aevum_formation_id` (SameSite=Strict, Max-Age=86400) — sélecteur dans `ClientLayout` sidebar.

**Pattern dans les pages SSR :**
```ts
const formationId = Astro.cookies.get('aevum_formation_id')?.value ?? null;
const formationHeaders = formationId ? { 'X-Formation-Id': formationId } : {};
const headers = { Authorization: `Bearer ${auth.token}`, ...formationHeaders };
```

**Pattern dans les routes API proxy (JS client → backend) :**
```ts
const cookieHeader = request.headers.get('cookie') ?? '';
const fmMatch = cookieHeader.match(/(?:^|;\s*)aevum_formation_id=([^;]+)/);
const formationId = fmMatch?.[1] ?? null;
// puis ajouter aux headers fetch : ...(formationId ? { 'X-Formation-Id': formationId } : {})
```

## Backend API (`AEVUM_URL` + `Authorization: Bearer ${auth.token}`)
| Route | Méthode | Usage |
|-------|---------|-------|
| `/client/login` | POST `{email,password}` → `{token}` | login |
| `/client/me` | GET | infos compte + `paused_until`, `dkim_public_key` |
| `/client/stats` | GET | stats emails, recouvrement, taux ouverture/clic |
| `/client/automations` | GET | `{onboarding, recouvrement, support_ia, upsell, sender_name}` |
| `/client/history?limit=N` | GET | `[{date, action, details?}]` |
| `/client/configs` | GET | `[{config_type, value}]` |
| `/client/configs` | PUT `{config_type, value}` | update config |
| `/client/settings/password` | POST `{currentPassword, newPassword}` | |
| `/client/settings/email` | POST `{currentPassword, newEmail}` | |
| `/client/ai/generate` | POST `{emailType, formationName, tone, objective}` → `{subject, body}` | IA génération |
| `/client/ai/improve` | POST `{content, emailType}` → `{subject, body}` | IA amélioration |
| `/client/automations/custom` | GET | liste automatisations perso |
| `/client/automations/custom` | POST `{name, subject, body}` | créer automation |
| `/client/automations/custom/:id` | PUT `{active?, name?, subject?, body?}` | toggle/update |
| `/client/automations/custom/:id` | DELETE | supprimer automation |
| `/client/formations` | GET | `[{id, name, stripe_product_id?, created_at}]` |
| `/client/formations` | POST `{name, stripe_product_id?}` | créer formation |
| `/client/formations/:id` | PUT `{name}` | renommer formation |
| `/client/formations/:id` | DELETE | supprimer formation |
| `/client/students?page=N&limit=N` | GET | `[{id, name, email, status, created_at, emails_received, last_action?}]` |
| `/client/students/:id` | GET | détail élève |
| `/client/send-manual` | POST `{student_id, config_type}` | envoi manuel |
| `/client/test-send` | POST `{config_type}` | envoi test |
| `/client/blacklist` | GET | `[{email, reason?, created_at}]` |
| `/client/blacklist` | POST `{email, reason?}` | ajouter à la blacklist |
| `/client/blacklist` | DELETE `{email}` | retirer de la blacklist |
| `/client/pause` | POST `{duration_days}` | activer pause (1/3/7/14/30 j) |
| `/client/pause` | DELETE | désactiver pause |
| `/client/forgot-password` | POST `{email}` | demande reset mdp |
| `/client/reset-password` | POST `{token, newPassword}` | reset mdp |

Config types : `sender_name`, `template_onboarding_j0`, `template_onboarding_j3`, `template_onboarding_j7`, `template_failed_payment_j1`, `template_failed_payment_j3`, `template_failed_payment_j7`

**Templates par défaut (définis dans `customize.astro` → `DEFAULT_TEMPLATES`) :**
- `template_onboarding_j0` : sujet "Bienvenue {{nom}}, voici vos accès"
- `template_onboarding_j3` : sujet "{{nom}}, comment se passe votre début ?"
- `template_onboarding_j7` : sujet "{{nom}} — votre première semaine"
- `template_failed_payment_j1` : sujet "Action requise — problème de paiement" (ton empathique)
- `template_failed_payment_j3` : sujet "{{nom}}, votre accès sera suspendu…" (ton direct)
- `template_failed_payment_j7` : sujet "Dernier avertissement — suspension de votre accès" (ton ferme)

## Pages (toutes SSR sauf marketing)
| URL | Fichier | Layout | Description |
|-----|---------|--------|-------------|
| `/login` | `src/pages/login.astro` | Base | Connexion, redirect si déjà auth |
| `/client/forgot-password` | `src/pages/client/forgot-password.astro` | Base | Demande reset mdp |
| `/client/reset-password` | `src/pages/client/reset-password.astro` | Base | Formulaire nouveau mdp (token URL) |
| `/client` | `src/pages/client/index.astro` | — | Redirect → `/client/dashboard` |
| `/client/dashboard` | `src/pages/client/dashboard.astro` | Client | Stats, badges 3 états, 5 dernières activités, bannière pause |
| `/client/history` | `src/pages/client/history.astro` | Client | Tableau Date/Type/Détails, pagination JS 50/page si >50 |
| `/client/customize` | `src/pages/client/customize.astro` | Client | Éditeur templates (Manuel + IA), automatisations perso |
| `/client/students` | `src/pages/client/students.astro` | Client | Liste élèves, filtres statut, modal détail, envoi manuel |
| `/client/blacklist` | `src/pages/client/blacklist.astro` | Client | Ajout/suppression emails blacklistés |
| `/client/deliverability` | `src/pages/client/deliverability.astro` | Client | Guide SPF/DKIM/DMARC, affiche clé DKIM |
| `/client/formations` | `src/pages/client/formations.astro` | Client | CRUD formations (visible si >1 formation) |
| `/client/settings` | `src/pages/client/settings.astro` | Client | Mdp, email, mode pause, lien deliverability, logout |

## Layouts

### `BaseLayout` — pages marketing
```astro
<BaseLayout title="..." description="..." canonical="/chemin">
```
Utilisé par : `/`, `/features`, `/pricing`, `/contact`, `/comment-ca-marche`, `/login`, pages légales, forgot-password, reset-password.

### `ClientLayout` — portail client
```astro
<ClientLayout title="..." description="..." canonical="/chemin" email={auth.email}>
```
Utilisé par toutes les pages `/client/*` sauf login/forgot-password/reset-password.

Fournit : sidebar (logo, 8 liens nav dont Formations conditionnel si >1 formation, email + logout), sélecteur de formation conditionnel, topbar hamburger mobile (<860px), skip-link accessibilité, `<ClientRouter />`, prefetch pages client, `astro:before-swap` ferme le drawer mobile, toggle dark/light mode.

**Note** : `ClientLayout` fait un appel `getClientFromCookie` indépendant pour charger la liste de formations. Chaque page enfant fait le sien. Double décodage JWT intentionnellement laissé en place (non-cassant).

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
- **Automatisations personnalisées** : modal création (form POST SSR `action=create_automation`) avec bouton "Améliorer avec l'IA" (désactivé si corps vide), liste + toggle actif/inactif (`/api/automation-toggle` PUT), rename inline (`/api/automation-update` PUT `{name, subject?, body?}`), suppression avec modal confirm (`/api/automation-delete` DELETE)

## API routes proxy (`src/pages/api/`)
Toutes SSR (`prerender = false`). Pattern : auth via cookie → parse body → fetch backend avec Bearer token → forward réponse.
Utilitaires partagés : `src/lib/api.ts` → `jsonRes(data, status)`, `UUID_V4` regex.

Timeouts : 8 s pour tous les endpoints sauf IA (30 s).

Routes qui transmettent `X-Formation-Id` : `config-update`, `blacklist-add`, `blacklist-remove`, `send-manual`, `student-detail`, `test-send`.

| Fichier | Méthode | Backend |
|---------|---------|---------|
| `ai-generate.ts` | POST | `/client/ai/generate` |
| `ai-improve.ts` | POST | `/client/ai/improve` |
| `config-update.ts` | PUT | `/client/configs` |
| `automation-toggle.ts` | PUT | `/client/automations/custom/:id` (`{active}`) |
| `automation-update.ts` | PUT | `/client/automations/custom/:id` (`{name?, subject?, body?}`) |
| `automation-delete.ts` | DELETE | `/client/automations/custom/:id` |
| `blacklist-add.ts` | POST | `/client/blacklist` |
| `blacklist-remove.ts` | DELETE | `/client/blacklist` |
| `formation-create.ts` | POST | `/client/formations` |
| `formation-update.ts` | PUT | `/client/formations/:id` |
| `formation-delete.ts` | DELETE | `/client/formations/:id` |
| `pause-enable.ts` | POST | `/client/pause` |
| `pause-disable.ts` | POST | `/client/pause` (DELETE) |
| `send-manual.ts` | POST | `/client/send-manual` |
| `student-detail.ts` | GET | `/client/students/:id` |
| `test-send.ts` | POST | `/client/test-send` |

## dashboard.astro — état actuel (shipped)
- `Promise.allSettled` sur 5 appels : stats, automations, history, configs, me
- Badges onboarding/recouvrement à 3 états calculés via `computeStatus()` :
  - `'actif'` : booléen backend true + tous les templates actifs (ou aucun sauvegardé → defaults)
  - `'partiel'` : booléen backend true + certains templates désactivés
  - `'off'` : booléen backend false
- CSS `.badge-partiel` : fond ambre `rgba(245,158,11,0.15)`, couleur `#F59E0B`
- Bannière pause si `paused_until` non null (depuis `/client/me`)
- Stats étendues : montant récupéré, taux récupération, taux ouverture/clic

## Pages marketing — état actuel (2026-06-01, branche feat/phase2-features8-12)
Pages `index`, `features`, `pricing`, `comment-ca-marche` mises à jour pour refléter le produit complet.

**Tarifs actuels dans `pricing.astro` :**
| Plan | Setup | /mois | Type |
|------|-------|-------|------|
| Case Study | 0€ | 300€ | Lancement (2 places) |
| Membre Fondateur | 990€ | 590€ | Lancement (3 places) |
| Standard | 2 500€ | 690€ | Permanent |
| Premium | 4 500€ | 1 290€ | Permanent |

Options : Abandons checkout (+200€/mois), Vocale IA (+350€/mois + usage), Module Notaire (149€/dossier).

**`features.astro`** : 5 catégories, 25 features. Variables frontmatter : `categories[]` (id, title, icon, features[]).

**`index.astro`** : preview Standard + Premium (pas les offres lancement). Piliers : Onboarding, Récupération impayés, Dashboard & stats ROI, Portail complet.

## TODO — prochaine session
- Tracker les 3 fichiers non-commités git (`src/lib/api.ts`, `forgot-password.astro`, `reset-password.astro`)
- Tests E2E portail client (login → customize → save template → rename → delete automation)
- Déploiement Vercel : vérifier variables d'env `AEVUM_URL` + `JWT_SECRET` en production
- Mettre à jour `pricing.astro` quand les places lancement sont prises (supprimer la section "Offres de lancement")

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
npm test        # vitest — src/lib/auth.test.ts (5 tests JWT)
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
- UUID validation : utiliser `UUID_V4` importé depuis `src/lib/api.ts` (ne pas redéfinir localement)
- X-Formation-Id : toujours transmettre le cookie `aevum_formation_id` en header dans les routes proxy concernées

## RÈGLES POUR ÉCONOMISER LES TOKENS
- Toujours lire CLAUDE.md en début de session
- Lire le code existant avant d'en écrire du nouveau
- Réutiliser les patterns existants (auth guard, Promise.allSettled, formationHeaders, jsonRes)
- Modifier par diff ciblé, pas réécriture de fichiers entiers
- Pas de récap inutile, pas de préambule décoratif
- Commits séparés par feature
- Demander avant de supprimer du code
