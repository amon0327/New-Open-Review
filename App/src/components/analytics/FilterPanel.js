import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl
} from '@mui/material';
import {
  Search,
  Close
} from '@mui/icons-material';
import { categoryColors } from '../../data/questionsDatabase';
import { generateFilterOptions } from '../../utils/filterUtils';

export default function FilterPanel({
  selectedQuestions,
  activeFilters,
  setActiveFilters,
  showFilters,
  setShowFilters
}) {
  // フィルター更新
  const updateFilter = (questionId, type, value) => {
    setActiveFilters(prev => ({
      ...prev,
      [questionId]: { type, value }
    }));
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
                            {filterConfig.options.map((option) => (
                              <Button
                                key={option.value}
                                onClick={() => updateFilter(question.id, 'range', option.value)}
                                variant={activeFilters[question.id]?.value === option.value ? 'contained' : 'outlined'}
                                size="small"
                                sx={{
                                  textTransform: 'none',
                                  fontWeight: 500,
                                  minWidth: 'auto',
                                  px: 1.5,
                                  py: 0.5,
                                  fontSize: '0.75rem',
                                  height: 28,
                                  borderRadius: 1.5,
                                  bgcolor: activeFilters[question.id]?.value === option.value 
                                    ? categoryColors[question.category] 
                                    : 'transparent',
                                  color: activeFilters[question.id]?.value === option.value 
                                    ? 'white' 
                                    : '#64748b',
                                  borderColor: activeFilters[question.id]?.value === option.value 
                                    ? categoryColors[question.category] 
                                    : '#e2e8f0',
                                  transition: 'all 0.2s ease',
                                  '&:hover': {
                                    transform: 'translateY(-1px)',
                                    boxShadow: `0 4px 12px ${categoryColors[question.category]}30`
                                  }
                                }}
                              >
                                {option.label}
                              </Button>
                            ))}
                          </Box>
                        )}

                        {/* Select フィルター */}
                        {filterConfig.type === 'select' && (
                          <FormControl size="small" fullWidth>
                            <Select
                              value={activeFilters[question.id]?.value || ''}
                              onChange={(e) => updateFilter(question.id, 'select', e.target.value)}
                              displayEmpty
                              sx={{
                                height: 36,
                                borderRadius: 1.5,
                                fontSize: '0.8rem',
                                '& .MuiOutlinedInput-notchedOutline': {
                                  borderColor: '#e2e8f0',
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
                                  すべて選択
                                </Typography>
                              </MenuItem>
                              {filterConfig.options.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                  <Typography sx={{ fontSize: '0.8rem' }}>
                                    {option.label}
                                  </Typography>
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        )}

                        {/* Text フィルター */}
                        {filterConfig.type === 'text' && (
                          <TextField
                            fullWidth
                            placeholder={filterConfig.placeholder}
                            value={activeFilters[question.id]?.value || ''}
                            onChange={(e) => updateFilter(question.id, 'text', e.target.value)}
                            size="small"
                            InputProps={{
                              startAdornment: (
                                <Search sx={{ color: '#94a3b8', fontSize: 16, mr: 0.5 }} />
                              )
                            }}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                height: 36,
                                borderRadius: 1.5,
                                fontSize: '0.8rem',
                                '& fieldset': {
                                  borderColor: '#e2e8f0',
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