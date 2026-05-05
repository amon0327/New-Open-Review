import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface RequestBody {
  company_id: string
  channel_id: string
  basic_id?: string
  channel_secret: string
  channel_access_token: string
}

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
    if (authError || !user) throw new Error('認証エラー: ' + (authError?.message || 'ユーザー不明'))

    const body: RequestBody = await req.json()
    const { company_id, channel_id, basic_id, channel_secret, channel_access_token } = body

    if (!company_id) throw new Error('company_id が必要です')
    if (!channel_id) throw new Error('channel_id が必要です')
    if (!channel_secret) throw new Error('channel_secret が必要です')
    if (!channel_access_token) throw new Error('channel_access_token が必要です')

    const admin = createClient(supabaseUrl, supabaseServiceKey)

    // 企業所属チェック
    const { data: membership } = await admin
      .from('company_memberships')
      .select('id')
      .eq('company_id', company_id)
      .eq('business_user_id', user.id)
      .maybeSingle()
    if (!membership) throw new Error('この企業の LINE 連携設定を更新する権限がありません')

    // LINE Messaging API 疎通テスト (botInfo で access_token 検証)
    const verifyRes = await fetch('https://api.line.me/v2/bot/info', {
      headers: { Authorization: `Bearer ${channel_access_token}` },
    })
    if (!verifyRes.ok) {
      const errBody = await verifyRes.text()
      throw new Error(`Channel Access Token 検証失敗 (${verifyRes.status}): ${errBody.slice(0, 200)}`)
    }
    const botInfo = await verifyRes.json()

    const { data: company } = await admin
      .from('companies')
      .select('line_channel_secret_vault_id, line_channel_access_token_vault_id')
      .eq('id', company_id)
      .maybeSingle()
    if (!company) throw new Error('企業が見つかりません')

    // Channel Secret
    let secretId = company.line_channel_secret_vault_id as string | null
    if (secretId) {
      const { error } = await admin.rpc('vault_update_secret', { p_id: secretId, p_value: channel_secret })
      if (error) throw new Error('Channel Secret の更新に失敗: ' + error.message)
    } else {
      const { data, error } = await admin.rpc('vault_create_secret_named', {
        p_value: channel_secret,
        p_name: `line_channel_secret_${company_id}`,
      })
      if (error) throw new Error('Channel Secret の保存に失敗: ' + error.message)
      secretId = data as unknown as string
    }

    // Channel Access Token
    let tokenId = company.line_channel_access_token_vault_id as string | null
    if (tokenId) {
      const { error } = await admin.rpc('vault_update_secret', { p_id: tokenId, p_value: channel_access_token })
      if (error) throw new Error('Channel Access Token の更新に失敗: ' + error.message)
    } else {
      const { data, error } = await admin.rpc('vault_create_secret_named', {
        p_value: channel_access_token,
        p_name: `line_channel_access_token_${company_id}`,
      })
      if (error) throw new Error('Channel Access Token の保存に失敗: ' + error.message)
      tokenId = data as unknown as string
    }

    const { error: updateErr } = await admin
      .from('companies')
      .update({
        line_channel_id: channel_id,
        line_basic_id: basic_id ?? botInfo.basicId ?? null,
        line_channel_secret_vault_id: secretId,
        line_channel_access_token_vault_id: tokenId,
        line_messaging_enabled: true,
        line_messaging_updated_at: new Date().toISOString(),
      })
      .eq('id', company_id)
    if (updateErr) throw new Error('企業情報の更新に失敗: ' + updateErr.message)

    return new Response(
      JSON.stringify({
        success: true,
        bot_info: {
          display_name: botInfo.displayName,
          basic_id: botInfo.basicId,
          premium_id: botInfo.premiumId,
          picture_url: botInfo.pictureUrl,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('update-line-channel-credentials error:', error.message)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
