// LINE 配信機能 (店舗管理アプリ)
// OpenReviewApp 側の lib/lineMessaging.js を店舗向けに簡素化したバージョン
import { supabase } from './supabase'

const DEV_BYPASS =
  import.meta.env.DEV && import.meta.env.VITE_AUTH_BYPASS === 'true'

// DEV モード用の擬似ストア (in-memory). リロードでリセット。
const devStore = {
  messages: [
    {
      id: 'dev-msg-sent-1',
      title: '5月のリピーター割引',
      status: 'sent',
      sent_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      recipient_count: 124, delivered_count: 120, failed_count: 4,
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      target_segment_id: 'dev-seg-1', line_target_segments: { name: '推奨者の女性' }
    },
    {
      id: 'dev-msg-sent-2',
      title: 'GW 限定クーポン',
      status: 'sent',
      sent_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      recipient_count: 88, delivered_count: 88, failed_count: 0,
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      target_segment_id: null, line_target_segments: null
    },
    {
      id: 'dev-msg-draft-1',
      title: '誕生日月のお祝いメッセージ',
      status: 'draft',
      created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      target_segment_id: null, line_target_segments: null
    }
  ],
  coupons: [
    {
      id: 'dev-cp-1', title: '次回 10% OFF', name: '次回 10% OFF',
      description: '次回ご来店時にご利用いただけます。',
      image_url: null, code: null,
      reward_type: 'discount', reward_price_info_type: 'percentage', reward_percentage: 10,
      reward_currency: 'JPY',
      acquisition_type: 'normal',
      max_use_count_per_ticket: 1, visibility: 'UNLISTED',
      usage_condition: '1,000円以上のご注文時に有効。他クーポンとの併用不可。',
      start_at: null,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      is_active: true,
      created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'dev-cp-2', title: '抽選で 1 名にディナー無料', name: '抽選で 1 名にディナー無料',
      description: '応募いただいた方の中から抽選で 1 名にディナーコース無料券をプレゼント。',
      image_url: null,
      reward_type: 'free',
      acquisition_type: 'lottery',
      acquisition_lottery_probability: 1,
      acquisition_max_acquire_count: 1,
      max_use_count_per_ticket: 1,
      expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      is_active: true,
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    }
  ],
  segments: [
    {
      id: 'dev-seg-1', name: '推奨者の女性', description: 'NPS 9-10 + 女性',
      conditions: { nps_segments: ['promoter'], genders: ['女性'] },
      created_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'dev-seg-2', name: 'リピーター (3 回以上)', description: null,
      conditions: { visit_counts: ['3回目', '4回目', '5回目', '6回目~10回目', '11回目以上'] },
      created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
    }
  ]
}

const withAuthHeaders = async (body) => {
  const { data: { session } } = await supabase.auth.getSession()
  return {
    body,
    headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined
  }
}

// ============================================================================
// LINE 接続依頼 (Google Chat へ通知)
// ============================================================================
export async function requestLineConnection(storeId) {
  const opts = await withAuthHeaders({ store_id: storeId })
  const { data, error } = await supabase.functions.invoke('request-line-connection', opts)
  if (error) throw error
  if (data && data.success === false) throw new Error(data.error || '依頼の送信に失敗しました')
  return data
}

// 企業の LINE 接続状態を直接取得 (companies テーブル直読み)
// 接続済の判定: line_messaging_enabled かつ vault token がある (OpenReviewApp 設定保存後)
// 依頼済の判定: line_connection_requested_at に値がある
export async function fetchLineConnectionState(companyId) {
  if (!companyId) return { enabled: false, requested_at: null }
  const { data, error } = await supabase
    .from('companies')
    .select('line_messaging_enabled, line_channel_access_token_vault_id, line_connection_requested_at')
    .eq('id', companyId)
    .maybeSingle()
  if (error) {
    console.warn('fetchLineConnectionState failed:', error.message)
    return { enabled: false, requested_at: null }
  }
  return {
    enabled: !!(data?.line_messaging_enabled && data?.line_channel_access_token_vault_id),
    requested_at: data?.line_connection_requested_at || null
  }
}

