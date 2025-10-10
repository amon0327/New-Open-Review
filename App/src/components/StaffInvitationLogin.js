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
  Fade,
  Chip
} from '@mui/material';
import {
  Google,
  PersonAdd,
  CheckCircle,
  Error,
  Store,
  AdminPanelSettings,
  WorkOutline
} from '@mui/icons-material';
// import { useParams } from 'react-router-dom'; // TODO: React Router設定後に有効化
import { supabase } from '../lib/supabase';

export default function StaffInvitationLogin() {
  // TODO: React Router設定後に有効化
  // const { token } = useParams();
  const token = 'demo-token'; // 一時的なデモ用トークン
  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (token) {
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

      // 招待情報を取得
      const { data: invitationData, error: invitationError } = await supabase
        .from('store_invitations')
        .select(`
          *,
          stores (
            id,
            name,
            address,
            companies (
              id,
              name
            )
          )
        `)
        .eq('token', token)
        .eq('status', 'invited');

      if (invitationError || !invitationData || invitationData.length === 0) {
        throw new Error('招待が見つからないか、既に使用済みです');
      }

      const invitation = invitationData[0];
      
      // 24時間チェック
      const invitationDate = new Date(invitation.created_at);
      const now = new Date();
      const hoursDiff = (now - invitationDate) / (1000 * 60 * 60);

      if (hoursDiff > 24) {
        // 期限切れの場合、ステータスを更新
        await supabase
          .from('store_invitations')
          .update({ status: 'expired' })
          .eq('token', token);
        
        throw new Error('招待の有効期限が切れています（24時間）');
      }

      setInvitation(invitation);
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

      // Googleログイン
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/staff-invitation/${token}/complete`
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
    return role === 'STORE' ? <AdminPanelSettings /> : <WorkOutline />;
  };

  const getRoleText = (role) => {
    return role === 'STORE' ? '店舗管理者' : 'スタッフ';
  };

  const getRoleColor = (role) => {
    return role === 'STORE' ? '#f59e0b' : '#10b981';
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
                <Error sx={{ fontSize: 64, color: '#ef4444', mb: 2 }} />
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
            <CardContent sx={{ p: 4 }}>
              {/* ヘッダー */}
              <Box sx={{ textAlign: 'center', mb: 4 }}>
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
                  スタッフ招待
                </Typography>
                <Typography variant="body1" sx={{ color: '#64748b' }}>
                  {invitation?.name}さん、こんにちは！
                </Typography>
              </Box>

              {/* 招待詳細 */}
              <Box
                sx={{
                  p: 3,
                  background: '#f8fafc',
                  borderRadius: 2,
                  border: '1px solid #e2e8f0',
                  mb: 4
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  招待詳細
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Store sx={{ color: '#64748b', mr: 2 }} />
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {invitation?.stores?.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#64748b' }}>
                      {invitation?.stores?.companies?.name}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Chip
                    icon={getRoleIcon(invitation?.role)}
                    label={getRoleText(invitation?.role)}
                    sx={{
                      backgroundColor: `${getRoleColor(invitation?.role)}20`,
                      color: getRoleColor(invitation?.role),
                      fontWeight: 500
                    }}
                  />
                </Box>

                <Typography variant="body2" sx={{ color: '#64748b' }}>
                  住所: {invitation?.stores?.address}
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

              {/* 注意事項 */}
              <Box
                sx={{
                  mt: 3,
                  p: 3,
                  background: '#fef3c7',
                  borderRadius: 2,
                  border: '1px solid #fbbf24'
                }}
              >
                <Typography variant="body2" sx={{ color: '#92400e', lineHeight: 1.6 }}>
                  <strong>ご注意:</strong><br />
                  • この招待は24時間で無効になります<br />
                  • ログイン後、自動的に店舗に参加されます<br />
                  • 参加完了後、自動的にログアウトされます
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </motion.div>
      </Container>
    </Box>
  );
}