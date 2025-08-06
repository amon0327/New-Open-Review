import React from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Typography,
  TextField,
  Card,
  Badge,
  Button,
  Chip
} from '@mui/material';
import {
  Search,
  Add,
  Remove,
  Clear
} from '@mui/icons-material';
import { questionsDatabase, categoryColors } from '../../data/questionsDatabase';

export default function QuestionSidebar({
  searchTerm,
  setSearchTerm,
  selectedQuestions,
  setSelectedQuestions,
  analysisMode,
  setAnalysisMode
}) {
  // 検索フィルタリング
  const filteredQuestions = questionsDatabase.filter(question =>
    question.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    question.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 質問の選択・解除
  const toggleQuestion = (question) => {
    setSelectedQuestions(prev => {
      const exists = prev.find(q => q.id === question.id);
      if (exists) {
        return prev.filter(q => q.id !== question.id);
      } else {
        if (prev.length < 2) {
          return [...prev, question];
        }
        return prev;
      }
    });
  };

  // 分析モード切替
  const handleModeChange = (mode) => {
    setAnalysisMode(mode);
    if (mode === 'single') {
      setSelectedQuestions(prev => prev.slice(0, 1));
    }
  };

  return (
    <Box
      sx={{
        width: 280,
        bgcolor: '#ffffff',
        borderRadius: 2,
        border: '1px solid #e5e7eb',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}
    >
      {/* 検索 */}
      <Box sx={{ p: 1.5, borderBottom: '1px solid #e5e7eb' }}>
        <TextField
          fullWidth
          size="small"
          placeholder="質問を検索..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <Search sx={{ color: '#9ca3af', fontSize: 16, mr: 0.5 }} />
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              height: 32,
              borderRadius: 1.5,
              fontSize: '0.8rem',
              '& fieldset': { borderColor: '#e5e7eb' },
              '&:hover fieldset': { borderColor: '#6366f1' },
              '&.Mui-focused fieldset': { borderColor: '#6366f1', borderWidth: '2px' }
            }
          }}
        />
      </Box>

      {/* 分析モード選択 */}
      <Box sx={{ p: 1.5, borderBottom: '1px solid #e5e7eb' }}>
        <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600, mb: 1, display: 'block' }}>
          分析モード
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Button
            variant={analysisMode === 'single' ? 'contained' : 'outlined'}
            size="small"
            onClick={() => handleModeChange('single')}
            sx={{
              textTransform: 'none',
              fontSize: '0.75rem',
              fontWeight: 500,
              minWidth: 'auto',
              px: 1.5,
              py: 0.5,
              height: 26,
              borderRadius: 1,
              flex: 1,
              bgcolor: analysisMode === 'single' ? '#6366f1' : 'transparent',
              color: analysisMode === 'single' ? 'white' : '#64748b',
              borderColor: '#e5e7eb'
            }}
          >
            単体分析
          </Button>
          <Button
            variant={analysisMode === 'comparison' ? 'contained' : 'outlined'}
            size="small"
            onClick={() => handleModeChange('comparison')}
            sx={{
              textTransform: 'none',
              fontSize: '0.75rem',
              fontWeight: 500,
              minWidth: 'auto',
              px: 1.5,
              py: 0.5,
              height: 26,
              borderRadius: 1,
              flex: 1,
              bgcolor: analysisMode === 'comparison' ? '#6366f1' : 'transparent',
              color: analysisMode === 'comparison' ? 'white' : '#64748b',
              borderColor: '#e5e7eb'
            }}
          >
            比較分析
          </Button>
        </Box>
      </Box>

      {/* 選択済み質問 */}
      {selectedQuestions.length > 0 && (
        <Box sx={{ p: 1.5, borderBottom: '1px solid #e5e7eb', bgcolor: '#f8fafc' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="caption" sx={{ color: '#374151', fontWeight: 600 }}>
              選択中 ({selectedQuestions.length}/2)
            </Typography>
            <Button
              startIcon={<Clear sx={{ fontSize: 12 }} />}
              size="small"
              onClick={() => setSelectedQuestions([])}
              sx={{
                textTransform: 'none',
                fontSize: '0.7rem',
                fontWeight: 500,
                minWidth: 'auto',
                px: 1,
                py: 0.25,
                height: 20,
                color: '#ef4444',
                '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.1)' }
              }}
            >
              クリア
            </Button>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
            {selectedQuestions.map((question, index) => (
              <Box key={question.id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    bgcolor: categoryColors[question.category],
                    flex: 'none'
                  }}
                />
                <Typography
                  sx={{
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    color: '#374151',
                    flex: 1,
                    lineHeight: 1.3
                  }}
                >
                  {question.title}
                </Typography>
                <Button
                  size="small"
                  onClick={() => toggleQuestion(question)}
                  sx={{
                    minWidth: 16,
                    width: 16,
                    height: 16,
                    p: 0,
                    color: '#6b7280',
                    '&:hover': { color: '#ef4444', bgcolor: 'rgba(239, 68, 68, 0.1)' }
                  }}
                >
                  <Remove sx={{ fontSize: 12 }} />
                </Button>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {/* 質問リスト */}
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        <Box sx={{ p: 1 }}>
          {filteredQuestions.map((question, index) => {
            const isSelected = selectedQuestions.find(q => q.id === question.id);
            const canSelect = selectedQuestions.length < 2 || isSelected;
            const isDisabled = !canSelect && !isSelected;

            return (
              <motion.div
                key={question.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  onClick={() => canSelect && toggleQuestion(question)}
                  sx={{
                    mb: 1,
                    p: 1.5,
                    cursor: canSelect ? 'pointer' : 'not-allowed',
                    opacity: isDisabled ? 0.4 : 1,
                    border: isSelected ? `2px solid ${categoryColors[question.category]}` : '1px solid #e5e7eb',
                    bgcolor: isSelected ? `${categoryColors[question.category]}10` : '#ffffff',
                    boxShadow: isSelected ? `0 2px 8px ${categoryColors[question.category]}30` : '0 1px 3px rgba(0, 0, 0, 0.05)',
                    transition: 'all 0.2s ease',
                    '&:hover': canSelect ? {
                      boxShadow: `0 4px 12px ${categoryColors[question.category]}40`,
                      transform: 'translateY(-1px)'
                    } : {}
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: 1.5,
                        bgcolor: `${categoryColors[question.category]}20`,
                        color: categoryColors[question.category],
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flex: 'none'
                      }}
                    >
                      {React.cloneElement(question.icon, { sx: { fontSize: 18 } })}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        sx={{
                          fontWeight: 600,
                          color: '#1e293b',
                          fontSize: '0.85rem',
                          lineHeight: 1.3,
                          mb: 0.5
                        }}
                      >
                        {question.title}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Chip
                          label={question.category}
                          size="small"
                          sx={{
                            height: 18,
                            fontSize: '0.65rem',
                            fontWeight: 500,
                            bgcolor: `${categoryColors[question.category]}20`,
                            color: categoryColors[question.category],
                            '& .MuiChip-label': { px: 0.75 }
                          }}
                        />
                        <Badge
                          badgeContent={question.responseCount}
                          color="default"
                          sx={{
                            '& .MuiBadge-badge': {
                              fontSize: '0.65rem',
                              height: 16,
                              minWidth: 16,
                              bgcolor: '#f1f5f9',
                              color: '#64748b'
                            }
                          }}
                        />
                      </Box>
                      <Typography
                        variant="caption"
                        sx={{
                          color: '#64748b',
                          fontSize: '0.7rem',
                          fontWeight: 500
                        }}
                      >
                        {question.chartType} • {question.type}
                      </Typography>
                    </Box>
                    {canSelect && (
                      <Box
                        sx={{
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          border: isSelected ? 'none' : '2px solid #d1d5db',
                          bgcolor: isSelected ? categoryColors[question.category] : 'transparent',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flex: 'none'
                        }}
                      >
                        {isSelected && <Add sx={{ fontSize: 14 }} />}
                      </Box>
                    )}
                  </Box>
                </Card>
              </motion.div>
            );
          })}

          {filteredQuestions.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4, color: '#9ca3af' }}>
              <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                検索結果がありません
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}