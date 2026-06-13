# Design System Refonte — AEVUM Vitrine

**Date :** 2026-05-18  
**Scope :** CSS + HTML minimal — aucune logique, aucun contenu

---

## Palette & tokens

| Variable | Ancienne valeur | Nouvelle valeur |
|---|---|---|
| `--dark` | `#0B1120` | `#0D0F1A` |
| `--dark-soft` | `#111827` | `#111827` (inchangé) |
| `--dark-card` | `#151D2E` | `#1A2035` |
| `--dark-elevated` | `#1A2438` | `#1A2035` |
| `--gray-light` | `#94A3B8` | `#9CA3AF` |
| `--max-w` | `1200px` | `1100px` |

## Typographie

- H1 : `clamp(3rem, 5vw, 5rem)` (48px → 80px), `font-weight: 800`
- H2–H4 : inchangés
- Sous-titres / paragraphes : `#9CA3AF` (via `--gray-light`)

## Boutons

- Border-radius global : `999px` (pill)
- `.btn-primary` : fond `#ffffff`, texte `#0D0F1A`, `font-weight: 600` — suppression du gradient bleu
- `.btn-secondary` : fond transparent, border `1px solid rgba(255,255,255,0.2)`, texte `#fff`

## Cartes

- Background : `#1A2035` (via `--dark-card`)
- Border : `1px solid rgba(255,255,255,0.08)`
- Box-shadow : `0 4px 24px rgba(0,0,0,0.3)`
- Border-radius : `12px` (inchangé)

## Badges / Pills

- Background : `#1A2035`, texte `#fff`, border `1px solid rgba(255,255,255,0.1)`
- Border-radius : `999px`, padding `6px 16px`, font-size `13px`
- Point bullet accent à gauche

## Espacements

- `.section` : `padding: 80px 0` (5rem)
- `.container` : `max-width: 1100px`, padding horizontal `24px` (inchangé)

## Background body

Grille décorative SVG subtile en `background-image` sur `body`, opacité très faible (~0.03).

## Navigation (Header.astro)

**HTML :**
- Logo : `• AEVUM` (gras) + ` studio` (italique)

**CSS :**
- Fond nav : `rgba(13, 15, 26, 0.95)`
- Border-bottom : invisible (`border-bottom: none`)
- Liens : `#9CA3AF`, sans soulignement actif au hover (suppression `::after`)
- CTA "Prendre contact" : fond `#fff`, texte `#0D0F1A`, `border-radius: 999px`, `padding: 12px 24px`

## Footer.astro

- Couleurs adaptées automatiquement via les nouvelles variables CSS
- Aucune modification HTML

## Propagation

Pages `login`, `dashboard`, `history`, `customize`, `settings` héritent toutes via `BaseLayout` + `global.css` — aucune modification individuelle.

---

## Fichiers modifiés

1. `src/styles/global.css`
2. `src/components/Header.astro`
3. `src/components/Footer.astro` (mineur, via variables)
