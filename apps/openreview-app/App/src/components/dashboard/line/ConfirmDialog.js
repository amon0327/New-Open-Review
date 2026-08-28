import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';
import { usePartnerTheme } from '../../../contexts/PartnerThemeContext';

export default function ConfirmDialog({
  open, title, message, onConfirm, onCancel,
  confirmLabel = 'OK', cancelLabel = 'キャンセル', danger = false,
}) {
  const theme = usePartnerTheme();
  return (
    <Dialog open={!!open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>{title}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', color: '#475569' }}>{message}</Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCancel} sx={{ color: '#64748b' }}>{cancelLabel}</Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          sx={{
            background: danger ? '#ef4444' : (theme.primaryGradient || theme.primary),
            color: 'white',
            '&:hover': { background: danger ? '#dc2626' : (theme.primaryGradient || theme.primary), opacity: 0.9 },
          }}
        >
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
