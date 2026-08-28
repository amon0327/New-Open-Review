import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  getReviewFormSettings,
  stringToColor
} from '../lib/supabase';
import PreviewIndicator from './PreviewIndicator';

const CooldownPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // State management
  const [loading, setLoading] = useState(true);
  const [formSettings, setFormSettings] = useState(null);

  const reviewFormId = searchParams.get('reviewFormId');
  const isPreviewMode = searchParams.get('mode') === 'preview';

  useEffect(() => {
    loadFormData();
  }, [reviewFormId]);

  const loadFormData = async () => {
    if (!reviewFormId) {
      navigate('/not-found');
      return;
    }

    setLoading(true);
    
    try {
      const settingsData = await getReviewFormSettings(reviewFormId);
      setFormSettings(settingsData || {});
    } catch (error) {
      console.error('Error loading form settings:', error);
      setFormSettings({});
    } finally {
      setLoading(false);
    }
  };

  const handleBackClick = () => {
    if (isPreviewMode) {
      navigate(`/?reviewFormId=${reviewFormId}&mode=preview`);
    } else {
      navigate(`/?reviewFormId=${reviewFormId}`);
    }
  };

  if (loading) {
    return null;
  }

  const logoUrl = formSettings?.logo_image_url;
  const themeColor = stringToColor(formSettings?.theme_color);

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
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            px: isMobile ? 3 : 2,
            py: isMobile ? 8 : 4,
            position: 'relative',
            maxWidth: isMobile ? 'none' : '600px',
            mx: 'auto',
            width: '100%',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
            borderRadius: '24px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
            // Safe area padding for iOS devices
            paddingTop: isMobile ? 'max(32px, env(safe-area-inset-top))' : '32px',
            paddingBottom: isMobile ? 'max(32px, env(safe-area-inset-bottom))' : '32px'
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
            variant="h3"
            sx={{
              color: 'white',
              fontWeight: 700,
              mb: isMobile ? 3 : 4,
              fontSize: isMobile ? 'clamp(1.3rem, 4vw, 1.6rem)' : 'clamp(1.8rem, 3vw, 2.2rem)',
              textShadow: '0 6px 20px rgba(0, 0, 0, 0.6)',
              lineHeight: 1.2,
              animation: 'fadeInUp 0.8s ease-out 0.4s both',
              letterSpacing: '-0.01em'
            }}
          >
            ご協力ありがとうございます
          </Typography>

          {/* Message */}
          <Typography
            variant="body1"
            sx={{
              color: 'rgba(255, 255, 255, 0.9)',
              mb: isMobile ? 4 : 5,
              lineHeight: 1.7,
              fontSize: isMobile ? '1rem' : '1.1rem',
              textShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
              maxWidth: isMobile ? '90vw' : '500px',
              mx: 'auto',
              animation: 'fadeInUp 0.8s ease-out 0.6s both',
              fontWeight: 400
            }}
          >
            一定期間後にまた<br />
            アンケートをお願いします
          </Typography>

          {/* Back Button */}
          <Button
            variant="contained"
            onClick={handleBackClick}
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              width: '200px',
              height: isMobile ? 48 : 56,
              borderRadius: isMobile ? '24px' : '28px',
              fontSize: isMobile ? '0.95rem' : '1rem',
              fontWeight: 600,
              textTransform: 'none',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              animation: 'fadeInUp 0.8s ease-out 0.8s both',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.3)',
                boxShadow: '0 12px 40px rgba(0, 0, 0, 0.3)',
                transform: 'translateY(-2px)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              },
              '&:active': {
                transform: 'translateY(0px)',
                transition: 'all 0.1s ease'
              }
            }}
          >
            戻る
          </Button>

          {/* Decorative clock icon */}
          <Box
            sx={{
              position: 'absolute',
              top: isMobile ? 20 : 30,
              right: isMobile ? 20 : 30,
              width: 24,
              height: 24,
              borderRadius: '50%',
              border: '2px solid rgba(255, 255, 255, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'pulse 2s ease-in-out infinite',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 2,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 1,
                height: 6,
                backgroundColor: 'rgba(255, 255, 255, 0.6)',
                borderRadius: '0.5px'
              },
              '&::after': {
                content: '""',
                position: 'absolute',
                top: 6,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 1,
                height: 4,
                backgroundColor: 'rgba(255, 255, 255, 0.6)',
                borderRadius: '0.5px'
              }
            }}
          />
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
              @keyframes pulse {
                0%, 100% {
                  opacity: 1;
                  transform: scale(1);
                }
                50% {
                  opacity: 0.7;
                  transform: scale(1.1);
                }
              }
            `
          }}
        />
      </Box>
    </>
  );
};

export default CooldownPage;