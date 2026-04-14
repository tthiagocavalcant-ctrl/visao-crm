import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()

    const {
      account_id,
      name,
      phone,
      email,
      source,
      canal,
      campaign,
      tags,
    } = body

    if (!account_id || !name || !phone) {
      return new Response(
        JSON.stringify({ error: 'account_id, name e phone são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Canal padrão baseado na source, ou trafego_pago
    const canalFinal = canal || 'trafego_pago'

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verifica se lead já existe para não duplicar
    const { data: existingLead } = await supabase
      .from('leads')
      .select('id')
      .eq('account_id', account_id)
      .eq('phone', phone)
      .maybeSingle()

    if (existingLead) {
      return new Response(
        JSON.stringify({ ok: true, message: 'Lead already exists', id: existingLead.id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Busca o primeiro status do pipeline desta conta
    const { data: firstStatus } = await supabase
      .from('pipeline_statuses')
      .select('id, name, slug')
      .eq('account_id', account_id)
      .order('position', { ascending: true })
      .limit(1)
      .maybeSingle()

    // Cria o lead
    const { data: lead, error } = await supabase
      .from('leads')
      .insert({
        account_id,
        name,
        phone,
        email: email || null,
        canal: canalFinal,
        pipeline_status: firstStatus?.slug || firstStatus?.name || 'novo',
        status_id: firstStatus?.id || null,
        source: source || campaign || canalFinal,
        tags: tags || null,
      })
      .select()
      .single()

    if (error) throw error

    return new Response(JSON.stringify({ ok: true, lead }), {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
