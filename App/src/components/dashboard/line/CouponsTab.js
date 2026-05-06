import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Card, TextField, IconButton, Chip, Avatar,
  CircularProgress, Stack, Switch, FormControlLabel,
  Select, MenuItem, FormControl, InputLabel, alpha, ToggleButtonGroup, ToggleButton,
  RadioGroup, Radio, FormLabel, InputAdornment,
} from '@mui/material';
import {
  Add, Delete, Edit, LocalOffer, Image as ImageIcon, Upload, ArrowBack, Save,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import { fetchCoupons, upsertCoupon, deleteCoupon, uploadLineImage } from '../../../lib/lineMessaging';
import { usePartnerTheme } from '../../../contexts/PartnerThemeContext';
import ConfirmDialog from './ConfirmDialog';

const empty = {
  id: null,
  title: '', description: '', image_url: '',
  start_at: '', expires_at: '',
  max_use_count_per_ticket: 1,
  usage_condition: '',
  reward_type: 'discount',
  reward_price_info_type: 'fixed',
  reward_fixed_amount: '',
  reward_percentage: '',
  reward_currency: 'JPY',
  acquisition_type: 'normal',
  acquisition_lottery_probability: '',
  acquisition_max_acquire_count: '',
  is_active: true,
};

const REWARD_TYPES = [
  { value: 'discount', label: '割引' },
  { value: 'free', label: '無料提供' },
  { value: 'gift', label: 'プレゼント' },
];

const MAX_ACQUIRE_OPTIONS = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 30, 50, 100, 200, 500, 1000, 2000, 5000, 10000,
];

// 1〜5%, 10/15/20/25/30%, 40/50/60/70/80/90/100%
const LOTTERY_PROBABILITY_OPTIONS = [
  1, 2, 3, 4, 5, 10, 15, 20, 25, 30, 40, 50, 60, 70, 80, 90, 100,
];

// シンプルなラベル: 任意の場合のみ「(任意)」を後置
const optLabel = (text, optional) => optional ? (
  <Box component="span">
    {text}
    <Box component="span" sx={{ ml: 0.5, color: '#94a3b8', fontSize: '0.78em' }}>(任意)</Box>
  </Box>
) : text;

// セクションヘッダー
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

