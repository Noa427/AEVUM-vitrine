# Client Portal Sidebar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the marketing BaseLayout on all `/client/*` pages with a dedicated `ClientLayout` featuring a fixed 220px sidebar, and implement missing functionality on each page (fmt fix, automation links, pagination, variable hints, email display, danger logout).

**Architecture:** New `src/layouts/ClientLayout.astro` is self-contained (redeclares all CSS tokens inline, no dependency on BaseLayout). Each of the 4 client pages is updated to use it. Page-level changes are isolated to their own tasks. BaseLayout and login.astro are untouched.

**Tech Stack:** Astro 6, TypeScript strict, CSS variables, vanilla JS (no framework), `@astrojs/vercel` adapter.

---

## File Map

| Action | File |
|---|---|
| Create | `src/layouts/ClientLayout.astro` |
| Modify | `src/pages/client/dashboard.astro` |
| Modify | `src/pages/client/history.astro` |
| Modify | `src/pages/client/customize.astro` |
| Modify | `src/pages/client/settings.astro` |
| No change | `src/layouts/BaseLayout.astro` |
| No change | `src/pages/login.astro` |

---

## Task 1: Create `src/layouts/ClientLayout.astro`

**Files:**
- Create: `src/layouts/ClientLayout.astro`

- [ ] **Step 1: Write the complete file**

Create `src/layouts/ClientLayout.astro` with this exact content:

