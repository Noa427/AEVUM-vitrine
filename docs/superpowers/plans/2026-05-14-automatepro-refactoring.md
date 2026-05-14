# AutomatePro Vitrine Refactoring — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor le site Astro AEVUM (CRM immobilier) en AutomatePro, un service d'automatisation email pour infopreneurs/coachs/formateurs francophones, en remplaçant tout le contenu et en ajoutant une page portail client dynamique.

**Architecture:** Contenu + ajustements structurels ciblés. Le design system `global.css` est inchangé. Toutes les classes CSS existantes sont réutilisées. Le portail client `/client/[token]` requiert `output: 'hybrid'` pour activer le SSR par page. Les autres pages restent en rendu statique.

**Tech Stack:** Astro v4+ (hybrid output), @astrojs/sitemap, vanilla JS uniquement, CSS design system existant (aucune dépendance ajoutée).

---

## File Map

| Action | Fichier |
|--------|---------|
| Modify | `astro.config.mjs` |
| Modify | `src/components/Header.astro` |
| Modify | `src/components/Footer.astro` |
| Modify | `src/layouts/BaseLayout.astro` |
| Rewrite | `src/pages/index.astro` |
| Rewrite | `src/pages/features.astro` |
| Rewrite | `src/pages/pricing.astro` |
| Rewrite | `src/pages/contact.astro` |
| Rewrite | `src/pages/demo.astro` (devient une redirect) |
| Rewrite | `src/pages/download.astro` (devient une redirect) |
| Create | `src/pages/comment-ca-marche.astro` |
| Create | `src/pages/client/[token].astro` |
| Modify | `src/pages/cgu.astro` |
| Modify | `src/pages/confidentialite.astro` |
| Modify | `src/pages/mentions-legales.astro` |
| Create | `.env` |

---

## Task 1 — astro.config.mjs : hybrid output + redirects

**Files:**
- Modify: `astro.config.mjs`

**Pourquoi hybrid :** La page `client/[token].astro` est dynamique (token inconnu au build). `output: 'hybrid'` permet le SSR par page via `export const prerender = false`, toutes les autres pages restent statiques.

- [ ] **Step 1: Remplacer le contenu de `astro.config.mjs`**

```js
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://aevum.fr',
  output: 'hybrid',
  integrations: [sitemap()],
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover',
  },
  build: {
    inlineStylesheets: 'always',
  },
  compressHTML: true,
  redirects: {
    '/demo': '/comment-ca-marche',
    '/download': '/',
  },
});
```

> Note : `site` pointe encore sur `https://aevum.fr`. Mettez à jour vers le domaine AutomatePro définitif quand disponible.

- [ ] **Step 2: Vérifier que la config charge sans erreur**

```
npm run dev
```

Expected: dev server démarre sur `http://localhost:4321` sans erreur de config.

- [ ] **Step 3: Commit**

```
git add astro.config.mjs
git commit -m "config: hybrid output + redirects demo et download"
```

---

## Task 2 — Header.astro : logo texte + nav AutomatePro

**Files:**
- Modify: `src/components/Header.astro`

- [ ] **Step 1: Réécrire `Header.astro` avec le nouveau contenu**

```astro
---
const currentPath = Astro.url.pathname;

const navLinks = [
  { href: '/features', label: 'Fonctionnalités' },
  { href: '/pricing', label: 'Tarifs' },
  { href: '/comment-ca-marche', label: 'Comment ça marche' },
];
---

<header class="site-header" role="banner">
  <nav class="container header-nav" aria-label="Navigation principale">
    <a href="/" class="header-logo" aria-label="AutomatePro — Accueil">
      <span class="logo-text">AutomatePro</span>
    </a>

    <button class="menu-toggle" aria-label="Ouvrir le menu" aria-expanded="false" aria-controls="nav-menu">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
        <line x1="3" y1="6" x2="21" y2="6" class="line-top" />
        <line x1="3" y1="12" x2="21" y2="12" class="line-mid" />
        <line x1="3" y1="18" x2="21" y2="18" class="line-bot" />
      </svg>
    </button>

    <ul id="nav-menu" class="nav-links" role="menubar">
      {navLinks.map(({ href, label }) => (
        <li role="none">
          <a
            href={href}
            role="menuitem"
            class:list={[{ active: currentPath.startsWith(href) }]}
          >
            {label}
          </a>
        </li>
      ))}
      <li role="none">
        <a href="/contact" class="btn btn-primary btn-sm" role="menuitem">Prendre contact</a>
      </li>
    </ul>
  </nav>
</header>

<script>
  function initMenu() {
    const toggle = document.querySelector('.menu-toggle');
    const menu = document.getElementById('nav-menu');
    if (toggle && menu) {
      toggle.addEventListener('click', () => {
        const expanded = toggle.getAttribute('aria-expanded') === 'true';
        toggle.setAttribute('aria-expanded', String(!expanded));
        menu.classList.toggle('open');
      });
    }
  }
  initMenu();
  document.addEventListener('astro:after-swap', initMenu);
</script>

<style>
  .site-header {
    position: sticky;
    top: 0;
    z-index: 100;
    background: rgba(11, 17, 32, 0.92);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(46, 139, 240, 0.1);
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
    font-size: 1.375rem;
    font-weight: 800;
    letter-spacing: -0.03em;
    background: linear-gradient(135deg, #3B9BFF 0%, #2E8BF0 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .nav-links {
    display: flex;
    align-items: center;
    gap: 2rem;
  }

  .nav-links a {
    font-size: 0.9375rem;
    font-weight: 500;
    color: var(--gray-light);
    transition: color var(--transition);
    position: relative;
  }

  .nav-links a::after {
    content: '';
    position: absolute;
    bottom: -4px;
    left: 0;
    width: 0;
    height: 2px;
    background: var(--gradient);
    transition: width var(--transition);
    border-radius: 1px;
  }

  .nav-links a:hover::after,
  .nav-links a.active::after {
    width: 100%;
  }

  .nav-links a:hover { color: var(--light); }
  .nav-links a.active { color: var(--primary); }

  .btn-sm {
    padding: 0.5rem 1.5rem;
    font-size: 0.875rem;
    border-radius: var(--radius-sm);
  }

  .nav-links .btn::after { display: none; }

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
      background: var(--dark);
      transform: translateX(100%);
      transition: transform var(--transition);
    }

    .nav-links.open { transform: translateX(0); }

    .nav-links a {
      font-size: 1.125rem;
      padding: 0.75rem 0;
      width: 100%;
    }

    .nav-links a::after { display: none; }
  }
</style>
```

- [ ] **Step 2: Vérifier dans le navigateur**

```
npm run dev
```

Ouvrir `http://localhost:4321`. Expected: logo "AutomatePro" gradient visible, nav avec 3 liens + bouton "Prendre contact", lien `/download` absent.

- [ ] **Step 3: Commit**

```
git add src/components/Header.astro
git commit -m "feat: Header AutomatePro — logo texte + nav mise à jour"
```

---

## Task 3 — Footer.astro : brand AutomatePro

**Files:**
- Modify: `src/components/Footer.astro`

- [ ] **Step 1: Réécrire `Footer.astro`**

```astro
---
const year = new Date().getFullYear();

const footerLinks = {
  produit: [
    { href: '/features', label: 'Fonctionnalités' },
    { href: '/pricing', label: 'Tarifs' },
    { href: '/comment-ca-marche', label: 'Comment ça marche' },
    { href: '/contact', label: 'Contact' },
  ],
  legal: [
    { href: '/cgu', label: 'CGU' },
    { href: '/confidentialite', label: 'Confidentialité' },
    { href: '/mentions-legales', label: 'Mentions légales' },
  ],
};
---

<footer class="site-footer" role="contentinfo">
  <div class="container">
    <div class="footer-grid">
      <div class="footer-brand">
        <a href="/" class="footer-logo" aria-label="AutomatePro">
          <span class="logo-text-footer">AutomatePro</span>
        </a>
        <p>L'automatisation email pour infopreneurs et coachs francophones.</p>
      </div>

      <div class="footer-col">
        <h4>Produit</h4>
        <ul>
          {footerLinks.produit.map(({ href, label }) => (
            <li><a href={href}>{label}</a></li>
          ))}
        </ul>
      </div>

      <div class="footer-col">
        <h4>Légal</h4>
        <ul>
          {footerLinks.legal.map(({ href, label }) => (
            <li><a href={href}>{label}</a></li>
          ))}
        </ul>
      </div>

      <div class="footer-col">
        <h4>Contact</h4>
        <ul>
          <li><a href="/contact">Nous contacter</a></li>
          <li><a href="mailto:noa.pardal1@gmail.com">noa.pardal1@gmail.com</a></li>
        </ul>
      </div>
    </div>

    <div class="footer-bottom">
      <p>&copy; {year} AutomatePro. Tous droits réservés.</p>
    </div>
  </div>
</footer>

<style>
  .site-footer {
    background: var(--dark-soft);
    border-top: 1px solid var(--gray-border);
    padding: 4rem 0 2rem;
    margin-top: 4rem;
  }

  .footer-grid {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr 1fr;
    gap: 3rem;
  }

  .footer-logo {
    display: flex;
    align-items: center;
    margin-bottom: 1rem;
    text-decoration: none;
  }

  .logo-text-footer {
    font-size: 1.25rem;
    font-weight: 800;
    letter-spacing: -0.03em;
    background: linear-gradient(135deg, #3B9BFF 0%, #2E8BF0 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .footer-brand p {
    font-size: 0.875rem;
    color: var(--gray);
    max-width: 300px;
    line-height: 1.6;
  }

  .footer-col h4 {
    font-size: 0.875rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--gray);
    margin-bottom: 1.25rem;
  }

  .footer-col ul {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .footer-col a {
    font-size: 0.9375rem;
    color: var(--gray-light);
    transition: color var(--transition);
  }

  .footer-col a:hover { color: var(--primary); }

  .footer-bottom {
    margin-top: 3rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--gray-border);
    text-align: center;
  }

  .footer-bottom p {
    font-size: 0.8125rem;
    color: var(--gray);
  }

  @media (max-width: 768px) {
    .footer-grid {
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
    }
    .footer-brand { grid-column: 1 / -1; }
  }

  @media (max-width: 480px) {
    .footer-grid { grid-template-columns: 1fr; }
  }
</style>
```

