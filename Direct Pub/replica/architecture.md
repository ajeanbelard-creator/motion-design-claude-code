# Architecture : Direct Pub (reconstruction des fonctionnalités de base de Metricool)

Source : `recon.md` et `features.csv`. Cette architecture couvre la **V1** (les 48 lignes
`must`) et laisse la place aux versions suivantes sans tout refaire.

Réseaux en V1 : **Bluesky, Instagram, Facebook, LinkedIn**.
- **Bluesky** : API ouverte, aucune validation d'application. On s'en sert pour tester toute la
  boucle dès le premier jour.
- **Instagram et Facebook** : une seule application Meta et une seule validation (« App Review »).
- **LinkedIn** : programme « Community Management API » à demander.

Les demandes Meta et LinkedIn sont à lancer **dès maintenant**, car elles prennent des semaines.

## Pile technique

| couche | choix | pourquoi |
| --- | --- | --- |
| web | Next.js 15 (App Router) + TypeScript | une seule base de code pour l'interface, les actions serveur et les routes d'API |
| style | Tailwind CSS + jetons de `/replica-design` | design minimaliste facile à tenir cohérent |
| composants | Radix UI (primitives sans style) | accessibilité des menus, modales et onglets sans imposer de look |
| graphiques | Recharts | courbes et barres des statistiques, léger |
| calendrier | rendu maison + dnd-kit | les vues jour / semaine / mois et le glisser-déposer restent simples à contrôler |
| i18n | next-intl (FR et EN) | prévu dès le début, une seule langue à traduire au départ |
| base de données | Postgres sur Supabase | une seule base, gérée, sauvegardes incluses |
| ORM | Drizzle | SQL lisible, migrations versionnées, types TypeScript |
| auth | Supabase Auth (e-mail + mot de passe, confirmation, réinitialisation ; Google en V2) | couvre toutes les lignes « compte » sans code maison |
| accès | vérifications dans la couche de données (`authorize(user, brand, permission)` à chaque requête) ; RLS activé sans politique en garde-fou | les rôles et permissions de Direct Pub sont plus fins que ce que RLS exprime simplement |
| tâches | Inngest (planification + reprises + délais) | publication à l'heure, synchronisation quotidienne et reprises sans serveur à gérer |
| fichiers | Cloudflare R2 | les réseaux téléchargent les médias par URL publique ; R2 ne facture pas la sortie |
| e-mail | Resend | e-mails transactionnels (invitations, alertes d'échec) |
| paiements | Stripe Checkout + Billing + portail client | plans, mensuel / annuel, factures sans écran maison |
| chiffrement | AES-256-GCM avec une clé dans les variables d'environnement | les jetons d'accès aux réseaux ne sont jamais stockés en clair |
| erreurs | Sentry | voir tout de suite pourquoi une publication échoue |
| hébergement | Vercel | déploiement à chaque push, cron et fonctions inclus |

Une seule base, une seule application. Pas de microservices.

## Schéma

`schema.sql` : **18 tables** en V1, plus 5 rôles par défaut. Vérifié sur Postgres 16 : le
fichier se charge sans erreur, et les contraintes clés rejettent les mauvaises données (deux
comptes du même réseau dans une marque, post planifié sans date, permission inconnue).

| table | rôle |
| --- | --- |
| `users` | profil (fuseau, langue, 1er jour de semaine) ; l'id est celui de Supabase Auth |
| `organizations` | propriétaire, plan, client Stripe |
| `roles` | rôles par défaut (verrouillés) et personnalisés (V2), liste de permissions contrôlée |
| `memberships` | qui appartient à quelle organisation, avec quel rôle |
| `invitations` | invitation par e-mail, jeton haché, expiration 24 h |
| `brands` | marque : nom, image, fuseau, formule d'engagement |
| `connections` | un profil social par réseau et par marque (index unique partiel), jetons chiffrés, état |
| `media` | images et vidéos envoyées sur R2 |
| `posts` | le post commun : statut, date (UTC), fuseau de saisie, origine |
| `post_variants` | une déclinaison par réseau : texte, type, options, statut et identifiant externe |
| `post_variant_media` | médias d'une déclinaison, dans l'ordre |
| `publish_attempts` | journal des tentatives avec clé d'idempotence |
| `published_posts` | tous les posts lus sur les réseaux, avec leurs dernières métriques |
| `account_metrics_daily` | abonnés, portée, impressions par jour et par compte |
| `sync_runs` | journal des synchronisations (rattrapage d'historique, quotidienne) |
| `notifications` | centre de notifications, sans doublon (`dedupe_key`) |
| `subscriptions` | état de l'abonnement Stripe |
| `stripe_events` | webhooks Stripe déjà traités |

Règles suivies partout : `uuid` en clé, `timestamptz` en UTC, règle `on delete` choisie pour
chaque clé étrangère, index sur chaque clé étrangère et chaque colonne filtrée, statuts en
`check`. Les tables des versions suivantes (bibliothèque, autolistes, validation, messagerie,
SmartLinks, rapports, concurrents, étiquettes, pubs) sont décrites dans `recon.md` et
arriveront par migrations.

Statut d'un post : il découle de ses déclinaisons. Toutes publiées → `published` ; certaines en
échec → `partially_failed` ; toutes en échec → `failed`.

## API

Écrans entre parenthèses (S-ID de `recon.md`). Les mutations sont des actions serveur Next.js ;
les routes HTTP servent aux OAuth, aux webhooks et aux appels du navigateur (envoi de fichiers).
« Membre » = membre de l'organisation de la marque, avec la permission indiquée.

### F01 Compte et première marque (S01, S02)

| méthode chemin | rôle | qui | entrée | sortie |
| --- | --- | --- | --- | --- |
| action `signUp` | crée le compte Supabase, l'utilisateur, l'organisation, la 1re marque, l'abonnement gratuit | public | e-mail, mot de passe, nom | session |
| action `signIn` / `signOut` | connexion | public | e-mail, mot de passe | session |
| GET `/auth/confirm` | confirme l'e-mail (lien Supabase) | public | jeton | redirection |
| action `requestPasswordReset` / `updatePassword` | mot de passe oublié | public / connecté | e-mail / nouveau mot de passe | ok |
| action `updateProfile` | nom, fuseau, langue, 1er jour de semaine | connecté | champs | utilisateur |
| action `deleteAccount` | supprime le compte (RGPD) ; refusé si propriétaire d'une orga avec d'autres membres | connecté | confirmation | ok |

### Marques (S04, S05)

| méthode chemin | rôle | qui | entrée | sortie |
| --- | --- | --- | --- | --- |
| action `createBrand` | crée une marque (limite du plan vérifiée) | `org.brands` | nom | marque |
| action `updateBrand` | nom, image, fuseau, formule d'engagement | `brand.manage` | champs | marque |
| action `deleteBrand` | supprime la marque et tout son contenu | `org.brands` | id + confirmation | ok |
| GET `/api/brands?q=` | liste et recherche pour le sélecteur | membre | texte | marques |

### F02 Connexions (S03)

| méthode chemin | rôle | qui | entrée | sortie |
| --- | --- | --- | --- | --- |
| GET `/api/connect/[network]/start` | lance l'OAuth du réseau (état signé avec la marque) | `brand.manage` | brandId | redirection vers le réseau |
| GET `/api/connect/[network]/callback` | échange le code, chiffre les jetons, crée la connexion, lance le rattrapage d'historique | réseau | code, état | redirection S03 |
| action `connectBluesky` | Bluesky n'a pas d'OAuth classique : identifiant + mot de passe d'application | `brand.manage` | handle, mot de passe d'application | connexion |
| action `chooseAccount` | quand l'OAuth renvoie plusieurs pages ou comptes, choisir lequel | `brand.manage` | id externe | connexion |
| action `refreshConnection` | relance l'OAuth pour un compte expiré | `brand.manage` | connectionId | redirection |
| action `revokeConnection` | révoque le jeton chez le réseau, marque `revoked` (historique conservé) | `brand.manage` | connectionId | ok |

### F03 / F04 Planifier et publier (S06, S08)

| méthode chemin | rôle | qui | entrée | sortie |
| --- | --- | --- | --- | --- |
| GET `/api/posts?brand&from&to` | posts de la période pour le calendrier | `planner.view` | marque, plage | posts + déclinaisons |
| POST `/api/media/upload-url` | URL signée R2 pour envoyer un fichier directement depuis le navigateur | `planner.edit` | type, taille | url, clé |
| action `registerMedia` | enregistre le média envoyé (type, taille, dimensions, durée) après vérification | `planner.edit` | clé | média |
| action `savePost` | crée ou modifie un post et ses déclinaisons ; valide les limites de chaque réseau | `planner.edit` | contenu, réseaux, date, mode | post |
| action `schedulePost` | passe en `scheduled` (date future obligatoire) et compte dans la limite mensuelle | `posts.publish` | postId | post |
| action `publishNow` | envoie immédiatement l'événement de publication | `posts.publish` | postId | post |
| action `reschedulePost` | glisser-déposer : nouvelle date, seulement si brouillon ou planifié, et date future | `planner.edit` | postId, date | post |
| action `duplicatePost` | copie en brouillon (même marque) | `planner.edit` | postId | post |
| action `deletePost` | suppression douce ; refusée pendant la publication | `planner.edit` | postId | ok |
| action `retryVariant` | relance une déclinaison en échec | `posts.publish` | variantId | déclinaison |

### F12 Statistiques (S17, S18)

| méthode chemin | rôle | qui | entrée | sortie |
| --- | --- | --- | --- | --- |
| GET `/api/analytics/summary?brand&from&to` | totaux tous réseaux + période précédente de même durée | `analytics.view` | marque, plage | cartes, séries |
| GET `/api/analytics/[connectionId]?from&to` | compte, courbes et métriques d'un réseau | `analytics.view` | plage | sections non vides |
| GET `/api/analytics/[connectionId]/posts?from&to&sort&dir&page` | liste des posts triable et paginée | `analytics.view` | plage, tri | lignes |
| action `saveColumns` | colonnes affichées (stockées par utilisateur) | `analytics.view` | liste | ok |

### F17 Équipe (S34)

| méthode chemin | rôle | qui | entrée | sortie |
| --- | --- | --- | --- | --- |
| action `inviteMember` | crée l'invitation et envoie l'e-mail | `org.members` | e-mail, rôle | invitation |
| action `resendInvitation` | nouveau jeton, au plus 1 fois par heure | `org.members` | id | ok |
| GET `/invite/[token]` | accepte (connexion ou inscription d'abord) | public | jeton | redirection |
| action `changeRole` / `removeMember` | modifie ou retire un membre (jamais le propriétaire) | `org.members` | membershipId | ok |

### Notifications et abonnement (S36, S38)

| méthode chemin | rôle | qui | entrée | sortie |
| --- | --- | --- | --- | --- |
| GET `/api/notifications` | liste et nombre de non lues | connecté | page | notifications |
| action `markNotificationsRead` | marque lu | connecté | ids ou tout | ok |
| action `startCheckout` | session Stripe Checkout | `billing.manage` | plan, cycle | url |
| action `openBillingPortal` | portail client Stripe (carte, factures, annulation) | `billing.manage` | — | url |

### Webhooks entrants

- **Stripe** (`POST /api/webhooks/stripe`) : `checkout.session.completed`,
  `customer.subscription.updated` / `deleted`, `invoice.payment_failed`. La signature est
  vérifiée, et l'id d'événement est noté dans `stripe_events` pour ne jamais traiter deux fois.
- **Meta** (`POST /api/webhooks/meta`) : désautorisation de l'application et demandes de
  suppression de données. Ce sont des exigences de la validation Meta.

Webhooks sortants : aucun en V1.

### Tâches de fond (Inngest)

| tâche | quand | rôle |
| --- | --- | --- |
| `post/publish` | à `scheduled_at` (`sleepUntil`), ou tout de suite pour « publier maintenant » | publie chaque déclinaison avec reprises (3 essais, délai croissant), met à jour les statuts, notifie en cas d'échec |
| `posts/sweep` | chaque minute | filet de sécurité : relance les posts dus et non partis (redéploiement, panne) |
| `connection/backfill` | à la connexion | récupère l'historique disponible (30 jours minimum) : posts, métriques, abonnés |
| `metrics/daily` | chaque nuit, par marque, échelonné | synchronise abonnés, métriques de compte et métriques des posts des 90 derniers jours |
| `tokens/refresh` | toutes les 6 h | renouvelle les jetons qui expirent sous 7 jours ; sinon `expired` + notification |
| `users/purge` | chaque nuit | supprime pour de bon les comptes supprimés depuis 30 jours (RGPD) |
| `media/cleanup` | chaque semaine | supprime de R2 les médias rattachés à aucun post depuis 7 jours |

Uniquement des API officielles et publiques, avec les clés de Direct Pub : Graph API Meta,
API LinkedIn, protocole AT de Bluesky. Jamais les points d'accès privés de Metricool.

## Les parties qui mordent

- **Fuseaux horaires** : stockage en UTC ; l'utilisateur saisit dans le fuseau de la marque, qui
  est enregistré avec le post. Le calendrier s'affiche dans le fuseau choisi. Un post à 2 h 30 un
  jour de passage à l'heure d'été n'existe pas : on le refuse avec un message clair. Les jours
  des statistiques sont comptés dans le fuseau de la marque.
- **Idempotence** : une déclinaison ne doit jamais être publiée deux fois. Avant l'appel au
  réseau, on la verrouille (`update ... set status='publishing' where status='pending'`) ; la
  clé de tentative est unique dans `publish_attempts`. Les webhooks Stripe sont dédoublonnés.
  Les notifications aussi (`dedupe_key`).
- **Courses** :
  - un post modifié ou supprimé pendant sa publication : refusé dès que le statut est `publishing` ;
  - un glisser-déposer en même temps qu'une modification : on garde la dernière écriture, et
    l'écran se recharge s'il est périmé (vérification de `updated_at`) ;
  - deux connexions du même réseau en parallèle : l'index unique partiel tranche.
- **Limites des API** : quotas Meta par utilisateur et par application, quota de publication
  Instagram (100 posts par 24 h), limites de débit de Bluesky. Chaque appel passe par un
  limiteur par connexion ; les synchronisations nocturnes sont étalées.
- **Médias** : Instagram télécharge depuis une URL publique (URL R2 signée, valable 1 h) et
  impose formats et durées. On vérifie taille, format, ratio et durée **à l'envoi**, avec un
  message précis, plutôt que de découvrir l'erreur à l'heure de publication. Vidéo : 1 Go maximum
  en V1, envoi direct du navigateur vers R2 en plusieurs morceaux.
- **Jetons** : ils expirent (Meta : 60 jours ; LinkedIn : 60 jours avec renouvellement) et
  peuvent être révoqués côté réseau. On renouvelle avant l'expiration, et on alerte au premier
  échec, avant que les posts planifiés n'échouent.
- **Multi-locataire** : chaque requête vérifie que la marque appartient à une organisation dont
  l'utilisateur est membre, avec la bonne permission. Un test automatique parcourt toutes les
  actions et routes avec un utilisateur d'une autre organisation et attend un refus partout.
- **Limites du plan** : nombre de marques et de posts par mois, vérifiés côté serveur, jamais
  seulement dans l'interface.
- **Délivrabilité des e-mails** : domaine d'envoi avec SPF, DKIM et DMARC dès le premier jour.
- **RGPD** : suppression du compte en deux temps (désactivation puis purge à 30 jours), export
  des données en V2, webhooks de suppression Meta, hébergement des données en Europe (région
  Supabase `eu-central`, R2 `EU`).
- **Validation des applications** : sans validation Meta et LinkedIn, seuls les comptes de test
  fonctionnent. Prévoir une vidéo de démonstration et une politique de confidentialité publique.

## Ordre de construction

### 1. Tranche verticale (moche mais complète)

Inscription → création de marque → connexion Bluesky → écrire un post → le planifier dans
2 minutes → il part tout seul → il apparaît comme publié dans le calendrier.

- Écrans : S01, S02, S03 (Bluesky seul), S06 (vue semaine), S08 (texte seul)
- Tables : `users`, `organizations`, `roles`, `memberships`, `brands`, `connections`, `posts`,
  `post_variants`, `publish_attempts`
- Routes : `signUp`, `createBrand`, `connectBluesky`, `savePost`, `schedulePost`,
  `GET /api/posts`, tâches `post/publish` et `posts/sweep`

### 2. Fonctionnalités indispensables, par domaine

1. **Compte** : confirmation d'e-mail, mot de passe oublié, profil et fuseau, suppression (S01, S37).
2. **Marques** : sélecteur avec recherche, réglages, suppression (S04, S05).
3. **Éditeur complet** : médias (R2), texte par réseau, compteurs, aperçus, emoji, brouillon,
   publier maintenant, dupliquer (S08 ; tables `media`, `post_variant_media`).
4. **Calendrier complet** : vues jour / semaine / mois, Aujourd'hui, glisser-déposer, couleurs
   de statut, icônes de réseau et de type (S06).
5. **Connexions Meta et LinkedIn** : OAuth, choix du compte, renouvellement, révocation,
   alertes (S03 ; tâche `tokens/refresh`).
6. **Statistiques** : rattrapage, synchronisation quotidienne, résumé, page par réseau,
   comparaison de périodes, liste des posts triable avec colonnes au choix (S17, S18 ;
   tables `published_posts`, `account_metrics_daily`, `sync_runs`).
7. **Équipe** : invitation de membres, rôles par défaut (S34 ; `invitations`).
8. **Notifications** : centre de notifications, alertes d'échec et de déconnexion (S38).
9. **Abonnement** : plans et limites, Stripe Checkout et portail (S36 ; `subscriptions`,
   `stripe_events`).

### 3. Ensuite

Les lignes `should` (V2), puis les lignes `could` (V3), dans l'ordre de `features.csv`, par
domaine.

### 4. Corrections issues de `/replica-entrepreneur`

À ajouter quand cette étape aura lu les avis des utilisateurs de Metricool.
