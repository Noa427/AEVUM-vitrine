# Customize Page — 2-Level Tab Navigation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure `customize.astro` navigation from a long vertical scroll into 6 category tabs (level 1) with sub-tabs per template (level 2), eliminating all scroll between sections.

**Architecture:** Single-file edit on `customize.astro`. All existing panel HTML (form fields, toggles, AI editor, save logic) is untouched — only the wrapper/navigation structure changes. Three layers of work: SSR frontmatter (initial state computation), HTML restructuring (new wrapper divs), JS (multi-nav `initConfigTabs` + new `initCategoryTabs`), CSS (level-1 tab styles).

**Tech Stack:** Astro 6 SSR, HTML/CSS/TypeScript, no new files.

---

## File Map

- **Modify only:** `src/pages/client/customize.astro`
  - Lines 161–164: remove `validTabKeys` / `initialTab`, replace with category logic
  - Lines 276–1255: restructure HTML wrapper (panels themselves stay identical)
  - Lines 2006–2121: refactor `initConfigTabs` + add `initCategoryTabs`
  - Lines 2296–2310: add `initCategoryTabs()` to both init call sites
  - Lines 2484–2531: add `.tabs-level1` / `.cat-tab` / `.cat-panel` CSS

---

## Key Concepts

### New HTML skeleton (after the sender-card, before the lib-overlay)

```html
<!-- Level-1 category tabs -->
<div class="cat-tab-nav tabs-level1" role="tablist">
  <button class="cat-tab active" data-cat="onboarding">Onboarding</button>
  <button class="cat-tab" data-cat="impayes">Impayés</button>
  <button class="cat-tab" data-cat="fidelisation">Fidélisation</button>
  <button class="cat-tab" data-cat="recuperation">Récupération</button>
  <button class="cat-tab" data-cat="temoignages">Témoignages</button>
  <button class="cat-tab" data-cat="automations">Automatisations</button>
</div>

<!-- CATEGORY: Onboarding -->
<div class="cat-panel" data-cat-panel="onboarding">
  <div class="config-tab-nav" role="tablist">
    <button class="config-tab active" data-target="panel-template_onboarding_j0" id="tab-template_onboarding_j0">Bienvenue</button>
    <button class="config-tab" data-target="panel-template_onboarding_j3" id="tab-template_onboarding_j3">J+3</button>
    <button class="config-tab" data-target="panel-template_onboarding_j7" id="tab-template_onboarding_j7">J+7</button>
  </div>
  <p class="tab-rename-error" style="display:none"></p>
  <div class="card config-panel-wrap">
    <!-- panel-template_onboarding_j0 (visible if initialSubTab['onboarding']===key) -->
    <!-- panel-template_onboarding_j3 (hidden unless initialSubTab indicates it) -->
    <!-- panel-template_onboarding_j7 (hidden unless initialSubTab indicates it) -->
  </div>
</div>

<!-- CATEGORY: Impayés (style="display:none" unless initialCat==='impayes') -->
<div class="cat-panel" data-cat-panel="impayes" style="display:none">
  <div class="config-tab-nav" role="tablist">
    <button class="config-tab active" id="tab-template_failed_payment_j1" data-target="panel-template_failed_payment_j1">Relance J+1</button>
    <button class="config-tab" id="tab-template_failed_payment_j3" data-target="panel-template_failed_payment_j3">Relance J+3</button>
    <button class="config-tab" id="tab-template_failed_payment_j7" data-target="panel-template_failed_payment_j7">Relance J+7</button>
  </div>
  <p class="tab-rename-error" style="display:none"></p>
  <div class="card config-panel-wrap">
    <!-- the 3 failed_payment panels -->
  </div>
</div>

<!-- CATEGORY: Fidélisation (style="display:none") -->
<div class="cat-panel" data-cat-panel="fidelisation" style="display:none">
  <div class="config-tab-nav" role="tablist">
    <button class="config-tab active" data-target="panel-template_predunning">Pré-dunning</button>
    <button class="config-tab" data-target="panel-template_churn_reengagement">Re-engagement</button>
    <button class="config-tab" data-target="panel-template_coaching_j14">Coaching</button>
  </div>
  <p class="tab-rename-error" style="display:none"></p>
  <div class="card config-panel-wrap">
    <!-- predunning (visible), churn (hidden), coaching (hidden) -->
  </div>
</div>

<!-- CATEGORY: Récupération (style="display:none") — no sub-tabs -->
<div class="cat-panel" data-cat-panel="recuperation" style="display:none">
  <div class="card config-panel-wrap" style="border-radius: var(--r-lg)">
    <!-- template_checkout_abandon panel (always visible in this cat) -->
  </div>
</div>

<!-- CATEGORY: Témoignages (style="display:none") -->
<div class="cat-panel" data-cat-panel="temoignages" style="display:none">
  <!-- testimonial-url-card stays here -->
  <div class="testimonial-tabs-header">
    <button class="testi-tab active" data-testi-tab="j30" type="button">À J+30</button>
    <button class="testi-tab" data-testi-tab="j60" type="button">À J+60</button>
  </div>
  <div class="card config-panel-wrap">
    <!-- j30 (visible), j60 (hidden) -->
  </div>
</div>

<!-- CATEGORY: Automatisations (style="display:none") -->
<div class="cat-panel" data-cat-panel="automations" style="display:none">
  <!-- the existing auto-section div, unchanged -->
</div>
```

