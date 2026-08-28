import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { store_id } = await req.json()
    if (!store_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'store_id is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authorization header is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const webhookUrl = Deno.env.get('LINE_REQUEST_GCHAT_WEBHOOK_URL') ?? ''

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    const admin = createClient(supabaseUrl, supabaseServiceKey)

    // 店舗 + 会社 + パートナー会社を解決
    const { data: store, error: storeErr } = await admin
      .from('stores')
      .select('id, name, address, company_id, companies(id, name)')
      .eq('id', store_id)
      .maybeSingle()
    if (storeErr || !store) {
      return new Response(
        JSON.stringify({ success: false, error: 'Store not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    // STORE ロール確認
    const { data: membership } = await admin
      .from('store_memberships')
      .select('role')
      .eq('business_user_id', user.id)
      .eq('store_id', store_id)
      .maybeSingle()
    if (!membership || String(membership.role).toUpperCase() !== 'STORE') {
      return new Response(
        JSON.stringify({ success: false, error: 'Only store managers can request' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }

    // 既に接続済 / 既に依頼済 のチェック
    const { data: companyState } = await admin
      .from('companies')
      .select('line_messaging_enabled, line_connection_requested_at')
      .eq('id', store.company_id)
      .maybeSingle()
    if (companyState?.line_messaging_enabled) {
      return new Response(
        JSON.stringify({ success: true, already_connected: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }
    if (companyState?.line_connection_requested_at) {
      return new Response(
        JSON.stringify({
          success: true,
          already_requested: true,
          requested_at: companyState.line_connection_requested_at
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // ユーザー情報
    const { data: businessUser } = await admin
      .from('business_users')
      .select('id, name, email')
      .eq('id', user.id)
      .maybeSingle()

    // パートナー会社 (companies の affiliate)
    let partnerName: string | null = null
    const { data: aff } = await admin
      .from('partner_affiliate_companies')
      .select('partner_company:partner_company_id(company_name)')
      .eq('companies_id', store.company_id)
      .eq('is_deleted', false)
      .limit(1)
      .maybeSingle()
    // @ts-ignore
    partnerName = aff?.partner_company?.company_name ?? null

    const requesterName = businessUser?.name || user.email || '不明'
    const requesterEmail = businessUser?.email || user.email || ''
    // @ts-ignore
    const companyName = store.companies?.name || '(企業名なし)'
    const storeName = store.name || '(店舗名なし)'

    if (!webhookUrl) {
      console.error('LINE_REQUEST_GCHAT_WEBHOOK_URL is not configured')
      return new Response(
        JSON.stringify({ success: false, error: 'Webhook URL is not configured (admin)' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Google Chat 用 cardsV2 メッセージ
    const card = {
      cardsV2: [{
        cardId: `line-req-${Date.now()}`,
        card: {
          header: {
            title: 'LINE 公式アカウント 接続依頼',
            subtitle: `${partnerName || companyName} / ${storeName}`,
            imageUrl: 'https://www.gstatic.com/images/branding/product/1x/chat_2020q4_48dp.png',
            imageType: 'CIRCLE'
          },
          sections: [{
            widgets: [
              { decoratedText: { topLabel: 'パートナー企業', text: partnerName || '(なし)' } },
              { decoratedText: { topLabel: '企業', text: companyName } },
              { decoratedText: { topLabel: '店舗', text: storeName } },
              ...(store.address ? [{ decoratedText: { topLabel: '住所', text: store.address } }] : []),
              { decoratedText: { topLabel: '申請者', text: `${requesterName}${requesterEmail ? ` (${requesterEmail})` : ''}` } },
              { decoratedText: { topLabel: '申請日時', text: new Date().toISOString() } },
              { decoratedText: { topLabel: '店舗 ID', text: store.id } },
              { decoratedText: { topLabel: '企業 ID', text: store.company_id } }
            ]
          }]
        }
      }],
      // テキストフォールバック (通知の preview 用)
      text: `[LINE 接続依頼] ${storeName} (${companyName}) / 申請者: ${requesterName}`
    }

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=UTF-8' },
      body: JSON.stringify(card)
    })

    if (!res.ok) {
      const body = await res.text()
      console.error('Google Chat webhook failed:', res.status, body.slice(0, 500))
      return new Response(
        JSON.stringify({ success: false, error: `Webhook failed (${res.status})` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 502 }
      )
    }

    // companies に依頼日時を保存 (重複防止 / クロスデバイスで反映)
    const requestedAt = new Date().toISOString()
    const { error: updateErr } = await admin
      .from('companies')
      .update({
        line_connection_requested_at: requestedAt,
        line_connection_requested_by: user.id
      })
      .eq('id', store.company_id)
    if (updateErr) console.error('save requested_at failed:', updateErr.message)

    return new Response(
      JSON.stringify({
        success: true,
        already_requested: false,
        requested_at: requestedAt
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('request-line-connection error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
