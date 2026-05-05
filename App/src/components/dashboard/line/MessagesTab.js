import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Card, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, IconButton, Chip, ListItem, ListItemText, CircularProgress,
  Stack, FormControl, InputLabel, Select, MenuItem, Avatar, Divider, Alert,
} from '@mui/material';
import {
  Add, Delete, Edit, Send, Mail, TextFields, Image as ImageIcon, LocalOffer,
  ArrowUpward, ArrowDownward, Upload, Link as LinkIcon, Visibility,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import {
  fetchMessages, fetchMessageWithBlocks, saveMessage, deleteMessage, sendMessage,
  fetchSegments, fetchCoupons, uploadLineImage, previewAudience,
} from '../../../lib/lineMessaging';

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

const statusChip = (s) => {
  const map = {
    draft: { label: '下書き', color: 'default' },
    sending: { label: '送信中', color: 'info' },
    sent: { label: '送信済', color: 'success' },
    failed: { label: '失敗', color: 'error' },
  };
  const m = map[s] || { label: s, color: 'default' };
  return <Chip label={m.label} color={m.color} size="small" />;
};

export default function MessagesTab({ companyId, user }) {
  const [messages, setMessages] = useState([]);
  const [segments, setSegments] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [uploadingIdx, setUploadingIdx] = useState(-1);
  const [audienceCount, setAudienceCount] = useState(null);

  const load = async () => {
    if (!companyId) return;
    try {
      setLoading(true);
      const [m, s, c] = await Promise.all([
        fetchMessages(companyId), fetchSegments(companyId), fetchCoupons(companyId),
      ]);
      setMessages(m); setSegments(s); setCoupons(c);
    } catch (e) {
      toast.error('一覧の取得失敗');
    } finally { setLoading(false); }
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [companyId]);

  const openNew = () => {
    setEditing({ ...emptyMessage, blocks: [newBlock('text')] });
    setAudienceCount(null);
  };
  const openEdit = async (m) => {
    try {
      const full = await fetchMessageWithBlocks(m.id);
      setEditing({
        id: full.id, title: full.title,
        target_segment_id: full.target_segment_id || '',
        blocks: full.blocks.length > 0 ? full.blocks : [newBlock('text')],
      });
      setAudienceCount(null);
    } catch (e) { toast.error('読み込み失敗'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('このメッセージを削除しますか?')) return;
    try {
      await deleteMessage(id);
      toast.success('削除しました');
      await load();
    } catch (e) { toast.error(e?.message || '削除失敗'); }
  };

  const handleSave = async () => {
    if (!editing.title.trim()) return toast.error('タイトルを入力してください');
    if (editing.blocks.length === 0) return toast.error('ブロックを1つ以上追加してください');
    if (editing.blocks.length > 5) return toast.error('ブロックは最大5個までです (LINE 仕様)');
    try {
      setSaving(true);
      await saveMessage({
        id: editing.id, companyId,
        title: editing.title.trim(),
        target_segment_id: editing.target_segment_id || null,
        target_snapshot: null,
        blocks: editing.blocks,
        userId: user?.id,
      });
      toast.success('保存しました');
      setEditing(null);
      await load();
    } catch (e) {
      toast.error(e?.message || '保存失敗');
    } finally { setSaving(false); }
  };

  const handleSend = async () => {
    if (!editing.title.trim()) return toast.error('タイトルを入力してください');
    if (editing.blocks.length === 0) return toast.error('ブロックを1つ以上追加してください');
    if (!window.confirm(`「${editing.title}」を送信します。よろしいですか?`)) return;
    try {
      setSending(true);
      const messageId = await saveMessage({
        id: editing.id, companyId,
        title: editing.title.trim(),
        target_segment_id: editing.target_segment_id || null,
        target_snapshot: null,
        blocks: editing.blocks,
        userId: user?.id,
      });
      const res = await sendMessage(messageId);
      toast.success(`送信完了: ${res.delivered_count} / ${res.recipient_count} 名`);
      setEditing(null);
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
  const removeBlock = (i) => {
    const blocks = editing.blocks.filter((_, idx) => idx !== i);
    setEditing({ ...editing, blocks });
  };

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

  const handlePreviewCount = async () => {
    try {
      const segId = editing.target_segment_id;
      let conditions = {};
      if (segId) {
        const s = segments.find((x) => x.id === segId);
        conditions = s?.conditions || {};
      }
      const c = await previewAudience({ companyId, conditions });
      setAudienceCount(c);
    } catch (e) { toast.error(e?.message || 'プレビュー失敗'); }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', mb: 2, alignItems: 'center' }}>
        <Typography variant="h6" sx={{ fontWeight: 700, flex: 1 }}>メッセージ</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={openNew}
          sx={{ backgroundColor: '#06C755', '&:hover': { backgroundColor: '#05a648' } }}>
          新規メッセージ
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
      ) : messages.length === 0 ? (
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <Mail sx={{ fontSize: 48, color: '#cbd5e1', mb: 1 }} />
          <Typography color="text.secondary">メッセージがまだありません</Typography>
        </Card>
      ) : (
        <Stack spacing={1.5}>
          {messages.map((m) => (
            <Card key={m.id} sx={{ borderRadius: 2 }}>
              <ListItem
                button
                onClick={() => openEdit(m)}
                secondaryAction={
                  <Box>
                    <IconButton onClick={(e) => { e.stopPropagation(); openEdit(m); }}><Edit /></IconButton>
                    <IconButton onClick={(e) => { e.stopPropagation(); handleDelete(m.id); }} sx={{ color: '#ef4444' }}><Delete /></IconButton>
                  </Box>
                }
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography sx={{ fontWeight: 600 }}>{m.title}</Typography>
                      {statusChip(m.status)}
                    </Box>
                  }
                  secondary={
                    <>
                      {m.line_target_segments?.name && (
                        <Typography component="span" variant="body2" sx={{ display: 'block' }}>
                          ターゲット: {m.line_target_segments.name}
                        </Typography>
                      )}
                      {m.status === 'sent' && (
                        <Typography component="span" variant="caption" color="text.secondary">
                          送信日時: {new Date(m.sent_at).toLocaleString('ja-JP')} / 配信 {m.delivered_count} / {m.recipient_count} 名
                        </Typography>
                      )}
                      {m.status === 'draft' && (
                        <Typography component="span" variant="caption" color="text.secondary">
                          作成: {new Date(m.created_at).toLocaleString('ja-JP')}
                        </Typography>
                      )}
                    </>
                  }
                />
              </ListItem>
            </Card>
          ))}
        </Stack>
      )}

      <Dialog open={!!editing} onClose={() => setEditing(null)} fullWidth maxWidth="md">
        <DialogTitle>
          {editing?.id ? 'メッセージを編集' : '新規メッセージ'}
        </DialogTitle>
        <DialogContent dividers>
          {editing && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField label="タイトル (管理用) *" fullWidth value={editing.title}
                onChange={(e) => setEditing({ ...editing, title: e.target.value })} />

              <FormControl fullWidth>
                <InputLabel>ターゲット</InputLabel>
                <Select
                  value={editing.target_segment_id}
                  onChange={(e) => { setEditing({ ...editing, target_segment_id: e.target.value }); setAudienceCount(null); }}
                  label="ターゲット"
                >
                  <MenuItem value=""><em>全 LINE 連携回答者</em></MenuItem>
                  {segments.map((s) => (
                    <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Button size="small" startIcon={<Visibility />} onClick={handlePreviewCount} variant="outlined">
                  対象人数を確認
                </Button>
                {audienceCount !== null && (
                  <Alert severity="info" sx={{ flex: 1, py: 0 }}>
                    対象 LINE ユーザー数: <strong>{audienceCount}</strong> 名
                  </Alert>
                )}
              </Box>

              <Divider />

              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                ブロック (最大5個 / 上から順に送信)
              </Typography>

              <Stack spacing={2}>
                {editing.blocks.map((b, i) => (
                  <Card key={i} variant="outlined" sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Chip
                        icon={b.block_type === 'text' ? <TextFields /> : b.block_type === 'image' ? <ImageIcon /> : <LocalOffer />}
                        label={b.block_type === 'text' ? 'テキスト' : b.block_type === 'image' ? '画像' : 'クーポン'}
                        size="small"
                      />
                      <Box sx={{ flex: 1 }} />
                      <IconButton size="small" disabled={i === 0} onClick={() => moveBlock(i, -1)}><ArrowUpward fontSize="small" /></IconButton>
                      <IconButton size="small" disabled={i === editing.blocks.length - 1} onClick={() => moveBlock(i, 1)}><ArrowDownward fontSize="small" /></IconButton>
                      <IconButton size="small" sx={{ color: '#ef4444' }} onClick={() => removeBlock(i)}><Delete fontSize="small" /></IconButton>
                    </Box>

                    {b.block_type === 'text' && (
                      <TextField fullWidth multiline rows={3} placeholder="本文 (5000字まで)。{{company_name}} で企業名を埋め込めます"
                        value={b.text_content || ''}
                        onChange={(e) => updateBlock(i, { text_content: e.target.value })} />
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
                          {b.image_url && <Button size="small" onClick={() => updateBlock(i, { image_url: '' })}>削除</Button>}
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
                  </Card>
                ))}
              </Stack>

              {editing.blocks.length < 5 && (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button size="small" startIcon={<TextFields />} onClick={() => setEditing({ ...editing, blocks: [...editing.blocks, newBlock('text')] })}>
                    テキスト追加
                  </Button>
                  <Button size="small" startIcon={<ImageIcon />} onClick={() => setEditing({ ...editing, blocks: [...editing.blocks, newBlock('image')] })}>
                    画像追加
                  </Button>
                  <Button size="small" startIcon={<LocalOffer />} onClick={() => setEditing({ ...editing, blocks: [...editing.blocks, newBlock('coupon')] })}>
                    クーポン追加
                  </Button>
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditing(null)}>キャンセル</Button>
          <Button onClick={handleSave} disabled={saving} variant="outlined">
            {saving ? <CircularProgress size={20} /> : '下書き保存'}
          </Button>
          <Button onClick={handleSend} disabled={sending || saving} variant="contained" startIcon={<Send />}
            sx={{ backgroundColor: '#06C755', '&:hover': { backgroundColor: '#05a648' } }}>
            {sending ? <CircularProgress size={20} sx={{ color: 'white' }} /> : '送信'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
