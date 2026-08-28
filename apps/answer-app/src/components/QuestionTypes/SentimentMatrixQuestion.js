import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  IconButton,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { stringToColor } from '../../lib/supabase';

const SentimentMatrixQuestion = ({ 
  question, 
  themeColor, 
  currentQuestion, 
  totalQuestions, 
  onAnswerChange 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [selectedValues, setSelectedValues] = useState({});

  useEffect(() => {
    // Initialize with existing answers if available
    if (question.existingAnswer) {
      try {
        const parsed = JSON.parse(question.existingAnswer);
        setSelectedValues(parsed);
      } catch {
        setSelectedValues({});
      }
    }
  }, [question.existingAnswer]);

  const handleValueChange = (itemId, value) => {
    // If the same value is clicked, don't allow deselection
    if (selectedValues[itemId] === value) {
      return;
    }
    
    const newValues = {
      ...selectedValues,
      [itemId]: value
    };
    setSelectedValues(newValues);
    
    // Only include non-null values in the answer
    const filteredValues = Object.fromEntries(
      Object.entries(newValues).filter(([_, v]) => v !== null)
    );
    
    onAnswerChange(question.id, {
      questionTypeId: question.question_type_id,
      answer: JSON.stringify(filteredValues)
    });
  };

  // Sentiment options with emojis
  const sentimentOptions = [
    {
      value: 'negative',
      emoji: '😞',
      label: '不満',
      color: '#EF4444'
    },
    {
      value: 'neutral',
      emoji: '😐',
      label: '普通',
      color: '#6B7280'
    },
    {
      value: 'positive',
      emoji: '😊',
      label: '満足',
      color: '#10B981'
    }
  ];

  // Matrix items from question configuration
  const matrixItems = question.matrix_items || [];

  return (
    <Container maxWidth={false} sx={{ width: '100%', px: 0 }}>
      <Box sx={{ pt: '50px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* Question Header */}
        <Box sx={{ mb: '30px', width: '100%', textAlign: 'center' }}>
          {/* Required Indicator */}
          {question.is_required && (
            <Typography
              variant="body2"
              sx={{
                color: '#57636C',
                fontSize: '0.875rem',
                fontFamily: '"Noto Sans JP", sans-serif',
                mb: 1
              }}
            >
              必須
            </Typography>
          )}

          {/* Question Text */}
          <Typography
            variant="h6"
            sx={{
              color: '#14181B',
              fontSize: '1.25rem',
              fontWeight: 600,
              fontFamily: '"Noto Sans JP", sans-serif',
              lineHeight: 1.4,
              mb: 2
            }}
          >
            {question.question_text}
          </Typography>

          {/* Validation Error Message */}
          {question.hasValidationError && (
            <Typography
              variant="body2"
              sx={{
                color: '#F44336',
                fontSize: '0.875rem',
                fontFamily: '"Noto Sans JP", sans-serif',
                mb: 2,
                fontWeight: 500
              }}
            >
              {question.validationMessage}
            </Typography>
          )}

        </Box>

        {/* Matrix Container */}
        <Box sx={{ 
          width: '100%', 
          maxWidth: isMobile ? '100%' : 800,
          overflowX: isMobile ? 'auto' : 'visible',
          px: isMobile ? 1 : 0
        }}>
          {/* Header Row - Sentiment Labels */}
          <Box sx={{ 
            display: 'flex', 
            mb: 2,
            alignItems: 'center'
          }}>
            {/* Empty space for question column */}
            <Box sx={{ 
              flex: isMobile ? 1 : '0 0 50%',
              pr: isMobile ? 1 : 2
            }} />
            
            {/* Labels */}
            <Box sx={{ 
              display: 'flex',
              flex: isMobile ? '0 0 auto' : 1,
              justifyContent: isMobile ? 'flex-end' : 'space-around',
              gap: isMobile ? 1 : 0
            }}>
              {sentimentOptions.map((option) => (
                <Box
                  key={option.value}
                  sx={{
                    flex: isMobile ? '0 0 auto' : 1,
                    display: 'flex',
                    justifyContent: 'center',
                    width: isMobile ? 40 : 60,
                    minWidth: isMobile ? 40 : 60,
                    alignItems: 'center'
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: isMobile ? '0.875rem' : '1rem',
                      color: '#374151',
                      fontWeight: 700,
                      fontFamily: '"Noto Sans JP", sans-serif',
                      textAlign: 'center'
                    }}
                  >
                    {option.label}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>

          {/* Matrix Items */}
          {matrixItems.map((item, index) => (
            <Box
              key={item.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                py: 2,
                px: 1,
                borderRadius: '12px',
                mb: 1,
                backgroundColor: index % 2 === 0 ? '#F9FAFB' : 'transparent',
                '&:hover': {
                  backgroundColor: '#F3F4F6'
                }
              }}
            >
              {/* Question Text */}
              <Box sx={{ 
                flex: isMobile ? 1 : '0 0 50%',
                pr: isMobile ? 1 : 2
              }}>
                <Typography
                  sx={{
                    fontSize: isMobile ? '0.875rem' : '1rem',
                    color: '#14181B',
                    fontFamily: '"Noto Sans JP", sans-serif',
                    fontWeight: 400,
                    lineHeight: 1.5
                  }}
                >
                  {item.text}
                </Typography>
              </Box>

              {/* Sentiment Options */}
              <Box sx={{ 
                display: 'flex',
                flex: isMobile ? '0 0 auto' : 1,
                justifyContent: isMobile ? 'flex-end' : 'space-around',
                gap: 0,
                alignItems: 'center',
                overflow: 'visible'
              }}>
                {sentimentOptions.map((option) => (
                  <Box
                    key={option.value}
                    sx={{
                      flex: isMobile ? '0 0 auto' : 1,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      minWidth: isMobile ? 40 : 60
                    }}
                  >
                    <Box
                      onClick={() => handleValueChange(item.id, option.value)}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: isMobile ? 28 : 36,
                        height: isMobile ? 28 : 36,
                        cursor: 'pointer',
                        borderRadius: '8px',
                        transition: 'all 0.2s ease',
                        overflow: 'hidden',
                        '&:hover': {
                          transform: 'scale(1.1)'
                        }
                      }}
                    >
                      <Box
                        component="span"
                        sx={{
                          fontSize: isMobile ? '1.25rem' : '1.75rem',
                          lineHeight: 1,
                          display: 'inline-block',
                          opacity: selectedValues[item.id] === option.value ? 1 : 0.5,
                          filter: selectedValues[item.id] === option.value 
                            ? 'none' 
                            : 'grayscale(100%)',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {option.emoji}
                      </Box>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Container>
  );
};

export default SentimentMatrixQuestion;