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

    // リクエストボディからstoreIdを取得
    const { storeId } = await req.json()
    if (!storeId) {
      throw new Error('店舗IDが必要です')
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
      .select('*')
      .eq('id', storeId)
      .eq('company_id', companyId)

    if (storeError) {
      throw new Error(`店舗情報の取得に失敗: ${storeError.message}`)
    }

    if (!storeData || storeData.length === 0) {
      throw new Error('指定された店舗が見つからないか、アクセス権限がありません')
    }

    // スタッフメンバーを取得
    const { data: staffData, error: staffError } = await supabase
      .from('store_memberships')
      .select(`
        *,
        business_users (
          id,
          email,
          name,
          avatar_url
        )
      `)
      .eq('store_id', storeId)

    if (staffError) {
      console.error('Staff data error:', staffError)
      // スタッフデータのエラーは致命的ではないので、空配列で継続
    }

    // 招待一覧を取得
    const { data: invitationData, error: invitationError } = await supabase
      .from('store_invitations')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false })

    if (invitationError) {
      console.error('Invitation data error:', invitationError)
      // 招待データのエラーは致命的ではないので、空配列で継続
    }

    return new Response(
      JSON.stringify({
        success: true,
        store: storeData[0],
        staffMembers: staffData || [],
        invitations: invitationData || []
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