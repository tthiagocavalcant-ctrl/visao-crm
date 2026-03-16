create table script_categories (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts(id) on delete cascade,
  name text not null,
  color text not null default 'purple',
  position integer default 0,
  created_at timestamptz default now()
);

create table scripts (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts(id) on delete cascade,
  category_id uuid references script_categories(id) on delete set null,
  title text not null,
  content text default '',
  media_url text,
  media_type text check (media_type in ('image', 'video', null)),
  is_favorite boolean default false,
  position integer default 0,
  created_at timestamptz default now()
);

alter table script_categories enable row level security;
alter table scripts enable row level security;

create policy "script_categories_all" on script_categories
  for all using (account_id = auth_account_id() or auth_role() = 'ADMIN_GERAL');

create policy "scripts_all" on scripts
  for all using (account_id = auth_account_id() or auth_role() = 'ADMIN_GERAL');