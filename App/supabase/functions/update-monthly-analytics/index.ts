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

    // 日本時間で現在の年月を取得
    const now = new Date()
    const jstOffset = 9 * 60 * 60 * 1000 // 9時間
    const jstNow = new Date(now.getTime() + jstOffset)
    const yearMonth = `${jstNow.getFullYear()}-${String(jstNow.getMonth() + 1).padStart(2, '0')}`

    // 月の開始日と終了日（UTC）
    const monthStart = new Date(Date.UTC(jstNow.getFullYear(), jstNow.getMonth(), 1) - jstOffset)
    const monthEnd = new Date(Date.UTC(jstNow.getFullYear(), jstNow.getMonth() + 1, 0, 23, 59, 59, 999) - jstOffset)

    console.log(`Processing monthly analytics for ${yearMonth}`)
    console.log(`Date range: ${monthStart.toISOString()} to ${monthEnd.toISOString()}`)

    // 全企業を取得
    const { data: companies, error: companiesError } = await supabaseAdmin
      .from('companies')
      .select('id')

    if (companiesError) {
      throw new Error(`Failed to fetch companies: ${companiesError.message}`)
    }

    const results: { companyId: string; storeId: string; status: string; message?: string }[] = []

    for (const company of companies || []) {
      // 各店舗のデータのみを処理（企業全体は処理しない）
      const { data: stores } = await supabaseAdmin
        .from('stores')
        .select('id')
        .eq('company_id', company.id)

      for (const store of stores || []) {
        try {
          const result = await processAnalytics(supabaseAdmin, company.id, store.id, yearMonth, monthStart, monthEnd)
          if (result.skipped) {
            results.push({ companyId: company.id, storeId: store.id, status: 'skipped', message: 'No responses' })
          } else {
            results.push({ companyId: company.id, storeId: store.id, status: 'success' })
          }
        } catch (storeError) {
          console.error(`Error processing store ${store.id}:`, storeError)
          results.push({ companyId: company.id, storeId: store.id, status: 'error', message: storeError.message })
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        yearMonth,
        processedAt: new Date().toISOString(),
        results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Update monthly analytics error:', error)

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

// ========================================
// メイン処理関数
// ========================================
async function processAnalytics(
  supabase: any,
  companyId: string,
  storeId: string,
  yearMonth: string,
  monthStart: Date,
  monthEnd: Date
): Promise<{ skipped: boolean }> {
  // store_idは必須
  if (!storeId) {
    throw new Error('store_id is required')
  }

  // ========================================
  // 1. preset_question_answer からデータ取得
  // ========================================
  const { data: answers, error: answersError } = await supabase
    .from('preset_question_answer')
    .select('*')
    .eq('company_id', companyId)
    .eq('store_id', storeId)
    .gte('created_at', monthStart.toISOString())
    .lte('created_at', monthEnd.toISOString())

  if (answersError) {
    throw new Error(`Failed to fetch answers: ${answersError.message}`)
  }

  const allAnswers = answers || []
  const totalResponses = allAnswers.length

  // 回答が0件の場合はスキップ
  if (totalResponses === 0) {
    console.log(`Skipping store ${storeId}: no responses`)
    return { skipped: true }
  }

  // ========================================
  // 2. 概要データ計算
  // ========================================

  // 再来店意向判定関数
  const isRevisitYes = (revisitIntent: string | null): boolean | null => {
    if (revisitIntent === null || revisitIntent === undefined) return null
    if (revisitIntent === '1ヶ月以内' || revisitIntent === '3ヶ月以内') return true
    return false
  }

  // NPS計算
  const npsAnswers = allAnswers.filter((a: any) => a.p1_q1 !== null)
  const promoters = npsAnswers.filter((a: any) => a.p1_q1 >= 9)
  const passives = npsAnswers.filter((a: any) => a.p1_q1 >= 7 && a.p1_q1 <= 8)
  const detractors = npsAnswers.filter((a: any) => a.p1_q1 <= 6)
  const npsTotal = promoters.length + passives.length + detractors.length

  const promoterPercent = npsTotal > 0 ? Math.round((promoters.length / npsTotal) * 100) : 0
  const passivePercent = npsTotal > 0 ? Math.round((passives.length / npsTotal) * 100) : 0
  const detractorPercent = npsTotal > 0 ? Math.round((detractors.length / npsTotal) * 100) : 0
  const npsScore = promoterPercent - detractorPercent

  // リピート率計算
  const visitAnswers = allAnswers.filter((a: any) => a.p1_q3 !== null)
  const repeaters = visitAnswers.filter((a: any) => a.p1_q3 !== '初めて')
  const newCustomers = visitAnswers.filter((a: any) => a.p1_q3 === '初めて')
  const repeatRate = visitAnswers.length > 0
    ? Math.round((repeaters.length / visitAnswers.length) * 1000) / 10
    : 0

  // 再来店意向（リピーター）
  const repeaterWithIntent = repeaters.filter((a: any) => a.p1_q2 !== null)
  const repeaterRevisitYes = repeaterWithIntent.filter((a: any) => isRevisitYes(a.p1_q2) === true)
  const repeaterRevisitNo = repeaterWithIntent.filter((a: any) => isRevisitYes(a.p1_q2) === false)
  const repeaterRevisitRate = repeaterWithIntent.length > 0
    ? Math.round((repeaterRevisitYes.length / repeaterWithIntent.length) * 1000) / 10
    : 0

  // 再来店意向（新規）
  const newWithIntent = newCustomers.filter((a: any) => a.p1_q2 !== null)
  const newRevisitYes = newWithIntent.filter((a: any) => isRevisitYes(a.p1_q2) === true)
  const newRevisitNo = newWithIntent.filter((a: any) => isRevisitYes(a.p1_q2) === false)
  const newRevisitRate = newWithIntent.length > 0
    ? Math.round((newRevisitYes.length / newWithIntent.length) * 1000) / 10
    : 0

  // ========================================
  // 3. 12セグメント計算
  // ========================================
  const validForSegment = allAnswers.filter((a: any) =>
    a.p1_q1 !== null && a.p1_q2 !== null && a.p1_q3 !== null
  )
  const segmentTotal = validForSegment.length

  const getSegmentData = (npsType: 'promoter' | 'passive' | 'detractor', revisit: boolean, isRepeater: boolean) => {
    const filtered = validForSegment.filter((a: any) => {
      // NPS判定
      let npsMatch = false
      if (npsType === 'promoter') npsMatch = a.p1_q1 >= 9
      else if (npsType === 'passive') npsMatch = a.p1_q1 >= 7 && a.p1_q1 <= 8
      else npsMatch = a.p1_q1 <= 6

      // 再来店意向判定
      const revisitMatch = isRevisitYes(a.p1_q2) === revisit

      // リピーター判定
      const repeaterMatch = isRepeater ? a.p1_q3 !== '初めて' : a.p1_q3 === '初めて'

      return npsMatch && revisitMatch && repeaterMatch
    })

    return {
      count: filtered.length,
      percent: segmentTotal > 0 ? Math.round((filtered.length / segmentTotal) * 1000) / 10 : 0
    }
  }

  // 12セグメントデータ
  const seg1 = getSegmentData('promoter', true, true)   // ロイヤル顧客
  const seg2 = getSegmentData('promoter', true, false)  // 期待の新規
  const seg3 = getSegmentData('promoter', false, true)  // 離脱リスク推奨者
  const seg4 = getSegmentData('promoter', false, false) // 一見推奨者
  const seg5 = getSegmentData('passive', true, true)    // 安定中立
  const seg6 = getSegmentData('passive', true, false)   // 様子見新規
  const seg7 = getSegmentData('passive', false, true)   // 離脱リスク中立
  const seg8 = getSegmentData('passive', false, false)  // 低関心新規
  const seg9 = getSegmentData('detractor', true, true)  // 不満継続
  const seg10 = getSegmentData('detractor', true, false) // 改善余地新規
  const seg11 = getSegmentData('detractor', false, true) // リピーター離脱
  const seg12 = getSegmentData('detractor', false, false) // 新規離脱

  // ポジティブ・ネガティブ影響
  const positiveImpact = seg1.count + seg2.count + seg5.count + seg6.count
  const negativeImpact = seg11.count + seg12.count + seg7.count + seg8.count
  const positivePercent = segmentTotal > 0 ? Math.round((positiveImpact / segmentTotal) * 1000) / 10 : 0
  const negativePercent = segmentTotal > 0 ? Math.round((negativeImpact / segmentTotal) * 1000) / 10 : 0

  // ========================================
  // 4. QSCスコア計算
  // ========================================
  const normalizeScore = (score: number) => ((score - 1) / 6) * 4 + 1

  const calculateQscScore = (field: string) => {
    const validAnswers = allAnswers.filter((a: any) => a[field] !== null && a[field] !== undefined)
    if (validAnswers.length === 0) return { score: 0, count: 0 }

    const sum = validAnswers.reduce((acc: number, a: any) => acc + normalizeScore(Number(a[field])), 0)
    return {
      score: Math.round((sum / validAnswers.length) * 100) / 100,
      count: validAnswers.length
    }
  }

  const qscQuality = calculateQscScore('p2_q1')
  const qscService = calculateQscScore('p2_q2')
  const qscCleanliness = calculateQscScore('p2_q3')

  // ========================================
  // 5. QSC項目別データ取得
  // ========================================
  const getDetailedQscData = async (tableName: string) => {
    let query = supabase
      .from(tableName)
      .select('q1, q2, q3, q4, q5, q6, q7, q8, q9, q10, is_positive, company_id, store_id, created_at')
      .eq('company_id', companyId)
      .gte('created_at', monthStart.toISOString())
      .lte('created_at', monthEnd.toISOString())

    if (storeId) {
      query = query.eq('store_id', storeId)
    }

    const { data, error } = await query

    if (error) {
      console.error(`${tableName} fetch error:`, error)
      return null
    }

    return data || []
  }

  const [qualityData, serviceData, cleanlinessData] = await Promise.all([
    getDetailedQscData('preset_quality_question_answer'),
    getDetailedQscData('preset_service_question_answer'),
    getDetailedQscData('preset_cleanliness_question_answer')
  ])

  // 項目別集計関数
  const calculateItemStats = (data: any[], itemIndex: number) => {
    const fieldName = `q${itemIndex}`
    const itemAnswers = data.filter((a: any) => a[fieldName] !== null && a[fieldName] !== undefined)
    const total = itemAnswers.length

    if (total === 0) {
      return { positive: 0, negative: 0, neutral: 0, total: 0 }
    }

    const positive = itemAnswers.filter((a: any) => a[fieldName] === 'positive').length
    const negative = itemAnswers.filter((a: any) => a[fieldName] === 'negative').length
    const neutral = itemAnswers.filter((a: any) => a[fieldName] === 'neutral').length

    return {
      positive: Math.round((positive / total) * 100),
      negative: Math.round((negative / total) * 100),
      neutral: Math.round((neutral / total) * 100),
      total
    }
  }

  // カテゴリ別集計
  const calculateCategoryTotals = (data: any[]) => {
    const positive = data.filter((a: any) => a.is_positive === true).length
    const negative = data.filter((a: any) => a.is_positive === false).length
    const neutral = data.filter((a: any) => a.is_positive === null).length
    return { positive, negative, neutral }
  }

  // Quality項目別
  const q1 = calculateItemStats(qualityData || [], 1)
  const q2 = calculateItemStats(qualityData || [], 2)
  const q3 = calculateItemStats(qualityData || [], 3)
  const q4 = calculateItemStats(qualityData || [], 4)
  const q5 = calculateItemStats(qualityData || [], 5)
  const q6 = calculateItemStats(qualityData || [], 6)
  const q7 = calculateItemStats(qualityData || [], 7)
  const q8 = calculateItemStats(qualityData || [], 8)
  const q9 = calculateItemStats(qualityData || [], 9)
  const q10 = calculateItemStats(qualityData || [], 10)

  // Service項目別
  const s1 = calculateItemStats(serviceData || [], 1)
  const s2 = calculateItemStats(serviceData || [], 2)
  const s3 = calculateItemStats(serviceData || [], 3)
  const s4 = calculateItemStats(serviceData || [], 4)
  const s5 = calculateItemStats(serviceData || [], 5)
  const s6 = calculateItemStats(serviceData || [], 6)
  const s7 = calculateItemStats(serviceData || [], 7)
  const s8 = calculateItemStats(serviceData || [], 8)
  const s9 = calculateItemStats(serviceData || [], 9)
  const s10 = calculateItemStats(serviceData || [], 10)

  // Cleanliness項目別
  const c1 = calculateItemStats(cleanlinessData || [], 1)
  const c2 = calculateItemStats(cleanlinessData || [], 2)
  const c3 = calculateItemStats(cleanlinessData || [], 3)
  const c4 = calculateItemStats(cleanlinessData || [], 4)
  const c5 = calculateItemStats(cleanlinessData || [], 5)
  const c6 = calculateItemStats(cleanlinessData || [], 6)
  const c7 = calculateItemStats(cleanlinessData || [], 7)
  const c8 = calculateItemStats(cleanlinessData || [], 8)
  const c9 = calculateItemStats(cleanlinessData || [], 9)
  const c10 = calculateItemStats(cleanlinessData || [], 10)

  // カテゴリ別集計
  const qualityTotals = calculateCategoryTotals(qualityData || [])
  const serviceTotals = calculateCategoryTotals(serviceData || [])
  const cleanlinessTotals = calculateCategoryTotals(cleanlinessData || [])

  // ========================================
  // 6. 顧客傾向データ計算
  // ========================================

  // 性別分布
  const genderCounts: Record<string, number> = { '男性': 0, '女性': 0, 'その他': 0 }
  allAnswers.forEach((a: any) => {
    if (a.p1_q4) {
      if (a.p1_q4 === '男性') genderCounts['男性']++
      else if (a.p1_q4 === '女性') genderCounts['女性']++
      else genderCounts['その他']++
    }
  })
  const genderTotal = Object.values(genderCounts).reduce((a, b) => a + b, 0)

  // 年齢分布
  const ageCounts: Record<string, number> = { '20代': 0, '30代': 0, '40代': 0, '50代': 0, '60代以上': 0 }
  allAnswers.forEach((a: any) => {
    const age = a.p1_q5 || ''
    if (age.includes('20') || age === '20代') ageCounts['20代']++
    else if (age.includes('30') || age === '30代') ageCounts['30代']++
    else if (age.includes('40') || age === '40代') ageCounts['40代']++
    else if (age.includes('50') || age === '50代') ageCounts['50代']++
    else if (age.includes('60') || age === '60代' || age === '60代以上') ageCounts['60代以上']++
  })
  const ageTotal = Object.values(ageCounts).reduce((a, b) => a + b, 0)

  // 同行者分布
  const companionCounts: Record<string, number> = {
    '1人': 0, 'カップル': 0, '友人': 0, '家族': 0, 'ビジネス': 0, 'その他': 0
  }
  allAnswers.forEach((a: any) => {
    const companion = a.p1_q6 || ''
    if (companion.includes('1人') || companion.includes('ひとり')) companionCounts['1人']++
    else if (companion.includes('カップル') || companion.includes('恋人')) companionCounts['カップル']++
    else if (companion.includes('友人') || companion.includes('友達')) companionCounts['友人']++
    else if (companion.includes('家族')) companionCounts['家族']++
    else if (companion.includes('ビジネス') || companion.includes('仕事') || companion.includes('同僚')) companionCounts['ビジネス']++
    else if (companion) companionCounts['その他']++
  })
  const companionTotal = Object.values(companionCounts).reduce((a, b) => a + b, 0)

  // ========================================
  // 7. 顧客重視ポイント取得
  // ========================================
  let featuresQuery = supabase
    .from('preset_answer_user_features')
    .select('top_preference, second_preference, review_form_submission_id')
    .eq('company_id', companyId)
    .gte('created_at', monthStart.toISOString())
    .lte('created_at', monthEnd.toISOString())

  if (storeId) {
    featuresQuery = featuresQuery.eq('store_id', storeId)
  }

  const { data: userFeatures } = await featuresQuery
  const allFeatures = userFeatures || []

  // submission_idからリピーター判定を取得
  const submissionIds = allFeatures
    .filter((f: any) => f.review_form_submission_id)
    .map((f: any) => f.review_form_submission_id)

  let customerTypeMap: Record<string, string> = {}
  if (submissionIds.length > 0) {
    const { data: answerData } = await supabase
      .from('preset_question_answer')
      .select('review_form_submission_id, p1_q3')
      .in('review_form_submission_id', submissionIds)

    if (answerData) {
      answerData.forEach((a: any) => {
        if (a.review_form_submission_id) {
          customerTypeMap[a.review_form_submission_id] = a.p1_q3 || ''
        }
      })
    }
  }

  const preferenceCategories = ['品質', '接客', '空間', '衛生', '価格感度']
  const TOP_WEIGHT = 2
  const SECOND_WEIGHT = 1

  const calculateRawScores = (features: any[]) => {
    const scores: Record<string, number> = {}
    preferenceCategories.forEach(cat => scores[cat] = 0)

    features.forEach((f: any) => {
      if (f.top_preference && preferenceCategories.includes(f.top_preference)) {
        scores[f.top_preference] += TOP_WEIGHT
      }
      if (f.second_preference && preferenceCategories.includes(f.second_preference)) {
        scores[f.second_preference] += SECOND_WEIGHT
      }
    })

    return scores
  }

  const normalizeToMax100 = (scores: Record<string, number>) => {
    const maxValue = Math.max(...Object.values(scores))
    const normalized: Record<string, number> = {}

    preferenceCategories.forEach(cat => {
      normalized[cat] = maxValue > 0 ? Math.round((scores[cat] / maxValue) * 100) : 0
    })

    return normalized
  }

  const repeaterFeatures = allFeatures.filter((f: any) => {
    const customerType = f.review_form_submission_id
      ? customerTypeMap[f.review_form_submission_id]
      : ''
    return customerType && customerType !== '初めて'
  })

  const newCustomerFeatures = allFeatures.filter((f: any) => {
    const customerType = f.review_form_submission_id
      ? customerTypeMap[f.review_form_submission_id]
      : ''
    return customerType === '初めて'
  })

  const totalScores = normalizeToMax100(calculateRawScores(allFeatures))
  const repeaterScores = normalizeToMax100(calculateRawScores(repeaterFeatures))
  const newScores = normalizeToMax100(calculateRawScores(newCustomerFeatures))

  // ========================================
  // 8. データ保存（UPSERT）
  // ========================================
  const summaryData = {
    company_id: companyId,
    store_id: storeId,
    year_month: yearMonth,

    // 概要
    total_responses: totalResponses,
    nps_score: npsScore,
    nps_promoters_percent: promoterPercent,
    nps_passives_percent: passivePercent,
    nps_detractors_percent: detractorPercent,
    nps_promoters_count: promoters.length,
    nps_passives_count: passives.length,
    nps_detractors_count: detractors.length,

    repeat_rate: repeatRate,
    repeater_count: repeaters.length,
    new_customer_count: newCustomers.length,

    repeater_revisit_rate: repeaterRevisitRate,
    repeater_revisit_yes_count: repeaterRevisitYes.length,
    repeater_revisit_no_count: repeaterRevisitNo.length,

    new_revisit_rate: newRevisitRate,
    new_revisit_yes_count: newRevisitYes.length,
    new_revisit_no_count: newRevisitNo.length,

    // 12セグメント
    seg_promoter_revisit_repeater_count: seg1.count,
    seg_promoter_revisit_repeater_percent: seg1.percent,
    seg_promoter_revisit_new_count: seg2.count,
    seg_promoter_revisit_new_percent: seg2.percent,
    seg_promoter_norevisit_repeater_count: seg3.count,
    seg_promoter_norevisit_repeater_percent: seg3.percent,
    seg_promoter_norevisit_new_count: seg4.count,
    seg_promoter_norevisit_new_percent: seg4.percent,
    seg_passive_revisit_repeater_count: seg5.count,
    seg_passive_revisit_repeater_percent: seg5.percent,
    seg_passive_revisit_new_count: seg6.count,
    seg_passive_revisit_new_percent: seg6.percent,
    seg_passive_norevisit_repeater_count: seg7.count,
    seg_passive_norevisit_repeater_percent: seg7.percent,
    seg_passive_norevisit_new_count: seg8.count,
    seg_passive_norevisit_new_percent: seg8.percent,
    seg_detractor_revisit_repeater_count: seg9.count,
    seg_detractor_revisit_repeater_percent: seg9.percent,
    seg_detractor_revisit_new_count: seg10.count,
    seg_detractor_revisit_new_percent: seg10.percent,
    seg_detractor_norevisit_repeater_count: seg11.count,
    seg_detractor_norevisit_repeater_percent: seg11.percent,
    seg_detractor_norevisit_new_count: seg12.count,
    seg_detractor_norevisit_new_percent: seg12.percent,

    positive_impact_count: positiveImpact,
    positive_impact_percent: positivePercent,
    negative_impact_count: negativeImpact,
    negative_impact_percent: negativePercent,

    // QSC総合スコア
    qsc_quality_score: qscQuality.score,
    qsc_quality_count: qscQuality.count,
    qsc_service_score: qscService.score,
    qsc_service_count: qscService.count,
    qsc_cleanliness_score: qscCleanliness.score,
    qsc_cleanliness_count: qscCleanliness.count,

    // Quality項目別
    q1_positive_percent: q1.positive,
    q1_negative_percent: q1.negative,
    q1_neutral_percent: q1.neutral,
    q1_total_count: q1.total,
    q2_positive_percent: q2.positive,
    q2_negative_percent: q2.negative,
    q2_neutral_percent: q2.neutral,
    q2_total_count: q2.total,
    q3_positive_percent: q3.positive,
    q3_negative_percent: q3.negative,
    q3_neutral_percent: q3.neutral,
    q3_total_count: q3.total,
    q4_positive_percent: q4.positive,
    q4_negative_percent: q4.negative,
    q4_neutral_percent: q4.neutral,
    q4_total_count: q4.total,
    q5_positive_percent: q5.positive,
    q5_negative_percent: q5.negative,
    q5_neutral_percent: q5.neutral,
    q5_total_count: q5.total,
    q6_positive_percent: q6.positive,
    q6_negative_percent: q6.negative,
    q6_neutral_percent: q6.neutral,
    q6_total_count: q6.total,
    q7_positive_percent: q7.positive,
    q7_negative_percent: q7.negative,
    q7_neutral_percent: q7.neutral,
    q7_total_count: q7.total,
    q8_positive_percent: q8.positive,
    q8_negative_percent: q8.negative,
    q8_neutral_percent: q8.neutral,
    q8_total_count: q8.total,
    q9_positive_percent: q9.positive,
    q9_negative_percent: q9.negative,
    q9_neutral_percent: q9.neutral,
    q9_total_count: q9.total,
    q10_positive_percent: q10.positive,
    q10_negative_percent: q10.negative,
    q10_neutral_percent: q10.neutral,
    q10_total_count: q10.total,

    // Service項目別
    s1_positive_percent: s1.positive,
    s1_negative_percent: s1.negative,
    s1_neutral_percent: s1.neutral,
    s1_total_count: s1.total,
    s2_positive_percent: s2.positive,
    s2_negative_percent: s2.negative,
    s2_neutral_percent: s2.neutral,
    s2_total_count: s2.total,
    s3_positive_percent: s3.positive,
    s3_negative_percent: s3.negative,
    s3_neutral_percent: s3.neutral,
    s3_total_count: s3.total,
    s4_positive_percent: s4.positive,
    s4_negative_percent: s4.negative,
    s4_neutral_percent: s4.neutral,
    s4_total_count: s4.total,
    s5_positive_percent: s5.positive,
    s5_negative_percent: s5.negative,
    s5_neutral_percent: s5.neutral,
    s5_total_count: s5.total,
    s6_positive_percent: s6.positive,
    s6_negative_percent: s6.negative,
    s6_neutral_percent: s6.neutral,
    s6_total_count: s6.total,
    s7_positive_percent: s7.positive,
    s7_negative_percent: s7.negative,
    s7_neutral_percent: s7.neutral,
    s7_total_count: s7.total,
    s8_positive_percent: s8.positive,
    s8_negative_percent: s8.negative,
    s8_neutral_percent: s8.neutral,
    s8_total_count: s8.total,
    s9_positive_percent: s9.positive,
    s9_negative_percent: s9.negative,
    s9_neutral_percent: s9.neutral,
    s9_total_count: s9.total,
    s10_positive_percent: s10.positive,
    s10_negative_percent: s10.negative,
    s10_neutral_percent: s10.neutral,
    s10_total_count: s10.total,

    // Cleanliness項目別
    c1_positive_percent: c1.positive,
    c1_negative_percent: c1.negative,
    c1_neutral_percent: c1.neutral,
    c1_total_count: c1.total,
    c2_positive_percent: c2.positive,
    c2_negative_percent: c2.negative,
    c2_neutral_percent: c2.neutral,
    c2_total_count: c2.total,
    c3_positive_percent: c3.positive,
    c3_negative_percent: c3.negative,
    c3_neutral_percent: c3.neutral,
    c3_total_count: c3.total,
    c4_positive_percent: c4.positive,
    c4_negative_percent: c4.negative,
    c4_neutral_percent: c4.neutral,
    c4_total_count: c4.total,
    c5_positive_percent: c5.positive,
    c5_negative_percent: c5.negative,
    c5_neutral_percent: c5.neutral,
    c5_total_count: c5.total,
    c6_positive_percent: c6.positive,
    c6_negative_percent: c6.negative,
    c6_neutral_percent: c6.neutral,
    c6_total_count: c6.total,
    c7_positive_percent: c7.positive,
    c7_negative_percent: c7.negative,
    c7_neutral_percent: c7.neutral,
    c7_total_count: c7.total,
    c8_positive_percent: c8.positive,
    c8_negative_percent: c8.negative,
    c8_neutral_percent: c8.neutral,
    c8_total_count: c8.total,
    c9_positive_percent: c9.positive,
    c9_negative_percent: c9.negative,
    c9_neutral_percent: c9.neutral,
    c9_total_count: c9.total,
    c10_positive_percent: c10.positive,
    c10_negative_percent: c10.negative,
    c10_neutral_percent: c10.neutral,
    c10_total_count: c10.total,

    // QSCカテゴリ別集計
    quality_positive_count: qualityTotals.positive,
    quality_negative_count: qualityTotals.negative,
    quality_neutral_count: qualityTotals.neutral,
    service_positive_count: serviceTotals.positive,
    service_negative_count: serviceTotals.negative,
    service_neutral_count: serviceTotals.neutral,
    cleanliness_positive_count: cleanlinessTotals.positive,
    cleanliness_negative_count: cleanlinessTotals.negative,
    cleanliness_neutral_count: cleanlinessTotals.neutral,

    // 性別分布
    gender_male_count: genderCounts['男性'],
    gender_male_percent: genderTotal > 0 ? Math.round((genderCounts['男性'] / genderTotal) * 100) : 0,
    gender_female_count: genderCounts['女性'],
    gender_female_percent: genderTotal > 0 ? Math.round((genderCounts['女性'] / genderTotal) * 100) : 0,
    gender_other_count: genderCounts['その他'],
    gender_other_percent: genderTotal > 0 ? Math.round((genderCounts['その他'] / genderTotal) * 100) : 0,

    // 年齢分布
    age_20s_count: ageCounts['20代'],
    age_20s_percent: ageTotal > 0 ? Math.round((ageCounts['20代'] / ageTotal) * 100) : 0,
    age_30s_count: ageCounts['30代'],
    age_30s_percent: ageTotal > 0 ? Math.round((ageCounts['30代'] / ageTotal) * 100) : 0,
    age_40s_count: ageCounts['40代'],
    age_40s_percent: ageTotal > 0 ? Math.round((ageCounts['40代'] / ageTotal) * 100) : 0,
    age_50s_count: ageCounts['50代'],
    age_50s_percent: ageTotal > 0 ? Math.round((ageCounts['50代'] / ageTotal) * 100) : 0,
    age_60plus_count: ageCounts['60代以上'],
    age_60plus_percent: ageTotal > 0 ? Math.round((ageCounts['60代以上'] / ageTotal) * 100) : 0,

    // 同行者分布
    companion_alone_count: companionCounts['1人'],
    companion_alone_percent: companionTotal > 0 ? Math.round((companionCounts['1人'] / companionTotal) * 100) : 0,
    companion_couple_count: companionCounts['カップル'],
    companion_couple_percent: companionTotal > 0 ? Math.round((companionCounts['カップル'] / companionTotal) * 100) : 0,
    companion_friends_count: companionCounts['友人'],
    companion_friends_percent: companionTotal > 0 ? Math.round((companionCounts['友人'] / companionTotal) * 100) : 0,
    companion_family_count: companionCounts['家族'],
    companion_family_percent: companionTotal > 0 ? Math.round((companionCounts['家族'] / companionTotal) * 100) : 0,
    companion_business_count: companionCounts['ビジネス'],
    companion_business_percent: companionTotal > 0 ? Math.round((companionCounts['ビジネス'] / companionTotal) * 100) : 0,
    companion_other_count: companionCounts['その他'],
    companion_other_percent: companionTotal > 0 ? Math.round((companionCounts['その他'] / companionTotal) * 100) : 0,

    // 顧客重視ポイント
    pref_total_quality: totalScores['品質'] || 0,
    pref_total_service: totalScores['接客'] || 0,
    pref_total_atmosphere: totalScores['空間'] || 0,
    pref_total_hygiene: totalScores['衛生'] || 0,
    pref_total_price: totalScores['価格感度'] || 0,

    pref_repeater_quality: repeaterScores['品質'] || 0,
    pref_repeater_service: repeaterScores['接客'] || 0,
    pref_repeater_atmosphere: repeaterScores['空間'] || 0,
    pref_repeater_hygiene: repeaterScores['衛生'] || 0,
    pref_repeater_price: repeaterScores['価格感度'] || 0,

    pref_new_quality: newScores['品質'] || 0,
    pref_new_service: newScores['接客'] || 0,
    pref_new_atmosphere: newScores['空間'] || 0,
    pref_new_hygiene: newScores['衛生'] || 0,
    pref_new_price: newScores['価格感度'] || 0,
  }

  // UPSERT実行
  const { error: upsertError } = await supabase
    .from('monthly_analytics_summary')
    .upsert(summaryData, {
      onConflict: 'company_id,store_id,year_month'
    })

  if (upsertError) {
    throw new Error(`Failed to upsert summary: ${upsertError.message}`)
  }

  console.log(`Successfully processed: company=${companyId}, store=${storeId}, yearMonth=${yearMonth}`)
  return { skipped: false }
}
