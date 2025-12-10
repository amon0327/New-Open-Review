import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
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
  Save
} from '@mui/icons-material';
import { supabase } from '../lib/supabase';

export default function StoreRegistrationForm({ onStoreRegistered, onCancel }) {
  const { companyId } = useParams(); // URLからcompanyIdを取得
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
      const requestBody = {
        name: formData.name.trim(),
        address: formData.address.trim()
      };

      // パートナーコンテキストの場合はcompanyIdを追加
      if (companyId) {
        requestBody.companyId = companyId;
        console.log('✅ Adding companyId to store creation request:', companyId);
      }

      const { data, error } = await supabase.functions.invoke('create-store', {
        body: requestBody
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
              <Stack direction="row" spacing={1.5} sx={{ mt: 3 }}>
                {onCancel && (
                  <Button
                    variant="outlined"
                    size="medium"
                    fullWidth
                    onClick={onCancel}
                    disabled={isSubmitting}
                    sx={{
                      py: 1,
                      borderRadius: 1,
                      fontWeight: 500,
                      fontSize: '0.875rem',
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
                )}
                <Button
                  type="submit"
                  variant="contained"
                  size="medium"
                  fullWidth
                  disabled={isSubmitting || !formData.name.trim() || !formData.address.trim()}
                  startIcon={
                    isSubmitting ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      <Save sx={{ fontSize: 18 }} />
                    )
                  }
                  sx={{
                    py: 1,
                    borderRadius: 1,
                    fontWeight: 500,
                    fontSize: '0.875rem',
                    background: 'linear-gradient(135deg, #5e17eb 0%, #764ba2 100%)',
                    boxShadow: 'none',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      boxShadow: '0 2px 8px rgba(94, 23, 235, 0.3)',
                    },
                    '&:disabled': {
                      background: '#e2e8f0',
                      color: '#94a3b8',
                      boxShadow: 'none'
                    }
                  }}
                >
                  {isSubmitting ? '登録中...' : '登録'}
                </Button>
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