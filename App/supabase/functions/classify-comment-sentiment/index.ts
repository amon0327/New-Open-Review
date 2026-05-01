// ========================================
// classify-comment-sentiment
// ----------------------------------------
// preset_question_answer_comment.comment の本文を Claude Haiku 4.5 で
// 意味的センチメント分類し、text_sentiment / text_sentiment_score /
// text_topics / text_is_actionable 列を埋める。
//
// 既存の is_positive はアンケート分岐 (ポジ系設問 / ネガ系設問のどちらに
// 答えたか) の記録であり、本文の意味的センチメントを表していない。
// 月次レポート (Stage A 異常検知) で「どの type が何を不満に思っているか」を
// 正しく拾うため、本文の独立した意味解析を行う。
//
// 月次バッチからのみ呼ばれる想定。投稿時 / per-response 集計には干渉しない。
//
// 環境変数:
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY
//
// オプション (リクエストボディ):
//   {
//     mode?: 'incremental' | 'backfill' | 'reclassify_version',
//     target_year_month?: 'YYYY-MM',
//     store_ids?: uuid[],
//     batch_size?: number,           // 1リクエストあたりのコメ数 (default 50)
//     max_batches?: number,          // 1回の invoke で処理する最大バッチ数 (default 50)
//     concurrency?: number,          // 並列バッチ数 (default 3)
//     triggered_by?: string,         // 監査ログ用
//   }
//
// レスポンス:
//   { success, run_id, candidate_count, classified_count, failed_count,
//     classifier_version, processed_at }
// ========================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// プロンプト改訂時はここをインクリメント。`reclassify_version` モードで
// 旧バージョンの行を抽出して再分類する。
const CLASSIFIER_VERSION = 'haiku-4-5_v1'
const MODEL = 'claude-haiku-4-5-20251001'

const DEFAULT_BATCH_SIZE = 50
const DEFAULT_MAX_BATCHES = 50
const DEFAULT_CONCURRENCY = 3

// ========================================
// 静的プロンプト (prompt caching 対象)
// ========================================
const SYSTEM_PROMPT = `あなたは飲食店アンケートの自由記述コメントを分類する専門家です。
顧客が短い日本語で書いたコメントを読み、以下の4軸で分類してください。

【1. sentiment (categorical)】
- positive: 称賛・満足・好評を表す内容
- negative: 不満・改善要望・苦情を表す内容
- mixed: 称賛と不満が両方含まれる (例: "料理は美味しいが提供が遅い")
- neutral: 内容が無いか、評価を含まない (例: "特になし", "とくに", "頼んでません", "ありません", "該当なし", "ないです", "無し")

【2. score (continuous, -1.0〜+1.0)】
- 符号 = 極性 (- がネガ、+ がポジ、0 が中立)
- 絶対値 = 強度 (0.2 = 弱い、0.5 = 標準、0.8 以上 = 強い)
- 例:
  - "美味しい"           → +0.5
  - "感動的に美味しかった" → +0.9
  - "床がベタベタ"        → -0.7
  - "床がベタベタで気持ち悪い、二度と来ない" → -0.95
  - "特になし"            → 0.0
  - "もう少し量があるとうれしい" → -0.3 (弱い改善要望)

【3. topics (array, 0〜4個)】
コメントの中心トピックを名詞句で抽出。表記ゆれを正規化:
  - 「ベタベタ」「べたべた」 → "ベタつき"
  - 「冷えてる」「冷めてた」 → "冷め"
  - 「店員」「スタッフ」「従業員」 → "スタッフ"
  - 「美味しい」「美味しかった」 → "味"
  - 「狭い」「狭かった」 → "狭さ"
  - 「待ち時間」「待たされる」 → "待ち時間"
内容のないコメ (neutral) では topics は空配列。

【4. is_actionable (boolean)】
具体的内容を含み、店舗オペレーションの参考になるか:
  - true: 「床がベタベタ」「お茶のお代わり欲しい」「駐車場が分かりにくい」
  - false: 「特になし」「とくに」「ありません」「無し」「頼んでません」「該当なし」

【絶対遵守ルール】
- 否定形に注意: 「美味しくなかった」は negative、「悪くなかった」は positive 弱め
- 改善要望は negative (例: "もう少し量がほしい" は -0.3 程度の negative)
- 「特に」「特になし」「とくに」「ありません」「無し」「頼んでません」は **強制的に neutral + is_actionable=false + score=0** にする (ネガ設問への "特になし" を positive に倒さない)
- 入力で渡された id は出力でも必ず一致させる (大文字小文字含めそのまま)
- topics は最大4個、空白除去、原則 1〜5文字の名詞句

【出力】
classify_comments ツールを必ず呼び出すこと。入力配列の全 id について results 配列に1エントリずつ返す。`

