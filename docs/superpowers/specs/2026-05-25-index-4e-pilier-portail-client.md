# Spec — index.astro : 4e pilier + portail client

**Date :** 2026-05-25  
**Fichier cible :** `src/pages/index.astro` uniquement

---

## Contexte

La section "Les 4 piliers d'AEVUM" affiche 3 cartes malgré son titre. Le portail client (personnalisation des templates, suivi des envois) n'est pas représenté. Par ailleurs, aucun texte ne mentionne que le client garde la main sur ses templates après le setup initial.

---

## Changements

### 1. 4e carte — Portail & personnalisation

**Classe :** `card card--amber reveal`  
**Accent couleur :** `#F59E0B` (amber) — ajouté via `.card--amber::after` dans le `<style>` local  
**Icône :** SVG sliders/contrôles  
**Titre :** Portail & personnalisation  
**Texte :**
> Modifiez vos templates à tout moment depuis votre espace client. Suivez vos envois, ajustez vos séquences et personnalisez chaque email — sans passer par l'équipe AEVUM.

### 2. Changement de grille

Section piliers : `grid-3` → `grid-4`

Responsive déjà géré par le CSS global :
- ≥ 1025px : 4 colonnes
- 768–1024px : 2×2
- ≤ 767px : 1 colonne

### 3. Mise à jour carte "Onboarding automatique"

**Texte actuel :**
> Dès qu'un paiement Stripe arrive, votre élève reçoit ses emails J0, J3 et J7 sans que vous leviez le petit doigt.

**Nouveau texte :**
> Dès qu'un paiement Stripe arrive, votre élève reçoit ses emails J0, J3 et J7 — rédigés avec vos mots et votre ton — sans que vous leviez le petit doigt.

### 4. Mise à jour étape 2 — "Démarrez en 3 étapes"

**Texte actuel :**
> On paramètre vos séquences d'onboarding, vos templates de relance et votre rapport hebdo selon vos instructions.

**Nouveau texte :**
> On paramètre vos séquences d'onboarding, vos templates de relance et votre rapport hebdo selon vos instructions. Ensuite, vous gardez la main : modifiez vos templates à tout moment depuis votre portail.

---

## CSS à ajouter (dans `<style>` local de index.astro)

```css
.card--amber::after { background: #F59E0B; }
```

---

## Périmètre

- Fichier modifié : `src/pages/index.astro` uniquement
- Aucune nouvelle route, aucun nouveau composant, aucune modification de layout
- `npm run build` doit passer sans erreur
