# Customize Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mettre à jour `src/pages/client/customize.astro` avec des labels renommés, une bannière templates par défaut dismissible, et un éditeur 3 modes (Manuel / Générer IA / Améliorer IA) pour chaque template email.

**Architecture:** Tout dans un seul fichier SSR Astro. Le frontmatter ajoute `parseConfig()` et détecte les templates vides. L'HTML remplace le textarea simple par un éditeur à tabs. La sauvegarde reste form POST SSR — le JS intercepte le submit pour sérialiser `JSON.stringify({subject, body})` dans un champ caché. Les boutons IA sont présents mais désactivés (endpoints backend pas encore prêts).

**Tech Stack:** Astro 6, TypeScript strict, CSS variables inline, vanilla JS, `astro:page-load` pour ré-init View Transitions.

---

## File Map

| Action | Fichier |
|--------|---------|
| Modifier | `src/pages/client/customize.astro` |

---

## Task 1 : Label renames + VARIABLE_HINTS

**Files:**
- Modify: `src/pages/client/customize.astro:77-90`

- [ ] **Step 1 : Remplacer `VARIABLE_HINTS` et `CONFIG_TYPES` dans le frontmatter**

Localiser les lignes 77-90 et les remplacer par :

```ts
const VARIABLE_HINTS: Record<string, string[]> = {
  template_onboarding_j0: ['{{nom}}', '{{prenom}}', '{{email}}', '{{nom_formation}}', '{{lien_acces}}', '{{mot_de_passe}}'],
  template_onboarding_j3: ['{{nom}}', '{{prenom}}', '{{email}}', '{{nom_formation}}', '{{lien_acces}}'],
  template_onboarding_j7: ['{{nom}}', '{{prenom}}', '{{email}}', '{{nom_formation}}', '{{lien_acces}}'],
  template_failed_payment: ['{{nom}}', '{{prenom}}', '{{email}}', '{{montant}}', '{{lien_paiement}}'],
};

const CONFIG_TYPES = [
  { key: 'sender_name',           label: "Nom affiché dans l'email (expéditeur)",                   multiline: false, defaultValue: senderName },
  { key: 'template_onboarding_j0', label: "Email de bienvenue (envoyé immédiatement après l'achat)", multiline: true,  defaultValue: '' },
  { key: 'template_onboarding_j3', label: 'Email J+3 (3 jours après l\'achat)',                      multiline: true,  defaultValue: '' },
  { key: 'template_onboarding_j7', label: 'Email J+7 (7 jours après l\'achat)',                      multiline: true,  defaultValue: '' },
  { key: 'template_failed_payment', label: 'Email de relance paiement échoué',                       multiline: true,  defaultValue: '' },
] as const;
```

- [ ] **Step 2 : Build**

```bash
npm run build
```

Expected : `[build] Complete!` sans erreur.

- [ ] **Step 3 : Commit**

```bash
git add src/pages/client/customize.astro
git commit -m "feat(customize): renommage labels + mise à jour variables"
```

---

## Task 2 : Frontmatter — parseConfig + détection bannière

**Files:**
- Modify: `src/pages/client/customize.astro` — bloc frontmatter, après `CONFIG_TYPES`

- [ ] **Step 1 : Ajouter après la déclaration `CONFIG_TYPES`** (toujours dans le bloc `---`)

```ts
// Parse JSON {subject, body} depuis la valeur backend ; fallback plain-text
function parseConfig(raw: string): { subject: string; body: string } {
  try {
    const p = JSON.parse(raw);
    if (p && typeof p.subject === 'string' && typeof p.body === 'string') return p;
  } catch {}
  return { subject: '', body: raw };
}

const EMAIL_KEYS = [
  'template_onboarding_j0',
  'template_onboarding_j3',
  'template_onboarding_j7',
  'template_failed_payment',
] as const;

// true → aucun template n'a encore été personnalisé → afficher la bannière
const allDefaultTemplates = EMAIL_KEYS.every((k) => !configs[k]);

// Valeurs pré-parsées pour chaque template email
const PARSED_CONFIGS: Record<string, { subject: string; body: string }> = {};
for (const k of EMAIL_KEYS) {
  PARSED_CONFIGS[k] = parseConfig(configs[k] ?? '');
}
```

