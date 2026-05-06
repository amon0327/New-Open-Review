import { supabase } from './supabase';

// ============================================================================
// LINE 連携設定 (Channel 認証情報)
// ============================================================================

export async function fetchLineSettings(companyId) {
  const { data, error } = await supabase
    .from('companies')
    .select('id, line_channel_id, line_basic_id, line_messaging_enabled, line_messaging_updated_at, line_channel_secret_vault_id, line_channel_access_token_vault_id')
    .eq('id', companyId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateLineCredentials({ companyId, channelId, basicId, channelSecret, channelAccessToken }) {
  const { data: { session } } = await supabase.auth.getSession();
  const { data, error } = await supabase.functions.invoke('update-line-channel-credentials', {
    body: {
      company_id: companyId,
      channel_id: channelId,
      basic_id: basicId,
      channel_secret: channelSecret,
      channel_access_token: channelAccessToken,
    },
    headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined,
  });
  if (error) throw error;
  if (data && data.success === false) throw new Error(data.error || 'LINE 連携設定の保存に失敗');
  return data;
}

// ============================================================================
// クーポン
// ============================================================================

export async function fetchCoupons(companyId) {
  const { data, error } = await supabase
    .from('line_coupons')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function upsertCoupon({
  id, companyId, name, description, image_url, code, discount_text,
  start_at, expires_at, terms_text, is_active = true,
  bubble_size, background_color, header_text, header_color,
  cta_label, cta_uri, cta_color,
}) {
  const payload = {
    company_id: companyId, name, description, image_url, code, discount_text,
    start_at: start_at || null, expires_at: expires_at || null,
    terms_text, is_active,
    bubble_size: bubble_size || 'kilo',
    background_color: background_color || null,
    header_text: header_text || null,
    header_color: header_color || null,
    cta_label: cta_label || null,
    cta_uri: cta_uri || null,
    cta_color: cta_color || null,
  };
  if (id) {
    const { data, error } = await supabase.from('line_coupons').update(payload).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }
  const { data, error } = await supabase.from('line_coupons').insert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function deleteCoupon(id) {
  const { error } = await supabase.from('line_coupons').delete().eq('id', id);
  if (error) throw error;
}

// ============================================================================
// ターゲットセグメント
// ============================================================================

export async function fetchSegments(companyId) {
  const { data, error } = await supabase
    .from('line_target_segments')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function upsertSegment({ id, companyId, name, description, conditions }) {
  const payload = { company_id: companyId, name, description, conditions: conditions || {} };
  if (id) {
    const { data, error } = await supabase.from('line_target_segments').update(payload).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }
  const { data, error } = await supabase.from('line_target_segments').insert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function deleteSegment(id) {
  const { error } = await supabase.from('line_target_segments').delete().eq('id', id);
  if (error) throw error;
}

export async function previewAudience({ companyId, conditions }) {
  const { data: { session } } = await supabase.auth.getSession();
  const { data, error } = await supabase.functions.invoke('compute-line-target-audience', {
    body: { company_id: companyId, conditions, preview_only: true },
    headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined,
  });
  if (error) throw error;
  if (data && data.success === false) throw new Error(data.error || 'ターゲット計算失敗');
  return data?.count ?? 0;
}

// 配信対象の詳細リスト (line_user_id + display_name + last_answered_at + answer_count)
export async function fetchAudienceList({ companyId, conditions, limit = 1000 }) {
  const { data: { session } } = await supabase.auth.getSession();
  const { data, error } = await supabase.functions.invoke('compute-line-target-audience', {
    body: { company_id: companyId, conditions, preview_only: false, limit },
    headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined,
  });
  if (error) throw error;
  if (data && data.success === false) throw new Error(data.error || 'ターゲット計算失敗');
  return data?.audience ?? [];
}

// ============================================================================
// メッセージ
// ============================================================================

export async function fetchMessages(companyId) {
  const { data, error } = await supabase
    .from('line_messages')
    .select('*, line_target_segments(name)')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function fetchMessageWithBlocks(messageId) {
  const { data: message, error: msgErr } = await supabase
    .from('line_messages')
    .select('*')
    .eq('id', messageId)
    .single();
  if (msgErr) throw msgErr;
  const { data: blocks, error: bErr } = await supabase
    .from('line_message_blocks')
    .select('*')
    .eq('message_id', messageId)
    .order('display_order', { ascending: true });
  if (bErr) throw bErr;
  return { ...message, blocks: blocks || [] };
}

export async function saveMessage({
  id, companyId, title, blocks,
  target_segment_id, target_snapshot,
  notification_disabled, sender_name, sender_icon_url, quick_reply_items,
  custom_aggregation_units,
  userId,
}) {
  const messagePayload = {
    title,
    target_segment_id: target_segment_id || null,
    target_snapshot: target_snapshot || null,
    notification_disabled: !!notification_disabled,
    sender_name: sender_name || null,
    sender_icon_url: sender_icon_url || null,
    quick_reply_items: quick_reply_items && quick_reply_items.length > 0 ? quick_reply_items : null,
    custom_aggregation_units: custom_aggregation_units && custom_aggregation_units.length > 0 ? custom_aggregation_units : null,
  };

  let messageId = id;
  if (!messageId) {
    const { data, error } = await supabase
      .from('line_messages')
      .insert({ ...messagePayload, company_id: companyId, status: 'draft', created_by: userId })
      .select()
      .single();
    if (error) throw error;
    messageId = data.id;
  } else {
    const { error } = await supabase.from('line_messages').update(messagePayload).eq('id', messageId);
    if (error) throw error;
  }

  await supabase.from('line_message_blocks').delete().eq('message_id', messageId);
  if (blocks && blocks.length > 0) {
    const rows = blocks.map((b, i) => ({
      message_id: messageId,
      block_type: b.block_type,
      text_content: b.text_content || null,
      emojis: Array.isArray(b.emojis) && b.emojis.length > 0 ? b.emojis : null,
      image_url: b.image_url || null,
      link_url: b.link_url || null,
      coupon_id: b.coupon_id || null,
      sticker_package_id: b.sticker_package_id != null && b.sticker_package_id !== '' ? Number(b.sticker_package_id) : null,
      sticker_id: b.sticker_id != null && b.sticker_id !== '' ? Number(b.sticker_id) : null,
      video_url: b.video_url || null,
      video_tracking_id: b.video_tracking_id || null,
      audio_url: b.audio_url || null,
      audio_duration_ms: b.audio_duration_ms != null && b.audio_duration_ms !== '' ? Number(b.audio_duration_ms) : null,
      location_title: b.location_title || null,
      location_address: b.location_address || null,
      location_latitude: b.location_latitude !== '' && b.location_latitude != null ? Number(b.location_latitude) : null,
      location_longitude: b.location_longitude !== '' && b.location_longitude != null ? Number(b.location_longitude) : null,
      display_order: i,
    }));
    const { error } = await supabase.from('line_message_blocks').insert(rows);
    if (error) throw error;
  }

  return messageId;
}

export async function deleteMessage(id) {
  const { error } = await supabase.from('line_messages').delete().eq('id', id);
  if (error) throw error;
}

export async function sendMessage(messageId) {
  const { data: { session } } = await supabase.auth.getSession();
  const { data, error } = await supabase.functions.invoke('send-line-message', {
    body: { message_id: messageId },
    headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined,
  });
  if (error) throw error;
  if (data && data.success === false) throw new Error(data.error || '送信失敗');
  return data;
}

// ============================================================================
// 画像アップロード
// ============================================================================

export async function uploadLineImage({ companyId, file }) {
  const ext = (file.name.split('.').pop() || 'png').toLowerCase();
  const path = `${companyId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from('line-message-assets').upload(path, file, {
    contentType: file.type || 'image/png',
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from('line-message-assets').getPublicUrl(path);
  return data.publicUrl;
}

// ============================================================================
// 店舗一覧 (フィルタ用)
// ============================================================================

export async function fetchCompanyStores(companyId) {
  const { data, error } = await supabase
    .from('stores')
    .select('id, name')
    .eq('company_id', companyId)
    .order('name', { ascending: true });
  if (error) throw error;
  return data || [];
}
