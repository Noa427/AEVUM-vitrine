# Spec — Portail client : sidebar + améliorations pages

**Date :** 2026-05-19  
**Scope :** `src/layouts/ClientLayout.astro` + 4 pages `/client/*`  
**Décision design :** sidebar fixe (220 px), pas de topbar

---

## 1. ClientLayout.astro

### Structure
```
body
└── .client-shell  (CSS grid : 220px | 1fr, min-height: 100vh)
    ├── aside.client-sidebar  (position: fixed, 220px, full height, overflow-y: auto)
    │   ├── .sidebar-brand     "AEVUM" + dot (même style que Header)
    │   ├── nav.sidebar-nav    4 liens avec icône SVG inline
    │   └── .sidebar-footer    email tronqué + bouton "Se déconnecter"
    └── main.client-main  (margin-left: 220px, padding: 3rem 2.5rem)
         └── <slot />
```

### Props
```ts
interface Props {
  title: string;
  description: string;
  canonical?: string;
  email: string;
}
```

### Liens sidebar
| Label | Href | Icône |
|---|---|---|
| Mon espace | /client/dashboard | hourglass/clock |
| Historique | /client/history | clock avec flèche |
| Personnaliser | /client/customize | crayon |
| Paramètres | /client/settings | engrenage |

Lien actif détecté via `Astro.url.pathname.startsWith(href)` → fond + texte blanc.

### CSS
- Variables CSS redéclarées inline dans `<style is:global>` (auto-contenu, pattern identique à BaseLayout)
- `--bg: #0a0a0f`, `--bg-1: #12151f`, etc. — copie stricte des tokens de BaseLayout
- Sidebar : `background: var(--bg-1)`, `border-right: 1px solid var(--line)`
- Mobile (< 860px) : sidebar masquée, topbar hamburger + drawer overlay

### Comportement logout
Le bouton "Se déconnecter" dans la sidebar est un `<a href="/client/settings?logout=1">` — réutilise le mécanisme existant de `settings.astro`.

---

## 2. Changements par page

### Toutes les pages client (commun)
- Remplacer `import BaseLayout` → `import ClientLayout`
- Remplacer `<BaseLayout …>` → `<ClientLayout … email={auth.email}>`
- Supprimer les `back-link` (navigation gérée par la sidebar)
- Supprimer `padding-top: 7-8rem` des `<section>` (plus de topbar à dégager)
- Supprimer les sections "Accès rapide" / liens de retour redondants

### dashboard.astro
1. **Stats — guard `fmt()`** : `n != null ? String(n) : '0'` (remplace `'—'`)
2. **Automatisations "Non configuré"** : les 4 cartes `.auto-card` enveloppées dans `<a href="/client/customize">` uniquement quand `!automations?.xxx` (les actives restent non-cliquables)
3. Supprimer la section "Accès rapide" (4e bloc) : la sidebar remplace cette navigation

### history.astro
1. **Message vide** : remplacer le texte actuel par :  
   `"Aucune activité pour le moment. Les automatisations apparaîtront ici dès le premier déclenchement."`
2. **Pagination client-side** : fetch `limit=100` (inchangé). Si `history.length > 50`, afficher 50 lignes à la fois avec boutons Précédent / Suivant. État de page géré par JS inline (`currentPage`, prev/next handlers). Si ≤ 50 entrées, pas de pagination visible.

### customize.astro
Ajouter sous chaque `<textarea>` un bloc `.cust-hints` listant les variables disponibles :

| Template | Variables |
|---|---|
| sender_name | *(champ texte simple, pas de variables)* |
| template_onboarding_j0 | `{{nom_client}}`, `{{lien_acces}}`, `{{nom_formateur}}` |
| template_onboarding_j3 | `{{nom_client}}`, `{{lien_acces}}`, `{{nom_formateur}}` |
| template_onboarding_j7 | `{{nom_client}}`, `{{lien_acces}}`, `{{nom_formateur}}` |
| template_failed_payment | `{{nom_client}}`, `{{montant}}`, `{{lien_paiement}}` |

Rendu : petits badges `<code>` gris cliquables qui insèrent la variable dans le textarea au clic (JS inline).

### settings.astro
1. **Email en lecture seule** : bloc en haut de page avant les formulaires :
   ```
   Email actuel
   [user@exemple.fr]  (input type="text" disabled, style lecture seule)
   ```
2. **Bouton déconnexion** : remplacer le `<a class="btn">` actuel par un bloc visuellement séparé avec une `<hr>` et le bouton `.btn-logout` (fond rouge clair `rgba(239,68,68,0.12)`, border rouge, texte rouge).

---

## 3. Ce qui ne change pas

- `BaseLayout.astro` : inchangé, utilisé par toutes les pages marketing
- `src/pages/login.astro` : garde `BaseLayout` (page publique)
- Pages marketing (`/`, `/features`, `/pricing`, `/contact`, `/comment-ca-marche`) : non touchées
- Logique auth (`getClientFromCookie`, guards, 401 handler) : inchangée
- Styles des formulaires, tableaux, cartes : inchangés — on retire seulement le padding-top et les back-links

---

## 4. Fichiers modifiés

| Action | Fichier |
|---|---|
| Créer | `src/layouts/ClientLayout.astro` |
| Modifier | `src/pages/client/dashboard.astro` |
| Modifier | `src/pages/client/history.astro` |
| Modifier | `src/pages/client/customize.astro` |
| Modifier | `src/pages/client/settings.astro` |

**Fichiers non touchés :** `BaseLayout.astro`, `login.astro`, toutes les pages marketing.
