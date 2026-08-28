import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"

interface ComprehensiveDataRequest {
  store_id: string
  user_id: string
  week_start?: string
  data_types: string[] // ['unread_counts', 'weekly_data', 'nps_data', 'low_nps_alerts']
}

interface ComprehensiveDataResponse {
  unread_counts?: {
    comment_count: number
    alert_count: number
  }
  weekly_data?: {
    nps: Record<string, number | null>
    submissions: Record<string, number>
    comments: Record<string, number>
  }
  nps_data?: {
    current_week_average: number | null
    daily_scores: Record<string, number | null>
    trend: 'up' | 'down' | 'stable'
  }
  low_nps_alerts?: Array<{
    id: string
    nps_score: number
    created_at: string
    customer_attributes: string[]
    comment_text?: string
  }>
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

    const { store_id, user_id, week_start, data_types }: ComprehensiveDataRequest = await req.json()
    
    if (!store_id || !user_id || !data_types || data_types.length === 0) {
      throw new Error('Missing required parameters: store_id, user_id, and data_types')
    }

    console.log(`🚀 Processing comprehensive data for store ${store_id}, types: ${data_types.join(', ')}`)

    const result: ComprehensiveDataResponse = {
      computation_time_ms: 0,
      cache_timestamp: new Date().toISOString()
    }

    // **PARALLEL PROCESSING FOR MAXIMUM EFFICIENCY**
    const promises: Promise<void>[] = []

