import React from 'react';
import {
  Box,
  Paper,
  IconButton,
  Tooltip,
  Typography
} from '@mui/material';
import { gradients } from '../constants/theme';

const LeftNavigationBar = ({ 
  leftNavigationItems,
  selectedTool,
  showPageManager,
  showSettings,
  onBackClick,
  setShowPageManager,
  setShowSettings,
  setSelectedTool
}) => {
  const handleItemClick = (item) => {
    if (item.isLogo) {
      onBackClick();
    } else if (item.label === 'フォルダー') {
      setShowPageManager(true);
      setShowSettings(false);
    } else if (item.label === '編集') {
      setShowPageManager(false);
      setShowSettings(false);
      setSelectedTool(item);
    } else if (item.label === '設定') {
      setShowSettings(true);
      setShowPageManager(false);
      setSelectedTool(item);
    } else {
      setSelectedTool(item);
    }
  };

  const isItemActive = (item) => {
    return (
      (selectedTool?.label === item.label && !showPageManager && !showSettings) || 
      (item.label === 'フォルダー' && showPageManager) || 
      (item.label === '設定' && showSettings)
    );
  };

  return (
    <Paper
      elevation={4}
      sx={{
        width: 80,
        height: '100vh',
        background: gradients.secondary,
        borderRadius: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        py: 2,
        boxShadow: '4px 0 20px rgba(0, 0, 0, 0.1)'
      }}
    >
      {/* ナビゲーションアイテム */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          width: '100%',
          px: 1
        }}
      >
        {leftNavigationItems.map((item, index) => (
          <Tooltip key={index} title={item.label} placement="right">
            <IconButton
              onClick={() => handleItemClick(item)}
              sx={{
                color: isItemActive(item) ? 'white' : 'rgba(255, 255, 255, 0.7)',
                backgroundColor: isItemActive(item) ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                borderRadius: 2,
                width: 48,
                height: 48,
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: 'white'
                },
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {item.isLogo ? (
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: 1,
                    background: 'rgba(255, 255, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backdropFilter: 'blur(10px)',
                    // 画像を追加する場合のスタイル
                    backgroundImage: 'none', // ここに 'url("/path/to/logo.png")' を指定
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                >
                  {/* 画像がない場合のフォールバック */}
                  <Typography
                    variant="caption"
                    sx={{ 
                      color: 'white', 
                      fontWeight: 'bold',
                      fontSize: '0.7rem'
                    }}
                  >
                    OR
                  </Typography>
                </Box>
              ) : (
                item.icon
              )}
            </IconButton>
          </Tooltip>
        ))}
      </Box>
    </Paper>
  );
};

export default LeftNavigationBar;