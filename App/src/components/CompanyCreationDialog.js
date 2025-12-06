import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Alert,
  CircularProgress,
  Typography
} from '@mui/material';
import { Business, Close } from '@mui/icons-material';
import { supabase } from '../lib/supabase';

export default function CompanyCreationDialog({ open, onClose, onCompanyCreated }) {
  const [formData, setFormData] = useState({
    name: '',
    phone_number: '',
    email: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
    if (error) setError(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // バリデーション
      if (!formData.name.trim()) {
        throw new Error('企業名を入力してください');
      }

      // Edge Function呼び出し
      const { data, error } = await supabase.functions.invoke('create-company', {
        body: {
          name: formData.name.trim(),
          phone_number: formData.phone_number.trim() || null,
          email: formData.email.trim() || null
        }
      });

      if (error) {
        throw new Error(`企業アカウント作成に失敗しました: ${error.message}`);
      }

      if (!data.success) {
        throw new Error(data.error || '企業アカウント作成に失敗しました');
      }

      // 成功時の処理
      if (onCompanyCreated) {
        onCompanyCreated(data.company);
      }

      // フォームをリセット
      setFormData({
        name: '',
        phone_number: '',
        email: ''
      });

      // ダイアログを閉じる
      onClose();

    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        name: '',
        phone_number: '',
        email: ''
      });
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: '0 20px 60px rgba(94, 23, 235, 0.15)'
        }
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          pb: 2,
          borderBottom: '1px solid #e2e8f0'
        }}
      >
        <Business sx={{ color: '#5e17eb', fontSize: 32 }} />
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            企業アカウント作成
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
            新しい企業アカウントを登録します
          </Typography>
        </Box>
        <Button
          onClick={handleClose}
          disabled={isSubmitting}
          sx={{ minWidth: 'auto', p: 1 }}
        >
          <Close />
        </Button>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ pt: 3 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
              label="企業名"
              value={formData.name}
              onChange={handleInputChange('name')}
              required
              fullWidth
              disabled={isSubmitting}
              placeholder="株式会社◯◯"
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            />

            <TextField
              label="電話番号"
              value={formData.phone_number}
              onChange={handleInputChange('phone_number')}
              fullWidth
              disabled={isSubmitting}
              placeholder="03-1234-5678"
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            />

            <TextField
              label="メールアドレス"
              type="email"
              value={formData.email}
              onChange={handleInputChange('email')}
              fullWidth
              disabled={isSubmitting}
              placeholder="contact@example.com"
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2.5, borderTop: '1px solid #e2e8f0' }}>
          <Button
            onClick={handleClose}
            disabled={isSubmitting}
            sx={{
              borderRadius: 2,
              px: 3,
              color: '#64748b'
            }}
          >
            キャンセル
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={20} /> : <Business />}
            sx={{
              borderRadius: 2,
              px: 3,
              background: 'linear-gradient(45deg, #5e17eb 30%, #764ba2 90%)',
              '&:hover': {
                background: 'linear-gradient(45deg, #4c12bc 30%, #5e3a82 90%)',
              }
            }}
          >
            {isSubmitting ? '作成中...' : '作成'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
