import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  FormControl,
  Select,
  MenuItem
} from '@mui/material';
import { stringToColor } from '../../lib/supabase';

const PullDownQuestion = ({ 
  question, 
  themeColor, 
  currentQuestion, 
  totalQuestions, 
  onAnswerChange 
}) => {
  const [selectedChoice, setSelectedChoice] = useState('');

  useEffect(() => {
    // Initialize with existing answer if available
    if (question.existingAnswer) {
      setSelectedChoice(question.existingAnswer);
    }
  }, [question.existingAnswer]);

  const handleChoiceChange = (event) => {
    const choiceNumber = event.target.value;
    setSelectedChoice(choiceNumber);
    onAnswerChange(question.id, {
      questionTypeId: 8,
      answer: choiceNumber && choiceNumber !== '' ? choiceNumber.toString() : null
    });
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

          {/* Pull Down Select */}
          <Box sx={{ width: '100%', maxWidth: 400 }}>
            <FormControl fullWidth>
              <Select
                value={selectedChoice}
                onChange={handleChoiceChange}
                displayEmpty
                MenuProps={{
                  PaperProps: {
                    sx: {
                      mt: 1, // Add space above the dropdown menu
                      borderRadius: '8px',
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                      maxHeight: '280px', // Limit height to show ~7 items (40px per item)
                      // Modern scrollbar styling
                      '&::-webkit-scrollbar': {
                        width: '6px'
                      },
                      '&::-webkit-scrollbar-track': {
                        background: 'rgba(0, 0, 0, 0.02)',
                        borderRadius: '3px'
                      },
                      '&::-webkit-scrollbar-thumb': {
                        background: 'rgba(0, 0, 0, 0.1)',
                        borderRadius: '3px',
                        '&:hover': {
                          background: 'rgba(0, 0, 0, 0.15)'
                        }
                      },
                      // Firefox scrollbar styling
                      scrollbarWidth: 'thin',
                      scrollbarColor: 'rgba(0, 0, 0, 0.1) rgba(0, 0, 0, 0.02)'
                    }
                  }
                }}
                sx={{
                  backgroundColor: '#F1F4F8',
                  borderRadius: '4px',
                  fontFamily: '"Noto Sans JP", sans-serif',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: question.hasValidationError ? '#F44336' : '#E5E7EB',
                    borderWidth: question.hasValidationError ? 2 : 1
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: question.hasValidationError ? '#F44336' : '#E5E7EB'
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: question.hasValidationError ? '#F44336' : stringToColor(themeColor),
                    borderWidth: question.hasValidationError ? 2 : 1
                  },
                  '& .MuiSelect-select': {
                    padding: '12px 16px',
                    fontSize: '1rem',
                    fontFamily: '"Noto Sans JP", sans-serif'
                  }
                }}
              >
                <MenuItem value="" disabled>
                  <Typography
                    sx={{
                      fontSize: '1rem',
                      fontFamily: '"Noto Sans JP", sans-serif',
                      color: '#9CA3AF'
                    }}
                  >
                    選択してください
                  </Typography>
                </MenuItem>
                {question.question_option_choices?.sort((a, b) => a.choice_number - b.choice_number).map((choice) => (
                  <MenuItem key={choice.id} value={choice.choice_number}>
                    <Typography
                      sx={{
                        fontSize: '1rem',
                        fontFamily: '"Noto Sans JP", sans-serif',
                        color: '#14181B'
                      }}
                    >
                      {choice.choice_name}
                    </Typography>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>
      </Container>
    </>
  );
};

export default PullDownQuestion;