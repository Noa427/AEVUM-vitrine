# Phase 2 Features 8–12 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add email tracking stats, multi-formation support, a deliverability guide, checkout abandon emails, and testimonial request emails to the AEVUM client portal.

**Architecture:** Five independent features all following existing patterns — SSR Astro pages with auth guards, proxy API routes forwarding to backend with Bearer token, and inline `<style>` blocks. F9 (multi-formation) is the most cross-cutting: it adds a cookie-based formation selector to ClientLayout and propagates `X-Formation-Id` headers to all client pages.

**Tech Stack:** Astro 6, TypeScript strict, CSS pur, `getClientFromCookie()` from `src/lib/auth.ts`, `jsonRes()` from `src/lib/api.ts`.

---

## File Map

**Created:**
- `src/pages/api/formation-create.ts` — POST proxy to `/client/formations`
- `src/pages/api/formation-update.ts` — PUT proxy to `/client/formations/:id`
- `src/pages/api/formation-delete.ts` — DELETE proxy to `/client/formations/:id`
- `src/pages/client/formations.astro` — Formations management page
- `src/pages/client/deliverability.astro` — 5-step deliverability guide

**Modified:**
- `src/pages/client/dashboard.astro` — F8 (2 new stat-cards) + F9 (X-Formation-Id header)
- `src/pages/client/students.astro` — F8 (engagement icons in drawer) + F9 (X-Formation-Id)
- `src/pages/client/history.astro` — F9 (X-Formation-Id header)
- `src/pages/client/blacklist.astro` — F9 (X-Formation-Id header)
- `src/pages/client/customize.astro` — F9 (X-Formation-Id) + F11 (checkout abandon) + F12 (testimonials)
- `src/layouts/ClientLayout.astro` — F9 (formation selector + sidebar link) + F10 (deliverability link + prefetch)
- `src/pages/client/settings.astro` — F10 (deliverability card)

---

## Task 1 — F8: Dashboard tracking stat-cards

**Files:**
- Modify: `src/pages/client/dashboard.astro`

- [ ] **Step 1: Extend StatsData type**

In `dashboard.astro` lines 12-19, extend `StatsData`:

```typescript
type StatsData = {
  emails_this_month?: number;
  total_emails?: number;
  recouvrement_envoyes?: number;
  upsells_envoyes?: number;
  recouvrement_montant_recupere?: number;
  recouvrement_taux?: number;
  open_rate_this_month?: number;
  click_rate_this_month?: number;
};
```

- [ ] **Step 2: Add two stat-cards after the "Taux de récupération" card**

In `dashboard.astro`, after the `</div>` that closes the `.stat-card` for "Taux de récupération" (currently the last card, around line 170), add:

```astro
        <div class="stat-card card">
          <p class="stat-label">Taux d'ouverture</p>
          <p class="stat-value">{stats?.open_rate_this_month ?? 0} %</p>
          <p class="stat-period">30 derniers jours</p>
        </div>
        <div class="stat-card card">
          <p class="stat-label">Taux de clic</p>
          <p class="stat-value">{stats?.click_rate_this_month ?? 0} %</p>
          <p class="stat-period">30 derniers jours</p>
        </div>
```

- [ ] **Step 3: Add `.stat-period` CSS**

In the `<style>` block of `dashboard.astro`, find `.stat-label` and add after it:

```css
.stat-period { font-size: 0.6875rem; color: var(--gray); margin-top: 0.25rem; text-transform: none; letter-spacing: 0; }
```

- [ ] **Step 4: Verify build**

```bash
npm run build
```

Expected: no TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add src/pages/client/dashboard.astro
git commit -m "feat(tracking): add open rate/click rate stat cards to dashboard (F8)"
```

---

## Task 2 — F8: Students drawer engagement icons

**Files:**
- Modify: `src/pages/client/students.astro`

- [ ] **Step 1: Extend `EmailHistoryEntry` type in students.astro**

Find the type definition for email history items (look for `type` with `date`, `type`, `subject` fields). Add `opened_at` and `clicked_at`:

```typescript
// In the JS section of the script, find the type used for h in history.map
// The emails_history items in the drawer currently use: h.date, h.type, h.subject
// Add to whatever type annotation exists, or if inline template string, just use the props directly
```

The drawer history is built in a template string inside a JS function. Find the `history.map((h) =>` call around line 258 and replace the `<li>` template:

```javascript
`<li class="drawer-history-item">
  <span class="dh-date">${h.date ? new Date(h.date).toLocaleDateString('fr-FR', { dateStyle: 'short' }) : '—'}</span>
  <span class="dh-type">${h.type || '—'}</span>
  <span class="dh-subject">${h.subject || '—'}</span>
  <span class="dh-engagement">
    ${h.opened_at ? `<span class="dh-opened" title="Ouvert le ${new Date(h.opened_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}">✓</span>` : ''}
    ${h.clicked_at ? `<span class="dh-clicked" title="Cliqué le ${new Date(h.clicked_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}">🔗</span>` : ''}
  </span>
</li>`
```

- [ ] **Step 2: Update grid CSS**

Find `.drawer-history-item` in the `<style>` block (currently `grid-template-columns: 64px 100px 1fr`). Replace the entire rule:

```css
.drawer-history-item { display: grid; grid-template-columns: 64px 100px 1fr auto; gap: 0.5rem; font-size: 0.8125rem; align-items: start; }
```

Then add after it:

```css
.dh-engagement { display: flex; gap: 4px; align-items: center; }
.dh-opened { color: #10B981; font-size: 0.8125rem; cursor: help; }
.dh-clicked { font-size: 0.8125rem; cursor: help; }
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```

Expected: no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add src/pages/client/students.astro
git commit -m "feat(tracking): add opened/clicked indicators to student drawer (F8)"
```

---

## Task 3 — F9: Formation API routes

**Files:**
- Create: `src/pages/api/formation-create.ts`
- Create: `src/pages/api/formation-update.ts`
- Create: `src/pages/api/formation-delete.ts`

- [ ] **Step 1: Create `formation-create.ts`**

```typescript
// src/pages/api/formation-create.ts
import type { APIRoute } from 'astro';
import { getClientFromCookie } from '../../lib/auth';
import { jsonRes } from '../../lib/api';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const auth = await getClientFromCookie(request);
  if (!auth) return jsonRes({ error: 'Non authentifié' }, 401);

  let body: { name?: string; stripe_product_id?: string } | null = null;
  try {
    body = await request.json();
  } catch {
    return jsonRes({ error: 'Corps JSON invalide' }, 400);
  }
  if (!body?.name?.trim()) return jsonRes({ error: 'name requis' }, 400);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(`${import.meta.env.AEVUM_URL}/client/formations`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${auth.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: body.name.trim(), stripe_product_id: body.stripe_product_id }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return jsonRes(await res.json().catch(() => ({})), res.status);
  } catch (err) {
    clearTimeout(timeout);
    if (err instanceof Error && err.name === 'AbortError') return jsonRes({ error: 'Timeout' }, 504);
    return jsonRes({ error: 'Erreur réseau' }, 502);
  }
};
```

- [ ] **Step 2: Create `formation-update.ts`**

```typescript
// src/pages/api/formation-update.ts
import type { APIRoute } from 'astro';
import { getClientFromCookie } from '../../lib/auth';
import { jsonRes } from '../../lib/api';

export const prerender = false;

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const PUT: APIRoute = async ({ request }) => {
  const auth = await getClientFromCookie(request);
  if (!auth) return jsonRes({ error: 'Non authentifié' }, 401);

  let body: { id?: string; name?: string } | null = null;
  try {
    body = await request.json();
  } catch {
    return jsonRes({ error: 'Corps JSON invalide' }, 400);
  }
  if (!body?.id) return jsonRes({ error: 'id requis' }, 400);
  if (!UUID_V4.test(body.id)) return jsonRes({ error: 'ID invalide' }, 400);
  if (!body?.name?.trim()) return jsonRes({ error: 'name requis' }, 400);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(`${import.meta.env.AEVUM_URL}/client/formations/${body.id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${auth.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: body.name.trim() }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return jsonRes(await res.json().catch(() => ({})), res.status);
  } catch (err) {
    clearTimeout(timeout);
    if (err instanceof Error && err.name === 'AbortError') return jsonRes({ error: 'Timeout' }, 504);
    return jsonRes({ error: 'Erreur réseau' }, 502);
  }
};
```

- [ ] **Step 3: Create `formation-delete.ts`**

```typescript
// src/pages/api/formation-delete.ts
import type { APIRoute } from 'astro';
import { getClientFromCookie } from '../../lib/auth';
import { jsonRes } from '../../lib/api';

export const prerender = false;

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const DELETE: APIRoute = async ({ request }) => {
  const auth = await getClientFromCookie(request);
  if (!auth) return jsonRes({ error: 'Non authentifié' }, 401);

  let body: { id?: string } | null = null;
  try {
    body = await request.json();
  } catch {
    return jsonRes({ error: 'Corps JSON invalide' }, 400);
  }
  if (!body?.id) return jsonRes({ error: 'id requis' }, 400);
  if (!UUID_V4.test(body.id)) return jsonRes({ error: 'ID invalide' }, 400);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(`${import.meta.env.AEVUM_URL}/client/formations/${body.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${auth.token}` },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return jsonRes(await res.json().catch(() => ({})), res.status);
  } catch (err) {
    clearTimeout(timeout);
    if (err instanceof Error && err.name === 'AbortError') return jsonRes({ error: 'Timeout' }, 504);
    return jsonRes({ error: 'Erreur réseau' }, 502);
  }
};
```

- [ ] **Step 4: Verify build**

```bash
npm run build
```

Expected: no TypeScript errors, 3 new files compiled.

- [ ] **Step 5: Commit**

```bash
git add src/pages/api/formation-create.ts src/pages/api/formation-update.ts src/pages/api/formation-delete.ts
git commit -m "feat(multi-formation): add formation CRUD API proxy routes (F9)"
```

---

## Task 4 — F9: ClientLayout formation selector

**Files:**
- Modify: `src/layouts/ClientLayout.astro`

- [ ] **Step 1: Add Formation type and fetch to frontmatter**

`ClientLayout.astro` currently has no frontmatter auth — the `---` block only destructures props. Replace the entire frontmatter (lines 1-15) with:

```typescript
---
import { ClientRouter } from 'astro:transitions';
import { getClientFromCookie } from '../lib/auth';

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

