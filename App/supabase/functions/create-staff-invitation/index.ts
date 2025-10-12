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
    // Supabaseクライアントを作成
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

    // ユーザーの会社メンバーシップを確認
    const { data: companyMembership, error: membershipError } = await supabase
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

    // 指定された店舗がユーザーの会社に属するかチェック
    const { data: storeData, error: storeError } = await supabase
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

    // 24時間経過した招待を削除（クリーンアップ）
    const twentyFourHoursAgo = new Date()
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)

    await supabase
      .from('store_invitations')
      .delete()
      .lt('created_at', twentyFourHoursAgo.toISOString())

    // 新しい招待を作成
    const { data: invitationData, error: invitationError } = await supabase
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
    const invitationUrl = `${req.headers.get('origin') || 'http://localhost:3000'}/staff-invitation/${invitation.token}`

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