
-- Add empresa and cargo columns to leads
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS empresa text DEFAULT '';
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS cargo text DEFAULT '';

-- Create lead_notes table
CREATE TABLE public.lead_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  created_by uuid REFERENCES auth.users(id),
  content text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.lead_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lead_notes_all" ON public.lead_notes
  FOR ALL TO public
  USING (account_id = auth_account_id() OR auth_role() = 'ADMIN_GERAL'::user_role);

-- Create lead_reminders table
CREATE TABLE public.lead_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  created_by uuid REFERENCES auth.users(id),
  type text NOT NULL DEFAULT 'text',
  content text NOT NULL DEFAULT '',
  scheduled_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.lead_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lead_reminders_all" ON public.lead_reminders
  FOR ALL TO public
  USING (account_id = auth_account_id() OR auth_role() = 'ADMIN_GERAL'::user_role);
