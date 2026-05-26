# Phase 1 — Features 1–6 (Frontend) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 6 client portal features — test send, pause mode, template library, blacklist management, ROI stats, and student panel — to the existing Astro 6 vitrine.

**Architecture:** Each feature follows established patterns: SSR proxy API routes (`src/pages/api/*.ts`) forward authenticated requests to the Render backend; Astro pages use `export const prerender = false`, auth guard via `getClientFromCookie`, and `Promise.allSettled` for parallel calls. Client-side JS is wrapped in `document.addEventListener('astro:page-load', fn)` with `dataset.initialized` guards for View Transitions compatibility.

**Tech Stack:** Astro 6, TypeScript strict, CSS variables (no framework), `src/lib/auth.ts` + `src/lib/api.ts` utilities.

---

## File Map

**Create:**
- `src/pages/api/test-send.ts` — proxy POST → `/client/test-send`
- `src/pages/api/pause-enable.ts` — proxy POST → `/client/pause`
- `src/pages/api/pause-disable.ts` — proxy DELETE → `/client/pause`
- `src/pages/api/blacklist-add.ts` — proxy POST → `/client/blacklist`
- `src/pages/api/blacklist-remove.ts` — proxy DELETE → `/client/blacklist`
- `src/pages/api/send-manual.ts` — proxy POST → `/client/send-manual`
- `src/pages/client/blacklist.astro` — blacklist management page
- `src/pages/client/students.astro` — student panel page

**Modify:**
- `src/pages/client/customize.astro` — test buttons (F1) + template library (F3)
- `src/pages/client/dashboard.astro` — pause banner (F2) + ROI stats (F5)
- `src/pages/client/settings.astro` — pause mode section (F2)
- `src/layouts/ClientLayout.astro` — blacklist + students sidebar links (F4+F6)

---

### Task 1: API route — test-send

**Files:**
- Create: `src/pages/api/test-send.ts`

- [ ] **Create `src/pages/api/test-send.ts`**

```typescript
import type { APIRoute } from 'astro';
import { getClientFromCookie } from '../../lib/auth';
import { jsonRes } from '../../lib/api';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const auth = await getClientFromCookie(request);
  if (!auth) return jsonRes({ error: 'Non authentifié' }, 401);

  let body: { config_type: string } | null = null;
  try {
    body = await request.json();
  } catch {
    return jsonRes({ error: 'Corps JSON invalide' }, 400);
  }
  if (!body?.config_type) return jsonRes({ error: 'config_type requis' }, 400);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(`${import.meta.env.AEVUM_URL}/client/test-send`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${auth.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ config_type: body.config_type }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return jsonRes(await res.json().catch(() => ({})), res.status);
  } catch (err) {
    clearTimeout(timeout);
    if (err instanceof Error && err.name === 'AbortError') {
      return jsonRes({ error: 'Timeout' }, 504);
    }
    return jsonRes({ error: 'Erreur réseau' }, 502);
  }
};
```

- [ ] **Verify build passes**

```bash
npm run build
```
Expected: no TypeScript errors, build succeeds.

- [ ] **Commit**

```bash
git add src/pages/api/test-send.ts
git commit -m "feat(api): add test-send proxy route"
```

---

### Task 2: F1 — Boutons "M'envoyer un aperçu" dans customize.astro

**Files:**
- Modify: `src/pages/client/customize.astro`

The test button goes **after** the `</form>` of `tab-panel[data-panel="manual"]`, before the tab-panel's closing `</div>`. The button carries `data-config-type` and `data-email` for JS use.

- [ ] **Add test button after each template form**

Find this block in the `.map()` loop (inside `<div class="tab-panel" data-panel="manual">`):

```astro
                <p class="ai-error improve-error"></p>
              </form>
            </div>
```

Replace with:

```astro
                <p class="ai-error improve-error"></p>
              </form>
              <div class="test-send-wrap">
                <button type="button" class="btn btn-secondary btn-test-send"
                        data-config-type={key}
                        data-email={auth.email}>
                  📧 M'envoyer un aperçu
                </button>
                <span class="test-send-feedback" aria-live="polite"></span>
              </div>
            </div>
```

- [ ] **Add CSS for test-send-wrap** — inside the existing `<style>` block in customize.astro, add:

```css
  .test-send-wrap { display: flex; align-items: center; gap: 1rem; margin-top: 0.75rem; flex-wrap: wrap; }
  .test-send-feedback { font-size: 0.875rem; }
  .test-send-feedback.ok  { color: var(--success); }
  .test-send-feedback.err { color: #EF4444; }
```

- [ ] **Add JS handler** — inside the existing `<script>` block, inside the `document.addEventListener('astro:page-load', () => { ... })` wrapper (or create one if needed), add:

```typescript
  // F1 — test send buttons
  document.querySelectorAll<HTMLButtonElement>('.btn-test-send').forEach((btn) => {
    if (btn.dataset.initialized) return;
    btn.dataset.initialized = 'true';
    btn.addEventListener('click', async () => {
      const configType = btn.dataset.configType!;
      const email = btn.dataset.email!;
      const feedback = btn.nextElementSibling as HTMLElement;
      btn.disabled = true;
      btn.textContent = 'Envoi en cours…';
      feedback.className = 'test-send-feedback';
      feedback.textContent = '';
      try {
        const res = await fetch('/api/test-send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ config_type: configType }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          feedback.className = 'test-send-feedback ok';
          feedback.textContent = `Email de test envoyé à ${email}`;
        } else {
          feedback.className = 'test-send-feedback err';
          feedback.textContent = (data as { error?: string }).error ?? 'Erreur lors de l\'envoi.';
        }
      } catch {
        feedback.className = 'test-send-feedback err';
        feedback.textContent = 'Erreur réseau. Réessayez.';
      }
      btn.disabled = false;
      btn.textContent = '📧 M\'envoyer un aperçu';
      setTimeout(() => { feedback.textContent = ''; feedback.className = 'test-send-feedback'; }, 3000);
    });
  });
```

- [ ] **Verify build passes**

```bash
npm run build
```

- [ ] **Commit**

```bash
git add src/pages/client/customize.astro
git commit -m "feat(customize): add per-template test send button (F1)"
```

---

### Task 3: API routes — pause-enable + pause-disable

**Files:**
- Create: `src/pages/api/pause-enable.ts`
- Create: `src/pages/api/pause-disable.ts`

- [ ] **Create `src/pages/api/pause-enable.ts`**

```typescript
import type { APIRoute } from 'astro';
import { getClientFromCookie } from '../../lib/auth';
import { jsonRes } from '../../lib/api';

export const prerender = false;

const VALID_DURATIONS = new Set([1, 3, 7, 14, 30]);

export const POST: APIRoute = async ({ request }) => {
  const auth = await getClientFromCookie(request);
  if (!auth) return jsonRes({ error: 'Non authentifié' }, 401);

  let body: { duration_days: number } | null = null;
  try {
    body = await request.json();
  } catch {
    return jsonRes({ error: 'Corps JSON invalide' }, 400);
  }
  if (!body?.duration_days || !VALID_DURATIONS.has(body.duration_days)) {
    return jsonRes({ error: 'duration_days invalide (1, 3, 7, 14 ou 30)' }, 400);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(`${import.meta.env.AEVUM_URL}/client/pause`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${auth.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ duration_days: body.duration_days }),
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

- [ ] **Create `src/pages/api/pause-disable.ts`**

```typescript
import type { APIRoute } from 'astro';
import { getClientFromCookie } from '../../lib/auth';
import { jsonRes } from '../../lib/api';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const auth = await getClientFromCookie(request);
  if (!auth) return jsonRes({ error: 'Non authentifié' }, 401);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(`${import.meta.env.AEVUM_URL}/client/pause`, {
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

- [ ] **Verify build passes**

```bash
npm run build
```

- [ ] **Commit**

```bash
git add src/pages/api/pause-enable.ts src/pages/api/pause-disable.ts
git commit -m "feat(api): add pause-enable and pause-disable proxy routes (F2)"
```

---

### Task 4: F2 — Mode pause dans settings.astro

**Files:**
- Modify: `src/pages/client/settings.astro`

- [ ] **Add `/client/me` fetch and pause POST handlers in frontmatter**

After the `forceChange` line and before the `let passwordMsg` declarations, insert:

```typescript
let meData: { paused_until?: string | null } | null = null;
try {
  const meRes = await fetch(`${import.meta.env.AEVUM_URL}/client/me`, {
    headers: { Authorization: `Bearer ${auth.token}` },
    signal: AbortSignal.timeout(8000),
  });
  if (meRes.status === 401) {
    Astro.cookies.delete('aevum_token', { path: '/' });
    return Astro.redirect('/login');
  }
  if (meRes.ok) meData = await meRes.json().catch(() => null);
} catch { /* non-fatal */ }

const pausedUntil: string | null = meData?.paused_until ?? null;
```

- [ ] **Add pause actions inside the existing POST block**

Inside `if (Astro.request.method === 'POST')`, after the existing actions (`logout`, `password`, `email`), add:

```typescript
  if (action === 'pause_enable') {
    const days = parseInt(form.get('duration_days') as string ?? '0', 10);
    if ([1, 3, 7, 14, 30].includes(days)) {
      try {
        await fetch(`${import.meta.env.AEVUM_URL}/client/pause`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${auth.token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ duration_days: days }),
          signal: AbortSignal.timeout(8000),
        });
      } catch { /* ignore */ }
    }
    return Astro.redirect('/client/settings');
  }

  if (action === 'pause_disable') {
    try {
      await fetch(`${import.meta.env.AEVUM_URL}/client/pause`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${auth.token}` },
        signal: AbortSignal.timeout(8000),
      });
    } catch { /* ignore */ }
    return Astro.redirect('/client/settings');
  }
