import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Button
} from '@mui/material';
import { stringToColor } from '../../lib/supabase';

const SingleChoiceQuestion = ({ 
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
      questionTypeId: 3,
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

          {/* Single Choice Options - Button Style */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%', alignItems: 'center' }}>
            {question.question_option_choices?.sort((a, b) => a.choice_number - b.choice_number).map((choice) => (
              <Button
                key={choice.id}
                variant="contained"
                onClick={() => handleChoiceChange(choice.choice_number)}
                sx={{
                  height: 56,
                  width: '100%',
                  maxWidth: 400,
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
                  fontSize: '1rem',
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
            ))}
          </Box>
        </Box>
      </Container>
    </>
  );
};

export default SingleChoiceQuestion;