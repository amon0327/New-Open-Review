import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  useMediaQuery,
  useTheme,
  Dialog,
  DialogContent
} from '@mui/material';
import {
  getCompletionScreenSettings,
  getReviewFormSettings,
  stringToColor,
  confirmReceipt,
  verifyWinnerToken
} from '../lib/supabase';
import PreviewIndicator from './PreviewIndicator';

const WinnerPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // State management
  const [loading, setLoading] = useState(true);
  const [completionSettings, setCompletionSettings] = useState(null);
  const [formSettings, setFormSettings] = useState(null);
  const [showAlert, setShowAlert] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isReceiving, setIsReceiving] = useState(false);
  const [isReceived, setIsReceived] = useState(false);
  const [tokenError, setTokenError] = useState(null);
  const [tokenValid, setTokenValid] = useState(false);

  const reviewFormId = searchParams.get('reviewFormId');
  const submissionId = searchParams.get('submissionId');
  const winnerId = searchParams.get('winnerId');
  const token = searchParams.get('token'); // Token parameter
  const isPreviewMode = searchParams.get('mode') === 'preview';

  useEffect(() => {
    verifyTokenAndLoadData();
  }, [reviewFormId, token]);

  const verifyTokenAndLoadData = async () => {
    setLoading(true);
    
    // プレビューモードではToken検証をスキップ
    if (isPreviewMode) {
      setTokenValid(true);
      await loadCompletionData();
      return;
    }

    // Token検証
    if (!token) {
      setTokenError('無効なURLです');
      setLoading(false);
      return;
    }

    try {
      const tokenResult = await verifyWinnerToken(token);
      
      if (tokenResult.success && tokenResult.isValid) {
        setTokenValid(true);
        
        if (tokenResult.isReceived) {
          setIsReceived(true);
          setTokenError('すでに受取済みです');
        }
        
        await loadCompletionData();
      } else {
        setTokenError(tokenResult.error || '無効なURLです');
        setLoading(false);
      }
    } catch (error) {
      console.error('Token verification error:', error);
      setTokenError('システムエラーが発生しました');
      setLoading(false);
    }
  };

  const loadCompletionData = async () => {
    if (!reviewFormId) {
      navigate('/not-found');
      return;
    }
    
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
      
      // ページロード完了後にアラートを表示（Tokenが有効で未受取の場合のみ）
      if (tokenValid && !isReceived) {
        setTimeout(() => {
          setShowAlert(true);
        }, 800);
      }
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

  const handleReceiveClick = () => {
    if (isPreviewMode) {
      alert('プレビューモードでは受取操作はできません');
      return;
    }
    setShowConfirmDialog(true);
  };

  const handleConfirmReceive = async () => {
    setIsReceiving(true);
    
    try {
      // Use token as winnerId
      const result = await confirmReceipt(token);
      
      if (result.success) {
        setIsReceived(true);
        setShowConfirmDialog(false);
        alert('受取が完了しました！');
      } else {
        throw new Error(result.error || '受取処理に失敗しました');
      }
    } catch (error) {
      console.error('Error confirming receipt:', error);
      alert(`エラーが発生しました: ${error.message}`);
    } finally {
      setIsReceiving(false);
    }
  };

  if (loading) {
    return null;
  }

  // Show error screen if token is invalid or other errors
  if (tokenError && !tokenValid) {
    return (
      <>
        <PreviewIndicator isPreviewMode={isPreviewMode} themeColor="#8C52FF" />
        <Box
          sx={{
            height: '100vh',
            width: '100vw',
            overflow: 'hidden',
            position: 'fixed',
            top: 0,
            left: 0,
            background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 2,
            overscrollBehavior: 'none',
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
              paddingTop: isMobile ? 'max(32px, env(safe-area-inset-top))' : '32px',
              paddingBottom: isMobile ? 'max(32px, env(safe-area-inset-bottom))' : '32px'
            }}
          >
            {/* Error Icon */}
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 4,
                border: '2px solid rgba(255, 255, 255, 0.3)',
                '&::before': {
                  content: '"✗"',
                  fontSize: '2.5rem',
                  fontWeight: 'bold',
                  color: 'white'
                }
              }}
            />

            {/* Error Title */}
            <Typography
              variant="h3"
              sx={{
                color: 'white',
                fontWeight: 700,
                mb: isMobile ? 3 : 4,
                fontSize: isMobile ? 'clamp(1.3rem, 4vw, 1.6rem)' : 'clamp(1.8rem, 3vw, 2.2rem)',
                textShadow: '0 6px 20px rgba(0, 0, 0, 0.6)',
                lineHeight: 1.2,
                animation: 'fadeInUp 0.8s ease-out 0.2s both',
                letterSpacing: '-0.01em'
              }}
            >
              アクセスエラー
            </Typography>

            {/* Error Message */}
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
                animation: 'fadeInUp 0.8s ease-out 0.4s both',
                fontWeight: 400
              }}
            >
              {tokenError}
            </Typography>

            {/* Back Button */}
            <Button
              variant="contained"
              onClick={() => navigate('/')}
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
                animation: 'fadeInUp 0.8s ease-out 0.6s both',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.3)',
                  boxShadow: '0 12px 40px rgba(0, 0, 0, 0.3)',
                  transform: 'translateY(-2px)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }
              }}
            >
              ホームに戻る
            </Button>
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
              `
            }}
          />
        </Box>
      </>
    );
  }

  // Winner page specific background image
  const backgroundImage = 'https://otfreskkeaenahqziriz.supabase.co/storage/v1/object/public/answer-app/winner_image.png';
  const logoUrl = formSettings?.logo_image_url;
  const themeColor = stringToColor(formSettings?.theme_color);
  
  // プレビューモード時のテキスト調整
  const titleText = completionSettings?.title_text || 'おめでとうございます！';
  
  const detailText = completionSettings?.detail_text || 
    (isPreviewMode 
      ? 'プレビューモードです。抽選結果は実際のものではありません。'
      : 'あなたの当選です！');
  
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
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
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
          justifyContent: 'flex-start',
          alignItems: 'center',
          minHeight: '100vh',
          textAlign: 'center',
          position: 'relative',
          width: '100%',
          px: isMobile ? 2 : 4,
          pt: isMobile ? 8 : 12,
          pb: isMobile ? 4 : 6,
          // Safe area padding for iOS devices
          paddingTop: isMobile ? 'max(64px, env(safe-area-inset-top))' : '80px',
          paddingBottom: isMobile ? 'max(32px, env(safe-area-inset-bottom))' : '32px'
        }}
      >
        {/* Main content area */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            maxWidth: isMobile ? '90vw' : '600px',
            mx: 'auto'
          }}
        >

          {/* Main Winner Title */}
          <Typography
            variant="h1"
            sx={{
              color: '#FFD700',
              fontWeight: 900,
              mb: isMobile ? 2 : 3,
              fontSize: isMobile ? 'clamp(3.5rem, 12vw, 5rem)' : 'clamp(5rem, 10vw, 8rem)',
              textShadow: '0 8px 16px rgba(0, 0, 0, 0.9)',
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              fontFamily: '"Noto Sans JP", "Hiragino Kaku Gothic ProN", "Hiragino Sans", Meiryo, sans-serif'
            }}
          >
            当選
          </Typography>

          {/* Staff instruction message */}
          <Typography
            variant="body1"
            sx={{
              color: 'white',
              fontWeight: 500,
              mb: isMobile ? 8 : 12,
              fontSize: isMobile ? '1rem' : '1.2rem',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.8)',
              lineHeight: 1.4,
              animation: 'fadeInUp 0.8s ease-out 0.5s both',
              opacity: 0.9
            }}
          >
            スタッフの方をお呼びください
          </Typography>
        </Box>

        {/* Button area - positioned at bottom with Chrome navigation protection */}
        <Box
          sx={{
            position: 'absolute',
            bottom: isMobile ? 120 : 60,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            // Extra protection for Chrome mobile navigation
            paddingBottom: isMobile ? 'max(20px, env(safe-area-inset-bottom))' : 0,
            zIndex: 10
          }}
        >
          {/* 受取ボタン */}
          {!isReceived && (
            <Button
              variant="contained"
              onClick={handleReceiveClick}
              disabled={isReceiving}
              sx={{
                background: 'linear-gradient(45deg, #FFD700 0%, #FFC107 50%, #FFD700 100%)',
                color: '#333',
                width: isMobile ? '280px' : '320px',
                height: isMobile ? 60 : 72,
                borderRadius: isMobile ? '30px' : '36px',
                fontSize: isMobile ? '1.1rem' : '1.3rem',
                fontWeight: 800,
                textTransform: 'none',
                boxShadow: '0 8px 32px rgba(255, 215, 0, 0.5), 0 0 0 3px rgba(255, 255, 255, 0.3)',
                border: '2px solid rgba(255, 255, 255, 0.4)',
                animation: 'pulse 2s infinite, fadeInUp 0.8s ease-out 0.8s both',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: '-100%',
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
                  transition: 'left 0.6s',
                },
                '&:hover': {
                  background: 'linear-gradient(45deg, #FFC107 0%, #FFB300 50%, #FFC107 100%)',
                  boxShadow: '0 12px 40px rgba(255, 215, 0, 0.6), 0 0 0 4px rgba(255, 255, 255, 0.4)',
                  transform: 'translateY(-4px) scale(1.03)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&::before': {
                    left: '100%',
                  }
                },
                '&:active': {
                  transform: 'translateY(-2px) scale(0.98)',
                  transition: 'all 0.1s ease'
                },
                '&:disabled': {
                  background: 'rgba(255, 215, 0, 0.4)',
                  color: 'rgba(51, 51, 51, 0.6)',
                  boxShadow: '0 4px 16px rgba(255, 215, 0, 0.2)'
                }
              }}
            >
              {isReceiving ? '処理中...' : '賞品を受け取る'}
            </Button>
          )}


          {/* 受取完了ボタン */}
          {isReceived && (
            <Button
              variant="contained"
              disabled
              sx={{
                background: 'linear-gradient(45deg, #4CAF50 0%, #66BB6A 50%, #4CAF50 100%)',
                color: 'white',
                width: isMobile ? '280px' : '320px',
                height: isMobile ? 60 : 72,
                borderRadius: isMobile ? '30px' : '36px',
                fontSize: isMobile ? '1.1rem' : '1.3rem',
                fontWeight: 800,
                textTransform: 'none',
                boxShadow: '0 8px 32px rgba(76, 175, 80, 0.4), 0 0 0 3px rgba(255, 255, 255, 0.3)',
                border: '2px solid rgba(255, 255, 255, 0.4)',
                animation: 'fadeInUp 0.8s ease-out both',
                position: 'relative',
                overflow: 'hidden',
                '&:disabled': {
                  background: 'linear-gradient(45deg, #4CAF50 0%, #66BB6A 50%, #4CAF50 100%)',
                  color: 'white',
                  opacity: 1
                },
                '&::before': {
                  content: '"✓"',
                  fontSize: isMobile ? '1.5rem' : '1.8rem',
                  marginRight: '8px',
                  fontWeight: 'bold'
                }
              }}
            >
              受取が完了しています
            </Button>
          )}
        </Box>

        {/* Floating confetti */}
        {[...Array(12)].map((_, i) => (
          <Box
            key={i}
            sx={{
              position: 'absolute',
              top: `${Math.random() * 80 + 10}%`,
              left: `${Math.random() * 80 + 10}%`,
              width: Math.random() * 8 + 4,
              height: Math.random() * 8 + 4,
              backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#FF8E53', '#87CEEB', '#98FB98'][i % 6],
              borderRadius: i % 3 === 0 ? '50%' : '0',
              animation: `float ${3 + Math.random() * 2}s ease-in-out infinite ${Math.random() * 2}s`,
              opacity: 0.7,
              transform: `rotate(${Math.random() * 360}deg)`,
              zIndex: -1
            }}
          />
        ))}
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
            @keyframes bounceIn {
              0% {
                opacity: 0;
                transform: scale(0.3) translateY(-50px);
              }
              50% {
                opacity: 1;
                transform: scale(1.05) translateY(-10px);
              }
              70% {
                transform: scale(0.9) translateY(0);
              }
              100% {
                opacity: 1;
                transform: scale(1) translateY(0);
              }
            }
            @keyframes pulse {
              0%, 100% {
                box-shadow: 0 8px 32px rgba(255, 215, 0, 0.5), 0 0 0 3px rgba(255, 255, 255, 0.3);
              }
              50% {
                box-shadow: 0 8px 32px rgba(255, 215, 0, 0.7), 0 0 0 5px rgba(255, 255, 255, 0.5);
              }
            }
            @keyframes float {
              0%, 100% {
                transform: translateY(0px) translateX(0px) rotate(0deg);
              }
              25% {
                transform: translateY(-20px) translateX(10px) rotate(90deg);
              }
              50% {
                transform: translateY(-10px) translateX(-10px) rotate(180deg);
              }
              75% {
                transform: translateY(-15px) translateX(5px) rotate(270deg);
              }
            }
          `
        }}
      />

      {/* 当選アラート */}
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
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(8px)'
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
          {/* 当選画像 */}
          <Box
            sx={{
              mb: 3,
              display: 'flex',
              justifyContent: 'center'
            }}
          >
            <img
              src="https://otfreskkeaenahqziriz.supabase.co/storage/v1/object/public/answer-app/atari_image.png"
              alt="当選"
              style={{
                width: isMobile ? '150px' : '180px',
                height: 'auto',
                display: 'block'
              }}
            />
          </Box>

          {/* 当選テキスト */}
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              color: '#FF6B35',
              fontSize: isMobile ? '1.3rem' : '1.5rem',
              letterSpacing: '-0.02em',
              textShadow: '0 2px 4px rgba(255, 107, 53, 0.3)'
            }}
          >
            おめでとうございます！
          </Typography>
        </DialogContent>
      </Dialog>

      {/* 受取確認ダイアログ */}
      <Dialog
        open={showConfirmDialog}
        onClose={() => !isReceiving && setShowConfirmDialog(false)}
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
            maxWidth: isMobile ? '90vw' : '450px'
          }
        }}
        BackdropProps={{
          sx: {
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(8px)'
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
          {/* 警告アイコン */}
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              backgroundColor: '#FFD700',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 3,
              boxShadow: '0 4px 16px rgba(255, 215, 0, 0.3)',
              '&::before': {
                content: '"!"',
                fontSize: '2rem',
                fontWeight: 'bold',
                color: '#333'
              }
            }}
          />

          {/* タイトル */}
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              color: '#333',
              fontSize: isMobile ? '1.2rem' : '1.4rem',
              letterSpacing: '-0.02em',
              mb: 2
            }}
          >
            賞品受取の確認
          </Typography>

          {/* メッセージ */}
          <Typography
            sx={{
              color: '#666',
              fontSize: isMobile ? '0.9rem' : '1rem',
              lineHeight: 1.6,
              mb: 4
            }}
          >
            スタッフの方の前で操作してください。<br />
            この操作は取り消せません。
          </Typography>

          {/* ボタン */}
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              flexDirection: isMobile ? 'column' : 'row',
              justifyContent: 'center'
            }}
          >
            <Button
              onClick={() => setShowConfirmDialog(false)}
              disabled={isReceiving}
              sx={{
                minWidth: isMobile ? '100%' : 120,
                height: 48,
                borderRadius: '12px',
                color: '#666',
                backgroundColor: 'rgba(107, 114, 128, 0.08)',
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '0.95rem',
                border: '1px solid rgba(107, 114, 128, 0.15)',
                '&:hover': {
                  backgroundColor: 'rgba(107, 114, 128, 0.12)',
                  borderColor: 'rgba(107, 114, 128, 0.25)'
                }
              }}
            >
              キャンセル
            </Button>
            <Button
              onClick={handleConfirmReceive}
              disabled={isReceiving}
              variant="contained"
              sx={{
                minWidth: isMobile ? '100%' : 120,
                height: 48,
                borderRadius: '12px',
                backgroundColor: '#FF6B35',
                color: 'white',
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '0.95rem',
                boxShadow: '0 4px 20px rgba(255, 107, 53, 0.4)',
                '&:hover': {
                  backgroundColor: '#FF6B35',
                  boxShadow: '0 6px 25px rgba(255, 107, 53, 0.5)',
                  transform: 'translateY(-1px)'
                },
                '&:disabled': {
                  backgroundColor: 'rgba(255, 107, 53, 0.3)',
                  color: 'rgba(255, 255, 255, 0.6)',
                  boxShadow: 'none'
                }
              }}
            >
              {isReceiving ? '処理中...' : '受取を確定する'}
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
    </>
  );
};

export default WinnerPage;