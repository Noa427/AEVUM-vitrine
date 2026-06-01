# Spec — Mise à jour contenu vitrine AEVUM

**Date :** 2026-06-01  
**Branche :** feat/phase2-features8-12  
**Ordre d'implémentation :** pricing → features → index → comment-ca-marche

---

## Objectif

Mettre à jour les 4 pages marketing pour refléter le produit réel livré : 4 piliers enrichis + 18 features additionnelles + 3 options + 4 plans tarifaires. Zéro modification de CSS ou de structure HTML sauf ajout d'une classe `.option-card` dans `pricing.astro`.

---

## Contraintes

- Uniquement le contenu textuel et les données — pas de CSS, pas de nouveaux composants
- `npm run build` sans erreur TypeScript après chaque page modifiée
- Aucune mention de plan "Starter", prix "29€", "149€" (module notaire est une option à 149€/dossier, pas un plan), ou "500€/mois" ne doit subsister
- Les 3 options sont disponibles sur Standard et Premium uniquement (ne pas les afficher dans les plans lancement)

---

## Page 1 — `src/pages/pricing.astro`

### Données frontmatter à remplacer

**`launchPlans[]`** (remplace `plans[]`) :
```ts
[
  {
    name: 'Case Study',
    target: 'Accès aux conditions les plus avantageuses — en échange d\'un retour d\'expérience structuré',
    setup: '0€',
    monthly: '300€',
    engagement: '3 mois minimum',
    note: '2 places disponibles',
    popular: false,
    condition: 'Témoignage vidéo obligatoire',
    features: [
      'Onboarding J0 / J3 / J7',
      'Relances impayés (J+1, J+3, J+7)',
      'Suspension et reprise automatiques',
      'Dashboard & stats ROI',
      'Automatisations personnalisées',
      'Portail client complet',
      'Support email',
      'Configuration initiale incluse',
    ],
  },
  {
    name: 'Membre Fondateur',
    target: 'Accès fondateur avec accompagnement renforcé',
    setup: '990€',
    monthly: '590€',
    engagement: '6 mois minimum',
    note: '3 places disponibles',
    popular: true,
    condition: 'Témoignage écrit + vidéo obligatoire',
    features: [
      'Tout le tier Case Study',
      'Suivi dédié 6 mois',
      'Révisions de templates incluses',
      'Accès anticipé aux nouvelles features',
    ],
  },
]
```

**`permanentPlans[]`** :
```ts
[
  {
    name: 'Standard',
    target: 'Configuration complète, sans contrepartie',
    setup: '2 500€',
    monthly: '690€',
    engagement: 'Mensuel sans engagement',
    popular: false,
    features: [
      'Onboarding J0 / J3 / J7',
      'Relances impayés (J+1, J+3, J+7) + coupure auto',
      'Dashboard stats ROI complet',
      'Tracking ouvertures & clics',
      'Page élèves (filtres + historique individuel)',
      'Multi-formations',
      'Blacklist emails',
      'Guide deliverability (SPF/DKIM/DMARC)',
      'Demandes de témoignage J+30/J+60',
      'Automatisations personnalisées illimitées',
      'Portail client complet + édition templates',
      'Support prioritaire (réponse sous 24h)',
    ],
  },
  {
    name: 'Premium',
    target: 'Tout Standard + automatisations avancées et multi-canal',
    setup: '4 500€',
    monthly: '1 290€',
    engagement: 'Mensuel sans engagement',
    popular: true,
    features: [
      'Tout le plan Standard',
      'Pré-dunning CB expirant (14j avant échec)',
      'Détection churn + re-engagement (21j silence)',
      'Coaching élèves inactifs (14j sans ouverture)',
      'WhatsApp Business (parallèle email)',
      'SMS multi-canal (160 chars/template)',
      'Rapport vidéo IA hebdomadaire (lundi, 60-90s)',
    ],
  },
]
```

**`launchComparison[]`** (tableau Case Study vs Fondateur) :
```ts
[
  { feature: 'Setup', casestudy: '0€', fondateur: '990€' },
  { feature: 'Abonnement mensuel', casestudy: '300€/mois', fondateur: '590€/mois' },
  { feature: 'Engagement minimum', casestudy: '3 mois', fondateur: '6 mois' },
  { feature: 'Onboarding J0/J3/J7', casestudy: true, fondateur: true },
  { feature: 'Relances impayés + coupure auto', casestudy: true, fondateur: true },
  { feature: 'Dashboard & stats ROI', casestudy: true, fondateur: true },
  { feature: 'Automatisations personnalisées', casestudy: true, fondateur: true },
  { feature: 'Portail client complet', casestudy: true, fondateur: true },
  { feature: 'Suivi dédié 6 mois', casestudy: false, fondateur: true },
  { feature: 'Révisions de templates', casestudy: false, fondateur: true },
  { feature: 'Accès anticipé nouvelles features', casestudy: false, fondateur: true },
  { feature: 'Témoignage requis', casestudy: 'Vidéo', fondateur: 'Écrit + vidéo' },
]
```

