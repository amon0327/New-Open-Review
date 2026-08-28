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

    // 認証用のSupabaseクライアント（JWTトークン検証用）
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // JWTトークンからユーザー情報を取得（改善された認証処理）
    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) {
      throw new Error('認証トークンが必要です')
    }

    console.log('認証処理開始 - Token length:', token.length)

    // より詳細な認証エラーハンドリング
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    console.log('認証結果:', { 
      userFound: !!user, 
      userId: user?.id, 
      userEmail: user?.email,
      errorMessage: userError?.message 
    })

    if (userError) {
      console.error('認証エラー詳細:', userError)
      throw new Error(`認証に失敗しました: ${userError.message}`)
    }

    if (!user) {
      console.error('ユーザー情報が取得できませんでした')
      throw new Error('ユーザー情報を取得できませんでした。再度ログインしてください。')
    }

    // ユーザー認証状態の詳細確認（デバッグ用）
    const { data: authDebugData } = await supabaseAdmin
      .rpc('debug_user_auth_status', { user_id: user.id })
    
    console.log('ユーザー認証状態:', authDebugData)

    // リクエストボディから招待トークンを取得
    const { invitationToken } = await req.json()
    
    if (!invitationToken) {
      throw new Error('招待トークンが必要です')
    }

    console.log('招待処理開始 - Token:', invitationToken)

    // 招待の診断情報を取得
    const { data: invitationDiagnostics } = await supabaseAdmin
      .rpc('diagnose_invitation_issue', { invitation_token: invitationToken })
    
    console.log('招待診断結果:', invitationDiagnostics)

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

    console.log('招待データ取得結果:', { 
      dataLength: invitationData?.length, 
      errorMessage: invitationError?.message 
    })

    if (invitationError) {
      console.error('招待情報取得エラー:', invitationError)
      throw new Error(`招待情報の取得に失敗: ${invitationError.message}`)
    }

    if (!invitationData || invitationData.length === 0) {
      console.log('招待が見つからない - 状態確認')
      
      // より詳細な招待状態確認
      const { data: allInvitationsForToken } = await supabaseAdmin
        .from('store_invitations')
        .select('token, status, created_at')
        .eq('token', invitationToken)
      
      console.log('該当トークンの全招待情報:', allInvitationsForToken)
      
      throw new Error('招待が見つからないか、既に使用済みです')
    }

    const invitation = invitationData[0]
    console.log('処理対象招待:', { 
      invitationId: invitation.id,
      storeId: invitation.store_id,
      status: invitation.status 
    })

    // 24時間チェック
    const invitationDate = new Date(invitation.created_at)
    const now = new Date()
    const hoursDiff = (now.getTime() - invitationDate.getTime()) / (1000 * 60 * 60)

    console.log('有効期限チェック:', { hoursDiff, isValid: hoursDiff <= 24 })

    if (hoursDiff > 24) {
      console.log('招待期限切れ - ステータス更新中')
      
      // 期限切れの招待をexpiredに更新（サービスロールで）
      await supabaseAdmin
        .from('store_invitations')
        .update({ status: 'expired' })
        .eq('token', invitationToken)
      
      throw new Error('招待の有効期限が切れています（24時間）')
    }

    // business_usersテーブルにレコードが存在することを確認（サービスロールで）
    console.log('business_users存在確認開始 - ユーザーID:', user.id)
    
    const { data: existingBusinessUser, error: businessUserSelectError } = await supabaseAdmin
      .from('business_users')
      .select('id')
      .eq('id', user.id)

    console.log('business_users確認結果:', { 
      found: existingBusinessUser?.length > 0, 
      error: businessUserSelectError?.message 
    })

    if (businessUserSelectError) {
      console.error('business_users確認エラー:', businessUserSelectError)
    }

    if (!existingBusinessUser || existingBusinessUser.length === 0) {
      console.log('business_users作成開始')
      
      // business_usersテーブルにレコードを作成
      const { data: newBusinessUser, error: businessUserError } = await supabaseAdmin
        .from('business_users')
        .insert([
          {
            id: user.id,
            email: user.email,
            name: user.user_metadata?.name || user.user_metadata?.full_name || '',
            company_name: ''
          }
        ])
        .select()

      console.log('business_users作成結果:', { 
        success: !!newBusinessUser, 
        error: businessUserError?.message 
      })

      if (businessUserError) {
        console.error('business_users作成エラー:', businessUserError)
        // 重複エラーの場合は続行（他のセッションで既に作成された可能性）
        if (!businessUserError.message?.includes('duplicate')) {
          throw new Error(`ビジネスユーザー作成に失敗: ${businessUserError.message}`)
        }
      }
    }

    // 既に登録されているかチェック（サービスロールで）
    console.log('重複チェック開始')
    
    const { data: existingMembership, error: membershipCheckError } = await supabaseAdmin
      .from('store_memberships')
      .select('id')
      .eq('business_user_id', user.id)
      .eq('store_id', invitation.store_id)

    console.log('重複チェック結果:', { 
      alreadyMember: existingMembership?.length > 0,
      error: membershipCheckError?.message 
    })

    if (membershipCheckError) {
      console.error('重複チェックエラー:', membershipCheckError)
    }

    if (existingMembership && existingMembership.length > 0) {
      throw new Error('既にこの店舗のメンバーです')
    }

    // store_membershipsに登録（サービスロールで）
    console.log('store_memberships登録開始')
    
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

    console.log('store_memberships登録結果:', { 
      success: !!membershipResult,
      error: membershipError?.message 
    })

    if (membershipError) {
      console.error('store_memberships登録エラー:', membershipError)
      throw new Error(`メンバー登録に失敗: ${membershipError.message}`)
    }

    // 招待ステータスを完了に更新（サービスロールで）
    console.log('招待ステータス更新開始')
    
    const { error: statusError } = await supabaseAdmin
      .from('store_invitations')
      .update({ status: 'completed' })
      .eq('token', invitationToken)

    if (statusError) {
      console.error('招待ステータス更新エラー:', statusError)
    }

    console.log('招待完了処理成功')

    return new Response(
      JSON.stringify({
        success: true,
        message: 'スタッフ登録が完了しました',
        store: invitation.stores,
        role: invitation.role,
        debug: {
          userId: user.id,
          userEmail: user.email,
          authDebug: authDebugData,
          invitationDiagnostics: invitationDiagnostics
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Edge Function エラー:', error)
    console.error('エラースタック:', error.stack)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})