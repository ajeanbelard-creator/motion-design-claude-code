# Architecture : Direct Pub (reconstruction des fonctionnalités de base de Metricool)

Source : `recon.md` et `features.csv`. Cette architecture couvre la **V1** (les 48 lignes
`must`) et laisse la place aux versions suivantes sans tout refaire.

Réseaux en V1 : **Bluesky, Instagram, Facebook, LinkedIn, YouTube, TikTok, WhatsApp, Telegram**.

| réseau | API officielle | validation à obtenir | ce que Direct Pub fait |
| --- | --- | --- | --- |
| Bluesky | protocole AT | aucune | publier, statistiques ; sert à tester la boucle dès le 1er jour |
| Telegram | Bot API | aucune | le bot Direct Pub, admin de la chaîne ou du groupe, publie texte, photo, vidéo, album ; abonnés par jour |
| Instagram, Facebook | Graph API Meta | App Review Meta | publier, statistiques |
| WhatsApp | WhatsApp Business Cloud API (Meta) | App Review Meta + compte WhatsApp Business vérifié | **diffusion** de messages à des listes de contacts consentants, via des modèles approuvés par Meta |
| LinkedIn | Community Management API | programme partenaire LinkedIn | publier, statistiques |
| YouTube | YouTube Data API v3 + Analytics API | vérification de l'appli Google + audit de quota | mettre en ligne vidéos et Shorts, statistiques |
| TikTok | Content Posting API + Display API | revue de l'appli + audit Content Posting | publier vidéos et carrousels photo, statistiques |

À savoir :
- **WhatsApp n'a pas d'API pour publier sur une Chaîne ou un Statut.** La seule publication
  possible est l'envoi de messages à des contacts qui ont accepté d'en recevoir. Ces messages
  sont facturés par Meta au compte WhatsApp Business du client, pas à Direct Pub.
- **TikTok** : tant que l'application n'a pas passé l'audit, ses posts restent privés (« moi
  uniquement ») et 5 comptes au plus peuvent publier par 24 h.
- **YouTube** : une mise en ligne consomme une grande part du quota quotidien de 10 000 unités
  du projet. Les vidéos envoyées par un projet non audité restent privées.
- **Telegram** : l'API des bots ne donne pas le nombre de vues par message, seulement le nombre
  d'abonnés.

Les demandes Meta (une seule pour Instagram, Facebook et WhatsApp), LinkedIn, Google et TikTok
sont à lancer **dès maintenant**, car elles prennent des semaines.

## Pile technique

| couche | choix | pourquoi |
| --- | --- | --- |
| web | Next.js 16 (App Router) + TypeScript + React 19 | une seule base de code pour l'interface, les actions serveur et les routes d'API |
| style | Tailwind CSS 4 + jetons de `replica/design/` (générés en CSS par `web/scripts/tokens.mjs`) | design minimaliste facile à tenir cohérent |
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
| paiements | Moneroo (API « Standard » : lien de paiement + webhook signé + vérification) | mobile money, cartes et portefeuilles en Afrique avec une seule intégration |
| reçus | PDF généré par Direct Pub (react-pdf) | Moneroo n'émet pas de factures d'abonnement |
| chiffrement | AES-256-GCM avec une clé dans les variables d'environnement | les jetons d'accès aux réseaux ne sont jamais stockés en clair |
| erreurs | Sentry | voir tout de suite pourquoi une publication échoue |
| hébergement | Vercel | déploiement à chaque push, cron et fonctions inclus |

Une seule base, une seule application. Pas de microservices.

## Schéma

`schema.sql` : **24 tables** en V1, plus 5 rôles par défaut. Vérifié sur Postgres 16 : le
fichier se charge sans erreur, et les contraintes clés rejettent les mauvaises données (deux
comptes du même réseau dans une marque, post planifié sans date, permission inconnue, connexion
sans jeton hors Telegram, numéro WhatsApp mal formé, paiement réussi sans période).

