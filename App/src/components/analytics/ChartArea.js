import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Typography,
  Button,
  Chip
} from '@mui/material';
import {
  AutoGraph,
  Compare,
  Tune,
  Close,
  FilterList
} from '@mui/icons-material';
import FilterPanel from './FilterPanel';
import ChatPanel from './ChatPanel';
import { applyCombinedFilters, calculateFilterStats, generateFilterDescription } from '../../utils/dataFilterUtils';

// CSS アニメーション用のスタイル定義
const globalStyles = `
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;

// グローバルスタイルを適用
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.type = 'text/css';
  styleSheet.innerText = globalStyles;
  document.head.appendChild(styleSheet);
}

export default function ChartArea({
  selectedQuestions,
  activeFilters,
  setActiveFilters,
  showFilters,
  setShowFilters,
  // ========= テストモードparam（削除予定） =========
  isTestMode = false
  // ==============================================
}) {
  if (selectedQuestions.length === 0) {
    return (
      <Box sx={{ flexGrow: 1, display: 'flex', position: 'relative' }}>
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: '#ffffff',
            borderRadius: 2,
            border: '1px solid #e2e8f0',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <Box sx={{ textAlign: 'center', p: 4, position: 'relative', zIndex: 1 }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              style={{ display: 'inline-block', marginBottom: 16 }}
            >
              <AutoGraph sx={{ fontSize: 64, color: '#64748b' }} />
            </motion.div>
            <Typography 
              variant="h5" 
              sx={{ 
                fontWeight: 700, 
                mb: 1,
                color: '#1e293b',
                fontSize: '1.25rem'
              }}
            >
              データ分析を開始
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                mb: 3,
                color: '#64748b',
                fontSize: '0.95rem'
              }}
            >
              左側から質問を選択してください
            </Typography>
          </Box>
          
          {/* 装飾的な背景 */}
          <Box
            sx={{
              position: 'absolute',
              top: -50,
              right: -50,
              width: 200,
              height: 200,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%)',
              animation: 'pulse 4s ease-in-out infinite',
              '@keyframes pulse': {
                '0%, 100%': { transform: 'scale(1)', opacity: 0.3 },
                '50%': { transform: 'scale(1.1)', opacity: 0.5 }
              }
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              bottom: -30,
              left: -30,
              width: 150,
              height: 150,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%)',
              animation: 'pulse 6s ease-in-out infinite',
              animationDelay: '2s'
            }}
          />

        </Box>

        {/* Chat Panel */}
        <ChatPanel />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, display: 'flex', position: 'relative', minWidth: 0 }}>
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          bgcolor: '#ffffff',
          borderRadius: 2,
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          position: 'relative',
          minWidth: 0
        }}
      >
      {/* ヘッダーセクション */}
      <Box
        sx={{
          p: 2.5,
          borderBottom: '1px solid #f1f5f9',
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box
            sx={{
              bgcolor: selectedQuestions.length === 1 ? 'rgba(59, 130, 246, 0.1)' : 'rgba(99, 102, 241, 0.1)',
              color: selectedQuestions.length === 1 ? '#3b82f6' : '#6366f1',
              borderRadius: 1.5,
              p: 1,
              display: 'flex'
            }}
          >
            {selectedQuestions.length === 1 ? (
              <AutoGraph sx={{ fontSize: 28 }} />
            ) : (
              <Compare sx={{ fontSize: 28 }} />
            )}
          </Box>
          <Box sx={{ flexGrow: 1, ml: 2 }}>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 700,
                color: '#1e293b',
                fontSize: '1.1rem',
                mb: 0.25
              }}
            >
              {selectedQuestions.length === 1 ? '単体分析' : '比較・クロス分析'}
            </Typography>
            {selectedQuestions.length === 1 ? (
              <Typography 
                variant="body2" 
                sx={{
                  color: '#64748b',
                  fontSize: '0.875rem'
                }}
              >
                {selectedQuestions[0]?.title}
              </Typography>
            ) : selectedQuestions.length === 2 ? (
              <Box>
                <Typography 
                  variant="body2" 
                  sx={{
                    color: '#64748b',
                    fontSize: '0.875rem',
                    lineHeight: 1.2
                  }}
                >
                  {selectedQuestions[0]?.title}
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{
                    color: '#64748b',
                    fontSize: '0.875rem',
                    lineHeight: 1.2
                  }}
                >
                  {selectedQuestions[1]?.title}
                </Typography>
              </Box>
            ) : (
              <Typography 
                variant="body2" 
                sx={{
                  color: '#64748b',
                  fontSize: '0.875rem'
                }}
              >
                {`${selectedQuestions.length}つの質問を比較分析`}
              </Typography>
            )}
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              startIcon={<Tune />}
              onClick={() => setShowFilters(!showFilters)}
              variant={showFilters ? "contained" : "outlined"}
              size="small"
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontSize: '0.8rem',
                fontWeight: 600,
                px: 2,
                py: 0.75,
                bgcolor: showFilters ? '#6366f1' : 'transparent',
                color: showFilters ? 'white' : '#64748b',
                borderColor: showFilters ? '#6366f1' : '#e2e8f0',
                '&:hover': {
                  bgcolor: showFilters ? '#5046e5' : '#f1f5f9',
                  borderColor: showFilters ? '#5046e5' : '#cbd5e1'
                }
              }}
            >
              フィルター
            </Button>
          </Box>
        </Box>
      </Box>

      {/* フィルターパネル */}
      <FilterPanel
        selectedQuestions={selectedQuestions}
        activeFilters={activeFilters}
        setActiveFilters={setActiveFilters}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
      />

        {/* チャート表示エリア */}
        <Box sx={{ flexGrow: 1, p: 3, display: 'flex', flexDirection: 'column' }}>
          {/* フィルター状況の表示 */}
          {(() => {
            console.log('activeFilters:', activeFilters);
            console.log('activeFilters keys:', Object.keys(activeFilters));
            console.log('activeFilters values:', Object.values(activeFilters));
            
            const hasActiveFilters = Object.values(activeFilters).some(filter => {
              console.log('checking filter:', filter);
              if (!filter || !filter.value) {
                console.log('filter is null or has no value');
                return false;
              }
              
              if (Array.isArray(filter.value)) {
                console.log('filter.value is array:', filter.value, 'length:', filter.value.length);
                return filter.value.length > 0;
              }
              
              if (typeof filter.value === 'string') {
                console.log('filter.value is string:', filter.value, 'trimmed length:', filter.value.trim().length);
                return filter.value.trim() !== '';
              }
              
              console.log('filter.value is other type:', typeof filter.value, filter.value);
              return Boolean(filter.value);
            });
            
            console.log('hasActiveFilters result:', hasActiveFilters);
            return hasActiveFilters;
          })() && (
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <FilterList sx={{ fontSize: 18, color: '#6366f1' }} />
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#374151' }}>
                  フィルター適用中
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {selectedQuestions.map(question => {
                  const filter = activeFilters[question.id];
                  if (!filter || !filter.value) return null;
                  
                  return (
                    <Chip
                      key={question.id}
                      label={`${question.title}: ${generateFilterDescription({ [question.id]: filter }, [question])}`}
                      onDelete={() => {
                        const newFilters = { ...activeFilters };
                        delete newFilters[question.id];
                        setActiveFilters(newFilters);
                      }}
                      size="small"
                      variant="outlined"
                      sx={{
                        bgcolor: 'rgba(99, 102, 241, 0.1)',
                        borderColor: '#c7d2fe',
                        color: '#4338ca',
                        '& .MuiChip-deleteIcon': {
                          color: '#4338ca'
                        }
                      }}
                    />
                  );
                })}
              </Box>
            </Box>
          )}

          {/* チャート表示部分 */}
          <Box sx={{ 
            flexGrow: 1, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            bgcolor: Object.keys(activeFilters).length > 0 ? 'rgba(99, 102, 241, 0.05)' : 'transparent',
            borderRadius: 2,
            border: Object.keys(activeFilters).length > 0 ? '1px dashed #c7d2fe' : 'none',
            transition: 'all 0.3s ease'
          }}>
            <Box sx={{ textAlign: 'center', color: '#64748b' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                {Object.keys(activeFilters).length > 0 ? 'フィルター済みデータ' : 'チャートエリア'}
              </Typography>
              <Typography variant="body2">
                {Object.keys(activeFilters).length > 0 
                  ? 'フィルター条件に基づいたグラフが表示されます' 
                  : 'ここにグラフが表示されます'
                }
              </Typography>
              {Object.keys(activeFilters).length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" sx={{ 
                    bgcolor: 'rgba(99, 102, 241, 0.1)', 
                    px: 2, 
                    py: 0.5, 
                    borderRadius: 1,
                    color: '#4338ca',
                    fontWeight: 500
                  }}>
                    フィルター結果: {selectedQuestions.length} 質問中 {Object.keys(activeFilters).length} 質問にフィルター適用
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Box>

      </Box>

      {/* Chat Panel */}
      <ChatPanel />
    </Box>
  );
}