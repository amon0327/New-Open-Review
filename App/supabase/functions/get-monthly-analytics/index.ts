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
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

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
    const yearMonth = url.searchParams.get('year_month')

    if (!companyId || !storeId) {
      throw new Error('company_idとstore_idが必要です')
    }

    // ユーザーが企業にアクセス可能かチェック
    const { data: companyMembership } = await supabaseAdmin
      .from('company_memberships')
      .select('id')
      .eq('business_user_id', user.id)
      .eq('company_id', companyId)
      .single()

    const { data: partnerAccess } = await supabaseAdmin
      .from('partner_affiliate_companies')
      .select(`
        id,
        partner_memberships!inner (
          id,
          business_users_id
        )
      `)
      .eq('companies_id', companyId)
      .eq('partner_memberships.business_users_id', user.id)

    const hasAccess = companyMembership || (partnerAccess && partnerAccess.length > 0)

    if (!hasAccess) {
      throw new Error('この企業のデータにアクセスする権限がありません')
    }

    // 利用可能な期間リストを取得
    const { data: availablePeriodsData, error: periodsError } = await supabaseAdmin
      .from('monthly_analytics_summary')
      .select('year_month')
      .eq('company_id', companyId)
      .eq('store_id', storeId)
      .order('year_month', { ascending: false })

    if (periodsError) {
      console.error('Error fetching available periods:', periodsError)
    }

    const availablePeriods = (availablePeriodsData || []).map(d => d.year_month)

    // 年月が指定されていない場合は最新の月を使用
    let targetYearMonth = yearMonth
    if (!targetYearMonth && availablePeriods.length > 0) {
      targetYearMonth = availablePeriods[0]
    } else if (!targetYearMonth) {
      const now = new Date()
      const jstOffset = 9 * 60 * 60 * 1000
      const jstNow = new Date(now.getTime() + jstOffset)
      targetYearMonth = `${jstNow.getFullYear()}-${String(jstNow.getMonth() + 1).padStart(2, '0')}`
    }

    // monthly_analytics_summaryからデータを取得
    const { data: summary, error: summaryError } = await supabaseAdmin
      .from('monthly_analytics_summary')
      .select('*')
      .eq('company_id', companyId)
      .eq('store_id', storeId)
      .eq('year_month', targetYearMonth)
      .single()

    if (summaryError && summaryError.code !== 'PGRST116') {
      throw new Error(`データの取得に失敗しました: ${summaryError.message}`)
    }

    if (!summary) {
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            availablePeriods,
            yearMonth: targetYearMonth,
            overview: null,
            salesImpact: null,
            storeEvaluation: null,
            customerTrends: null
          },
          message: 'このストアの該当月のデータがありません'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // 概要タブ用データ変換
    const overviewData = {
      totalResponses: summary.total_responses,
      npsDistribution: {
        promoters: summary.nps_promoters_percent,
        passives: summary.nps_passives_percent,
        detractors: summary.nps_detractors_percent,
        npsScore: summary.nps_score
      },
      kpi: {
        nps: { current: summary.nps_score, delta: 0, sparkline: [summary.nps_score] },
        repeatRate: { current: summary.repeat_rate, delta: 0, sparkline: [summary.repeat_rate] },
        repeaterRevisit: { current: summary.repeater_revisit_rate, delta: 0, sparkline: [summary.repeater_revisit_rate] },
        newRevisit: { current: summary.new_revisit_rate, delta: 0, sparkline: [summary.new_revisit_rate] }
      },
      monthlyPerformance: [{
        month: targetYearMonth,
        nps: summary.nps_score,
        repeatRate: summary.repeat_rate,
        repeatVisit: summary.repeater_revisit_rate,
        newVisit: summary.new_revisit_rate,
        responseCount: summary.total_responses
      }]
    }

    // 売上影響タブ用データ変換
    const segments = [
      {
        id: 1,
        name: 'ロイヤル顧客',
        npsLabel: '推奨者',
        revisitLabel: '再来店あり',
        customerLabel: 'リピーター',
        count: summary.seg_promoter_revisit_repeater_count,
        percentage: summary.seg_promoter_revisit_repeater_percent,
        impact: 'positive',
        color: 'emerald'
      },
      {
        id: 2,
        name: '期待の新規',
        npsLabel: '推奨者',
        revisitLabel: '再来店あり',
        customerLabel: '新規',
        count: summary.seg_promoter_revisit_new_count,
        percentage: summary.seg_promoter_revisit_new_percent,
        impact: 'positive',
        color: 'emerald'
      },
      {
        id: 3,
        name: '離脱リスク推奨者',
        npsLabel: '推奨者',
        revisitLabel: '再来店なし',
        customerLabel: 'リピーター',
        count: summary.seg_promoter_norevisit_repeater_count,
        percentage: summary.seg_promoter_norevisit_repeater_percent,
        impact: 'warning',
        color: 'amber'
      },
      {
        id: 4,
        name: '一見推奨者',
        npsLabel: '推奨者',
        revisitLabel: '再来店なし',
        customerLabel: '新規',
        count: summary.seg_promoter_norevisit_new_count,
        percentage: summary.seg_promoter_norevisit_new_percent,
        impact: 'warning',
        color: 'amber'
      },
      {
        id: 5,
        name: '安定中立',
        npsLabel: '中立者',
        revisitLabel: '再来店あり',
        customerLabel: 'リピーター',
        count: summary.seg_passive_revisit_repeater_count,
        percentage: summary.seg_passive_revisit_repeater_percent,
        impact: 'positive',
        color: 'blue'
      },
      {
        id: 6,
        name: '様子見新規',
        npsLabel: '中立者',
        revisitLabel: '再来店あり',
        customerLabel: '新規',
        count: summary.seg_passive_revisit_new_count,
        percentage: summary.seg_passive_revisit_new_percent,
        impact: 'positive',
        color: 'blue'
      },
      {
        id: 7,
        name: '離脱リスク中立',
        npsLabel: '中立者',
        revisitLabel: '再来店なし',
        customerLabel: 'リピーター',
        count: summary.seg_passive_norevisit_repeater_count,
        percentage: summary.seg_passive_norevisit_repeater_percent,
        impact: 'negative',
        color: 'orange'
      },
      {
        id: 8,
        name: '低関心新規',
        npsLabel: '中立者',
        revisitLabel: '再来店なし',
        customerLabel: '新規',
        count: summary.seg_passive_norevisit_new_count,
        percentage: summary.seg_passive_norevisit_new_percent,
        impact: 'negative',
        color: 'orange'
      },
      {
        id: 9,
        name: '不満継続',
        npsLabel: '批判者',
        revisitLabel: '再来店あり',
        customerLabel: 'リピーター',
        count: summary.seg_detractor_revisit_repeater_count,
        percentage: summary.seg_detractor_revisit_repeater_percent,
        impact: 'warning',
        color: 'rose'
      },
      {
        id: 10,
        name: '改善余地新規',
        npsLabel: '批判者',
        revisitLabel: '再来店あり',
        customerLabel: '新規',
        count: summary.seg_detractor_revisit_new_count,
        percentage: summary.seg_detractor_revisit_new_percent,
        impact: 'warning',
        color: 'rose'
      },
      {
        id: 11,
        name: 'リピーター離脱',
        npsLabel: '批判者',
        revisitLabel: '再来店なし',
        customerLabel: 'リピーター',
        count: summary.seg_detractor_norevisit_repeater_count,
        percentage: summary.seg_detractor_norevisit_repeater_percent,
        impact: 'negative',
        color: 'red'
      },
      {
        id: 12,
        name: '新規離脱',
        npsLabel: '批判者',
        revisitLabel: '再来店なし',
        customerLabel: '新規',
        count: summary.seg_detractor_norevisit_new_count,
        percentage: summary.seg_detractor_norevisit_new_percent,
        impact: 'negative',
        color: 'red'
      }
    ]

    // 各セグメントにimpact値（数値）を追加
    const segmentsWithImpact = segments.map(seg => {
      let impactValue = 0;
      if (seg.impact === 'positive') impactValue = 3;
      else if (seg.impact === 'warning') impactValue = 1;
      else if (seg.impact === 'negative') impactValue = -3;
      return { ...seg, impact: impactValue };
    });

    // 総カウント
    const totalCount = segmentsWithImpact.reduce((sum, seg) => sum + (seg.count || 0), 0);

    // スコア計算
    const positiveScore = summary.positive_impact_count || 0;
    const negativeScore = summary.negative_impact_count || 0;
    const totalScore = positiveScore - negativeScore;
    const normalizedScore = totalCount > 0
      ? Math.round(((positiveScore / totalCount) * 100))
      : 50;

    // 4カテゴリーのデータを集計
    // 新規離脱: 新規 + 再来店なし
    const newChurnCount = (summary.seg_promoter_norevisit_new_count || 0) +
      (summary.seg_passive_norevisit_new_count || 0) +
      (summary.seg_detractor_norevisit_new_count || 0);

    // 新規リピーター: 新規 + 再来店あり
    const newRepeatersCount = (summary.seg_promoter_revisit_new_count || 0) +
      (summary.seg_passive_revisit_new_count || 0) +
      (summary.seg_detractor_revisit_new_count || 0);

    // 安定リピーター: リピーター + 再来店あり
    const stableRepeatersCount = (summary.seg_promoter_revisit_repeater_count || 0) +
      (summary.seg_passive_revisit_repeater_count || 0) +
      (summary.seg_detractor_revisit_repeater_count || 0);

    // リピーター離脱: リピーター + 再来店なし
    const churnRiskCount = (summary.seg_promoter_norevisit_repeater_count || 0) +
      (summary.seg_passive_norevisit_repeater_count || 0) +
      (summary.seg_detractor_norevisit_repeater_count || 0);

    const categoryData = {
      newChurn: {
        count: newChurnCount,
        impact: -3,
        nps: {
          promoters: summary.seg_promoter_norevisit_new_count || 0,
          neutrals: summary.seg_passive_norevisit_new_count || 0,
          detractors: summary.seg_detractor_norevisit_new_count || 0
        }
      },
      newRepeaters: {
        count: newRepeatersCount,
        impact: 3,
        nps: {
          promoters: summary.seg_promoter_revisit_new_count || 0,
          neutrals: summary.seg_passive_revisit_new_count || 0,
          detractors: summary.seg_detractor_revisit_new_count || 0
        }
      },
      stableRepeaters: {
        count: stableRepeatersCount,
        impact: 3,
        nps: {
          promoters: summary.seg_promoter_revisit_repeater_count || 0,
          neutrals: summary.seg_passive_revisit_repeater_count || 0,
          detractors: summary.seg_detractor_revisit_repeater_count || 0
        }
      },
      churnRisk: {
        count: churnRiskCount,
        impact: -3,
        nps: {
          promoters: summary.seg_promoter_norevisit_repeater_count || 0,
          neutrals: summary.seg_passive_norevisit_repeater_count || 0,
          detractors: summary.seg_detractor_norevisit_repeater_count || 0
        }
      }
    };

    const salesImpactData = {
      segments: segmentsWithImpact,
      totalCount,
      totalScore,
      positiveScore,
      negativeScore,
      normalizedScore,
      trendData: [], // 月次サマリーには過去データがないため空
      categoryData,
      compositionData: [],
      avgComposition: { newChurn: 0, newRepeaters: 0, stableRepeaters: 0, churnRisk: 0 },
      positiveImpact: {
        count: summary.positive_impact_count,
        percent: summary.positive_impact_percent
      },
      negativeImpact: {
        count: summary.negative_impact_count,
        percent: summary.negative_impact_percent
      }
    }

    // 店舗評価タブ用データ変換
    const qualityLabels = [
      '料理の味', '料理の見た目', '料理の量/ボリューム', 'ドリンクの味',
      'ドリンクの温度', '食べたい料理', '飲みたいドリンク', 'メニューの種類',
      '料理・ドリンクの温度', '特徴や独自性'
    ]
    const serviceLabels = [
      '入店時の挨拶', '席への案内', '注文時の対応', 'メニュー説明・提案',
      '提供スピード', '注文・提供の正確さ', 'スタッフの気配り',
      'スタッフの笑顔・感じの良さ', 'スタッフの言葉遣い', '特に良かったスタッフ'
    ]
    const cleanlinessLabels = [
      '店舗外観・入口', 'テーブル', '椅子・ソファ', '床', '食器・カトラリー',
      'メニュー表・卓上備品', 'トイレ', '店内の空気や匂い', '店内の整理整頓',
      'スタッフの身だしなみ'
    ]

    const buildQscItems = (prefix: string, labels: string[]) => {
      return labels.map((label, i) => {
        const num = i + 1
        return {
          label,
          positive: summary[`${prefix}${num}_positive_percent`] || 0,
          negative: summary[`${prefix}${num}_negative_percent`] || 0,
          neutral: summary[`${prefix}${num}_neutral_percent`] || 0,
          total: summary[`${prefix}${num}_total_count`] || 0
        }
      })
    }

    const storeEvaluationData = {
      qscScores: {
        Q: {
          score: summary.qsc_quality_score,
          count: summary.qsc_quality_count,
          label: 'クオリティ',
          color: 'violet'
        },
        S: {
          score: summary.qsc_service_score,
          count: summary.qsc_service_count,
          label: 'サービス',
          color: 'blue'
        },
        C: {
          score: summary.qsc_cleanliness_score,
          count: summary.qsc_cleanliness_count,
          label: 'クレンリネス',
          color: 'emerald'
        }
      },
      qscDetailedData: {
        Q: {
          label: 'Quality',
          items: buildQscItems('q', qualityLabels),
          positiveCount: summary.quality_positive_count,
          negativeCount: summary.quality_negative_count,
          neutralCount: summary.quality_neutral_count
        },
        S: {
          label: 'Service',
          items: buildQscItems('s', serviceLabels),
          positiveCount: summary.service_positive_count,
          negativeCount: summary.service_negative_count,
          neutralCount: summary.service_neutral_count
        },
        C: {
          label: 'Cleanliness',
          items: buildQscItems('c', cleanlinessLabels),
          positiveCount: summary.cleanliness_positive_count,
          negativeCount: summary.cleanliness_negative_count,
          neutralCount: summary.cleanliness_neutral_count
        }
      },
      totalResponses: summary.total_responses
    }

    // 顧客傾向タブ用データ変換
    const customerTrendsData = {
      totalResponses: summary.total_responses,
      genderDistribution: [
        { name: '男性', value: summary.gender_male_percent, count: summary.gender_male_count },
        { name: '女性', value: summary.gender_female_percent, count: summary.gender_female_count },
        { name: 'その他', value: summary.gender_other_percent, count: summary.gender_other_count }
      ].filter(g => g.count > 0),
      customerTypeDistribution: [
        { name: 'リピーター', value: summary.repeater_count > 0 ? Math.round((summary.repeater_count / (summary.repeater_count + summary.new_customer_count)) * 100) : 0, count: summary.repeater_count },
        { name: '新規', value: summary.new_customer_count > 0 ? Math.round((summary.new_customer_count / (summary.repeater_count + summary.new_customer_count)) * 100) : 0, count: summary.new_customer_count }
      ],
      ageDistribution: [
        { name: '20代', value: summary.age_20s_percent, count: summary.age_20s_count },
        { name: '30代', value: summary.age_30s_percent, count: summary.age_30s_count },
        { name: '40代', value: summary.age_40s_percent, count: summary.age_40s_count },
        { name: '50代', value: summary.age_50s_percent, count: summary.age_50s_count },
        { name: '60代以上', value: summary.age_60plus_percent, count: summary.age_60plus_count }
      ],
      companionDistribution: [
        { name: '1人', value: summary.companion_alone_percent, count: summary.companion_alone_count },
        { name: 'カップル', value: summary.companion_couple_percent, count: summary.companion_couple_count },
        { name: '友人', value: summary.companion_friends_percent, count: summary.companion_friends_count },
        { name: '家族', value: summary.companion_family_percent, count: summary.companion_family_count },
        { name: 'ビジネス', value: summary.companion_business_percent, count: summary.companion_business_count },
        { name: 'その他', value: summary.companion_other_percent, count: summary.companion_other_count }
      ].filter(c => c.count > 0),
      radarData: [
        { category: '品質', total: summary.pref_total_quality, repeater: summary.pref_repeater_quality, newCustomer: summary.pref_new_quality },
        { category: '接客', total: summary.pref_total_service, repeater: summary.pref_repeater_service, newCustomer: summary.pref_new_service },
        { category: '空間', total: summary.pref_total_atmosphere, repeater: summary.pref_repeater_atmosphere, newCustomer: summary.pref_new_atmosphere },
        { category: '衛生', total: summary.pref_total_hygiene, repeater: summary.pref_repeater_hygiene, newCustomer: summary.pref_new_hygiene },
        { category: '価格感度', total: summary.pref_total_price, repeater: summary.pref_repeater_price, newCustomer: summary.pref_new_price }
      ]
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          availablePeriods,
          yearMonth: targetYearMonth,
          overview: overviewData,
          salesImpact: salesImpactData,
          storeEvaluation: storeEvaluationData,
          customerTrends: customerTrendsData,
          raw: summary
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Get monthly analytics error:', error)

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
