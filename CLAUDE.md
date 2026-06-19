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
| `/client/settings/password` | PUT `{currentPassword, newPassword}` | |
| `/client/settings/email` | PUT `{currentPassword, newEmail}` | |
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
| `/client/vocal/send` | POST `{student_id}` | déclencher appel vocal IA |
| `/client/settings/whatsapp` | POST `{phone_number_id, access_token}` | connecter WhatsApp |
| `/client/settings/whatsapp` | DELETE | déconnecter WhatsApp |
| `/client/forgot-password` | POST `{email}` | demande reset mdp |
| `/client/reset-password` | POST `{token, newPassword}` | reset mdp |

Config types : `sender_name`, `template_onboarding_j0`, `template_onboarding_j3`, `template_onboarding_j7`, `template_failed_payment_j1`, `template_failed_payment_j3`, `template_failed_payment_j7`, `template_predunning`, `template_churn_reengagement`, `template_coaching_j14`, `coaching_ia_ton`, `coaching_ia_objectif`, `template_upsell_j30`, `template_checkout_abandon`, `testimonial_url`, `template_testimonial_j30`, `template_testimonial_j60`, `rapport_video_active`, `vocal_ia_active`

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
| `/client/students` | `src/pages/client/students.astro` | Client | Liste élèves, filtres statut, drawer détail, envoi email manuel, appel vocal IA (si phone), pagination "Charger plus" |
| `/client/blacklist` | `src/pages/client/blacklist.astro` | Client | Ajout/suppression emails blacklistés |
| `/client/deliverability` | `src/pages/client/deliverability.astro` | Client | Guide SPF/DKIM/DMARC, affiche clé DKIM |
| `/client/formations` | `src/pages/client/formations.astro` | Client | CRUD formations (visible si >1 formation) |
| `/client/settings` | `src/pages/client/settings.astro` | Client | Mdp, email, mode pause, WhatsApp, SMS, vocal IA toggle, rapport vidéo toggle, deliverability, logout |

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
- **Navigation 2 niveaux** : `sender_name` en section indépendante hors onglets, puis 6 catégories de niveau 1 (`cat-tab`) — Onboarding, Impayés, Fidélisation, Récupération, Témoignages, Automatisations. `CAT_KEYS` mappe catégorie → liste de config keys ; sous-onglets (`config-tab`) par template dans chaque catégorie.
- **Templates par catégorie** :
  - Onboarding : `template_onboarding_j0/j3/j7` (Bienvenue, J+3, J+7)
  - Impayés : `template_failed_payment_j1/j3/j7` (Relance J+1/J+3/J+7)
  - Fidélisation : `template_predunning` (Pré-dunning — CB expire <14j), `template_churn_reengagement` (Re-engagement — 0 ouverture depuis 21j), `template_coaching_j14` (Coaching — 14j sans connexion, cible les élèves jamais démarrés), `template_upsell_j30` (Upsell J+30), `coaching_ia` (Coaching IA J+14 — voir ci-dessous)
  - Récupération : `template_checkout_abandon` (30 min après abandon panier Stripe) — verrouillé visuellement (`.checkout-lock-overlay`) si `optionCheckout` (depuis `/client/me`) est `false`
  - Témoignages : `testimonial_url` (URL formulaire, section indépendante hors onglets) + `template_testimonial_j30`/`template_testimonial_j60`
