import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface UpdateLineMiniAppUrlRequest {
  company_id: string
  line_mini_app_url: string
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('認証情報がありません')
    }

    // Create client for auth verification
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader
        }
      }
    })

    // Verify user
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser()
    if (authError || !user) {
      throw new Error('認証エラー: ' + (authError?.message || 'ユーザーが見つかりません'))
    }

    // Parse request body
    const requestData: UpdateLineMiniAppUrlRequest = await req.json()
    const { company_id, line_mini_app_url } = requestData

    // Validate input
    if (!company_id) {
      throw new Error('企業IDが必要です')
    }

    // URL validation: allow empty string (for deletion), otherwise must start with https://
    if (line_mini_app_url && !line_mini_app_url.startsWith('https://')) {
      throw new Error('URLはhttps://で始まる必要があります')
    }

    // Create service client for database operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Check if user has access to the company
    // 1. Check direct company membership
    const { data: membershipData } = await supabaseAdmin
      .from('company_memberships')
      .select('id')
      .eq('company_id', company_id)
      .eq('business_user_id', user.id)
      .maybeSingle()

    if (!membershipData) {
      // 2. Check partner membership
      const { data: userPartnerMemberships } = await supabaseAdmin
        .from('partner_memberships')
        .select('partner_company_id')
        .eq('business_users_id', user.id)
        .eq('is_active', true)

      let hasPartnerAccess = false
      if (userPartnerMemberships && userPartnerMemberships.length > 0) {
        const partnerCompanyIds = userPartnerMemberships.map(pm => pm.partner_company_id)
        const { data: affiliations } = await supabaseAdmin
          .from('partner_affiliate_companies')
          .select('id')
          .eq('companies_id', company_id)
          .in('partner_company_id', partnerCompanyIds)
        hasPartnerAccess = affiliations && affiliations.length > 0
      }

      if (!hasPartnerAccess) {
        throw new Error('この企業のLINEミニアプリURLを更新する権限がありません')
      }
    }

    // Update the company's line_mini_app_url
    const { data: updatedCompany, error: updateError } = await supabaseAdmin
      .from('companies')
      .update({ line_mini_app_url: line_mini_app_url || null })
      .eq('id', company_id)
      .select('id, line_mini_app_url')
      .single()

    if (updateError) {
      throw new Error('LINEミニアプリURLの更新に失敗しました: ' + updateError.message)
    }

    // Log the update
    console.log('LINEミニアプリURL更新成功:', {
      userId: user.id,
      companyId: company_id,
      lineMiniAppUrl: line_mini_app_url || '(削除)'
    })

    return new Response(
      JSON.stringify({
        success: true,
        data: updatedCompany,
        message: line_mini_app_url ? 'LINEミニアプリURLを更新しました' : 'LINEミニアプリURLを削除しました'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error:', error.message)
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
