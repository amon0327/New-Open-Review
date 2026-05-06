import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { userHasCompanyAccess } from '../_shared/companyAccess.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface RequestBody { company_id: string }

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('認証情報がありません')

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser()
    if (authError || !user) throw new Error('認証エラー')

    const { company_id }: RequestBody = await req.json()
    if (!company_id) throw new Error('company_id が必要です')

    const admin = createClient(supabaseUrl, supabaseServiceKey)

    const allowed = await userHasCompanyAccess(admin, user.id, company_id)
    if (!allowed) throw new Error('権限がありません')

    const { data: company } = await admin
      .from('companies')
      .select('line_messaging_enabled, line_channel_access_token_vault_id')
      .eq('id', company_id).maybeSingle()
    if (!company?.line_messaging_enabled || !company.line_channel_access_token_vault_id) {
      return new Response(
        JSON.stringify({ success: true, enabled: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    const { data: tokenData, error: tokenErr } = await admin.rpc('vault_get_decrypted_secret', {
      p_id: company.line_channel_access_token_vault_id,
    })
    if (tokenErr || !tokenData) throw new Error('Channel Access Token の取得失敗')
    const accessToken = tokenData as string

    // LINE quota API (上限と消費数を並行で取得)
    const [quotaRes, consumeRes] = await Promise.all([
      fetch('https://api.line.me/v2/bot/message/quota', {
        headers: { Authorization: `Bearer ${accessToken}` },
      }),
      fetch('https://api.line.me/v2/bot/message/quota/consumption', {
        headers: { Authorization: `Bearer ${accessToken}` },
      }),
    ])

    if (!quotaRes.ok) {
      const body = await quotaRes.text()
      throw new Error(`quota 取得失敗 (${quotaRes.status}): ${body.slice(0, 200)}`)
    }
    if (!consumeRes.ok) {
      const body = await consumeRes.text()
      throw new Error(`consumption 取得失敗 (${consumeRes.status}): ${body.slice(0, 200)}`)
    }

    const quota = await quotaRes.json() as { type: string; value?: number }
    const consume = await consumeRes.json() as { totalUsage: number }

    // type='limited' の時のみ value が有効、'none' は無制限
    const isUnlimited = quota.type !== 'limited'
    const limit = isUnlimited ? null : (quota.value ?? 0)
    const used = consume.totalUsage ?? 0
    const remaining = isUnlimited ? null : Math.max(0, (limit ?? 0) - used)

    return new Response(
      JSON.stringify({
        success: true,
        enabled: true,
        unlimited: isUnlimited,
        limit, used, remaining,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('get-line-message-quota error:', error.message)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
