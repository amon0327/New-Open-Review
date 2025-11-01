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

    // JWTトークンからユーザー情報を取得
    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) {
      throw new Error('認証トークンが必要です')
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    if (userError || !user) {
      throw new Error('認証に失敗しました')
    }

    // リクエストボディから必要な情報を取得
    const { storeId, role, name } = await req.json()
    
    if (!storeId || !role || !name) {
      throw new Error('店舗ID、ロール、名前が必要です')
    }

    if (!['STAFF', 'STORE'].includes(role)) {
      throw new Error('ロールはSTAFFまたはSTOREである必要があります')
    }

    // ユーザーの会社メンバーシップを確認（サービスロールで）
    const { data: companyMembership, error: membershipError } = await supabaseAdmin
      .from('company_memberships')
      .select('company_id')
      .eq('business_user_id', user.id)

    if (membershipError) {
      throw new Error(`会社情報の取得に失敗: ${membershipError.message}`)
    }

    if (!companyMembership || companyMembership.length === 0) {
      throw new Error('会社に所属していません')
    }

    const companyId = companyMembership[0].company_id

    // 指定された店舗がユーザーの会社に属するかチェック（サービスロールで）
    const { data: storeData, error: storeError } = await supabaseAdmin
      .from('stores')
      .select('id, name')
      .eq('id', storeId)
      .eq('company_id', companyId)

    if (storeError) {
      throw new Error(`店舗情報の取得に失敗: ${storeError.message}`)
    }

    if (!storeData || storeData.length === 0) {
      throw new Error('指定された店舗が見つからないか、アクセス権限がありません')
    }

    // 24時間経過した招待のステータスを'expired'に変更（一時的に無効化）
    console.log('自動期限切れ処理は一時的に無効化されています')
    
    // const twentyFourHoursAgo = new Date()
    // twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)

    // const { data: expiredInvitations, error: expiredError } = await supabaseAdmin
    //   .from('store_invitations')
    //   .update({ status: 'expired' })
    //   .eq('status', 'invited')
    //   .lt('created_at', twentyFourHoursAgo.toISOString())
    //   .select()

    // if (expiredError) {
    //   console.error('期限切れ招待の更新エラー:', expiredError)
    // } else {
    //   console.log(`${expiredInvitations?.length || 0}件の招待を期限切れに更新しました`)
    // }

    // 新しい招待を作成（サービスロールで）
    const { data: invitationData, error: invitationError } = await supabaseAdmin
      .from('store_invitations')
      .insert([
        {
          store_id: storeId,
          role: role,
          name: name,
          status: 'invited'
        }
      ])
      .select('id, token, name, role')

    if (invitationError) {
      throw new Error(`招待の作成に失敗: ${invitationError.message}`)
    }

    if (!invitationData || invitationData.length === 0) {
      throw new Error('招待データの取得に失敗しました')
    }

    const invitation = invitationData[0]
    
    // 招待URLを生成
    const origin = req.headers.get('origin') || 'http://localhost:3000'
    const invitationUrl = `${origin}/staff-invitation/${invitation.token}`

    return new Response(
      JSON.stringify({
        success: true,
        invitation: {
          id: invitation.id,
          token: invitation.token,
          name: invitation.name,
          role: invitation.role,
          url: invitationUrl,
          storeName: storeData[0].name
        }
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