import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  TextField,
  Button,
  Container,
  CircularProgress,
  Alert,
  Stack,
  Typography
} from '@mui/material';
import {
  Store,
  LocationOn,
  Save,
  Cancel
} from '@mui/icons-material';
import { supabase } from '../lib/supabase';

export default function StoreRegistrationForm({ onStoreRegistered, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    address: ''
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
        throw new Error('店舗名を入力してください');
      }
      if (!formData.address.trim()) {
        throw new Error('店舗住所を入力してください');
      }

      // 🔒 認証情報の取得
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData.session) {
        throw new Error('認証情報の取得に失敗しました。再ログインしてください。');
      }

      // 🔒 Edge Functionを呼び出し（サーバーサイドで安全に処理）
      const { data, error } = await supabase.functions.invoke('create-store', {
        body: {
          name: formData.name.trim(),
          address: formData.address.trim()
        }
      });

      if (error) {
        throw new Error(`店舗登録に失敗しました: ${error.message}`);
      }

      if (!data.success) {
        throw new Error(data.error || '店舗登録に失敗しました');
      }

      const storeData = data.store;
      
      // 登録完了を親コンポーネントに通知
      if (onStoreRegistered) {
        onStoreRegistered(storeData);
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 3 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* エラー表示 */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ marginBottom: 24 }}
          >
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              {error}
            </Alert>
          </motion.div>
        )}

        {/* フォーム */}
        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={3}>
            {/* 店舗名 */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
            >
              <TextField
                label="店舗名"
                placeholder="渋谷店"
                fullWidth
                required
                value={formData.name}
                onChange={handleInputChange('name')}
                disabled={isSubmitting}
                InputProps={{
                  startAdornment: (
                    <Store sx={{ color: '#64748b', mr: 1 }} />
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#5e17eb',
                    }
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#5e17eb'
                  }
                }}
              />
            </motion.div>

            {/* 店舗住所 */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              <TextField
                label="店舗住所"
                placeholder="東京都渋谷区渋谷1-1-1"
                fullWidth
                required
                multiline
                rows={3}
                value={formData.address}
                onChange={handleInputChange('address')}
                disabled={isSubmitting}
                InputProps={{
                  startAdornment: (
                    <LocationOn sx={{ color: '#64748b', mr: 1, alignSelf: 'flex-start', mt: 1 }} />
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#5e17eb',
                    }
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#5e17eb'
                  }
                }}
              />
            </motion.div>

            {/* 送信ボタン */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              <Stack direction="row" spacing={2} sx={{ mt: 4 }}>
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  size="large"
                  disabled={isSubmitting || !formData.name.trim() || !formData.address.trim()}
                  startIcon={
                    isSubmitting ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      <Save />
                    )
                  }
                  sx={{
                    py: 1.5,
                    borderRadius: 2,
                    fontWeight: 600,
                    fontSize: '1rem',
                    background: 'linear-gradient(45deg, #5e17eb 30%, #764ba2 90%)',
                    boxShadow: '0 4px 15px rgba(94, 23, 235, 0.3)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 20px rgba(94, 23, 235, 0.4)',
                    },
                    '&:disabled': {
                      background: '#e2e8f0',
                      color: '#94a3b8',
                      boxShadow: 'none',
                      transform: 'none'
                    }
                  }}
                >
                  {isSubmitting ? '登録中...' : '店舗を登録'}
                </Button>

                {onCancel && (
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={onCancel}
                    disabled={isSubmitting}
                    startIcon={<Cancel />}
                    sx={{
                      py: 1.5,
                      borderRadius: 2,
                      fontWeight: 600,
                      fontSize: '1rem',
                      borderColor: '#cbd5e1',
                      color: '#64748b',
                      '&:hover': {
                        borderColor: '#94a3b8',
                        backgroundColor: '#f8fafc'
                      }
                    }}
                  >
                    キャンセル
                  </Button>
                )}
              </Stack>
            </motion.div>
          </Stack>
        </Box>

        {/* 注意事項 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          <Typography
            variant="body2"
            sx={{
              textAlign: 'center',
              color: '#64748b',
              mt: 3,
              fontSize: '0.875rem',
              lineHeight: 1.6
            }}
          >
            ※ 店舗名と住所は必須入力項目です。<br />
            登録後も編集可能です。
          </Typography>
        </motion.div>
      </motion.div>
    </Container>
  );
}