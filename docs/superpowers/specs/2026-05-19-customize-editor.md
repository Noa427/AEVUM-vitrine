# Spec — customize.astro : éditeur 3 modes + templates par défaut

**Date :** 2026-05-19  
**Fichier :** `src/pages/client/customize.astro` uniquement  
**Dépendances :** `ClientLayout`, `src/lib/auth.ts`, backend `/client/configs`

---

## 1. Renommage des labels (Partie 1)

Mettre à jour `CONFIG_TYPES` dans le frontmatter :

| Clé | Ancien label | Nouveau label |
|-----|-------------|---------------|
| `sender_name` | `"Nom d'expéditeur"` | `"Nom affiché dans l'email (expéditeur)"` |
| `template_onboarding_j0` | `"Email onboarding J0"` | `"Email de bienvenue (envoyé immédiatement après l'achat)"` |
| `template_onboarding_j3` | `"Email onboarding J3"` | `"Email J+3 (3 jours après l'achat)"` |
| `template_onboarding_j7` | `"Email onboarding J7"` | `"Email J+7 (7 jours après l'achat)"` |
| `template_failed_payment` | `"Email relance impayé"` | `"Email de relance paiement échoué"` |

---

## 2. Bannière templates par défaut (Partie 2)

### Détection (SSR)
```ts
const EMAIL_KEYS = ['template_onboarding_j0', 'template_onboarding_j3', 'template_onboarding_j7', 'template_failed_payment'];
const allDefaultTemplates = EMAIL_KEYS.every((k) => !configs[k]);
```
La bannière s'affiche si `allDefaultTemplates === true`.

### HTML
```html
<div class="default-banner" id="default-banner" role="alert">
  <span class="banner-icon">⚠️</span>
  <p>Vos emails utilisent actuellement les templates par défaut AEVUM.
     Personnalisez-les ci-dessous pour les adapter à votre formation et votre audience.</p>
  <button class="banner-close" id="banner-close" aria-label="Fermer">✕</button>
</div>
```
Placée sous le header `.customize-header`, avant le premier `.cust-card`.

### Style
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
  background: none; border: none; cursor: pointer;
  color: var(--gray); font-size: 1rem; padding: 0;
  flex-shrink: 0; line-height: 1;
}
.banner-close:hover { color: var(--fg); }
```

### JS (dismiss)
```ts
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
initBanner();
document.addEventListener('astro:page-load', initBanner);
```

---

## 3. Éditeur 3 modes (Partie 3)

### Modèle de données

Chaque clé `configs[key]` est chargée depuis le backend comme string. Le frontmatter SSR parse les valeurs :

```ts
// Dans le frontmatter Astro (SSR)
function parseConfig(raw: string): { subject: string; body: string } {
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.subject === 'string' && typeof parsed.body === 'string') {
      return parsed;
    }
  } catch {}
  return { subject: '', body: raw }; // rétrocompatibilité plain-text
}

