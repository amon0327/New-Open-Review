import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { usePartnerTheme } from '../contexts/PartnerThemeContext';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Collapse,
  CircularProgress,
  Chip
} from '@mui/material';
import {
  TextFields,
  ExpandMore as ExpandMoreIcon,
  History
} from '@mui/icons-material';

const QuestionToolsSidebar = ({
  questionTypes,
  setSelectedTool,
  pastQuestions = [],
  isLoadingPastQuestions = false
}) => {
  const theme = usePartnerTheme();
  const [expandedForms, setExpandedForms] = useState({});

  // ドラッグ開始時の処理
  const handleDragStart = (e, item) => {
    // Reactコンポーネント（icon）を除外してJSONシリアライズ
    const { icon, ...itemWithoutIcon } = item;
    e.dataTransfer.setData('application/json', JSON.stringify(itemWithoutIcon));
    e.dataTransfer.effectAllowed = 'copy';

    // ドラッグ中の要素を半透明にする
    e.target.style.opacity = '0.6';
  };

  // ドラッグ終了時の処理
  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
  };

  // フォーム展開トグル
  const toggleFormExpanded = (formId) => {
    setExpandedForms(prev => ({
      ...prev,
      [formId]: !prev[formId]
    }));
  };

  // 過去の質問をフォーム別にグループ化
  const groupedPastQuestions = React.useMemo(() => {
    const groups = {};
    pastQuestions.forEach(q => {
      const formKey = q.formId || 'unknown';
      if (!groups[formKey]) {
        groups[formKey] = {
          formId: formKey,
          formTitle: q.formTitle || '不明なフォーム',
          questions: []
        };
      }
      groups[formKey].questions.push(q);
    });
    return Object.values(groups);
  }, [pastQuestions]);

  return (
    <>
      {/* 質問タイプグリッド */}
      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#64748b' }}>
        質問タイプ
      </Typography>
      <Grid container spacing={1} sx={{ mb: 3 }}>
        {questionTypes.map((item, index) => (
          <Grid item xs={4} key={index}>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Paper
                elevation={2}
                draggable
                onDragStart={(e) => handleDragStart(e, item)}
                onDragEnd={handleDragEnd}
                sx={{
                  p: 1,
                  borderRadius: 1,
                  background: 'rgba(255, 255, 255, 0.8)',
                  border: '1px solid rgba(0, 0, 0, 0.05)',
                  cursor: 'grab',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 0.5,
                  minHeight: 70,
                  position: 'relative',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)',
                    background: 'rgba(94, 23, 235, 0.05)'
                  },
                  '&:active': {
                    cursor: 'grabbing'
                  },
                  // ドラッグ時のカスタムエフェクト
                  '&:is([dragging])': {
                    opacity: 0.6,
                    transform: 'scale(1.05)',
                    boxShadow: `0 8px 32px ${theme.primaryAlpha30}`
                  }
                }}
                onClick={() => setSelectedTool(item)}
              >
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: 1,
                    background: `linear-gradient(135deg, ${
                      [theme.accent, '#ff9a9e', '#a8edea', '#fed6e3', '#d299c2', '#89f7fe', '#66a6ff'][index % 7]
                    } 0%, ${
                      [theme.secondary, '#fecfef', '#d299c2', '#d8edea', '#fecfef', '#bfe9ff', '#8aa7ff'][index % 7]
                    } 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                  }}
                >
                  {React.cloneElement(item.icon, {
                    sx: { color: 'white', fontSize: '0.9rem' }
                  })}
                </Box>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 500,
                    color: '#2d3748',
                    fontSize: '0.65rem',
                    textAlign: 'center',
                    lineHeight: 1.2
                  }}
                >
                  {item.label}
                </Typography>
              </Paper>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      {/* 作成済みの質問セクション */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <History sx={{ fontSize: 18, color: theme.primary }} />
        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#64748b' }}>
          作成済みの質問
        </Typography>
      </Box>

      <Box sx={{ flex: 1 }}>
        {isLoadingPastQuestions ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={24} sx={{ color: theme.primary }} />
          </Box>
        ) : pastQuestions.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4, color: '#94a3b8' }}>
            <History sx={{ fontSize: 40, mb: 1, opacity: 0.5 }} />
            <Typography variant="body2">
              作成済みの質問がありません
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
              フォームを作成すると質問が表示されます
            </Typography>
          </Box>
        ) : (
          groupedPastQuestions.map((formGroup, formIndex) => (
            <Box key={formGroup.formId} sx={{ mb: 2 }}>
              {/* フォームヘッダー（トグル機能付き） */}
              <Box
                onClick={() => toggleFormExpanded(formGroup.formId)}
                sx={{
                  p: 1.5,
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  borderRadius: 1,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  border: `1px solid ${theme.primaryAlpha10}`,
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: 'rgba(94, 23, 235, 0.05)',
                    borderColor: theme.primaryAlpha20,
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, minWidth: 0 }}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: 1,
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      flexShrink: 0
                    }}
                  />
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      fontSize: '0.8rem',
                      color: '#2d3748',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {formGroup.formTitle}
                  </Typography>
                  <Chip
                    label={`${formGroup.questions.length}件`}
                    size="small"
                    sx={{
                      height: 18,
                      fontSize: '0.65rem',
                      backgroundColor: 'rgba(94, 23, 235, 0.1)',
                      color: '#5e17eb',
                      flexShrink: 0
                    }}
                  />
                </Box>
                <ExpandMoreIcon
                  sx={{
                    fontSize: '1rem',
                    color: '#5e17eb',
                    transform: expandedForms[formGroup.formId] ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s ease',
                    flexShrink: 0
                  }}
                />
              </Box>

              {/* 質問リスト */}
              <Collapse in={expandedForms[formGroup.formId] || false}>
                <Box sx={{ pt: 1, pl: 2 }}>
                  {formGroup.questions.map((question, qIndex) => (
                    <motion.div
                      key={question.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: qIndex * 0.03 }}
                    >
                        <Box
                          draggable
                          onDragStart={(e) => handleDragStart(e, { ...question, isPastQuestion: true })}
                          onDragEnd={handleDragEnd}
                          onClick={() => setSelectedTool({ ...question, isPastQuestion: true })}
                          sx={{
                            p: 1.5,
                            mb: 1,
                            cursor: 'grab',
                            borderRadius: 1,
                            position: 'relative',
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            border: '1px solid rgba(16, 185, 129, 0.2)',
                            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                            '&:hover': {
                              backgroundColor: 'rgba(16, 185, 129, 0.04)',
                              borderColor: 'rgba(16, 185, 129, 0.4)',
                              transform: 'translateX(3px)',
                              boxShadow: '0 3px 12px rgba(0, 0, 0, 0.1)'
                            },
                            '&:active': {
                              cursor: 'grabbing'
                            },
                            transition: 'all 0.3s ease'
                          }}
                        >
                          {/* 左側: アイコン */}
                          <Box
                            sx={{
                              width: 32,
                              height: 32,
                              borderRadius: 1,
                              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                            }}
                          >
                            {React.cloneElement(
                              questionTypes.find(qt => qt.question_types_id === question.question_types_id)?.icon || <TextFields />,
                              {
                                sx: {
                                  color: 'white',
                                  fontSize: '1rem'
                                }
                              }
                            )}
                          </Box>

                          {/* 右側: テキスト（最大2行） */}
                          <Typography
                            variant="body2"
                            sx={{
                              fontSize: '0.8rem',
                              lineHeight: 1.3,
                              color: '#2d3748',
                              fontWeight: 500,
                              flex: 1,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                          >
                            {question.question}
                          </Typography>
                        </Box>
                    </motion.div>
                  ))}
                </Box>
              </Collapse>
            </Box>
          ))
        )}
      </Box>
    </>
  );
};

export default QuestionToolsSidebar;
