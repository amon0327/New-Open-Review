import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Card, TextField, IconButton, Chip, Avatar,
  CircularProgress, Stack, Divider, Switch, FormControlLabel,
} from '@mui/material';
import {
  Add, Delete, Edit, LocalOffer, Image as ImageIcon, Upload, ArrowBack,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import { fetchCoupons, upsertCoupon, deleteCoupon, uploadLineImage } from '../../../lib/lineMessaging';
import { usePartnerTheme } from '../../../contexts/PartnerThemeContext';
import ConfirmDialog from './ConfirmDialog';

const empty = {
  id: null, name: '', description: '', image_url: '', code: '',
  discount_text: '', expires_at: '', terms_text: '', is_active: true,
};

export default function CouponsTab({ companyId }) {
  const theme = usePartnerTheme();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('list'); // 'list' | 'form'
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const load = async () => {
    if (!companyId) return;
    try {
      setLoading(true);
      setCoupons(await fetchCoupons(companyId));
    } catch (e) {
      toast.error('クーポン一覧の取得失敗');
    } finally { setLoading(false); }
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [companyId]);

  const openNew = () => {
    setEditing({ ...empty });
    setMode('form');
  };
  const openEdit = (c) => {
    setEditing({
      ...empty, ...c,
      expires_at: c.expires_at ? c.expires_at.slice(0, 16) : '',
    });
    setMode('form');
  };
  const backToList = () => { setEditing(null); setMode('list'); };

  const handleSave = async () => {
    if (!editing.name.trim()) return toast.error('クーポン名を入力してください');
    try {
      setSaving(true);
      await upsertCoupon({
        id: editing.id, companyId,
        name: editing.name.trim(),
        description: editing.description || null,
        image_url: editing.image_url || null,
        code: editing.code || null,
        discount_text: editing.discount_text || null,
        expires_at: editing.expires_at || null,
        terms_text: editing.terms_text || null,
        is_active: editing.is_active,
      });
      toast.success('クーポンを保存しました');
      backToList();
      await load();
    } catch (e) {
      toast.error(e?.message || '保存失敗');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteCoupon(confirmDelete.id);
      toast.success('削除しました');
      setConfirmDelete(null);
      await load();
    } catch (e) { toast.error(e?.message || '削除失敗'); }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const url = await uploadLineImage({ companyId, file });
      setEditing({ ...editing, image_url: url });
      toast.success('画像をアップロードしました');
    } catch (err) {
      toast.error(err?.message || 'アップロード失敗');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  if (mode === 'form' && editing) {
    return (
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={backToList} sx={{ mr: 1 }}><ArrowBack /></IconButton>
          <Typography variant="h6" sx={{ fontWeight: 700, flex: 1 }}>
            {editing.id ? 'クーポンを編集' : '新規クーポン'}
          </Typography>
        </Box>

        <Card sx={{ p: 3, borderRadius: 1, boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
          <Stack spacing={2}>
            <TextField label="クーポン名 *" fullWidth value={editing.name}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            <TextField label="割引テキスト (例: 10%OFF / 500円OFF)" fullWidth
              value={editing.discount_text}
              onChange={(e) => setEditing({ ...editing, discount_text: e.target.value })} />
            <TextField label="説明" fullWidth multiline rows={2}
              value={editing.description}
              onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
            <TextField label="クーポンコード" fullWidth
              value={editing.code}
              onChange={(e) => setEditing({ ...editing, code: e.target.value })}
              helperText="LINE 内で表示するコード文字列。{{company_name}} などの変数が使えます" />

            <Divider />

            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>クーポン画像</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {editing.image_url ? (
                  <Avatar src={editing.image_url} variant="rounded" sx={{ width: 144, height: 96 }} />
                ) : (
                  <Avatar variant="rounded" sx={{ width: 144, height: 96, bgcolor: '#f1f5f9' }}>
                    <ImageIcon sx={{ color: '#94a3b8' }} />
                  </Avatar>
                )}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Button component="label" startIcon={<Upload />} disabled={uploading} variant="outlined" size="small">
                    {uploading ? 'アップロード中…' : '画像を選択'}
                    <input type="file" accept="image/*" hidden onChange={handleImageUpload} />
                  </Button>
                  {editing.image_url && (
                    <Button size="small" color="error"
                      onClick={() => setEditing({ ...editing, image_url: '' })}>削除</Button>
                  )}
                </Box>
              </Box>
            </Box>

            <TextField label="有効期限" type="datetime-local" fullWidth
              value={editing.expires_at}
              onChange={(e) => setEditing({ ...editing, expires_at: e.target.value })}
              InputLabelProps={{ shrink: true }} />

            <TextField label="利用条件" fullWidth multiline rows={2}
              value={editing.terms_text}
              onChange={(e) => setEditing({ ...editing, terms_text: e.target.value })} />

            <FormControlLabel
              control={<Switch checked={editing.is_active}
                onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} />}
              label="クーポンを有効にする"
            />

            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', pt: 1 }}>
              <Button onClick={backToList}>キャンセル</Button>
              <Button onClick={handleSave} variant="contained" disabled={saving}
                sx={{
                  background: theme.primaryGradient || theme.primary, color: 'white', px: 3,
                  '&:hover': { background: theme.primaryGradient || theme.primary, opacity: 0.9 },
                }}>
                {saving ? <CircularProgress size={20} sx={{ color: 'white' }} /> : '保存'}
              </Button>
            </Box>
          </Stack>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', mb: 3, alignItems: 'center' }}>
        <Typography variant="h6" sx={{ fontWeight: 700, flex: 1 }}>クーポン</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={openNew}
          sx={{
            background: theme.primaryGradient || theme.primary, color: 'white', px: 3,
            '&:hover': { background: theme.primaryGradient || theme.primary, opacity: 0.9 },
          }}>
          新規クーポン
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress sx={{ color: theme.primary }} /></Box>
      ) : coupons.length === 0 ? (
        <Card sx={{ p: 6, textAlign: 'center', borderRadius: 1 }}>
          <LocalOffer sx={{ fontSize: 48, color: '#cbd5e1', mb: 1 }} />
          <Typography color="text.secondary">クーポンがまだありません</Typography>
        </Card>
      ) : (
        <Stack spacing={1.5}>
          {coupons.map((c) => (
            <Card key={c.id} sx={{ borderRadius: 1, p: 2, display: 'flex', alignItems: 'center', gap: 2,
              cursor: 'pointer', transition: 'all 0.2s',
              '&:hover': { boxShadow: '0 6px 18px rgba(0,0,0,0.1)', transform: 'translateY(-1px)' },
            }} onClick={() => openEdit(c)}>
              {c.image_url ? (
                <Avatar src={c.image_url} variant="rounded" sx={{ width: 64, height: 64 }} />
              ) : (
                <Avatar variant="rounded" sx={{ width: 64, height: 64, bgcolor: theme.primaryAlpha10 || '#f1f5f9' }}>
                  <LocalOffer sx={{ color: theme.primary }} />
                </Avatar>
              )}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.5 }}>
                  <Typography sx={{ fontWeight: 700 }}>{c.name}</Typography>
                  {c.discount_text && (
                    <Chip label={c.discount_text} size="small"
                      sx={{ bgcolor: theme.primaryAlpha10 || `${theme.primary}1a`, color: theme.primary, fontWeight: 600 }} />
                  )}
                  {!c.is_active && <Chip label="無効" size="small" />}
                  {c.code && <Chip label={`コード: ${c.code}`} size="small" variant="outlined" />}
                </Box>
                {c.description && (
                  <Typography variant="body2" color="text.secondary" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.description}
                  </Typography>
                )}
                {c.expires_at && (
                  <Typography variant="caption" color="text.secondary">
                    有効期限: {new Date(c.expires_at).toLocaleString('ja-JP')}
                  </Typography>
                )}
              </Box>
              <Box>
                <IconButton onClick={(e) => { e.stopPropagation(); openEdit(c); }}><Edit /></IconButton>
                <IconButton onClick={(e) => { e.stopPropagation(); setConfirmDelete(c); }} sx={{ color: '#ef4444' }}><Delete /></IconButton>
              </Box>
            </Card>
          ))}
        </Stack>
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        title="クーポンを削除"
        message={`「${confirmDelete?.name}」を削除します。よろしいですか?`}
        confirmLabel="削除"
        danger
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </Box>
  );
}
