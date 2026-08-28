import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface LotterySettingsRequest {
  company_id?: string
  review_form_id?: string
  max_wins_per_month: number
  win_rate_divisor: number
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
    const requestData: LotterySettingsRequest = await req.json()
    const { company_id, review_form_id, max_wins_per_month, win_rate_divisor } = requestData

    if (max_wins_per_month < 0) {
      throw new Error('月間最大当選回数は0以上である必要があります')
    }

    if (win_rate_divisor < 1) {
      throw new Error('当選確率分母は1以上である必要があります')
    }

    // Create service client for database operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // company_id を決定（直接指定 or review_form_id から取得）
    let companyId = company_id
    if (!companyId) {
      if (!review_form_id) {
        throw new Error('company_id または review_form_id が必要です')
      }
      const { data: formData, error: formError } = await supabaseAdmin
        .from('review_forms')
        .select('company_id')
        .eq('id', review_form_id)
        .single()

      if (formError || !formData) {
        throw new Error('フォームが見つかりません')
      }
      companyId = formData.company_id
    }

    // Check company membership
    const { data: membershipData } = await supabaseAdmin
      .from('company_memberships')
      .select('id')
      .eq('company_id', companyId)
      .eq('business_user_id', user.id)
      .maybeSingle()

    if (!membershipData) {
      // Check partner membership
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
          .eq('companies_id', companyId)
          .in('partner_company_id', partnerCompanyIds)
        hasPartnerAccess = affiliations && affiliations.length > 0
      }

      if (!hasPartnerAccess) {
        throw new Error('この企業の抽選設定を更新する権限がありません')
      }
    }

    // company_lottery_settings に upsert（企業単位の抽選設定）
    const { data: result, error: upsertError } = await supabaseAdmin
      .from('company_lottery_settings')
      .upsert({
        company_id: companyId,
        win_rate_divisor: win_rate_divisor,
        max_wins_per_month: max_wins_per_month,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'company_id'
      })
      .select()
      .single()

    if (upsertError) {
      throw new Error('抽選設定の保存に失敗しました: ' + upsertError.message)
    }

    // Log the update
    console.log('抽選設定更新成功:', {
      userId: user.id,
      companyId: companyId,
      maxWinsPerMonth: max_wins_per_month,
      winRateDivisor: win_rate_divisor
    })

    return new Response(
      JSON.stringify({
        success: true,
        data: result,
        message: '抽選設定を更新しました'
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