import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Card, TextField, IconButton, Chip, CircularProgress,
  Stack, FormControl, InputLabel, Select, MenuItem, Avatar, alpha,
} from '@mui/material';
import {
  Add, Delete, Edit, Send, Mail, TextFields, Image as ImageIcon, LocalOffer,
  ArrowUpward, ArrowDownward, Upload, Link as LinkIcon, Visibility,
  ArrowBack, Save,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import {
  fetchMessages, fetchMessageWithBlocks, saveMessage, deleteMessage, sendMessage,
  fetchSegments, fetchCoupons, uploadLineImage, fetchAudienceList,
} from '../../../lib/lineMessaging';
import { usePartnerTheme } from '../../../contexts/PartnerThemeContext';
import ConfirmDialog from './ConfirmDialog';
import LineAudienceTable from './LineAudienceTable';

const newBlock = (type) => ({
  block_type: type,
  text_content: type === 'text' ? '' : null,
  image_url: type === 'image' ? '' : null,
  link_url: null,
  coupon_id: type === 'coupon' ? '' : null,
});

const emptyMessage = {
  id: null, title: '', target_segment_id: '', blocks: [],
};

const STATUS_CHIP = {
  draft: { label: '下書き', sx: { bgcolor: '#e2e8f0', color: '#475569' } },
  sending: { label: '送信中', sx: { bgcolor: '#dbeafe', color: '#1e40af' } },
  sent: { label: '送信済', sx: { bgcolor: '#dcfce7', color: '#166534' } },
  failed: { label: '失敗', sx: { bgcolor: '#fee2e2', color: '#991b1b' } },
};

const BLOCK_LABEL = { text: 'テキスト', image: '画像', coupon: 'クーポン' };

const optLabel = (text) => (
  <Box component="span">
    {text}
    <Box component="span" sx={{ ml: 0.5, color: '#94a3b8', fontSize: '0.78em' }}>(任意)</Box>
  </Box>
);

function SectionHeader({ title }) {
  const theme = usePartnerTheme();
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2.5 }}>
      <Box sx={{
        width: 4, height: 24, borderRadius: 4,
        background: theme.primaryGradient || theme.primary, mr: 1.5,
      }} />
      <Typography sx={{ fontWeight: 700, fontSize: '1rem' }}>{title}</Typography>
    </Box>
  );
}