- [ ] **Step 2: Vérifier dans le navigateur**

Ouvrir `http://localhost:4321`. Expected: footer avec "AutomatePro" gradient, description correcte, 4 liens produit (dont "Comment ça marche"), copyright "AutomatePro".

- [ ] **Step 3: Commit**

```
git add src/components/Footer.astro
git commit -m "feat: Footer AutomatePro — brand et liens mis à jour"
```

---

## Task 4 — BaseLayout.astro : SEO + Schema.org AutomatePro

**Files:**
- Modify: `src/layouts/BaseLayout.astro`

- [ ] **Step 1: Réécrire `BaseLayout.astro`**

```astro
---
import { ClientRouter } from 'astro:transitions';
import '../styles/global.css';
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';

export interface Props {
  title: string;
  description: string;
  canonical?: string;
}

const { title, description, canonical } = Astro.props;
const siteUrl = 'https://aevum.fr';
const fullCanonical = canonical ? `${siteUrl}${canonical}` : siteUrl + Astro.url.pathname;
---

<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{title}</title>
  <meta name="description" content={description} />
  <link rel="canonical" href={fullCanonical} />

  <!-- Open Graph -->
  <meta property="og:type" content="website" />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:url" content={fullCanonical} />
  <meta property="og:site_name" content="AutomatePro" />
  <meta property="og:locale" content="fr_FR" />

  <!-- Twitter -->
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content={title} />
  <meta name="twitter:description" content={description} />

  <!-- Favicon -->
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <meta name="theme-color" content="#0F172A" />

  <!-- Client-side router for instant page navigation -->
  <ClientRouter />

  <!-- Prefetch key pages -->
  <link rel="prefetch" href="/features" />
  <link rel="prefetch" href="/pricing" />
  <link rel="prefetch" href="/comment-ca-marche" />
  <link rel="prefetch" href="/contact" />
  <link rel="prefetch" href="/cgu" />
  <link rel="prefetch" href="/confidentialite" />
  <link rel="prefetch" href="/mentions-legales" />

  <!-- Schema.org -->
  <script type="application/ld+json" set:html={JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "AutomatePro",
    "url": siteUrl,
    "description": "Service d'automatisation email pour infopreneurs, coachs et formateurs francophones.",
    "logo": `${siteUrl}/favicon.svg`,
    "contactPoint": {
      "@type": "ContactPoint",
      "email": "noa.pardal1@gmail.com",
      "contactType": "sales"
    }
  })} />
  <script type="application/ld+json" set:html={JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "AutomatePro",
    "description": "Automatisation email : onboarding élèves, relances impayés, rapport hebdomadaire.",
    "offers": {
      "@type": "AggregateOffer",
      "lowPrice": "500",
      "highPrice": "1200",
      "priceCurrency": "EUR"
    }
  })} />
</head>
<body>
  <a href="#main-content" class="skip-link">Aller au contenu principal</a>
  <Header />
  <main id="main-content">
    <slot />
  </main>
  <Footer />

  <script>
    function initReveal() {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              e.target.classList.add('visible');
              observer.unobserve(e.target);
            }
          });
        },
        { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
      );
      document.querySelectorAll('.reveal:not(.visible)').forEach((el) => observer.observe(el));
    }
    initReveal();
    document.addEventListener('astro:after-swap', initReveal);
  </script>

  <script>
    function initFAQ() {
      document.querySelectorAll('.faq-question').forEach((btn) => {
        btn.addEventListener('click', () => {
          const item = btn.closest('.faq-item');
          if (item) {
            const isOpen = item.classList.contains('open');
            item.parentElement?.querySelectorAll('.faq-item.open').forEach((el) => el.classList.remove('open'));
            if (!isOpen) item.classList.add('open');
          }
        });
      });
    }
    initFAQ();
    document.addEventListener('astro:after-swap', initFAQ);
  </script>
</body>
</html>
```

- [ ] **Step 2: Vérifier dans le navigateur**

Ouvrir `http://localhost:4321`. Inspecter `<head>` : Expected `og:site_name` = "AutomatePro", schema.org mis à jour, prefetch `/comment-ca-marche` présent.

- [ ] **Step 3: Commit**

```
git add src/layouts/BaseLayout.astro
git commit -m "feat: BaseLayout — SEO et schema.org AutomatePro"
```

---

## Task 5 — index.astro : page d'accueil AutomatePro

**Files:**
- Rewrite: `src/pages/index.astro`

- [ ] **Step 1: Réécrire `src/pages/index.astro` avec ce contenu complet**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---

<BaseLayout
  title="AutomatePro — L'automatisation email qui tourne pendant que vous dormez"
  description="Onboarding élèves, relances impayés, rapport hebdo. Zéro intervention. Connectez Stripe une fois, AutomatePro fait le reste."
  canonical="/"
>

<!-- ═══ HERO ═══ -->
<section class="hero section" aria-labelledby="hero-title">
  <div class="hero-bg" aria-hidden="true"></div>
  <div class="container hero-inner">
    <span class="badge reveal">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
      Connectez Stripe une fois, on fait le reste
    </span>
    <h1 id="hero-title" class="reveal">L'automatisation email<br/>qui <span class="text-gradient">tourne pendant que vous dormez</span></h1>
    <p class="hero-subtitle reveal">Onboarding élèves, relances impayés, rapport hebdo. Zéro intervention. Connectez Stripe une fois, on fait le reste.</p>
    <div class="hero-cta reveal">
      <a href="mailto:noa.pardal1@gmail.com" class="btn btn-primary">
        Prendre contact
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
      </a>
      <a href="/comment-ca-marche" class="btn btn-secondary">Voir comment ça marche</a>
    </div>
    <div class="hero-stats reveal">
      <div class="stat"><strong>100%</strong><span>automatique</span></div>
      <div class="stat-sep" aria-hidden="true"></div>
      <div class="stat"><strong>0</strong><span>intervention</span></div>
      <div class="stat-sep" aria-hidden="true"></div>
      <div class="stat"><strong>Lundi 8h</strong><span>rapport livré</span></div>
    </div>
  </div>
</section>

<!-- ═══ PROBLÈME ═══ -->
<section class="section" aria-labelledby="problem-title">
  <div class="container">
    <div class="section-header reveal">
      <span class="accent-line"></span>
      <h2 id="problem-title">Votre temps mérite mieux</h2>
      <p>Gérer vos emails manuellement, c'est du temps volé à votre vrai travail.</p>
    </div>
    <div class="grid-3">
      <div class="card reveal">
        <div class="icon-box">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
        </div>
        <h3>Onboarding manuel épuisant</h3>
        <p>Chaque nouvel élève déclenche la même séquence d'emails à envoyer à la main. À minuit le vendredi comme les autres jours.</p>
      </div>
      <div class="card reveal">
        <div class="icon-box">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        </div>
        <h3>Impayés qui traînent</h3>
        <p>Les relances sont oubliées ou embarrassantes à écrire. Les élèves en retard passent entre les mailles pendant des semaines.</p>
      </div>
      <div class="card reveal">
        <div class="icon-box">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
        </div>
        <h3>Aucune visibilité</h3>
        <p>Pas de rapport régulier. Vous ne savez pas combien d'emails sont partis cette semaine, ni ce qui a été ouvert.</p>
      </div>
    </div>
  </div>
</section>

<!-- ═══ 3 PILIERS ═══ -->
<section class="section section-alt" aria-labelledby="solution-title">
  <div class="container">
    <div class="section-header reveal">
      <span class="accent-line"></span>
      <h2 id="solution-title">Les 3 piliers d'AutomatePro</h2>
      <p>Une seule connexion Stripe. Trois systèmes qui tournent en autonomie.</p>
    </div>
    <div class="grid-3">
      <div class="card reveal">
        <div class="icon-box">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.82a19.79 19.79 0 01-3.07-8.63A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/></svg>
        </div>
        <h3>Onboarding automatique</h3>
        <p>Dès qu'un paiement Stripe arrive, votre élève reçoit ses emails J0, J3 et J7 sans que vous leviez le petit doigt.</p>
      </div>
      <div class="card reveal">
        <div class="icon-box">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        </div>
        <h3>Récupération impayés</h3>
        <p>Paiement échoué ? Les relances partent à J+1, J+3, J+7 avec un ton progressif. Suspension automatique si aucune réponse.</p>
      </div>
      <div class="card reveal">
        <div class="icon-box">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
        </div>
        <h3>Rapport hebdomadaire</h3>
        <p>Chaque lundi à 8h, votre rapport atterrit dans votre boîte : nouveaux élèves, impayés en cours, emails envoyés.</p>
      </div>
    </div>
  </div>
</section>

<!-- ═══ ÉTAPES ═══ -->
<section class="section" aria-labelledby="how-title">
  <div class="container">
    <div class="section-header reveal">
      <span class="accent-line"></span>
      <h2 id="how-title">Démarrez en 3 étapes</h2>
      <p>Opérationnel en moins d'une journée.</p>
    </div>
    <div class="grid-3">
      <div class="card reveal">
        <div class="step-number" aria-hidden="true">1</div>
        <h3>Vous nous donnez votre webhook Stripe</h3>
        <p>Une URL, une clé secrète. C'est tout ce dont on a besoin pour intercepter vos événements de paiement.</p>
      </div>
      <div class="card reveal">
        <div class="step-number" aria-hidden="true">2</div>
        <h3>On configure tout</h3>
        <p>On paramètre vos séquences d'onboarding, vos templates de relance et votre rapport hebdo selon vos instructions.</p>
      </div>
      <div class="card reveal">
        <div class="step-number" aria-hidden="true">3</div>
        <h3>Vos emails partent seuls</h3>
        <p>À partir de là, chaque paiement déclenche la bonne séquence. Vous vous concentrez sur votre contenu.</p>
      </div>
    </div>
  </div>
