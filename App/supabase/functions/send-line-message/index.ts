import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { userHasCompanyAccess } from '../_shared/companyAccess.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const MAX_MESSAGES_PER_MULTICAST = 5
const MAX_USERS_PER_MULTICAST = 500

interface RequestBody { message_id: string }

interface Block {
  id: string
  block_type: 'text' | 'image' | 'coupon' | 'sticker' | 'video' | 'location' | 'audio'
  text_content: string | null
  emojis: unknown[] | null
  image_url: string | null
  link_url: string | null
  coupon_id: string | null
  sticker_package_id: number | null
  sticker_id: number | null
  video_url: string | null
  video_tracking_id: string | null
  audio_url: string | null
  audio_duration_ms: number | null
  location_title: string | null
  location_address: string | null
  location_latitude: number | string | null
  location_longitude: number | string | null
  display_order: number
}

interface Coupon {
  id: string
  // 新スキーマ (LINE Coupon API 準拠)
  title: string | null
  description: string | null
  image_url: string | null
  code: string | null
  start_at: string | null
  expires_at: string | null
  coupon_timezone: string | null
  max_use_count_per_ticket: number | null
  visibility: string | null
  max_ticket_per_user: number | null
  usage_condition: string | null
  reward_type: string | null
  reward_price_info_type: string | null
  reward_fixed_amount: number | null
  reward_percentage: number | null
  reward_currency: string | null
  acquisition_type: string | null
  acquisition_lottery_probability: number | null
  acquisition_max_acquire_count: number | null
  // 旧スキーマ (互換)
  name: string | null
  discount_text: string | null
  terms_text: string | null
}

const formatDate = (iso: string | null): string => {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
}

const substituteVars = (text: string, vars: Record<string, string>): string =>
  text.replace(/\{\{\s*(\w+)\s*\}\}/g, (_m, key) => vars[key] ?? '')

const formatRewardLabel = (c: Coupon): string => {
  const t = c.reward_type || 'discount'
  if (t === 'discount' || t === 'cashBack') {
    const suffix = t === 'cashBack' ? 'キャッシュバック' : 'OFF'
    if (c.reward_price_info_type === 'percentage' && c.reward_percentage != null) {
      return `${c.reward_percentage}%${suffix}`
    }
    if (c.reward_price_info_type === 'fixed' && c.reward_fixed_amount != null) {
      const cur = c.reward_currency === 'JPY' ? '円' : ` ${c.reward_currency || ''}`
      return `${c.reward_fixed_amount}${cur}${suffix}`
    }
  }
  if (t === 'free') return '無料提供'
  if (t === 'gift') return 'プレゼント'
  return c.discount_text || ''
}

