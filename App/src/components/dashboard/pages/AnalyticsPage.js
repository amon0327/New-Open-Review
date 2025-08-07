import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Box, Button, Chip } from '@mui/material';
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
      {/* テストモード状態表示 - 最上位レイヤー */}
      {isTestMode && (
        <Box sx={{ 
          position: 'fixed',
          top: 80,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          display: 'flex', 
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <Chip 
            label="テストモード中" 
            color="warning"
            size="small"
            sx={{ 
              fontWeight: 600,
              backgroundColor: 'rgba(255, 152, 0, 0.95)',
              color: 'white',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 4px 20px rgba(255, 152, 0, 0.3)',
              border: '1px solid rgba(255, 152, 0, 0.3)'
            }}
          />
        </Box>
      )}

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

        {/* テストモードボタン - 下部中央 */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          pt: 2, 
          pb: 1 
        }}>
          <Button
            variant={isTestMode ? "contained" : "outlined"}
            color={isTestMode ? "warning" : "primary"}
            onClick={handleTestModeToggle}
            sx={{
              minWidth: 200,
              borderRadius: 3,
              fontWeight: 600,
              textTransform: 'none',
              '&:hover': {
                transform: 'translateY(-1px)',
                boxShadow: isTestMode 
                  ? '0 6px 20px rgba(255, 152, 0, 0.3)'
                  : '0 6px 20px rgba(94, 23, 235, 0.3)'
              },
              transition: 'all 0.2s ease'
            }}
          >
            {isTestMode ? 'テストモードを終了' : 'テストモードを開始'}
          </Button>
        </Box>
      </Box>
    </motion.div>
  );
}