import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  CircularProgress,
  Modal,
  Card,
  CardContent,
  TextField,
  Tab,
  Tabs,
  Alert,
  Dialog,
  DialogContent,
  DialogActions,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  getReviewForm,
  getLoginScreenSettings,
  getReviewFormSettings,
  getReviewFormPages,
  stringToColor,
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
  registerLineUser,
  getSession,
  supabaseUrl,
  supabaseAnonKey,
  checkAnswerEligibility
} from '../lib/supabase';
import { 
  checkLineLogin, 
  lineLogin, 
  getLineProfile,
  getLineIdToken,
  isInLineApp 
} from '../lib/liff';
import liff from '@line/liff';
import PreviewIndicator from './PreviewIndicator';
import { logLiffDebugInfo } from '../utils/debugLiff';

const WelcomePage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // State management
  const [loading, setLoading] = useState(true);
  const [reviewForm, setReviewForm] = useState(null);
  const [loginSettings, setLoginSettings] = useState(null);
  const [formSettings, setFormSettings] = useState(null);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [loginTab, setLoginTab] = useState(0);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [pageError, setPageError] = useState(null);
  const [eligibilityMessage, setEligibilityMessage] = useState('');

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const reviewFormId = searchParams.get('reviewFormId');
  const storeCode = searchParams.get('storeCode');
  const isPreviewMode = searchParams.get('mode') === 'preview';

  useEffect(() => {
    loadWelcomeData();
  }, [reviewFormId, isPreviewMode]);
  
  // デバッグ情報を追加する関数（本番では何もしない）
  const addDebugInfo = () => {};
  

  // LINEミニアプリアクセス時の自動認証処理
  useEffect(() => {
    const autoAuthenticateLineUser = async () => {
      try {
        addDebugInfo('Starting LINE auth...');

        // LIFF初期化を確認・実行
        if (!liff._ready) {
          addDebugInfo('LIFF not ready, trying to init...');
          try {
            // URLからLIFF IDを取得するか、liff.init()をLIFF IDなしで試す
            // LINEアプリ内では自動的に正しいIDが使用される
            await liff.init({ liffId: process.env.REACT_APP_LIFF_ID_LOGIN });
            addDebugInfo('LIFF init success');
          } catch (initError) {
            addDebugInfo(`LIFF init error: ${initError.message}`);
            // 初期化エラーでも続行を試みる
          }
        }

        // LINEプロフィールを取得
        let lineProfile = null;

        // 方法1: getLineProfile()を試す
        try {
          addDebugInfo('Trying getLineProfile()...');
          lineProfile = await getLineProfile();
          if (lineProfile) {
            addDebugInfo(`Got profile: ${lineProfile.userId}`);
          }
        } catch (e) {
          addDebugInfo(`getLineProfile error: ${e.message}`);
        }

        // 方法2: liff.getProfile()を直接試す
        if (!lineProfile) {
          try {
            addDebugInfo('Trying liff.getProfile() directly...');
            const profile = await liff.getProfile();
            if (profile?.userId) {
              addDebugInfo(`Got profile directly: ${profile.userId}`);
              lineProfile = {
                userId: profile.userId,
                displayName: profile.displayName || 'LINE User',
                pictureUrl: profile.pictureUrl,
                statusMessage: profile.statusMessage
              };
            }
          } catch (e) {
            addDebugInfo(`getProfile error: ${e.message}`);
          }
        }

        // 方法3: コンテキストからuserIdを取得
        if (!lineProfile) {
          try {
            addDebugInfo('Trying liff.getContext()...');
            const context = liff.getContext();
            addDebugInfo(`Context: ${JSON.stringify(context)}`);
            if (context?.userId) {
              addDebugInfo(`Got userId from context: ${context.userId}`);
              lineProfile = {
                userId: context.userId,
                displayName: 'LINE User',
                pictureUrl: null,
                statusMessage: null
              };
            }
          } catch (e) {
            addDebugInfo(`getContext error: ${e.message}`);
          }
        }

        // プロフィールが取得できなかった場合は終了
        if (!lineProfile) {
          addDebugInfo('Could not get LINE profile, aborting');
          return;
        }

        addDebugInfo(`LINE profile userId: ${lineProfile.userId}`);

        // LINE ユーザーを登録
        try {
          addDebugInfo('Calling registerLineUser...');
          const result = await registerLineUser(lineProfile);
          addDebugInfo(`Register result: ${result ? 'success' : 'failed'}`);
          if (result?.user) {
            addDebugInfo(`User registered: ${result.user.email}`);
          }
        } catch (registerError) {
          addDebugInfo(`Register error: ${registerError.message}`);
        }
      } catch (error) {
        addDebugInfo(`Error: ${error.message}`);
      }
    };

    autoAuthenticateLineUser();
  }, []);


  const loadWelcomeData = async () => {
    if (!reviewFormId) {
      navigate('/not-found');
      return;
    }

    setLoading(true);
    
    try {
      // Parallel data fetching
      const [formData, loginData, settingsData, pagesData] = await Promise.all([
        getReviewForm(reviewFormId, isPreviewMode),
        getLoginScreenSettings(reviewFormId),
        getReviewFormSettings(reviewFormId),
        getReviewFormPages(reviewFormId)
      ]);

      // Validate form exists (pages are optional)
      if (!formData) {
        navigate('/not-found');
        return;
      }

      // プレビューモードでは公開状態をチェックしない
      if (!isPreviewMode && !formData.is_published) {
        navigate('/not-found');
        return;
      }

      setReviewForm(formData);
      setLoginSettings(loginData);
      setFormSettings(settingsData);
    } catch (error) {
      navigate('/not-found');
    } finally {
      setLoading(false);
    }
  };

  const handleProceedToAnswer = async () => {
    // storeCodeがある場合はURLパラメータに含める
    const storeParam = storeCode ? `&storeCode=${storeCode}` : '';

    // プレビューモードでは認証をスキップして直接質問画面に遷移
    if (isPreviewMode) {
      navigate(`/required-questions?reviewFormId=${reviewFormId}&mode=preview${storeParam}`);
      return;
    }

    setAuthLoading(true);

    try {
      // LIFFアプリ（ミニアプリ・外部ブラウザ両方）で認証済みならそのまま次へ進む
      // LINEユーザー情報を確認（LocalStorageから）
      const lineUser = localStorage.getItem('line_user');

      if (lineUser) {
        // 回答制限をチェック (店舗単位で 1〜7 日設定可能、default 5)
        const userObj = JSON.parse(lineUser);
        const eligibilityCheck = await checkAnswerEligibility(reviewFormId, userObj.id, storeCode);

        if (!eligibilityCheck.isEligible) {
          // カスタムダイアログで表示
          setEligibilityMessage(eligibilityCheck.message || '一定期間後に\nアンケートをお願いします');
          setAuthLoading(false);
          return;
        }

        navigate(`/required-questions?reviewFormId=${reviewFormId}${storeParam}`);
        return;
      } else {
        // LINEユーザー情報がない場合はエラー表示
        setPageError('認証が完了していません。ページを再読み込みしてください。');
      }
    } catch (error) {
      setPageError('エラーが発生しました。もう一度お試しください。');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogin = async () => {
    // storeCodeがある場合はURLパラメータに含める
    const storeParam = storeCode ? `&storeCode=${storeCode}` : '';

    // プレビューモードではログインをスキップして直接質問画面へ
    if (isPreviewMode) {
      setLoginModalOpen(false);
      navigate(`/required-questions?reviewFormId=${reviewFormId}&mode=preview${storeParam}`);
      return;
    }

    setAuthLoading(true);
    setAuthError('');

    try {
      // Validate input
      if (!email || !password) {
        setAuthError('メールアドレスとパスワードを入力してください');
        return;
      }

      // Supabase authentication
      const { user, session } = await signInWithEmail(email, password);

      if (user && session) {
        setLoginModalOpen(false);
        // Navigate directly to questions page with reviewFormId
        navigate(`/required-questions?reviewFormId=${reviewFormId}${storeParam}`);
      }
    } catch (error) {

      // Handle specific error messages
      if (error.message.includes('Invalid login credentials')) {
        setAuthError('メールアドレスまたはパスワードが正しくありません');
      } else if (error.message.includes('Email not confirmed')) {
        setAuthError('メールアドレスが確認されていません');
      } else if (error.message.includes('foreign key constraint')) {
        setAuthError('ユーザー情報の作成に失敗しました。もう一度お試しください。');
      } else {
        setAuthError('ログインに失敗しました');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async () => {
    // storeCodeがある場合はURLパラメータに含める
    const storeParam = storeCode ? `&storeCode=${storeCode}` : '';

    // プレビューモードではログインをスキップして直接質問画面へ
    if (isPreviewMode) {
      setLoginModalOpen(false);
      navigate(`/required-questions?reviewFormId=${reviewFormId}&mode=preview${storeParam}`);
      return;
    }

    setAuthLoading(true);
    setAuthError('');

    try {
      // Validate input
      if (!name || !email || !password) {
        setAuthError('すべての項目を入力してください');
        return;
      }

      if (password.length < 6) {
        setAuthError('パスワードは6文字以上で入力してください');
        return;
      }

      // Supabase registration
      const { user, session } = await signUpWithEmail(email, password, name);

      if (user) {
        setLoginModalOpen(false);

        // If user needs email confirmation
        if (!session) {
          setAuthError('登録完了！メールを確認してアカウントを有効化してください');
          setLoginTab(0); // Switch to login tab
          return;
        }

        // If user is immediately logged in
        navigate(`/required-questions?reviewFormId=${reviewFormId}${storeParam}`);
      }
    } catch (error) {
      // Handle specific error messages
      if (error.message.includes('User already registered')) {
        setAuthError('このメールアドレスは既に登録されています');
      } else if (error.message.includes('Password should be at least 6 characters')) {
        setAuthError('パスワードは6文字以上で入力してください');
      } else {
        setAuthError('登録に失敗しました');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    // storeCodeがある場合はURLパラメータに含める
    const storeParam = storeCode ? `&storeCode=${storeCode}` : '';

    // プレビューモードではログインをスキップして直接質問画面へ
    if (isPreviewMode) {
      setLoginModalOpen(false);
      navigate(`/required-questions?reviewFormId=${reviewFormId}&mode=preview${storeParam}`);
      return;
    }

    setAuthLoading(true);
    setAuthError('');

    try {
      // Store reviewFormId and storeCode in localStorage for retrieval after OAuth redirect
      if (reviewFormId) {
        localStorage.setItem('pendingReviewFormId', reviewFormId);
      }
      if (storeCode) {
        localStorage.setItem('pendingStoreCode', storeCode);
      }

      // Initiate Google OAuth
      await signInWithGoogle();

      // OAuth will redirect to external Google login page
      // After successful authentication, user will be redirected back to /questions
    } catch (error) {
      setAuthError('Google認証に失敗しました');
      setAuthLoading(false);
    }
  };

  if (loading) {
    return null;
  }

  const themeColor = stringToColor(formSettings?.theme_color);
  const backgroundImage = loginSettings?.background_image_url || 
    'https://img.freepik.com/premium-photo/generative-ai-illustration-luxury-stores-decorated-different-colors-with-beautiful-interior-design_58460-12582.jpg';
  const logoUrl = formSettings?.logo_image_url;


  return (
    <>
      <PreviewIndicator isPreviewMode={isPreviewMode} themeColor={themeColor} />
      <Box
        sx={{
          height: '100vh',
          width: '100vw',
          overflow: 'hidden',
          position: 'fixed',
          top: 0,
          left: 0,
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)), url(${backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 2,
          // Prevent overscroll bounce on mobile
          overscrollBehavior: 'none',
          // Prevent pull-to-refresh
          touchAction: 'none'
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '100vh',
            textAlign: 'center',
            px: isMobile ? 3 : 2,
            py: isMobile ? 8 : 4,
            position: 'relative',
            maxWidth: isMobile ? 'none' : '900px',
            mx: 'auto',
            width: '100%',
            // Safe area padding for iOS devices
            paddingTop: isMobile ? 'max(8px, env(safe-area-inset-top))' : '4px',
            paddingBottom: isMobile ? 'max(32px, env(safe-area-inset-bottom))' : '16px'
          }}
        >
          {/* Top content area */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              flex: 1,
              justifyContent: 'center',
              pt: isMobile ? 4 : 0
            }}
          >
            {/* Logo */}
            {logoUrl && (
            <Box
              sx={{
                mb: isMobile ? 4 : 5,
                filter: 'drop-shadow(0 8px 20px rgba(0, 0, 0, 0.3))',
                animation: 'fadeInUp 0.8s ease-out 0.2s both'
              }}
            >
              <img
                src={logoUrl}
                alt="Logo"
                style={{
                  maxWidth: isMobile ? '180px' : '280px',
                  height: 'auto',
                  display: 'block',
                  margin: '0 auto'
                }}
              />
            </Box>
            )}

            {/* Title */}
            <Typography
              variant="h2"
              sx={{
                color: 'white',
                fontWeight: 700,
                mb: isMobile ? 3 : 4,
                fontSize: isMobile ? 'clamp(1.5rem, 5vw, 1.8rem)' : 'clamp(2rem, 3vw, 2.5rem)',
                textShadow: '0 6px 20px rgba(0, 0, 0, 0.6)',
                lineHeight: 1.2,
                maxWidth: isMobile ? '95vw' : '800px',
                mx: 'auto',
                animation: 'fadeInUp 0.8s ease-out 0.4s both',
                letterSpacing: '-0.01em'
              }}
            >
              {loginSettings?.title_text || 'OpenReviewへようこそ！'}
            </Typography>

            {/* Description */}
            <Typography
              variant="body1"
              sx={{
                color: 'rgba(255, 255, 255, 0.85)',
                mb: isMobile ? 4 : 5,
                lineHeight: 1.7,
                fontSize: isMobile ? '0.95rem' : '1.1rem',
                textShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
                maxWidth: isMobile ? '90vw' : '600px',
                mx: 'auto',
                animation: 'fadeInUp 0.8s ease-out 0.6s both',
                fontWeight: 400
              }}
            >
              {loginSettings?.detail_text ||
                'あなたの目的に合わせたアンケート項目を設定できます。質問項目を追加して、最適なアンケートを作成しましょう。'}
            </Typography>
            
            {/* エラーメッセージ表示 */}
            {pageError && (
              <Alert 
                severity="error" 
                sx={{ 
                  mt: 2,
                  mx: 2,
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  animation: 'fadeIn 0.5s ease-out'
                }}
              >
                {pageError}
              </Alert>
            )}
            
          </Box>

          {/* Bottom button area */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              pb: isMobile ? 'max(64px, env(safe-area-inset-bottom))' : 12,
              pt: isMobile ? 2 : 0,
              // Extra protection for Chrome mobile navigation
              paddingBottom: isMobile ? 'max(80px, env(safe-area-inset-bottom))' : '48px'
            }}
          >
            <Button
              variant="contained"
              onClick={handleProceedToAnswer}
              disabled={authLoading}
              sx={{
                backgroundColor: themeColor,
                color: 'white',
                width: '280px',
                height: isMobile ? 56 : 64,
                borderRadius: isMobile ? '28px' : '32px',
                fontSize: isMobile ? '1rem' : '1.1rem',
                fontWeight: 700,
                textTransform: 'none',
                boxShadow: '0 12px 40px rgba(0, 0, 0, 0.25)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                animation: 'fadeInUp 0.8s ease-out 0.8s both',
                '&:hover': {
                  backgroundColor: themeColor,
                  boxShadow: '0 16px 50px rgba(0, 0, 0, 0.35)',
                  transform: 'translateY(-3px) scale(1.02)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                },
                '&:active': {
                  transform: 'translateY(-1px) scale(0.98)',
                  transition: 'all 0.1s ease'
                }
              }}
            >
              {authLoading ? '準備中...' : (isPreviewMode ? 'プレビューを開始' : '回答へ進む')}
            </Button>
          </Box>

          {/* Decorative elements for mobile */}
          {isMobile && (
            <>
              <Box
                sx={{
                  position: 'absolute',
                  top: '15%',
                  left: '10%',
                  width: 8,
                  height: 8,
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '50%',
                  animation: 'float 3s ease-in-out infinite'
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  top: '25%',
                  right: '15%',
                  width: 6,
                  height: 6,
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  borderRadius: '50%',
                  animation: 'float 4s ease-in-out infinite 1s'
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  bottom: '20%',
                  left: '20%',
                  width: 4,
                  height: 4,
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '50%',
                  animation: 'float 5s ease-in-out infinite 2s'
                }}
              />
            </>
          )}
        </Box>

        {/* Global animations */}
        <Box
          component="style"
          dangerouslySetInnerHTML={{
            __html: `
              @keyframes fadeInUp {
                from {
                  opacity: 0;
                  transform: translateY(30px);
                }
                to {
                  opacity: 1;
                  transform: translateY(0);
                }
              }
              @keyframes float {
                0%, 100% {
                  transform: translateY(0px);
                }
                50% {
                  transform: translateY(-10px);
                }
              }
            `
          }}
        />
      </Box>

      {/* Login Modal - プレビューモードでは表示しない */}
      {!isPreviewMode && (
        <Modal
          open={loginModalOpen}
          onClose={() => setLoginModalOpen(false)}
        sx={{
          display: 'flex',
          alignItems: isMobile ? 'flex-end' : 'center',
          justifyContent: 'center'
        }}
      >
        <Card
          sx={{
            width: isMobile ? '100%' : 480,
            maxHeight: isMobile ? '80vh' : '90vh',
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            borderBottomLeftRadius: isMobile ? 0 : 16,
            borderBottomRightRadius: isMobile ? 0 : 16,
            boxShadow: isMobile 
              ? '0 -4px 20px rgba(0, 0, 0, 0.1)'
              : '0 8px 40px rgba(0, 0, 0, 0.15)'
          }}
        >
          <CardContent sx={{ p: isMobile ? 3 : 4 }}>
            <Typography
              variant="h6"
              sx={{ 
                textAlign: 'center', 
                mb: 3, 
                fontWeight: 600,
                fontSize: isMobile ? '1.25rem' : '1.4rem'
              }}
            >
              アカウント
            </Typography>

            <Tabs
              value={loginTab}
              onChange={(e, newValue) => setLoginTab(newValue)}
              centered
              sx={{ 
                mb: 3,
                '& .MuiTab-root': {
                  fontSize: isMobile ? '0.9rem' : '1rem',
                  fontWeight: 600
                }
              }}
            >
              <Tab label="ログイン" />
              <Tab label="新規登録" />
            </Tabs>

            {authError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {authError}
              </Alert>
            )}

            <Box component="form" onSubmit={(e) => e.preventDefault()}>
              {loginTab === 1 && (
                <TextField
                  fullWidth
                  label="お名前"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  margin="normal"
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px'
                    }
                  }}
                />
              )}
              
              <TextField
                fullWidth
                label="メールアドレス"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                margin="normal"
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px'
                  }
                }}
              />
              
              <TextField
                fullWidth
                label="パスワード"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                margin="normal"
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px'
                  }
                }}
              />

              <Button
                fullWidth
                variant="contained"
                onClick={loginTab === 0 ? handleLogin : handleRegister}
                disabled={authLoading}
                sx={{
                  mt: 3,
                  backgroundColor: themeColor,
                  height: isMobile ? 50 : 56,
                  borderRadius: '24px',
                  fontSize: isMobile ? '1rem' : '1.1rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                  '&:hover': {
                    backgroundColor: themeColor,
                    opacity: 0.9,
                    boxShadow: '0 6px 25px rgba(0, 0, 0, 0.2)'
                  }
                }}
              >
                {authLoading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  loginTab === 0 ? 'ログイン' : '新規登録'
                )}
              </Button>

              {/* Divider */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  my: 3,
                  '&::before, &::after': {
                    content: '""',
                    flex: 1,
                    height: '1px',
                    backgroundColor: '#E5E7EB'
                  }
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    px: 2,
                    color: '#9CA3AF',
                    fontSize: '0.875rem',
                    fontWeight: 500
                  }}
                >
                  または
                </Typography>
              </Box>

              {/* Google Login Button */}
              <Button
                fullWidth
                variant="outlined"
                onClick={handleGoogleLogin}
                disabled={authLoading}
                sx={{
                  height: isMobile ? 50 : 56,
                  borderRadius: '24px',
                  fontSize: isMobile ? '1rem' : '1.1rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  borderColor: '#E5E7EB',
                  color: '#374151',
                  backgroundColor: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  '&:hover': {
                    backgroundColor: '#F9FAFB',
                    borderColor: '#D1D5DB',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                  },
                  '&:disabled': {
                    backgroundColor: '#F3F4F6',
                    borderColor: '#E5E7EB',
                    color: '#9CA3AF'
                  }
                }}
              >
                <Box
                  component="img"
                  src="https://developers.google.com/identity/images/g-logo.png"
                  alt="Google"
                  sx={{
                    width: 20,
                    height: 20
                  }}
                />
                Googleでログイン
              </Button>
            </Box>
          </CardContent>
        </Card>
        </Modal>
      )}
      
      {/* Eligibility Message Dialog */}
      <Dialog
        open={!!eligibilityMessage}
        onClose={() => setEligibilityMessage('')}
        PaperProps={{
          sx: {
            borderRadius: 2,
            minWidth: 280,
            p: 1
          }
        }}
      >
        <DialogContent>
          <Typography
            variant="body1"
            sx={{
              textAlign: 'center',
              whiteSpace: 'pre-line',
              fontSize: '1rem',
              lineHeight: 1.6,
              color: '#374151'
            }}
          >
            {eligibilityMessage}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
          <Button
            onClick={() => setEligibilityMessage('')}
            variant="contained"
            sx={{
              backgroundColor: themeColor,
              color: 'white',
              borderRadius: '20px',
              px: 4,
              '&:hover': {
                backgroundColor: themeColor,
                opacity: 0.9
              }
            }}
          >
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default WelcomePage;