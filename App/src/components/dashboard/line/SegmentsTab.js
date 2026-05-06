import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Button, Card, TextField, IconButton, Chip,
  CircularProgress, Stack, Divider,
  alpha,
} from '@mui/material';
import {
  Add, Delete, Edit, FilterAlt, ArrowBack, Tune, Save, PlayArrow,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import {
  fetchSegments, upsertSegment, deleteSegment,
  fetchCompanyStores, fetchAudienceList,
} from '../../../lib/lineMessaging';
import { usePartnerTheme } from '../../../contexts/PartnerThemeContext';
import ConfirmDialog from './ConfirmDialog';
import LineAudienceTable from './LineAudienceTable';

const NPS_OPTIONS = [
  { value: 'promoter', label: '推奨者' },
  { value: 'passive', label: '中立者' },
  { value: 'detractor', label: '批判者' },
];

const QSC_OPTIONS = [
  { value: 'quality', label: '品質 (Q)' },
  { value: 'service', label: '接客 (S)' },
  { value: 'cleanliness', label: '清潔感 (C)' },
];

const PREFERENCES = ['品質', '接客', '空間', '衛生', '価格感度'];

const empty = {
  id: null, name: '', description: '',
  conditions: {
    store_ids: [], selected_qsc: [],
    top_preferences: [], second_preferences: [],
    nps_segments: [],
    is_repeater: null,        // null=指定なし / true=リピーター / false=新規
    has_revisit_intent: null, // 同
    answered_from: '', answered_to: '',
  },
};

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

// 三値 toggle (全体 / true / false)
function ChipTernary({ value, onChange, trueLabel, falseLabel }) {
  const theme = usePartnerTheme();
  const opts = [
    { val: null, label: '全体' },
    { val: true, label: trueLabel },
    { val: false, label: falseLabel },
  ];
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
      {opts.map((o) => {
        const sel = value === o.val;
        return (
          <Chip key={String(o.val)} label={o.label}
            onClick={() => onChange(o.val)}
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

const NPS_LABELS = { promoter: '推奨者', passive: '中立者', detractor: '批判者' };

export default function SegmentsTab({ companyId, onFormModeChange }) {
  const theme = usePartnerTheme();
  const [segments, setSegments] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('list');
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [audience, setAudience] = useState([]);
  const [audienceLoading, setAudienceLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const load = async () => {
    if (!companyId) return;
    try {
      setLoading(true);
      const [s, st] = await Promise.all([fetchSegments(companyId), fetchCompanyStores(companyId)]);
      setSegments(s); setStores(st);
    } catch (e) { toast.error('セグメント一覧の取得失敗'); }
    finally { setLoading(false); }
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [companyId]);

  useEffect(() => {
    onFormModeChange?.(mode === 'form');
    return () => onFormModeChange?.(false);
  }, [mode, onFormModeChange]);

  const cleanConditions = useCallback((c) => {
    const out = { ...c };
    if (!out.answered_from) delete out.answered_from;
    if (!out.answered_to) delete out.answered_to;
    if (out.is_repeater === null || out.is_repeater === undefined) delete out.is_repeater;
    if (out.has_revisit_intent === null || out.has_revisit_intent === undefined) delete out.has_revisit_intent;
    return out;
  }, []);

  const runFilter = useCallback(async (conditions) => {
    if (!companyId) return;
    try {
      setAudienceLoading(true);
      const list = await fetchAudienceList({ companyId, conditions: cleanConditions(conditions), limit: 5000 });
      setAudience(list);
    } catch (e) {
      toast.error(e?.message || 'フィルタ失敗');
    } finally { setAudienceLoading(false); }
  }, [companyId, cleanConditions]);

  const openNew = async () => {
    const initial = JSON.parse(JSON.stringify(empty));
    setEditing(initial);
    setAudience([]);
    setMode('form');
    // 初期表示で全員表示
    await runFilter(initial.conditions);
  };
  const openEdit = async (s) => {
    const e = {
      id: s.id, name: s.name, description: s.description || '',
      conditions: {
        store_ids: s.conditions?.store_ids || [],
        selected_qsc: s.conditions?.selected_qsc || [],
        top_preferences: s.conditions?.top_preferences || [],
        second_preferences: s.conditions?.second_preferences || [],
        nps_segments: s.conditions?.nps_segments || [],
        is_repeater: typeof s.conditions?.is_repeater === 'boolean' ? s.conditions.is_repeater : null,
        has_revisit_intent: typeof s.conditions?.has_revisit_intent === 'boolean' ? s.conditions.has_revisit_intent : null,
        answered_from: s.conditions?.answered_from || '',
        answered_to: s.conditions?.answered_to || '',
      },
    };
    setEditing(e);
    setAudience([]);
    setMode('form');
    await runFilter(e.conditions);
  };
  const backToList = () => { setEditing(null); setAudience([]); setMode('list'); };

  const handleSave = async () => {
    if (!editing.name.trim()) return toast.error('セグメント名を入力してください');
    try {
      setSaving(true);
      await upsertSegment({
        id: editing.id, companyId,
        name: editing.name.trim(),
        description: editing.description || null,
        conditions: cleanConditions(editing.conditions),
      });
      toast.success('セグメントを保存しました');
      backToList();
      await load();
    } catch (e) { toast.error(e?.message || '保存失敗'); }
    finally { setSaving(false); }
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

  const summarize = (s) => {
    const c = s.conditions || {};
    const chips = [];
    if (c.store_ids?.length) chips.push(`店舗 ${c.store_ids.length}件`);
    if (c.nps_segments?.length) chips.push(`推奨度 ${c.nps_segments.map(n => NPS_LABELS[n]).join('/')}`);
    if (typeof c.is_repeater === 'boolean') chips.push(c.is_repeater ? 'リピーター' : '新規');
    if (typeof c.has_revisit_intent === 'boolean') chips.push(c.has_revisit_intent ? 'リピート意向あり' : 'リピート意向なし');
    if (c.selected_qsc?.length) chips.push(`QSC ${c.selected_qsc.length}件`);
    if (c.top_preferences?.length) chips.push(`重視 ${c.top_preferences.length}件`);
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
          <Button onClick={handleSave} variant="contained" disabled={saving} startIcon={<Save />}
            sx={{
              background: theme.primaryGradient || theme.primary, color: 'white', px: 3, fontWeight: 600,
              '&:hover': { background: theme.primaryGradient || theme.primary, opacity: 0.9 },
            }}>
            {saving ? <CircularProgress size={20} sx={{ color: 'white' }} /> : '保存'}
          </Button>
        </Box>

        {/* 名前/説明 */}
        <Card sx={{ p: 3, borderRadius: 1, boxShadow: '0 4px 12px rgba(0,0,0,0.06)', mb: 2 }}>
          <Stack spacing={2}>
            <TextField label="セグメント名 *" fullWidth value={editing.name}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            <TextField label="説明" fullWidth value={editing.description}
              onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
          </Stack>
        </Card>

        {/* フィルタ条件 */}
        <Card sx={{ p: 3, borderRadius: 1, boxShadow: '0 4px 12px rgba(0,0,0,0.06)', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Tune sx={{ color: theme.primary, mr: 1 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 700, flex: 1 }}>フィルタ条件</Typography>
            <Button onClick={() => runFilter(editing.conditions)} disabled={audienceLoading}
              variant="contained" startIcon={audienceLoading ? <CircularProgress size={16} sx={{ color: 'white' }} /> : <PlayArrow />}
              sx={{
                background: theme.primaryGradient || theme.primary, color: 'white', fontWeight: 600,
                '&:hover': { background: theme.primaryGradient || theme.primary, opacity: 0.9 },
              }}>
              フィルタリング
            </Button>
          </Box>

          <Stack spacing={2.5}>
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 1 }}>
                推奨度 (NPS)
              </Typography>
              <ChipMultiSelect options={NPS_OPTIONS}
                getKey={(o) => o.value}
                selected={editing.conditions.nps_segments}
                onChange={(arr) => setEditing({ ...editing, conditions: { ...editing.conditions, nps_segments: arr } })} />
            </Box>

            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 1 }}>
                リピーター区分
              </Typography>
              <ChipTernary value={editing.conditions.is_repeater}
                trueLabel="リピーターのみ" falseLabel="新規のみ"
                onChange={(v) => setEditing({ ...editing, conditions: { ...editing.conditions, is_repeater: v } })} />
            </Box>

            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 1 }}>
                リピート意向
              </Typography>
              <ChipTernary value={editing.conditions.has_revisit_intent}
                trueLabel="意向あり" falseLabel="意向なし"
                onChange={(v) => setEditing({ ...editing, conditions: { ...editing.conditions, has_revisit_intent: v } })} />
            </Box>

            <Divider />

            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 1 }}>
                店舗
              </Typography>
              <ChipMultiSelect options={stores}
                getKey={(s) => s.id} getLabel={(s) => s.name}
                selected={editing.conditions.store_ids}
                onChange={(arr) => setEditing({ ...editing, conditions: { ...editing.conditions, store_ids: arr } })} />
            </Box>

            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 1 }}>
                選択 QSC
              </Typography>
              <ChipMultiSelect options={QSC_OPTIONS}
                getKey={(o) => o.value}
                selected={editing.conditions.selected_qsc}
                onChange={(arr) => setEditing({ ...editing, conditions: { ...editing.conditions, selected_qsc: arr } })} />
            </Box>

            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 1 }}>
                最重視 (top preference)
              </Typography>
              <ChipMultiSelect options={PREFERENCES}
                selected={editing.conditions.top_preferences}
                onChange={(arr) => setEditing({ ...editing, conditions: { ...editing.conditions, top_preferences: arr } })} />
            </Box>

            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 1 }}>
                次点 (second preference)
              </Typography>
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
          </Stack>
        </Card>

        {/* 対象ユーザー表 */}
        <Card sx={{ borderRadius: 1, boxShadow: '0 4px 12px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <Box sx={{
            px: 3, py: 2,
            display: 'flex', alignItems: 'center', gap: 2,
            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
            borderBottom: '1px solid #e2e8f0',
          }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, flex: 1 }}>対象ユーザー</Typography>
            <Chip label={`${audience.length} 名`} size="small"
              sx={{ bgcolor: theme.primaryAlpha10 || alpha(theme.primary, 0.1), color: theme.primary, fontWeight: 700 }} />
          </Box>
          <LineAudienceTable rows={audience} loading={audienceLoading}
            emptyHint="条件を変更して「フィルタリング」をクリックしてください" />
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
                  background: theme.primaryAlpha10 || alpha(theme.primary, 0.1),
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
                        sx={{ bgcolor: theme.primaryAlpha10 || alpha(theme.primary, 0.1), color: theme.primary, fontWeight: 600 }} />
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
