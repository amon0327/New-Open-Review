// ユーザーの店舗権限を取得する Edge Function
// 目的:
//   - RLS タイミング問題 (auth.uid() が JWT 反映前で SELECT が空になる) を回避
//   - business_users が無いユーザー (LINE 既存ユーザーで bu 未作成) にも保険で INSERT
//   - サーバーログで失敗原因を保存できる
//
// 入力: Authorization: Bearer <JWT>
// 出力:
//   成功: { success: true, hasPermission: true, stores: [...], businessUserId, defaultStore }
//   権限なし: { success: true, hasPermission: false, error: '...' }
//   システムエラー: { success: false, error: '...' }
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: '認証情報がありません' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    // JWT 検証用 (anon クライアント)
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: '認証に失敗しました' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    // RLS をバイパスして 安定取得 (admin)
    const admin = createClient(supabaseUrl, supabaseServiceKey)

    // 1) business_users 確認 (なければ作成: LINE 既存ユーザーで bu 未作成のケースの保険)
    let { data: bu } = await admin
      .from('business_users')
      .select('id')
      .eq('id', user.id)
      .maybeSingle()

    if (!bu) {
      const displayName =
        user.user_metadata?.line_display_name ||
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email ||
        'ユーザー'
      console.log(`[get-user-permissions] auto-create business_user for ${user.id} (${user.email})`)
      const { data: created, error: createErr } = await admin
        .from('business_users')
        .insert({ id: user.id, email: user.email, name: displayName })
        .select('id')
        .single()
      if (createErr) {
        console.error('[get-user-permissions] business_users insert failed:', createErr)
        return new Response(
          JSON.stringify({ success: false, error: 'ユーザー情報の作成に失敗: ' + createErr.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
      }
      bu = created
    }

    // 2) store_memberships + stores を JOIN で取得
    const { data: memberships, error: membershipErr } = await admin
      .from('store_memberships')
      .select(`
        id,
        role,
        store_id,
        company_id,
        name,
        stores (
          id,
          name,
          address,
          staff_view_mode,
          answer_cooldown_days,
          company_id
        )
      `)
      .eq('business_user_id', bu.id)
      .order('created_at', { ascending: true })

    if (membershipErr) {
      console.error('[get-user-permissions] memberships fetch failed:', membershipErr)
      return new Response(
        JSON.stringify({ success: false, error: 'メンバーシップ取得に失敗: ' + membershipErr.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    if (!memberships || memberships.length === 0) {
      console.log(`[get-user-permissions] no memberships for ${user.id}`)
      return new Response(
        JSON.stringify({
          success: true,
          hasPermission: false,
          error: '店舗への権限がありません',
          stores: [],
          businessUserId: bu.id
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        hasPermission: true,
        stores: memberships,
        businessUserId: bu.id,
        defaultStore: memberships[0],
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('[get-user-permissions] unexpected error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message || '不明なエラー' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