---

## Task 1: Update SSR frontmatter — remove `validTabKeys`/`initialTab`, add category logic

**Files:**
- Modify: `src/pages/client/customize.astro:161-164`

- [ ] **Step 1: Replace lines 161-164**

Remove:
```ts
const validTabKeys: string[] = EMAIL_CONFIGS.map((c) => c.key);
const initialTab = validTabKeys.includes(successType) ? successType
  : validTabKeys.includes(errorType)                  ? errorType
  : EMAIL_CONFIGS[0].key;
```

Replace with:
```ts
const ONBOARDING_CONFIGS = EMAIL_CONFIGS.slice(0, 3);  // j0, j3, j7
const IMPAYES_CONFIGS    = EMAIL_CONFIGS.slice(3, 6);  // j1, j3, j7

const CAT_KEYS: Record<string, readonly string[]> = {
  onboarding:   ['template_onboarding_j0', 'template_onboarding_j3', 'template_onboarding_j7'],
  impayes:      ['template_failed_payment_j1', 'template_failed_payment_j3', 'template_failed_payment_j7'],
  fidelisation: ['template_predunning', 'template_churn_reengagement', 'template_coaching_j14'],
  recuperation: ['template_checkout_abandon'],
  temoignages:  ['template_testimonial_j30', 'template_testimonial_j60'],
};

// Default initial sub-tab = first key per category
const initialSubTab: Record<string, string> = Object.fromEntries(
  Object.entries(CAT_KEYS).map(([cat, keys]) => [cat, keys[0] as string])
);
let initialCat = 'onboarding';

const feedbackKey = successType || errorType;
if (errorType === 'create_automation') {
  initialCat = 'automations';
} else if (feedbackKey) {
  for (const [cat, keys] of Object.entries(CAT_KEYS)) {
    if (keys.includes(feedbackKey)) {
      initialCat = cat;
      initialSubTab[cat] = feedbackKey;
      break;
    }
  }
}

// Helper: is this panel the initially visible one within its category?
function isPanelActive(key: string, cat: string): boolean {
  return initialSubTab[cat] === key;
}
```

- [ ] **Step 2: Build check (TypeScript)**

Run: `npm run build`
Expected: no TS errors (may error on HTML references to old vars — that's OK, we'll fix in Task 2)

---

## Task 2: Restructure the HTML template (main change)

**Files:**
- Modify: `src/pages/client/customize.astro` — HTML section lines ~276–1255

This task replaces the entire HTML section between the sender-card and the lib-overlay. Proceed step by step.

- [ ] **Step 1: Remove old top-level tab nav + config-panel-wrap + section dividers**

Delete lines 277–436 (the old `.config-tab-nav` + `.card.config-panel-wrap` block with EMAIL_CONFIGS.map).

- [ ] **Step 2: Remove section dividers and standalone panel cards for lines 438–1096**

Delete:
- The predunning `section-divider` + `cust-card` block (lines ~438–544)
- The churn `section-divider` + `cust-card` block (lines ~546–652)
- The coaching `section-divider` + `cust-card` block (lines ~654–760)
- The checkout `section-divider` + `cust-card` block (lines ~762–867)
- The testimonials `section-divider` + `testimonial-url-card` + `testimonial-tabs-header` + j30 panel + j60 panel block (lines ~869–1094)
- The empty `section-divider` (line ~1096)