**`permanentComparison[]`** (tableau Standard vs Premium) :
```ts
[
  { feature: 'Onboarding J0/J3/J7', standard: true, premium: true },
  { feature: 'Relances impayés + coupure auto', standard: true, premium: true },
  { feature: 'Dashboard stats ROI', standard: true, premium: true },
  { feature: 'Tracking ouvertures & clics', standard: true, premium: true },
  { feature: 'Page élèves + filtres + historique', standard: true, premium: true },
  { feature: 'Multi-formations', standard: true, premium: true },
  { feature: 'Blacklist emails', standard: true, premium: true },
  { feature: 'Guide deliverability (SPF/DKIM/DMARC)', standard: true, premium: true },
  { feature: 'Demandes de témoignage J+30/J+60', standard: true, premium: true },
  { feature: 'Automatisations personnalisées illimitées', standard: true, premium: true },
  { feature: 'Support prioritaire (24h)', standard: true, premium: true },
  { feature: 'Pré-dunning CB expirant', standard: false, premium: true },
  { feature: 'Détection churn + re-engagement', standard: false, premium: true },
  { feature: 'Coaching élèves inactifs', standard: false, premium: true },
  { feature: 'WhatsApp Business', standard: false, premium: true },
  { feature: 'SMS multi-canal', standard: false, premium: true },
  { feature: 'Rapport vidéo IA hebdomadaire', standard: false, premium: true },
]
```

**`options[]`** :
```ts
[
  {
    name: 'Récupération abandons checkout',
    price: '+200€/mois',
    desc: 'Détecte les prospects qui quittent Stripe sans payer et les relance automatiquement 30 min après. Disponible sur Standard et Premium.',
  },
  {
    name: 'Récupération vocale IA',
    price: '+350€/mois + coûts d\'appels',
    desc: 'Agent vocal IA qui rappelle l\'élève pour récupérer un impayé ou closer une vente. Coûts d\'appels facturés à la consommation. Disponible sur Standard et Premium.',
  },
  {
    name: 'Module Notaire',
    price: '149€/dossier',
    desc: 'Automatisation des calculs et documents juridiques/fiscaux pour les notaires infopreneurs. Disponible sur Standard et Premium.',
  },
]
```