type Formation = { id: string; name: string; stripe_product_id?: string; created_at: string };
let formations: Formation[] = [];

const layoutAuth = await getClientFromCookie(Astro.request);
if (layoutAuth) {
  try {
    const res = await fetch(`${import.meta.env.AEVUM_URL}/client/formations`, {
      headers: { Authorization: `Bearer ${layoutAuth.token}` },
      signal: AbortSignal.timeout(6000),
    });
    if (res.ok) {
      const data = await res.json().catch(() => []);
      formations = Array.isArray(data) ? data : [];
    }
  } catch { /* non-fatal */ }
}

const selectedFormationId = Astro.cookies.get('aevum_formation_id')?.value ?? '';
const showFormationSelector = formations.length > 1;
const showFormationsLink = formations.length > 1;
---
```

- [ ] **Step 2: Add formation selector HTML in sidebar**

In the sidebar `<aside>` block, find the brand link `<a href="/client/dashboard" class="cl-brand"...>` and the `<nav class="cl-nav">` that follows it. Insert the formation selector between the brand link and the nav:

```astro
      <a href="/client/dashboard" class="cl-brand" aria-label="AEVUM — Tableau de bord">
        AEVUM<span class="cl-brand__dot"></span>
      </a>

      {showFormationSelector && (
        <div class="formation-selector-wrap">
          <select class="formation-select" id="formation-select">
            {formations.map((f) => (
              <option value={f.id} selected={f.id === selectedFormationId}>{f.name}</option>
            ))}
          </select>
        </div>
      )}

      <nav class="cl-nav">
```

- [ ] **Step 3: Add Formations nav link**

In `<nav class="cl-nav">`, after the "Élèves" link (last link), add:

```astro
        {showFormationsLink && (
          <a href="/client/formations" class:list={['cl-link', { 'cl-link--active': p.startsWith('/client/formations') }]}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
            Formations
          </a>
        )}
```

- [ ] **Step 4: Add Deliverability nav link**

In `<nav class="cl-nav">`, after the "Paramètres" link and before "Blacklist", add:

```astro
        <a href="/client/deliverability" class:list={['cl-link', { 'cl-link--active': p.startsWith('/client/deliverability') }]}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.99 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.92 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          Deliverability
        </a>
```

- [ ] **Step 5: Add prefetch links**

In `<head>`, after the existing prefetch links, add:

```astro
  <link rel="prefetch" href="/client/deliverability" />
  {showFormationsLink && <link rel="prefetch" href="/client/formations" />}
```

- [ ] **Step 6: Add formation selector client script**

In the `<script>` block, inside the `document.addEventListener('astro:page-load', ...)` section (or add one if needed), add the formation selector handler. Find the script block and add before the closing `</script>`:

```typescript
    function initFormationSelector() {
      const sel = document.getElementById('formation-select') as HTMLSelectElement | null;
      if (!sel || sel.dataset.initialized) return;
      sel.dataset.initialized = 'true';
      sel.addEventListener('change', () => {
        document.cookie = `aevum_formation_id=${sel.value}; path=/; SameSite=Strict; Max-Age=86400`;
        window.location.reload();
      });
    }
    initFormationSelector();
    document.addEventListener('astro:page-load', initFormationSelector);
```

- [ ] **Step 7: Add formation selector CSS**

In the `<style is:global>` block, add near the sidebar styles:

```css
.formation-selector-wrap {
  padding: 0.75rem 1rem 0.5rem;
  border-bottom: 1px solid var(--line);
}
.formation-select {
  width: 100%;
  background: var(--bg-2);
  border: 1px solid var(--line-2);
  border-radius: var(--r-sm);
  color: var(--fg);
  font-size: 0.875rem;
  padding: 6px 8px;
  font-family: var(--sans);
  cursor: pointer;
}
```

- [ ] **Step 8: Verify build**

```bash
npm run build
```

Expected: no TypeScript errors.

- [ ] **Step 9: Commit**

```bash
git add src/layouts/ClientLayout.astro
git commit -m "feat(multi-formation): add formation selector and deliverability link to sidebar (F9/F10)"
```

---

## Task 5 — F9: Propagate X-Formation-Id to all client pages

**Files:**
- Modify: `src/pages/client/dashboard.astro`
- Modify: `src/pages/client/customize.astro`
- Modify: `src/pages/client/students.astro`
- Modify: `src/pages/client/history.astro`
- Modify: `src/pages/client/blacklist.astro`

For each of the 5 files, do the following two steps:

- [ ] **Step 1: Add formationId + formationHeaders after the auth guard**

In each file, immediately after `if (!auth) return Astro.redirect('/login');`, add:

```typescript
const formationId = Astro.cookies.get('aevum_formation_id')?.value ?? null;
const formationHeaders = formationId ? { 'X-Formation-Id': formationId } : {};
```

- [ ] **Step 2: Replace `headers` construction**

Each file currently has something like:
```typescript
const headers = { Authorization: `Bearer ${auth.token}` };
```

Replace with:
```typescript
const headers = { Authorization: `Bearer ${auth.token}`, ...formationHeaders };
```

If a page constructs headers inline in fetch calls (not as a shared variable), update each fetch call's `headers` object to spread `formationHeaders`.

- [ ] **Step 3: Verify build**

```bash
npm run build
```

Expected: no TypeScript errors across all 5 files.

- [ ] **Step 4: Commit**

```bash
git add src/pages/client/dashboard.astro src/pages/client/customize.astro src/pages/client/students.astro src/pages/client/history.astro src/pages/client/blacklist.astro
git commit -m "feat(multi-formation): propagate X-Formation-Id header to all client pages (F9)"
```

---

## Task 6 — F9: Formations management page

**Files:**
- Create: `src/pages/client/formations.astro`

- [ ] **Step 1: Create `formations.astro`**

```astro
---
export const prerender = false;
import ClientLayout from '../../layouts/ClientLayout.astro';
import { getClientFromCookie } from '../../lib/auth';

const auth = await getClientFromCookie(Astro.request);
if (!auth) return Astro.redirect('/login');

const base = import.meta.env.AEVUM_URL;
const hdrs = { Authorization: `Bearer ${auth.token}`, 'Content-Type': 'application/json' };

type Formation = { id: string; name: string; stripe_product_id?: string; created_at: string };

let formations: Formation[] = [];
let successMsg = '';
let errorMsg = '';

function fmtDate(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('fr-FR', { dateStyle: 'short' });
}

