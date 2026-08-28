import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const toJstDateKey = (d: Date): string => {
  const jst = new Date(d.getTime() + 9 * 60 * 60 * 1000)
  return jst.toISOString().slice(0, 10)
}

const currentJstYearMonth = (): string => {
  const now = new Date()
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000)
  const y = jst.getUTCFullYear()
  const m = String(jst.getUTCMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { store_id, year_month } = await req.json()
    const ym = (typeof year_month === 'string' && /^\d{4}-\d{2}$/.test(year_month))
      ? year_month
      : currentJstYearMonth()

    if (!store_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'store_id is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authorization header is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data: membership, error: membershipError } = await supabase
      .from('store_memberships')
      .select('id, store_id, role')
      .eq('business_user_id', user.id)
      .eq('store_id', store_id)
      .maybeSingle()

    if (membershipError) {
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to check store membership' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }
    if (!membership) {
      return new Response(
        JSON.stringify({ success: false, error: 'User is not a member of this store' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }

    const [yearStr, monthStr] = ym.split('-')
    const year = parseInt(yearStr, 10)
    const month = parseInt(monthStr, 10) // 1〜12
    const daysInMonth = new Date(year, month, 0).getDate()

    // JST 月初 / 翌月初を UTC に変換
    const startUtc = new Date(Date.UTC(year, month - 1, 1) - 9 * 60 * 60 * 1000)
    const endUtc = new Date(Date.UTC(year, month, 1) - 9 * 60 * 60 * 1000)

    // 1. 回答
    const { data: answerRows, error: answerErr } = await supabase
      .from('preset_question_answer')
      .select('created_at')
      .eq('store_id', store_id)
      .gte('created_at', startUtc.toISOString())
      .lt('created_at', endUtc.toISOString())
    if (answerErr) {
      console.error('response-stats: answer query error', answerErr)
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch responses', details: answerErr.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // 2. コメント
    const { data: commentRows, error: commentErr } = await supabase
      .from('preset_question_answer_comment')
      .select('created_at, preset_question_answer!inner(store_id)')
      .eq('preset_question_answer.store_id', store_id)
      .gte('created_at', startUtc.toISOString())
      .lt('created_at', endUtc.toISOString())
      .not('comment', 'is', null)
      .neq('comment', '')
    if (commentErr) {
      console.error('response-stats: comment query error', commentErr)
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch comments', details: commentErr.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // 月の全日を 0 で初期化
    const responseByDay: Record<string, number> = {}
    const commentByDay: Record<string, number> = {}
    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${ym}-${String(d).padStart(2, '0')}`
      responseByDay[key] = 0
      commentByDay[key] = 0
    }

    for (const r of answerRows || []) {
      const k = toJstDateKey(new Date(r.created_at))
      if (k in responseByDay) responseByDay[k] += 1
    }
    for (const r of commentRows || []) {
      const k = toJstDateKey(new Date(r.created_at))
      if (k in commentByDay) commentByDay[k] += 1
    }

    // 配列化 (新しい順)
    const daily = Object.keys(responseByDay)
      .map(date => ({
        date,
        response_count: responseByDay[date],
        comment_count: commentByDay[date]
      }))
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))

    // 月合計
    let totalResponse = 0
    let totalComment = 0
    for (const k of Object.keys(responseByDay)) {
      totalResponse += responseByDay[k]
      totalComment += commentByDay[k]
    }

    // 本日 / 7日平均 (現在時点の値、month とは独立)
    const now = new Date()
    const todayKey = toJstDateKey(now)

    // 本日の値: 今月の場合は responseByDay から、そうでなければ別途取得は不要なので 0
    const todayResponseCount = responseByDay[todayKey] ?? 0
    const todayCommentCount = commentByDay[todayKey] ?? 0

    // 過去 7 日平均は 7 日分を別途取得する必要があるため、当月外なら 0
    let last7R = 0, last7C = 0
    let collected = 0
    for (let i = 1; i <= 7; i++) {
      const d = new Date(now.getTime())
      d.setUTCDate(d.getUTCDate() - i)
      const k = toJstDateKey(d)
      if (k in responseByDay) {
        last7R += responseByDay[k]
        last7C += commentByDay[k]
        collected++
      }
    }
    // 取得期間外 (跨ぐ場合等) は別クエリで補完
    if (collected < 7) {
      const cutoff = new Date(now.getTime())
      cutoff.setDate(cutoff.getDate() - 7)
      const { data: r7 } = await supabase
        .from('preset_question_answer')
        .select('created_at')
        .eq('store_id', store_id)
        .gte('created_at', cutoff.toISOString())
        .lt('created_at', new Date(now.toISOString().slice(0, 10) + 'T00:00:00Z').toISOString())
      const { data: c7 } = await supabase
        .from('preset_question_answer_comment')
        .select('created_at, preset_question_answer!inner(store_id)')
        .eq('preset_question_answer.store_id', store_id)
        .gte('created_at', cutoff.toISOString())
        .lt('created_at', new Date(now.toISOString().slice(0, 10) + 'T00:00:00Z').toISOString())
        .not('comment', 'is', null)
        .neq('comment', '')
      last7R = (r7 || []).length
      last7C = (c7 || []).length
    }
    const avg7Response = Math.round((last7R / 7) * 10) / 10
    const avg7Comment = Math.round((last7C / 7) * 10) / 10

    return new Response(
      JSON.stringify({
        success: true,
        year_month: ym,
        days_in_month: daysInMonth,
        today_response_count: todayResponseCount,
        today_comment_count: todayCommentCount,
        avg7_response: avg7Response,
        avg7_comment: avg7Comment,
        total_response: totalResponse,
        total_comment: totalComment,
        daily
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('response-stats: Unexpected error', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