Keep the `auto-section` div (lines ~1098–1255) as-is.

- [ ] **Step 3: Insert the new 2-level HTML structure**

Insert the following immediately after the sender-card closing `</div>` (after line ~274) and before the auto-section div:

```astro
<!-- ── Onglets niveau 1 (catégories) ── -->
<div class="cat-tab-nav tabs-level1" role="tablist">
  <button class={`cat-tab${initialCat === 'onboarding'   ? ' active' : ''}`} data-cat="onboarding"   type="button">Onboarding</button>
  <button class={`cat-tab${initialCat === 'impayes'      ? ' active' : ''}`} data-cat="impayes"      type="button">Impayés</button>
  <button class={`cat-tab${initialCat === 'fidelisation' ? ' active' : ''}`} data-cat="fidelisation" type="button">Fidélisation</button>
  <button class={`cat-tab${initialCat === 'recuperation' ? ' active' : ''}`} data-cat="recuperation" type="button">Récupération</button>
  <button class={`cat-tab${initialCat === 'temoignages'  ? ' active' : ''}`} data-cat="temoignages"  type="button">Témoignages</button>
  <button class={`cat-tab${initialCat === 'automations'  ? ' active' : ''}`} data-cat="automations"  type="button">Automatisations</button>
</div>

<!-- ── Catégorie : Onboarding ── -->
<div class="cat-panel" data-cat-panel="onboarding" style={initialCat !== 'onboarding' ? 'display:none' : ''}>
  <div class="config-tab-nav" role="tablist">
    {ONBOARDING_CONFIGS.map(({ key, tabLabel }) => (
      <button class={`config-tab${isPanelActive(key, 'onboarding') ? ' active' : ''}`}
              data-target={`panel-${key}`}
              id={`tab-${key}`}
              role="tab"
              type="button">
        {PARSED_CONFIGS[key].label ?? tabLabel}
      </button>
    ))}
  </div>
  <p class="tab-rename-error" style="display:none"></p>
  <div class="card config-panel-wrap">
    {ONBOARDING_CONFIGS.map(({ key, label }) => {
      const isSuccess = successType === key;
      const isError   = errorType === key;
      const hints     = VARIABLE_HINTS[key];
      const isActive  = isPanelActive(key, 'onboarding');
      const parsed    = PARSED_CONFIGS[key];
      return (
        <div class="cust-card config-panel" id={`panel-${key}`} data-config={key}
             data-subject={parsed.subject} data-body={parsed.body}
             data-label={parsed.label ?? ''} data-panel-active={parsed.active ? 'true' : 'false'}
             data-whatsapp-active={parsed.whatsapp_active ? 'true' : 'false'}
             data-sms-active={parsed.sms_active ? 'true' : 'false'}
             data-sms-body={parsed.sms_body ?? ''}
             style={!isActive ? "display:none" : ""}>
          <!-- PANEL CONTENT: identical to original EMAIL_CONFIGS.map content -->
          <!-- Copy the full panel JSX from original lines 305–433 for each key -->
        </div>
      );
    })}
  </div>
</div>

<!-- ── Catégorie : Impayés ── -->
<div class="cat-panel" data-cat-panel="impayes" style={initialCat !== 'impayes' ? 'display:none' : ''}>
  <div class="config-tab-nav" role="tablist">
    {IMPAYES_CONFIGS.map(({ key, tabLabel }) => (
      <button class={`config-tab${isPanelActive(key, 'impayes') ? ' active' : ''}`}
              data-target={`panel-${key}`}
              id={`tab-${key}`}
              role="tab"
              type="button">
        {PARSED_CONFIGS[key].label ?? tabLabel}
      </button>
    ))}
  </div>
  <p class="tab-rename-error" style="display:none"></p>
  <div class="card config-panel-wrap">
    {IMPAYES_CONFIGS.map(({ key, label }) => {
      const isSuccess = successType === key;
      const isError   = errorType === key;
      const hints     = VARIABLE_HINTS[key];
      const isActive  = isPanelActive(key, 'impayes');
      const parsed    = PARSED_CONFIGS[key];
      return (
        <div class="cust-card config-panel" id={`panel-${key}`} data-config={key}
             data-subject={parsed.subject} data-body={parsed.body}
             data-label={parsed.label ?? ''} data-panel-active={parsed.active ? 'true' : 'false'}
             data-whatsapp-active={parsed.whatsapp_active ? 'true' : 'false'}
             data-sms-active={parsed.sms_active ? 'true' : 'false'}
             data-sms-body={parsed.sms_body ?? ''}
             style={!isActive ? "display:none" : ""}>
          <!-- PANEL CONTENT: identical to Onboarding map content above -->
        </div>
      );
    })}
  </div>
</div>

<!-- ── Catégorie : Fidélisation ── -->
<div class="cat-panel" data-cat-panel="fidelisation" style={initialCat !== 'fidelisation' ? 'display:none' : ''}>
  <div class="config-tab-nav" role="tablist">
    <button class={`config-tab${isPanelActive('template_predunning','fidelisation') ? ' active' : ''}`}
            data-target="panel-template_predunning" type="button">Pré-dunning</button>
    <button class={`config-tab${isPanelActive('template_churn_reengagement','fidelisation') ? ' active' : ''}`}
            data-target="panel-template_churn_reengagement" type="button">Re-engagement</button>
    <button class={`config-tab${isPanelActive('template_coaching_j14','fidelisation') ? ' active' : ''}`}
            data-target="panel-template_coaching_j14" type="button">Coaching</button>
  </div>
  <p class="tab-rename-error" style="display:none"></p>
  <div class="card config-panel-wrap">
    <!-- predunning panel (with style={!isPanelActive('template_predunning','fidelisation') ? 'display:none' : ''}) -->
    <!-- churn panel -->
    <!-- coaching panel -->
    <!-- Panel content = unchanged from original standalone cards, minus section-divider wrapper -->
  </div>
</div>

<!-- ── Catégorie : Récupération ── -->
<div class="cat-panel" data-cat-panel="recuperation" style={initialCat !== 'recuperation' ? 'display:none' : ''}>
  <div class="card config-panel-wrap" style="border-radius:var(--r-lg)">
    <!-- checkout_abandon panel (always visible, no sub-tabs) -->
    <!-- Panel content = unchanged from original -->
  </div>
</div>

<!-- ── Catégorie : Témoignages ── -->
<div class="cat-panel" data-cat-panel="temoignages" style={initialCat !== 'temoignages' ? 'display:none' : ''}>
  <!-- testimonial-url-card (unchanged) -->
  <div class="card testimonial-url-card">
    <!-- ... identical to original ... -->
  </div>
  <div class="testimonial-tabs-header" style="margin-top:1rem">
    <button class="testi-tab active" data-testi-tab="j30" type="button">À J+30</button>
    <button class="testi-tab" data-testi-tab="j60" type="button">À J+60</button>
  </div>
  <div class="card config-panel-wrap">
    <!-- j30 panel (visible), j60 panel (style="display:none") -->
    <!-- Panel content = unchanged from original -->
  </div>
</div>

<!-- ── Catégorie : Automatisations ── -->
<div class="cat-panel" data-cat-panel="automations" style={initialCat !== 'automations' ? 'display:none' : ''}>
  <!-- auto-section div (unchanged content) -->
</div>
```

