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

    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') ?? ''
    if (!ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is not set')
    }

    // リクエストボディからtarget_year_monthを取得（オプション）
    let requestTargetYearMonth: string | null = null
    try {
      const body = await req.json()
      requestTargetYearMonth = body?.target_year_month || null
    } catch {
      // bodyなしの場合は無視
    }

    let targetYearMonth: string
    let prevYearMonth: string

    if (requestTargetYearMonth) {
      // 指定された年月を使用
      targetYearMonth = requestTargetYearMonth
      const [y, m] = targetYearMonth.split('-').map(Number)
      const prevDate = new Date(y, m - 2, 1)
      prevYearMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`
    } else {
      // デフォルト: 日本時間で先月を対象とする
      const now = new Date()
      const jstOffset = 9 * 60 * 60 * 1000
      const jstNow = new Date(now.getTime() + jstOffset)
      const targetDate = new Date(jstNow.getFullYear(), jstNow.getMonth() - 1, 1)
      targetYearMonth = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`
      const prevDate = new Date(targetDate.getFullYear(), targetDate.getMonth() - 1, 1)
      prevYearMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`
    }

    console.log(`Generating AI text for ${targetYearMonth} (previous: ${prevYearMonth})`)

    // 全企業を取得
    const { data: companies, error: companiesError } = await supabaseAdmin
      .from('companies')
      .select('id, name')

    if (companiesError) {
      throw new Error(`Failed to fetch companies: ${companiesError.message}`)
    }

    // 対象月の平均データを取得
    const { data: avgData } = await supabaseAdmin
      .from('monthly_analytics_summary_avg')
      .select('*')
      .eq('year_month', targetYearMonth)
      .maybeSingle()

    const results: { companyId: string; storeId: string; status: string; message?: string }[] = []

    for (const company of companies || []) {
      const { data: stores } = await supabaseAdmin
        .from('stores')
        .select('id, name')
        .eq('company_id', company.id)

      for (const store of stores || []) {
        try {
          // 対象月のサマリーを取得
          const { data: currentSummary } = await supabaseAdmin
            .from('monthly_analytics_summary')
            .select('*')
            .eq('company_id', company.id)
            .eq('store_id', store.id)
            .eq('year_month', targetYearMonth)
            .maybeSingle()

          if (!currentSummary || !currentSummary.total_responses || currentSummary.total_responses === 0) {
            results.push({ companyId: company.id, storeId: store.id, status: 'skipped', message: 'No data' })
            continue
          }

          // 先月のサマリーを取得
          const { data: prevSummary } = await supabaseAdmin
            .from('monthly_analytics_summary')
            .select('*')
            .eq('company_id', company.id)
            .eq('store_id', store.id)
            .eq('year_month', prevYearMonth)
            .maybeSingle()

          // 5つのコメントを順番に生成
          const overview = await generateComment(
            ANTHROPIC_API_KEY,
            buildOverviewPrompt(currentSummary, prevSummary, avgData, targetYearMonth)
          )
          console.log(`[${store.name}] overview: ${overview}`)

          const salesImpact = await generateComment(
            ANTHROPIC_API_KEY,
            buildSalesImpactPrompt(currentSummary, prevSummary, avgData, targetYearMonth)
          )
          console.log(`[${store.name}] sales_impact: ${salesImpact}`)

          const quality = await generateComment(
            ANTHROPIC_API_KEY,
            buildQualityPrompt(currentSummary, prevSummary, avgData, targetYearMonth)
          )
          console.log(`[${store.name}] quality: ${quality}`)

          const service = await generateComment(
            ANTHROPIC_API_KEY,
            buildServicePrompt(currentSummary, prevSummary, avgData, targetYearMonth)
          )
          console.log(`[${store.name}] service: ${service}`)

          const cleanliness = await generateComment(
            ANTHROPIC_API_KEY,
            buildCleanlinessPrompt(currentSummary, prevSummary, avgData, targetYearMonth)
          )
          console.log(`[${store.name}] cleanliness: ${cleanliness}`)

          // UPSERT
          const { data: existing } = await supabaseAdmin
            .from('monthly_analytics_ai_text')
            .select('id')
            .eq('company_id', company.id)
            .eq('store_id', store.id)
            .eq('year_month', targetYearMonth)
            .maybeSingle()

          const aiTextData = {
            company_id: company.id,
            store_id: store.id,
            year_month: targetYearMonth,
            overview,
            sales_impact: salesImpact,
            quality,
            service,
            cleanliness,
          }

          if (existing) {
            const { error: updateError } = await supabaseAdmin
              .from('monthly_analytics_ai_text')
              .update(aiTextData)
              .eq('id', existing.id)

            if (updateError) throw new Error(`Failed to update ai_text: ${updateError.message}`)
          } else {
            const { error: insertError } = await supabaseAdmin
              .from('monthly_analytics_ai_text')
              .insert(aiTextData)

            if (insertError) throw new Error(`Failed to insert ai_text: ${insertError.message}`)
          }

          results.push({ companyId: company.id, storeId: store.id, status: 'success' })
        } catch (storeError: any) {
          console.error(`Error processing store ${store.id}:`, storeError)
          results.push({ companyId: company.id, storeId: store.id, status: 'error', message: storeError.message })
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        targetYearMonth,
        prevYearMonth,
        processedAt: new Date().toISOString(),
        results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error: any) {
    console.error('Generate analytics AI text error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

// ========================================
// Claude API呼び出し
// ========================================
async function generateComment(apiKey: string, prompt: string): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-opus-4-6',
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Claude API error: ${response.status} ${errorBody}`)
  }

  const data = await response.json()
  const text = data.content?.[0]?.text || ''
  return text.trim()
}