if (Astro.request.method === 'POST') {
  const form = await Astro.request.formData();
  const action = form.get('action') as string;

  if (action === 'create_formation') {
    const name = (form.get('name') as string)?.trim();
    const stripe_product_id = (form.get('stripe_product_id') as string)?.trim() || undefined;
    if (name) {
      try {
        const res = await fetch(`${base}/client/formations`, {
          method: 'POST',
          headers: hdrs,
          body: JSON.stringify({ name, stripe_product_id }),
          signal: AbortSignal.timeout(8000),
        });
        if (res.status === 401) { Astro.cookies.delete('aevum_token', { path: '/' }); return Astro.redirect('/login'); }
        if (res.ok) successMsg = 'Formation créée.';
        else { const d = await res.json().catch(() => ({})); errorMsg = d.message ?? d.error ?? 'Erreur création.'; }
      } catch { errorMsg = 'Erreur réseau.'; }
    } else {
      errorMsg = 'Le nom est requis.';
    }
  }

  if (action === 'rename_formation') {
    const id = form.get('id') as string;
    const name = (form.get('new_name') as string)?.trim();
    if (id && name) {
      try {
        const res = await fetch(`${base}/client/formations/${id}`, {
          method: 'PUT',
          headers: hdrs,
          body: JSON.stringify({ name }),
          signal: AbortSignal.timeout(8000),
        });
        if (res.status === 401) { Astro.cookies.delete('aevum_token', { path: '/' }); return Astro.redirect('/login'); }
        if (res.ok) successMsg = 'Formation renommée.';
        else { const d = await res.json().catch(() => ({})); errorMsg = d.message ?? d.error ?? 'Erreur renommage.'; }
      } catch { errorMsg = 'Erreur réseau.'; }
    }
  }

  if (action === 'delete_formation') {
    const id = form.get('id') as string;
    if (id) {
      try {
        const res = await fetch(`${base}/client/formations/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${auth.token}` },
          signal: AbortSignal.timeout(8000),
        });
        if (res.status === 401) { Astro.cookies.delete('aevum_token', { path: '/' }); return Astro.redirect('/login'); }
        if (res.ok) successMsg = 'Formation supprimée.';
        else { const d = await res.json().catch(() => ({})); errorMsg = d.message ?? d.error ?? 'Erreur suppression.'; }
      } catch { errorMsg = 'Erreur réseau.'; }
    }
  }
}

// Fetch formations list after any POST
try {
  const res = await fetch(`${base}/client/formations`, {
    headers: { Authorization: `Bearer ${auth.token}` },
    signal: AbortSignal.timeout(8000),
  });
  if (res.status === 401) { Astro.cookies.delete('aevum_token', { path: '/' }); return Astro.redirect('/login'); }
  if (res.ok) {
    const data = await res.json().catch(() => []);
    formations = Array.isArray(data) ? data : [];
  }
} catch { /* non-fatal */ }
---

<ClientLayout
  title="Mes formations — AEVUM"
  description="Gérez vos formations sur AEVUM."
  canonical="/client/formations"
  email={auth.email}
>

<section class="section form-section">
  <div class="container form-container">

    <div style="margin-bottom:2.5rem">
      <span class="accent-line" style="margin:0 0 1rem"></span>
      <h1 style="font-size:clamp(1.5rem,3vw,2rem)">Mes formations</h1>
    </div>

    {successMsg && <div class="success-msg" role="alert" style="margin-bottom:1rem"><span>{successMsg}</span></div>}
    {errorMsg   && <div class="cust-field-error" role="alert" style="margin-bottom:1rem">{errorMsg}</div>}

    <!-- Formulaire de création -->
    <div class="card formations-create-card">
      <h2 class="settings-card-title" style="margin-bottom:1.25rem">Nouvelle formation</h2>
      <form method="POST" class="formations-create-form">
        <input type="hidden" name="action" value="create_formation" />
        <div class="form-group">
          <label class="form-label" for="f-name">Nom de la formation <span style="color:var(--error)">*</span></label>
          <input type="text" id="f-name" name="name" class="form-input" required placeholder="ex: Maîtriser Instagram" />
        </div>
        <div class="form-group">
          <label class="form-label" for="f-stripe">ID Produit Stripe <span style="color:var(--gray);">(optionnel)</span></label>
          <input type="text" id="f-stripe" name="stripe_product_id" class="form-input" placeholder="prod_..." />
        </div>
        <button type="submit" class="btn btn-primary" style="align-self:flex-start">Créer</button>
      </form>
    </div>

    <!-- Liste des formations -->
    {formations.length > 0 && (
      <div class="card formations-list-card">
        <h2 class="settings-card-title" style="margin-bottom:1.25rem">Formations existantes</h2>
        <div class="formations-table">
          <div class="ft-header">
            <span>Nom</span>
            <span>ID Produit Stripe</span>
            <span>Créée le</span>
            <span>Actions</span>
          </div>
          {formations.map((f) => (
            <div class="ft-row" id={`row-${f.id}`}>
              <span class="ft-name">{f.name}</span>
              <span class="ft-stripe">{f.stripe_product_id ?? '—'}</span>
              <span class="ft-date">{fmtDate(f.created_at)}</span>
              <span class="ft-actions">
                <button type="button" class="btn-inline-rename" data-id={f.id} data-name={f.name} title="Renommer">✏️</button>
                <button type="button" class="btn btn-danger-sm btn-confirm-delete" data-id={f.id} data-name={f.name}>Supprimer</button>
              </span>
            </div>
          ))}
        </div>
      </div>
    )}
    {formations.length === 0 && !errorMsg && (
      <div class="card" style="padding:2rem;text-align:center;color:var(--fg-muted)">
        Aucune formation pour l'instant.
      </div>
    )}

  </div>
</section>

<!-- Modal de renommage inline (hidden) -->
<div class="formations-rename-modal" id="rename-modal" aria-hidden="true" style="display:none">
  <div class="formations-rename-modal__inner">
    <h3 style="margin:0 0 1rem;font-size:1.125rem">Renommer la formation</h3>
    <form method="POST" id="rename-form">
      <input type="hidden" name="action" value="rename_formation" />
      <input type="hidden" name="id" id="rename-id" />
      <input type="text" name="new_name" id="rename-input" class="form-input" required style="margin-bottom:1rem" />
      <div style="display:flex;gap:0.75rem">
        <button type="submit" class="btn btn-primary">Sauvegarder</button>
        <button type="button" class="btn btn-secondary" id="rename-cancel">Annuler</button>
      </div>
    </form>
  </div>
</div>

<!-- Modal de confirmation suppression (hidden) -->
<div class="formations-delete-modal" id="delete-modal" aria-hidden="true" style="display:none">
  <div class="formations-delete-modal__inner">
    <h3 style="margin:0 0 0.75rem;font-size:1.125rem">Supprimer la formation ?</h3>
    <p class="delete-modal-name" style="color:var(--fg-muted);margin:0 0 1.25rem;font-size:0.9375rem"></p>
    <p style="color:var(--fg-muted);font-size:0.875rem;margin:0 0 1.5rem">Cette action est irréversible.</p>
    <form method="POST" id="delete-form">
      <input type="hidden" name="action" value="delete_formation" />
      <input type="hidden" name="id" id="delete-id" />
      <div style="display:flex;gap:0.75rem">
        <button type="submit" class="btn btn-primary" style="background:var(--error)">Supprimer</button>
        <button type="button" class="btn btn-secondary" id="delete-cancel">Annuler</button>
      </div>
    </form>
  </div>
</div>
<div class="formations-modal-overlay" id="formations-overlay" style="display:none"></div>

<script>
  function initFormations() {
    // Rename modal
    document.querySelectorAll<HTMLButtonElement>('.btn-inline-rename').forEach((btn) => {
      if (btn.dataset.initialized) return;
      btn.dataset.initialized = 'true';
      btn.addEventListener('click', () => {
        const modal   = document.getElementById('rename-modal')!;
        const overlay = document.getElementById('formations-overlay')!;
        const idInput = document.getElementById('rename-id') as HTMLInputElement;
        const nameInput = document.getElementById('rename-input') as HTMLInputElement;
        idInput.value   = btn.dataset.id!;
        nameInput.value = btn.dataset.name!;
        modal.style.display   = '';
        overlay.style.display = '';
        nameInput.focus();
      });
    });

    document.getElementById('rename-cancel')?.addEventListener('click', () => {
      document.getElementById('rename-modal')!.style.display   = 'none';
      document.getElementById('formations-overlay')!.style.display = 'none';
    });

    // Delete modal
    document.querySelectorAll<HTMLButtonElement>('.btn-confirm-delete').forEach((btn) => {
      if (btn.dataset.initialized) return;
      btn.dataset.initialized = 'true';
      btn.addEventListener('click', () => {
        const modal   = document.getElementById('delete-modal')!;
        const overlay = document.getElementById('formations-overlay')!;
        const idInput = document.getElementById('delete-id') as HTMLInputElement;
        const nameEl  = modal.querySelector('.delete-modal-name')!;
        idInput.value      = btn.dataset.id!;
        nameEl.textContent = btn.dataset.name!;
        modal.style.display   = '';
        overlay.style.display = '';
      });
    });

    document.getElementById('delete-cancel')?.addEventListener('click', () => {
      document.getElementById('delete-modal')!.style.display   = 'none';
      document.getElementById('formations-overlay')!.style.display = 'none';
    });

    document.getElementById('formations-overlay')?.addEventListener('click', () => {
      document.getElementById('rename-modal')!.style.display   = 'none';
      document.getElementById('delete-modal')!.style.display   = 'none';
      document.getElementById('formations-overlay')!.style.display = 'none';
    });
  }
  initFormations();
  document.addEventListener('astro:page-load', initFormations);
