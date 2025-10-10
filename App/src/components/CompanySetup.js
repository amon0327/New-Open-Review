import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Container,
  Fade,
  CircularProgress,
  Alert,
  Stack
} from '@mui/material';
import {
  Business,
  Phone,
  Email,
  Save
} from '@mui/icons-material';
import { supabase } from '../lib/supabase';

export default function CompanySetup({ user, onCompanyCreated }) {
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
        throw new Error('会社名を入力してください');
      }

      // 🔒 セキュリティ：安全なEdge Functionエンドポイントを使用
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData.session) {
        throw new Error('認証情報の取得に失敗しました。再ログインしてください。');
      }

      // 🔒 安全なサーバーサイドエンドポイントを呼び出し
      const { data, error } = await supabase.functions.invoke('create-company', {
        body: {
          name: formData.name.trim(),
          phone_number: formData.phone_number.trim() || null,
          email: formData.email.trim() || null
        },
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`
        }
      });

      if (error) {
        throw new Error(`会社作成に失敗しました: ${error.message}`);
      }

      if (!data.success) {
        throw new Error(data.error || '会社作成に失敗しました');
      }
      
      // 会社作成完了を親コンポーネントに通知
      if (onCompanyCreated) {
        onCompanyCreated(data.company);
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Fade in={true} timeout={800}>
      <Container maxWidth="sm" sx={{ 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        py: 4
      }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          style={{ width: '100%' }}
        >
          <Card
            sx={{
              maxWidth: 500,
              mx: 'auto',
              boxShadow: '0 20px 60px rgba(94, 23, 235, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: 3,
              background: 'rgba(255, 255, 255, 0.98)',
              backdropFilter: 'blur(20px)'
            }}
          >
            <CardContent sx={{ p: 4 }}>
              {/* ヘッダー */}
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                >
                  <Business 
                    sx={{ 
                      fontSize: 48, 
                      color: '#5e17eb', 
                      mb: 2 
                    }} 
                  />
                </motion.div>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    background: 'linear-gradient(45deg, #5e17eb 30%, #764ba2 90%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    mb: 1
                  }}
                >
                  会社情報の登録
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ color: '#64748b' }}
                >
                  OpenReviewをご利用いただくために、会社情報をご登録ください
                </Typography>
              </Box>

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
                  {/* 会社名 */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                  >
                    <TextField
                      label="会社名"
                      placeholder="株式会社サンプル"
                      fullWidth
                      required
                      value={formData.name}
                      onChange={handleInputChange('name')}
                      disabled={isSubmitting}
                      InputProps={{
                        startAdornment: (
                          <Business sx={{ color: '#64748b', mr: 1 }} />
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

                  {/* 電話番号 */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4, duration: 0.4 }}
                  >
                    <TextField
                      label="電話番号"
                      placeholder="03-1234-5678"
                      fullWidth
                      value={formData.phone_number}
                      onChange={handleInputChange('phone_number')}
                      disabled={isSubmitting}
                      InputProps={{
                        startAdornment: (
                          <Phone sx={{ color: '#64748b', mr: 1 }} />
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

                  {/* メールアドレス */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5, duration: 0.4 }}
                  >
                    <TextField
                      label="メールアドレス"
                      placeholder="contact@example.com"
                      type="email"
                      fullWidth
                      value={formData.email}
                      onChange={handleInputChange('email')}
                      disabled={isSubmitting}
                      InputProps={{
                        startAdornment: (
                          <Email sx={{ color: '#64748b', mr: 1 }} />
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
                    transition={{ delay: 0.6, duration: 0.4 }}
                  >
                    <Button
                      type="submit"
                      variant="contained"
                      fullWidth
                      size="large"
                      disabled={isSubmitting || !formData.name.trim()}
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
                      {isSubmitting ? '登録中...' : '会社情報を登録'}
                    </Button>
                  </motion.div>
                </Stack>
              </Box>

              {/* 注意事項 */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.4 }}
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
                  ※ 電話番号とメールアドレスは任意入力です。<br />
                  会社名のみ必須となります。
                </Typography>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </Container>
    </Fade>
  );
}