```astro
---
export interface Props {
  title: string;
  description: string;
  canonical?: string;
  email: string;
}

const { title, description, canonical, email } = Astro.props;
const siteUrl = 'https://aevum.fr';
const fullCanonical = canonical ? `${siteUrl}${canonical}` : siteUrl + Astro.url.pathname;
const p = Astro.url.pathname;
---

<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{title}</title>
  <meta name="description" content={description} />
  <link rel="canonical" href={fullCanonical} />
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <meta name="theme-color" content="#0a0a0f" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,300..900;1,14..32,300..900&display=swap" rel="stylesheet" />
</head>
<body data-mode="dark">

  <!-- Mobile topbar -->
  <div class="cl-topbar" aria-hidden="true">
    <a href="/client/dashboard" class="cl-topbar__brand">AEVUM<span class="cl-brand__dot"></span></a>
    <button class="cl-hamburger" id="cl-hamburger" aria-label="Ouvrir le menu" aria-expanded="false" aria-controls="cl-sidebar">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
        <line x1="3" y1="6" x2="21" y2="6"/>
        <line x1="3" y1="12" x2="21" y2="12"/>
        <line x1="3" y1="18" x2="21" y2="18"/>
      </svg>
    </button>
  </div>

  <!-- Sidebar overlay (mobile) -->
  <div class="cl-overlay" id="cl-overlay" aria-hidden="true"></div>

  <div class="cl-shell">

    <!-- Sidebar -->
    <aside class="cl-sidebar" id="cl-sidebar" aria-label="Navigation portail client">

      <a href="/client/dashboard" class="cl-brand" aria-label="AEVUM — Tableau de bord">
        AEVUM<span class="cl-brand__dot"></span>
      </a>

      <nav class="cl-nav">
        <a href="/client/dashboard" class:list={['cl-link', { 'cl-link--active': p === '/client/dashboard' || p === '/client' }]}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>
          Mon espace
        </a>
        <a href="/client/history" class:list={['cl-link', { 'cl-link--active': p.startsWith('/client/history') }]}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>
          Historique
        </a>
        <a href="/client/customize" class:list={['cl-link', { 'cl-link--active': p.startsWith('/client/customize') }]}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          Personnaliser
        </a>
        <a href="/client/settings" class:list={['cl-link', { 'cl-link--active': p.startsWith('/client/settings') }]}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          Paramètres
        </a>
      </nav>

      <div class="cl-sidebar__footer">
        <span class="cl-email" title={email}>{email}</span>
        <a href="/client/settings?logout=1" class="cl-logout">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Se déconnecter
        </a>
      </div>

    </aside>

    <!-- Main -->
    <main class="cl-main" id="main-content">
      <slot />
    </main>

  </div>

  <script>
    const hamburger = document.getElementById('cl-hamburger') as HTMLButtonElement | null;
    const sidebar   = document.getElementById('cl-sidebar');
    const overlay   = document.getElementById('cl-overlay');
    function toggleMenu(open: boolean) {
      sidebar?.classList.toggle('cl-sidebar--open', open);
      overlay?.classList.toggle('cl-overlay--visible', open);
      hamburger?.setAttribute('aria-expanded', String(open));
    }
    hamburger?.addEventListener('click', () => {
      const isOpen = hamburger.getAttribute('aria-expanded') === 'true';
      toggleMenu(!isOpen);
    });
    overlay?.addEventListener('click', () => toggleMenu(false));
  </script>

</body>
</html>

<style is:global>
/* =========================================================================
   AEVUM v3 — Client portal global styles (self-contained copy of BaseLayout tokens)
   ========================================================================= */

:root {
  --bg: #0a0a0f;
  --bg-1: #12151f;
  --bg-2: #1a1a1a;
  --bg-3: #242424;
  --paper: #0f0f0f;
  --ink: #fafafa;
  --fg: #fafafa;
  --fg-2: #d8d8d8;
  --fg-3: #b0b0b0;
  --fg-muted: #888888;
  --fg-soft: #666666;
  --fg-faint: #404040;
  --accent: #ffffff;
  --accent-2: #f0f0f0;
  --accent-3: #d8d8d8;
  --accent-soft: rgba(255,255,255,0.08);
  --accent-line: rgba(255,255,255,0.20);
  --glow-1: rgba(143,168,255,0.45);
  --line: rgba(255,255,255,0.07);
  --line-2: rgba(255,255,255,0.14);
  --line-3: rgba(255,255,255,0.28);
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.4);
  --shadow-md: 0 8px 24px -8px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.04) inset;
  --shadow-lg: 0 32px 64px -24px rgba(0,0,0,0.8), 0 1px 0 rgba(255,255,255,0.05) inset;
  --sans: 'Inter', ui-sans-serif, -apple-system, BlinkMacSystemFont, sans-serif;
  --maxw: 1280px;
  --pad-x: clamp(20px, 4vw, 56px);
  --r-sm: 8px;
  --r-md: 14px;
  --r-lg: 16px;
  --r-xl: 28px;
  --ease: cubic-bezier(.22,.61,.36,1);
  --ease-out: cubic-bezier(.16,1,.3,1);
  /* legacy aliases used by client pages */
  --dark: var(--bg);
  --dark-soft: var(--bg-1);
  --dark-card: var(--bg-2);
  --dark-elevated: var(--bg-3);
  --light: var(--fg);
  --gray: var(--fg-muted);
  --gray-light: var(--fg-3);
  --gray-border: var(--line);
  --primary: var(--accent);
  --primary-hover: var(--accent-2);
  --primary-light: var(--accent-soft);
  --radius: var(--r-md);
  --radius-sm: var(--r-sm);
  --radius-lg: var(--r-lg);
  --transition: .25s var(--ease);
  --shadow-card: var(--shadow-md);
  --success: #10B981;
  --success-light: rgba(16,185,129,0.12);
}

*, *::before, *::after { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
html { scroll-behavior: smooth; }

body {
  font-family: var(--sans);
  background: var(--bg);
  color: var(--fg);
  font-size: 16px;
  line-height: 1.55;
  -webkit-font-smoothing: antialiased;
  overflow-x: hidden;
}

body::before {
  content: '';
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background-image:
    linear-gradient(var(--line) 1px, transparent 1px),
    linear-gradient(90deg, var(--line) 1px, transparent 1px);
  background-size: 96px 96px;
  background-position: -1px -1px;
  mask-image: radial-gradient(ellipse 80% 60% at center 20%, black 0%, transparent 75%);
  -webkit-mask-image: radial-gradient(ellipse 80% 60% at center 20%, black 0%, transparent 75%);
  opacity: 0.6;
}

a { color: inherit; text-decoration: none; }
button { font: inherit; cursor: pointer; }
ul, ol { list-style: none; padding: 0; margin: 0; }
img, svg { display: block; max-width: 100%; }
::selection { background: var(--fg); color: var(--bg); }
h1, h2, h3, h4 { margin: 0; font-weight: 400; color: var(--fg); }

.container {
  max-width: 960px;
  margin: 0 auto;
  padding-left: 0;
  padding-right: 0;
  position: relative;
}

.section {
  padding-top: 2rem;
  padding-bottom: 4rem;
  position: relative;
}

.accent-line {
  display: block;
  width: 40px;
  height: 2px;
  background: var(--accent);
  border-radius: 2px;
  opacity: 0.5;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 14px 22px;
  border-radius: 999px;
  border: 1px solid transparent;
  font-family: var(--sans);
  font-size: 15px;
  font-weight: 500;
  letter-spacing: -0.005em;
  transition: transform .3s var(--ease), background .25s, color .25s, border-color .25s, box-shadow .3s;
  white-space: nowrap;
  cursor: pointer;
  text-decoration: none;
}
.btn-primary, .btn--primary {
  background: var(--ink);
  color: var(--bg);
  border-color: transparent;
  box-shadow: var(--shadow-sm);
}
.btn-primary:hover, .btn--primary:hover { transform: translateY(-1px); box-shadow: 0 12px 28px -10px rgba(255,255,255,0.15); }
.btn-secondary, .btn--ghost {
  background: transparent;
  color: var(--fg);
  border-color: var(--line-2);
}
.btn-secondary:hover, .btn--ghost:hover { border-color: var(--ink); transform: translateY(-1px); }
.btn:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }

/* Cards */
.card {
  background: var(--bg-1);
  border: 1px solid var(--line);
  border-radius: var(--r-lg);
  padding: clamp(20px, 2.5vw, 32px);
  transition: transform .35s var(--ease), border-color .35s, box-shadow .35s;
  position: relative;
}
.card:hover {
  transform: translateY(-2px);
  border-color: var(--line-2);
  box-shadow: var(--shadow-md);
}

/* Grids */
.grid-2 { display: grid; grid-template-columns: repeat(2,1fr); gap: 1.5rem; }
.grid-3 { display: grid; grid-template-columns: repeat(3,1fr); gap: 1.5rem; }

/* Forms */
.form-group { display: flex; flex-direction: column; gap: 0.5rem; }
.form-label { font-size: 12px; font-weight: 500; color: var(--fg-muted); letter-spacing: -0.005em; }
.form-input {
  font-family: var(--sans);
  font-size: 15px;
  background: var(--bg-2);
  border: 1px solid var(--line);
  border-radius: var(--r-sm);
  padding: 13px 16px;
  color: var(--fg);
  transition: border-color .2s, box-shadow .2s;
  outline: none;
  width: 100%;
}
.form-input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(255,255,255,0.08); }
.form-input::placeholder { color: var(--fg-soft); }
.form-input:disabled { opacity: 0.6; cursor: not-allowed; }
textarea.form-input { resize: vertical; min-height: 120px; }

/* Messages */
.success-msg {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  background: rgba(16,185,129,0.08);
  border: 1px solid rgba(16,185,129,0.25);
  border-radius: var(--r-sm);
  color: #34D399;
  font-weight: 600;
  margin-bottom: 1rem;
}

/* ── Client Shell ── */
.cl-shell {
  min-height: 100vh;
}

/* ── Sidebar ── */
.cl-sidebar {
  position: fixed;
  top: 0;
  left: 0;
  width: 220px;
  height: 100vh;
  background: var(--bg-1);
  border-right: 1px solid var(--line);
  display: flex;
  flex-direction: column;
  padding: 1.75rem 1.25rem;
  z-index: 40;
  overflow-y: auto;
}

.cl-brand {
  display: inline-flex;
  align-items: baseline;
  gap: 5px;
  font-size: 17px;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: #fafafa;
  margin-bottom: 2rem;
  flex-shrink: 0;
}
.cl-brand__dot {
  width: 7px; height: 7px;
  border-radius: 50%;
  background: #ffffff;
  display: inline-block;
  transform: translateY(-1px);
  box-shadow: 0 0 12px rgba(140,170,255,0.7), 0 0 24px rgba(180,140,255,0.4);
}

.cl-nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

.cl-link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-radius: var(--r-sm);
  font-size: 14px;
  font-weight: 500;
  color: var(--fg-muted);
  transition: color .2s, background .2s;
  text-decoration: none;
}
.cl-link svg { flex-shrink: 0; }
.cl-link:hover { color: var(--fg); background: var(--accent-soft); }
.cl-link--active { color: var(--fg); background: rgba(255,255,255,0.08); }

.cl-sidebar__footer {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 1.25rem;
  border-top: 1px solid var(--line);
  margin-top: auto;
}

.cl-email {
  font-size: 12px;
  color: var(--fg-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cl-logout {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 500;
  color: var(--fg-muted);
  padding: 7px 10px;
  border-radius: var(--r-sm);
  transition: color .2s, background .2s;
}
.cl-logout:hover { color: #EF4444; background: rgba(239,68,68,0.08); }

/* ── Main ── */
.cl-main {
  margin-left: 220px;
  padding: 2.5rem 2.5rem;
  min-height: 100vh;
  position: relative;
  z-index: 1;
}

/* ── Mobile topbar (hidden on desktop) ── */
.cl-topbar {
  display: none;
  position: fixed;
  top: 0; left: 0; right: 0;
  height: 56px;
  background: rgba(10,10,15,0.92);
  backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--line);
  align-items: center;
  justify-content: space-between;
  padding: 0 1.25rem;
  z-index: 50;
}
.cl-topbar__brand {
  display: inline-flex;
  align-items: baseline;
  gap: 5px;
  font-size: 16px;
  font-weight: 600;
  color: #fafafa;
}
.cl-hamburger {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px; height: 36px;
  border-radius: 50%;
  border: 1px solid var(--line-2);
  background: transparent;
  color: var(--fg-muted);
  transition: background .2s, color .2s;
}
.cl-hamburger:hover { background: var(--accent-soft); color: var(--fg); }

/* ── Overlay ── */
.cl-overlay {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  z-index: 35;
}
.cl-overlay--visible { display: block; }

/* ── Mobile breakpoint ── */
@media (max-width: 860px) {
  .cl-topbar { display: flex; }
  .cl-shell { grid-template-columns: 1fr; }
  .cl-sidebar {
    transform: translateX(-220px);
    transition: transform .3s var(--ease);
  }
  .cl-sidebar--open { transform: translateX(0); }
  .cl-main {
    margin-left: 0;
    padding-top: calc(56px + 1.5rem);
  }
}

@media (max-width: 600px) {
  .cl-main { padding: calc(56px + 1.25rem) 1.25rem 2rem; }
  .grid-2, .grid-3 { grid-template-columns: 1fr; }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { transition-duration: .001ms !important; }
}
</style>
```

