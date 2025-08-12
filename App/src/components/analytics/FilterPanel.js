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
  Chip
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
              maxHeight: 240,
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
                gap: 2
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
                      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        {/* Range フィルター */}
                        {filterConfig.type === 'range' && (
                          <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                            {filterConfig.options.map((option) => {
                              const isActive = activeFilters[question.id]?.value === option.value;
                              return (
                                <Button
                                  key={option.value}
                                  onClick={() => {
                                    if (isActive) {
                                      clearFilter(question.id);
                                    } else {
                                      applyFilterInstantly(question.id, 'range', option.value);
                                    }
                                  }}
                                  variant={isActive ? 'contained' : 'outlined'}
                                  size="small"
                                  startIcon={isActive ? <Check sx={{ fontSize: 14 }} /> : null}
                                  sx={{
                                    textTransform: 'none',
                                    fontWeight: 500,
                                    minWidth: 'auto',
                                    px: 1.5,
                                    py: 0.5,
                                    fontSize: '0.75rem',
                                    height: 28,
                                    borderRadius: 1.5,
                                    bgcolor: isActive 
                                      ? categoryColors[question.category] 
                                      : 'transparent',
                                    color: isActive 
                                      ? 'white' 
                                      : '#64748b',
                                    borderColor: isActive 
                                      ? categoryColors[question.category] 
                                      : '#e2e8f0',
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                      transform: 'translateY(-1px)',
                                      boxShadow: `0 4px 12px ${categoryColors[question.category]}30`,
                                      bgcolor: isActive 
                                        ? categoryColors[question.category] 
                                        : 'rgba(99, 102, 241, 0.05)'
                                    }
                                  }}
                                >
                                  {option.label}
                                </Button>
                              );
                            })}
                          </Box>
                        )}

                        {/* Select フィルター */}
                        {filterConfig.type === 'select' && (
                          <FormControl size="small" fullWidth>
                            <Select
                              value={activeFilters[question.id]?.value || ''}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value === '') {
                                  clearFilter(question.id);
                                } else {
                                  applyFilterInstantly(question.id, 'select', value);
                                }
                              }}
                              displayEmpty
                              sx={{
                                height: 36,
                                borderRadius: 1.5,
                                fontSize: '0.8rem',
                                bgcolor: activeFilters[question.id]?.value ? 'rgba(99, 102, 241, 0.05)' : 'transparent',
                                '& .MuiOutlinedInput-notchedOutline': {
                                  borderColor: activeFilters[question.id]?.value ? categoryColors[question.category] : '#e2e8f0',
                                  borderWidth: activeFilters[question.id]?.value ? '2px' : '1px'
                                },
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                  borderColor: categoryColors[question.category],
                                },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                  borderColor: categoryColors[question.category],
                                  borderWidth: '2px'
                                }
                              }}
                            >
                              <MenuItem value="">
                                <Typography sx={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                                  すべて表示
                                </Typography>
                              </MenuItem>
                              {filterConfig.options.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                    <Typography sx={{ fontSize: '0.8rem' }}>
                                      {option.label}
                                    </Typography>
                                    {activeFilters[question.id]?.value === option.value && (
                                      <Check sx={{ fontSize: 16, color: categoryColors[question.category] }} />
                                    )}
                                  </Box>
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        )}

                        {/* Text フィルター */}
                        {filterConfig.type === 'text' && (
                          <Box>
                            <TextField
                              fullWidth
                              placeholder={filterConfig.placeholder}
                              value={tempFilters[question.id]?.value || ''}
                              onChange={(e) => {
                                const value = e.target.value;
                                updateTempFilter(question.id, 'text', value);
                                
                                // リアルタイム検索（300ms のデバウンス）
                                setTimeout(() => {
                                  if (value === '' || value.length >= 1) {
                                    if (value === '') {
                                      clearFilter(question.id);
                                    } else {
                                      applyFilterInstantly(question.id, 'text', value);
                                    }
                                  }
                                }, 300);
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