# customize.astro v2 — Templates par défaut, IA, Automatisations

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter dans customize.astro les templates par défaut (lecture seule + "Utiliser"), brancher les boutons IA via des API routes proxy Astro, et créer la section d'automatisations personnalisées.

**Architecture:** Toutes les modifications UI sont dans customize.astro ; les appels backend nécessitant le cookie HttpOnly sont proxifiés via des API routes Astro SSR (`src/pages/api/`). Le pattern existant — `getClientFromCookie(request)` + 401 → redirect — est répliqué à l'identique. Task 3 (automatisations) est conditionnelle au déploiement backend 009.

**Tech Stack:** Astro 6 SSR, TypeScript strict, `APIRoute` de `astro`, `getClientFromCookie` de `../../lib/auth`

---

## File Map

| Fichier | Action | Tâche |
|---------|--------|-------|
| `src/pages/client/customize.astro` | Modifier — frontmatter + HTML + JS + CSS | 1, 2, 3 |
| `src/pages/api/ai-generate.ts` | Créer | 2 |
| `src/pages/api/ai-improve.ts` | Créer | 2 |
| `src/pages/api/automation-toggle.ts` | Créer | 3 |
| `src/pages/api/automation-delete.ts` | Créer | 3 |

---

## Task 1 : Templates par défaut — données + HTML

**Files:**
- Modify: `src/pages/client/customize.astro` (frontmatter lignes 1–116 + HTML lignes 173–239)

- [ ] **Step 1 : Ajouter la constante `DEFAULT_TEMPLATES` dans le frontmatter**

Après la ligne `const EMAIL_KEYS = [...]` (ligne 101), insérer :

```ts
const DEFAULT_TEMPLATES: Record<string, { subject: string; body: string }> = {
  template_onboarding_j0: {
    subject: "Bienvenue {{nom}}, voici vos accès",
    body: "Bonjour {{nom}},\n\nVotre achat est confirmé.\nEmail : {{email}}\nMot de passe : {{mot_de_passe}}\nAccès : {{lien_acces}}\n\nÀ très vite,",
  },
  template_onboarding_j3: {
    subject: "{{nom}}, comment se passe votre début ?",
    body: "Bonjour {{nom}},\n\nCela fait 3 jours que vous avez rejoint {{nom_formation}}. Avez-vous pu commencer ?\n\nN'hésitez pas à répondre si vous avez une question.\n\nÀ bientôt,",
  },
  template_onboarding_j7: {
    subject: "{{nom}} — votre première semaine",
    body: "Bonjour {{nom}},\n\nUne semaine déjà ! Vous avez accès à l'intégralité de {{nom_formation}}.\n\nÀ bientôt,",
  },
  template_failed_payment: {
    subject: "Action requise — problème de paiement",
    body: "Bonjour {{nom}},\n\nNous avons rencontré un problème avec votre paiement. Merci de mettre à jour vos informations pour conserver votre accès.\n\nÀ bientôt,",
  },
};
```

- [ ] **Step 2 : Ajouter le bloc HTML "template par défaut" dans chaque carte email**

Dans la carte multiline (le return JSX du `if (multiline)` bloc, ligne ~175), après `<h2 class="cust-card-title">{label}</h2>` et avant les messages success/error, insérer :

```astro
{DEFAULT_TEMPLATES[key] && (
  <div class="default-tpl-wrap">
    <button type="button" class="btn-default-toggle"
            data-key={key}>
      Voir le template par défaut ▾
    </button>
    <div class="default-tpl-preview hidden" data-preview={key}>
      <div class="default-tpl-row">
        <span class="default-tpl-label">Sujet :</span>
        <code class="default-tpl-value">{DEFAULT_TEMPLATES[key].subject}</code>
      </div>
      <div class="default-tpl-row" style="flex-direction:column;align-items:flex-start;gap:0.25rem">
        <span class="default-tpl-label">Corps :</span>
        <pre class="default-tpl-body">{DEFAULT_TEMPLATES[key].body}</pre>
      </div>
      <button type="button" class="btn btn-secondary btn-use-default"
              data-subject={DEFAULT_TEMPLATES[key].subject}
              data-body={DEFAULT_TEMPLATES[key].body}>
        Utiliser ce template
      </button>
    </div>
  </div>
)}
```

