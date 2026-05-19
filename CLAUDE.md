# AEVUM Vitrine — CLAUDE.md

## Stack
- Astro 6, `output: 'static'` + `@astrojs/vercel` (hybrid SSR)
- TypeScript strict, ESM, Node ≥ 22
- Pas de framework UI — HTML/CSS pur, CSS variables globales
- `<ClientRouter />` (View Transitions Astro) présent dans les deux layouts

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

Config types : `sender_name`, `template_onboarding_j0`, `template_onboarding_j3`, `template_onboarding_j7`, `template_failed_payment`

## Pages client (toutes SSR)
| URL | Fichier | Description |
|-----|---------|-------------|
| `/login` | `src/pages/login.astro` | Page publique — `BaseLayout` |
| `/client` | `src/pages/client/index.astro` | Redirect → `/client/dashboard` |
| `/client/dashboard` | `src/pages/client/dashboard.astro` | Stats (`0` si null), automations (lien `/client/customize` si non configuré), 5 dernières activités |
| `/client/history` | `src/pages/client/history.astro` | Tableau Date/Type/Détails, pagination JS 50/page si >50 entrées |
| `/client/customize` | `src/pages/client/customize.astro` | 5 formulaires templates, badges variables cliquables (click-to-insert) |
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

Fournit : sidebar fixe 220px (logo, 4 liens nav, email + logout), topbar hamburger mobile (<860px), skip-link accessibilité, `<ClientRouter />`, prefetch des 4 pages client.

## CSS
`global.css` est intentionnellement vide — tous les styles sont injectés via `<style is:global>` dans les layouts (pattern Astro, bypasse les caches).

### Classes utilitaires disponibles dans les pages client
`section`, `container`, `card`, `btn`, `btn-primary`, `btn-secondary`, `form-group`, `form-label`, `form-input`, `success-msg`, `accent-line`, `grid-2`, `grid-3`

### Design system v3 — B&W premium
- Fond : `--bg: #0a0a0f`
- Cartes : `--bg-1: #12151f`, border-radius `--r-lg: 16px`
- Logo / boutons primaires : blanc (`--ink: #fafafa`) — pas de bleu
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