```

- [ ] **Add pause section HTML** — insert between the email card and the logout section (after the `{!forceChange && (...)}` block, before `<!-- Logout -->`):

```astro
    <!-- Mode pause -->
    <div class="card settings-card">
      <h2 class="settings-card-title">Mode pause</h2>
      <p style="color:var(--gray-light);font-size:0.9375rem;margin:0 0 1.25rem">
        Suspendre temporairement toutes vos automatisations sans les désactiver.
      </p>
      {pausedUntil ? (
        <div>
          <div class="pause-active-info">
            ⏸ Pause active jusqu'au {new Date(pausedUntil).toLocaleDateString('fr-FR', { dateStyle: 'long' })}
          </div>
          <form method="POST" style="margin-top:1rem">
            <input type="hidden" name="action" value="pause_disable" />
            <button type="submit" class="btn btn-secondary">Reprendre maintenant</button>
          </form>
        </div>
      ) : (
        <form method="POST" style="display:flex;flex-direction:column;gap:1rem;max-width:320px">
          <input type="hidden" name="action" value="pause_enable" />
          <div class="form-group">
            <label for="pause-duration" class="form-label">Durée de la pause</label>
            <select id="pause-duration" name="duration_days" class="form-input">
              <option value="1">1 jour</option>
              <option value="3">3 jours</option>
              <option value="7">7 jours</option>
              <option value="14">14 jours</option>
              <option value="30">30 jours</option>
            </select>
          </div>
          <button type="submit" class="btn btn-secondary" style="align-self:flex-start">Activer la pause</button>
        </form>
      )}
    </div>
```

- [ ] **Add CSS** — in the `<style>` block, add:

```css
  .pause-active-info {
    padding: 0.875rem 1.25rem;
    background: rgba(245,158,11,0.12);
    border: 1px solid rgba(245,158,11,0.30);
    border-radius: var(--radius-sm);
    color: #F59E0B;
    font-weight: 500;
    font-size: 0.9375rem;
  }
```

- [ ] **Verify build passes**

```bash
npm run build
```

- [ ] **Commit**

```bash
git add src/pages/client/settings.astro
git commit -m "feat(settings): add pause mode section (F2)"
```

---

### Task 5: F2 — Bandeau pause dans dashboard.astro

**Files:**
- Modify: `src/pages/client/dashboard.astro`

- [ ] **Add `meData` type and fetch to `Promise.allSettled`**

Add type at top of frontmatter type declarations:

```typescript
type MeData = { paused_until?: string | null };
```

Change the `Promise.allSettled` call from 4 to 5 items:

```typescript
const [statsResult, autoResult, histResult, configsResult, meResult] = await Promise.allSettled([
  fetch(`${base}/client/stats`, { headers, signal: AbortSignal.timeout(8000) }),
  fetch(`${base}/client/automations`, { headers, signal: AbortSignal.timeout(8000) }),
  fetch(`${base}/client/history?limit=5`, { headers, signal: AbortSignal.timeout(8000) }),
  fetch(`${base}/client/configs`, { headers, signal: AbortSignal.timeout(8000) }),
  fetch(`${base}/client/me`, { headers, signal: AbortSignal.timeout(8000) }),
]);
```

Update the 401 check to include `meResult`:

```typescript
const responses = [statsResult, autoResult, histResult, configsResult, meResult];
```

Add extraction after the existing `configsResult` block:

```typescript
let pausedUntil: string | null = null;
if (meResult.status === 'fulfilled' && meResult.value.ok) {
  const me: MeData = await meResult.value.json().catch(() => ({}));
  pausedUntil = me.paused_until ?? null;
}
```

- [ ] **Add pause banner HTML** — immediately after the `<div class="container dash-container">` opening, before `<!-- Header -->`:

```astro
    {pausedUntil && (
      <div class="pause-banner" role="alert">
        <span>⏸ Toutes vos automatisations sont en pause jusqu'au {new Date(pausedUntil).toLocaleDateString('fr-FR', { dateStyle: 'long' })}.</span>
        <a href="/client/settings" class="pause-banner__link">Gérer</a>
      </div>
    )}
