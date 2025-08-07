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
        bottom: 30,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRadius: 8,
        padding: '10px 16px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        transition: 'all 0.3s ease'
      }}>
        <Typography 
          variant="body2" 
          sx={{ 
            fontWeight: 600,
            color: '#1a202c',
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
              padding: '6px',
              '&.Mui-checked': {
                color: '#fff',
                transform: 'translateX(16px)',
                '& + .MuiSwitch-track': {
                  backgroundColor: '#5e17eb',
                  opacity: 1,
                  border: 0,
                },
                '& .MuiSwitch-thumb': {
                  backgroundColor: '#fff',
                  width: 18,
                  height: 18,
                }
              },
            },
            '& .MuiSwitch-thumb': {
              backgroundColor: '#fff',
              width: 18,
              height: 18,
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              transition: 'all 0.2s ease'
            },
            '& .MuiSwitch-track': {
              borderRadius: 12,
              border: '1px solid #e2e8f0',
              backgroundColor: '#f1f5f9',
              opacity: 1,
              transition: 'all 0.3s ease',
            },
          }}
        />
        {isTestMode && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <Chip 
              label="ON" 
              size="small"
              sx={{ 
                backgroundColor: '#5e17eb',
                color: 'white',
                fontWeight: 700,
                fontSize: '0.7rem',
                height: 22,
                '& .MuiChip-label': {
                  px: 1.5
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