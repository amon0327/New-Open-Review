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
  
  // ========= テストモード関連state（削除予定） =========
  const [isTestMode, setIsTestMode] = useState(false);

  // テストモード切り替えハンドラー（削除予定）
  const handleTestModeToggle = () => {
    setIsTestMode(!isTestMode);
    // テストモード切り替え時は全ての状態をクリア
    setSelectedQuestions([]);
    setSearchTerm('');
    setActiveFilters({});
    setShowFilters(false);
  };
  // =================================================

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
      {/* ========= テストモード切り替えUI（削除予定） ========= */}
      <Box sx={{ 
        position: 'fixed',
        bottom: 30,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
      }}>
        <Box 
          onClick={handleTestModeToggle}
          sx={{ 
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            backgroundColor: isTestMode ? '#5e17eb' : '#ffffff',
            color: isTestMode ? '#ffffff' : '#374151',
            borderRadius: 16,
            padding: '12px 20px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            border: '1px solid rgba(0, 0, 0, 0.08)',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            userSelect: 'none',
            '&:hover': {
              transform: 'translateY(-1px)',
              boxShadow: '0 6px 25px rgba(0, 0, 0, 0.2)',
            },
            '&:active': {
              transform: 'translateY(0px)',
            }
          }}
        >
          <Typography 
            variant="body2" 
            sx={{ 
              fontWeight: 600,
              fontSize: '0.875rem',
            }}
          >
            {isTestMode ? 'テストモード ON' : 'テストモード'}
          </Typography>
          
          {/* カスタムトグルスイッチ */}
          <Box sx={{
            width: 44,
            height: 24,
            backgroundColor: isTestMode ? 'rgba(255, 255, 255, 0.2)' : '#e5e7eb',
            borderRadius: 12,
            position: 'relative',
            transition: 'all 0.3s ease'
          }}>
            <Box sx={{
              position: 'absolute',
              top: 2,
              left: isTestMode ? 22 : 2,
              width: 20,
              height: 20,
              backgroundColor: '#ffffff',
              borderRadius: '50%',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
              transition: 'all 0.3s ease',
            }} />
          </Box>
          
        </Box>
      </Box>
      {/* ================================================== */}

      <Box sx={{ 
        height: 'calc(100vh - 64px)', 
        display: 'flex', 
        flexDirection: 'column', 
        p: 1,
        overflow: 'hidden'
      }}>
        {/* テストモードインジケーター */}
        {isTestMode && (
          <Box sx={{
            bgcolor: '#5e17eb',
            color: 'white',
            py: 0.5,
            px: 2,
            borderRadius: 1,
            mb: 1,
            textAlign: 'center',
            fontSize: '0.85rem',
            fontWeight: 600
          }}>
            テストモードで動作中 - 回答されたデータではありません
          </Box>
        )}
        {/* メインコンテンツ */}
        <Box sx={{ 
          flexGrow: 1, 
          display: 'flex', 
          gap: 1.5, 
          minHeight: 0,
          width: '100%',
          overflow: 'hidden'
        }}>
          {/* 質問選択サイドバー */}
          <QuestionSidebar
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedQuestions={selectedQuestions}
            setSelectedQuestions={setSelectedQuestions}
            isTestMode={isTestMode} // テストモードprops（削除予定）
          />

          {/* チャート表示エリア */}
          <ChartArea
            selectedQuestions={selectedQuestions}
            activeFilters={activeFilters}
            setActiveFilters={setActiveFilters}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            isTestMode={isTestMode} // テストモードprops（削除予定）
          />
        </Box>


      </Box>
    </motion.div>
  );
}