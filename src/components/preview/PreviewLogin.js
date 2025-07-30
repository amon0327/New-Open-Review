import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button
} from '@mui/material';
import { getLoginPageData } from '../../services/LoginScreenService';

const PreviewLogin = ({ 
  previewMode,
  // 基本設定関連
  onElementSelect,
  selectedElement,
  // フォームID
  formId,
  // フォーム設定
  formSettings = {},
  // ログイン画面設定
  loginScreenSettings = {},
  headerImage,
  logoImage,
  // 設定データ（将来的にpropsで受け取る）
  loginBackgroundImage,
  loginLogoImage,
  loginTitleText,
  loginDetailText,
  themeColor: propThemeColor,
  buttonText,
  buttonUrl
}) => {
  const [loginData, setLoginData] = useState(null);
  const [loading, setLoading] = useState(true);

  const isMobile = previewMode === 'mobile';

  // Supabaseからログイン画面データを取得
  useEffect(() => {
    const fetchLoginData = async () => {
      if (!formId) {
        setLoading(false);
        return;
      }

      try {
        const data = await getLoginPageData(formId);
        setLoginData(data);
      } catch (error) {
        console.error('Error fetching login data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLoginData();
  }, [formId]);

  // デフォルト値とSupabaseデータ、propsから受け取ったデータの統合
  const themeColor = formSettings.theme_color || propThemeColor || (loginData?.formSettings?.theme_color) || '#5e17eb';
  const backgroundImage = loginScreenSettings.background_image_url || loginBackgroundImage || (loginData?.loginSettings?.background_image_url) || 'https://img.freepik.com/premium-photo/generative-ai-illustration-luxury-stores-decorated-different-colors-with-beautiful-interior-design_58460-12582.jpg';
  const logoUrl = logoImage || loginLogoImage || (loginData?.formSettings?.logo_image_url) || 'https://otfreskkeaenahqziriz.supabase.co/storage/v1/object/public/app-assets/logo/OpenReviewWhiteThemeLoog.png';
  const titleText = (loginScreenSettings.title_text !== undefined && loginScreenSettings.title_text !== '') 
    ? loginScreenSettings.title_text 
    : (loginTitleText || (loginData?.loginSettings?.title_text) || 'OpenReviewへようこそ！');
  const detailText = (loginScreenSettings.detail_text !== undefined && loginScreenSettings.detail_text !== '') 
    ? loginScreenSettings.detail_text 
    : (loginDetailText || (loginData?.loginSettings?.detail_text) || 'あなたの目的に合わせたレビュー項目を設定できます。質問項目を追加して、最適なレビューを作成しましょう。');
  const displayButtonText = buttonText || '回答へ進む';
  const displayButtonUrl = buttonUrl || '#';


  return (
    <>
      <Box
        onClick={() => onElementSelect && onElementSelect('login-background')}
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
          padding: 2,
          cursor: 'pointer',
          position: 'relative',
          '&::after': selectedElement === 'login-background' ? {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(94, 23, 235, 0.3)',
            zIndex: 1,
            pointerEvents: 'none'
          } : {}
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
              onClick={(e) => {
                e.stopPropagation();
                onElementSelect && onElementSelect('login-logo');
              }}
              sx={{ 
                mb: isMobile ? 4 : 5,
                filter: 'drop-shadow(0 8px 20px rgba(0, 0, 0, 0.3))',
                animation: 'fadeInUp 0.8s ease-out 0.2s both',
                cursor: 'pointer',
                position: 'relative',
                zIndex: 2,
                display: 'inline-block',
                '&::after': selectedElement === 'login-logo' ? {
                  content: '""',
                  position: 'absolute',
                  top: -8,
                  left: -8,
                  right: -8,
                  bottom: -8,
                  backgroundColor: 'rgba(94, 23, 235, 0.3)',
                  borderRadius: 2,
                  zIndex: -1,
                  pointerEvents: 'none'
                } : {}
              }}
            >
              <img
                src={logoUrl}
                alt="Logo"
                style={{
                  maxWidth: isMobile ? '180px' : '280px',
                  height: 'auto',
                  display: 'block',
                  margin: '0 auto',
                  position: 'relative',
                  zIndex: 1
                }}
              />
            </Box>

            {/* Title */}
            <Typography
              variant="h2"
              onClick={(e) => {
                e.stopPropagation();
                onElementSelect && onElementSelect('login-title');
              }}
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
                letterSpacing: '-0.01em',
                cursor: 'pointer',
                position: 'relative',
                zIndex: 2,
                transition: 'all 0.3s ease',
                '&::after': selectedElement === 'login-title' ? {
                  content: '""',
                  position: 'absolute',
                  top: -8,
                  left: -16,
                  right: -16,
                  bottom: -8,
                  backgroundColor: 'rgba(94, 23, 235, 0.3)',
                  borderRadius: 2,
                  zIndex: -1,
                  pointerEvents: 'none'
                } : {}
              }}
            >
              {titleText}
            </Typography>

            {/* Description */}
            <Typography
              variant="body1"
              onClick={(e) => {
                e.stopPropagation();
                onElementSelect && onElementSelect('login-detail');
              }}
              sx={{
                color: 'rgba(255, 255, 255, 0.85)',
                mb: isMobile ? 4 : 5,
                lineHeight: 1.7,
                fontSize: isMobile ? '0.95rem' : '1.1rem',
                textShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
                maxWidth: isMobile ? '90vw' : '600px',
                mx: 'auto',
                animation: 'fadeInUp 0.8s ease-out 0.6s both',
                fontWeight: 400,
                cursor: 'pointer',
                position: 'relative',
                zIndex: 2,
                transition: 'all 0.3s ease',
                '&::after': selectedElement === 'login-detail' ? {
                  content: '""',
                  position: 'absolute',
                  top: -8,
                  left: -16,
                  right: -16,
                  bottom: -8,
                  backgroundColor: 'rgba(94, 23, 235, 0.3)',
                  borderRadius: 2,
                  zIndex: -1,
                  pointerEvents: 'none'
                } : {}
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
              onClick={(e) => {
                e.stopPropagation();
                onElementSelect && onElementSelect('login-button');
              }}
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
                cursor: 'pointer',
                position: 'relative',
                zIndex: 2,
                transition: 'all 0.3s ease',
                '&:hover': {
                  backgroundColor: themeColor,
                  boxShadow: '0 16px 50px rgba(0, 0, 0, 0.35)',
                  transform: 'translateY(-3px) scale(1.02)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                },
                '&:active': {
                  transform: 'translateY(-1px) scale(0.98)',
                  transition: 'all 0.1s ease'
                },
                '&::after': selectedElement === 'login-button' ? {
                  content: '""',
                  position: 'absolute',
                  top: -8,
                  left: -8,
                  right: -8,
                  bottom: -8,
                  backgroundColor: 'rgba(94, 23, 235, 0.3)',
                  borderRadius: isMobile ? '36px' : '40px',
                  zIndex: -1,
                  pointerEvents: 'none'
                } : {}
              }}
            >
              {displayButtonText}
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

    </>
  );
};

export default PreviewLogin;