// ========================================
// Tool 定義
// ========================================
const CLASSIFY_TOOL = {
  name: 'classify_comments',
  description: 'コメント配列を分類して結果配列を返す',
  input_schema: {
    type: 'object',
    properties: {
      results: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string', description: '入力で受け取った id をそのまま返す' },
            sentiment: { type: 'string', enum: ['positive', 'negative', 'neutral', 'mixed'] },
            score: { type: 'number', minimum: -1, maximum: 1 },
            topics: { type: 'array', items: { type: 'string' }, maxItems: 4 },
            is_actionable: { type: 'boolean' },
          },
          required: ['id', 'sentiment', 'score', 'topics', 'is_actionable'],
        },
      },
    },
    required: ['results'],
  },
}

// ========================================
// HTTP entry
// ========================================
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') ?? ''
    if (!ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY is not set')

    let body: any = {}
    try { body = await req.json() } catch { /* no body */ }

    const mode = (body?.mode ?? 'incremental') as 'incremental' | 'backfill' | 'reclassify_version'
    const targetYearMonth: string | null = body?.target_year_month ?? null
    const storeIds: string[] | null = Array.isArray(body?.store_ids) && body.store_ids.length > 0 ? body.store_ids : null
    const batchSize = body?.batch_size ?? DEFAULT_BATCH_SIZE
    const maxBatches = body?.max_batches ?? DEFAULT_MAX_BATCHES
    const concurrency = body?.concurrency ?? DEFAULT_CONCURRENCY
    const triggeredBy = body?.triggered_by ?? 'manual'

    // ----------------------------------------
    // 監査ログ開始
    // ----------------------------------------
    const { data: runRow, error: runErr } = await supabase
      .from('comment_classification_runs')
      .insert({
        run_type: mode,
        target_year_month: targetYearMonth,
        store_ids: storeIds,
        classifier_version: CLASSIFIER_VERSION,
        triggered_by: triggeredBy,
        status: 'running',
      })
      .select('id')
      .single()
    if (runErr) throw new Error(`Failed to create run record: ${runErr.message}`)
    const runId = runRow.id

    let totalCandidates = 0
    let totalClassified = 0
    let totalFailed = 0
    const errorSamples: any[] = []

    try {
      for (let batchIdx = 0; batchIdx < maxBatches; batchIdx += concurrency) {
        // 並列でバッチを引いて処理
        const batchPromises: Promise<{ classified: number; failed: number; candidates: number; errors?: any[] }>[] = []
        for (let p = 0; p < concurrency && batchIdx + p < maxBatches; p++) {
          batchPromises.push((async () => {
            const targets = await fetchTargets(supabase, mode, targetYearMonth, storeIds, batchSize)
            if (!targets || targets.length === 0) return { classified: 0, failed: 0, candidates: 0 }
            try {
              const results = await classifyBatch(ANTHROPIC_API_KEY, targets)
              const { classified, failed, errors } = await applyResults(supabase, targets, results)
              return { classified, failed, candidates: targets.length, errors }
            } catch (e: any) {
              console.error('Batch failed:', e.message)
              return { classified: 0, failed: targets.length, candidates: targets.length, errors: [{ batch_error: e.message }] }
            }
          })())
        }
        const batchResults = await Promise.all(batchPromises)
        let batchTotal = 0
        for (const r of batchResults) {
          totalCandidates += r.candidates
          totalClassified += r.classified
          totalFailed += r.failed
          batchTotal += r.candidates
          if (r.errors) errorSamples.push(...r.errors.slice(0, 3))
        }
        // 全バッチが空だったらこれ以上ない
        if (batchTotal === 0) {
          console.log(`No more candidates. Stopping after batch ${batchIdx}.`)
          break
        }
      }

      await supabase.from('comment_classification_runs').update({
        completed_at: new Date().toISOString(),
        candidate_count: totalCandidates,
        classified_count: totalClassified,
        failed_count: totalFailed,
        error_sample: errorSamples.length > 0 ? errorSamples.slice(0, 10) : null,
        status: 'completed',
      }).eq('id', runId)
    } catch (e: any) {
      await supabase.from('comment_classification_runs').update({
        completed_at: new Date().toISOString(),
        candidate_count: totalCandidates,
        classified_count: totalClassified,
        failed_count: totalFailed,
        error_sample: [{ fatal: e.message }, ...errorSamples.slice(0, 9)],
        status: 'failed',
      }).eq('id', runId)
      throw e
    }

    return new Response(
      JSON.stringify({
        success: true,
        run_id: runId,
        candidate_count: totalCandidates,
        classified_count: totalClassified,
        failed_count: totalFailed,
        classifier_version: CLASSIFIER_VERSION,
        processed_at: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error: any) {
    console.error('classify-comment-sentiment error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})

// ========================================
// 対象コメ抽出
// ========================================
async function fetchTargets(
  supabase: any,
  mode: 'incremental' | 'backfill' | 'reclassify_version',
  targetYearMonth: string | null,
  storeIds: string[] | null,
  limit: number
): Promise<any[]> {
  let q = supabase
    .from('preset_question_answer_comment')
    .select('id, comment, selected_qsc, preset_question_answer!inner(store_id, company_id, created_at)')
    .not('comment', 'is', null)
    .neq('comment', '')
    .order('id', { ascending: true })
    .limit(limit)

  if (mode === 'incremental') {
    q = q.eq('text_sentiment', 'unclassified')
  } else if (mode === 'backfill') {
    // backfill は year_month 範囲指定で全件再分類
    // (text_classifier_version IS NULL or NOT current のものに絞る運用が望ましい)
    q = q.or(`text_classifier_version.is.null,text_classifier_version.neq.${CLASSIFIER_VERSION}`)
  } else if (mode === 'reclassify_version') {
    q = q.or(`text_classifier_version.is.null,text_classifier_version.neq.${CLASSIFIER_VERSION}`)
  }

  if (targetYearMonth) {
    const [y, m] = targetYearMonth.split('-').map(Number)
    const jstOffset = 9 * 60 * 60 * 1000
    const monthStart = new Date(Date.UTC(y, m - 1, 1) - jstOffset)
    const monthEnd = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999) - jstOffset)
    q = q
      .gte('preset_question_answer.created_at', monthStart.toISOString())
      .lte('preset_question_answer.created_at', monthEnd.toISOString())
  }

  if (storeIds && storeIds.length > 0) {
    q = q.in('preset_question_answer.store_id', storeIds)
  }

  const { data, error } = await q
  if (error) throw new Error(`Failed to fetch targets: ${error.message}`)
  return (data || []).filter((c: any) => c.preset_question_answer)
}

// ========================================
// 1バッチを Haiku に投げて結果を得る
// ========================================
async function classifyBatch(apiKey: string, targets: any[]): Promise<Map<string, any>> {
  // ユーザープロンプトに id + 本文を JSON 配列で渡す
  const items = targets.map((t: any) => ({
    id: t.id,
    selected_qsc: t.selected_qsc,
    comment: (t.comment || '').slice(0, 500), // 異常に長いコメは安全側で切り詰め
  }))

  const userPrompt = `以下のコメントを classify_comments ツールで全件分類してください。
入力 (${items.length}件):
${JSON.stringify(items, null, 2)}

各エントリの id を出力で必ず一致させてください。`

  const response = await callAnthropic(apiKey, {
    model: MODEL,
    max_tokens: 8000,
    system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
    tools: [CLASSIFY_TOOL],
    tool_choice: { type: 'tool', name: 'classify_comments' },
    messages: [{ role: 'user', content: userPrompt }],
  })

  const toolUse = (response.content || []).find((c: any) => c.type === 'tool_use')
  if (!toolUse?.input?.results) {
    throw new Error(`No tool_use results: ${JSON.stringify(response).slice(0, 300)}`)
  }
  const map = new Map<string, any>()
  for (const r of toolUse.input.results) {
    if (r.id) map.set(String(r.id), r)
  }
  return map
}

// ========================================
// 結果を DB に書き戻す
// ========================================
async function applyResults(
  supabase: any,
  targets: any[],
  resultsMap: Map<string, any>
): Promise<{ classified: number; failed: number; errors: any[] }> {
  let classified = 0
  let failed = 0
  const errors: any[] = []
  const now = new Date().toISOString()

  // 1件ずつ update (PostgREST は同時 update 一括サポートが弱いため。50件/バッチ程度なら許容)
  // パフォーマンス問題が出たら RPC で in (...) update に変更可。
  for (const t of targets) {
    const r = resultsMap.get(String(t.id))
    if (!r) {
      failed++
      errors.push({ id: t.id, error: 'no result returned' })
      continue
    }

    // バリデーション
    const sentiment = ['positive', 'negative', 'neutral', 'mixed'].includes(r.sentiment) ? r.sentiment : null
    const score = typeof r.score === 'number' && r.score >= -1 && r.score <= 1 ? Math.round(r.score * 100) / 100 : null
    const topics = Array.isArray(r.topics) ? r.topics.slice(0, 4).filter((s: any) => typeof s === 'string' && s.length > 0 && s.length <= 30) : []
    const isActionable = typeof r.is_actionable === 'boolean' ? r.is_actionable : null

    if (!sentiment || score === null || isActionable === null) {
      failed++
      errors.push({ id: t.id, error: 'invalid result fields', raw: r })
      continue
    }

    const { error: updErr } = await supabase
      .from('preset_question_answer_comment')
      .update({
        text_sentiment: sentiment,
        text_sentiment_score: score,
        text_topics: topics,
        text_is_actionable: isActionable,
        text_classified_at: now,
        text_classifier_version: CLASSIFIER_VERSION,
      })
      .eq('id', t.id)

    if (updErr) {
      failed++
      errors.push({ id: t.id, error: updErr.message })
    } else {
      classified++
    }
  }
  return { classified, failed, errors }
}

// ========================================
// Anthropic API 共通 (リトライ付き)
// ========================================
async function callAnthropic(apiKey: string, body: any): Promise<any> {
  const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504, 529])
  const MAX_ATTEMPTS = 4
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(body),
      })
      if (r.ok) return await r.json()
      const errBody = await r.text()
      const errMsg = `Anthropic API ${r.status}: ${errBody.slice(0, 500)}`
      if (RETRYABLE_STATUSES.has(r.status) && attempt < MAX_ATTEMPTS) {
        const wait = Math.min(30000, 1000 * Math.pow(2, attempt - 1)) + Math.floor(Math.random() * 1000)
        console.warn(`Retryable ${r.status}, attempt ${attempt}/${MAX_ATTEMPTS}, waiting ${wait}ms`)
        await new Promise((res) => setTimeout(res, wait))
        lastError = new Error(errMsg)
        continue
      }
      throw new Error(errMsg)
    } catch (e: any) {
      const isNetworkError = e?.name === 'TypeError' || /fetch|network|aborted|timeout/i.test(e?.message || '')
      if (isNetworkError && attempt < MAX_ATTEMPTS) {
        const wait = Math.min(30000, 1000 * Math.pow(2, attempt - 1))
        console.warn(`Network error, attempt ${attempt}/${MAX_ATTEMPTS}, waiting ${wait}ms: ${e.message}`)
        await new Promise((res) => setTimeout(res, wait))
        lastError = e
        continue
      }
      throw e
    }
  }
  throw lastError || new Error('Anthropic API failed after retries')
}
