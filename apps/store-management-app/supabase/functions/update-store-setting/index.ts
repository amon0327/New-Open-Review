import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ALLOWED_VIEW_MODES = ['weekly', 'realtime']
const COOLDOWN_MIN = 1
const COOLDOWN_MAX = 7

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { store_id, staff_view_mode, answer_cooldown_days } = body

    if (!store_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'store_id is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // 更新したい列を組み立てる (どちらか一方、もしくは両方)
    const update: Record<string, unknown> = {}

    if (staff_view_mode !== undefined) {
      if (!ALLOWED_VIEW_MODES.includes(staff_view_mode)) {
        return new Response(
          JSON.stringify({ success: false, error: `staff_view_mode must be one of: ${ALLOWED_VIEW_MODES.join(', ')}` }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }
      update.staff_view_mode = staff_view_mode
    }

    if (answer_cooldown_days !== undefined) {
      const n = Number(answer_cooldown_days)
      if (!Number.isInteger(n) || n < COOLDOWN_MIN || n > COOLDOWN_MAX) {
        return new Response(
          JSON.stringify({ success: false, error: `answer_cooldown_days must be an integer between ${COOLDOWN_MIN} and ${COOLDOWN_MAX}` }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }
      update.answer_cooldown_days = n
    }

    if (Object.keys(update).length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'No setting field provided' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authorization header is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 当該ユーザーがその店舗の STORE ロールであることを確認
    const { data: membership, error: membershipError } = await supabase
      .from('store_memberships')
      .select('id, store_id, role')
      .eq('business_user_id', user.id)
      .eq('store_id', store_id)
      .maybeSingle()

    if (membershipError) {
      console.error('update-store-setting: Membership check error', membershipError)
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to check store membership' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    if (!membership) {
      return new Response(
        JSON.stringify({ success: false, error: 'User is not a member of this store' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }

    // STORE ロール (店舗責任者) のみ設定変更を許可。STAFF は不可。
    if (String(membership.role).toUpperCase() !== 'STORE') {
      return new Response(
        JSON.stringify({ success: false, error: 'Only store managers can update store settings' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }

    const { data: updated, error: updateError } = await supabase
      .from('stores')
      .update(update)
      .eq('id', store_id)
      .select('id, staff_view_mode, answer_cooldown_days')
      .single()

    if (updateError) {
      console.error('update-store-setting: Update error', updateError)
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to update store setting', details: updateError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    return new Response(
      JSON.stringify({ success: true, store: updated }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('update-store-setting: Unexpected error', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
