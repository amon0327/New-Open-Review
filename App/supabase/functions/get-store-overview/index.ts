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

    // 回答データを取得
    let query = supabaseAdmin
      .from('preset_question_answer')
      .select(`
        id,
        created_at,
        p1_q1,
        p1_q2,
        p1_q3,
        p1_q4,
        p1_q5,
        store_id,
        company_id
      `)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })

    if (storeId && storeId !== 'all') {
      query = query.eq('store_id', storeId)
    }

    const { data: answers, error: answersError } = await query

    if (answersError) {
      throw new Error(`データの取得に失敗しました: ${answersError.message}`)
    }

    const allAnswers = answers || []
    const totalCount = allAnswers.length

    // 店舗データを取得
    const { data: stores } = await supabaseAdmin
      .from('stores')
      .select('id, name')
      .eq('company_id', companyId)

    // === メトリクス計算 ===

    // ========================================
    // 再来店意向を判定する関数
    // 1ヶ月以内、3ヶ月以内 → true (再来店あり)
    // 6ヶ月以内、10ヶ月以内、1年以内、1年以上 → false (再来店なし)
    // ========================================
    const isRevisitYes = (revisitIntent: string | null): boolean | null => {
      if (revisitIntent === null || revisitIntent === undefined) return null
      if (revisitIntent === '1ヶ月以内' || revisitIntent === '3ヶ月以内') return true
      return false
    }

    // NPS計算
    const npsAnswers = allAnswers.filter(a => a.p1_q1 !== null)
    const promoters = npsAnswers.filter(a => a.p1_q1 >= 9).length
    const passives = npsAnswers.filter(a => a.p1_q1 >= 7 && a.p1_q1 <= 8).length
    const detractors = npsAnswers.filter(a => a.p1_q1 <= 6).length
    const npsTotal = promoters + passives + detractors

    const promoterPercent = npsTotal > 0 ? Math.round((promoters / npsTotal) * 100) : 0
    const passivePercent = npsTotal > 0 ? Math.round((passives / npsTotal) * 100) : 0
    const detractorPercent = npsTotal > 0 ? Math.round((detractors / npsTotal) * 100) : 0
    const npsScore = promoterPercent - detractorPercent

    // リピート率計算（p1_q3が「初めて」以外の人）
    const visitAnswers = allAnswers.filter(a => a.p1_q3 !== null)
    const repeaters = visitAnswers.filter(a => a.p1_q3 !== '初めて')
    const newCustomers = visitAnswers.filter(a => a.p1_q3 === '初めて')
    const repeatRate = visitAnswers.length > 0
      ? Math.round((repeaters.length / visitAnswers.length) * 1000) / 10
      : 0

    // 再来店意向計算（リピーター）
    const repeaterWithIntent = repeaters.filter(a => a.p1_q2 !== null)
    const repeaterRevisitYes = repeaterWithIntent.filter(a => isRevisitYes(a.p1_q2) === true).length
    const repeaterRevisitRate = repeaterWithIntent.length > 0
      ? Math.round((repeaterRevisitYes / repeaterWithIntent.length) * 1000) / 10
      : 0

    // 再来店意向計算（新規）
    const newWithIntent = newCustomers.filter(a => a.p1_q2 !== null)
    const newRevisitYes = newWithIntent.filter(a => isRevisitYes(a.p1_q2) === true).length
    const newRevisitRate = newWithIntent.length > 0
      ? Math.round((newRevisitYes / newWithIntent.length) * 1000) / 10
      : 0

    // 月別データ計算
    const monthlyData: Record<string, {
      month: string
      npsAnswers: any[]
      visitAnswers: any[]
      repeaters: any[]
      newCustomers: any[]
    }> = {}

    allAnswers.forEach(answer => {
      const date = new Date(answer.created_at)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const monthLabel = `${date.getMonth() + 1}月`

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthLabel,
          npsAnswers: [],
          visitAnswers: [],
          repeaters: [],
          newCustomers: []
        }
      }

      if (answer.p1_q1 !== null) {
        monthlyData[monthKey].npsAnswers.push(answer)
      }
      if (answer.p1_q3 !== null) {
        monthlyData[monthKey].visitAnswers.push(answer)
        if (answer.p1_q3 !== '初めて') {
          monthlyData[monthKey].repeaters.push(answer)
        } else {
          monthlyData[monthKey].newCustomers.push(answer)
        }
      }
    })

    // 月別パフォーマンスを計算
    const sortedMonths = Object.keys(monthlyData).sort()
    const monthlyPerformance = sortedMonths.map(key => {
      const data = monthlyData[key]
      const monthNpsAnswers = data.npsAnswers
      const monthPromoters = monthNpsAnswers.filter(a => a.p1_q1 >= 9).length
      const monthDetractors = monthNpsAnswers.filter(a => a.p1_q1 <= 6).length
      const monthNpsTotal = monthNpsAnswers.length
      const monthNps = monthNpsTotal > 0
        ? Math.round((monthPromoters / monthNpsTotal) * 100) - Math.round((monthDetractors / monthNpsTotal) * 100)
        : 0

      const monthRepeatRate = data.visitAnswers.length > 0
        ? Math.round((data.repeaters.length / data.visitAnswers.length) * 1000) / 10
        : 0

      const repeaterWithIntent = data.repeaters.filter(a => a.p1_q2 !== null)
      const repeaterRevisitYes = repeaterWithIntent.filter(a => isRevisitYes(a.p1_q2) === true).length
      const monthRepeaterRevisit = repeaterWithIntent.length > 0
        ? Math.round((repeaterRevisitYes / repeaterWithIntent.length) * 1000) / 10
        : 0

      const newWithIntent = data.newCustomers.filter(a => a.p1_q2 !== null)
      const newRevisitYes = newWithIntent.filter(a => isRevisitYes(a.p1_q2) === true).length
      const monthNewRevisit = newWithIntent.length > 0
        ? Math.round((newRevisitYes / newWithIntent.length) * 1000) / 10
        : 0

      return {
        month: data.month,
        nps: monthNps,
        repeatRate: monthRepeatRate,
        repeatVisit: monthRepeaterRevisit,
        newVisit: monthNewRevisit,
        responseCount: monthNpsTotal
      }
    })

    // 店舗別比較データ
    const storeComparison = (stores || []).map(store => {
      const storeAnswers = allAnswers.filter(a => a.store_id === store.id)
      const storeNpsAnswers = storeAnswers.filter(a => a.p1_q1 !== null)
      const storePromoters = storeNpsAnswers.filter(a => a.p1_q1 >= 9).length
      const storeDetractors = storeNpsAnswers.filter(a => a.p1_q1 <= 6).length
      const storeNpsTotal = storeNpsAnswers.length
      const storeNps = storeNpsTotal > 0
        ? Math.round((storePromoters / storeNpsTotal) * 100) - Math.round((storeDetractors / storeNpsTotal) * 100)
        : 0

      const storeVisitAnswers = storeAnswers.filter(a => a.p1_q3 !== null)
      const storeRepeaters = storeVisitAnswers.filter(a => a.p1_q3 !== '初めて')
      const storeRepeatRate = storeVisitAnswers.length > 0
        ? Math.round((storeRepeaters.length / storeVisitAnswers.length) * 1000) / 10
        : 0

      return {
        store: store.name,
        storeId: store.id,
        nps: storeNps,
        repeatRate: storeRepeatRate,
        responseCount: storeNpsTotal
      }
    }).sort((a, b) => b.nps - a.nps)

    // KPIデータ作成（直近3ヶ月分）
    const last3Months = monthlyPerformance.slice(-3)
    const currentMonth = last3Months[last3Months.length - 1] || { nps: 0, repeatRate: 0, repeatVisit: 0, newVisit: 0 }
    const prevMonth = last3Months[last3Months.length - 2] || currentMonth

    const kpiData = {
      nps: {
        current: npsScore,
        delta: currentMonth.nps - (prevMonth.nps || 0),
        sparkline: last3Months.map(m => m.nps)
      },
      repeatRate: {
        current: repeatRate,
        delta: Math.round((currentMonth.repeatRate - (prevMonth.repeatRate || 0)) * 10) / 10,
        sparkline: last3Months.map(m => m.repeatRate)
      },
      repeaterRevisit: {
        current: repeaterRevisitRate,
        delta: Math.round((currentMonth.repeatVisit - (prevMonth.repeatVisit || 0)) * 10) / 10,
        sparkline: last3Months.map(m => m.repeatVisit)
      },
      newRevisit: {
        current: newRevisitRate,
        delta: Math.round((currentMonth.newVisit - (prevMonth.newVisit || 0)) * 10) / 10,
        sparkline: last3Months.map(m => m.newVisit)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          totalResponses: totalCount,
          npsDistribution: {
            promoters: promoterPercent,
            passives: passivePercent,
            detractors: detractorPercent,
            npsScore: npsScore
          },
          kpi: kpiData,
          monthlyPerformance: monthlyPerformance,
          storeComparison: storeComparison
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Get store overview error:', error)

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
