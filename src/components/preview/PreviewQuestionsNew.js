import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box,
  Container,
  Typography,
  Button
} from '@mui/material';

// Import separated question components
import {
  ShortTextQuestion,
  LongTextQuestion,
  SingleChoiceQuestion,
  MultipleChoiceQuestion,
  SingleChoiceMatrixQuestion,
  MultipleChoiceMatrixQuestion,
  LinearScaleQuestion,
  PullDownQuestion
} from './questions';

import { stringToColor } from './utils/colorUtils';

// Main PreviewQuestions component - リファクタリング版
const PreviewQuestions = ({ 
  previewMode, 
  zoom = 1,
  questions = [], 
  selectedPage,
  isDragActive = false,
  dropIndicator = null,
  onDragOver,
  onDragLeave,
  onDrop,
  dropRef,
  selectedQuestionId,
  onQuestionSelect,
  // 基本設定関連
  headerImage,
  logoImage,
  onElementSelect,
  selectedElement
}) => {
  const [answers, setAnswers] = useState({});
  const [hoveredQuestionId, setHoveredQuestionId] = useState(null);
  const [prevQuestionsCount, setPrevQuestionsCount] = useState(0);
  const scrollContainerRef = useRef(null);
  const isMobile = previewMode === 'mobile';

  const themeColor = '#5e17eb';
  const defaultHeaderImage = 'https://misezukuri.com/wp-content/uploads/2023/10/Cafebar1.png';
  const defaultLogoUrl = 'https://otfreskkeaenahqziriz.supabase.co/storage/v1/object/public/app-assets/logo/OpenReviewWhiteThemeLoog.png';
  
  const currentHeaderImage = headerImage || defaultHeaderImage;
  const currentLogoUrl = logoImage || defaultLogoUrl;

  // 実際の質問データを使用
  const displayQuestions = questions || [];

  // 質問が追加された際の自動スクロール機能
  useEffect(() => {
    if (displayQuestions.length > prevQuestionsCount && scrollContainerRef.current) {
      // 新しい質問が追加された場合のみスクロール
      if (prevQuestionsCount > 0) {
        // 少し遅延を入れてスムーズにスクロール
        setTimeout(() => {
          if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTo({
              top: scrollContainerRef.current.scrollHeight,
              behavior: 'smooth'
            });
          }
        }, 100);
      }
      setPrevQuestionsCount(displayQuestions.length);
    } else if (displayQuestions.length < prevQuestionsCount) {
      // 質問が削除された場合は単純に数を更新
      setPrevQuestionsCount(displayQuestions.length);
    }
  }, [displayQuestions.length, prevQuestionsCount]);

  const handleAnswerChange = useCallback((questionId, answerData) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answerData
    }));
  }, []);

  const renderQuestion = useCallback((question, index) => {
    const questionNumber = index + 1;
    const totalQuestions = displayQuestions.length;
    const isSelected = selectedQuestionId === question.id;
    const isHovered = hoveredQuestionId === question.id;

    const handleQuestionClick = (e) => {
      // 入力フィールドをクリックした場合は質問選択を発火しない
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }
      if (onQuestionSelect) {
        onQuestionSelect(question.id);
      }
    };

    const questionWrapper = (children) => (
      <Box
        onClick={handleQuestionClick}
        onMouseEnter={() => setHoveredQuestionId(question.id)}
        onMouseLeave={() => setHoveredQuestionId(null)}
        sx={{
          position: 'relative',
          cursor: 'pointer',
          margin: (isSelected || isHovered) ? '24px -24px' : '8px 0',
          transition: 'all 0.3s ease'
        }}
      >
        <Box
          sx={{
            borderRadius: 3,
            border: isSelected ? '2px solid #5e17eb' : 
                   isHovered ? '2px solid rgba(94, 23, 235, 0.3)' : 
                   '2px solid transparent',
            backgroundColor: isSelected ? 'rgba(94, 23, 235, 0.02)' : 
                           isHovered ? 'rgba(94, 23, 235, 0.01)' : 
                           'transparent',
            padding: (isSelected || isHovered) ? '24px' : '0',
            boxShadow: isSelected ? '0 8px 32px rgba(94, 23, 235, 0.15)' : 
                      isHovered ? '0 4px 16px rgba(94, 23, 235, 0.1)' : 
                      'none',
            position: 'relative',
            transition: 'all 0.3s ease',
            transform: isSelected ? 'none' : isHovered ? 'translateY(-2px)' : 'none',
            '&::before': isSelected ? {
              content: '"選択中"',
              position: 'absolute',
              top: -12,
              right: 16,
              backgroundColor: '#5e17eb',
              color: 'white',
              fontSize: '0.7rem',
              fontWeight: 600,
              padding: '4px 12px',
              borderRadius: '16px',
              zIndex: 10,
              boxShadow: '0 2px 8px rgba(94, 23, 235, 0.3)'
            } : {}
          }}
        >
          {children}
        </Box>
      </Box>
    );

    // 共通のprops
    const commonProps = {
      key: question.id,
      question,
      themeColor,
      currentQuestion: questionNumber,
      totalQuestions,
      onAnswerChange: handleAnswerChange
    };

    switch (question.question_types_id) {
      case 1:
        return questionWrapper(<ShortTextQuestion {...commonProps} />);
      case 2:
        return questionWrapper(<LongTextQuestion {...commonProps} />);
      case 3:
        return questionWrapper(<SingleChoiceQuestion {...commonProps} />);
      case 4:
        return questionWrapper(<MultipleChoiceQuestion {...commonProps} />);
      case 5:
        return questionWrapper(<SingleChoiceMatrixQuestion {...commonProps} />);
      case 6:
        return questionWrapper(<MultipleChoiceMatrixQuestion {...commonProps} />);
      case 7:
        return questionWrapper(<LinearScaleQuestion {...commonProps} />);
      case 8:
        return questionWrapper(<PullDownQuestion {...commonProps} zoom={zoom} />);
      default:
        return (
          <Box key={question.id} sx={{ py: 4, textAlign: 'center' }}>
            <Typography>サポートされていない質問タイプ: {question.question_types_id}</Typography>
          </Box>
        );
    }
  }, [displayQuestions.length, selectedQuestionId, hoveredQuestionId, onQuestionSelect, setHoveredQuestionId, themeColor, handleAnswerChange, zoom]);

  return (
    <Box
      ref={scrollContainerRef}
      sx={{
        height: '100%',
        width: '100%',
        backgroundColor: '#FFFFFF',
        overflow: 'auto',
        padding: '0 !important',
        margin: '0 !important',
        paddingLeft: '0 !important',
        paddingRight: '0 !important',
        marginLeft: '0 !important',
        marginRight: '0 !important',
        '&::-webkit-scrollbar': {
          display: 'none'
        },
        msOverflowStyle: 'none',
        scrollbarWidth: 'none',
        overscrollBehavior: 'contain',
        touchAction: 'pan-y'
      }}
    >
      {/* Glass Header Bar for PC */}
      {!isMobile && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 65,
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(40px) saturate(180%)',
            WebkitBackdropFilter: 'blur(40px) saturate(180%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px rgba(31, 38, 135, 0.15)',
            zIndex: 10,
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.02) 100%)',
              pointerEvents: 'none'
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '1px',
              background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent)',
              pointerEvents: 'none'
            }
          }}
        >
          <Box
            onClick={() => onElementSelect && onElementSelect('logo')}
            sx={{
              position: 'relative',
              display: 'inline-block',
              cursor: 'pointer'
            }}
          >
            <img
              src={currentLogoUrl}
              alt="Logo"
              style={{
                width: '140px',
                height: '55px',
                objectFit: 'contain',
                position: 'relative',
                zIndex: 1,
                filter: 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.1))',
                pointerEvents: 'none'
              }}
            />
            {selectedElement === 'logo' && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(94, 23, 235, 0.2)',
                  borderRadius: 1,
                  zIndex: 2,
                  pointerEvents: 'none'
                }}
              />
            )}
          </Box>
        </Box>
      )}

      {/* Header Image Section */}
      <Box
        sx={{
          position: 'relative',
          height: isMobile ? 250 : 270,
          overflow: 'hidden',
          width: '100%',
          marginTop: isMobile ? 0 : '65px',
          cursor: 'pointer'
        }}
        onClick={() => onElementSelect && onElementSelect('header')}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `url(${currentHeaderImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            transition: 'all 0.2s ease',
            '&:hover': {
              transform: 'scale(1.02)',
              filter: 'brightness(1.1)'
            }
          }}
        />

        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: isMobile 
              ? 'linear-gradient(to bottom, transparent 0%, rgba(255, 255, 255, 0.8) 70%, rgba(255, 255, 255, 1) 100%)'
              : 'linear-gradient(to bottom, transparent 0%, rgba(255, 255, 255, 0.6) 85%, rgba(255, 255, 255, 1) 100%)'
          }}
        />

        {selectedElement === 'header' && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(94, 23, 235, 0.2)',
              zIndex: 3,
              pointerEvents: 'none'
            }}
          />
        )}

        {isMobile && (
          <Box
            sx={{
              position: 'absolute',
              top: 20,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 120,
              height: 50,
              zIndex: 2
            }}
          >
            <img
              src={currentLogoUrl}
              alt="Logo"
              onClick={(e) => {
                e.stopPropagation();
                onElementSelect && onElementSelect('logo');
              }}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'scale(1.1)';
                e.target.style.filter = 'drop-shadow(0 4px 12px rgba(94, 23, 235, 0.3))';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'scale(1)';
                e.target.style.filter = 'none';
              }}
            />
            {selectedElement === 'logo' && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(94, 23, 235, 0.2)',
                  borderRadius: 1,
                  zIndex: 2,
                  pointerEvents: 'none'
                }}
              />
            )}
          </Box>
        )}
      </Box>

      {/* Content Area */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: 'auto',
          px: isMobile ? 4.5 : 5.5,
          py: isMobile ? 0 : 2,
          overflow: 'visible',
          backgroundColor: '#FFFFFF',
          maxWidth: isMobile ? '100%' : '900px',
          margin: '0 auto',
          width: '100%'
        }}
      >
          {/* Questions Content with Drop Zone */}
          <Box 
            ref={dropRef}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            sx={{ 
              flex: 1,
              position: 'relative',
              minHeight: displayQuestions.length === 0 ? '300px' : 'fit-content',
              overflow: 'visible'
            }}
          >
            {/* Empty State */}
            {displayQuestions.length === 0 && !isDragActive && (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: '#6b7280',
                  textAlign: 'center',
                  p: 4
                }}
              >
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 3,
                    border: '2px dashed #d1d5db'
                  }}
                >
                  <Typography variant="h3" sx={{ opacity: 0.7 }}>📝</Typography>
                </Box>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    mb: 2, 
                    fontWeight: 600,
                    color: '#374151'
                  }}
                >
                  質問を追加しましょう
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    mb: 3, 
                    maxWidth: 300,
                    lineHeight: 1.6,
                    color: '#6b7280'
                  }}
                >
                  左のツールから質問をドラッグして追加できます
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 3,
                    py: 1.5,
                    borderRadius: 2,
                    backgroundColor: 'rgba(94, 23, 235, 0.05)',
                    border: '1px solid rgba(94, 23, 235, 0.1)'
                  }}
                >
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: '#5e17eb',
                      fontWeight: 500
                    }}
                  >
                    質問タイプやテンプレートから選択できます
                  </Typography>
                </Box>
              </Box>
            )}

            {/* Questions List */}
            {displayQuestions.map((question, index) => (
              <Box key={question.id} sx={{ mb: '50px', position: 'relative' }}>
                {renderQuestion(question, index)}
              </Box>
            ))}

            {/* Navigation Section */}
            {displayQuestions.length > 0 && (
              <Box sx={{ py: 4 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Button
                    variant="contained"
                    sx={{
                      backgroundColor: stringToColor(themeColor),
                      color: 'white',
                      width: 200,
                      height: 50,
                      borderRadius: '24px',
                      fontSize: '1rem',
                      fontWeight: 600,
                      textTransform: 'none',
                      fontFamily: '"Noto Sans JP", sans-serif',
                      boxShadow: 'none',
                      '&:hover': {
                        backgroundColor: stringToColor(themeColor),
                        opacity: 0.9,
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
                      }
                    }}
                  >
                    送信
                  </Button>
                </Box>
              </Box>
            )}
          </Box>
        </Box>
    </Box>
  );
};

export default PreviewQuestions;