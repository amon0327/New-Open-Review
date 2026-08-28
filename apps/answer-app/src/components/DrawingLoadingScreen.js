import React, { useEffect, useState } from 'react';
import { Box, useMediaQuery, useTheme } from '@mui/material';

const DrawingLoadingScreen = ({ onComplete, themeColor }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [showWhiteScreen, setShowWhiteScreen] = useState(false);

  useEffect(() => {
    // 動画再生完了後に onComplete を呼び出す
    const videoElement = document.getElementById('drawing-video');
    
    if (videoElement) {
      const handleVideoEnd = () => {
        // 動画終了後に白い画面を表示
        setShowWhiteScreen(true);
        // 少し遅延を加えてから遷移
        setTimeout(() => {
          onComplete();
        }, 300);
      };

      videoElement.addEventListener('ended', handleVideoEnd);
      
      // クリーンアップ
      return () => {
        videoElement.removeEventListener('ended', handleVideoEnd);
      };
    }
  }, [onComplete]);

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: showWhiteScreen ? '#ffffff' : 'rgba(0, 0, 0, 0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        overflow: 'hidden',
        transition: showWhiteScreen ? 'background-color 0.2s ease-in-out' : 'none',
        // Safe area padding for iOS devices
        paddingTop: isMobile ? 'env(safe-area-inset-top)' : 0,
        paddingBottom: isMobile ? 'env(safe-area-inset-bottom)' : 0
      }}
    >
      {!showWhiteScreen && (
        <Box
          sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
          }}
        >
          <video
            id="drawing-video"
            autoPlay
            muted
            playsInline
            style={{
              width: isMobile ? '100vw' : 'auto',
              height: isMobile ? '100vh' : '95vh',
              maxHeight: isMobile ? '100vh' : '95vh',
              borderRadius: isMobile ? '0' : '16px',
              boxShadow: isMobile ? 'none' : '0 20px 60px rgba(0, 0, 0, 0.5)',
              objectFit: isMobile ? 'cover' : 'contain'
            }}
          >
            <source 
              src="https://otfreskkeaenahqziriz.supabase.co/storage/v1/object/public/answer-app/drawing_in_progress.mp4" 
              type="video/mp4" 
            />
            お使いのブラウザは動画の再生に対応していません。
          </video>
        </Box>
      )}
    </Box>
  );
};

export default DrawingLoadingScreen;