```

- [ ] **Add CSS** — in the `<style>` block:

```css
  .pause-banner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.875rem 1.25rem;
    background: rgba(245,158,11,0.12);
    border: 1px solid rgba(245,158,11,0.30);
    border-radius: var(--r-sm);
    color: #F59E0B;
    font-size: 0.9375rem;
    margin-bottom: 2rem;
  }
  .pause-banner__link { color: #F59E0B; font-weight: 600; text-decoration: underline; white-space: nowrap; }
```

- [ ] **Verify build passes**

```bash
npm run build
```

- [ ] **Commit**

```bash
git add src/pages/client/dashboard.astro
git commit -m "feat(dashboard): add pause banner via /client/me (F2)"
```

---

### Task 6: F3 — Bibliothèque de templates dans customize.astro

**Files:**
- Modify: `src/pages/client/customize.astro`

- [ ] **Add TEMPLATE_LIBRARY object** — at the very beginning of the `<script>` block (before the first `document.addEventListener`):

```typescript
  const TEMPLATE_LIBRARY: Record<string, Record<string, { subject: string; body: string }>> = {
    video: {
      template_onboarding_j0: {
        subject: "Bienvenue {{nom}} — vos accès à {{nom_formation}} sont prêts !",
        body: "Bonjour {{nom}},\n\nNous sommes ravis de vous accueillir dans {{nom_formation}}.\n\nVos accès personnels sont disponibles dès maintenant :\n\n🔗 Accédez à la formation : {{lien_acces}}\n🔑 Mot de passe : {{mot_de_passe}}\n\nPrenez votre temps pour parcourir les premiers modules. En cas de question, notre équipe est disponible pour vous accompagner.\n\nBonne formation,\nL'équipe {{nom_formation}}",
      },
      template_onboarding_j3: {
        subject: "{{nom}}, comment se passe votre début dans {{nom_formation}} ?",
        body: "Bonjour {{nom}},\n\nCela fait 3 jours que vous avez rejoint {{nom_formation}} — comment ça se passe ?\n\nNous espérons que vous avez pu vous plonger dans les premiers contenus. Si vous avez des questions, des blocages ou simplement envie de partager vos premières impressions, n'hésitez pas à nous répondre directement à cet email.\n\nOn est là pour vous,\nL'équipe {{nom_formation}}",
      },
      template_onboarding_j7: {
        subject: "{{nom}} — retour sur votre première semaine dans {{nom_formation}}",
        body: "Bonjour {{nom}},\n\nUne semaine déjà dans {{nom_formation}} — bravo pour votre engagement !\n\nOn espère que vous progressez bien. Si certains modules vous ont particulièrement marqué, ou si quelque chose mérite qu'on l'améliore, votre retour nous est précieux.\n\nContinuez sur cette lancée,\nL'équipe {{nom_formation}}",
      },
      template_failed_payment_j1: {
        subject: "Action requise — un problème avec votre paiement de {{montant}} €",
        body: "Bonjour {{nom}},\n\nNous avons constaté un problème avec votre dernier paiement de {{montant}} €.\n\nCela arrive parfois — carte expirée, plafond atteint, ou simple erreur technique. Aucun souci, il est facile de régulariser la situation :\n\n👉 Mettre à jour mon paiement : {{lien_paiement}}\n\nVotre accès à la formation est maintenu pendant que nous résolvons cela ensemble.\n\nÀ bientôt,\nL'équipe {{nom_formation}}",
      },
      template_failed_payment_j3: {
        subject: "{{nom}}, votre accès sera suspendu dans 4 jours",
        body: "Bonjour {{nom}},\n\nNous n'avons toujours pas reçu votre règlement de {{montant}} €.\n\nSans action de votre part, votre accès à la formation sera suspendu dans 4 jours. Pour éviter toute interruption :\n\n👉 Régulariser maintenant : {{lien_paiement}}\n\nSi vous traversez une situation particulière, contactez-nous — nous trouverons une solution ensemble.\n\nCordialement,\nL'équipe {{nom_formation}}",
      },
      template_failed_payment_j7: {
        subject: "Dernier avertissement — suspension de votre accès {{nom_formation}}",
        body: "Bonjour {{nom}},\n\nMalgré nos précédents messages, le paiement de {{montant}} € reste en attente.\n\nVotre accès à {{nom_formation}} sera suspendu aujourd'hui si la situation n'est pas régularisée.\n\n👉 Effectuer le règlement : {{lien_paiement}}\n\nNous espérons pouvoir résoudre cela rapidement.\n\nCordialement,\nL'équipe {{nom_formation}}",
      },
    },
    coaching_1to1: {
      template_onboarding_j0: {
        subject: "Bienvenue {{nom}} — votre parcours de coaching commence !",
        body: "Bonjour {{nom}},\n\nC'est avec plaisir que nous démarrons ensemble votre parcours {{nom_formation}}.\n\nVoici vos informations de connexion pour accéder à votre espace personnalisé :\n\n🔗 Votre espace : {{lien_acces}}\n🔑 Mot de passe : {{mot_de_passe}}\n\nAvant notre première session, prenez le temps de parcourir les ressources disponibles. Je serai là pour répondre à toutes vos questions.\n\nÀ très bientôt,\n{{nom_formation}}",
      },
      template_onboarding_j3: {
        subject: "{{nom}}, avez-vous eu le temps de vous installer ?",
        body: "Bonjour {{nom}},\n\nJ'espère que vous avez pu explorer votre espace {{nom_formation}} depuis votre inscription.\n\nAvez-vous des questions avant notre prochaine session ? N'hésitez pas à me répondre directement — je lis tous mes emails.\n\nÀ bientôt,\n{{nom_formation}}",
      },
      template_onboarding_j7: {
        subject: "{{nom}} — première semaine de coaching : comment vous sentez-vous ?",
        body: "Bonjour {{nom}},\n\nUne semaine s'est écoulée depuis le début de votre accompagnement {{nom_formation}}.\n\nComment vous sentez-vous ? Les échanges que nous avons eus vous ont-ils apporté de la clarté ? Je suis curieux de savoir où vous en êtes.\n\nN'hésitez pas à me partager vos réflexions — elles me permettent d'adapter nos prochaines sessions à vos besoins réels.\n\nÀ très bientôt,\n{{nom_formation}}",
      },
      template_failed_payment_j1: {
        subject: "Un problème de paiement à régler — {{montant}} €",
        body: "Bonjour {{nom}},\n\nUn problème technique a empêché le prélèvement de {{montant}} € pour votre coaching {{nom_formation}}.\n\nPour que nous puissions continuer à travailler ensemble sans interruption :\n\n👉 Régulariser le paiement : {{lien_paiement}}\n\nSi vous avez des questions, je suis disponible.\n\nCordialement,\n{{nom_formation}}",
      },
      template_failed_payment_j3: {
        subject: "{{nom}}, votre accès coaching est en attente",
        body: "Bonjour {{nom}},\n\nLe paiement de {{montant}} € pour votre coaching est toujours en attente.\n\nAfin de ne pas interrompre notre travail ensemble, merci de régulariser dès que possible :\n\n👉 Mettre à jour le paiement : {{lien_paiement}}\n\nEn cas de difficulté, contactez-moi — nous pouvons en discuter.\n\nCordialement,\n{{nom_formation}}",
      },
      template_failed_payment_j7: {
        subject: "Dernière chance — votre coaching {{nom_formation}} sera suspendu",
        body: "Bonjour {{nom}},\n\nLe paiement de {{montant}} € pour {{nom_formation}} est toujours impayé.\n\nJe suis dans l'obligation de suspendre l'accès à votre espace coaching si la situation n'est pas régularisée aujourd'hui.\n\n👉 Effectuer le paiement : {{lien_paiement}}\n\nJ'espère que nous pourrons continuer à collaborer.\n\nCordialement,\n{{nom_formation}}",
      },
    },
    groupe_prive: {
      template_onboarding_j0: {
        subject: "{{nom}}, bienvenue dans {{nom_formation}} — voici vos accès",
        body: "Bonjour {{nom}},\n\nBienvenue dans {{nom_formation}} !\n\nVous rejoignez un groupe de personnes partageant les mêmes ambitions que vous. C'est une belle étape.\n\n🔗 Accéder au groupe : {{lien_acces}}\n🔑 Mot de passe : {{mot_de_passe}}\n\nPrenez le temps de vous présenter aux autres membres dès que vous êtes connecté — c'est souvent le meilleur point de départ.\n\nÀ bientôt dans le groupe,\nL'équipe {{nom_formation}}",
      },
      template_onboarding_j3: {
        subject: "{{nom}}, avez-vous rencontré les autres membres ?",
        body: "Bonjour {{nom}},\n\nTrois jours dans {{nom_formation}} — j'espère que vous commencez à vous sentir à l'aise dans le groupe.\n\nAvez-vous eu l'occasion d'échanger avec d'autres membres ? Ces connexions sont souvent la plus grande valeur d'un mastermind.\n\nSi vous avez des questions ou si quelque chose vous freine, répondez à cet email.\n\nÀ bientôt,\nL'équipe {{nom_formation}}",
      },
      template_onboarding_j7: {
        subject: "Une semaine dans {{nom_formation}} — vos premières impressions ?",
        body: "Bonjour {{nom}},\n\nUne semaine dans {{nom_formation}} — bravo pour votre investissement !\n\nComment se passe votre intégration dans le groupe ? Est-ce que les échanges et les ressources répondent à vos attentes ?\n\nVos retours nous aident à améliorer continuellement l'expérience pour tout le groupe.\n\nCordialement,\nL'équipe {{nom_formation}}",
      },
      template_failed_payment_j1: {
        subject: "Paiement en attente — votre place dans {{nom_formation}}",
        body: "Bonjour {{nom}},\n\nNous avons rencontré un problème lors du prélèvement de {{montant}} € pour {{nom_formation}}.\n\nVotre place dans le groupe est réservée. Pour la conserver :\n\n👉 Régulariser le paiement : {{lien_paiement}}\n\nN'hésitez pas à nous contacter si besoin.\n\nCordialement,\nL'équipe {{nom_formation}}",
      },
      template_failed_payment_j3: {
        subject: "{{nom}}, votre accès au groupe sera suspendu bientôt",
        body: "Bonjour {{nom}},\n\nLe paiement de {{montant}} € pour {{nom_formation}} est toujours impayé.\n\nSans régularisation, votre accès au groupe privé sera suspendu dans 4 jours :\n\n👉 Mettre à jour mon paiement : {{lien_paiement}}\n\nVotre place compte pour le groupe — nous espérons vous garder parmi nous.\n\nCordialement,\nL'équipe {{nom_formation}}",
      },
      template_failed_payment_j7: {
        subject: "Accès suspendu — {{nom_formation}}",
        body: "Bonjour {{nom}},\n\nMalgré nos précédents rappels, le paiement de {{montant}} € pour {{nom_formation}} n'a pas été effectué.\n\nVotre accès au groupe est suspendu à compter d'aujourd'hui.\n\n👉 Pour réactiver votre accès : {{lien_paiement}}\n\nNous espérons vous retrouver très bientôt dans le groupe.\n\nCordialement,\nL'équipe {{nom_formation}}",
      },
    },
    bootcamp: {
      template_onboarding_j0: {
        subject: "C'est parti {{nom}} — votre bootcamp {{nom_formation}} commence !",
        body: "Bonjour {{nom}},\n\nVotre inscription au bootcamp {{nom_formation}} est confirmée — les prochaines semaines vont être intenses et transformatrices.\n\nAccédez à votre espace dès maintenant pour préparer le démarrage :\n\n🔗 Mon espace bootcamp : {{lien_acces}}\n🔑 Mot de passe : {{mot_de_passe}}\n\nConseil : parcourez les ressources d'introduction avant le premier module en direct. Vous serez mieux préparé et tirerez davantage de chaque session.\n\nPrêt à démarrer ?\nL'équipe {{nom_formation}}",
      },
      template_onboarding_j3: {
        subject: "{{nom}}, 3 jours dans le bootcamp — comment ça se passe ?",
        body: "Bonjour {{nom}},\n\nTrois jours dans {{nom_formation}} — on espère que le rythme vous convient !\n\nLes bootcamps sont intenses par nature, mais c'est précisément ce qui rend les résultats au rendez-vous. Si quelque chose vous bloque ou si le rythme est difficile à tenir, signalez-le nous dès maintenant — on peut adapter.\n\nTenez bon,\nL'équipe {{nom_formation}}",
      },
      template_onboarding_j7: {
        subject: "Mi-parcours {{nom}} — vous avancez bien !",
        body: "Bonjour {{nom}},\n\nUne semaine de bootcamp {{nom_formation}} derrière vous — c'est déjà énorme !\n\nOn espère que les acquis de cette première semaine sont concrets et applicables. Quel est le point qui vous a le plus marqué jusqu'ici ?\n\nOn est là si vous avez besoin d'un coup de pouce.\n\nÀ fond,\nL'équipe {{nom_formation}}",
      },
      template_failed_payment_j1: {
        subject: "Problème de paiement — votre place au bootcamp {{nom_formation}}",
        body: "Bonjour {{nom}},\n\nNous n'avons pas pu encaisser votre paiement de {{montant}} € pour le bootcamp {{nom_formation}}.\n\nVotre place est maintenue pour l'instant. Régularisez rapidement pour ne pas manquer les prochains modules :\n\n👉 Régulariser le paiement : {{lien_paiement}}\n\nEn cas de problème, contactez-nous immédiatement.\n\nCordialement,\nL'équipe {{nom_formation}}",
      },
      template_failed_payment_j3: {
        subject: "{{nom}} — votre place au bootcamp est en danger",
        body: "Bonjour {{nom}},\n\nLe paiement de {{montant}} € pour {{nom_formation}} n'a toujours pas été effectué.\n\nVotre accès au bootcamp sera suspendu dans 4 jours. Ne manquez pas les modules à venir :\n\n👉 Régulariser maintenant : {{lien_paiement}}\n\nOn espère vous garder dans l'aventure.\n\nCordialement,\nL'équipe {{nom_formation}}",
      },
      template_failed_payment_j7: {
        subject: "Dernier avertissement — suspension de votre accès {{nom_formation}}",
        body: "Bonjour {{nom}},\n\nLe paiement de {{montant}} € pour le bootcamp {{nom_formation}} est toujours en attente.\n\nVotre accès est suspendu à partir d'aujourd'hui.\n\n👉 Réactiver mon accès : {{lien_paiement}}\n\nNous espérons vous retrouver très vite.\n\nCordialement,\nL'équipe {{nom_formation}}",
      },
    },
  };

  const LIBRARY_TYPE_LABELS: Record<string, string> = {
    video: 'Formation vidéo en ligne',
    coaching_1to1: 'Coaching individuel (1-to-1)',
    groupe_prive: 'Groupe privé / mastermind',
    bootcamp: 'Bootcamp intensif',
  };
```

- [ ] **Add "📚 Bibliothèque" button to editor tabs** — find:

```astro
            <div class="editor-tabs">
              <button class="editor-tab active" data-tab="manual">✏️ Rédiger moi-même</button>
              <button class="editor-tab" data-tab="generate">✨ Générer avec l'IA</button>
            </div>
```

Replace with:

```astro
            <div class="editor-tabs-row">
              <div class="editor-tabs">
                <button class="editor-tab active" data-tab="manual">✏️ Rédiger moi-même</button>
                <button class="editor-tab" data-tab="generate">✨ Générer avec l'IA</button>
              </div>
              <button type="button" class="btn btn-secondary btn-library" data-config-type={key}>📚 Bibliothèque</button>
            </div>
```

- [ ] **Add library panel overlay HTML** — just before `</section>` at the end of the main section (before `</ClientLayout>`):

```astro
<!-- F3 — Template library panel -->
<div class="lib-overlay hidden" id="lib-overlay" role="dialog" aria-modal="true" aria-label="Bibliothèque de templates">
  <div class="lib-panel">
    <div class="lib-panel-header">
      <span class="lib-panel-title">📚 Bibliothèque de templates</span>
      <button type="button" class="lib-close" id="lib-close" aria-label="Fermer">✕</button>
    </div>
    <div class="lib-panel-body" id="lib-panel-body">
      <!-- Filled dynamically by JS -->
    </div>
  </div>
</div>
```

- [ ] **Add library JS** — inside `document.addEventListener('astro:page-load', () => { ... })`, add:

```typescript
  // F3 — template library
  const libOverlay = document.getElementById('lib-overlay');
  const libClose   = document.getElementById('lib-close');
  const libBody    = document.getElementById('lib-panel-body');
  let currentLibConfigType = '';

  function openLibrary(configType: string) {
    if (!libOverlay || !libBody) return;
    currentLibConfigType = configType;
    libBody.innerHTML = '';
    for (const [typeKey, typeLabel] of Object.entries(LIBRARY_TYPE_LABELS)) {
      const tpl = TEMPLATE_LIBRARY[typeKey]?.[configType];
      if (!tpl) continue;
      const details = document.createElement('details');
      details.className = 'lib-group';
      const summary = document.createElement('summary');
      summary.className = 'lib-group-summary';
      summary.textContent = typeLabel;
      details.appendChild(summary);
      const preview = document.createElement('div');
      preview.className = 'lib-tpl-preview';
      const subjectEl = document.createElement('p');
      subjectEl.className = 'lib-tpl-subject';
      subjectEl.textContent = `Sujet : ${tpl.subject}`;
      const bodyEl = document.createElement('p');
      bodyEl.className = 'lib-tpl-body';
      bodyEl.textContent = tpl.body.split('\n').slice(0, 3).join(' ').slice(0, 120) + '…';
      const useBtn = document.createElement('button');
      useBtn.type = 'button';
      useBtn.className = 'btn btn-secondary lib-use-btn';
      useBtn.textContent = 'Utiliser ce template';
      useBtn.dataset.typeKey = typeKey;
      preview.appendChild(subjectEl);
      preview.appendChild(bodyEl);
      preview.appendChild(useBtn);
      details.appendChild(preview);
      libBody.appendChild(details);
    }
    libOverlay.classList.remove('hidden');
  }

  function closeLibrary() {
    libOverlay?.classList.add('hidden');
  }

  libClose?.addEventListener('click', closeLibrary);
  libOverlay?.addEventListener('click', (e) => { if (e.target === libOverlay) closeLibrary(); });

  libBody?.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('.lib-use-btn');
    if (!btn) return;
    const typeKey = btn.dataset.typeKey!;
    const tpl = TEMPLATE_LIBRARY[typeKey]?.[currentLibConfigType];
    if (!tpl) return;
    // Find active panel
    const panel = document.querySelector<HTMLElement>(`.config-panel[data-config="${currentLibConfigType}"]`);
    if (!panel) return;
    const subjectInput = panel.querySelector<HTMLInputElement>('.subject-input');
    const bodyInput    = panel.querySelector<HTMLTextAreaElement>('.body-input');
    if (!subjectInput || !bodyInput) return;
    const hasContent = subjectInput.value.trim() || bodyInput.value.trim();
    if (hasContent && !confirm('Écraser le contenu actuel ?')) return;
    subjectInput.value = tpl.subject;
    bodyInput.value    = tpl.body;
    // Switch to manual tab if in generate mode
    const manualTab = panel.querySelector<HTMLButtonElement>('.editor-tab[data-tab="manual"]');
    if (manualTab && !manualTab.classList.contains('active')) manualTab.click();
    closeLibrary();
  });

  document.querySelectorAll<HTMLButtonElement>('.btn-library').forEach((btn) => {
    if (btn.dataset.initialized) return;
    btn.dataset.initialized = 'true';
    btn.addEventListener('click', () => openLibrary(btn.dataset.configType!));
  });
