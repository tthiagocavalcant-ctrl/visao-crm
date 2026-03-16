
-- followup_configs: one config per pipeline status per account
CREATE TABLE public.followup_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  pipeline_status text NOT NULL,
  active boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(account_id, pipeline_status)
);

ALTER TABLE public.followup_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "followup_configs_all" ON public.followup_configs
  FOR ALL TO public
  USING (account_id = auth_account_id() OR auth_role() = 'ADMIN_GERAL'::user_role);

-- followup_messages: messages belonging to a config
CREATE TABLE public.followup_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  followup_config_id uuid NOT NULL REFERENCES public.followup_configs(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  delay_minutes integer NOT NULL DEFAULT 0,
  message text NOT NULL DEFAULT '',
  media_url text,
  media_type text,
  position integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.followup_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "followup_messages_all" ON public.followup_messages
  FOR ALL TO public
  USING (account_id = auth_account_id() OR auth_role() = 'ADMIN_GERAL'::user_role);