</section>

<!-- ═══ APERÇU TARIFS ═══ -->
<section class="section section-alt" aria-labelledby="pricing-preview-title">
  <div class="container">
    <div class="section-header reveal">
      <span class="accent-line"></span>
      <h2 id="pricing-preview-title">Deux formules, un seul objectif</h2>
      <p>Automatiser vos emails pour que vous puissiez vous concentrer sur votre audience.</p>
    </div>
    <div class="pricing-preview-grid">
      <div class="card pricing-card reveal">
        <h3>Case Study</h3>
        <p class="pricing-target">En échange d'un témoignage</p>
        <div class="price">
          <span class="price-amount">1 500€</span>
          <span class="price-period">setup</span>
        </div>
        <p class="price-monthly">+ 500€/mois</p>
        <a href="/pricing" class="btn btn-secondary">Voir le détail</a>
      </div>
      <div class="card pricing-card pricing-popular reveal">
        <span class="popular-tag">Recommandé</span>
        <h3>Standard</h3>
        <p class="pricing-target">Configuration complète</p>
        <div class="price">
          <span class="price-amount">3 000€</span>
          <span class="price-period">setup</span>
        </div>
        <p class="price-monthly">+ 1 200€/mois</p>
        <a href="/pricing" class="btn btn-primary">Voir le détail</a>
      </div>
    </div>
  </div>
</section>

<!-- ═══ FAQ ═══ -->
<section class="section" aria-labelledby="faq-title">
  <div class="container faq-container">
    <div class="section-header reveal">
      <span class="accent-line"></span>
      <h2 id="faq-title">Questions fréquentes</h2>
    </div>
    <div class="faq-list reveal" role="list">
      <div class="faq-item" role="listitem">
        <button class="faq-question" aria-expanded="false">
          Qu'est-ce qu'un webhook Stripe ?
          <svg class="faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
        </button>
        <div class="faq-answer" role="region"><p>Un webhook est une notification automatique qu'envoie Stripe à notre système dès qu'un paiement se produit sur votre compte. C'est la connexion qui déclenche toute l'automatisation. Stripe fournit ça en quelques clics dans votre dashboard.</p></div>
      </div>
      <div class="faq-item" role="listitem">
        <button class="faq-question" aria-expanded="false">
          Mes emails arrivent-ils vraiment en automatique ?
          <svg class="faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
        </button>
        <div class="faq-answer" role="region"><p>Oui, sans exception. Dès qu'un paiement Stripe est confirmé, notre système envoie les emails selon votre séquence configurée — de jour, de nuit, le week-end. Aucune intervention humaine n'est nécessaire de votre côté.</p></div>
      </div>
      <div class="faq-item" role="listitem">
        <button class="faq-question" aria-expanded="false">
          Puis-je personnaliser les templates d'emails ?
          <svg class="faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
        </button>
        <div class="faq-answer" role="region"><p>Oui. Lors de la configuration initiale, vous nous fournissez vos templates (ou on les rédige ensemble). Vous pouvez les modifier à tout moment depuis votre portail client. Chaque email est signé avec votre sender name et vient de votre adresse.</p></div>
      </div>
      <div class="faq-item" role="listitem">
        <button class="faq-question" aria-expanded="false">
          Que se passe-t-il si un paiement échoue ?
          <svg class="faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
        </button>
        <div class="faq-answer" role="region"><p>Notre système détecte l'échec via Stripe et déclenche automatiquement la séquence de relance : email J+1 (rappel doux), J+3 (plus direct), J+7 (avertissement suspension). Si aucun paiement n'est reçu, l'accès est suspendu automatiquement.</p></div>
      </div>
      <div class="faq-item" role="listitem">
        <button class="faq-question" aria-expanded="false">
          Puis-je voir ce qui a été envoyé ?
          <svg class="faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
        </button>
        <div class="faq-answer" role="region"><p>Oui. Votre portail client (lien unique) vous donne accès à l'historique des 20 derniers envois : date, type, destinataire, statut. Et chaque lundi matin, votre rapport hebdomadaire récapitule toute l'activité de la semaine.</p></div>
      </div>
    </div>
  </div>
</section>

<!-- ═══ CTA FINAL ═══ -->
<section class="section cta-section" aria-labelledby="cta-final-title">
  <div class="container cta-inner reveal">
    <h2 id="cta-final-title">Prêt à automatiser ?</h2>
    <p>Dites-nous où vous en êtes. On vous répond sous 48h.</p>
    <div class="hero-cta">
      <a href="mailto:noa.pardal1@gmail.com" class="btn btn-primary">
        Prendre contact
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
      </a>
    </div>
  </div>
</section>

</BaseLayout>

