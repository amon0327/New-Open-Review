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
  CircularProgress
} from '@mui/material';
import {
  CheckCircle,
  Error,
  ExitToApp
} from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function StaffInvitationComplete() {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [storeInfo, setStoreInfo] = useState(null);

  useEffect(() => {
    handleInvitationComplete();
  }, [token]);

  const handleInvitationComplete = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('StaffInvitationComplete - token:', token);

      // 認証情報の取得
      const { data: sessionData } = await supabase.auth.getSession();
      
      console.log('StaffInvitationComplete - sessionData:', sessionData);
      
      if (!sessionData.session) {
        throw new Error('ログインが確認できません。再度ログインしてください。');
      }

      console.log('StaffInvitationComplete - calling Edge Function with token:', token);

      // Edge Functionを使用して招待を完了
      const { data, error } = await supabase.functions.invoke('complete-staff-invitation', {
        body: {
          invitationToken: token
        },
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
      });

      console.log('StaffInvitationComplete - Edge Function response:', { data, error });

      if (error) {
        throw new Error(`招待完了処理に失敗しました: ${error.message}`);
      }

      if (!data.success) {
        throw new Error(data.error || '招待完了処理に失敗しました');
      }

      console.log('StaffInvitationComplete - 登録成功:', data.store);
      setStoreInfo(data.store);
      setSuccess(true);

      // 3秒後に自動ログアウト
      setTimeout(async () => {
        await supabase.auth.signOut();
        window.location.href = '/';
      }, 3000);

    } catch (err) {
      setError(err.message);
      
      // エラーの場合も3秒後にログアウト
      setTimeout(async () => {
        await supabase.auth.signOut();
        window.location.href = '/';
      }, 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleManualLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
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
              スタッフ登録を完了しています
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
                    {storeInfo?.name}
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#64748b', mb: 3 }}>
                    {storeInfo?.companies?.name}
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#64748b', mb: 4 }}>
                    スタッフとして正常に登録されました。<br />
                    3秒後に自動的にログアウトします。
                  </Typography>
                  
                  <Button
                    variant="outlined"
                    startIcon={<ExitToApp />}
                    onClick={handleManualLogout}
                    sx={{ 
                      borderColor: '#10b981', 
                      color: '#10b981',
                      '&:hover': {
                        borderColor: '#059669',
                        backgroundColor: '#10b98110'
                      }
                    }}
                  >
                    今すぐログアウト
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
                >
                  <Error sx={{ fontSize: 64, color: '#ef4444', mb: 2 }} />
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
                    3秒後に自動的にログアウトします。
                  </Typography>
                  
                  <Button
                    variant="outlined"
                    startIcon={<ExitToApp />}
                    onClick={handleManualLogout}
                    sx={{ 
                      borderColor: '#ef4444', 
                      color: '#ef4444',
                      '&:hover': {
                        borderColor: '#dc2626',
                        backgroundColor: '#ef444410'
                      }
                    }}
                  >
                    今すぐログアウト
                  </Button>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </Container>
    </Box>
  );
}