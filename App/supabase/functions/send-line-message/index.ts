import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const MAX_MESSAGES_PER_MULTICAST = 5
const MAX_USERS_PER_MULTICAST = 500

interface RequestBody {
  message_id: string
}

interface Block {
  id: string
  block_type: 'text' | 'image' | 'coupon'
  text_content: string | null
  image_url: string | null
  link_url: string | null
  coupon_id: string | null
  display_order: number
}

interface Coupon {
  id: string
  name: string
  description: string | null
  image_url: string | null
  code: string | null
  discount_text: string | null
  expires_at: string | null
  terms_text: string | null
}

const formatDate = (iso: string | null): string => {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
}

const substituteVars = (text: string, vars: Record<string, string>): string => {
  return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (_m, key) => vars[key] ?? '')
}

const buildLineMessages = (blocks: Block[], couponsById: Map<string, Coupon>, vars: Record<string, string>) => {
  const out: unknown[] = []
  for (const b of blocks) {
    if (b.block_type === 'text' && b.text_content) {
      out.push({ type: 'text', text: substituteVars(b.text_content, vars).slice(0, 5000) })
    } else if (b.block_type === 'image' && b.image_url) {
      if (b.link_url) {
        // 画像 + タップでリンク → Flex Message
        out.push({
          type: 'flex',
          altText: '画像',
          contents: {
            type: 'bubble',
            hero: {
              type: 'image',
              url: b.image_url,
              size: 'full',
              aspectMode: 'cover',
              aspectRatio: '1.51:1',
              action: { type: 'uri', uri: b.link_url },
            },
          },
        })
      } else {
        out.push({
          type: 'image',
          originalContentUrl: b.image_url,
          previewImageUrl: b.image_url,
        })
      }
    } else if (b.block_type === 'coupon' && b.coupon_id) {
      const coupon = couponsById.get(b.coupon_id)
      if (!coupon) continue

      const bodyContents: unknown[] = [
        { type: 'text', text: substituteVars(coupon.name, vars), weight: 'bold', size: 'xl', wrap: true },
      ]
      if (coupon.discount_text) {
        bodyContents.push({ type: 'text', text: substituteVars(coupon.discount_text, vars), size: 'lg', color: '#06C755', weight: 'bold', wrap: true, margin: 'md' })
      }
      if (coupon.description) {
        bodyContents.push({ type: 'text', text: substituteVars(coupon.description, vars), size: 'sm', color: '#555555', wrap: true, margin: 'md' })
      }
      if (coupon.code) {
        bodyContents.push({
          type: 'box', layout: 'baseline', margin: 'lg',
          contents: [
            { type: 'text', text: 'コード', size: 'sm', color: '#888888', flex: 2 },
            { type: 'text', text: substituteVars(coupon.code, vars), size: 'sm', weight: 'bold', flex: 5 },
          ],
        })
      }
      if (coupon.expires_at) {
        bodyContents.push({
          type: 'box', layout: 'baseline', margin: 'sm',
          contents: [
            { type: 'text', text: '有効期限', size: 'sm', color: '#888888', flex: 2 },
            { type: 'text', text: formatDate(coupon.expires_at), size: 'sm', flex: 5 },
          ],
        })
      }
      if (coupon.terms_text) {
        bodyContents.push({ type: 'text', text: substituteVars(coupon.terms_text, vars), size: 'xs', color: '#aaaaaa', wrap: true, margin: 'lg' })
      }

      const bubble: Record<string, unknown> = {
        type: 'bubble',
        body: { type: 'box', layout: 'vertical', contents: bodyContents },
      }
      if (coupon.image_url) {
        bubble.hero = {
          type: 'image',
          url: coupon.image_url,
          size: 'full',
          aspectMode: 'cover',
          aspectRatio: '20:13',
        }
      }

      out.push({ type: 'flex', altText: `クーポン: ${coupon.name}`, contents: bubble })
    }
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

    // メッセージとブロックを取得
    const { data: message, error: msgErr } = await admin
      .from('line_messages')
      .select('*')
      .eq('id', message_id)
      .maybeSingle()
    if (msgErr || !message) throw new Error('メッセージが見つかりません')
    if (message.status === 'sent') throw new Error('既に送信済みのメッセージです')

    // 企業所属チェック
    const { data: membership } = await admin
      .from('company_memberships')
      .select('id')
      .eq('company_id', message.company_id)
      .eq('business_user_id', user.id)
      .maybeSingle()
    if (!membership) throw new Error('このメッセージを送信する権限がありません')

    // 企業情報 + Channel Access Token
    const { data: company } = await admin
      .from('companies')
      .select('id, name, line_messaging_enabled, line_channel_access_token_vault_id')
      .eq('id', message.company_id)
      .maybeSingle()
    if (!company) throw new Error('企業が見つかりません')
    if (!company.line_messaging_enabled || !company.line_channel_access_token_vault_id) {
      throw new Error('LINE 連携が有効化されていません。先に LINE 設定を行ってください')
    }

    const { data: tokenData, error: tokenErr } = await admin.rpc('vault_get_decrypted_secret', {
      p_id: company.line_channel_access_token_vault_id,
    })
    if (tokenErr || !tokenData) throw new Error('Channel Access Token の取得失敗: ' + (tokenErr?.message ?? 'empty'))
    const accessToken = tokenData as string

    // ブロック取得
    const { data: blocksData } = await admin
      .from('line_message_blocks')
      .select('*')
      .eq('message_id', message_id)
      .order('display_order', { ascending: true })
    const blocks = (blocksData ?? []) as Block[]
    if (blocks.length === 0) throw new Error('メッセージにブロックがありません')

    // クーポン情報を一括取得
    const couponIds = blocks.filter(b => b.coupon_id).map(b => b.coupon_id!) as string[]
    const couponsById = new Map<string, Coupon>()
    if (couponIds.length > 0) {
      const { data: coupons } = await admin
        .from('line_coupons')
        .select('id, name, description, image_url, code, discount_text, expires_at, terms_text')
        .in('id', couponIds)
      for (const c of (coupons ?? []) as Coupon[]) couponsById.set(c.id, c)
    }

    // 配信対象を取得
    let conditions: Record<string, unknown> = {}
    if (message.target_segment_id) {
      const { data: seg } = await admin
        .from('line_target_segments')
        .select('conditions')
        .eq('id', message.target_segment_id)
        .maybeSingle()
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

    // 状態を sending に
    await admin.from('line_messages').update({
      status: 'sending',
      recipient_count: audience.length,
      target_snapshot: conditions,
      sent_by: user.id,
    }).eq('id', message_id)

    // 変数置換: 企業名のみ (per-user 変数は multicast 不可のため非対応)
    const vars: Record<string, string> = {
      company_name: company.name ?? '',
    }

    const lineMessages = buildLineMessages(blocks, couponsById, vars)
    if (lineMessages.length === 0) throw new Error('送信可能なメッセージブロックがありません')

    // メッセージは LINE 仕様で multicast あたり最大 5 個
    const messageBatches: unknown[][] = []
    for (let i = 0; i < lineMessages.length; i += MAX_MESSAGES_PER_MULTICAST) {
      messageBatches.push(lineMessages.slice(i, i + MAX_MESSAGES_PER_MULTICAST))
    }

    // ユーザーは 500 件ずつ
    let deliveredCount = 0
    let failedCount = 0
    const deliveryRows: Array<{ message_id: string; line_user_id: string; user_id: string; status: string; error_message?: string; sent_at?: string }> = []

    for (let i = 0; i < audience.length; i += MAX_USERS_PER_MULTICAST) {
      const chunk = audience.slice(i, i + MAX_USERS_PER_MULTICAST)
      const userIds = chunk.map(a => a.line_user_id)

      let chunkSucceeded = true
      let lastError: string | null = null

      for (const batch of messageBatches) {
        const res = await fetch('https://api.line.me/v2/bot/message/multicast', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ to: userIds, messages: batch }),
        })
        if (!res.ok) {
          chunkSucceeded = false
          lastError = `${res.status}: ${(await res.text()).slice(0, 300)}`
          console.error('LINE multicast failed:', lastError)
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

    // 一括 insert (1000 件ずつ)
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
