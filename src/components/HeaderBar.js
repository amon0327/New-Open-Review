import React from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Tooltip,
  Input
} from '@mui/material';
import {
  Preview,
  Save,
  MoreVert,
  PhoneAndroid,
  Computer,
  ZoomIn,
  ZoomOut,
  FitScreen
} from '@mui/icons-material';
import { colors, glassPaperStyles, iconButtonStyles } from '../constants/theme';

const HeaderBar = ({
  isEditingTitle,
  projectTitle,
  setProjectTitle,
  setIsEditingTitle,
  previewMode, 
  setPreviewMode, 
  zoom, 
  handleZoomIn, 
  handleZoomOut, 
  handleFitScreen 
}) => {
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      setIsEditingTitle(false);
    } else if (e.key === 'Escape') {
      setProjectTitle('OpenReview フォーム');
      setIsEditingTitle(false);
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        height: 65,
        background: glassPaperStyles.background,
        backdropFilter: glassPaperStyles.backdropFilter,
        borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
        borderRadius: 0,
        display: 'flex',
        alignItems: 'center',
        px: 2,
        justifyContent: 'space-between',
        position: 'relative'
      }}
    >
      {/* ヘッダー左側 - プロジェクトタイトル */}
      {isEditingTitle ? (
        <Input
          value={projectTitle}
          onChange={(e) => setProjectTitle(e.target.value)}
          onBlur={() => setIsEditingTitle(false)}
          onKeyPress={handleKeyPress}
          autoFocus
          sx={{
            fontSize: '1.5rem',
            fontWeight: 700,
            color: colors.textPrimary,
            minWidth: 200,
            '&:before': {
              borderBottom: `2px solid ${colors.primary}`
            },
            '&:after': {
              borderBottom: `2px solid ${colors.primary}`
            }
          }}
        />
      ) : (
        <Typography
          variant="h5"
          onClick={() => setIsEditingTitle(true)}
          sx={{
            color: colors.textPrimary,
            fontWeight: 700,
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: 1,
            '&:hover': {
              backgroundColor: 'rgba(94, 23, 235, 0.05)',
              color: colors.primary
            },
            transition: 'all 0.2s ease'
          }}
        >
          {projectTitle}
        </Typography>
      )}

      {/* プレビューコントロール - 中央配置 */}
      <Box
        sx={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          px: 1,
          py: 0.5,
          borderRadius: 2,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
        }}
      >
        {/* デバイス切り替え */}
        <Tooltip title="モバイル表示">
          <IconButton
            onClick={() => setPreviewMode('mobile')}
            sx={previewMode === 'mobile' ? iconButtonStyles.primary : iconButtonStyles.secondary}
            size="small"
          >
            <PhoneAndroid fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="PC表示">
          <IconButton
            onClick={() => setPreviewMode('desktop')}
            sx={previewMode === 'desktop' ? iconButtonStyles.primary : iconButtonStyles.secondary}
            size="small"
          >
            <Computer fontSize="small" />
          </IconButton>
        </Tooltip>

        {/* ズーム制御 */}
        <Tooltip title="縮小">
          <IconButton
            onClick={handleZoomOut}
            disabled={zoom <= 0.3}
            sx={iconButtonStyles.secondary}
            size="small"
          >
            <ZoomOut fontSize="small" />
          </IconButton>
        </Tooltip>

        <Typography variant="caption" sx={{ minWidth: 35, textAlign: 'center', color: colors.textSecondary, fontSize: '0.65rem' }}>
          {Math.round(zoom * 100)}%
        </Typography>

        <Tooltip title="拡大">
          <IconButton
            onClick={handleZoomIn}
            disabled={zoom >= 1.5}
            sx={iconButtonStyles.secondary}
            size="small"
          >
            <ZoomIn fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="フィット">
          <IconButton
            onClick={handleFitScreen}
            sx={iconButtonStyles.secondary}
            size="small"
          >
            <FitScreen fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* ヘッダー右側のアクションボタン */}
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Tooltip title="プレビュー">
          <IconButton sx={iconButtonStyles.secondary}>
            <Preview />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="保存">
          <IconButton sx={iconButtonStyles.secondary}>
            <Save />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="その他">
          <IconButton sx={iconButtonStyles.secondary}>
            <MoreVert />
          </IconButton>
        </Tooltip>
      </Box>
    </Paper>
  );
};

export default HeaderBar;