- [ ] **Step 3 : Ajouter les styles CSS pour le bloc "template par défaut"**

À la fin du bloc `<style>` existant (avant la balise `</style>` fermante), ajouter :

```css
.default-tpl-wrap {
  margin-bottom: 1rem;
  border-bottom: 1px solid var(--gray-border);
  padding-bottom: 1rem;
}
.btn-default-toggle {
  background: none;
  border: none;
  padding: 0;
  font-size: 0.8125rem;
  color: var(--gray);
  cursor: pointer;
  transition: color .15s;
  text-decoration: underline dotted;
  text-underline-offset: 3px;
}
.btn-default-toggle:hover { color: var(--gray-light); }
.default-tpl-preview {
  margin-top: 0.75rem;
  background: var(--dark-elevated);
  border: 1px solid var(--gray-border);
  border-radius: var(--radius-sm);
  padding: 0.875rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}
.default-tpl-preview.hidden { display: none; }
.default-tpl-row {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}
.default-tpl-label {
  font-size: 0.75rem;
  color: var(--gray);
  flex-shrink: 0;
  font-weight: 600;
}
.default-tpl-value {
  font-size: 0.8125rem;
  font-family: monospace;
  color: var(--gray-light);
  word-break: break-all;
}
.default-tpl-body {
  font-size: 0.8125rem;
  font-family: monospace;
  color: var(--gray-light);
  white-space: pre-wrap;
  margin: 0;
  line-height: 1.5;
  background: none;
}
```

- [ ] **Step 4 : Vérifier le build**

```bash
npm run build
```
Résultat attendu : build sans erreur TypeScript.

- [ ] **Step 5 : Commit**

```bash
git add src/pages/client/customize.astro
git commit -m "feat(customize): section templates par défaut (lecture seule + data)"
```

---

## Task 2 : Templates par défaut — JS (toggle + "Utiliser ce template")

**Files:**
- Modify: `src/pages/client/customize.astro` (bloc `<script>`, fonction `initEditor`)

- [ ] **Step 1 : Ajouter les handlers dans `initEditor`**

Dans la fonction `initEditor`, après le bloc du listener `// 5. "Utiliser ce contenu"` (ligne ~321), et avant la fermeture de `forEach` (ligne ~329), ajouter :

```ts
      // 6. Toggle "Voir le template par défaut"
      card.querySelectorAll<HTMLButtonElement>('.btn-default-toggle').forEach((btn) => {
        btn.addEventListener('click', () => {
          const preview = card.querySelector<HTMLElement>('.default-tpl-preview');
          if (!preview) return;
          const isOpen = !preview.classList.contains('hidden');
          preview.classList.toggle('hidden', isOpen);
          btn.textContent = isOpen
            ? 'Voir le template par défaut ▾'
            : 'Masquer le template par défaut ▴';
        });
      });

      // 7. "Utiliser ce template" → copie dans les champs Manuel + ferme le preview
      card.querySelectorAll<HTMLButtonElement>('.btn-use-default').forEach((btn) => {
        btn.addEventListener('click', () => {
          if (subjectInput) subjectInput.value = btn.dataset.subject ?? '';
          if (bodyInput)    bodyInput.value    = btn.dataset.body    ?? '';
          // Basculer sur l'onglet Manuel
          card.querySelector<HTMLButtonElement>('[data-tab="manual"]')?.click();
          // Fermer le preview
          const preview = card.querySelector<HTMLElement>('.default-tpl-preview');
          const toggle  = card.querySelector<HTMLElement>('.btn-default-toggle');
          if (preview) preview.classList.add('hidden');
          if (toggle)  toggle.textContent = 'Voir le template par défaut ▾';
        });
      });
```

