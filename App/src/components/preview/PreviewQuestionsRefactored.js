import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Box } from '@mui/material';
import {
  ShortTextQuestion,
  LongTextQuestion,
  SingleChoiceQuestion,
  MultipleChoiceQuestion,
  SingleChoiceTwoColumnQuestion,
  MultipleChoiceTwoColumnQuestion,
  SingleChoiceMatrixQuestion,
  MultipleChoiceMatrixQuestion,
  LinearScaleQuestion,
  PullDownQuestion
} from './questions';

const PreviewQuestionsRefactored = ({ 
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

  const renderQuestionByType = useCallback((question, questionNumber, totalQuestions) => {
    const commonProps = {
      question,
      themeColor,
      currentQuestion: questionNumber,
      totalQuestions,
      onAnswerChange: handleAnswerChange
    };

    switch (question.question_types_id) {
      case 1:
        return <ShortTextQuestion {...commonProps} />;
      case 2:
        return <LongTextQuestion {...commonProps} />;
      case 3:
        return <SingleChoiceQuestion {...commonProps} />;
      case 4:
        return <MultipleChoiceQuestion {...commonProps} />;
      case 5:
        return <SingleChoiceMatrixQuestion {...commonProps} />;
      case 6:
        return <MultipleChoiceMatrixQuestion {...commonProps} />;
      case 7:
        return <LinearScaleQuestion {...commonProps} />;
      case 8:
        return <PullDownQuestion {...commonProps} zoom={zoom} />;
      case 9:
        return <LinearScaleQuestion {...commonProps} />;
      case 10:
        return <MultipleChoiceTwoColumnQuestion {...commonProps} />;
      default:
        return <ShortTextQuestion {...commonProps} />;
    }
  }, [handleAnswerChange, themeColor, zoom]);

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

    return (
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
            transition: 'all 0.3s ease',
            overflow: 'hidden'
          }}
        >
          {renderQuestionByType(question, questionNumber, totalQuestions)}
        </Box>
      </Box>
    );
  }, [displayQuestions.length, selectedQuestionId, hoveredQuestionId, onQuestionSelect, renderQuestionByType]);

  const containerStyles = useMemo(() => ({
    width: isMobile ? '375px' : '800px',
    minHeight: isMobile ? '667px' : '600px',
    backgroundColor: '#FFFFFF',
    borderRadius: isMobile ? '20px' : '12px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
    overflow: 'hidden',
    position: 'relative',
    transform: `scale(${zoom})`,
    transformOrigin: 'center center',
    margin: '0 auto',
    border: isDragActive ? '3px dashed #5e17eb' : '1px solid #e0e7ff'
  }), [isMobile, zoom, isDragActive]);

  return (
    <Box
      ref={dropRef}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      sx={{
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        minHeight: '100%',
        padding: 4,
        zIndex: 1
      }}
    >
      <Box sx={containerStyles}>
        {/* Header Image */}
        <Box
          onClick={() => onElementSelect && onElementSelect('header')}
          sx={{
            width: '100%',
            height: isMobile ? '200px' : '250px',
            backgroundImage: `url(${currentHeaderImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            position: 'relative',
            cursor: 'pointer',
            border: selectedElement === 'header' ? '3px solid #5e17eb' : 'none',
            borderRadius: selectedElement === 'header' ? '8px' : '0',
            margin: selectedElement === 'header' ? '4px' : '0',
            transition: 'all 0.3s ease',
            '&:hover': {
              '&::after': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(94, 23, 235, 0.1)',
                pointerEvents: 'none'
              }
            }
          }}
        >
          {/* Logo */}
          <Box
            onClick={(e) => {
              e.stopPropagation();
              onElementSelect && onElementSelect('logo');
            }}
            sx={{
              position: 'absolute',
              top: '20px',
              left: '20px',
              cursor: 'pointer',
              border: selectedElement === 'logo' ? '3px solid #5e17eb' : 'none',
              borderRadius: selectedElement === 'logo' ? '8px' : '0',
              padding: selectedElement === 'logo' ? '4px' : '0',
              transition: 'all 0.3s ease',
              '&:hover': {
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  top: -2,
                  left: -2,
                  right: -2,
                  bottom: -2,
                  background: 'rgba(94, 23, 235, 0.2)',
                  borderRadius: '6px',
                  pointerEvents: 'none'
                }
              }
            }}
          >
            <Box
              component="img"
              src={currentLogoUrl}
              alt="Logo"
              sx={{
                height: isMobile ? '40px' : '50px',
                width: 'auto',
                objectFit: 'contain'
              }}
            />
          </Box>
        </Box>

        {/* Questions Container */}
        <Box
          ref={scrollContainerRef}
          sx={{
            flex: 1,
            overflowY: 'auto',
            maxHeight: isMobile ? '400px' : '500px',
            position: 'relative',
            '&::-webkit-scrollbar': {
              width: '6px'
            },
            '&::-webkit-scrollbar-track': {
              background: 'transparent'
            },
            '&::-webkit-scrollbar-thumb': {
              background: '#cbd5e1',
              borderRadius: '3px'
            }
          }}
        >
          <AnimatePresence mode="popLayout">
            {displayQuestions.map((question, index) => (
              <motion.div
                key={`question-${question.id}`}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                transition={{ 
                  duration: 0.4,
                  delay: Math.min(index * 0.1, 0.5)
                }}
              >
                {renderQuestion(question, index)}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Drag Active Indicator */}
          {isDragActive && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 10,
                pointerEvents: 'none'
              }}
            >
              <Box
                sx={{
                  padding: '20px 40px',
                  backgroundColor: 'rgba(94, 23, 235, 0.1)',
                  border: '2px dashed #5e17eb',
                  borderRadius: '12px',
                  color: '#5e17eb',
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  textAlign: 'center',
                  fontFamily: '"Noto Sans JP", sans-serif'
                }}
              >
                質問をここにドロップ
              </Box>
            </motion.div>
          )}

          {/* Empty State */}
          {displayQuestions.length === 0 && !isDragActive && (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '300px',
                color: '#9ca3af',
                textAlign: 'center',
                fontFamily: '"Noto Sans JP", sans-serif'
              }}
            >
              <Box sx={{ fontSize: '3rem', mb: 2 }}>📝</Box>
              <Box sx={{ fontSize: '1.1rem', fontWeight: 500, mb: 1 }}>
                質問がありません
              </Box>
              <Box sx={{ fontSize: '0.9rem' }}>
                左のサイドバーから質問を追加してください
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default PreviewQuestionsRefactored;