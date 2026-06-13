# Design System Refonte — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Appliquer un nouveau design system (palette sombre, boutons pill, nav sobre) sur toutes les pages de la vitrine AEVUM en modifiant uniquement CSS et HTML minimal.

**Architecture:** Tous les changements se concentrent dans `global.css` (tokens + composants) et `Header.astro` (logo HTML + nav CSS). Les pages client (`login`, `dashboard`, `history`, `customize`, `settings`) héritent automatiquement via `BaseLayout` sans modification directe. `Footer.astro` s'adapte via les nouvelles variables CSS sans changement HTML.

**Tech Stack:** Astro 6, CSS custom properties, CSS gradients (pattern grid), scoped styles dans `.astro`

---

## File Map

| Fichier | Action | Responsabilité |
|---|---|---|
| `src/styles/global.css` | Modify | Tokens, typo, boutons, cartes, badges, body grid |
| `src/components/Header.astro` | Modify | Logo HTML + CSS nav |
| `src/components/Footer.astro` | Modify (mineur) | Box-shadow token mis à jour via var |

---

### Task 1 : Design tokens — global.css

**Files:**
- Modify: `src/styles/global.css:7-33`

- [ ] **Step 1 : Mettre à jour les 5 variables dans le bloc `:root`**

Dans `src/styles/global.css`, remplacer les lignes concernées dans `:root` :

```css
/* Avant */
--dark: #0B1120;
--dark-card: #151D2E;
--dark-elevated: #1A2438;
--gray-light: #94A3B8;
--shadow-card: 0 4px 24px rgba(0, 0, 0, 0.25);
/* ...et plus loin... */
--max-w: 1200px;
```

```css
/* Après */
--dark: #0D0F1A;
--dark-card: #1A2035;
--dark-elevated: #1A2035;
--gray-light: #9CA3AF;
--shadow-card: 0 4px 24px rgba(0, 0, 0, 0.3);
/* ...et plus loin... */
--max-w: 1100px;
```

- [ ] **Step 2 : Vérifier visuellement**

```bash
npm run dev
```

Ouvrir `http://localhost:4321` — le fond principal doit être légèrement plus froid/bleuté (`#0D0F1A`), le container plus resserré.

- [ ] **Step 3 : Commit**

```bash
git add src/styles/global.css
git commit -m "style: update design tokens — dark bg, card bg, gray-light, max-w 1100px"
```

---

### Task 2 : Body grid décoratif + typographie + espacement

**Files:**
- Modify: `src/styles/global.css:48-56` (body), `80-108` (typo, section)

- [ ] **Step 1 : Ajouter la grille décorative sur `body`**

Dans le bloc `body` (après `overflow-x: hidden;`), ajouter :

```css
body {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  background: var(--dark);
  color: var(--light);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  overflow-x: hidden;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  background-size: 40px 40px;
  background-attachment: fixed;
}
```

- [ ] **Step 2 : Mettre à jour H1 et `.section`**

Modifier dans la section `/* --- Typography --- */` :

```css
/* Avant */
h1, h2, h3, h4 {
  line-height: 1.15;
  font-weight: 700;
  letter-spacing: -0.02em;
}

h1 { font-size: clamp(2.25rem, 5vw, 3.5rem); }
```

```css
/* Après */
h1, h2, h3, h4 {
  line-height: 1.15;
  font-weight: 700;
  letter-spacing: -0.02em;
}

h1 {
  font-size: clamp(3rem, 5vw, 5rem);
  font-weight: 800;
}
```

Modifier `.section` :

```css
/* Avant */
.section {
  padding: 6rem 0;
}
```

```css
/* Après */
.section {
  padding: 5rem 0;
}
```

- [ ] **Step 3 : Vérifier visuellement**

Sur `http://localhost:4321` — le H1 de la homepage doit être plus grand et plus gras. La grille doit être visible comme un motif subtil sur le fond sombre.

- [ ] **Step 4 : Commit**

```bash
git add src/styles/global.css
git commit -m "style: body grid, H1 clamp(3rem→5rem) weight 800, section padding 5rem"
```

---

### Task 3 : Boutons pill

**Files:**
- Modify: `src/styles/global.css:128-172` (boutons)

