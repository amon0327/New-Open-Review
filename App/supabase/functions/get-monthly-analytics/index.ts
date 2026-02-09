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

    if (!companyId) {
      throw new Error('company_idが必要です')
    }

    const isAllStores = !storeId || storeId === 'all'

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

    // 利用可能な期間リストを取得
    let availablePeriodsQuery = supabaseAdmin
      .from('monthly_analytics_summary')
      .select('year_month')
      .eq('company_id', companyId)

    if (!isAllStores) {
      availablePeriodsQuery = availablePeriodsQuery.eq('store_id', storeId)
    }

    const { data: availablePeriodsData, error: periodsError } = await availablePeriodsQuery
      .order('year_month', { ascending: false })

    if (periodsError) {
      console.error('Error fetching available periods:', periodsError)
    }

    // 重複を除去
    const availablePeriods = [...new Set((availablePeriodsData || []).map(d => d.year_month))]

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
    let summary: any = null

    // 企業に紐づく全店舗リストを取得（パートナーアクセス対応）
    let allCompanyStores: { id: string; name: string }[] = []
    const { data: allStoresResult } = await supabaseAdmin
      .from('stores')
      .select('id, name')
      .eq('company_id', companyId)
      .order('name')
    allCompanyStores = allStoresResult || []

    // レポートが存在する店舗リストを取得
    let storesWithReports: { id: string; name: string }[] = []
    if (isAllStores) {
      // 全店舗の場合：レポートが存在する店舗を取得
      const { data: reportStoreIds } = await supabaseAdmin
        .from('monthly_analytics_summary')
        .select('store_id')
        .eq('company_id', companyId)

      const uniqueStoreIds = [...new Set((reportStoreIds || []).map(r => r.store_id))]

      if (uniqueStoreIds.length > 0) {
        const { data: storesData } = await supabaseAdmin
          .from('stores')
          .select('id, name')
          .in('id', uniqueStoreIds)
          .order('name')

        storesWithReports = storesData || []
      }
    }

    if (isAllStores) {
      // 全店舗の場合：company_idで全店舗のデータを取得し、加重平均を計算
      const { data: allStoresData, error: allStoresError } = await supabaseAdmin
        .from('monthly_analytics_summary')
        .select('*')
        .eq('company_id', companyId)
        .eq('year_month', targetYearMonth)

      if (allStoresError) {
        throw new Error(`データの取得に失敗しました: ${allStoresError.message}`)
      }

      if (!allStoresData || allStoresData.length === 0) {
        return new Response(
          JSON.stringify({
            success: true,
            data: {
              availablePeriods,
              storesWithReports,
              allCompanyStores,
              yearMonth: targetYearMonth,
              overview: null,
              salesImpact: null,
              storeEvaluation: null,
              customerTrends: null
            },
            message: 'この企業の該当月のデータがありません'
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        )
      }

      // 加重平均を計算する関数
      const weightedAverage = (data: any[], valueKey: string, weightKey: string): number => {
        let totalWeight = 0
        let weightedSum = 0
        for (const item of data) {
          const value = Number(item[valueKey]) || 0
          const weight = Number(item[weightKey]) || 0
          weightedSum += value * weight
          totalWeight += weight
        }
        return totalWeight > 0 ? weightedSum / totalWeight : 0
      }

      // 単純合計
      const sum = (data: any[], key: string): number => {
        return data.reduce((acc, item) => acc + (Number(item[key]) || 0), 0)
      }

      // 全店舗の集計データを作成
      const totalResponses = sum(allStoresData, 'total_responses')

      // NPS関連（total_responsesで加重平均）
      const npsPromotersCount = sum(allStoresData, 'nps_promoters_count')
      const npsPassivesCount = sum(allStoresData, 'nps_passives_count')
      const npsDetractorsCount = sum(allStoresData, 'nps_detractors_count')
      const npsTotal = npsPromotersCount + npsPassivesCount + npsDetractorsCount
      const npsPromotersPercent = npsTotal > 0 ? Math.round((npsPromotersCount / npsTotal) * 100) : 0
      const npsPassivesPercent = npsTotal > 0 ? Math.round((npsPassivesCount / npsTotal) * 100) : 0
      const npsDetractorsPercent = npsTotal > 0 ? Math.round((npsDetractorsCount / npsTotal) * 100) : 0
      const npsScore = npsPromotersPercent - npsDetractorsPercent

      // リピート率関連
      const repeaterCount = sum(allStoresData, 'repeater_count')
      const newCustomerCount = sum(allStoresData, 'new_customer_count')
      const totalCustomers = repeaterCount + newCustomerCount
      const repeatRate = totalCustomers > 0 ? (repeaterCount / totalCustomers) * 100 : 0

      // 再来店意向関連
      const repeaterRevisitYes = sum(allStoresData, 'repeater_revisit_yes_count')
      const repeaterRevisitNo = sum(allStoresData, 'repeater_revisit_no_count')
      const repeaterRevisitTotal = repeaterRevisitYes + repeaterRevisitNo
      const repeaterRevisitRate = repeaterRevisitTotal > 0 ? (repeaterRevisitYes / repeaterRevisitTotal) * 100 : 0

      const newRevisitYes = sum(allStoresData, 'new_revisit_yes_count')
      const newRevisitNo = sum(allStoresData, 'new_revisit_no_count')
      const newRevisitTotal = newRevisitYes + newRevisitNo
      const newRevisitRate = newRevisitTotal > 0 ? (newRevisitYes / newRevisitTotal) * 100 : 0

      // 12セグメント（合計からパーセント再計算）
      const segmentFields = [
        'seg_promoter_revisit_repeater', 'seg_promoter_revisit_new',
        'seg_promoter_norevisit_repeater', 'seg_promoter_norevisit_new',
        'seg_passive_revisit_repeater', 'seg_passive_revisit_new',
        'seg_passive_norevisit_repeater', 'seg_passive_norevisit_new',
        'seg_detractor_revisit_repeater', 'seg_detractor_revisit_new',
        'seg_detractor_norevisit_repeater', 'seg_detractor_norevisit_new'
      ]

      const segmentCounts: Record<string, number> = {}
      let segmentTotal = 0
      for (const field of segmentFields) {
        segmentCounts[field] = sum(allStoresData, `${field}_count`)
        segmentTotal += segmentCounts[field]
      }

      const segmentPercents: Record<string, number> = {}
      for (const field of segmentFields) {
        segmentPercents[field] = segmentTotal > 0
          ? Number(((segmentCounts[field] / segmentTotal) * 100).toFixed(2))
          : 0
      }

      // 影響度
      const positiveImpactCount = sum(allStoresData, 'positive_impact_count')
      const negativeImpactCount = sum(allStoresData, 'negative_impact_count')
      const impactTotal = positiveImpactCount + negativeImpactCount
      const positiveImpactPercent = impactTotal > 0 ? (positiveImpactCount / impactTotal) * 100 : 0
      const negativeImpactPercent = impactTotal > 0 ? (negativeImpactCount / impactTotal) * 100 : 0

      // QSC（各カテゴリの回答数で加重平均）
      const qscQualityCount = sum(allStoresData, 'qsc_quality_count')
      const qscServiceCount = sum(allStoresData, 'qsc_service_count')
      const qscCleanlinessCount = sum(allStoresData, 'qsc_cleanliness_count')
      const qscQualityScore = weightedAverage(allStoresData, 'qsc_quality_score', 'qsc_quality_count')
      const qscServiceScore = weightedAverage(allStoresData, 'qsc_service_score', 'qsc_service_count')
      const qscCleanlinessScore = weightedAverage(allStoresData, 'qsc_cleanliness_score', 'qsc_cleanliness_count')

      // QSC項目別（各項目のtotal_countで加重平均）
      const qscItemAverages: Record<string, number> = {}
      for (const prefix of ['q', 's', 'c']) {
        for (let i = 1; i <= 10; i++) {
          const totalCountKey = `${prefix}${i}_total_count`
          const totalCount = sum(allStoresData, totalCountKey)
          qscItemAverages[totalCountKey] = totalCount
          for (const type of ['positive', 'negative', 'neutral']) {
            const key = `${prefix}${i}_${type}_percent`
            qscItemAverages[key] = weightedAverage(allStoresData, key, totalCountKey)
          }
        }
      }

      // QSCカテゴリ別集計（合計）
      const qualityPositiveCount = sum(allStoresData, 'quality_positive_count')
      const qualityNegativeCount = sum(allStoresData, 'quality_negative_count')
      const qualityNeutralCount = sum(allStoresData, 'quality_neutral_count')
      const servicePositiveCount = sum(allStoresData, 'service_positive_count')
      const serviceNegativeCount = sum(allStoresData, 'service_negative_count')
      const serviceNeutralCount = sum(allStoresData, 'service_neutral_count')
      const cleanlinessPositiveCount = sum(allStoresData, 'cleanliness_positive_count')
      const cleanlinessNegativeCount = sum(allStoresData, 'cleanliness_negative_count')
      const cleanlinessNeutralCount = sum(allStoresData, 'cleanliness_neutral_count')

      // 性別分布（合計からパーセント再計算）
      const genderMaleCount = sum(allStoresData, 'gender_male_count')
      const genderFemaleCount = sum(allStoresData, 'gender_female_count')
      const genderOtherCount = sum(allStoresData, 'gender_other_count')
      const genderTotal = genderMaleCount + genderFemaleCount + genderOtherCount
      const genderMalePercent = genderTotal > 0 ? Math.round((genderMaleCount / genderTotal) * 100) : 0
      const genderFemalePercent = genderTotal > 0 ? Math.round((genderFemaleCount / genderTotal) * 100) : 0
      const genderOtherPercent = genderTotal > 0 ? Math.round((genderOtherCount / genderTotal) * 100) : 0

      // 年齢分布（合計からパーセント再計算）
      const age20sCount = sum(allStoresData, 'age_20s_count')
      const age30sCount = sum(allStoresData, 'age_30s_count')
      const age40sCount = sum(allStoresData, 'age_40s_count')
      const age50sCount = sum(allStoresData, 'age_50s_count')
      const age60plusCount = sum(allStoresData, 'age_60plus_count')
      const ageTotal = age20sCount + age30sCount + age40sCount + age50sCount + age60plusCount
      const age20sPercent = ageTotal > 0 ? Math.round((age20sCount / ageTotal) * 100) : 0
      const age30sPercent = ageTotal > 0 ? Math.round((age30sCount / ageTotal) * 100) : 0
      const age40sPercent = ageTotal > 0 ? Math.round((age40sCount / ageTotal) * 100) : 0
      const age50sPercent = ageTotal > 0 ? Math.round((age50sCount / ageTotal) * 100) : 0
      const age60plusPercent = ageTotal > 0 ? Math.round((age60plusCount / ageTotal) * 100) : 0

      // 同行者分布（合計からパーセント再計算）
      const companionAloneCount = sum(allStoresData, 'companion_alone_count')
      const companionCoupleCount = sum(allStoresData, 'companion_couple_count')
      const companionFriendsCount = sum(allStoresData, 'companion_friends_count')
      const companionFamilyCount = sum(allStoresData, 'companion_family_count')
      const companionBusinessCount = sum(allStoresData, 'companion_business_count')
      const companionOtherCount = sum(allStoresData, 'companion_other_count')
      const companionTotal = companionAloneCount + companionCoupleCount + companionFriendsCount +
                            companionFamilyCount + companionBusinessCount + companionOtherCount
      const companionAlonePercent = companionTotal > 0 ? Math.round((companionAloneCount / companionTotal) * 100) : 0
      const companionCouplePercent = companionTotal > 0 ? Math.round((companionCoupleCount / companionTotal) * 100) : 0
      const companionFriendsPercent = companionTotal > 0 ? Math.round((companionFriendsCount / companionTotal) * 100) : 0
      const companionFamilyPercent = companionTotal > 0 ? Math.round((companionFamilyCount / companionTotal) * 100) : 0
      const companionBusinessPercent = companionTotal > 0 ? Math.round((companionBusinessCount / companionTotal) * 100) : 0
      const companionOtherPercent = companionTotal > 0 ? Math.round((companionOtherCount / companionTotal) * 100) : 0

      // 顧客重視ポイント（total_responsesで加重平均）
      const prefTotalQuality = Math.round(weightedAverage(allStoresData, 'pref_total_quality', 'total_responses'))
      const prefTotalService = Math.round(weightedAverage(allStoresData, 'pref_total_service', 'total_responses'))
      const prefTotalAtmosphere = Math.round(weightedAverage(allStoresData, 'pref_total_atmosphere', 'total_responses'))
      const prefTotalHygiene = Math.round(weightedAverage(allStoresData, 'pref_total_hygiene', 'total_responses'))
      const prefTotalPrice = Math.round(weightedAverage(allStoresData, 'pref_total_price', 'total_responses'))
      const prefRepeaterQuality = Math.round(weightedAverage(allStoresData, 'pref_repeater_quality', 'repeater_count'))
      const prefRepeaterService = Math.round(weightedAverage(allStoresData, 'pref_repeater_service', 'repeater_count'))
      const prefRepeaterAtmosphere = Math.round(weightedAverage(allStoresData, 'pref_repeater_atmosphere', 'repeater_count'))
      const prefRepeaterHygiene = Math.round(weightedAverage(allStoresData, 'pref_repeater_hygiene', 'repeater_count'))
      const prefRepeaterPrice = Math.round(weightedAverage(allStoresData, 'pref_repeater_price', 'repeater_count'))
      const prefNewQuality = Math.round(weightedAverage(allStoresData, 'pref_new_quality', 'new_customer_count'))
      const prefNewService = Math.round(weightedAverage(allStoresData, 'pref_new_service', 'new_customer_count'))
      const prefNewAtmosphere = Math.round(weightedAverage(allStoresData, 'pref_new_atmosphere', 'new_customer_count'))
      const prefNewHygiene = Math.round(weightedAverage(allStoresData, 'pref_new_hygiene', 'new_customer_count'))
      const prefNewPrice = Math.round(weightedAverage(allStoresData, 'pref_new_price', 'new_customer_count'))

      // 集計済みsummaryオブジェクトを作成
      summary = {
        company_id: companyId,
        store_id: 'all',
        year_month: targetYearMonth,
        total_responses: totalResponses,

        nps_score: npsScore,
        nps_promoters_percent: npsPromotersPercent,
        nps_passives_percent: npsPassivesPercent,
        nps_detractors_percent: npsDetractorsPercent,
        nps_promoters_count: npsPromotersCount,
        nps_passives_count: npsPassivesCount,
        nps_detractors_count: npsDetractorsCount,

        repeat_rate: repeatRate,
        repeater_count: repeaterCount,
        new_customer_count: newCustomerCount,

        repeater_revisit_rate: repeaterRevisitRate,
        repeater_revisit_yes_count: repeaterRevisitYes,
        repeater_revisit_no_count: repeaterRevisitNo,

        new_revisit_rate: newRevisitRate,
        new_revisit_yes_count: newRevisitYes,
        new_revisit_no_count: newRevisitNo,

        // 12セグメント
        ...Object.fromEntries(segmentFields.flatMap(field => [
          [`${field}_count`, segmentCounts[field]],
          [`${field}_percent`, segmentPercents[field]]
        ])),

        positive_impact_count: positiveImpactCount,
        positive_impact_percent: positiveImpactPercent,
        negative_impact_count: negativeImpactCount,
        negative_impact_percent: negativeImpactPercent,

        qsc_quality_score: qscQualityScore,
        qsc_quality_count: qscQualityCount,
        qsc_service_score: qscServiceScore,
        qsc_service_count: qscServiceCount,
        qsc_cleanliness_score: qscCleanlinessScore,
        qsc_cleanliness_count: qscCleanlinessCount,

        // QSC項目別
        ...qscItemAverages,

        quality_positive_count: qualityPositiveCount,
        quality_negative_count: qualityNegativeCount,
        quality_neutral_count: qualityNeutralCount,
        service_positive_count: servicePositiveCount,
        service_negative_count: serviceNegativeCount,
        service_neutral_count: serviceNeutralCount,
        cleanliness_positive_count: cleanlinessPositiveCount,
        cleanliness_negative_count: cleanlinessNegativeCount,
        cleanliness_neutral_count: cleanlinessNeutralCount,

        gender_male_count: genderMaleCount,
        gender_male_percent: genderMalePercent,
        gender_female_count: genderFemaleCount,
        gender_female_percent: genderFemalePercent,
        gender_other_count: genderOtherCount,
        gender_other_percent: genderOtherPercent,

        age_20s_count: age20sCount,
        age_20s_percent: age20sPercent,
        age_30s_count: age30sCount,
        age_30s_percent: age30sPercent,
        age_40s_count: age40sCount,
        age_40s_percent: age40sPercent,
        age_50s_count: age50sCount,
        age_50s_percent: age50sPercent,
        age_60plus_count: age60plusCount,
        age_60plus_percent: age60plusPercent,

        companion_alone_count: companionAloneCount,
        companion_alone_percent: companionAlonePercent,
        companion_couple_count: companionCoupleCount,
        companion_couple_percent: companionCouplePercent,
        companion_friends_count: companionFriendsCount,
        companion_friends_percent: companionFriendsPercent,
        companion_family_count: companionFamilyCount,
        companion_family_percent: companionFamilyPercent,
        companion_business_count: companionBusinessCount,
        companion_business_percent: companionBusinessPercent,
        companion_other_count: companionOtherCount,
        companion_other_percent: companionOtherPercent,

        pref_total_quality: prefTotalQuality,
        pref_total_service: prefTotalService,
        pref_total_atmosphere: prefTotalAtmosphere,
        pref_total_hygiene: prefTotalHygiene,
        pref_total_price: prefTotalPrice,
        pref_repeater_quality: prefRepeaterQuality,
        pref_repeater_service: prefRepeaterService,
        pref_repeater_atmosphere: prefRepeaterAtmosphere,
        pref_repeater_hygiene: prefRepeaterHygiene,
        pref_repeater_price: prefRepeaterPrice,
        pref_new_quality: prefNewQuality,
        pref_new_service: prefNewService,
        pref_new_atmosphere: prefNewAtmosphere,
        pref_new_hygiene: prefNewHygiene,
        pref_new_price: prefNewPrice
      }
    } else {
      // 個別店舗の場合
      const { data: singleSummary, error: summaryError } = await supabaseAdmin
        .from('monthly_analytics_summary')
        .select('*')
        .eq('company_id', companyId)
        .eq('store_id', storeId)
        .eq('year_month', targetYearMonth)
        .single()

      if (summaryError && summaryError.code !== 'PGRST116') {
        throw new Error(`データの取得に失敗しました: ${summaryError.message}`)
      }

      summary = singleSummary
    }

    if (!summary) {
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            availablePeriods,
            allCompanyStores,
            yearMonth: targetYearMonth,
            overview: null,
            salesImpact: null,
            storeEvaluation: null,
            customerTrends: null
          },
          message: isAllStores ? 'この企業の該当月のデータがありません' : 'このストアの該当月のデータがありません'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // 過去6ヶ月分のデータを取得（推移グラフ用 + 売上影響タブの比較用）
    let historicalQuery = supabaseAdmin
      .from('monthly_analytics_summary')
      .select(`
        year_month, nps_score, repeat_rate, repeater_revisit_rate, new_revisit_rate, total_responses,
        nps_promoters_count, nps_passives_count, nps_detractors_count,
        repeater_count, new_customer_count,
        repeater_revisit_yes_count, repeater_revisit_no_count,
        new_revisit_yes_count, new_revisit_no_count,
        seg_promoter_revisit_repeater_count, seg_promoter_revisit_repeater_percent,
        seg_promoter_revisit_new_count, seg_promoter_revisit_new_percent,
        seg_promoter_norevisit_repeater_count, seg_promoter_norevisit_repeater_percent,
        seg_promoter_norevisit_new_count, seg_promoter_norevisit_new_percent,
        seg_passive_revisit_repeater_count, seg_passive_revisit_repeater_percent,
        seg_passive_revisit_new_count, seg_passive_revisit_new_percent,
        seg_passive_norevisit_repeater_count, seg_passive_norevisit_repeater_percent,
        seg_passive_norevisit_new_count, seg_passive_norevisit_new_percent,
        seg_detractor_revisit_repeater_count, seg_detractor_revisit_repeater_percent,
        seg_detractor_revisit_new_count, seg_detractor_revisit_new_percent,
        seg_detractor_norevisit_repeater_count, seg_detractor_norevisit_repeater_percent,
        seg_detractor_norevisit_new_count, seg_detractor_norevisit_new_percent,
        positive_impact_count, negative_impact_count
      `)
      .eq('company_id', companyId)

    if (!isAllStores) {
      historicalQuery = historicalQuery.eq('store_id', storeId)
    }

    // 選択月以前のデータのみ取得（未来月を含めない）
    historicalQuery = historicalQuery.lte('year_month', targetYearMonth)

    const { data: rawHistoricalData, error: historicalError } = await historicalQuery
      .order('year_month', { ascending: true })

    // 全店舗の場合は月ごとに集計
    let sortedHistoricalData: any[] = []

    if (isAllStores && rawHistoricalData && rawHistoricalData.length > 0) {
      // 月ごとにグループ化
      const monthlyGroups: Record<string, any[]> = {}
      for (const item of rawHistoricalData) {
        if (!monthlyGroups[item.year_month]) {
          monthlyGroups[item.year_month] = []
        }
        monthlyGroups[item.year_month].push(item)
      }

      // 各月の集計を計算
      const segmentFields = [
        'seg_promoter_revisit_repeater', 'seg_promoter_revisit_new',
        'seg_promoter_norevisit_repeater', 'seg_promoter_norevisit_new',
        'seg_passive_revisit_repeater', 'seg_passive_revisit_new',
        'seg_passive_norevisit_repeater', 'seg_passive_norevisit_new',
        'seg_detractor_revisit_repeater', 'seg_detractor_revisit_new',
        'seg_detractor_norevisit_repeater', 'seg_detractor_norevisit_new'
      ]

      const aggregatedMonths = Object.entries(monthlyGroups).map(([yearMonth, stores]) => {
        const sum = (key: string) => stores.reduce((acc, s) => acc + (Number(s[key]) || 0), 0)

        const totalResponses = sum('total_responses')
        const npsPromotersCount = sum('nps_promoters_count')
        const npsPassivesCount = sum('nps_passives_count')
        const npsDetractorsCount = sum('nps_detractors_count')
        const npsTotal = npsPromotersCount + npsPassivesCount + npsDetractorsCount
        const npsPromotersPercent = npsTotal > 0 ? (npsPromotersCount / npsTotal) * 100 : 0
        const npsDetractorsPercent = npsTotal > 0 ? (npsDetractorsCount / npsTotal) * 100 : 0
        const npsScore = Math.round(npsPromotersPercent - npsDetractorsPercent)

        const repeaterCount = sum('repeater_count')
        const newCustomerCount = sum('new_customer_count')
        const totalCustomers = repeaterCount + newCustomerCount
        const repeatRate = totalCustomers > 0 ? (repeaterCount / totalCustomers) * 100 : 0

        const repeaterRevisitYes = sum('repeater_revisit_yes_count')
        const repeaterRevisitNo = sum('repeater_revisit_no_count')
        const repeaterRevisitTotal = repeaterRevisitYes + repeaterRevisitNo
        const repeaterRevisitRate = repeaterRevisitTotal > 0 ? (repeaterRevisitYes / repeaterRevisitTotal) * 100 : 0

        const newRevisitYes = sum('new_revisit_yes_count')
        const newRevisitNo = sum('new_revisit_no_count')
        const newRevisitTotal = newRevisitYes + newRevisitNo
        const newRevisitRate = newRevisitTotal > 0 ? (newRevisitYes / newRevisitTotal) * 100 : 0

        const segmentCounts: Record<string, number> = {}
        let segmentTotal = 0
        for (const field of segmentFields) {
          segmentCounts[field] = sum(`${field}_count`)
          segmentTotal += segmentCounts[field]
        }

        const segmentPercents: Record<string, number> = {}
        for (const field of segmentFields) {
          segmentPercents[field] = segmentTotal > 0
            ? Number(((segmentCounts[field] / segmentTotal) * 100).toFixed(2))
            : 0
        }

        return {
          year_month: yearMonth,
          nps_score: npsScore,
          repeat_rate: repeatRate,
          repeater_revisit_rate: repeaterRevisitRate,
          new_revisit_rate: newRevisitRate,
          total_responses: totalResponses,
          positive_impact_count: sum('positive_impact_count'),
          negative_impact_count: sum('negative_impact_count'),
          ...Object.fromEntries(segmentFields.flatMap(field => [
            [`${field}_count`, segmentCounts[field]],
            [`${field}_percent`, segmentPercents[field]]
          ]))
        }
      })

      sortedHistoricalData = aggregatedMonths.sort((a, b) => a.year_month.localeCompare(b.year_month)).slice(-6)
    } else {
      sortedHistoricalData = (rawHistoricalData || []).sort((a, b) =>
        a.year_month.localeCompare(b.year_month)
      ).slice(-6)
    }

    // monthlyPerformance（推移グラフ用）
    const monthlyPerformance = sortedHistoricalData.map(item => ({
      month: item.year_month,
      nps: item.nps_score || 0,
      repeatRate: item.repeat_rate || 0,
      repeatVisit: item.repeater_revisit_rate || 0,
      newVisit: item.new_revisit_rate || 0,
      responseCount: item.total_responses || 0
    }))

    // sparklineデータ（直近6ヶ月）
    const npsSparkline = sortedHistoricalData.map(d => d.nps_score || 0)
    const repeatRateSparkline = sortedHistoricalData.map(d => d.repeat_rate || 0)
    const repeaterRevisitSparkline = sortedHistoricalData.map(d => d.repeater_revisit_rate || 0)
    const newRevisitSparkline = sortedHistoricalData.map(d => d.new_revisit_rate || 0)

    // delta計算（前月との差分）
    const previousMonth = sortedHistoricalData.length > 1
      ? sortedHistoricalData[sortedHistoricalData.length - 2]
      : null

    const npsDelta = previousMonth ? (summary.nps_score || 0) - (previousMonth.nps_score || 0) : 0
    const repeatRateDelta = previousMonth ? (summary.repeat_rate || 0) - (previousMonth.repeat_rate || 0) : 0
    const repeaterRevisitDelta = previousMonth ? (summary.repeater_revisit_rate || 0) - (previousMonth.repeater_revisit_rate || 0) : 0
    const newRevisitDelta = previousMonth ? (summary.new_revisit_rate || 0) - (previousMonth.new_revisit_rate || 0) : 0

    // AIテキストを取得
    let aiTextData: any = null
    if (!isAllStores && storeId) {
      const { data: aiText } = await supabaseAdmin
        .from('monthly_analytics_ai_text')
        .select('overview, sales_impact, quality, service, cleanliness')
        .eq('company_id', companyId)
        .eq('store_id', storeId)
        .eq('year_month', targetYearMonth)
        .maybeSingle()
      aiTextData = aiText
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
        nps: { current: summary.nps_score, delta: npsDelta, sparkline: npsSparkline },
        repeatRate: { current: summary.repeat_rate, delta: repeatRateDelta, sparkline: repeatRateSparkline },
        repeaterRevisit: { current: summary.repeater_revisit_rate, delta: repeaterRevisitDelta, sparkline: repeaterRevisitSparkline },
        newRevisit: { current: summary.new_revisit_rate, delta: newRevisitDelta, sparkline: newRevisitSparkline }
      },
      monthlyPerformance
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

    // 顧客構成比率を計算
    const categoryTotal = newChurnCount + newRepeatersCount + stableRepeatersCount + churnRiskCount;
    const currentComposition = {
      month: targetYearMonth,
      newChurn: categoryTotal > 0 ? Math.round((newChurnCount / categoryTotal) * 100) : 0,
      newRepeaters: categoryTotal > 0 ? Math.round((newRepeatersCount / categoryTotal) * 100) : 0,
      stableRepeaters: categoryTotal > 0 ? Math.round((stableRepeatersCount / categoryTotal) * 100) : 0,
      churnRisk: categoryTotal > 0 ? Math.round((churnRiskCount / categoryTotal) * 100) : 0,
      counts: {
        total: categoryTotal,
        newChurn: newChurnCount,
        newRepeaters: newRepeatersCount,
        stableRepeaters: stableRepeatersCount,
        churnRisk: churnRiskCount
      }
    };

    // 履歴データから顧客構成比率を計算（compositionData用）
    const compositionData = sortedHistoricalData.map(item => {
      const nc = (item.seg_promoter_norevisit_new_count || 0) +
        (item.seg_passive_norevisit_new_count || 0) +
        (item.seg_detractor_norevisit_new_count || 0);
      const nr = (item.seg_promoter_revisit_new_count || 0) +
        (item.seg_passive_revisit_new_count || 0) +
        (item.seg_detractor_revisit_new_count || 0);
      const sr = (item.seg_promoter_revisit_repeater_count || 0) +
        (item.seg_passive_revisit_repeater_count || 0) +
        (item.seg_detractor_revisit_repeater_count || 0);
      const cr = (item.seg_promoter_norevisit_repeater_count || 0) +
        (item.seg_passive_norevisit_repeater_count || 0) +
        (item.seg_detractor_norevisit_repeater_count || 0);
      const total = nc + nr + sr + cr;
      return {
        month: item.year_month,
        newChurn: total > 0 ? Math.round((nc / total) * 100) : 0,
        newRepeaters: total > 0 ? Math.round((nr / total) * 100) : 0,
        stableRepeaters: total > 0 ? Math.round((sr / total) * 100) : 0,
        churnRisk: total > 0 ? Math.round((cr / total) * 100) : 0,
        counts: { total, newChurn: nc, newRepeaters: nr, stableRepeaters: sr, churnRisk: cr }
      };
    });

    // 6ヶ月平均を計算
    const avgNewChurn = compositionData.length > 0
      ? Math.round(compositionData.reduce((sum, d) => sum + d.newChurn, 0) / compositionData.length)
      : 0;
    const avgNewRepeaters = compositionData.length > 0
      ? Math.round(compositionData.reduce((sum, d) => sum + d.newRepeaters, 0) / compositionData.length)
      : 0;
    const avgStableRepeaters = compositionData.length > 0
      ? Math.round(compositionData.reduce((sum, d) => sum + d.stableRepeaters, 0) / compositionData.length)
      : 0;
    const avgChurnRisk = compositionData.length > 0
      ? Math.round(compositionData.reduce((sum, d) => sum + d.churnRisk, 0) / compositionData.length)
      : 0;
    const avgTotal = compositionData.length > 0
      ? Math.round(compositionData.reduce((sum, d) => sum + d.counts.total, 0) / compositionData.length)
      : 0;
    const avgComposition = {
      month: '平均',
      newChurn: avgNewChurn,
      newRepeaters: avgNewRepeaters,
      stableRepeaters: avgStableRepeaters,
      churnRisk: avgChurnRisk,
      counts: {
        total: avgTotal,
        newChurn: Math.round(compositionData.reduce((sum, d) => sum + d.counts.newChurn, 0) / (compositionData.length || 1)),
        newRepeaters: Math.round(compositionData.reduce((sum, d) => sum + d.counts.newRepeaters, 0) / (compositionData.length || 1)),
        stableRepeaters: Math.round(compositionData.reduce((sum, d) => sum + d.counts.stableRepeaters, 0) / (compositionData.length || 1)),
        churnRisk: Math.round(compositionData.reduce((sum, d) => sum + d.counts.churnRisk, 0) / (compositionData.length || 1))
      }
    };

    // 先月データを取得（先月比計算用）
    const previousMonthData = sortedHistoricalData.length > 1
      ? sortedHistoricalData[sortedHistoricalData.length - 2]
      : null;

    // 12セグメントにdelta（先月比）を追加
    const segmentFieldMap = [
      { field: 'seg_promoter_revisit_repeater', id: 1 },
      { field: 'seg_promoter_revisit_new', id: 2 },
      { field: 'seg_promoter_norevisit_repeater', id: 3 },
      { field: 'seg_promoter_norevisit_new', id: 4 },
      { field: 'seg_passive_revisit_repeater', id: 5 },
      { field: 'seg_passive_revisit_new', id: 6 },
      { field: 'seg_passive_norevisit_repeater', id: 7 },
      { field: 'seg_passive_norevisit_new', id: 8 },
      { field: 'seg_detractor_revisit_repeater', id: 9 },
      { field: 'seg_detractor_revisit_new', id: 10 },
      { field: 'seg_detractor_norevisit_repeater', id: 11 },
      { field: 'seg_detractor_norevisit_new', id: 12 }
    ];

    const segmentsWithDelta = segmentsWithImpact.map(seg => {
      const fieldInfo = segmentFieldMap.find(f => f.id === seg.id);
      if (!fieldInfo || !previousMonthData) {
        return { ...seg, monthOverMonth: 0, previousCount: null, previousPercentage: null };
      }
      const prevCount = previousMonthData[`${fieldInfo.field}_count`] || 0;
      const prevPercent = previousMonthData[`${fieldInfo.field}_percent`] || 0;
      const countDelta = (seg.count || 0) - prevCount;
      const percentDelta = Number(((seg.percentage || 0) - prevPercent).toFixed(1));
      return {
        ...seg,
        monthOverMonth: percentDelta,
        countDelta,
        previousCount: prevCount,
        previousPercentage: prevPercent
      };
    });

    const salesImpactData = {
      segments: segmentsWithDelta,
      totalCount,
      totalScore,
      positiveScore,
      negativeScore,
      normalizedScore,
      trendData: [], // 月次サマリーには過去データがないため空
      categoryData,
      compositionData,
      avgComposition,
      previousMonth: previousMonthData ? previousMonthData.year_month : null,
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
          score: Number(summary.qsc_quality_score) || 0,
          count: summary.qsc_quality_count || 0,
          trend: 0,
          label: 'クオリティ',
          color: 'violet'
        },
        S: {
          score: Number(summary.qsc_service_score) || 0,
          count: summary.qsc_service_count || 0,
          trend: 0,
          label: 'サービス',
          color: 'blue'
        },
        C: {
          score: Number(summary.qsc_cleanliness_score) || 0,
          count: summary.qsc_cleanliness_count || 0,
          trend: 0,
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
          neutralCount: summary.quality_neutral_count,
          totalResponses: (summary.quality_positive_count || 0) + (summary.quality_negative_count || 0) + (summary.quality_neutral_count || 0)
        },
        S: {
          label: 'Service',
          items: buildQscItems('s', serviceLabels),
          positiveCount: summary.service_positive_count,
          negativeCount: summary.service_negative_count,
          neutralCount: summary.service_neutral_count,
          totalResponses: (summary.service_positive_count || 0) + (summary.service_negative_count || 0) + (summary.service_neutral_count || 0)
        },
        C: {
          label: 'Cleanliness',
          items: buildQscItems('c', cleanlinessLabels),
          positiveCount: summary.cleanliness_positive_count,
          negativeCount: summary.cleanliness_negative_count,
          neutralCount: summary.cleanliness_neutral_count,
          totalResponses: (summary.cleanliness_positive_count || 0) + (summary.cleanliness_negative_count || 0) + (summary.cleanliness_neutral_count || 0)
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
          storesWithReports,
          allCompanyStores,
          yearMonth: targetYearMonth,
          overview: overviewData,
          salesImpact: salesImpactData,
          storeEvaluation: storeEvaluationData,
          customerTrends: customerTrendsData,
          aiText: aiTextData,
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