**Important notes for this step:**
- The inner panel HTML (everything inside `<div class="cust-card config-panel">`) is COPY-PASTED verbatim from the original file. Do NOT rewrite it.
- The `predunning`, `churn`, `coaching` panels: copy from original lines 441–760, remove only the outer `section-divider` div and put inside the fidelisation `config-panel-wrap`. Add `style={!isPanelActive('template_predunning','fidelisation') ? 'display:none' : ''}` etc. on each panel's outer div.
- The `checkout_abandon` panel: copy from original lines 765–867, put inside recuperation `config-panel-wrap`. No `display:none` needed (only panel in its cat).
- The `j30` / `j60` testimonial panels: copy from original lines 898–1093, put inside temoignages `config-panel-wrap`. `j60` gets `style="display:none"` (first sub-tab = j30).

- [ ] **Step 4: Build check**

Run: `npm run build`
Expected: TypeScript compiles without errors, no "variable not found" errors.

- [ ] **Step 5: Commit structural HTML change**

```bash
git add src/pages/client/customize.astro
git commit -m "refactor(customize): restructure HTML to 2-level tab categories"
```

---

## Task 3: Refactor `initConfigTabs()` for multi-nav support

**Files:**
- Modify: `src/pages/client/customize.astro` — JS `initConfigTabs` function (~lines 2006–2122)

