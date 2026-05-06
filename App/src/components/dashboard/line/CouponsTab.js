import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Card, TextField, IconButton, Chip, Avatar,
  CircularProgress, Stack, Switch, FormControlLabel,
  Select, MenuItem, FormControl, InputLabel, alpha, ToggleButtonGroup, ToggleButton,
  RadioGroup, Radio, FormLabel, InputAdornment, Tooltip,
} from '@mui/material';
import {
  Add, Delete, Edit, LocalOffer, Image as ImageIcon, Upload, ArrowBack,
  Save, Info, Casino, AttachMoney, Schedule, Visibility as VisibilityIcon,
  ConfirmationNumber, Description as DescriptionIcon,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import { fetchCoupons, upsertCoupon, deleteCoupon, uploadLineImage } from '../../../lib/lineMessaging';
import { usePartnerTheme } from '../../../contexts/PartnerThemeContext';
import ConfirmDialog from './ConfirmDialog';

const empty = {
  id: null,
  title: '', description: '', image_url: '',
  start_at: '', expires_at: '', coupon_timezone: 'ASIA_TOKYO',
  max_use_count_per_ticket: 1,
  visibility: 'UNLISTED',
  max_ticket_per_user: '',
  code: '',
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
  { value: 'discount', label: '割引', icon: <AttachMoney /> },
  { value: 'cashBack', label: 'キャッシュバック', icon: <AttachMoney /> },
  { value: 'free', label: '無料提供', icon: <ConfirmationNumber /> },
  { value: 'gift', label: 'プレゼント', icon: <ConfirmationNumber /> },
  { value: 'others', label: 'その他', icon: <DescriptionIcon /> },
];

const TIMEZONES = [
  { value: 'ASIA_TOKYO', label: 'Asia/Tokyo (日本)' },
  { value: 'ASIA_SEOUL', label: 'Asia/Seoul (韓国)' },
  { value: 'ASIA_TAIPEI', label: 'Asia/Taipei (台湾)' },
  { value: 'ASIA_BANGKOK', label: 'Asia/Bangkok (タイ)' },
  { value: 'UTC', label: 'UTC' },
];

// セクションヘッダー
function SectionHeader({ icon, title, subtitle }) {
  const theme = usePartnerTheme();
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
      <Box sx={{
        width: 36, height: 36, borderRadius: 1,
        background: alpha(theme.primary, 0.1),
        display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 1.5,
        color: theme.primary,
      }}>{icon}</Box>
      <Box sx={{ flex: 1 }}>
        <Typography sx={{ fontWeight: 700, fontSize: '0.95rem' }}>{title}</Typography>
        {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
      </Box>
    </Box>
  );
}

// LINE Coupon API のスキーマに沿ったプレビュー
function CouponPreview({ c }) {
  const formatDate = (iso) => iso ? new Date(iso).toLocaleDateString('ja-JP') : '';
  const rewardLabel = (() => {
    if (c.reward_type === 'discount' || c.reward_type === 'cashBack') {
      if (c.reward_price_info_type === 'percentage' && c.reward_percentage) return `${c.reward_percentage}%${c.reward_type === 'cashBack' ? 'キャッシュバック' : 'OFF'}`;
      if (c.reward_price_info_type === 'fixed' && c.reward_fixed_amount) {
        const cur = c.reward_currency === 'JPY' ? '円' : ` ${c.reward_currency}`;
        return `${c.reward_fixed_amount}${cur}${c.reward_type === 'cashBack' ? 'キャッシュバック' : 'OFF'}`;
      }
    }
    if (c.reward_type === 'free') return '無料提供';
    if (c.reward_type === 'gift') return 'プレゼント';
    return '';
  })();

  return (
    <Box sx={{ width: 280, borderRadius: 2, overflow: 'hidden',
      boxShadow: '0 8px 24px rgba(0,0,0,0.15)', backgroundColor: '#fff' }}>
      <Box sx={{ p: 1.2, background: 'linear-gradient(135deg, #06C755 0%, #34d058 100%)', textAlign: 'center' }}>
        <Typography sx={{ color: 'white', fontWeight: 700, fontSize: '0.7rem', letterSpacing: 1 }}>
          COUPON
        </Typography>
      </Box>
      {c.image_url && (
        <Box sx={{ width: '100%', aspectRatio: '20/13', overflow: 'hidden' }}>
          <img src={c.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </Box>
      )}
      <Box sx={{ p: 2 }}>
        {c.acquisition_type === 'lottery' && (
          <Chip icon={<Casino sx={{ fontSize: 14 }} />} label="抽選" size="small"
            sx={{ mb: 1, bgcolor: '#fef3c7', color: '#92400e', fontWeight: 700 }} />
        )}
        {c.visibility === 'PUBLIC' && (
          <Chip label="公開" size="small" sx={{ mb: 1, ml: 0.5, bgcolor: '#dbeafe', color: '#1e40af', fontWeight: 700 }} />
        )}
        <Typography sx={{ fontWeight: 700, fontSize: '1.05rem', mb: 0.5 }}>{c.title || '(クーポンタイトル)'}</Typography>
        {rewardLabel && (
          <Typography sx={{ color: '#06C755', fontWeight: 700, fontSize: '1.4rem', mb: 0.5 }}>{rewardLabel}</Typography>
        )}
        {c.description && (
          <Typography sx={{ color: '#555', fontSize: '0.78rem', whiteSpace: 'pre-wrap' }}>{c.description}</Typography>
        )}
        {c.code && (
          <Box sx={{ mt: 1.5, p: 1, border: '1px dashed #cbd5e1', borderRadius: 1, textAlign: 'center', bgcolor: '#f8fafc' }}>
            <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>コード</Typography>
            <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', letterSpacing: 2 }}>{c.code}</Typography>
          </Box>
        )}
        {(c.start_at || c.expires_at) && (
          <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Schedule sx={{ fontSize: 14, color: '#94a3b8' }} />
            <Typography sx={{ fontSize: '0.7rem', color: '#64748b' }}>
              {c.start_at ? formatDate(c.start_at) + ' 〜 ' : ''}
              {c.expires_at ? formatDate(c.expires_at) : ''}
            </Typography>
          </Box>
        )}
        {c.usage_condition && (
          <Typography sx={{ color: '#94a3b8', fontSize: '0.7rem', mt: 1.2, whiteSpace: 'pre-wrap' }}>
            {c.usage_condition}
          </Typography>
        )}
        <Box sx={{ display: 'flex', gap: 0.5, mt: 1.5, flexWrap: 'wrap' }}>
          {c.max_use_count_per_ticket === -1 ? (
            <Chip label="使用無制限" size="small" sx={{ bgcolor: '#f1f5f9', fontSize: '0.65rem', height: 20 }} />
          ) : (
            <Chip label="1人1回" size="small" sx={{ bgcolor: '#f1f5f9', fontSize: '0.65rem', height: 20 }} />
          )}
          {c.max_ticket_per_user && (
            <Chip label={`最大${c.max_ticket_per_user}枚`} size="small" sx={{ bgcolor: '#f1f5f9', fontSize: '0.65rem', height: 20 }} />
          )}
        </Box>
      </Box>
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

  // form モード変化を親に通知
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
      reward_type: c.reward_type || 'discount',
      reward_price_info_type: c.reward_price_info_type || 'fixed',
      reward_fixed_amount: c.reward_fixed_amount ?? '',
      reward_percentage: c.reward_percentage ?? '',
      reward_currency: c.reward_currency || 'JPY',
      acquisition_type: c.acquisition_type || 'normal',
      acquisition_lottery_probability: c.acquisition_lottery_probability ?? '',
      acquisition_max_acquire_count: c.acquisition_max_acquire_count ?? '',
      coupon_timezone: c.coupon_timezone || 'ASIA_TOKYO',
      max_use_count_per_ticket: c.max_use_count_per_ticket ?? 1,
      visibility: c.visibility || 'UNLISTED',
      max_ticket_per_user: c.max_ticket_per_user ?? '',
      usage_condition: c.usage_condition || c.terms_text || '',
      code: c.code || '',
    });
    setMode('form');
  };
  const backToList = () => { setEditing(null); setMode('list'); };

  const handleSave = async () => {
    if (!editing.title?.trim()) return toast.error('クーポンタイトルを入力してください');
    if (!editing.start_at) return toast.error('開始日時を指定してください (即時開始ならこの瞬間以前を指定)');
    if (!editing.expires_at) return toast.error('終了日時を指定してください');

    if (editing.reward_type === 'discount' || editing.reward_type === 'cashBack') {
      if (editing.reward_price_info_type === 'fixed' && (editing.reward_fixed_amount === '' || editing.reward_fixed_amount == null)) {
        return toast.error('固定金額を入力してください');
      }
      if (editing.reward_price_info_type === 'percentage' && (editing.reward_percentage === '' || editing.reward_percentage == null)) {
        return toast.error('割引率を入力してください');
      }
    }
    if (editing.acquisition_type === 'lottery') {
      if (editing.acquisition_lottery_probability === '' || editing.acquisition_lottery_probability == null) {
        return toast.error('当選確率を入力してください');
      }
      if (editing.acquisition_max_acquire_count === '' || editing.acquisition_max_acquire_count == null) {
        return toast.error('当選上限数を入力してください (-1 で無制限)');
      }
    }

    try {
      setSaving(true);
      await upsertCoupon({ id: editing.id, companyId, ...editing });
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
    return (
      <Box sx={{ minHeight: '100%', background: '#f8fafc' }}>
        {/* スティッキーヘッダー (新ページ風) */}
        <Box sx={{
          position: 'sticky', top: 0, zIndex: 10,
          backgroundColor: '#fff', borderBottom: '1px solid #e2e8f0',
          px: 3, py: 2, display: 'flex', alignItems: 'center', gap: 2,
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}>
          <IconButton onClick={backToList}><ArrowBack /></IconButton>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {editing.id ? 'クーポンを編集' : '新規クーポン作成'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              LINE 公式アカウント Coupon API スキーマ準拠
            </Typography>
          </Box>
          <Button onClick={backToList} sx={{ color: '#64748b' }}>キャンセル</Button>
          <Button onClick={handleSave} variant="contained" disabled={saving} startIcon={<Save />}
            sx={{
              background: theme.primaryGradient || theme.primary, color: 'white', px: 3, fontWeight: 600,
              '&:hover': { background: theme.primaryGradient || theme.primary, opacity: 0.9 },
            }}>
            {saving ? <CircularProgress size={20} sx={{ color: 'white' }} /> : '保存'}
          </Button>
        </Box>

        <Box sx={{ p: 3, display: 'grid', gridTemplateColumns: { lg: '1fr 320px', xs: '1fr' }, gap: 3 }}>
          {/* === 左: フォーム === */}
          <Stack spacing={2}>
            {/* 基本情報 */}
            <Card sx={{ p: 3, borderRadius: 1, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <SectionHeader icon={<Info fontSize="small" />} title="基本情報" subtitle="クーポンのタイトルと説明" />
              <Stack spacing={2}>
                <TextField label="クーポンタイトル *" fullWidth value={editing.title}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                  helperText="LINE Coupon API: title (必須)" />
                <TextField label="説明文" fullWidth multiline rows={3}
                  value={editing.description}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  helperText="LINE Coupon API: description / 利用条件や注意事項" />
              </Stack>
            </Card>

            {/* カバー画像 */}
            <Card sx={{ p: 3, borderRadius: 1, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <SectionHeader icon={<ImageIcon fontSize="small" />} title="カバー画像" subtitle="HTTPS URL 必須" />
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
                  <Typography variant="caption" color="text.secondary">
                    LINE Coupon API: imageUrl
                  </Typography>
                </Box>
              </Box>
            </Card>

            {/* 特典 (reward) */}
            <Card sx={{ p: 3, borderRadius: 1, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <SectionHeader icon={<LocalOffer fontSize="small" />} title="特典内容 (reward)" subtitle="クーポンの種類と金額" />
              <Stack spacing={2}>
                <Box>
                  <FormLabel sx={{ fontSize: '0.8rem', fontWeight: 600, mb: 1, display: 'block' }}>特典タイプ *</FormLabel>
                  <ToggleButtonGroup value={editing.reward_type} exclusive
                    onChange={(_, v) => v && setEditing({ ...editing, reward_type: v })}
                    sx={{ flexWrap: 'wrap', gap: 1, '& .MuiToggleButton-root': {
                      border: '1px solid #cbd5e1 !important', borderRadius: '8px !important',
                      textTransform: 'none', fontWeight: 600,
                      '&.Mui-selected': {
                        background: theme.primaryGradient || theme.primary, color: 'white', borderColor: 'transparent !important',
                        '&:hover': { background: theme.primaryGradient || theme.primary, opacity: 0.9 },
                      },
                    }}}>
                    {REWARD_TYPES.map((r) => (
                      <ToggleButton key={r.value} value={r.value} sx={{ px: 2 }}>
                        {React.cloneElement(r.icon, { sx: { fontSize: 16, mr: 0.5 } })}
                        {r.label}
                      </ToggleButton>
                    ))}
                  </ToggleButtonGroup>
                </Box>

                {(editing.reward_type === 'discount' || editing.reward_type === 'cashBack') && (
                  <Box sx={{ p: 2, bgcolor: alpha(theme.primary, 0.04), borderRadius: 1 }}>
                    <FormLabel sx={{ fontSize: '0.8rem', fontWeight: 600, mb: 1, display: 'block' }}>金額タイプ</FormLabel>
                    <RadioGroup row value={editing.reward_price_info_type}
                      onChange={(e) => setEditing({ ...editing, reward_price_info_type: e.target.value })}>
                      <FormControlLabel value="fixed" control={<Radio size="small" sx={{ '&.Mui-checked': { color: theme.primary } }} />} label="定額" />
                      <FormControlLabel value="percentage" control={<Radio size="small" sx={{ '&.Mui-checked': { color: theme.primary } }} />} label="パーセンテージ" />
                    </RadioGroup>
                    <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                      {!isPercentage ? (
                        <>
                          <TextField label="固定金額 *" type="number" size="small" sx={{ flex: 1 }}
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
                        <TextField label="割引率 *" type="number" size="small" sx={{ flex: 1 }}
                          value={editing.reward_percentage}
                          onChange={(e) => setEditing({ ...editing, reward_percentage: e.target.value })}
                          InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }} />
                      )}
                    </Box>
                  </Box>
                )}
              </Stack>
            </Card>

            {/* 獲得条件 */}
            <Card sx={{ p: 3, borderRadius: 1, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <SectionHeader icon={<Casino fontSize="small" />} title="獲得条件 (acquisitionCondition)" subtitle="誰でも獲得できるか抽選か" />
              <RadioGroup row value={editing.acquisition_type}
                onChange={(e) => setEditing({ ...editing, acquisition_type: e.target.value })}>
                <FormControlLabel value="normal" control={<Radio sx={{ '&.Mui-checked': { color: theme.primary } }} />} label="通常 (誰でも獲得可)" />
                <FormControlLabel value="lottery" control={<Radio sx={{ '&.Mui-checked': { color: theme.primary } }} />} label="抽選" />
              </RadioGroup>

              {editing.acquisition_type === 'lottery' && (
                <Box sx={{ display: 'flex', gap: 2, mt: 1, p: 2, bgcolor: alpha(theme.primary, 0.04), borderRadius: 1 }}>
                  <TextField label="当選確率 *" type="number" size="small" sx={{ flex: 1 }}
                    value={editing.acquisition_lottery_probability}
                    onChange={(e) => setEditing({ ...editing, acquisition_lottery_probability: e.target.value })}
                    InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                    helperText="lotteryProbability" />
                  <TextField label="当選上限数 *" type="number" size="small" sx={{ flex: 1 }}
                    value={editing.acquisition_max_acquire_count}
                    onChange={(e) => setEditing({ ...editing, acquisition_max_acquire_count: e.target.value })}
                    helperText="-1 で無制限 / maxAcquireCount" />
                </Box>
              )}
            </Card>

            {/* 期間 */}
            <Card sx={{ p: 3, borderRadius: 1, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <SectionHeader icon={<Schedule fontSize="small" />} title="有効期間" subtitle="開始 / 終了 / タイムゾーン" />
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField label="開始日時 *" type="datetime-local" fullWidth size="small"
                    value={editing.start_at}
                    onChange={(e) => setEditing({ ...editing, start_at: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                    helperText="startTimestamp (現在以前の時刻で即時開始)" />
                  <TextField label="終了日時 *" type="datetime-local" fullWidth size="small"
                    value={editing.expires_at}
                    onChange={(e) => setEditing({ ...editing, expires_at: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                    helperText="endTimestamp" />
                </Box>
                <FormControl size="small" fullWidth>
                  <InputLabel>タイムゾーン</InputLabel>
                  <Select label="タイムゾーン" value={editing.coupon_timezone}
                    onChange={(e) => setEditing({ ...editing, coupon_timezone: e.target.value })}>
                    {TIMEZONES.map((t) => (
                      <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
            </Card>

            {/* 配布設定 */}
            <Card sx={{ p: 3, borderRadius: 1, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <SectionHeader icon={<VisibilityIcon fontSize="small" />} title="配布設定" subtitle="使用回数 / 公開範囲 / コード" />
              <Stack spacing={2}>
                <Box>
                  <FormLabel sx={{ fontSize: '0.8rem', fontWeight: 600, mb: 1, display: 'block' }}>
                    1人あたり使用回数 (maxUseCountPerTicket)
                  </FormLabel>
                  <RadioGroup row value={editing.max_use_count_per_ticket}
                    onChange={(e) => setEditing({ ...editing, max_use_count_per_ticket: Number(e.target.value) })}>
                    <FormControlLabel value={1} control={<Radio sx={{ '&.Mui-checked': { color: theme.primary } }} />} label="1回のみ" />
                    <FormControlLabel value={-1} control={<Radio sx={{ '&.Mui-checked': { color: theme.primary } }} />} label="無制限" />
                  </RadioGroup>
                </Box>
                <Box>
                  <FormLabel sx={{ fontSize: '0.8rem', fontWeight: 600, mb: 1, display: 'block' }}>
                    公開範囲 (visibility)
                  </FormLabel>
                  <RadioGroup row value={editing.visibility}
                    onChange={(e) => setEditing({ ...editing, visibility: e.target.value })}>
                    <FormControlLabel value="UNLISTED" control={<Radio sx={{ '&.Mui-checked': { color: theme.primary } }} />} label="UNLISTED (友だちのみ)" />
                    <FormControlLabel value="PUBLIC" control={<Radio sx={{ '&.Mui-checked': { color: theme.primary } }} />} label="PUBLIC (LINEヤフー掲載)" />
                  </RadioGroup>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField label="1人あたり獲得可能枚数" type="number" size="small" sx={{ flex: 1 }}
                    value={editing.max_ticket_per_user}
                    onChange={(e) => setEditing({ ...editing, max_ticket_per_user: e.target.value })}
                    helperText="maxTicketPerUser (空欄=未指定)" />
                  <TextField label="クーポンコード" size="small" sx={{ flex: 1 }}
                    value={editing.code}
                    onChange={(e) => setEditing({ ...editing, code: e.target.value })}
                    helperText="店舗スタッフが入力する識別コード" />
                </Box>
                <TextField label="利用条件 (usageCondition)" multiline rows={2} fullWidth size="small"
                  value={editing.usage_condition}
                  onChange={(e) => setEditing({ ...editing, usage_condition: e.target.value })}
                  helperText="例: 1,000円以上で使用可能" />
                <FormControlLabel
                  control={<Switch checked={editing.is_active}
                    onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} />}
                  label="クーポンを有効にする"
                />
              </Stack>
            </Card>
          </Stack>

          {/* === 右: プレビュー === */}
          <Box sx={{ position: { lg: 'sticky' }, top: 96, alignSelf: 'flex-start' }}>
            <Card sx={{ p: 2, borderRadius: 1, bgcolor: '#1e293b' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                <Tooltip title="LINE トーク内での見え方を反映したプレビュー">
                  <Info sx={{ color: '#94a3b8', fontSize: 16, mr: 0.5 }} />
                </Tooltip>
                <Typography variant="caption" sx={{ color: '#cbd5e1', fontWeight: 600, letterSpacing: 0.5 }}>
                  LINE プレビュー
                </Typography>
              </Box>
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
          {coupons.map((c) => {
            const t = c.title || c.name;
            const rewardTxt = (() => {
              if (c.reward_type === 'discount' || c.reward_type === 'cashBack') {
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
                      <Chip icon={<Casino sx={{ fontSize: 12 }} />} label={`抽選${c.acquisition_lottery_probability ? ` ${c.acquisition_lottery_probability}%` : ''}`}
                        size="small" sx={{ bgcolor: '#fef3c7', color: '#92400e', fontWeight: 600 }} />
                    )}
                    {c.visibility === 'PUBLIC' && <Chip label="PUBLIC" size="small" sx={{ bgcolor: '#dbeafe', color: '#1e40af', fontWeight: 600 }} />}
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