<style>
  .hero {
    position: relative;
    padding-top: 8rem;
    padding-bottom: 6rem;
    text-align: center;
    overflow: hidden;
  }

  .hero-bg {
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse 80% 60% at 50% 0%, rgba(46, 139, 240, 0.12) 0%, transparent 70%);
    pointer-events: none;
  }

  .hero-inner {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .hero h1 { margin-top: 1.5rem; max-width: 700px; }

  .text-gradient {
    background: linear-gradient(135deg, #3B9BFF 0%, #60B4FF 50%, #2E8BF0 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .hero-subtitle {
    margin-top: 1.5rem;
    font-size: 1.1875rem;
    max-width: 600px;
    text-align: center;
  }

  .hero-cta {
    display: flex;
    gap: 1rem;
    margin-top: 2.5rem;
    flex-wrap: wrap;
    justify-content: center;
  }

  .hero-stats {
    display: flex;
    align-items: center;
    gap: 2rem;
    margin-top: 4rem;
    padding: 1.5rem 2.5rem;
    background: var(--dark-card);
    border: 1px solid var(--gray-border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-card);
  }

  .stat { display: flex; flex-direction: column; align-items: center; gap: 0.25rem; }
  .stat strong { font-size: 1.75rem; font-weight: 800; color: var(--primary); }
  .stat span { font-size: 0.8125rem; color: var(--gray); }
  .stat-sep { width: 1px; height: 40px; background: var(--gray-border); }

  .section-alt { background: var(--dark-soft); }

  .pricing-preview-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 2rem;
    max-width: 800px;
    margin: 0 auto;
  }

  .pricing-card {
    display: flex;
    flex-direction: column;
    text-align: center;
    align-items: center;
  }

  .pricing-target { font-size: 0.875rem; color: var(--gray); margin-top: 0.25rem; }

  .price-monthly {
    font-size: 1rem;
    color: var(--gray-light);
    margin-top: -0.75rem;
    margin-bottom: 1rem;
  }

  .pricing-card .btn { margin-top: auto; width: 100%; }

  .faq-container { max-width: 800px; }

  .cta-section {
    background: linear-gradient(135deg, rgba(46, 139, 240, 0.08) 0%, rgba(46, 139, 240, 0.02) 100%);
    border-top: 1px solid rgba(46, 139, 240, 0.15);
  }

  .cta-inner {
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .cta-inner p { margin-top: 1rem; margin-bottom: 0; text-align: center; }

  @media (max-width: 768px) {
    .hero { padding-top: 5rem; padding-bottom: 4rem; }
    .hero-stats { flex-direction: column; gap: 1.5rem; padding: 1.5rem; }
    .stat-sep { width: 40px; height: 1px; }
    .hero-cta { flex-direction: column; width: 100%; }
    .pricing-preview-grid { grid-template-columns: 1fr; }
  }
</style>
```

- [ ] **Step 2: Vérifier dans le navigateur**

Ouvrir `http://localhost:4321`. Expected: hero titre correct, stats "100% automatique / 0 intervention / Lundi 8h", 2 cartes pricing, FAQ fonctionnelle (toggle), CTA mailto.

- [ ] **Step 3: Commit**

```
git add src/pages/index.astro
git commit -m "feat: homepage AutomatePro — hero, piliers, étapes, pricing, FAQ"
```

---

## Task 6 — features.astro : 3 piliers détaillés

**Files:**
- Rewrite: `src/pages/features.astro`

- [ ] **Step 1: Réécrire `src/pages/features.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';

const pillars = [
  {
    id: 'onboarding',
    title: 'Onboarding automatique',
    icon: '<path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.82a19.79 19.79 0 01-3.07-8.63A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/>',
    features: [
      { name: 'Email J0 — Bienvenue & accès', desc: 'Envoyé dès la confirmation du paiement Stripe. Contient vos identifiants d\'accès, un mot de bienvenue et les premières étapes.' },
      { name: 'Email J3 — Premier check-in', desc: 'Trois jours après l\'inscription, un email de suivi pour s\'assurer que l\'élève a bien démarré et lui proposer une ressource.' },
      { name: 'Email J7 — Bonus & communauté', desc: 'À J+7, un email bonus : accès à un contenu exclusif, invitation dans votre groupe ou tout autre élément de rétention.' },
      { name: 'Séquence personnalisable', desc: 'Les templates J0, J3 et J7 sont entièrement éditables depuis votre portail client sans passer par nous.' },
      { name: 'Sender name configurable', desc: 'Chaque email part avec votre nom et votre adresse d\'expédition. L\'élève ne voit jamais AutomatePro.' },
      { name: 'Déclenchement instantané', desc: 'La séquence démarre dans les secondes qui suivent la confirmation Stripe. De nuit comme de jour.' },
    ],
  },
  {
    id: 'impayes',
    title: 'Récupération impayés',
    icon: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    features: [
      { name: 'Relance J+1 — Rappel doux', desc: 'Un email cordial 24h après l\'échec de paiement. Ton empathique, lien de paiement direct, pas de pression.' },
      { name: 'Relance J+3 — Ton plus direct', desc: 'Si aucun paiement à J+3, un second email plus direct avec un sentiment d\'urgence modéré.' },
      { name: 'Relance J+7 — Avertissement', desc: 'Dernier avertissement avant suspension. L\'élève est informé clairement des conséquences.' },
      { name: 'Suspension automatique', desc: 'Sans réponse à J+7, un email de suspension est envoyé. La reprise est automatique dès le prochain paiement réussi.' },
      { name: 'Reprise automatique', desc: 'Dès qu\'un paiement réussi est détecté, l\'accès est rétabli et un email de confirmation part automatiquement.' },
      { name: 'Blacklist après N échecs', desc: 'Après un nombre d\'échecs configuré, le contact est blacklisté pour éviter les relances inutiles.' },
    ],
  },
  {
    id: 'rapport',
    title: 'Rapport hebdomadaire',
    icon: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/>',
    features: [
      { name: 'Envoi automatique lundi à 8h', desc: 'Sans action de votre part, un rapport complet atterrit dans votre boîte chaque début de semaine.' },
      { name: 'Nouveaux élèves de la semaine', desc: 'Liste des inscriptions confirmées via Stripe : nom, email, date, montant.' },
      { name: 'Impayés en cours', desc: 'Tableau des paiements échoués non résolus avec le statut de la relance (J+1, J+3, J+7, suspendu).' },
      { name: 'Emails envoyés & statuts', desc: 'Nombre total d\'emails expédiés dans la semaine par type (onboarding, relance, rapport).' },
      { name: 'Taux d\'ouverture & clics', desc: 'Performance de chaque séquence email : taux d\'ouverture, de clic, et de réponse.' },
      { name: 'Historique glissant 4 semaines', desc: 'Comparaison avec les semaines précédentes pour observer les tendances en un coup d\'œil.' },
    ],
  },
];
---

<BaseLayout
  title="Fonctionnalités — AutomatePro"
  description="Les 3 piliers d'AutomatePro : onboarding automatique J0/J3/J7, récupération impayés et rapport hebdomadaire lundi 8h."
  canonical="/features"
>

<section class="section hero-features" aria-labelledby="features-title">
  <div class="container">
    <div class="section-header reveal">
      <span class="accent-line"></span>
      <h1 id="features-title">Tout ce dont vous avez besoin</h1>
      <p>3 piliers, 18 fonctionnalités. Un seul système.</p>
    </div>

    {pillars.map((pillar) => (
      <div class="feature-category reveal" id={`cat-${pillar.id}`}>
        <div class="category-header">
          <div class="icon-box">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" set:html={pillar.icon} />
          </div>
          <h2>{pillar.title}</h2>
        </div>
        <div class="grid-3 feature-grid">
          {pillar.features.map((feat) => (
            <div class="card feature-card">
              <h3>{feat.name}</h3>
              <p>{feat.desc}</p>
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
</section>

<section class="section cta-section" aria-labelledby="features-cta-title">
  <div class="container" style="text-align:center">
    <div class="reveal" style="display:flex;flex-direction:column;align-items:center">
      <h2 id="features-cta-title">Convaincu ?</h2>
      <p style="margin-top:1rem">Prenez contact pour qu'on discute de votre situation.</p>
      <div style="margin-top:2rem;display:flex;gap:1rem;flex-wrap:wrap;justify-content:center">
        <a href="mailto:noa.pardal1@gmail.com" class="btn btn-primary">Prendre contact</a>
        <a href="/pricing" class="btn btn-secondary">Voir les tarifs</a>
      </div>
    </div>
  </div>
</section>

</BaseLayout>

<style>
  .hero-features { padding-top: 8rem; }

  .feature-category { margin-bottom: 4rem; }
  .feature-category:last-of-type { margin-bottom: 0; }

  .category-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .category-header .icon-box { margin-bottom: 0; }
  .category-header h2 { font-size: 1.5rem; }

  .feature-card { padding: 1.75rem; }
  .feature-card h3 { font-size: 1.0625rem; margin-bottom: 0.5rem; }
  .feature-card p { font-size: 0.9375rem; }
  .feature-grid { gap: 1.25rem; }

  .cta-section {
    background: linear-gradient(135deg, rgba(46, 139, 240, 0.08) 0%, rgba(46, 139, 240, 0.02) 100%);
    border-top: 1px solid rgba(46, 139, 240, 0.15);
  }
</style>
```

- [ ] **Step 2: Vérifier dans le navigateur**

Ouvrir `http://localhost:4321/features`. Expected: 3 catégories (Onboarding, Impayés, Rapport), 6 cartes chacune, pas de trace du CRM immobilier.

- [ ] **Step 3: Commit**

```
git add src/pages/features.astro
git commit -m "feat: features AutomatePro — 3 piliers détaillés"
```

---

## Task 7 — pricing.astro : 2 tiers + tableau comparatif

**Files:**
- Rewrite: `src/pages/pricing.astro`

- [ ] **Step 1: Réécrire `src/pages/pricing.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';

const plans = [
  {
    name: 'Case Study',
    target: "En échange d'un témoignage vidéo",
    setup: '1 500€',
    monthly: '500€',
    popular: false,
    note: '2 places disponibles par trimestre',
    features: [
      'Onboarding J0 / J3 / J7',
      'Relances impayés (J+1, J+3, J+7)',
      'Suspension et reprise automatiques',
      'Rapport hebdomadaire lundi 8h',
      'Portail client (lecture seule)',
      'Support email',
      'Configuration initiale incluse',
    ],
  },
  {
    name: 'Standard',
    target: 'Configuration complète sans contrepartie',
    setup: '3 000€',
    monthly: '1 200€',
    popular: true,
    note: null,
    features: [
      'Tout le tier Case Study',
      'Portail client avec édition templates',
      'Support prioritaire (réponse sous 24h)',
      'Configurations illimitées',
      'Rapport personnalisé',
      'Révisions de templates incluses',
    ],
  },
];

const comparison = [
  { feature: 'Onboarding J0 / J3 / J7', casestudy: true, standard: true },
  { feature: 'Relances impayés automatiques', casestudy: true, standard: true },
  { feature: 'Rapport hebdo lundi 8h', casestudy: true, standard: true },
  { feature: 'Portail client', casestudy: 'Lecture seule', standard: 'Édition complète' },
  { feature: 'Support email', casestudy: true, standard: true },
  { feature: 'Support prioritaire (24h)', casestudy: false, standard: true },
  { feature: 'Configurations illimitées', casestudy: false, standard: true },
  { feature: 'Rapport personnalisé', casestudy: false, standard: true },
  { feature: 'Révisions de templates', casestudy: false, standard: true },
  { feature: 'Témoignage vidéo requis', casestudy: true, standard: false },
];

const faqPricing = [
  { q: "Y a-t-il un engagement minimum ?", a: "Non. Vous pouvez résilier à tout moment avec un préavis d'un mois. Le setup est facturé une seule fois à la mise en place." },
  { q: "Quel est le délai de mise en place ?", a: "Comptez 3 à 5 jours ouvrés entre la signature et la mise en production. On a besoin de vos templates et de votre webhook Stripe." },
  { q: "Qu'est-ce qui est inclus dans le setup ?", a: "La configuration complète de vos séquences dans notre système, les tests de bout en bout, la connexion Stripe et la livraison de votre portail client." },
  { q: "Comment résilier ?", a: "Un email suffit avec un préavis d'un mois. Vous récupérez vos templates et l'historique de vos envois en CSV." },
];
---

<BaseLayout
  title="Tarifs — AutomatePro"
  description="Setup 1 500€ + 500€/mois (Case Study) ou Setup 3 000€ + 1 200€/mois (Standard). Automatisation email complète pour infopreneurs francophones."
  canonical="/pricing"
>

<section class="section hero-pricing" aria-labelledby="pricing-title">
  <div class="container">
    <div class="section-header reveal">
      <span class="accent-line"></span>
      <h1 id="pricing-title">Deux formules, zéro compromis</h1>
      <p>Un setup unique. Un abonnement mensuel. L'automatisation qui tourne pour vous.</p>
    </div>

    <div class="pricing-grid reveal">
      {plans.map((plan) => (
        <div class:list={['card', 'pricing-card-full', { 'pricing-popular': plan.popular }]}>
          {plan.popular && <span class="popular-tag">Recommandé</span>}
          <h2>{plan.name}</h2>
          <p class="pricing-target">{plan.target}</p>
          <div class="price">
            <span class="price-amount">{plan.setup}</span>
            <span class="price-period">setup</span>
          </div>
          <p class="price-monthly">+ {plan.monthly}/mois</p>
          {plan.note && <p class="pricing-note">{plan.note}</p>}
          <a
            href={`mailto:noa.pardal1@gmail.com?subject=${encodeURIComponent('AutomatePro — ' + plan.name)}`}
            class:list={['btn', 'btn-full', plan.popular ? 'btn-primary' : 'btn-secondary']}
          >
            Prendre contact
          </a>
          <ul class="feature-list">
            {plan.features.map((feat) => (
              <li>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>
                {feat}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  </div>
</section>

<!-- Tableau comparatif -->
<section class="section section-alt" aria-labelledby="compare-title">
  <div class="container">
    <div class="section-header reveal">
      <span class="accent-line"></span>
      <h2 id="compare-title">Comparatif détaillé</h2>
    </div>
    <div class="table-wrapper reveal">
      <table class="compare-table" aria-label="Comparatif des formules">
        <thead>
          <tr>
            <th scope="col">Fonctionnalité</th>
            <th scope="col">Case Study</th>
            <th scope="col">Standard</th>
          </tr>
        </thead>
        <tbody>
          {comparison.map((row) => (
            <tr>
              <td>{row.feature}</td>
              <td>
                {row.casestudy === true && (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2" stroke-linecap="round" aria-label="Inclus"><path d="M20 6L9 17l-5-5"/></svg>
                )}
                {row.casestudy === false && (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748B" stroke-width="2" stroke-linecap="round" aria-label="Non inclus"><path d="M18 6L6 18M6 6l12 12"/></svg>
                )}
                {typeof row.casestudy === 'string' && <span class="table-text">{row.casestudy}</span>}
              </td>
              <td>
                {row.standard === true && (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2" stroke-linecap="round" aria-label="Inclus"><path d="M20 6L9 17l-5-5"/></svg>
                )}
                {row.standard === false && (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748B" stroke-width="2" stroke-linecap="round" aria-label="Non inclus"><path d="M18 6L6 18M6 6l12 12"/></svg>
                )}
                {typeof row.standard === 'string' && <span class="table-text">{row.standard}</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
</section>

<!-- FAQ -->
<section class="section" aria-labelledby="faq-pricing-title">
  <div class="container faq-container">
    <div class="section-header reveal">
      <span class="accent-line"></span>
      <h2 id="faq-pricing-title">Questions sur les tarifs</h2>
    </div>
    <div class="faq-list reveal" role="list">
      {faqPricing.map(({ q, a }) => (
        <div class="faq-item" role="listitem">
          <button class="faq-question" aria-expanded="false">
            {q}
            <svg class="faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
          </button>
          <div class="faq-answer" role="region"><p>{a}</p></div>
        </div>
      ))}
    </div>
  </div>
</section>

<!-- CTA -->
<section class="section cta-section" aria-labelledby="pricing-cta-title">
  <div class="container" style="text-align:center">
    <div class="reveal" style="display:flex;flex-direction:column;align-items:center">
      <h2 id="pricing-cta-title">Une question sur les tarifs ?</h2>
      <p style="margin-top:1rem">On vous répond sous 48h.</p>
      <div style="margin-top:2rem">
        <a href="mailto:noa.pardal1@gmail.com" class="btn btn-primary">Prendre contact</a>
      </div>
    </div>
  </div>
</section>

</BaseLayout>

<style>
  .hero-pricing { padding-top: 8rem; }

  .pricing-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 2rem;
    max-width: 900px;
    margin: 0 auto;
  }

  .pricing-card-full {
    display: flex;
    flex-direction: column;
    text-align: center;
    align-items: center;
    padding: 2.5rem 2rem;
  }

  .pricing-card-full h2 { font-size: 1.5rem; }

  .pricing-target { font-size: 0.875rem; color: var(--gray); margin-top: 0.25rem; }

  .price-monthly {
    font-size: 1rem;
    color: var(--gray-light);
    margin-top: -0.75rem;
    margin-bottom: 1rem;
  }

  .pricing-note {
    font-size: 0.8125rem;
    color: var(--gray);
    font-style: italic;
    margin-bottom: 1rem;
  }

  .btn-full { width: 100%; }

  .pricing-card-full .feature-list {
    width: 100%;
    text-align: left;
    margin-top: 2rem;
    border-top: 1px solid var(--gray-border);
    padding-top: 1.5rem;
  }

  .section-alt { background: var(--dark-soft); }

  .table-wrapper {
    overflow-x: auto;
    border-radius: var(--radius);
    border: 1px solid var(--gray-border);
  }

  .compare-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9375rem;
  }

  .compare-table thead { background: var(--dark-elevated); }

  .compare-table th {
    padding: 1rem 1.5rem;
    text-align: left;
    font-size: 0.875rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--gray);
  }

  .compare-table th:not(:first-child) { text-align: center; }

  .compare-table td {
    padding: 1rem 1.5rem;
    border-top: 1px solid var(--gray-border);
    color: var(--gray-light);
  }

  .compare-table td:not(:first-child) { text-align: center; vertical-align: middle; }
  .compare-table td svg { display: inline-block; }
  .compare-table tbody tr:hover { background: var(--dark-elevated); }

  .table-text { font-size: 0.875rem; color: var(--gray-light); }

  .faq-container { max-width: 800px; }

  .cta-section {
    background: linear-gradient(135deg, rgba(46, 139, 240, 0.08) 0%, rgba(46, 139, 240, 0.02) 100%);
    border-top: 1px solid rgba(46, 139, 240, 0.15);
  }

  @media (max-width: 768px) { .pricing-grid { grid-template-columns: 1fr; } }
</style>
```

- [ ] **Step 2: Vérifier dans le navigateur**

Ouvrir `http://localhost:4321/pricing`. Expected: 2 cartes (Case Study + Standard), tableau comparatif avec checkmarks, FAQ toggle fonctionnel.

- [ ] **Step 3: Commit**

```
git add src/pages/pricing.astro
git commit -m "feat: pricing AutomatePro — Case Study + Standard + tableau comparatif"
```

---

## Task 8 — contact.astro : formulaire simplifié + mailto

**Files:**
- Rewrite: `src/pages/contact.astro`

- [ ] **Step 1: Réécrire `src/pages/contact.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---

<BaseLayout
  title="Contact — AutomatePro"
  description="Contactez AutomatePro. Posez vos questions ou discutez de votre projet d'automatisation email."
  canonical="/contact"
>

<section class="section hero-contact" aria-labelledby="contact-title">
  <div class="container">
    <div class="contact-grid">
      <div class="contact-info reveal">
        <span class="accent-line" style="margin:0 0 1.25rem"></span>
        <h1 id="contact-title">Parlons de votre projet</h1>
        <p>Dites-nous où vous en êtes. On vous répond sous 48h pour discuter de votre situation et voir si AutomatePro est fait pour vous.</p>

        <div class="contact-details">
          <div class="contact-detail-item">
            <div class="icon-box" style="width:44px;height:44px;margin-bottom:0">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            </div>
            <div>
              <strong>Email</strong>
              <p>noa.pardal1@gmail.com</p>
            </div>
          </div>
          <div class="contact-detail-item">
            <div class="icon-box" style="width:44px;height:44px;margin-bottom:0">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
            </div>
            <div>
              <strong>Réponse</strong>
              <p>Sous 48h ouvrées</p>
            </div>
          </div>
        </div>
      </div>

      <div class="contact-form-wrapper reveal">
        <form id="contact-form" class="contact-form" novalidate>
          <h2>Envoyez un message</h2>
          <div class="form-group">
            <label for="contact-nom" class="form-label">Nom</label>
            <input type="text" id="contact-nom" name="nom" class="form-input" placeholder="Votre nom" required autocomplete="name" />
          </div>
          <div class="form-group">
            <label for="contact-email" class="form-label">Email</label>
            <input type="email" id="contact-email" name="email" class="form-input" placeholder="vous@exemple.fr" required autocomplete="email" />
          </div>
          <div class="form-group">
            <label for="contact-message" class="form-label">Message</label>
            <textarea id="contact-message" name="message" class="form-input" placeholder="Décrivez votre activité, votre outil de paiement, le volume d'élèves..." rows="6" required></textarea>
          </div>
          <button type="submit" class="btn btn-primary" style="width:100%" id="contact-submit">
            Envoyer le message
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M22 2L11 13"/><path d="M22 2L15 22 11 13 2 9l20-7z"/></svg>
          </button>
          <p class="form-legal">En soumettant, vous acceptez notre <a href="/confidentialite">politique de confidentialité</a>.</p>
        </form>
      </div>
    </div>
  </div>
</section>

</BaseLayout>

<script>
  function initContactForm() {
    const form = document.getElementById('contact-form') as HTMLFormElement | null;
    if (!form) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const nom = (form.querySelector('#contact-nom') as HTMLInputElement).value.trim();
      const email = (form.querySelector('#contact-email') as HTMLInputElement).value.trim();
      const message = (form.querySelector('#contact-message') as HTMLTextAreaElement).value.trim();
      const subject = encodeURIComponent('Contact AutomatePro — ' + nom);
      const body = encodeURIComponent(`De : ${nom} <${email}>\n\n${message}`);
      window.location.href = `mailto:noa.pardal1@gmail.com?subject=${subject}&body=${body}`;
    });
  }
  initContactForm();
  document.addEventListener('astro:after-swap', initContactForm);
</script>

<style>
  .hero-contact { padding-top: 8rem; }

  .contact-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4rem;
    align-items: start;
  }

  .contact-info h1 { margin-bottom: 1rem; }
  .contact-info > p { font-size: 1.125rem; line-height: 1.7; }

  .contact-details {
    margin-top: 2.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .contact-detail-item { display: flex; align-items: center; gap: 1rem; }

  .contact-detail-item strong { display: block; font-size: 0.9375rem; color: var(--light); }
  .contact-detail-item p { font-size: 0.875rem; color: var(--gray-light); margin-top: 0.125rem; }

  .contact-form-wrapper {
    background: var(--dark-card);
    border: 1px solid var(--gray-border);
    border-radius: var(--radius-lg);
    padding: 2.5rem;
  }

  .contact-form { display: flex; flex-direction: column; gap: 1.25rem; }
  .contact-form h2 { font-size: 1.375rem; margin-bottom: 0.5rem; }

  textarea.form-input { resize: vertical; min-height: 120px; }

  .form-legal { font-size: 0.75rem; color: var(--gray); text-align: center; }
  .form-legal a { color: var(--primary); text-decoration: underline; }

  @media (max-width: 768px) {
    .contact-grid { grid-template-columns: 1fr; gap: 2.5rem; }
  }
</style>
```

- [ ] **Step 2: Vérifier dans le navigateur**

Ouvrir `http://localhost:4321/contact`. Remplir le formulaire et soumettre. Expected: le client email s'ouvre avec sujet et corps pré-remplis, destinataire `noa.pardal1@gmail.com`.

- [ ] **Step 3: Commit**

```
git add src/pages/contact.astro
git commit -m "feat: contact AutomatePro — formulaire simplifié + handler mailto"
```

---

## Task 9 — comment-ca-marche.astro + redirects demo/download

**Files:**
- Create: `src/pages/comment-ca-marche.astro`
- Rewrite: `src/pages/demo.astro` (redirect shell)
- Rewrite: `src/pages/download.astro` (redirect shell)

> Note: Les redirects `/demo → /comment-ca-marche` et `/download → /` sont déjà configurés dans `astro.config.mjs` (Task 1). Les fichiers `demo.astro` et `download.astro` sont simplifiés en shells vides pour éviter les conflits de route.

- [ ] **Step 1: Créer `src/pages/comment-ca-marche.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---

<BaseLayout
  title="Comment ça marche — AutomatePro"
  description="Du paiement Stripe à l'email livré en automatique. Découvrez le flow complet d'AutomatePro en 3 étapes."
  canonical="/comment-ca-marche"
>

<!-- ═══ HERO ═══ -->
<section class="section hero-ccm" aria-labelledby="ccm-title">
  <div class="container">
    <div class="section-header reveal">
      <span class="accent-line"></span>
      <h1 id="ccm-title">Comment ça marche</h1>
      <p>Du paiement Stripe à l'email livré — en automatique, tout le temps.</p>
    </div>

    <div class="grid-3">
      <div class="card reveal">
        <div class="step-number" aria-hidden="true">1</div>
        <h3>Vous nous donnez votre webhook Stripe</h3>
        <p>Dans votre dashboard Stripe, vous nous transmettez l'URL du webhook et la clé secrète. C'est la seule action technique que vous effectuez.</p>
      </div>
      <div class="card reveal">
        <div class="step-number" aria-hidden="true">2</div>
        <h3>On configure tout</h3>
        <p>On paramètre vos séquences d'onboarding (J0/J3/J7), vos templates de relance impayés et la fréquence de votre rapport hebdo selon vos instructions.</p>
      </div>
      <div class="card reveal">
        <div class="step-number" aria-hidden="true">3</div>
        <h3>Vos emails partent seuls</h3>
        <p>À partir de là, chaque événement Stripe déclenche la bonne séquence. Vous vous concentrez sur votre contenu, vos emails se gèrent tout seuls.</p>
      </div>
    </div>
  </div>
</section>

<!-- ═══ FLOW DÉTAILLÉ ═══ -->
<section class="section section-alt" aria-labelledby="flow-title">
  <div class="container">
    <div class="section-header reveal">
      <span class="accent-line"></span>
      <h2 id="flow-title">Le flow en détail</h2>
      <p>Ce qui se passe sous le capot à chaque paiement.</p>
    </div>
    <div class="flow-steps">
      <div class="flow-step reveal">
        <div class="flow-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
        </div>
        <div class="flow-content">
          <h3>Un élève paie sur Stripe</h3>
          <p>Un abonnement souscrit ou un paiement unique confirmé génère un événement Stripe <code>payment_intent.succeeded</code> ou <code>invoice.paid</code>.</p>
        </div>
      </div>
      <div class="flow-arrow" aria-hidden="true">↓</div>
      <div class="flow-step reveal">
        <div class="flow-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
        </div>
        <div class="flow-content">
          <h3>AutomatePro reçoit le webhook</h3>
          <p>Notre système écoute en temps réel. L'événement Stripe arrive chez nous dans les secondes qui suivent, vérifié et validé.</p>
        </div>
      </div>
      <div class="flow-arrow" aria-hidden="true">↓</div>
      <div class="flow-step reveal">
        <div class="flow-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
        </div>
        <div class="flow-content">
          <h3>L'email J0 part immédiatement</h3>
          <p>Votre template de bienvenue est envoyé avec votre sender name et votre adresse d'expédition. L'élève voit votre nom, pas le nôtre.</p>
        </div>
      </div>
      <div class="flow-arrow" aria-hidden="true">↓</div>
      <div class="flow-step reveal">
        <div class="flow-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
        </div>
        <div class="flow-content">
          <h3>J3, J7, lundi 8h — tout s'enchaîne</h3>
          <p>Le système planifie automatiquement J3, J7, et ajoute l'élève à votre prochain rapport hebdo du lundi matin.</p>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ═══ EXEMPLE CONCRET ═══ -->
<section class="section" aria-labelledby="example-title">
  <div class="container">
    <div class="section-header reveal">
      <span class="accent-line"></span>
      <h2 id="example-title">Exemple concret</h2>
      <p>Marie s'inscrit à votre formation un vendredi à 21h.</p>
    </div>
    <div class="timeline">
      <div class="timeline-item reveal">
        <div class="timeline-dot"></div>
        <div class="card timeline-card">
          <span class="timeline-time">Vendredi 21h03</span>
          <h3>Paiement confirmé</h3>
          <p>Marie clique sur "Payer". Stripe confirme. AutomatePro reçoit le webhook.</p>
        </div>
      </div>
      <div class="timeline-item reveal">
        <div class="timeline-dot"></div>
        <div class="card timeline-card">
          <span class="timeline-time">Vendredi 21h03</span>
          <h3>Email J0 envoyé</h3>
          <p>Marie reçoit votre email de bienvenue avec son accès, signé de votre nom. Vous dormez, Marie est accueillie.</p>
        </div>
      </div>
      <div class="timeline-item reveal">
        <div class="timeline-dot"></div>
        <div class="card timeline-card">
          <span class="timeline-time">Lundi 21h03</span>
          <h3>Email J3 envoyé</h3>
          <p>Trois jours après l'inscription, Marie reçoit votre check-in et votre ressource.</p>
        </div>
      </div>
      <div class="timeline-item reveal">
        <div class="timeline-dot"></div>
        <div class="card timeline-card">
          <span class="timeline-time">Vendredi suivant 21h03</span>
          <h3>Email J7 envoyé</h3>
          <p>À J+7, votre invitation dans le groupe et votre contenu exclusif partent automatiquement.</p>
        </div>
      </div>
      <div class="timeline-item reveal">
        <div class="timeline-dot timeline-dot-accent"></div>
        <div class="card timeline-card">
          <span class="timeline-time">Lundi suivant 08h00</span>
          <h3>Rapport dans votre boîte</h3>
          <p>Marie apparaît dans votre rapport hebdo : nouvel élève, emails envoyés, statut ouvertures.</p>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- CTA -->
<section class="section cta-section" aria-labelledby="ccm-cta-title">
  <div class="container" style="text-align:center">
    <div class="reveal" style="display:flex;flex-direction:column;align-items:center">
      <h2 id="ccm-cta-title">Prêt à mettre ça en place ?</h2>
      <p style="margin-top:1rem">Contactez-nous pour démarrer la configuration.</p>
      <div style="margin-top:2rem;display:flex;gap:1rem;flex-wrap:wrap;justify-content:center">
        <a href="mailto:noa.pardal1@gmail.com" class="btn btn-primary">Prendre contact</a>
        <a href="/pricing" class="btn btn-secondary">Voir les tarifs</a>
      </div>
    </div>
  </div>
</section>

</BaseLayout>

<style>
  .hero-ccm { padding-top: 8rem; }
  .section-alt { background: var(--dark-soft); }

  .flow-steps {
    max-width: 700px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .flow-step {
    display: flex;
    align-items: flex-start;
    gap: 1.5rem;
    width: 100%;
    padding: 1.75rem;
    background: var(--dark-card);
    border: 1px solid var(--gray-border);
    border-radius: var(--radius);
  }

  .flow-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 52px;
    height: 52px;
    border-radius: var(--radius);
    background: var(--primary-light);
    color: var(--primary);
    flex-shrink: 0;
  }

  .flow-content h3 { font-size: 1.125rem; margin-bottom: 0.5rem; }
  .flow-content p { font-size: 0.9375rem; }

  .flow-content code {
    font-family: monospace;
    font-size: 0.8125rem;
    background: var(--dark-elevated);
    padding: 0.125rem 0.375rem;
    border-radius: 4px;
    color: var(--primary);
  }

  .flow-arrow { font-size: 1.5rem; color: var(--primary); padding: 0.5rem 0; line-height: 1; }

  .timeline {
    max-width: 700px;
    margin: 0 auto;
    position: relative;
  }

  .timeline::before {
    content: '';
    position: absolute;
    left: 16px;
    top: 0;
    bottom: 0;
    width: 2px;
    background: var(--gray-border);
  }

  .timeline-item {
    display: flex;
    gap: 1.5rem;
    padding-bottom: 1.5rem;
    position: relative;
  }

  .timeline-item:last-child { padding-bottom: 0; }

  .timeline-dot {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: var(--dark-card);
    border: 2px solid var(--gray-border);
    flex-shrink: 0;
    margin-top: 1.5rem;
    z-index: 1;
  }

  .timeline-dot-accent { border-color: var(--primary); background: var(--primary-light); }

  .timeline-card { flex: 1; }

  .timeline-time { font-size: 0.8125rem; color: var(--primary); font-weight: 600; display: block; margin-bottom: 0.5rem; }
  .timeline-card h3 { font-size: 1.0625rem; margin-bottom: 0.375rem; }
  .timeline-card p { font-size: 0.9375rem; }

  .cta-section {
    background: linear-gradient(135deg, rgba(46, 139, 240, 0.08) 0%, rgba(46, 139, 240, 0.02) 100%);
    border-top: 1px solid rgba(46, 139, 240, 0.15);
  }

  @media (max-width: 768px) {
    .flow-step { flex-direction: column; }
    .timeline::before { left: 12px; }
    .timeline-dot { width: 26px; height: 26px; }
  }
</style>
```

- [ ] **Step 2: Supprimer le contenu de `demo.astro` et le remplacer par un shell vide**

Le redirect `/demo → /comment-ca-marche` est géré par `astro.config.mjs`. La page `demo.astro` doit être supprimée pour éviter un conflit de route. Supprimer le fichier :

```
# Dans le terminal
Remove-Item src/pages/demo.astro
```

- [ ] **Step 3: Supprimer le contenu de `download.astro` de la même façon**

```
Remove-Item src/pages/download.astro
```

- [ ] **Step 4: Vérifier dans le navigateur**

- `http://localhost:4321/comment-ca-marche` → Expected: page "Comment ça marche" avec flow 4 étapes + timeline.
- `http://localhost:4321/demo` → Expected: redirigé vers `/comment-ca-marche`.
- `http://localhost:4321/download` → Expected: redirigé vers `/`.

- [ ] **Step 5: Commit**

```
git add src/pages/comment-ca-marche.astro
git rm src/pages/demo.astro src/pages/download.astro
git commit -m "feat: page comment-ca-marche + suppression demo/download (redirects config)"
```

---

## Task 10 — client/[token].astro : portail client dynamique

**Files:**
- Create: `src/pages/client/[token].astro`
- Create: `.env`

> **Prérequis :** `output: 'hybrid'` dans `astro.config.mjs` (fait en Task 1). `export const prerender = false` sur cette page active le SSR uniquement pour `/client/*`. Toutes les autres pages restent statiques.
>
> **Fonctionnement en dev :** `npm run dev` gère le SSR sans adapter. Pour la production, un adapter (node, netlify, cloudflare) sera nécessaire.

- [ ] **Step 1: Créer le fichier `.env` à la racine du projet**

```
PUBLIC_AEVUM_API_URL=
```

> Laisser vide en dev. Remplir avec l'URL réelle du backend AEVUM avant déploiement.

- [ ] **Step 2: Créer le dossier `src/pages/client/` et le fichier `[token].astro`**

```astro
---
export const prerender = false;
import BaseLayout from '../../layouts/BaseLayout.astro';

const { token } = Astro.params;
const apiUrl = import.meta.env.PUBLIC_AEVUM_API_URL ?? '';
---

<BaseLayout
  title="Portail client — AutomatePro"
  description="Gérez vos paramètres et consultez votre historique d'envois."
>

<section class="section portal-section" aria-label="Portail client">
  <div class="container portal-container">

    <!-- Loading -->
    <div id="portal-loading" class="portal-state" style="text-align:center;padding:4rem 0">
      <div class="spinner" aria-label="Chargement..."></div>
      <p style="margin-top:1.5rem;text-align:center">Chargement de votre espace...</p>
    </div>

    <!-- Error -->
    <div id="portal-error" class="portal-state" style="display:none">
      <div class="card" style="text-align:center;padding:4rem 2rem;max-width:500px;margin:0 auto">
        <div class="icon-box" style="margin:0 auto 1.5rem">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        </div>
        <h2>Lien invalide</h2>
        <p style="margin-top:0.75rem;text-align:center">Ce lien de portail client n'existe pas ou a expiré. Contactez-nous si vous pensez qu'il s'agit d'une erreur.</p>
        <div style="margin-top:2rem">
          <a href="mailto:noa.pardal1@gmail.com" class="btn btn-primary">Nous contacter</a>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div id="portal-content" class="portal-state" style="display:none">

      <!-- Client info -->
      <div style="margin-bottom:2.5rem">
        <span class="accent-line" style="margin:0 0 1rem"></span>
        <h1 id="client-name" style="font-size:clamp(1.5rem,3vw,2rem)">Bonjour</h1>
        <p>Gérez vos paramètres et consultez l'historique de vos envois.</p>
      </div>

      <!-- Config form -->
      <div class="card" style="margin-bottom:2rem">
        <h2 style="font-size:1.25rem;margin-bottom:1.5rem">Paramètres</h2>
        <form id="config-form" style="display:flex;flex-direction:column;gap:1.25rem">
          <div class="form-group">
            <label for="sender-name" class="form-label">Sender name (nom d'expéditeur)</label>
            <input type="text" id="sender-name" name="sender_name" class="form-input" placeholder="Votre Nom" />
          </div>
          <div class="form-group">
            <label for="template-j0" class="form-label">Template J0 — Bienvenue</label>
            <textarea id="template-j0" name="template_j0" class="form-input template-field" rows="5" placeholder="Contenu de l'email de bienvenue..."></textarea>
          </div>
          <div class="form-group">
            <label for="template-j3" class="form-label">Template J3 — Check-in</label>
            <textarea id="template-j3" name="template_j3" class="form-input template-field" rows="5" placeholder="Contenu de l'email J+3..."></textarea>
          </div>
          <div class="form-group">
            <label for="template-j7" class="form-label">Template J7 — Bonus</label>
            <textarea id="template-j7" name="template_j7" class="form-input template-field" rows="5" placeholder="Contenu de l'email J+7..."></textarea>
          </div>
          <div class="form-group">
            <label for="template-impaye" class="form-label">Template impayé — Relance</label>
            <textarea id="template-impaye" name="template_impaye" class="form-input template-field" rows="5" placeholder="Contenu de l'email de relance impayé..."></textarea>
          </div>
          <div>
            <button type="submit" class="btn btn-primary" id="save-btn">Enregistrer les modifications</button>
          </div>
          <div id="save-success" class="success-msg" style="display:none" role="alert">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>
            <span>Modifications enregistrées avec succès.</span>
          </div>
          <div id="save-error" class="save-error-msg" style="display:none" role="alert">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <span>Erreur lors de la sauvegarde. Réessayez.</span>
          </div>
        </form>
      </div>

      <!-- History -->
      <div class="card">
        <h2 style="font-size:1.25rem;margin-bottom:1.5rem">Historique des envois</h2>
        <div id="history-loading" style="text-align:center;padding:2rem;color:var(--gray)">Chargement...</div>
        <div id="history-content" style="display:none;overflow-x:auto">
          <table class="history-table" aria-label="Historique des 20 derniers envois">
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Type</th>
                <th scope="col">Destinataire</th>
                <th scope="col">Statut</th>
              </tr>
            </thead>
            <tbody id="history-tbody"></tbody>
          </table>
          <p id="history-empty" style="display:none;text-align:center;padding:2rem;color:var(--gray)">Aucun envoi pour le moment.</p>
        </div>
      </div>

    </div>
  </div>
</section>

</BaseLayout>

<script define:vars={{ apiUrl, token }}>
  const $ = (id) => document.getElementById(id);

  function show(el, flex) { if (el) el.style.display = flex ? 'flex' : 'block'; }
  function hide(el) { if (el) el.style.display = 'none'; }

  async function init() {
    if (!apiUrl) {
      hide($('portal-loading'));
      show($('portal-error'));
      return;
    }

    let clientData;
    try {
      const res = await fetch(`${apiUrl}/client/${token}`);
      if (res.status === 404) { hide($('portal-loading')); show($('portal-error')); return; }
      if (!res.ok) throw new Error('API error');
      clientData = await res.json();
    } catch {
      hide($('portal-loading'));
      show($('portal-error'));
      return;
    }

    const nameEl = $('client-name');
    if (nameEl) nameEl.textContent = `Bonjour ${clientData.nom || ''}`;

    const senderInput = $('sender-name');
    if (senderInput) senderInput.value = clientData.sender_name || '';

    const templates = clientData.templates || {};
    const fieldMap = { 'template-j0': 'j0', 'template-j3': 'j3', 'template-j7': 'j7', 'template-impaye': 'impaye' };
    for (const [id, key] of Object.entries(fieldMap)) {
      const el = $(id);
      if (el) el.value = templates[key] || '';
    }

    hide($('portal-loading'));
    show($('portal-content'));

    loadHistory();
  }

  async function loadHistory() {
    try {
      const res = await fetch(`${apiUrl}/client/${token}/history`);
      if (!res.ok) throw new Error('History error');
      const rows = await res.json();

      hide($('history-loading'));

      if (!rows || rows.length === 0) {
        show($('history-content'));
        show($('history-empty'));
        return;
      }

      const tbody = $('history-tbody');
      rows.slice(0, 20).forEach((row) => {
        const tr = document.createElement('tr');
        const date = new Date(row.date).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
        const statut = (row.statut || '').toLowerCase();
        tr.innerHTML = `
          <td>${date}</td>
          <td>${row.type || '—'}</td>
          <td>${row.destinataire || '—'}</td>
          <td><span class="status-badge status-${statut}">${row.statut || '—'}</span></td>
        `;
        if (tbody) tbody.appendChild(tr);
      });

      show($('history-content'));
    } catch {
      const hl = $('history-loading');
      if (hl) hl.textContent = "Impossible de charger l'historique.";
    }
  }

  const configForm = $('config-form');
  if (configForm) {
    configForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      hide($('save-success'));
      hide($('save-error'));

      const saveBtn = $('save-btn');
      if (saveBtn) saveBtn.setAttribute('disabled', '');

      const payload = {
        sender_name: $('sender-name').value,
        templates: {
          j0: $('template-j0').value,
          j3: $('template-j3').value,
          j7: $('template-j7').value,
          impaye: $('template-impaye').value,
        },
      };

      try {
        const res = await fetch(`${apiUrl}/client/${token}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Save failed');
        show($('save-success'), true);
      } catch {
        show($('save-error'), true);
      } finally {
        if (saveBtn) saveBtn.removeAttribute('disabled');
      }
    });
  }

  init();
