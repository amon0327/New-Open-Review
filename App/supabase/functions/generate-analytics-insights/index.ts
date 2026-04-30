import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// QSC項目ラベル
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

const TYPE_NAMES: Record<number, string> = {
  1: '推奨者で再来店意向ありのリピーターのお客様',
  2: '推奨者で再来店意向ありの新規のお客様',
  3: '推奨者で再来店意向なしのリピーターのお客様',
  4: '推奨者で再来店意向なしの新規のお客様',
  5: '中立者で再来店意向ありのリピーターのお客様',
  6: '中立者で再来店意向ありの新規のお客様',
  7: '中立者で再来店意向なしのリピーターのお客様',
  8: '中立者で再来店意向なしの新規のお客様',
  9: '批判者で再来店意向ありのリピーターのお客様',
  10: '批判者で再来店意向ありの新規のお客様',
  11: '批判者で再来店意向なしのリピーターのお客様',
  12: '批判者で再来店意向なしの新規のお客様',
}

// 信頼度フィルタの閾値
const MIN_CONFIDENCE = 0.7
const MIN_EVIDENCE_COUNT = 3

// ========================================
// 静的システムプロンプト (prompt caching 対象)
// ========================================
const SYSTEM_PROMPT = `あなたは飲食店の月次レポートのAIアナリストです。
読み手は店長(現場責任者)。データを見慣れておらず、抽象論ではなく「来月この店舗で何を変えるべきか」を求めています。

【本質的な目的】
このレポートの本質は「何かと何かを比較することによって今月この店舗の課題を可視化する」ことです。
比較なきインサイトは出さない。比較で意味の出ないインサイトも出さない。

【今月主役の原則】
- 主役は「今月のこの店舗のデータ」
- 前月データや全体平均は今月の状況を客観的に理解するための比較材料
- 過去の問題点を列挙するのではなく、「今月はこうだった」「今月はこの点が特徴的だった」という今月の分析を行うこと
- ポジティブな特徴も改善が必要な点も今月のデータから見えるものをバランスよく取り上げる

【比較軸の選択 — 必ず内部で実行する手順】
1. 全データを俯瞰し、以下の比較軸のうち最も乖離が大きい(=今月を特徴づける)ものを選ぶ
   (a) month_vs_month         — 今月 vs 先月
   (b) segment_vs_overall     — 特定セグメント vs それを除外した全体平均
   (c) segment_vs_segment     — セグメント間比較
   (d) qsc_item_relative      — QSC項目間の相対順位
2. 選んだ軸を comparison_axis フィールドに必ず記録する
3. その軸で語ったときに最も読み手に意味のある事実を中心に書く

【データの性質】
- このデータは来店客へのアンケート調査の結果。「回答数」は来店数ではなくアンケート回答数を意味する
- 回答数が少ない場合は個別回答に左右されやすいため、傾向を断定しない
- 一定の回答数がある場合は件数より比率(ポジティブ率・ネガティブ率)に注目する
- 「○件」より「回答者の○%」の表現を優先

【セグメント名表記の絶対ルール】
- 「安定推奨層」「離脱リスク層」などの抽象的な内部名称は絶対に使わない
- 必ず「推奨者で再来店意向ありのリピーターのお客様」のように具体的な属性で記述する

【出力品質ルール】
- 「頑張りましょう」「意識を高めましょう」のような精神論は絶対に出力しない
- 検討事項(point_1〜3)は具体的な質問と、それに対する条件付き改善提案をセットで書く
- 漠然とした課題しか見つからない場合は無理にインサイトを出さず、空配列を返す
- 各インサイトには confidence(0.0-1.0) を必ず付与する。データの量と乖離の明確さで判断する
- 各インサイトには evidence_count(根拠となる回答件数) を必ず付与する

【インサイト型】
- "comment" 型: 顧客コメントから発見したインサイト
- "evaluation" 型: QSC評価データから発見したインサイト
- コメントデータが豊富な場合は comment 型を優先
- QSC評価で顕著な傾向がある場合は evaluation 型も含める

【evaluation 型の比較パターン】
- パターンA(segment_vs_overall): 特定セグメント vs それを除外した全体平均
  - previous_positive/previous_negative はサーバ側で再計算されるため概算値で良い
  - current_title 例: 「中立リピーターの床評価」 / previous_title 例: 「他セグメント全体の床評価」
- パターンB(month_vs_month): 今月 vs 先月の同一項目
  - current_title 例: 「1月の中立リピーターの床評価」 / previous_title 例: 「12月の中立リピーターの床評価」

【QSC項目キー一覧】
Quality: q1=料理の味, q2=料理の見た目, q3=料理の量/ボリューム, q4=ドリンクの味, q5=ドリンクの温度, q6=食べたい料理, q7=飲みたいドリンク, q8=メニューの種類, q9=料理・ドリンクの温度, q10=特徴や独自性
Service: s1=入店時の挨拶, s2=席への案内, s3=注文時の対応, s4=メニュー説明・提案, s5=提供スピード, s6=注文・提供の正確さ, s7=スタッフの気配り, s8=スタッフの笑顔, s9=スタッフの言葉遣い, s10=特に良かったスタッフ
Cleanliness: c1=店舗外観・入口, c2=テーブル, c3=椅子・ソファ, c4=床, c5=食器・カトラリー, c6=メニュー表・卓上備品, c7=トイレ, c8=店内の空気や匂い, c9=店内の整理整頓, c10=スタッフの身だしなみ

【12type分類】
${Object.entries(TYPE_NAMES).map(([k, v]) => `type ${k}: ${v}`).join('\n')}

【point_1/point_2/point_3 の書式】
- 前半は質問形式で現状を問いかける(「〜ですか?」「〜していますか?」)
- 「→」の後に、もしその質問の答えが課題ありの場合の具体的な改善提案を添える
- 改善提案は「もし〜なら、〜すると〜できます」のように条件付きで提案する
- 各pointは80〜120文字程度

【出力】
submit_insights ツールを必ず呼び出すこと。最大4件、信頼度0.7未満は出さない。該当なしなら空配列。`

