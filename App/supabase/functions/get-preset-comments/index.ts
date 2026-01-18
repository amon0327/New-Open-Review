import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // サービスロール用のSupabaseクライアントを作成（RLSバイパス）
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 認証用のSupabaseクライアント（JWTトークン検証用）
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // JWTトークンからユーザー情報を取得
    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) {
      throw new Error('認証トークンが必要です')
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    if (userError || !user) {
      throw new Error('認証に失敗しました')
    }

    // リクエストパラメータを取得
    const url = new URL(req.url)
    const companyId = url.searchParams.get('company_id')
    const storeId = url.searchParams.get('store_id')
    const limit = parseInt(url.searchParams.get('limit') || '100')
    const offset = parseInt(url.searchParams.get('offset') || '0')

    if (!companyId) {
      throw new Error('company_idが必要です')
    }

    // ユーザーが企業にアクセス可能かチェック
    // 1. 直接の企業メンバーかどうか
    const { data: companyMembership } = await supabaseAdmin
      .from('company_memberships')
      .select('id')
      .eq('business_user_id', user.id)
      .eq('company_id', companyId)
      .single()

    // 2. パートナー経由でアクセス可能かどうか
    // まずユーザーが所属するパートナー企業を取得
    const { data: userPartnerMemberships } = await supabaseAdmin
      .from('partner_memberships')
      .select('partner_company_id')
      .eq('business_users_id', user.id)
      .eq('is_active', true)

    let partnerAccess = null
    if (userPartnerMemberships && userPartnerMemberships.length > 0) {
      const partnerCompanyIds = userPartnerMemberships.map(pm => pm.partner_company_id)

      // そのパートナー企業が対象企業と紐づいているかチェック
      const { data: affiliations } = await supabaseAdmin
        .from('partner_affiliate_companies')
        .select('id')
        .eq('companies_id', companyId)
        .in('partner_company_id', partnerCompanyIds)

      partnerAccess = affiliations
    }

    const hasAccess = companyMembership || (partnerAccess && partnerAccess.length > 0)

    if (!hasAccess) {
      throw new Error('この企業のデータにアクセスする権限がありません')
    }

    // コメントデータを取得
    let query = supabaseAdmin
      .from('preset_question_answer_comment')
      .select(`
        id,
        created_at,
        comment,
        selected_qsc,
        question_number,
        is_positive,
        is_hidden,
        preset_question_answer_id,
        preset_question_answer (
          id,
          p1_q1,
          p1_q2,
          p1_q3,
          p1_q4,
          p1_q5,
          p1_q6,
          p2_q1,
          p2_q2,
          p2_q3,
          p2_q4,
          store_id,
          company_id,
          created_at
        )
      `)
      .eq('preset_question_answer.company_id', companyId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // 店舗フィルター
    if (storeId && storeId !== 'all') {
      query = query.eq('preset_question_answer.store_id', storeId)
    }

    const { data: comments, error: commentsError } = await query

    if (commentsError) {
      console.error('コメント取得エラー:', commentsError)
      throw new Error(`コメントの取得に失敗しました: ${commentsError.message}`)
    }

    // 関連データがあるもののみフィルタリング
    const filteredComments = (comments || []).filter(
      (item: any) => item.preset_question_answer !== null
    )

    // 総件数を取得
    const { count } = await supabaseAdmin
      .from('preset_question_answer_comment')
      .select('id, preset_question_answer!inner(company_id)', { count: 'exact', head: true })
      .eq('preset_question_answer.company_id', companyId)

    return new Response(
      JSON.stringify({
        success: true,
        data: filteredComments,
        total: count || 0,
        limit,
        offset
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Get preset comments error:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
