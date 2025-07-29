import React from 'react';
import {
  Box,
  Typography,
  Button
} from '@mui/material';

const PreviewCompletion = ({ previewMode }) => {
  const isMobile = previewMode === 'mobile';

  // サンプルデータ
  const themeColor = '#5e17eb';
  const backgroundImage = 'https://misezukuri.com/wp-content/uploads/2023/10/b86e65d61ae3fbd3b3f1ec5c67484853.jpg';
  const logoUrl = 'https://otfreskkeaenahqziriz.supabase.co/storage/v1/object/public/app-assets/logo/OpenReviewWhiteThemeLoog.png';
  const titleText = 'ありがとうございました！';
  const detailText = 'あなたの貴重なご意見をお聞かせいただき、ありがとうございました。いただいたフィードバックは今後のサービス向上に活用させていただきます。';
  const button1Text = '完了';

  const handleButtonClick = () => {
    // プレビュー用なので何もしない
  };

  return (
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
  );
};

export default PreviewCompletion;