- **Section "Coaching IA J+14"** (`coaching_ia`, ajoutée 2026-06-19) : pas de sujet/corps fixe — 2 champs `select` Ton (empathique/motivant/direct) et texte libre Objectif, sauvegardés comme 2 config_types séparés (`coaching_ia_ton`, `coaching_ia_objectif`) via un seul submit (`action=save_coaching_ia` géré côté SSR avec `Promise.allSettled` sur 2 PUT `/client/configs`). Libellé "Paramètres IA" (pas "template") pour signaler que le contenu est généré dynamiquement par l'IA à l'envoi, pas édité ici.
- **Éditeur** (templates à sujet/corps fixe) : onglet "✏️ Rédiger moi-même" + onglet "✨ Générer avec l'IA" (branché sur `/api/ai-generate`, `/api/ai-improve`)
- **Bouton "Améliorer avec l'IA"** : branché sur `/api/ai-improve` (présent dans chaque carte template ET dans le modal de création d'automatisation)
- **Bouton "📚 Bibliothèque"** (F3, `btn-library`) : présent sur Onboarding/Impayés/Récupération/Témoignages (pas Fidélisation). Ouvre `#lib-overlay`, liste des templates pré-écrits par type d'activité (`TEMPLATE_LIBRARY`/`LIBRARY_TYPE_LABELS` : vidéo, coaching 1-to-1, groupe privé, bootcamp) — 100% client-side, pas d'appel backend. "Utiliser ce template" remplit `.subject-input`/`.body-input` du panneau actif (confirm si contenu existant).
- **Section "mail par défaut"** : collapsible "Voir le template par défaut ▾" + bouton "Utiliser ce template" dans chaque carte (Onboarding/Impayés uniquement, via `DEFAULT_TEMPLATES`)
- **Sauvegarde** : form POST SSR → `value = JSON.stringify({subject, body, active, label?})` (via `.hidden-value` intercepté avant submit)
- **Rétrocompat** : `parseConfig()` gère ancien format plain-text → `{subject:'', body: rawString, active: true}`
- **Toggle actif/inactif** : par template, persisté via `/api/config-update` PUT avec `active` dans le JSON ; les panneaux inactifs sont désactivés visuellement (opacity 0.6)
- **Rename** : double-clic sur onglet (contenteditable) OU bouton ✏️ dans la section (inline input), sauvegarde via `/api/config-update` PUT
- **Bannière** : visible si `allDefaultTemplates` (les 6 templates onboarding/impayés tous vides), dismissible via sessionStorage `aevum_banner_dismissed`
- **Variables** disponibles par template (`VARIABLE_HINTS`) :
  - onboarding j0 : `{{nom}}` `{{prenom}}` `{{email}}` `{{nom_formation}}` `{{lien_acces}}` `{{mot_de_passe}}`
  - onboarding j3/j7, churn_reengagement, coaching_j14, upsell_j30 : idem sans `{{mot_de_passe}}`
  - failed_payment_j1/j3/j7, predunning, checkout_abandon : `{{nom}}` `{{prenom}}` `{{email}}` `{{montant}}`/`{{date_expiration}}` `{{lien_paiement}}`/`{{lien_checkout}}`
  - testimonial_j30/j60 : `{{nom}}` `{{prenom}}` `{{nom_formation}}` `{{lien_temoignage}}`
- **Automatisations personnalisées** : modal création (form POST SSR `action=create_automation`) avec le même éditeur à onglets que les templates par défaut — "✏️ Rédiger moi-même" (sujet/corps/hints + bouton "Améliorer avec l'IA", désactivé si corps vide) et "✨ Générer avec l'IA" (formation/ton/objectif → `/api/ai-generate` `{emailType:'custom_automation', ...}`, "Utiliser ce contenu →" remplit le tab manuel et bascule dessus), liste + toggle actif/inactif (`/api/automation-toggle` PUT), rename inline (`/api/automation-update` PUT `{name, subject?, body?}`), suppression avec modal confirm (`/api/automation-delete` DELETE)
- **Limite 10 automatisations perso / formation** : `autoLimitReached = customAutomations.length >= 10` désactive `#btn-open-auto-modal` + affiche `.auto-limit-msg` ; check identique côté backend `AEVUM_LOGI_INFOPRENEUR/backend/src/routes/clientAuth.ts` (POST `/client/automations/custom` → 400 si déjà 10)
- **Après création réussie** : `successType = 'create_automation'` → `initialCat = 'automations'` (reste sur l'onglet Automatisations au reload, comme pour les erreurs)

## API routes proxy (`src/pages/api/`)
Toutes SSR (`prerender = false`). Pattern : auth via cookie → parse body → fetch backend avec Bearer token → forward réponse.
Utilitaires partagés : `src/lib/api.ts` → `jsonRes(data, status)`, `UUID_V4` regex.

Timeouts : 8 s pour tous les endpoints sauf IA (30 s) et vocal (45 s).

Routes qui transmettent `X-Formation-Id` : `config-update`, `blacklist-add`, `blacklist-remove`, `send-manual`, `student-detail`, `test-send`, `vocal-send`.

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
| `vocal-send.ts` | POST | `/client/vocal/send` (timeout 45s) |

## dashboard.astro — état actuel (shipped)
- `Promise.allSettled` sur 5 appels : stats, automations, history, configs, me
- Badges onboarding/recouvrement à 3 états calculés via `computeStatus()` :
  - `'actif'` : booléen backend true + tous les templates actifs (ou aucun sauvegardé → defaults)
  - `'partiel'` : booléen backend true + certains templates désactivés
  - `'off'` : booléen backend false
- CSS `.badge-partiel` : fond ambre `rgba(245,158,11,0.15)`, couleur `#F59E0B`
- Bannière pause si `paused_until` non null (depuis `/client/me`)
- Stats étendues : montant récupéré, taux récupération, taux ouverture/clic

## Pages marketing — état actuel (2026-06-03)
Pages `index`, `features`, `pricing`, `comment-ca-marche` mises à jour pour refléter le produit complet.

**Tarifs actuels dans `pricing.astro` :**
| Plan | Setup | /mois | Type |
|------|-------|-------|------|
| Case Study | 0€ | 300€ | Lancement (2 places) |
| Membre Fondateur | 990€ | 590€ | Lancement (3 places) |
| Standard | 2 500€ | 690€ | Permanent |
| Premium | 4 500€ | 1 290€ | Permanent |

Options : Abandons checkout (+200€/mois), Vocale IA (+350€/mois + coûts d'appels), Module Notaire (bientôt disponible).

**`features.astro`** : 5 catégories, 28 features (vocal IA réintégrée dans "Multi-canal & IA avancée"). Variables frontmatter : `categories[]` (id, title, icon, features[]).

**`index.astro`** : preview Standard + Premium (pas les offres lancement). Piliers : Onboarding, Récupération impayés, Dashboard & stats ROI, Portail complet.

## TODO — prochaine session
- Déploiement Vercel : vérifier variables d'env `AEVUM_URL` + `JWT_SECRET` en production
- Mettre à jour `pricing.astro` quand les places lancement sont prises (supprimer la section "Offres de lancement")
- F13 vocal IA : tester le bouton "Appel vocal IA" dans le drawer élève une fois le backend déployé
- Vérification visuelle manuelle (`npm run dev`) du modal de création d'automatisation perso (onglets Rédiger/Générer IA, génération + "Utiliser ce contenu")
- `npm test` (vitest) échoue globalement car il scanne `e2e/*.spec.ts` (conflit Playwright) — ajouter `exclude: ['e2e/**']` dans `vitest.config.ts` si souhaité
- Backend `AEVUM_LOGI_INFOPRENEUR` : vérifier le commit du check de limite 10 dans `clientAuth.ts` (POST `/client/automations/custom`) une fois ce repo dans un état stable (autres fichiers modifiés en cours)

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
npm run test:e2e # Playwright — e2e/*.spec.ts
```

### E2E (Playwright)
- Config : `playwright.config.ts` — deux `webServer` : `e2e/mock-backend.mjs` (port 4310, mock du backend AEVUM via `http`) + `npm run dev -- --port 4321` (Astro pointé sur le mock via `AEVUM_URL`/`JWT_SECRET` d'env injectés dans le `webServer`)
- `e2e/fixtures.mjs` : ports, credentials de test (`TEST_EMAIL`/`TEST_PASSWORD`/`TEST_CLIENT_ID`), `JWT_SECRET` de test (distinct du `.env` réel, ok à commiter)
- `e2e/mock-backend.mjs` : serveur Node `http` en mémoire, signe les JWT avec `jose`, implémente `/client/login`, `/client/me`, `/client/stats`, `/client/automations`, `/client/history`, `/client/formations`, `/client/configs`, `/client/automations/custom` (CRUD), `/client/ai/generate`
- `e2e/auth-guard.spec.ts` : accès `/client/*` sans cookie → redirect `/login`
- `e2e/client-portal.spec.ts` : login → `/client/customize` → édition+sauvegarde template → renommage onglet → création/toggle/suppression automatisation perso (manuel + génération IA) → limite 10 automatisations perso
- Pièges connus :
  - `h1` : scoper en `main h1` (la dev toolbar Astro injecte d'autres `h1`)
  - Modal création automatisation : `trigger_days` est `required` par défaut (trigger `delay_after_purchase`) — toujours le remplir avant submit
  - Si un `webServer` reste bloqué sur un port (4310/4321) suite à un run interrompu, `reuseExistingServer` réutilisera l'ancien process mal configuré → tuer le process avant de relancer
  - `e2e/mock-backend.mjs` a un état en mémoire **partagé entre tous les tests** du run (1 worker) : chaque test qui crée une automatisation perso doit la supprimer en fin de test pour ne pas fausser le test de limite (10)
  - `npm test` (vitest) scanne aussi `e2e/*.spec.ts` (conflit avec `test.describe` de Playwright) → la commande globale échoue même si les 5 tests `auth.test.ts` passent ; pas corrigé (`vitest.config.ts` n'exclut pas `e2e/`)

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
- Navigation 2 niveaux (`customize.astro`) : `CAT_KEYS` mappe catégorie→templates, `initCategoryTabs()` gère les onglets catégorie, `initConfigTabs()` gère les sous-onglets template — ne pas briser ce couplage

## RÈGLES POUR ÉCONOMISER LES TOKENS
- Toujours lire CLAUDE.md en début de session
- Lire le code existant avant d'en écrire du nouveau
- Réutiliser les patterns existants (auth guard, Promise.allSettled, formationHeaders, jsonRes)
- Modifier par diff ciblé, pas réécriture de fichiers entiers
- Pas de récap inutile, pas de préambule décoratif
- Commits séparés par feature
- Demander avant de supprimer du code
