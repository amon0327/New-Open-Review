import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  Chip,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import {
  Search,
  Close,
  Check
} from '@mui/icons-material';
import { categoryColors } from '../../data/questionsDatabase';
import { generateFilterOptions } from '../../utils/filterUtils';
import { applyCombinedFilters } from '../../utils/dataFilterUtils';

export default function FilterPanel({
  selectedQuestions,
  activeFilters,
  setActiveFilters,
  showFilters,
  setShowFilters
}) {
  const [tempFilters, setTempFilters] = useState({});

  // 初期化: activeFiltersの値をtempFiltersにコピー
  useEffect(() => {
    setTempFilters({ ...activeFilters });
  }, [activeFilters, showFilters]);

  // フィルター更新（一時的）
  const updateTempFilter = (questionId, type, value) => {
    setTempFilters(prev => ({
      ...prev,
      [questionId]: { type, value }
    }));
  };

  // フィルター削除（一時的）
  const removeTempFilter = (questionId) => {
    const newTempFilters = { ...tempFilters };
    delete newTempFilters[questionId];
    setTempFilters(newTempFilters);
  };

  // フィルターを即座に適用（リアルタイム）
  const applyFilterInstantly = (questionId, type, value) => {
    const newFilters = {
      ...activeFilters,
      [questionId]: { type, value }
    };
    setActiveFilters(newFilters);
    setTempFilters(newFilters);
  };

  // フィルターをクリア
  const clearFilter = (questionId) => {
    const newFilters = { ...activeFilters };
    delete newFilters[questionId];
    setActiveFilters(newFilters);
    setTempFilters(newFilters);
  };

  return (
    <AnimatePresence>
      {showFilters && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
          <Box
            sx={{
              borderTop: '1px solid #f1f5f9',
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              maxHeight: 280,
              overflow: 'auto',
              '&::-webkit-scrollbar': { width: 6 },
              '&::-webkit-scrollbar-track': { 
                bgcolor: 'rgba(241, 245, 249, 0.5)',
                borderRadius: 3
              },
              '&::-webkit-scrollbar-thumb': { 
                bgcolor: 'rgba(203, 213, 225, 0.8)',
                borderRadius: 3,
                '&:hover': {
                  bgcolor: 'rgba(148, 163, 184, 0.9)'
                }
              }
            }}
          >
            <Box 
              sx={{ 
                p: 2,
                display: 'grid',
                gridTemplateColumns: selectedQuestions.length === 2 ? '1fr 1fr' : '1fr',
                gap: 2,
                width: '100%',
                maxWidth: '100%'
              }}
            >
              {selectedQuestions.map((question, index) => {
                const filterConfig = generateFilterOptions(question);
                
                return (
                  <motion.div
                    key={question.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Box
                      sx={{
                        p: 2,
                        border: '1px solid #e2e8f0',
                        borderRadius: 1,
                        background: 'rgba(255, 255, 255, 0.8)',
                        backdropFilter: 'blur(10px)',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                        minHeight: 70,
                        height: '100%',
                        width: '100%',
                        maxWidth: '100%',
                        minWidth: 0,
                        display: 'flex',
                        flexDirection: 'column'
                      }}
                    >
                      {/* カテゴリカラーインジケーター */}
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                        <Box
                          sx={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            bgcolor: categoryColors[question.category]
                          }}
                        />
                      </Box>

                      {/* コンパクトなフィルター要素 */}
                      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', py: 0.5 }}>
                        {/* Choices フィルター（統一された選択肢フィルター） */}
                        {filterConfig.type === 'choices' && (
                          <Box>
                            {/* 横スクロール可能な選択肢ボタン */}
                            <Box sx={{ 
                              display: 'flex', 
                              overflowX: 'auto',
                              overflowY: 'visible',
                              gap: 0.75,
                              py: 1,
                              px: 0.5,
                              mx: -0.5,
                              '&::-webkit-scrollbar': {
                                display: 'none'
                              },
                              scrollbarWidth: 'none',
                              '-ms-overflow-style': 'none'
                            }}>
                              {filterConfig.options.map((option) => {
                                const currentValues = activeFilters[question.id]?.value || [];
                                const isSelected = Array.isArray(currentValues) 
                                  ? currentValues.includes(option.value)
                                  : currentValues === option.value;
                                
                                return (
                                  <Button
                                    key={option.value}
                                    onClick={() => {
                                      const currentValues = activeFilters[question.id]?.value || [];
                                      let newValues;
                                      
                                      if (Array.isArray(currentValues)) {
                                        // 複数選択モード
                                        if (currentValues.includes(option.value)) {
                                          // 選択解除
                                          newValues = currentValues.filter(v => v !== option.value);
                                        } else {
                                          // 選択追加
                                          newValues = [...currentValues, option.value];
                                        }
                                      } else {
                                        // 単一選択から複数選択への変換
                                        if (currentValues === option.value) {
                                          // 選択解除
                                          newValues = [];
                                        } else if (currentValues) {
                                          // 既存の選択に追加
                                          newValues = [currentValues, option.value];
                                        } else {
                                          // 初回選択
                                          newValues = [option.value];
                                        }
                                      }
                                      
                                      if (newValues.length === 0) {
                                        clearFilter(question.id);
                                      } else {
                                        applyFilterInstantly(question.id, 'choices', newValues);
                                      }
                                    }}
                                    variant={isSelected ? 'contained' : 'outlined'}
                                    size="small"
                                    startIcon={isSelected ? <Check sx={{ fontSize: 14 }} /> : null}
                                    sx={{
                                      textTransform: 'none',
                                      fontWeight: 500,
                                      minWidth: 'auto',
                                      px: 1.5,
                                      py: 0.5,
                                      fontSize: '0.75rem',
                                      height: 32,
                                      borderRadius: 2,
                                      flexShrink: 0,
                                      bgcolor: isSelected 
                                        ? categoryColors[question.category] 
                                        : 'transparent',
                                      color: isSelected 
                                        ? 'white' 
                                        : '#64748b',
                                      borderColor: isSelected 
                                        ? categoryColors[question.category] 
                                        : '#e2e8f0',
                                      borderWidth: '1.5px',
                                      transition: 'all 0.2s ease',
                                      '&:hover': {
                                        transform: 'translateY(-1px)',
                                        boxShadow: `0 4px 12px ${categoryColors[question.category]}30`,
                                        bgcolor: isSelected 
                                          ? categoryColors[question.category] 
                                          : 'rgba(99, 102, 241, 0.05)',
                                        borderColor: categoryColors[question.category]
                                      },
                                      '&:active': {
                                        transform: 'translateY(0px)'
                                      }
                                    }}
                                  >
                                    {option.label}
                                  </Button>
                                );
                              })}
                            </Box>
                            
                            {/* 選択中の項目数表示 */}
                            {activeFilters[question.id]?.value?.length > 0 && (
                              <Box sx={{ 
                                mt: 1, 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'space-between',
                                gap: 1,
                                width: '100%',
                                minHeight: 24
                              }}>
                                <Typography variant="caption" sx={{ 
                                  color: categoryColors[question.category],
                                  fontSize: '0.7rem',
                                  fontWeight: 600,
                                  flexShrink: 0
                                }}>
                                  {Array.isArray(activeFilters[question.id].value) 
                                    ? `${activeFilters[question.id].value.length}個選択中`
                                    : '1個選択中'
                                  }
                                </Typography>
                                <Button
                                  onClick={() => clearFilter(question.id)}
                                  size="small"
                                  sx={{ 
                                    minWidth: 'auto',
                                    px: 1,
                                    py: 0.25,
                                    fontSize: '0.65rem',
                                    color: '#94a3b8',
                                    flexShrink: 0,
                                    '&:hover': {
                                      color: '#ef4444',
                                      bgcolor: 'rgba(239, 68, 68, 0.05)'
                                    }
                                  }}
                                >
                                  すべて解除
                                </Button>
                              </Box>
                            )}
                          </Box>
                        )}

                        {/* Text フィルター */}
                        {filterConfig.type === 'text' && (
                          <Box>
                            <TextField
                              fullWidth
                              placeholder={filterConfig.placeholder}
                              value={activeFilters[question.id]?.value || ''}
                              onChange={(e) => {
                                const value = e.target.value;
                                
                                // 即座にフィルターを適用
                                if (value === '') {
                                  clearFilter(question.id);
                                } else {
                                  applyFilterInstantly(question.id, 'text', value);
                                }
                              }}
                              size="small"
                              InputProps={{
                                startAdornment: (
                                  <Search sx={{ color: '#94a3b8', fontSize: 16, mr: 0.5 }} />
                                ),
                                endAdornment: activeFilters[question.id]?.value && (
                                  <Button
                                    onClick={() => clearFilter(question.id)}
                                    sx={{ minWidth: 'auto', p: 0.5 }}
                                  >
                                    <Close sx={{ fontSize: 16, color: '#94a3b8' }} />
                                  </Button>
                                )
                              }}
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  height: 36,
                                  borderRadius: 1.5,
                                  fontSize: '0.8rem',
                                  bgcolor: activeFilters[question.id]?.value ? 'rgba(99, 102, 241, 0.05)' : 'transparent',
                                  '& fieldset': {
                                    borderColor: activeFilters[question.id]?.value ? categoryColors[question.category] : '#e2e8f0',
                                    borderWidth: activeFilters[question.id]?.value ? '2px' : '1px'
                                  },
                                  '&:hover fieldset': {
                                    borderColor: categoryColors[question.category],
                                  },
                                  '&.Mui-focused fieldset': {
                                    borderColor: categoryColors[question.category],
                                    borderWidth: '2px'
                                  }
                                }
                              }}
                            />
                            
                            {/* 検索中のフィードバック */}
                            {activeFilters[question.id]?.value && (
                              <Box sx={{ mt: 1 }}>
                                <Chip
                                  label={`"${activeFilters[question.id].value}" で検索中`}
                                  size="small"
                                  onDelete={() => clearFilter(question.id)}
                                  sx={{
                                    bgcolor: 'rgba(99, 102, 241, 0.1)',
                                    color: '#4338ca',
                                    fontSize: '0.7rem',
                                    '& .MuiChip-deleteIcon': {
                                      color: '#4338ca',
                                      fontSize: 14
                                    }
                                  }}
                                />
                              </Box>
                            )}
                          </Box>
                        )}
                      </Box>
                    </Box>
                  </motion.div>
                );
              })}
            </Box>

          </Box>
        </motion.div>
      )}
    </AnimatePresence>
  );
}