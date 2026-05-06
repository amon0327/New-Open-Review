import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Card, TextField, IconButton, Chip, CircularProgress,
  Stack, FormControl, InputLabel, Select, MenuItem, Avatar, Divider, Alert,
  FormControlLabel, Switch,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Accordion, AccordionSummary, AccordionDetails,
} from '@mui/material';
import {
  Add, Delete, Edit, Send, Mail, TextFields, Image as ImageIcon, LocalOffer,
  ArrowUpward, ArrowDownward, Upload, Link as LinkIcon, Visibility,
  EmojiEmotions, OndemandVideo, LocationOn, ArrowBack, ExpandMore, NotificationsOff,
  Notifications, AudioFile,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import {
  fetchMessages, fetchMessageWithBlocks, saveMessage, deleteMessage, sendMessage,
  fetchSegments, fetchCoupons, uploadLineImage, fetchAudienceList,
} from '../../../lib/lineMessaging';
import { usePartnerTheme } from '../../../contexts/PartnerThemeContext';
import ConfirmDialog from './ConfirmDialog';

const newBlock = (type) => {
  const base = {
    block_type: type,
    text_content: null, emojis: null,
    image_url: null, link_url: null, coupon_id: null,
    sticker_package_id: null, sticker_id: null,
    video_url: null, video_tracking_id: null,
    audio_url: null, audio_duration_ms: null,
    location_title: null, location_address: null,
    location_latitude: null, location_longitude: null,
  };
  if (type === 'text') base.text_content = '';
  if (type === 'image') base.image_url = '';
  return base;
};

const emptyMessage = {
  id: null, title: '',
  target_segment_id: '',
  notification_disabled: false,
  sender_name: '',
  sender_icon_url: '',
  quick_reply_items: [],
  custom_aggregation_units: [],
  blocks: [],
};

// LINE Quick Reply の action タイプ仕様
const QR_ACTION_TYPES = [
  { value: 'uri', label: 'リンクを開く' },
  { value: 'message', label: 'メッセージ送信 (固定文)' },
  { value: 'postback', label: 'ポストバック' },
  { value: 'datetimepicker', label: '日時ピッカー' },
  { value: 'camera', label: 'カメラ起動' },
  { value: 'cameraRoll', label: 'カメラロール' },
  { value: 'location', label: '位置情報共有' },
  { value: 'clipboard', label: 'クリップボードコピー' },
];

const STATUS_CHIP = {
  draft: { label: '下書き', sx: { bgcolor: '#e2e8f0', color: '#475569' } },
  sending: { label: '送信中', sx: { bgcolor: '#dbeafe', color: '#1e40af' } },
  sent: { label: '送信済', sx: { bgcolor: '#dcfce7', color: '#166534' } },
  failed: { label: '失敗', sx: { bgcolor: '#fee2e2', color: '#991b1b' } },
};

const BLOCK_LABEL = {
  text: 'テキスト', image: '画像', coupon: 'クーポン',
  sticker: 'スタンプ', video: '動画', location: '位置情報', audio: '音声',
};

export default function MessagesTab({ companyId, user }) {
  const theme = usePartnerTheme();
  const [messages, setMessages] = useState([]);
  const [segments, setSegments] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('list');
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [uploadingIdx, setUploadingIdx] = useState(-1);
  const [uploadingSenderIcon, setUploadingSenderIcon] = useState(false);
  const [audience, setAudience] = useState([]);
  const [audienceCount, setAudienceCount] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmSend, setConfirmSend] = useState(false);

  const load = async () => {
    if (!companyId) return;
    try {
      setLoading(true);
      const [m, s, c] = await Promise.all([fetchMessages(companyId), fetchSegments(companyId), fetchCoupons(companyId)]);
      setMessages(m); setSegments(s); setCoupons(c);
    } catch (e) {
      toast.error('一覧の取得失敗');
    } finally { setLoading(false); }
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [companyId]);

  const openNew = () => {
    setEditing({ ...emptyMessage, blocks: [newBlock('text')] });
    setAudience([]); setAudienceCount(null);
    setMode('form');
  };
  const openEdit = async (m) => {
    try {
      const full = await fetchMessageWithBlocks(m.id);
      setEditing({
        id: full.id,
        title: full.title || '',
        target_segment_id: full.target_segment_id || '',
        notification_disabled: !!full.notification_disabled,
        sender_name: full.sender_name || '',
        sender_icon_url: full.sender_icon_url || '',
        quick_reply_items: Array.isArray(full.quick_reply_items) ? full.quick_reply_items : [],
        custom_aggregation_units: Array.isArray(full.custom_aggregation_units) ? full.custom_aggregation_units : [],
        blocks: full.blocks.length > 0 ? full.blocks : [newBlock('text')],
      });
      setAudience([]); setAudienceCount(null);
      setMode('form');
    } catch (e) { toast.error('読み込み失敗'); }
  };
  const backToList = () => { setEditing(null); setMode('list'); };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteMessage(confirmDelete.id);
      toast.success('削除しました');
      setConfirmDelete(null);
      await load();
    } catch (e) { toast.error(e?.message || '削除失敗'); }
  };

  const validate = () => {
    if (!editing.title.trim()) return 'タイトルを入力してください';
    if (editing.blocks.length === 0) return 'ブロックを1つ以上追加してください';
    if (editing.blocks.length > 5) return 'ブロックは最大5個までです (LINE 仕様)';
    return null;
  };

  const handleSave = async () => {
    const err = validate();
    if (err) return toast.error(err);
    try {
      setSaving(true);
      await saveMessage({
        id: editing.id, companyId,
        title: editing.title.trim(),
        target_segment_id: editing.target_segment_id || null,
        target_snapshot: null,
        notification_disabled: editing.notification_disabled,
        sender_name: editing.sender_name?.trim() || null,
        sender_icon_url: editing.sender_icon_url || null,
        quick_reply_items: (editing.quick_reply_items || []).filter(q => q?.action?.label),
        custom_aggregation_units: (editing.custom_aggregation_units || []).filter(Boolean),
        blocks: editing.blocks,
        userId: user?.id,
      });
      toast.success('保存しました');
      backToList();
      await load();
    } catch (e) {
      toast.error(e?.message || '保存失敗');
    } finally { setSaving(false); }
  };

  const handleSend = async () => {
    setConfirmSend(false);
    const err = validate();
    if (err) return toast.error(err);
    try {
      setSending(true);
      const messageId = await saveMessage({
        id: editing.id, companyId,
        title: editing.title.trim(),
        target_segment_id: editing.target_segment_id || null,
        target_snapshot: null,
        notification_disabled: editing.notification_disabled,
        sender_name: editing.sender_name?.trim() || null,
        sender_icon_url: editing.sender_icon_url || null,
        quick_reply_items: (editing.quick_reply_items || []).filter(q => q?.action?.label),
        custom_aggregation_units: (editing.custom_aggregation_units || []).filter(Boolean),
        blocks: editing.blocks,
        userId: user?.id,
      });
      const res = await sendMessage(messageId);
      toast.success(`送信完了: ${res.delivered_count} / ${res.recipient_count} 名`);
      backToList();
      await load();
    } catch (e) {
      toast.error(e?.message || '送信失敗');
    } finally { setSending(false); }
  };

  const updateBlock = (i, patch) => {
    const blocks = [...editing.blocks];
    blocks[i] = { ...blocks[i], ...patch };
    setEditing({ ...editing, blocks });
  };
  const moveBlock = (i, dir) => {
    const blocks = [...editing.blocks];
    const j = i + dir;
    if (j < 0 || j >= blocks.length) return;
    [blocks[i], blocks[j]] = [blocks[j], blocks[i]];
    setEditing({ ...editing, blocks });
  };
  const removeBlock = (i) => setEditing({ ...editing, blocks: editing.blocks.filter((_, idx) => idx !== i) });

  const handleImageUpload = async (i, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingIdx(i);
      const url = await uploadLineImage({ companyId, file });
      updateBlock(i, { image_url: url });
      toast.success('画像をアップロード');
    } catch (err) {
      toast.error(err?.message || 'アップロード失敗');
    } finally {
      setUploadingIdx(-1);
      e.target.value = '';
    }
  };

  const handleSenderIconUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingSenderIcon(true);
      const url = await uploadLineImage({ companyId, file });
      setEditing({ ...editing, sender_icon_url: url });
      toast.success('送信元アイコンをアップロード');
    } catch (err) {
      toast.error(err?.message || 'アップロード失敗');
    } finally {
      setUploadingSenderIcon(false);
      e.target.value = '';
    }
  };

  const handlePreviewAudience = async () => {
    try {
      let conditions = {};
      if (editing.target_segment_id) {
        const s = segments.find(x => x.id === editing.target_segment_id);
        conditions = s?.conditions || {};
      }
      const list = await fetchAudienceList({ companyId, conditions, limit: 500 });
      setAudience(list);
      setAudienceCount(list.length);
    } catch (e) { toast.error(e?.message || 'プレビュー失敗'); }
  };

  // Quick Reply (LINE 全 action タイプ対応)
  const addQuickReply = () => {
    if ((editing.quick_reply_items || []).length >= 13) {
      return toast.error('クイックリプライは最大13個');
    }
    setEditing({
      ...editing,
      quick_reply_items: [
        ...(editing.quick_reply_items || []),
        { type: 'action', imageUrl: null, action: { type: 'uri', label: '', uri: '' } },
      ],
    });
  };
  const updateQRAction = (i, patchAction) => {
    const items = [...(editing.quick_reply_items || [])];
    items[i] = { ...items[i], action: { ...items[i].action, ...patchAction } };
    setEditing({ ...editing, quick_reply_items: items });
  };
  const changeQRType = (i, newType) => {
    const items = [...(editing.quick_reply_items || [])];
    const oldLabel = items[i]?.action?.label || '';
    let action;
    switch (newType) {
      case 'uri': action = { type: 'uri', label: oldLabel, uri: '' }; break;
      case 'message': action = { type: 'message', label: oldLabel, text: '' }; break;
      case 'postback': action = { type: 'postback', label: oldLabel, data: '', displayText: '' }; break;
      case 'datetimepicker': action = { type: 'datetimepicker', label: oldLabel, data: '', mode: 'date' }; break;
      case 'camera': action = { type: 'camera', label: oldLabel || 'カメラ' }; break;
      case 'cameraRoll': action = { type: 'cameraRoll', label: oldLabel || '写真選択' }; break;
      case 'location': action = { type: 'location', label: oldLabel || '位置共有' }; break;
      case 'clipboard': action = { type: 'clipboardAction', label: oldLabel, clipboardText: '' }; break;
      default: action = { type: 'uri', label: oldLabel, uri: '' };
    }
    items[i] = { ...items[i], action };
    setEditing({ ...editing, quick_reply_items: items });
  };
  const removeQuickReply = (i) => setEditing({
    ...editing, quick_reply_items: (editing.quick_reply_items || []).filter((_, idx) => idx !== i),
  });

  // Custom Aggregation Units
  const updateCAU = (val) => {
    const arr = (val || '').split(',').map(s => s.trim()).filter(Boolean).slice(0, 1);
    setEditing({ ...editing, custom_aggregation_units: arr });
  };

  const renderBlockEditor = (b, i) => (
    <Card key={i} variant="outlined" sx={{ p: 2, borderRadius: 1, mb: 1.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
        <Chip size="small" label={`${i + 1}. ${BLOCK_LABEL[b.block_type]}`}
          sx={{ bgcolor: theme.primaryAlpha10 || `${theme.primary}1a`, color: theme.primary, fontWeight: 600 }} />
        <Box sx={{ flex: 1 }} />
        <IconButton size="small" disabled={i === 0} onClick={() => moveBlock(i, -1)}><ArrowUpward fontSize="small" /></IconButton>
        <IconButton size="small" disabled={i === editing.blocks.length - 1} onClick={() => moveBlock(i, 1)}><ArrowDownward fontSize="small" /></IconButton>
        <IconButton size="small" sx={{ color: '#ef4444' }} onClick={() => removeBlock(i)}><Delete fontSize="small" /></IconButton>
      </Box>

      {b.block_type === 'text' && (
        <Stack spacing={1.5}>
          <TextField fullWidth multiline rows={3} placeholder="本文 (5000字まで)。{{company_name}} で企業名を埋め込み"
            value={b.text_content || ''}
            onChange={(e) => updateBlock(i, { text_content: e.target.value })} />
          <Accordion variant="outlined">
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="caption" sx={{ fontWeight: 600 }}>LINE 公式絵文字 (emojis)</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <TextField fullWidth size="small" multiline rows={3}
                placeholder='[{"index":0,"productId":"5ac1bfd5040ab15980c9b435","emojiId":"001"}]'
                value={b.emojis ? JSON.stringify(b.emojis, null, 2) : ''}
                onChange={(e) => {
                  const v = e.target.value.trim();
                  if (!v) { updateBlock(i, { emojis: null }); return; }
                  try { updateBlock(i, { emojis: JSON.parse(v) }); }
                  catch { updateBlock(i, { emojis: v }); }
                }}
                helperText="本文中の $ 位置 (index) に LINE 公式絵文字を埋め込み。JSON 配列で入力。"
              />
            </AccordionDetails>
          </Accordion>
        </Stack>
      )}

      {b.block_type === 'image' && (
        <Stack spacing={1.5}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {b.image_url ? (
              <Avatar src={b.image_url} variant="rounded" sx={{ width: 120, height: 80 }} />
            ) : (
              <Avatar variant="rounded" sx={{ width: 120, height: 80, bgcolor: '#f1f5f9' }}>
                <ImageIcon sx={{ color: '#94a3b8' }} />
              </Avatar>
            )}
            <Button component="label" variant="outlined" startIcon={<Upload />} disabled={uploadingIdx === i}>
              {uploadingIdx === i ? '...' : '画像を選択'}
              <input type="file" accept="image/*" hidden onChange={(e) => handleImageUpload(i, e)} />
            </Button>
            {b.image_url && <Button size="small" color="error" onClick={() => updateBlock(i, { image_url: '' })}>削除</Button>}
          </Box>
          <TextField fullWidth size="small" label="リンク URL (任意)" placeholder="https://..."
            value={b.link_url || ''}
            onChange={(e) => updateBlock(i, { link_url: e.target.value || null })}
            InputProps={{ startAdornment: <LinkIcon fontSize="small" sx={{ mr: 1, color: '#94a3b8' }} /> }}
            helperText="設定すると画像タップでリンクに飛びます"
          />
        </Stack>
      )}

      {b.block_type === 'coupon' && (
        <FormControl fullWidth>
          <InputLabel>クーポンを選択</InputLabel>
          <Select value={b.coupon_id || ''}
            onChange={(e) => updateBlock(i, { coupon_id: e.target.value })}
            label="クーポンを選択"
          >
            <MenuItem value=""><em>選択してください</em></MenuItem>
            {coupons.map((c) => (
              <MenuItem key={c.id} value={c.id}>{c.name}{c.discount_text ? ` (${c.discount_text})` : ''}</MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {b.block_type === 'sticker' && (
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField label="packageId *" type="number" size="small" fullWidth
            value={b.sticker_package_id ?? ''}
            onChange={(e) => updateBlock(i, { sticker_package_id: e.target.value })}
            helperText="LINE 公式スタンプ packageId (例: 446)" />
          <TextField label="stickerId *" type="number" size="small" fullWidth
            value={b.sticker_id ?? ''}
            onChange={(e) => updateBlock(i, { sticker_id: e.target.value })}
            helperText="例: 1988" />
        </Box>
      )}

      {b.block_type === 'video' && (
        <Stack spacing={1.5}>
          <TextField label="動画 URL (mp4) *" fullWidth size="small"
            value={b.video_url || ''}
            onChange={(e) => updateBlock(i, { video_url: e.target.value })}
            placeholder="https://.../video.mp4" />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {b.image_url ? (
              <Avatar src={b.image_url} variant="rounded" sx={{ width: 120, height: 80 }} />
            ) : (
              <Avatar variant="rounded" sx={{ width: 120, height: 80, bgcolor: '#f1f5f9' }}>
                <ImageIcon sx={{ color: '#94a3b8' }} />
              </Avatar>
            )}
            <Button component="label" variant="outlined" size="small" startIcon={<Upload />} disabled={uploadingIdx === i}>
              {uploadingIdx === i ? '...' : 'プレビュー画像'}
              <input type="file" accept="image/*" hidden onChange={(e) => handleImageUpload(i, e)} />
            </Button>
          </Box>
          <TextField label="trackingId (任意)" fullWidth size="small"
            value={b.video_tracking_id || ''}
            onChange={(e) => updateBlock(i, { video_tracking_id: e.target.value })}
            helperText="動画再生分析用。LINE Insights API で取得時のトラッキング ID" />
        </Stack>
      )}

      {b.block_type === 'audio' && (
        <Stack spacing={1.5}>
          <TextField label="音声 URL (m4a) *" fullWidth size="small"
            value={b.audio_url || ''}
            onChange={(e) => updateBlock(i, { audio_url: e.target.value })}
            placeholder="https://.../audio.m4a" />
          <TextField label="再生時間 (ミリ秒) *" type="number" fullWidth size="small"
            value={b.audio_duration_ms ?? ''}
            onChange={(e) => updateBlock(i, { audio_duration_ms: e.target.value })}
            helperText="例: 60000 = 60 秒" />
        </Stack>
      )}

      {b.block_type === 'location' && (
        <Stack spacing={1.5}>
          <TextField label="タイトル *" fullWidth size="small"
            value={b.location_title || ''}
            onChange={(e) => updateBlock(i, { location_title: e.target.value })} />
          <TextField label="住所" fullWidth size="small"
            value={b.location_address || ''}
            onChange={(e) => updateBlock(i, { location_address: e.target.value })} />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="緯度 *" type="number" fullWidth size="small"
              value={b.location_latitude ?? ''}
              onChange={(e) => updateBlock(i, { location_latitude: e.target.value })} />
            <TextField label="経度 *" type="number" fullWidth size="small"
              value={b.location_longitude ?? ''}
              onChange={(e) => updateBlock(i, { location_longitude: e.target.value })} />
          </Box>
        </Stack>
      )}
    </Card>
  );

  if (mode === 'form' && editing) {
    return (
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={backToList} sx={{ mr: 1 }}><ArrowBack /></IconButton>
          <Typography variant="h6" sx={{ fontWeight: 700, flex: 1 }}>
            {editing.id ? 'メッセージを編集' : '新規メッセージ'}
          </Typography>
          {editing.id && (
            <Chip {...(STATUS_CHIP.draft)} size="small" />
          )}
        </Box>

        <Card sx={{ p: 3, borderRadius: 1, boxShadow: '0 4px 12px rgba(0,0,0,0.06)', mb: 2 }}>
          <Stack spacing={2.5}>
            <TextField label="タイトル (管理用) *" fullWidth value={editing.title}
              onChange={(e) => setEditing({ ...editing, title: e.target.value })} />

            <Divider><Chip label="ターゲット" size="small" /></Divider>

            <FormControl fullWidth>
              <InputLabel>送信先セグメント</InputLabel>
              <Select value={editing.target_segment_id}
                onChange={(e) => { setEditing({ ...editing, target_segment_id: e.target.value }); setAudience([]); setAudienceCount(null); }}
                label="送信先セグメント"
              >
                <MenuItem value=""><em>全 LINE 連携回答者</em></MenuItem>
                {segments.map((s) => (
                  <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Button startIcon={<Visibility />} onClick={handlePreviewAudience} variant="outlined" size="small">
                対象ユーザーを表示
              </Button>
              {audienceCount !== null && (
                <Alert severity="info" sx={{ flex: 1, py: 0 }}>
                  対象 LINE ユーザー数: <strong>{audienceCount}</strong> 名
                </Alert>
              )}
            </Box>

            {audience.length > 0 && (
              <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 300 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>表示名</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>LINE userId</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">回答回数</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>最終回答日</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {audience.map((a) => (
                      <TableRow key={a.line_user_id} hover>
                        <TableCell>{a.display_name}</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#64748b' }}>
                          {a.line_user_id?.slice(0, 8)}...
                        </TableCell>
                        <TableCell align="right">{a.answer_count}</TableCell>
                        <TableCell>{a.last_answered_at ? new Date(a.last_answered_at).toLocaleString('ja-JP') : '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            <Divider><Chip label="メッセージ内容" size="small" /></Divider>

            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              ブロック (最大5個 / 上から順に送信)
            </Typography>

            <Box>
              {editing.blocks.map((b, i) => renderBlockEditor(b, i))}
            </Box>

            {editing.blocks.length < 5 && (
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {[
                  { type: 'text', icon: <TextFields />, label: 'テキスト' },
                  { type: 'image', icon: <ImageIcon />, label: '画像' },
                  { type: 'coupon', icon: <LocalOffer />, label: 'クーポン' },
                  { type: 'sticker', icon: <EmojiEmotions />, label: 'スタンプ' },
                  { type: 'video', icon: <OndemandVideo />, label: '動画' },
                  { type: 'audio', icon: <AudioFile />, label: '音声' },
                  { type: 'location', icon: <LocationOn />, label: '位置情報' },
                ].map((opt) => (
                  <Button key={opt.type} size="small" startIcon={opt.icon} variant="outlined"
                    onClick={() => setEditing({ ...editing, blocks: [...editing.blocks, newBlock(opt.type)] })}
                    sx={{ borderColor: theme.primary, color: theme.primary,
                      '&:hover': { borderColor: theme.primary, background: theme.primaryAlpha10 } }}>
                    {opt.label}
                  </Button>
                ))}
              </Box>
            )}

            <Divider><Chip label="詳細オプション" size="small" /></Divider>

            <Accordion variant="outlined">
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>送信元の表示 (sender)</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={2}>
                  <TextField label="送信元名" fullWidth size="small"
                    helperText="未入力なら LINE 公式アカウントの設定が使われる"
                    value={editing.sender_name}
                    onChange={(e) => setEditing({ ...editing, sender_name: e.target.value })} />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {editing.sender_icon_url ? (
                      <Avatar src={editing.sender_icon_url} sx={{ width: 64, height: 64 }} />
                    ) : (
                      <Avatar sx={{ width: 64, height: 64, bgcolor: '#f1f5f9' }}>
                        <ImageIcon sx={{ color: '#94a3b8' }} />
                      </Avatar>
                    )}
                    <Button component="label" startIcon={<Upload />} variant="outlined" size="small" disabled={uploadingSenderIcon}>
                      {uploadingSenderIcon ? '...' : 'アイコン選択'}
                      <input type="file" accept="image/*" hidden onChange={handleSenderIconUpload} />
                    </Button>
                    {editing.sender_icon_url && (
                      <Button size="small" color="error" onClick={() => setEditing({ ...editing, sender_icon_url: '' })}>削除</Button>
                    )}
                  </Box>
                </Stack>
              </AccordionDetails>
            </Accordion>

            <Accordion variant="outlined">
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  クイックリプライ (最後のメッセージに付与 / 最大13件 / 全アクションタイプ対応)
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={2}>
                  {(editing.quick_reply_items || []).map((q, i) => {
                    const a = q.action || {};
                    return (
                      <Card key={i} variant="outlined" sx={{ p: 1.5, borderRadius: 1 }}>
                        <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                          <FormControl size="small" sx={{ minWidth: 180 }}>
                            <InputLabel>アクション種別</InputLabel>
                            <Select label="アクション種別" value={a.type || 'uri'}
                              onChange={(e) => changeQRType(i, e.target.value)}>
                              {QR_ACTION_TYPES.map((t) => (
                                <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                          <TextField label="ラベル *" size="small" sx={{ flex: 1 }}
                            value={a.label || ''}
                            onChange={(e) => updateQRAction(i, { label: e.target.value })} />
                          <IconButton size="small" sx={{ color: '#ef4444' }} onClick={() => removeQuickReply(i)}>
                            <Delete fontSize="small" />
                          </IconButton>
                        </Box>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          {a.type === 'uri' && (
                            <TextField label="URI" size="small" fullWidth placeholder="https://..."
                              value={a.uri || ''} onChange={(e) => updateQRAction(i, { uri: e.target.value })} />
                          )}
                          {a.type === 'message' && (
                            <TextField label="送信テキスト" size="small" fullWidth
                              value={a.text || ''} onChange={(e) => updateQRAction(i, { text: e.target.value })}
                              helperText="タップ時にユーザーがこのテキストを送信" />
                          )}
                          {a.type === 'postback' && (
                            <>
                              <TextField label="data (postback で送信)" size="small" fullWidth
                                value={a.data || ''} onChange={(e) => updateQRAction(i, { data: e.target.value })} />
                              <TextField label="表示テキスト (任意)" size="small" fullWidth
                                value={a.displayText || ''} onChange={(e) => updateQRAction(i, { displayText: e.target.value })} />
                            </>
                          )}
                          {a.type === 'datetimepicker' && (
                            <>
                              <FormControl size="small" sx={{ minWidth: 160 }}>
                                <InputLabel>モード</InputLabel>
                                <Select label="モード" value={a.mode || 'date'}
                                  onChange={(e) => updateQRAction(i, { mode: e.target.value })}>
                                  <MenuItem value="date">date (日付)</MenuItem>
                                  <MenuItem value="time">time (時刻)</MenuItem>
                                  <MenuItem value="datetime">datetime (両方)</MenuItem>
                                </Select>
                              </FormControl>
                              <TextField label="data" size="small" fullWidth
                                value={a.data || ''} onChange={(e) => updateQRAction(i, { data: e.target.value })} />
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <TextField label="initial (任意)" size="small" sx={{ flex: 1 }}
                                  value={a.initial || ''} onChange={(e) => updateQRAction(i, { initial: e.target.value })}
                                  placeholder="2026-05-06" />
                                <TextField label="min (任意)" size="small" sx={{ flex: 1 }}
                                  value={a.min || ''} onChange={(e) => updateQRAction(i, { min: e.target.value })} />
                                <TextField label="max (任意)" size="small" sx={{ flex: 1 }}
                                  value={a.max || ''} onChange={(e) => updateQRAction(i, { max: e.target.value })} />
                              </Box>
                            </>
                          )}
                          {a.type === 'clipboardAction' && (
                            <TextField label="クリップボードに貼り付ける文字列" size="small" fullWidth
                              value={a.clipboardText || ''}
                              onChange={(e) => updateQRAction(i, { clipboardText: e.target.value })} />
                          )}
                          {(a.type === 'camera' || a.type === 'cameraRoll' || a.type === 'location') && (
                            <Typography variant="caption" color="text.secondary">
                              このアクションは追加パラメータ不要 (LINE 標準動作)
                            </Typography>
                          )}
                        </Box>
                      </Card>
                    );
                  })}
                  <Button size="small" startIcon={<Add />} onClick={addQuickReply} variant="outlined"
                    sx={{ alignSelf: 'flex-start', borderColor: theme.primary, color: theme.primary }}>
                    クイックリプライを追加
                  </Button>
                </Stack>
              </AccordionDetails>
            </Accordion>

            <Accordion variant="outlined">
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>集計単位 (customAggregationUnits)</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <TextField fullWidth size="small"
                  label="集計タグ (英数 + アンダースコア / 最大1個)"
                  value={(editing.custom_aggregation_units || []).join(', ')}
                  onChange={(e) => updateCAU(e.target.value)}
                  helperText="LINE 公式アカウントマネージャーの「メッセージ配信効果計測」で集計するためのタグ。例: campaign_2026_may"
                />
              </AccordionDetails>
            </Accordion>

            <FormControlLabel
              control={
                <Switch checked={editing.notification_disabled}
                  onChange={(e) => setEditing({ ...editing, notification_disabled: e.target.checked })} />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {editing.notification_disabled ? <NotificationsOff fontSize="small" /> : <Notifications fontSize="small" />}
                  サイレント送信 (受信者にプッシュ通知しない)
                </Box>
              }
            />

            <Divider />

            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', pt: 1 }}>
              <Button onClick={backToList}>キャンセル</Button>
              <Button onClick={handleSave} disabled={saving} variant="outlined"
                sx={{ borderColor: theme.primary, color: theme.primary }}>
                {saving ? <CircularProgress size={20} /> : '下書き保存'}
              </Button>
              <Button onClick={() => setConfirmSend(true)} disabled={sending || saving} variant="contained" startIcon={<Send />}
                sx={{
                  background: theme.primaryGradient || theme.primary, color: 'white', px: 3,
                  '&:hover': { background: theme.primaryGradient || theme.primary, opacity: 0.9 },
                }}>
                {sending ? <CircularProgress size={20} sx={{ color: 'white' }} /> : '送信'}
              </Button>
            </Box>
          </Stack>
        </Card>

        <ConfirmDialog
          open={confirmSend}
          title="メッセージを送信"
          message={`「${editing.title}」を ${audienceCount ?? '対象'} 名に送信します。よろしいですか?\n送信後の取り消しはできません。`}
          confirmLabel="送信する"
          onConfirm={handleSend}
          onCancel={() => setConfirmSend(false)}
        />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', mb: 3, alignItems: 'center' }}>
        <Typography variant="h6" sx={{ fontWeight: 700, flex: 1 }}>メッセージ</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={openNew}
          sx={{
            background: theme.primaryGradient || theme.primary, color: 'white', px: 3,
            '&:hover': { background: theme.primaryGradient || theme.primary, opacity: 0.9 },
          }}>
          新規メッセージ
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress sx={{ color: theme.primary }} /></Box>
      ) : messages.length === 0 ? (
        <Card sx={{ p: 6, textAlign: 'center', borderRadius: 1 }}>
          <Mail sx={{ fontSize: 48, color: '#cbd5e1', mb: 1 }} />
          <Typography color="text.secondary">メッセージがまだありません</Typography>
        </Card>
      ) : (
        <Stack spacing={1.5}>
          {messages.map((m) => {
            const status = STATUS_CHIP[m.status] || STATUS_CHIP.draft;
            return (
              <Card key={m.id} sx={{ borderRadius: 1, p: 2, cursor: 'pointer', transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', gap: 2,
                '&:hover': { boxShadow: '0 6px 18px rgba(0,0,0,0.1)', transform: 'translateY(-1px)' },
              }} onClick={() => openEdit(m)}>
                <Box sx={{
                  width: 48, height: 48, borderRadius: 1,
                  background: theme.primaryAlpha10 || `${theme.primary}1a`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Mail sx={{ color: theme.primary }} />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.5 }}>
                    <Typography sx={{ fontWeight: 700 }}>{m.title}</Typography>
                    <Chip label={status.label} size="small" sx={status.sx} />
                    {m.line_target_segments?.name && (
                      <Chip label={`→ ${m.line_target_segments.name}`} size="small" variant="outlined" />
                    )}
                  </Box>
                  {m.status === 'sent' ? (
                    <Typography variant="caption" color="text.secondary">
                      送信日時: {new Date(m.sent_at).toLocaleString('ja-JP')} / 配信 {m.delivered_count} / {m.recipient_count} 名
                      {m.failed_count > 0 && <span style={{ color: '#ef4444' }}> (失敗 {m.failed_count})</span>}
                    </Typography>
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      作成: {new Date(m.created_at).toLocaleString('ja-JP')}
                    </Typography>
                  )}
                </Box>
                <Box>
                  <IconButton onClick={(e) => { e.stopPropagation(); openEdit(m); }}><Edit /></IconButton>
                  <IconButton onClick={(e) => { e.stopPropagation(); setConfirmDelete(m); }} sx={{ color: '#ef4444' }}><Delete /></IconButton>
                </Box>
              </Card>
            );
          })}
        </Stack>
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        title="メッセージを削除"
        message={`「${confirmDelete?.title}」を削除します。よろしいですか?`}
        confirmLabel="削除"
        danger
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </Box>
  );
}
