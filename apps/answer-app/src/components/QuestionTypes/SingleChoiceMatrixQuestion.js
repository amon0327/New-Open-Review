import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Button
} from '@mui/material';
import { stringToColor } from '../../lib/supabase';

const SingleChoiceMatrixQuestion = ({ 
  question, 
  themeColor, 
  currentQuestion, 
  totalQuestions, 
  onAnswerChange 
}) => {
  const [selectedChoice, setSelectedChoice] = useState(null);

  useEffect(() => {
    // Initialize with existing answer if available
    if (question.existingAnswer) {
      setSelectedChoice(parseInt(question.existingAnswer));
    }
  }, [question.existingAnswer]);

  const handleChoiceChange = (choiceNumber) => {
    const newChoice = selectedChoice === choiceNumber ? null : choiceNumber;
    setSelectedChoice(newChoice);
    onAnswerChange(question.id, {
      questionTypeId: 5,
      answer: newChoice ? newChoice.toString() : null
    });
  };

  const colorWithLightOpacity = (color) => {
    const rgb = stringToColor(color);
    if (!rgb) return 'rgba(140, 82, 255, 0.08)';
    
    // Extract RGB values and add light opacity
    const hex = rgb.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    return `rgba(${r}, ${g}, ${b}, 0.08)`;
  };

  const colorWithBorderOpacity = (color) => {
    const rgb = stringToColor(color);
    if (!rgb) return 'rgba(140, 82, 255, 0.3)';
    
    // Extract RGB values and add border opacity
    const hex = rgb.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    return `rgba(${r}, ${g}, ${b}, 0.3)`;
  };

  return (
    <>
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

            {/* Detail Text */}
            {question.is_detail_enabled && question.question_detail_text && (
              <Typography
                variant="body2"
                sx={{
                  color: '#57636C',
                  fontSize: '0.875rem',
                  fontFamily: '"Noto Sans JP", sans-serif',
                  lineHeight: 1.6,
                  mb: 2
                }}
              >
                {question.question_detail_text}
              </Typography>
            )}

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

            {/* Progress Badge */}
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                height: 32,
                px: 2,
                backgroundColor: stringToColor(themeColor),
                borderRadius: '16px',
                mb: 2
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: 'white',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  fontFamily: '"Noto Sans JP", sans-serif'
                }}
              >
                {currentQuestion}/{totalQuestions}
              </Typography>
            </Box>
          </Box>

          {/* Single Choice Options - 2 Column Matrix */}
          <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <Box sx={{ 
              width: '100%', 
              maxWidth: { xs: '320px', sm: '400px', md: '500px' },
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              justifyContent: 'center'
            }}>
              {question.question_option_choices?.sort((a, b) => a.choice_number - b.choice_number).map((choice, index) => {
                const totalChoices = question.question_option_choices?.length || 0;
                const isLastOddItem = totalChoices % 2 === 1 && index === totalChoices - 1;
                
                return (
                  <Box
                    key={choice.id}
                    sx={{
                      width: isLastOddItem ? 'calc(50% - 4px)' : 'calc(50% - 4px)',
                      display: 'flex',
                      justifyContent: 'center'
                    }}
                  >
                    <Button
                      variant="contained"
                      onClick={() => handleChoiceChange(choice.choice_number)}
                      sx={{
                        height: { xs: 40, sm: 44, md: 48 },
                        width: '100%',
                        minWidth: { xs: '120px', sm: '140px', md: '160px' },
                        maxWidth: { xs: '150px', sm: '170px', md: '190px' },
                        fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' },
                        px: 1,
                        backgroundColor: selectedChoice === choice.choice_number 
                          ? stringToColor(themeColor)
                          : colorWithLightOpacity(themeColor),
                        color: selectedChoice === choice.choice_number 
                          ? 'white' 
                          : '#14181B',
                        border: `1px solid ${
                          selectedChoice === choice.choice_number 
                            ? stringToColor(themeColor)
                            : colorWithBorderOpacity(themeColor)
                        }`,
                        borderRadius: '8px',
                        fontFamily: '"Noto Sans JP", sans-serif',
                        fontWeight: selectedChoice === choice.choice_number ? 600 : 400,
                        textTransform: 'none',
                        justifyContent: 'center',
                        boxShadow: 'none',
                        '&:hover': {
                          backgroundColor: selectedChoice === choice.choice_number 
                            ? stringToColor(themeColor)
                            : colorWithLightOpacity(themeColor),
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                          transform: 'translateY(-1px)',
                          transition: 'all 0.2s ease-in-out'
                        }
                      }}
                    >
                      {choice.choice_name}
                    </Button>
                  </Box>
                );
              })}
            </Box>
          </Box>
        </Box>
      </Container>
    </>
  );
};

export default SingleChoiceMatrixQuestion;