- [ ] **Step 2: Run build to verify TypeScript + Astro compile**

```bash
npm run build
```

Expected: `[build] Complete!` with no errors. (Warnings about `/demo` and `/download` empty bodies are normal — they are redirects.)

- [ ] **Step 3: Commit**

```bash
git add src/layouts/ClientLayout.astro
git commit -m "feat: add ClientLayout — sidebar portail client"
```

---

## Task 2: Update `dashboard.astro`

**Files:**
- Modify: `src/pages/client/dashboard.astro`

**Changes:** (1) swap layout, (2) `fmt()` returns `'0'` for null/undefined, (3) non-configured automation cards become `<a>` links to `/client/customize`, (4) remove "Accès rapide" section 4, (5) remove excess padding-top.

- [ ] **Step 1: Replace the entire file content**

```astro
---
export const prerender = false;
import ClientLayout from '../../layouts/ClientLayout.astro';
import { getClientFromCookie } from '../../lib/auth';

const auth = await getClientFromCookie(Astro.request);
if (!auth) return Astro.redirect('/login');

const base = import.meta.env.AEVUM_URL;
const headers = { Authorization: `Bearer ${auth.token}` };

type StatsData = {
  emails_this_month?: number;
  total_emails?: number;
  recouvrement_envoyes?: number;
  upsells_envoyes?: number;
};
type AutomationData = {
  onboarding?: boolean;
  recouvrement?: boolean;
  support_ia?: boolean;
  upsell?: boolean;
};
type HistoryEntry = { date: string; action: string; details?: string };

let stats: StatsData | null = null;
let automations: AutomationData | null = null;
let recentHistory: HistoryEntry[] = [];

const [statsResult, autoResult, histResult] = await Promise.allSettled([
  fetch(`${base}/client/stats`, { headers }),
  fetch(`${base}/client/automations`, { headers }),
  fetch(`${base}/client/history?limit=5`, { headers }),
]);

const responses = [statsResult, autoResult, histResult];
const fulfilled = responses.filter((r): r is PromiseFulfilledResult<Response> => r.status === 'fulfilled');
if (fulfilled.some((r) => r.value.status === 401)) {
  Astro.cookies.delete('aevum_token', { path: '/' });
  return Astro.redirect('/login');
}

if (statsResult.status === 'fulfilled' && statsResult.value.ok) {
  stats = await statsResult.value.json();
}
if (autoResult.status === 'fulfilled' && autoResult.value.ok) {
  automations = await autoResult.value.json();
}
if (histResult.status === 'fulfilled' && histResult.value.ok) {
  const data = await histResult.value.json();
  recentHistory = Array.isArray(data) ? data : [];
}

function fmt(n: number | undefined): string {
  return n != null ? String(n) : '0';
}

function fmtDate(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '—' : d.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
}
---

<ClientLayout
  title="Mon espace — AEVUM"
  description="Tableau de bord de votre espace client AEVUM."
  canonical="/client/dashboard"
  email={auth.email}
>

<section class="section dash-section">
  <div class="container dash-container">

    <!-- Header -->
    <div class="dash-header">
      <span class="accent-line" style="margin:0 0 1rem"></span>
      <h1 style="font-size:clamp(1.5rem,3vw,2rem)">Mon espace</h1>
      <p style="margin-top:0.5rem">Bienvenue, {auth.email}</p>
    </div>

    <!-- SECTION 1 : Stats -->
    <div class="dash-block">
      <h2 class="block-title">Statistiques</h2>
      <div class="stats-grid">
        <div class="stat-card card">
          <p class="stat-label">Emails ce mois</p>
          <p class="stat-value">{fmt(stats?.emails_this_month)}</p>
        </div>
        <div class="stat-card card">
          <p class="stat-label">Total emails envoyés</p>
          <p class="stat-value">{fmt(stats?.total_emails)}</p>
        </div>
        <div class="stat-card card">
          <p class="stat-label">Relances impayés</p>
          <p class="stat-value">{fmt(stats?.recouvrement_envoyes)}</p>
        </div>
        <div class="stat-card card">
          <p class="stat-label">Upsells envoyés</p>
          <p class="stat-value">{fmt(stats?.upsells_envoyes)}</p>
        </div>
      </div>
    </div>

    <!-- SECTION 2 : Automatisations -->
    <div class="dash-block">
      <h2 class="block-title">Automatisations actives</h2>
      <div class="auto-grid">

        {automations?.onboarding ? (
          <div class="auto-card card">
            <p class="auto-name">Onboarding J0 / J3 / J7</p>
            <span class="auto-badge badge-actif">Actif</span>
          </div>
        ) : (
          <a href="/client/customize" class="auto-card auto-card--link card">
            <p class="auto-name">Onboarding J0 / J3 / J7</p>
            <span class="auto-badge badge-off">Non configuré →</span>
          </a>
        )}

        {automations?.recouvrement ? (
          <div class="auto-card card">
            <p class="auto-name">Recouvrement impayés</p>
            <span class="auto-badge badge-actif">Actif</span>
          </div>
        ) : (
          <a href="/client/customize" class="auto-card auto-card--link card">
            <p class="auto-name">Recouvrement impayés</p>
            <span class="auto-badge badge-off">Non configuré →</span>
          </a>
        )}

        {automations?.support_ia ? (
          <div class="auto-card card">
            <p class="auto-name">Support IA</p>
            <span class="auto-badge badge-actif">Actif</span>
          </div>
        ) : (
          <a href="/client/customize" class="auto-card auto-card--link card">
            <p class="auto-name">Support IA</p>
            <span class="auto-badge badge-off">Non configuré →</span>
          </a>
        )}

        {automations?.upsell ? (
          <div class="auto-card card">
            <p class="auto-name">Upsell J+30</p>
            <span class="auto-badge badge-actif">Actif</span>
          </div>
        ) : (
          <a href="/client/customize" class="auto-card auto-card--link card">
            <p class="auto-name">Upsell J+30</p>
            <span class="auto-badge badge-off">Non configuré →</span>
          </a>
        )}

      </div>
    </div>

    <!-- SECTION 3 : Dernières activités -->
    <div class="dash-block">
      <h2 class="block-title">Dernières activités</h2>
      {recentHistory.length === 0 ? (
        <div class="card" style="padding:1.5rem;color:var(--gray)">Aucune activité récente.</div>
      ) : (
        <div class="card" style="padding:0;overflow:hidden">
          <ul class="activity-list">
            {recentHistory.map((entry) => (
              <li class="activity-item">
                <span class="activity-date">{fmtDate(entry.date)}</span>
                <span class="activity-action">{entry.action}</span>
                {entry.details && <span class="activity-details">{entry.details}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>

  </div>
</section>

</ClientLayout>

<style>
  .dash-section { padding-top: 0; }
  .dash-container { max-width: 960px; }
  .dash-header { margin-bottom: 2.5rem; }
  .dash-header p { max-width: none; margin: 0; font-size: 1rem; color: var(--gray-light); }

  .dash-block { margin-bottom: 3rem; }
  .block-title { font-size: 1.125rem; font-weight: 700; margin-bottom: 1.25rem; color: var(--light); letter-spacing: -0.01em; }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem;
  }
  .stat-card { padding: 1.5rem; }
  .stat-label { font-size: 0.8125rem; color: var(--gray); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.75rem; max-width: none; }
  .stat-value { font-size: 2rem; font-weight: 700; color: var(--light); letter-spacing: -0.03em; }

  .auto-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }
  .auto-card { padding: 1.25rem 1.5rem; display: flex; align-items: center; justify-content: space-between; }
  .auto-card--link { text-decoration: none; color: inherit; }
  .auto-card--link:hover { border-color: var(--line-2); }
  .auto-name { font-size: 0.9375rem; color: var(--light); max-width: none; }
  .auto-badge {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 600;
    white-space: nowrap;
    flex-shrink: 0;
  }
  .badge-actif { background: var(--success-light); color: var(--success); }
  .badge-off { background: var(--dark-elevated); color: var(--gray); }

  .activity-list { list-style: none; }
  .activity-item {
    display: flex;
    align-items: baseline;
    gap: 1rem;
    padding: 0.875rem 1.5rem;
    border-bottom: 1px solid var(--gray-border);
    flex-wrap: wrap;
  }
  .activity-item:last-child { border-bottom: none; }
  .activity-date { font-size: 0.8125rem; color: var(--gray); white-space: nowrap; flex-shrink: 0; }
  .activity-action { font-size: 0.9375rem; color: var(--light); font-weight: 500; }
  .activity-details { font-size: 0.875rem; color: var(--gray-light); }

  @media (max-width: 768px) {
    .stats-grid { grid-template-columns: repeat(2, 1fr); }
    .auto-grid { grid-template-columns: 1fr; }
  }
  @media (max-width: 480px) {
    .stats-grid { grid-template-columns: 1fr; }
  }
</style>
```