// ============================================================================
// 残数 (quota)
// ============================================================================
export async function fetchLineQuota(companyId) {
  const opts = await withAuthHeaders({ company_id: companyId })
  const { data, error } = await supabase.functions.invoke('get-line-message-quota', opts)
  if (error) throw error
  if (data && data.success === false) throw new Error(data.error || 'quota 取得失敗')
  return data
}

// ============================================================================
// メッセージ
// ============================================================================
export async function fetchMessages(companyId) {
  if (DEV_BYPASS) return [...devStore.messages].sort((a, b) => b.created_at.localeCompare(a.created_at))
  const { data, error } = await supabase
    .from('line_messages')
    .select('*, line_target_segments(name)')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function fetchMessageWithBlocks(messageId) {
  if (DEV_BYPASS) {
    const m = devStore.messages.find(x => x.id === messageId)
    return m ? { ...m, blocks: m.blocks || [{ block_type: 'text', text_content: '(デモのテキスト)' }] } : null
  }
  const { data: message, error: msgErr } = await supabase
    .from('line_messages')
    .select('*')
    .eq('id', messageId)
    .single()
  if (msgErr) throw msgErr
  const { data: blocks, error: bErr } = await supabase
    .from('line_message_blocks')
    .select('*')
    .eq('message_id', messageId)
    .order('display_order', { ascending: true })
  if (bErr) throw bErr
  return { ...message, blocks: blocks || [] }
}

export async function saveMessage({
  id, companyId, title, blocks,
  target_segment_id, target_snapshot,
  notification_disabled, sender_name, sender_icon_url,
  userId,
}) {
  if (DEV_BYPASS) {
    const now = new Date().toISOString()
    if (id) {
      const idx = devStore.messages.findIndex(m => m.id === id)
      if (idx >= 0) devStore.messages[idx] = { ...devStore.messages[idx], title, blocks, target_segment_id, updated_at: now }
      return id
    }
    const newId = 'dev-msg-' + Date.now()
    devStore.messages.unshift({
      id: newId, title, status: 'draft', blocks,
      target_segment_id, line_target_segments: null,
      created_at: now
    })
    return newId
  }
  const messagePayload = {
    title,
    target_segment_id: target_segment_id || null,
    target_snapshot: target_snapshot || null,
    notification_disabled: !!notification_disabled,
    sender_name: sender_name || null,
    sender_icon_url: sender_icon_url || null,
  }

  let messageId = id
  if (!messageId) {
    const { data, error } = await supabase
      .from('line_messages')
      .insert({ ...messagePayload, company_id: companyId, status: 'draft', created_by: userId })
      .select()
      .single()
    if (error) throw error
    messageId = data.id
  } else {
    const { error } = await supabase.from('line_messages').update(messagePayload).eq('id', messageId)
    if (error) throw error
  }

  await supabase.from('line_message_blocks').delete().eq('message_id', messageId)
  if (blocks && blocks.length > 0) {
    const rows = blocks.map((b, i) => ({
      message_id: messageId,
      block_type: b.block_type,
      text_content: b.text_content || null,
      image_url: b.image_url || null,
      link_url: b.link_url || null,
      coupon_id: b.coupon_id || null,
      display_order: i,
    }))
    const { error } = await supabase.from('line_message_blocks').insert(rows)
    if (error) throw error
  }

  return messageId
}

export async function deleteMessage(id) {
  if (DEV_BYPASS) {
    devStore.messages = devStore.messages.filter(m => m.id !== id)
    return
  }
  const { error } = await supabase.from('line_messages').delete().eq('id', id)
  if (error) throw error
}

export async function sendMessage(messageId) {
  if (DEV_BYPASS) {
    const idx = devStore.messages.findIndex(m => m.id === messageId)
    if (idx >= 0) {
      const recipient = 50 + Math.floor(Math.random() * 100)
      const failed = Math.random() < 0.3 ? Math.floor(Math.random() * 5) : 0
      devStore.messages[idx] = {
        ...devStore.messages[idx],
        status: 'sent',
        sent_at: new Date().toISOString(),
        recipient_count: recipient,
        delivered_count: recipient - failed,
        failed_count: failed
      }
      return { recipient_count: recipient, delivered_count: recipient - failed, failed_count: failed }
    }
    return { recipient_count: 0, delivered_count: 0, failed_count: 0 }
  }
  const opts = await withAuthHeaders({ message_id: messageId })
  const { data, error } = await supabase.functions.invoke('send-line-message', opts)
  if (error) throw error
  if (data && data.success === false) throw new Error(data.error || '送信失敗')
  return data
}

// dispatches 履歴を残す (送信成功時に呼ぶ)
export async function logDispatch({ messageId, storeId, companyId, userId, recipientCount, deliveredCount, failedCount, conditions }) {
  const { error } = await supabase.from('line_message_dispatches').insert({
    message_id: messageId,
    store_id: storeId,
    company_id: companyId,
    sent_by: userId,
    status: failedCount === 0 ? 'sent' : (deliveredCount === 0 ? 'failed' : 'sent'),
    recipient_count: recipientCount,
    delivered_count: deliveredCount,
    failed_count: failedCount,
    conditions: conditions || {},
    sent_at: new Date().toISOString()
  })
  if (error) console.error('dispatch insert error', error)
}

export async function fetchDispatches(storeId) {
  const { data, error } = await supabase
    .from('line_message_dispatches')
    .select('*, line_messages(title)')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) throw error
  return data || []
}

