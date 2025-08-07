import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Box, Chip, Switch, Typography } from '@mui/material';
import QuestionSidebar from '../../analytics/QuestionSidebar';
import ChartArea from '../../analytics/ChartArea';

export default function AnalyticsPage({ onNavCollapse }) {
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const [isTestMode, setIsTestMode] = useState(false);

  // テストモード切り替えハンドラー
  const handleTestModeToggle = () => {
    setIsTestMode(!isTestMode);
    // テストモードに入る際は選択された質問をクリア
    if (!isTestMode) {
      setSelectedQuestions([]);
    }
  };

  // Analyticsページが開かれた際にナビゲーションを縮小
  React.useEffect(() => {
    if (onNavCollapse) {
      onNavCollapse(true);
    }
    
    // クリーンアップ: ページを離れる際にナビゲーションを元に戻す
    return () => {
      if (onNavCollapse) {
        onNavCollapse(false);
      }
    };
  }, [onNavCollapse]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {/* テストモード切り替えスイッチ - 最上位レイヤー */}
      <Box sx={{ 
        position: 'fixed',
        top: 20,
        right: 20,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(15px)',
        borderRadius: 4,
        padding: '8px 16px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        transition: 'all 0.3s ease'
      }}>
        <Typography 
          variant="body2" 
          sx={{ 
            fontWeight: 600,
            color: isTestMode ? '#ed6c02' : '#64748b',
            fontSize: '0.875rem',
            transition: 'color 0.3s ease'
          }}
        >
          テストモード
        </Typography>
        <Switch
          checked={isTestMode}
          onChange={handleTestModeToggle}
          sx={{
            '& .MuiSwitch-switchBase': {
              '&.Mui-checked': {
                color: '#fff',
                '& + .MuiSwitch-track': {
                  backgroundColor: '#ff9800',
                  opacity: 1,
                },
              },
            },
            '& .MuiSwitch-track': {
              backgroundColor: '#e2e8f0',
              opacity: 1,
            },
          }}
        />
        {isTestMode && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <Chip 
              label="ON" 
              size="small"
              sx={{ 
                backgroundColor: '#ff9800',
                color: 'white',
                fontWeight: 700,
                fontSize: '0.7rem',
                height: 20,
                '& .MuiChip-label': {
                  px: 1
                }
              }}
            />
          </motion.div>
        )}
      </Box>

      <Box sx={{ 
        height: 'calc(100vh - 64px)', 
        display: 'flex', 
        flexDirection: 'column', 
        p: 1,
        overflow: 'hidden'
      }}>
        {/* メインコンテンツ */}
        <Box sx={{ flexGrow: 1, display: 'flex', gap: 1.5, minHeight: 0 }}>
          {/* 質問選択サイドバー */}
          <QuestionSidebar
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedQuestions={selectedQuestions}
            setSelectedQuestions={setSelectedQuestions}
            isTestMode={isTestMode}
          />

          {/* チャート表示エリア */}
          <ChartArea
            selectedQuestions={selectedQuestions}
            activeFilters={activeFilters}
            setActiveFilters={setActiveFilters}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            isTestMode={isTestMode}
          />
        </Box>

      </Box>
    </motion.div>
  );
}