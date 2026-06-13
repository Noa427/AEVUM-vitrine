# Personnalisations custom — éditeur riche + limite 10

## Contexte

`customize.astro` permet de créer des automatisations email personnalisées (modal `#auto-modal`) et de les éditer ensuite via `.auto-editor` (onglets "✏️ Rédiger moi-même" / "✨ Générer avec l'IA", génération IA, "Améliorer avec l'IA").

Le modal de création n'a **pas** ces onglets : juste un textarea + un bouton "Améliorer avec l'IA" (déjà câblé, `modalImproveBtn`). Diagnostic : le flux de création (`POST` form → `src/pages/api` n'existe pas pour cette action, c'est géré directement dans `customize.astro` lignes 21-52 → backend `POST /client/automations/custom`) correspond exactement au schéma backend (`AutomationSchema`, `trigger_delay_days` requis seulement pour `delay_after_purchase`, `trigger_date` requis pour `specific_date`, tous deux déjà gérés côté JS via `updateTriggerVisibility()`). Aucun bug de création identifié — le besoin est uniquement UX (parité avec l'éditeur des templates par défaut).

Aucune limite sur le nombre d'automatisations perso n'existe (front ou back).

## Objectif

1. Le modal de création doit offrir la même UX que l'éditeur de contenu existant (`.auto-editor`) : onglets "Rédiger" / "Générer avec l'IA".
2. Limiter à 10 automatisations personnalisées par formation (front + back).

## Périmètre

- `src/pages/client/customize.astro` (modal de création + JS)
- `../AEVUM_LOGI_INFOPRENEUR/backend/src/routes/clientAuth.ts` (POST `/client/automations/custom`)
- `e2e/client-portal.spec.ts` (nouveaux scénarios)

## Design détaillé

### 1. Modal de création (`#auto-modal`)

Structure HTML actuelle (lignes ~1451-1492) :
- form `.auto-create-form` : nom, déclencheur (+ champs jours/date conditionnels), sujet, corps (textarea), hints, bouton "Améliorer avec l'IA" (`#modal-improve-btn`, déjà câblé via `updateModalImproveState`/listener existant).

Nouvelle structure : englober sujet + corps + hints + bouton "Améliorer" dans un `.tab-panel[data-panel="manual"]`, précédé d'une `.editor-tabs` row (réutilise les classes CSS existantes `.editor-tab`/`.tab-panel`/`.hidden` — déjà stylées globalement), et ajouter un `.tab-panel[data-panel="generate"]` :

```
.editor-tabs
  button.editor-tab.active data-tab="manual"  ✏️ Rédiger moi-même
  button.editor-tab          data-tab="generate" ✨ Générer avec l'IA

.tab-panel[data-panel="manual"]   (contenu actuel : sujet/corps/hints/améliorer)
.tab-panel.hidden[data-panel="generate"]
  input .modal-gen-formation
  select .modal-gen-tone
  input .modal-gen-objective
  button .btn-modal-generate  ✨ Générer l'email
  p .modal-gen-error
  div .generation-result.hidden
    input readonly .subject-preview
    textarea readonly .body-preview
    button .btn-modal-use-result  Utiliser ce contenu →
```

Les champs `name`/`trigger_type`/`trigger_days`/`trigger_date` restent **hors** des tab-panels (toujours visibles, communs aux deux modes).

### 2. JS modal (`initAutomations`, lignes ~2122-2346)

Ajouter dans `initAutomations` (ou nouvelle fonction appelée depuis `openModal`) :

- **Switch d'onglets** : identique au pattern `initCustomEditor` (lignes 2525-2535) — toggle `.active`/`.hidden` sur `.editor-tab`/`.tab-panel` scoping `modal`.
- **Génération** (`.btn-modal-generate`) : `POST /api/ai-generate` `{emailType:'custom_automation', formationName, tone, objective}`, remplit `.generation-result` (miroir lignes 2606-2633).
- **"Utiliser ce contenu"** (`.btn-modal-use-result`) : copie subject/body générés vers `input[name="auto_subject"]`/`.modal-body-textarea`, appelle `updateModalImproveState()`, bascule sur l'onglet manuel (miroir lignes 2635-2641).
- **Reset au `openModal()`** : remettre l'onglet "manual" actif et vider `.generation-result` à chaque ouverture (en plus du `form.reset()` existant).

### 3. Limite 10 (frontend)

Dans le frontmatter, après le chargement de `customAutomations` (ligne ~127) :

```ts
const autoLimitReached = customAutomations.length >= 10;
```

- `#btn-open-auto-modal` : `disabled={autoLimitReached}`.
- Si `autoLimitReached`, afficher un message au-dessus de la liste : "Limite de 10 automatisations personnalisées atteinte. Supprimez-en une pour en créer une nouvelle."

### 4. Limite 10 (backend — `clientAuth.ts`)

Dans `POST /client/automations/custom` (ligne 581), avant l'insert :

```ts
let countQuery = supabase.from('custom_automations').select('id', { count: 'exact', head: true }).eq('client_id', clientId)
if (formationId) countQuery = countQuery.eq('formation_id', formationId)
const { count } = await countQuery
if ((count ?? 0) >= 10) {
  return res.status(400).json({ error: 'Limite de 10 automatisations personnalisées atteinte' })
}
```

Réutilise `formationId` déjà calculé via `getFormationContext` (ligne 585).

### 5. Gestion d'erreurs

- Le 400 backend (limite atteinte) remonte déjà via le chemin existant `errorType='create_automation'` / `errorMsg` (customize.astro lignes 43-47) — aucun changement nécessaire au-delà du message backend.
- Le bandeau préventif frontend (`autoLimitReached`) évite la plupart des soumissions inutiles, le check backend reste la garde-fou autoritaire.

## Tests

### E2E (`e2e/client-portal.spec.ts`)

1. **Création via génération IA** : ouvrir le modal, aller sur l'onglet "Générer avec l'IA", mocker `/api/ai-generate` (déjà mocké dans `mock-backend.mjs` ou via route Playwright), cliquer "Générer l'email", "Utiliser ce contenu →", vérifier que les champs sujet/corps de l'onglet manuel sont remplis, soumettre, vérifier la création.
2. **Limite atteinte** : mocker `GET /client/automations/custom` pour renvoyer 10 entrées, recharger `/client/customize`, vérifier que `#btn-open-auto-modal` est `disabled` et que le message de limite est affiché.

### Backend

Pas de test unitaire existant pour `clientAuth.ts` dans ce repo (vitrine) — le check de comptage est couvert manuellement / par le test E2E #2 si le mock-backend implémente le comptage (sinon documenter la limitation du mock).

## Hors périmètre

- Tâches 2, 3, 4 du prompt de session (mails fonctionnels/perso IA par élève, perf, audit sécurité) — sessions séparées.
- Refonte des éditeurs des templates par défaut (déjà conformes).