**`faqPricing[]`** (remplace l'existant) :
```ts
[
  {
    q: "Qu'est-ce que le setup ?",
    a: "Investissement unique couvrant la configuration complète de vos séquences, l'intégration Stripe, les tests de bout en bout, et la session d'onboarding.",
  },
  {
    q: "Y a-t-il un engagement ?",
    a: "Standard et Premium sont mensuels sans engagement. Les offres de lancement ont un engagement minimum (3 mois pour Case Study, 6 mois pour Fondateur).",
  },
  {
    q: "Peut-on changer de plan ?",
    a: "Oui, l'upgrade est possible à tout moment. Le setup complémentaire est proratisé.",
  },
  {
    q: "Quel est le délai de mise en place ?",
    a: "Comptez 3 à 5 jours ouvrés entre la signature et la mise en production. On a besoin de vos templates et de votre webhook Stripe.",
  },
]
```

### Structure HTML à modifier

1. **Hero** : titre + sous-titre inchangés. Remplacer la grille unique `plans.map()` par deux sections distinctes :
   - Section "Offres de lancement" avec badge `<span class="launch-badge">Places limitées</span>` + `launchPlans.map()`
   - Section "Plans permanents" avec `permanentPlans.map()`

2. **Tableaux comparatifs** : remplacer la section unique par deux tableaux `section-alt` avec titres séparés "Comparer les offres de lancement" et "Comparer les plans permanents"

3. **Section options** : nouvelle section avec `options.map()` en cartes horizontales (`.option-card` flex row)

4. **FAQ** : `faqPricing.map()` existant — juste mettre à jour les données

### CSS à ajouter (minimal)
```css
.option-card {
  display: flex;
  align-items: flex-start;
  gap: 1.5rem;
  padding: 1.75rem;
}
.option-price {
  font-size: 1.0625rem;
  font-weight: 700;
  color: var(--primary);
  white-space: nowrap;
  flex-shrink: 0;
  min-width: 200px;
}
```

---

## Page 2 — `src/pages/features.astro`

### Données frontmatter

Renommer `pillars` → `categories`. Remplacer entièrement le contenu :

**Catégorie 1 — Automatisation & onboarding** (6 features)
```
- Email J0 — Bienvenue & accès : Envoyé dès la confirmation Stripe, contient vos identifiants d'accès et mot de bienvenue.
- Email J3 — Premier check-in : Check-in automatique à J+3 pour s'assurer que l'élève a bien démarré.
- Email J7 — Bilan première semaine : Suivi de progression à J+7, entièrement personnalisable depuis votre portail.
- Envoi de test : Prévisualisez n'importe quel template en vous l'envoyant à vous-même avant tout envoi réel.
- Envoi manuel : Déclenchez un email spécifique à un élève depuis le portail, quand vous le décidez.
- Mode pause global : Stoppez toutes les campagnes en un clic — utile pendant une fermeture ou une refonte.
```

**Catégorie 2 — Récupération & impayés** (5 features)
```
- Relance J+1 — Rappel doux : Ton empathique, lien de paiement direct. Envoyé 24h après l'échec.
- Relance J+3 — Ton direct : Si aucun paiement à J+3, email plus direct avec sentiment d'urgence modéré.
- Relance J+7 — Avertissement final : Dernier email avant suspension. L'élève est informé clairement des conséquences.
- Suspension et reprise automatiques : Sans réponse à J+7, accès suspendu. Rétabli automatiquement dès le prochain paiement réussi.
- Pré-dunning CB expirant : AEVUM détecte les cartes bancaires qui expirent dans 14 jours et envoie automatiquement un email préventif avant que le paiement échoue. (Premium)
```

**Catégorie 3 — Connaissance client** (5 features)
```
- Dashboard stats ROI : Montant récupéré, taux de recouvrement, taux d'ouverture, taux de clic — en un coup d'œil.
- Tracking ouvertures & clics : Pixel de suivi et redirections traçées pour mesurer l'engagement réel de vos élèves.
- Page élèves complète : Liste de tous vos élèves avec filtres par statut, historique individuel et badges ouvert/cliqué.
- Multi-formations : Gérez plusieurs formations depuis un seul compte — chaque formation a ses propres séquences et élèves.
- Blacklist emails : Bloquez définitivement un email de toute communication AEVUM en un clic.
```

**Catégorie 4 — Fidélisation & réputation** (4 features)
```
- Détection churn + re-engagement : Repère automatiquement les élèves silencieux depuis 21 jours et déclenche une relance personnalisée. (Premium)
- Coaching élèves inactifs : Si aucune ouverture depuis 14 jours, AEVUM envoie une relance pédagogique pour ramener l'élève dans la formation. (Premium)
- Demandes de témoignage automatiques : Email à J+30 et J+60 avec lien vers votre formulaire personnalisé — vos avis arrivent sans que vous les demandiez.
- Guide deliverability intégré : Guide pas-à-pas SPF/DKIM/DMARC directement dans votre portail pour maximiser la délivrabilité de vos emails.
```

**Catégorie 5 — Multi-canal & IA avancée** (5 features)
```
- WhatsApp Business : Envoyez chaque template en parallèle par WhatsApp via votre propre compte Business. (Premium)
- SMS multi-canal : Corps court 160 caractères par template, envoyé via numéro AEVUM Twilio. (Premium)
- Rapport vidéo IA hebdomadaire : Chaque lundi, une vidéo 60-90s voix off IA avec slides résumant la semaine — sans rien faire. (Premium)
- Automatisations personnalisées illimitées : Créez vos propres séquences email (upsell, re-engagement, cross-sell) activables/désactivables en un clic.
- Récupération vocale IA : Agent vocal IA qui rappelle l'élève pour récupérer un impayé ou closer une vente. (Option)
```

### Modifications template HTML

- Renommer `pillars` → `categories` dans le `.map()`
- Meta description : "Les 5 domaines d'AEVUM : automatisation onboarding, récupération impayés, connaissance client, fidélisation et multi-canal. Un seul système."
- H1 : "Les 5 piliers d'AEVUM" (était "Les 4 piliers d'AEVUM")
- Sous-titre H1 : "Onboarding, impayés, connaissance client, fidélisation, multi-canal. Un seul système." (était "Onboarding, impayés, rapport hebdo, automatisations custom. Un seul système.")

---

## Page 3 — `src/pages/index.astro`

### Modifications ciblées (4 zones)

**Zone 1 — Section hero (badge + sous-titre)**
- Badge : inchangé ("Connectez Stripe une fois, on fait le reste")
- Sous-titre : inchangé (déjà correct : mentionne rapport hebdo + automatisations custom)

**Zone 2 — Section "4 piliers"**

Sous-titre section : "Une seule connexion Stripe. Quatre systèmes qui tournent en autonomie." → inchangé

Cartes à mettre à jour :

*Pilier 1 — Onboarding automatique* (card--blue) :
> Dès qu'un paiement Stripe arrive, votre élève reçoit ses emails J0, J3 et J7 — rédigés avec vos mots. Personnalisez chaque template depuis votre portail, lancez un envoi de test, ou déclenchez un email manuel en cas de besoin.

*Pilier 2 — Récupération impayés* (card--purple) :
> Paiement échoué ? Les relances partent à J+1, J+3, J+7 avec un ton progressif. Suspension automatique si aucune réponse. Et si la CB de votre élève expire dans 14 jours, AEVUM l'avertit avant l'échec. (pré-dunning — Premium)

*Pilier 3 — Dashboard & stats ROI* (card--green, était "Rapport hebdomadaire") :
- Titre : "Dashboard & stats ROI"
- Icône : garder le même (grille/tableau)
- Description :
> Montant récupéré, taux de recouvrement, taux d'ouverture et de clic — en temps réel. Suivez vos élèves un par un, filtrez par statut, et consultez l'historique complet de chaque action.

*Pilier 4 — Portail complet* (card--amber, était "Portail & personnalisation") :
- Titre : "Portail complet"
- Description :
> Éditez vos templates (manuellement ou avec l'IA), gérez plusieurs formations depuis un seul compte, blacklistez des emails, et accédez au guide SPF/DKIM/DMARC pour maximiser votre délivrabilité.

**Zone 3 — Section pricing preview**

Supprimer les deux cartes actuelles (Case Study + Standard), les remplacer par Standard + Premium :

*Carte Standard* :
- Titre : "Standard"
- Sous-titre : "Configuration complète"
- Setup : 2 500€
- Mensuel : + 690€/mois
- CTA : "Voir le détail" → btn-secondary

*Carte Premium* (popular) :
- Titre : "Premium"
- Tag : "Recommandé"
- Sous-titre : "Tout Standard + automatisations avancées"
- Setup : 4 500€
- Mensuel : + 1 290€/mois
- CTA : "Voir le détail" → btn-primary

**Zone 4 — Hero stats**
Inchangées (100% automatique / 0 intervention / Lundi 8h rapport livré).

---

## Page 4 — `src/pages/comment-ca-marche.astro`

### Modifications ciblées (3 zones)

**Zone 1 — Étape 2 "On configure tout"**
Texte actuel : "On paramètre vos séquences d'onboarding (J0/J3/J7), vos templates de relance impayés et la fréquence de votre rapport hebdo selon vos instructions."

Texte cible :
> On paramètre vos séquences d'onboarding (J0/J3/J7), vos templates de relance impayés, vos automatisations personnalisées et votre guide deliverability (SPF/DKIM/DMARC). Si vous gérez plusieurs formations, on configure chacune indépendamment depuis votre portail.

**Zone 2 — Étape 3 "Vos emails partent seuls"**
Texte actuel : "À partir de là, chaque paiement déclenche la bonne séquence. Vous vous concentrez sur votre contenu."

Texte cible :
> À partir de là, chaque événement Stripe déclenche la bonne séquence. Le tracking ouvertures & clics s'active automatiquement, et les automatisations avancées (pré-dunning, re-engagement, coaching inactifs) tournent en tâche de fond. Vous vous concentrez sur votre contenu.

**Zone 3 — Flow détaillé — étape "J3, J7, lundi 8h"**
Texte actuel : "Le système planifie automatiquement J3, J7, et ajoute l'élève à votre prochain rapport hebdo du lundi matin."

Texte cible :
> Le système planifie automatiquement J3, J7, suit les ouvertures et les clics, ajoute l'élève à votre prochain rapport du lundi matin — et si vous êtes sur Premium, les mêmes messages partent en parallèle sur WhatsApp et SMS.

**Exemple timeline (Marie)** : inchangé.

---

## Vérification post-implémentation

- [ ] `npm run build` sans erreur TypeScript
- [ ] Aucune mention de "Starter", "500€/mois", "1 200€/mois", "3 000€ setup"
- [ ] Les 3 options affichent les bons prix (200€, 350€+coûts, 149€/dossier)
- [ ] Les plans lancement n'apparaissent PAS sur la homepage
- [ ] Le tableau comparatif lancement a 2 colonnes (Case Study | Fondateur)
- [ ] Le tableau comparatif permanent a 2 colonnes (Standard | Premium)
- [ ] Les features "Premium" dans features.astro ont bien le label "(Premium)" ou "(Option)"
