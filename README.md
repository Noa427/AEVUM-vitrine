# AEVUM — Vitrine

Site marketing + portail client. Astro 6, SSR hybride, déploiement Vercel.

## Setup local

```bash
npm install
```

Créer un fichier `.env` à la racine :

```
PUBLIC_CONTACT_FORM_URL=   # URL Formspree (form contact)
AEVUM_URL=                 # URL backend Render (ex: https://api.aevum.fr)
JWT_SECRET=                # Même secret que le backend
```

## Commandes

```bash
npm run dev       # Dev server → localhost:4321
npm run build     # Build production (TypeScript check inclus)
npm run preview   # Preview du build local
npm test          # Tests unitaires (vitest) — src/lib/auth.test.ts
```

## Structure

```
src/
├── layouts/
│   ├── BaseLayout.astro     # Pages marketing (header/footer)
│   └── ClientLayout.astro   # Portail client (sidebar, sélecteur formation)
├── pages/
│   ├── index.astro / features.astro / pricing.astro / ...  # Marketing
│   ├── login.astro
│   ├── client/
│   │   ├── forgot-password.astro
│   │   ├── reset-password.astro
│   │   ├── dashboard.astro
│   │   ├── customize.astro
│   │   ├── history.astro
│   │   ├── students.astro
│   │   ├── blacklist.astro
│   │   ├── deliverability.astro
│   │   ├── formations.astro
│   │   └── settings.astro
│   └── api/                 # Proxies SSR → backend (auth cookie)
│       ├── ai-generate.ts / ai-improve.ts
│       ├── config-update.ts
│       ├── automation-toggle.ts / automation-update.ts / automation-delete.ts
│       ├── blacklist-add.ts / blacklist-remove.ts
│       ├── formation-create.ts / formation-update.ts / formation-delete.ts
│       ├── pause-enable.ts / pause-disable.ts
│       ├── send-manual.ts / student-detail.ts / test-send.ts
└── lib/
    ├── auth.ts              # getClientFromCookie (JWT via cookie)
    └── api.ts               # jsonRes(), UUID_V4
```

## Déploiement

Vercel (adapter `@astrojs/vercel`). Variables d'env à configurer dans le dashboard Vercel : `AEVUM_URL`, `JWT_SECRET`.

Le fichier `.env` ne doit jamais être commité.
