import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Card, TextField, IconButton, Chip,
  CircularProgress, Stack, Divider, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
} from '@mui/material';
import {
  Add, Delete, Edit, FilterAlt, Visibility, ArrowBack,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import {
  fetchSegments, upsertSegment, deleteSegment,
  fetchCompanyStores, fetchAudienceList,
} from '../../../lib/lineMessaging';
import { usePartnerTheme } from '../../../contexts/PartnerThemeContext';
import ConfirmDialog from './ConfirmDialog';

// result_type 1-12 のラベル (推奨者/中立者/批判者 × 安定/新規リピーター/離脱)
const getResultTypeLabel = (t) => {
  const npsLabel = t <= 4 ? '推奨者' : t <= 8 ? '中立者' : '批判者';
  const isRepeater = t % 2 === 1;
  const hasRevisit = [1, 2, 5, 6, 9, 10].includes(t);
  let cat;
  if (isRepeater && hasRevisit) cat = '安定リピーター';
  else if (isRepeater && !hasRevisit) cat = 'リピーター離脱';
  else if (!isRepeater && hasRevisit) cat = '新規リピーター';
  else cat = '新規離脱';
  return `${cat} × ${npsLabel}`;
};

const RESULT_TYPES = Array.from({ length: 12 }, (_, i) => ({
  value: i + 1, label: getResultTypeLabel(i + 1),
}));

const QSC_OPTIONS = [
  { value: 'quality', label: '品質 (Q)' },
  { value: 'service', label: '接客 (S)' },
  { value: 'cleanliness', label: '清潔感 (C)' },
];

const PREFERENCES = ['品質', '接客', '空間', '衛生', '価格感度'];

const empty = {
  id: null, name: '', description: '',
  conditions: {
    store_ids: [], result_types: [], selected_qsc: [],
    top_preferences: [], second_preferences: [],
    answered_from: '', answered_to: '',
  },
};

// Chip toggle group
function ChipMultiSelect({ options, selected, onChange, getKey, getLabel }) {
  const theme = usePartnerTheme();
  const isSelected = (v) => selected.includes(v);
  const toggle = (v) => onChange(isSelected(v) ? selected.filter(x => x !== v) : [...selected, v]);
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
      {options.map((opt) => {
        const k = getKey ? getKey(opt) : opt;
        const lbl = getLabel ? getLabel(opt) : (opt.label ?? String(opt));
        const sel = isSelected(k);
        return (
          <Chip key={k} label={lbl}
            onClick={() => toggle(k)}
            variant={sel ? 'filled' : 'outlined'}
            sx={{
              fontWeight: 600,
              background: sel ? (theme.primaryGradient || theme.primary) : 'transparent',
              color: sel ? 'white' : '#475569',
              borderColor: sel ? 'transparent' : '#cbd5e1',
              '&:hover': { background: sel ? (theme.primaryGradient || theme.primary) : '#f1f5f9', opacity: sel ? 0.9 : 1 },
            }}
          />
        );
      })}
    </Box>
  );
}

