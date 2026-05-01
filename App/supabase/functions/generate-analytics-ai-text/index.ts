import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ========================================
// 静的プロンプト (prompt caching 対象)
// ========================================
const SYSTEM_PROMPT = `あなたは飲食店の月次レポートのAIアナリストです。
読み手は店長(現場責任者)で、データを見慣れておらず、忙しい。
抽象論ではなく「今月この店舗で何が起きたか」を一読で掴ませることが目的です。

【全フィールド共通の分析方針】
1. 主役は「今月のこの店舗のデータ」。前月・全体平均は今月の位置づけを浮かび上がらせる比較材料として使う。
2. 出力する前に、必ず以下の比較軸のうち最も顕著なものを内部で選び、その軸を中心に語ること。
   (a) 今月 vs 前月       — 短期的な変化
   (b) 今月 vs 全体平均   — 自店舗の特異性
   (c) セグメント間比較   — どの顧客層で差が出ているか
   (d) QSC項目間比較      — どの項目が他項目より突出しているか
3. 件数より比率(%)で語る。回答数20件未満の指標は断定的に語らない。
4. 数値は具体的に。ただし羅列ではなく「それが何を意味するか」まで踏み込む。
5. 精神論禁止 — 「頑張りましょう」「意識を高めて」のような抽象的呼びかけは禁止。
6. データの性質: アンケート回答数は来店数ではなく回答数。NPS推奨者は9-10、批判者は0-6。

【出力】
submit_monthly_summary ツールを必ず呼び出すこと。各フィールドは本文のみ(前置き・説明・記号は不要)。
日本語で記述する。`

// Tool 定義: 構造化出力を保証
const SUMMARY_TOOL = {
  name: 'submit_monthly_summary',
  description: '月次レポートの5セクション要約を提出する',
  input_schema: {
    type: 'object',
    properties: {
      overview: {
        type: 'string',
        description: '店舗全体の概要(50〜100文字)。NPS、リピート率、再来店意向の今月の状況を1つの軸で語る。',
      },
      sales_impact: {
        type: 'string',
        description: '売上影響(50〜100文字)。12セグメントから見える今月のプラス・マイナス影響を語る。',
      },
      quality: {
        type: 'string',
        description: 'Quality(料理品質)の分析(70〜130文字)。具体的な項目名と数値を含め、強み・改善点をバランスよく。',
      },
      service: {
        type: 'string',
        description: 'Service(接客)の分析(70〜130文字)。同上。',
      },
      cleanliness: {
        type: 'string',
        description: 'Cleanliness(清潔感)の分析(70〜130文字)。同上。',
      },
    },
    required: ['overview', 'sales_impact', 'quality', 'service', 'cleanliness'],
  },
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
      targetYearMonth = requestTargetYearMonth
      const [y, m] = targetYearMonth.split('-').map(Number)
      const prevDate = new Date(y, m - 2, 1)
      prevYearMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`
    } else {
      const now = new Date()
      const jstOffset = 9 * 60 * 60 * 1000
      const jstNow = new Date(now.getTime() + jstOffset)
      const targetDate = new Date(jstNow.getFullYear(), jstNow.getMonth() - 1, 1)
      targetYearMonth = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`
      const prevDate = new Date(targetDate.getFullYear(), targetDate.getMonth() - 1, 1)
      prevYearMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`
    }

    console.log(`Generating AI text for ${targetYearMonth} (previous: ${prevYearMonth})`)

    const { data: companies, error: companiesError } = await supabaseAdmin
      .from('companies')
      .select('id, name')

    if (companiesError) {
      throw new Error(`Failed to fetch companies: ${companiesError.message}`)
    }

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

          const { data: prevSummary } = await supabaseAdmin
            .from('monthly_analytics_summary')
            .select('*')
            .eq('company_id', company.id)
            .eq('store_id', store.id)
            .eq('year_month', prevYearMonth)
            .maybeSingle()

          // 5フィールドを1回のツール呼び出しで一括生成
          const userPrompt = buildCombinedPrompt(currentSummary, prevSummary, avgData, targetYearMonth)
          const summary = await generateSummary(ANTHROPIC_API_KEY, userPrompt)
          console.log(`[${store.name}] generated:`, JSON.stringify(summary).slice(0, 200))

          const aiTextData = {
            company_id: company.id,
            store_id: store.id,
            year_month: targetYearMonth,
            overview: summary.overview,
            sales_impact: summary.sales_impact,
            quality: summary.quality,
            service: summary.service,
            cleanliness: summary.cleanliness,
          }

          const { data: existing } = await supabaseAdmin
            .from('monthly_analytics_ai_text')
            .select('id')
            .eq('company_id', company.id)
            .eq('store_id', store.id)
            .eq('year_month', targetYearMonth)
            .maybeSingle()

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
// Claude API 呼び出し (Tool Use + Prompt Caching)
// ========================================
async function generateSummary(apiKey: string, userPrompt: string): Promise<any> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-opus-4-7',
      max_tokens: 1500,
      system: [
        {
          type: 'text',
          text: SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' },
        },
      ],
      tools: [SUMMARY_TOOL],
      tool_choice: { type: 'tool', name: 'submit_monthly_summary' },
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Claude API error: ${response.status} ${errorBody}`)
  }

  const data = await response.json()
  const toolUse = (data.content || []).find((c: any) => c.type === 'tool_use')
  if (!toolUse?.input) {
    throw new Error(`No tool_use in Claude response: ${JSON.stringify(data).slice(0, 500)}`)
  }
  return toolUse.input
}