| table | rôle |
| --- | --- |
| `users` | profil (fuseau, langue, 1er jour de semaine) ; l'id est celui de Supabase Auth |
| `organizations` | propriétaire, plan |
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
| `contacts` | contacts WhatsApp d'une marque, avec consentement et désinscription |
| `contact_lists`, `contact_list_members` | listes de diffusion WhatsApp |
| `whatsapp_templates` | modèles de message synchronisés depuis Meta, avec leur statut d'approbation |
| `message_deliveries` | un envoi WhatsApp par destinataire : envoyé, livré, lu, échec |
| `subscriptions` | plan, période payée, fin de la période de grâce, dernier rappel |
| `payments` | chaque paiement Moneroo : plan, montant, devise, période couverte, numéro de reçu |
| `payment_events` | webhooks Moneroo déjà traités |

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
| action `startTelegramLink` | donne un code à usage unique et le nom du bot à ajouter comme admin de la chaîne ou du groupe | `brand.manage` | brandId | code, lien |
| GET `/api/connect/whatsapp/start` | « Embedded Signup » Meta : le client choisit ou crée son compte WhatsApp Business et son numéro | `brand.manage` | brandId | fenêtre Meta |
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

### Diffusion WhatsApp (nouveaux écrans : contacts, listes)

| méthode chemin | rôle | qui | entrée | sortie |
| --- | --- | --- | --- | --- |
| GET `/api/contacts?brand&list&q&page` | contacts et listes | `planner.view` | filtres | contacts |
| action `saveContact` / `deleteContact` | ajout, modification, suppression | `planner.edit` | numéro (E.164), nom, preuve de consentement | contact |
| action `importContacts` | import CSV ; refuse les lignes sans consentement, rapport des erreurs | `planner.edit` | fichier | rapport |
| action `saveContactList` | créer, renommer une liste, ajouter ou retirer des contacts | `planner.edit` | liste, contacts | liste |
| action `syncTemplates` | relit les modèles et leur statut chez Meta | `planner.edit` | connectionId | modèles |

Le post WhatsApp passe par le même éditeur (S08) : type `broadcast`, choix d'un modèle
approuvé, valeurs des variables et liste de destinataires. À l'envoi, les contacts désinscrits
ou sans consentement sont exclus.

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
| action `startCheckout` | crée un `payment` puis appelle `POST /v1/payments/initialize` de Moneroo (montant, devise, client, `return_url`, métadonnées) | `billing.manage` | plan, cycle | `checkout_url` |
| GET `/billing/return?paymentId=` | retour du client : vérifie le paiement chez Moneroo et affiche le résultat | connecté | id | page |
| GET `/api/billing/receipts/[id]` | reçu PDF d'un paiement réussi | `billing.manage` | id | PDF |
| action `cancelRenewal` | arrête les rappels ; le plan reste actif jusqu'à la fin de la période payée | `billing.manage` | — | ok |

### Webhooks entrants

- **Moneroo** (`POST /api/webhooks/moneroo`) : on vérifie l'en-tête `X-Moneroo-Signature`
  (HMAC du corps brut avec le secret du webhook), puis on **revérifie le paiement par l'API**
  (`GET /v1/payments/{id}/verify`) avant d'activer quoi que ce soit. L'événement est noté dans
  `payment_events` pour ne jamais être traité deux fois. Un paiement réussi prolonge la période
  à partir de la fin de la période en cours, ou d'aujourd'hui si elle est passée.
- **WhatsApp** (`POST /api/webhooks/whatsapp`) : statuts des messages (envoyé, livré, lu, échec)
  → `message_deliveries` ; messages entrants « STOP » → désinscription immédiate ; changement de
  statut d'un modèle. Signature `X-Hub-Signature-256` vérifiée.
- **Telegram** (`POST /api/webhooks/telegram`, jeton secret dans l'en-tête) : le bot est ajouté
  ou retiré d'une chaîne (`my_chat_member`) ; le code à usage unique envoyé dans la chaîne la
  rattache à la bonne marque.
- **TikTok** : fin de traitement d'une publication (sinon interrogation du statut).
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
| `billing/renewals` | chaque jour | rappels par e-mail et dans l'appli 7 jours, 1 jour et le jour de l'échéance, avec un lien de paiement Moneroo neuf |
| `billing/expire` | chaque jour | à l'échéance : `past_due` et 7 jours de grâce ; ensuite retour au plan gratuit (les marques en trop passent en lecture seule, rien n'est supprimé) |
| `whatsapp/broadcast` | à l'heure du post | envoie le modèle à chaque contact de la liste, à la cadence permise par Meta, une ligne `message_deliveries` par destinataire |
| `whatsapp/templates` | toutes les 6 h | resynchronise les modèles et leur statut |
| `users/purge` | chaque nuit | supprime pour de bon les comptes supprimés depuis 30 jours (RGPD) |
| `media/cleanup` | chaque semaine | supprime de R2 les médias rattachés à aucun post depuis 7 jours |