</script>

<style>
  .portal-section { padding-top: 6rem; }
  .portal-container { max-width: 900px; }

  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid var(--gray-border);
    border-top-color: var(--primary);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin: 0 auto;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  .history-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9375rem;
  }

  .history-table th {
    padding: 0.875rem 1rem;
    text-align: left;
    font-size: 0.8125rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--gray);
    border-bottom: 1px solid var(--gray-border);
  }

  .history-table td {
    padding: 0.875rem 1rem;
    border-bottom: 1px solid var(--gray-border);
    color: var(--gray-light);
  }

  .history-table tbody tr:last-child td { border-bottom: none; }

  .status-badge {
    display: inline-block;
    padding: 0.25rem 0.625rem;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 600;
    background: var(--dark-elevated);
    color: var(--gray-light);
  }

  .status-badge.status-envoyé,
  .status-badge.status-envoye { background: var(--success-light); color: var(--success); }

  .status-badge.status-ouvert { background: rgba(46,139,240,0.15); color: var(--primary); }

  .status-badge.status-échec,
  .status-badge.status-echec { background: rgba(239,68,68,0.12); color: #EF4444; }

  .template-field { font-family: monospace; font-size: 0.875rem; resize: vertical; min-height: 100px; }

  .save-error-msg {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem 1.5rem;
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid #EF4444;
    border-radius: var(--radius-sm);
    color: #EF4444;
    font-weight: 600;
  }
</style>
```

- [ ] **Step 3: Vérifier en dev**

```
npm run dev
```

Ouvrir `http://localhost:4321/client/test-token-123`. Expected: spinner visible, puis message d'erreur "Lien invalide" (car `PUBLIC_AEVUM_API_URL` est vide et le fetch échoue — comportement correct en dev sans backend).

- [ ] **Step 4: Commit**

```
git add src/pages/client/[token].astro .env
git commit -m "feat: portail client /client/[token] — fetch vanilla + form PUT"
```

---

## Task 11 — Pages légales : remplacement AEVUM → AutomatePro

**Files:**
- Modify: `src/pages/cgu.astro`
- Modify: `src/pages/confidentialite.astro`
- Modify: `src/pages/mentions-legales.astro`

- [ ] **Step 1: Réécrire `src/pages/cgu.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---

<BaseLayout
  title="Conditions Générales d'Utilisation — AutomatePro"
  description="Conditions générales d'utilisation du service AutomatePro."
  canonical="/cgu"
>

<section class="section" style="padding-top:8rem">
  <div class="container legal-content">
    <h1>Conditions Générales d'Utilisation</h1>
    <p><em>Dernière mise à jour : mai 2026</em></p>

    <h2>1. Objet</h2>
    <p>Les présentes conditions générales d'utilisation (CGU) ont pour objet de définir les modalités d'accès et d'utilisation du service AutomatePro.</p>

    <h2>2. Accès au service</h2>
    <p>L'accès à AutomatePro est réservé aux clients disposant d'un compte actif et d'un abonnement en cours de validité.</p>

    <h2>3. Inscription</h2>
    <p>Le client s'engage à fournir des informations exactes lors de son inscription et à maintenir la confidentialité de ses accès.</p>

    <h2>4. Propriété intellectuelle</h2>
    <p>L'ensemble des éléments composant le service AutomatePro (logiciel, design, textes, algorithmes) est protégé par le droit de la propriété intellectuelle.</p>

    <h2>5. Responsabilité</h2>
    <p>AutomatePro met tout en œuvre pour assurer la disponibilité et le bon fonctionnement du service, sans pouvoir garantir une disponibilité à 100%.</p>

    <h2>6. Résiliation</h2>
    <p>Le client peut résilier son abonnement à tout moment avec un préavis d'un mois par email. La résiliation prend effet à la fin du mois en cours.</p>

    <h2>7. Droit applicable</h2>
    <p>Les présentes CGU sont soumises au droit français. En cas de litige, les tribunaux compétents seront ceux du ressort du siège social.</p>

    <p style="margin-top:3rem"><a href="/" style="color:var(--primary)">← Retour à l'accueil</a></p>
  </div>
</section>

</BaseLayout>
```

- [ ] **Step 2: Réécrire `src/pages/confidentialite.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---

<BaseLayout
  title="Politique de Confidentialité — AutomatePro"
  description="Politique de confidentialité et protection des données personnelles d'AutomatePro."
  canonical="/confidentialite"
>

<section class="section" style="padding-top:8rem">
  <div class="container legal-content">
    <h1>Politique de Confidentialité</h1>
    <p><em>Dernière mise à jour : mai 2026</em></p>

    <h2>1. Responsable du traitement</h2>
    <p>AutomatePro, dont le responsable est joignable à noa.pardal1@gmail.com, est responsable du traitement des données personnelles collectées via le service.</p>

    <h2>2. Données collectées</h2>
    <p>Nous collectons les données strictement nécessaires au fonctionnement du service : nom, adresse email, données de paiement (via Stripe), et données d'utilisation du service.</p>

    <h2>3. Finalités du traitement</h2>
    <p>Vos données sont utilisées pour la gestion de votre compte, le fonctionnement des automatisations email, l'amélioration de nos services et la communication relative à votre abonnement.</p>

    <h2>4. Hébergement et sécurité</h2>
    <p>Vos données sont hébergées en France sur des serveurs certifiés. Elles sont chiffrées en transit (TLS) et au repos, avec des sauvegardes régulières.</p>

    <h2>5. Vos droits</h2>
    <p>Conformément au RGPD, vous disposez des droits d'accès, de rectification, d'effacement, de portabilité et d'opposition sur vos données. <a href="/contact" style="color:var(--primary)">Contactez-nous</a> pour exercer vos droits.</p>

    <h2>6. Durée de conservation</h2>
    <p>Vos données sont conservées pendant la durée de votre abonnement, puis supprimées dans un délai de 30 jours après résiliation, sauf obligation légale contraire.</p>

    <h2>7. Cookies</h2>
    <p>AutomatePro n'utilise pas de cookies publicitaires. Seuls des cookies techniques essentiels au fonctionnement du service sont utilisés.</p>

    <p style="margin-top:3rem"><a href="/" style="color:var(--primary)">← Retour à l'accueil</a></p>
  </div>
</section>

</BaseLayout>
```

- [ ] **Step 3: Lire `mentions-legales.astro` et remplacer les références AEVUM**

Ouvrir `src/pages/mentions-legales.astro`. Remplacer :
- `"AEVUM"` → `"AutomatePro"`
- `"AEVUM SAS"` → `"AutomatePro"`
- `"contact@aevum.fr"` → `"noa.pardal1@gmail.com"`
- `title="Mentions légales — AEVUM"` → `title="Mentions légales — AutomatePro"`
- `description` → mentionner AutomatePro

- [ ] **Step 4: Vérifier dans le navigateur**

- `http://localhost:4321/cgu` → Expected: titre "AutomatePro", pas de trace d'"AEVUM immobilier"
- `http://localhost:4321/confidentialite` → même vérification
- `http://localhost:4321/mentions-legales` → même vérification

- [ ] **Step 5: Commit**

```
git add src/pages/cgu.astro src/pages/confidentialite.astro src/pages/mentions-legales.astro
git commit -m "chore: pages légales — AEVUM → AutomatePro"
```

---

## Task 12 — Build final + vérification complète

**Files:** aucun

- [ ] **Step 1: Lancer le build de production**

```
npm run build
```

Expected: build réussit sans erreur. En mode hybrid, Astro peut demander un adapter pour les pages SSR. Si le build échoue avec `"Cannot use hybrid output without an adapter"`, deux options :
- **Option A (développement local uniquement)** : ne pas builder, utiliser uniquement `npm run dev` jusqu'à ce qu'un adapter soit configuré.
- **Option B (production)** : installer l'adapter Node : `npm install @astrojs/node` et ajouter à `astro.config.mjs` :
  ```js
  import node from '@astrojs/node';
  // dans defineConfig :
  adapter: node({ mode: 'standalone' }),
  ```

- [ ] **Step 2: Vérifier toutes les routes en dev**

```
npm run dev
```

Parcourir manuellement :
- `/` — hero, stats, piliers, étapes, pricing 2 cartes, FAQ ✓
- `/features` — 3 catégories, 18 cards ✓
- `/pricing` — 2 tiers, tableau, FAQ ✓
- `/contact` — formulaire 3 champs, mailto au submit ✓
- `/comment-ca-marche` — flow 4 étapes, timeline ✓
- `/demo` → redirigé vers `/comment-ca-marche` ✓
- `/download` → redirigé vers `/` ✓
- `/client/abc123` — spinner, puis erreur "Lien invalide" (API absente en dev) ✓
- `/cgu`, `/confidentialite`, `/mentions-legales` — pas de "AEVUM" visible ✓

- [ ] **Step 3: Vérifier les liens internes**

Cliquer sur tous les liens du Header et Footer. Aucun lien ne doit pointer vers `/demo` ou `/download` directement.

- [ ] **Step 4: Vérifier le FAQ toggle**

Sur `/` et `/pricing`, cliquer sur chaque question FAQ. Expected: réponse s'ouvre/ferme, une seule ouverte à la fois.

- [ ] **Step 5: Commit final**

```
git add -A
git commit -m "chore: build vérifié — refactoring AutomatePro complet"
```

---

## Notes post-implémentation

| Sujet | Action requise |
|-------|---------------|
| Domaine | Mettre à jour `site:` dans `astro.config.mjs` quand le domaine AutomatePro est connu |
| Adapter production | Installer `@astrojs/node`, `@astrojs/netlify` ou `@astrojs/cloudflare` selon l'hébergeur |
| `.env` | Remplir `PUBLIC_AEVUM_API_URL` avec l'URL réelle du backend avant déploiement |
| Logo asset | Optionnel : créer `public/favicon.svg` aux couleurs AutomatePro |
| `site:` sitemap | Mettre à jour `https://aevum.fr` → domaine final |