// ============================================================================
// クーポン
// ============================================================================
export async function fetchCoupons(companyId) {
  if (DEV_BYPASS) return [...devStore.coupons].sort((a, b) => b.created_at.localeCompare(a.created_at))
  const { data, error } = await supabase
    .from('line_coupons')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function upsertCoupon(payload) {
  if (DEV_BYPASS) {
    const now = new Date().toISOString()
    const data = { ...payload, name: payload.title }
    if (payload.id) {
      const idx = devStore.coupons.findIndex(c => c.id === payload.id)
      if (idx >= 0) devStore.coupons[idx] = { ...devStore.coupons[idx], ...data, updated_at: now }
      return devStore.coupons[idx]
    }
    const newCoupon = { ...data, id: 'dev-cp-' + Date.now(), created_at: now, is_active: true }
    devStore.coupons.unshift(newCoupon)
    return newCoupon
  }
  const {
    id, companyId,
    title, description, image_url,
    code, usage_condition,
    start_at, expires_at,
    reward_type = 'discount',
    reward_price_info_type, reward_fixed_amount, reward_percentage, reward_currency = 'JPY',
    visibility = 'UNLISTED',
    is_active = true,
  } = payload
  const data = {
    company_id: companyId,
    name: title || null,
    title: title || null,
    description: description || null,
    image_url: image_url || null,
    code: code || null,
    usage_condition: usage_condition || null,
    terms_text: usage_condition || null,
    start_at: start_at || null,
    expires_at: expires_at || null,
    reward_type,
    reward_price_info_type: ['fixed', 'percentage'].includes(reward_price_info_type) ? reward_price_info_type : null,
    reward_fixed_amount: reward_fixed_amount != null && reward_fixed_amount !== '' ? Number(reward_fixed_amount) : null,
    reward_percentage: reward_percentage != null && reward_percentage !== '' ? Number(reward_percentage) : null,
    reward_currency,
    coupon_timezone: 'ASIA_TOKYO',
    max_use_count_per_ticket: 1,
    visibility,
    is_active,
  }
  if (id) {
    const { data: row, error } = await supabase.from('line_coupons').update(data).eq('id', id).select().single()
    if (error) throw error
    return row
  }
  const { data: row, error } = await supabase.from('line_coupons').insert(data).select().single()
  if (error) throw error
  return row
}

export async function deleteCoupon(id) {
  if (DEV_BYPASS) {
    devStore.coupons = devStore.coupons.filter(c => c.id !== id)
    return
  }
  const { error } = await supabase.from('line_coupons').delete().eq('id', id)
  if (error) throw error
}

// LINE 公式 Coupon API へクーポンを登録 (POST /v2/bot/coupon)
// 失敗してもメッセージ送信時に Flex Message へフォールバックされる
export async function syncLineCoupon(couponId) {
  if (DEV_BYPASS) return { success: true }
  const opts = await withAuthHeaders({ coupon_id: couponId })
  const { data, error } = await supabase.functions.invoke('sync-line-coupon', opts)
  if (error) throw error
  if (data && data.success === false) throw new Error(data.error || 'LINE 公式クーポン登録失敗')
  return data
}

// ============================================================================
// セグメント
// ============================================================================
export async function fetchSegments(companyId) {
  if (DEV_BYPASS) return [...devStore.segments].sort((a, b) => b.created_at.localeCompare(a.created_at))
  const { data, error } = await supabase
    .from('line_target_segments')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function upsertSegment({ id, companyId, name, description, conditions }) {
  if (DEV_BYPASS) {
    const now = new Date().toISOString()
    if (id) {
      const idx = devStore.segments.findIndex(s => s.id === id)
      if (idx >= 0) devStore.segments[idx] = { ...devStore.segments[idx], name, description, conditions, updated_at: now }
      return devStore.segments[idx]
    }
    const newSeg = { id: 'dev-seg-' + Date.now(), name, description, conditions, created_at: now }
    devStore.segments.unshift(newSeg)
    return newSeg
  }
  const payload = { company_id: companyId, name, description, conditions: conditions || {} }
  if (id) {
    const { data, error } = await supabase.from('line_target_segments').update(payload).eq('id', id).select().single()
    if (error) throw error
    return data
  }
  const { data, error } = await supabase.from('line_target_segments').insert(payload).select().single()
  if (error) throw error
  return data
}

export async function deleteSegment(id) {
  if (DEV_BYPASS) {
    devStore.segments = devStore.segments.filter(s => s.id !== id)
    return
  }
  const { error } = await supabase.from('line_target_segments').delete().eq('id', id)
  if (error) throw error
}

export async function previewAudience({ companyId, conditions }) {
  if (DEV_BYPASS) {
    // 条件数に応じて推定値を返す デモ用
    const c = conditions || {}
    let base = 200
    if (c.nps_segments?.length) base = Math.floor(base * (c.nps_segments.length / 3))
    if (c.genders?.length) base = Math.floor(base * (c.genders.length / 3))
    if (c.age_groups?.length) base = Math.floor(base * Math.max(0.3, c.age_groups.length / 12))
    if (c.visit_counts?.length) base = Math.floor(base * Math.max(0.3, c.visit_counts.length / 7))
    return Math.max(0, base + Math.floor(Math.random() * 20) - 10)
  }
  const opts = await withAuthHeaders({ company_id: companyId, conditions, preview_only: true })
  const { data, error } = await supabase.functions.invoke('compute-line-target-audience', opts)
  if (error) throw error
  if (data && data.success === false) throw new Error(data.error || 'ターゲット計算失敗')
  return data?.count ?? 0
}

// ============================================================================
// 画像アップロード
// ============================================================================
export async function uploadLineImage({ companyId, file }) {
  if (!companyId) throw new Error('企業情報が取得できません')
  if (!file) throw new Error('ファイルが選択されていません')
  const ext = (file.name.split('.').pop() || 'png').toLowerCase()
  const path = `${companyId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const { error } = await supabase.storage.from('line-message-assets').upload(path, file, {
    contentType: file.type || 'image/png',
    upsert: false,
  })
  if (error) {
    console.error('[uploadLineImage] storage error:', error)
    // RLS 拒否時の汎用メッセージ
    if (error.message?.toLowerCase().includes('row-level security')
      || error.message?.toLowerCase().includes('unauthorized')
      || error.statusCode === '403') {
      throw new Error('アップロード権限がありません。店舗責任者でログインしてください。')
    }
    throw new Error(`アップロードに失敗しました: ${error.message || ''}`)
  }
  const { data } = supabase.storage.from('line-message-assets').getPublicUrl(path)
  return data.publicUrl
}

// ============================================================================
// store_id を target_snapshot に必ず混ぜるユーティリティ
// (店舗管理アプリ から送るメッセージは必ず自店舗スコープ)
// ============================================================================
export function withStoreScope(conditions, storeId) {
  return { ...(conditions || {}), store_ids: [storeId] }
}
