# Vitrine Content Update — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update all 4 marketing pages to reflect the real product — 4 enriched pillars + 18 additional features + 3 options + 4 pricing plans.

**Architecture:** Content-only changes. Each page is a self-contained Astro file with frontmatter data arrays + HTML template. Approach: replace frontmatter data → update HTML sections that reference them → `npm run build` → commit. CSS changes limited to adding `.option-card` in `pricing.astro`.

**Tech Stack:** Astro 6, TypeScript strict, static output, `npm run build` for verification.

---

## File Map

| File | Change type |
|------|-------------|
| `src/pages/pricing.astro` | Full frontmatter replacement + new HTML sections (options, 2 comparison tables) + `.option-card` CSS |
| `src/pages/features.astro` | Full frontmatter replacement (`pillars` → `categories`) + meta + h1 text |
| `src/pages/index.astro` | 4 pillar card descriptions + pricing preview 2 cards |
| `src/pages/comment-ca-marche.astro` | 3 prose text zones |

---

## Task 1: pricing.astro — Replace frontmatter data

**Files:**
- Modify: `src/pages/pricing.astro` (frontmatter only in this task)

- [ ] **Step 1: Verify baseline build passes**

```powershell
npm run build
```
Expected: no errors.

- [ ] **Step 2: Replace the entire frontmatter block**

In `src/pages/pricing.astro`, replace everything between `---` and `---` (lines 1–61) with:

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';

const launchPlans = [
  {
    name: 'Case Study',
    target: "Accès aux conditions les plus avantageuses — en échange d'un retour d'expérience structuré",
    setup: '0€',
    monthly: '300€',
    engagement: '3 mois minimum',
    note: '2 places disponibles',
    popular: false,
    condition: 'Témoignage vidéo obligatoire',
    features: [
      'Onboarding J0 / J3 / J7',
      'Relances impayés (J+1, J+3, J+7)',
      'Suspension et reprise automatiques',
      'Dashboard & stats ROI',
      'Automatisations personnalisées',
      'Portail client complet',
      'Support email',
      'Configuration initiale incluse',
    ],
  },
  {
    name: 'Membre Fondateur',
    target: 'Accès fondateur avec accompagnement renforcé',
    setup: '990€',
    monthly: '590€',
    engagement: '6 mois minimum',
    note: '3 places disponibles',
    popular: true,
    condition: 'Témoignage écrit + vidéo obligatoire',
    features: [
      'Tout le tier Case Study',
      'Suivi dédié 6 mois',
      'Révisions de templates incluses',
      'Accès anticipé aux nouvelles features',
    ],
  },
];

const permanentPlans = [
  {
    name: 'Standard',
    target: 'Configuration complète, sans contrepartie',
    setup: '2 500€',
    monthly: '690€',
    engagement: 'Mensuel sans engagement',
    popular: false,
    features: [
      'Onboarding J0 / J3 / J7',
      'Relances impayés (J+1, J+3, J+7) + coupure auto',
      'Dashboard stats ROI complet',
      'Tracking ouvertures & clics',
      'Page élèves (filtres + historique individuel)',
      'Multi-formations',
      'Blacklist emails',
      'Guide deliverability (SPF/DKIM/DMARC)',
      'Demandes de témoignage J+30/J+60',
      'Automatisations personnalisées illimitées',
      'Portail client complet + édition templates',
      'Support prioritaire (réponse sous 24h)',
    ],
  },
  {
    name: 'Premium',
    target: 'Tout Standard + automatisations avancées et multi-canal',
    setup: '4 500€',
    monthly: '1 290€',
    engagement: 'Mensuel sans engagement',
    popular: true,
    features: [
      'Tout le plan Standard',
      'Pré-dunning CB expirant (14j avant échec)',
      'Détection churn + re-engagement (21j silence)',
      'Coaching élèves inactifs (14j sans ouverture)',
      'WhatsApp Business (parallèle email)',
      'SMS multi-canal (160 chars/template)',
      'Rapport vidéo IA hebdomadaire (lundi, 60-90s)',
    ],
  },
];

