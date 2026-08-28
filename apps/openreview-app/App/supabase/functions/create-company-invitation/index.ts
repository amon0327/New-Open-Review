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
    console.log('=== create-company-invitation Edge Function開始 ===')
    console.log('Request method:', req.method)
    console.log('Request headers:', Object.fromEntries(req.headers.entries()))

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

    console.log('Auth header present:', !!authHeader)

    // 認証チェック
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()

    console.log('Auth result:', { userId: user?.id, authError: authError?.message })

    if (authError || !user) {
      throw new Error('認証に失敗しました')
    }

    // リクエストボディの取得
    const requestBody = await req.text()
    console.log('Raw request body:', requestBody)

    const { companyId, name } = JSON.parse(requestBody)
    console.log('Parsed request:', { companyId, name, userId: user.id })

    if (!companyId || !name) {
      throw new Error('企業IDと名前が必要です')
    }

    // ユーザーが指定した企業のメンバーかどうかを確認（2つの経路をチェック）
    console.log('Checking permissions for:', { companyId, userId: user.id })

    // 1. 直接のメンバーシップをチェック
    const { data: directMembership, error: directMembershipError } = await supabaseAdmin
      .from('company_memberships')
      .select('id')
      .eq('company_id', companyId)
      .eq('business_user_id', user.id)
      .maybeSingle()

    console.log('Direct membership check:', {
      found: !!directMembership,
      error: directMembershipError?.message
    })

    let hasPermission = !!directMembership

    // 2. 直接のメンバーシップがない場合、パートナー経由のアクセス権をチェック
    if (!hasPermission) {
      console.log('Checking partner-based access...')

      // まずユーザーのパートナーメンバーシップを取得
      const { data: partnerMembership, error: partnerMembershipError } = await supabaseAdmin
        .from('partner_memberships')
        .select('id, partner_company_id')
        .eq('business_users_id', user.id)
        .eq('is_active', true)
        .maybeSingle()

      console.log('Partner membership check:', {
        found: !!partnerMembership,
        partnerCompanyId: partnerMembership?.partner_company_id,
        error: partnerMembershipError?.message
      })

      // パートナーメンバーシップがあれば、そのパートナー企業が対象企業と紐付いているかチェック
      if (partnerMembership) {
        const { data: affiliateCompany, error: affiliateError } = await supabaseAdmin
          .from('partner_affiliate_companies')
          .select('id')
          .eq('partner_company_id', partnerMembership.partner_company_id)
          .eq('companies_id', companyId)
          .maybeSingle()

        console.log('Affiliate company check:', {
          found: !!affiliateCompany,
          error: affiliateError?.message
        })

        hasPermission = !!affiliateCompany
      }
    }

    // どちらの経路でも権限がない場合はエラー
    if (!hasPermission) {
      console.error('Permission denied: No direct membership or partner access found')
      throw new Error('この企業に対する権限がありません')
    }

    console.log('Permission check passed')

    // 招待トークンを生成
    const token = crypto.randomUUID()
    console.log('Generated invitation token:', token)

    // 招待をデータベースに作成（サービスロールで）
    console.log('Creating invitation in database...')
    const { data: invitation, error: invitationError } = await supabaseAdmin
      .from('company_user_invitations')
      .insert({
        company_id: companyId,
        name: name,
        token: token,
        status: 'invited'
      })
      .select()
      .single()

    console.log('Invitation creation result:', { invitation, invitationError })

    if (invitationError) {
      console.error('招待作成エラー:', {
        error: invitationError,
        code: invitationError.code,
        message: invitationError.message,
        details: invitationError.details
      })
      throw new Error(`招待の作成に失敗しました: ${invitationError.message}`)
    }

    console.log('Invitation created successfully:', invitation.id)

    return new Response(
      JSON.stringify({
        success: true,
        invitation: {
          id: invitation.id,
          name: invitation.name,
          token: invitation.token,
          url: `https://app.openreview.jp/company-invitation/${invitation.token}`,
          created_at: invitation.created_at
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('=== create-company-invitation Edge Function エラー ===')
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    })

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        details: {
          timestamp: new Date().toISOString(),
          errorType: error.name
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
