import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// QSC項目ラベル
const QUALITY_LABELS = [
  '料理の味', '料理の見た目', '料理の量/ボリューム', 'ドリンクの味', 'ドリンクの温度',
  '食べたい料理', '飲みたいドリンク', 'メニューの種類', '料理・ドリンクの温度', '特徴や独自性'
]
const SERVICE_LABELS = [
  '入店時の挨拶', '席への案内', '注文時の対応', 'メニュー説明・提案', '提供スピード',
  '注文・提供の正確さ', 'スタッフの気配り', 'スタッフの笑顔', 'スタッフの言葉遣い', '特に良かったスタッフ'
]
const CLEANLINESS_LABELS = [
  '店舗外観・入口', 'テーブル', '椅子・ソファ', '床', '食器・カトラリー',
  'メニュー表・卓上備品', 'トイレ', '店内の空気や匂い', '店内の整理整頓', 'スタッフの身だしなみ'
]

// 12type名称（データ処理用・内部ラベル）
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

    // リクエストボディからtarget_year_monthを取得
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

    // 日付範囲計算
    const [ty, tm] = targetYearMonth.split('-').map(Number)
    const jstOffset = 9 * 60 * 60 * 1000
    const monthStart = new Date(Date.UTC(ty, tm - 1, 1) - jstOffset)
    const monthEnd = new Date(Date.UTC(ty, tm, 0, 23, 59, 59, 999) - jstOffset)

    const [py, pm] = prevYearMonth.split('-').map(Number)
    const prevMonthStart = new Date(Date.UTC(py, pm - 1, 1) - jstOffset)
    const prevMonthEnd = new Date(Date.UTC(py, pm, 0, 23, 59, 59, 999) - jstOffset)

    console.log(`Generating insights for ${targetYearMonth} (previous: ${prevYearMonth})`)

    // 全企業を取得
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
            supabaseAdmin,
            ANTHROPIC_API_KEY,
            company.id,
            store.id,
            store.name,
            targetYearMonth,
            prevYearMonth,
            monthStart,
            monthEnd,
            prevMonthStart,
            prevMonthEnd
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
  // ========================================
  // A. コメントデータ取得
  // ========================================
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

  // ========================================
  // B. セグメント別QSCデータ取得
  // ========================================
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

  // C. 店舗全体のサマリー取得（比較用）
  const { data: storeSummary } = await supabase
    .from('monthly_analytics_summary')
    .select('*')
    .eq('company_id', companyId)
    .eq('store_id', storeId)
    .eq('year_month', targetYearMonth)
    .maybeSingle()

  // データが少ない場合はスキップ
  const allComments = currentComments || []
  if (allComments.length === 0 && (!currentByType || currentByType.length === 0)) {
    console.log(`Skipping store ${storeId}: no comments or type data`)
    return 0
  }

  // ========================================
  // コメントに12type分類を付与
  // ========================================
  const classifyType = (answer: any): number => {
    const nps = answer?.p1_q1
    const revisit = answer?.p1_q2
    const customerType = answer?.p1_q3

    const isPromoter = nps >= 9
    const isPassive = nps >= 7 && nps <= 8
    // const isDetractor = nps <= 6

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
    // detractor
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

  // ========================================
  // QSCデータの整形
  // ========================================
  const formatQscByType = (typeData: any[]) => {
    if (!typeData || typeData.length === 0) return '（データなし）'

    return typeData.map((td: any) => {
      const typeName = TYPE_NAMES[td.type] || `type${td.type}`
      let lines = `\n【${typeName}】(回答数: ${td.total_responses})\n`

      // Quality
      lines += 'Quality:\n'
      for (let i = 1; i <= 10; i++) {
        const pos = td[`q${i}_positive_percent`] || 0
        const neg = td[`q${i}_negative_percent`] || 0
        const total = td[`q${i}_total_count`] || 0
        if (total > 0) {
          lines += `  ${QUALITY_LABELS[i - 1]}: ポジ${pos}% / ネガ${neg}% (${total}件)\n`
        }
      }

      // Service
      lines += 'Service:\n'
      for (let i = 1; i <= 10; i++) {
        const pos = td[`s${i}_positive_percent`] || 0
        const neg = td[`s${i}_negative_percent`] || 0
        const total = td[`s${i}_total_count`] || 0
        if (total > 0) {
          lines += `  ${SERVICE_LABELS[i - 1]}: ポジ${pos}% / ネガ${neg}% (${total}件)\n`
        }
      }

      // Cleanliness
      lines += 'Cleanliness:\n'
      for (let i = 1; i <= 10; i++) {
        const pos = td[`c${i}_positive_percent`] || 0
        const neg = td[`c${i}_negative_percent`] || 0
        const total = td[`c${i}_total_count`] || 0
        if (total > 0) {
          lines += `  ${CLEANLINESS_LABELS[i - 1]}: ポジ${pos}% / ネガ${neg}% (${total}件)\n`
        }
      }

      return lines
    }).join('\n')
  }

  // ========================================
  // コメントデータの整形
  // ========================================
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
      for (const c of coms.slice(0, 10)) { // 各typeから最大10件
        const sentiment = c.is_positive === true ? '👍' : c.is_positive === false ? '👎' : '➖'
        text += `    ${sentiment} ${c.selected_qsc || ''}/${c.question_number || ''}: "${c.comment}"\n`
      }
      if (coms.length > 10) {
        text += `    ...他${coms.length - 10}件\n`
      }
    }
    return text
  }

  // ========================================
  // Claude API呼び出し
  // ========================================
  const prompt = buildInsightPrompt(
    storeName,
    targetYearMonth,
    prevYearMonth,
    enrichedCurrent,
    enrichedPrev,
    currentByType || [],
    prevByType || [],
    storeSummary,
    formatComments,
    formatQscByType
  )

  console.log(`[${storeName}] Calling Claude API for insights...`)
  const aiResponse = await callClaudeApi(apiKey, prompt)
  console.log(`[${storeName}] AI response: ${aiResponse.substring(0, 200)}...`)

  // JSONをパース
  let insights: any[] = []
  try {
    // レスポンスからJSON配列を抽出
    const jsonMatch = aiResponse.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      insights = JSON.parse(jsonMatch[0])
    }
  } catch (e) {
    console.error(`[${storeName}] Failed to parse AI response as JSON:`, e)
    console.error(`[${storeName}] Raw response:`, aiResponse)
    return 0
  }

  if (!Array.isArray(insights) || insights.length === 0) {
    console.log(`[${storeName}] No insights generated`)
    return 0
  }

  // 最大4件に制限
  insights = insights.slice(0, 4)

  // ========================================
  // 既存レコード削除 → 新規INSERT
  // ========================================
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

    // comment型の場合
    if (insight.issue_type === 'comment') {
      insertData.comment = insight.comment || null
    }

    // evaluation型の場合
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

  console.log(`[${storeName}] Successfully generated ${insights.length} insights`)
  return insights.length
}

