import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Collapse
} from '@mui/material';
import {
  TextFields,
  ExpandMore as ExpandMoreIcon,
  ArrowForward
} from '@mui/icons-material';

const QuestionToolsSidebar = ({
  questionTypes,
  questionTemplates,
  expandedTemplates,
  toggleExpanded,
  setSelectedTool
}) => {
  // タップアニメーション状態管理
  const [tapAnimations, setTapAnimations] = useState({});
  
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

  // タップ時のアニメーション効果
  const handleTapAnimation = (itemId) => {
    setTapAnimations(prev => ({ ...prev, [itemId]: true }));
    
    // 一定時間後にアニメーションを停止
    setTimeout(() => {
      setTapAnimations(prev => ({ ...prev, [itemId]: false }));
    }, 800);
  };
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
              animate={{ 
                opacity: 1, 
                scale: 1,
                x: tapAnimations[`questionType-${index}`] ? 30 : 0
              }}
              transition={{ 
                duration: 0.3, 
                delay: index * 0.05,
                x: { duration: 0.4, ease: "easeInOut" }
              }}
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
                    boxShadow: '0 8px 32px rgba(94, 23, 235, 0.3)'
                  }
                }}
                onClick={() => {
                  setSelectedTool(item);
                  handleTapAnimation(`questionType-${index}`);
                }}
              >
                {/* 矢印アニメーション */}
                <AnimatePresence>
                  {tapAnimations[`questionType-${index}`] && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 10 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.4 }}
                      style={{
                        position: 'absolute',
                        right: -25,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        zIndex: 10
                      }}
                    >
                      <ArrowForward 
                        sx={{ 
                          color: '#5e17eb',
                          fontSize: '1.2rem'
                        }} 
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: 1,
                    background: `linear-gradient(135deg, ${
                      ['#667eea', '#ff9a9e', '#a8edea', '#fed6e3', '#d299c2', '#89f7fe', '#66a6ff'][index % 7]
                    } 0%, ${
                      ['#764ba2', '#fecfef', '#d299c2', '#d8edea', '#fecfef', '#bfe9ff', '#8aa7ff'][index % 7]
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

      {/* テンプレート質問 */}
      <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: '#64748b' }}>
        テンプレート質問
      </Typography>
      <Box sx={{ flex: 1 }}>
        {questionTemplates.map((majorCategory, index) => (
          <Box key={majorCategory.id} sx={{ mb: 3 }}>
            {/* 大区分ヘッダー（テキスト表示のみ） */}
            <Box sx={{ mb: 2 }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 700, 
                  fontSize: '0.9rem', 
                  color: '#1a202c',
                  letterSpacing: '0.02em',
                  mb: 0.5
                }}
              >
                {majorCategory.title}
              </Typography>
              <Box
                sx={{
                  width: '100%',
                  height: 2,
                  background: 'linear-gradient(90deg, #5e17eb 0%, #764ba2 100%)',
                  borderRadius: 0.5,
                  opacity: 0.3
                }}
              />
            </Box>
            
            {/* 中区分とテンプレート質問 */}
            <Box sx={{ pl: 0 }}>
              {majorCategory.categories.map((category, catIndex) => (
                <Box key={category.id} sx={{ mb: 2 }}>
                  {/* 中区分ヘッダー（トグル機能付き） */}
                  <Box
                    onClick={() => toggleExpanded(`${majorCategory.id}-${category.id}`)}
                    sx={{
                      p: 1.5,
                      backgroundColor: 'rgba(255, 255, 255, 0.8)',
                      borderRadius: 1,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      border: '1px solid rgba(94, 23, 235, 0.1)',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        backgroundColor: 'rgba(94, 23, 235, 0.05)',
                        borderColor: 'rgba(94, 23, 235, 0.2)',
                        transform: 'translateY(-1px)',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: 1,
                          background: 'linear-gradient(135deg, #5e17eb 0%, #764ba2 100%)',
                          boxShadow: '0 2px 4px rgba(94, 23, 235, 0.3)'
                        }}
                      />
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: 600, 
                          fontSize: '0.8rem',
                          color: '#2d3748'
                        }}
                      >
                        {category.title}
                      </Typography>
                    </Box>
                    <ExpandMoreIcon 
                      sx={{ 
                        fontSize: '1rem',
                        color: '#5e17eb',
                        transform: expandedTemplates[`${majorCategory.id}-${category.id}`] ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.3s ease'
                      }} 
                    />
                  </Box>
                  
                  {/* テンプレート質問リスト */}
                  <Collapse in={expandedTemplates[`${majorCategory.id}-${category.id}`] || false}>
                    <Box sx={{ pt: 1, pl: 2 }}>
                      {category.templates.map((temp, tempIndex) => (
                        <motion.div
                          key={temp.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ 
                            opacity: 1, 
                            x: tapAnimations[`template-${temp.id}`] ? 30 : 0
                          }}
                          transition={{ 
                            duration: 0.2, 
                            delay: tempIndex * 0.05,
                            x: { duration: 0.4, ease: "easeInOut" }
                          }}
                        >
                          <Box
                            draggable
                            onDragStart={(e) => handleDragStart(e, { ...temp, isTemplate: true })}
                            onDragEnd={handleDragEnd}
                            onClick={() => {
                              setSelectedTool({ ...temp, isTemplate: true });
                              handleTapAnimation(`template-${temp.id}`);
                            }}
                            sx={{
                              p: 1.5,
                              mb: 1,
                              cursor: 'grab',
                              borderRadius: 1,
                              position: 'relative',
                              backgroundColor: 'rgba(255, 255, 255, 0.9)',
                              border: '1px solid rgba(0, 0, 0, 0.06)',
                              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1.5,
                              '&:hover': {
                                backgroundColor: 'rgba(94, 23, 235, 0.04)',
                                borderColor: 'rgba(94, 23, 235, 0.15)',
                                transform: 'translateX(3px)',
                                boxShadow: '0 3px 12px rgba(0, 0, 0, 0.1)'
                              },
                              '&:active': {
                                cursor: 'grabbing'
                              },
                              transition: 'all 0.3s ease'
                            }}
                          >
                            {/* 矢印アニメーション */}
                            <AnimatePresence>
                              {tapAnimations[`template-${temp.id}`] && (
                                <motion.div
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 10 }}
                                  exit={{ opacity: 0, x: 20 }}
                                  transition={{ duration: 0.4 }}
                                  style={{
                                    position: 'absolute',
                                    right: -25,
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    zIndex: 10
                                  }}
                                >
                                  <ArrowForward 
                                    sx={{ 
                                      color: '#5e17eb',
                                      fontSize: '1.2rem'
                                    }} 
                                  />
                                </motion.div>
                              )}
                            </AnimatePresence>
                            
                            {/* 左側: アイコン */}
                            <Box
                              sx={{
                                width: 32,
                                height: 32,
                                borderRadius: 1,
                                background: 'linear-gradient(135deg, #5e17eb 0%, #764ba2 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                boxShadow: '0 2px 8px rgba(94, 23, 235, 0.3)'
                              }}
                            >
                              {React.cloneElement(
                                questionTypes.find(qt => qt.type === temp.type)?.icon || <TextFields />,
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
                              {temp.question}
                            </Typography>
                          </Box>
                        </motion.div>
                      ))}
                    </Box>
                  </Collapse>
                </Box>
              ))}
            </Box>
          </Box>
        ))}
      </Box>
    </>
  );
};

export default QuestionToolsSidebar;