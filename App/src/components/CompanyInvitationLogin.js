import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Container,
  Alert,
  CircularProgress,
  Chip
} from '@mui/material';
import {
  Google,
  PersonAdd,
  Error as ErrorIcon,
  Business,
  AdminPanelSettings,
  SupervisedUserCircle,
  Group
} from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function CompanyInvitationLogin() {
  const { token } = useParams();
  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    if (token) {
      console.log('=== 企業招待デバッグ情報 ===');
      console.log('Token:', token);
      console.log('User Agent:', navigator.userAgent);
      console.log('URL:', window.location.href);
      console.log('Connection Type:', navigator.connection?.effectiveType || 'unknown');
      console.log('Online Status:', navigator.onLine);
      console.log('=========================');

      validateInvitation();
    } else {
      setError('招待トークンが見つかりません');
      setLoading(false);
    }
  }, [token]);

  const validateInvitation = async () => {
    try {
      setLoading(true);
      setError(null);

      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const timeout = isMobile ? 15000 : 10000;
      const maxRetries = isMobile ? 3 : 1;

      let lastError = null;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`招待情報取得試行 ${attempt}/${maxRetries} (モバイル: ${isMobile})`);

          if (!navigator.onLine) {
            throw new Error('ネットワーク接続がありません');
          }

          // Edge Functionを使用して招待情報を検証
          const edgeFunctionPromise = supabase.functions.invoke('validate-company-invitation', {
            body: {
              invitationToken: token
            }
          });

          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Database timeout')), timeout);
          });

          const { data, error } = await Promise.race([
            edgeFunctionPromise,
            timeoutPromise
          ]);

          if (error) {
            throw new Error(`招待情報の取得に失敗しました: ${error.message}`);
          }

          if (!data.success) {
            throw new Error(data.error || '招待情報の取得に失敗しました');
          }

          console.log('招待データ取得成功:', data.invitation);
          setInvitation(data.invitation);
          return;

        } catch (err) {
          console.error(`試行 ${attempt} でエラー:`, err);
          lastError = err;

          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            continue;
          }
        }
      }

      throw lastError || new Error('接続に失敗しました');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsAuthenticating(true);
      setAuthError(null);

      // 開発環境と本番環境で異なるリダイレクトURLを使用
      const isDevelopment = window.location.hostname === 'localhost' ||
                           window.location.hostname === '127.0.0.1' ||
                           window.location.hostname.includes('localhost');

      const baseUrl = isDevelopment
        ? 'http://localhost:3000'
        : 'https://app.openreview.jp';

      console.log('OAuth redirect settings:', {
        isDevelopment,
        hostname: window.location.hostname,
        baseUrl,
        fullRedirectUrl: `${baseUrl}/company-invitation/${token}/complete`
      });

      // Googleログイン
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${baseUrl}/company-invitation/${token}/complete`
        }
      });

      if (error) {
        throw new Error(`ログインに失敗しました: ${error.message}`);
      }

    } catch (err) {
      setAuthError(err.message);
      setIsAuthenticating(false);
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'owner':
        return <AdminPanelSettings />;
      case 'admin':
        return <SupervisedUserCircle />;
      case 'member':
        return <Group />;
      default:
        return <Group />;
    }
  };

  const getRoleText = (role) => {
    switch (role) {
      case 'owner':
        return 'オーナー';
      case 'admin':
        return '管理者';
      case 'member':
        return 'メンバー';
      default:
        return 'メンバー';
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'owner':
        return '#f59e0b';
      case 'admin':
        return '#3b82f6';
      case 'member':
        return '#10b981';
      default:
        return '#10b981';
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}
      >
        <Card
          sx={{
            minWidth: 300,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 20px 60px rgba(94, 23, 235, 0.3)',
            borderRadius: 3,
            textAlign: 'center'
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <CircularProgress
              size={50}
              thickness={4}
              sx={{ color: '#5e17eb', mb: 2 }}
            />
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                background: 'linear-gradient(45deg, #5e17eb 30%, #764ba2 90%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 1
              }}
            >
              招待を確認中...
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: '#64748b' }}
            >
              招待情報を検証しています
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}
      >
        <Container maxWidth="sm">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Card
              sx={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                boxShadow: '0 20px 60px rgba(239, 68, 68, 0.3)',
                borderRadius: 3,
                textAlign: 'center'
              }}
            >
              <CardContent sx={{ p: 4 }}>
                <ErrorIcon sx={{ fontSize: 64, color: '#ef4444', mb: 2 }} />
                <Typography
                  variant="h5"
                  sx={{ fontWeight: 600, color: '#ef4444', mb: 2 }}
                >
                  招待が無効です
                </Typography>
                <Typography variant="body1" sx={{ color: '#64748b', mb: 3 }}>
                  {error}
                </Typography>
                <Button
                  variant="outlined"
                  onClick={() => window.location.href = '/'}
                  sx={{ borderColor: '#cbd5e1', color: '#64748b' }}
                >
                  ホームページに戻る
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </Container>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}
    >
      <Container maxWidth="sm">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Card
            sx={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              boxShadow: '0 20px 60px rgba(94, 23, 235, 0.3)',
              borderRadius: 3
            }}
          >
            <CardContent sx={{ p: 3 }}>
              {/* ヘッダー */}
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <PersonAdd sx={{ fontSize: 48, color: '#5e17eb', mb: 2 }} />
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
                  企業メンバー招待
                </Typography>
                <Typography variant="body1" sx={{ color: '#64748b' }}>
                  企業への参加招待が届いています
                </Typography>
              </Box>

              {/* 招待詳細 */}
              <Box
                sx={{
                  p: 2,
                  background: '#f8fafc',
                  borderRadius: 2,
                  border: '1px solid #e2e8f0',
                  mb: 3
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  招待詳細
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Business sx={{ color: '#64748b', mr: 2 }} />
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {invitation?.company?.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#64748b' }}>
                      企業
                    </Typography>
                  </Box>
                </Box>

                <Typography variant="body2" sx={{ color: '#64748b' }}>
                  招待された方: {invitation?.name}
                </Typography>
              </Box>

              {/* エラー表示 */}
              {authError && (
                <Alert severity="error" sx={{ borderRadius: 2, mb: 3 }}>
                  {authError}
                </Alert>
              )}

              {/* ログインボタン */}
              <Button
                variant="contained"
                fullWidth
                size="large"
                startIcon={
                  isAuthenticating ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <Google />
                  )
                }
                onClick={handleGoogleLogin}
                disabled={isAuthenticating}
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
                {isAuthenticating ? 'ログイン中...' : 'Googleでログインして参加'}
              </Button>

            </CardContent>
          </Card>
        </motion.div>
      </Container>
    </Box>
  );
}
