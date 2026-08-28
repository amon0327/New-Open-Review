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
    const { comment_id, is_hidden, store_id } = await req.json()

    console.log('update-comment-visibility: Request received', { comment_id, is_hidden, store_id })

    if (!comment_id || !store_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'comment_id and store_id are required' }),
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

    // Supabaseクライアント作成
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // ユーザー認証を確認
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser()

    if (userError || !user) {
      console.error('update-comment-visibility: Auth error', userError)
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    console.log('update-comment-visibility: User authenticated', { userId: user.id })

    // サービスロールでクエリ実行（RLSをバイパス）
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // ユーザーが店舗に所属しているか確認し、roleもチェック
    const { data: membership, error: membershipError } = await supabase
      .from('store_memberships')
      .select('id, store_id, role')
      .eq('business_user_id', user.id)
      .eq('store_id', store_id)
      .maybeSingle()

    if (membershipError) {
      console.error('update-comment-visibility: Membership check error', membershipError)
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to check store membership' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    if (!membership) {
      console.log('update-comment-visibility: User not a member of store', { userId: user.id, store_id })
      return new Response(
        JSON.stringify({ success: false, error: 'User is not a member of this store' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }

    // staffユーザーは非表示の更新権限がない
    // DB の enum は 'STAFF' (大文字)、防御的に大文字化して比較
    if (String(membership.role).toUpperCase() === 'STAFF') {
      console.log('update-comment-visibility: Staff user cannot update visibility', { userId: user.id })
      return new Response(
        JSON.stringify({ success: false, error: 'Staff users cannot update comment visibility' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }

    console.log('update-comment-visibility: Store membership verified', membership)

    // コメントのis_hiddenを更新
    const { data: updatedComment, error: updateError } = await supabase
      .from('preset_question_answer_comment')
      .update({ is_hidden: is_hidden })
      .eq('id', comment_id)
      .select('id, is_hidden')
      .single()

    if (updateError) {
      console.error('update-comment-visibility: Update error', updateError)
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to update comment visibility', details: updateError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    console.log('update-comment-visibility: Comment updated', updatedComment)

    return new Response(
      JSON.stringify({
        success: true,
        comment: updatedComment
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('update-comment-visibility: Unexpected error', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