export default function CouponsTab({ companyId, onFormModeChange }) {
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

  useEffect(() => {
    onFormModeChange?.(mode === 'form');
    return () => onFormModeChange?.(false);
  }, [mode, onFormModeChange]);

  const openNew = () => { setEditing({ ...empty }); setMode('form'); };
  const openEdit = (c) => {
    setEditing({
      ...empty, ...c,
      title: c.title || c.name || '',
      start_at: c.start_at ? c.start_at.slice(0, 16) : '',
      expires_at: c.expires_at ? c.expires_at.slice(0, 16) : '',
      reward_type: ['discount','free','gift'].includes(c.reward_type) ? c.reward_type : 'discount',
      reward_price_info_type: c.reward_price_info_type || 'fixed',
      reward_fixed_amount: c.reward_fixed_amount ?? '',
      reward_percentage: c.reward_percentage ?? '',
      reward_currency: c.reward_currency || 'JPY',
      acquisition_type: c.acquisition_type || 'normal',
      acquisition_lottery_probability: c.acquisition_lottery_probability ?? '',
      acquisition_max_acquire_count: c.acquisition_max_acquire_count ?? '',
      max_use_count_per_ticket: c.max_use_count_per_ticket ?? 1,
      usage_condition: c.usage_condition || c.terms_text || '',
    });
    setMode('form');
  };
  const backToList = () => { setEditing(null); setMode('list'); };

  const handleSave = async () => {
    if (!editing.title?.trim()) return toast.error('クーポンタイトルを入力してください');
    if (!editing.start_at) return toast.error('開始日時を指定してください');
    if (!editing.expires_at) return toast.error('終了日時を指定してください');

    if (editing.reward_type === 'discount') {
      if (editing.reward_price_info_type === 'fixed' && !editing.reward_fixed_amount) {
        return toast.error('割引金額を入力してください');
      }
      if (editing.reward_price_info_type === 'percentage' && !editing.reward_percentage) {
        return toast.error('割引率を入力してください');
      }
    }
    if (editing.acquisition_type === 'lottery') {
      if (!editing.acquisition_lottery_probability) return toast.error('当選確率を入力してください');
      if (!editing.acquisition_max_acquire_count) return toast.error('当選上限数を選択してください');
    }

    try {
      setSaving(true);
      await upsertCoupon({
        id: editing.id, companyId, ...editing,
        // 削除した項目は固定値を送る
        coupon_timezone: 'ASIA_TOKYO',
        visibility: 'UNLISTED',
        max_ticket_per_user: null,
        code: null,
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
    const isPercentage = editing.reward_price_info_type === 'percentage';
    const isDiscount = editing.reward_type === 'discount';
    const isLottery = editing.acquisition_type === 'lottery';

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
            {editing.id ? 'クーポンを編集' : '新規クーポン作成'}
          </Typography>
          <Button onClick={backToList} sx={{ color: '#64748b' }}>キャンセル</Button>
          <Button onClick={handleSave} variant="contained" disabled={saving} startIcon={<Save />}
            sx={{
              background: theme.primaryGradient || theme.primary, color: 'white', px: 3, fontWeight: 600,
              '&:hover': { background: theme.primaryGradient || theme.primary, opacity: 0.9 },
            }}>
            {saving ? <CircularProgress size={20} sx={{ color: 'white' }} /> : '保存'}
          </Button>
        </Box>

        <Box sx={{ p: 3 }}>
          <Stack spacing={2.5}>
            <Card sx={{ p: 3, borderRadius: 1, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <SectionHeader title="基本情報" />
              <Stack spacing={2.5}>
                <TextField label="クーポンタイトル" fullWidth value={editing.title}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
                <TextField label={optLabel('説明文', true)} fullWidth multiline rows={3}
                  value={editing.description}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
              </Stack>
            </Card>

            <Card sx={{ p: 3, borderRadius: 1, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <SectionHeader title={<>カバー画像<Box component="span" sx={{ ml: 0.5, color: '#94a3b8', fontSize: '0.78em', fontWeight: 400 }}>(任意)</Box></>} />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {editing.image_url ? (
                  <Avatar src={editing.image_url} variant="rounded" sx={{ width: 200, height: 130 }} />
                ) : (
                  <Avatar variant="rounded" sx={{ width: 200, height: 130, bgcolor: '#f1f5f9' }}>
                    <ImageIcon sx={{ color: '#94a3b8', fontSize: 40 }} />
                  </Avatar>
                )}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Button component="label" startIcon={<Upload />} disabled={uploading} variant="outlined">
                    {uploading ? 'アップロード中…' : '画像を選択'}
                    <input type="file" accept="image/*" hidden onChange={handleImageUpload} />
                  </Button>
                  {editing.image_url && (
                    <Button size="small" color="error" onClick={() => setEditing({ ...editing, image_url: '' })}>削除</Button>
                  )}
                </Box>
              </Box>
            </Card>

            <Card sx={{ p: 3, borderRadius: 1, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <SectionHeader title="特典内容" />
              <Stack spacing={2.5}>
                <Box>
                  <FormLabel sx={{ fontSize: '0.8rem', fontWeight: 600, mb: 1, display: 'block', color: '#475569' }}>
                    特典タイプ
                  </FormLabel>
                  <ToggleButtonGroup value={editing.reward_type} exclusive
                    onChange={(_, v) => v && setEditing({ ...editing, reward_type: v })}
                    sx={{ flexWrap: 'wrap', gap: 1, '& .MuiToggleButton-root': {
                      border: '1px solid #cbd5e1 !important', borderRadius: '8px !important',
                      textTransform: 'none', fontWeight: 600, px: 3,
                      '&.Mui-selected': {
                        background: theme.primaryGradient || theme.primary, color: 'white', borderColor: 'transparent !important',
                        '&:hover': { background: theme.primaryGradient || theme.primary, opacity: 0.9 },
                      },
                    }}}>
                    {REWARD_TYPES.map((r) => (
                      <ToggleButton key={r.value} value={r.value}>{r.label}</ToggleButton>
                    ))}
                  </ToggleButtonGroup>
                </Box>

                {isDiscount && (
                  <Box sx={{ p: 2, bgcolor: alpha(theme.primary, 0.04), borderRadius: 1 }}>
                    <FormLabel sx={{ fontSize: '0.8rem', fontWeight: 600, mb: 1, display: 'block', color: '#475569' }}>
                      割引方法
                    </FormLabel>
                    <RadioGroup row value={editing.reward_price_info_type}
                      onChange={(e) => setEditing({ ...editing, reward_price_info_type: e.target.value })}>
                      <FormControlLabel value="fixed" control={<Radio sx={{ '&.Mui-checked': { color: theme.primary } }} />} label="定額" />
                      <FormControlLabel value="percentage" control={<Radio sx={{ '&.Mui-checked': { color: theme.primary } }} />} label="パーセンテージ" />
                    </RadioGroup>
                    <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                      {!isPercentage ? (
                        <>
                          <TextField label="割引金額" type="number" size="small" sx={{ flex: 1 }}
                            value={editing.reward_fixed_amount}
                            onChange={(e) => setEditing({ ...editing, reward_fixed_amount: e.target.value })}
                            InputProps={{ endAdornment: <InputAdornment position="end">{editing.reward_currency === 'JPY' ? '円' : editing.reward_currency}</InputAdornment> }} />
                          <FormControl size="small" sx={{ minWidth: 120 }}>
                            <InputLabel>通貨</InputLabel>
                            <Select label="通貨" value={editing.reward_currency}
                              onChange={(e) => setEditing({ ...editing, reward_currency: e.target.value })}>
                              <MenuItem value="JPY">JPY (円)</MenuItem>
                              <MenuItem value="USD">USD</MenuItem>
                              <MenuItem value="KRW">KRW</MenuItem>
                              <MenuItem value="TWD">TWD</MenuItem>
                              <MenuItem value="THB">THB</MenuItem>
                            </Select>
                          </FormControl>
                        </>
                      ) : (
                        <TextField label="割引率" type="number" size="small" sx={{ flex: 1 }}
                          value={editing.reward_percentage}
                          onChange={(e) => setEditing({ ...editing, reward_percentage: e.target.value })}
                          InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }} />
                      )}
                    </Box>
                  </Box>
                )}
              </Stack>
            </Card>

            <Card sx={{ p: 3, borderRadius: 1, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <SectionHeader title="獲得条件" />
              <RadioGroup row value={editing.acquisition_type}
                onChange={(e) => setEditing({ ...editing, acquisition_type: e.target.value })}>
                <FormControlLabel value="normal" control={<Radio sx={{ '&.Mui-checked': { color: theme.primary } }} />} label="通常 (誰でも獲得可)" />
                <FormControlLabel value="lottery" control={<Radio sx={{ '&.Mui-checked': { color: theme.primary } }} />} label="抽選" />
              </RadioGroup>

              {isLottery && (
                <Box sx={{ display: 'flex', gap: 2, mt: 1.5, p: 2, bgcolor: alpha(theme.primary, 0.04), borderRadius: 1 }}>
                  <FormControl size="small" sx={{ flex: 1 }}>
                    <InputLabel>当選確率</InputLabel>
                    <Select label="当選確率" value={editing.acquisition_lottery_probability}
                      onChange={(e) => setEditing({ ...editing, acquisition_lottery_probability: e.target.value })}>
                      <MenuItem value=""><em>選択してください</em></MenuItem>
                      {LOTTERY_PROBABILITY_OPTIONS.map((n) => (
                        <MenuItem key={n} value={n}>{n} %</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl size="small" sx={{ flex: 1 }}>
                    <InputLabel>当選上限数</InputLabel>
                    <Select label="当選上限数" value={editing.acquisition_max_acquire_count}
                      onChange={(e) => setEditing({ ...editing, acquisition_max_acquire_count: e.target.value })}>
                      <MenuItem value=""><em>選択してください</em></MenuItem>
                      {MAX_ACQUIRE_OPTIONS.map((n) => (
                        <MenuItem key={n} value={n}>{n.toLocaleString()} 件</MenuItem>
                      ))}
                      <MenuItem value={-1}>無制限</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              )}
            </Card>

            <Card sx={{ p: 3, borderRadius: 1, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <SectionHeader title="有効期間" />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField label="開始日時" type="datetime-local" fullWidth size="small"
                  value={editing.start_at}
                  onChange={(e) => setEditing({ ...editing, start_at: e.target.value })}
                  InputLabelProps={{ shrink: true }} />
                <TextField label="終了日時" type="datetime-local" fullWidth size="small"
                  value={editing.expires_at}
                  onChange={(e) => setEditing({ ...editing, expires_at: e.target.value })}
                  InputLabelProps={{ shrink: true }} />
              </Box>
            </Card>

            <Card sx={{ p: 3, borderRadius: 1, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <SectionHeader title="その他" />
              <Stack spacing={2.5}>
                <Box>
                  <FormLabel sx={{ fontSize: '0.8rem', fontWeight: 600, mb: 1, display: 'block', color: '#475569' }}>
                    1人あたり使用回数
                  </FormLabel>
                  <RadioGroup row value={editing.max_use_count_per_ticket}
                    onChange={(e) => setEditing({ ...editing, max_use_count_per_ticket: Number(e.target.value) })}>
                    <FormControlLabel value={1} control={<Radio sx={{ '&.Mui-checked': { color: theme.primary } }} />} label="1回のみ" />
                    <FormControlLabel value={-1} control={<Radio sx={{ '&.Mui-checked': { color: theme.primary } }} />} label="無制限" />
                  </RadioGroup>
                </Box>
                <TextField label={optLabel('利用条件', true)} multiline rows={2} fullWidth size="small"
                  value={editing.usage_condition}
                  onChange={(e) => setEditing({ ...editing, usage_condition: e.target.value })} />
                <FormControlLabel
                  control={<Switch checked={editing.is_active}
                    onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} />}
                  label="クーポンを有効にする"
                />
              </Stack>
            </Card>
          </Stack>
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
          {coupons.map((c) => {
            const t = c.title || c.name;
            const rewardTxt = (() => {
              if (c.reward_type === 'discount') {
                if (c.reward_price_info_type === 'percentage' && c.reward_percentage) return `${c.reward_percentage}%`;
                if (c.reward_price_info_type === 'fixed' && c.reward_fixed_amount) return `${c.reward_fixed_amount}${c.reward_currency === 'JPY' ? '円' : ''}`;
              }
              if (c.reward_type === 'free') return '無料';
              if (c.reward_type === 'gift') return 'プレゼント';
              return null;
            })();
            return (
              <Card key={c.id} sx={{ borderRadius: 1, p: 2, display: 'flex', alignItems: 'center', gap: 2,
                cursor: 'pointer', transition: 'all 0.2s',
                '&:hover': { boxShadow: '0 6px 18px rgba(0,0,0,0.1)', transform: 'translateY(-1px)' },
              }} onClick={() => openEdit(c)}>
                {c.image_url ? (
                  <Avatar src={c.image_url} variant="rounded" sx={{ width: 64, height: 64 }} />
                ) : (
                  <Avatar variant="rounded" sx={{ width: 64, height: 64, bgcolor: alpha(theme.primary, 0.1) }}>
                    <LocalOffer sx={{ color: theme.primary }} />
                  </Avatar>
                )}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.5 }}>
                    <Typography sx={{ fontWeight: 700 }}>{t}</Typography>
                    {rewardTxt && (
                      <Chip label={rewardTxt} size="small"
                        sx={{ bgcolor: alpha(theme.primary, 0.1), color: theme.primary, fontWeight: 700 }} />
                    )}
                    {c.acquisition_type === 'lottery' && (
                      <Chip label={`抽選${c.acquisition_lottery_probability ? ` ${c.acquisition_lottery_probability}%` : ''}`}
                        size="small" sx={{ bgcolor: '#fef3c7', color: '#92400e', fontWeight: 600 }} />
                    )}
                    {!c.is_active && <Chip label="無効" size="small" />}
                  </Box>
                  {c.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.description}
                    </Typography>
                  )}
                  {c.expires_at && (
                    <Typography variant="caption" color="text.secondary">
                      {c.start_at ? `${new Date(c.start_at).toLocaleDateString('ja-JP')} 〜 ` : ''}
                      {new Date(c.expires_at).toLocaleDateString('ja-JP')}
                    </Typography>
                  )}
                </Box>
                <Box>
                  <IconButton onClick={(e) => { e.stopPropagation(); openEdit(c); }}><Edit /></IconButton>
                  <IconButton onClick={(e) => { e.stopPropagation(); setConfirmDelete(c); }} sx={{ color: '#ef4444' }}><Delete /></IconButton>
                </Box>
              </Card>
            );
          })}
        </Stack>
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        title="クーポンを削除"
        message={`「${confirmDelete?.title || confirmDelete?.name}」を削除します。よろしいですか?`}
        confirmLabel="削除"
        danger
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </Box>
  );
}