- [ ] **Step 2 : Vérifier build + tests**

```bash
npm test && npm run build
```
Résultat attendu : 6 tests pass, build sans erreur.

- [ ] **Step 3 : Commit**

```bash
git add src/pages/client/customize.astro
git commit -m "feat(customize): toggle template par défaut + bouton Utiliser"
```

---

## Task 3 : API routes proxy — IA (ai-generate + ai-improve)

**Files:**
- Create: `src/pages/api/ai-generate.ts`
- Create: `src/pages/api/ai-improve.ts`

- [ ] **Step 1 : Créer `src/pages/api/ai-generate.ts`**

```ts
import type { APIRoute } from 'astro';
import { getClientFromCookie } from '../../lib/auth';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const auth = await getClientFromCookie(request);
  if (!auth) {
    return new Response(JSON.stringify({ error: 'Non authentifié' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Corps JSON invalide' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const base = import.meta.env.AEVUM_URL;
  try {
    const res = await fetch(`${base}/client/ai/generate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${auth.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Erreur réseau' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
```

- [ ] **Step 2 : Créer `src/pages/api/ai-improve.ts`**

```ts
import type { APIRoute } from 'astro';
import { getClientFromCookie } from '../../lib/auth';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const auth = await getClientFromCookie(request);
  if (!auth) {
    return new Response(JSON.stringify({ error: 'Non authentifié' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Corps JSON invalide' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const base = import.meta.env.AEVUM_URL;
  try {
    const res = await fetch(`${base}/client/ai/improve`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${auth.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Erreur réseau' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
```

- [ ] **Step 3 : Vérifier build**

```bash
npm run build
```
Résultat attendu : build sans erreur, nouvelles routes `/api/ai-generate` et `/api/ai-improve` présentes dans l'output Vercel.

- [ ] **Step 4 : Commit**

```bash
git add src/pages/api/ai-generate.ts src/pages/api/ai-improve.ts
git commit -m "feat(api): routes proxy ai-generate et ai-improve"
```

---

## Task 4 : Brancher les boutons IA dans customize.astro

**Files:**
- Modify: `src/pages/client/customize.astro` (HTML + JS)

- [ ] **Step 1 : Activer le bouton "Générer" dans le HTML**

Dans le panneau `data-panel="generate"`, remplacer :

```astro
        <button class="btn btn-primary btn-generate"
                style="align-self:flex-start" disabled>✨ Générer l'email</button>
        <p class="ai-coming-soon">✦ Fonctionnalité disponible prochainement</p>
```

par :

```astro
        <button class="btn btn-primary btn-generate"
                style="align-self:flex-start">✨ Générer l'email</button>
```

- [ ] **Step 2 : Activer le bouton "Améliorer" dans le HTML**

Dans le panneau `data-panel="manual"`, remplacer :

```astro
            <button type="button" class="btn btn-secondary btn-improve" disabled
                    title="Fonctionnalité disponible prochainement">🔧 Améliorer avec l'IA</button>
```

par :

```astro
            <button type="button" class="btn btn-secondary btn-improve">🔧 Améliorer avec l'IA</button>
```

- [ ] **Step 3 : Supprimer le style `.btn-improve:disabled` devenu inutile**

Dans le bloc `<style>`, supprimer la ligne :
```css
.btn-improve:disabled { opacity: 0.45; cursor: not-allowed; }
```

- [ ] **Step 4 : Ajouter les styles pour les états de chargement IA et erreurs**

À la fin du bloc `<style>`, ajouter :

```css
.ai-error {
  font-size: 0.8125rem;
  color: #EF4444;
  margin-top: 0.25rem;
  display: none;
}
.ai-error.visible { display: block; }
.btn-generate.loading,
.btn-improve.loading {
  opacity: 0.7;
  pointer-events: none;
}
```

- [ ] **Step 5 : Ajouter les éléments d'erreur IA dans le HTML**

Dans chaque card multiline, après le bouton `.btn-generate` dans le panneau generate, ajouter :

```astro
        <p class="ai-error gen-error"></p>
```

Après le bouton `.btn-improve` dans le panneau manual, ajouter :

```astro
            <p class="ai-error improve-error"></p>
```

- [ ] **Step 6 : Ajouter les handlers JS pour les boutons IA dans `initEditor`**

Dans la fonction `initEditor`, dans le forEach sur les cards, après les handlers précédemment ajoutés (section 7 de Task 2), ajouter :

```ts
      // 8. Bouton "Générer avec l'IA"
      const btnGenerate = card.querySelector<HTMLButtonElement>('.btn-generate');
      const genError    = card.querySelector<HTMLElement>('.gen-error');
      if (btnGenerate) {
        btnGenerate.addEventListener('click', async () => {
          const emailType    = card.dataset.config ?? '';
          const formationName = card.querySelector<HTMLInputElement>('.gen-formation')?.value.trim() ?? '';
          const tone          = card.querySelector<HTMLSelectElement>('.gen-tone')?.value ?? 'chaleureux';
          const objective     = card.querySelector<HTMLInputElement>('.gen-objective')?.value.trim() ?? '';

          if (genError) { genError.textContent = ''; genError.classList.remove('visible'); }
          btnGenerate.classList.add('loading');
          btnGenerate.textContent = 'Génération en cours...';

          try {
            const res  = await fetch('/api/ai-generate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ emailType, formationName, tone, objective }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || !data.subject) {
              throw new Error(data.error ?? 'Erreur de génération');
            }
            const result = card.querySelector<HTMLElement>('.generation-result');
            const subPrev = card.querySelector<HTMLInputElement>('.subject-preview');
            const bodPrev = card.querySelector<HTMLTextAreaElement>('.body-preview');
            if (subPrev) subPrev.value = data.subject;
            if (bodPrev) bodPrev.value = data.body;
            result?.classList.remove('hidden');
          } catch (err: unknown) {
            if (genError) {
              genError.textContent = err instanceof Error ? err.message : 'Erreur inconnue';
              genError.classList.add('visible');
            }
          } finally {
            btnGenerate.classList.remove('loading');
            btnGenerate.textContent = '✨ Générer l\'email';
          }
        });
      }

      // 9. Bouton "Améliorer avec l'IA"
      const btnImprove   = card.querySelector<HTMLButtonElement>('.btn-improve');
      const improveError = card.querySelector<HTMLElement>('.improve-error');
      if (btnImprove) {
        btnImprove.addEventListener('click', async () => {
          const emailType = card.dataset.config ?? '';
          const subject   = subjectInput?.value ?? '';
          const body      = bodyInput?.value    ?? '';

          if (improveError) { improveError.textContent = ''; improveError.classList.remove('visible'); }
          btnImprove.classList.add('loading');
          btnImprove.textContent = 'Amélioration en cours...';

          try {
            const res  = await fetch('/api/ai-improve', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ content: { subject, body }, emailType }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || !data.subject) {
              throw new Error(data.error ?? 'Erreur d\'amélioration');
            }
            if (subjectInput) subjectInput.value = data.subject;
            if (bodyInput)    bodyInput.value    = data.body;
          } catch (err: unknown) {
            if (improveError) {
              improveError.textContent = err instanceof Error ? err.message : 'Erreur inconnue';
              improveError.classList.add('visible');
            }
          } finally {
            btnImprove.classList.remove('loading');
            btnImprove.textContent = '🔧 Améliorer avec l\'IA';
          }
        });
      }
```

- [ ] **Step 7 : Vérifier build + tests**

```bash
npm test && npm run build
```
Résultat attendu : 6 tests pass, build sans erreur.

- [ ] **Step 8 : Commit**

```bash
git add src/pages/client/customize.astro
git commit -m "feat(customize): boutons IA actifs — generate et improve branchés sur /api/ai-*"
```

---

## Task 5 : API routes proxy — Automatisations (toggle + delete)

> ⚠️ Prérequis : migration backend 009_custom_automations.sql doit être déployée et les routes `/client/automations/custom` doivent répondre.

**Files:**
- Create: `src/pages/api/automation-toggle.ts`
- Create: `src/pages/api/automation-delete.ts`

- [ ] **Step 1 : Créer `src/pages/api/automation-toggle.ts`**

```ts
import type { APIRoute } from 'astro';
import { getClientFromCookie } from '../../lib/auth';

export const prerender = false;

export const PUT: APIRoute = async ({ request }) => {
  const auth = await getClientFromCookie(request);
  if (!auth) {
    return new Response(JSON.stringify({ error: 'Non authentifié' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: { id: string; active: boolean } | null = null;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Corps JSON invalide' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  if (!body?.id) {
    return new Response(JSON.stringify({ error: 'id requis' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const base = import.meta.env.AEVUM_URL;
  try {
    const res = await fetch(`${base}/client/automations/custom/${body.id}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${auth.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ active: body.active }),
    });
    const data = await res.json().catch(() => ({}));
    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Erreur réseau' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
```

- [ ] **Step 2 : Créer `src/pages/api/automation-delete.ts`**

```ts
import type { APIRoute } from 'astro';
import { getClientFromCookie } from '../../lib/auth';

export const prerender = false;

export const DELETE: APIRoute = async ({ request }) => {
  const auth = await getClientFromCookie(request);
  if (!auth) {
    return new Response(JSON.stringify({ error: 'Non authentifié' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: { id: string } | null = null;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Corps JSON invalide' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  if (!body?.id) {
    return new Response(JSON.stringify({ error: 'id requis' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const base = import.meta.env.AEVUM_URL;
  try {
    const res = await fetch(`${base}/client/automations/custom/${body.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${auth.token}` },
    });
    const data = await res.json().catch(() => ({}));
    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Erreur réseau' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
```

- [ ] **Step 3 : Vérifier build**

```bash
npm run build
```
Résultat attendu : build sans erreur, 4 routes API présentes.

- [ ] **Step 4 : Commit**

```bash
git add src/pages/api/automation-toggle.ts src/pages/api/automation-delete.ts
git commit -m "feat(api): routes proxy automation-toggle (PUT) et automation-delete (DELETE)"
```

---

## Task 6 : Section "Mes automatisations personnalisées" dans customize.astro

> ⚠️ Prérequis : Task 5 terminée et backend 009 déployé.

**Files:**
- Modify: `src/pages/client/customize.astro` (frontmatter + HTML + JS + CSS)

- [ ] **Step 1 : Ajouter le fetch SSR des automatisations dans le frontmatter**

Remplacer la ligne :

```ts
const [configsResult, autoResult] = await Promise.allSettled([
  fetch(`${base}/client/configs`, { headers }),
  fetch(`${base}/client/automations`, { headers }),
]);
```

par :

```ts
const [configsResult, autoResult, customAutoResult] = await Promise.allSettled([
  fetch(`${base}/client/configs`, { headers }),
  fetch(`${base}/client/automations`, { headers }),
  fetch(`${base}/client/automations/custom`, { headers }),
]);
```

Remplacer la ligne :

```ts
const settled = [configsResult, autoResult];
```

par :

```ts
const settled = [configsResult, autoResult, customAutoResult];
```

Après le bloc de parsing `configsResult` et `autoResult`, ajouter :

```ts
type CustomAutomation = {
  id: string;
  name: string;
  trigger_type: 'days_after_purchase' | 'specific_date' | 'failed_payment';
  trigger_days?: number | null;
  trigger_date?: string | null;
  subject: string;
  body: string;
  active: boolean;
};

let customAutomations: CustomAutomation[] = [];
if (customAutoResult.status === 'fulfilled' && customAutoResult.value.ok) {
  const arr = await customAutoResult.value.json().catch(() => []);
  customAutomations = Array.isArray(arr) ? arr : [];
}
```

- [ ] **Step 2 : Ajouter le handler POST pour la création d'automatisation**

Dans le bloc `if (Astro.request.method === 'POST')`, après la lecture de `configType` et avant le `if (configType)`, ajouter :

```ts
  const action = (form.get('action') as string ?? '');
  if (action === 'create_automation') {
    const name         = (form.get('auto_name') as string ?? '').trim();
    const triggerType  = (form.get('trigger_type') as string ?? '');
    const triggerDays  = form.get('trigger_days') ? Number(form.get('trigger_days')) : null;
    const triggerDate  = (form.get('trigger_date') as string ?? '') || null;
    const subject      = (form.get('auto_subject') as string ?? '').trim();
    const body         = (form.get('auto_body') as string ?? '').trim();
    if (name && triggerType && subject && body) {
      try {
        const res = await fetch(`${base}/client/automations/custom`, {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, trigger_type: triggerType, trigger_days: triggerDays, trigger_date: triggerDate, subject, body }),
        });
        if (res.status === 401) {
          Astro.cookies.delete('aevum_token', { path: '/' });
          return Astro.redirect('/login');
        }
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          errorType  = 'create_automation';
          errorMsg   = d.message ?? d.error ?? 'Erreur lors de la création.';
        }
      } catch {
        errorType = 'create_automation';
        errorMsg  = 'Erreur réseau. Réessayez.';
      }
    }
    // Pas de `return` → la page se recharge avec les nouvelles données
  }
```

- [ ] **Step 3 : Ajouter la section HTML "Mes automatisations personnalisées"**

Dans le HTML, après la fermeture de `{CONFIG_TYPES.map(...)}` (après la dernière `</div>` de la section configs), et avant la balise `</div>` qui ferme `.customize-container`, ajouter :

```astro
    <div class="section-divider"></div>

    <div class="auto-section">
      <div class="auto-section-header">
        <h2 class="auto-section-title">Mes automatisations personnalisées</h2>
        <button type="button" class="btn btn-primary" id="btn-open-auto-modal">+ Créer une automatisation</button>
      </div>

      {errorType === 'create_automation' && (
        <div class="cust-field-error" role="alert">{errorMsg}</div>
      )}

      {/* Modal création */}
      <div class="modal-overlay hidden" id="auto-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div class="modal-content card">
          <h3 id="modal-title" style="margin-bottom:1.25rem;font-size:1rem;font-weight:600">Créer une automatisation</h3>
          <form method="POST" class="auto-create-form" style="display:flex;flex-direction:column;gap:0.75rem">
            <input type="hidden" name="action" value="create_automation" />
            <label class="form-label">Nom</label>
            <input type="text" name="auto_name" class="form-input" placeholder="Ex : Upsell J+14" required />
            <label class="form-label">Déclencheur</label>
            <select name="trigger_type" id="modal-trigger-type" class="form-input">
              <option value="days_after_purchase">X jours après l'achat</option>
              <option value="specific_date">Date précise</option>
              <option value="failed_payment">Après un paiement échoué</option>
            </select>
            <div id="modal-days-field">
              <label class="form-label">Nombre de jours</label>
              <input type="number" name="trigger_days" class="form-input" min="1" placeholder="Ex : 14" />
            </div>
            <div id="modal-date-field" class="hidden">
              <label class="form-label">Date</label>
              <input type="date" name="trigger_date" class="form-input" />
            </div>
            <label class="form-label">Sujet de l'email</label>
            <input type="text" name="auto_subject" class="form-input" placeholder="Sujet..." required />
            <label class="form-label">Corps de l'email</label>
            <textarea name="auto_body" class="form-input cust-textarea modal-body-textarea" rows={5} placeholder="Corps..." required></textarea>
            <div class="cust-hints">
              <p class="cust-hints-label">Variables disponibles — cliquez pour insérer :</p>
              <div class="cust-hints-list">
                {['{{nom}}', '{{prenom}}', '{{email}}', '{{nom_formation}}', '{{lien_acces}}'].map((v) => (
                  <code class="cust-hint modal-hint" data-var={v}>{v}</code>
                ))}
              </div>
            </div>
            <div style="display:flex;gap:0.75rem;margin-top:0.5rem">
              <button type="submit" class="btn btn-primary">Créer</button>
              <button type="button" class="btn btn-secondary" id="btn-close-auto-modal">Annuler</button>
            </div>
          </form>
        </div>
      </div>

      {customAutomations.length === 0 ? (
        <p class="auto-empty">Aucune automatisation personnalisée. Créez-en une ci-dessus.</p>
      ) : (
        <div class="auto-table-wrap">
          <table class="auto-table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Déclencheur</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customAutomations.map((auto) => {
                const triggerLabel =
                  auto.trigger_type === 'days_after_purchase' ? `J+${auto.trigger_days ?? '?'}` :
                  auto.trigger_type === 'specific_date'       ? (auto.trigger_date ?? '—') :
                  'Paiement échoué';
                return (
                  <tr data-auto-id={auto.id}>
                    <td>{auto.name}</td>
                    <td>{triggerLabel}</td>
                    <td>
                      <button type="button" class="btn-auto-toggle"
                              data-id={auto.id}
                              data-active={auto.active ? 'true' : 'false'}>
                        {auto.active ? 'Actif' : 'Inactif'}
                      </button>
                    </td>
                    <td>
                      <button type="button" class="btn-auto-delete btn btn-secondary"
                              data-id={auto.id}
                              style="font-size:0.75rem;padding:0.3rem 0.75rem">
                        Supprimer
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
```

- [ ] **Step 4 : Ajouter les styles CSS pour la section automatisations**

À la fin du bloc `<style>`, ajouter :

```css
.section-divider {
  height: 1px;
  background: var(--gray-border);
  margin: 2.5rem 0;
}
.auto-section { margin-bottom: 3rem; }
.auto-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.5rem;
}
.auto-section-title { font-size: 1rem; font-weight: 600; color: var(--light); margin: 0; }
.auto-empty { font-size: 0.875rem; color: var(--gray); margin: 0; }

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
  padding: 1rem;
}
.modal-overlay.hidden { display: none; }
.modal-content {
  width: 100%;
  max-width: 520px;
  max-height: 90vh;
  overflow-y: auto;
  padding: 2rem;
}

/* Table */
.auto-table-wrap { overflow-x: auto; }
.auto-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}
.auto-table th, .auto-table td {
  text-align: left;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--gray-border);
  color: var(--gray-light);
}
.auto-table th { font-weight: 600; color: var(--gray); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; }
.btn-auto-toggle {
  background: none;
  border: 1px solid var(--gray-border);
  border-radius: var(--radius-sm);
  padding: 0.25rem 0.625rem;
  font-size: 0.75rem;
  cursor: pointer;
  color: var(--gray-light);
  transition: background .15s, color .15s;
}
.btn-auto-toggle[data-active="true"] {
  background: rgba(34,197,94,0.15);
  border-color: #22C55E;
  color: #22C55E;
}
.btn-auto-toggle[data-active="false"] {
  background: rgba(156,163,175,0.1);
}
```

- [ ] **Step 5 : Ajouter les handlers JS pour la modal et les actions automatisations**

Ajouter une nouvelle fonction `initAutomations` dans le bloc `<script>`, après la fonction `initEditor` :

```ts
  function initAutomations() {
    /* ── Modal open / close ── */
    const modal   = document.getElementById('auto-modal');
    const btnOpen = document.getElementById('btn-open-auto-modal');
    const btnClose = document.getElementById('btn-close-auto-modal');
    if (!modal || !btnOpen) return;

    btnOpen.addEventListener('click', () => modal.classList.remove('hidden'));
    btnClose?.addEventListener('click', () => modal.classList.add('hidden'));
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.add('hidden');
    });

    /* ── Affichage conditionnel du champ "jours" / "date" ── */
    const triggerSelect = document.getElementById('modal-trigger-type') as HTMLSelectElement | null;
    const daysField     = document.getElementById('modal-days-field');
    const dateField     = document.getElementById('modal-date-field');
    triggerSelect?.addEventListener('change', () => {
      const v = triggerSelect.value;
      daysField?.classList.toggle('hidden', v !== 'days_after_purchase');
      dateField?.classList.toggle('hidden', v !== 'specific_date');
    });

    /* ── Variables cliquables dans la modal ── */
    const modalTextarea = modal.querySelector<HTMLTextAreaElement>('.modal-body-textarea');
    modal.querySelectorAll<HTMLElement>('.modal-hint').forEach((hint) => {
      hint.addEventListener('click', () => {
        if (!modalTextarea || !hint.dataset.var) return;
        const v = hint.dataset.var;
        const s = modalTextarea.selectionStart ?? modalTextarea.value.length;
        const e = modalTextarea.selectionEnd   ?? modalTextarea.value.length;
        modalTextarea.value = modalTextarea.value.slice(0, s) + v + modalTextarea.value.slice(e);
        modalTextarea.selectionStart = modalTextarea.selectionEnd = s + v.length;
        modalTextarea.focus();
      });
    });

    /* ── Toggle actif/inactif ── */
    document.querySelectorAll<HTMLButtonElement>('.btn-auto-toggle').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id     = btn.dataset.id ?? '';
        const active = btn.dataset.active !== 'true';
        try {
          const res = await fetch('/api/automation-toggle', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, active }),
          });
          if (!res.ok) throw new Error();
          btn.dataset.active = active ? 'true' : 'false';
          btn.textContent    = active ? 'Actif' : 'Inactif';
        } catch {
          // Silently fail — état non changé, l'UI reste cohérente
        }
      });
    });

    /* ── Supprimer ── */
    document.querySelectorAll<HTMLButtonElement>('.btn-auto-delete').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirm('Supprimer cette automatisation ?')) return;
        const id = btn.dataset.id ?? '';
        try {
          const res = await fetch('/api/automation-delete', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
          });
          if (!res.ok) throw new Error();
          btn.closest('tr')?.remove();
        } catch {
          btn.textContent = 'Erreur';
        }
      });
    });
  }
```

Puis, dans le bloc d'initialisation global, ajouter les appels à `initAutomations` :

```ts
  initBanner();
  initEditor();
  initAutomations();   // ← ajouter cette ligne
  document.addEventListener('astro:page-load', () => {
    initBanner();
    initEditor();
    initAutomations(); // ← ajouter cette ligne
  });
```

- [ ] **Step 6 : Vérifier build + tests**

```bash
npm test && npm run build
```
Résultat attendu : 6 tests pass, build sans erreur TypeScript.

- [ ] **Step 7 : Commit**

```bash
git add src/pages/client/customize.astro
git commit -m "feat(customize): section automatisations personnalisées — modal, liste, toggle, delete"
```

---

## Récapitulatif des commits attendus

1. `feat(customize): section templates par défaut (lecture seule + data)` — Task 1
2. `feat(customize): toggle template par défaut + bouton Utiliser` — Task 2
3. `feat(api): routes proxy ai-generate et ai-improve` — Task 3
4. `feat(customize): boutons IA actifs — generate et improve branchés sur /api/ai-*` — Task 4
5. `feat(api): routes proxy automation-toggle (PUT) et automation-delete (DELETE)` — Task 5
6. `feat(customize): section automatisations personnalisées — modal, liste, toggle, delete` — Task 6