Current function queries a single `.config-tab-nav`. Must be refactored to iterate over all instances.

- [ ] **Step 1: Replace `initConfigTabs` body**

Replace the entire `function initConfigTabs()` body with:

```typescript
function initConfigTabs() {
  document.querySelectorAll<HTMLElement>('.config-tab-nav').forEach((nav) => {
    if (nav.dataset.tabsInit) return;
    nav.dataset.tabsInit = 'true';

    // Scope panel visibility to this nav's parent cat-panel
    const catPanel = nav.closest<HTMLElement>('.cat-panel');

    function activateTab(targetId: string) {
      nav.querySelectorAll<HTMLElement>('.config-tab').forEach((t) => {
        t.classList.toggle('active', t.dataset.target === targetId);
      });
      // Hide/show only the panels within this category's config-panel-wrap
      const wrap = catPanel?.querySelector<HTMLElement>('.config-panel-wrap');
      if (wrap) {
        wrap.querySelectorAll<HTMLElement>('.config-panel').forEach((p) => {
          p.style.display = p.id === targetId ? '' : 'none';
        });
      } else {
        // Fallback: global (shouldn't happen in new structure)
        document.querySelectorAll<HTMLElement>('.config-panel').forEach((p) => {
          p.style.display = p.id === targetId ? '' : 'none';
        });
      }
    }

    nav.querySelectorAll<HTMLButtonElement>('.config-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        if (tab.dataset.editing) return;
        if (tab.dataset.target) activateTab(tab.dataset.target);
      });

      tab.addEventListener('dblclick', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (tab.dataset.editing) return;
        tab.dataset.editing = 'true';

        const configKey   = tab.dataset.target?.replace('panel-', '') ?? '';
        const currentText = tab.textContent?.trim() ?? '';

        tab.contentEditable = 'true';
        tab.focus();
        const range = document.createRange();
        range.selectNodeContents(tab);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);

        let committed = false;

        function cancelTabEdit() {
          tab.contentEditable = 'false';
          tab.textContent = currentText;
          delete tab.dataset.editing;
        }

        async function doTabSave() {
          if (committed) return;
          committed = true;
          tab.contentEditable = 'false';
          const newLabel = tab.textContent?.trim() ?? '';
          delete tab.dataset.editing;
          if (!newLabel || newLabel === currentText) {
            tab.textContent = currentText;
            return;
          }
          const panel           = document.getElementById(`panel-${configKey}`);
          const existingSubject = panel?.querySelector<HTMLInputElement>('.subject-input')?.value
                                ?? panel?.dataset.subject ?? '';
          const existingBody    = panel?.querySelector<HTMLTextAreaElement>('.body-input')?.value
                                ?? panel?.dataset.body ?? '';
          const value = JSON.stringify({ subject: existingSubject, body: existingBody, label: newLabel });
          try {
            const res = await fetch('/api/config-update', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ config_type: configKey, value }),
            });
            if (!res.ok) throw new Error('Erreur de sauvegarde');
            if (panel) {
              panel.dataset.label = newLabel;
              const h2 = panel.querySelector<HTMLElement>('.section-title');
              if (h2) h2.textContent = newLabel;
            }
          } catch {
            tab.textContent = currentText;
            const errEl = nav.nextElementSibling as HTMLElement | null;
            if (errEl?.classList.contains('tab-rename-error')) {
              errEl.textContent = 'Erreur de sauvegarde';
              errEl.style.display = 'block';
              setTimeout(() => { errEl.style.display = 'none'; }, 3000);
            }
          }
        }

        tab.addEventListener('keydown', function kbHandler(e) {
          if (e.key === 'Enter')  { e.preventDefault(); tab.removeEventListener('keydown', kbHandler); tab.removeEventListener('blur', blurHandler); doTabSave(); }
          if (e.key === 'Escape') { e.preventDefault(); tab.removeEventListener('keydown', kbHandler); tab.removeEventListener('blur', blurHandler); cancelTabEdit(); }
        });
        function blurHandler() { tab.removeEventListener('blur', blurHandler); doTabSave(); }
        tab.addEventListener('blur', blurHandler);
      });
    });

    // Auto-activate the panel matching any success/error feedback within this cat-panel
    const feedbackEl = catPanel?.querySelector<HTMLElement>('.config-panel .success-msg, .config-panel .cust-field-error');
    if (feedbackEl) {
      const panel = feedbackEl.closest<HTMLElement>('.config-panel');
      if (panel) activateTab(panel.id);
    }
  });
}
```

