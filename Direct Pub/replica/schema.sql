-- Direct Pub : schéma V1 (lignes « must » de features.csv)
-- Postgres 15+ (Supabase). Toutes les heures en timestamptz, stockées en UTC.
-- Accès : vérification d'autorisation dans la couche de données (une par requête, via
-- authorize(user, brand, permission)). RLS activé sans politique = refus par défaut,
-- en garde-fou si la clé « anon » de Supabase fuitait : seul le serveur lit la base.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- utilitaires

create or replace function set_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ---------------------------------------------------------------- comptes

-- Un utilisateur. id = id de l'utilisateur Supabase Auth (auth.users.id).
-- Le mot de passe, la confirmation d'e-mail et la réinitialisation sont gérés par Supabase Auth.
create table users (
  id uuid primary key,
  email text not null,
  name text not null default '',
  avatar_url text,
  locale text not null default 'fr' check (locale in ('fr','en')),
  timezone text not null default 'Europe/Paris',          -- IANA
  week_start smallint not null default 1 check (week_start in (0,1)), -- 0 dimanche, 1 lundi
  deleted_at timestamptz,                                  -- suppression RGPD : purge par tâche
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index users_email_key on users (lower(email));

create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 1 and 120),
  owner_user_id uuid not null references users(id) on delete restrict, -- supprimer l'orga d'abord
  plan text not null default 'free' check (plan in ('free','starter','pro','agency')),
  stripe_customer_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on organizations (owner_user_id);

-- Rôles : organization_id null = rôle par défaut, non modifiable.
create table roles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  key text,                                                -- 'owner','admin','editor','analyst','client' pour les rôles par défaut
  name text not null,
  permissions text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint default_role_has_key check ((organization_id is null) = (key is not null)),
  constraint permissions_known check (permissions <@ array[
    'analytics.view','planner.view','planner.edit','posts.publish','brand.manage',
    'org.brands','org.roles','org.members','billing.manage'
  ]::text[])
);
create unique index roles_default_key on roles (key) where organization_id is null;
create index on roles (organization_id);

-- Membre d'une organisation. V1 : membres d'équipe (accès à toutes les marques).
-- kind = 'collaborator' + brand_access arrivent en V2.
create table memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  role_id uuid not null references roles(id) on delete restrict,
  kind text not null default 'team_member' check (kind in ('team_member','collaborator')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, user_id)
);
create index on memberships (user_id);
create index on memberships (role_id);

create table invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  email text not null,
  role_id uuid not null references roles(id) on delete cascade,
  invited_by uuid references users(id) on delete set null,
  token_hash text not null unique,                         -- jamais le jeton en clair
  expires_at timestamptz not null,                         -- 24 h
  accepted_at timestamptz,
  last_sent_at timestamptz not null default now(),         -- renvoi au plus 1 fois par heure
  created_at timestamptz not null default now()
);
create unique index invitations_pending_key on invitations (organization_id, lower(email)) where accepted_at is null;

-- ---------------------------------------------------------------- marques et connexions