- [ ] **Step 2 : Build**

```bash
npm run build
```

Expected : `[build] Complete!`

- [ ] **Step 3 : Commit**

```bash
git add src/pages/client/customize.astro
git commit -m "feat(customize): parseConfig + détection allDefaultTemplates"
```

---

## Task 3 : Bannière templates par défaut

**Files:**
- Modify: `src/pages/client/customize.astro` — section HTML + script + style

- [ ] **Step 1 : Ajouter la bannière dans le HTML**

Juste après `</div>` de `.customize-header` (avant `{fetchError && ...}`), insérer :

```astro
{allDefaultTemplates && (
  <div class="default-banner" id="default-banner" role="alert">
    <span class="banner-icon" aria-hidden="true">⚠️</span>
    <p>Vos emails utilisent actuellement les templates par défaut AEVUM. Personnalisez-les ci-dessous pour les adapter à votre formation et votre audience.</p>
    <button class="banner-close" id="banner-close" aria-label="Fermer la bannière">✕</button>
  </div>
)}
```

- [ ] **Step 2 : Ajouter le CSS de la bannière** dans `<style>`, avant la règle `.customize-section`

```css
.default-banner {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background: #1A2035;
  border-left: 3px solid #F59E0B;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 2rem;
}
.banner-icon { font-size: 1.25rem; flex-shrink: 0; }
.default-banner p { margin: 0; font-size: 0.875rem; color: var(--gray-light); flex: 1; }
.banner-close {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--gray);
  font-size: 1rem;
  padding: 0;
  flex-shrink: 0;
  line-height: 1;
}
.banner-close:hover { color: var(--fg); }
```

Le dismiss JS (sessionStorage) est dans Task 5 avec le reste du script.

- [ ] **Step 4 : Build**

```bash
npm run build
```

Expected : `[build] Complete!` La bannière s'affiche. Le bouton ✕ n'est pas encore fonctionnel (JS ajouté en Task 5).

- [ ] **Step 5 : Commit**

```bash
git add src/pages/client/customize.astro
git commit -m "feat(customize): bannière templates par défaut HTML + CSS"
```

---

## Task 4 : Éditeur 3 modes — HTML + CSS

**Files:**
- Modify: `src/pages/client/customize.astro` — remplacer le bloc `{CONFIG_TYPES.map(...)}` dans le template HTML, ajouter CSS

C'est le plus gros changement. Remplacer **entièrement** le bloc JSX du map (de `{CONFIG_TYPES.map(` jusqu'au `})}` fermant) par le bloc ci-dessous.

- [ ] **Step 1 : Remplacer le bloc CONFIG_TYPES.map dans le HTML**

