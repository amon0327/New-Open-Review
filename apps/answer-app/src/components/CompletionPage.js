import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  CircularProgress,
  useMediaQuery,
  useTheme,
  Dialog,
  DialogContent
} from '@mui/material';
import {
  getCompletionScreenSettings,
  getReviewFormSettings,
  stringToColor
} from '../lib/supabase';
import PreviewIndicator from './PreviewIndicator';

const CompletionPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // State management
  const [loading, setLoading] = useState(true);
  const [completionSettings, setCompletionSettings] = useState(null);
  const [formSettings, setFormSettings] = useState(null);
  const [showAlert, setShowAlert] = useState(false);

  const reviewFormId = searchParams.get('reviewFormId');
  const submissionId = searchParams.get('submissionId');
  const isPreviewMode = searchParams.get('mode') === 'preview';

  useEffect(() => {
    loadCompletionData();
  }, [reviewFormId]);

  const loadCompletionData = async () => {
    if (!reviewFormId) {
      navigate('/not-found');
      return;
    }

    setLoading(true);
    
    try {
      // Parallel data fetching - プレビューモードでは設定がなくてもエラーにしない
      const [completionData, settingsData] = await Promise.allSettled([
        getCompletionScreenSettings(reviewFormId),
        getReviewFormSettings(reviewFormId)
      ]);

      const completionResult = completionData.status === 'fulfilled' ? completionData.value : null;
      const settingsResult = settingsData.status === 'fulfilled' ? settingsData.value : null;

      // プレビューモードでは設定がなくてもデフォルト値で継続
      setCompletionSettings(completionResult || {});
      setFormSettings(settingsResult || {});
      
      // ページロード完了後にアラートを表示
      setTimeout(() => {
        setShowAlert(true);
      }, 800);
    } catch (error) {
      navigate('/not-found');
    } finally {
      setLoading(false);
    }
  };

  const handleButtonClick = () => {
    const buttonUrl = completionSettings?.button_url_1;
    if (buttonUrl && buttonUrl !== 'URL' && buttonUrl !== '') {
      // SupabaseのURLを新しいタブで開く
      window.open(buttonUrl, '_blank');
    } else {
      // Default action - go back to start
      if (isPreviewMode) {
        navigate(`/?reviewFormId=${reviewFormId}&mode=preview`);
      } else {
        navigate(`/?reviewFormId=${reviewFormId}`);
      }
    }
  };

  const handleCloseAlert = () => {
    setShowAlert(false);
  };

  if (loading) {
    return null;
  }

  // Default values matching Flutter app defaults
  const backgroundImage = completionSettings?.background_image_url || 
    'https://misezukuri.com/wp-content/uploads/2023/10/b86e65d61ae3fbd3b3f1ec5c67484853.jpg';
  const logoUrl = formSettings?.logo_image_url;
  const themeColor = stringToColor(formSettings?.theme_color);
  
  // プレビューモード時のテキスト調整
  const titleText = completionSettings?.title_text || 'タイトルテキスト';
  
  const detailText = completionSettings?.detail_text || 
    (isPreviewMode 
      ? 'プレビューモードです。回答データは保存されませんでした。'
      : '詳細テキスト');
  
  // Button 1 configuration
  const button1Text = completionSettings?.button_text_1 || 
    (isPreviewMode 
      ? 'プレビューを再開'
      : 'ボタンテキスト');
  const button1Url = completionSettings?.button_url_1 || 'URL';
  
  // ボタンを表示するかどうかの判定
  const shouldShowButton = completionSettings?.button_text_1 && 
                          completionSettings?.button_text_1 !== '' && 
                          completionSettings?.button_text_1 !== 'ボタンテキスト';

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

        {/* Bottom button area - ボタンが設定されている場合のみ表示 */}
        {shouldShowButton && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              pb: isMobile ? 12 : 12,
              pt: isMobile ? 2 : 0,
              // Chrome mobile navigation protection
              paddingBottom: isMobile ? 'max(96px, env(safe-area-inset-bottom))' : '48px'
            }}
          >
            <Button
              variant="contained"
              onClick={handleButtonClick}
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
              {button1Text}
            </Button>
          </Box>
        )}

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

      {/* ハズレアラート */}
      <Dialog
        open={showAlert}
        onClose={handleCloseAlert}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '24px',
            padding: isMobile ? 2 : 3,
            margin: isMobile ? 2 : 3,
            backgroundColor: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            maxWidth: isMobile ? '90vw' : '400px'
          }
        }}
        BackdropProps={{
          sx: {
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(4px)'
          }
        }}
      >
        <DialogContent
          sx={{
            textAlign: 'center',
            py: isMobile ? 3 : 4,
            px: isMobile ? 2 : 3
          }}
        >
          {/* ハズレ画像 */}
          <Box
            sx={{
              mb: 3,
              display: 'flex',
              justifyContent: 'center'
            }}
          >
            <img
              src="https://otfreskkeaenahqziriz.supabase.co/storage/v1/object/public/answer-app/lose%20(2).png"
              alt="ハズレ"
              style={{
                width: isMobile ? '150px' : '180px',
                height: 'auto',
                display: 'block'
              }}
            />
          </Box>

          {/* ハズレテキスト */}
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              color: '#333',
              fontSize: isMobile ? '1.3rem' : '1.5rem',
              letterSpacing: '-0.02em'
            }}
          >
            また来てね!
          </Typography>
        </DialogContent>
      </Dialog>
    </Box>
    </>
  );
};

export default CompletionPage;