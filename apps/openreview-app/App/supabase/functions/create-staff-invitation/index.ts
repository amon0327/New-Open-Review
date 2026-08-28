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
    const { storeId, role, name, shiftName } = await req.json()

    if (!storeId || !role || !name) {
      throw new Error('店舗ID、ロール、名前が必要です')
    }

    if (!['STAFF', 'STORE'].includes(role)) {
      throw new Error('ロールはSTAFFまたはSTOREである必要があります')
    }

    // 指定された店舗を取得（サービスロールで）
    const { data: storeData, error: storeError } = await supabaseAdmin
      .from('stores')
      .select('id, name, company_id')
      .eq('id', storeId)
      .single()

    if (storeError || !storeData) {
      throw new Error('指定された店舗が見つかりません')
    }

    const companyId = storeData.company_id

    // ユーザーがこの企業にアクセスできるか確認（直接メンバー or パートナー）
    const { data: directMembership } = await supabaseAdmin
      .from('company_memberships')
      .select('id')
      .eq('company_id', companyId)
      .eq('business_user_id', user.id)
      .maybeSingle()

    if (!directMembership) {
      // パートナー経由のアクセスを確認
      const { data: partnerMemberships } = await supabaseAdmin
        .from('partner_memberships')
        .select('partner_company_id')
        .eq('business_users_id', user.id)
        .eq('is_active', true)

      let hasPartnerAccess = false
      if (partnerMemberships && partnerMemberships.length > 0) {
        const partnerCompanyIds = partnerMemberships.map(pm => pm.partner_company_id)
        const { data: affiliations } = await supabaseAdmin
          .from('partner_affiliate_companies')
          .select('id')
          .eq('companies_id', companyId)
          .in('partner_company_id', partnerCompanyIds)
        hasPartnerAccess = affiliations && affiliations.length > 0
      }

      if (!hasPartnerAccess) {
        throw new Error('この店舗のスタッフを招待する権限がありません')
      }
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
          shift_name: shiftName || null,
          status: 'invited'
        }
      ])
      .select('id, token, name, role, shift_name')

    if (invitationError) {
      throw new Error(`招待の作成に失敗: ${invitationError.message}`)
    }

    if (!invitationData || invitationData.length === 0) {
      throw new Error('招待データの取得に失敗しました')
    }

    const invitation = invitationData[0]
    
    // 招待URLを生成（store-management-appのドメインを固定使用）
    const storeManagementDomain = 'https://store.openreview.jp'
    const invitationUrl = `${storeManagementDomain}/staff-invitation/${invitation.token}`

    return new Response(
      JSON.stringify({
        success: true,
        invitation: {
          id: invitation.id,
          token: invitation.token,
          name: invitation.name,
          role: invitation.role,
          url: invitationUrl,
          storeName: storeData.name
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