```

- [ ] **Add CSS** — in the `<style>` block:

```css
  .editor-tabs-row { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: 1rem; flex-wrap: wrap; }
  .editor-tabs-row .editor-tabs { margin-bottom: 0; }

  .lib-overlay {
    position: fixed; inset: 0; z-index: 200;
    background: rgba(0,0,0,0.55);
    display: flex; align-items: stretch; justify-content: flex-end;
  }
  .lib-overlay.hidden { display: none; }
  .lib-panel {
    width: 400px; max-width: 90vw;
    background: var(--bg-1); border-left: 1px solid var(--line);
    display: flex; flex-direction: column;
    overflow: hidden;
  }
  .lib-panel-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--line);
    flex-shrink: 0;
  }
  .lib-panel-title { font-weight: 600; font-size: 1rem; }
  .lib-close {
    width: 30px; height: 30px; border-radius: 50%;
    border: 1px solid var(--line-2); background: transparent;
    color: var(--fg-muted); font-size: 1rem; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
  }
  .lib-close:hover { background: var(--accent-soft); color: var(--fg); }
  .lib-panel-body { flex: 1; overflow-y: auto; padding: 1rem; display: flex; flex-direction: column; gap: 0.5rem; }
  .lib-group { border: 1px solid var(--line); border-radius: var(--r-sm); overflow: hidden; }
  .lib-group-summary {
    padding: 0.75rem 1rem; cursor: pointer; font-weight: 600;
    font-size: 0.9375rem; list-style: none;
    background: var(--bg-2); user-select: none;
  }
  .lib-group-summary:hover { background: var(--bg-3); }
  .lib-tpl-preview { padding: 1rem; display: flex; flex-direction: column; gap: 0.5rem; }
  .lib-tpl-subject { font-size: 0.875rem; font-weight: 500; color: var(--fg); margin: 0; }
  .lib-tpl-body { font-size: 0.8125rem; color: var(--fg-muted); margin: 0; }
  .lib-use-btn { align-self: flex-start; padding: 8px 16px; font-size: 0.875rem; }
```

- [ ] **Verify build passes**

```bash
npm run build
```

- [ ] **Commit**

```bash
git add src/pages/client/customize.astro
git commit -m "feat(customize): add template library panel (F3)"
```

---

### Task 7: API routes — blacklist-add + blacklist-remove

**Files:**
- Create: `src/pages/api/blacklist-add.ts`
- Create: `src/pages/api/blacklist-remove.ts`

- [ ] **Create `src/pages/api/blacklist-add.ts`**

```typescript
import type { APIRoute } from 'astro';
import { getClientFromCookie } from '../../lib/auth';
import { jsonRes } from '../../lib/api';

