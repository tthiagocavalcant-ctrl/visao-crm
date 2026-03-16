
-- ENUMS
create type user_role as enum ('ADMIN_GERAL', 'ADMIN', 'FUNCIONARIO');
create type account_status as enum ('active', 'inactive');
create type lead_temperature as enum ('frio', 'morno', 'quente');
create type lead_canal as enum ('whatsapp','instagram','trafego_pago','google','facebook','indicacao','outro');
create type task_priority as enum ('alta', 'media', 'baixa');
create type task_status as enum ('a_fazer', 'em_andamento', 'concluido');
create type project_status as enum ('active', 'completed', 'archived');
create type message_type as enum ('text','image','audio','document','system');
create type message_direction as enum ('inbound', 'outbound');
create type message_status as enum ('sent', 'delivered', 'read');
create type conversation_status as enum ('active', 'archived', 'blocked');

-- ACCOUNTS
create table accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  whatsapp_link text default '',
  n8n_webhook text default '',
  followup_webhook text default '',
  sale_webhook text default '',
  facebook_pixel text default '',
  google_ads_tag text default '',
  api_key text default gen_random_uuid()::text,
  timezone text default 'America/Sao_Paulo',
  responsible_name text default '',
  phone text default '',
  email text not null unique,
  status account_status default 'active',
  evolution_url text default '',
  evolution_key text default '',
  evolution_instance text default '',
  permissions jsonb default '{"dashboard":true,"pipeline":true,"settings":true,"reports":false}'::jsonb,
  created_at timestamptz default now()
);

-- PROFILES
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text not null,
  role user_role not null default 'ADMIN',
  account_id uuid references accounts(id) on delete set null,
  cargo text default '',
  permissions jsonb default '{"pipeline":true,"dashboard":false,"export_leads":false,"delete_leads":false,"manage_statuses":false,"conversas":false}'::jsonb,
  active boolean default true,
  created_at timestamptz default now()
);

-- UNITS
create table units (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts(id) on delete cascade,
  name text not null,
  address text default '',
  city text default '',
  state text default '',
  phone text default '',
  responsible text default '',
  status account_status default 'active',
  created_at timestamptz default now()
);

-- PIPELINE STATUSES
create table pipeline_statuses (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts(id) on delete cascade,
  slug text not null,
  name text not null,
  color text not null default 'primary',
  visible boolean default true,
  position integer default 0,
  created_at timestamptz default now(),
  unique(account_id, slug)
);

-- LEADS
create table leads (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts(id) on delete cascade,
  name text not null,
  phone text not null,
  email text default '',
  scheduled_at timestamptz,
  temperature lead_temperature default 'frio',
  canal lead_canal default 'outro',
  tags text[] default '{}',
  notes text default '',
  pipeline_status text not null default 'lead',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- CONVERSATIONS
create table conversations (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts(id) on delete cascade,
  lead_id uuid references leads(id) on delete set null,
  contact_name text not null,
  contact_phone text not null,
  contact_avatar_url text,
  last_message text default '',
  last_message_at timestamptz default now(),
  unread_count integer default 0,
  status conversation_status default 'active',
  is_online boolean default false,
  assigned_to uuid references profiles(id) on delete set null,
  created_at timestamptz default now()
);

-- MESSAGES
create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  account_id uuid not null references accounts(id) on delete cascade,
  content text not null,
  message_type message_type default 'text',
  media_url text,
  direction message_direction not null,
  status message_status default 'sent',
  whatsapp_message_id text,
  sent_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now()
);

-- PROJECTS
create table projects (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts(id) on delete cascade,
  name text not null,
  total_tasks integer default 0,
  completed_tasks integer default 0,
  status project_status default 'active',
  created_at timestamptz default now()
);

-- TASKS
create table tasks (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts(id) on delete cascade,
  project_id uuid references projects(id) on delete set null,
  title text not null,
  description text default '',
  priority task_priority default 'media',
  status task_status default 'a_fazer',
  assigned_to uuid references profiles(id) on delete set null,
  created_by uuid references profiles(id) on delete set null,
  due_date date,
  tags text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- TASK ACTIVITIES
create table task_activities (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks(id) on delete cascade,
  user_id uuid references profiles(id) on delete set null,
  action text not null,
  description text not null,
  created_at timestamptz default now()
);

-- INTERACTIONS
create table interactions (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  account_id uuid not null references accounts(id) on delete cascade,
  type text not null,
  description text not null,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now()
);

-- TRIGGER: updated_at
create or replace function update_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger leads_updated_at before update on leads
  for each row execute function update_updated_at();
create trigger tasks_updated_at before update on tasks
  for each row execute function update_updated_at();

-- TRIGGER: auto-create profile on auth signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, email, name, role, account_id)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', new.email),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'ADMIN'),
    (new.raw_user_meta_data->>'account_id')::uuid
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();
