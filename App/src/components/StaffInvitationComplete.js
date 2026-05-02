import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Container,
  CircularProgress
} from '@mui/material';
import {
  CheckCircle,
  Error as ErrorIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

// ----------------------------------------
// Edge Function の reason → ユーザー向けメッセージ
//   タイトル: 何が起きたか (短く)
//   description: どうしたら良いか (具体的に、操作可能に)
//   コードや内部用語は出さない。フロントの状態だけで自己完結する文言。
// ----------------------------------------
const REASON_MESSAGES = {
  auth_required: {
    title: 'ログインが確認できませんでした',
    description: 'この画面のスクリーンショットを添えて、招待元の管理者にお知らせください。',
  },
  auth_failed: {
    title: 'ログイン情報を確認できませんでした',
    description: 'この画面のスクリーンショットを添えて、招待元の管理者にお知らせください。',
  },
  bad_request: {
    title: '招待 URL の処理を始められませんでした',
    description: 'この画面のスクリーンショットを添えて、招待元の管理者にお知らせください。',
  },
  invitation_not_found: {
    title: 'この招待は見つかりませんでした',
    description: '招待が取り消されたか、URL が古い可能性があります。この画面のスクリーンショットを添えて、招待元の管理者にお知らせください。',
  },
  invitation_used_by_other: {
    title: 'この招待は別のアカウントで使用済みです',
    description: 'この画面のスクリーンショットを添えて、招待元の管理者にお知らせください。',
  },
  invitation_status_unknown: {
    title: 'この招待は現在ご利用いただけません',
    description: 'この画面のスクリーンショットを添えて、招待元の管理者にお知らせください。',
  },
  store_info_missing: {
    title: '店舗情報を取得できませんでした',
    description: 'この画面のスクリーンショットを添えて、招待元の管理者にお知らせください。',
  },
  user_create_failed: {
    title: 'アカウント情報を登録できませんでした',
    description: 'この画面のスクリーンショットを添えて、招待元の管理者にお知らせください。',
  },
  membership_failed: {
    title: '店舗への登録を保存できませんでした',
    description: 'この画面のスクリーンショットを添えて、招待元の管理者にお知らせください。',
  },
  unknown: {
    title: '登録処理で予期しない問題が発生しました',
    description: 'この画面のスクリーンショットを添えて、招待元の管理者にお知らせください。',
  },
}

function pickReason(data, errorObj) {
  // Edge Function からの構造化レスポンス優先
  const r = data?.reason
  if (r && REASON_MESSAGES[r]) return r

  // ネットワークエラー (Edge Function に到達できなかった等)
  const m = String(errorObj?.message || '')
  if (/Failed to fetch|NetworkError|network|TimeoutError|aborted/i.test(m)) {
    return 'membership_failed' // ネットワーク扱い
  }
  return 'unknown'
}

export default function StaffInvitationComplete() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [errorReason, setErrorReason] = useState(null); // FailReason key
  const [success, setSuccess] = useState(false);
  const [storeInfo, setStoreInfo] = useState(null);
  const [alreadyMember, setAlreadyMember] = useState(false);

  useEffect(() => {
    if (!token) {
      setErrorReason('bad_request');
      setLoading(false);
      return;
    }
    handleInvitationComplete();
  }, [token]);

  const handleInvitationComplete = async () => {
    try {
      setLoading(true);
      setErrorReason(null);

      console.log('StaffInvitationComplete - token:', token);

      // 認証情報の取得
      const { data: sessionData } = await supabase.auth.getSession();
      console.log('StaffInvitationComplete - sessionData:', sessionData);

      if (!sessionData.session) {
        setErrorReason('auth_required');
        return;
      }

      // Edge Functionを使用して招待を完了
      const { data, error } = await supabase.functions.invoke('complete-staff-invitation', {
        body: { invitationToken: token },
        headers: { Authorization: `Bearer ${sessionData.session.access_token}` },
      });

      console.log('StaffInvitationComplete - Edge Function response:', { data, error });

      if (error || !data?.success) {
        // Edge Function は失敗時に { success:false, reason } を返す
        const reason = pickReason(data, error)
        setErrorReason(reason)
        return
      }

      console.log('StaffInvitationComplete - 登録成功:', data.store, 'alreadyMember:', data.alreadyMember);
      setStoreInfo(data.store);
      setAlreadyMember(!!data.alreadyMember);
      setSuccess(true);

      // 既登録ユーザーが招待URLを踏んだ場合は、ホーム (/) へ自動遷移する。
      if (data.alreadyMember) {
        setTimeout(() => navigate('/', { replace: true }), 1500)
      }

    } catch (err) {
      console.error('StaffInvitationComplete - エラー:', err);
      setErrorReason(pickReason(null, err));
    } finally {
      setLoading(false);
    }
  };

  // handleManualLogout関数は削除（自動ログアウトのみ使用）

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
                    {alreadyMember ? 'すでに登録済みです' : '登録完了！'}
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    {storeInfo?.name}
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#64748b', mb: 3 }}>
                    {storeInfo?.companies?.name}
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#64748b', mb: 4 }}>
                    {alreadyMember
                      ? 'この店舗にはすでにメンバーとして登録されています。ホームへ移動します...'
                      : 'メンバーとして正常に登録されました。'}
                  </Typography>
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
                    {(REASON_MESSAGES[errorReason] || REASON_MESSAGES.unknown).title}
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#64748b', mb: 4, whiteSpace: 'pre-line' }}>
                    {(REASON_MESSAGES[errorReason] || REASON_MESSAGES.unknown).description}
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