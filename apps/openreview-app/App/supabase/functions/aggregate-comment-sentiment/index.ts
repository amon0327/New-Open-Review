// ========================================
// aggregate-comment-sentiment
// ----------------------------------------
// classify-comment-sentiment が埋めた preset_question_answer_comment.text_*
// を起点に、月次バッチで以下 2 テーブルを生成する:
//
//   - monthly_comment_sentiment_by_type (12 type 別)
//   - monthly_comment_sentiment_summary (店舗横断、type 跨ぎ)
//
// generate-analytics-insights / generate-analytics-ai-text の入力として
// 「サンプル数のあるネガトピック」「店舗横断テーマ」を提供する。
//
// 月次バッチからのみ呼ばれる想定。per-response 集計には干渉しない。
//
// 環境変数:
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//
// オプション (リクエストボディ):
//   {
//     target_year_month?: 'YYYY-MM',  // 省略時は前月
//     store_ids?: uuid[],
//     triggered_by?: string,
//   }
// ========================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// 横断テーマ判定の閾値
const CROSS_TYPE_MIN_TYPES = 3
const CROSS_TYPE_MIN_TOTAL = 5
const TOP_TOPICS_PER_TYPE = 5
const SAMPLE_COMMENT_IDS_PER_TOPIC = 3

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    let body: any = {}
    try { body = await req.json() } catch { /* no body */ }

    const targetYearMonth: string = body?.target_year_month || prevYearMonth()
    const storeIdsFilter: string[] | null = Array.isArray(body?.store_ids) && body.store_ids.length > 0 ? body.store_ids : null
    const triggeredBy = body?.triggered_by ?? 'manual'

    // 監査ログ開始
    const { data: runRow, error: runErr } = await supabase
      .from('sentiment_aggregation_runs')
      .insert({
        target_year_month: targetYearMonth,
        store_ids: storeIdsFilter,
        triggered_by: triggeredBy,
        status: 'running',
      })
      .select('id')
      .single()
    if (runErr) throw new Error(`Failed to create run record: ${runErr.message}`)
    const runId = runRow.id

    let typeRows = 0
    let summaryRows = 0
    let storesProcessed = 0
    const errors: any[] = []

    try {
      // 対象店舗を抽出 (companies × stores)
      const { data: companies } = await supabase.from('companies').select('id, name')
      const tasks: { companyId: string; storeId: string; storeName: string }[] = []
      for (const company of companies || []) {
        const { data: stores } = await supabase.from('stores').select('id, name').eq('company_id', company.id)
        for (const store of stores || []) {
          if (storeIdsFilter && !storeIdsFilter.includes(store.id)) continue
          tasks.push({ companyId: company.id, storeId: store.id, storeName: store.name })
        }
      }

      // 並列度 5 で店舗集計
      const CONCURRENCY = 5
      for (let i = 0; i < tasks.length; i += CONCURRENCY) {
        const chunk = tasks.slice(i, i + CONCURRENCY)
        const chunkRes = await Promise.all(chunk.map(async (t) => {
          try {
            const r = await aggregateStore(supabase, t.companyId, t.storeId, targetYearMonth)
            return { ok: true, ...r }
          } catch (e: any) {
            return { ok: false, error: { storeId: t.storeId, msg: e.message } }
          }
        }))
        for (const r of chunkRes) {
          if (r.ok) {
            storesProcessed++
            typeRows += r.typeRows ?? 0
            summaryRows += r.summaryRows ?? 0
          } else {
            errors.push(r.error)
          }
        }
      }

      await supabase.from('sentiment_aggregation_runs').update({
        completed_at: new Date().toISOString(),
        store_count: storesProcessed,
        type_rows_written: typeRows,
        summary_rows_written: summaryRows,
        error_sample: errors.length > 0 ? errors.slice(0, 10) : null,
        status: 'completed',
      }).eq('id', runId)
    } catch (e: any) {
      await supabase.from('sentiment_aggregation_runs').update({
        completed_at: new Date().toISOString(),
        store_count: storesProcessed,
        type_rows_written: typeRows,
        summary_rows_written: summaryRows,
        error_sample: [{ fatal: e.message }, ...errors.slice(0, 9)],
        status: 'failed',
      }).eq('id', runId)
      throw e
    }

    return new Response(
      JSON.stringify({
        success: true,
        run_id: runId,
        target_year_month: targetYearMonth,
        stores_processed: storesProcessed,
        type_rows_written: typeRows,
        summary_rows_written: summaryRows,
        processed_at: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error: any) {
    console.error('aggregate-comment-sentiment error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})

// ========================================
// 1 店舗 × 対象月の集計
// ========================================
async function aggregateStore(
  supabase: any,
  companyId: string,
  storeId: string,
  yearMonth: string
): Promise<{ typeRows: number; summaryRows: number }> {
  const [y, m] = yearMonth.split('-').map(Number)
  const jstOffset = 9 * 60 * 60 * 1000
  const monthStart = new Date(Date.UTC(y, m - 1, 1) - jstOffset)
  const monthEnd = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999) - jstOffset)

  // 対象月のコメ + 回答 (text_classifier_version IS NOT NULL のみ集計対象)
  const { data: rows, error } = await supabase
    .from('preset_question_answer_comment')
    .select(`
      id, comment, selected_qsc, text_sentiment, text_sentiment_score, text_topics,
      text_is_actionable, text_classifier_version,
      preset_question_answer!inner(p1_q1, p1_q2, p1_q3, store_id, company_id, created_at)
    `)
    .eq('preset_question_answer.company_id', companyId)
    .eq('preset_question_answer.store_id', storeId)
    .gte('preset_question_answer.created_at', monthStart.toISOString())
    .lte('preset_question_answer.created_at', monthEnd.toISOString())
    .neq('text_sentiment', 'unclassified')
    .not('text_classifier_version', 'is', null)

  if (error) throw new Error(`Failed to fetch: ${error.message}`)

  const comments = rows || []

  // 既存行を削除 (冪等)
  await supabase.from('monthly_comment_sentiment_by_type')
    .delete().eq('company_id', companyId).eq('store_id', storeId).eq('year_month', yearMonth)
  await supabase.from('monthly_comment_sentiment_summary')
    .delete().eq('company_id', companyId).eq('store_id', storeId).eq('year_month', yearMonth)

  if (comments.length === 0) {
    return { typeRows: 0, summaryRows: 0 }
  }

  // 12type 分類
  const enriched = comments.map((c: any) => ({
    ...c,
    type: classifyType(c.preset_question_answer),
  }))

  const classifierVersion = enriched[0]?.text_classifier_version || null

  // 12type 別集計
  const byType = new Map<number, any[]>()
  for (const c of enriched) {
    if (!byType.has(c.type)) byType.set(c.type, [])
    byType.get(c.type)!.push(c)
  }

  const typeInserts: any[] = []
  for (const [type, items] of byType.entries()) {
    typeInserts.push(buildTypeRow(companyId, storeId, yearMonth, type, items, classifierVersion))
  }
  if (typeInserts.length > 0) {
    const { error: insErr } = await supabase.from('monthly_comment_sentiment_by_type').insert(typeInserts)
    if (insErr) throw new Error(`type insert failed: ${insErr.message}`)
  }

  // 店舗横断集計
  const summaryRow = buildSummaryRow(companyId, storeId, yearMonth, enriched, classifierVersion)
  const { error: sumErr } = await supabase.from('monthly_comment_sentiment_summary').insert(summaryRow)
  if (sumErr) throw new Error(`summary insert failed: ${sumErr.message}`)

  return { typeRows: typeInserts.length, summaryRows: 1 }
}

// ========================================
// 12type 分類 (generate-analytics-insights と同じロジック)
// ========================================
function classifyType(answer: any): number {
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

// ========================================
// type 行を構築
// ========================================
function buildTypeRow(
  companyId: string,
  storeId: string,
  yearMonth: string,
  type: number,
  items: any[],
  classifierVersion: string | null
): any {
  const total = items.length
  const actionable = items.filter((c: any) => c.text_is_actionable === true)

  const counts = sentimentCounts(items)
  const actionableScores = actionable
    .map((c: any) => Number(c.text_sentiment_score))
    .filter((n: any) => Number.isFinite(n))
  const avgScore = actionableScores.length > 0
    ? Math.round((actionableScores.reduce((a, b) => a + b, 0) / actionableScores.length) * 1000) / 1000
    : null

  // selected_qsc × sentiment クロス
  const qscSentCounts = (qsc: string, s: string) =>
    actionable.filter((c: any) => c.selected_qsc === qsc && c.text_sentiment === s).length

  // トピック集計 (actionable のみ)
  const topNeg = topTopics(actionable.filter((c: any) => c.text_sentiment === 'negative'), TOP_TOPICS_PER_TYPE)
  const topPos = topTopics(actionable.filter((c: any) => c.text_sentiment === 'positive'), TOP_TOPICS_PER_TYPE)

  return {
    company_id: companyId,
    store_id: storeId,
    year_month: yearMonth,
    type,
    total_comments: total,
    actionable_count: actionable.length,
    positive_count: counts.positive,
    negative_count: counts.negative,
    neutral_count: counts.neutral,
    mixed_count: counts.mixed,
    avg_sentiment_score: avgScore,
    quality_negative_count: qscSentCounts('quality', 'negative'),
    service_negative_count: qscSentCounts('service', 'negative'),
    cleanliness_negative_count: qscSentCounts('cleanliness', 'negative'),
    quality_positive_count: qscSentCounts('quality', 'positive'),
    service_positive_count: qscSentCounts('service', 'positive'),
    cleanliness_positive_count: qscSentCounts('cleanliness', 'positive'),
    top_negative_topics: topNeg.length > 0 ? topNeg : null,
    top_positive_topics: topPos.length > 0 ? topPos : null,
    classifier_version: classifierVersion,
  }
}

// ========================================
// 店舗横断行を構築
// ========================================
function buildSummaryRow(
  companyId: string,
  storeId: string,
  yearMonth: string,
  items: any[],
  classifierVersion: string | null
): any {
  const total = items.length
  const actionable = items.filter((c: any) => c.text_is_actionable === true)
  const counts = sentimentCounts(items)

  const actionableScores = actionable
    .map((c: any) => Number(c.text_sentiment_score))
    .filter((n: any) => Number.isFinite(n))
  const avgScore = actionableScores.length > 0
    ? Math.round((actionableScores.reduce((a, b) => a + b, 0) / actionableScores.length) * 1000) / 1000
    : null

  // 横断テーマ: トピック別に type 分布を集計
  const crossNeg = crossTypeThemes(actionable.filter((c: any) => c.text_sentiment === 'negative'))
  const crossPos = crossTypeThemes(actionable.filter((c: any) => c.text_sentiment === 'positive'))

  return {
    company_id: companyId,
    store_id: storeId,
    year_month: yearMonth,
    total_comments: total,
    actionable_count: actionable.length,
    positive_count: counts.positive,
    negative_count: counts.negative,
    neutral_count: counts.neutral,
    mixed_count: counts.mixed,
    avg_sentiment_score: avgScore,
    cross_type_negative_themes: crossNeg.length > 0 ? crossNeg : null,
    cross_type_positive_themes: crossPos.length > 0 ? crossPos : null,
    classifier_version: classifierVersion,
  }
}

function sentimentCounts(items: any[]): { positive: number; negative: number; neutral: number; mixed: number } {
  const out = { positive: 0, negative: 0, neutral: 0, mixed: 0 }
  for (const c of items) {
    const s = c.text_sentiment
    if (s === 'positive' || s === 'negative' || s === 'neutral' || s === 'mixed') {
      out[s]++
    }
  }
  return out
}

// ========================================
// トピック上位 N
//   形式: [{topic, count, avg_score, sample_comment_ids:[...]}]
// ========================================
function topTopics(items: any[], topN: number): any[] {
  const map = new Map<string, { count: number; sumScore: number; sampleIds: string[]; sampleScores: number[] }>()
  for (const c of items) {
    const topics: string[] = Array.isArray(c.text_topics) ? c.text_topics : []
    const score = Number(c.text_sentiment_score) || 0
    const id = String(c.id)
    for (const topic of topics) {
      const t = (topic || '').trim()
      if (!t) continue
      if (!map.has(t)) map.set(t, { count: 0, sumScore: 0, sampleIds: [], sampleScores: [] })
      const e = map.get(t)!
      e.count++
      e.sumScore += score
      e.sampleScores.push(score)
      if (e.sampleIds.length < SAMPLE_COMMENT_IDS_PER_TOPIC) {
        e.sampleIds.push(id)
      } else {
        // より強いスコアのサンプルに置き換え (代表性を上げる)
        const minIdx = e.sampleScores
          .slice(0, SAMPLE_COMMENT_IDS_PER_TOPIC)
          .reduce((mi, s, i, arr) => Math.abs(s) < Math.abs(arr[mi]) ? i : mi, 0)
        if (Math.abs(score) > Math.abs(e.sampleScores[minIdx])) {
          e.sampleIds[minIdx] = id
          e.sampleScores[minIdx] = score
        }
      }
    }
  }
  const arr = [...map.entries()].map(([topic, v]) => ({
    topic,
    count: v.count,
    avg_score: Math.round((v.sumScore / v.count) * 1000) / 1000,
    sample_comment_ids: v.sampleIds,
  }))
  arr.sort((a, b) => b.count - a.count)
  return arr.slice(0, topN)
}

// ========================================
// 店舗横断テーマ
//   トピックを type 跨ぎで集計し、type_count >= 3 かつ total >= 5 のもののみ採用
// ========================================
function crossTypeThemes(items: any[]): any[] {
  const map = new Map<string, { total: number; types: Map<number, number>; sampleIds: string[] }>()
  for (const c of items) {
    const topics: string[] = Array.isArray(c.text_topics) ? c.text_topics : []
    const t = c.type
    for (const topic of topics) {
      const tt = (topic || '').trim()
      if (!tt) continue
      if (!map.has(tt)) map.set(tt, { total: 0, types: new Map(), sampleIds: [] })
      const e = map.get(tt)!
      e.total++
      e.types.set(t, (e.types.get(t) || 0) + 1)
      if (e.sampleIds.length < 5) e.sampleIds.push(String(c.id))
    }
  }
  const arr: any[] = []
  for (const [topic, v] of map.entries()) {
    if (v.types.size < CROSS_TYPE_MIN_TYPES) continue
    if (v.total < CROSS_TYPE_MIN_TOTAL) continue
    const dist: Record<string, number> = {}
    for (const [tk, tv] of v.types.entries()) dist[String(tk)] = tv
    arr.push({
      topic,
      total: v.total,
      type_count: v.types.size,
      type_distribution: dist,
      sample_comment_ids: v.sampleIds,
    })
  }
  arr.sort((a, b) => b.total - a.total)
  return arr.slice(0, 8)
}

// ========================================
// 前月 (JST)
// ========================================
function prevYearMonth(): string {
  const now = new Date()
  const jstOffset = 9 * 60 * 60 * 1000
  const jstNow = new Date(now.getTime() + jstOffset)
  const d = new Date(jstNow.getFullYear(), jstNow.getMonth() - 1, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
