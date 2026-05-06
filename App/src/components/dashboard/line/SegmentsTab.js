import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Button, Card, TextField, IconButton, Chip,
  CircularProgress, Stack, alpha,
} from '@mui/material';
import {
  Add, Delete, Edit, FilterAlt, ArrowBack, Save, Visibility,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import {
  fetchSegments, upsertSegment, deleteSegment,
  fetchCompanyStores, fetchAudienceList,
} from '../../../lib/lineMessaging';
import { usePartnerTheme } from '../../../contexts/PartnerThemeContext';
import ConfirmDialog from './ConfirmDialog';
import LineAudienceTable from './LineAudienceTable';
import { ListSkeleton } from './LineSkeletons';

const NPS_OPTIONS = [
  { value: 'promoter', label: '推奨者' },
  { value: 'passive', label: '中立者' },
  { value: 'detractor', label: '批判者' },
];

const NPS_LABELS = { promoter: '推奨者', passive: '中立者', detractor: '批判者' };

// 回答属性 (preset_question_answer)
const GENDERS = ['男性', '女性', 'その他'];
const AGE_GROUPS = [
  '~19歳', '20歳~24歳', '25歳~29歳', '30歳~34歳', '35歳~39歳',
  '40歳~44歳', '45歳~49歳', '50歳~54歳', '55歳~59歳',
  '60歳~69歳', '70歳~79歳', '80歳~',
];
const VISIT_COUNTS = ['初めて', '2回目', '3回目', '4回目', '5回目', '6回目~10回目', '11回目以上'];
const COMPANIONS = [
  'お一人', 'ご家族', 'ご友人', '恋人・パートナー',
  '職場の同僚', 'お取引先・ビジネス関係', 'その他',
];
const REVISIT_PERIODS = ['1ヶ月以内', '3ヶ月以内', '6ヶ月以内', '10ヶ月以内', '1年以内', '1年以上'];

const empty = {
  id: null, name: '', description: '',
  conditions: {
    store_ids: [],
    nps_segments: [],
    is_repeater: null,
    has_revisit_intent: null,
    genders: [],
    age_groups: [],
    visit_counts: [],
    companions: [],
    revisit_periods: [],
    answered_from: '', answered_to: '',
  },
};

function SectionHeader({ title, optional }) {
  const theme = usePartnerTheme();
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2.5 }}>
      <Box sx={{
        width: 4, height: 24, borderRadius: 4,
        background: theme.primaryGradient || theme.primary, mr: 1.5,
      }} />
      <Typography sx={{ fontWeight: 700, fontSize: '1rem' }}>
        {title}
        {optional && <Box component="span" sx={{ ml: 0.75, color: '#94a3b8', fontSize: '0.78em', fontWeight: 400 }}>(任意)</Box>}
      </Typography>
    </Box>
  );
}

function FieldLabel({ children, optional }) {
  return (
    <Typography sx={{
      fontSize: '0.78rem', fontWeight: 700, color: '#475569',
      mb: 1, display: 'block', letterSpacing: 0.3,
    }}>
      {children}
      {optional && <Box component="span" sx={{ ml: 0.5, color: '#94a3b8', fontWeight: 400 }}>(任意)</Box>}
    </Typography>
  );
}

