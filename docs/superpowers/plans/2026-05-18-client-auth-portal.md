# Client Auth Portal — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the old token-URL portal with a proper JWT cookie auth system (login page + protected dashboard + settings) backed by the AEVUM backend.

**Architecture:** SSR via Astro `output: 'hybrid'` + Vercel adapter. A `src/lib/auth.ts` utility verifies the `aevum_token` HttpOnly cookie using `jose`. Each protected page calls `getClientFromCookie` at the top of its frontmatter and redirects to `/login` on null. The login page handles POST server-side and sets the cookie on success.

**Tech Stack:** Astro 6 (hybrid SSR), `@astrojs/vercel`, `jose` (JWT), `vitest` (unit tests for auth.ts)

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Delete | `src/pages/client/[token].astro` | Old client-side portal — removed |
| Modify | `src/pages/client/index.astro` | SSR redirect → `/login` |
| Modify | `astro.config.mjs` | Add Vercel adapter, `output: 'hybrid'` |
| Modify | `.env` | Add `JWT_SECRET`, `AEVUM_URL` |
| Create | `vitest.config.ts` | Vitest config |
| Create | `src/lib/auth.ts` | JWT verify + cookie helpers |
| Create | `src/lib/auth.test.ts` | Unit tests for auth.ts |
| Create | `src/pages/login.astro` | Login form + SSR POST handler |
| Create | `src/pages/client/dashboard.astro` | Protected dashboard |
| Create | `src/pages/client/settings.astro` | Password/email change + logout |

---

## Task 1: Install dependencies and configure SSR

**Files:**
- Modify: `package.json` (via npm install)
- Modify: `astro.config.mjs`
- Modify: `.env`
- Create: `vitest.config.ts`

- [ ] **Step 1: Install packages**

```bash
npm install @astrojs/vercel jose
npm install --save-dev vitest
```

- [ ] **Step 2: Update `astro.config.mjs`**

Replace the full file content:

```js
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

export default defineConfig({
  output: 'hybrid',
  adapter: vercel(),
  site: 'https://aevum.fr',
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

- [ ] **Step 3: Add variables to `.env`**

Append to `.env` (leave values empty — user fills them):

```
JWT_SECRET=
AEVUM_URL=
```

- [ ] **Step 4: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
  },
});
```

- [ ] **Step 5: Add test script to `package.json`**

In the `"scripts"` block, add:
```json
"test": "vitest run"
```

- [ ] **Step 6: Verify build still works**

```bash
npm run build
```

Expected: build completes without errors (may warn about missing adapter env vars — that's fine).

- [ ] **Step 7: Commit**

```bash
git add astro.config.mjs package.json package-lock.json .env vitest.config.ts
git commit -m "feat: install vercel adapter + jose + vitest, switch to hybrid SSR"
```

---

## Task 2: auth.ts — tests then implementation

**Files:**
- Create: `src/lib/auth.ts`
- Create: `src/lib/auth.test.ts`

- [ ] **Step 1: Write failing tests in `src/lib/auth.test.ts`**

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { SignJWT } from 'jose';
import { getClientFromCookie, clearAuthCookie } from './auth';

const TEST_SECRET = 'test-secret-at-least-32-chars-long!!';
const encoder = new TextEncoder();

async function makeToken(payload: object, expiresIn = '1h') {
  return new SignJWT(payload as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(encoder.encode(TEST_SECRET));
}

function makeRequest(cookieHeader: string): Request {
  return new Request('http://localhost/', {
    headers: { cookie: cookieHeader },
  });
}

describe('getClientFromCookie', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = TEST_SECRET;
  });

  it('returns null when cookie is absent', async () => {
    const result = await getClientFromCookie(makeRequest(''));
    expect(result).toBeNull();
  });

  it('returns null when token has wrong signature', async () => {
    const token = await makeToken({ clientId: '1', email: 'a@b.com' });
    process.env.JWT_SECRET = 'different-secret-also-32-chars-xxx';
    const result = await getClientFromCookie(makeRequest(`aevum_token=${token}`));
    expect(result).toBeNull();
  });

  it('returns null when token is expired', async () => {
    const token = await makeToken({ clientId: '1', email: 'a@b.com' }, '-1s');
    const result = await getClientFromCookie(makeRequest(`aevum_token=${token}`));
    expect(result).toBeNull();
  });

  it('returns payload for a valid token', async () => {
    const token = await makeToken({ clientId: 'abc123', email: 'client@test.com' });
    const result = await getClientFromCookie(makeRequest(`aevum_token=${token}`));
    expect(result).not.toBeNull();
    expect(result!.clientId).toBe('abc123');
    expect(result!.email).toBe('client@test.com');
    expect(result!.token).toBe(token);
  });

  it('parses cookie among multiple cookies', async () => {
    const token = await makeToken({ clientId: 'xyz', email: 'x@y.com' });
    const req = makeRequest(`session=abc; aevum_token=${token}; other=def`);
    const result = await getClientFromCookie(req);
    expect(result!.clientId).toBe('xyz');
  });
});

