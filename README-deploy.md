# AEVUM Vitrine — Déploiement

## Stack
- **Framework** : Astro 6 (SSR hybride — pages marketing statiques, portail client SSR)
- **Adapter** : `@astrojs/vercel`
- **Hébergement** : Vercel

## Variables d'environnement (Vercel dashboard)

| Variable | Description |
|----------|-------------|
| `AEVUM_URL` | URL du backend Render (ex: `https://api.aevum.fr`) |
| `JWT_SECRET` | Secret JWT — doit correspondre exactement au backend |
| `PUBLIC_CONTACT_FORM_URL` | URL Formspree pour le formulaire de contact |

## Déploiement

Connecter le dépôt GitHub sur [vercel.com](https://vercel.com) et configurer les variables ci-dessus.

```bash
# Build command
npm run build

# Output directory
.vercel/output  # géré automatiquement par l'adapter
```

## Commandes locales

```bash
npm run dev       # Dev server → localhost:4321
npm run build     # Build production
npm run preview   # Preview du build
npm test          # Tests unitaires
```
