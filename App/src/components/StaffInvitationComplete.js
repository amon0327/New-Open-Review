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
// import { useParams } from 'react-router-dom'; // TODO: React Router設定後に有効化
import { supabase } from '../lib/supabase';

export default function StaffInvitationComplete() {
  // TODO: React Router設定後に有効化
  // const { token } = useParams();
  const token = 'demo-token'; // 一時的なデモ用トークン
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

      // 現在のユーザーを取得
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('ログインが確認できません。再度ログインしてください。');
      }

      // 招待情報を取得
      const { data: invitations, error: invitationError } = await supabase
        .from('store_invitations')
        .select(`
          *,
          stores (
            id,
            name,
            companies (
              name
            )
          )
        `)
        .eq('token', token)
        .eq('status', 'invited');

      if (invitationError || !invitations || invitations.length === 0) {
        throw new Error('招待が見つからないか、既に使用済みです。');
      }

      const invitation = invitations[0];

      // 24時間チェック
      const invitationDate = new Date(invitation.created_at);
      const now = new Date();
      const hoursDiff = (now - invitationDate) / (1000 * 60 * 60);

      if (hoursDiff > 24) {
        await supabase
          .from('store_invitations')
          .update({ status: 'expired' })
          .eq('token', token);
        
        throw new Error('招待の有効期限が切れています（24時間）。');
      }

      // 既に登録されているかチェック
      const { data: existingMembership } = await supabase
        .from('store_memberships')
        .select('id')
        .eq('business_user_id', user.id)
        .eq('store_id', invitation.store_id);

      if (existingMembership && existingMembership.length > 0) {
        throw new Error('既にこの店舗のメンバーです。');
      }

      // store_membershipsに登録
      const { error: membershipError } = await supabase
        .from('store_memberships')
        .insert([
          {
            business_user_id: user.id,
            store_id: invitation.store_id,
            role: invitation.role
          }
        ]);

      if (membershipError) {
        throw new Error(`メンバー登録に失敗しました: ${membershipError.message}`);
      }

      // 招待ステータスを完了に更新
      const { error: statusError } = await supabase
        .from('store_invitations')
        .update({ status: 'completed' })
        .eq('token', token);

      if (statusError) {
        console.error('Status update error:', statusError);
      }

      setStoreInfo(invitation.stores);
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