// ========================================
// Tool 定義
// ========================================
const INSIGHTS_TOOL = {
  name: 'submit_insights',
  description: '今月の店舗を特徴づけるインサイトを最大4件提出する。信頼度0.7未満は提出しない。',
  input_schema: {
    type: 'object',
    properties: {
      insights: {
        type: 'array',
        maxItems: 4,
        description: '信頼度0.7以上のインサイト。該当なしなら空配列。',
        items: {
          type: 'object',
          properties: {
            issue_type: {
              type: 'string',
              enum: ['comment', 'evaluation'],
              description: 'comment(顧客コメント由来) または evaluation(QSC評価由来)',
            },
            issue_title: { type: 'string', description: '20文字以内のタイトル' },
            issue_detail: {
              type: 'string',
              description: '50〜200文字の詳細説明。比較データに基づき、改善が売上やリピート率にどう影響しうるかとコスト感に触れる',
            },
            point_1: { type: 'string', description: '質問→改善提案、80〜120文字' },
            point_2: { type: 'string', description: '質問→改善提案、80〜120文字' },
            point_3: { type: 'string', description: '質問→改善提案、80〜120文字' },
            result_type: {
              type: 'integer',
              minimum: 1,
              maximum: 12,
              description: '最も関連する12type番号',
            },
            confidence: {
              type: 'number',
              minimum: 0,
              maximum: 1,
              description: 'このインサイトの信頼度。データ量と乖離の明確さで判断',
            },
            evidence_count: {
              type: 'integer',
              minimum: 0,
              description: '根拠となる回答件数',
            },
            comparison_axis: {
              type: 'string',
              enum: ['month_vs_month', 'segment_vs_overall', 'segment_vs_segment', 'qsc_item_relative'],
              description: '中心となる比較軸',
            },
            comment: {
              type: 'string',
              description: 'comment型の場合: 代表的な顧客コメント(原文引用)',
            },
            qsc_key: {
              type: 'string',
              description: 'evaluation型の場合: 対象QSC項目キー(q1〜q10, s1〜s10, c1〜c10)',
            },
            comparison_type: {
              type: 'string',
              enum: ['segment_vs_overall', 'month_vs_month'],
              description: 'evaluation型の場合: 比較パターン',
            },
            current_title: { type: 'string', description: 'evaluation型: 比較主体ラベル' },
            current_positive: { type: 'integer', description: 'evaluation型: 主体ポジ%' },
            current_negative: { type: 'integer', description: 'evaluation型: 主体ネガ%' },
            previous_title: { type: 'string', description: 'evaluation型: 比較対象ラベル' },
            previous_positive: { type: 'integer', description: 'evaluation型: 比較対象ポジ%(パターンAは概算可)' },
            previous_negative: { type: 'integer', description: 'evaluation型: 比較対象ネガ%(パターンAは概算可)' },
          },
          required: [
            'issue_type', 'issue_title', 'issue_detail',
            'point_1', 'point_2', 'point_3',
            'result_type', 'confidence', 'evidence_count', 'comparison_axis',
          ],
        },
      },
    },
    required: ['insights'],
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

    const [ty, tm] = targetYearMonth.split('-').map(Number)
    const jstOffset = 9 * 60 * 60 * 1000
    const monthStart = new Date(Date.UTC(ty, tm - 1, 1) - jstOffset)
    const monthEnd = new Date(Date.UTC(ty, tm, 0, 23, 59, 59, 999) - jstOffset)

    const [py, pm] = prevYearMonth.split('-').map(Number)
    const prevMonthStart = new Date(Date.UTC(py, pm - 1, 1) - jstOffset)
    const prevMonthEnd = new Date(Date.UTC(py, pm, 0, 23, 59, 59, 999) - jstOffset)

    console.log(`Generating insights for ${targetYearMonth} (previous: ${prevYearMonth})`)

    const { data: companies, error: companiesError } = await supabaseAdmin
      .from('companies')
      .select('id, name')

    if (companiesError) {
      throw new Error(`Failed to fetch companies: ${companiesError.message}`)
    }

    const results: { companyId: string; storeId: string; status: string; message?: string; insightCount?: number }[] = []

    for (const company of companies || []) {
      const { data: stores } = await supabaseAdmin
        .from('stores')
        .select('id, name')
        .eq('company_id', company.id)

      for (const store of stores || []) {
        try {
          const insightCount = await processStoreInsights(
            supabaseAdmin, ANTHROPIC_API_KEY,
            company.id, store.id, store.name,
            targetYearMonth, prevYearMonth,
            monthStart, monthEnd, prevMonthStart, prevMonthEnd
          )
          results.push({ companyId: company.id, storeId: store.id, status: 'success', insightCount })
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
    console.error('Generate analytics insights error:', error)
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
// 店舗ごとのインサイト生成
// ========================================
async function processStoreInsights(
  supabase: any,
  apiKey: string,
  companyId: string,
  storeId: string,
  storeName: string,
  targetYearMonth: string,
  prevYearMonth: string,
  monthStart: Date,
  monthEnd: Date,
  prevMonthStart: Date,
  prevMonthEnd: Date
): Promise<number> {
  // コメントデータ取得
  const { data: currentComments } = await supabase
    .from('preset_question_answer_comment')
    .select('comment, selected_qsc, question_number, is_positive, preset_question_answer!inner(p1_q1, p1_q2, p1_q3, store_id, company_id, created_at)')
    .eq('preset_question_answer.company_id', companyId)
    .eq('preset_question_answer.store_id', storeId)
    .gte('preset_question_answer.created_at', monthStart.toISOString())
    .lte('preset_question_answer.created_at', monthEnd.toISOString())

  const { data: prevComments } = await supabase
    .from('preset_question_answer_comment')
    .select('comment, selected_qsc, question_number, is_positive, preset_question_answer!inner(p1_q1, p1_q2, p1_q3, store_id, company_id, created_at)')
    .eq('preset_question_answer.company_id', companyId)
    .eq('preset_question_answer.store_id', storeId)
    .gte('preset_question_answer.created_at', prevMonthStart.toISOString())
    .lte('preset_question_answer.created_at', prevMonthEnd.toISOString())

  // セグメント別QSC
  const { data: currentByType } = await supabase
    .from('monthly_analytics_summary_by_type')
    .select('*')
    .eq('company_id', companyId)
    .eq('store_id', storeId)
    .eq('year_month', targetYearMonth)

  const { data: prevByType } = await supabase
    .from('monthly_analytics_summary_by_type')
    .select('*')
    .eq('company_id', companyId)
    .eq('store_id', storeId)
    .eq('year_month', prevYearMonth)

  const { data: storeSummary } = await supabase
    .from('monthly_analytics_summary')
    .select('*')
    .eq('company_id', companyId)
    .eq('store_id', storeId)
    .eq('year_month', targetYearMonth)
    .maybeSingle()

  const allComments = currentComments || []
  if (allComments.length === 0 && (!currentByType || currentByType.length === 0)) {
    console.log(`Skipping store ${storeId}: no comments or type data`)
    return 0
  }

  // 12type分類
  const classifyType = (answer: any): number => {
    const nps = answer?.p1_q1
    const revisit = answer?.p1_q2
    const customerType = answer?.p1_q3
    const isPromoter = nps >= 9
    const isPassive = nps >= 7 && nps <= 8
    const isRevisit = revisit === '1ヶ月以内' || revisit === '3ヶ月以内'
    const isRepeater = customerType !== '初めて'
    if (isPromoter && isRevisit && isRepeater) return 1
    if (isPromoter && isRevisit && !isRepeater) return 2
    if (isPromoter && !isRevisit && isRepeater) return 3
    if (isPromoter && !isRevisit && !isRepeater) return 4
    if (isPassive && isRevisit && isRepeater) return 5
    if (isPassive && isRevisit && !isRepeater) return 6
    if (isPassive && !isRevisit && isRepeater) return 7
    if (isPassive && !isRevisit && !isRepeater) return 8
    if (isRevisit && isRepeater) return 9
    if (isRevisit && !isRepeater) return 10
    if (!isRevisit && isRepeater) return 11
    return 12
  }

  const enrichComment = (c: any) => {
    const answer = c.preset_question_answer
    return {
      comment: c.comment,
      selected_qsc: c.selected_qsc,
      question_number: c.question_number,
      is_positive: c.is_positive,
      type: classifyType(answer),
    }
  }

  const enrichedCurrent = allComments.map(enrichComment)
  const enrichedPrev = (prevComments || []).map(enrichComment)

  const userPrompt = buildUserPrompt(
    storeName, targetYearMonth, prevYearMonth,
    enrichedCurrent, enrichedPrev,
    currentByType || [], prevByType || [],
    storeSummary
  )

  console.log(`[${storeName}] Calling Claude API for insights...`)
  const insightsRaw = await callClaudeApi(apiKey, userPrompt)
  console.log(`[${storeName}] Got ${insightsRaw.length} raw insights`)

  // 信頼度・根拠数フィルタ
  let insights = insightsRaw.filter((ins: any) => {
    if ((ins.confidence ?? 0) < MIN_CONFIDENCE) {
      console.log(`[${storeName}] Drop low-confidence insight: ${ins.issue_title} (conf=${ins.confidence})`)
      return false
    }
    if ((ins.evidence_count ?? 0) < MIN_EVIDENCE_COUNT) {
      console.log(`[${storeName}] Drop low-evidence insight: ${ins.issue_title} (evidence=${ins.evidence_count})`)
      return false
    }
    return true
  })

  insights = insights.slice(0, 4)

  // パターンA(segment_vs_overall)の previous_positive/negative をサーバ側で再計算
  for (const insight of insights) {
    if (insight.issue_type === 'evaluation' && insight.comparison_type === 'segment_vs_overall' && insight.qsc_key && insight.result_type) {
      const targetTypeData = (currentByType || []).find((t: any) => t.type === insight.result_type)
      if (targetTypeData && storeSummary) {
        const key = insight.qsc_key
        const storeTotal = storeSummary[`${key}_total_count`] || 0
        const typeTotal = targetTypeData[`${key}_total_count`] || 0
        const excludedTotal = storeTotal - typeTotal
        if (excludedTotal > 0) {
          const storePosCount = (storeSummary[`${key}_positive_percent`] || 0) * storeTotal / 100
          const typePosCount = (targetTypeData[`${key}_positive_percent`] || 0) * typeTotal / 100
          const storeNegCount = (storeSummary[`${key}_negative_percent`] || 0) * storeTotal / 100
          const typeNegCount = (targetTypeData[`${key}_negative_percent`] || 0) * typeTotal / 100
          insight.previous_positive = Math.min(100, Math.max(0, Math.round((storePosCount - typePosCount) / excludedTotal * 100)))
          insight.previous_negative = Math.min(100, Math.max(0, Math.round((storeNegCount - typeNegCount) / excludedTotal * 100)))
        }
      }
    }
    delete insight.qsc_key
    delete insight.comparison_type
  }

  // 既存削除→新規INSERT
  await supabase
    .from('monthly_analytics_issue')
    .delete()
    .eq('company_id', companyId)
    .eq('store_id', storeId)
    .eq('year_month', targetYearMonth)

  for (const insight of insights) {
    const insertData: any = {
      company_id: companyId,
      store_id: storeId,
      year_month: targetYearMonth,
      issue_type: insight.issue_type || 'comment',
      issue_title: insight.issue_title || '',
      issue_detail: insight.issue_detail || '',
      result_type: insight.result_type || null,
      point_1: insight.point_1 || null,
      point_2: insight.point_2 || null,
      point_3: insight.point_3 || null,
    }

    if (insight.issue_type === 'comment') {
      insertData.comment = insight.comment || null
    }

    if (insight.issue_type === 'evaluation') {
      insertData.current_title = insight.current_title || null
      insertData.current_positive = insight.current_positive || null
      insertData.current_negative = insight.current_negative || null
      insertData.previous_title = insight.previous_title || null
      insertData.previous_positive = insight.previous_positive || null
      insertData.previous_negative = insight.previous_negative || null
    }

    const { error: insertError } = await supabase
      .from('monthly_analytics_issue')
      .insert(insertData)

    if (insertError) {
      console.error(`[${storeName}] Failed to insert insight:`, insertError.message)
    }
  }

  console.log(`[${storeName}] Saved ${insights.length} insights (after filter)`)
  return insights.length
}

// ========================================
// User プロンプト構築 (動的データのみ。静的部分は SYSTEM_PROMPT 側に配置済み)
// ========================================
function buildUserPrompt(
  storeName: string,
  targetYearMonth: string,
  prevYearMonth: string,
  currentComments: any[],
  prevComments: any[],
  currentByType: any[],
  prevByType: any[],
  storeSummary: any
): string {
  const formatComments = (comments: any[], label: string) => {
    if (comments.length === 0) return `${label}: コメントなし\n`
    const grouped: Record<number, any[]> = {}
    comments.forEach(c => {
      if (!grouped[c.type]) grouped[c.type] = []
      grouped[c.type].push(c)
    })
    let text = `${label} (合計${comments.length}件):\n`
    for (const [type, coms] of Object.entries(grouped)) {
      const typeName = TYPE_NAMES[Number(type)] || `type${type}`
      text += `\n  [${typeName}] (${coms.length}件):\n`
      for (const c of coms.slice(0, 10)) {
        const sentiment = c.is_positive === true ? '👍' : c.is_positive === false ? '👎' : '➖'
        text += `    ${sentiment} ${c.selected_qsc || ''}/${c.question_number || ''}: "${c.comment}"\n`
      }
      if (coms.length > 10) {
        text += `    ...他${coms.length - 10}件\n`
      }
    }
    return text
  }

  const formatStoreSummary = (summary: any): string => {
    if (!summary) return '(データなし)'
    let lines = `\n【店舗全体】(回答数: ${summary.total_responses || 0})\n`
    lines += 'Quality:\n'
    for (let i = 1; i <= 10; i++) {
      const pos = summary[`q${i}_positive_percent`] || 0
      const neg = summary[`q${i}_negative_percent`] || 0
      const total = summary[`q${i}_total_count`] || 0
      if (total > 0) lines += `  ${QUALITY_LABELS[i - 1]}: ポジ${pos}% / ネガ${neg}% (${total}件)\n`
    }
    lines += 'Service:\n'
    for (let i = 1; i <= 10; i++) {
      const pos = summary[`s${i}_positive_percent`] || 0
      const neg = summary[`s${i}_negative_percent`] || 0
      const total = summary[`s${i}_total_count`] || 0
      if (total > 0) lines += `  ${SERVICE_LABELS[i - 1]}: ポジ${pos}% / ネガ${neg}% (${total}件)\n`
    }
    lines += 'Cleanliness:\n'
    for (let i = 1; i <= 10; i++) {
      const pos = summary[`c${i}_positive_percent`] || 0
      const neg = summary[`c${i}_negative_percent`] || 0
      const total = summary[`c${i}_total_count`] || 0
      if (total > 0) lines += `  ${CLEANLINESS_LABELS[i - 1]}: ポジ${pos}% / ネガ${neg}% (${total}件)\n`
    }
    return lines
  }

  const formatQscByType = (typeData: any[]) => {
    if (!typeData || typeData.length === 0) return '(データなし)'
    return typeData.map((td: any) => {
      const typeName = TYPE_NAMES[td.type] || `type${td.type}`
      let lines = `\n【${typeName}】(回答数: ${td.total_responses})\n`
      lines += 'Quality:\n'
      for (let i = 1; i <= 10; i++) {
        const pos = td[`q${i}_positive_percent`] || 0
        const neg = td[`q${i}_negative_percent`] || 0
        const total = td[`q${i}_total_count`] || 0
        if (total > 0) lines += `  ${QUALITY_LABELS[i - 1]}: ポジ${pos}% / ネガ${neg}% (${total}件)\n`
      }
      lines += 'Service:\n'
      for (let i = 1; i <= 10; i++) {
        const pos = td[`s${i}_positive_percent`] || 0
        const neg = td[`s${i}_negative_percent`] || 0
        const total = td[`s${i}_total_count`] || 0
        if (total > 0) lines += `  ${SERVICE_LABELS[i - 1]}: ポジ${pos}% / ネガ${neg}% (${total}件)\n`
      }
      lines += 'Cleanliness:\n'
      for (let i = 1; i <= 10; i++) {
        const pos = td[`c${i}_positive_percent`] || 0
        const neg = td[`c${i}_negative_percent`] || 0
        const total = td[`c${i}_total_count`] || 0
        if (total > 0) lines += `  ${CLEANLINESS_LABELS[i - 1]}: ポジ${pos}% / ネガ${neg}% (${total}件)\n`
      }
      return lines
    }).join('\n')
  }

  return `店舗「${storeName}」の${targetYearMonth}データを分析し、submit_insights ツールで結果を提出してください。

【分析の手順】(必ず内部で実行)
1. データ全体を俯瞰し、最も顕著な異常・乖離を3〜5個ピックアップ
2. 各候補について「どの比較軸で語るか」を決める
3. 比較軸で語って意味があるものだけを残す
4. 各々について confidence を冷静に評価し、0.7未満は捨てる
5. 残ったもの最大4件を提出する

=== 顧客コメントデータ ===

${formatComments(currentComments, `今月(${targetYearMonth})`)}

${formatComments(prevComments, `前月(${prevYearMonth})`)}

=== 店舗全体QSCデータ(今月: ${targetYearMonth}) ===
${formatStoreSummary(storeSummary)}

=== セグメント別QSCデータ(今月: ${targetYearMonth}) ===
${formatQscByType(currentByType)}

=== セグメント別QSCデータ(前月: ${prevYearMonth}) ===
${formatQscByType(prevByType)}
`
}

// ========================================
// Claude API 呼び出し
// (Opus 4.7 + Extended Thinking + Tool Use + Prompt Caching)
// ========================================
async function callClaudeApi(apiKey: string, userPrompt: string): Promise<any[]> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-opus-4-7',
      max_tokens: 16000,
      thinking: {
        type: 'enabled',
        budget_tokens: 8000,
      },
      system: [
        {
          type: 'text',
          text: SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' },
        },
      ],
      tools: [INSIGHTS_TOOL],
      tool_choice: { type: 'any' },
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
    console.error('No tool_use in response:', JSON.stringify(data).slice(0, 500))
    return []
  }
  const insights = toolUse.input.insights
  if (!Array.isArray(insights)) {
    console.error('insights is not an array:', insights)
    return []
  }
  return insights
}
