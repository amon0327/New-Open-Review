// ========================================
// embed-comments
// ----------------------------------------
// 未埋め込みのコメントを取得 → OpenAI text-embedding-3-small で
// 埋め込み → comment_embeddings に保存。
// 月次インサイト生成 (構想 #9) で類似コメントクラスタリングに使う。
//
// 環境変数:
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY
// 起動方法:
//   - cron で定期実行 (1時間に1回など)
//   - 手動 invoke で全店舗一括処理も可能
//
// オプション (リクエストボディ):
//   { batch_size?: number, max_batches?: number, year_month?: string }
// ========================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const EMBEDDING_MODEL = 'text-embedding-3-small'
const EMBEDDING_DIMS = 1536
const DEFAULT_BATCH_SIZE = 64
const DEFAULT_MAX_BATCHES = 30

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') ?? ''
    if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is not set')

    let body: any = {}
    try {
      body = await req.json()
    } catch { /* no body */ }

    const batchSize = body?.batch_size ?? DEFAULT_BATCH_SIZE
    const maxBatches = body?.max_batches ?? DEFAULT_MAX_BATCHES
    const filterYearMonth: string | null = body?.year_month ?? null

    let totalEmbedded = 0
    let totalErrors = 0

    for (let batchIdx = 0; batchIdx < maxBatches; batchIdx++) {
      const targets = await fetchUnembeddedComments(supabase, batchSize, filterYearMonth)
      if (!targets || targets.length === 0) {
        console.log(`No more unembedded comments. Done after ${batchIdx} batches.`)
        break
      }

      const inputs = targets.map((t: any) => (t.comment || '').trim()).filter((s: string) => s.length > 0)
      const inputIdx = targets
        .map((t: any, i: number) => ({ t, i }))
        .filter(({ t }) => (t.comment || '').trim().length > 0)
        .map(({ i }) => i)

      if (inputs.length === 0) {
        // 全て空コメント。0次元プレースホルダではなくスキップする方針なら、空コメントは別扱い必要。
        // ここでは ID をマークするためダミー埋め込みを挿入せず、ループだけ進める。
        console.log(`Batch ${batchIdx}: all comments empty, skipping`)
        continue
      }

      let vectors: number[][]
      try {
        vectors = await embedBatch(OPENAI_API_KEY, inputs)
      } catch (e: any) {
        console.error(`Embedding API failed in batch ${batchIdx}:`, e.message)
        totalErrors += inputs.length
        // 1バッチ失敗で全停止せず、次のバッチへ
        continue
      }

      const records = inputIdx.map((origIdx, k) => {
        const t = targets[origIdx]
        return {
          comment_id: t.id,
          store_id: t.store_id,
          company_id: t.company_id,
          year_month: t.year_month,
          embedding: vectors[k],
          embedding_model: EMBEDDING_MODEL,
        }
      })

      const { error: insertError } = await supabase
        .from('comment_embeddings')
        .upsert(records, { onConflict: 'comment_id,embedding_model' })

      if (insertError) {
        console.error(`Insert failed in batch ${batchIdx}:`, insertError.message)
        totalErrors += records.length
      } else {
        totalEmbedded += records.length
        console.log(`Batch ${batchIdx}: embedded ${records.length} comments`)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        embedded: totalEmbedded,
        errors: totalErrors,
        model: EMBEDDING_MODEL,
        processedAt: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error: any) {
    console.error('embed-comments error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})

// ========================================
// 未埋め込みコメントを取得
// LEFT JOIN ではなく NOT EXISTS で抽出 (PostgREST 単独では JOIN 制約があるため RPC 想定)
// 簡易実装: comment_embeddings にある comment_id を除外する
// ========================================
async function fetchUnembeddedComments(
  supabase: any,
  limit: number,
  filterYearMonth: string | null
): Promise<any[]> {
  // 既に埋め込み済みの comment_id 一覧を取得
  let { data: embedded } = await supabase
    .from('comment_embeddings')
    .select('comment_id')
    .eq('embedding_model', EMBEDDING_MODEL)
    .limit(50000)

  const embeddedIds = new Set((embedded || []).map((e: any) => e.comment_id))

  // 候補コメントを年月で絞り込んで取得
  let query = supabase
    .from('preset_question_answer_comment')
    .select('id, comment, preset_question_answer!inner(store_id, company_id, created_at)')
    .not('comment', 'is', null)
    .neq('comment', '')
    .order('id', { ascending: true })
    .limit(limit * 5) // フィルタで減るので余裕を持って

  if (filterYearMonth) {
    const [y, m] = filterYearMonth.split('-').map(Number)
    const jstOffset = 9 * 60 * 60 * 1000
    const monthStart = new Date(Date.UTC(y, m - 1, 1) - jstOffset)
    const monthEnd = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999) - jstOffset)
    query = query
      .gte('preset_question_answer.created_at', monthStart.toISOString())
      .lte('preset_question_answer.created_at', monthEnd.toISOString())
  }

  const { data: candidates, error } = await query
  if (error) throw new Error(`Failed to fetch candidates: ${error.message}`)
  if (!candidates) return []

  // 未埋め込みのものに絞る + フラット化
  const result: any[] = []
  for (const c of candidates) {
    if (embeddedIds.has(c.id)) continue
    const ans = c.preset_question_answer
    if (!ans) continue
    const createdAt = new Date(ans.created_at)
    const jstAt = new Date(createdAt.getTime() + 9 * 60 * 60 * 1000)
    const ym = `${jstAt.getUTCFullYear()}-${String(jstAt.getUTCMonth() + 1).padStart(2, '0')}`
    result.push({
      id: c.id,
      comment: c.comment,
      store_id: ans.store_id,
      company_id: ans.company_id,
      year_month: ym,
    })
    if (result.length >= limit) break
  }
  return result
}

// ========================================
// OpenAI Embeddings API 呼び出し
// ========================================
async function embedBatch(apiKey: string, inputs: string[]): Promise<number[][]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: inputs,
      dimensions: EMBEDDING_DIMS,
    }),
  })

  if (!response.ok) {
    const errBody = await response.text()
    throw new Error(`OpenAI embeddings API error: ${response.status} ${errBody.slice(0, 300)}`)
  }
  const data = await response.json()
  if (!data?.data || !Array.isArray(data.data)) {
    throw new Error(`Invalid OpenAI response: ${JSON.stringify(data).slice(0, 300)}`)
  }
  return data.data.map((d: any) => d.embedding as number[])
}
