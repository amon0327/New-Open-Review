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
          gap: 2,
          width: '100%',
          alignItems: 'center'
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
                width: 56,
                height: 56,
                // ロゴの後に大きなマージンを追加
                marginBottom: item.isLogo ? 3 : 0,
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
                  component="img"
                  src="https://otfreskkeaenahqziriz.supabase.co/storage/v1/object/public/app-assets/logo/OpenReviewLogo.png"
                  alt="OpenReview Logo"
                  sx={{
                    width: 44,
                    height: 44,
                    objectFit: 'contain'
                  }}
                  onError={(e) => {
                    // 画像読み込みエラー時のフォールバック
                    e.target.style.display = 'none';
                    e.target.parentNode.innerHTML = `
                      <div style="
                        width: 44px; 
                        height: 44px; 
                        border-radius: 4px; 
                        background: rgba(255, 255, 255, 0.2); 
                        display: flex; 
                        align-items: center; 
                        justify-content: center;
                        backdrop-filter: blur(10px);
                        color: white;
                        font-weight: bold;
                        font-size: 0.8rem;
                      ">OR</div>
                    `;
                  }}
                />
              ) : (
                React.cloneElement(item.icon, { sx: { fontSize: '2rem' } })
              )}
            </IconButton>
          </Tooltip>
        ))}
      </Box>
    </Paper>
  );
};

export default LeftNavigationBar;