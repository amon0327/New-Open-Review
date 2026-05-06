import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Card, TextField, IconButton, Chip, Avatar,
  CircularProgress, Stack, Divider, Switch, FormControlLabel,
  Select, MenuItem, FormControl, InputLabel, Accordion, AccordionSummary, AccordionDetails,
  Tooltip,
} from '@mui/material';
import {
  Add, Delete, Edit, LocalOffer, Image as ImageIcon, Upload, ArrowBack,
  ExpandMore, Palette, Info,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import { fetchCoupons, upsertCoupon, deleteCoupon, uploadLineImage } from '../../../lib/lineMessaging';
import { usePartnerTheme } from '../../../contexts/PartnerThemeContext';
import ConfirmDialog from './ConfirmDialog';

const empty = {
  id: null, name: '', description: '', image_url: '', code: '',
  discount_text: '', start_at: '', expires_at: '', terms_text: '', is_active: true,
  bubble_size: 'kilo',
  background_color: '', header_text: '', header_color: '#ffffff',
  cta_label: '', cta_uri: '', cta_color: '#06C755',
};

const BUBBLE_SIZES = [
  { value: 'nano', label: 'nano (極小)' },
  { value: 'micro', label: 'micro (小)' },
  { value: 'kilo', label: 'kilo (中)' },
  { value: 'mega', label: 'mega (標準)' },
  { value: 'giga', label: 'giga (大)' },
];

// LINE Flex 風プレビュー
function CouponPreview({ c }) {
  const headerColor = c.header_color || '#ffffff';
  const ctaColor = c.cta_color || '#06C755';
  const bgColor = c.background_color || '#ffffff';
  const formatDate = (iso) => iso ? new Date(iso).toLocaleDateString('ja-JP') : '';

  return (
    <Box sx={{ width: 280, borderRadius: 2, overflow: 'hidden',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)', backgroundColor: bgColor }}>
      {c.header_text && (
        <Box sx={{ p: 1, backgroundColor: ctaColor, textAlign: 'center' }}>
          <Typography sx={{ color: headerColor, fontWeight: 700, fontSize: '0.8rem' }}>
            {c.header_text}
          </Typography>
        </Box>
      )}
      {c.image_url && (
        <Box sx={{ width: '100%', aspectRatio: '20/13', overflow: 'hidden' }}>
          <img src={c.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </Box>
      )}
      <Box sx={{ p: 2 }}>
        <Typography sx={{ fontWeight: 700, fontSize: '1.05rem', mb: 0.5 }}>{c.name || '(クーポン名)'}</Typography>
        {c.discount_text && (
          <Typography sx={{ color: ctaColor, fontWeight: 700, fontSize: '1rem', mb: 0.5 }}>{c.discount_text}</Typography>
        )}
        {c.description && (
          <Typography sx={{ color: '#555', fontSize: '0.8rem', mb: 1 }}>{c.description}</Typography>
        )}
        {c.code && (
          <Box sx={{ display: 'flex', mt: 1.5 }}>
            <Typography sx={{ color: '#888', fontSize: '0.75rem', flex: '0 0 60px' }}>コード</Typography>
            <Typography sx={{ fontWeight: 700, fontSize: '0.75rem' }}>{c.code}</Typography>
          </Box>
        )}
        {(c.start_at || c.expires_at) && (
          <Box sx={{ display: 'flex', mt: 0.5 }}>
            <Typography sx={{ color: '#888', fontSize: '0.75rem', flex: '0 0 60px' }}>有効期限</Typography>
            <Typography sx={{ fontSize: '0.75rem' }}>
              {c.start_at ? formatDate(c.start_at) + ' 〜 ' : ''}
              {c.expires_at ? formatDate(c.expires_at) : ''}
            </Typography>
          </Box>
        )}
        {c.terms_text && (
          <Typography sx={{ color: '#aaa', fontSize: '0.7rem', mt: 1.5, whiteSpace: 'pre-wrap' }}>
            {c.terms_text}
          </Typography>
        )}
      </Box>
      {c.cta_label && c.cta_uri && (
        <Box sx={{ p: 2, pt: 0 }}>
          <Box sx={{
            backgroundColor: ctaColor, color: '#fff', textAlign: 'center',
            borderRadius: 1, py: 1, fontWeight: 700, fontSize: '0.85rem',
          }}>
            {c.cta_label}
          </Box>
        </Box>
      )}
    </Box>
  );
}

export default function CouponsTab({ companyId }) {
  const theme = usePartnerTheme();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('list');
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const load = async () => {
    if (!companyId) return;
    try {
      setLoading(true);
      setCoupons(await fetchCoupons(companyId));
    } catch (e) { toast.error('クーポン一覧の取得失敗'); }
    finally { setLoading(false); }
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [companyId]);

  const openNew = () => { setEditing({ ...empty }); setMode('form'); };
  const openEdit = (c) => {
    setEditing({
      ...empty, ...c,
      start_at: c.start_at ? c.start_at.slice(0, 16) : '',
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
        start_at: editing.start_at || null,
        expires_at: editing.expires_at || null,
        terms_text: editing.terms_text || null,
        is_active: editing.is_active,
        bubble_size: editing.bubble_size || 'kilo',
        background_color: editing.background_color || null,
        header_text: editing.header_text || null,
        header_color: editing.header_color || null,
        cta_label: editing.cta_label || null,
        cta_uri: editing.cta_uri || null,
        cta_color: editing.cta_color || null,
      });
      toast.success('クーポンを保存しました');
      backToList();
      await load();
    } catch (e) { toast.error(e?.message || '保存失敗'); }
    finally { setSaving(false); }
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
    } catch (err) { toast.error(err?.message || 'アップロード失敗'); }
    finally { setUploading(false); e.target.value = ''; }
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

        <Box sx={{ display: 'grid', gridTemplateColumns: { md: '1fr 320px', xs: '1fr' }, gap: 3 }}>
          {/* === 左: フォーム === */}
          <Card sx={{ p: 3, borderRadius: 1, boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
            <Stack spacing={2}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: theme.primary }}>基本情報</Typography>

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
                helperText="LINE 内に表示する文字列。{{company_name}} 等の変数が使えます" />

              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField label="開始日" type="datetime-local" fullWidth size="small"
                  value={editing.start_at}
                  onChange={(e) => setEditing({ ...editing, start_at: e.target.value })}
                  InputLabelProps={{ shrink: true }} />
                <TextField label="有効期限" type="datetime-local" fullWidth size="small"
                  value={editing.expires_at}
                  onChange={(e) => setEditing({ ...editing, expires_at: e.target.value })}
                  InputLabelProps={{ shrink: true }} />
              </Box>

              <TextField label="利用条件" fullWidth multiline rows={2}
                value={editing.terms_text}
                onChange={(e) => setEditing({ ...editing, terms_text: e.target.value })} />

              <Divider />
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: theme.primary }}>画像</Typography>

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

              <Divider />
              <Accordion variant="outlined" defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Palette fontSize="small" sx={{ color: theme.primary }} />
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>外観・スタイル</Typography>
                    <Tooltip title="LINE Flex Message のパラメータ。bubble サイズや色をプレビューで確認しながら調整できます">
                      <Info fontSize="small" sx={{ color: '#94a3b8' }} />
                    </Tooltip>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Stack spacing={2}>
                    <FormControl size="small" fullWidth>
                      <InputLabel>bubble サイズ</InputLabel>
                      <Select label="bubble サイズ" value={editing.bubble_size}
                        onChange={(e) => setEditing({ ...editing, bubble_size: e.target.value })}>
                        {BUBBLE_SIZES.map((s) => (
                          <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <TextField label="背景色 (hex)" size="small" sx={{ flex: 1 }}
                        value={editing.background_color}
                        onChange={(e) => setEditing({ ...editing, background_color: e.target.value })}
                        placeholder="#ffffff" />
                      <input type="color" value={editing.background_color || '#ffffff'}
                        onChange={(e) => setEditing({ ...editing, background_color: e.target.value })}
                        style={{ width: 40, height: 40, border: 'none', cursor: 'pointer' }} />
                    </Box>
                  </Stack>
                </AccordionDetails>
              </Accordion>

              <Accordion variant="outlined">
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>ヘッダーバッジ (任意)</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Stack spacing={2}>
                    <TextField label="ヘッダーテキスト" size="small" fullWidth
                      value={editing.header_text}
                      onChange={(e) => setEditing({ ...editing, header_text: e.target.value })}
                      placeholder="例: 会員限定" />
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <TextField label="文字色 (hex)" size="small" sx={{ flex: 1 }}
                        value={editing.header_color}
                        onChange={(e) => setEditing({ ...editing, header_color: e.target.value })}
                        placeholder="#ffffff" />
                      <input type="color" value={editing.header_color || '#ffffff'}
                        onChange={(e) => setEditing({ ...editing, header_color: e.target.value })}
                        style={{ width: 40, height: 40, border: 'none', cursor: 'pointer' }} />
                    </Box>
                  </Stack>
                </AccordionDetails>
              </Accordion>

              <Accordion variant="outlined">
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>CTA ボタン (任意)</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Stack spacing={2}>
                    <TextField label="ボタンラベル" size="small" fullWidth
                      value={editing.cta_label}
                      onChange={(e) => setEditing({ ...editing, cta_label: e.target.value })}
                      placeholder="例: クーポンを使う" />
                    <TextField label="リンク URL" size="small" fullWidth
                      value={editing.cta_uri}
                      onChange={(e) => setEditing({ ...editing, cta_uri: e.target.value })}
                      placeholder="https://..." />
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <TextField label="ボタン色 (hex)" size="small" sx={{ flex: 1 }}
                        value={editing.cta_color}
                        onChange={(e) => setEditing({ ...editing, cta_color: e.target.value })}
                        placeholder="#06C755" />
                      <input type="color" value={editing.cta_color || '#06C755'}
                        onChange={(e) => setEditing({ ...editing, cta_color: e.target.value })}
                        style={{ width: 40, height: 40, border: 'none', cursor: 'pointer' }} />
                    </Box>
                  </Stack>
                </AccordionDetails>
              </Accordion>

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

          {/* === 右: プレビュー === */}
          <Box sx={{ position: { md: 'sticky' }, top: 16, alignSelf: 'flex-start' }}>
            <Card sx={{ p: 2, borderRadius: 1, bgcolor: '#f1f5f9' }}>
              <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 1, fontWeight: 600 }}>
                LINE プレビュー
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <CouponPreview c={editing} />
              </Box>
            </Card>
          </Box>
        </Box>
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
                  {c.header_text && <Chip label={c.header_text} size="small" />}
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
