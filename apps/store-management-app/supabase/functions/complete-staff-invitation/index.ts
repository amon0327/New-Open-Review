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
    console.log('=== Edge Function開始 ===')
    console.log('Request URL:', req.url)
    console.log('Request method:', req.method)
    console.log('Request headers:', Object.fromEntries(req.headers.entries()))

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

    console.log('Invitation query result:', { invitationData, invitationError })

    if (invitationError) {
      throw new Error(`招待情報の取得に失敗: ${invitationError.message}`)
    }

    if (!invitationData || invitationData.length === 0) {
      throw new Error('招待が見つからないか、既に使用済みです')
    }

    const invitation = invitationData[0]
    console.log('Found invitation:', invitation)

    // 注: ステータスチェックは下方の '既メンバー判定' の後で行う
    // (登録済み本人が再度 URL を踏んだケースで status='completed' でも
    //  ホームへ進ませる動線のため。別人が完了済招待を踏んだケースは
    //  既メンバー判定では false になるので status チェックで弾ける)

    // 24時間チェック（一時的に無効化）
    const invitationDate = new Date(invitation.created_at)
    const now = new Date()
    const hoursDiff = (now.getTime() - invitationDate.getTime()) / (1000 * 60 * 60)

    console.log('Time check:', { invitationDate, now, hoursDiff })
    console.log('24時間制限チェックは一時的に無効化されています')

    // 24時間制限を一時的に無効化
    // if (hoursDiff > 24) {
    //   // 期限切れの招待をexpiredに更新（サービスロールで）
    //   console.log('Invitation expired, updating status')
    //   await supabaseAdmin
    //     .from('store_invitations')
    //     .update({ status: 'expired' })
    //     .eq('token', invitationToken)
    //   
    //   throw new Error('招待の有効期限が切れています（24時間）')
    // }

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
    console.log('Checking existing membership for user:', user.id, 'store:', invitation.store_id)
    const { data: existingMembership, error: membershipCheckError } = await supabaseAdmin
      .from('store_memberships')
      .select('id')
      .eq('business_user_id', user.id)
      .eq('store_id', invitation.store_id)

    console.log('Membership check result:', { existingMembership, membershipCheckError })

    if (membershipCheckError) {
      console.error('メンバーシップ確認エラー:', membershipCheckError)
      throw new Error(`メンバーシップの確認に失敗: ${membershipCheckError.message}`)
    }

    const isMemberOfThisStore = !!(existingMembership && existingMembership.length > 0)

    // どこか 1 店舗でもメンバーかチェック
    // (招待 URL が既に使用済 + どこにもメンバーでない人 は 'URL 使用済み' エラー、
    //  使用済 + どこかのメンバー の人は ホームへ進ませる動線)
    const { data: anyMembership } = await supabaseAdmin
      .from('store_memberships')
      .select('id')
      .eq('business_user_id', user.id)
      .limit(1)
    const isMemberAnywhere = !!(anyMembership && anyMembership.length > 0)

    const invitationStatus = invitation.status || 'invited'

    // ===== 分岐 =====
    // 1) 招待が既に使用済 (completed/expired)
    if (invitationStatus !== 'invited') {
      if (isMemberAnywhere) {
        // どこかの店舗のメンバー → ホームへ
        return new Response(
          JSON.stringify({
            success: true,
            alreadyMember: true,
            message: '既にメンバーです',
            store: invitation.stores,
            role: invitation.role
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
      }
      // どこにもメンバーじゃない人 → 使用済 エラー
      return new Response(
        JSON.stringify({
          success: false,
          alreadyUsed: true,
          error: 'この招待 URL は既に使用済みです'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 410 }
      )
    }

    // 2) 招待が未使用 (invited) + この店舗の既存メンバー
    // → role/name の更新も行わない (権限を URL 経由で変えない仕様)
    if (isMemberOfThisStore) {
      console.log('User is already a member of this store, skipping insert (no role change)')
      return new Response(
        JSON.stringify({
          success: true,
          alreadyMember: true,
          message: '既にこの店舗のメンバーです',
          store: invitation.stores,
          role: invitation.role
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // 3) 招待が未使用 + 未メンバー → 通常通り INSERT
    // store_membershipsに登録（サービスロールで）
    // name には 招待時に設定された名前を入れる (一覧で 'ユーザー' と
    // 表示されるのを防ぐ。business_users.name は LINE display_name 由来で
    // email のままになるユーザーがいるため、店舗単位の sm.name を信頼)
    const membershipData = {
      business_user_id: user.id,
      store_id: invitation.store_id,
      role: invitation.role,
      company_id: invitation.stores?.company_id || null,
      name: invitation.name || null
    }
    
    console.log('Creating store membership with data:', membershipData)
    
    const { data: membershipResult, error: membershipError } = await supabaseAdmin
      .from('store_memberships')
      .insert([membershipData])
      .select()

    console.log('Store membership creation result:', { membershipResult, membershipError })

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
    console.error('Complete staff invitation error:', error)
    
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
      errorMessage = '招待の有効期限が切れています（24時間）。新しい招待をリクエストしてください。'
    } else if (error.message.includes('既にこの店舗のメンバー')) {
      statusCode = 409
      errorMessage = '既にこの店舗のメンバーです。'
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