// ========================================
// ヘルパー：前月比の変化を文字列にする
// ========================================
function delta(current: number | null, prev: number | null): string {
  if (current === null || current === undefined) return '(データなし)'
  if (prev === null || prev === undefined) return '(前月データなし)'
  const diff = current - prev
  if (diff > 0) return `+${Math.round(diff * 10) / 10}`
  return `${Math.round(diff * 10) / 10}`
}

function avgCompare(storeVal: number | null, avgVal: number | null): string {
  if (storeVal === null || storeVal === undefined) return ''
  if (avgVal === null || avgVal === undefined) return ''
  const diff = storeVal - avgVal
  if (diff > 0) return `(全体平均より+${Math.round(diff * 10) / 10})`
  if (diff < 0) return `(全体平均より${Math.round(diff * 10) / 10})`
  return '(全体平均と同じ)'
}

// ========================================
// プロンプト生成関数
// ========================================

function buildOverviewPrompt(current: any, prev: any, avg: any, yearMonth: string): string {
  const prevNps = prev?.nps_score ?? null
  const prevRepeatRate = prev?.repeat_rate ?? null
  const prevRepeaterRevisit = prev?.repeater_revisit_rate ?? null
  const prevNewRevisit = prev?.new_revisit_rate ?? null

  return `あなたは飲食店の月次レポートのAIアナリストです。以下のデータに基づいて、${yearMonth}の概要コメントを1つだけ生成してください。

【ルール】
- 50文字から100文字以内で簡潔にまとめる
- 具体的な数値を含める
- コメントの本文のみを出力する（前置きや説明は不要）
- 日本語で書く

【今月のデータ】
- 回答数: ${current.total_responses}件
- NPSスコア: ${current.nps_score} ${delta(current.nps_score, prevNps)}（前月比） ${avgCompare(current.nps_score, avg?.nps_score)}
  - 推奨者: ${current.nps_promoters_percent}%, 中立者: ${current.nps_passives_percent}%, 批判者: ${current.nps_detractors_percent}%
- リピート率: ${current.repeat_rate}% ${delta(current.repeat_rate, prevRepeatRate)}（前月比） ${avgCompare(current.repeat_rate, avg?.repeat_rate)}
  - リピーター: ${current.repeater_count}人, 新規: ${current.new_customer_count}人
- リピーター再来店意向: ${current.repeater_revisit_rate}% ${delta(current.repeater_revisit_rate, prevRepeaterRevisit)}（前月比）
- 新規再来店意向: ${current.new_revisit_rate}% ${delta(current.new_revisit_rate, prevNewRevisit)}（前月比）`
}

