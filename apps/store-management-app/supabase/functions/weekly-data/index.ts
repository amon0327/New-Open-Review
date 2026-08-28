import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"

interface WeeklyDataRequest {
  store_id: string
  week_start: string // ISO date string
}

interface WeeklyDataResponse {
  nps: Record<string, number | null>
  submissions: Record<string, number>
  comments: Record<string, number>
  cache_timestamp: string
  computation_time_ms: number
}

serve(async (req) => {
  try {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    }

    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders })
    }

    const startTime = Date.now()
    
    // Supabase client initialization
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { store_id, week_start }: WeeklyDataRequest = await req.json()
    
    if (!store_id || !week_start) {
      throw new Error('Missing required parameters: store_id and week_start')
    }

    console.log(`🚀 Processing weekly data for store ${store_id}, week ${week_start}`)

    const weekStart = new Date(week_start)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 7)

    // **PARALLEL OPTIMIZED QUERIES**
    // Execute 3 optimized queries in parallel instead of multiple complex JOINs
    const [npsResult, commentsResult, submissionsResult] = await Promise.all([
      // NPS Data
      supabase
        .from('question_answer_option_linear_scale')
        .select(`
          answer_number,
          created_at,
          review_question_answers!inner (
            review_questions_id,
            store_id,
            review_questions!inner (
              question_types_id
            )
          )
        `)
        .eq('review_question_answers.store_id', store_id)
        .eq('review_question_answers.review_questions.question_types_id', 9)
        .gte('created_at', weekStart.toISOString())
        .lt('created_at', weekEnd.toISOString()),
      
      // Comments Data  
      supabase
        .from('question_answer_texts')
        .select(`
          answer_text,
          created_at,
          review_question_answers!inner (
            review_questions_id,
            store_id,
            review_questions!inner (
              question_types_id
            )
          )
        `)
        .eq('review_question_answers.store_id', store_id)
        .in('review_question_answers.review_questions.question_types_id', [1, 2])
        .gte('created_at', weekStart.toISOString())
        .lt('created_at', weekEnd.toISOString())
        .not('answer_text', 'is', null)
        .not('answer_text', 'eq', ''),
      
      // Submissions Data
      supabase
        .from('review_form_submissions')
        .select('created_at')
        .eq('store_id', store_id)
        .gte('created_at', weekStart.toISOString())
        .lt('created_at', weekEnd.toISOString())
    ])

    if (npsResult.error || commentsResult.error || submissionsResult.error) {
      const errors = [npsResult.error, commentsResult.error, submissionsResult.error].filter(Boolean)
      console.error('Database errors:', errors)
      throw new Error(`Database query failed: ${errors.map(e => e.message).join(', ')}`)
    }

    // **SERVER-SIDE COMPUTATION**
    const result: WeeklyDataResponse = {
      nps: {},
      submissions: {},
      comments: {},
      cache_timestamp: new Date().toISOString(),
      computation_time_ms: Date.now() - startTime
    }

    // Initialize 7 days (Japan timezone)
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart)
      date.setDate(weekStart.getDate() + i)
      const dateKey = date.toISOString().split('T')[0]
      result.nps[dateKey] = null
      result.submissions[dateKey] = 0
      result.comments[dateKey] = 0
    }

    // Convert UTC to JST date key
    const utcToJSTDateKey = (utcDateString: string): string => {
      const utcDate = new Date(utcDateString)
      const jstDate = new Date(utcDate.getTime() + (9 * 60 * 60 * 1000))
      return jstDate.toISOString().split('T')[0]
    }

    // **EFFICIENT DATA PROCESSING**
    // Process NPS data
    const npsScoresByDate: Record<string, number[]> = {}
    npsResult.data?.forEach(item => {
      const score = item.answer_number
      if (score !== null && score !== undefined && !isNaN(score)) {
        const dateKey = utcToJSTDateKey(item.created_at)
        if (!npsScoresByDate[dateKey]) npsScoresByDate[dateKey] = []
        npsScoresByDate[dateKey].push(Number(score))
      }
    })

    // Calculate daily NPS
    Object.entries(npsScoresByDate).forEach(([dateKey, scores]) => {
      if (scores.length > 0) {
        const promoters = scores.filter(score => score >= 9).length
        const detractors = scores.filter(score => score <= 6).length
        const total = scores.length
        const nps = Math.round(((promoters - detractors) / total) * 100)
        if (result.nps.hasOwnProperty(dateKey)) {
          result.nps[dateKey] = nps
        }
      }
    })

    // Process submissions data
    submissionsResult.data?.forEach(item => {
      const dateKey = utcToJSTDateKey(item.created_at)
      if (result.submissions.hasOwnProperty(dateKey)) {
        result.submissions[dateKey]++
      }
    })

    // Process comments data
    commentsResult.data?.forEach(item => {
      if (item.answer_text && item.answer_text.trim() !== '') {
        const dateKey = utcToJSTDateKey(item.created_at)
        if (result.comments.hasOwnProperty(dateKey)) {
          result.comments[dateKey]++
        }
      }
    })

    console.log(`✅ Weekly data computed in ${result.computation_time_ms}ms`)

    return new Response(
      JSON.stringify(result),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300' // 5 minute cache
        }
      }
    )

  } catch (error) {
    console.error('Edge Function error:', error)
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    }
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        }
      }
    )
  }
})