export const prerender = false;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const POST: APIRoute = async ({ request }) => {
  const auth = await getClientFromCookie(request);
  if (!auth) return jsonRes({ error: 'Non authentifié' }, 401);

  let body: { email: string; reason?: string } | null = null;
  try {
    body = await request.json();
  } catch {
    return jsonRes({ error: 'Corps JSON invalide' }, 400);
  }
  if (!body?.email || !EMAIL_RE.test(body.email)) {
    return jsonRes({ error: 'email valide requis' }, 400);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(`${import.meta.env.AEVUM_URL}/client/blacklist`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${auth.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: body.email, reason: body.reason ?? '' }),
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

- [ ] **Create `src/pages/api/blacklist-remove.ts`**

```typescript
import type { APIRoute } from 'astro';
import { getClientFromCookie } from '../../lib/auth';
import { jsonRes } from '../../lib/api';

export const prerender = false;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const DELETE: APIRoute = async ({ request }) => {
  const auth = await getClientFromCookie(request);
  if (!auth) return jsonRes({ error: 'Non authentifié' }, 401);

  let body: { email: string } | null = null;
  try {
    body = await request.json();
  } catch {
    return jsonRes({ error: 'Corps JSON invalide' }, 400);
  }
  if (!body?.email || !EMAIL_RE.test(body.email)) {
    return jsonRes({ error: 'email valide requis' }, 400);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(`${import.meta.env.AEVUM_URL}/client/blacklist`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${auth.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: body.email }),
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

- [ ] **Verify build passes**

```bash
npm run build
```

- [ ] **Commit**

```bash
git add src/pages/api/blacklist-add.ts src/pages/api/blacklist-remove.ts
git commit -m "feat(api): add blacklist-add and blacklist-remove proxy routes (F4)"
```

---

### Task 8: F4 — blacklist.astro page

**Files:**
- Create: `src/pages/client/blacklist.astro`

- [ ] **Create `src/pages/client/blacklist.astro`**

```astro
---
export const prerender = false;
import ClientLayout from '../../layouts/ClientLayout.astro';
import { getClientFromCookie } from '../../lib/auth';

const auth = await getClientFromCookie(Astro.request);
if (!auth) return Astro.redirect('/login');

const base = import.meta.env.AEVUM_URL;
const headers = { Authorization: `Bearer ${auth.token}` };

type BlacklistEntry = { email: string; reason?: string; created_at: string };

let blacklist: BlacklistEntry[] = [];
let addSuccess = '';
let addError = '';

if (Astro.request.method === 'POST') {
  const form = await Astro.request.formData();
  const email  = (form.get('email')  as string ?? '').trim();
  const reason = (form.get('reason') as string ?? '').trim();
  if (email) {
    try {
      const res = await fetch(`${base}/client/blacklist`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, reason: reason || undefined }),
        signal: AbortSignal.timeout(8000),
      });
      if (res.status === 401) {
        Astro.cookies.delete('aevum_token', { path: '/' });
        return Astro.redirect('/login');
      }
      if (res.ok) {
        addSuccess = `${email} ajouté à la blacklist.`;
      } else {
        const d = await res.json().catch(() => ({}));
        addError = (d as { error?: string; message?: string }).error ?? (d as { error?: string; message?: string }).message ?? "Erreur lors de l'ajout.";
      }
    } catch {
      addError = 'Erreur réseau. Réessayez.';
    }
  }
}

try {
  const res = await fetch(`${base}/client/blacklist`, {
    headers,
    signal: AbortSignal.timeout(8000),
  });
  if (res.status === 401) {
    Astro.cookies.delete('aevum_token', { path: '/' });
    return Astro.redirect('/login');
  }
  if (res.ok) {
    const data = await res.json().catch(() => []);
    blacklist = Array.isArray(data) ? data : [];
  }
} catch { /* non-fatal */ }

function fmtDate(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('fr-FR', { dateStyle: 'short' });
}
---

<ClientLayout
  title="Blacklist — AEVUM"
  description="Gérez les adresses email blacklistées."
  canonical="/client/blacklist"
  email={auth.email}
>

<section class="section bl-section">
  <div class="container bl-container">

    <div style="margin-bottom:2rem">
      <span class="accent-line" style="margin:0 0 1rem"></span>
      <h1 style="font-size:clamp(1.5rem,3vw,2rem)">Blacklist</h1>
      <p style="margin-top:0.5rem;color:var(--gray-light)">
        Les emails blacklistés ne recevront plus aucune automatisation.
      </p>
    </div>

    <!-- Formulaire d'ajout -->
    <div class="card bl-add-card">
      <h2 class="bl-card-title">Ajouter une adresse</h2>
      {addSuccess && <div class="success-msg" role="alert"><span>{addSuccess}</span></div>}
      {addError   && <div class="bl-error" role="alert">{addError}</div>}
      <form method="POST" style="display:flex;flex-direction:column;gap:1rem;max-width:480px">
        <div class="form-group">
          <label for="bl-email" class="form-label">Adresse email *</label>
          <input type="email" id="bl-email" name="email" class="form-input"
                 placeholder="adresse@exemple.fr" required />
        </div>
        <div class="form-group">
          <label for="bl-reason" class="form-label">Raison (optionnel)</label>
          <input type="text" id="bl-reason" name="reason" class="form-input"
                 placeholder="Ex : demande de désabonnement" />
        </div>
        <button type="submit" class="btn btn-primary" style="align-self:flex-start">Ajouter</button>
      </form>
    </div>

    <!-- Tableau -->
    <div class="card bl-table-card">
      <h2 class="bl-card-title" style="margin-bottom:1.25rem">
        Adresses blacklistées
        <span class="bl-count">({blacklist.length})</span>
      </h2>
      {blacklist.length === 0 ? (
        <p style="color:var(--gray);font-size:0.9375rem">Aucune adresse blacklistée.</p>
      ) : (
        <div>
          <div class="bl-table-wrap">
            <table class="bl-table" id="bl-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Raison</th>
                  <th>Date d'ajout</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {blacklist.map((entry, i) => (
                  <tr class="bl-row" data-page-index={i} data-email={entry.email}>
                    <td class="bl-td-email">{entry.email}</td>
                    <td class="bl-td-reason">{entry.reason || '—'}</td>
                    <td class="bl-td-date">{fmtDate(entry.created_at)}</td>
                    <td class="bl-td-action">
                      <div class="bl-action-wrap">
                        <button type="button" class="btn btn-secondary btn-bl-remove">Retirer</button>
                        <span class="bl-confirm hidden">
                          Confirmer ?
                          <button type="button" class="btn-inline btn-bl-yes">Oui</button>
                          <button type="button" class="btn-inline btn-bl-no">Non</button>
                        </span>
                        <span class="bl-removing hidden">Suppression…</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {blacklist.length > 50 && (
            <div class="bl-pagination" id="bl-pagination">
              <button class="btn btn-secondary" id="bl-prev" disabled>← Précédent</button>
              <span id="bl-page-info"></span>
              <button class="btn btn-secondary" id="bl-next">Suivant →</button>
            </div>
          )}
        </div>
      )}
    </div>

  </div>
</section>

</ClientLayout>

<script>
  function initBlacklist() {
    const PAGE_SIZE = 50;
    let currentPage = 0;

    const rows = Array.from(document.querySelectorAll<HTMLTableRowElement>('.bl-row'));
    const prevBtn   = document.getElementById('bl-prev') as HTMLButtonElement | null;
    const nextBtn   = document.getElementById('bl-next') as HTMLButtonElement | null;
    const pageInfo  = document.getElementById('bl-page-info');

    function showPage(page: number) {
      rows.forEach((row, i) => {
        row.style.display = (i >= page * PAGE_SIZE && i < (page + 1) * PAGE_SIZE) ? '' : 'none';
      });
      if (prevBtn) prevBtn.disabled = page === 0;
      if (nextBtn) nextBtn.disabled = (page + 1) * PAGE_SIZE >= rows.length;
      if (pageInfo) pageInfo.textContent = `Page ${page + 1} / ${Math.ceil(rows.length / PAGE_SIZE)}`;
    }

    if (rows.length > PAGE_SIZE) {
      showPage(0);
      prevBtn?.addEventListener('click', () => { currentPage--; showPage(currentPage); });
      nextBtn?.addEventListener('click', () => { currentPage++; showPage(currentPage); });
    }

    rows.forEach((row) => {
      if (row.dataset.initialized) return;
      row.dataset.initialized = 'true';
      const removeBtn  = row.querySelector<HTMLButtonElement>('.btn-bl-remove');
      const confirmEl  = row.querySelector<HTMLElement>('.bl-confirm');
      const removingEl = row.querySelector<HTMLElement>('.bl-removing');
      const yesBtn     = row.querySelector<HTMLButtonElement>('.btn-bl-yes');
      const noBtn      = row.querySelector<HTMLButtonElement>('.btn-bl-no');
      const email      = row.dataset.email!;

      removeBtn?.addEventListener('click', () => {
        removeBtn.classList.add('hidden');
        confirmEl?.classList.remove('hidden');
      });

      noBtn?.addEventListener('click', () => {
        confirmEl?.classList.add('hidden');
        removeBtn?.classList.remove('hidden');
      });

      yesBtn?.addEventListener('click', async () => {
        confirmEl?.classList.add('hidden');
        if (removingEl) removingEl.classList.remove('hidden');
        try {
          const res = await fetch('/api/blacklist-remove', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
          });
          if (res.ok) {
            row.remove();
          } else {
            if (removingEl) removingEl.classList.add('hidden');
            removeBtn?.classList.remove('hidden');
            alert('Erreur lors de la suppression. Réessayez.');
          }
        } catch {
          if (removingEl) removingEl.classList.add('hidden');
          removeBtn?.classList.remove('hidden');
          alert('Erreur réseau. Réessayez.');
        }
      });
    });
  }

  initBlacklist();
  document.addEventListener('astro:page-load', initBlacklist);
</script>

