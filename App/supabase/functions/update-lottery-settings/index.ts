import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface LotterySettingsRequest {
  review_form_id: string
  max_wins_per_month: number
  win_rate_divisor: number
  reset_monthly_stats?: boolean
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
    const { review_form_id, max_wins_per_month, win_rate_divisor, reset_monthly_stats } = requestData

    // Validate input
    if (!review_form_id) {
      throw new Error('レビューフォームIDが必要です')
    }

    if (max_wins_per_month < 0) {
      throw new Error('月間最大当選回数は0以上である必要があります')
    }

    if (win_rate_divisor < 1) {
      throw new Error('当選確率分母は1以上である必要があります')
    }

    // Create service client for database operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // First, get the review form to find the company_id
    const { data: formData, error: formError } = await supabaseAdmin
      .from('review_forms')
      .select('id, company_id, user_id')
      .eq('id', review_form_id)
      .single()

    if (formError || !formData) {
      throw new Error('フォームが見つかりません')
    }

    // Check if user is the form owner
    if (formData.user_id === user.id) {
      // User is the form owner, allow access
    } else {
      // Check company membership
      const { data: membershipData, error: membershipError } = await supabaseAdmin
        .from('company_memberships')
        .select('id')
        .eq('company_id', formData.company_id)
        .eq('user_id', user.id)
        .maybeSingle()

      if (!membershipData) {
        // Check partner membership
        const { data: partnerData, error: partnerError } = await supabaseAdmin
          .from('partner_company_associations')
          .select(`
            id,
            partners!inner (
              id,
              partner_memberships!inner (
                user_id
              )
            )
          `)
          .eq('company_id', formData.company_id)
          .eq('partners.partner_memberships.user_id', user.id)
          .maybeSingle()

        if (!partnerData) {
          throw new Error('このフォームの抽選設定を更新する権限がありません')
        }
      }
    }

    // Check if lottery record exists
    const { data: existingLottery, error: checkError } = await supabaseAdmin
      .from('lottery')
      .select('*')
      .eq('review_form_id', review_form_id)
      .maybeSingle()

    let result

    if (!existingLottery && !checkError) {
      // No existing record, create new one
      const { data: newLottery, error: insertError } = await supabaseAdmin
        .from('lottery')
        .insert({
          review_form_id: review_form_id,
          max_wins_per_month: max_wins_per_month,
          win_rate_divisor: win_rate_divisor,
          current_wins: 0,
          current_trials: 0
        })
        .select()
        .single()

      if (insertError) {
        throw new Error('抽選設定の作成に失敗しました: ' + insertError.message)
      }

      result = newLottery
    } else if (existingLottery) {
      // Update existing record
      const { data: updatedLottery, error: updateError } = await supabaseAdmin
        .from('lottery')
        .update({
          max_wins_per_month: max_wins_per_month,
          win_rate_divisor: win_rate_divisor
        })
        .eq('review_form_id', review_form_id)
        .select()
        .single()

      if (updateError) {
        throw new Error('抽選設定の更新に失敗しました: ' + updateError.message)
      }

      result = updatedLottery
    } else if (checkError) {
      throw new Error('既存レコードの確認中にエラーが発生しました: ' + checkError.message)
    }

    // Log the update
    console.log('抽選設定更新成功:', {
      userId: user.id,
      reviewFormId: review_form_id,
      maxWinsPerMonth: max_wins_per_month,
      winRateDivisor: win_rate_divisor,
      action: existingLottery ? 'update' : 'create'
    })

    return new Response(
      JSON.stringify({
        success: true,
        data: result,
        message: existingLottery ? '抽選設定を更新しました' : '抽選設定を作成しました'
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