import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Container,
  CircularProgress,
  Button
} from '@mui/material';
import {
  CheckCircle,
  Error as ErrorIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function PartnerInvitationComplete() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [partnerCompanyInfo, setPartnerCompanyInfo] = useState(null);

  useEffect(() => {
    if (!token) {
      setError('無効なURLです。招待URLが正しくありません。');
      setLoading(false);
      setTimeout(async () => {
        await supabase.auth.signOut();
      }, 2000);
      return;
    }
    handleInvitationComplete();
  }, [token]);

  const handleInvitationComplete = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('PartnerInvitationComplete - token:', token);

      // 認証情報の取得
      const { data: sessionData } = await supabase.auth.getSession();

      console.log('PartnerInvitationComplete - sessionData:', sessionData);

      if (!sessionData.session) {
        throw new Error('ログインが確認できません。再度ログインしてください。');
      }

      console.log('PartnerInvitationComplete - calling Edge Function with token:', token);

      // Edge Functionを使用して招待を完了
      const { data, error } = await supabase.functions.invoke('complete-partner-invitation', {
        body: {
          invitationToken: token
        },
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
      });

      console.log('PartnerInvitationComplete - Edge Function response:', { data, error });

      if (error) {
        throw new Error(`招待完了処理に失敗しました: ${error.message}`);
      }

      if (!data.success) {
        throw new Error(data.error || '招待完了処理に失敗しました');
      }

      console.log('PartnerInvitationComplete - 登録成功:', data.partnerCompany);
      setPartnerCompanyInfo(data.partnerCompany);
      setSuccess(true);

      // 3秒後にパートナーダッシュボードに遷移
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);

    } catch (err) {
      console.error('PartnerInvitationComplete - エラー:', err);

      // エラーメッセージを具体的に設定
      let errorMessage = err.message;
      if (err.message.includes('招待が見つからない') || err.message.includes('使用済み')) {
        errorMessage = '無効なURLです。招待が見つからないか、既に使用済みです。';
      } else if (err.message.includes('有効期限')) {
        errorMessage = '無効なURLです。招待の有効期限が切れています。';
      } else if (err.message.includes('既にこのパートナー企業のメンバー')) {
        errorMessage = '無効なURLです。既にこのパートナー企業のメンバーです。';
      } else if (err.message.includes('ログインが確認できません')) {
        errorMessage = '無効なURLです。ログイン情報を確認できませんでした。';
      } else {
        errorMessage = '無効なURLです。招待処理に失敗しました。';
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
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
              登録処理中...
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: '#64748b' }}
            >
              パートナーメンバー登録を完了しています
            </Typography>
          </CardContent>
        </Card>
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
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <Card
            sx={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              boxShadow: success
                ? '0 20px 60px rgba(16, 185, 129, 0.3)'
                : '0 20px 60px rgba(239, 68, 68, 0.3)',
              borderRadius: 3,
              textAlign: 'center'
            }}
          >
            <CardContent sx={{ p: 4 }}>
              {success ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
                >
                  <CheckCircle sx={{ fontSize: 64, color: '#10b981', mb: 2 }} />
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 700,
                      color: '#10b981',
                      mb: 2
                    }}
                  >
                    登録完了！
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    {partnerCompanyInfo?.name}
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#64748b', mb: 3 }}>
                    パートナー企業メンバーとして正常に登録されました。
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748b', mb: 4 }}>
                    3秒後に自動的にダッシュボードに移動します...
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={() => navigate('/dashboard')}
                    sx={{
                      background: 'linear-gradient(45deg, #5e17eb 30%, #764ba2 90%)',
                      color: 'white',
                      fontWeight: 600,
                      px: 4,
                      py: 1.5,
                      borderRadius: 2,
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 6px 20px rgba(94, 23, 235, 0.4)',
                      }
                    }}
                  >
                    今すぐダッシュボードへ
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
                >
                  <ErrorIcon sx={{ fontSize: 64, color: '#ef4444', mb: 2 }} />
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 700,
                      color: '#ef4444',
                      mb: 2
                    }}
                  >
                    登録に失敗
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#64748b', mb: 4 }}>
                    {error}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
                    エラーが発生しました。サポートにお問い合わせください。
                  </Typography>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </Container>
    </Box>
  );
}