// Pour chaque template email, calculer avant le rendu :
// const parsed = parseConfig(configs[key] ?? '');
// Puis injecter sur le div : data-subject={parsed.subject} data-body={parsed.body}
```

Le JS lit `card.dataset.subject` et `card.dataset.body` pour pré-remplir les champs du mode Manuel au chargement.

À la sauvegarde, la valeur stockée est toujours `JSON.stringify({subject, body})` — sauf pour `sender_name` qui reste un string plain (pas de JSON, pas de `.hidden-value`).

### Traitement selon le type de config

| Config | Type | Éditeur |
|--------|------|---------|
| `sender_name` | Texte simple | 1 tab "Manuel" uniquement, champ `<input type="text">` |
| 4 templates email | Multiline | 3 tabs complets (Manuel / Générer / Améliorer) |

### HTML — structure par template email

```html
<div class="card cust-card" data-config="{key}">
  <h2 class="cust-card-title">{label}</h2>

  <!-- Feedback SSR (success/erreur) -->
  {isSuccess && <div class="success-msg" role="alert"><span>Sauvegardé.</span></div>}
  {isError   && <div class="cust-field-error" role="alert">{errorMsg}</div>}

  <!-- Tabs -->
  <div class="editor-tabs">
    <button class="editor-tab active" data-tab="manual">✏️ Rédiger moi-même</button>
    <button class="editor-tab" data-tab="generate">✨ Générer avec l'IA</button>
    <button class="editor-tab" data-tab="improve">🔧 Améliorer avec l'IA</button>
  </div>

  <!-- MODE MANUEL -->
  <div class="tab-panel" data-panel="manual">
    <form method="POST" class="cust-form">
      <input type="hidden" name="config_type" value="{key}" />
      <input type="hidden" name="value" class="hidden-value" />
      <input type="text" class="form-input subject-input" placeholder="Sujet de l'email..." />
      <textarea class="form-input cust-textarea body-input" rows="7"
                placeholder="Contenu de l'email..."></textarea>
      <div class="cust-hints">
        <p class="cust-hints-label">Variables disponibles — cliquez pour insérer :</p>
        <div class="cust-hints-list">
          <!-- badges .cust-hint[data-var] selon la clé -->
        </div>
      </div>
      <button type="submit" class="btn btn-primary cust-save-btn">Sauvegarder</button>
    </form>
  </div>

  <!-- MODE GÉNÉRER -->
  <div class="tab-panel hidden" data-panel="generate">
    <input type="text" class="form-input gen-formation" placeholder="Nom de votre formation (ex: Maîtriser Instagram)" />
    <select class="form-input gen-tone">
      <option value="chaleureux">Chaleureux et bienveillant</option>
      <option value="professionnel">Professionnel et direct</option>
      <option value="motivant">Motivant et dynamique</option>
    </select>
    <input type="text" class="form-input gen-objective" placeholder="Objectif de cet email (ex: rassurer, engager, fidéliser)" />
    <button class="btn btn-primary btn-generate" disabled>✨ Générer l'email</button>
    <p class="ai-coming-soon">✦ Fonctionnalité disponible prochainement</p>
    <div class="generation-result hidden">
      <input type="text" class="form-input subject-preview" readonly placeholder="Sujet généré" />
      <textarea class="form-input body-preview" rows="7" readonly placeholder="Contenu généré"></textarea>
      <button class="btn btn-secondary btn-use-result">Utiliser ce contenu →</button>
    </div>
  </div>

  <!-- MODE AMÉLIORER -->
  <div class="tab-panel hidden" data-panel="improve">
    <p class="improve-hint">Rédigez votre email ci-dessous, puis cliquez "Améliorer" pour que l'IA le peaufine.</p>
    <input type="text" class="form-input improve-subject" placeholder="Sujet de l'email..." />
    <textarea class="form-input cust-textarea improve-body" rows="7"
              placeholder="Votre email à améliorer..."></textarea>
    <button class="btn btn-primary btn-improve" disabled>🔧 Améliorer avec l'IA</button>
    <p class="ai-coming-soon">✦ Fonctionnalité disponible prochainement</p>
    <div class="improve-result hidden">
      <input type="text" class="form-input subject-improved" readonly />
      <textarea class="form-input body-improved" rows="7" readonly></textarea>
      <button class="btn btn-secondary btn-use-improved">Utiliser la version améliorée →</button>
    </div>
  </div>
</div>
```

### HTML — sender_name (tab unique)

```html
<div class="card cust-card" data-config="sender_name">
  <h2 class="cust-card-title">Nom affiché dans l'email (expéditeur)</h2>
  {isSuccess && <div class="success-msg" role="alert"><span>Sauvegardé.</span></div>}
  {isError   && <div class="cust-field-error" role="alert">{errorMsg}</div>}
  <div class="editor-tabs">
    <button class="editor-tab active" data-tab="manual">✏️ Rédiger moi-même</button>
  </div>
  <div class="tab-panel" data-panel="manual">
    <form method="POST" class="cust-form">
      <input type="hidden" name="config_type" value="sender_name" />
      <input type="text" name="value" class="form-input" placeholder="Ex : Jean Dupont" />
      <button type="submit" class="btn btn-primary cust-save-btn">Sauvegarder</button>
    </form>
  </div>
