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
    // サービスロール用のSupabaseクライアントを作成
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // リクエストボディからユーザー情報と招待トークンを取得
    const { invitationToken, userEmail, userName, userId } = await req.json()
    
    if (!invitationToken || !userId || !userEmail) {
      throw new Error('招待トークン、ユーザーID、メールアドレスが必要です')
    }

    // ユーザー情報をオブジェクトとして構成（既存のコードとの互換性のため）
    const user = {
      id: userId,
      email: userEmail,
      user_metadata: {
        name: userName,
        full_name: userName
      }
    }

    // 招待情報を取得（サービスロールで）
    const { data: invitationData, error: invitationError } = await supabaseAdmin
      .from('store_invitations')
      .select(`
        *,
        stores (
          id,
          name,
          company_id,
          companies (
            id,
            name
          )
        )
      `)
      .eq('token', invitationToken)
      .eq('status', 'invited')

    if (invitationError) {
      throw new Error(`招待情報の取得に失敗: ${invitationError.message}`)
    }

    if (!invitationData || invitationData.length === 0) {
      throw new Error('招待が見つからないか、既に使用済みです')
    }

    const invitation = invitationData[0]

    // 24時間チェック
    const invitationDate = new Date(invitation.created_at)
    const now = new Date()
    const hoursDiff = (now.getTime() - invitationDate.getTime()) / (1000 * 60 * 60)

    if (hoursDiff > 24) {
      // 期限切れの招待をexpiredに更新（サービスロールで）
      await supabaseAdmin
        .from('store_invitations')
        .update({ status: 'expired' })
        .eq('token', invitationToken)
      
      throw new Error('招待の有効期限が切れています（24時間）')
    }

    // business_usersテーブルにレコードが存在することを確認（サービスロールで）
    const { data: existingBusinessUser } = await supabaseAdmin
      .from('business_users')
      .select('id')
      .eq('id', user.id)

    if (!existingBusinessUser || existingBusinessUser.length === 0) {
      // business_usersテーブルにレコードを作成
      const { error: businessUserError } = await supabaseAdmin
        .from('business_users')
        .insert([
          {
            id: user.id,
            email: user.email,
            name: user.user_metadata?.name || user.user_metadata?.full_name || '',
            company_name: ''
          }
        ])

      if (businessUserError) {
        console.error('business_users作成エラー:', businessUserError)
        // エラーでも続行する（既存のbusiness_userが存在する可能性）
      }
    }

    // 既に登録されているかチェック（サービスロールで）
    const { data: existingMembership } = await supabaseAdmin
      .from('store_memberships')
      .select('id')
      .eq('business_user_id', user.id)
      .eq('store_id', invitation.store_id)

    if (existingMembership && existingMembership.length > 0) {
      throw new Error('既にこの店舗のメンバーです')
    }

    // store_membershipsに登録（サービスロールで）
    const { data: membershipResult, error: membershipError } = await supabaseAdmin
      .from('store_memberships')
      .insert([
        {
          business_user_id: user.id,
          store_id: invitation.store_id,
          role: invitation.role,
          company_id: invitation.stores.company_id
        }
      ])
      .select()

    if (membershipError) {
      console.error('store_memberships登録エラー:', membershipError)
      throw new Error(`メンバー登録に失敗: ${membershipError.message}`)
    }

    console.log('store_memberships登録成功:', membershipResult)

    // 招待ステータスを完了に更新（サービスロールで）
    const { error: statusError } = await supabaseAdmin
      .from('store_invitations')
      .update({ status: 'completed' })
      .eq('token', invitationToken)

    if (statusError) {
      console.error('Status update error:', statusError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'スタッフ登録が完了しました',
        store: invitation.stores,
        role: invitation.role
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error:', error)
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