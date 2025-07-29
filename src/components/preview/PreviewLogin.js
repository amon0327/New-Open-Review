import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Modal,
  Card,
  CardContent,
  TextField,
  Tab,
  Tabs,
  Alert,
  CircularProgress
} from '@mui/material';

const PreviewLogin = ({ previewMode }) => {
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [loginTab, setLoginTab] = useState(0);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const isMobile = previewMode === 'mobile';

  // サンプルデータ
  const themeColor = '#5e17eb';
  const backgroundImage = 'https://img.freepik.com/premium-photo/generative-ai-illustration-luxury-stores-decorated-different-colors-with-beautiful-interior-design_58460-12582.jpg';
  const logoUrl = 'https://otfreskkeaenahqziriz.supabase.co/storage/v1/object/public/app-assets/logo/OpenReviewWhiteThemeLoog.png';
  const titleText = 'OpenReviewへようこそ！';
  const detailText = 'あなたの目的に合わせたレビュー項目を設定できます。質問項目を追加して、最適なレビューを作成しましょう。';

  const handleProceedToAnswer = () => {
    setLoginModalOpen(true);
  };

  const handleLogin = async () => {
    setAuthLoading(true);
    setAuthError('');
    
    // プレビュー用のダミー処理
    setTimeout(() => {
      if (!email || !password) {
        setAuthError('メールアドレスとパスワードを入力してください');
        setAuthLoading(false);
        return;
      }
      
      // 成功した場合はモーダルを閉じる
      setLoginModalOpen(false);
      setAuthLoading(false);
    }, 1000);
  };

  const handleRegister = async () => {
    setAuthLoading(true);
    setAuthError('');
    
    // プレビュー用のダミー処理
    setTimeout(() => {
      if (!name || !email || !password) {
        setAuthError('すべての項目を入力してください');
        setAuthLoading(false);
        return;
      }
      
      if (password.length < 6) {
        setAuthError('パスワードは6文字以上で入力してください');
        setAuthLoading(false);
        return;
      }
      
      // 成功した場合はモーダルを閉じる
      setLoginModalOpen(false);
      setAuthLoading(false);
    }, 1000);
  };

  const handleGoogleLogin = async () => {
    setAuthLoading(true);
    setAuthError('');
    
    // プレビュー用のダミー処理
    setTimeout(() => {
      setLoginModalOpen(false);
      setAuthLoading(false);
    }, 1000);
  };

  return (
    <>
      <Box
        sx={{
          height: '100%',
          width: '100%',
          overflow: 'hidden',
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)), url(${backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 2
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: '100%',
            textAlign: 'center',
            px: isMobile ? 3 : 2,
            py: isMobile ? 6 : 4,
            position: 'relative',
            maxWidth: isMobile ? 'none' : '900px',
            mx: 'auto',
            width: '100%'
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
              {titleText}
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
              {detailText}
            </Typography>
          </Box>

          {/* Bottom button area */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              pb: isMobile ? 4 : 12
            }}
          >
            <Button
              variant="contained"
              onClick={handleProceedToAnswer}
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
              回答へ進む
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

      {/* Login Modal */}
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
    </>
  );
};

export default PreviewLogin;