</div>
```

### Variables par clé

| Clé | Variables |
|-----|-----------|
| `template_onboarding_j0` | `{{nom}}` `{{prenom}}` `{{email}}` `{{nom_formation}}` `{{lien_acces}}` `{{mot_de_passe}}` |
| `template_onboarding_j3` | `{{nom}}` `{{prenom}}` `{{email}}` `{{nom_formation}}` `{{lien_acces}}` |
| `template_onboarding_j7` | `{{nom}}` `{{prenom}}` `{{email}}` `{{nom_formation}}` `{{lien_acces}}` |
| `template_failed_payment` | `{{nom}}` `{{prenom}}` `{{email}}` `{{montant}}` `{{lien_paiement}}` |

### JavaScript — interactions

Toutes les interactions sont dans une fonction `initEditor()` appelée à l'init et sur `astro:page-load`.

**Switch de tab :**
```ts
card.querySelectorAll('.editor-tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    card.querySelectorAll('.editor-tab').forEach((t) => t.classList.remove('active'));
    card.querySelectorAll('.tab-panel').forEach((p) => p.classList.add('hidden'));
    tab.classList.add('active');
    card.querySelector(`[data-panel="${tab.dataset.tab}"]`)?.classList.remove('hidden');
  });
});
```

**Pré-remplissage au chargement :**
- Lire `data-subject` et `data-body` depuis `data-*` sur la `.cust-card` (injectés en SSR via `JSON.parse`)
- Peupler `.subject-input` et `.body-input` du mode Manuel

**Sauvegarde :**
```ts
form.addEventListener('submit', () => {
  const hiddenVal = form.querySelector<HTMLInputElement>('.hidden-value');
  if (!hiddenVal) return; // sender_name — le champ value est direct, pas d'interception
  const subject = card.querySelector<HTMLInputElement>('.subject-input')?.value ?? '';
  const body    = card.querySelector<HTMLTextAreaElement>('.body-input')?.value ?? '';
  hiddenVal.value = JSON.stringify({ subject, body });
  // form.submit() SSR se poursuit normalement
});
```

**Click-to-insert variables :**
```ts
card.querySelectorAll<HTMLElement>('.cust-hint').forEach((hint) => {
  hint.addEventListener('click', () => {
    const textarea = card.querySelector<HTMLTextAreaElement>('.body-input');
    if (!textarea) return;
    const v = hint.dataset.var ?? '';
    const s = textarea.selectionStart ?? textarea.value.length;
    const e = textarea.selectionEnd ?? textarea.value.length;
    textarea.value = textarea.value.slice(0, s) + v + textarea.value.slice(e);
    textarea.selectionStart = textarea.selectionEnd = s + v.length;
    textarea.focus();
  });
});
```

**"Utiliser ce contenu" / "Utiliser la version améliorée" :**
```ts
btn.addEventListener('click', () => {
  const subject = panel.querySelector<HTMLInputElement>('.subject-preview, .subject-improved')?.value ?? '';
  const body    = panel.querySelector<HTMLTextAreaElement>('.body-preview, .body-improved')?.value ?? '';
  card.querySelector<HTMLInputElement>('.subject-input')!.value = subject;
  card.querySelector<HTMLTextAreaElement>('.body-input')!.value = body;
  // bascule sur le tab Manuel
  card.querySelector<HTMLElement>('[data-tab="manual"]')?.click();
});
```

### CSS — tabs et éditeur

```css
.editor-tabs {
  display: flex;
  gap: 0;
  border-bottom: 1px solid var(--line-2);
  margin-bottom: 1.25rem;
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
}
.editor-tab:hover { color: var(--fg-2); }
.editor-tab.active { color: #ffffff; border-bottom-color: #2E8BF0; }

.tab-panel { display: flex; flex-direction: column; gap: 0.75rem; }
.tab-panel.hidden { display: none; }

.ai-coming-soon {
  font-size: 0.8125rem;
  color: var(--gray);
  font-style: italic;
  margin: 0;
}
.improve-hint { font-size: 0.875rem; color: var(--gray-light); margin: 0; }
.generation-result, .improve-result { display: flex; flex-direction: column; gap: 0.75rem; }
.generation-result.hidden, .improve-result.hidden { display: none; }

.gen-tone { /* même style que .form-input */ }
```

---

## 4. Ce qui ne change pas

- Architecture SSR, auth guard, 401 handler : inchangés
- `Promise.allSettled` pour les fetches : inchangé
- `ClientLayout`, `BaseLayout` : non touchés
- Logique backend PUT `/client/configs` : inchangée

---

## 5. Fichier modifié

| Action | Fichier |
|--------|---------|
| Modifier | `src/pages/client/customize.astro` |

Aucun nouveau fichier. Les routes API IA (`/api/ai/generate`, `/api/ai/improve`) seront ajoutées dans une tâche séparée quand les endpoints backend seront prêts.
