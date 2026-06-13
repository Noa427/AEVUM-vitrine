# index.astro — 4e pilier + portail client Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter une 4e carte "Portail & personnalisation" dans la section piliers, passer la grille à 4 colonnes, et mettre à jour 2 textes existants pour refléter l'autonomie client.

**Architecture:** Modifications uniquement dans `src/pages/index.astro` — HTML de la section piliers, texte de la carte onboarding, texte de l'étape 2, et règle CSS locale pour l'accent amber.

**Tech Stack:** Astro 6, HTML/CSS pur, pas de framework UI

---

### Task 1 : CSS — ajout de l'accent amber

**Files:**
- Modify: `src/pages/index.astro` (bloc `<style>` en bas du fichier, après `.card--green::after`)

- [ ] **Step 1 : Ouvrir le bloc `<style>` local de index.astro**

  Le bloc `<style>` commence à la ligne 231. Repérer ce groupe existant (lignes 523–533 du layout global, reproduit visuellement dans le fichier) :

  ```css
  .card--blue::after   { background: #2E8BF0; }
  .card--purple::after { background: #7C3AED; }
  .card--green::after  { background: #059669; }
  ```

  Ces règles vivent dans `BaseLayout.astro`. La règle amber doit être ajoutée dans le `<style>` **local** de `index.astro` (à la fin, avant `</style>`).

- [ ] **Step 2 : Ajouter la règle amber**

  Dans le `<style>` local de `index.astro`, avant la fermeture `</style>`, ajouter :

  ```css
  .card--amber::after {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
    border-radius: var(--r-lg) var(--r-lg) 0 0;
    pointer-events: none;
    background: #F59E0B;
  }
  ```

  > Note : les propriétés `content`, `position`, etc. sont déjà portées par `.card--blue::after, .card--purple::after, .card--green::after` dans BaseLayout. Mais comme `.card--amber` n'est pas dans ce sélecteur groupé, il faut répéter la déclaration complète pour éviter de toucher BaseLayout.

- [ ] **Step 3 : Vérifier build**

  ```bash
  npm run build
  ```

  Attendu : build sans erreur TypeScript ni Astro.

- [ ] **Step 4 : Commit**

  ```bash
  git add src/pages/index.astro
  git commit -m "style(index): add amber accent for 4th pillar card"
  ```

---

### Task 2 : HTML — passer la grille piliers à grid-4

**Files:**
- Modify: `src/pages/index.astro` ligne ~80 (section `<!-- ═══ 3 PILIERS ═══ -->`)

- [ ] **Step 1 : Changer la classe grid**

  Localiser dans la section piliers :

  ```html
  <div class="grid-3">
  ```

  Remplacer par :

  ```html
  <div class="grid-4">
  ```

  > `grid-4` est déjà défini dans `BaseLayout.astro` : `repeat(4,1fr)` sur desktop, `repeat(2,1fr)` sur tablette (≤1024px), `1fr` sur mobile (≤768px). Aucune CSS supplémentaire n'est nécessaire.

- [ ] **Step 2 : Vérifier build**

  ```bash
  npm run build
  ```

  Attendu : build sans erreur.

- [ ] **Step 3 : Commit**

  ```bash
  git add src/pages/index.astro
  git commit -m "style(index): switch piliers grid to grid-4"
  ```

---

### Task 3 : HTML — ajouter la 4e carte

**Files:**
- Modify: `src/pages/index.astro` — après la carte `card--green` (ligne ~101), toujours dans `<div class="grid-4">`

- [ ] **Step 1 : Ajouter la carte amber après la carte verte**

  Après la fermeture `</div>` de `card--green` et avant la fermeture `</div>` du `grid-4`, insérer :

  ```html
  <div class="card card--amber reveal">
    <div class="icon-box">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>
    </div>
    <h3>Portail & personnalisation</h3>
    <p>Modifiez vos templates à tout moment depuis votre espace client. Suivez vos envois, ajustez vos séquences et personnalisez chaque email — sans passer par l'équipe AEVUM.</p>
  </div>
  ```

- [ ] **Step 2 : Vérifier build**

  ```bash
  npm run build
  ```

  Attendu : build sans erreur.

- [ ] **Step 3 : Commit**

  ```bash
  git add src/pages/index.astro
  git commit -m "feat(index): add 4th pillar card — portail & personnalisation"
  ```

---

### Task 4 : Texte — mettre à jour la carte "Onboarding automatique"

**Files:**
- Modify: `src/pages/index.astro` ligne ~86 (carte `card--blue`)

- [ ] **Step 1 : Mettre à jour le texte**

  Localiser :

  ```html
  <p>Dès qu'un paiement Stripe arrive, votre élève reçoit ses emails J0, J3 et J7 sans que vous leviez le petit doigt.</p>
  ```

  Remplacer par :

  ```html
  <p>Dès qu'un paiement Stripe arrive, votre élève reçoit ses emails J0, J3 et J7 — rédigés avec vos mots et votre ton — sans que vous leviez le petit doigt.</p>
  ```

- [ ] **Step 2 : Vérifier build**

  ```bash
  npm run build
  ```

  Attendu : build sans erreur.

- [ ] **Step 3 : Commit**

  ```bash
  git add src/pages/index.astro
  git commit -m "copy(index): mention email personalisation in onboarding pillar card"
  ```

---

### Task 5 : Texte — mettre à jour l'étape 2

**Files:**
- Modify: `src/pages/index.astro` ligne ~123 (section `<!-- ═══ ÉTAPES ═══ -->`, 2e carte)

- [ ] **Step 1 : Mettre à jour le texte**

  Localiser :

  ```html
  <p>On paramètre vos séquences d'onboarding, vos templates de relance et votre rapport hebdo selon vos instructions.</p>
  ```

  Remplacer par :

  ```html
  <p>On paramètre vos séquences d'onboarding, vos templates de relance et votre rapport hebdo selon vos instructions. Ensuite, vous gardez la main : modifiez vos templates à tout moment depuis votre portail.</p>
  ```

- [ ] **Step 2 : Vérifier build final**

  ```bash
  npm run build
  ```

  Attendu : build sans erreur TypeScript ni Astro.

- [ ] **Step 3 : Commit**

  ```bash
  git add src/pages/index.astro
  git commit -m "copy(index): clarify client keeps control of templates after setup"
  ```
