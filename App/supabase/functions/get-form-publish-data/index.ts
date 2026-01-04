import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get user
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser()

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: '認証エラー' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { companyId } = await req.json()

    if (!companyId) {
      return new Response(
        JSON.stringify({ error: 'companyIdが必要です' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 1. レビューフォーム一覧を取得
    const { data: forms, error: formsError } = await supabaseClient
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
      const { data: lotteryData } = await supabaseClient
        .from('lottery')
        .select('*')
        .eq('review_form_id', selectedFormId)
        .maybeSingle()

      lotterySettings = lotteryData
    }

    // 4. 店舗一覧を取得
    const { data: stores, error: storesError } = await supabaseClient
      .from('stores')
      .select('id, name, address, store_url_code')
      .eq('company_id', companyId)

    if (storesError) throw storesError

    // 5. 公開フォーム設定を取得（互換性のため）
    const { data: publicFormSettings } = await supabaseClient
      .from('company_public_form_settings')
      .select('*')
      .eq('company_id', companyId)
      .maybeSingle()

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
          publicFormSettings: publicFormSettings
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