// ========================================
// ヘルパー
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
// 統合プロンプト構築
// ========================================
const SEGMENT_LABELS = [
  { key: 'seg_promoter_revisit_repeater', name: 'ロイヤル顧客(推奨・再来店・リピーター)', impact: 3 },
  { key: 'seg_promoter_revisit_new', name: '期待の新規(推奨・再来店・新規)', impact: 2 },
  { key: 'seg_promoter_norevisit_repeater', name: '離脱リスク推奨者(推奨・再来店なし・リピーター)', impact: 0 },
  { key: 'seg_promoter_norevisit_new', name: '一見推奨者(推奨・再来店なし・新規)', impact: -1 },
  { key: 'seg_passive_revisit_repeater', name: '安定中立(中立・再来店・リピーター)', impact: 1 },
  { key: 'seg_passive_revisit_new', name: '様子見新規(中立・再来店・新規)', impact: 1 },
  { key: 'seg_passive_norevisit_repeater', name: '離脱リスク中立(中立・再来店なし・リピーター)', impact: -2 },
  { key: 'seg_passive_norevisit_new', name: '低関心新規(中立・再来店なし・新規)', impact: -1 },
  { key: 'seg_detractor_revisit_repeater', name: '不満継続(批判・再来店・リピーター)', impact: -1 },
  { key: 'seg_detractor_revisit_new', name: '改善余地新規(批判・再来店・新規)', impact: 0 },
  { key: 'seg_detractor_norevisit_repeater', name: 'リピーター離脱(批判・再来店なし・リピーター)', impact: -3 },
  { key: 'seg_detractor_norevisit_new', name: '新規離脱(批判・再来店なし・新規)', impact: -2 },
]

const QUALITY_LABELS = [
  '料理の味', '料理の見た目', '料理の量/ボリューム', 'ドリンクの味', 'ドリンクの温度',
  '食べたい料理', '飲みたいドリンク', 'メニューの種類', '料理・ドリンクの温度', '特徴や独自性',
]
const SERVICE_LABELS = [
  '入店時の挨拶', '席への案内', '注文時の対応', 'メニュー説明・提案', '提供スピード',
  '注文・提供の正確さ', 'スタッフの気配り', 'スタッフの笑顔', 'スタッフの言葉遣い', '特に良かったスタッフ',
]
const CLEANLINESS_LABELS = [
  '店舗外観・入口', 'テーブル', '椅子・ソファ', '床', '食器・カトラリー',
  'メニュー表・卓上備品', 'トイレ', '店内の空気や匂い', '店内の整理整頓', 'スタッフの身だしなみ',
]

