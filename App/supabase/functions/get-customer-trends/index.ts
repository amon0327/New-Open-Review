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
    const { data: userPartnerMemberships } = await supabaseAdmin
      .from('partner_memberships')
      .select('partner_company_id')
      .eq('business_users_id', user.id)
      .eq('is_active', true)

    let partnerAccess = null
    if (userPartnerMemberships && userPartnerMemberships.length > 0) {
      const partnerCompanyIds = userPartnerMemberships.map(pm => pm.partner_company_id)
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

    // 回答データを取得
    let query = supabaseAdmin
      .from('preset_question_answer')
      .select(`
        id,
        created_at,
        p1_q3,
        p1_q4,
        p1_q5,
        p1_q6,
        p2_q1,
        p2_q2,
        p2_q3,
        store_id,
        company_id
      `)
      .eq('company_id', companyId)

    if (storeId && storeId !== 'all') {
      query = query.eq('store_id', storeId)
    }

    const { data: answers, error: answersError } = await query

    if (answersError) {
      throw new Error(`データの取得に失敗しました: ${answersError.message}`)
    }

    const allAnswers = answers || []
    const totalCount = allAnswers.length

    // === 性別分布 ===
    const genderCounts: Record<string, number> = {}
    allAnswers.forEach(a => {
      if (a.p1_q4) {
        genderCounts[a.p1_q4] = (genderCounts[a.p1_q4] || 0) + 1
      }
    })
    const genderTotal = Object.values(genderCounts).reduce((a, b) => a + b, 0)
    const genderDistribution = Object.entries(genderCounts).map(([gender, count]) => ({
      name: gender,
      value: genderTotal > 0 ? Math.round((count / genderTotal) * 100) : 0,
      count: count
    }))

    // === 顧客タイプ（リピーター/新規）===
    const repeaterCount = allAnswers.filter(a => a.p1_q3 && a.p1_q3 !== '初めて').length
    const newCustomerCount = allAnswers.filter(a => a.p1_q3 === '初めて').length
    const customerTypeTotal = repeaterCount + newCustomerCount
    const customerTypeDistribution = [
      {
        name: 'リピーター',
        value: customerTypeTotal > 0 ? Math.round((repeaterCount / customerTypeTotal) * 100) : 0,
        count: repeaterCount
      },
      {
        name: '新規',
        value: customerTypeTotal > 0 ? Math.round((newCustomerCount / customerTypeTotal) * 100) : 0,
        count: newCustomerCount
      }
    ]

    // === 年齢分布 ===
    const ageGroups: Record<string, number> = {
      '20代': 0,
      '30代': 0,
      '40代': 0,
      '50代': 0,
      '60代以上': 0
    }
    allAnswers.forEach(a => {
      const age = a.p1_q5 || ''
      if (age.includes('20') || age.includes('25') || age.includes('29') || age === '20代') {
        ageGroups['20代']++
      } else if (age.includes('30') || age.includes('35') || age.includes('39') || age === '30代') {
        ageGroups['30代']++
      } else if (age.includes('40') || age.includes('45') || age.includes('49') || age === '40代') {
        ageGroups['40代']++
      } else if (age.includes('50') || age.includes('55') || age.includes('59') || age === '50代') {
        ageGroups['50代']++
      } else if (age.includes('60') || age.includes('65') || age.includes('70') || age === '60代' || age === '60代以上') {
        ageGroups['60代以上']++
      }
    })
    const ageTotal = Object.values(ageGroups).reduce((a, b) => a + b, 0)
    const ageDistribution = Object.entries(ageGroups).map(([age, count]) => ({
      name: age,
      value: ageTotal > 0 ? Math.round((count / ageTotal) * 100) : 0,
      count: count
    }))

    // === 同行者分布（来店目的の代わり）===
    const companionCounts: Record<string, number> = {}
    allAnswers.forEach(a => {
      if (a.p1_q6) {
        companionCounts[a.p1_q6] = (companionCounts[a.p1_q6] || 0) + 1
      }
    })
    const companionTotal = Object.values(companionCounts).reduce((a, b) => a + b, 0)
    const companionDistribution = Object.entries(companionCounts).map(([companion, count]) => ({
      name: companion,
      value: companionTotal > 0 ? Math.round((count / companionTotal) * 100) : 0,
      count: count
    }))

    // === 顧客の重視ポイント（preset_answer_user_featuresから取得）===
    // top_preference: 1位の重視ポイント（重み2）
    // second_preference: 2位の重視ポイント（重み1）
    // カテゴリ: 品質, 接客, 空間, 衛生, 価格感度

    // preset_answer_user_featuresとpreset_question_answerを結合して取得
    let featuresQuery = supabaseAdmin
      .from('preset_answer_user_features')
      .select(`
        id,
        top_preference,
        second_preference,
        review_form_submission_id,
        store_id,
        company_id
      `)
      .eq('company_id', companyId)

    if (storeId && storeId !== 'all') {
      featuresQuery = featuresQuery.eq('store_id', storeId)
    }

    const { data: userFeatures, error: featuresError } = await featuresQuery

    if (featuresError) {
      console.error('User features fetch error:', featuresError)
    }

    const allFeatures = userFeatures || []

    // review_form_submission_idを取得してpreset_question_answerと紐付け
    const submissionIds = allFeatures
      .filter(f => f.review_form_submission_id)
      .map(f => f.review_form_submission_id)

    // preset_question_answerからreview_form_submission_idでp1_q3（リピーター判定）を取得
    let customerTypeMap: Record<string, string> = {}
    if (submissionIds.length > 0) {
      const { data: answerData } = await supabaseAdmin
        .from('preset_question_answer')
        .select('review_form_submission_id, p1_q3')
        .in('review_form_submission_id', submissionIds)

      if (answerData) {
        answerData.forEach(a => {
          if (a.review_form_submission_id) {
            customerTypeMap[a.review_form_submission_id] = a.p1_q3 || ''
          }
        })
      }
    }

    // 重み付けスコア計算関数（生のスコアを返す）
    const preferenceCategories = ['品質', '接客', '空間', '衛生', '価格感度']
    const TOP_WEIGHT = 2  // 1位の重み
    const SECOND_WEIGHT = 1  // 2位の重み

    const calculateRawScores = (features: any[]) => {
      const scores: Record<string, number> = {}
      preferenceCategories.forEach(cat => scores[cat] = 0)

      features.forEach(f => {
        if (f.top_preference && preferenceCategories.includes(f.top_preference)) {
          scores[f.top_preference] += TOP_WEIGHT
        }
        if (f.second_preference && preferenceCategories.includes(f.second_preference)) {
          scores[f.second_preference] += SECOND_WEIGHT
        }
      })

      return scores
    }

    // 最大値を100として正規化する関数
    const normalizeToMax100 = (scores: Record<string, number>) => {
      const maxValue = Math.max(...Object.values(scores))
      const normalizedScores: Record<string, number> = {}

      preferenceCategories.forEach(cat => {
        normalizedScores[cat] = maxValue > 0
          ? Math.round((scores[cat] / maxValue) * 100)
          : 0
      })

      return normalizedScores
    }

    // リピーターと新規でフィルタリング
    const repeaterFeatures = allFeatures.filter(f => {
      const customerType = f.review_form_submission_id
        ? customerTypeMap[f.review_form_submission_id]
        : ''
      return customerType && customerType !== '初めて'
    })

    const newCustomerFeatures = allFeatures.filter(f => {
      const customerType = f.review_form_submission_id
        ? customerTypeMap[f.review_form_submission_id]
        : ''
      return customerType === '初めて'
    })

    // 各グループの生スコアを計算
    const totalRawScores = calculateRawScores(allFeatures)
    const repeaterRawScores = calculateRawScores(repeaterFeatures)
    const newCustomerRawScores = calculateRawScores(newCustomerFeatures)

    // 各グループで最大値を100として正規化
    const totalPreferenceScores = normalizeToMax100(totalRawScores)
    const repeaterPreferenceScores = normalizeToMax100(repeaterRawScores)
    const newCustomerPreferenceScores = normalizeToMax100(newCustomerRawScores)

    // レーダーチャート用データ
    const radarData = preferenceCategories.map(cat => ({
      category: cat,
      total: totalPreferenceScores[cat],
      repeater: repeaterPreferenceScores[cat],
      newCustomer: newCustomerPreferenceScores[cat]
    }))

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          totalResponses: totalCount,
          genderDistribution,
          customerTypeDistribution,
          ageDistribution,
          companionDistribution,
          radarData
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Get customer trends error:', error)

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
