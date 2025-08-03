import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button
} from '@mui/material';
import FormDataService from '../../services/FormDataService';

const PreviewCompletion = ({ 
  previewMode,
  // 基本設定関連
  onElementSelect,
  selectedElement,
  // フォームID
  formId,
  // フォーム設定
  formSettings = {},
  // 完了画面設定
  completionScreenSettings = {},
  // 設定データ（後方互換性）
  completionBackgroundImage,
  completionLogoImage,
  completionTitleText,
  completionDetailText,
  themeColor: propThemeColor,
  buttonText,
  buttonUrl,
  // ロゴ画像
  logoImage
}) => {
  const [completionData, setCompletionData] = useState(null);
  const [loading, setLoading] = useState(true);

  const isMobile = previewMode === 'mobile';

  // Supabaseから完了画面データを取得（必要に応じて）
  useEffect(() => {
    const fetchCompletionData = async () => {
      if (!formId) {
        setLoading(false);
        return;
      }

      try {
        const result = await FormDataService.getReviewFormWithDetails(formId);
        if (result.success) {
          const data = {
            completionSettings: result.data.completion_screen_settings?.[0] || null,
            formSettings: result.data.review_form_settings?.[0] || null
          };
          setCompletionData(data);
        }
      } catch (error) {
        console.error('Error fetching completion data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCompletionData();
  }, [formId]);

  // デフォルト値とSupabaseデータ、propsから受け取ったデータの統合
  const themeColor = formSettings.theme_color || propThemeColor || (completionData?.formSettings?.theme_color) || '#5e17eb';
  const backgroundImage = completionScreenSettings.background_image_url || completionBackgroundImage || (completionData?.completionSettings?.background_image_url) || 'https://misezukuri.com/wp-content/uploads/2023/10/b86e65d61ae3fbd3b3f1ec5c67484853.jpg';
  const logoUrl = logoImage || completionLogoImage || formSettings.logo_image_url || (completionData?.formSettings?.logo_image_url) || 'https://otfreskkeaenahqziriz.supabase.co/storage/v1/object/public/app-assets/logo/OpenReviewWhiteThemeLoog.png';
  const titleText = (completionScreenSettings.title_text !== undefined && completionScreenSettings.title_text !== '') 
    ? completionScreenSettings.title_text 
    : (completionTitleText || (completionData?.completionSettings?.title_text) || 'テキストを入力...');
  const detailText = (completionScreenSettings.detail_text !== undefined && completionScreenSettings.detail_text !== '') 
    ? completionScreenSettings.detail_text 
    : (completionDetailText || (completionData?.completionSettings?.detail_text) || 'テキストを入力...');

  // ヒントテキストかどうかを判定
  const isTitleHint = titleText === 'テキストを入力...';
  const isDetailHint = detailText === 'テキストを入力...';
  const isButtonHint = displayButtonText === 'テキストを入力...';

  // ボタン設定（1つのボタンのみ使用）
  const buttonEnabled = completionScreenSettings.is_button_1_enabled !== undefined 
    ? completionScreenSettings.is_button_1_enabled 
    : (completionData?.completionSettings?.is_button_1_enabled ?? true);
  const displayButtonText = completionScreenSettings.button_text_1 || buttonText || (completionData?.completionSettings?.button_text_1) || 'テキストを入力...';
  const displayButtonUrl = completionScreenSettings.button_url_1 || buttonUrl || (completionData?.completionSettings?.button_url_1) || '#';

  const handleButtonClick = () => {
    // プレビュー用なので何もしない
  };

  return (
    <>
      <Box
        onClick={() => {
          // 背景クリック時に基本設定トグルを開く処理を追加
          const settingsButton = document.querySelector('[data-testid="settings-button"]');
          if (settingsButton) {
            settingsButton.click();
          }
          onElementSelect && onElementSelect('completion-background');
        }}
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
          '&::after': selectedElement === 'completion-background' ? {
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
              // ロゴクリック時に基本設定トグルを開く処理を追加
              const settingsButton = document.querySelector('[data-testid="settings-button"]');
              if (settingsButton) {
                settingsButton.click();
              }
              onElementSelect && onElementSelect('completion-logo');
            }}
            sx={{ 
              mb: isMobile ? 4 : 5,
              filter: 'drop-shadow(0 8px 20px rgba(0, 0, 0, 0.3))',
              animation: 'fadeInUp 0.8s ease-out 0.2s both',
              cursor: 'pointer',
              position: 'relative',
              zIndex: 2,
              display: 'inline-block',
              '&::after': selectedElement === 'completion-logo' ? {
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
              onElementSelect && onElementSelect('completion-title');
            }}
            sx={{
              color: isTitleHint ? 'rgba(255, 255, 255, 0.5)' : 'white',
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
              fontStyle: isTitleHint ? 'italic' : 'normal',
              '&::after': selectedElement === 'completion-title' ? {
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
              onElementSelect && onElementSelect('completion-detail');
            }}
            sx={{
              color: isDetailHint ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.85)',
              mb: isMobile ? 4 : 5,
              lineHeight: 1.7,
              fontSize: isMobile ? '0.95rem' : '1.1rem',
              textShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
              maxWidth: isMobile ? '90vw' : '600px',
              mx: 'auto',
              animation: 'fadeInUp 0.8s ease-out 0.6s both',
              fontWeight: 400,
              whiteSpace: 'pre-wrap',
              cursor: 'pointer',
              position: 'relative',
              zIndex: 2,
              transition: 'all 0.3s ease',
              fontStyle: isDetailHint ? 'italic' : 'normal',
              '&::after': selectedElement === 'completion-detail' ? {
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

        {/* Bottom button area - ボタンが有効な場合のみ表示 */}
        {buttonEnabled && (
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
                onElementSelect && onElementSelect('completion-button');
              }}
              sx={{
                backgroundColor: themeColor,
                color: isButtonHint ? 'rgba(255, 255, 255, 0.6)' : 'white',
                width: '280px',
                height: isMobile ? 56 : 64,
                borderRadius: isMobile ? '28px' : '32px',
                fontSize: isMobile ? '1rem' : '1.1rem',
                fontWeight: 700,
                textTransform: 'none',
                boxShadow: '0 12px 40px rgba(0, 0, 0, 0.25)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                cursor: 'pointer',
                position: 'relative',
                zIndex: 2,
                transition: 'all 0.3s ease',
                fontStyle: isButtonHint ? 'italic' : 'normal',
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
                '&::after': selectedElement === 'completion-button' ? {
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

    </>
  );
};

export default PreviewCompletion;