import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box
} from '@mui/material';

const DeleteConfirmationDialog = ({
  open,
  onClose,
  onConfirm,
  pageToDelete
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          borderRadius: 2,
          minWidth: 400
        }
      }}
    >
      <DialogTitle sx={{ fontWeight: 600, color: '#ef4444' }}>
        ページを削除しますか？
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ mb: 2 }}>
          以下のページを削除します。この操作は元に戻せません。
        </Typography>
        {pageToDelete && (
          <Box sx={{ bgcolor: '#f8fafc', p: 2, borderRadius: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            {React.cloneElement(pageToDelete.icon, { 
              sx: { color: '#64748b', fontSize: '1rem' } 
            })}
            <Typography variant="body2" sx={{ color: '#2d3748' }}>
              {pageToDelete.title}
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            borderColor: '#e2e8f0',
            color: '#64748b',
            '&:hover': {
              borderColor: '#cbd5e1',
              backgroundColor: '#f8fafc'
            }
          }}
        >
          キャンセル
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          sx={{
            backgroundColor: '#ef4444',
            '&:hover': {
              backgroundColor: '#dc2626'
            }
          }}
        >
          削除する
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteConfirmationDialog;