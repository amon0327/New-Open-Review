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
    console.log('=== complete-company-invitation Edge Function開始 ===')

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

    console.log('Authenticated user:', user.id, user.email)

    // リクエストボディから招待トークンを取得
    const { invitationToken } = await req.json()

    if (!invitationToken) {
      throw new Error('招待トークンが必要です')
    }

    console.log('Processing invitation token:', invitationToken)

    // サービスロールで招待情報を取得（RLSポリシーを回避）
    const { data: invitationData, error: invitationError } = await supabaseAdmin
      .from('company_user_invitations')
      .select(`
        id,
        name,
        status,
        company_id,
        companies:company_id (
          id,
          name
        )
      `)
      .eq('token', invitationToken)
      .eq('status', 'invited')
      .single()

    if (invitationError) {
      console.error('Invitation query error:', invitationError)
      throw new Error('招待が見つからないか、既に使用済みです')
    }

    console.log('Found invitation:', invitationData)

    // business_usersテーブルにユーザーが存在するか確認
    const { data: businessUser, error: businessUserError } = await supabaseAdmin
      .from('business_users')
      .select('id')
      .eq('id', user.id)
      .single()

    if (businessUserError && businessUserError.code !== 'PGRST116') {
      console.error('Business user query error:', businessUserError)
      throw new Error('ユーザー情報の確認に失敗しました')
    }

    // business_usersに存在しない場合は作成
    if (!businessUser) {
      console.log('Creating business_user record for:', user.id)
      const { error: createUserError } = await supabaseAdmin
        .from('business_users')
        .insert({
          id: user.id,
          email: user.email,
          name: invitationData.name
        })

      if (createUserError) {
        console.error('Business user creation error:', createUserError)
        throw new Error('ユーザーの作成に失敗しました')
      }
    }

    // 既に同じ企業のメンバーかどうかを確認
    const { data: existingMembership, error: membershipCheckError } = await supabaseAdmin
      .from('company_memberships')
      .select('id')
      .eq('business_user_id', user.id)
      .eq('company_id', invitationData.company_id)
      .single()

    if (existingMembership) {
      console.log('User is already a member of this company')
      throw new Error('既にこの企業のメンバーです')
    }

    // company_membershipsに追加
    console.log('Adding user to company_memberships')
    const { error: membershipError } = await supabaseAdmin
      .from('company_memberships')
      .insert({
        business_user_id: user.id,
        company_id: invitationData.company_id
      })

    if (membershipError) {
      console.error('Membership creation error:', membershipError)
      throw new Error('メンバー登録に失敗しました')
    }

    // 招待のステータスを更新
    console.log('Updating invitation status to accepted')
    const { error: updateError } = await supabaseAdmin
      .from('company_user_invitations')
      .update({ status: 'accepted' })
      .eq('id', invitationData.id)

    if (updateError) {
      console.error('Invitation update error:', updateError)
      // メンバーシップは作成されたので、ステータス更新失敗は致命的ではない
      console.warn('Warning: Failed to update invitation status, but membership was created')
    }

    console.log('=== complete-company-invitation Edge Function完了 ===')

    return new Response(
      JSON.stringify({
        success: true,
        company: {
          id: invitationData.companies.id,
          name: invitationData.companies.name
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('=== complete-company-invitation Edge Function エラー ===')
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    })

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
