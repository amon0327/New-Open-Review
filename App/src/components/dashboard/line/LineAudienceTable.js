import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Chip, Skeleton, alpha,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination,
} from '@mui/material';
import { FilterAlt } from '@mui/icons-material';
import { usePartnerTheme } from '../../../contexts/PartnerThemeContext';

const NPS_CHIP = {
  promoter: { label: '推奨者', sx: { bgcolor: '#dcfce7', color: '#166534' } },
  passive: { label: '中立者', sx: { bgcolor: '#fef3c7', color: '#92400e' } },
  detractor: { label: '批判者', sx: { bgcolor: '#fee2e2', color: '#991b1b' } },
};

const ROWS_PER_PAGE = 100;

export default function LineAudienceTable({ rows, loading, emptyHint }) {
  const theme = usePartnerTheme();
  const [page, setPage] = useState(0);

  useEffect(() => { setPage(0); }, [rows]);

  if (loading) {
    return (
      <Box sx={{ p: 2 }}>
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} variant="rectangular" height={48} sx={{ mb: 1, borderRadius: 1 }} />
        ))}
      </Box>
    );
  }

  if (!rows || rows.length === 0) {
    return (
      <Box sx={{ p: 6, textAlign: 'center' }}>
        <FilterAlt sx={{ fontSize: 48, color: '#cbd5e1', mb: 1 }} />
        <Typography color="text.secondary">該当するユーザーがいません</Typography>
        {emptyHint && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
            {emptyHint}
          </Typography>
        )}
      </Box>
    );
  }

  const slice = rows.slice(page * ROWS_PER_PAGE, (page + 1) * ROWS_PER_PAGE);

  return (
    <>
      <TableContainer sx={{ maxHeight: 480 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow sx={{ '& th': {
              fontWeight: 700, fontSize: '0.78rem',
              color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5,
              borderBottom: `2px solid ${theme.primary}`,
              backgroundColor: '#f8fafc',
            }}}>
              <TableCell width={48} align="center">#</TableCell>
              <TableCell>推奨度</TableCell>
              <TableCell>リピーター</TableCell>
              <TableCell>リピート意向</TableCell>
              <TableCell>最終回答日</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {slice.map((a, i) => {
              const nps = NPS_CHIP[a.nps_segment] || { label: '不明', sx: {} };
              return (
                <TableRow key={a.line_user_id || i} hover
                  sx={{
                    '&:hover': { backgroundColor: alpha(theme.primary, 0.04) },
                    '& td': { borderBottom: '1px solid #f1f5f9', py: 1.25 },
                  }}>
                  <TableCell align="center" sx={{ color: '#94a3b8', fontWeight: 600, fontSize: '0.75rem' }}>
                    {page * ROWS_PER_PAGE + i + 1}
                  </TableCell>
                  <TableCell>
                    <Chip label={nps.label} size="small" sx={{ ...nps.sx, fontWeight: 700 }} />
                  </TableCell>
                  <TableCell>
                    <Chip label={a.is_repeater ? 'リピーター' : '新規'} size="small"
                      sx={{
                        fontWeight: 600,
                        bgcolor: a.is_repeater ? alpha(theme.primary, 0.12) : '#f1f5f9',
                        color: a.is_repeater ? theme.primary : '#64748b',
                      }} />
                  </TableCell>
                  <TableCell>
                    <Chip label={a.has_revisit_intent ? 'あり' : 'なし'} size="small" variant="outlined"
                      sx={{
                        fontWeight: 600,
                        borderColor: a.has_revisit_intent ? '#22c55e' : '#cbd5e1',
                        color: a.has_revisit_intent ? '#15803d' : '#64748b',
                      }} />
                  </TableCell>
                  <TableCell sx={{ color: '#64748b', fontSize: '0.8rem' }}>
                    {a.last_answered_at ? new Date(a.last_answered_at).toLocaleString('ja-JP') : '-'}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={rows.length}
        page={page}
        onPageChange={(_, p) => setPage(p)}
        rowsPerPage={ROWS_PER_PAGE}
        rowsPerPageOptions={[ROWS_PER_PAGE]}
        labelRowsPerPage=""
        labelDisplayedRows={({ from, to, count }) => `${from}〜${to} / ${count} 名`}
        sx={{ borderTop: '1px solid #f1f5f9', '.MuiTablePagination-toolbar': { minHeight: 48 } }}
      />
    </>
  );
}