    // 1. UNREAD COUNTS PROCESSING
    if (data_types.includes('unread_counts')) {
      promises.push(
        (async () => {
          console.log('📊 Processing unread counts...')
          
          // Complex query for comment counts with joins
          const { data: commentData, error: commentError } = await supabase
            .rpc('get_unread_comment_count', {
              p_store_id: store_id,
              p_user_id: user_id
            })

          if (commentError) {
            console.warn('Comment count RPC failed, using direct query')
            
            // Fallback: Direct complex query
            const { data: submissions } = await supabase
              .from('review_form_submissions')
              .select(`
                id,
                review_question_answers!inner (
                  question_answer_texts!inner (
                    answer_text
                  )
                )
              `)
              .eq('store_id', store_id)
              .not('review_question_answers.question_answer_texts.answer_text', 'is', null)
              .not('review_question_answers.question_answer_texts.answer_text', 'eq', '')

            // Get viewed submissions
            const { data: viewed } = await supabase
              .from('comment_page_view_log')
              .select('review_form_submissions_id')
              .eq('user_id', user_id)

            const viewedIds = new Set(viewed?.map(v => v.review_form_submissions_id) || [])
            const unreadComments = submissions?.filter(s => !viewedIds.has(s.id)) || []

            result.unread_counts = {
              comment_count: unreadComments.length,
              alert_count: 0 // Will be calculated separately
            }
          } else {
            result.unread_counts = {
              comment_count: commentData?.[0]?.comment_count || 0,
              alert_count: 0
            }
          }

          // Complex query for alert counts
          const { data: alertData, error: alertError } = await supabase
            .rpc('get_unread_alert_count', {
              p_store_id: store_id,
              p_user_id: user_id
            })

          if (alertError) {
            console.warn('Alert count RPC failed, using direct query')
            
            // Fallback: Complex query for low NPS with attributes
            const { data: lowNpsSubmissions } = await supabase
              .from('review_form_submissions')
              .select(`
                id,
                review_question_answers!inner (
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

            // Check for attributes
            const submissionsWithAttributes = []
            for (const submission of lowNpsSubmissions || []) {
              const { data: attributes } = await supabase
                .from('review_question_answers')
                .select(`
                  question_answer_option_choices!inner (
                    question_option_choices (
                      choice_text
                    )
                  )
                `)
                .eq('review_form_submissions_id', submission.id)

              if (attributes && attributes.length > 0) {
                submissionsWithAttributes.push(submission)
              }
            }

            // Get viewed alerts
            const { data: viewedAlerts } = await supabase
              .from('alert_view_logs')
              .select('review_form_submissions_id')
              .eq('user_id', user_id)

            const viewedAlertIds = new Set(viewedAlerts?.map(v => v.review_form_submissions_id) || [])
            const unreadAlerts = submissionsWithAttributes.filter(s => !viewedAlertIds.has(s.id))

            if (result.unread_counts) {
              result.unread_counts.alert_count = unreadAlerts.length
            }
          } else {
            if (result.unread_counts) {
              result.unread_counts.alert_count = alertData?.[0]?.alert_count || 0
            }
          }

          console.log('✅ Unread counts processed')
        })()
      )
    }

    // 2. WEEKLY DATA PROCESSING
    if (data_types.includes('weekly_data') && week_start) {
      promises.push(
        (async () => {
          console.log('📊 Processing weekly data...')
          
          const weekStartDate = new Date(week_start)
          const weekEndDate = new Date(weekStartDate)
          weekEndDate.setDate(weekStartDate.getDate() + 7)

          // Complex parallel queries for weekly data
          const [npsResult, commentsResult, submissionsResult] = await Promise.all([
            // NPS Data with complex joins
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
              .gte('created_at', weekStartDate.toISOString())
              .lt('created_at', weekEndDate.toISOString()),
            
            // Comments Data with complex joins
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
              .gte('created_at', weekStartDate.toISOString())
              .lt('created_at', weekEndDate.toISOString())
              .not('answer_text', 'is', null)
              .not('answer_text', 'eq', ''),
            
            // Submissions Data
            supabase
              .from('review_form_submissions')
              .select('created_at')
              .eq('store_id', store_id)
              .gte('created_at', weekStartDate.toISOString())
              .lt('created_at', weekEndDate.toISOString())
          ])

          // **SERVER-SIDE COMPUTATION**
          const weeklyData = { nps: {}, submissions: {}, comments: {} }

          // Initialize 7 days
          for (let i = 0; i < 7; i++) {
            const date = new Date(weekStartDate)
            date.setDate(weekStartDate.getDate() + i)
            const dateKey = date.toISOString().split('T')[0]
            weeklyData.nps[dateKey] = null
            weeklyData.submissions[dateKey] = 0
            weeklyData.comments[dateKey] = 0
          }

          // UTC to JST conversion
          const utcToJSTDateKey = (utcDateString: string): string => {
            const utcDate = new Date(utcDateString)
            const jstDate = new Date(utcDate.getTime() + (9 * 60 * 60 * 1000))
            return jstDate.toISOString().split('T')[0]
          }

          // Process NPS data with complex calculations
          const npsScoresByDate: Record<string, number[]> = {}
          npsResult.data?.forEach(item => {
            const score = item.answer_number
            if (score !== null && score !== undefined && !isNaN(score)) {
              const dateKey = utcToJSTDateKey(item.created_at)
              if (!npsScoresByDate[dateKey]) npsScoresByDate[dateKey] = []
              npsScoresByDate[dateKey].push(Number(score))
            }
          })

          // Calculate daily NPS with complex formula
          Object.entries(npsScoresByDate).forEach(([dateKey, scores]) => {
            if (scores.length > 0) {
              const promoters = scores.filter(score => score >= 9).length
              const detractors = scores.filter(score => score <= 6).length
              const total = scores.length
              const nps = Math.round(((promoters - detractors) / total) * 100)
              if (weeklyData.nps.hasOwnProperty(dateKey)) {
                weeklyData.nps[dateKey] = nps
              }
            }
          })

          // Process submissions and comments with date conversion
          submissionsResult.data?.forEach(item => {
            const dateKey = utcToJSTDateKey(item.created_at)
            if (weeklyData.submissions.hasOwnProperty(dateKey)) {
              weeklyData.submissions[dateKey]++
            }
          })

          commentsResult.data?.forEach(item => {
            if (item.answer_text && item.answer_text.trim() !== '') {
              const dateKey = utcToJSTDateKey(item.created_at)
              if (weeklyData.comments.hasOwnProperty(dateKey)) {
                weeklyData.comments[dateKey]++
              }
            }
          })

          result.weekly_data = weeklyData
          console.log('✅ Weekly data processed')
        })()
      )
    }

    // 3. NPS DATA ANALYSIS PROCESSING
    if (data_types.includes('nps_data') && week_start) {
      promises.push(
        (async () => {
          console.log('📊 Processing NPS analysis...')
          
          const weekStartDate = new Date(week_start)
          const weekEndDate = new Date(weekStartDate)
          weekEndDate.setDate(weekStartDate.getDate() + 7)

          // Get current week NPS data with complex calculation
          const { data: currentWeekNPS } = await supabase
            .from('question_answer_option_linear_scale')
            .select(`
              answer_number,
              created_at,
              review_question_answers!inner (
                review_questions!inner (
                  question_types_id
                ),
                store_id
              )
            `)
            .eq('review_question_answers.store_id', store_id)
            .eq('review_question_answers.review_questions.question_types_id', 9)
            .gte('created_at', weekStartDate.toISOString())
            .lt('created_at', weekEndDate.toISOString())

          // Get previous week for trend analysis
          const prevWeekStart = new Date(weekStartDate)
          prevWeekStart.setDate(weekStartDate.getDate() - 7)
          const prevWeekEnd = new Date(weekStartDate)

          const { data: prevWeekNPS } = await supabase
            .from('question_answer_option_linear_scale')
            .select(`
              answer_number,
              review_question_answers!inner (
                review_questions!inner (
                  question_types_id
                ),
                store_id
              )
            `)
            .eq('review_question_answers.store_id', store_id)
            .eq('review_question_answers.review_questions.question_types_id', 9)
            .gte('created_at', prevWeekStart.toISOString())
            .lt('created_at', prevWeekEnd.toISOString())

          // Complex NPS calculation
          const calculateNPS = (scores: number[]) => {
            if (scores.length === 0) return null
            const promoters = scores.filter(score => score >= 9).length
            const detractors = scores.filter(score => score <= 6).length
            return Math.round(((promoters - detractors) / scores.length) * 100)
          }

          const currentScores = currentWeekNPS?.map(item => item.answer_number).filter(score => score !== null) || []
          const prevScores = prevWeekNPS?.map(item => item.answer_number).filter(score => score !== null) || []

          const currentAverage = calculateNPS(currentScores)
          const prevAverage = calculateNPS(prevScores)

          // Trend analysis
          let trend: 'up' | 'down' | 'stable' = 'stable'
          if (currentAverage !== null && prevAverage !== null) {
            if (currentAverage > prevAverage + 5) trend = 'up'
            else if (currentAverage < prevAverage - 5) trend = 'down'
          }

          // Daily scores calculation
          const dailyScores: Record<string, number | null> = {}
          const utcToJSTDateKey = (utcDateString: string): string => {
            const utcDate = new Date(utcDateString)
            const jstDate = new Date(utcDate.getTime() + (9 * 60 * 60 * 1000))
            return jstDate.toISOString().split('T')[0]
          }

          const scoresByDate: Record<string, number[]> = {}
          currentWeekNPS?.forEach(item => {
            const score = item.answer_number
            if (score !== null && score !== undefined) {
              const dateKey = utcToJSTDateKey(item.created_at)
              if (!scoresByDate[dateKey]) scoresByDate[dateKey] = []
              scoresByDate[dateKey].push(score)
            }
          })

          Object.entries(scoresByDate).forEach(([dateKey, scores]) => {
            dailyScores[dateKey] = calculateNPS(scores)
          })

          result.nps_data = {
            current_week_average: currentAverage,
            daily_scores: dailyScores,
            trend
          }

          console.log('✅ NPS analysis processed')
        })()
      )
    }

    // 4. LOW NPS ALERTS PROCESSING
    if (data_types.includes('low_nps_alerts')) {
      promises.push(
        (async () => {
          console.log('📊 Processing low NPS alerts...')
          
          // Complex query for low NPS submissions with all related data
          const { data: lowNpsSubmissions } = await supabase
            .from('review_form_submissions')
            .select(`
              id,
              created_at,
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
            .order('created_at', { ascending: false })
            .limit(50)

          const alerts = []

          for (const submission of lowNpsSubmissions || []) {
            // Get customer attributes with complex joins
            const { data: attributes } = await supabase
              .from('review_question_answers')
              .select(`
                question_answer_option_choices!inner (
                  question_option_choices!inner (
                    choice_text
                  )
                ),
                review_questions!inner (
                  question_types_id
                )
              `)
              .eq('review_form_submissions_id', submission.id)
              .eq('review_questions.question_types_id', 3) // Attribute questions

            // Get comment text
            const { data: comments } = await supabase
              .from('review_question_answers')
              .select(`
                question_answer_texts!inner (
                  answer_text
                ),
                review_questions!inner (
                  question_types_id
                )
              `)
              .eq('review_form_submissions_id', submission.id)
              .in('review_questions.question_types_id', [1, 2])

            const customerAttributes = attributes?.map(attr => 
              attr.question_answer_option_choices?.question_option_choices?.choice_text
            ).filter(Boolean) || []

            const commentText = comments?.find(c => 
              c.question_answer_texts?.answer_text
            )?.question_answer_texts?.answer_text

            if (customerAttributes.length > 0) { // Only include if has attributes
              alerts.push({
                id: submission.id,
                nps_score: submission.review_question_answers[0]?.question_answer_option_linear_scale?.answer_number || 0,
                created_at: submission.created_at,
                customer_attributes: customerAttributes,
                comment_text: commentText || undefined
              })
            }
          }

          result.low_nps_alerts = alerts
          console.log('✅ Low NPS alerts processed')
        })()
      )
    }

    // Wait for all parallel processing to complete
    await Promise.all(promises)

    result.computation_time_ms = Date.now() - startTime

    console.log(`✅ Comprehensive data computed in ${result.computation_time_ms}ms`)

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