- [ ] **Step 2: Build check**

Run: `npm run build`
Expected: no TS errors.

---

## Task 4: Add `initCategoryTabs()` and wire it up

**Files:**
- Modify: `src/pages/client/customize.astro` — JS section

- [ ] **Step 1: Add `initCategoryTabs` function** (add after `initConfigTabs`, before `initCustomEditor`)

```typescript
function initCategoryTabs() {
  const catNav = document.querySelector<HTMLElement>('.cat-tab-nav');
  if (!catNav || catNav.dataset.catInit) return;
  catNav.dataset.catInit = 'true';

  function activateCat(cat: string) {
    catNav.querySelectorAll<HTMLElement>('.cat-tab').forEach((t) => {
      t.classList.toggle('active', t.dataset.cat === cat);
    });
    document.querySelectorAll<HTMLElement>('.cat-panel').forEach((p) => {
      p.style.display = p.dataset.catPanel === cat ? '' : 'none';
    });
    // Reset sub-tabs to first when switching categories
    const activePanel = document.querySelector<HTMLElement>(`.cat-panel[data-cat-panel="${cat}"]`);
    if (!activePanel) return;
    const subNav = activePanel.querySelector<HTMLElement>('.config-tab-nav');
    if (subNav) {
      const firstTab = subNav.querySelector<HTMLButtonElement>('.config-tab');
      if (firstTab?.dataset.target) {
        subNav.querySelectorAll<HTMLElement>('.config-tab').forEach((t) => {
          t.classList.toggle('active', t === firstTab);
        });
        const wrap = activePanel.querySelector<HTMLElement>('.config-panel-wrap');
        wrap?.querySelectorAll<HTMLElement>('.config-panel').forEach((p) => {
          p.style.display = p.id === firstTab.dataset.target ? '' : 'none';
        });
      }
    }
  }

  catNav.querySelectorAll<HTMLButtonElement>('.cat-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      if (tab.dataset.cat) activateCat(tab.dataset.cat);
    });
  });
}
```

- [ ] **Step 2: Add calls to `initCategoryTabs()` in both init sites**

The file calls all init functions twice:
1. At top-level (lines ~2296–2301)
2. Inside `document.addEventListener('astro:page-load', ...)` (lines ~2303–2310)

Add `initCategoryTabs();` to both call sites.

Result (both sites should look like):
```typescript
initBanner();
initEditor();
initAutomations();
initConfigTabs();
initCategoryTabs();   // ← add this line
initCustomEditor();
initTestimonialTabs();
initTestimonialUrlForm();
```

- [ ] **Step 3: Build check**

Run: `npm run build`
Expected: build success, no TS errors.

---

## Task 5: Add CSS for level-1 tabs and cat-panel

**Files:**
- Modify: `src/pages/client/customize.astro` — `<style>` block

- [ ] **Step 1: Add styles** (insert after the existing `.config-tab-nav` / `.config-tab` rules, around line ~2530)

```css
/* ── Niveau 1 — onglets de catégories ── */
.cat-tab-nav {
  display: flex;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  white-space: nowrap;
  gap: 0.25rem;
  margin-bottom: 1.5rem;
  padding-bottom: 0.25rem;
  border-bottom: 2px solid var(--gray-border);
}
.cat-tab-nav::-webkit-scrollbar { display: none; }
.cat-tab {
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  padding: 0.625rem 1.5rem;
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--gray);
  cursor: pointer;
  transition: color .2s, border-color .2s, background .2s;
  white-space: nowrap;
  margin-bottom: -2px;
  flex-shrink: 0;
  border-radius: var(--radius-sm) var(--radius-sm) 0 0;
}
.cat-tab:hover { color: var(--gray-light); background: rgba(255,255,255,0.04); }
.cat-tab.active { color: var(--ink); border-bottom-color: var(--ink); }

/* ── Conteneur de catégorie ── */
.cat-panel { margin-bottom: 2rem; }
```

