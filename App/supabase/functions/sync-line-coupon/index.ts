import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { userHasCompanyAccess } from '../_shared/companyAccess.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const LINE_COUPON_ENDPOINT = 'https://api.line.me/v2/bot/coupon'

interface RequestBody { coupon_id: string }

const toUnixSeconds = (iso: string | null, fallback: number): number => {
  if (!iso) return fallback
  const t = new Date(iso).getTime()
  if (isNaN(t)) return fallback
  return Math.floor(t / 1000)
}

const buildLineCouponPayload = (c: Record<string, unknown>) => {
  const reward: Record<string, unknown> = {
    type: c.reward_type ?? 'discount',
  }
  const rewardType = c.reward_type
  if (rewardType === 'discount' || rewardType === 'cashBack') {
    const priceInfo: Record<string, unknown> = {
      type: c.reward_price_info_type ?? 'fixed',
      currency: c.reward_currency ?? 'JPY',
    }
    if (c.reward_price_info_type === 'percentage') {
      priceInfo.percentage = Number(c.reward_percentage)
    } else {
      priceInfo.fixedAmount = Number(c.reward_fixed_amount)
    }
    reward.priceInfo = priceInfo
  }

  const acquisitionCondition: Record<string, unknown> = {
    type: c.acquisition_type ?? 'normal',
  }
  if (c.acquisition_type === 'lottery') {
    acquisitionCondition.lotteryProbability = Number(c.acquisition_lottery_probability)
    acquisitionCondition.maxAcquireCount = Number(c.acquisition_max_acquire_count)
  }

  const payload: Record<string, unknown> = {
    title: (c.title ?? c.name) as string,
    description: c.description ?? undefined,
    reward,
    acquisitionCondition,
    startTimestamp: toUnixSeconds(c.start_at as string | null, 0), // 0 で即時開始
    endTimestamp: toUnixSeconds(c.expires_at as string | null, Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30),
    timezone: (c.coupon_timezone as string) || 'ASIA_TOKYO',
    maxUseCountPerTicket: c.max_use_count_per_ticket === -1 ? -1 : 1,
    visibility: c.visibility === 'PUBLIC' ? 'PUBLIC' : 'UNLISTED',
  }
  if (c.max_ticket_per_user) payload.maxTicketPerUser = Number(c.max_ticket_per_user)
  if (c.code) payload.couponCode = c.code
  if (c.usage_condition || c.terms_text) payload.usageCondition = (c.usage_condition || c.terms_text)
  if (c.image_url) payload.imageUrl = c.image_url
  return payload
}

const closeLineCoupon = async (couponId: string, accessToken: string): Promise<void> => {
  const res = await fetch(`${LINE_COUPON_ENDPOINT}/${encodeURIComponent(couponId)}/close`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok && res.status !== 404) {
    const body = await res.text()
    console.warn('LINE coupon close failed:', res.status, body.slice(0, 200))
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('認証情報がありません')

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser()
    if (authError || !user) throw new Error('認証エラー')

    const { coupon_id }: RequestBody = await req.json()
    if (!coupon_id) throw new Error('coupon_id が必要です')

    const admin = createClient(supabaseUrl, supabaseServiceKey)

    const { data: coupon, error: cErr } = await admin
      .from('line_coupons').select('*').eq('id', coupon_id).maybeSingle()
    if (cErr || !coupon) throw new Error('クーポンが見つかりません')

    const allowed = await userHasCompanyAccess(admin, user.id, coupon.company_id)
    if (!allowed) throw new Error('このクーポンを操作する権限がありません')

    const { data: company } = await admin
      .from('companies')
      .select('line_messaging_enabled, line_channel_access_token_vault_id')
      .eq('id', coupon.company_id).maybeSingle()
    if (!company?.line_messaging_enabled || !company.line_channel_access_token_vault_id) {
      throw new Error('LINE 連携が有効化されていません。先に「設定」から LINE 連携を行ってください')
    }

    const { data: tokenData, error: tokenErr } = await admin.rpc('vault_get_decrypted_secret', {
      p_id: company.line_channel_access_token_vault_id,
    })
    if (tokenErr || !tokenData) throw new Error('Channel Access Token の取得失敗')
    const accessToken = tokenData as string

    // 既存の公式クーポンがあれば先に close (内容変更時の扱い)
    if (coupon.line_coupon_id) {
      await closeLineCoupon(coupon.line_coupon_id, accessToken)
    }

    // 新規クーポン作成
    const payload = buildLineCouponPayload(coupon as Record<string, unknown>)
    const res = await fetch(LINE_COUPON_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const body = await res.text()
      const errMsg = `LINE 公式クーポン作成失敗 (${res.status}): ${body.slice(0, 400)}`
      console.error(errMsg, { payload })
      // DB にエラーを記録
      await admin.from('line_coupons').update({
        line_coupon_sync_error: errMsg.slice(0, 1000),
      }).eq('id', coupon_id)
      throw new Error(errMsg)
    }

    const result = await res.json() as { couponId?: string }
    const couponId = result.couponId
    if (!couponId) throw new Error('LINE からの応答に couponId が含まれていません')

    await admin.from('line_coupons').update({
      line_coupon_id: couponId,
      line_coupon_synced_at: new Date().toISOString(),
      line_coupon_sync_error: null,
    }).eq('id', coupon_id)

    return new Response(
      JSON.stringify({ success: true, line_coupon_id: couponId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('sync-line-coupon error:', error.message)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
