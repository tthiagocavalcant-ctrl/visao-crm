
-- Enable RLS on all tables
alter table accounts enable row level security;
alter table profiles enable row level security;
alter table units enable row level security;
alter table pipeline_statuses enable row level security;
alter table leads enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table projects enable row level security;
alter table tasks enable row level security;
alter table task_activities enable row level security;
alter table interactions enable row level security;

-- Fix search_path on functions
alter function update_updated_at() set search_path = public;
alter function handle_new_user() set search_path = public;

-- Helper: get user's account_id from profiles
create or replace function public.get_user_account_id(_user_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select account_id from profiles where id = _user_id
$$;

-- Helper: get user's role
create or replace function public.get_user_role(_user_id uuid)
returns user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from profiles where id = _user_id
$$;

-- PROFILES policies
create policy "Users can view own profile" on profiles for select using (id = auth.uid());
create policy "Admins can view account profiles" on profiles for select using (
  public.get_user_role(auth.uid()) in ('ADMIN', 'ADMIN_GERAL')
  and (account_id = public.get_user_account_id(auth.uid()) or public.get_user_role(auth.uid()) = 'ADMIN_GERAL')
);
create policy "Users can update own profile" on profiles for update using (id = auth.uid());
create policy "Admin geral can manage profiles" on profiles for all using (public.get_user_role(auth.uid()) = 'ADMIN_GERAL');

-- ACCOUNTS policies
create policy "Users can view own account" on accounts for select using (
  id = public.get_user_account_id(auth.uid()) or public.get_user_role(auth.uid()) = 'ADMIN_GERAL'
);
create policy "Admin geral can manage accounts" on accounts for all using (public.get_user_role(auth.uid()) = 'ADMIN_GERAL');
create policy "Admin can update own account" on accounts for update using (
  id = public.get_user_account_id(auth.uid()) and public.get_user_role(auth.uid()) = 'ADMIN'
);

-- LEADS policies (account-scoped)
create policy "Account users can view leads" on leads for select using (account_id = public.get_user_account_id(auth.uid()));
create policy "Account users can insert leads" on leads for insert with check (account_id = public.get_user_account_id(auth.uid()));
create policy "Account users can update leads" on leads for update using (account_id = public.get_user_account_id(auth.uid()));
create policy "Account users can delete leads" on leads for delete using (account_id = public.get_user_account_id(auth.uid()));
create policy "Admin geral can manage leads" on leads for all using (public.get_user_role(auth.uid()) = 'ADMIN_GERAL');

-- PIPELINE_STATUSES policies
create policy "Account users can view statuses" on pipeline_statuses for select using (account_id = public.get_user_account_id(auth.uid()));
create policy "Admin can manage statuses" on pipeline_statuses for all using (
  account_id = public.get_user_account_id(auth.uid()) and public.get_user_role(auth.uid()) in ('ADMIN', 'ADMIN_GERAL')
);

-- CONVERSATIONS policies
create policy "Account users can view conversations" on conversations for select using (account_id = public.get_user_account_id(auth.uid()));
create policy "Account users can manage conversations" on conversations for all using (account_id = public.get_user_account_id(auth.uid()));

-- MESSAGES policies
create policy "Account users can view messages" on messages for select using (account_id = public.get_user_account_id(auth.uid()));
create policy "Account users can insert messages" on messages for insert with check (account_id = public.get_user_account_id(auth.uid()));

-- TASKS policies
create policy "Account users can view tasks" on tasks for select using (account_id = public.get_user_account_id(auth.uid()));
create policy "Account users can manage tasks" on tasks for all using (account_id = public.get_user_account_id(auth.uid()));

-- TASK_ACTIVITIES policies
create policy "Users can view task activities" on task_activities for select using (
  exists (select 1 from tasks t where t.id = task_activities.task_id and t.account_id = public.get_user_account_id(auth.uid()))
);
create policy "Users can insert task activities" on task_activities for insert with check (
  exists (select 1 from tasks t where t.id = task_activities.task_id and t.account_id = public.get_user_account_id(auth.uid()))
);

-- PROJECTS policies
create policy "Account users can view projects" on projects for select using (account_id = public.get_user_account_id(auth.uid()));
create policy "Account users can manage projects" on projects for all using (account_id = public.get_user_account_id(auth.uid()));

-- UNITS policies
create policy "Account users can view units" on units for select using (account_id = public.get_user_account_id(auth.uid()));
create policy "Admin can manage units" on units for all using (
  account_id = public.get_user_account_id(auth.uid()) and public.get_user_role(auth.uid()) in ('ADMIN', 'ADMIN_GERAL')
);

-- INTERACTIONS policies
create policy "Account users can view interactions" on interactions for select using (account_id = public.get_user_account_id(auth.uid()));
create policy "Account users can insert interactions" on interactions for insert with check (account_id = public.get_user_account_id(auth.uid()));