create table brands (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null check (length(name) between 1 and 80),
  picture_url text,
  timezone text,                                           -- null = fuseau de l'utilisateur
  engagement_formula smallint not null default 100 check (engagement_formula in (100,1000)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on brands (organization_id, name);

create table connections (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references brands(id) on delete cascade,
  network text not null check (network in (
    'instagram','facebook','linkedin','bluesky',            -- V1
    'threads','x','tiktok','youtube','pinterest','google_business','twitch')),
  external_account_id text not null,
  display_name text not null,
  handle text,
  avatar_url text,
  account_type text,                                       -- business, creator, page, profile...
  access_token_enc bytea not null,                         -- chiffré AES-256-GCM côté serveur
  refresh_token_enc bytea,
  token_expires_at timestamptz,
  scopes text[] not null default '{}',
  status text not null default 'active' check (status in ('active','expired','error','revoked')),
  last_error text,
  history_backfilled_at timestamptz,
  last_synced_at timestamptz,
  connected_by uuid references users(id) on delete set null,
  connected_at timestamptz not null default now(),
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- Un seul profil actif par réseau et par marque.
create unique index connections_one_per_network on connections (brand_id, network) where revoked_at is null;
create index on connections (status, token_expires_at);
create index on connections (last_synced_at) where revoked_at is null;

-- ---------------------------------------------------------------- médias et posts

create table media (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references brands(id) on delete cascade,
  uploaded_by uuid references users(id) on delete set null,
  kind text not null check (kind in ('image','video','gif')),
  storage_key text not null unique,                        -- clé R2
  mime text not null,
  bytes bigint not null check (bytes > 0),
  width int, height int,
  duration_ms int,
  alt_text text,
  created_at timestamptz not null default now()
);
create index on media (brand_id, created_at desc);

create table posts (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references brands(id) on delete cascade,
  author_user_id uuid references users(id) on delete set null,
  status text not null default 'draft' check (status in (
    'draft','scheduled','publishing','published','partially_failed','failed')),
  scheduled_at timestamptz,                                -- UTC
  timezone text not null,                                  -- fuseau choisi à la saisie (affichage)
  autopublish boolean not null default true,
  origin text not null default 'manual' check (origin in ('manual','duplicate','autolist','csv','recurrence','library')),
  duplicated_from uuid references posts(id) on delete set null,
  published_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint scheduled_needs_date check (status <> 'scheduled' or scheduled_at is not null)
);
create index on posts (brand_id, scheduled_at) where deleted_at is null;
-- La tâche de publication ne lit que ceci :
create index posts_due on posts (scheduled_at) where status = 'scheduled' and deleted_at is null;

-- Une déclinaison par réseau : texte, type et options propres, statut propre.
create table post_variants (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  connection_id uuid not null references connections(id) on delete restrict, -- garder l'historique
  network text not null,
  post_type text not null default 'post' check (post_type in (
    'post','reel','story','carousel','video','short','thread','poll','pin','document')),
  text text not null default '',
  options jsonb not null default '{}',                     -- lieu, premier commentaire, etc. (V2)
  status text not null default 'pending' check (status in ('pending','publishing','published','failed')),
  attempts smallint not null default 0,
  external_post_id text,
  permalink text,
  error text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (post_id, network)
);
create index on post_variants (connection_id);
create index on post_variants (status) where status in ('pending','publishing');

create table post_variant_media (
  post_variant_id uuid not null references post_variants(id) on delete cascade,
  media_id uuid not null references media(id) on delete restrict,
  position smallint not null,
  primary key (post_variant_id, position)
);
create index on post_variant_media (media_id);

-- Journal des tentatives : la clé rend la publication idempotente (jamais 2 fois le même post).
create table publish_attempts (
  id uuid primary key default gen_random_uuid(),
  post_variant_id uuid not null references post_variants(id) on delete cascade,
  idempotency_key text not null unique,                    -- variant_id + numéro de tentative
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  outcome text check (outcome in ('published','failed','retry')),
  response jsonb
);
create index on publish_attempts (post_variant_id);

-- ---------------------------------------------------------------- statistiques

-- Tout post vu sur le réseau, publié par Direct Pub ou non.
create table published_posts (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references connections(id) on delete cascade,
  external_id text not null,
  post_type text not null,
  published_at timestamptz not null,
  text text,
  permalink text,
  thumbnail_url text,
  post_variant_id uuid references post_variants(id) on delete set null,
  metrics jsonb not null default '{}',                     -- dernières valeurs (impressions, reach, likes...)
  metrics_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (connection_id, external_id)
);
create index on published_posts (connection_id, published_at desc);
create index on published_posts (post_variant_id);

create table account_metrics_daily (
  connection_id uuid not null references connections(id) on delete cascade,
  day date not null,                                       -- jour dans le fuseau de la marque
  followers int,
  following int,
  impressions bigint,
  reach bigint,
  profile_views bigint,
  extra jsonb not null default '{}',                       -- métriques propres au réseau
  primary key (connection_id, day)
);

create table sync_runs (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references connections(id) on delete cascade,
  kind text not null check (kind in ('backfill','daily')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running' check (status in ('running','ok','error')),
  error text
);
create index on sync_runs (connection_id, started_at desc);

-- ---------------------------------------------------------------- notifications

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  brand_id uuid references brands(id) on delete cascade,
  type text not null check (type in (
    'post_failed','post_published_with_warnings','connection_lost',
    'invitation_accepted','plan_limit','payment_failed')),
  payload jsonb not null default '{}',
  dedupe_key text,                                         -- évite les doublons (même erreur, même post)
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index notifications_dedupe on notifications (user_id, dedupe_key) where dedupe_key is not null;
create index on notifications (user_id, created_at desc);
create index notifications_unread on notifications (user_id) where read_at is null;

-- ---------------------------------------------------------------- abonnement

create table subscriptions (
  organization_id uuid primary key references organizations(id) on delete cascade,
  stripe_subscription_id text unique,
  plan text not null check (plan in ('free','starter','pro','agency')),
  cycle text check (cycle in ('month','year')),
  status text not null check (status in ('active','trialing','past_due','canceled','incomplete')),
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  updated_at timestamptz not null default now()
);

-- Événements Stripe déjà traités (les webhooks arrivent parfois deux fois).
create table stripe_events (
  id text primary key,
  type text not null,
  received_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- déclencheurs, RLS, données de base

do $$
declare t text;
begin
  foreach t in array array['users','organizations','roles','memberships','brands','connections',
                           'posts','post_variants','published_posts'] loop
    execute format('create trigger %I_updated_at before update on %I for each row execute function set_updated_at()', t, t);
  end loop;
  foreach t in array array['users','organizations','roles','memberships','invitations','brands',
                           'connections','media','posts','post_variants','post_variant_media',
                           'publish_attempts','published_posts','account_metrics_daily','sync_runs',
                           'notifications','subscriptions','stripe_events'] loop
    execute format('alter table %I enable row level security', t);
  end loop;
end $$;

insert into roles (key, name, permissions) values
  ('owner',   'Propriétaire',  array['analytics.view','planner.view','planner.edit','posts.publish','brand.manage','org.brands','org.roles','org.members','billing.manage']),
  ('admin',   'Administrateur',array['analytics.view','planner.view','planner.edit','posts.publish','brand.manage','org.brands','org.members']),
  ('editor',  'Éditeur',       array['analytics.view','planner.view','planner.edit','posts.publish']),
  ('analyst', 'Analyste',      array['analytics.view','planner.view']),
  ('client',  'Client',        array['analytics.view','planner.view']);