function ChipMultiSelect({ options, selected, onChange, getKey, getLabel }) {
  const theme = usePartnerTheme();
  const safeSelected = Array.isArray(selected) ? selected : [];
  const isSelected = (v) => safeSelected.includes(v);
  const toggle = (v) => onChange(isSelected(v) ? safeSelected.filter(x => x !== v) : [...safeSelected, v]);
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
              fontWeight: 600, height: 32,
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

function ChipTernary({ value, onChange, trueLabel, falseLabel }) {
  const theme = usePartnerTheme();
  const opts = [
    { val: null, label: '指定なし' },
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
              fontWeight: 600, height: 32,
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
    await runFilter(initial.conditions);
  };
  const openEdit = async (s) => {
    const e = {
      id: s.id, name: s.name, description: s.description || '',
      conditions: {
        store_ids: s.conditions?.store_ids || [],
        nps_segments: s.conditions?.nps_segments || [],
        is_repeater: typeof s.conditions?.is_repeater === 'boolean' ? s.conditions.is_repeater : null,
        has_revisit_intent: typeof s.conditions?.has_revisit_intent === 'boolean' ? s.conditions.has_revisit_intent : null,
        genders: s.conditions?.genders || [],
        age_groups: s.conditions?.age_groups || [],
        visit_counts: s.conditions?.visit_counts || [],
        companions: s.conditions?.companions || [],
        revisit_periods: s.conditions?.revisit_periods || [],
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
    if (c.genders?.length) chips.push(`性別 ${c.genders.join('/')}`);
    if (c.age_groups?.length) chips.push(`年齢 ${c.age_groups.length}件`);
    if (c.visit_counts?.length) chips.push(`来店回数 ${c.visit_counts.length}件`);
    if (c.companions?.length) chips.push(`同伴者 ${c.companions.length}件`);
    if (c.revisit_periods?.length) chips.push(`再訪時期 ${c.revisit_periods.length}件`);
    if (c.answered_from || c.answered_to) chips.push('期間指定');
    return chips;
  };

  if (mode === 'form' && editing) {
    return (
      <Box sx={{ minHeight: '100%', background: '#f8fafc' }}>
        {/* スティッキーヘッダー */}
        <Box sx={{
          position: 'sticky', top: 0, zIndex: 10,
          backgroundColor: '#fff', borderBottom: '1px solid #e2e8f0',
          px: 3, py: 2, display: 'flex', alignItems: 'center', gap: 2,
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        }}>
          <IconButton onClick={backToList}><ArrowBack /></IconButton>
          <Typography variant="h6" sx={{ fontWeight: 700, flex: 1 }}>
            {editing.id ? 'セグメントを編集' : '新規セグメント作成'}
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

            {/* 基本情報 */}
            <Card sx={{ p: 3, borderRadius: 1, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <SectionHeader title="基本情報" />
              <Stack spacing={2.5}>
                <TextField label="セグメント名" fullWidth value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
                <TextField
                  label={<Box component="span">説明<Box component="span" sx={{ ml: 0.5, color: '#94a3b8', fontSize: '0.78em' }}>(任意)</Box></Box>}
                  fullWidth value={editing.description}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
              </Stack>
            </Card>

            {/* ユーザー属性 */}
            <Card sx={{ p: 3, borderRadius: 1, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <SectionHeader title="ユーザー属性" optional />
              <Stack spacing={2.5}>
                <Box>
                  <FieldLabel>推奨度 (NPS)</FieldLabel>
                  <ChipMultiSelect options={NPS_OPTIONS}
                    getKey={(o) => o.value}
                    selected={editing.conditions.nps_segments}
                    onChange={(arr) => setEditing({ ...editing, conditions: { ...editing.conditions, nps_segments: arr } })} />
                </Box>
                <Box>
                  <FieldLabel>リピーター区分</FieldLabel>
                  <ChipTernary value={editing.conditions.is_repeater}
                    trueLabel="リピーターのみ" falseLabel="新規のみ"
                    onChange={(v) => setEditing({ ...editing, conditions: { ...editing.conditions, is_repeater: v } })} />
                </Box>
                <Box>
                  <FieldLabel>リピート意向</FieldLabel>
                  <ChipTernary value={editing.conditions.has_revisit_intent}
                    trueLabel="意向あり" falseLabel="意向なし"
                    onChange={(v) => setEditing({ ...editing, conditions: { ...editing.conditions, has_revisit_intent: v } })} />
                </Box>
              </Stack>
            </Card>

            {/* 来店者属性 */}
            <Card sx={{ p: 3, borderRadius: 1, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <SectionHeader title="来店者属性" optional />
              <Stack spacing={2.5}>
                <Box>
                  <FieldLabel>店舗</FieldLabel>
                  <ChipMultiSelect options={stores}
                    getKey={(s) => s.id} getLabel={(s) => s.name}
                    selected={editing.conditions.store_ids}
                    onChange={(arr) => setEditing({ ...editing, conditions: { ...editing.conditions, store_ids: arr } })} />
                </Box>
                <Box>
                  <FieldLabel>性別</FieldLabel>
                  <ChipMultiSelect options={GENDERS}
                    selected={editing.conditions.genders}
                    onChange={(arr) => setEditing({ ...editing, conditions: { ...editing.conditions, genders: arr } })} />
                </Box>
                <Box>
                  <FieldLabel>年齢層</FieldLabel>
                  <ChipMultiSelect options={AGE_GROUPS}
                    selected={editing.conditions.age_groups}
                    onChange={(arr) => setEditing({ ...editing, conditions: { ...editing.conditions, age_groups: arr } })} />
                </Box>
                <Box>
                  <FieldLabel>来店回数</FieldLabel>
                  <ChipMultiSelect options={VISIT_COUNTS}
                    selected={editing.conditions.visit_counts}
                    onChange={(arr) => setEditing({ ...editing, conditions: { ...editing.conditions, visit_counts: arr } })} />
                </Box>
                <Box>
                  <FieldLabel>同伴者</FieldLabel>
                  <ChipMultiSelect options={COMPANIONS}
                    selected={editing.conditions.companions}
                    onChange={(arr) => setEditing({ ...editing, conditions: { ...editing.conditions, companions: arr } })} />
                </Box>
                <Box>
                  <FieldLabel>再訪意向時期</FieldLabel>
                  <ChipMultiSelect options={REVISIT_PERIODS}
                    selected={editing.conditions.revisit_periods}
                    onChange={(arr) => setEditing({ ...editing, conditions: { ...editing.conditions, revisit_periods: arr } })} />
                </Box>
              </Stack>
            </Card>

            {/* 回答期間 */}
            <Card sx={{ p: 3, borderRadius: 1, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <SectionHeader title="回答期間" optional />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField label="開始日時" type="datetime-local" fullWidth size="small"
                  value={editing.conditions.answered_from}
                  onChange={(e) => setEditing({ ...editing, conditions: { ...editing.conditions, answered_from: e.target.value } })}
                  InputLabelProps={{ shrink: true }} />
                <TextField label="終了日時" type="datetime-local" fullWidth size="small"
                  value={editing.conditions.answered_to}
                  onChange={(e) => setEditing({ ...editing, conditions: { ...editing.conditions, answered_to: e.target.value } })}
                  InputLabelProps={{ shrink: true }} />
              </Box>
            </Card>

            {/* 対象ユーザー */}
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
                <Button onClick={() => runFilter(editing.conditions)} disabled={audienceLoading}
                  variant="contained" size="small"
                  startIcon={audienceLoading ? <CircularProgress size={14} sx={{ color: 'white' }} /> : <Visibility />}
                  sx={{
                    background: theme.primaryGradient || theme.primary, color: 'white', fontWeight: 600,
                    '&:hover': { background: theme.primaryGradient || theme.primary, opacity: 0.9 },
                  }}>
                  絞り込み
                </Button>
              </Box>
              <LineAudienceTable rows={audience} loading={audienceLoading}
                emptyHint="条件を変更して「絞り込み」をクリック" />
            </Card>
          </Stack>
        </Box>
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
        <ListSkeleton count={4} />
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
                  background: alpha(theme.primary, 0.1),
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
                        sx={{ bgcolor: alpha(theme.primary, 0.1), color: theme.primary, fontWeight: 600 }} />
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