```astro
{CONFIG_TYPES.map(({ key, label, multiline }) => {
  const isSuccess = successType === key;
  const isError   = errorType === key;
  const hints     = VARIABLE_HINTS[key];

  if (!multiline) {
    // sender_name — tab unique, champ texte simple
    return (
      <div class="card cust-card" data-config={key}>
        <h2 class="cust-card-title">{label}</h2>
        {isSuccess && <div class="success-msg" role="alert"><span>Sauvegardé.</span></div>}
        {isError   && <div class="cust-field-error" role="alert">{errorMsg}</div>}
        <div class="editor-tabs">
          <button class="editor-tab active" data-tab="manual">✏️ Rédiger moi-même</button>
        </div>
        <div class="tab-panel" data-panel="manual">
          <form method="POST" class="cust-form">
            <input type="hidden" name="config_type" value={key} />
            <input type="text" name="value" class="form-input"
                   value={senderName} placeholder="Ex : Jean Dupont" />
            <button type="submit" class="btn btn-primary cust-save-btn"
                    style="align-self:flex-start;margin-top:0.5rem">Sauvegarder</button>
          </form>
        </div>
      </div>
    );
  }

  // Templates email — éditeur 3 modes
  const parsed = PARSED_CONFIGS[key];
  return (
    <div class="card cust-card" data-config={key}
         data-subject={parsed.subject} data-body={parsed.body}>
      <h2 class="cust-card-title">{label}</h2>
      {isSuccess && <div class="success-msg" role="alert"><span>Sauvegardé.</span></div>}
      {isError   && <div class="cust-field-error" role="alert">{errorMsg}</div>}

      <div class="editor-tabs">
        <button class="editor-tab active" data-tab="manual">✏️ Rédiger moi-même</button>
        <button class="editor-tab" data-tab="generate">✨ Générer avec l'IA</button>
        <button class="editor-tab" data-tab="improve">🔧 Améliorer avec l'IA</button>
      </div>

      {/* MODE MANUEL */}
      <div class="tab-panel" data-panel="manual">
        <form method="POST" class="cust-form">
          <input type="hidden" name="config_type" value={key} />
          <input type="hidden" name="value" class="hidden-value"
                 value={JSON.stringify(parsed)} />
          <label class="form-label">Sujet</label>
          <input type="text" class="form-input subject-input"
                 placeholder="Sujet de l'email..." />
          <label class="form-label" style="margin-top:0.25rem">Corps</label>
          <textarea class="form-input cust-textarea body-input" rows={7}
                    placeholder="Contenu de l'email..."></textarea>
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
          <button type="submit" class="btn btn-primary cust-save-btn"
                  style="align-self:flex-start;margin-top:0.75rem">Sauvegarder</button>
        </form>
      </div>

      {/* MODE GÉNÉRER */}
      <div class="tab-panel hidden" data-panel="generate">
        <input type="text" class="form-input gen-formation"
               placeholder="Nom de votre formation (ex: Maîtriser Instagram)" />
        <select class="form-input gen-tone">
          <option value="chaleureux">Chaleureux et bienveillant</option>
          <option value="professionnel">Professionnel et direct</option>
          <option value="motivant">Motivant et dynamique</option>
        </select>
        <input type="text" class="form-input gen-objective"
               placeholder="Objectif de cet email (ex: rassurer, engager, fidéliser)" />
        <button class="btn btn-primary btn-generate"
                style="align-self:flex-start" disabled>✨ Générer l'email</button>
        <p class="ai-coming-soon">✦ Fonctionnalité disponible prochainement</p>
        <div class="generation-result hidden">
          <input type="text" class="form-input subject-preview"
                 readonly placeholder="Sujet généré" />
          <textarea class="form-input body-preview" rows={6}
                    readonly placeholder="Contenu généré"></textarea>
          <button class="btn btn-secondary btn-use-result"
                  style="align-self:flex-start">Utiliser ce contenu →</button>
        </div>
      </div>

      {/* MODE AMÉLIORER */}
      <div class="tab-panel hidden" data-panel="improve">
        <p class="improve-hint">Rédigez votre email ci-dessous, puis cliquez "Améliorer" pour que l'IA le peaufine.</p>
        <input type="text" class="form-input improve-subject"
               placeholder="Sujet de l'email..." />
        <textarea class="form-input cust-textarea improve-body" rows={7}
                  placeholder="Votre email à améliorer..."></textarea>
        <button class="btn btn-primary btn-improve"
                style="align-self:flex-start" disabled>🔧 Améliorer avec l'IA</button>
        <p class="ai-coming-soon">✦ Fonctionnalité disponible prochainement</p>
        <div class="improve-result hidden">
          <input type="text" class="form-input subject-improved"
                 readonly placeholder="Sujet amélioré" />
          <textarea class="form-input body-improved" rows={6}
                    readonly placeholder="Contenu amélioré"></textarea>
          <button class="btn btn-secondary btn-use-improved"
                  style="align-self:flex-start">Utiliser la version améliorée →</button>
        </div>
      </div>

    </div>
  );
})}
```

- [ ] **Step 2 : Ajouter le CSS de l'éditeur** dans `<style>`, à la fin du bloc existant

