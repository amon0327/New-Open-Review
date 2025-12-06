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
  Handshake,
  Phone,
  Email,
  Save,
  Language
} from '@mui/icons-material';
import { supabase } from '../lib/supabase';

export default function PartnerCompanySetup({ user, onPartnerCompanyCreated }) {
  const [formData, setFormData] = useState({
    company_name: '',
    website_url: '',
    phone: '',
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
      if (!formData.company_name.trim()) {
        throw new Error('パートナー企業名を入力してください');
      }

      // 認証情報の取得と検証
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !sessionData.session || !sessionData.session.user) {
        throw new Error('ログインが必要です。再ログインしてください。');
      }

      if (!user || !user.id) {
        throw new Error('ユーザー情報が見つかりません。再ログインしてください。');
      }

      // Edge Functionを呼び出し（サーバーサイドで安全に処理）
      const { data, error } = await supabase.functions.invoke('create-partner-company', {
        body: {
          company_name: formData.company_name.trim(),
          website_url: formData.website_url.trim() || null,
          phone: formData.phone.trim() || null,
          email: formData.email.trim() || null
        }
      });

      if (error) {
        throw new Error(`パートナー企業作成に失敗しました: ${error.message}`);
      }

      if (!data.success) {
        throw new Error(data.error || 'パートナー企業作成に失敗しました');
      }

      // パートナー企業作成完了を親コンポーネントに通知
      if (onPartnerCompanyCreated) {
        onPartnerCompanyCreated(data.partner_company);
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Fade in={true} timeout={800}>
      <Container maxWidth="md" sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4,
        background: '#ffffff'
      }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          style={{ width: '100%' }}
        >
          <Card
            sx={{
              maxWidth: 700,
              mx: 'auto',
              boxShadow: '0 20px 60px rgba(94, 23, 235, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: 3,
              background: 'rgba(255, 255, 255, 0.98)',
              backdropFilter: 'blur(20px)'
            }}
          >
            <CardContent sx={{ p: 5 }}>
              {/* ヘッダー */}
              <Box sx={{ textAlign: 'center', mb: 5 }}>
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                >
                  <Handshake
                    sx={{
                      fontSize: 64,
                      color: '#5e17eb',
                      mb: 2
                    }}
                  />
                </motion.div>
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 700,
                    background: 'linear-gradient(45deg, #5e17eb 30%, #764ba2 90%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    mb: 2
                  }}
                >
                  パートナー企業登録
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ color: '#64748b', fontSize: '1.1rem' }}
                >
                  OpenReviewのパートナーとして企業情報を登録してください
                </Typography>
              </Box>

              {/* エラー表示 */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                    {error}
                  </Alert>
                </motion.div>
              )}

              {/* フォーム */}
              <Box component="form" onSubmit={handleSubmit}>
                <Stack spacing={3}>
                  {/* 企業名 */}
                  <TextField
                    label="パートナー企業名"
                    placeholder="株式会社〇〇"
                    fullWidth
                    required
                    value={formData.company_name}
                    onChange={handleInputChange('company_name')}
                    disabled={isSubmitting}
                    InputProps={{
                      startAdornment: (
                        <Handshake sx={{ color: '#64748b', mr: 1 }} />
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

                  {/* ウェブサイトURL */}
                  <TextField
                    label="ウェブサイトURL"
                    placeholder="https://example.com"
                    fullWidth
                    value={formData.website_url}
                    onChange={handleInputChange('website_url')}
                    disabled={isSubmitting}
                    InputProps={{
                      startAdornment: (
                        <Language sx={{ color: '#64748b', mr: 1 }} />
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

                  {/* 電話番号 */}
                  <TextField
                    label="電話番号"
                    placeholder="03-1234-5678"
                    fullWidth
                    value={formData.phone}
                    onChange={handleInputChange('phone')}
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

                  {/* メールアドレス */}
                  <TextField
                    label="メールアドレス"
                    placeholder="contact@example.com"
                    fullWidth
                    type="email"
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

                  {/* 送信ボタン */}
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    fullWidth
                    disabled={isSubmitting || !formData.company_name.trim()}
                    startIcon={
                      isSubmitting ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : (
                        <Save />
                      )
                    }
                    sx={{
                      mt: 2,
                      py: 1.8,
                      borderRadius: 2,
                      background: 'linear-gradient(45deg, #5e17eb 30%, #764ba2 90%)',
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      boxShadow: '0 4px 20px rgba(94, 23, 235, 0.3)',
                      '&:hover': {
                        boxShadow: '0 6px 30px rgba(94, 23, 235, 0.4)',
                        transform: 'translateY(-2px)',
                      },
                      '&:disabled': {
                        background: '#e2e8f0',
                        color: '#94a3b8',
                        boxShadow: 'none',
                      }
                    }}
                  >
                    {isSubmitting ? '登録中...' : '登録して開始'}
                  </Button>
                </Stack>
              </Box>

              {/* 注意事項 */}
              <Box
                sx={{
                  mt: 4,
                  p: 3,
                  background: '#f8fafc',
                  borderRadius: 2,
                  border: '1px solid #e2e8f0'
                }}
              >
                <Typography variant="body2" sx={{ color: '#64748b', lineHeight: 1.7 }}>
                  <strong>ご注意：</strong><br />
                  • パートナー企業として登録すると、企業の管理や招待機能が利用できます<br />
                  • 入力された情報は厳重に管理されます<br />
                  • 必要に応じて後から編集可能です
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </motion.div>
      </Container>
    </Fade>
  );
}