const launchComparison = [
  { feature: 'Setup', casestudy: '0€', fondateur: '990€' },
  { feature: 'Abonnement mensuel', casestudy: '300€/mois', fondateur: '590€/mois' },
  { feature: 'Engagement minimum', casestudy: '3 mois', fondateur: '6 mois' },
  { feature: 'Onboarding J0/J3/J7', casestudy: true, fondateur: true },
  { feature: 'Relances impayés + coupure auto', casestudy: true, fondateur: true },
  { feature: 'Dashboard & stats ROI', casestudy: true, fondateur: true },
  { feature: 'Automatisations personnalisées', casestudy: true, fondateur: true },
  { feature: 'Portail client complet', casestudy: true, fondateur: true },
  { feature: 'Suivi dédié 6 mois', casestudy: false, fondateur: true },
  { feature: 'Révisions de templates', casestudy: false, fondateur: true },
  { feature: 'Accès anticipé nouvelles features', casestudy: false, fondateur: true },
  { feature: 'Témoignage requis', casestudy: 'Vidéo', fondateur: 'Écrit + vidéo' },
];

const permanentComparison = [
  { feature: 'Onboarding J0/J3/J7', standard: true, premium: true },
  { feature: 'Relances impayés + coupure auto', standard: true, premium: true },
  { feature: 'Dashboard stats ROI', standard: true, premium: true },
  { feature: 'Tracking ouvertures & clics', standard: true, premium: true },
  { feature: 'Page élèves + filtres + historique', standard: true, premium: true },
  { feature: 'Multi-formations', standard: true, premium: true },
  { feature: 'Blacklist emails', standard: true, premium: true },
  { feature: 'Guide deliverability (SPF/DKIM/DMARC)', standard: true, premium: true },
  { feature: 'Demandes de témoignage J+30/J+60', standard: true, premium: true },
  { feature: 'Automatisations personnalisées illimitées', standard: true, premium: true },
  { feature: 'Support prioritaire (24h)', standard: true, premium: true },
  { feature: 'Pré-dunning CB expirant', standard: false, premium: true },
  { feature: 'Détection churn + re-engagement', standard: false, premium: true },
  { feature: 'Coaching élèves inactifs', standard: false, premium: true },
  { feature: 'WhatsApp Business', standard: false, premium: true },
  { feature: 'SMS multi-canal', standard: false, premium: true },
  { feature: 'Rapport vidéo IA hebdomadaire', standard: false, premium: true },
];

const options = [
  {
    name: 'Récupération abandons checkout',
    price: '+200€/mois',
    desc: "Détecte les prospects qui quittent Stripe sans payer et les relance automatiquement 30 min après. Disponible sur Standard et Premium.",
  },
  {
    name: 'Récupération vocale IA',
    price: "+350€/mois + coûts d'appels",
    desc: "Agent vocal IA qui rappelle l'élève pour récupérer un impayé ou closer une vente. Coûts d'appels facturés à la consommation. Disponible sur Standard et Premium.",
  },
  {
    name: 'Module Notaire',
    price: '149€/dossier',
    desc: "Automatisation des calculs et documents juridiques/fiscaux pour les notaires infopreneurs. Disponible sur Standard et Premium.",
  },
];