- [ ] **Step 1 : Rendre tous les boutons pill et mettre à jour `.btn-primary`**

Remplacer le bloc complet des boutons (`.btn`, `.btn-primary`, `.btn-secondary`) :

```css
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.875rem 1.75rem;
  border-radius: 999px;
  font-weight: 600;
  font-size: 1rem;
  transition: all var(--transition);
  white-space: nowrap;
}

.btn-primary {
  background: #ffffff;
  color: #0D0F1A;
  border: 1px solid transparent;
}

.btn-primary::after {
  content: " →";
  font-style: normal;
}

.btn-primary:hover,
.btn-primary:focus-visible {
  background: #f0f4ff;
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
}

.btn-secondary {
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: var(--light);
  background: transparent;
}

.btn-secondary:hover,
.btn-secondary:focus-visible {
  border-color: rgba(255, 255, 255, 0.5);
  transform: translateY(-2px);
}

.btn:focus-visible {
  outline: 3px solid var(--primary);
  outline-offset: 3px;
}
```

- [ ] **Step 2 : Vérifier visuellement**

Sur `http://localhost:4321` — le CTA principal doit être blanc, pill, avec `→` à droite. Les boutons secondaires doivent avoir un border subtil blanc semi-transparent.

- [ ] **Step 3 : Commit**

```bash
git add src/styles/global.css
git commit -m "style: boutons pill 999px, btn-primary blanc+sombre, btn-secondary border rgba"
```

---

### Task 4 : Cartes & badges

**Files:**
- Modify: `src/styles/global.css:174-243` (card, badge)

- [ ] **Step 1 : Mettre à jour `.card`**

Remplacer le bloc `.card` :

```css
.card {
  background: var(--dark-card);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-lg);
  padding: 2rem;
  transition: transform var(--transition), border-color var(--transition), box-shadow var(--transition);
  box-shadow: var(--shadow-card);
  will-change: transform;
}

.card:hover {
  border-color: rgba(255, 255, 255, 0.18);
  transform: translate3d(0, -4px, 0);
  box-shadow: var(--shadow-card), var(--shadow-glow);
}
```

- [ ] **Step 2 : Mettre à jour `.badge`**

Remplacer le bloc `.badge` :

```css
.badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 6px 16px;
  border-radius: 999px;
  font-size: 0.8125rem;
  font-weight: 500;
  background: #1A2035;
  color: var(--light);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.badge::before {
  content: '';
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--primary);
  flex-shrink: 0;
}
```

- [ ] **Step 3 : Vérifier visuellement**

Sur `http://localhost:4321` — les cartes doivent avoir un fond `#1A2035` avec bordure très subtile. Les badges doivent être sombres avec un point bleu à gauche.

- [ ] **Step 4 : Commit**

```bash
git add src/styles/global.css
git commit -m "style: card border rgba(255,255,255,0.08), badge sombre + dot accent"
```

---

### Task 5 : Header — logo + navigation

**Files:**
- Modify: `src/components/Header.astro`

- [ ] **Step 1 : Mettre à jour le logo HTML**

Dans `src/components/Header.astro`, remplacer le bloc `<a href="/" class="header-logo" ...>` :

```html
<!-- Avant -->
<a href="/" class="header-logo" aria-label="AEVUM — Accueil">
  <span class="logo-text">AEVUM</span>
</a>
```

```html
<!-- Après -->
<a href="/" class="header-logo" aria-label="AEVUM — Accueil">
  <span class="logo-text">• <strong>AEVUM</strong> <em>studio</em></span>
</a>
```

- [ ] **Step 2 : Mettre à jour tout le bloc `<style>` de Header.astro**

Remplacer le contenu du bloc `<style>` (lignes 60–172) par :

