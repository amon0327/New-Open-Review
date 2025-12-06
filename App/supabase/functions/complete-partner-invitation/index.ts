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
    console.log('=== complete-partner-invitation Edge Function開始 ===')
    console.log('Request URL:', req.url)
    console.log('Request method:', req.method)

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

    // JWTトークンからユーザー情報を取得
    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    console.log('Authorization token present:', !!token)
    if (!token) {
      throw new Error('認証トークンが必要です')
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    console.log('User auth result:', { user: !!user, userError })
    if (userError || !user) {
      console.error('Auth error details:', userError)
      throw new Error('認証に失敗しました: ' + (userError?.message || 'Unknown error'))
    }

    // リクエストボディから招待トークンを取得
    const requestBody = await req.text()
    console.log('Request body:', requestBody)

    let parsedBody
    try {
      parsedBody = JSON.parse(requestBody)
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      throw new Error('リクエストボディが無効なJSONです')
    }

    const { invitationToken } = parsedBody
    console.log('Invitation token:', invitationToken)

    if (!invitationToken) {
      throw new Error('招待トークンが必要です')
    }

    // 招待情報を取得（サービスロールで）
    console.log('Fetching invitation data for token:', invitationToken)
    const { data: invitationData, error: invitationError } = await supabaseAdmin
      .from('partner_user_invitations')
      .select(`
        *,
        partner_company (
          id,
          company_name
        )
      `)
      .eq('token', invitationToken)
      .in('status', ['invited', 'expired'])

    console.log('Invitation query result:', { invitationData, invitationError })

    if (invitationError) {
      throw new Error(`招待情報の取得に失敗: ${invitationError.message}`)
    }

    if (!invitationData || invitationData.length === 0) {
      throw new Error('招待が見つからないか、既に使用済みです')
    }

    const invitation = invitationData[0]
    console.log('Found invitation:', invitation)

    // ステータスチェック
    if (invitation.status && invitation.status !== 'invited' && invitation.status !== 'expired') {
      throw new Error(`招待は既に${invitation.status}です`)
    }

    // business_usersテーブルにレコードが存在することを確認（サービスロールで）
    console.log('Checking business_users for user:', user.id)
    const { data: existingBusinessUser, error: checkError } = await supabaseAdmin
      .from('business_users')
      .select('id')
      .eq('id', user.id)

    console.log('Business user check result:', { existingBusinessUser, checkError })

    if (checkError) {
      console.error('business_users確認エラー:', checkError)
      throw new Error(`ユーザー情報の確認に失敗: ${checkError.message}`)
    }

    if (!existingBusinessUser || existingBusinessUser.length === 0) {
      console.log('Creating business_users record for user:', user.id)

      // business_usersテーブルにレコードを作成
      const businessUserData = {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.user_metadata?.full_name || ''
      }

      console.log('Business user data to insert:', businessUserData)

      const { data: newBusinessUser, error: businessUserError } = await supabaseAdmin
        .from('business_users')
        .insert([businessUserData])
        .select()

      console.log('Business user creation result:', { newBusinessUser, businessUserError })

      if (businessUserError) {
        console.error('business_users作成エラー:', businessUserError)
        throw new Error(`ユーザー情報の作成に失敗: ${businessUserError.message}`)
      }

      console.log('Business user created successfully:', newBusinessUser)
    } else {
      console.log('Business user already exists:', existingBusinessUser[0])
    }

    // 既に登録されているかチェック（サービスロールで）
    console.log('Checking existing membership for user:', user.id, 'partner_company:', invitation.partner_company_id)
    const { data: existingMembership, error: membershipCheckError } = await supabaseAdmin
      .from('partner_memberships')
      .select('id')
      .eq('business_users_id', user.id)
      .eq('partner_company_id', invitation.partner_company_id)

    console.log('Membership check result:', { existingMembership, membershipCheckError })

    if (membershipCheckError) {
      console.error('メンバーシップ確認エラー:', membershipCheckError)
      throw new Error(`メンバーシップの確認に失敗: ${membershipCheckError.message}`)
    }

    if (existingMembership && existingMembership.length > 0) {
      throw new Error('既にこのパートナー企業のメンバーです')
    }

    // partner_membershipsに登録（サービスロールで）
    const membershipData = {
      business_users_id: user.id,
      partner_company_id: invitation.partner_company_id,
      role: invitation.role
    }

    console.log('Creating partner membership with data:', membershipData)

    const { data: membershipResult, error: membershipError } = await supabaseAdmin
      .from('partner_memberships')
      .insert([membershipData])
      .select()

    console.log('Partner membership creation result:', { membershipResult, membershipError })

    if (membershipError) {
      console.error('partner_memberships登録エラー:', membershipError)
      throw new Error(`メンバー登録に失敗: ${membershipError.message}`)
    }

    console.log('partner_memberships登録成功:', membershipResult)

    // 招待ステータスを完了に更新（サービスロールで）
    const { error: statusError } = await supabaseAdmin
      .from('partner_user_invitations')
      .update({ status: 'completed' })
      .eq('token', invitationToken)

    if (statusError) {
      console.error('Status update error:', statusError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'パートナーメンバー登録が完了しました',
        partnerCompany: {
          id: invitation.partner_company.id,
          name: invitation.partner_company.company_name
        },
        role: invitation.role
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Complete partner invitation error:', error)

    // エラーの詳細をログに記録
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    })

    // より詳細なエラーメッセージを返す
    let errorMessage = error.message
    let statusCode = 400

    // 特定のエラーケースに対する対処
    if (error.message.includes('招待が見つからない')) {
      statusCode = 404
      errorMessage = '指定された招待URLは無効です。'
    } else if (error.message.includes('有効期限が切れています')) {
      statusCode = 410
      errorMessage = '招待の有効期限が切れています。新しい招待をリクエストしてください。'
    } else if (error.message.includes('既にこのパートナー企業のメンバー')) {
      statusCode = 409
      errorMessage = '既にこのパートナー企業のメンバーです。'
    } else if (error.message.includes('認証')) {
      statusCode = 401
      errorMessage = '認証に失敗しました。再度ログインしてください。'
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        details: {
          originalError: error.message,
          timestamp: new Date().toISOString()
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: statusCode,
      }
    )
  }
})