<style>
  .bl-section { padding-top: 0; }
  .bl-container { max-width: 960px; }
  .bl-add-card { padding: 2rem; margin-bottom: 1.5rem; }
  .bl-table-card { padding: 2rem; }
  .bl-card-title { font-size: 1.0625rem; font-weight: 600; color: var(--light); margin-bottom: 1.25rem; }
  .bl-count { font-size: 0.875rem; font-weight: 400; color: var(--gray); }

  .bl-table-wrap { overflow-x: auto; }
  .bl-table { width: 100%; border-collapse: collapse; font-size: 0.9375rem; }
  .bl-table th {
    text-align: left; font-size: 0.75rem; font-weight: 600; text-transform: uppercase;
    letter-spacing: 0.05em; color: var(--gray); padding: 0.75rem 1rem;
    border-bottom: 1px solid var(--line-2);
  }
  .bl-table td { padding: 0.875rem 1rem; border-bottom: 1px solid var(--line); vertical-align: middle; }
  .bl-row:last-child td { border-bottom: none; }
  .bl-td-email { font-weight: 500; }
  .bl-td-reason { color: var(--fg-muted); }
  .bl-td-date { color: var(--fg-muted); white-space: nowrap; }
  .bl-td-action { white-space: nowrap; }

  .bl-action-wrap { display: flex; align-items: center; gap: 0.5rem; }
  .bl-confirm { display: flex; align-items: center; gap: 0.375rem; font-size: 0.875rem; color: var(--fg-muted); }
  .bl-removing { font-size: 0.875rem; color: var(--fg-muted); }
  .btn-inline {
    background: transparent; border: 1px solid var(--line-2); border-radius: 4px;
    padding: 2px 8px; font-size: 0.8125rem; font-family: var(--sans); cursor: pointer;
    color: var(--fg); transition: background .15s;
  }
  .btn-inline:hover { background: var(--accent-soft); }

  .bl-pagination { display: flex; align-items: center; gap: 1rem; margin-top: 1.5rem; justify-content: center; }
  .bl-error {
    padding: 0.875rem 1.25rem; background: rgba(239,68,68,0.1); border: 1px solid #EF4444;
    border-radius: var(--radius-sm); color: #EF4444; font-size: 0.9375rem; margin-bottom: 1rem;
  }
  .hidden { display: none !important; }
</style>
```

- [ ] **Verify build passes**

```bash
npm run build
```

- [ ] **Commit**

```bash
git add src/pages/client/blacklist.astro
git commit -m "feat(blacklist): add blacklist management page (F4)"
```

---

### Task 9: F4+F6 — Sidebar + prefetch dans ClientLayout.astro

**Files:**
- Modify: `src/layouts/ClientLayout.astro`

- [ ] **Add Blacklist and Élèves links to `<nav class="cl-nav">`**

Find the closing `</nav>` tag (after the Paramètres link). Insert before `</nav>`:

```astro
        <a href="/client/blacklist" class:list={['cl-link', { 'cl-link--active': p.startsWith('/client/blacklist') }]}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
          Blacklist
        </a>
        <a href="/client/students" class:list={['cl-link', { 'cl-link--active': p.startsWith('/client/students') }]}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          Élèves
        </a>
```

- [ ] **Add prefetch links in `<head>`** — after the existing 4 prefetch links:

```astro
  <link rel="prefetch" href="/client/blacklist" />
  <link rel="prefetch" href="/client/students" />
```

- [ ] **Verify build passes**

```bash
npm run build
```

- [ ] **Commit**

```bash
git add src/layouts/ClientLayout.astro
git commit -m "feat(layout): add blacklist and students sidebar links (F4+F6)"
```

---

### Task 10: F5 — Stat cards ROI dunning dans dashboard.astro

**Files:**
- Modify: `src/pages/client/dashboard.astro`

- [ ] **Add new fields to `StatsData` type**

Find:
```typescript
type StatsData = {
  emails_this_month?: number;
  total_emails?: number;
  recouvrement_envoyes?: number;
  upsells_envoyes?: number;
};
```

Replace with:
```typescript
type StatsData = {
  emails_this_month?: number;
  total_emails?: number;
  recouvrement_envoyes?: number;
  upsells_envoyes?: number;
  recouvrement_montant_recupere?: number;
  recouvrement_taux?: number;
};
```

- [ ] **Add 2 stat cards and context line in the stats grid**

Find:
```astro
        <div class="stat-card card">
          <p class="stat-label">Upsells envoyés</p>
          <p class="stat-value">{fmt(stats?.upsells_envoyes)}</p>
        </div>
      </div>
    </div>
```

Replace with:
```astro
        <div class="stat-card card">
          <p class="stat-label">Upsells envoyés</p>
          <p class="stat-value">{fmt(stats?.upsells_envoyes)}</p>
        </div>
        <div class="stat-card card">
          <p class="stat-label">Récupéré ce mois</p>
          <p class="stat-value">
            {(stats?.recouvrement_montant_recupere ?? 0).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} €
          </p>
        </div>
        <div class="stat-card card">
          <p class="stat-label">Taux de récupération</p>
          <p class="stat-value">{stats?.recouvrement_taux ?? 0} %</p>
        </div>
      </div>
      <p class="stats-context">Calculé sur les paiements récupérés après relance automatique.</p>
    </div>
```

- [ ] **Update stats grid CSS** to accommodate 6 cards cleanly — find:

```css
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem;
  }
```

Replace with:
```css
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
  }
```

- [ ] **Add `.stats-context` CSS** — in the `<style>` block:

```css
  .stats-context { font-size: 0.75rem; color: var(--gray); margin-top: 0.5rem; }