// ========================================
// プロンプト構築
// ========================================
function buildInsightPrompt(
  storeName: string,
  targetYearMonth: string,
  prevYearMonth: string,
  currentComments: any[],
  prevComments: any[],
  currentByType: any[],
  prevByType: any[],
  storeSummary: any,
  formatComments: (comments: any[], label: string) => string,
  formatQscByType: (typeData: any[]) => string
): string {
  // 店舗全体のQSCデータを整形
  const formatStoreSummary = (summary: any): string => {
    if (!summary) return '（データなし）'
    let lines = `\n【店舗全体】(回答数: ${summary.total_responses || 0})\n`

    lines += 'Quality:\n'
    for (let i = 1; i <= 10; i++) {
      const pos = summary[`q${i}_positive_percent`] || 0
      const neg = summary[`q${i}_negative_percent`] || 0
      const total = summary[`q${i}_total_count`] || 0
      if (total > 0) {
        lines += `  ${QUALITY_LABELS[i - 1]}: ポジ${pos}% / ネガ${neg}% (${total}件)\n`
      }
    }

    lines += 'Service:\n'
    for (let i = 1; i <= 10; i++) {
      const pos = summary[`s${i}_positive_percent`] || 0
      const neg = summary[`s${i}_negative_percent`] || 0
      const total = summary[`s${i}_total_count`] || 0
      if (total > 0) {
        lines += `  ${SERVICE_LABELS[i - 1]}: ポジ${pos}% / ネガ${neg}% (${total}件)\n`
      }
    }

    lines += 'Cleanliness:\n'
    for (let i = 1; i <= 10; i++) {
      const pos = summary[`c${i}_positive_percent`] || 0
      const neg = summary[`c${i}_negative_percent`] || 0
      const total = summary[`c${i}_total_count`] || 0
      if (total > 0) {
        lines += `  ${CLEANLINESS_LABELS[i - 1]}: ポジ${pos}% / ネガ${neg}% (${total}件)\n`
      }
    }

    return lines
  }

  return `あなたは飲食店の月次レポートのAIアナリストです。以下のデータを分析し、${targetYearMonth}の店舗「${storeName}」における重要なインサイト（課題・注目点）を発見してください。

【出力ルール】
- 合計最大4件のインサイトをJSON配列で出力
- 各インサイトは "comment" 型（顧客コメントから発見）または "evaluation" 型（QSC評価データから発見）のいずれか
- コメントデータが豊富な場合は "comment" 型を優先
- QSCデータで顕著な傾向がある場合は "evaluation" 型も含める
- インサイトが見つからない場合は空配列 [] を返す
- JSON配列のみを出力する（前置きや説明は不要）

【重要: セグメント名の表記ルール】
- 「安定推奨層」「離脱リスク層」などの抽象的な内部名称は絶対に使わないこと
- 必ず「推奨者で再来店意向ありのリピーターのお客様」のように具体的な属性で記述すること
- issue_title, issue_detail内でも同様

【重要: 分析には比較がマスト】
- すべてのインサイトには必ず意味のある比較を含めること
- evaluation型では「特定セグメントの評価」と「店舗全体の評価」を比較すること
- comment型でも前月比較やセグメント間比較などの比較視点を含めること

【重要: 具体性のないインサイトは出力しない】
- 「頑張りましょう」「意識を高めましょう」のような精神論は絶対に出力しない
- 何が問題で、どの数値がどう悪いのか、具体的な事実に基づくインサイトのみ出力する
- 検討事項（point_1〜3）は具体的な質問と、それに対する条件付き改善提案をセットで書く
- 漠然とした課題しか見つからない場合は、無理にインサイトを出さず空配列 [] を返す

【comment型のJSON形式】
{
  "issue_type": "comment",
  "issue_title": "課題タイトル（20文字以内、例: 料理の量に対する不満が増加）",
  "issue_detail": "詳細説明（50〜200文字。データに基づく分析に加え、該当セグメントの改善が売上やリピート率にどう影響しうるか、改善のハードルやコスト感にも触れる。ただし無理に長くせず、言うべきことがあるときだけ書く）",
  "point_1": "質問→改善提案（例: 現在の1人前の量は男性客にとって適正と言えますか？→もし不足気味なら、+100円で大盛り対応を導入すると満足度が上がるかもしれません）",
  "point_2": "質問→改善提案（例: メニュー表に各料理のボリューム感は明示されていますか？→写真の隣にグラム数やサイズ感の目安を添えると、注文時のミスマッチを減らせます）",
  "point_3": "質問→改善提案（例: 量に関する不満は特定のメニューに集中していますか？→集中している場合、そのメニューだけ量を見直すことで効率的に改善できます）",
  "comment": "代表的な顧客コメント（実際のコメントテキストをそのまま引用）",
  "result_type": 最も関連する12type番号(1-12の整数)
}

【evaluation型のJSON形式】
※ evaluation型ではセグメント別の評価と店舗全体の評価を比較する
※ current_title/previous_titleはバーチャートのラベルになるので、比較対象がわかる記述にする
{
  "issue_type": "evaluation",
  "issue_title": "課題タイトル（20文字以内、例: 中立リピーターの床清潔さ低評価）",
  "issue_detail": "詳細説明（50〜200文字。セグメントと全体の差異をデータに基づき分析し、この層の改善が売上やリピート率にどう影響しうるか、改善のハードルやコスト感にも触れる。ただし無理に長くせず、言うべきことがあるときだけ書く）",
  "point_1": "質問→改善提案（例: ピーク時間帯の床清掃は何回実施していますか？→もし1日2回程度なら、ランチ後・ディナー前にも追加で実施すると効果的です）",
  "point_2": "質問→改善提案（例: 床の汚れをスタッフが即座に発見できる仕組みはありますか？→巡回チェック表を30分ごとに設定すると見落としを防げます）",
  "point_3": "質問→改善提案（例: 清掃チェックリストは時間帯別に設定されていますか？→ピーク後の重点チェック項目を設けることで効率的に清潔感を保てます）",
  "result_type": 対象の12type番号(1-12の整数),
  "current_title": "セグメント別ラベル（例: 中立リピーターの床評価）",
  "current_positive": そのセグメントのポジティブ%(整数),
  "current_negative": そのセグメントのネガティブ%(整数),
  "previous_title": "店舗全体ラベル（例: 店舗全体の床評価）",
  "previous_positive": 店舗全体のポジティブ%(整数),
  "previous_negative": 店舗全体のネガティブ%(整数)
}

【point_1/point_2/point_3について】
- 前半は質問形式で現状を問いかける（「〜ですか？」「〜していますか？」）
- 「→」の後に、もしその質問の答えが課題ありの場合の具体的な改善提案を添える
- 改善提案は「もし〜なら、〜すると〜できます」のように条件付きで提案する
- 定型文にせず、課題の内容に合わせて自然な文章で書くこと
- 各pointは80〜120文字程度

【12type分類】
${Object.entries(TYPE_NAMES).map(([k, v]) => `type ${k}: ${v}`).join('\n')}

【分析の着眼点】
- ネガティブコメントのパターンや共通テーマ
- 前月と比較して悪化している傾向
- 特定セグメント（批判者、離脱リスク層）に集中する問題
- セグメントのQSC評価が店舗全体の平均より著しく低い項目
- QSC項目でネガティブ率が特に高い項目（20%以上）
- 前月比でネガティブ率が5%以上増加した項目

=== 顧客コメントデータ ===

${formatComments(currentComments, `今月(${targetYearMonth})`)}

${formatComments(prevComments, `前月(${prevYearMonth})`)}

=== 店舗全体QSCデータ（今月: ${targetYearMonth}） ===
${formatStoreSummary(storeSummary)}

=== セグメント別QSCデータ（今月: ${targetYearMonth}） ===
${formatQscByType(currentByType)}

=== セグメント別QSCデータ（前月: ${prevYearMonth}） ===
${formatQscByType(prevByType)}
`
}

// ========================================
// Claude API呼び出し
// ========================================
async function callClaudeApi(apiKey: string, prompt: string): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2000,
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