```css
.site-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(13, 15, 26, 0.95);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  will-change: transform;
}

.header-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 80px;
}

.header-logo {
  display: flex;
  align-items: center;
  text-decoration: none;
}

.logo-text {
  font-size: 1.25rem;
  font-weight: 400;
  color: var(--light);
  letter-spacing: -0.01em;
}

.logo-text strong {
  font-weight: 800;
}

.logo-text em {
  font-style: italic;
  font-weight: 400;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.nav-links a {
  font-size: 0.9375rem;
  font-weight: 500;
  color: #9CA3AF;
  transition: color var(--transition);
  text-decoration: none;
}

.nav-links a:hover { color: var(--light); }
.nav-links a.active { color: var(--light); }

/* Override pour le bouton CTA dans le nav */
.nav-links .btn-primary {
  padding: 12px 24px;
  font-size: 0.875rem;
}

.nav-links .btn-primary::after { content: none; }

.menu-toggle {
  display: none;
  color: var(--light);
}

@media (max-width: 768px) {
  .header-nav { height: 72px; }
  .menu-toggle { display: flex; }

  .nav-links {
    position: fixed;
    top: 72px;
    left: 0;
    right: 0;
    bottom: 0;
    flex-direction: column;
    justify-content: flex-start;
    padding: 2rem 1.5rem;
    gap: 0.5rem;
    background: rgba(13, 15, 26, 0.98);
    transform: translateX(100%);
    transition: transform var(--transition);
  }

  .nav-links.open { transform: translateX(0); }

  .nav-links a {
    font-size: 1.125rem;
    padding: 0.75rem 0;
    width: 100%;
  }
}
```

- [ ] **Step 3 : Vérifier visuellement**

Sur `http://localhost:4321` — le header doit afficher `• AEVUM studio`, sans border-bottom visible, liens gris `#9CA3AF`, CTA "Prendre contact" en pill blanc.

- [ ] **Step 4 : Commit**

```bash
git add src/components/Header.astro
git commit -m "style: header — logo AEVUM studio, nav sobre, CTA pill blanc"
```

---

### Task 6 : Vérification finale sur toutes les pages

**Files:** aucune modification — vérification uniquement

- [ ] **Step 1 : Parcourir les pages marketing**

```bash
npm run dev
```

Vérifier dans le navigateur :
- `http://localhost:4321/` — homepage, grille, H1 grand, CTA blanc pill
- `http://localhost:4321/features` — cartes, badges
- `http://localhost:4321/pricing` — cartes pricing, bouton popular
- `http://localhost:4321/contact` — formulaire, fond sombre
- `http://localhost:4321/mentions-legales` — page légale, typo

- [ ] **Step 2 : Parcourir les pages client**

- `http://localhost:4321/login` — formulaire centré, card, bouton submit pill blanc
- Pages `/client/*` — vérifier dashboard, history, customize, settings (nécessitent auth, vérifier visuellement ou avec mock cookie)

- [ ] **Step 3 : Vérifier le build Vercel**

```bash
npm run build
```

Expected: aucune erreur TypeScript ni erreur de build Astro.

- [ ] **Step 4 : Commit final si ajustements**

```bash
git add -p
git commit -m "style: ajustements visuels finaux design system"
```

---

## Self-Review

**Spec coverage :**
- ✅ `#0D0F1A` body bg → Task 1
- ✅ `#111827` bg secondaire → inchangé (déjà correct)
- ✅ `#9CA3AF` texte secondaire → Task 1 (token)
- ✅ Grille décorative body → Task 2
- ✅ Nav fond sombre, pas de border → Task 5
- ✅ Logo `• AEVUM studio` gras/italique → Task 5
- ✅ Liens nav `#9CA3AF`, sans soulignement → Task 5
- ✅ CTA nav pill blanc → Task 5 (+ Task 3 global)
- ✅ H1 `clamp(3rem,5vw,5rem)` weight 800 → Task 2
- ✅ Boutons pill 999px → Task 3
- ✅ btn-primary blanc `#fff` / texte `#0D0F1A` → Task 3
- ✅ btn-primary flèche `→` → Task 3 (`::after`)
- ✅ btn-secondary border `rgba(255,255,255,0.2)` → Task 3
- ✅ Badges `#1A2035`, blanc, border `rgba(255,255,255,0.1)`, dot accent → Task 4
- ✅ Cartes `#1A2035`, border `rgba(255,255,255,0.08)`, shadow → Task 4
- ✅ Section padding `80px` → Task 2
- ✅ Container max-width `1100px` → Task 1 (token `--max-w`)
- ✅ Propagation automatique pages client → vérifié Task 6
