import React from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Paper,
  Typography
} from '@mui/material';
import { colors, gradients, shadows } from '../constants/theme';
import PreviewLogin from './preview/PreviewLogin';
import PreviewQuestions from './preview/PreviewQuestions';
import PreviewCompletion from './preview/PreviewCompletion';

const PreviewArea = ({ previewMode, zoom, selectedPage }) => {
  const renderPreviewContent = () => {
    if (!selectedPage) {
      return (
        <Box
          sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            p: previewMode === 'mobile' ? 2 : 4,
            background: gradients.background
          }}
        >
          <Typography variant="h6" sx={{ color: colors.textSecondary, mb: 2 }}>
            プレビュー
          </Typography>
          <Typography variant="body2" sx={{ color: colors.textMuted }}>
            左側のページ管理からページを選択してください
          </Typography>
        </Box>
      );
    }

    switch (selectedPage.id) {
      case 'login':
        return <PreviewLogin previewMode={previewMode} />;
      case 'completion':
        return <PreviewCompletion previewMode={previewMode} />;
      default:
        // 質問ページ
        return <PreviewQuestions previewMode={previewMode} />;
    }
  };

  return (
    <Box
      sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -45%)',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        pointerEvents: 'auto'
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: zoom }}
        transition={{ duration: 0.3 }}
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: 'center'
        }}
      >
        <Paper
          elevation={12}
          sx={{
            width: previewMode === 'mobile' ? 390 : 1440,
            height: previewMode === 'mobile' ? 820 : 900,
            borderRadius: previewMode === 'mobile' ? 6 : 0,
            background: colors.white,
            border: previewMode === 'mobile' ? '8px solid #1a1a1a' : '2px solid #e2e8f0',
            boxShadow: previewMode === 'mobile' 
              ? shadows.mobile
              : shadows.card,
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* モバイルの場合のノッチ */}
          {previewMode === 'mobile' && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 150,
                height: 30,
                background: '#1a1a1a',
                borderBottomLeftRadius: 15,
                borderBottomRightRadius: 15,
                zIndex: 10
              }}
            />
          )}

          {/* プレビューコンテンツ */}
          {renderPreviewContent()}
        </Paper>
      </motion.div>
    </Box>
  );
};

export default PreviewArea;