const buildCouponFlex = (coupon: Coupon, vars: Record<string, string>) => {
  const title = coupon.title || coupon.name || 'クーポン'
  const reward = formatRewardLabel(coupon)
  const usage = coupon.usage_condition || coupon.terms_text

  const bodyContents: unknown[] = []

  // バッジ (抽選 / 公開) - 親は horizontal layout (baseline 内には box を入れられない)
  const badges: unknown[] = []
  if (coupon.acquisition_type === 'lottery') {
    badges.push({
      type: 'box', layout: 'vertical', cornerRadius: 'md',
      backgroundColor: '#fef3c7', paddingAll: 'xs',
      contents: [{ type: 'text', text: '抽選', size: 'xs', color: '#92400e', weight: 'bold', align: 'center' }],
    })
  }
  if (coupon.visibility === 'PUBLIC') {
    badges.push({
      type: 'box', layout: 'vertical', cornerRadius: 'md',
      backgroundColor: '#dbeafe', paddingAll: 'xs',
      contents: [{ type: 'text', text: 'PUBLIC', size: 'xs', color: '#1e40af', weight: 'bold', align: 'center' }],
    })
  }
  if (badges.length > 0) {
    bodyContents.push({ type: 'box', layout: 'horizontal', contents: badges, spacing: 'sm' })
  }

  bodyContents.push({ type: 'text', text: substituteVars(title, vars), weight: 'bold', size: 'xl', wrap: true, margin: badges.length > 0 ? 'md' : 'none' })

  if (reward) {
    bodyContents.push({ type: 'text', text: reward, size: 'xxl', color: '#06C755', weight: 'bold', wrap: true, margin: 'md' })
  }
  if (coupon.description) {
    bodyContents.push({ type: 'text', text: substituteVars(coupon.description, vars), size: 'sm', color: '#555555', wrap: true, margin: 'md' })
  }
  if (coupon.code) {
    bodyContents.push({
      type: 'box', layout: 'vertical', margin: 'lg',
      cornerRadius: 'md', borderWidth: '1px', borderColor: '#cbd5e1',
      backgroundColor: '#f8fafc', paddingAll: 'sm',
      contents: [
        { type: 'text', text: 'コード', size: 'xs', color: '#94a3b8', align: 'center' },
        { type: 'text', text: substituteVars(coupon.code, vars), size: 'lg', weight: 'bold', align: 'center' },
      ],
    })
  }
  if (coupon.start_at || coupon.expires_at) {
    const period = coupon.start_at && coupon.expires_at
      ? `${formatDate(coupon.start_at)} 〜 ${formatDate(coupon.expires_at)}`
      : coupon.expires_at ? formatDate(coupon.expires_at) : `${formatDate(coupon.start_at)} 〜`
    bodyContents.push({
      type: 'box', layout: 'vertical', margin: 'lg', spacing: 'xs',
      contents: [
        { type: 'text', text: '有効期限', size: 'xs', color: '#888888' },
        { type: 'text', text: period || '-', size: 'sm', wrap: true },
      ],
    })
  }
  if (usage) {
    bodyContents.push({ type: 'text', text: substituteVars(usage, vars), size: 'xs', color: '#aaaaaa', wrap: true, margin: 'lg' })
  }

  // フッター (使用回数 / 獲得枚数)
  const footerChips: unknown[] = []
  if (coupon.max_use_count_per_ticket === -1) {
    footerChips.push({ type: 'text', text: '使用無制限', size: 'xxs', color: '#64748b' })
  } else {
    footerChips.push({ type: 'text', text: '1人1回', size: 'xxs', color: '#64748b' })
  }
  if (coupon.max_ticket_per_user) {
    footerChips.push({ type: 'text', text: `最大${coupon.max_ticket_per_user}枚`, size: 'xxs', color: '#64748b', margin: 'md' })
  }
  if (footerChips.length > 0) {
    bodyContents.push({ type: 'box', layout: 'baseline', margin: 'lg', contents: footerChips })
  }

  const bubble: Record<string, unknown> = {
    type: 'bubble',
    size: 'kilo',
    header: {
      type: 'box', layout: 'vertical', paddingAll: 'sm',
      backgroundColor: '#06C755',
      contents: [{ type: 'text', text: 'COUPON', color: '#ffffff', weight: 'bold', size: 'xs', align: 'center' }],
    },
    body: { type: 'box', layout: 'vertical', contents: bodyContents },
  }

  if (coupon.image_url) {
    bubble.hero = { type: 'image', url: coupon.image_url, size: 'full', aspectMode: 'cover', aspectRatio: '20:13' }
  }

  return bubble
}

