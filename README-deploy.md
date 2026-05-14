# AEVUM Vitrine — Guide de déploiement

## Stack technique
- **Framework** : Astro 5 (SSG — HTML statique pur)
- **CSS** : Vanilla CSS (pas de framework CSS)
- **JS client** : < 3 KB (Intersection Observer + FAQ + formulaires)
- **Hébergement recommandé** : Cloudflare Pages

---

## Déploiement sur Cloudflare Pages

### 1. Connecter le dépôt
1. Aller sur [Cloudflare Pages](https://pages.cloudflare.com)
2. Créer un nouveau projet
3. Connecter le dépôt GitHub
4. Sélectionner la branche `claude`

### 2. Configuration du build
| Paramètre | Valeur |
|---|---|
| Build command | `npm run build` |
| Build output directory | `dist` |
| Node.js version | `20` |

### 3. Domaine personnalisé
1. Ajouter `aevum.fr` dans les paramètres du projet
2. Configurer les DNS chez votre registrar
3. HTTPS automatique via Cloudflare

---

## Déploiement sur Vercel (alternative)

```bash
npm i -g vercel
vercel
```

Ou connecter le dépôt sur [vercel.com](https://vercel.com).

---

## Déploiement sur Netlify (alternative)

```bash
npm i -g netlify-cli
netlify deploy --prod --dir=dist
```

Ou connecter le dépôt sur [app.netlify.com](https://app.netlify.com).

---

## Commandes utiles

```bash
# Développement
npm run dev

# Build production
npm run build

# Preview du build
npm run preview
```

---

## Performance attendue

| Métrique | Score |
|---|---|
| Lighthouse Performance | 100/100 |
| Lighthouse Accessibility | 100/100 |
| Lighthouse Best Practices | 100/100 |
| Lighthouse SEO | 100/100 |
| FCP | < 0.5s |
| LCP | < 0.8s |
| TBT | 0ms |
| CLS | 0 |
| Bundle JS (gzippé) | < 3 KB |
| CSS (gzippé) | < 12 KB |
