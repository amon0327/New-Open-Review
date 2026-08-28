import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // リクエストボディを取得
    const { store_id, start_date, end_date, user_role } = await req.json()

    console.log('preset-comments: Request received', { store_id, start_date, end_date, user_role })

    if (!store_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'store_id is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // 認証トークンを取得
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authorization header is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    // Supabaseクライアント作成（ユーザー認証用）
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // ユーザー認証を確認
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser()

    if (userError || !user) {
      console.error('preset-comments: Auth error', userError)
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    console.log('preset-comments: User authenticated', { userId: user.id })

    // サービスロールでクエリ実行（RLSをバイパス）
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // ユーザーが店舗に所属しているか確認
    const { data: membership, error: membershipError } = await supabase
      .from('store_memberships')
      .select('id, store_id, role')
      .eq('business_user_id', user.id)
      .eq('store_id', store_id)
      .maybeSingle()

    if (membershipError) {
      console.error('preset-comments: Membership check error', membershipError)
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to check store membership' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    if (!membership) {
      console.log('preset-comments: User not a member of store', { userId: user.id, store_id })
      return new Response(
        JSON.stringify({ success: false, error: 'User is not a member of this store' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }

    console.log('preset-comments: Store membership verified', membership)

    // 日付範囲を設定
    const startDate = start_date || '2020-01-01T00:00:00.000Z'
    const endDate = end_date || new Date().toISOString()

    // preset_question_answer_comment からコメントを取得
    // preset_question_answer を JOIN して NPS, 再来店意向, 新規/リピーター情報を取得
    let query = supabase
      .from('preset_question_answer_comment')
      .select(`
        id,
        created_at,
        comment,
        selected_qsc,
        question_number,
        is_positive,
        is_hidden,
        preset_question_answer_id,
        preset_question_answer!inner (
          id,
          p1_q1,
          p1_q2,
          p1_q3,
          p1_q4,
          p1_q5,
          store_id,
          created_at
        )
      `)
      .eq('preset_question_answer.store_id', store_id)
      .gte('created_at', startDate)
      .lt('created_at', endDate)
      .not('comment', 'is', null)
      .neq('comment', '')

    // staffユーザーの場合は非表示コメントをフィルタリング
    // DB の enum は 'STAFF' (大文字)、防御的に大文字化して比較
    if (String(user_role).toUpperCase() === 'STAFF') {
      query = query.or('is_hidden.is.null,is_hidden.eq.false')
    }

    const { data: comments, error: commentsError } = await query.order('created_at', { ascending: false })

    if (commentsError) {
      console.error('preset-comments: Query error', commentsError)
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch comments', details: commentsError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    console.log('preset-comments: Comments fetched', { count: comments?.length || 0 })

    return new Response(
      JSON.stringify({
        success: true,
        comments: comments || [],
        count: comments?.length || 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('preset-comments: Unexpected error', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