const buildLineMessages = (
  blocks: Block[],
  couponsById: Map<string, Coupon>,
  vars: Record<string, string>,
  senderName: string | null,
  senderIconUrl: string | null,
  quickReplyItems: unknown[] | null,
) => {
  const sender = (senderName || senderIconUrl)
    ? { ...(senderName ? { name: senderName } : {}), ...(senderIconUrl ? { iconUrl: senderIconUrl } : {}) }
    : undefined
  const out: Record<string, unknown>[] = []

  for (const b of blocks) {
    let msg: Record<string, unknown> | null = null

    if (b.block_type === 'text' && b.text_content) {
      msg = { type: 'text', text: substituteVars(b.text_content, vars).slice(0, 5000) }
      if (Array.isArray(b.emojis) && b.emojis.length > 0) {
        msg.emojis = b.emojis
      }
    } else if (b.block_type === 'image' && b.image_url) {
      if (b.link_url) {
        msg = {
          type: 'flex', altText: '画像',
          contents: {
            type: 'bubble',
            hero: {
              type: 'image', url: b.image_url, size: 'full',
              aspectMode: 'cover', aspectRatio: '1.51:1',
              action: { type: 'uri', uri: b.link_url },
            },
          },
        }
      } else {
        msg = { type: 'image', originalContentUrl: b.image_url, previewImageUrl: b.image_url }
      }
    } else if (b.block_type === 'sticker' && b.sticker_package_id != null && b.sticker_id != null) {
      msg = {
        type: 'sticker',
        packageId: String(b.sticker_package_id),
        stickerId: String(b.sticker_id),
      }
    } else if (b.block_type === 'video' && b.video_url) {
      msg = {
        type: 'video',
        originalContentUrl: b.video_url,
        previewImageUrl: b.image_url || b.video_url,
      }
      if (b.video_tracking_id) msg.trackingId = b.video_tracking_id
    } else if (b.block_type === 'audio' && b.audio_url && b.audio_duration_ms) {
      msg = {
        type: 'audio',
        originalContentUrl: b.audio_url,
        duration: Number(b.audio_duration_ms),
      }
    } else if (b.block_type === 'location') {
      const lat = typeof b.location_latitude === 'string' ? parseFloat(b.location_latitude) : b.location_latitude
      const lng = typeof b.location_longitude === 'string' ? parseFloat(b.location_longitude) : b.location_longitude
      if (lat != null && lng != null && b.location_title) {
        msg = {
          type: 'location',
          title: substituteVars(b.location_title, vars),
          address: substituteVars(b.location_address || '', vars),
          latitude: lat,
          longitude: lng,
        }
      }
    } else if (b.block_type === 'coupon' && b.coupon_id) {
      const coupon = couponsById.get(b.coupon_id)
      if (!coupon) continue
      const bubble = buildCouponFlex(coupon, vars)
      msg = { type: 'flex', altText: `クーポン: ${coupon.title || coupon.name || ''}`, contents: bubble }
    }

    if (!msg) continue
    if (sender) msg.sender = sender
    out.push(msg)
  }

  // quickReply は最後のメッセージにのみ付与 (LINE 仕様)
  if (quickReplyItems && Array.isArray(quickReplyItems) && quickReplyItems.length > 0 && out.length > 0) {
    out[out.length - 1].quickReply = { items: quickReplyItems }
  }

  return out
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

    const { message_id }: RequestBody = await req.json()
    if (!message_id) throw new Error('message_id が必要です')

    const admin = createClient(supabaseUrl, supabaseServiceKey)

    const { data: message, error: msgErr } = await admin
      .from('line_messages').select('*').eq('id', message_id).maybeSingle()
    if (msgErr || !message) throw new Error('メッセージが見つかりません')
    if (message.status === 'sent') throw new Error('既に送信済みのメッセージです')

    const allowed = await userHasCompanyAccess(admin, user.id, message.company_id)
    if (!allowed) throw new Error('このメッセージを送信する権限がありません')

    const { data: company } = await admin
      .from('companies')
      .select('id, name, line_messaging_enabled, line_channel_access_token_vault_id')
      .eq('id', message.company_id).maybeSingle()
    if (!company) throw new Error('企業が見つかりません')
    if (!company.line_messaging_enabled || !company.line_channel_access_token_vault_id) {
      throw new Error('LINE 連携が有効化されていません')
    }

    const { data: tokenData, error: tokenErr } = await admin.rpc('vault_get_decrypted_secret', {
      p_id: company.line_channel_access_token_vault_id,
    })
    if (tokenErr || !tokenData) throw new Error('Channel Access Token の取得失敗')
    const accessToken = tokenData as string

    const { data: blocksData } = await admin
      .from('line_message_blocks').select('*').eq('message_id', message_id)
      .order('display_order', { ascending: true })
    const blocks = (blocksData ?? []) as Block[]
    if (blocks.length === 0) throw new Error('メッセージにブロックがありません')

    const couponIds = blocks.filter(b => b.coupon_id).map(b => b.coupon_id!) as string[]
    const couponsById = new Map<string, Coupon>()
    if (couponIds.length > 0) {
      const { data: coupons } = await admin
        .from('line_coupons')
        .select('id, title, name, description, image_url, code, discount_text, start_at, expires_at, coupon_timezone, max_use_count_per_ticket, visibility, max_ticket_per_user, usage_condition, terms_text, reward_type, reward_price_info_type, reward_fixed_amount, reward_percentage, reward_currency, acquisition_type, acquisition_lottery_probability, acquisition_max_acquire_count')
        .in('id', couponIds)
      for (const c of (coupons ?? []) as Coupon[]) couponsById.set(c.id, c)
    }

    let conditions: Record<string, unknown> = {}
    if (message.target_segment_id) {
      const { data: seg } = await admin
        .from('line_target_segments').select('conditions')
        .eq('id', message.target_segment_id).maybeSingle()
      if (seg?.conditions) conditions = seg.conditions as Record<string, unknown>
    } else if (message.target_snapshot) {
      conditions = message.target_snapshot as Record<string, unknown>
    }

    const { data: audienceData, error: audErr } = await admin.rpc('compute_line_audience', {
      p_company_id: message.company_id,
      p_conditions: conditions,
      p_limit: 50000,
    })
    if (audErr) throw new Error('配信対象計算失敗: ' + audErr.message)
    const audience = (audienceData ?? []) as Array<{ line_user_id: string; user_id: string }>
    if (audience.length === 0) throw new Error('配信対象が 0 件です')

    await admin.from('line_messages').update({
      status: 'sending',
      recipient_count: audience.length,
      target_snapshot: conditions,
      sent_by: user.id,
    }).eq('id', message_id)

    const vars: Record<string, string> = { company_name: company.name ?? '' }

    const lineMessages = buildLineMessages(
      blocks, couponsById, vars,
      message.sender_name || null,
      message.sender_icon_url || null,
      Array.isArray(message.quick_reply_items) ? message.quick_reply_items as unknown[] : null,
    )
    if (lineMessages.length === 0) throw new Error('送信可能なメッセージがありません')

    const messageBatches: unknown[][] = []
    for (let i = 0; i < lineMessages.length; i += MAX_MESSAGES_PER_MULTICAST) {
      messageBatches.push(lineMessages.slice(i, i + MAX_MESSAGES_PER_MULTICAST))
    }

    let deliveredCount = 0
    let failedCount = 0
    const deliveryRows: Array<{ message_id: string; line_user_id: string; user_id: string; status: string; error_message?: string; sent_at?: string }> = []

    const customAggregationUnits = Array.isArray(message.custom_aggregation_units)
      ? message.custom_aggregation_units as string[] : null

    for (let i = 0; i < audience.length; i += MAX_USERS_PER_MULTICAST) {
      const chunk = audience.slice(i, i + MAX_USERS_PER_MULTICAST)
      const userIds = chunk.map(a => a.line_user_id)

      let chunkSucceeded = true
      let lastError: string | null = null

      for (const batch of messageBatches) {
        const payload: Record<string, unknown> = {
          to: userIds,
          messages: batch,
          notificationDisabled: !!message.notification_disabled,
        }
        if (customAggregationUnits && customAggregationUnits.length > 0) {
          payload.customAggregationUnits = customAggregationUnits
        }
        const res = await fetch('https://api.line.me/v2/bot/message/multicast', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
          body: JSON.stringify(payload),
        })
        if (!res.ok) {
          chunkSucceeded = false
          const body = await res.text()
          lastError = `${res.status}: ${body.slice(0, 500)}`
          console.error('LINE multicast failed:', {
            status: res.status,
            error_body: body,
            request_messages: JSON.stringify(batch).slice(0, 2000),
          })
          break
        }
      }

      const sentAt = new Date().toISOString()
      for (const a of chunk) {
        if (chunkSucceeded) {
          deliveredCount++
          deliveryRows.push({ message_id, line_user_id: a.line_user_id, user_id: a.user_id, status: 'sent', sent_at: sentAt })
        } else {
          failedCount++
          deliveryRows.push({ message_id, line_user_id: a.line_user_id, user_id: a.user_id, status: 'failed', error_message: lastError ?? undefined })
        }
      }
    }

    for (let i = 0; i < deliveryRows.length; i += 1000) {
      const slice = deliveryRows.slice(i, i + 1000)
      const { error: insErr } = await admin.from('line_message_deliveries').insert(slice)
      if (insErr) console.error('delivery insert error:', insErr.message)
    }

    const finalStatus = failedCount === 0 ? 'sent' : (deliveredCount === 0 ? 'failed' : 'sent')
    await admin.from('line_messages').update({
      status: finalStatus,
      delivered_count: deliveredCount,
      failed_count: failedCount,
      sent_at: new Date().toISOString(),
    }).eq('id', message_id)

    return new Response(
      JSON.stringify({
        success: true,
        recipient_count: audience.length,
        delivered_count: deliveredCount,
        failed_count: failedCount,
        status: finalStatus,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('send-line-message error:', error.message)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
