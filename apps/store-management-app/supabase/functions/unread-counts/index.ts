import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"

interface UnreadCountsRequest {
  store_id: string
  user_id: string
}

interface UnreadCountsResponse {
  comment_count: number
  alert_count: number
  computation_time_ms: number
  cache_timestamp: string
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
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { store_id, user_id }: UnreadCountsRequest = await req.json()
    
    if (!store_id || !user_id) {
      throw new Error('Missing required parameters: store_id and user_id')
    }

    console.log(`🚀 Computing unread counts for store ${store_id}, user ${user_id}`)

    // **PARALLEL OPTIMIZED QUERIES FOR COUNTS**
    const [commentCountResult, alertCountResult] = await Promise.all([
      // Comment count - submissions with unread comments
      supabase
        .from('review_form_submissions')
        .select(`
          id,
          review_question_answers!inner (
            id,
            question_answer_texts!inner (
              answer_text
            )
          )
        `)
        .eq('store_id', store_id)
        .not('review_question_answers.question_answer_texts.answer_text', 'is', null)
        .not('review_question_answers.question_answer_texts.answer_text', 'eq', '')
        .not('id', 'in', `(
          SELECT review_form_submissions_id 
          FROM comment_page_view_log 
          WHERE user_id = '${user_id}'
        )`),
      
      // Alert count - low NPS submissions with attributes  
      supabase
        .from('review_form_submissions')
        .select(`
          id,
          review_question_answers!inner (
            id,
            question_answer_option_linear_scale!inner (
              answer_number
            ),
            review_questions!inner (
              question_types_id
            )
          )
        `)
        .eq('store_id', store_id)
        .eq('review_question_answers.review_questions.question_types_id', 9)
        .lte('review_question_answers.question_answer_option_linear_scale.answer_number', 6)
        .not('id', 'in', `(
          SELECT review_form_submissions_id 
          FROM alert_view_logs 
          WHERE user_id = '${user_id}'
        )`)
    ])

    if (commentCountResult.error || alertCountResult.error) {
      const errors = [commentCountResult.error, alertCountResult.error].filter(Boolean)
      console.error('Database errors:', errors)
      throw new Error(`Database query failed: ${errors.map(e => e.message).join(', ')}`)
    }

    // Count unique submissions for each type
    const commentCount = new Set(
      commentCountResult.data?.map(submission => submission.id) || []
    ).size

    const alertCount = new Set(
      alertCountResult.data?.map(submission => submission.id) || []
    ).size

    const result: UnreadCountsResponse = {
      comment_count: commentCount,
      alert_count: alertCount,
      computation_time_ms: Date.now() - startTime,
      cache_timestamp: new Date().toISOString()
    }

    console.log(`✅ Unread counts computed in ${result.computation_time_ms}ms`)

    return new Response(
      JSON.stringify(result),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=60' // 1 minute cache
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