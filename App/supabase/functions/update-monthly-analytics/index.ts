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

    // オプション: target_year_month で対象月を指定可能（履歴データ再集計用）
    // 指定時: その月のみ再集計、指定なし: 従来通り「今月＋先月」を集計
    let targetYearMonth: string | null = null
    try {
      const body = await req.json().catch(() => ({}))
      if (body && typeof body.target_year_month === 'string' && /^\d{4}-\d{2}$/.test(body.target_year_month)) {
        targetYearMonth = body.target_year_month
      }
    } catch (_) {
      // no body / invalid json — 従来通り動作
    }

    // 日本時間で現在の年月を取得
    const jstOffset = 9 * 60 * 60 * 1000 // 9時間

    let yearMonth: string
    let prevYearMonth: string | null
    let monthStart: Date
    let monthEnd: Date
    let prevMonthStart: Date | null
    let prevMonthEnd: Date | null

    if (targetYearMonth) {
      // 指定月のみ処理（履歴修正用途）
      const [ty, tm] = targetYearMonth.split('-').map(Number)
      yearMonth = targetYearMonth
      prevYearMonth = null
      monthStart = new Date(Date.UTC(ty, tm - 1, 1) - jstOffset)
      monthEnd = new Date(Date.UTC(ty, tm, 0, 23, 59, 59, 999) - jstOffset)
      prevMonthStart = null
      prevMonthEnd = null
    } else {
      const now = new Date()
      const jstNow = new Date(now.getTime() + jstOffset)
      yearMonth = `${jstNow.getFullYear()}-${String(jstNow.getMonth() + 1).padStart(2, '0')}`

      // 先月の年月を計算
      const prevMonth = new Date(jstNow.getFullYear(), jstNow.getMonth() - 1, 1)
      prevYearMonth = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`

      // 今月の開始日と終了日（UTC）
      monthStart = new Date(Date.UTC(jstNow.getFullYear(), jstNow.getMonth(), 1) - jstOffset)
      monthEnd = new Date(Date.UTC(jstNow.getFullYear(), jstNow.getMonth() + 1, 0, 23, 59, 59, 999) - jstOffset)

      // 先月の開始日と終了日（UTC）
      prevMonthStart = new Date(Date.UTC(prevMonth.getFullYear(), prevMonth.getMonth(), 1) - jstOffset)
      prevMonthEnd = new Date(Date.UTC(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 0, 23, 59, 59, 999) - jstOffset)
    }

    console.log(`Processing monthly analytics for ${yearMonth}${prevYearMonth ? ` and ${prevYearMonth}` : ' (target specified, skipping prev)'}`)
    console.log(`Current month range: ${monthStart.toISOString()} to ${monthEnd.toISOString()}`)
    if (prevMonthStart && prevMonthEnd) {
      console.log(`Previous month range: ${prevMonthStart.toISOString()} to ${prevMonthEnd.toISOString()}`)
    }

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
        // 今月分
        try {
          const result = await processAnalytics(supabaseAdmin, company.id, store.id, yearMonth, monthStart, monthEnd)
          if (result.skipped) {
            results.push({ companyId: company.id, storeId: store.id, status: 'skipped', message: `No responses for ${yearMonth}` })
          } else {
            results.push({ companyId: company.id, storeId: store.id, status: 'success' })
          }
        } catch (storeError) {
          console.error(`Error processing store ${store.id} for ${yearMonth}:`, storeError)
          results.push({ companyId: company.id, storeId: store.id, status: 'error', message: storeError.message })
        }

        // 先月分（target_year_month 指定時はスキップ）
        if (prevYearMonth && prevMonthStart && prevMonthEnd) {
          try {
            const result = await processAnalytics(supabaseAdmin, company.id, store.id, prevYearMonth, prevMonthStart, prevMonthEnd)
            if (result.skipped) {
              results.push({ companyId: company.id, storeId: store.id, status: 'skipped', message: `No responses for ${prevYearMonth}` })
            } else {
              results.push({ companyId: company.id, storeId: store.id, status: 'success', message: `prev month ${prevYearMonth}` })
            }
          } catch (storeError) {
            console.error(`Error processing store ${store.id} for ${prevYearMonth}:`, storeError)
            results.push({ companyId: company.id, storeId: store.id, status: 'error', message: `prev: ${storeError.message}` })
          }
        }
      }
    }

    // ========================================
    // 加重平均を計算して monthly_analytics_summary_avg に記録
    // ========================================
    const avgTargetMonths = prevYearMonth ? [yearMonth, prevYearMonth] : [yearMonth]
    for (const targetMonth of avgTargetMonths) {
      try {
        await calculateAndUpsertAverage(supabaseAdmin, targetMonth)
        console.log(`Successfully calculated average for ${targetMonth}`)
      } catch (avgError) {
        console.error(`Error calculating average for ${targetMonth}:`, avgError)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        yearMonth,
        prevYearMonth,
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
      .select('q1, q2, q3, q4, q5, q6, q7, q8, q9, q10, is_positive, company_id, store_id, created_at, review_form_submission_id')
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
    // PostgREST の URL 長制限 (Kong ~8KB) 回避のため 100 件ずつバッチで取得
    // 東川口店のように 200 件超の月では単一 .in() が失敗し、リピーター/新規判定が
    // 空になり pref_repeater_* / pref_new_* が全 0 になる不具合を修正
    const BATCH_SIZE = 100
    for (let i = 0; i < submissionIds.length; i += BATCH_SIZE) {
      const batch = submissionIds.slice(i, i + BATCH_SIZE)
      const { data: answerData } = await supabase
        .from('preset_question_answer')
        .select('review_form_submission_id, p1_q3')
        .in('review_form_submission_id', batch)

      if (answerData) {
        answerData.forEach((a: any) => {
          if (a.review_form_submission_id) {
            customerTypeMap[a.review_form_submission_id] = a.p1_q3 || ''
          }
        })
      }
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

  // ========================================
  // 9. セグメントタイプ別集計
  // ========================================
  await processSegmentTypes(
    supabase, companyId, storeId, yearMonth,
    allAnswers, qualityData || [], serviceData || [], cleanlinessData || [],
    allFeatures, customerTypeMap
  )

  console.log(`Successfully processed: company=${companyId}, store=${storeId}, yearMonth=${yearMonth}`)
  return { skipped: false }
}

// ========================================
// セグメントタイプ別集計関数
// ========================================
async function processSegmentTypes(
  supabase: any,
  companyId: string,
  storeId: string,
  yearMonth: string,
  allAnswers: any[],
  qualityData: any[],
  serviceData: any[],
  cleanlinessData: any[],
  allFeatures: any[],
  customerTypeMap: Record<string, string>
) {
  const isRevisitYes = (revisitIntent: string | null): boolean | null => {
    if (revisitIntent === null || revisitIntent === undefined) return null
    if (revisitIntent === '1ヶ月以内' || revisitIntent === '3ヶ月以内') return true
    return false
  }
  const normalizeScore = (score: number) => ((score - 1) / 6) * 4 + 1

  // 12セグメント定義
  const segmentDefs = [
    { type: 1, nps: 'promoter', revisit: true, repeater: true },    // ロイヤル顧客
    { type: 2, nps: 'promoter', revisit: true, repeater: false },   // 期待の新規
    { type: 3, nps: 'promoter', revisit: false, repeater: true },   // 離脱リスク推奨者
    { type: 4, nps: 'promoter', revisit: false, repeater: false },  // 一見推奨者
    { type: 5, nps: 'passive', revisit: true, repeater: true },     // 安定中立
    { type: 6, nps: 'passive', revisit: true, repeater: false },    // 様子見新規
    { type: 7, nps: 'passive', revisit: false, repeater: true },    // 離脱リスク中立
    { type: 8, nps: 'passive', revisit: false, repeater: false },   // 低関心新規
    { type: 9, nps: 'detractor', revisit: true, repeater: true },   // 不満継続
    { type: 10, nps: 'detractor', revisit: true, repeater: false }, // 改善余地新規
    { type: 11, nps: 'detractor', revisit: false, repeater: true }, // リピーター離脱
    { type: 12, nps: 'detractor', revisit: false, repeater: false }, // 新規離脱
  ]

  // 有効な回答（3つの分類フィールドが全てあるもの）
  const validAnswers = allAnswers.filter((a: any) =>
    a.p1_q1 !== null && a.p1_q2 !== null && a.p1_q3 !== null
  )

  if (validAnswers.length === 0) return

  // NPS判定ヘルパー
  const matchNps = (score: number, npsType: string): boolean => {
    if (npsType === 'promoter') return score >= 9
    if (npsType === 'passive') return score >= 7 && score <= 8
    return score <= 6
  }

  // 既存レコード削除
  await supabase
    .from('monthly_analytics_summary_by_type')
    .delete()
    .eq('company_id', companyId)
    .eq('store_id', storeId)
    .eq('year_month', yearMonth)

  // QSC項目別集計ヘルパー
  const calcItemStats = (data: any[], idx: number) => {
    const fn = `q${idx}`
    const items = data.filter((a: any) => a[fn] !== null && a[fn] !== undefined)
    const t = items.length
    if (t === 0) return { positive: 0, negative: 0, neutral: 0, total: 0 }
    return {
      positive: Math.round((items.filter((a: any) => a[fn] === 'positive').length / t) * 100),
      negative: Math.round((items.filter((a: any) => a[fn] === 'negative').length / t) * 100),
      neutral: Math.round((items.filter((a: any) => a[fn] === 'neutral').length / t) * 100),
      total: t
    }
  }

  const calcCatTotals = (data: any[]) => ({
    positive: data.filter((a: any) => a.is_positive === true).length,
    negative: data.filter((a: any) => a.is_positive === false).length,
    neutral: data.filter((a: any) => a.is_positive === null).length,
  })

  const preferenceCategories = ['品質', '接客', '空間', '衛生', '価格感度']
  const TOP_WEIGHT = 2
  const SECOND_WEIGHT = 1

  const calcRawScores = (features: any[]) => {
    const scores: Record<string, number> = {}
    preferenceCategories.forEach(cat => scores[cat] = 0)
    features.forEach((f: any) => {
      if (f.top_preference && preferenceCategories.includes(f.top_preference)) scores[f.top_preference] += TOP_WEIGHT
      if (f.second_preference && preferenceCategories.includes(f.second_preference)) scores[f.second_preference] += SECOND_WEIGHT
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

  for (const segDef of segmentDefs) {
    // このセグメントの回答をフィルタ
    const segAnswers = validAnswers.filter((a: any) =>
      matchNps(a.p1_q1, segDef.nps) &&
      isRevisitYes(a.p1_q2) === segDef.revisit &&
      (segDef.repeater ? a.p1_q3 !== '初めて' : a.p1_q3 === '初めて')
    )

    if (segAnswers.length === 0) continue

    const totalResponses = segAnswers.length
    const segSubmissionIds = new Set(
      segAnswers.map((a: any) => a.review_form_submission_id).filter(Boolean)
    )

    // --- NPS ---
    const promoters = segAnswers.filter((a: any) => a.p1_q1 >= 9)
    const passives = segAnswers.filter((a: any) => a.p1_q1 >= 7 && a.p1_q1 <= 8)
    const detractors = segAnswers.filter((a: any) => a.p1_q1 <= 6)
    const npsTotal = totalResponses
    const promoterPct = npsTotal > 0 ? Math.round((promoters.length / npsTotal) * 100) : 0
    const passivePct = npsTotal > 0 ? Math.round((passives.length / npsTotal) * 100) : 0
    const detractorPct = npsTotal > 0 ? Math.round((detractors.length / npsTotal) * 100) : 0

    // --- リピート率 ---
    const visitAnswers = segAnswers.filter((a: any) => a.p1_q3 !== null)
    const repeaters = visitAnswers.filter((a: any) => a.p1_q3 !== '初めて')
    const newCust = visitAnswers.filter((a: any) => a.p1_q3 === '初めて')
    const repeatRate = visitAnswers.length > 0 ? Math.round((repeaters.length / visitAnswers.length) * 1000) / 10 : 0

    // --- 再来店意向 ---
    const repWithIntent = repeaters.filter((a: any) => a.p1_q2 !== null)
    const repYes = repWithIntent.filter((a: any) => isRevisitYes(a.p1_q2) === true)
    const repNo = repWithIntent.filter((a: any) => isRevisitYes(a.p1_q2) === false)
    const repRevisitRate = repWithIntent.length > 0 ? Math.round((repYes.length / repWithIntent.length) * 1000) / 10 : 0

    const newWithIntent = newCust.filter((a: any) => a.p1_q2 !== null)
    const newYes = newWithIntent.filter((a: any) => isRevisitYes(a.p1_q2) === true)
    const newNo = newWithIntent.filter((a: any) => isRevisitYes(a.p1_q2) === false)
    const newRevisitRate = newWithIntent.length > 0 ? Math.round((newYes.length / newWithIntent.length) * 1000) / 10 : 0

    // --- 12セグメント（セグメント内分布） ---
    const getSegData = (nt: string, rv: boolean, rp: boolean) => {
      const f = segAnswers.filter((a: any) =>
        matchNps(a.p1_q1, nt) && isRevisitYes(a.p1_q2) === rv &&
        (rp ? a.p1_q3 !== '初めて' : a.p1_q3 === '初めて')
      )
      return { count: f.length, percent: totalResponses > 0 ? Math.round((f.length / totalResponses) * 1000) / 10 : 0 }
    }
    const s1 = getSegData('promoter', true, true), s2 = getSegData('promoter', true, false)
    const s3 = getSegData('promoter', false, true), s4 = getSegData('promoter', false, false)
    const s5 = getSegData('passive', true, true), s6 = getSegData('passive', true, false)
    const s7 = getSegData('passive', false, true), s8 = getSegData('passive', false, false)
    const s9 = getSegData('detractor', true, true), s10 = getSegData('detractor', true, false)
    const s11 = getSegData('detractor', false, true), s12 = getSegData('detractor', false, false)

    const posImpact = s1.count + s2.count + s5.count + s6.count
    const negImpact = s11.count + s12.count + s7.count + s8.count

    // --- QSCスコア ---
    const calcQsc = (field: string) => {
      const v = segAnswers.filter((a: any) => a[field] !== null && a[field] !== undefined)
      if (v.length === 0) return { score: 0, count: 0 }
      const sum = v.reduce((acc: number, a: any) => acc + normalizeScore(Number(a[field])), 0)
      return { score: Math.round((sum / v.length) * 100) / 100, count: v.length }
    }
    const qscQ = calcQsc('p2_q1'), qscS = calcQsc('p2_q2'), qscC = calcQsc('p2_q3')

    // --- QSC項目別（submission_idでフィルタ） ---
    const segQD = qualityData.filter((d: any) => segSubmissionIds.has(d.review_form_submission_id))
    const segSD = serviceData.filter((d: any) => segSubmissionIds.has(d.review_form_submission_id))
    const segCD = cleanlinessData.filter((d: any) => segSubmissionIds.has(d.review_form_submission_id))
    const qTotals = calcCatTotals(segQD), sTotals = calcCatTotals(segSD), cTotals = calcCatTotals(segCD)

    // --- 性別分布 ---
    const gCounts: Record<string, number> = { '男性': 0, '女性': 0, 'その他': 0 }
    segAnswers.forEach((a: any) => {
      if (a.p1_q4) { if (a.p1_q4 === '男性') gCounts['男性']++; else if (a.p1_q4 === '女性') gCounts['女性']++; else gCounts['その他']++ }
    })
    const gTotal = Object.values(gCounts).reduce((a, b) => a + b, 0)

    // --- 年齢分布 ---
    const aCounts: Record<string, number> = { '20代': 0, '30代': 0, '40代': 0, '50代': 0, '60代以上': 0 }
    segAnswers.forEach((a: any) => {
      const age = a.p1_q5 || ''
      if (age.includes('20') || age === '20代') aCounts['20代']++
      else if (age.includes('30') || age === '30代') aCounts['30代']++
      else if (age.includes('40') || age === '40代') aCounts['40代']++
      else if (age.includes('50') || age === '50代') aCounts['50代']++
      else if (age.includes('60') || age === '60代' || age === '60代以上') aCounts['60代以上']++
    })
    const aTotal = Object.values(aCounts).reduce((a, b) => a + b, 0)

    // --- 同行者分布 ---
    const cmpCounts: Record<string, number> = { '1人': 0, 'カップル': 0, '友人': 0, '家族': 0, 'ビジネス': 0, 'その他': 0 }
    segAnswers.forEach((a: any) => {
      const c = a.p1_q6 || ''
      if (c.includes('1人') || c.includes('ひとり')) cmpCounts['1人']++
      else if (c.includes('カップル') || c.includes('恋人')) cmpCounts['カップル']++
      else if (c.includes('友人') || c.includes('友達')) cmpCounts['友人']++
      else if (c.includes('家族')) cmpCounts['家族']++
      else if (c.includes('ビジネス') || c.includes('仕事') || c.includes('同僚')) cmpCounts['ビジネス']++
      else if (c) cmpCounts['その他']++
    })
    const cmpTotal = Object.values(cmpCounts).reduce((a, b) => a + b, 0)

    // --- 顧客重視ポイント ---
    const segFeatures = allFeatures.filter((f: any) =>
      f.review_form_submission_id && segSubmissionIds.has(f.review_form_submission_id)
    )
    const segRepFeatures = segFeatures.filter((f: any) => {
      const ct = customerTypeMap[f.review_form_submission_id] || ''
      return ct && ct !== '初めて'
    })
    const segNewFeatures = segFeatures.filter((f: any) => {
      const ct = customerTypeMap[f.review_form_submission_id] || ''
      return ct === '初めて'
    })
    const totalScores = normalizeToMax100(calcRawScores(segFeatures))
    const repeaterScores = normalizeToMax100(calcRawScores(segRepFeatures))
    const newScores = normalizeToMax100(calcRawScores(segNewFeatures))

    // --- データ構築 ---
    const typeData: Record<string, any> = {
      company_id: companyId, store_id: storeId, year_month: yearMonth, type: segDef.type,
      total_responses: totalResponses,
      nps_score: promoterPct - detractorPct,
      nps_promoters_percent: promoterPct, nps_passives_percent: passivePct, nps_detractors_percent: detractorPct,
      nps_promoters_count: promoters.length, nps_passives_count: passives.length, nps_detractors_count: detractors.length,
      repeat_rate: repeatRate, repeater_count: repeaters.length, new_customer_count: newCust.length,
      repeater_revisit_rate: repRevisitRate, repeater_revisit_yes_count: repYes.length, repeater_revisit_no_count: repNo.length,
      new_revisit_rate: newRevisitRate, new_revisit_yes_count: newYes.length, new_revisit_no_count: newNo.length,
      seg_promoter_revisit_repeater_count: s1.count, seg_promoter_revisit_repeater_percent: s1.percent,
      seg_promoter_revisit_new_count: s2.count, seg_promoter_revisit_new_percent: s2.percent,
      seg_promoter_norevisit_repeater_count: s3.count, seg_promoter_norevisit_repeater_percent: s3.percent,
      seg_promoter_norevisit_new_count: s4.count, seg_promoter_norevisit_new_percent: s4.percent,
      seg_passive_revisit_repeater_count: s5.count, seg_passive_revisit_repeater_percent: s5.percent,
      seg_passive_revisit_new_count: s6.count, seg_passive_revisit_new_percent: s6.percent,
      seg_passive_norevisit_repeater_count: s7.count, seg_passive_norevisit_repeater_percent: s7.percent,
      seg_passive_norevisit_new_count: s8.count, seg_passive_norevisit_new_percent: s8.percent,
      seg_detractor_revisit_repeater_count: s9.count, seg_detractor_revisit_repeater_percent: s9.percent,
      seg_detractor_revisit_new_count: s10.count, seg_detractor_revisit_new_percent: s10.percent,
      seg_detractor_norevisit_repeater_count: s11.count, seg_detractor_norevisit_repeater_percent: s11.percent,
      seg_detractor_norevisit_new_count: s12.count, seg_detractor_norevisit_new_percent: s12.percent,
      positive_impact_count: posImpact,
      positive_impact_percent: totalResponses > 0 ? Math.round((posImpact / totalResponses) * 1000) / 10 : 0,
      negative_impact_count: negImpact,
      negative_impact_percent: totalResponses > 0 ? Math.round((negImpact / totalResponses) * 1000) / 10 : 0,
      qsc_quality_score: qscQ.score, qsc_quality_count: qscQ.count,
      qsc_service_score: qscS.score, qsc_service_count: qscS.count,
      qsc_cleanliness_score: qscC.score, qsc_cleanliness_count: qscC.count,
      quality_positive_count: qTotals.positive, quality_negative_count: qTotals.negative, quality_neutral_count: qTotals.neutral,
      service_positive_count: sTotals.positive, service_negative_count: sTotals.negative, service_neutral_count: sTotals.neutral,
      cleanliness_positive_count: cTotals.positive, cleanliness_negative_count: cTotals.negative, cleanliness_neutral_count: cTotals.neutral,
      gender_male_count: gCounts['男性'], gender_male_percent: gTotal > 0 ? Math.round((gCounts['男性'] / gTotal) * 100) : 0,
      gender_female_count: gCounts['女性'], gender_female_percent: gTotal > 0 ? Math.round((gCounts['女性'] / gTotal) * 100) : 0,
      gender_other_count: gCounts['その他'], gender_other_percent: gTotal > 0 ? Math.round((gCounts['その他'] / gTotal) * 100) : 0,
      age_20s_count: aCounts['20代'], age_20s_percent: aTotal > 0 ? Math.round((aCounts['20代'] / aTotal) * 100) : 0,
      age_30s_count: aCounts['30代'], age_30s_percent: aTotal > 0 ? Math.round((aCounts['30代'] / aTotal) * 100) : 0,
      age_40s_count: aCounts['40代'], age_40s_percent: aTotal > 0 ? Math.round((aCounts['40代'] / aTotal) * 100) : 0,
      age_50s_count: aCounts['50代'], age_50s_percent: aTotal > 0 ? Math.round((aCounts['50代'] / aTotal) * 100) : 0,
      age_60plus_count: aCounts['60代以上'], age_60plus_percent: aTotal > 0 ? Math.round((aCounts['60代以上'] / aTotal) * 100) : 0,
      companion_alone_count: cmpCounts['1人'], companion_alone_percent: cmpTotal > 0 ? Math.round((cmpCounts['1人'] / cmpTotal) * 100) : 0,
      companion_couple_count: cmpCounts['カップル'], companion_couple_percent: cmpTotal > 0 ? Math.round((cmpCounts['カップル'] / cmpTotal) * 100) : 0,
      companion_friends_count: cmpCounts['友人'], companion_friends_percent: cmpTotal > 0 ? Math.round((cmpCounts['友人'] / cmpTotal) * 100) : 0,
      companion_family_count: cmpCounts['家族'], companion_family_percent: cmpTotal > 0 ? Math.round((cmpCounts['家族'] / cmpTotal) * 100) : 0,
      companion_business_count: cmpCounts['ビジネス'], companion_business_percent: cmpTotal > 0 ? Math.round((cmpCounts['ビジネス'] / cmpTotal) * 100) : 0,
      companion_other_count: cmpCounts['その他'], companion_other_percent: cmpTotal > 0 ? Math.round((cmpCounts['その他'] / cmpTotal) * 100) : 0,
      pref_total_quality: totalScores['品質'] || 0, pref_total_service: totalScores['接客'] || 0,
      pref_total_atmosphere: totalScores['空間'] || 0, pref_total_hygiene: totalScores['衛生'] || 0, pref_total_price: totalScores['価格感度'] || 0,
      pref_repeater_quality: repeaterScores['品質'] || 0, pref_repeater_service: repeaterScores['接客'] || 0,
      pref_repeater_atmosphere: repeaterScores['空間'] || 0, pref_repeater_hygiene: repeaterScores['衛生'] || 0, pref_repeater_price: repeaterScores['価格感度'] || 0,
      pref_new_quality: newScores['品質'] || 0, pref_new_service: newScores['接客'] || 0,
      pref_new_atmosphere: newScores['空間'] || 0, pref_new_hygiene: newScores['衛生'] || 0, pref_new_price: newScores['価格感度'] || 0,
    }

    // QSC項目別（ループで追加）
    for (let i = 1; i <= 10; i++) {
      const qi = calcItemStats(segQD, i), si = calcItemStats(segSD, i), ci = calcItemStats(segCD, i)
      typeData[`q${i}_positive_percent`] = qi.positive; typeData[`q${i}_negative_percent`] = qi.negative
      typeData[`q${i}_neutral_percent`] = qi.neutral; typeData[`q${i}_total_count`] = qi.total
      typeData[`s${i}_positive_percent`] = si.positive; typeData[`s${i}_negative_percent`] = si.negative
      typeData[`s${i}_neutral_percent`] = si.neutral; typeData[`s${i}_total_count`] = si.total
      typeData[`c${i}_positive_percent`] = ci.positive; typeData[`c${i}_negative_percent`] = ci.negative
      typeData[`c${i}_neutral_percent`] = ci.neutral; typeData[`c${i}_total_count`] = ci.total
    }

    const { error: insertError } = await supabase
      .from('monthly_analytics_summary_by_type')
      .insert(typeData)

    if (insertError) {
      console.error(`Failed to insert type ${segDef.type} for store ${storeId}:`, insertError.message)
    }
  }

  console.log(`Segment types processed for store=${storeId}, yearMonth=${yearMonth}`)
}

// ========================================
// 加重平均計算・UPSERT関数
// ========================================
async function calculateAndUpsertAverage(supabase: any, yearMonth: string) {
  // 該当月の全店舗サマリーを取得
  const { data: summaries, error: fetchError } = await supabase
    .from('monthly_analytics_summary')
    .select('*')
    .eq('year_month', yearMonth)

  if (fetchError) {
    throw new Error(`Failed to fetch summaries for avg: ${fetchError.message}`)
  }

  if (!summaries || summaries.length === 0) {
    console.log(`No summaries found for ${yearMonth}, skipping average calculation`)
    return
  }

  const totalWeight = summaries.reduce((sum: number, s: any) => sum + (s.total_responses || 0), 0)

  if (totalWeight === 0) {
    console.log(`Total responses is 0 for ${yearMonth}, skipping average calculation`)
    return
  }

  // 加重平均ヘルパー（weight = total_responses）
  const weightedAvg = (field: string): number => {
    let weightedSum = 0
    let w = 0
    for (const s of summaries) {
      const val = s[field]
      const weight = s.total_responses || 0
      if (val !== null && val !== undefined && weight > 0) {
        weightedSum += val * weight
        w += weight
      }
    }
    return w > 0 ? Math.round((weightedSum / w) * 100) / 100 : 0
  }

  // 加重平均（カスタムウェイト）
  const weightedAvgBy = (field: string, weightField: string): number => {
    let weightedSum = 0
    let w = 0
    for (const s of summaries) {
      const val = s[field]
      const weight = s[weightField] || 0
      if (val !== null && val !== undefined && weight > 0) {
        weightedSum += val * weight
        w += weight
      }
    }
    return w > 0 ? Math.round((weightedSum / w) * 100) / 100 : 0
  }

  // 合計ヘルパー
  const sumField = (field: string): number => {
    return summaries.reduce((sum: number, s: any) => sum + (s[field] || 0), 0)
  }

  // 整数に丸める加重平均
  const weightedAvgInt = (field: string): number => Math.round(weightedAvg(field))

  const avgData: Record<string, any> = {
    year_month: yearMonth,

    // 回答数合計
    total_responses: sumField('total_responses'),

    // NPS（加重平均）
    nps_score: weightedAvgInt('nps_score'),
    nps_promoters_percent: weightedAvgInt('nps_promoters_percent'),
    nps_passives_percent: weightedAvgInt('nps_passives_percent'),
    nps_detractors_percent: weightedAvgInt('nps_detractors_percent'),
    nps_promoters_count: sumField('nps_promoters_count'),
    nps_passives_count: sumField('nps_passives_count'),
    nps_detractors_count: sumField('nps_detractors_count'),

    // リピート率（加重平均）
    repeat_rate: weightedAvg('repeat_rate'),
    repeater_count: sumField('repeater_count'),
    new_customer_count: sumField('new_customer_count'),
    repeater_revisit_rate: weightedAvg('repeater_revisit_rate'),
    repeater_revisit_yes_count: sumField('repeater_revisit_yes_count'),
    repeater_revisit_no_count: sumField('repeater_revisit_no_count'),
    new_revisit_rate: weightedAvg('new_revisit_rate'),
    new_revisit_yes_count: sumField('new_revisit_yes_count'),
    new_revisit_no_count: sumField('new_revisit_no_count'),

    // 12セグメント（カウントは合計、パーセントは加重平均）
    seg_promoter_revisit_repeater_count: sumField('seg_promoter_revisit_repeater_count'),
    seg_promoter_revisit_repeater_percent: weightedAvg('seg_promoter_revisit_repeater_percent'),
    seg_promoter_revisit_new_count: sumField('seg_promoter_revisit_new_count'),
    seg_promoter_revisit_new_percent: weightedAvg('seg_promoter_revisit_new_percent'),
    seg_promoter_norevisit_repeater_count: sumField('seg_promoter_norevisit_repeater_count'),
    seg_promoter_norevisit_repeater_percent: weightedAvg('seg_promoter_norevisit_repeater_percent'),
    seg_promoter_norevisit_new_count: sumField('seg_promoter_norevisit_new_count'),
    seg_promoter_norevisit_new_percent: weightedAvg('seg_promoter_norevisit_new_percent'),
    seg_passive_revisit_repeater_count: sumField('seg_passive_revisit_repeater_count'),
    seg_passive_revisit_repeater_percent: weightedAvg('seg_passive_revisit_repeater_percent'),
    seg_passive_revisit_new_count: sumField('seg_passive_revisit_new_count'),
    seg_passive_revisit_new_percent: weightedAvg('seg_passive_revisit_new_percent'),
    seg_passive_norevisit_repeater_count: sumField('seg_passive_norevisit_repeater_count'),
    seg_passive_norevisit_repeater_percent: weightedAvg('seg_passive_norevisit_repeater_percent'),
    seg_passive_norevisit_new_count: sumField('seg_passive_norevisit_new_count'),
    seg_passive_norevisit_new_percent: weightedAvg('seg_passive_norevisit_new_percent'),
    seg_detractor_revisit_repeater_count: sumField('seg_detractor_revisit_repeater_count'),
    seg_detractor_revisit_repeater_percent: weightedAvg('seg_detractor_revisit_repeater_percent'),
    seg_detractor_revisit_new_count: sumField('seg_detractor_revisit_new_count'),
    seg_detractor_revisit_new_percent: weightedAvg('seg_detractor_revisit_new_percent'),
    seg_detractor_norevisit_repeater_count: sumField('seg_detractor_norevisit_repeater_count'),
    seg_detractor_norevisit_repeater_percent: weightedAvg('seg_detractor_norevisit_repeater_percent'),
    seg_detractor_norevisit_new_count: sumField('seg_detractor_norevisit_new_count'),
    seg_detractor_norevisit_new_percent: weightedAvg('seg_detractor_norevisit_new_percent'),

    // ポジティブ・ネガティブ影響
    positive_impact_count: sumField('positive_impact_count'),
    positive_impact_percent: weightedAvg('positive_impact_percent'),
    negative_impact_count: sumField('negative_impact_count'),
    negative_impact_percent: weightedAvg('negative_impact_percent'),

    // QSCスコア（各カテゴリのcountで加重平均）
    qsc_quality_score: weightedAvgBy('qsc_quality_score', 'qsc_quality_count'),
    qsc_quality_count: sumField('qsc_quality_count'),
    qsc_service_score: weightedAvgBy('qsc_service_score', 'qsc_service_count'),
    qsc_service_count: sumField('qsc_service_count'),
    qsc_cleanliness_score: weightedAvgBy('qsc_cleanliness_score', 'qsc_cleanliness_count'),
    qsc_cleanliness_count: sumField('qsc_cleanliness_count'),

    // QSC カテゴリ別合計
    quality_positive_count: sumField('quality_positive_count'),
    quality_negative_count: sumField('quality_negative_count'),
    quality_neutral_count: sumField('quality_neutral_count'),
    service_positive_count: sumField('service_positive_count'),
    service_negative_count: sumField('service_negative_count'),
    service_neutral_count: sumField('service_neutral_count'),
    cleanliness_positive_count: sumField('cleanliness_positive_count'),
    cleanliness_negative_count: sumField('cleanliness_negative_count'),
    cleanliness_neutral_count: sumField('cleanliness_neutral_count'),

    // 性別（カウント合計、パーセントは加重平均）
    gender_male_count: sumField('gender_male_count'),
    gender_male_percent: weightedAvgInt('gender_male_percent'),
    gender_female_count: sumField('gender_female_count'),
    gender_female_percent: weightedAvgInt('gender_female_percent'),
    gender_other_count: sumField('gender_other_count'),
    gender_other_percent: weightedAvgInt('gender_other_percent'),

    // 年齢
    age_20s_count: sumField('age_20s_count'),
    age_20s_percent: weightedAvgInt('age_20s_percent'),
    age_30s_count: sumField('age_30s_count'),
    age_30s_percent: weightedAvgInt('age_30s_percent'),
    age_40s_count: sumField('age_40s_count'),
    age_40s_percent: weightedAvgInt('age_40s_percent'),
    age_50s_count: sumField('age_50s_count'),
    age_50s_percent: weightedAvgInt('age_50s_percent'),
    age_60plus_count: sumField('age_60plus_count'),
    age_60plus_percent: weightedAvgInt('age_60plus_percent'),

    // 同行者
    companion_alone_count: sumField('companion_alone_count'),
    companion_alone_percent: weightedAvgInt('companion_alone_percent'),
    companion_couple_count: sumField('companion_couple_count'),
    companion_couple_percent: weightedAvgInt('companion_couple_percent'),
    companion_friends_count: sumField('companion_friends_count'),
    companion_friends_percent: weightedAvgInt('companion_friends_percent'),
    companion_family_count: sumField('companion_family_count'),
    companion_family_percent: weightedAvgInt('companion_family_percent'),
    companion_business_count: sumField('companion_business_count'),
    companion_business_percent: weightedAvgInt('companion_business_percent'),
    companion_other_count: sumField('companion_other_count'),
    companion_other_percent: weightedAvgInt('companion_other_percent'),

    // 顧客重視ポイント（加重平均）
    pref_total_quality: weightedAvgInt('pref_total_quality'),
    pref_total_service: weightedAvgInt('pref_total_service'),
    pref_total_atmosphere: weightedAvgInt('pref_total_atmosphere'),
    pref_total_hygiene: weightedAvgInt('pref_total_hygiene'),
    pref_total_price: weightedAvgInt('pref_total_price'),
    pref_repeater_quality: weightedAvgInt('pref_repeater_quality'),
    pref_repeater_service: weightedAvgInt('pref_repeater_service'),
    pref_repeater_atmosphere: weightedAvgInt('pref_repeater_atmosphere'),
    pref_repeater_hygiene: weightedAvgInt('pref_repeater_hygiene'),
    pref_repeater_price: weightedAvgInt('pref_repeater_price'),
    pref_new_quality: weightedAvgInt('pref_new_quality'),
    pref_new_service: weightedAvgInt('pref_new_service'),
    pref_new_atmosphere: weightedAvgInt('pref_new_atmosphere'),
    pref_new_hygiene: weightedAvgInt('pref_new_hygiene'),
    pref_new_price: weightedAvgInt('pref_new_price'),
  }

  // QSC項目別（q1-q10, s1-s10, c1-c10）
  for (const prefix of ['q', 's', 'c']) {
    for (let i = 1; i <= 10; i++) {
      const totalCountField = `${prefix}${i}_total_count`
      avgData[`${prefix}${i}_positive_percent`] = weightedAvgInt(`${prefix}${i}_positive_percent`)
      avgData[`${prefix}${i}_negative_percent`] = weightedAvgInt(`${prefix}${i}_negative_percent`)
      avgData[`${prefix}${i}_neutral_percent`] = weightedAvgInt(`${prefix}${i}_neutral_percent`)
      avgData[totalCountField] = sumField(totalCountField)
    }
  }

  // UPSERT（year_monthで一意）
  // 既存レコードを確認してupsert
  const { data: existing } = await supabase
    .from('monthly_analytics_summary_avg')
    .select('id')
    .eq('year_month', yearMonth)
    .maybeSingle()

  if (existing) {
    const { error: updateError } = await supabase
      .from('monthly_analytics_summary_avg')
      .update(avgData)
      .eq('id', existing.id)

    if (updateError) {
      throw new Error(`Failed to update avg: ${updateError.message}`)
    }
  } else {
    const { error: insertError } = await supabase
      .from('monthly_analytics_summary_avg')
      .insert(avgData)

    if (insertError) {
      throw new Error(`Failed to insert avg: ${insertError.message}`)
    }
  }

  console.log(`Average calculated for ${yearMonth}: ${summaries.length} stores, ${totalWeight} total responses`)
}
