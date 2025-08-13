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
import TextQuestionChart from './TextQuestionChart';
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
          minWidth: 0,
          height: '100%'
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
        <Box sx={{ 
          flexGrow: 1, 
          p: 3, 
          display: 'flex', 
          flexDirection: 'column',
          overflow: 'auto',
          minHeight: 0,
          height: '100%',
          '&::-webkit-scrollbar': {
            width: 8
          },
          '&::-webkit-scrollbar-track': {
            bgcolor: 'rgba(241, 245, 249, 0.5)',
            borderRadius: 4
          },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: 'rgba(203, 213, 225, 0.8)',
            borderRadius: 4,
            '&:hover': {
              bgcolor: 'rgba(148, 163, 184, 0.9)'
            }
          }
        }}>
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
          {(() => {
            // テキスト質問（1つ選択、タイプ1または2）の場合
            if (selectedQuestions.length === 1) {
              const question = selectedQuestions[0];
              const questionTypeId = question.typeId || question.question_types_id || question.type_id;
              
              if (questionTypeId === 1 || questionTypeId === 2) {
                return (
                  <Box sx={{ flexGrow: 1, minHeight: 0 }}>
                    <TextQuestionChart 
                      question={question}
                      activeFilters={activeFilters}
                      setActiveFilters={setActiveFilters}
                      isTestMode={isTestMode}
                    />
                  </Box>
                );
              }
            }
            
            // 2つ選択されていて、1つ目がテキスト質問（タイプ1または2）、2つ目が質問タイプ3,4,5,6,7,8の場合
            if (selectedQuestions.length === 2) {
              const firstQuestion = selectedQuestions[0];
              const secondQuestion = selectedQuestions[1];
              const firstTypeId = firstQuestion.typeId || firstQuestion.question_types_id || firstQuestion.type_id;
              const secondTypeId = secondQuestion.typeId || secondQuestion.question_types_id || secondQuestion.type_id;
              
              if ((firstTypeId === 1 || firstTypeId === 2) && [3, 4, 5, 6, 7, 8].includes(secondTypeId)) {
                return (
                  <Box sx={{ flexGrow: 1, minHeight: 0 }}>
                    <TextQuestionChart 
                      question={firstQuestion}
                      activeFilters={activeFilters}
                      setActiveFilters={setActiveFilters}
                      isTestMode={isTestMode}
                    />
                  </Box>
                );
              }
            }
            
            // 2つ選択されていて、両方ともテキスト質問（タイプ1または2）の場合
            if (selectedQuestions.length === 2) {
              const firstQuestion = selectedQuestions[0];
              const secondQuestion = selectedQuestions[1];
              const firstTypeId = firstQuestion.typeId || firstQuestion.question_types_id || firstQuestion.type_id;
              const secondTypeId = secondQuestion.typeId || secondQuestion.question_types_id || secondQuestion.type_id;
              
              if ((firstTypeId === 1 || firstTypeId === 2) && (secondTypeId === 1 || secondTypeId === 2)) {
                return (
                  <Box sx={{ flexGrow: 1, minHeight: 0 }}>
                    <TextQuestionChart 
                      question={firstQuestion}
                      secondQuestion={secondQuestion}
                      activeFilters={activeFilters}
                      setActiveFilters={setActiveFilters}
                      isTestMode={isTestMode}
                    />
                  </Box>
                );
              }
            }
            
            // その他の場合（選択肢系、複数質問など）は従来のプレースホルダー
            return (
              <Box sx={{ 
                flexShrink: 0,
                minHeight: 1200,
                display: 'flex', 
                flexDirection: 'column',
                bgcolor: Object.keys(activeFilters).length > 0 ? 'rgba(99, 102, 241, 0.05)' : 'transparent',
                borderRadius: 2,
                border: Object.keys(activeFilters).length > 0 ? '1px dashed #c7d2fe' : 'none',
                transition: 'all 0.3s ease'
              }}>
                {/* 中央配置のコンテンツエリア */}
                <Box sx={{ 
                  height: 300,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  p: 2,
                  flexShrink: 0
                }}>
                  <Box sx={{ textAlign: 'center', color: '#64748b' }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                      {selectedQuestions.length === 1 
                        ? `${selectedQuestions[0].type}チャート` 
                        : selectedQuestions.length === 2 
                          ? '比較チャート' 
                          : 'クロス分析チャート'
                      }
                    </Typography>
                    <Typography variant="body2">
                      {selectedQuestions.length === 1 
                        ? '選択肢系質問のグラフが表示されます' 
                        : '複数質問の比較・クロス分析が表示されます'
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
                
                {/* スクロール動作確認用のデモコンテンツ */}
                <Box sx={{ 
                  height: 600, 
                  bgcolor: 'rgba(99, 102, 241, 0.02)',
                  m: 2,
                  borderRadius: 1,
                  border: '1px dashed rgba(99, 102, 241, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  gap: 2
                }}>
                  <Typography variant="body2" sx={{ color: '#94a3b8', fontWeight: 500 }}>
                    {selectedQuestions.length === 1 
                      ? '選択肢系チャートエリア（開発予定）' 
                      : '比較・クロス分析エリア（開発予定）'
                    }
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#cbd5e1' }}>
                    棒グラフ、円グラフ、クロス集計表などが表示されます
                  </Typography>
                </Box>
                
                {/* 追加のコンテンツエリア（スクロール確認用） */}
                <Box sx={{ 
                  height: 400, 
                  bgcolor: 'rgba(16, 185, 129, 0.02)',
                  m: 2,
                  borderRadius: 1,
                  border: '1px dashed rgba(16, 185, 129, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Typography variant="body2" sx={{ color: '#059669' }}>
                    統計情報・詳細分析エリア（開発予定）
                  </Typography>
                </Box>
              </Box>
            );
          })()}
        </Box>

      </Box>

      {/* Chat Panel */}
      <ChatPanel />
    </Box>
  );
}