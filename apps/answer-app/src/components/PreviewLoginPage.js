import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert
} from '@mui/material';
import { Google as GoogleIcon } from '@mui/icons-material';
import { supabase } from '../lib/supabase';

const PreviewLoginPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  
  const reviewFormId = searchParams.get('reviewFormId');

  useEffect(() => {
    // レビューフォームIDがない場合は404ページにリダイレクト
    if (!reviewFormId) {
      navigate('/not-found');
      return;
    }
  }, [reviewFormId, navigate]);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError('');

      // 既存セッションをチェック
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        await verifyBusinessUser(session.user);
        return;
      }

      // signInWithGoogleを使用してカスタムリダイレクトを指定
      const { signInWithGoogle } = await import('../lib/supabase');
      const customRedirectPath = `${window.location.origin}/preview?reviewFormId=${reviewFormId}`;
      await signInWithGoogle(customRedirectPath, false);
    } catch (err) {
      setError('ログインエラーが発生しました。');
      setLoading(false);
    }
  };

  const verifyBusinessUser = async (user) => {
    try {
      setLoading(true);
      
      // ビジネスユーザーかどうか確認
      const { data: businessUser, error: businessError } = await supabase
        .from('business_users')
        .select('id')
        .eq('email', user.email)
        .single();


      if (businessError || !businessUser) {
        setError('管理者権限がありません。');
        // 権限なしの場合はnot-foundページにリダイレクト
        navigate('/not-found');
        return;
      }

      // フォームの作成者かどうか確認
      const { data: form, error: formError } = await supabase
        .from('review_forms')
        .select('id, title, business_users')
        .eq('id', reviewFormId)
        .eq('business_users', businessUser.id)
        .single();


      if (formError || !form) {
        setError('フォームへのアクセス権限がありません。');
        // アクセス権限なしの場合はnot-foundページにリダイレクト
        navigate('/not-found');
        return;
      }

      // 認証成功 - プレビューWelcomePageにリダイレクト
      navigate(`/?reviewFormId=${reviewFormId}&mode=preview`);
    } catch (err) {
      setError('認証エラーが発生しました。');
      navigate('/not-found');
    } finally {
      setLoading(false);
    }
  };

  // OAuth後の認証処理のみ処理（自動認証は無効化）
  useEffect(() => {
    let hasProcessedAuth = false;

    const handleOAuthCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const accessToken = urlParams.get('access_token');
      const code = urlParams.get('code');
      const tokenType = urlParams.get('token_type');
      
      
      // OAuth後のリダイレクトの場合のみ処理
      if (accessToken || code || tokenType) {
        hasProcessedAuth = true;
        try {
          // 少し待ってからセッションを取得（Supabaseの処理を待つ）
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session?.user) {
            await verifyBusinessUser(session.user);
          } else {
            setError('OAuth認証後にユーザー情報を取得できませんでした。');
          }
        } catch (error) {
          setError('OAuth認証処理中にエラーが発生しました。');
        }
      } else {
      }
    };

    // ページロード時にOAuthコールバックをチェック
    handleOAuthCallback();

    // 認証状態変更の監視（OAuth後のみ）
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        
        // OAuth認証後のサインインまたは初期セッションの場合のみ処理
        if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user && !hasProcessedAuth) {
          const urlParams = new URLSearchParams(window.location.search);
          const hasOAuthParams = urlParams.get('access_token') || urlParams.get('code') || urlParams.get('token_type');
          
          
          // OAuth関連のパラメータがある場合のみ処理（既存セッションでは自動処理しない）
          if (hasOAuthParams) {
            hasProcessedAuth = true;
            await verifyBusinessUser(session.user);
          } else {
            setCurrentUser(session.user);
          }
        } else {
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [reviewFormId]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
        px: 3
      }}
    >
      <Box
        sx={{
          textAlign: 'center',
          maxWidth: 400,
          width: '100%'
        }}
      >
        <Typography
          variant="h4"
          sx={{
            mb: 1,
            fontWeight: 600,
            color: '#333'
          }}
        >
          プレビューモード
        </Typography>
        
        <Typography
          variant="body1"
          sx={{ 
            mb: 4, 
            color: '#666' 
          }}
        >
          フォーム作成者としてログインしてください
        </Typography>

        {currentUser && (
          <Alert 
            severity="info" 
            sx={{ 
              mb: 3,
              textAlign: 'left'
            }}
          >
            {currentUser.email} としてログイン済みです。プレビューを開始するにはボタンをクリックしてください。
          </Alert>
        )}

        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 3,
              textAlign: 'left'
            }}
          >
            {error}
          </Alert>
        )}

        <Button
          variant="contained"
          fullWidth
          size="large"
          onClick={handleGoogleLogin}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <GoogleIcon />}
          sx={{
            py: 2,
            backgroundColor: '#4285f4',
            '&:hover': {
              backgroundColor: '#3367d6',
            },
            fontSize: '1rem',
            fontWeight: 500,
            textTransform: 'none'
          }}
        >
          {loading ? 'ログイン中...' : (currentUser ? 'プレビューを開始' : 'Googleでログイン')}
        </Button>
      </Box>
    </Box>
  );
};

export default PreviewLoginPage;