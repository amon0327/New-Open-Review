import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  PhoneAndroid,
  Computer,
  ZoomIn,
  ZoomOut,
  FitScreen
} from '@mui/icons-material';
import { colors, glassPaperStyles, iconButtonStyles } from '../constants/theme';

const PreviewControlPanel = ({ 
  previewMode, 
  setPreviewMode, 
  zoom, 
  handleZoomIn, 
  handleZoomOut, 
  handleFitScreen,
  formId
}) => {
  return (
    <Box
      sx={{
        position: 'absolute',
        top: 8,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 20,
        pointerEvents: 'auto'
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Paper
          elevation={8}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            px: 1,
            py: 0.5,
            borderRadius: 2,
            ...glassPaperStyles
          }}
        >
          {/* デバイス切り替え */}
          <Tooltip title="モバイル表示">
            <IconButton
              onClick={() => setPreviewMode('mobile')}
              sx={previewMode === 'mobile' ? iconButtonStyles.primary : iconButtonStyles.secondary}
            >
              <PhoneAndroid />
            </IconButton>
          </Tooltip>

          <Tooltip title="PC表示">
            <IconButton
              onClick={() => setPreviewMode('desktop')}
              sx={previewMode === 'desktop' ? iconButtonStyles.primary : iconButtonStyles.secondary}
            >
              <Computer />
            </IconButton>
          </Tooltip>

          {/* ズーム制御 */}
          <Tooltip title="縮小">
            <IconButton
              onClick={handleZoomOut}
              disabled={zoom <= 0.3}
              sx={iconButtonStyles.secondary}
            >
              <ZoomOut />
            </IconButton>
          </Tooltip>

          <Typography variant="caption" sx={{ minWidth: 40, textAlign: 'center', color: colors.textSecondary, fontSize: '0.7rem' }}>
            {Math.round(zoom * 100)}%
          </Typography>

          <Tooltip title="拡大">
            <IconButton
              onClick={handleZoomIn}
              disabled={zoom >= 1.5}
              sx={iconButtonStyles.secondary}
            >
              <ZoomIn />
            </IconButton>
          </Tooltip>

          <Tooltip title="フィット">
            <IconButton
              onClick={handleFitScreen}
              sx={iconButtonStyles.secondary}
            >
              <FitScreen />
            </IconButton>
          </Tooltip>
        </Paper>
      </motion.div>
    </Box>
  );
};

export default PreviewControlPanel;