- [ ] **Step 2: Run build**

```bash
npm run build
```

Expected: `[build] Complete!` with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/client/dashboard.astro
git commit -m "feat: dashboard — ClientLayout, fmt '0', automation links"
```

---

## Task 3: Update `history.astro`

**Files:**
- Modify: `src/pages/client/history.astro`

**Changes:** swap layout, update empty-state message, add client-side pagination (50/page when > 50 entries), remove back-link and excess padding-top.

- [ ] **Step 1: Replace the entire file content**

```astro
---
export const prerender = false;
import ClientLayout from '../../layouts/ClientLayout.astro';
import { getClientFromCookie } from '../../lib/auth';

const auth = await getClientFromCookie(Astro.request);
if (!auth) return Astro.redirect('/login');

type HistoryEntry = { date: string; action: string; details?: string };

let history: HistoryEntry[] = [];
let fetchError = '';

try {
  const res = await fetch(`${import.meta.env.AEVUM_URL}/client/history?limit=100`, {
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  if (res.status === 401) {
    Astro.cookies.delete('aevum_token', { path: '/' });
    return Astro.redirect('/login');
  }
  if (res.ok) {
    const data = await res.json();
    history = Array.isArray(data) ? data : [];
  } else {
    fetchError = "Impossible de charger l'historique.";
  }
} catch {
  fetchError = 'Erreur réseau. Réessayez.';
}

function fmtDate(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '—' : d.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
}
---

<ClientLayout
  title="Historique — AEVUM"
  description="Historique complet de vos activités AEVUM."
  canonical="/client/history"
  email={auth.email}
>

<section class="section history-section">
  <div class="container history-container">

    <div class="history-header">
      <span class="accent-line" style="margin:0 0 1rem"></span>
      <h1 style="font-size:clamp(1.5rem,3vw,2rem)">Historique d'activité</h1>
    </div>

    {fetchError && (
      <div class="hist-error" role="alert">{fetchError}</div>
    )}

    {!fetchError && history.length === 0 && (
      <div class="card" style="padding:2rem;color:var(--gray);text-align:center">
        Aucune activité pour le moment. Les automatisations apparaîtront ici dès le premier déclenchement.
      </div>
    )}

    {history.length > 0 && (
      <div class="card hist-card" style="padding:0;overflow:hidden">
        <table class="hist-table" id="hist-table" aria-label="Historique d'activité">
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">Type d'action</th>
              <th scope="col">Détails</th>
            </tr>
          </thead>
          <tbody>
            {history.map((entry) => (
              <tr>
                <td class="td-date">{fmtDate(entry.date)}</td>
                <td class="td-action">{entry.action}</td>
                <td class="td-details">{entry.details ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}

  </div>
</section>

</ClientLayout>

<script>
  const PAGE_SIZE = 50;
  const table = document.getElementById('hist-table');
  if (table) {
    const rows = Array.from(table.querySelectorAll<HTMLTableRowElement>('tbody tr'));
    if (rows.length > PAGE_SIZE) {
      let currentPage = 0;
      const totalPages = Math.ceil(rows.length / PAGE_SIZE);

      const pager = document.createElement('div');
      pager.className = 'hist-pager';
      pager.innerHTML = `
        <button class="btn btn-secondary hist-btn" id="hist-prev" disabled>← Précédent</button>
        <span class="hist-page-info" id="hist-info"></span>
        <button class="btn btn-secondary hist-btn" id="hist-next">Suivant →</button>
      `;
      table.closest('.hist-card')?.after(pager);

      const prevBtn = document.getElementById('hist-prev') as HTMLButtonElement;
      const nextBtn = document.getElementById('hist-next') as HTMLButtonElement;
      const infoEl  = document.getElementById('hist-info');

      function showPage(page: number) {
        rows.forEach((row, i) => {
          row.style.display = (i >= page * PAGE_SIZE && i < (page + 1) * PAGE_SIZE) ? '' : 'none';
        });
        currentPage = page;
        if (infoEl) infoEl.textContent = `Page ${page + 1} / ${totalPages}`;
        prevBtn.disabled = page === 0;
        nextBtn.disabled = page === totalPages - 1;
      }

      prevBtn.addEventListener('click', () => showPage(currentPage - 1));
      nextBtn.addEventListener('click', () => showPage(currentPage + 1));
      showPage(0);
    }
  }
</script>

<style>
  .history-section { padding-top: 0; }
  .history-container { max-width: 900px; }
  .history-header { margin-bottom: 2rem; }

  .hist-error {
    padding: 1rem 1.5rem;
    background: rgba(239,68,68,0.1);
    border: 1px solid #EF4444;
    border-radius: var(--radius-sm);
    color: #EF4444;
    margin-bottom: 1.5rem;
  }

  .hist-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9375rem;
  }
  .hist-table th {
    padding: 0.875rem 1.25rem;
    text-align: left;
    font-size: 0.8125rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--gray);
    border-bottom: 1px solid var(--gray-border);
    background: var(--dark-elevated);
  }
  .hist-table td {
    padding: 0.875rem 1.25rem;
    border-bottom: 1px solid var(--gray-border);
    vertical-align: top;
  }
  .hist-table tbody tr:last-child td { border-bottom: none; }
  .td-date { white-space: nowrap; color: var(--gray); font-size: 0.8125rem; width: 10rem; }
  .td-action { color: var(--light); font-weight: 500; }
  .td-details { color: var(--gray-light); }

  .hist-pager {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    margin-top: 1.5rem;
  }
  .hist-btn { padding: 10px 18px; font-size: 14px; }
  .hist-page-info { font-size: 0.875rem; color: var(--gray); min-width: 80px; text-align: center; }

  @media (max-width: 600px) {
    .hist-table th:last-child,
    .hist-table td:last-child { display: none; }
  }
</style>
```

- [ ] **Step 2: Run build**

```bash
npm run build
```

Expected: `[build] Complete!` with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/client/history.astro
git commit -m "feat: history — ClientLayout, pagination 50/page, empty-state message"
```

---

## Task 4: Update `customize.astro`

**Files:**
- Modify: `src/pages/client/customize.astro`

**Changes:** swap layout, add variable hints with click-to-insert badges below each textarea, remove back-link and excess padding-top.

- [ ] **Step 1: Replace the entire file content**

```astro
---
export const prerender = false;
import ClientLayout from '../../layouts/ClientLayout.astro';
import { getClientFromCookie } from '../../lib/auth';

const auth = await getClientFromCookie(Astro.request);
if (!auth) return Astro.redirect('/login');

const base = import.meta.env.AEVUM_URL;
const headers = { Authorization: `Bearer ${auth.token}` };

let successType = '';
let errorType = '';
let errorMsg = '';

if (Astro.request.method === 'POST') {
  const form = await Astro.request.formData();
  const configType = (form.get('config_type') as string ?? '').trim();
  const value = (form.get('value') as string ?? '');

  if (configType) {
    try {
      const res = await fetch(`${base}/client/configs`, {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ config_type: configType, value }),
      });
      if (res.status === 401) {
        Astro.cookies.delete('aevum_token', { path: '/' });
        return Astro.redirect('/login');
      }
      if (res.ok) {
        successType = configType;
      } else {
        const data = await res.json().catch(() => ({}));
        errorType = configType;
        errorMsg = data.message ?? data.error ?? 'Erreur lors de la sauvegarde.';
      }
    } catch {
      errorType = configType;
      errorMsg = 'Erreur réseau. Réessayez.';
    }
  }
}

type ConfigEntry = { config_type: string; value: string };
let configs: Record<string, string> = {};
let senderName = '';
let fetchError = '';

try {
  const [configsRes, autoRes] = await Promise.all([
    fetch(`${base}/client/configs`, { headers }),
    fetch(`${base}/client/automations`, { headers }),
  ]);

  if (configsRes.status === 401 || autoRes.status === 401) {
    Astro.cookies.delete('aevum_token', { path: '/' });
    return Astro.redirect('/login');
  }

  if (configsRes.ok) {
    const arr: ConfigEntry[] = await configsRes.json();
    if (Array.isArray(arr)) {
      for (const c of arr) configs[c.config_type] = c.value;
    }
  }
  if (autoRes.ok) {
    const auto = await autoRes.json();
    senderName = auto.sender_name ?? '';
  }
} catch {
  fetchError = 'Impossible de charger vos configurations. Réessayez.';
}

const VARIABLE_HINTS: Record<string, string[]> = {
  template_onboarding_j0: ['{{nom_client}}', '{{lien_acces}}', '{{nom_formateur}}'],
  template_onboarding_j3: ['{{nom_client}}', '{{lien_acces}}', '{{nom_formateur}}'],
  template_onboarding_j7: ['{{nom_client}}', '{{lien_acces}}', '{{nom_formateur}}'],
  template_failed_payment: ['{{nom_client}}', '{{montant}}', '{{lien_paiement}}'],
};

const CONFIG_TYPES = [
  { key: 'sender_name', label: "Nom d'expéditeur", multiline: false, defaultValue: senderName },
  { key: 'template_onboarding_j0', label: 'Email onboarding J0', multiline: true, defaultValue: '' },
  { key: 'template_onboarding_j3', label: 'Email onboarding J3', multiline: true, defaultValue: '' },
  { key: 'template_onboarding_j7', label: 'Email onboarding J7', multiline: true, defaultValue: '' },
  { key: 'template_failed_payment', label: 'Email relance impayé', multiline: true, defaultValue: '' },
] as const;
---

<ClientLayout
  title="Personnalisation — AEVUM"
  description="Personnalisez vos templates d'emails et votre nom d'expéditeur."
  canonical="/client/customize"
  email={auth.email}
>

<section class="section customize-section">
  <div class="container customize-container">

    <div class="customize-header">
      <span class="accent-line" style="margin:0 0 1rem"></span>
      <h1 style="font-size:clamp(1.5rem,3vw,2rem)">Personnaliser les templates</h1>
      <p style="margin-top:0.5rem;max-width:none;color:var(--gray-light)">Configurez vos emails envoyés automatiquement par AEVUM.</p>
    </div>

    {fetchError && (
      <div class="cust-error" role="alert">{fetchError}</div>
    )}

    {CONFIG_TYPES.map(({ key, label, multiline, defaultValue }) => {
      const currentValue = configs[key] ?? defaultValue;
      const isSuccess = successType === key;
      const isError = errorType === key;
      const hints = VARIABLE_HINTS[key];
      return (
        <div class="card cust-card" data-config={key}>
          <h2 class="cust-card-title">{label}</h2>
          {isSuccess && (
            <div class="success-msg" role="alert"><span>Sauvegardé avec succès.</span></div>
          )}
          {isError && (
            <div class="cust-field-error" role="alert">{errorMsg}</div>
          )}
          <form method="POST" class="cust-form">
            <input type="hidden" name="config_type" value={key} />
            {multiline ? (
              <>
                <textarea
                  name="value"
                  class="form-input cust-textarea"
                  rows={6}
                  placeholder={`Contenu de votre ${label.toLowerCase()}...`}
                >{currentValue}</textarea>
                {hints && (
                  <div class="cust-hints">
                    <p class="cust-hints-label">Variables disponibles — cliquez pour insérer :</p>
                    <div class="cust-hints-list">
                      {hints.map((v) => (
                        <code class="cust-hint" data-var={v}>{v}</code>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <input
                type="text"
                name="value"
                class="form-input"
                value={currentValue}
                placeholder="Ex : Jean Dupont"
              />
            )}
            <button type="submit" class="btn btn-primary" style="align-self:flex-start;margin-top:0.75rem">
              Sauvegarder
            </button>
          </form>
        </div>
      );
    })}

  </div>
</section>

</ClientLayout>

<script>
  document.querySelectorAll<HTMLElement>('.cust-hint').forEach((hint) => {
    hint.addEventListener('click', () => {
      const variable = hint.dataset.var;
      const card = hint.closest<HTMLElement>('.cust-card');
      const textarea = card?.querySelector<HTMLTextAreaElement>('textarea');
      if (!textarea || !variable) return;
      const start = textarea.selectionStart ?? textarea.value.length;
      const end = textarea.selectionEnd ?? textarea.value.length;
      textarea.value = textarea.value.substring(0, start) + variable + textarea.value.substring(end);
      textarea.selectionStart = textarea.selectionEnd = start + variable.length;
      textarea.focus();
    });
  });
</script>

<style>
  .customize-section { padding-top: 0; }
  .customize-container { max-width: 700px; }
  .customize-header { margin-bottom: 2.5rem; }

  .cust-error {
    padding: 1rem 1.5rem;
    background: rgba(239,68,68,0.1);
    border: 1px solid #EF4444;
    border-radius: var(--radius-sm);
    color: #EF4444;
    margin-bottom: 2rem;
  }
  .cust-field-error {
    padding: 0.75rem 1rem;
    background: rgba(239,68,68,0.1);
    border: 1px solid #EF4444;
    border-radius: var(--radius-sm);
    color: #EF4444;
    font-size: 0.875rem;
    margin-bottom: 1rem;
  }

  .cust-card { padding: 1.75rem 2rem; margin-bottom: 1.5rem; }
  .cust-card-title { font-size: 1rem; font-weight: 600; color: var(--light); margin-bottom: 1rem; }
  .cust-form { display: flex; flex-direction: column; }
  .cust-textarea { font-family: monospace; font-size: 0.875rem; resize: vertical; min-height: 130px; }

  .cust-hints { margin-top: 0.625rem; }
  .cust-hints-label { font-size: 0.75rem; color: var(--gray); margin-bottom: 0.4rem; }
  .cust-hints-list { display: flex; flex-wrap: wrap; gap: 0.375rem; }
  .cust-hint {
    font-size: 0.75rem;
    font-family: monospace;
    background: var(--dark-elevated);
    color: var(--gray-light);
    border: 1px solid var(--gray-border);
    border-radius: var(--radius-sm);
    padding: 0.2rem 0.5rem;
    cursor: pointer;
    transition: background .15s, color .15s;
    user-select: none;
  }
  .cust-hint:hover { background: var(--primary-light); color: var(--light); }
</style>
```

- [ ] **Step 2: Run build**

```bash
npm run build
```

Expected: `[build] Complete!` with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/client/customize.astro
git commit -m "feat: customize — ClientLayout, variable hints click-to-insert"
```

---

## Task 5: Update `settings.astro`

**Files:**
- Modify: `src/pages/client/settings.astro`

**Changes:** swap layout, add email read-only display at top, style logout button with danger theme and visual separator, remove back-link and excess padding-top.

- [ ] **Step 1: Replace the entire file content**

```astro
---
export const prerender = false;
import ClientLayout from '../../layouts/ClientLayout.astro';
import { getClientFromCookie } from '../../lib/auth';

const auth = await getClientFromCookie(Astro.request);
if (!auth) {
  return Astro.redirect('/login');
}

if (Astro.url.searchParams.get('logout') === '1') {
  Astro.cookies.delete('aevum_token', { path: '/' });
  return Astro.redirect('/login');
}

const forceChange = Astro.url.searchParams.get('force') === 'true';

let passwordMsg = '';
let passwordError = '';
let emailMsg = '';
let emailError = '';

if (Astro.request.method === 'POST') {
  const form = await Astro.request.formData();
  const action = form.get('action') as string;

  if (action === 'password') {
    const currentPassword = form.get('currentPassword') as string;
    const newPassword = form.get('newPassword') as string;
    const confirmNewPassword = form.get('confirmNewPassword') as string;

    if (newPassword !== confirmNewPassword) {
      passwordError = 'Les nouveaux mots de passe ne correspondent pas.';
    } else {
      try {
        const res = await fetch(`${import.meta.env.AEVUM_URL}/client/settings/password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${auth.token}`,
          },
          body: JSON.stringify({ currentPassword, newPassword }),
        });
        if (res.ok) {
          passwordMsg = 'Mot de passe mis à jour.';
        } else {
          const data = await res.json().catch(() => ({}));
          passwordError = data.message ?? data.error ?? 'Erreur lors du changement de mot de passe.';
        }
      } catch {
        passwordError = 'Une erreur est survenue, réessayez.';
      }
    }
  }

  if (action === 'email') {
    const currentPassword = form.get('currentPassword') as string;
    const newEmail = form.get('newEmail') as string;

    try {
      const res = await fetch(`${import.meta.env.AEVUM_URL}/client/settings/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({ currentPassword, newEmail }),
      });
      if (res.ok) {
        emailMsg = 'Email mis à jour.';
      } else {
        const data = await res.json().catch(() => ({}));
        emailError = data.message ?? data.error ?? "Erreur lors du changement d'email.";
      }
    } catch {
      emailError = 'Une erreur est survenue, réessayez.';
    }
  }
}
---

<ClientLayout
  title="Paramètres — AEVUM"
  description="Gérez votre mot de passe et votre adresse email."
  canonical="/client/settings"
  email={auth.email}
>

<section class="section settings-section">
  <div class="container settings-container">

    <div style="margin-bottom:2.5rem">
      <span class="accent-line" style="margin:0 0 1rem"></span>
      <h1 style="font-size:clamp(1.5rem,3vw,2rem)">Paramètres</h1>
    </div>

    {forceChange && (
      <div class="force-banner" role="alert">
        Vous devez changer votre mot de passe avant de continuer.
      </div>
    )}

    <!-- Email actuel -->
    <div class="card settings-card">
      <h2 class="settings-card-title">Email actuel</h2>
      <input
        type="text"
        value={auth.email}
        disabled
        class="form-input"
        aria-label="Email actuel (lecture seule)"
      />
    </div>

    <!-- Password form -->
    <div class="card settings-card">
      <h2 class="settings-card-title">Changer le mot de passe</h2>
      {passwordMsg && <div class="success-msg" role="alert"><span>{passwordMsg}</span></div>}
      {passwordError && <div class="settings-error" role="alert">{passwordError}</div>}
      <form method="POST" style="display:flex;flex-direction:column;gap:1.25rem">
        <input type="hidden" name="action" value="password" />
        <div class="form-group">
          <label for="pw-current" class="form-label">Mot de passe actuel</label>
          <input type="password" id="pw-current" name="currentPassword" class="form-input" required autocomplete="current-password" />
        </div>
        <div class="form-group">
          <label for="pw-new" class="form-label">Nouveau mot de passe</label>
          <input type="password" id="pw-new" name="newPassword" class="form-input" required autocomplete="new-password" />
        </div>
        <div class="form-group">
          <label for="pw-confirm" class="form-label">Confirmer le nouveau mot de passe</label>
          <input type="password" id="pw-confirm" name="confirmNewPassword" class="form-input" required autocomplete="new-password" />
        </div>
        <button type="submit" class="btn btn-primary" style="align-self:flex-start">Mettre à jour le mot de passe</button>
      </form>
    </div>

    <!-- Email form -->
    {!forceChange && (
      <div class="card settings-card">
        <h2 class="settings-card-title">Changer l'email</h2>
        {emailMsg && <div class="success-msg" role="alert"><span>{emailMsg}</span></div>}
        {emailError && <div class="settings-error" role="alert">{emailError}</div>}
        <form method="POST" style="display:flex;flex-direction:column;gap:1.25rem">
          <input type="hidden" name="action" value="email" />
          <div class="form-group">
            <label for="email-pw" class="form-label">Mot de passe actuel</label>
            <input type="password" id="email-pw" name="currentPassword" class="form-input" required autocomplete="current-password" />
          </div>
          <div class="form-group">
            <label for="email-new" class="form-label">Nouvel email</label>
            <input type="email" id="email-new" name="newEmail" class="form-input" placeholder="nouveau@exemple.fr" required autocomplete="email" />
          </div>
          <button type="submit" class="btn btn-primary" style="align-self:flex-start">Mettre à jour l'email</button>
        </form>
      </div>
    )}

    <!-- Logout -->
    <div class="settings-logout-section">
      <hr class="settings-divider" />
      <h2 class="settings-card-title">Déconnexion</h2>
      <p style="color:var(--gray-light);font-size:0.9375rem;margin:0.5rem 0 1.5rem">
        Vous serez redirigé vers la page de connexion.
      </p>
      <a href="/client/settings?logout=1" class="btn btn-logout">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        Se déconnecter
      </a>
    </div>

  </div>
</section>

</ClientLayout>

<style>
  .settings-section { padding-top: 0; }
  .settings-container { max-width: 600px; }
  .settings-card { padding: 2rem; margin-bottom: 1.5rem; }
  .settings-card-title { font-size: 1.0625rem; font-weight: 600; color: var(--light); margin-bottom: 1.25rem; }

  .force-banner {
    padding: 1rem 1.5rem;
    background: rgba(234,179,8,0.12);
    border: 1px solid #ca8a04;
    border-radius: var(--radius-sm);
    color: #ca8a04;
    font-weight: 500;
    margin-bottom: 2rem;
  }
  .settings-error {
    padding: 0.875rem 1.25rem;
    background: rgba(239,68,68,0.1);
    border: 1px solid #EF4444;
    border-radius: var(--radius-sm);
    color: #EF4444;
    font-size: 0.9375rem;
    margin-bottom: 1rem;
  }

  .settings-logout-section { margin-top: 1rem; }
  .settings-divider {
    border: none;
    border-top: 1px solid var(--gray-border);
    margin: 0 0 2rem;
  }
  .btn-logout {
    background: rgba(239,68,68,0.10);
    color: #EF4444;
    border-color: rgba(239,68,68,0.28);
    border-radius: 999px;
  }
  .btn-logout:hover {
    background: rgba(239,68,68,0.18);
    border-color: #EF4444;
    transform: translateY(-1px);
  }
</style>
```

- [ ] **Step 2: Run build**

```bash
npm run build
```

Expected: `[build] Complete!` with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/client/settings.astro
git commit -m "feat: settings — ClientLayout, email readonly, danger logout button"
```

---

## Task 6: Final build + smoke checklist

- [ ] **Step 1: Full clean build**

```bash
npm run build
```

Expected: `[build] Complete!` — zero TypeScript errors, zero Astro errors.

- [ ] **Step 2: Run tests**

```bash
npm test
```

Expected: `Tests 6 passed (6)`.

- [ ] **Step 3: Dev server smoke test**

```bash
npm run dev
```

Open the following URLs and verify each item:

| URL | Check |
|---|---|
| `/login` | BaseLayout still renders (marketing nav visible) |
| `/client/dashboard` | Sidebar visible, stats show `0` not `—`, non-configured automations are links to `/client/customize` |
| `/client/history` | Sidebar visible, table renders; if > 50 rows, pagination controls appear |
| `/client/customize` | Sidebar visible, variable hint badges appear below textareas, clicking a badge inserts the variable |
| `/client/settings` | Sidebar visible, email read-only field at top, red logout button at bottom |
| Mobile (< 860px) | Sidebar hidden, topbar visible with hamburger, tapping hamburger opens sidebar drawer |

- [ ] **Step 4: Commit verification**

```bash
git log --oneline -6
```

Expected — 5 feature commits visible:
```
feat: settings — ClientLayout, email readonly, danger logout button
feat: customize — ClientLayout, variable hints click-to-insert
feat: history — ClientLayout, pagination 50/page, empty-state message
feat: dashboard — ClientLayout, fmt '0', automation links
feat: add ClientLayout — sidebar portail client
```