```css
/* ── Éditeur 3 modes ── */
.editor-tabs {
  display: flex;
  border-bottom: 1px solid var(--line-2);
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
}
.editor-tab {
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  padding: 0.625rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--gray);
  cursor: pointer;
  transition: color .2s, border-color .2s;
  margin-bottom: -1px;
  white-space: nowrap;
}
.editor-tab:hover { color: var(--fg-2); }
.editor-tab.active { color: #ffffff; border-bottom-color: #2E8BF0; }
.editor-tab:disabled { opacity: 0.4; cursor: default; }

.tab-panel { display: flex; flex-direction: column; gap: 0.625rem; }
.tab-panel.hidden { display: none; }

.ai-coming-soon {
  font-size: 0.8125rem;
  color: var(--gray);
  font-style: italic;
  margin: 0;
}
.improve-hint { font-size: 0.875rem; color: var(--gray-light); margin: 0; }

.generation-result,
.improve-result {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--line);
}
.generation-result.hidden,
.improve-result.hidden { display: none; }
```

- [ ] **Step 3 : Build**

```bash
npm run build
```

Expected : `[build] Complete!` — les formes SSR fonctionnent déjà (hidden-value pré-rempli avec la valeur JSON courante, donc sauvegarder sans JS conserve l'état existant).

- [ ] **Step 4 : Commit**

```bash
git add src/pages/client/customize.astro
git commit -m "feat(customize): éditeur 3 modes HTML + CSS"
```

---

## Task 5 : JavaScript — initEditor()

**Files:**
- Modify: `src/pages/client/customize.astro` — bloc `<script>`

Remplacer **entièrement** le bloc `<script>` existant (qui contient `initHints`) par le bloc ci-dessous.

- [ ] **Step 1 : Remplacer le `<script>` entier**

```astro
<script>
  /* ── Banner dismiss ── */
  function initBanner() {
    const banner = document.getElementById('default-banner');
    const btn    = document.getElementById('banner-close');
    if (!banner || !btn) return;
    if (sessionStorage.getItem('aevum_banner_dismissed')) {
      banner.style.display = 'none';
      return;
    }
    btn.addEventListener('click', () => {
      banner.style.display = 'none';
      sessionStorage.setItem('aevum_banner_dismissed', '1');
    });
  }

  /* ── Editor interactions ── */
  function initEditor() {
    document.querySelectorAll<HTMLElement>('.cust-card').forEach((card) => {
      const tabs   = card.querySelectorAll<HTMLElement>('.editor-tab');
      const panels = card.querySelectorAll<HTMLElement>('.tab-panel');

      // 1. Tab switching
      tabs.forEach((tab) => {
        tab.addEventListener('click', () => {
          if (tab.disabled) return;
          tabs.forEach((t)   => t.classList.remove('active'));
          panels.forEach((p) => p.classList.add('hidden'));
          tab.classList.add('active');
          card.querySelector<HTMLElement>(`[data-panel="${(tab as HTMLButtonElement).dataset.tab}"]`)
              ?.classList.remove('hidden');
        });
      });

      // 2. Pre-fill manual mode (email templates only)
      const subjectInput = card.querySelector<HTMLInputElement>('.subject-input');
      const bodyInput    = card.querySelector<HTMLTextAreaElement>('.body-input');
      if (subjectInput && bodyInput) {
        subjectInput.value = card.dataset.subject ?? '';
        bodyInput.value    = card.dataset.body    ?? '';
      }

      // 3. Save interceptor — serialize {subject, body} → hidden-value before form POST
      const form = card.querySelector<HTMLFormElement>('form.cust-form');
      if (form) {
        form.addEventListener('submit', () => {
          const hiddenVal = form.querySelector<HTMLInputElement>('.hidden-value');
          if (!hiddenVal) return; // sender_name — value field is direct
          const subject = subjectInput?.value ?? '';
          const body    = bodyInput?.value    ?? '';
          hiddenVal.value = JSON.stringify({ subject, body });
        });
      }

      // 4. Click-to-insert variables (inserts at cursor in active panel's textarea)
      card.querySelectorAll<HTMLElement>('.cust-hint').forEach((hint) => {
        hint.addEventListener('click', () => {
          const activePanel = card.querySelector<HTMLElement>('.tab-panel:not(.hidden)');
          const textarea    = activePanel?.querySelector<HTMLTextAreaElement>('textarea:not([readonly])');
          if (!textarea || !hint.dataset.var) return;
          const v = hint.dataset.var;
          const s = textarea.selectionStart ?? textarea.value.length;
          const e = textarea.selectionEnd   ?? textarea.value.length;
          textarea.value = textarea.value.slice(0, s) + v + textarea.value.slice(e);
          textarea.selectionStart = textarea.selectionEnd = s + v.length;
          textarea.focus();
        });
      });

      // 5. "Utiliser ce contenu" (generate mode → manual mode)
      card.querySelector<HTMLElement>('.btn-use-result')?.addEventListener('click', () => {
        const subject = card.querySelector<HTMLInputElement>('.subject-preview')?.value ?? '';
        const body    = card.querySelector<HTMLTextAreaElement>('.body-preview')?.value  ?? '';
        if (subjectInput) subjectInput.value = subject;
        if (bodyInput)    bodyInput.value    = body;
        card.querySelector<HTMLElement>('[data-tab="manual"]')?.click();
      });

      // 6. "Utiliser la version améliorée" (improve mode → manual mode)
      card.querySelector<HTMLElement>('.btn-use-improved')?.addEventListener('click', () => {
        const subject = card.querySelector<HTMLInputElement>('.subject-improved')?.value ?? '';
        const body    = card.querySelector<HTMLTextAreaElement>('.body-improved')?.value  ?? '';
        if (subjectInput) subjectInput.value = subject;
        if (bodyInput)    bodyInput.value    = body;
        card.querySelector<HTMLElement>('[data-tab="manual"]')?.click();
      });
    });
  }

  initBanner();
  initEditor();
  document.addEventListener('astro:page-load', () => {
    initBanner();
    initEditor();
  });
</script>
```

Note : Task 3 n'a ajouté que le HTML/CSS de la bannière. Ce bloc script est le premier et unique script du fichier — il remplace `initHints()` existant et consolide toute la logique JS.

- [ ] **Step 2 : Build**

```bash
npm run build
```

Expected : `[build] Complete!`

- [ ] **Step 3 : Tests**

```bash
npm test
```

Expected : `Tests 6 passed (6)`

- [ ] **Step 4 : Commit**

```bash
git add src/pages/client/customize.astro
git commit -m "feat(customize): initEditor JS — tabs, prefill, save interceptor, variables, use-result"
```

---

## Task 6 : Smoke test

- [ ] **Step 1 : Lancer le dev server**

```bash
npm run dev
```

- [ ] **Step 2 : Vérifier manuellement chaque point**

| Point | Vérification |
|-------|-------------|
| **Labels** | "Nom affiché dans l'email (expéditeur)", "Email de bienvenue…", "Email J+3…", "Email J+7…", "Email de relance paiement échoué" |
| **Bannière** | Visible si aucun template n'est sauvegardé. Bouton ✕ la ferme. Re-visite de la page : fermée (sessionStorage). |
| **sender_name** | Un seul tab "✏️ Rédiger moi-même". Champ texte. Sauvegarder rechargée page + success msg. |
| **Tab switching** | Cliquer les 3 tabs sur un template → seul le bon panel est visible. |
| **Pré-remplissage** | Si une valeur existante est sauvegardée, le mode Manuel affiche le sujet et le corps corrects. |
| **Variables** | Cliquer un badge insère `{{nom}}` etc. dans le textarea actif au curseur. |
| **Sauvegarder** | Soumettre un template → page recharge → "Sauvegardé." visible sur la carte correspondante. |
| **Boutons IA** | "✨ Générer l'email" et "🔧 Améliorer" sont `disabled` + texte "Fonctionnalité disponible prochainement". |
| **Mobile** | Tabs passent en `flex-wrap` sans débordement. |

- [ ] **Step 3 : Build final**

```bash
npm run build
```

Expected : `[build] Complete!`

- [ ] **Step 4 : Commit final si non-fait**

```bash
git log --oneline -6
```

Expected — 4+ commits feat(customize) visibles :
```
feat(customize): initEditor JS — tabs, prefill, save interceptor, variables, use-result
feat(customize): éditeur 3 modes HTML + CSS
feat(customize): bannière templates par défaut HTML + CSS
feat(customize): parseConfig + détection allDefaultTemplates
feat(customize): renommage labels + mise à jour variables
```
