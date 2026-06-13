# Spec — customize.astro + dashboard.astro : relance v2

Date : 2026-05-26

## Périmètre

Trois modifications indépendantes sur deux fichiers :
- `src/pages/client/customize.astro`
- `src/pages/client/dashboard.astro`

---

## Modification 1 — 3 onglets Relance paiement (customize.astro)

### Objectif
Remplacer le seul onglet `template_failed_payment` par trois onglets distincts à tons progressifs.

### Config types
| tabLabel | key |
|---|---|
| Relance J+1 | `template_failed_payment_j1` |
| Relance J+3 | `template_failed_payment_j3` |
| Relance J+7 | `template_failed_payment_j7` |

### VARIABLE_HINTS (identiques pour les 3)
`{{nom}}`, `{{prenom}}`, `{{email}}`, `{{montant}}`, `{{lien_paiement}}`

### DEFAULT_TEMPLATES
- **J+1** (empathique) :
  - Sujet : `"Action requise — problème de paiement"`
  - Corps : bienvenue + explication + lien de mise à jour, ton rassurant
- **J+3** (direct) :
  - Sujet : `"{{nom}}, votre accès sera suspendu sans action de votre part"`
  - Corps : rappel de l'échec, délai explicite, appel à l'action clair
- **J+7** (ferme) :
  - Sujet : `"Dernier avertissement — suspension de votre accès"`
  - Corps : urgence, suspension imminente, lien de paiement proéminent

### Comportement
- Chaque onglet a son propre éditeur (Manuel + IA), toggle actif/inactif, collapsible "Voir le template par défaut", et bouton "Supprimer la personnalisation" — exactement comme les onglets onboarding.
- `allDefaultTemplates` vérifie désormais les 6 clés (3 onboarding + 3 relance).
- `validTabKeys` et `initialTab` se dérivent automatiquement depuis `EMAIL_CONFIGS`.
- Aucun changement au code JS (générique sur `card.dataset.config`).

---

## Modification 2 — Badges dashboard avec état réel (dashboard.astro)

### Objectif
Croiser le booléen backend (`automations.onboarding`, `automations.recouvrement`) avec l'état `active` stocké dans chaque config JSON pour afficher un badge plus précis.

### Appels backend
Ajouter `GET /client/configs` dans le `Promise.allSettled` existant (4e appel).

### Parsing des configs
```ts
type ConfigEntry = { config_type: string; value: string };
let configs: Record<string, { active: boolean }> = {};
// Pour chaque entry : JSON.parse(value).active !== false → actif
```
Si l'appel échoue ou retourne une erreur non-401 : `configs = {}` (dégradé silencieux, comportement d'avant).
Si 401 → redirect login (même pattern que les autres appels).

### Logique d'état

**Onboarding** (`automations.onboarding === true`) :
- Vérifier `template_onboarding_j0`, `template_onboarding_j3`, `template_onboarding_j7`
- Tous actifs (ou configs absentes) → `'actif'`
- Certains off → `'partiel'`
- `automations.onboarding === false/null` → `'off'`

**Recouvrement** (`automations.recouvrement === true`) :
- Vérifier `template_failed_payment_j1`, `template_failed_payment_j3`, `template_failed_payment_j7`
- Même logique

### Badges
| État | Classe | Texte |
|---|---|---|
| actif | `badge-actif` | Actif |
| partiel | `badge-partiel` | Partiellement actif |
| off | `badge-off` | Non configuré → |

`.badge-partiel` : fond ambre `rgba(245,158,11,0.15)`, couleur `#F59E0B` — cohérent avec le design system (même teinte que la bannière par défaut).

Support/IA et Upsell : inchangés (pas de configs JSON associées).

---

## Modification 3 — Bouton "Améliorer avec l'IA" dans le modal de création (customize.astro)

### Emplacement
Dans `#auto-modal`, après le textarea `name="auto_body"` et les hints variables, avant les boutons "Créer" / "Annuler".

### HTML ajouté
```html
<button type="button" id="modal-improve-btn" class="btn btn-secondary" disabled>
  🔧 Améliorer avec l'IA
</button>
<p class="ai-error" id="modal-improve-error"></p>
```

### Comportement JS (dans `initAutomations()`)
- Le bouton est désactivé par défaut et réactivé si `modalTextarea.value.trim() !== ''`
- Listener `input` sur `modalTextarea` pour gérer le disabled/enabled en temps réel
- Au clic :
  1. Lire `auto_subject` input + `auto_body` textarea
  2. `fetch('/api/ai-improve', { method: 'POST', body: { content: "Sujet : {subject}\n\nCorps :\n{body}", emailType: "custom_automation" } })`
  3. Si succès : injecter `data.subject` dans `input[name=auto_subject]`, `data.body` dans `modalTextarea`
  4. État loading : `disabled + textContent = 'Amélioration en cours...'`
  5. Erreur : afficher dans `#modal-improve-error`
  6. Finally : restaurer `textContent = '🔧 Améliorer avec l'IA'`; si textarea toujours vide → disabled

---

## Vérifications

- `npm run build` sans erreur TypeScript
- Les 3 nouveaux config_types sont bien envoyés en PUT au backend
- Le dashboard ne casse pas si `GET /client/configs` retourne une erreur
- Le bouton IA du modal est inactif quand le textarea est vide
