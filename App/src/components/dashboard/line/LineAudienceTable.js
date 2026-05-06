import React from 'react';
import {
  Box, Typography, Chip, Skeleton, alpha,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from '@mui/material';
import { FilterAlt, CheckCircle, RemoveCircle } from '@mui/icons-material';
import { usePartnerTheme } from '../../../contexts/PartnerThemeContext';

const NPS_STYLE = {
  promoter: { label: '推奨者', color: '#15803d', bg: '#dcfce7', dot: '#22c55e' },
  passive: { label: '中立者', color: '#92400e', bg: '#fef3c7', dot: '#f59e0b' },
  detractor: { label: '批判者', color: '#991b1b', bg: '#fee2e2', dot: '#ef4444' },
};

export default function LineAudienceTable({ rows, loading, emptyHint }) {
  const theme = usePartnerTheme();

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} variant="rectangular" height={56} sx={{ mb: 1, borderRadius: 1 }} />
        ))}
      </Box>
    );
  }

  if (!rows || rows.length === 0) {
    return (
      <Box sx={{ p: 8, textAlign: 'center' }}>
        <Box sx={{
          width: 64, height: 64, mx: 'auto', mb: 2, borderRadius: '50%',
          background: alpha(theme.primary, 0.08),
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <FilterAlt sx={{ fontSize: 32, color: theme.primary, opacity: 0.6 }} />
        </Box>
        <Typography sx={{ fontWeight: 600, mb: 0.5, color: '#475569' }}>該当するユーザーがいません</Typography>
        {emptyHint && (
          <Typography variant="caption" color="text.secondary">{emptyHint}</Typography>
        )}
      </Box>
    );
  }

  return (
    <TableContainer>
      <Table sx={{ tableLayout: 'fixed' }}>
        <TableHead>
          <TableRow sx={{ '& th': {
            fontWeight: 700, fontSize: '0.7rem',
            color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1.2,
            borderBottom: `1px solid ${alpha(theme.primary, 0.15)}`,
            backgroundColor: '#fafbfc', py: 1.5,
          }}}>
            <TableCell width={64} align="center">No.</TableCell>
            <TableCell>推奨度</TableCell>
            <TableCell>リピーター</TableCell>
            <TableCell>リピート意向</TableCell>
            <TableCell>最終回答日</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((a, i) => {
            const nps = NPS_STYLE[a.nps_segment] || { label: '不明', color: '#64748b', bg: '#f1f5f9', dot: '#94a3b8' };
            const date = a.last_answered_at ? new Date(a.last_answered_at) : null;
            return (
              <TableRow key={a.line_user_id || i}
                sx={{
                  transition: 'background 0.15s',
                  '&:nth-of-type(even)': { backgroundColor: '#fafbfc' },
                  '&:hover': { backgroundColor: alpha(theme.primary, 0.04) },
                  '& td': { borderBottom: '1px solid #f1f5f9', py: 1.5 },
                }}>
                <TableCell align="center" sx={{ color: '#cbd5e1', fontWeight: 700, fontSize: '0.75rem', fontFamily: 'monospace' }}>
                  {String(i + 1).padStart(3, '0')}
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: nps.dot, flexShrink: 0 }} />
                    <Box sx={{
                      px: 1.25, py: 0.25, borderRadius: 1,
                      backgroundColor: nps.bg, color: nps.color,
                      fontSize: '0.78rem', fontWeight: 700,
                    }}>
                      {nps.label}
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  {a.is_repeater ? (
                    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, color: theme.primary, fontWeight: 600, fontSize: '0.85rem' }}>
                      <CheckCircle sx={{ fontSize: 16 }} />
                      リピーター
                    </Box>
                  ) : (
                    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, color: '#94a3b8', fontSize: '0.85rem' }}>
                      <RemoveCircle sx={{ fontSize: 16 }} />
                      新規
                    </Box>
                  )}
                </TableCell>
                <TableCell>
                  {a.has_revisit_intent ? (
                    <Chip label="あり" size="small" sx={{
                      fontWeight: 700, height: 24,
                      backgroundColor: '#dcfce7', color: '#15803d',
                    }} />
                  ) : (
                    <Chip label="なし" size="small" variant="outlined" sx={{
                      fontWeight: 600, height: 24,
                      borderColor: '#e2e8f0', color: '#94a3b8',
                    }} />
                  )}
                </TableCell>
                <TableCell sx={{ color: '#64748b', fontSize: '0.85rem' }}>
                  {date ? (
                    <>
                      <Box component="span" sx={{ fontWeight: 600, color: '#334155' }}>
                        {date.toLocaleDateString('ja-JP')}
                      </Box>
                      <Box component="span" sx={{ ml: 1, color: '#94a3b8', fontSize: '0.78rem' }}>
                        {date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                      </Box>
                    </>
                  ) : '-'}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
