import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Card, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, IconButton, ListItem, ListItemText, CircularProgress,
  Stack, FormControl, InputLabel, Select, MenuItem, OutlinedInput, Checkbox,
  Alert,
} from '@mui/material';
import { Add, Delete, Edit, FilterAlt, Visibility } from '@mui/icons-material';
import toast from 'react-hot-toast';
import {
  fetchSegments, upsertSegment, deleteSegment,
  fetchCompanyStores, previewAudience,
} from '../../../lib/lineMessaging';

const RESULT_TYPES = [
  { value: 1, label: '評価1 (満足)' },
  { value: 2, label: '評価2' },
  { value: 3, label: '評価3' },
  { value: 4, label: '評価4' },
  { value: 5, label: '評価5 (不満)' },
];

const QSC_OPTIONS = [
  { value: 'cleanliness', label: '清潔感' },
  { value: 'quality', label: '品質' },
  { value: 'service', label: 'サービス' },
];

const empty = {
  id: null, name: '', description: '',
  conditions: { store_ids: [], result_types: [], selected_qsc: [], answered_from: '', answered_to: '' },
};

export default function SegmentsTab({ companyId }) {
  const [segments, setSegments] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [previewCount, setPreviewCount] = useState(null);

  const load = async () => {
    if (!companyId) return;
    try {
      setLoading(true);
      const [s, st] = await Promise.all([fetchSegments(companyId), fetchCompanyStores(companyId)]);
      setSegments(s);
      setStores(st);
    } catch (e) {
      toast.error('セグメント一覧の取得失敗');
    } finally { setLoading(false); }
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [companyId]);

  const openNew = () => {
    setEditing(JSON.parse(JSON.stringify(empty)));
    setPreviewCount(null);
  };
  const openEdit = (s) => {
    setEditing({
      id: s.id, name: s.name, description: s.description || '',
      conditions: {
        store_ids: s.conditions?.store_ids || [],
        result_types: s.conditions?.result_types || [],
        selected_qsc: s.conditions?.selected_qsc || [],
        answered_from: s.conditions?.answered_from || '',
        answered_to: s.conditions?.answered_to || '',
      },
    });
    setPreviewCount(null);
  };

  const handleSave = async () => {
    if (!editing.name.trim()) return toast.error('セグメント名を入力してください');
    try {
      setSaving(true);
      const conditions = { ...editing.conditions };
      // 空文字を除外
      if (!conditions.answered_from) delete conditions.answered_from;
      if (!conditions.answered_to) delete conditions.answered_to;
      await upsertSegment({
        id: editing.id, companyId,
        name: editing.name.trim(),
        description: editing.description || null,
        conditions,
      });
      toast.success('セグメントを保存しました');
      setEditing(null);
      await load();
    } catch (e) {
      toast.error(e?.message || '保存失敗');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('このセグメントを削除しますか?')) return;
    try {
      await deleteSegment(id);
      toast.success('削除しました');
      await load();
    } catch (e) { toast.error(e?.message || '削除失敗'); }
  };

  const handlePreview = async () => {
    try {
      setPreviewing(true);
      const conditions = { ...editing.conditions };
      if (!conditions.answered_from) delete conditions.answered_from;
      if (!conditions.answered_to) delete conditions.answered_to;
      const count = await previewAudience({ companyId, conditions });
      setPreviewCount(count);
    } catch (e) {
      toast.error(e?.message || 'プレビュー失敗');
    } finally { setPreviewing(false); }
  };

  const summarize = (s) => {
    const c = s.conditions || {};
    const parts = [];
    if (c.store_ids?.length) parts.push(`店舗 ${c.store_ids.length}件`);
    if (c.result_types?.length) parts.push(`評価 ${c.result_types.join(',')}`);
    if (c.selected_qsc?.length) parts.push(`QSC ${c.selected_qsc.length}件`);
    if (c.answered_from || c.answered_to) parts.push('期間指定');
    return parts.join(' / ') || '条件なし (全 LINE 連携回答者)';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', mb: 2, alignItems: 'center' }}>
        <Typography variant="h6" sx={{ fontWeight: 700, flex: 1 }}>ターゲットセグメント</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={openNew}
          sx={{ backgroundColor: '#06C755', '&:hover': { backgroundColor: '#05a648' } }}>
          新規セグメント
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
      ) : segments.length === 0 ? (
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <FilterAlt sx={{ fontSize: 48, color: '#cbd5e1', mb: 1 }} />
          <Typography color="text.secondary">セグメントがまだありません</Typography>
        </Card>
      ) : (
        <Stack spacing={1.5}>
          {segments.map((s) => (
            <Card key={s.id} sx={{ borderRadius: 2 }}>
              <ListItem
                secondaryAction={
                  <Box>
                    <IconButton onClick={() => openEdit(s)}><Edit /></IconButton>
                    <IconButton onClick={() => handleDelete(s.id)} sx={{ color: '#ef4444' }}><Delete /></IconButton>
                  </Box>
                }
              >
                <ListItemText
                  primary={<Typography sx={{ fontWeight: 600 }}>{s.name}</Typography>}
                  secondary={
                    <>
                      {s.description && <Typography component="span" variant="body2" sx={{ display: 'block' }}>{s.description}</Typography>}
                      <Typography component="span" variant="caption" color="text.secondary">{summarize(s)}</Typography>
                    </>
                  }
                />
              </ListItem>
            </Card>
          ))}
        </Stack>
      )}

      <Dialog open={!!editing} onClose={() => setEditing(null)} fullWidth maxWidth="sm">
        <DialogTitle>{editing?.id ? 'セグメントを編集' : '新規セグメント'}</DialogTitle>
        <DialogContent dividers>
          {editing && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField label="セグメント名 *" fullWidth value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              <TextField label="説明" fullWidth value={editing.description}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })} />

              <FormControl fullWidth>
                <InputLabel>店舗</InputLabel>
                <Select multiple
                  value={editing.conditions.store_ids}
                  onChange={(e) => setEditing({
                    ...editing,
                    conditions: { ...editing.conditions, store_ids: e.target.value },
                  })}
                  input={<OutlinedInput label="店舗" />}
                  renderValue={(selected) => `${selected.length}店舗 選択`}
                >
                  {stores.map((st) => (
                    <MenuItem key={st.id} value={st.id}>
                      <Checkbox checked={editing.conditions.store_ids.includes(st.id)} />
                      <ListItemText primary={st.name} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>評価 (result_type)</InputLabel>
                <Select multiple
                  value={editing.conditions.result_types}
                  onChange={(e) => setEditing({
                    ...editing,
                    conditions: { ...editing.conditions, result_types: e.target.value },
                  })}
                  input={<OutlinedInput label="評価 (result_type)" />}
                  renderValue={(selected) => selected.join(', ')}
                >
                  {RESULT_TYPES.map((r) => (
                    <MenuItem key={r.value} value={r.value}>
                      <Checkbox checked={editing.conditions.result_types.includes(r.value)} />
                      <ListItemText primary={r.label} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>QSC</InputLabel>
                <Select multiple
                  value={editing.conditions.selected_qsc}
                  onChange={(e) => setEditing({
                    ...editing,
                    conditions: { ...editing.conditions, selected_qsc: e.target.value },
                  })}
                  input={<OutlinedInput label="QSC" />}
                  renderValue={(selected) => selected.join(', ')}
                >
                  {QSC_OPTIONS.map((q) => (
                    <MenuItem key={q.value} value={q.value}>
                      <Checkbox checked={editing.conditions.selected_qsc.includes(q.value)} />
                      <ListItemText primary={q.label} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

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

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Button startIcon={<Visibility />} onClick={handlePreview} disabled={previewing} variant="outlined">
                  {previewing ? <CircularProgress size={18} /> : '対象人数をプレビュー'}
                </Button>
                {previewCount !== null && (
                  <Alert severity="info" sx={{ flex: 1, py: 0 }}>
                    対象 LINE ユーザー数: <strong>{previewCount}</strong> 名
                  </Alert>
                )}
              </Box>
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