Uniquement des API officielles et publiques, avec les clés de Direct Pub : Graph API Meta,
WhatsApp Business Cloud API, API LinkedIn, protocole AT de Bluesky, YouTube Data et Analytics,
TikTok Content Posting et Display, Telegram Bot API, Moneroo. Jamais les points d'accès privés de Metricool.

## Les parties qui mordent

- **Fuseaux horaires** : stockage en UTC ; l'utilisateur saisit dans le fuseau de la marque, qui
  est enregistré avec le post. Le calendrier s'affiche dans le fuseau choisi. Un post à 2 h 30 un
  jour de passage à l'heure d'été n'existe pas : on le refuse avec un message clair. Les jours
  des statistiques sont comptés dans le fuseau de la marque.
- **Idempotence** : une déclinaison ne doit jamais être publiée deux fois. Avant l'appel au
  réseau, on la verrouille (`update ... set status='publishing' where status='pending'`) ; la
  clé de tentative est unique dans `publish_attempts`. Les webhooks Moneroo sont dédoublonnés,
  et une diffusion WhatsApp ne peut envoyer qu'un message par contact (`unique` dans
  `message_deliveries`), même si la tâche est relancée.
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
- **Paiements sans prélèvement automatique** : Moneroo encaisse un paiement à la fois. Le
  renouvellement dépend donc des rappels. Un client qui paie en retard ne perd rien pendant la
  période de grâce ; un paiement en double prolonge la période au lieu d'être perdu. Montants en
  entiers dans la plus petite unité de la devise (le franc CFA n'a pas de centimes). Prix et
  devises à fixer (ex. XOF et EUR).
- **WhatsApp et consentement** : Meta bloque les numéros qui écrivent sans consentement ou
  reçoivent trop de signalements. On exige une preuve de consentement à l'import, on traite
  « STOP » tout de suite, et l'envoi suit le palier de messages autorisé du numéro.
- **TikTok et YouTube** : la vidéo passe par une mise en ligne en plusieurs morceaux ; on suit
  le statut de traitement avant de marquer le post comme publié. Les quotas YouTube sont par
  projet : un compteur arrête les mises en ligne avant d'atteindre la limite et les décale au
  lendemain, avec une alerte.
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
5. **Connexions Meta, LinkedIn, YouTube, TikTok** : OAuth, choix du compte, renouvellement,
   révocation, alertes ; options obligatoires de YouTube (titre, confidentialité) et de TikTok
   (confidentialité, commentaires, duo, collage, contenu commercial) dans l'éditeur (S03, S08 ;
   tâche `tokens/refresh`).
6. **Telegram** : liaison par le bot, publication texte, photo, vidéo et album, abonnés par
   jour (S03, S08).
7. **WhatsApp** : inscription intégrée Meta, contacts et listes avec consentement, modèles,
   diffusion, statuts de livraison (nouveaux écrans contacts et listes ; tables `contacts`,
   `contact_lists`, `whatsapp_templates`, `message_deliveries`).
8. **Statistiques** : rattrapage, synchronisation quotidienne, résumé, page par réseau,
   comparaison de périodes, liste des posts triable avec colonnes au choix (S17, S18 ;
   tables `published_posts`, `account_metrics_daily`, `sync_runs`).
9. **Équipe** : invitation de membres, rôles par défaut (S34 ; `invitations`).
10. **Notifications** : centre de notifications, alertes d'échec et de déconnexion (S38).
11. **Abonnement** : plans et limites, paiement Moneroo, reçus PDF, rappels de
    renouvellement, période de grâce (S36 ; `subscriptions`, `payments`, `payment_events`).

### 3. Ensuite

Les lignes `should` (V2), puis les lignes `could` (V3), dans l'ordre de `features.csv`, par
domaine.

### 4. Corrections issues de `/replica-entrepreneur`

À ajouter quand cette étape aura lu les avis des utilisateurs de Metricool.