function buildSalesImpactPrompt(current: any, prev: any, avg: any, yearMonth: string): string {
  const segmentLabels = [
    { key: 'seg_promoter_revisit_repeater', name: 'ロイヤル顧客（推奨・再来店・リピーター）', impact: 3 },
    { key: 'seg_promoter_revisit_new', name: '期待の新規（推奨・再来店・新規）', impact: 2 },
    { key: 'seg_promoter_norevisit_repeater', name: '離脱リスク推奨者（推奨・再来店なし・リピーター）', impact: 0 },
    { key: 'seg_promoter_norevisit_new', name: '一見推奨者（推奨・再来店なし・新規）', impact: -1 },
    { key: 'seg_passive_revisit_repeater', name: '安定中立（中立・再来店・リピーター）', impact: 1 },
    { key: 'seg_passive_revisit_new', name: '様子見新規（中立・再来店・新規）', impact: 1 },
    { key: 'seg_passive_norevisit_repeater', name: '離脱リスク中立（中立・再来店なし・リピーター）', impact: -2 },
    { key: 'seg_passive_norevisit_new', name: '低関心新規（中立・再来店なし・新規）', impact: -1 },
    { key: 'seg_detractor_revisit_repeater', name: '不満継続（批判・再来店・リピーター）', impact: -1 },
    { key: 'seg_detractor_revisit_new', name: '改善余地新規（批判・再来店・新規）', impact: 0 },
    { key: 'seg_detractor_norevisit_repeater', name: 'リピーター離脱（批判・再来店なし・リピーター）', impact: -3 },
    { key: 'seg_detractor_norevisit_new', name: '新規離脱（批判・再来店なし・新規）', impact: -2 },
  ]

  let segmentInfo = ''
  for (const seg of segmentLabels) {
    const count = current[`${seg.key}_count`] || 0
    const percent = current[`${seg.key}_percent`] || 0
    const prevCount = prev?.[`${seg.key}_count`] ?? null
    segmentInfo += `- ${seg.name}: ${count}人(${percent}%) 影響度:${seg.impact} ${prevCount !== null ? `前月:${prevCount}人` : ''}\n`
  }

  return `あなたは飲食店の月次レポートのAIアナリストです。以下のデータに基づいて、${yearMonth}の売上影響に関するコメントを1つだけ生成してください。

【ルール】
- 50文字から100文字以内で簡潔にまとめる
- 売上へのプラス・マイナスの影響を中心に分析する
- コメントの本文のみを出力する（前置きや説明は不要）
- 日本語で書く

【12セグメント別データ】
${segmentInfo}
【影響度サマリー】
- ポジティブ影響: ${current.positive_impact_count}人(${current.positive_impact_percent}%) ${avgCompare(current.positive_impact_percent, avg?.positive_impact_percent)}
- ネガティブ影響: ${current.negative_impact_count}人(${current.negative_impact_percent}%) ${avgCompare(current.negative_impact_percent, avg?.negative_impact_percent)}`
}

function buildQualityPrompt(current: any, prev: any, avg: any, yearMonth: string): string {
  const qualityItems = [
    '料理の味', '料理の見た目', '料理の量/ボリューム', 'ドリンクの味', 'ドリンクの温度',
    '食べたい料理', '飲みたいドリンク', 'メニューの種類', '料理・ドリンクの温度', '特徴や独自性'
  ]

  let itemInfo = ''
  for (let i = 1; i <= 10; i++) {
    const pos = current[`q${i}_positive_percent`] || 0
    const neg = current[`q${i}_negative_percent`] || 0
    const neu = current[`q${i}_neutral_percent`] || 0
    const total = current[`q${i}_total_count`] || 0
    if (total > 0) {
      itemInfo += `- ${qualityItems[i - 1]}: ポジティブ${pos}% / ネガティブ${neg}% / 中立${neu}% (${total}件)\n`
    }
  }

  return `あなたは飲食店の月次レポートのAIアナリストです。以下のデータに基づいて、${yearMonth}のQSC品質（Quality）に関するコメントを1つだけ生成してください。

【ルール】
- 70文字から130文字以内でまとめる
- 具体的な項目名と数値を含める
- 良い点と改善点をバランスよく分析する
- コメントの本文のみを出力する（前置きや説明は不要）
- 日本語で書く

【品質スコア】
- 総合スコア: ${current.qsc_quality_score}/5.0 ${delta(current.qsc_quality_score, prev?.qsc_quality_score)}（前月比） ${avgCompare(current.qsc_quality_score, avg?.qsc_quality_score)}
- 回答数: ${current.qsc_quality_count}件
- ポジティブ: ${current.quality_positive_count}件, ネガティブ: ${current.quality_negative_count}件, 中立: ${current.quality_neutral_count}件

【項目別データ】
${itemInfo}`
}

