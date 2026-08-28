import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CheckEligibilityRequest {
  reviewFormId: string
  userId: string
  storeCode?: string // 任意。指定があれば店舗単位の cooldown を適用
}

interface CheckEligibilityResponse {
  isEligible: boolean
  message?: string
  cooldownDays?: number
}

const DEFAULT_COOLDOWN_DAYS = 5
const COOLDOWN_MIN = 1
const COOLDOWN_MAX = 7

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { reviewFormId, userId, storeCode } = await req.json() as CheckEligibilityRequest

    // 店舗単位の cooldown 設定を取得 (storeCode から store を解決)
    let cooldownDays = DEFAULT_COOLDOWN_DAYS
    if (storeCode) {
      const { data: store } = await supabase
        .from('stores')
        .select('answer_cooldown_days')
        .eq('store_url_code', storeCode)
        .maybeSingle()
      if (store?.answer_cooldown_days) {
        const n = Number(store.answer_cooldown_days)
        if (Number.isInteger(n) && n >= COOLDOWN_MIN && n <= COOLDOWN_MAX) {
          cooldownDays = n
        }
      }
    }

    // cooldownDays 日以内の lottery_log を確認
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - cooldownDays)

    const { data: recentSubmissions, error: recentError } = await supabase
      .from('lottery_log')
      .select('created_at')
      .eq('review_form_id', reviewFormId)
      .eq('user_id', userId)
      .gte('created_at', cutoff.toISOString())
      .limit(1)

    if (recentError) throw recentError

    if (recentSubmissions && recentSubmissions.length > 0) {
      return new Response(
        JSON.stringify({
          isEligible: false,
          message: '一定期間後に\nアンケートをお願いします',
          cooldownDays
        } as CheckEligibilityResponse),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    return new Response(
      JSON.stringify({
        isEligible: true,
        cooldownDays
      } as CheckEligibilityResponse),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
