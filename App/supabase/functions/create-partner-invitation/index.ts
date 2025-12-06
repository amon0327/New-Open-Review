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
    const { partnerCompanyId, role, name } = await req.json()

    if (!partnerCompanyId || !role || !name) {
      throw new Error('パートナー企業ID、ロール、名前が必要です')
    }

    if (role !== 'owner') {
      throw new Error('ロールはownerである必要があります')
    }

    // ユーザーのパートナーメンバーシップを確認（サービスロールで）
    const { data: partnerMembership, error: membershipError } = await supabaseAdmin
      .from('partner_memberships')
      .select('partner_company_id, role')
      .eq('business_users_id', user.id)
      .eq('partner_company_id', partnerCompanyId)

    if (membershipError) {
      throw new Error(`パートナー情報の取得に失敗: ${membershipError.message}`)
    }

    if (!partnerMembership || partnerMembership.length === 0) {
      throw new Error('このパートナー企業に所属していません')
    }

    // 招待者がownerまたはadminであることを確認
    const inviterRole = partnerMembership[0].role
    if (!['owner', 'admin'].includes(inviterRole)) {
      throw new Error('メンバーを招待する権限がありません')
    }

    // パートナー企業情報を取得（サービスロールで）
    const { data: partnerCompanyData, error: companyError } = await supabaseAdmin
      .from('partner_company')
      .select('id, company_name')
      .eq('id', partnerCompanyId)

    if (companyError) {
      throw new Error(`パートナー企業情報の取得に失敗: ${companyError.message}`)
    }

    if (!partnerCompanyData || partnerCompanyData.length === 0) {
      throw new Error('指定されたパートナー企業が見つかりません')
    }

    // 新しい招待を作成（サービスロールで）
    const { data: invitationData, error: invitationError } = await supabaseAdmin
      .from('partner_user_invitations')
      .insert([
        {
          partner_company_id: partnerCompanyId,
          name: name,
          role: role,
          status: 'invited',
          invited_by: user.id
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
    const appDomain = Deno.env.get('APP_DOMAIN') || 'http://localhost:3000'
    const invitationUrl = `${appDomain}/partner-invitation/${invitation.token}`

    return new Response(
      JSON.stringify({
        success: true,
        invitation: {
          id: invitation.id,
          token: invitation.token,
          name: invitation.name,
          role: invitation.role,
          url: invitationUrl,
          partnerCompanyName: partnerCompanyData[0].company_name
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