function buildCombinedPrompt(current: any, prev: any, avg: any, yearMonth: string): string {
  // セグメント
  let segmentInfo = ''
  for (const seg of SEGMENT_LABELS) {
    const count = current[`${seg.key}_count`] || 0
    const percent = current[`${seg.key}_percent`] || 0
    const prevCount = prev?.[`${seg.key}_count`] ?? null
    segmentInfo += `- ${seg.name}: ${count}人(${percent}%) 影響度:${seg.impact} ${prevCount !== null ? `前月:${prevCount}人` : ''}\n`
  }

  // QSC項目
  const qscBlock = (prefix: 'q' | 's' | 'c', labels: string[]) => {
    let lines = ''
    for (let i = 1; i <= 10; i++) {
      const pos = current[`${prefix}${i}_positive_percent`] || 0
      const neg = current[`${prefix}${i}_negative_percent`] || 0
      const neu = current[`${prefix}${i}_neutral_percent`] || 0
      const total = current[`${prefix}${i}_total_count`] || 0
      if (total > 0) {
        lines += `- ${labels[i - 1]}: ポジ${pos}% / ネガ${neg}% / 中立${neu}% (${total}件)\n`
      }
    }
    return lines || '- (回答なし)\n'
  }

  return `店舗の${yearMonth}の月次データを以下に示します。submit_monthly_summary ツールで5セクションすべてを埋めてください。

============================
■ 概要データ (overview用)
============================
- 回答数: ${current.total_responses}件
- NPSスコア: ${current.nps_score} ${delta(current.nps_score, prev?.nps_score)}(前月比) ${avgCompare(current.nps_score, avg?.nps_score)}
  - 推奨者: ${current.nps_promoters_percent}% / 中立者: ${current.nps_passives_percent}% / 批判者: ${current.nps_detractors_percent}%
- リピート率: ${current.repeat_rate}% ${delta(current.repeat_rate, prev?.repeat_rate)}(前月比) ${avgCompare(current.repeat_rate, avg?.repeat_rate)}
  - リピーター: ${current.repeater_count}人 / 新規: ${current.new_customer_count}人
- リピーター再来店意向: ${current.repeater_revisit_rate}% ${delta(current.repeater_revisit_rate, prev?.repeater_revisit_rate)}(前月比)
- 新規再来店意向: ${current.new_revisit_rate}% ${delta(current.new_revisit_rate, prev?.new_revisit_rate)}(前月比)

============================
■ 12セグメントデータ (sales_impact用)
============================
${segmentInfo}
【影響度サマリー】
- ポジティブ影響: ${current.positive_impact_count}人(${current.positive_impact_percent}%) ${avgCompare(current.positive_impact_percent, avg?.positive_impact_percent)}
- ネガティブ影響: ${current.negative_impact_count}人(${current.negative_impact_percent}%) ${avgCompare(current.negative_impact_percent, avg?.negative_impact_percent)}

============================
■ Quality (quality用)
============================
- 総合スコア: ${current.qsc_quality_score}/5.0 ${delta(current.qsc_quality_score, prev?.qsc_quality_score)}(前月比) ${avgCompare(current.qsc_quality_score, avg?.qsc_quality_score)}
- 回答数: ${current.qsc_quality_count}件
${qscBlock('q', QUALITY_LABELS)}

============================
■ Service (service用)
============================
- 総合スコア: ${current.qsc_service_score}/5.0 ${delta(current.qsc_service_score, prev?.qsc_service_score)}(前月比) ${avgCompare(current.qsc_service_score, avg?.qsc_service_score)}
- 回答数: ${current.qsc_service_count}件
${qscBlock('s', SERVICE_LABELS)}

============================
■ Cleanliness (cleanliness用)
============================
- 総合スコア: ${current.qsc_cleanliness_score}/5.0 ${delta(current.qsc_cleanliness_score, prev?.qsc_cleanliness_score)}(前月比) ${avgCompare(current.qsc_cleanliness_score, avg?.qsc_cleanliness_score)}
- 回答数: ${current.qsc_cleanliness_count}件
${qscBlock('c', CLEANLINESS_LABELS)}
`
}
