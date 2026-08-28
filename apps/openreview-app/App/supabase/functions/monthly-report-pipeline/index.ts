// ========================================
// monthly-report-pipeline
// ----------------------------------------
// 月次レポート生成の一連を直列実行するオーケストレーター。
//
//   1. classify-comment-sentiment   (incremental)
//   2. aggregate-comment-sentiment
//   3. generate-analytics-ai-text
//   4. generate-analytics-insights
//
// per-response 集計 (update-monthly-analytics) には干渉しない。
// 月初 cron (例: 月初 2 日 5:00 JST) でこの関数を 1 本叩く前提。
//
// 環境変数:
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//
// オプション (リクエストボディ):
//   {
//     target_year_month?: 'YYYY-MM',  // 省略時は前月
//     store_ids?: uuid[],
//     skip_classification?: boolean,  // 既に分類済みのときに使う
//     skip_aggregation?: boolean,
//     skip_ai_text?: boolean,
//     skip_insights?: boolean,
//     wait_insights?: boolean,        // insights を同期実行するか (デフォルト false=非同期)
//     triggered_by?: string,
//   }
// ========================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    if (!supabaseUrl || !serviceKey) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing')

    let body: any = {}
    try { body = await req.json() } catch { /* no body */ }

    const targetYearMonth: string = body?.target_year_month || prevYearMonth()
    const storeIds: string[] | null = Array.isArray(body?.store_ids) && body.store_ids.length > 0 ? body.store_ids : null
    const triggeredBy = body?.triggered_by ?? 'cron'
    const skipClassify = !!body?.skip_classification
    const skipAggregate = !!body?.skip_aggregation
    const skipAiText = !!body?.skip_ai_text
    const skipInsights = !!body?.skip_insights
    const waitInsights = !!body?.wait_insights

    const startedAt = new Date().toISOString()
    const steps: Array<{ name: string; status: string; result?: any; error?: string; duration_ms?: number }> = []

    const callFn = async (name: string, payload: any, opts?: { wait?: boolean; mode?: 'sync' | 'async' }): Promise<any> => {
      const t0 = Date.now()
      try {
        const url = `${supabaseUrl}/functions/v1/${name}` + (opts?.wait ? '?wait=true' : '')
        const r = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${serviceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        })
        const text = await r.text()
        let parsed: any = null
        try { parsed = JSON.parse(text) } catch { parsed = { raw: text.slice(0, 500) } }
        const duration_ms = Date.now() - t0
        if (!r.ok) {
          steps.push({ name, status: 'failed', error: `HTTP ${r.status}`, result: parsed, duration_ms })
          throw new Error(`${name} failed: HTTP ${r.status}`)
        }
        steps.push({ name, status: 'ok', result: parsed, duration_ms })
        return parsed
      } catch (e: any) {
        const duration_ms = Date.now() - t0
        steps.push({ name, status: 'failed', error: e.message, duration_ms })
        throw e
      }
    }

    const baseBody: any = { target_year_month: targetYearMonth, triggered_by: triggeredBy }
    if (storeIds) baseBody.store_ids = storeIds

    // ------------------------------------------------
    // Step 1: classify-comment-sentiment (incremental)
    // ------------------------------------------------
    if (!skipClassify) {
      try {
        await callFn('classify-comment-sentiment', { ...baseBody, mode: 'incremental' })
      } catch (e: any) {
        // 分類失敗でも次へ進む (既存分の集計は可能)
        console.error('classify failed, continuing:', e.message)
      }
    } else {
      steps.push({ name: 'classify-comment-sentiment', status: 'skipped' })
    }

    // ------------------------------------------------
    // Step 2: aggregate-comment-sentiment
    // ------------------------------------------------
    if (!skipAggregate) {
      try {
        await callFn('aggregate-comment-sentiment', baseBody)
      } catch (e: any) {
        console.error('aggregate failed, continuing:', e.message)
      }
    } else {
      steps.push({ name: 'aggregate-comment-sentiment', status: 'skipped' })
    }

    // ------------------------------------------------
    // Step 3: generate-analytics-ai-text
    // ------------------------------------------------
    if (!skipAiText) {
      try {
        await callFn('generate-analytics-ai-text', baseBody)
      } catch (e: any) {
        console.error('ai-text failed, continuing:', e.message)
      }
    } else {
      steps.push({ name: 'generate-analytics-ai-text', status: 'skipped' })
    }

    // ------------------------------------------------
    // Step 4: generate-analytics-insights
    // 大物。デフォルトは非同期 (?wait=true なし) で即返り
    // ------------------------------------------------
    if (!skipInsights) {
      try {
        await callFn('generate-analytics-insights', baseBody, { wait: waitInsights })
      } catch (e: any) {
        console.error('insights failed:', e.message)
      }
    } else {
      steps.push({ name: 'generate-analytics-insights', status: 'skipped' })
    }

    return new Response(
      JSON.stringify({
        success: true,
        target_year_month: targetYearMonth,
        store_ids: storeIds,
        started_at: startedAt,
        completed_at: new Date().toISOString(),
        steps,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error: any) {
    console.error('monthly-report-pipeline error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})

function prevYearMonth(): string {
  const now = new Date()
  const jstOffset = 9 * 60 * 60 * 1000
  const jstNow = new Date(now.getTime() + jstOffset)
  const d = new Date(jstNow.getFullYear(), jstNow.getMonth() - 1, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
