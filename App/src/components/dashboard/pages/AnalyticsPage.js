import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, Chip, Switch, Typography, IconButton } from '@mui/material';
import { Science, Dashboard } from '@mui/icons-material';
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
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut', delay: 0.3 }}
        style={{
          position: 'fixed',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
        }}
      >
        <motion.div
          whileHover={{ 
            scale: 1.05,
            y: -2,
          }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          <Box sx={{ 
            display: 'flex',
            alignItems: 'center',
            gap: 0,
            background: isTestMode 
              ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)',
            backdropFilter: 'blur(20px)',
            borderRadius: 20,
            padding: { xs: '6px 10px', sm: '8px 12px' },
            boxShadow: isTestMode 
              ? '0 20px 40px rgba(102, 126, 234, 0.4), 0 8px 16px rgba(118, 75, 162, 0.3)'
              : '0 20px 40px rgba(0, 0, 0, 0.1), 0 8px 16px rgba(0, 0, 0, 0.06)',
            border: isTestMode 
              ? '1px solid rgba(255, 255, 255, 0.3)'
              : '1px solid rgba(255, 255, 255, 0.4)',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            overflow: 'hidden',
            position: 'relative',
            maxWidth: { xs: '90vw', sm: 'none' },
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '1px',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)',
              opacity: isTestMode ? 1 : 0.3,
              transition: 'opacity 0.3s ease'
            }
          }}>
            {/* アイコンとテキスト */}
            <motion.div
              animate={{ 
                x: isTestMode ? -8 : 0,
              }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <motion.div
                animate={{ 
                  rotate: isTestMode ? 360 : 0,
                  scale: isTestMode ? 1.1 : 1,
                }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              >
                {isTestMode ? (
                  <Science sx={{ 
                    fontSize: { xs: 16, sm: 18 }, 
                    color: '#fff',
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
                  }} />
                ) : (
                  <Dashboard sx={{ 
                    fontSize: { xs: 16, sm: 18 }, 
                    color: '#64748b',
                    transition: 'color 0.3s ease'
                  }} />
                )}
              </motion.div>
              
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: 700,
                  color: isTestMode ? '#fff' : '#475569',
                  fontSize: { xs: '0.8rem', sm: '0.875rem' },
                  transition: 'color 0.3s ease',
                  textShadow: isTestMode ? '0 1px 2px rgba(0,0,0,0.2)' : 'none',
                  letterSpacing: '0.025em',
                  display: { xs: 'none', sm: 'block' }
                }}
              >
                {isTestMode ? 'テスト実行中' : 'テストモード'}
              </Typography>
            </motion.div>

            {/* カスタムトグルスイッチ */}
            <motion.div
              animate={{ 
                x: isTestMode ? 8 : 0,
              }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              style={{ marginLeft: 8 }}
            >
              <Box
                onClick={handleTestModeToggle}
                sx={{
                  width: { xs: 40, sm: 44 },
                  height: { xs: 22, sm: 24 },
                  borderRadius: 12,
                  background: isTestMode 
                    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                    : 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: isTestMode 
                    ? 'inset 0 2px 4px rgba(0,0,0,0.1), 0 4px 8px rgba(16, 185, 129, 0.3)'
                    : 'inset 0 2px 4px rgba(0,0,0,0.1)',
                  '&:hover': {
                    transform: 'scale(1.05)',
                    boxShadow: isTestMode 
                      ? 'inset 0 2px 4px rgba(0,0,0,0.1), 0 6px 12px rgba(16, 185, 129, 0.4)'
                      : 'inset 0 2px 4px rgba(0,0,0,0.1), 0 4px 8px rgba(0,0,0,0.1)',
                  }
                }}
              >
                <motion.div
                  animate={{
                    x: isTestMode ? 18 : 2,
                    scale: isTestMode ? 1.1 : 1,
                  }}
                  transition={{ 
                    duration: 0.3, 
                    ease: 'easeOut',
                    type: 'spring',
                    stiffness: 300,
                    damping: 25
                  }}
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 9,
                    background: '#ffffff',
                    position: 'absolute',
                    top: 2,
                    boxShadow: '0 4px 8px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {isTestMode && (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                    >
                      <Science sx={{ 
                        fontSize: 10, 
                        color: '#10b981'
                      }} />
                    </motion.div>
                  )}
                </motion.div>
              </Box>
            </motion.div>

            {/* ステータスインジケーター */}
            <AnimatePresence>
              {isTestMode && (
                <motion.div
                  initial={{ scale: 0, opacity: 0, x: -10 }}
                  animate={{ scale: 1, opacity: 1, x: 0 }}
                  exit={{ scale: 0, opacity: 0, x: -10 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  style={{ marginLeft: 8 }}
                >
                  <Box sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: '#10b981',
                    boxShadow: '0 0 12px rgba(16, 185, 129, 0.8)',
                    animation: 'pulse 2s infinite',
                    '@keyframes pulse': {
                      '0%, 100%': {
                        opacity: 1,
                        transform: 'scale(1)',
                      },
                      '50%': {
                        opacity: 0.7,
                        transform: 'scale(1.2)',
                      },
                    },
                  }} />
                </motion.div>
              )}
            </AnimatePresence>
          </Box>
        </motion.div>
      </motion.div>

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