- [ ] **Step 2: Remove `.section-divider` style block** (now unused — the section-divider divs are gone)

Search for `.section-divider {` in the `<style>` block and delete the entire rule (~lines 2809–2831).

- [ ] **Step 3: Build check**

Run: `npm run build`
Expected: build success.

---

## Task 6: Final verification

- [ ] **Step 1: Full build**

Run: `npm run build`
Expected: exit 0, no TypeScript errors, no Astro compilation warnings.

- [ ] **Step 2: Manual test checklist**

Start dev server: `npm run dev`

Check each item:
- [ ] Page loads: "Onboarding" category visible, "Bienvenue" sub-tab active, panel content shows
- [ ] Click "Impayés" cat-tab → shows Relance J+1 panel, other cats hidden
- [ ] Click "Relance J+3" sub-tab → shows J+3 panel
- [ ] Click "Fidélisation" cat-tab → shows Pré-dunning panel
- [ ] Click "Re-engagement" sub-tab → shows churn panel
- [ ] Click "Récupération" cat-tab → shows checkout abandon panel (no sub-tabs)
- [ ] Click "Témoignages" cat-tab → shows URL card + testi tabs + J+30 panel
- [ ] Click "À J+60" → shows J+60 panel
- [ ] Click "Automatisations" cat-tab → shows custom automations list + créer button
- [ ] Toggle actif/inactif on a template → saves immediately
- [ ] Click "Sauvegarder" on a template → saves via form POST
- [ ] Click "Améliorer avec l'IA" → calls /api/ai-improve
- [ ] Click "M'envoyer un aperçu" → calls /api/test-send
- [ ] Double-click sub-tab → rename inplace, saves to /api/config-update
- [ ] Click ✏️ rename button in panel → rename saves, updates tab label
- [ ] Expéditeur section always visible regardless of cat-tab selected
- [ ] Sender name saves via form POST
- [ ] Créer automatisation modal opens, IA améliorer works, création saves
- [ ] Automatisation toggle/rename/delete work
- [ ] Switching cat-tabs resets sub-tab to first of new category
- [ ] No JS errors in browser console

- [ ] **Step 3: Final commit**

```bash
git add src/pages/client/customize.astro
git commit -m "feat(customize): navigation 2 niveaux — catégories + sous-onglets sans scroll"
```

---

## Self-Review

**Spec coverage:**
- ✅ 6 category tabs (Onboarding, Impayés, Fidélisation, Récupération, Témoignages, Automatisations)
- ✅ Sub-tabs per category per spec table
- ✅ Récupération — no sub-tabs, single template
- ✅ Automatisations — no sub-tabs, list + créer
- ✅ Level-1 tabs visually distinct (larger font, bolder weight, bottom border 3px vs 2px)
- ✅ Expéditeur section stays at top, outside all category containers
- ✅ Changing cat-tab resets sub-tab to first
- ✅ Guard `dataset.initialized` on `initCategoryTabs` and `initConfigTabs`
- ✅ No SSR logic changes (endpoints, save logic unchanged)
- ✅ No global CSS changes (only new rules + remove unused `.section-divider`)
- ✅ `allDefaultTemplates` banner logic unchanged
- ✅ `initialCat`/`initialSubTab` correctly handles POST feedback (success/error redirects to right cat)

**Type consistency:**
- `isPanelActive(key, cat)` used consistently in HTML for `isActive` checks
- `ONBOARDING_CONFIGS` / `IMPAYES_CONFIGS` are subsets of `EMAIL_CONFIGS` (same shape)
- `PARSED_CONFIGS` covers all EMAIL_CONFIGS keys — used in both onboarding and impayes maps

**Potential gotcha:** The `tab-rename-error` paragraph — old code used `document.querySelector('.tab-rename-error')`. New code (in refactored `initConfigTabs`) uses `nav.nextElementSibling` which should be the `.tab-rename-error` `<p>`. Verify the HTML order: `config-tab-nav` immediately followed by `<p class="tab-rename-error">`. ✅ (enforced in Task 2 HTML structure)
