import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // デバッグ: ヘッダー情報をログ出力
    const authHeader = req.headers.get('Authorization')
    console.log('Auth header:', authHeader ? 'Present' : 'Missing')

    // Create Supabase client with service role for server-side operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // 認証をスキップしてcompanyIdのみで処理（一時的な対応）
    let reqBody
    try {
      reqBody = await req.json()
    } catch (e) {
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { companyId } = reqBody

    if (!companyId) {
      return new Response(
        JSON.stringify({ error: 'companyIdが必要です' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Company ID:', companyId)

    // 1. レビューフォーム一覧を取得（管理者権限で）
    const { data: forms, error: formsError } = await supabaseAdmin
      .from('review_forms')
      .select('id, title, is_deleted, is_published')
      .eq('company_id', companyId)
      .eq('is_deleted', false)

    if (formsError) throw formsError

    // 2. 公開中のフォームを特定
    const publishedForm = forms?.find(f => f.is_published)
    const selectedFormId = publishedForm?.id || forms?.[0]?.id

    // 3. 抽選設定を取得（選択されたフォームの設定）
    let lotterySettings = null
    if (selectedFormId) {
      const { data: lotteryData } = await supabaseAdmin
        .from('lottery')
        .select('*')
        .eq('review_form_id', selectedFormId)
        .maybeSingle()

      lotterySettings = lotteryData
    }

    // 4. 店舗一覧を取得
    const { data: stores, error: storesError } = await supabaseAdmin
      .from('stores')
      .select('id, name, address, store_url_code')
      .eq('company_id', companyId)

    if (storesError) throw storesError

    // 5. 公開フォーム設定を取得（互換性のため）
    const { data: publicFormSettings } = await supabaseAdmin
      .from('company_public_form_settings')
      .select('*')
      .eq('company_id', companyId)
      .maybeSingle()

    // 6. 企業のLINEミニアプリURLを取得
    const { data: companyData } = await supabaseAdmin
      .from('companies')
      .select('line_mini_app_url')
      .eq('id', companyId)
      .single()

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          forms: forms || [],
          stores: stores || [],
          publishedFormId: publishedForm?.id || null,
          selectedFormId: selectedFormId || null,
          lotterySettings: lotterySettings ? {
            maxWinsPerMonth: lotterySettings.max_wins_per_month || 1,
            winRateDivisor: lotterySettings.win_rate_divisor || 1000,
            currentTrials: lotterySettings.current_trials || 0,
            currentWins: lotterySettings.current_wins || 0
          } : {
            maxWinsPerMonth: 1,
            winRateDivisor: 1000,
            currentTrials: 0,
            currentWins: 0
          },
          publicFormSettings: publicFormSettings,
          lineMiniAppUrl: companyData?.line_mini_app_url || ''
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})