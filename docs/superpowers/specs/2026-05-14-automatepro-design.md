# AutomatePro — Refactoring Vitrine Astro

**Date** : 2026-05-14  
**Produit** : AutomatePro — automatisation email pour infopreneurs/coachs/formateurs francophones  
**Base** : Site Astro existant (anciennement CRM immobilier AEVUM)  
**Approche retenue** : B — contenu + ajustements structurels ciblés

---

## 1. Contexte et contraintes

- Stack : Astro (SSG), vanilla JS uniquement, zéro framework JS
- Design system : `src/styles/global.css` — classes `.card`, `.btn`, `.section`, `.container`, `.grid-2/3`, `.icon-box`, `.badge`, `.form-group`, `.form-input`, `.success-msg`, etc.
- Composants partagés : `BaseLayout.astro`, `Header.astro`, `Footer.astro` — structure HTML conservée, contenu mis à jour
- Logo : texte CSS `AutomatePro` (pas d'asset image)
- Contact CTA : `mailto:noa.pardal1@gmail.com`
- Variable d'env client-side : `PUBLIC_AEVUM_API_URL`

---

## 2. Composants partagés

### Header.astro
- Remplacer `<img src="/logo-aevum.webp">` par `<span class="logo-text">AutomatePro</span>` avec style CSS gradient
- Nav links :
  - `/features` → "Fonctionnalités"
  - `/pricing` → "Tarifs"
  - `/comment-ca-marche` → "Comment ça marche"
  - `/contact` → "Contact"
- CTA bouton : "Prendre contact" → `/contact`
- Supprimer le lien `/download`

### Footer.astro
- Logo : même span texte que Header
- Description brand : "L'automatisation email pour infopreneurs et coachs francophones."
- Section "Produit" : Fonctionnalités, Tarifs, Comment ça marche, Contact
- Copyright : `AutomatePro`
- Supprimer lien `/download`

### BaseLayout.astro
- `og:site_name` → "AutomatePro"
- Schema.org Organization : nom AutomatePro, description service email automation, email `noa.pardal1@gmail.com`
- Schema.org SoftwareApplication : description mise à jour, prix Setup 1500–3000€
- Prefetch : remplacer `/demo` par `/comment-ca-marche`, supprimer `/download`

---

## 3. Pages modifiées

### index.astro

**Hero**
- Badge : "Connectez Stripe une fois, on fait le reste"
- H1 : "L'automatisation email qui tourne pendant que vous dormez"
- Sous-titre : "Onboarding élèves, relances impayés, rapport hebdo. Zéro intervention. Connectez Stripe une fois, on fait le reste."
- CTA primary : "Prendre contact" → `mailto:noa.pardal1@gmail.com`
- CTA secondary : "Voir comment ça marche" → `/comment-ca-marche`
- Stats bar : "100% automatique / 0 intervention / Lundi 8h rapport livré"

**Section Problème** (3 cards `.grid-3`)
- "Onboarding manuel épuisant" — chaque nouvel élève, même séquence d'emails à envoyer à la main
- "Impayés qui traînent" — relances oubliées, élèves en retard qui passent entre les mailles
- "Aucune visibilité" — pas de rapport régulier, impossible de savoir ce qui se passe

**Section 3 Piliers** (3 cards `.grid-3`)
- Onboarding automatique
- Récupération impayés
- Rapport hebdomadaire

**Section Étapes** (3 cards `.grid-3` avec `.step-number`)
1. Vous nous donnez votre webhook Stripe
2. On configure tout
3. Vos emails partent seuls

**Aperçu Pricing** (2 cards `.grid-2` centré, max-width ~800px)
- Case Study : Setup 1 500€ + 500€/mois
- Standard : Setup 3 000€ + 1 200€/mois (popular)
- Les deux avec lien → `/pricing`

**FAQ** (5 questions)
1. Qu'est-ce qu'un webhook Stripe ?
2. Mes emails arrivent-ils vraiment en automatique ?
3. Puis-je personnaliser les templates ?
4. Que se passe-t-il si un paiement échoue ?
5. Puis-je voir ce qui a été envoyé ?

**CTA Final**
- H2 : "Prêt à automatiser ?"
- Bouton : "Prendre contact" → `mailto:noa.pardal1@gmail.com`

---

### features.astro

3 catégories, même pattern HTML `feature-category` + `.grid-3` de feature cards :

**Pilier 1 — Onboarding automatique**
- Email J0 : bienvenue + accès plateforme
- Email J3 : premier check-in / ressource
- Email J7 : bonus + incitation communauté
- Séquence entièrement personnalisable
- Sender name configurable par client
- Déclenchement instantané après paiement Stripe

**Pilier 2 — Récupération impayés**
- Relance J+1 : rappel doux
- Relance J+3 : ton plus direct
- Relance J+7 : avertissement suspension
- Email de suspension automatique
- Reprise automatique après paiement
- Blacklist automatique après N échecs

**Pilier 3 — Rapport hebdomadaire**
- Envoi automatique chaque lundi à 8h
- Métriques : nouveaux élèves, impayés en cours, emails envoyés
- Taux d'ouverture et de clics
- Historique glissant 4 semaines
- Rapport exportable PDF-ready

CTA fin de page → `/contact`

---

### pricing.astro

**Grille** : `.grid-2` (au lieu de `.grid-3`)

**Tier "Case Study"** (non-popular)
- Setup : 1 500€ (unique)
- Mensuel : 500€/mois
- Note : "En échange d'un témoignage vidéo"
- Features : les 3 piliers, support email, 1 configuration initiale
- CTA : "Prendre contact" → `mailto:`

**Tier "Standard"** (popular — badge "Recommandé")
- Setup : 3 000€ (unique)
- Mensuel : 1 200€/mois
- Features : tout Case Study + support prioritaire, configurations illimitées, rapport personnalisé, accès portail client
- CTA : "Prendre contact" → `mailto:`

**Tableau comparatif** (HTML `<table>`, classes CSS inline minimales)
Lignes : Onboarding J0/J3/J7 | Relances impayés | Rapport hebdo | Portail client | Support | Témoignage requis

**FAQ** (4 questions)
1. Y a-t-il un engagement minimum ?
2. Quel est le délai de mise en place ?
3. Qu'est-ce qui est inclus dans le setup ?
4. Comment résilier ?

**CTA final** : "Prendre contact" → `mailto:`

---

### contact.astro

Formulaire simplifié — 3 champs uniquement :
- Nom (text, required)
- Email (email, required)
- Message (textarea, required)

Submit handler (vanilla JS) :
```js
const subject = encodeURIComponent('Contact AutomatePro');
const body = encodeURIComponent(`Nom: ${nom}\n\n${message}`);
window.location.href = `mailto:noa.pardal1@gmail.com?subject=${subject}&body=${body}`;
```

Info à gauche : email `noa.pardal1@gmail.com`, délai réponse "sous 48h".  
Pas de backend, pas de success-msg (le client mail s'ouvre directement).

---

### demo.astro

Redirection statique vers `/comment-ca-marche` :
```astro
---
return Astro.redirect('/comment-ca-marche', 301);
---
```

---

### comment-ca-marche.astro (nouveau fichier)

Remplace fonctionnellement la page démo. URL : `/comment-ca-marche`.

**Hero** : "Comment ça marche"

**Flow visuel** (4 étapes `.step-number`)
1. Vous connectez Stripe → vous nous transmettez votre webhook URL
2. On configure vos séquences → templates onboarding, relances, rapport
3. Un élève paie → AutomatePro reçoit l'événement Stripe en temps réel
4. Les emails partent seuls → sans aucune intervention de votre part

**Section "Exemple concret"**
Scénario : "Marie s'inscrit à votre formation à 21h un vendredi soir..."
Narration en timeline cards : paiement → J0 email bienvenue → J3 check-in → J7 bonus → lundi 8h rapport

**CTA** : "Prendre contact" → `mailto:`

---

### download.astro

```astro
---
return Astro.redirect('/', 301);
---
```

---

## 4. Nouvelle page — `/client/[token]`

**Fichier** : `src/pages/client/[token].astro`  
**Rendu** : SSG shell (HTML statique) + fetch entièrement client-side  
**Layout** : `BaseLayout` complet (Header + Footer)

### Structure HTML (générée statiquement, remplie par JS)

```
#portal-loading   — spinner visible au chargement
#portal-error     — masqué par défaut, affiché si 404
#portal-content   — masqué par défaut, affiché si 200
  ├── Section infos client : #client-name
  ├── Section formulaire config :
  │     sender_name (text)
  │     template-j0 (textarea)
  │     template-j3 (textarea)
  │     template-j7 (textarea)
  │     template-impaye (textarea)
  │     [Enregistrer] → PUT
  │     #save-success (success-msg, masqué)
  └── Section historique :
        #history-table → <table> 20 dernières lignes
        colonnes : Date | Type | Destinataire | Statut
```

### Logique JS vanilla (`<script>` en bas de page)

```
1. token = window.location.pathname.split('/').pop()
2. API_URL = import.meta.env.PUBLIC_AEVUM_API_URL || ''
3. Promise.all([
     fetch(API_URL + '/client/' + token),
     fetch(API_URL + '/client/' + token + '/history')
   ])
4. Si réponse client 404 → cacher #portal-loading, afficher #portal-error
5. Si 200 :
   - Remplir #client-name avec data.nom
   - Remplir champs formulaire avec data.sender_name, data.templates.*
   - Remplir #history-table avec les 20 lignes
   - Cacher #portal-loading, afficher #portal-content
6. Submit formulaire :
   - fetch PUT API_URL + '/client/' + token, body JSON
   - Afficher #save-success
```

### Classes CSS utilisées
`.card`, `.section`, `.container`, `.form-group`, `.form-input`, `.form-label`, `.btn`, `.btn-primary`, `.btn-secondary`, `.success-msg`, `.grid-2`, `.section-header`, `.accent-line`

---

## 5. Pages légales

`cgu.astro`, `confidentialite.astro`, `mentions-legales.astro` :
- Chercher/remplacer "AEVUM" → "AutomatePro"
- Chercher/remplacer "CRM immobilier" → "service d'automatisation email"
- Chercher/remplacer "contact@aevum.fr" → "noa.pardal1@gmail.com"
- Structure HTML et CSS : aucun changement

---

## 6. Infrastructure

| Fichier | Action |
|---|---|
| `robots.txt.ts` | Aucun changement |
| Sitemap | `/comment-ca-marche` incluse auto si @astrojs/sitemap présent. `/client/[token]` exclue (non pré-rendue). |
| `.env` | Ajouter `PUBLIC_AEVUM_API_URL=` (vide par défaut, à remplir) |

---

## 7. Ordre d'implémentation recommandé

1. Header + Footer + BaseLayout (composants partagés — débloque tout le reste)
2. index.astro
3. features.astro
4. pricing.astro
5. contact.astro
6. comment-ca-marche.astro (nouveau) + demo.astro (redirect)
7. download.astro (redirect)
8. client/[token].astro
9. Pages légales (chercher/remplacer)
10. .env ajout variable
