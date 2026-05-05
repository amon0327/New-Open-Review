import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Card, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, IconButton, Chip, Avatar, ListItem, ListItemAvatar, ListItemText,
  CircularProgress, Stack,
} from '@mui/material';
import {
  Add, Delete, Edit, LocalOffer, Image as ImageIcon, Upload,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import {
  fetchCoupons, upsertCoupon, deleteCoupon, uploadLineImage,
} from '../../../lib/lineMessaging';

const empty = {
  id: null, name: '', description: '', image_url: '', code: '',
  discount_text: '', expires_at: '', terms_text: '', is_active: true,
};

export default function CouponsTab({ companyId }) {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    if (!companyId) return;
    try {
      setLoading(true);
      setCoupons(await fetchCoupons(companyId));
    } catch (e) {
      toast.error('クーポン一覧の取得失敗');
    } finally {
      setLoading(false);
    }
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [companyId]);

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
      setEditing(null);
      await load();
    } catch (e) {
      toast.error(e?.message || '保存失敗');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('このクーポンを削除しますか?')) return;
    try {
      await deleteCoupon(id);
      toast.success('削除しました');
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

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', mb: 2, alignItems: 'center' }}>
        <Typography variant="h6" sx={{ fontWeight: 700, flex: 1 }}>クーポン</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => setEditing({ ...empty })}
          sx={{ backgroundColor: '#06C755', '&:hover': { backgroundColor: '#05a648' } }}>
          新規クーポン
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
      ) : coupons.length === 0 ? (
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <LocalOffer sx={{ fontSize: 48, color: '#cbd5e1', mb: 1 }} />
          <Typography color="text.secondary">クーポンがまだありません</Typography>
        </Card>
      ) : (
        <Stack spacing={1.5}>
          {coupons.map((c) => (
            <Card key={c.id} sx={{ borderRadius: 2 }}>
              <ListItem
                secondaryAction={
                  <Box>
                    <IconButton onClick={() => setEditing({ ...empty, ...c, expires_at: c.expires_at?.slice(0, 16) || '' })}><Edit /></IconButton>
                    <IconButton onClick={() => handleDelete(c.id)} sx={{ color: '#ef4444' }}><Delete /></IconButton>
                  </Box>
                }
              >
                <ListItemAvatar>
                  {c.image_url ? (
                    <Avatar src={c.image_url} variant="rounded" sx={{ width: 56, height: 56 }} />
                  ) : (
                    <Avatar variant="rounded" sx={{ width: 56, height: 56, bgcolor: '#f1f5f9' }}>
                      <LocalOffer sx={{ color: '#94a3b8' }} />
                    </Avatar>
                  )}
                </ListItemAvatar>
                <ListItemText
                  sx={{ ml: 1 }}
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography sx={{ fontWeight: 600 }}>{c.name}</Typography>
                      {c.discount_text && <Chip label={c.discount_text} size="small" sx={{ bgcolor: '#06C75522', color: '#06C755', fontWeight: 600 }} />}
                      {!c.is_active && <Chip label="無効" size="small" />}
                    </Box>
                  }
                  secondary={
                    <>
                      {c.description && <Typography component="span" variant="body2" color="text.secondary" sx={{ display: 'block' }}>{c.description}</Typography>}
                      {c.expires_at && <Typography component="span" variant="caption" color="text.secondary">有効期限: {new Date(c.expires_at).toLocaleString('ja-JP')}</Typography>}
                    </>
                  }
                />
              </ListItem>
            </Card>
          ))}
        </Stack>
      )}

      <Dialog open={!!editing} onClose={() => setEditing(null)} fullWidth maxWidth="sm">
        <DialogTitle>{editing?.id ? 'クーポンを編集' : '新規クーポン'}</DialogTitle>
        <DialogContent dividers>
          {editing && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField label="クーポン名 *" fullWidth value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              <TextField label="割引テキスト (例: 10%OFF / 500円OFF)" fullWidth value={editing.discount_text} onChange={(e) => setEditing({ ...editing, discount_text: e.target.value })} />
              <TextField label="説明" fullWidth multiline rows={2} value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
              <TextField label="クーポンコード" fullWidth value={editing.code} onChange={(e) => setEditing({ ...editing, code: e.target.value })} helperText="LINE 内で表示するコード文字列。{{company_name}} などの変数が使えます" />

              <Box>
                <Typography variant="body2" sx={{ mb: 0.5 }}>画像</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  {editing.image_url ? (
                    <Avatar src={editing.image_url} variant="rounded" sx={{ width: 96, height: 64 }} />
                  ) : (
                    <Avatar variant="rounded" sx={{ width: 96, height: 64, bgcolor: '#f1f5f9' }}>
                      <ImageIcon sx={{ color: '#94a3b8' }} />
                    </Avatar>
                  )}
                  <Button component="label" startIcon={<Upload />} disabled={uploading} variant="outlined" size="small">
                    {uploading ? '...' : '画像を選択'}
                    <input type="file" accept="image/*" hidden onChange={handleImageUpload} />
                  </Button>
                  {editing.image_url && (
                    <Button size="small" onClick={() => setEditing({ ...editing, image_url: '' })}>削除</Button>
                  )}
                </Box>
              </Box>

              <TextField
                label="有効期限"
                type="datetime-local"
                fullWidth
                value={editing.expires_at}
                onChange={(e) => setEditing({ ...editing, expires_at: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
              <TextField label="利用条件" fullWidth multiline rows={2} value={editing.terms_text} onChange={(e) => setEditing({ ...editing, terms_text: e.target.value })} />
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditing(null)}>キャンセル</Button>
          <Button onClick={handleSave} variant="contained" disabled={saving}
            sx={{ backgroundColor: '#06C755', '&:hover': { backgroundColor: '#05a648' } }}>
            {saving ? <CircularProgress size={20} sx={{ color: 'white' }} /> : '保存'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