</script>

<style>
.form-section { padding: 3rem 0 4rem; }
.form-container { max-width: 860px; }

.formations-create-card { padding: 2rem; margin-bottom: 2rem; }
.formations-create-form { display: flex; flex-direction: column; gap: 1rem; max-width: 480px; }

.formations-list-card { padding: 2rem; }

.formations-table { display: flex; flex-direction: column; gap: 0; }
.ft-header, .ft-row {
  display: grid;
  grid-template-columns: 1fr 160px 100px 160px;
  gap: 1rem;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--line);
  font-size: 0.9375rem;
}
.ft-header { font-size: 0.75rem; color: var(--fg-muted); text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; }
.ft-actions { display: flex; gap: 0.5rem; align-items: center; }
.btn-inline-rename { background: none; border: none; cursor: pointer; font-size: 1rem; padding: 2px 6px; border-radius: 4px; color: var(--fg-muted); }
.btn-inline-rename:hover { background: var(--bg-2); }
.btn-danger-sm { padding: 4px 10px; font-size: 0.8125rem; border-radius: 6px; background: transparent; border: 1px solid rgba(239,68,68,0.4); color: #EF4444; cursor: pointer; font-family: var(--sans); }
.btn-danger-sm:hover { background: rgba(239,68,68,0.1); }

.formations-rename-modal,
.formations-delete-modal {
  position: fixed; inset: 0; z-index: 200;
  display: flex; align-items: center; justify-content: center;
}
.formations-rename-modal__inner,
.formations-delete-modal__inner {
  background: var(--bg-1);
  border: 1px solid var(--line);
  border-radius: var(--r-lg);
  padding: 2rem;
  width: min(90vw, 420px);
  position: relative; z-index: 201;
}
.formations-modal-overlay {
  position: fixed; inset: 0; z-index: 199;
  background: rgba(0,0,0,0.6);
}

.cust-field-error { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); border-radius: 8px; padding: 0.75rem 1rem; color: #EF4444; font-size: 0.9375rem; margin-bottom: 1rem; }
</style>

</ClientLayout>
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/client/formations.astro
git commit -m "feat(multi-formation): add formations management page (F9)"
```

---

## Task 7 — F10: Deliverability guide page

**Files:**
- Create: `src/pages/client/deliverability.astro`
- Modify: `src/pages/client/settings.astro`

- [ ] **Step 1: Create `deliverability.astro`**

```astro
---
export const prerender = false;
import ClientLayout from '../../layouts/ClientLayout.astro';
import { getClientFromCookie } from '../../lib/auth';

const auth = await getClientFromCookie(Astro.request);
if (!auth) return Astro.redirect('/login');

const base = import.meta.env.AEVUM_URL;
const hdrs = { Authorization: `Bearer ${auth.token}` };

type MeData = { dkim_public_key?: string | null };
type ConfigEntry = { config_type: string; value: string };

let dkimKey: string | null = null;
let senderName = '';

const [meResult, configsResult] = await Promise.allSettled([
  fetch(`${base}/client/me`, { headers: hdrs, signal: AbortSignal.timeout(8000) }),
  fetch(`${base}/client/configs`, { headers: hdrs, signal: AbortSignal.timeout(8000) }),
]);

const fulfilled = [meResult, configsResult].filter(
  (r): r is PromiseFulfilledResult<Response> => r.status === 'fulfilled'
);
if (fulfilled.some((r) => r.value.status === 401)) {
  Astro.cookies.delete('aevum_token', { path: '/' });
  return Astro.redirect('/login');
}

if (meResult.status === 'fulfilled' && meResult.value.ok) {
  const me: MeData = await meResult.value.json().catch(() => ({}));
  dkimKey = me.dkim_public_key ?? null;
}

if (configsResult.status === 'fulfilled' && configsResult.value.ok) {
  const arr: ConfigEntry[] = await configsResult.value.json().catch(() => []);
  const senderRaw = Array.isArray(arr) ? arr.find((c) => c.config_type === 'sender_name') : undefined;
  if (senderRaw) {
    try {
      const p = JSON.parse(senderRaw.value);
      senderName = typeof p === 'object' && p?.body ? p.body : senderRaw.value;
    } catch {
      senderName = senderRaw.value;
    }
  }
}

const SPF_VALUE = 'v=spf1 include:spf.aevum.io ~all';
const DMARC_VALUE = 'v=DMARC1; p=quarantine; rua=mailto:dmarc@votre-domaine.com';
---

<ClientLayout
  title="Guide Deliverability — AEVUM"
  description="Configurez SPF, DKIM et DMARC pour maximiser la deliverability de vos emails."
  canonical="/client/deliverability"
  email={auth.email}
>

<section class="section del-section">
  <div class="container del-container">

    <div style="margin-bottom:2.5rem">
      <span class="accent-line" style="margin:0 0 1rem"></span>
      <h1 style="font-size:clamp(1.5rem,3vw,2rem)">Guide Deliverability</h1>
      <p style="color:var(--fg-muted);margin-top:0.5rem">Suivez ces 5 étapes pour maximiser la livraison de vos emails.</p>
    </div>

    <div class="del-stepper">

      <!-- Étape 1 -->
      <div class="del-step" data-step="1">
        <div class="del-step-indicator"><span class="del-step-num">1</span></div>
        <div class="del-step-content">
          <h2 class="del-step-title">Votre configuration actuelle</h2>
          <div class="del-step-body">
            {senderName ? (
              <p>Votre expéditeur actuel : <strong>{senderName}</strong></p>
            ) : (
              <p style="color:var(--fg-muted)">Aucun nom d'expéditeur configuré. <a href="/client/customize" style="color:var(--accent)">Configurer →</a></p>
            )}
            <p style="margin-top:0.75rem">Un domaine personnalisé améliore significativement votre deliverability. Les filtres anti-spam font confiance aux domaines établis, les clients reconnaissent votre marque, et votre réputation d'envoi vous appartient.</p>
            <button type="button" class="btn btn-secondary del-complete-btn" data-step="1" style="margin-top:1rem">Étape suivante →</button>
          </div>
        </div>
      </div>

      <!-- Étape 2 -->
      <div class="del-step" data-step="2">
        <div class="del-step-indicator"><span class="del-step-num">2</span></div>
        <div class="del-step-content">
          <h2 class="del-step-title">Record SPF</h2>
          <div class="del-step-body">
            <p>Le SPF autorise AEVUM à envoyer des emails depuis votre domaine. Ajoutez ce record TXT à votre DNS :</p>
            <div class="del-code-wrap">
              <code class="del-code" id="spf-value">{SPF_VALUE}</code>
              <button type="button" class="btn btn-secondary del-copy-btn" data-target="spf-value">Copier</button>
            </div>
            <p class="del-dns-info"><strong>Type :</strong> TXT — <strong>Nom :</strong> @ (ou votre domaine) — <strong>Valeur :</strong> ci-dessus</p>
            <div class="del-accordion-group">
              <details class="del-accordion"><summary>OVH</summary><div class="del-accordion-body">Dans l'espace client OVH → Zone DNS → Ajouter une entrée → TXT → Sous-domaine vide → coller la valeur.</div></details>
              <details class="del-accordion"><summary>Ionos</summary><div class="del-accordion-body">Connexion Ionos → Domaines & SSL → DNS → Ajouter un enregistrement → TXT → Hôte "@" → coller la valeur.</div></details>
              <details class="del-accordion"><summary>Gandi</summary><div class="del-accordion-body">Gandi → Nom de domaine → DNS → Ajouter un enregistrement → Type TXT → Nom "@" → coller la valeur.</div></details>
              <details class="del-accordion"><summary>Cloudflare</summary><div class="del-accordion-body">Cloudflare → sélectionner le domaine → DNS → Ajouter un enregistrement → Type TXT → Nom "@" → Contenu = valeur ci-dessus → Proxy désactivé.</div></details>
            </div>
            <button type="button" class="btn btn-secondary del-complete-btn" data-step="2" style="margin-top:1rem">Étape suivante →</button>
          </div>
        </div>
      </div>

      <!-- Étape 3 -->
      <div class="del-step" data-step="3">
        <div class="del-step-indicator"><span class="del-step-num">3</span></div>
        <div class="del-step-content">
          <h2 class="del-step-title">Record DKIM</h2>
          <div class="del-step-body">
            <p>Le DKIM signe cryptographiquement vos emails pour prouver leur authenticité.</p>
            {dkimKey ? (
              <div class="del-code-wrap">
                <pre class="del-pre" id="dkim-value">{dkimKey}</pre>
                <button type="button" class="btn btn-secondary del-copy-btn" data-target="dkim-value">Copier</button>
              </div>
            ) : (
              <div class="del-info-box">Contactez le support pour obtenir votre clé DKIM personnalisée.</div>
            )}
            <div class="del-accordion-group" style="margin-top:1rem">
              <details class="del-accordion"><summary>OVH</summary><div class="del-accordion-body">Zone DNS → Ajouter → TXT → Sous-domaine : <code>aevum._domainkey</code> → Valeur : votre clé DKIM.</div></details>
              <details class="del-accordion"><summary>Ionos</summary><div class="del-accordion-body">DNS → Ajouter TXT → Hôte : <code>aevum._domainkey</code> → Valeur : votre clé DKIM.</div></details>
              <details class="del-accordion"><summary>Gandi</summary><div class="del-accordion-body">DNS → TXT → Nom : <code>aevum._domainkey</code> → Valeur : votre clé DKIM.</div></details>
              <details class="del-accordion"><summary>Cloudflare</summary><div class="del-accordion-body">DNS → TXT → Nom : <code>aevum._domainkey</code> → Contenu : votre clé DKIM → Proxy désactivé.</div></details>
            </div>
            <button type="button" class="btn btn-secondary del-complete-btn" data-step="3" style="margin-top:1rem">Étape suivante →</button>
          </div>
        </div>
      </div>

      <!-- Étape 4 -->
      <div class="del-step" data-step="4">
        <div class="del-step-indicator"><span class="del-step-num">4</span></div>
        <div class="del-step-content">
          <h2 class="del-step-title">Record DMARC</h2>
          <div class="del-step-body">
            <p>Le DMARC indique aux serveurs mail quoi faire des emails non authentifiés. Valeur recommandée :</p>
            <div class="del-code-wrap">
              <code class="del-code" id="dmarc-value">{DMARC_VALUE}</code>
              <button type="button" class="btn btn-secondary del-copy-btn" data-target="dmarc-value">Copier</button>
            </div>
            <p class="del-dns-info"><strong>Type :</strong> TXT — <strong>Nom :</strong> _dmarc</p>
            <table class="del-table">
              <thead><tr><th>Mode</th><th>Comportement</th><th>Recommandé</th></tr></thead>
              <tbody>
                <tr><td><code>p=none</code></td><td>Surveillance uniquement, aucun filtrage</td><td>Démarrage</td></tr>
                <tr class="del-table__highlight"><td><code>p=quarantine</code></td><td>Emails suspects en spam</td><td>✓ Recommandé</td></tr>
                <tr><td><code>p=reject</code></td><td>Emails non authentifiés rejetés</td><td>Avancé</td></tr>
              </tbody>
            </table>
            <button type="button" class="btn btn-secondary del-complete-btn" data-step="4" style="margin-top:1rem">Étape suivante →</button>
          </div>
        </div>
      </div>

      <!-- Étape 5 -->
      <div class="del-step" data-step="5">
        <div class="del-step-indicator"><span class="del-step-num">5</span></div>
        <div class="del-step-content">
          <h2 class="del-step-title">Tester votre deliverability</h2>
          <div class="del-step-body">
            <p>Utilisez mail-tester.com pour vérifier votre configuration :</p>
            <ol class="del-steps-list">
              <li>Rendez-vous sur <a href="https://www.mail-tester.com/" target="_blank" rel="noopener" class="del-link">mail-tester.com →</a></li>
              <li>Copiez l'adresse email unique générée</li>
              <li>Depuis votre interface AEVUM, envoyez un email test à cette adresse</li>
              <li>Cliquez "Vérifier mon score"</li>
            </ol>
            <div class="del-score-grid">
              <div class="del-score-item del-score--good"><span class="del-score-label">&gt; 9/10</span><span class="del-score-desc">Excellent ✓</span></div>
              <div class="del-score-item del-score--warn"><span class="del-score-label">7–9/10</span><span class="del-score-desc">Correct ⚠</span></div>
              <div class="del-score-item del-score--bad"><span class="del-score-label">&lt; 7/10</span><span class="del-score-desc">Problème ✗</span></div>
            </div>
            <button type="button" class="btn btn-secondary del-complete-btn" data-step="5" style="margin-top:1rem">Terminer ✓</button>
          </div>
        </div>
      </div>

    </div>
  </div>
</section>

<script>
  function initDeliverability() {
    const STORAGE_KEY = 'aevum_deliverability_steps';
    let done: number[] = [];
    try { done = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]'); } catch {}

    done.forEach((n) => {
      document.querySelector(`.del-step[data-step="${n}"]`)?.classList.add('step--done');
    });

    document.querySelectorAll<HTMLButtonElement>('.del-complete-btn').forEach((btn) => {
      if (btn.dataset.initialized) return;
      btn.dataset.initialized = 'true';
      btn.addEventListener('click', () => {
        const step = parseInt(btn.dataset.step!);
        if (!done.includes(step)) done.push(step);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(done));
        btn.closest('.del-step')?.classList.add('step--done');
      });
    });

    document.querySelectorAll<HTMLButtonElement>('.del-copy-btn').forEach((btn) => {
      if (btn.dataset.initialized) return;
      btn.dataset.initialized = 'true';
      btn.addEventListener('click', async () => {
        const targetId = btn.dataset.target!;
        const el = document.getElementById(targetId);
        if (!el) return;
        const text = el.textContent ?? '';
        try {
          await navigator.clipboard.writeText(text);
          const orig = btn.textContent;
          btn.textContent = 'Copié !';
          setTimeout(() => { btn.textContent = orig; }, 1500);
        } catch { /* ignore */ }
      });
    });
  }
  initDeliverability();
  document.addEventListener('astro:page-load', initDeliverability);