const faqPricing = [
  {
    q: "Qu'est-ce que le setup ?",
    a: "Investissement unique couvrant la configuration complète de vos séquences, l'intégration Stripe, les tests de bout en bout, et la session d'onboarding.",
  },
  {
    q: "Y a-t-il un engagement ?",
    a: "Standard et Premium sont mensuels sans engagement. Les offres de lancement ont un engagement minimum (3 mois pour Case Study, 6 mois pour Fondateur).",
  },
  {
    q: "Peut-on changer de plan ?",
    a: "Oui, l'upgrade est possible à tout moment. Le setup complémentaire est proratisé.",
  },
  {
    q: "Quel est le délai de mise en place ?",
    a: "Comptez 3 à 5 jours ouvrés entre la signature et la mise en production. On a besoin de vos templates et de votre webhook Stripe.",
  },
];
---
```

- [ ] **Step 3: Run build to verify TypeScript**

```powershell
npm run build
```
Expected: no TypeScript errors. If errors appear, check that all variable names used in the template (`launchPlans`, `permanentPlans`, `launchComparison`, `permanentComparison`, `options`, `faqPricing`) are declared in the new frontmatter.

---

## Task 2: pricing.astro — Replace HTML template

**Files:**
- Modify: `src/pages/pricing.astro` (template + `<style>` block)

- [ ] **Step 1: Replace the entire template between `<BaseLayout …>` and `</BaseLayout>`**

Replace the existing `<BaseLayout …>` open tag and everything up to and including `</BaseLayout>` with:

```astro
<BaseLayout
  title="Tarifs — AEVUM"
  description="Offres de lancement (0€–990€ setup, 300–590€/mois) et plans permanents (Standard 690€/mois, Premium 1 290€/mois). Automatisation email complète pour infopreneurs."
  canonical="/pricing"
>

