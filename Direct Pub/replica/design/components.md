# Composants de Direct Pub

Système neutre et minimaliste, conçu pour Direct Pub. Aucune capture, couleur, icône, police ou
texte de Metricool n'a été repris : seuls les rôles (ce que fait chaque élément) viennent de
`recon.md`.

- **Jetons** : `tokens.json` (clair) et `tokens.dark.json` (sombre). `web/scripts/tokens.mjs`
  génère `web/src/styles/tokens.css` (variables CSS + thème Tailwind 4) avant chaque `dev` et
  `build`. On ne modifie jamais les couleurs dans un composant : uniquement des classes de rôle
  (`bg-surface`, `text-text-muted`…).
- **Contraste** : 24 paires par thème, 0 échec AA (vérifié avec `contrast.py`).
- **Police** : Geist et Geist Mono (licence libre SIL OFL, paquet `geist`, servies localement).
- **Icônes** : Lucide (licence ISC). Réseaux : abréviation monochrome (IG, FB, LI…), aucun logo
  de marque.
- **Base accessible** : primitives Radix UI.
- **Vitrine** : `/design` (`web/src/app/design/`). Captures dans `design/screens/` : clair,
  sombre et mobile 390 px. Aucune erreur dans la console, aucun défilement horizontal.

Principes : une seule couleur d'action (encre noire en clair, blanche en sombre), la couleur
réservée aux statuts, beaucoup de blanc, des bordures fines plutôt que des ombres, des chiffres
à chasse fixe dans les tableaux. Un statut n'est jamais porté par la couleur seule : toujours un
libellé avec.

## Mise en page

| élément | valeur |
| --- | --- |
| en-tête | 56 px |
| barre latérale | 240 px (repliée : 64 px) |
| largeur max du contenu | 1280 px |
| panneau latéral | 480 px |
| modales | 400 / 560 / 880 px |
| points de rupture | 640, 768, 1024, 1280 px |
| espacements | base 4 px : 4, 8, 12, 16, 20, 24, 32, 40, 48, 64 |
| arrondis | 6 (sm), 8 (md), 12 (lg), pilule |
| typographie | 12 / 13 / 14 (texte courant) / 16 / 20 / 24 / 32 px |
| mouvement | 120 ms et 180 ms, courbe douce ; coupé si l'utilisateur réduit les animations |

## Composants construits (`web/src/components/ui/`)

```
Button                                                         button.tsx
  variants  primary (encre), secondary (bordure), ghost, danger
  sizes     sm 32px, md 36px, lg 44px, icon 36px
  states    default, hover, focus-visible (anneau 2px focus), disabled (45 %), loading (icône + aria-busy, libellé conservé)
  tokens    bg accent / text on-accent ; danger / on-danger ; radius md ; text sm/500
  a11y      vrai <button> ; un bouton icône a toujours aria-label
  used on   partout

SplitButton                                                    split-button.tsx
  usage     « Planifier ▾ » : action principale + brouillon, publier maintenant, bibliothèque, validation, récurrence
  a11y      deuxième bouton avec aria-label, menu Radix (flèches, Échap, focus rendu)
  used on   S08

Input / Textarea (+ Field)                                     field.tsx
  states    default, hover, focus, disabled, erreur (bordure danger + message role=alert)
  compteur  Textarea maxChars : « n / max », compte les caractères réels (emoji = 1), passe en danger au-delà
            et affiche « x caractères de trop » ; limites par réseau dans lib/networks.ts
  a11y      <label for>, aria-invalid, aria-describedby vers l'aide ou l'erreur, compteur aria-live
  used on   S01, S05, S08, S34, formulaires

Select                                                         select.tsx
  a11y      Radix Select (clavier, lecteur d'écran), libellé relié
  used on   fuseau, rôle, réseau, période

Switch                                                         switch.tsx
  states    on, off, disabled ; libellé + aide à gauche
  note      les interrupteurs de l'éditeur gardent leur dernière position (recon, source 12)
  used on   S08, réglages

Checkbox                                                       checkbox.tsx
  states    coché, non coché, indéterminé (« tous les réseaux »), disabled
  used on   S07 (sélection groupée), S08 (réseaux), tableaux

Tabs                                                           tabs.tsx
  options   compteur par onglet
  used on   S17 (Compte / Posts / Pubs), S28 (Non résolus / Non lus / Tous), S34

Dialog / Drawer                                                overlay.tsx
  Dialog    sm 400, md 560, lg 880 ; titre, description, pied d'actions ; Échap et clic extérieur ferment
  Drawer    panneau droit 480 px (notes, filtres)
  a11y      focus piégé puis rendu, titre et description lus par le lecteur d'écran
  used on   confirmations, S08 (éditeur en lg), filtres S06, notes

Menu / Tooltip                                                 menu.tsx
  Menu      éléments avec icône, séparateur, élément danger
  Tooltip   délai 300 ms, jamais seul porteur d'une information indispensable
  used on   menus ⋯ des posts, actions de ligne, en-tête

StatusBadge / NetworkMark / Tag                                badges.tsx
  StatusBadge  publié, planifié, brouillon, en erreur, autoliste, en validation : point + libellé
  NetworkMark  abréviation du réseau, plein (sélectionné) ou discret ; role=img + aria-label
  Tag          neutre, succès, attention, danger, info (étiquettes, validation)
  used on   S06, S07, S08, S15, S18

PostCard                                                       post-card.tsx
  densités  condensée (heure + réseaux), normale (2 lignes), étendue (4 lignes)
  contenu   heure, type de post, texte, réseaux, statut ; liseré gauche de la couleur du statut ; icône notes non lues
  states    survol, glissable (curseur main), focus
  a11y      bouton avec aria-label « heure, statut, texte »
  used on   S06, S10

MetricCard                                                     metric-card.tsx
  contenu   libellé, valeur (format fr-FR), variation vs période précédente (flèche + % + texte pour lecteur d'écran)
  states    sans comparaison (« Pas de période à comparer »), cliquable pour afficher / masquer la courbe (aria-pressed)
  used on   S17, S18, S25

DataTable                                                      table.tsx
  options   tri par colonne (aria-sort), colonnes numériques alignées à droite, défilement horizontal sur mobile
  à venir   colonnes au choix et réordonnables, pagination, export CSV, sélection (V1, au moment de S18)
  used on   S07, S18, S21

EmptyState, Toast, Avatar, Skeleton, Progress                  misc.tsx
  EmptyState  icône, titre, texte, action
  Toast       info, succès (role=status), erreur (role=alert)
  Avatar      image ou initiales
  Skeleton    chargement
  Progress    barre d'objectif (role=progressbar)
```

## À construire avec les écrans

| composant | écran | note |
| --- | --- | --- |
| Calendrier jour / semaine / mois + glisser-déposer | S06 | dnd-kit, à partir de `PostCard` |
| Sélecteur de période avec préréglages | S17, S23 | deux mois côte à côte, préréglages à droite |
| Graphiques (courbe, barres, carte de chaleur) | S17, S18, S22 | Recharts, couleurs par rôle uniquement |
| Zone de dépôt de médias | S08 | envoi direct vers R2, progression, erreurs de format précises |
| Aperçu de post par réseau | S08 | gabarits neutres, sans copier l'interface des réseaux |
| Sélecteur de marque | en-tête | menu + recherche + avatars |
| Fil de conversation | S28 | V2 |
| Tableau kanban | S10 | V2 |
| Éditeur de texte riche (notes) | S08 | V2 |
