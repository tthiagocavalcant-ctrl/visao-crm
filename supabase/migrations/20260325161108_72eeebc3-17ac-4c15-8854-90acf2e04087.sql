
-- 1. Rename evolution_key to evolution_api_key
ALTER TABLE public.accounts RENAME COLUMN evolution_key TO evolution_api_key;

-- 2. Add source column to leads
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS source text DEFAULT 'WhatsApp';

-- 3. Add status_id column to leads (FK to pipeline_statuses)
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS status_id uuid REFERENCES public.pipeline_statuses(id);

-- 4. RLS policy for anon INSERT on leads (for N8N API inserts)
CREATE POLICY "leads_insert_via_api" ON public.leads
FOR INSERT
TO anon
WITH CHECK (true);
