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

    // ========================================
    // NPSタイプを判定する関数
    // ========================================
    const getNpsType = (score: number | null): string => {
      if (score === null || score === undefined) return 'unknown'
      if (score >= 9) return '推奨者'
      if (score >= 7) return '中立者'
      return '批判者'
    }

    // ========================================
    // 影響度スコアを取得する関数
    // NPS × 再来店意向 × 経験の組み合わせで影響度を決定
    // ========================================
    const getImpactScore = (nps: string, revisitIntent: boolean | null, experience: string): number => {
      // 推奨者
      if (nps === '推奨者') {
        if (revisitIntent === true && experience === 'リピーター') return 3  // 最も良い
        if (revisitIntent === true && experience === '新規') return 2
        if (revisitIntent === false && experience === 'リピーター') return 1
        if (revisitIntent === false && experience === '新規') return 0
      }
      // 中立者
      if (nps === '中立者') {
        if (revisitIntent === true && experience === 'リピーター') return 2
        if (revisitIntent === true && experience === '新規') return 0
        if (revisitIntent === false && experience === 'リピーター') return -2
        if (revisitIntent === false && experience === '新規') return 0
      }
      // 批判者
      if (nps === '批判者') {
        if (revisitIntent === true && experience === 'リピーター') return -2
        if (revisitIntent === true && experience === '新規') return 0
        if (revisitIntent === false && experience === 'リピーター') return -3  // 最も悪い
        if (revisitIntent === false && experience === '新規') return -2
      }
      return 0
    }

    // ========================================
    // セグメント別に集計
    // ========================================
    type SegmentKey = string
    const segmentCounts: Record<SegmentKey, number> = {}

    allAnswers.forEach(answer => {
      const nps = getNpsType(answer.p1_q1)
      if (nps === 'unknown') return

      const revisitIntent = answer.p1_q2
      const experience = answer.p1_q3 === '初めて' ? '新規' : 'リピーター'
      const revisitLabel = revisitIntent === true ? 'あり' : revisitIntent === false ? 'なし' : 'unknown'

      if (revisitLabel === 'unknown') return

      const key = `${nps}|${revisitLabel}|${experience}`
      segmentCounts[key] = (segmentCounts[key] || 0) + 1
    })

    // セグメントデータを構築
    const segments = Object.entries(segmentCounts).map(([key, count], index) => {
      const [nps, revisitIntent, experience] = key.split('|')
      const impact = getImpactScore(nps, revisitIntent === 'あり', experience)

      // グループ分類（A: ポジティブ影響, B: ネガティブ影響, C: その他）
      let group = 'C'
      if (impact >= 2) group = 'A'
      else if (impact <= -2) group = 'B'

      return {
        id: index + 1,
        nps,
        revisitIntent,
        experience,
        impact,
        group,
        count
      }
    })

    // ========================================
    // カテゴリー別集計
    // ========================================
    const categoryData = {
      // 新規リピーター（新規 × 再来店意向あり）
      newRepeaters: {
        count: 0,
        impact: 0,
        nps: { promoters: 0, neutrals: 0, detractors: 0 }
      },
      // 安定リピーター（リピーター × 再来店意向あり）
      stableRepeaters: {
        count: 0,
        impact: 0,
        nps: { promoters: 0, neutrals: 0, detractors: 0 }
      },
      // 離脱リスク（リピーター × 再来店意向なし）
      churnRisk: {
        count: 0,
        impact: 0,
        nps: { promoters: 0, neutrals: 0, detractors: 0 }
      },
      // 新規離脱（新規 × 再来店意向なし）
      newChurn: {
        count: 0,
        impact: 0,
        nps: { promoters: 0, neutrals: 0, detractors: 0 }
      }
    }

    segments.forEach(seg => {
      const totalImpact = seg.impact * seg.count
      const npsKey = seg.nps === '推奨者' ? 'promoters' : seg.nps === '中立者' ? 'neutrals' : 'detractors'

      if (seg.experience === '新規' && seg.revisitIntent === 'あり') {
        categoryData.newRepeaters.count += seg.count
        categoryData.newRepeaters.impact += totalImpact
        categoryData.newRepeaters.nps[npsKey] += seg.count
      } else if (seg.experience === 'リピーター' && seg.revisitIntent === 'あり') {
        categoryData.stableRepeaters.count += seg.count
        categoryData.stableRepeaters.impact += totalImpact
        categoryData.stableRepeaters.nps[npsKey] += seg.count
      } else if (seg.experience === 'リピーター' && seg.revisitIntent === 'なし') {
        categoryData.churnRisk.count += seg.count
        categoryData.churnRisk.impact += totalImpact
        categoryData.churnRisk.nps[npsKey] += seg.count
      } else if (seg.experience === '新規' && seg.revisitIntent === 'なし') {
        categoryData.newChurn.count += seg.count
        categoryData.newChurn.impact += totalImpact
        categoryData.newChurn.nps[npsKey] += seg.count
      }
    })

    // ========================================
    // 総合スコア計算
    // ========================================
    const totalCount = segments.reduce((sum, s) => sum + s.count, 0)
    const totalScore = segments.reduce((sum, s) => sum + (s.impact * s.count), 0)
    const positiveScore = segments
      .filter(s => s.impact > 0)
      .reduce((sum, s) => sum + (s.impact * s.count), 0)
    const negativeScore = segments
      .filter(s => s.impact < 0)
      .reduce((sum, s) => sum + (Math.abs(s.impact) * s.count), 0)

    // 正規化スコア（0-100）
    const maxPossibleScore = totalCount * 3
    const normalizedScore = maxPossibleScore > 0
      ? Math.round(((totalScore + maxPossibleScore) / (2 * maxPossibleScore)) * 100)
      : 50

    // ========================================
    // 月別データの計算
    // ========================================
    const monthlyData: Record<string, {
      score: number
      positive: number
      negative: number
      total: number
    }> = {}

    allAnswers.forEach(answer => {
      const nps = getNpsType(answer.p1_q1)
      if (nps === 'unknown') return

      const revisitIntent = answer.p1_q2
      if (revisitIntent === null || revisitIntent === undefined) return

      const experience = answer.p1_q3 === '初めて' ? '新規' : 'リピーター'
      const impact = getImpactScore(nps, revisitIntent, experience)

      const date = new Date(answer.created_at)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const monthLabel = `${date.getMonth() + 1}月`

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          score: 0,
          positive: 0,
          negative: 0,
          total: 0
        }
      }

      monthlyData[monthKey].total++
      if (impact > 0) {
        monthlyData[monthKey].positive += impact
      } else if (impact < 0) {
        monthlyData[monthKey].negative += Math.abs(impact)
      }
    })

    // 月別トレンドデータを計算
    const sortedMonths = Object.keys(monthlyData).sort()
    const trendData = sortedMonths.map(key => {
      const data = monthlyData[key]
      const monthNum = parseInt(key.split('-')[1])
      const maxScore = data.total * 3
      const netScore = data.positive - data.negative
      const score = maxScore > 0
        ? Math.round(((netScore + maxScore) / (2 * maxScore)) * 100)
        : 50

      return {
        month: `${monthNum}月`,
        score,
        positive: data.positive,
        negative: data.negative
      }
    }).slice(-6) // 直近6ヶ月

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          segments,
          categoryData,
          totalCount,
          totalScore,
          positiveScore,
          negativeScore,
          normalizedScore,
          trendData
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Get sales impact error:', error)

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