describe('clearAuthCookie', () => {
  it('returns a Set-Cookie string that expires the token', () => {
    const header = clearAuthCookie();
    expect(header).toContain('aevum_token=');
    expect(header).toContain('Max-Age=0');
    expect(header).toContain('HttpOnly');
    expect(header).toContain('Path=/');
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npm test
```

Expected: all tests fail with "Cannot find module './auth'".

- [ ] **Step 3: Implement `src/lib/auth.ts`**

```ts
import { jwtVerify } from 'jose';

export interface AuthPayload {
  clientId: string;
  email: string;
  token: string;
}

function extractToken(request: Request): string | null {
  const header = request.headers.get('cookie') ?? '';
  const match = header.match(/(?:^|;\s*)aevum_token=([^;]+)/);
  return match ? match[1] : null;
}

export async function getClientFromCookie(request: Request): Promise<AuthPayload | null> {
  const token = extractToken(request);
  if (!token) return null;

  const secret = process.env.JWT_SECRET;
  if (!secret) return null;

  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    const clientId = payload['clientId'] as string | undefined;
    const email = payload['email'] as string | undefined;
    if (!clientId || !email) return null;
    return { clientId, email, token };
  } catch {
    return null;
  }
}

export function clearAuthCookie(): string {
  return 'aevum_token=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/';
}
```

- [ ] **Step 4: Run tests — verify all pass**

```bash
npm test
```

Expected: 6 tests pass, 0 fail.

- [ ] **Step 5: Commit**

```bash
git add src/lib/auth.ts src/lib/auth.test.ts vitest.config.ts package.json
git commit -m "feat: auth.ts — JWT cookie verification with full test coverage"
```

---

## Task 3: Delete [token].astro, redirect client/index.astro

**Files:**
- Delete: `src/pages/client/[token].astro`
- Modify: `src/pages/client/index.astro`

- [ ] **Step 1: Delete the old token portal**

```bash
rm src/pages/client/\[token\].astro
```

On Windows PowerShell:
```powershell
Remove-Item "src\pages\client\[token].astro"
```

- [ ] **Step 2: Replace `src/pages/client/index.astro` with SSR redirect**

Full file content:

```astro
---
export const prerender = false;
import { getClientFromCookie } from '../../lib/auth';

const client = await getClientFromCookie(Astro.request);
return Astro.redirect(client ? '/client/dashboard' : '/login');
---
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/client/index.astro
git commit -m "feat: remove old token portal, /client redirects to login or dashboard"
```

---

## Task 4: login.astro

**Files:**
- Create: `src/pages/login.astro`

- [ ] **Step 1: Create `src/pages/login.astro`**

```astro
---
export const prerender = false;
import BaseLayout from '../layouts/BaseLayout.astro';
import { getClientFromCookie } from '../lib/auth';

let error = '';

if (Astro.request.method === 'POST') {
  let email = '';
  let password = '';

  try {
    const form = await Astro.request.formData();
    email = (form.get('email') as string ?? '').trim();
    password = (form.get('password') as string ?? '').trim();
  } catch {
    error = 'Une erreur est survenue, réessayez';
  }

  if (!error) {
    try {
      const res = await fetch(`${import.meta.env.AEVUM_URL}/client/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        const data = await res.json();
        Astro.cookies.set('aevum_token', data.token, {
          httpOnly: true,
          secure: true,
          sameSite: 'strict',
          maxAge: 604800,
          path: '/',
        });
        return Astro.redirect('/client/dashboard');
      } else {
        const data = await res.json().catch(() => ({}));
        error = data.message ?? data.error ?? 'Identifiants incorrects';
      }
    } catch {
      error = 'Une erreur est survenue, réessayez';
    }
  }
} else {
  const client = await getClientFromCookie(Astro.request);
  if (client) {
    return Astro.redirect('/client/dashboard');
  }
}
---

<BaseLayout
  title="Connexion — AEVUM"
  description="Connectez-vous à votre espace client AEVUM."
  canonical="/login"
>

<section class="section login-section">
  <div class="container">
    <div class="login-card card">
      <span class="accent-line" style="margin:0 0 1.5rem"></span>
      <h1 style="font-size:1.5rem;margin-bottom:0.5rem">Connexion</h1>
      <p style="color:var(--gray-light);margin-bottom:2rem">Accédez à votre espace client.</p>

      {error && (
        <div class="login-error" role="alert">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span>{error}</span>
        </div>
      )}

      <form method="POST" style="display:flex;flex-direction:column;gap:1.25rem">
        <div class="form-group">
          <label for="email" class="form-label">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            class="form-input"
            placeholder="vous@exemple.fr"
            required
            autocomplete="email"
          />
        </div>
        <div class="form-group">
          <label for="password" class="form-label">Mot de passe</label>
          <input
            type="password"
            id="password"
            name="password"
            class="form-input"
            placeholder="••••••••"
            required
            autocomplete="current-password"
          />
        </div>
        <button type="submit" class="btn btn-primary" style="width:100%">
          Se connecter
        </button>
      </form>
    </div>
  </div>
</section>

</BaseLayout>

<style>
  .login-section { padding-top: 8rem; }
  .login-card {
    max-width: 420px;
    margin: 0 auto;
    padding: 2.5rem 2rem;
  }
  .login-error {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    padding: 0.875rem 1.25rem;
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid #EF4444;
    border-radius: var(--radius-sm);
    color: #EF4444;
    font-size: 0.9375rem;
    font-weight: 500;
    margin-bottom: 1.25rem;
  }
</style>
```

- [ ] **Step 2: Build to catch TypeScript / Astro errors**

```bash
npm run build
```

Expected: builds without errors. If `AEVUM_URL` or `JWT_SECRET` are not set in `.env`, the build still succeeds (they're read at runtime).

- [ ] **Step 3: Commit**

```bash
git add src/pages/login.astro
git commit -m "feat: login.astro — SSR form with JWT cookie on success"
```

---

## Task 5: client/dashboard.astro

**Files:**
- Create: `src/pages/client/dashboard.astro`

- [ ] **Step 1: Create `src/pages/client/dashboard.astro`**

```astro
---
export const prerender = false;
import BaseLayout from '../../layouts/BaseLayout.astro';
import { getClientFromCookie } from '../../lib/auth';

const auth = await getClientFromCookie(Astro.request);
if (!auth) {
  return Astro.redirect('/login');
}

let clientData: { email: string; statut: string; created_at: string; must_change_password?: boolean } | null = null;
let fetchError = '';

try {
  const res = await fetch(`${import.meta.env.AEVUM_URL}/client/me`, {
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  if (res.ok) {
    clientData = await res.json();
  } else {
    fetchError = 'Impossible de charger vos informations.';
  }
} catch {
  fetchError = 'Erreur réseau. Réessayez.';
}

if (clientData?.must_change_password) {
  return Astro.redirect('/client/settings?force=true');
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
---

<BaseLayout
  title="Mon espace — AEVUM"
  description="Votre espace client AEVUM."
  canonical="/client/dashboard"
>

<section class="section dashboard-section">
  <div class="container dashboard-container">
    <div style="margin-bottom:2.5rem">
      <span class="accent-line" style="margin:0 0 1rem"></span>
      <h1 style="font-size:clamp(1.5rem,3vw,2rem)">Mon espace</h1>
    </div>

    {fetchError && (
      <div class="dash-error" role="alert">{fetchError}</div>
    )}

    {clientData && (
      <div class="card dash-info">
        <h2 style="font-size:1.125rem;margin-bottom:1.5rem">Informations du compte</h2>
        <dl class="info-grid">
          <div class="info-row">
            <dt>Email</dt>
            <dd>{clientData.email}</dd>
          </div>
          <div class="info-row">
            <dt>Statut</dt>
            <dd><span class={`status-badge status-${clientData.statut?.toLowerCase()}`}>{clientData.statut}</span></dd>
          </div>
          <div class="info-row">
            <dt>Membre depuis</dt>
            <dd>{formatDate(clientData.created_at)}</dd>
          </div>
        </dl>
        <div style="margin-top:2rem;display:flex;gap:1rem;flex-wrap:wrap">
          <a href="/client/settings" class="btn btn-primary">Paramètres</a>
          <a href="/client/settings?logout=1" class="btn" style="background:var(--dark-elevated);color:var(--gray-light)">Se déconnecter</a>
        </div>
      </div>
    )}
  </div>
</section>

</BaseLayout>

<style>
  .dashboard-section { padding-top: 8rem; }
  .dashboard-container { max-width: 700px; }
  .dash-error {
    padding: 1rem 1.5rem;
    background: rgba(239,68,68,0.1);
    border: 1px solid #EF4444;
    border-radius: var(--radius-sm);
    color: #EF4444;
    margin-bottom: 1.5rem;
  }
  .dash-info { padding: 2rem; }
  .info-grid { display: flex; flex-direction: column; gap: 1rem; }
  .info-row { display: flex; gap: 1rem; align-items: baseline; }
  .info-row dt { width: 140px; font-size: 0.875rem; color: var(--gray); flex-shrink: 0; }
  .info-row dd { font-size: 0.9375rem; color: var(--gray-light); }
  .status-badge {
    display: inline-block;
    padding: 0.25rem 0.625rem;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 600;
    background: var(--dark-elevated);
    color: var(--gray-light);
  }
  .status-badge.status-actif { background: var(--success-light); color: var(--success); }
  .status-badge.status-inactif { background: rgba(239,68,68,0.12); color: #EF4444; }
</style>
```

- [ ] **Step 2: Build to verify**

```bash
npm run build
```

Expected: builds without errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/client/dashboard.astro
git commit -m "feat: dashboard.astro — protected client info page"
```

---

## Task 6: client/settings.astro

**Files:**
- Create: `src/pages/client/settings.astro`

- [ ] **Step 1: Create `src/pages/client/settings.astro`**

```astro
---
export const prerender = false;
import BaseLayout from '../../layouts/BaseLayout.astro';
import { getClientFromCookie } from '../../lib/auth';

const auth = await getClientFromCookie(Astro.request);
if (!auth) {
  return Astro.redirect('/login');
}

// Logout shortcut
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
        emailError = data.message ?? data.error ?? 'Erreur lors du changement d\'email.';
      }
    } catch {
      emailError = 'Une erreur est survenue, réessayez.';
    }
  }
}
---

<BaseLayout
  title="Paramètres — AEVUM"
  description="Gérez votre mot de passe et votre adresse email."
  canonical="/client/settings"
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

    <!-- Password form -->
    <div class="card settings-card">
      <h2 style="font-size:1.125rem;margin-bottom:1.5rem">Changer le mot de passe</h2>
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
    <div class="card settings-card">
      <h2 style="font-size:1.125rem;margin-bottom:1.5rem">Changer l'email</h2>
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

    <!-- Logout -->
    <div style="margin-top:2rem">
      <a href="/client/settings?logout=1" class="btn" style="background:var(--dark-elevated);color:var(--gray-light)">Se déconnecter</a>
    </div>
  </div>
</section>

</BaseLayout>

<style>
  .settings-section { padding-top: 8rem; }
  .settings-container { max-width: 600px; }
  .settings-card { padding: 2rem; margin-bottom: 2rem; }
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
</style>
```

- [ ] **Step 2: Build to verify**

```bash
npm run build
```

Expected: builds without errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/client/settings.astro
git commit -m "feat: settings.astro — password change, email change, logout"
```

---

## Task 7: Final verification

- [ ] **Step 1: Run all tests**

```bash
npm test
```

Expected: 6 tests pass.

- [ ] **Step 2: Full build**

```bash
npm run build
```

Expected: no errors.

- [ ] **Step 3: Manual smoke test**

Fill in `.env` with real `JWT_SECRET` and `AEVUM_URL`, then:

```bash
npm run dev
```

1. Navigate to `http://localhost:4321/login` → login form appears
2. Submit wrong credentials → backend error message shown below form
3. Submit correct credentials → redirected to `/client/dashboard`
4. Navigate to `/client/settings` → both forms appear
5. Submit mismatched passwords → "Les nouveaux mots de passe ne correspondent pas." without calling the backend
6. Click "Se déconnecter" → redirected to `/login`, cookie cleared
7. Navigate to `/client/dashboard` → redirected to `/login` (no cookie)
8. Navigate to `/client/[any-token]` → 404 (old route removed)
9. Navigate to `/client` → redirected to `/login`

- [ ] **Step 4: Final commit if any fixes made**

```bash
git add -A
git commit -m "fix: post-review corrections to client portal"
```

---

## Self-Review Checklist

- [x] **Spec coverage**
  - [x] Delete `[token].astro` — Task 3
  - [x] `src/lib/auth.ts` with `getClientFromCookie(request)` + `clearAuthCookie()` — Task 2
  - [x] `login.astro`: redirect if cookie valid, form, POST handler, set-cookie, error from backend, network error — Task 4
  - [x] `dashboard.astro`: auth guard, `/client/me` fetch, `must_change_password` redirect, display email/statut/date — Task 5
  - [x] `settings.astro`: auth guard, `?force=true` banner, password form with client-side match validation, email form, logout — Task 6
  - [x] `.env` entries — Task 1

- [x] **No placeholders** — all code is complete
- [x] **Type consistency** — `AuthPayload` defined in Task 2 used consistently in Tasks 4–6 via `auth.token`, `auth.email`