export default function SegmentsTab({ companyId }) {
  const theme = usePartnerTheme();
  const [segments, setSegments] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('list');
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [audience, setAudience] = useState([]);
  const [audienceCount, setAudienceCount] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const load = async () => {
    if (!companyId) return;
    try {
      setLoading(true);
      const [s, st] = await Promise.all([fetchSegments(companyId), fetchCompanyStores(companyId)]);
      setSegments(s); setStores(st);
    } catch (e) {
      toast.error('セグメント一覧の取得失敗');
    } finally { setLoading(false); }
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [companyId]);

  const openNew = () => {
    setEditing(JSON.parse(JSON.stringify(empty)));
    setAudience([]); setAudienceCount(null); setMode('form');
  };
  const openEdit = (s) => {
    setEditing({
      id: s.id, name: s.name, description: s.description || '',
      conditions: {
        store_ids: s.conditions?.store_ids || [],
        result_types: s.conditions?.result_types || [],
        selected_qsc: s.conditions?.selected_qsc || [],
        top_preferences: s.conditions?.top_preferences || [],
        second_preferences: s.conditions?.second_preferences || [],
        answered_from: s.conditions?.answered_from || '',
        answered_to: s.conditions?.answered_to || '',
      },
    });
    setAudience([]); setAudienceCount(null); setMode('form');
  };
  const backToList = () => { setEditing(null); setMode('list'); };

  const cleanConditions = () => {
    const c = { ...editing.conditions };
    if (!c.answered_from) delete c.answered_from;
    if (!c.answered_to) delete c.answered_to;
    return c;
  };

  const handleSave = async () => {
    if (!editing.name.trim()) return toast.error('セグメント名を入力してください');
    try {
      setSaving(true);
      await upsertSegment({
        id: editing.id, companyId,
        name: editing.name.trim(),
        description: editing.description || null,
        conditions: cleanConditions(),
      });
      toast.success('セグメントを保存しました');
      backToList();
      await load();
    } catch (e) {
      toast.error(e?.message || '保存失敗');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteSegment(confirmDelete.id);
      toast.success('削除しました');
      setConfirmDelete(null);
      await load();
    } catch (e) { toast.error(e?.message || '削除失敗'); }
  };

  const handlePreview = async () => {
    try {
      setPreviewing(true);
      const list = await fetchAudienceList({ companyId, conditions: cleanConditions(), limit: 500 });
      setAudience(list);
      setAudienceCount(list.length);
    } catch (e) {
      toast.error(e?.message || 'プレビュー失敗');
    } finally { setPreviewing(false); }
  };

  const summarize = (s) => {
    const c = s.conditions || {};
    const chips = [];
    if (c.store_ids?.length) chips.push(`店舗 ${c.store_ids.length}件`);
    if (c.result_types?.length) chips.push(`タイプ ${c.result_types.length}件`);
    if (c.selected_qsc?.length) chips.push(`QSC ${c.selected_qsc.length}件`);
    if (c.top_preferences?.length) chips.push(`重視 ${c.top_preferences.length}件`);
    if (c.second_preferences?.length) chips.push(`次点 ${c.second_preferences.length}件`);
    if (c.answered_from || c.answered_to) chips.push('期間指定');
    return chips;
  };

  if (mode === 'form' && editing) {
    return (
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={backToList} sx={{ mr: 1 }}><ArrowBack /></IconButton>
          <Typography variant="h6" sx={{ fontWeight: 700, flex: 1 }}>
            {editing.id ? 'セグメントを編集' : '新規セグメント'}
          </Typography>
        </Box>

        <Card sx={{ p: 3, borderRadius: 1, boxShadow: '0 4px 12px rgba(0,0,0,0.06)', mb: 2 }}>
          <Stack spacing={2.5}>
            <TextField label="セグメント名 *" fullWidth value={editing.name}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            <TextField label="説明" fullWidth value={editing.description}
              onChange={(e) => setEditing({ ...editing, description: e.target.value })} />

            <Divider />

            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>店舗</Typography>
              <ChipMultiSelect options={stores}
                getKey={(s) => s.id} getLabel={(s) => s.name}
                selected={editing.conditions.store_ids}
                onChange={(arr) => setEditing({ ...editing, conditions: { ...editing.conditions, store_ids: arr } })} />
            </Box>

            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>回答タイプ (12 分類)</Typography>
              <ChipMultiSelect options={RESULT_TYPES}
                getKey={(o) => o.value}
                getLabel={(o) => `${o.value}. ${o.label}`}
                selected={editing.conditions.result_types}
                onChange={(arr) => setEditing({ ...editing, conditions: { ...editing.conditions, result_types: arr } })} />
            </Box>

            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>選択 QSC</Typography>
              <ChipMultiSelect options={QSC_OPTIONS}
                getKey={(o) => o.value}
                selected={editing.conditions.selected_qsc}
                onChange={(arr) => setEditing({ ...editing, conditions: { ...editing.conditions, selected_qsc: arr } })} />
            </Box>

            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>最重視 (top preference)</Typography>
              <ChipMultiSelect options={PREFERENCES}
                selected={editing.conditions.top_preferences}
                onChange={(arr) => setEditing({ ...editing, conditions: { ...editing.conditions, top_preferences: arr } })} />
            </Box>

            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>次点 (second preference)</Typography>
              <ChipMultiSelect options={PREFERENCES}
                selected={editing.conditions.second_preferences}
                onChange={(arr) => setEditing({ ...editing, conditions: { ...editing.conditions, second_preferences: arr } })} />
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField label="回答日 (開始)" type="datetime-local" fullWidth size="small"
                value={editing.conditions.answered_from}
                onChange={(e) => setEditing({ ...editing, conditions: { ...editing.conditions, answered_from: e.target.value } })}
                InputLabelProps={{ shrink: true }} />
              <TextField label="回答日 (終了)" type="datetime-local" fullWidth size="small"
                value={editing.conditions.answered_to}
                onChange={(e) => setEditing({ ...editing, conditions: { ...editing.conditions, answered_to: e.target.value } })}
                InputLabelProps={{ shrink: true }} />
            </Box>

            <Divider />

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Button startIcon={previewing ? <CircularProgress size={16} sx={{ color: 'white' }} /> : <Visibility />}
                onClick={handlePreview} disabled={previewing} variant="contained"
                sx={{
                  background: theme.primaryGradient || theme.primary, color: 'white',
                  '&:hover': { background: theme.primaryGradient || theme.primary, opacity: 0.9 },
                }}>
                対象ユーザーを表示
              </Button>
              {audienceCount !== null && (
                <Alert severity="info" sx={{ flex: 1, py: 0 }}>
                  対象 LINE ユーザー数: <strong>{audienceCount}</strong> 名
                </Alert>
              )}
            </Box>

            {audience.length > 0 && (
              <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 400 }}>
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
        <Typography variant="h6" sx={{ fontWeight: 700, flex: 1 }}>ターゲットセグメント</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={openNew}
          sx={{
            background: theme.primaryGradient || theme.primary, color: 'white', px: 3,
            '&:hover': { background: theme.primaryGradient || theme.primary, opacity: 0.9 },
          }}>
          新規セグメント
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress sx={{ color: theme.primary }} /></Box>
      ) : segments.length === 0 ? (
        <Card sx={{ p: 6, textAlign: 'center', borderRadius: 1 }}>
          <FilterAlt sx={{ fontSize: 48, color: '#cbd5e1', mb: 1 }} />
          <Typography color="text.secondary">セグメントがまだありません</Typography>
        </Card>
      ) : (
        <Stack spacing={1.5}>
          {segments.map((s) => {
            const chips = summarize(s);
            return (
              <Card key={s.id} sx={{ borderRadius: 1, p: 2, cursor: 'pointer', transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', gap: 2,
                '&:hover': { boxShadow: '0 6px 18px rgba(0,0,0,0.1)', transform: 'translateY(-1px)' },
              }} onClick={() => openEdit(s)}>
                <Box sx={{
                  width: 48, height: 48, borderRadius: 1,
                  background: theme.primaryAlpha10 || `${theme.primary}1a`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <FilterAlt sx={{ color: theme.primary }} />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 700, mb: 0.5 }}>{s.name}</Typography>
                  {s.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>{s.description}</Typography>
                  )}
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {chips.length === 0 ? (
                      <Chip label="条件なし (全員)" size="small" />
                    ) : chips.map((c, i) => (
                      <Chip key={i} label={c} size="small"
                        sx={{ bgcolor: theme.primaryAlpha10 || `${theme.primary}1a`, color: theme.primary, fontWeight: 600 }} />
                    ))}
                  </Box>
                </Box>
                <Box>
                  <IconButton onClick={(e) => { e.stopPropagation(); openEdit(s); }}><Edit /></IconButton>
                  <IconButton onClick={(e) => { e.stopPropagation(); setConfirmDelete(s); }} sx={{ color: '#ef4444' }}><Delete /></IconButton>
                </Box>
              </Card>
            );
          })}
        </Stack>
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        title="セグメントを削除"
        message={`「${confirmDelete?.name}」を削除します。よろしいですか?`}
        confirmLabel="削除"
        danger
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </Box>
  );
}