</script>

<style>
.del-section { padding: 3rem 0 4rem; }
.del-container { max-width: 760px; }

.del-stepper { display: flex; flex-direction: column; }
.del-step {
  display: flex; gap: 1.25rem;
  padding: 1.75rem 0;
  border-bottom: 1px solid var(--line);
}
.del-step:last-child { border-bottom: none; }

.del-step-indicator {
  flex-shrink: 0;
  width: 32px; height: 32px; border-radius: 50%;
  border: 2px solid var(--line-2);
  display: flex; align-items: center; justify-content: center;
  transition: background 0.2s, border-color 0.2s;
}
.del-step-num { font-size: 0.875rem; font-weight: 600; color: var(--fg-muted); }
.del-step.step--done .del-step-indicator { background: #10B981; border-color: #10B981; }
.del-step.step--done .del-step-num { color: #fff; }

.del-step-title { font-size: 1.125rem; font-weight: 600; margin: 0 0 0.75rem; color: var(--fg); }
.del-step-content { flex: 1; min-width: 0; }
.del-step-body { font-size: 0.9375rem; color: var(--fg-2); line-height: 1.6; }
.del-step-body p { margin: 0 0 0.5rem; }

.del-code-wrap { display: flex; gap: 0.75rem; align-items: flex-start; background: var(--bg-2); border: 1px solid var(--line-2); border-radius: 8px; padding: 0.875rem 1rem; margin: 0.75rem 0; }
.del-code { font-size: 0.8125rem; font-family: 'Courier New', monospace; color: var(--fg); flex: 1; word-break: break-all; }
.del-pre { font-size: 0.75rem; font-family: 'Courier New', monospace; color: var(--fg); flex: 1; overflow-x: auto; margin: 0; white-space: pre-wrap; word-break: break-all; max-height: 160px; }
.del-dns-info { font-size: 0.8125rem; color: var(--fg-muted); margin: 0.25rem 0 0.75rem !important; }

.del-info-box { background: rgba(59,130,246,0.08); border: 1px solid rgba(59,130,246,0.25); border-radius: 8px; padding: 0.875rem 1rem; font-size: 0.9375rem; color: var(--fg-2); margin: 0.75rem 0; }

.del-accordion-group { display: flex; flex-direction: column; gap: 0.5rem; margin-top: 0.75rem; }
.del-accordion { border: 1px solid var(--line-2); border-radius: 8px; overflow: hidden; }
.del-accordion summary { padding: 0.625rem 1rem; font-size: 0.9375rem; cursor: pointer; user-select: none; color: var(--fg-2); font-weight: 500; }
.del-accordion summary:hover { background: var(--bg-2); }
.del-accordion-body { padding: 0.75rem 1rem; font-size: 0.875rem; color: var(--fg-muted); border-top: 1px solid var(--line); }

.del-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; margin: 0.75rem 0; }
.del-table th { padding: 0.5rem 0.75rem; text-align: left; color: var(--fg-muted); font-weight: 600; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid var(--line); }
.del-table td { padding: 0.5rem 0.75rem; border-bottom: 1px solid var(--line); color: var(--fg-2); }
.del-table__highlight td { color: var(--fg); font-weight: 500; }
.del-table code { font-family: 'Courier New', monospace; font-size: 0.8125rem; background: var(--bg-2); padding: 1px 4px; border-radius: 3px; }

.del-steps-list { margin: 0.5rem 0 1rem 1.25rem; color: var(--fg-2); font-size: 0.9375rem; line-height: 1.8; }
.del-link { color: var(--accent); text-decoration: none; }
.del-link:hover { text-decoration: underline; }

.del-score-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; margin-top: 0.75rem; }
.del-score-item { display: flex; flex-direction: column; gap: 0.25rem; padding: 0.875rem; border-radius: 8px; text-align: center; }
.del-score-label { font-weight: 700; font-size: 1rem; }
.del-score-desc { font-size: 0.8125rem; color: var(--fg-muted); }
.del-score--good { background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.3); }
.del-score--good .del-score-label { color: #10B981; }
.del-score--warn { background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.3); }
.del-score--warn .del-score-label { color: #F59E0B; }
.del-score--bad { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); }
.del-score--bad .del-score-label { color: #EF4444; }
</style>

</ClientLayout>
```

- [ ] **Step 2: Add deliverability card to settings.astro**

In `settings.astro`, find the Mode pause section ending (the closing `</div>` of the pause `.card.settings-card`). Insert the deliverability card after it, before the `<!-- Logout -->` section:

```astro
    <!-- Deliverability -->
    <div class="card settings-card">
      <h2 class="settings-card-title">Deliverability</h2>
      <p style="color:var(--gray-light);font-size:0.9375rem;margin:0 0 1rem">
        Configurez SPF, DKIM et DMARC pour maximiser la livraison de vos emails.
      </p>
      <a href="/client/deliverability" class="btn btn-secondary" style="align-self:flex-start;display:inline-block">
        Voir le guide →
      </a>
    </div>
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```

Expected: no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add src/pages/client/deliverability.astro src/pages/client/settings.astro
git commit -m "feat(deliverability): add deliverability guide page and settings link (F10)"
```

---

## Task 8 — F11: Checkout abandon section in customize.astro

**Files:**
- Modify: `src/pages/client/customize.astro`

- [ ] **Step 1: Add `template_checkout_abandon` to VARIABLE_HINTS**

Find `VARIABLE_HINTS` (around line 124) and add:

```typescript
  template_checkout_abandon: ['{{nom}}', '{{prenom}}', '{{email}}', '{{nom_formation}}', '{{lien_checkout}}'],
```

- [ ] **Step 2: Extract checkout abandon config in frontmatter**

Find the `const allDefaultTemplates = ...` line (around line 184). After the `PARSED_CONFIGS` block, add:

```typescript
const checkoutAbandonRaw = configs['template_checkout_abandon'];
const checkoutAbandonConfig = parseConfig(checkoutAbandonRaw ?? '');
```

- [ ] **Step 3: Update section-divider CSS to support labels**

Find `.section-divider` in the `<style>` block:

```css
.section-divider {
  height: 1px;
  background: var(--gray-border);
  margin: 2.5rem 0;
}
```

Replace with:

```css
.section-divider {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: 2.5rem 0;
}
.section-divider::before,
.section-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--gray-border);
}
.section-divider:empty::after { display: none; }
.section-divider span {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--fg-muted);
  white-space: nowrap;
}
```

- [ ] **Step 4: Add checkout abandon HTML**

Find the existing `<div class="section-divider"></div>` that separates templates from custom automations (around line 374). Before it (not replacing it), insert the checkout abandon section:

```astro
    <!-- F11 — Checkout abandon -->
    <div class="section-divider"><span>Récupération paniers abandonnés</span></div>

    <div class="cust-card card checkout-abandon-card"
         data-config="template_checkout_abandon"
         data-subject={checkoutAbandonConfig.subject}
         data-body={checkoutAbandonConfig.body}
         data-label={checkoutAbandonConfig.label ?? 'Panier abandonné'}
         data-panel-active={checkoutAbandonConfig.active ? 'true' : 'false'}>

      <div class="panel-header">
        <div class="panel-title-group">
          <h2 class="cust-card-title section-title" style="margin-bottom:0">Email de récupération</h2>
        </div>
        <div class="panel-right-actions">
          <label class="toggle-switch" title="Activer/désactiver">
            <input type="checkbox" class="toggle-input" checked={checkoutAbandonConfig.active} />
            <span class="toggle-track"></span>
            <span class="toggle-label">{checkoutAbandonConfig.active ? 'Actif' : 'Inactif'}</span>
          </label>
        </div>
      </div>
      <p class="card-note" style="margin:0 0 1rem;font-size:0.875rem;color:var(--fg-muted)">
        Envoyé 30 min après qu'un prospect quitte le paiement sans finaliser son achat.
      </p>
      {successType === 'template_checkout_abandon' && <div class="success-msg" role="alert"><span>Sauvegardé.</span></div>}
      {errorType === 'template_checkout_abandon' && <div class="cust-field-error" role="alert">{errorMsg}</div>}
      <div class="editor-tabs-row">
        <div class="editor-tabs">
          <button class="editor-tab active" data-tab="manual">✏️ Rédiger moi-même</button>
          <button class="editor-tab" data-tab="generate">✨ Générer avec l'IA</button>
        </div>
        <button type="button" class="btn btn-secondary btn-library" data-config-type="template_checkout_abandon">📚 Bibliothèque</button>
      </div>
      <div class="tab-panel" data-panel="manual">
        <form method="POST" class="cust-form">
          <input type="hidden" name="config_type" value="template_checkout_abandon" />
          <input type="hidden" name="value" class="hidden-value"
                 value={JSON.stringify(checkoutAbandonConfig)} />
          <label class="form-label">Sujet</label>
          <input type="text" class="form-input subject-input" placeholder="Sujet de l'email..." />
          <label class="form-label" style="margin-top:0.25rem">Corps</label>
          <textarea class="form-input cust-textarea body-input" rows={7} placeholder="Contenu de l'email..."></textarea>
          <div class="cust-hints">
            <p class="cust-hints-label">Variables disponibles — cliquez pour insérer :</p>
            <div class="cust-hints-list">
              {VARIABLE_HINTS['template_checkout_abandon']!.map((v) => (
                <code class="cust-hint" data-var={v}>{v}</code>
              ))}
            </div>
          </div>
          <div class="manual-actions">
            <button type="submit" class="btn btn-primary cust-save-btn">Sauvegarder</button>
            <button type="button" class="btn btn-secondary btn-improve">🔧 Améliorer avec l'IA</button>
          </div>
          <p class="ai-error improve-error"></p>
        </form>
        <div class="test-send-wrap">
          <button type="button" class="btn btn-secondary btn-test-send"
                  data-config-type="template_checkout_abandon"
                  data-email={auth.email}>
            📧 M'envoyer un aperçu
          </button>
          <span class="test-send-feedback" aria-live="polite"></span>
        </div>
      </div>
      <div class="tab-panel hidden" data-panel="generate">
        <input type="text" class="form-input gen-formation" placeholder="Nom de votre formation (ex: Maîtriser Instagram)" />
        <select class="form-input gen-tone">
          <option value="chaleureux">Chaleureux et bienveillant</option>
          <option value="professionnel">Professionnel et direct</option>
          <option value="motivant">Motivant et dynamique</option>
        </select>
        <input type="text" class="form-input gen-objective" placeholder="Objectif de cet email (ex: récupérer le paiement)" />
        <button class="btn btn-primary btn-generate" style="align-self:flex-start">✨ Générer l'email</button>
        <p class="ai-error gen-error"></p>
        <div class="generation-result hidden">
          <input type="text" class="form-input subject-preview" readonly placeholder="Sujet généré" />
          <textarea class="form-input body-preview" rows={6} readonly placeholder="Contenu généré"></textarea>
          <button class="btn btn-secondary btn-use-result" style="align-self:flex-start">Utiliser ce contenu →</button>
        </div>
      </div>
    </div>
```

- [ ] **Step 5: Verify build**

```bash
npm run build
```

Expected: no TypeScript errors.

- [ ] **Step 6: Commit**

```bash
git add src/pages/client/customize.astro
git commit -m "feat(customize): add checkout abandon section (F11)"
```

---

## Task 9 — F12: Testimonial requests section in customize.astro

**Files:**
- Modify: `src/pages/client/customize.astro`

- [ ] **Step 1: Add testimonial VARIABLE_HINTS entries**

In `VARIABLE_HINTS`, add:

```typescript
  testimonial_url: [],
  template_testimonial_j30: ['{{nom}}', '{{prenom}}', '{{nom_formation}}', '{{lien_temoignage}}'],
  template_testimonial_j60: ['{{nom}}', '{{prenom}}', '{{nom_formation}}', '{{lien_temoignage}}'],
```

- [ ] **Step 2: Extract testimonial configs in frontmatter**

After the checkout abandon extraction (added in Task 8), add:

```typescript
const testimonialUrlRaw = configs['testimonial_url'];
const testimonialUrlConfig = parseConfig(testimonialUrlRaw ?? '');
const testimonialJ30Raw = configs['template_testimonial_j30'];
const testimonialJ30Config = parseConfig(testimonialJ30Raw ?? '');
const testimonialJ60Raw = configs['template_testimonial_j60'];
const testimonialJ60Config = parseConfig(testimonialJ60Raw ?? '');
```

- [ ] **Step 3: Insert testimonial section HTML**

Find the checkout abandon closing `</div>` (the end of the `checkout-abandon-card` div). After it (still before the existing plain `<div class="section-divider"></div>`), add:

```astro
    <!-- F12 — Témoignages -->
    <div class="section-divider"><span>Demandes de témoignage</span></div>

    <!-- URL du formulaire -->
    <div class="card testimonial-url-card">
      <h2 class="cust-card-title">URL de votre formulaire de collecte</h2>
      <p class="card-note" style="margin:0.25rem 0 1rem;font-size:0.875rem;color:var(--fg-muted)">
        Envoyé automatiquement 30 ou 60 jours après l'inscription d'un élève actif.
      </p>
      {successType === 'testimonial_url' && <div class="success-msg" role="alert"><span>Sauvegardé.</span></div>}
      <form method="POST" class="testimonial-url-form">
        <input type="hidden" name="config_type" value="testimonial_url" />
        <input type="hidden" name="value" class="hidden-value" value={JSON.stringify({ subject: '', body: testimonialUrlConfig.body, active: true })} />
        <div class="form-group" style="max-width:480px">
          <input type="url" name="url-display" class="form-input testimonial-url-input"
                 placeholder="https://typeform.com/to/..."
                 value={testimonialUrlConfig.body} />
        </div>
        <button type="submit" class="btn btn-primary" style="align-self:flex-start">Sauvegarder</button>
      </form>
    </div>

    <!-- Tabs J+30 / J+60 -->
    <div class="testimonial-tabs-header">
      <button class="testi-tab active" data-testi-tab="j30" type="button">À J+30</button>
      <button class="testi-tab" data-testi-tab="j60" type="button">À J+60</button>
    </div>

    <!-- Panel J+30 -->
    <div class="cust-card card"
         data-config="template_testimonial_j30"
         data-subject={testimonialJ30Config.subject}
         data-body={testimonialJ30Config.body}
         data-label={testimonialJ30Config.label ?? 'Témoignage J+30'}
         data-panel-active={testimonialJ30Config.active ? 'true' : 'false'}>
      <div class="panel-header">
        <div class="panel-title-group">
          <h2 class="cust-card-title section-title" style="margin-bottom:0">Email témoignage J+30</h2>
        </div>
        <div class="panel-right-actions">
          <label class="toggle-switch" title="Activer/désactiver">
            <input type="checkbox" class="toggle-input" checked={testimonialJ30Config.active} />
            <span class="toggle-track"></span>
            <span class="toggle-label">{testimonialJ30Config.active ? 'Actif' : 'Inactif'}</span>
          </label>
        </div>
      </div>
      {successType === 'template_testimonial_j30' && <div class="success-msg" role="alert"><span>Sauvegardé.</span></div>}
      {errorType === 'template_testimonial_j30' && <div class="cust-field-error" role="alert">{errorMsg}</div>}
      <div class="editor-tabs-row">
        <div class="editor-tabs">
          <button class="editor-tab active" data-tab="manual">✏️ Rédiger moi-même</button>
          <button class="editor-tab" data-tab="generate">✨ Générer avec l'IA</button>
        </div>
        <button type="button" class="btn btn-secondary btn-library" data-config-type="template_testimonial_j30">📚 Bibliothèque</button>
      </div>
      <div class="tab-panel" data-panel="manual">
        <form method="POST" class="cust-form">
          <input type="hidden" name="config_type" value="template_testimonial_j30" />
          <input type="hidden" name="value" class="hidden-value" value={JSON.stringify(testimonialJ30Config)} />
          <label class="form-label">Sujet</label>
          <input type="text" class="form-input subject-input" placeholder="Sujet de l'email..." />
          <label class="form-label" style="margin-top:0.25rem">Corps</label>
          <textarea class="form-input cust-textarea body-input" rows={7} placeholder="Contenu de l'email..."></textarea>
          <div class="cust-hints">
            <p class="cust-hints-label">Variables disponibles — cliquez pour insérer :</p>
            <div class="cust-hints-list">
              {VARIABLE_HINTS['template_testimonial_j30']!.map((v) => (
                <code class="cust-hint" data-var={v}>{v}</code>
              ))}
            </div>
          </div>
          <div class="manual-actions">
            <button type="submit" class="btn btn-primary cust-save-btn">Sauvegarder</button>
            <button type="button" class="btn btn-secondary btn-improve">🔧 Améliorer avec l'IA</button>
          </div>
          <p class="ai-error improve-error"></p>
        </form>
        <div class="test-send-wrap">
          <button type="button" class="btn btn-secondary btn-test-send"
                  data-config-type="template_testimonial_j30" data-email={auth.email}>
            📧 M'envoyer un aperçu
          </button>
          <span class="test-send-feedback" aria-live="polite"></span>
        </div>
      </div>
      <div class="tab-panel hidden" data-panel="generate">
        <input type="text" class="form-input gen-formation" placeholder="Nom de votre formation" />
        <select class="form-input gen-tone">
          <option value="chaleureux">Chaleureux et bienveillant</option>
          <option value="professionnel">Professionnel et direct</option>
          <option value="motivant">Motivant et dynamique</option>
        </select>
        <input type="text" class="form-input gen-objective" placeholder="Objectif (ex: collecter un avis client)" />
        <button class="btn btn-primary btn-generate" style="align-self:flex-start">✨ Générer l'email</button>
        <p class="ai-error gen-error"></p>
        <div class="generation-result hidden">
          <input type="text" class="form-input subject-preview" readonly placeholder="Sujet généré" />
          <textarea class="form-input body-preview" rows={6} readonly placeholder="Contenu généré"></textarea>
          <button class="btn btn-secondary btn-use-result" style="align-self:flex-start">Utiliser ce contenu →</button>
        </div>
      </div>
    </div>

    <!-- Panel J+60 (hidden initially) -->
    <div class="cust-card card"
         data-config="template_testimonial_j60"
         data-subject={testimonialJ60Config.subject}
         data-body={testimonialJ60Config.body}
         data-label={testimonialJ60Config.label ?? 'Témoignage J+60'}
         data-panel-active={testimonialJ60Config.active ? 'true' : 'false'}
         style="display:none">
      <div class="panel-header">
        <div class="panel-title-group">
          <h2 class="cust-card-title section-title" style="margin-bottom:0">Email témoignage J+60</h2>
        </div>
        <div class="panel-right-actions">
          <label class="toggle-switch" title="Activer/désactiver">
            <input type="checkbox" class="toggle-input" checked={testimonialJ60Config.active} />
            <span class="toggle-track"></span>
            <span class="toggle-label">{testimonialJ60Config.active ? 'Actif' : 'Inactif'}</span>
          </label>
        </div>
      </div>
      {successType === 'template_testimonial_j60' && <div class="success-msg" role="alert"><span>Sauvegardé.</span></div>}
      {errorType === 'template_testimonial_j60' && <div class="cust-field-error" role="alert">{errorMsg}</div>}
      <div class="editor-tabs-row">
        <div class="editor-tabs">
          <button class="editor-tab active" data-tab="manual">✏️ Rédiger moi-même</button>
          <button class="editor-tab" data-tab="generate">✨ Générer avec l'IA</button>
        </div>
        <button type="button" class="btn btn-secondary btn-library" data-config-type="template_testimonial_j60">📚 Bibliothèque</button>
      </div>
      <div class="tab-panel" data-panel="manual">
        <form method="POST" class="cust-form">
          <input type="hidden" name="config_type" value="template_testimonial_j60" />
          <input type="hidden" name="value" class="hidden-value" value={JSON.stringify(testimonialJ60Config)} />
          <label class="form-label">Sujet</label>
          <input type="text" class="form-input subject-input" placeholder="Sujet de l'email..." />
          <label class="form-label" style="margin-top:0.25rem">Corps</label>
          <textarea class="form-input cust-textarea body-input" rows={7} placeholder="Contenu de l'email..."></textarea>
          <div class="cust-hints">
            <p class="cust-hints-label">Variables disponibles — cliquez pour insérer :</p>
            <div class="cust-hints-list">
              {VARIABLE_HINTS['template_testimonial_j60']!.map((v) => (
                <code class="cust-hint" data-var={v}>{v}</code>
              ))}
            </div>
          </div>
          <div class="manual-actions">
            <button type="submit" class="btn btn-primary cust-save-btn">Sauvegarder</button>
            <button type="button" class="btn btn-secondary btn-improve">🔧 Améliorer avec l'IA</button>
          </div>
          <p class="ai-error improve-error"></p>
        </form>
        <div class="test-send-wrap">
          <button type="button" class="btn btn-secondary btn-test-send"
                  data-config-type="template_testimonial_j60" data-email={auth.email}>
            📧 M'envoyer un aperçu
          </button>
          <span class="test-send-feedback" aria-live="polite"></span>
        </div>
      </div>
      <div class="tab-panel hidden" data-panel="generate">
        <input type="text" class="form-input gen-formation" placeholder="Nom de votre formation" />
        <select class="form-input gen-tone">
          <option value="chaleureux">Chaleureux et bienveillant</option>
          <option value="professionnel">Professionnel et direct</option>
          <option value="motivant">Motivant et dynamique</option>
        </select>
        <input type="text" class="form-input gen-objective" placeholder="Objectif (ex: collecter un avis client)" />
        <button class="btn btn-primary btn-generate" style="align-self:flex-start">✨ Générer l'email</button>
        <p class="ai-error gen-error"></p>
        <div class="generation-result hidden">
          <input type="text" class="form-input subject-preview" readonly placeholder="Sujet généré" />
          <textarea class="form-input body-preview" rows={6} readonly placeholder="Contenu généré"></textarea>
          <button class="btn btn-secondary btn-use-result" style="align-self:flex-start">Utiliser ce contenu →</button>
        </div>
      </div>
    </div>
```

- [ ] **Step 4: Add testimonial tab JS**

In the `<script>` block of `customize.astro`, in the `astro:page-load` listener and in the immediate init section, add a call to `initTestimonialTabs()`. Define this function:

```javascript
function initTestimonialTabs() {
  document.querySelectorAll<HTMLButtonElement>('.testi-tab').forEach((tab) => {
    if (tab.dataset.initialized) return;
    tab.dataset.initialized = 'true';
    tab.addEventListener('click', () => {
      const target = (tab as HTMLElement).dataset.testiTab!;
      document.querySelectorAll('.testi-tab').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      const j30 = document.querySelector<HTMLElement>('[data-config="template_testimonial_j30"]');
      const j60 = document.querySelector<HTMLElement>('[data-config="template_testimonial_j60"]');
      if (j30) j30.style.display = target === 'j30' ? '' : 'none';
      if (j60) j60.style.display = target === 'j60' ? '' : 'none';
    });
  });
}
```

Also add handling of `testimonial_url` form's hidden-value on submit. In the existing `astro:page-load` listener, add:

```javascript
function initTestimonialUrlForm() {
  const form = document.querySelector<HTMLFormElement>('.testimonial-url-form');
  if (!form || form.dataset.initialized) return;
  form.dataset.initialized = 'true';
  form.addEventListener('submit', () => {
    const hiddenVal = form.querySelector<HTMLInputElement>('.hidden-value');
    const urlInput  = form.querySelector<HTMLInputElement>('.testimonial-url-input');
    if (hiddenVal && urlInput) {
      hiddenVal.value = JSON.stringify({ subject: '', body: urlInput.value, active: true });
    }
  });
}
```

Call both functions in both the immediate init and the `astro:page-load` listener.

- [ ] **Step 5: Add testimonial CSS**

In the `<style>` block of `customize.astro`, add:

```css
.testimonial-tabs-header { display: flex; gap: 0.5rem; margin: 1rem 0 0; }
.testi-tab {
  padding: 8px 20px; border-radius: 8px 8px 0 0; border: 1px solid var(--line-2);
  background: transparent; color: var(--fg-muted); font-family: var(--sans);
  font-size: 0.875rem; font-weight: 500; cursor: pointer; border-bottom: none;
}
.testi-tab.active { background: var(--bg-1); color: var(--fg); border-color: var(--line); }
.testimonial-url-card { padding: 1.5rem 2rem; margin-bottom: 0; }
```

- [ ] **Step 6: Verify build**

```bash
npm run build
```

Expected: no TypeScript errors, no Astro component errors.

- [ ] **Step 7: Commit**

```bash
git add src/pages/client/customize.astro
git commit -m "feat(customize): add testimonial requests section with J+30/J+60 tabs (F12)"
```

---

## Task 10 — Final verification

- [ ] **Step 1: Full build check**

```bash
npm run build
```

Expected: exits 0, no TypeScript errors, no warnings about undefined variables.

- [ ] **Step 2: Test checklist (manual)**

- F8 dashboard: stats grid shows 8 cards — 2 new ones "Taux d'ouverture" and "Taux de clic" with "30 derniers jours" subtext
- F8 students drawer: opening a student who has email history shows `.dh-engagement` column; hovering ✓ shows "Ouvert le..." tooltip
- F9 formation selector: with only 1 formation, `<select>` does NOT appear in sidebar; with 2+ formations it appears and "Formations" nav link is visible
- F9 X-Formation-Id: selecting a formation sets `aevum_formation_id` cookie and reloads; subsequent backend calls include the header
- F10 deliverability: `/client/deliverability` loads, stepper renders 5 steps; clicking "Étape suivante" marks step as done and persists in localStorage on reload
- F10 settings: "Deliverability" card with "Voir le guide" link appears after Mode pause section
- F11 customize: "Récupération paniers abandonnés" section appears between the 6 email templates and the custom automations; toggle saves correctly
- F12 customize: "Demandes de témoignage" section appears after F11; J+30 and J+60 tabs switch panels; URL field saves correctly
- Build: `npm run build` exits 0

- [ ] **Step 3: Tag completion**

```bash
git tag phase2-features8-12
```

---

## Self-review against spec

| Requirement | Task |
|-------------|------|
| F8: `open_rate_this_month` + `click_rate_this_month` in StatsData | Task 1 |
| F8: 2 new stat-cards with "30 derniers jours" | Task 1 |
| F8: drawer engagement icons ✓ and 🔗 with timestamps | Task 2 |
| F9: `formation-create.ts` POST proxy | Task 3 |
| F9: `formation-update.ts` PUT proxy | Task 3 |
| F9: `formation-delete.ts` DELETE proxy | Task 3 |
| F9: formation selector in sidebar (only if >1) | Task 4 |
| F9: cookie `aevum_formation_id` written on change + reload | Task 4 |
| F9: "Formations" sidebar link (only if >1) | Task 4 |
| F9: X-Formation-Id header in all 5 pages | Task 5 |
| F9: formations.astro with create/rename/delete | Task 6 |
| F10: deliverability.astro with 5-step stepper | Task 7 |
| F10: localStorage persistence of stepper state | Task 7 |
| F10: settings.astro deliverability card | Task 7 |
| F10: "Deliverability" sidebar link + prefetch | Task 4 |
| F11: `template_checkout_abandon` cust-card with toggle + editor | Task 8 |
| F11: labeled section-divider CSS | Task 8 |
| F11: `{{lien_checkout}}` variable hint | Task 8 |
| F12: testimonial_url URL field | Task 9 |
| F12: J+30 / J+60 tab switching | Task 9 |
| F12: `template_testimonial_j30` + `template_testimonial_j60` cust-cards | Task 9 |
| F12: `{{lien_temoignage}}` variable hint | Task 9 |
| All SSR files: `prerender = false` | Existing pattern maintained |
| All fetch: AbortSignal.timeout(8000) | All tasks follow existing pattern |
