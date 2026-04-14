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
    const url = new URL(req.url)
    const accountId = url.searchParams.get('account_id')

    if (!accountId) {
      return new Response(
        JSON.stringify({ error: 'account_id is required as query param' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body = await req.json()
    const event = body.event

    // Só processa mensagens recebidas
    if (event !== 'messages.upsert') {
      return new Response(JSON.stringify({ ok: true, skipped: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const data = body.data

    // Ignora mensagens enviadas pelo próprio número
    if (data?.key?.fromMe) {
      return new Response(JSON.stringify({ ok: true, skipped: 'fromMe' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const remoteJid: string = data?.key?.remoteJid || ''

    // Ignora grupos
    if (remoteJid.includes('@g.us')) {
      return new Response(JSON.stringify({ ok: true, skipped: 'group' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Extrai telefone e nome
    const phone = remoteJid.replace('@s.whatsapp.net', '')
    const name = data?.pushName || phone

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verifica se lead já existe para não duplicar
    const { data: existingLead } = await supabase
      .from('leads')
      .select('id')
      .eq('account_id', accountId)
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
      .eq('account_id', accountId)
      .order('position', { ascending: true })
      .limit(1)
      .maybeSingle()

    // Cria o lead
    const { data: lead, error } = await supabase
      .from('leads')
      .insert({
        account_id: accountId,
        name,
        phone,
        canal: 'whatsapp',
        pipeline_status: firstStatus?.slug || firstStatus?.name || 'novo',
        status_id: firstStatus?.id || null,
        source: 'whatsapp',
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