export default function MessagesTab({ companyId, user, onFormModeChange }) {
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
  const [audience, setAudience] = useState([]);
  const [audienceLoading, setAudienceLoading] = useState(false);
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

  useEffect(() => {
    onFormModeChange?.(mode === 'form');
    return () => onFormModeChange?.(false);
  }, [mode, onFormModeChange]);

  const openNew = () => {
    setEditing({ ...emptyMessage, blocks: [newBlock('text')] });
    setAudience([]);
    setMode('form');
  };
  const openEdit = async (m) => {
    try {
      const full = await fetchMessageWithBlocks(m.id);
      setEditing({
        id: full.id,
        title: full.title || '',
        target_segment_id: full.target_segment_id || '',
        blocks: (full.blocks || []).filter(b => ['text','image','coupon'].includes(b.block_type)).length > 0
          ? full.blocks.filter(b => ['text','image','coupon'].includes(b.block_type))
          : [newBlock('text')],
      });
      setAudience([]);
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

  const buildPayload = () => ({
    id: editing.id, companyId,
    title: editing.title.trim(),
    target_segment_id: editing.target_segment_id || null,
    target_snapshot: null,
    notification_disabled: false,
    sender_name: null,
    sender_icon_url: null,
    quick_reply_items: null,
    custom_aggregation_units: null,
    blocks: editing.blocks,
    userId: user?.id,
  });

  const handleSave = async () => {
    const err = validate();
    if (err) return toast.error(err);
    try {
      setSaving(true);
      await saveMessage(buildPayload());
      toast.success('保存しました');
      backToList();
      await load();
    } catch (e) { toast.error(e?.message || '保存失敗'); }
    finally { setSaving(false); }
  };

  const handleSend = async () => {
    setConfirmSend(false);
    const err = validate();
    if (err) return toast.error(err);
    try {
      setSending(true);
      const messageId = await saveMessage(buildPayload());
      const res = await sendMessage(messageId);
      toast.success(`送信完了: ${res.delivered_count} / ${res.recipient_count} 名`);
      backToList();
      await load();
    } catch (e) { toast.error(e?.message || '送信失敗'); }
    finally { setSending(false); }
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
    } catch (err) { toast.error(err?.message || 'アップロード失敗'); }
    finally { setUploadingIdx(-1); e.target.value = ''; }
  };

  const handlePreviewAudience = async () => {
    try {
      setAudienceLoading(true);
      let conditions = {};
      if (editing.target_segment_id) {
        const s = segments.find(x => x.id === editing.target_segment_id);
        conditions = s?.conditions || {};
      }
      const list = await fetchAudienceList({ companyId, conditions, limit: 5000 });
      setAudience(list);
    } catch (e) { toast.error(e?.message || 'プレビュー失敗'); }
    finally { setAudienceLoading(false); }
  };

  const renderBlockEditor = (b, i) => (
    <Card key={i} variant="outlined" sx={{ p: 2.5, borderRadius: 1, mb: 1.5, borderColor: '#e2e8f0' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Chip size="small" label={`${i + 1}. ${BLOCK_LABEL[b.block_type]}`}
          sx={{ bgcolor: alpha(theme.primary, 0.1), color: theme.primary, fontWeight: 700 }} />
        <Box sx={{ flex: 1 }} />
        <IconButton size="small" disabled={i === 0} onClick={() => moveBlock(i, -1)}><ArrowUpward fontSize="small" /></IconButton>
        <IconButton size="small" disabled={i === editing.blocks.length - 1} onClick={() => moveBlock(i, 1)}><ArrowDownward fontSize="small" /></IconButton>
        <IconButton size="small" sx={{ color: '#ef4444' }} onClick={() => removeBlock(i)}><Delete fontSize="small" /></IconButton>
      </Box>

      {b.block_type === 'text' && (
        <TextField fullWidth multiline rows={4} placeholder="本文を入力"
          value={b.text_content || ''}
          onChange={(e) => updateBlock(i, { text_content: e.target.value })} />
      )}

      {b.block_type === 'image' && (
        <Stack spacing={1.5}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {b.image_url ? (
              <Avatar src={b.image_url} variant="rounded" sx={{ width: 140, height: 90 }} />
            ) : (
              <Avatar variant="rounded" sx={{ width: 140, height: 90, bgcolor: '#f1f5f9' }}>
                <ImageIcon sx={{ color: '#94a3b8' }} />
              </Avatar>
            )}
            <Button component="label" variant="outlined" startIcon={<Upload />} disabled={uploadingIdx === i}>
              {uploadingIdx === i ? 'アップロード中…' : '画像を選択'}
              <input type="file" accept="image/*" hidden onChange={(e) => handleImageUpload(i, e)} />
            </Button>
            {b.image_url && <Button size="small" color="error" onClick={() => updateBlock(i, { image_url: '' })}>削除</Button>}
          </Box>
          <TextField fullWidth size="small" label={optLabel('リンク URL')} placeholder="https://..."
            value={b.link_url || ''}
            onChange={(e) => updateBlock(i, { link_url: e.target.value || null })}
            InputProps={{ startAdornment: <LinkIcon fontSize="small" sx={{ mr: 1, color: '#94a3b8' }} /> }}
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
              <MenuItem key={c.id} value={c.id}>{c.title || c.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
    </Card>
  );

  if (mode === 'form' && editing) {
    return (
      <Box sx={{ minHeight: '100%', background: '#f8fafc' }}>
        <Box sx={{
          position: 'sticky', top: 0, zIndex: 10,
          backgroundColor: '#fff', borderBottom: '1px solid #e2e8f0',
          px: 3, py: 2, display: 'flex', alignItems: 'center', gap: 2,
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        }}>
          <IconButton onClick={backToList}><ArrowBack /></IconButton>
          <Typography variant="h6" sx={{ fontWeight: 700, flex: 1 }}>
            {editing.id ? 'メッセージを編集' : '新規メッセージ作成'}
          </Typography>
          <Button onClick={backToList} sx={{ color: '#64748b' }}>キャンセル</Button>
          <Button onClick={handleSave} disabled={saving} variant="outlined" startIcon={<Save />}
            sx={{ borderColor: theme.primary, color: theme.primary }}>
            {saving ? <CircularProgress size={20} /> : '下書き保存'}
          </Button>
          <Button onClick={() => setConfirmSend(true)} disabled={sending || saving} variant="contained" startIcon={<Send />}
            sx={{
              background: theme.primaryGradient || theme.primary, color: 'white', px: 3, fontWeight: 600,
              '&:hover': { background: theme.primaryGradient || theme.primary, opacity: 0.9 },
            }}>
            {sending ? <CircularProgress size={20} sx={{ color: 'white' }} /> : '送信'}
          </Button>
        </Box>

        <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
          <Stack spacing={2.5}>
            <Card sx={{ p: 3, borderRadius: 1, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <SectionHeader title="基本情報" />
              <TextField label="タイトル" fullWidth value={editing.title}
                onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
            </Card>

            <Card sx={{ p: 3, borderRadius: 1, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <SectionHeader title="送信先" />
              <FormControl fullWidth>
                <InputLabel>送信先セグメント</InputLabel>
                <Select value={editing.target_segment_id} label="送信先セグメント"
                  onChange={(e) => { setEditing({ ...editing, target_segment_id: e.target.value }); setAudience([]); }}>
                  <MenuItem value=""><em>全 LINE 連携回答者</em></MenuItem>
                  {segments.map((s) => (
                    <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Card>

            <Card sx={{ p: 3, borderRadius: 1, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <SectionHeader title="メッセージ内容" />
              <Typography variant="caption" sx={{ color: '#64748b', mb: 1.5, display: 'block' }}>
                ブロックを最大 5 個まで追加できます。上から順に送信されます。
              </Typography>

              <Box>
                {editing.blocks.map((b, i) => renderBlockEditor(b, i))}
              </Box>

              {editing.blocks.length < 5 && (
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                  {[
                    { type: 'text', icon: <TextFields />, label: 'テキスト' },
                    { type: 'image', icon: <ImageIcon />, label: '画像' },
                    { type: 'coupon', icon: <LocalOffer />, label: 'クーポン' },
                  ].map((opt) => (
                    <Button key={opt.type} size="small" startIcon={opt.icon} variant="outlined"
                      onClick={() => setEditing({ ...editing, blocks: [...editing.blocks, newBlock(opt.type)] })}
                      sx={{ borderColor: theme.primary, color: theme.primary,
                        '&:hover': { borderColor: theme.primary, background: alpha(theme.primary, 0.06) } }}>
                      {opt.label}
                    </Button>
                  ))}
                </Box>
              )}
            </Card>

            <Card sx={{ borderRadius: 1, boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
              <Box sx={{
                px: 3, py: 2, display: 'flex', alignItems: 'center', gap: 2,
                borderBottom: '1px solid #e2e8f0',
              }}>
                <Box sx={{
                  width: 4, height: 24, borderRadius: 4,
                  background: theme.primaryGradient || theme.primary, mr: 0.5,
                }} />
                <Typography sx={{ fontWeight: 700, fontSize: '1rem', flex: 1 }}>対象ユーザー</Typography>
                <Chip label={`${audience.length} 名`} size="small"
                  sx={{ bgcolor: alpha(theme.primary, 0.1), color: theme.primary, fontWeight: 700 }} />
                <Button onClick={handlePreviewAudience} disabled={audienceLoading}
                  variant="contained" size="small"
                  startIcon={audienceLoading ? <CircularProgress size={14} sx={{ color: 'white' }} /> : <Visibility />}
                  sx={{
                    background: theme.primaryGradient || theme.primary, color: 'white', fontWeight: 600,
                    '&:hover': { background: theme.primaryGradient || theme.primary, opacity: 0.9 },
                  }}>
                  フィルタリング
                </Button>
              </Box>
              <LineAudienceTable rows={audience} loading={audienceLoading}
                emptyHint="「フィルタリング」をクリックして対象ユーザーを取得" />
            </Card>
          </Stack>
        </Box>

        <ConfirmDialog
          open={confirmSend}
          title="メッセージを送信"
          message={`「${editing.title}」を ${audience.length || '対象'} 名に送信します。\n送信後の取り消しはできません。`}
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
                  background: alpha(theme.primary, 0.1),
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
