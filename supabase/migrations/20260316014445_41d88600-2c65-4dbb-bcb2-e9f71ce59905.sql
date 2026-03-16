
-- Drop existing policies
drop policy if exists "Users can view own profile" on profiles;
drop policy if exists "Admins can view account profiles" on profiles;
drop policy if exists "Users can update own profile" on profiles;
drop policy if exists "Admin geral can manage profiles" on profiles;
drop policy if exists "Users can view own account" on accounts;
drop policy if exists "Admin geral can manage accounts" on accounts;
drop policy if exists "Admin can update own account" on accounts;
drop policy if exists "Account users can view leads" on leads;
drop policy if exists "Account users can insert leads" on leads;
drop policy if exists "Account users can update leads" on leads;
drop policy if exists "Account users can delete leads" on leads;
drop policy if exists "Admin geral can manage leads" on leads;
drop policy if exists "Account users can view statuses" on pipeline_statuses;
drop policy if exists "Admin can manage statuses" on pipeline_statuses;
drop policy if exists "Account users can view conversations" on conversations;
drop policy if exists "Account users can manage conversations" on conversations;
drop policy if exists "Account users can view messages" on messages;
drop policy if exists "Account users can insert messages" on messages;
drop policy if exists "Account users can view tasks" on tasks;
drop policy if exists "Account users can manage tasks" on tasks;
drop policy if exists "Users can view task activities" on task_activities;
drop policy if exists "Users can insert task activities" on task_activities;
drop policy if exists "Account users can view projects" on projects;
drop policy if exists "Account users can manage projects" on projects;
drop policy if exists "Account users can view units" on units;
drop policy if exists "Admin can manage units" on units;
drop policy if exists "Account users can view interactions" on interactions;
drop policy if exists "Account users can insert interactions" on interactions;

-- Drop old helper functions
drop function if exists public.get_user_account_id(uuid);
drop function if exists public.get_user_role(uuid);

-- New helper functions
create or replace function auth_account_id()
returns uuid as $$
  select account_id from profiles where id = auth.uid();
$$ language sql security definer stable set search_path = public;

create or replace function auth_role()
returns user_role as $$
  select role from profiles where id = auth.uid();
$$ language sql security definer stable set search_path = public;

-- ACCOUNTS
create policy "accounts_select" on accounts for select using (
  auth_role() = 'ADMIN_GERAL' or id = auth_account_id()
);
create policy "accounts_insert" on accounts for insert with check (auth_role() = 'ADMIN_GERAL');
create policy "accounts_update" on accounts for update using (
  auth_role() = 'ADMIN_GERAL' or id = auth_account_id()
);
create policy "accounts_delete" on accounts for delete using (auth_role() = 'ADMIN_GERAL');

-- PROFILES
create policy "profiles_select" on profiles for select using (
  auth_role() = 'ADMIN_GERAL' or account_id = auth_account_id() or id = auth.uid()
);
create policy "profiles_insert" on profiles for insert with check (
  auth_role() in ('ADMIN_GERAL', 'ADMIN')
);
create policy "profiles_update" on profiles for update using (
  auth_role() = 'ADMIN_GERAL' or (auth_role() = 'ADMIN' and account_id = auth_account_id()) or id = auth.uid()
);
create policy "profiles_delete" on profiles for delete using (
  auth_role() = 'ADMIN_GERAL' or (auth_role() = 'ADMIN' and account_id = auth_account_id())
);

-- LEADS
create policy "leads_select" on leads for select using (account_id = auth_account_id() or auth_role() = 'ADMIN_GERAL');
create policy "leads_insert" on leads for insert with check (account_id = auth_account_id());
create policy "leads_update" on leads for update using (account_id = auth_account_id());
create policy "leads_delete" on leads for delete using (
  account_id = auth_account_id() and (
    auth_role() = 'ADMIN' or
    (auth_role() = 'FUNCIONARIO' and (select (permissions->>'delete_leads')::boolean from profiles where id = auth.uid()))
  )
);

-- CONVERSATIONS & MESSAGES
create policy "conversations_select" on conversations for select using (account_id = auth_account_id() or auth_role() = 'ADMIN_GERAL');
create policy "conversations_all" on conversations for all using (account_id = auth_account_id());
create policy "messages_select" on messages for select using (account_id = auth_account_id() or auth_role() = 'ADMIN_GERAL');
create policy "messages_insert" on messages for insert with check (account_id = auth_account_id());

-- TASKS, PROJECTS, ACTIVITIES, UNITS, INTERACTIONS, PIPELINE_STATUSES
create policy "tasks_all" on tasks for all using (account_id = auth_account_id() or auth_role() = 'ADMIN_GERAL');
create policy "projects_all" on projects for all using (account_id = auth_account_id() or auth_role() = 'ADMIN_GERAL');
create policy "task_activities_all" on task_activities for all using (
  task_id in (select id from tasks where account_id = auth_account_id())
);
create policy "units_all" on units for all using (account_id = auth_account_id() or auth_role() = 'ADMIN_GERAL');
create policy "pipeline_statuses_all" on pipeline_statuses for all using (account_id = auth_account_id() or auth_role() = 'ADMIN_GERAL');
create policy "interactions_all" on interactions for all using (account_id = auth_account_id() or auth_role() = 'ADMIN_GERAL');