function buildServicePrompt(current: any, prev: any, avg: any, yearMonth: string): string {
  const serviceItems = [
    '入店時の挨拶', '席への案内', '注文時の対応', 'メニュー説明・提案', '提供スピード',
    '注文・提供の正確さ', 'スタッフの気配り', 'スタッフの笑顔', 'スタッフの言葉遣い', '特に良かったスタッフ'
  ]

  let itemInfo = ''
  for (let i = 1; i <= 10; i++) {
    const pos = current[`s${i}_positive_percent`] || 0
    const neg = current[`s${i}_negative_percent`] || 0
    const neu = current[`s${i}_neutral_percent`] || 0
    const total = current[`s${i}_total_count`] || 0
    if (total > 0) {
      itemInfo += `- ${serviceItems[i - 1]}: ポジティブ${pos}% / ネガティブ${neg}% / 中立${neu}% (${total}件)\n`
    }
  }

  return `あなたは飲食店の月次レポートのAIアナリストです。以下のデータに基づいて、${yearMonth}のQSCサービス（Service）に関するコメントを1つだけ生成してください。

【ルール】
- 70文字から130文字以内でまとめる
- 具体的な項目名と数値を含める
- 良い点と改善点をバランスよく分析する
- コメントの本文のみを出力する（前置きや説明は不要）
- 日本語で書く

【サービススコア】
- 総合スコア: ${current.qsc_service_score}/5.0 ${delta(current.qsc_service_score, prev?.qsc_service_score)}（前月比） ${avgCompare(current.qsc_service_score, avg?.qsc_service_score)}
- 回答数: ${current.qsc_service_count}件
- ポジティブ: ${current.service_positive_count}件, ネガティブ: ${current.service_negative_count}件, 中立: ${current.service_neutral_count}件

【項目別データ】
${itemInfo}`
}

function buildCleanlinessPrompt(current: any, prev: any, avg: any, yearMonth: string): string {
  const cleanlinessItems = [
    '店舗外観・入口', 'テーブル', '椅子・ソファ', '床', '食器・カトラリー',
    'メニュー表・卓上備品', 'トイレ', '店内の空気や匂い', '店内の整理整頓', 'スタッフの身だしなみ'
  ]

  let itemInfo = ''
  for (let i = 1; i <= 10; i++) {
    const pos = current[`c${i}_positive_percent`] || 0
    const neg = current[`c${i}_negative_percent`] || 0
    const neu = current[`c${i}_neutral_percent`] || 0
    const total = current[`c${i}_total_count`] || 0
    if (total > 0) {
      itemInfo += `- ${cleanlinessItems[i - 1]}: ポジティブ${pos}% / ネガティブ${neg}% / 中立${neu}% (${total}件)\n`
    }
  }

  return `あなたは飲食店の月次レポートのAIアナリストです。以下のデータに基づいて、${yearMonth}のQSCクレンリネス（Cleanliness）に関するコメントを1つだけ生成してください。

【ルール】
- 70文字から130文字以内でまとめる
- 具体的な項目名と数値を含める
- 良い点と改善点をバランスよく分析する
- コメントの本文のみを出力する（前置きや説明は不要）
- 日本語で書く

【クレンリネススコア】
- 総合スコア: ${current.qsc_cleanliness_score}/5.0 ${delta(current.qsc_cleanliness_score, prev?.qsc_cleanliness_score)}（前月比） ${avgCompare(current.qsc_cleanliness_score, avg?.qsc_cleanliness_score)}
- 回答数: ${current.qsc_cleanliness_count}件
- ポジティブ: ${current.cleanliness_positive_count}件, ネガティブ: ${current.cleanliness_negative_count}件, 中立: ${current.cleanliness_neutral_count}件

【項目別データ】
${itemInfo}`
}
