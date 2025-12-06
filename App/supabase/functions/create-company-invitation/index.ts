import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // サービスロール用のSupabaseクライアントを作成（RLS回避）
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 認証済みユーザー用のクライアント
    const authHeader = req.headers.get('Authorization')!
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // 認証チェック
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()

    if (authError || !user) {
      throw new Error('認証に失敗しました')
    }

    // リクエストボディの取得
    const { companyId, name } = await req.json()

    if (!companyId || !name) {
      throw new Error('企業IDと名前が必要です')
    }

    // ユーザーが指定した企業のメンバーかどうかを確認
    const { data: membership, error: membershipError } = await supabaseClient
      .from('company_memberships')
      .select('id')
      .eq('company_id', companyId)
      .eq('business_user_id', user.id)
      .single()

    if (membershipError || !membership) {
      throw new Error('この企業に対する権限がありません')
    }

    // 招待トークンを生成
    const token = crypto.randomUUID()

    // 招待をデータベースに作成（サービスロールで）
    const { data: invitation, error: invitationError } = await supabaseAdmin
      .from('company_user_invitations')
      .insert({
        company_id: companyId,
        name: name,
        token: token,
        status: 'invited'
      })
      .select()
      .single()

    if (invitationError) {
      console.error('招待作成エラー:', invitationError)
      throw new Error(`招待の作成に失敗しました: ${invitationError.message}`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        invitation: {
          id: invitation.id,
          name: invitation.name,
          token: invitation.token,
          url: `https://app.openreview.jp/company-invitation/${invitation.token}`,
          created_at: invitation.created_at
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Edge Function エラー:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