<!-- ═══ HERO ═══ -->
<section class="section hero-pricing" aria-labelledby="pricing-title">
  <div class="container">
    <div class="section-header reveal">
      <span class="accent-line"></span>
      <h1 id="pricing-title">Deux formules, zéro compromis</h1>
      <p>Un setup unique. Un abonnement mensuel. L'automatisation qui tourne pour vous.</p>
    </div>

    <!-- Offres de lancement -->
    <div class="plan-section reveal">
      <div class="plan-section-header">
        <span class="launch-badge">Places limitées</span>
        <h2>Offres de lancement</h2>
        <p class="plan-section-note">Ces offres permettent d'accéder à AEVUM aux conditions les plus avantageuses, en échange d'un retour d'expérience structuré.</p>
      </div>
      <div class="pricing-grid">
        {launchPlans.map((plan) => (
          <div class:list={['card', 'pricing-card-full', { 'pricing-popular': plan.popular }]}>
            {plan.popular && <span class="popular-tag">Recommandé</span>}
            <h3>{plan.name}</h3>
            <p class="pricing-target">{plan.target}</p>
            <div class="price">
              <span class="price-amount">{plan.setup}</span>
              <span class="price-period">setup</span>
            </div>
            <p class="price-monthly">+ {plan.monthly}/mois</p>
            <p class="pricing-note">{plan.note} — {plan.engagement}</p>
            <p class="pricing-condition">{plan.condition}</p>
            <a href="/contact" class:list={['btn', 'btn-full', plan.popular ? 'btn-primary' : 'btn-secondary']}>
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

    <!-- Plans permanents -->
    <div class="plan-section reveal" style="margin-top:4rem">
      <div class="plan-section-header">
        <h2>Plans permanents</h2>
      </div>
      <div class="pricing-grid">
        {permanentPlans.map((plan) => (
          <div class:list={['card', 'pricing-card-full', { 'pricing-popular': plan.popular }]}>
            {plan.popular && <span class="popular-tag">Recommandé</span>}
            <h3>{plan.name}</h3>
            <p class="pricing-target">{plan.target}</p>
            <div class="price">
              <span class="price-amount">{plan.setup}</span>
              <span class="price-period">setup</span>
            </div>
            <p class="price-monthly">+ {plan.monthly}/mois</p>
            <p class="pricing-note">{plan.engagement}</p>
            <a href="/contact" class:list={['btn', 'btn-full', plan.popular ? 'btn-primary' : 'btn-secondary']}>
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
  </div>
</section>

<!-- ═══ TABLEAU LANCEMENT ═══ -->
<section class="section section-alt" aria-labelledby="compare-launch-title">
  <div class="container">
    <div class="section-header reveal">
      <span class="accent-line"></span>
      <h2 id="compare-launch-title">Comparer les offres de lancement</h2>
    </div>
    <div class="table-wrapper reveal">
      <table class="compare-table" aria-label="Comparatif offres de lancement">
        <thead>
          <tr>
            <th scope="col">Fonctionnalité</th>
            <th scope="col">Case Study</th>
            <th scope="col">Membre Fondateur</th>
          </tr>
        </thead>
        <tbody>
          {launchComparison.map((row) => (
            <tr>
              <td>{row.feature}</td>
              <td>
                {row.casestudy === true && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2" stroke-linecap="round" aria-label="Inclus"><path d="M20 6L9 17l-5-5"/></svg>}
                {row.casestudy === false && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748B" stroke-width="2" stroke-linecap="round" aria-label="Non inclus"><path d="M18 6L6 18M6 6l12 12"/></svg>}
                {typeof row.casestudy === 'string' && <span class="table-text">{row.casestudy}</span>}
              </td>
              <td>
                {row.fondateur === true && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2" stroke-linecap="round" aria-label="Inclus"><path d="M20 6L9 17l-5-5"/></svg>}
                {row.fondateur === false && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748B" stroke-width="2" stroke-linecap="round" aria-label="Non inclus"><path d="M18 6L6 18M6 6l12 12"/></svg>}
                {typeof row.fondateur === 'string' && <span class="table-text">{row.fondateur}</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
</section>

<!-- ═══ TABLEAU PLANS PERMANENTS ═══ -->
<section class="section" aria-labelledby="compare-permanent-title">
  <div class="container">
    <div class="section-header reveal">
      <span class="accent-line"></span>
      <h2 id="compare-permanent-title">Comparer les plans permanents</h2>
    </div>
    <div class="table-wrapper reveal">
      <table class="compare-table" aria-label="Comparatif plans permanents">
        <thead>
          <tr>
            <th scope="col">Fonctionnalité</th>
            <th scope="col">Standard</th>
            <th scope="col">Premium</th>
          </tr>
        </thead>
        <tbody>
          {permanentComparison.map((row) => (
            <tr>
              <td>{row.feature}</td>
              <td>
                {row.standard === true && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2" stroke-linecap="round" aria-label="Inclus"><path d="M20 6L9 17l-5-5"/></svg>}
                {row.standard === false && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748B" stroke-width="2" stroke-linecap="round" aria-label="Non inclus"><path d="M18 6L6 18M6 6l12 12"/></svg>}
                {typeof row.standard === 'string' && <span class="table-text">{row.standard}</span>}
              </td>
              <td>
                {row.premium === true && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2" stroke-linecap="round" aria-label="Inclus"><path d="M20 6L9 17l-5-5"/></svg>}
                {row.premium === false && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748B" stroke-width="2" stroke-linecap="round" aria-label="Non inclus"><path d="M18 6L6 18M6 6l12 12"/></svg>}
                {typeof row.premium === 'string' && <span class="table-text">{row.premium}</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
</section>

<!-- ═══ OPTIONS ═══ -->
<section class="section section-alt" aria-labelledby="options-title">
  <div class="container">
    <div class="section-header reveal">
      <span class="accent-line"></span>
      <h2 id="options-title">Options disponibles</h2>
      <p>Disponibles sur Standard et Premium. À activer à tout moment.</p>
    </div>
    <div class="options-list reveal">
      {options.map((opt) => (
        <div class="card option-card">
          <div class="option-price">{opt.price}</div>
          <div>
            <h3 class="option-name">{opt.name}</h3>
            <p>{opt.desc}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
</section>

<!-- ═══ FAQ ═══ -->
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
        <a href="/contact" class="btn btn-primary">Prendre contact</a>
      </div>
    </div>
  </div>
</section>

</BaseLayout>
```

- [ ] **Step 2: Replace the `<style>` block**

Replace everything from `<style>` to the final `</style>` with:

```astro
<style>
  .hero-pricing { padding-top: 8rem; }

  .plan-section-header { margin-bottom: 2rem; }
  .plan-section-header h2 { font-size: 1.5rem; margin-top: 0.5rem; }
  .plan-section-note { font-size: 0.9375rem; color: var(--gray); margin-top: 0.5rem; max-width: 600px; }

  .launch-badge {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    background: rgba(245,158,11,0.15);
    color: #F59E0B;
    border-radius: 99px;
    font-size: 0.8125rem;
    font-weight: 600;
    letter-spacing: 0.03em;
  }

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

  .pricing-card-full h3 { font-size: 1.5rem; }
  .pricing-target { font-size: 0.875rem; color: var(--gray); margin-top: 0.25rem; }

  .price-monthly {
    font-size: 1rem;
    color: var(--gray-light);
    margin-top: -0.75rem;
    margin-bottom: 0.5rem;
  }

  .pricing-note {
    font-size: 0.8125rem;
    color: var(--gray);
    font-style: italic;
    margin-bottom: 0.25rem;
  }

  .pricing-condition {
    font-size: 0.8125rem;
    color: var(--gray);
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

  .options-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    max-width: 900px;
    margin: 0 auto;
  }

  .option-card {
    display: flex;
    align-items: flex-start;
    gap: 2rem;
    padding: 1.75rem;
  }

  .option-price {
    font-size: 1.0625rem;
    font-weight: 700;
    color: var(--primary);
    white-space: nowrap;
    flex-shrink: 0;
    min-width: 220px;
  }

  .option-name { font-size: 1rem; margin-bottom: 0.375rem; }

  .faq-container { max-width: 800px; }

  .cta-section {
    background: linear-gradient(135deg, rgba(46, 139, 240, 0.08) 0%, rgba(46, 139, 240, 0.02) 100%);
    border-top: 1px solid rgba(46, 139, 240, 0.15);
  }

  @media (max-width: 768px) {
    .pricing-grid { grid-template-columns: 1fr; }
    .option-card { flex-direction: column; gap: 0.75rem; }
    .option-price { min-width: unset; }
  }
</style>
```

- [ ] **Step 3: Run build**

```powershell
npm run build
```
Expected: no errors.

- [ ] **Step 4: Commit**

```powershell
git add src/pages/pricing.astro
git commit -m "feat(pricing): 4 plans + 2 tableaux comparatifs + section options"
```

---

## Task 3: features.astro — Replace categories data + update meta

**Files:**
- Modify: `src/pages/features.astro`

- [ ] **Step 1: Replace the entire frontmatter block (lines 1–56)**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';

const categories = [
  {
    id: 'onboarding',
    title: 'Automatisation & onboarding',
    icon: '<path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.82a19.79 19.79 0 01-3.07-8.63A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/>',
    features: [
      { name: 'Email J0 — Bienvenue & accès', desc: "Envoyé dès la confirmation Stripe. Contient vos identifiants d'accès et un mot de bienvenue." },
      { name: 'Email J3 — Premier check-in', desc: "Check-in automatique à J+3 pour s'assurer que l'élève a bien démarré et lui proposer une ressource." },
      { name: 'Email J7 — Bilan première semaine', desc: "Suivi de progression à J+7, entièrement personnalisable depuis votre portail." },
      { name: 'Envoi de test', desc: "Prévisualisez n'importe quel template en vous l'envoyant à vous-même avant tout envoi réel." },
      { name: 'Envoi manuel', desc: "Déclenchez un email spécifique à un élève depuis le portail, quand vous le décidez." },
      { name: 'Mode pause global', desc: "Stoppez toutes les campagnes en un clic — utile pendant une fermeture ou une refonte." },
    ],
  },
  {
    id: 'impayes',
    title: 'Récupération & impayés',
    icon: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    features: [
      { name: 'Relance J+1 — Rappel doux', desc: "Ton empathique, lien de paiement direct. Envoyé 24h après l'échec de paiement." },
      { name: 'Relance J+3 — Ton direct', desc: "Si aucun paiement à J+3, email plus direct avec sentiment d'urgence modéré." },
      { name: 'Relance J+7 — Avertissement final', desc: "Dernier email avant suspension. L'élève est informé clairement des conséquences." },
      { name: 'Suspension et reprise automatiques', desc: "Sans réponse à J+7, accès suspendu. Rétabli automatiquement dès le prochain paiement réussi." },
      { name: 'Pré-dunning CB expirant (Premium)', desc: "AEVUM détecte les cartes bancaires de vos élèves qui expirent dans 14 jours et envoie automatiquement un email préventif avant que le paiement échoue." },
    ],
  },
  {
    id: 'client',
    title: 'Connaissance client',
    icon: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/>',
    features: [
      { name: 'Dashboard stats ROI', desc: "Montant récupéré, taux de recouvrement, taux d'ouverture, taux de clic — en temps réel." },
      { name: 'Tracking ouvertures & clics', desc: "Pixel de suivi et redirections traçées pour mesurer l'engagement réel de vos élèves." },
      { name: 'Page élèves complète', desc: "Liste de tous vos élèves avec filtres par statut, historique individuel et badges ouvert/cliqué." },
      { name: 'Multi-formations', desc: "Gérez plusieurs formations depuis un seul compte — chaque formation a ses propres séquences et élèves." },
      { name: 'Blacklist emails', desc: "Bloquez définitivement un email de toute communication AEVUM en un clic." },
    ],
  },
  {
    id: 'fidelisation',
    title: 'Fidélisation & réputation',
    icon: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
    features: [
      { name: 'Détection churn + re-engagement (Premium)', desc: "Repère automatiquement les élèves silencieux depuis 21 jours et déclenche une relance personnalisée." },
      { name: 'Coaching élèves inactifs (Premium)', desc: "Si aucune ouverture depuis 14 jours, AEVUM envoie une relance pédagogique pour ramener l'élève dans la formation." },
      { name: 'Demandes de témoignage automatiques', desc: "Email à J+30 et J+60 avec lien vers votre formulaire personnalisé — vos avis arrivent sans que vous les demandiez." },
      { name: 'Guide deliverability intégré', desc: "Guide pas-à-pas SPF/DKIM/DMARC directement dans votre portail pour maximiser la délivrabilité de vos emails." },
    ],
  },
  {
    id: 'multicanal',
    title: 'Multi-canal & IA avancée',
    icon: '<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>',
    features: [
      { name: 'WhatsApp Business (Premium)', desc: "Envoyez chaque template en parallèle par WhatsApp via votre propre compte Business." },
      { name: 'SMS multi-canal (Premium)', desc: "Corps court 160 caractères par template, envoyé via numéro AEVUM Twilio." },
      { name: 'Rapport vidéo IA hebdomadaire (Premium)', desc: "Chaque lundi, une vidéo 60-90s voix off IA avec slides résumant la semaine — sans rien faire de votre côté." },
      { name: 'Automatisations personnalisées illimitées', desc: "Créez vos propres séquences email (upsell, re-engagement, cross-sell) activables/désactivables en un clic." },
      { name: 'Récupération vocale IA (Option)', desc: "Agent vocal IA qui rappelle l'élève pour récupérer un impayé ou closer une vente. Disponible en option sur Standard et Premium." },
    ],
  },
];
---
```

- [ ] **Step 2: Update the template — rename `pillars` → `categories`, update h1 and subtitle**

In the template section, make these 3 targeted replacements:

Replace:
```astro
  title="Fonctionnalités — AEVUM"
  description="Les 3 piliers d'AEVUM : onboarding automatique J0/J3/J7, récupération impayés et rapport hebdomadaire lundi 8h."
```
With:
```astro
  title="Fonctionnalités — AEVUM"
  description="Les 5 domaines d'AEVUM : automatisation onboarding, récupération impayés, connaissance client, fidélisation et multi-canal. Un seul système."
```

Replace:
```astro
      <h1 id="features-title">Les 4 piliers d'AEVUM</h1>
      <p>Onboarding, impayés, rapport hebdo, automatisations custom. Un seul système.</p>
```
With:
```astro
      <h1 id="features-title">Les 5 piliers d'AEVUM</h1>
      <p>Onboarding, impayés, connaissance client, fidélisation, multi-canal. Un seul système.</p>
```

Replace:
```astro
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
```
With:
```astro
    {categories.map((cat) => (
      <div class="feature-category reveal" id={`cat-${cat.id}`}>
        <div class="category-header">
          <div class="icon-box">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" set:html={cat.icon} />
          </div>
          <h2>{cat.title}</h2>
        </div>
        <div class="grid-3 feature-grid">
          {cat.features.map((feat) => (
            <div class="card feature-card">
              <h3>{feat.name}</h3>
              <p>{feat.desc}</p>
            </div>
          ))}
        </div>
      </div>
    ))}
```

- [ ] **Step 3: Run build**

```powershell
npm run build
```
Expected: no errors.

- [ ] **Step 4: Commit**

```powershell
git add src/pages/features.astro
git commit -m "feat(features): 5 catégories + 25 features (piliers enrichis + 18 nouvelles)"
```

---

## Task 4: index.astro — Update pillar cards + pricing preview

**Files:**
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Update the 4 pillar cards (section "Les 4 piliers d'AEVUM")**

Replace the 4 `<div class="card card--...">` blocks inside `<div class="grid-4">` with:

```astro
      <div class="card card--blue reveal">
        <div class="icon-box">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.82a19.79 19.79 0 01-3.07-8.63A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/></svg>
        </div>
        <h3>Onboarding automatique</h3>
        <p>Dès qu'un paiement Stripe arrive, votre élève reçoit ses emails J0, J3 et J7 — rédigés avec vos mots. Personnalisez chaque template depuis votre portail, lancez un envoi de test, ou déclenchez un email manuel en cas de besoin.</p>
      </div>
      <div class="card card--purple reveal">
        <div class="icon-box">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        </div>
        <h3>Récupération impayés</h3>
        <p>Paiement échoué ? Les relances partent à J+1, J+3, J+7 avec un ton progressif. Suspension automatique si aucune réponse. Et si la CB de votre élève expire dans 14 jours, AEVUM l'avertit avant l'échec. (Premium)</p>
      </div>
      <div class="card card--green reveal">
        <div class="icon-box">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
        </div>
        <h3>Dashboard & stats ROI</h3>
        <p>Montant récupéré, taux de recouvrement, taux d'ouverture et de clic — en temps réel. Suivez vos élèves un par un, filtrez par statut, et consultez l'historique complet de chaque action.</p>
      </div>
      <div class="card card--amber reveal">
        <div class="icon-box">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>
        </div>
        <h3>Portail complet</h3>
        <p>Éditez vos templates (manuellement ou avec l'IA), gérez plusieurs formations depuis un seul compte, blacklistez des emails, et accédez au guide SPF/DKIM/DMARC pour maximiser votre délivrabilité.</p>
      </div>
```

- [ ] **Step 2: Update the pricing preview section**

Replace the entire `<div class="pricing-preview-grid">` block with:

```astro
    <div class="pricing-preview-grid">
      <div class="card pricing-card reveal">
        <h3>Standard</h3>
        <p class="pricing-target">Configuration complète</p>
        <div class="price">
          <span class="price-amount">2 500€</span>
          <span class="price-period">setup</span>
        </div>
        <p class="price-monthly">+ 690€/mois</p>
        <a href="/pricing" class="btn btn-secondary">Voir le détail</a>
      </div>
      <div class="card pricing-card pricing-popular reveal">
        <span class="popular-tag">Recommandé</span>
        <h3>Premium</h3>
        <p class="pricing-target">Tout Standard + multi-canal & IA</p>
        <div class="price">
          <span class="price-amount">4 500€</span>
          <span class="price-period">setup</span>
        </div>
        <p class="price-monthly">+ 1 290€/mois</p>
        <a href="/pricing" class="btn btn-primary">Voir le détail</a>
      </div>
    </div>
```

- [ ] **Step 3: Run build**

```powershell
npm run build
```
Expected: no errors.

- [ ] **Step 4: Commit**

```powershell
git add src/pages/index.astro
git commit -m "feat(home): piliers enrichis + preview Standard/Premium"
```

---

## Task 5: comment-ca-marche.astro — Update 3 prose zones

**Files:**
- Modify: `src/pages/comment-ca-marche.astro`

- [ ] **Step 1: Update étape 2 "On configure tout"**

Replace:
```astro
        <p>On paramètre vos séquences d'onboarding (J0/J3/J7), vos templates de relance impayés et la fréquence de votre rapport hebdo selon vos instructions.</p>
```
With:
```astro
        <p>On paramètre vos séquences d'onboarding (J0/J3/J7), vos templates de relance impayés, vos automatisations personnalisées et votre guide deliverability (SPF/DKIM/DMARC). Si vous gérez plusieurs formations, on configure chacune indépendamment depuis votre portail.</p>
```

- [ ] **Step 2: Update étape 3 "Vos emails partent seuls"**

Replace:
```astro
        <p>À partir de là, chaque paiement déclenche la bonne séquence. Vous vous concentrez sur votre contenu.</p>
```
With:
```astro
        <p>À partir de là, chaque événement Stripe déclenche la bonne séquence. Le tracking ouvertures & clics s'active automatiquement, et les automatisations avancées (pré-dunning, re-engagement, coaching inactifs) tournent en tâche de fond. Vous vous concentrez sur votre contenu.</p>
```

- [ ] **Step 3: Update flow détaillé — étape "J3, J7, lundi 8h"**

Replace:
```astro
          <p>Le système planifie automatiquement J3, J7, et ajoute l'élève à votre prochain rapport hebdo du lundi matin.</p>
```
With:
```astro
          <p>Le système planifie automatiquement J3, J7, suit les ouvertures et les clics, ajoute l'élève à votre prochain rapport du lundi matin — et si vous êtes sur Premium, les mêmes messages partent en parallèle sur WhatsApp et SMS.</p>
```

- [ ] **Step 4: Run build**

```powershell
npm run build
```
Expected: no errors.

- [ ] **Step 5: Commit**

```powershell
git add src/pages/comment-ca-marche.astro
git commit -m "feat(ccm): mise à jour étapes pour refléter produit complet"
```

---

## Task 6: Final verification

- [ ] **Step 1: Run full build**

```powershell
npm run build
```
Expected: no errors.

- [ ] **Step 2: Check no stale prices or plan names remain**

```powershell
Select-String -Path "src/pages/*.astro" -Pattern "500.mois|1 200|3 000.*setup|Starter|29." | Select-Object Filename, LineNumber, Line
```
Expected: no matches.

- [ ] **Step 3: Check all new prices are present**

```powershell
Select-String -Path "src/pages/pricing.astro" -Pattern "300|590|690|1 290|2 500|4 500" | Select-Object LineNumber, Line
```
Expected: all 6 price points found.

- [ ] **Step 4: Commit verification note (skip if nothing to fix)**

If Step 2 found matches, fix them and commit:
```powershell
git add src/pages/
git commit -m "fix(vitrine): supprimer anciens prix résiduels"
```
