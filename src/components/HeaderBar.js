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
  MoreVert
} from '@mui/icons-material';
import { colors, glassPaperStyles, iconButtonStyles } from '../constants/theme';

const HeaderBar = ({
  isEditingTitle,
  projectTitle,
  setProjectTitle,
  setIsEditingTitle
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
        justifyContent: 'space-between'
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