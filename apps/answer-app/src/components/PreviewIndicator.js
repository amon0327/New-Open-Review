import React from 'react';
import { Box, Typography } from '@mui/material';

const PreviewIndicator = ({ isPreviewMode, themeColor = '#8C52FF' }) => {
  if (!isPreviewMode) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 16,
        right: 16,
        zIndex: 9999,
        backgroundColor: `${themeColor}E6`, // Add transparency (90% opacity)
        color: 'white',
        px: 2,
        py: 0.5,
        borderRadius: 1,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}
    >
      <Typography
        variant="caption"
        sx={{
          fontSize: '0.75rem',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}
      >
        プレビュー
      </Typography>
    </Box>
  );
};

export default PreviewIndicator;