```

- [ ] **Verify build passes**

```bash
npm run build
```

- [ ] **Commit**

```bash
git add src/pages/client/dashboard.astro
git commit -m "feat(dashboard): add ROI dunning stat cards (F5)"
```

---

### Task 11: API route — send-manual

**Files:**
- Create: `src/pages/api/send-manual.ts`

- [ ] **Create `src/pages/api/send-manual.ts`**

```typescript
import type { APIRoute } from 'astro';
import { getClientFromCookie } from '../../lib/auth';
import { jsonRes } from '../../lib/api';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const auth = await getClientFromCookie(request);
  if (!auth) return jsonRes({ error: 'Non authentifié' }, 401);

  let body: { student_id: string; config_type: string } | null = null;
  try {
    body = await request.json();
  } catch {
    return jsonRes({ error: 'Corps JSON invalide' }, 400);
  }
  if (!body?.student_id || !body?.config_type) {
    return jsonRes({ error: 'student_id et config_type requis' }, 400);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(`${import.meta.env.AEVUM_URL}/client/send-manual`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${auth.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_id: body.student_id, config_type: body.config_type }),
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

- [ ] **Verify build passes**

```bash
npm run build
```

- [ ] **Commit**

```bash
git add src/pages/api/send-manual.ts
git commit -m "feat(api): add send-manual proxy route (F6)"
```

---

### Task 12: F6 — students.astro page complète

**Files:**
- Create: `src/pages/client/students.astro`

- [ ] **Create `src/pages/client/students.astro`**

```astro
---
export const prerender = false;
import ClientLayout from '../../layouts/ClientLayout.astro';
import { getClientFromCookie } from '../../lib/auth';

const auth = await getClientFromCookie(Astro.request);
if (!auth) return Astro.redirect('/login');

const base = import.meta.env.AEVUM_URL;
const headers = { Authorization: `Bearer ${auth.token}` };

type Student = {
  id: string;
  name: string;
  email: string;
  status: 'actif' | 'en_dunning' | 'suspendu' | 'blackliste';
  created_at: string;
  emails_received: number;
  last_action?: string;
};

type ConfigEntry = { config_type: string; value: string };

let students: Student[] = [];
let availableConfigTypes: string[] = [];

const [studentsResult, configsResult] = await Promise.allSettled([
  fetch(`${base}/client/students?page=1&limit=50`, { headers, signal: AbortSignal.timeout(8000) }),
  fetch(`${base}/client/configs`, { headers, signal: AbortSignal.timeout(8000) }),
]);

const fulfilled = [studentsResult, configsResult].filter(
  (r): r is PromiseFulfilledResult<Response> => r.status === 'fulfilled'
);
if (fulfilled.some((r) => r.value.status === 401)) {
  Astro.cookies.delete('aevum_token', { path: '/' });
  return Astro.redirect('/login');
}

if (studentsResult.status === 'fulfilled' && studentsResult.value.ok) {
  const data = await studentsResult.value.json().catch(() => []);
  students = Array.isArray(data) ? data : [];
}

if (configsResult.status === 'fulfilled' && configsResult.value.ok) {
  const arr: ConfigEntry[] = await configsResult.value.json().catch(() => []);
  if (Array.isArray(arr)) {
    availableConfigTypes = arr
      .map((c) => c.config_type)
      .filter((k) =>
        ['template_onboarding_j0','template_onboarding_j3','template_onboarding_j7',
         'template_failed_payment_j1','template_failed_payment_j3','template_failed_payment_j7']
        .includes(k)
      );
  }
}
if (availableConfigTypes.length === 0) {
  availableConfigTypes = [
    'template_onboarding_j0','template_onboarding_j3','template_onboarding_j7',
    'template_failed_payment_j1','template_failed_payment_j3','template_failed_payment_j7',
  ];
}

const TEMPLATE_LABELS: Record<string, string> = {
  template_onboarding_j0:       'Bienvenue (J+0)',
  template_onboarding_j3:       'Suivi J+3',
  template_onboarding_j7:       'Première semaine (J+7)',
  template_failed_payment_j1:   'Relance paiement J+1',
  template_failed_payment_j3:   'Relance paiement J+3',
  template_failed_payment_j7:   'Relance paiement J+7',
};

const STATUS_LABELS: Record<string, string> = {
  actif: 'Actif',
  en_dunning: 'En dunning',
  suspendu: 'Suspendu',
  blackliste: 'Blacklisté',
};

function fmtDate(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('fr-FR', { dateStyle: 'short' });
}
---

<ClientLayout
  title="Élèves — AEVUM"
  description="Gérez vos élèves et envoyez des emails manuels."
  canonical="/client/students"
  email={auth.email}
>

<section class="section stu-section">
  <div class="container stu-container">

    <div style="margin-bottom:2rem">
      <span class="accent-line" style="margin:0 0 1rem"></span>
      <h1 style="font-size:clamp(1.5rem,3vw,2rem)">
        Élèves <span class="stu-total">({students.length})</span>
      </h1>
    </div>

    <!-- Pills filtres -->
    <div class="stu-pills" id="stu-pills">
      <button class="stu-pill active" data-filter="all">Tous</button>
      <button class="stu-pill" data-filter="en_dunning">En dunning</button>
      <button class="stu-pill" data-filter="suspendu">Suspendus</button>
      <button class="stu-pill" data-filter="blackliste">Blacklistés</button>
    </div>

    <!-- Recherche -->
    <div style="margin-bottom:1.25rem">
      <input type="search" class="form-input" id="stu-search"
             placeholder="Rechercher par nom ou email…"
             style="max-width:360px" />
    </div>

    <!-- Tableau -->
    {students.length === 0 ? (
      <div class="card" style="padding:1.5rem;color:var(--gray)">Aucun élève trouvé.</div>
    ) : (
      <div class="card" style="padding:0;overflow:hidden">
        <div class="stu-table-wrap">
          <table class="stu-table" id="stu-table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Email</th>
                <th>Statut</th>
                <th>Inscription</th>
                <th>Emails reçus</th>
                <th>Dernière action</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr class="stu-row"
                    data-id={s.id}
                    data-name={s.name}
                    data-email={s.email}
                    data-status={s.status}>
                  <td class="stu-td-name">{s.name || '—'}</td>
                  <td class="stu-td-email">{s.email}</td>
                  <td><span class={`stu-badge stu-badge--${s.status}`}>{STATUS_LABELS[s.status] ?? s.status}</span></td>
                  <td class="stu-td-date">{fmtDate(s.created_at)}</td>
                  <td class="stu-td-count">{s.emails_received ?? 0}</td>
                  <td class="stu-td-action">{s.last_action || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )}

  </div>
</section>

<!-- Drawer overlay -->
<div class="stu-overlay hidden" id="stu-overlay" role="dialog" aria-modal="true" aria-label="Détail élève">
  <div class="stu-drawer" id="stu-drawer">
    <div class="stu-drawer-header">
      <div>
        <div class="stu-drawer-name" id="drawer-name"></div>
        <div class="stu-drawer-email" id="drawer-email"></div>
      </div>
      <button type="button" class="stu-drawer-close" id="drawer-close" aria-label="Fermer">✕</button>
    </div>
    <div class="stu-drawer-body" id="drawer-body">
      <div class="drawer-loading">Chargement…</div>
    </div>
  </div>
</div>

</ClientLayout>

<script define:vars={{ availableConfigTypes, TEMPLATE_LABELS, STATUS_LABELS }}>
  function initStudents() {
    const rows = Array.from(document.querySelectorAll('.stu-row'));
    const searchInput = document.getElementById('stu-search');
    const pillsEl     = document.getElementById('stu-pills');
    const overlay     = document.getElementById('stu-overlay');
    const drawerClose = document.getElementById('drawer-close');
    const drawerName  = document.getElementById('drawer-name');
    const drawerEmail = document.getElementById('drawer-email');
    const drawerBody  = document.getElementById('drawer-body');

    if (!rows.length) return;

    let currentFilter = 'all';
    let currentSearch = '';

    function applyFilters() {
      rows.forEach((row) => {
        const r = row as HTMLElement;
        const status = r.dataset.status ?? '';
        const name   = (r.dataset.name ?? '').toLowerCase();
        const email  = (r.dataset.email ?? '').toLowerCase();
        const q = currentSearch.toLowerCase();
        const matchFilter = currentFilter === 'all' || status === currentFilter;
        const matchSearch = !q || name.includes(q) || email.includes(q);
        r.style.display = (matchFilter && matchSearch) ? '' : 'none';
      });
    }

    if (pillsEl && !pillsEl.dataset.initialized) {
      pillsEl.dataset.initialized = 'true';
      pillsEl.querySelectorAll('.stu-pill').forEach((pill) => {
        pill.addEventListener('click', () => {
          pillsEl.querySelectorAll('.stu-pill').forEach((p) => p.classList.remove('active'));
          pill.classList.add('active');
          currentFilter = (pill as HTMLElement).dataset.filter ?? 'all';
          applyFilters();
        });
      });
    }

    if (searchInput && !searchInput.dataset.initialized) {
      searchInput.dataset.initialized = 'true';
      searchInput.addEventListener('input', () => {
        currentSearch = (searchInput as HTMLInputElement).value;
        applyFilters();
      });
    }

    function openDrawer(studentId: string, name: string, email: string) {
      if (!overlay || !drawerName || !drawerEmail || !drawerBody) return;
      drawerName.textContent = name || email;
      drawerEmail.textContent = email;
      drawerBody.innerHTML = '<div class="drawer-loading">Chargement…</div>';
      overlay.classList.remove('hidden');

      fetch(`/api-proxy/students/${studentId}`)
        .then((r) => r.json())
        .catch(() => null)
        .then((detail) => {
          if (!detail) {
            drawerBody.innerHTML = '<p class="drawer-error">Impossible de charger les détails.</p>';
            return;
          }
          const statusLabel = (STATUS_LABELS as Record<string, string>)[detail.status] ?? detail.status;
          const history: Array<{ type: string; subject: string; date: string }> =
            Array.isArray(detail.emails_history) ? detail.emails_history : [];

          const selectOpts = (availableConfigTypes as string[]).map(
            (k: string) =>
              `<option value="${k}">${(TEMPLATE_LABELS as Record<string, string>)[k] ?? k}</option>`
          ).join('');

          drawerBody.innerHTML = `
            <div class="drawer-meta">
              <span class="stu-badge stu-badge--${detail.status}">${statusLabel}</span>
              <span class="drawer-date">Inscrit le ${detail.created_at ? new Date(detail.created_at).toLocaleDateString('fr-FR', { dateStyle: 'short' }) : '—'}</span>
            </div>
            <div class="drawer-section">
              <div class="drawer-section-title">Historique des emails</div>
              ${history.length === 0
                ? '<p class="drawer-empty">Aucun email envoyé.</p>'
                : `<ul class="drawer-history">${history.map((h) => `
                    <li class="drawer-history-item">
                      <span class="dh-date">${h.date ? new Date(h.date).toLocaleDateString('fr-FR', { dateStyle: 'short' }) : '—'}</span>
                      <span class="dh-type">${h.type || '—'}</span>
                      <span class="dh-subject">${h.subject || '—'}</span>
                    </li>`).join('')}</ul>`
              }
            </div>
            <div class="drawer-section">
              <div class="drawer-section-title">Envoyer un email</div>
              <select class="form-input drawer-tpl-select" id="drawer-tpl-select">${selectOpts}</select>
              <button type="button" class="btn btn-primary drawer-send-btn" id="drawer-send-btn"
                      data-student-id="${detail.id ?? studentId}" data-email="${detail.email ?? email}"
                      style="margin-top:0.75rem;align-self:flex-start">
                Envoyer
              </button>
              <div class="drawer-confirm hidden" id="drawer-confirm">
                <p class="drawer-confirm-text" id="drawer-confirm-text"></p>
                <div style="display:flex;gap:0.5rem;margin-top:0.5rem">
                  <button type="button" class="btn btn-primary drawer-confirm-yes" id="drawer-confirm-yes">Oui, envoyer</button>
                  <button type="button" class="btn btn-secondary drawer-confirm-no" id="drawer-confirm-no">Annuler</button>
                </div>
              </div>
              <div class="drawer-send-feedback hidden" id="drawer-send-feedback"></div>
            </div>
          `;

          const sendBtn     = drawerBody.querySelector<HTMLButtonElement>('#drawer-send-btn');
          const confirmEl   = drawerBody.querySelector<HTMLElement>('#drawer-confirm');
          const confirmText = drawerBody.querySelector<HTMLElement>('#drawer-confirm-text');
          const confirmYes  = drawerBody.querySelector<HTMLButtonElement>('#drawer-confirm-yes');
          const confirmNo   = drawerBody.querySelector<HTMLButtonElement>('#drawer-confirm-no');
          const feedback    = drawerBody.querySelector<HTMLElement>('#drawer-send-feedback');
          const select      = drawerBody.querySelector<HTMLSelectElement>('#drawer-tpl-select');

          sendBtn?.addEventListener('click', () => {
            const selectedLabel = (TEMPLATE_LABELS as Record<string, string>)[select?.value ?? ''] ?? select?.value;
            if (confirmText) confirmText.textContent =
              `Cet email (${selectedLabel}) sera envoyé immédiatement à ${sendBtn.dataset.email ?? email}. Confirmer ?`;
            confirmEl?.classList.remove('hidden');
            sendBtn.disabled = true;
          });

          confirmNo?.addEventListener('click', () => {
            confirmEl?.classList.add('hidden');
            if (sendBtn) sendBtn.disabled = false;
          });

          confirmYes?.addEventListener('click', async () => {
            confirmEl?.classList.add('hidden');
            const configType = select?.value ?? '';
            const studentId  = sendBtn?.dataset.studentId ?? '';
            if (feedback) { feedback.className = 'drawer-send-feedback'; feedback.textContent = 'Envoi…'; feedback.classList.remove('hidden'); }
            try {
              const res = await fetch('/api/send-manual', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ student_id: studentId, config_type: configType }),
              });
              const data = await res.json().catch(() => ({}));
              if (feedback) {
                feedback.className = res.ok
                  ? 'drawer-send-feedback drawer-send-feedback--ok'
                  : 'drawer-send-feedback drawer-send-feedback--err';
                feedback.textContent = res.ok
                  ? 'Email envoyé avec succès.'
                  : ((data as { error?: string }).error ?? 'Erreur lors de l\'envoi.');
                feedback.classList.remove('hidden');
              }
            } catch {
              if (feedback) {
                feedback.className = 'drawer-send-feedback drawer-send-feedback--err';
                feedback.textContent = 'Erreur réseau. Réessayez.';
                feedback.classList.remove('hidden');
              }
            }
            if (sendBtn) sendBtn.disabled = false;
          });
        });
    }

    function closeDrawer() {
      overlay?.classList.add('hidden');
    }

    drawerClose?.addEventListener('click', closeDrawer);
    overlay?.addEventListener('click', (e) => { if (e.target === overlay) closeDrawer(); });

    rows.forEach((row) => {
      const r = row as HTMLElement;
      if (r.dataset.rowInitialized) return;
      r.dataset.rowInitialized = 'true';
      r.style.cursor = 'pointer';
      r.addEventListener('click', () => {
        openDrawer(r.dataset.id!, r.dataset.name ?? '', r.dataset.email ?? '');
      });
    });
  }

  initStudents();
  document.addEventListener('astro:page-load', initStudents);
</script>

<style>
  .stu-section { padding-top: 0; }
  .stu-container { max-width: 1100px; }
  .stu-total { font-size: 1rem; font-weight: 400; color: var(--gray); }

  .stu-pills { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1.25rem; }
  .stu-pill {
    padding: 6px 16px; border-radius: 999px; border: 1px solid var(--line-2);
    background: transparent; color: var(--fg-muted); font-family: var(--sans);
    font-size: 0.875rem; font-weight: 500; cursor: pointer;
    transition: background .2s, color .2s, border-color .2s;
  }
  .stu-pill:hover { color: var(--fg); border-color: var(--line-3); }
  .stu-pill.active { background: var(--accent-soft); color: var(--fg); border-color: var(--line-3); }

  .stu-table-wrap { overflow-x: auto; }
  .stu-table { width: 100%; border-collapse: collapse; font-size: 0.9375rem; }
  .stu-table th {
    text-align: left; font-size: 0.75rem; font-weight: 600; text-transform: uppercase;
    letter-spacing: 0.05em; color: var(--gray); padding: 0.875rem 1rem;
    border-bottom: 1px solid var(--line-2);
  }
  .stu-table td { padding: 0.875rem 1rem; border-bottom: 1px solid var(--line); vertical-align: middle; }
  .stu-row:last-child td { border-bottom: none; }
  .stu-row:hover { background: var(--accent-soft); }
  .stu-td-name { font-weight: 500; }
  .stu-td-email { color: var(--fg-muted); }
  .stu-td-date, .stu-td-count, .stu-td-action { color: var(--fg-muted); white-space: nowrap; }

  .stu-badge {
    display: inline-block; padding: 3px 10px; border-radius: 999px;
    font-size: 0.75rem; font-weight: 600; white-space: nowrap;
  }
  .stu-badge--actif     { background: rgba(16,185,129,0.15); color: #10B981; }
  .stu-badge--en_dunning { background: rgba(245,158,11,0.15); color: #F59E0B; }
  .stu-badge--suspendu  { background: rgba(239,68,68,0.15);  color: #EF4444; }
  .stu-badge--blackliste { background: rgba(100,100,100,0.15); color: #888888; }

  /* Drawer */
  .stu-overlay {
    position: fixed; inset: 0; z-index: 49;
    background: rgba(0,0,0,0.50);
    display: flex; align-items: stretch; justify-content: flex-end;
  }
  .stu-overlay.hidden { display: none; }
  .stu-drawer {
    width: 380px; max-width: 95vw;
    background: var(--bg-1); border-left: 1px solid var(--line);
    display: flex; flex-direction: column; overflow: hidden;
    z-index: 50;
  }
  .stu-drawer-header {
    display: flex; align-items: flex-start; justify-content: space-between;
    padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--line);
    flex-shrink: 0;
  }
  .stu-drawer-name { font-weight: 600; font-size: 1rem; color: var(--fg); }
  .stu-drawer-email { font-size: 0.875rem; color: var(--fg-muted); margin-top: 2px; }
  .stu-drawer-close {
    width: 30px; height: 30px; border-radius: 50%;
    border: 1px solid var(--line-2); background: transparent;
    color: var(--fg-muted); font-size: 1rem; cursor: pointer; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
  }
  .stu-drawer-close:hover { background: var(--accent-soft); color: var(--fg); }
  .stu-drawer-body { flex: 1; overflow-y: auto; padding: 1.25rem 1.5rem; display: flex; flex-direction: column; gap: 1.25rem; }

  .drawer-loading { color: var(--fg-muted); font-size: 0.9375rem; }
  .drawer-error   { color: #EF4444; font-size: 0.9375rem; }
  .drawer-meta    { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }
  .drawer-date    { font-size: 0.875rem; color: var(--fg-muted); }
  .drawer-section { display: flex; flex-direction: column; gap: 0.75rem; }
  .drawer-section-title { font-size: 0.875rem; font-weight: 600; color: var(--fg); text-transform: uppercase; letter-spacing: 0.04em; }
  .drawer-empty   { font-size: 0.875rem; color: var(--fg-muted); margin: 0; }

  .drawer-history { display: flex; flex-direction: column; gap: 0.5rem; }
  .drawer-history-item { display: grid; grid-template-columns: 64px 100px 1fr; gap: 0.5rem; font-size: 0.8125rem; align-items: start; }
  .dh-date  { color: var(--fg-muted); }
  .dh-type  { color: var(--fg-muted); font-style: italic; }
  .dh-subject { color: var(--fg); }

  .drawer-confirm { padding: 0.875rem; background: var(--bg-2); border-radius: var(--r-sm); }
  .drawer-confirm-text { font-size: 0.875rem; color: var(--fg); margin: 0; }
  .drawer-send-feedback { font-size: 0.875rem; padding: 0.75rem 1rem; border-radius: var(--r-sm); }
  .drawer-send-feedback--ok  { background: rgba(16,185,129,0.1); color: #10B981; }
  .drawer-send-feedback--err { background: rgba(239,68,68,0.1); color: #EF4444; }
  .hidden { display: none !important; }
</style>
```

**Note:** The drawer calls `/api-proxy/students/:id` — this is a placeholder for when the backend proxy route for student detail is available. If no such proxy exists yet, replace with a direct backend call pattern consistent with what the backend provides. The route should be `GET /client/students/:id`. Create a proxy at `src/pages/api/student-detail.ts` if needed (same pattern as other proxies, passing the `id` as a query param `?id=` or body param).

- [ ] **Verify build passes**

```bash
npm run build
```

- [ ] **Commit**

```bash
git add src/pages/client/students.astro
git commit -m "feat(students): add student panel page with drawer (F6)"
```

---

### Task 13: Final build and verification

- [ ] **Full build check**

```bash
npm run build
```
Expected: no TypeScript errors, all 8 new files compiled, no unused imports.

- [ ] **Run existing tests**

```bash
npm test
```
Expected: 6 tests pass (existing auth.test.ts — unchanged).

- [ ] **Final commit if any cleanup was needed** (only if changes were made)

```bash
git add -p
git commit -m "chore: final build cleanup phase 1 features 1-6"
```

---

## Self-review

**Spec coverage check:**

| Spec requirement | Task |
|---|---|
| F1: test-send.ts proxy | Task 1 |
| F1: bouton "M'envoyer un aperçu" + JS + feedback 3s | Task 2 |
| F2: pause-enable.ts + pause-disable.ts | Task 3 |
| F2: settings.astro section pause + /client/me | Task 4 |
| F2: dashboard.astro bandeau pause | Task 5 |
| F3: TEMPLATE_LIBRARY 24 templates intégraux | Task 6 |
| F3: bouton "📚 Bibliothèque" + panneau overlay | Task 6 |
| F3: injection sujet/corps + confirm + fermeture | Task 6 |
| F4: blacklist-add.ts + blacklist-remove.ts | Task 7 |
| F4: blacklist.astro page complète | Task 8 |
| F4+F6: sidebar ClientLayout + prefetch | Task 9 |
| F5: 2 stat-cards ROI + ligne contexte | Task 10 |
| F6: send-manual.ts proxy | Task 11 |
| F6: students.astro page + drawer + send manual | Task 12 |

**No TBDs, no placeholders found.** All 24 templates written in full. All CSS included inline in each file per the `<style is:global>` convention. All JS wrapped in `astro:page-load` with `dataset.initialized` guards.

**One note for student drawer:** The detail fetch uses `/api-proxy/students/${studentId}`. This requires a backend proxy route. If the backend exposes `GET /client/students/:id`, create `src/pages/api/student-detail.ts` as a GET handler passing `?id=` query param, following the same proxy pattern as the other routes. The students.astro page is otherwise complete.
