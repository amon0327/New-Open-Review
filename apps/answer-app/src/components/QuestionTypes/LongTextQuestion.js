import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Container
} from '@mui/material';
import { stringToColor } from '../../lib/supabase';

const LongTextQuestion = ({ 
  question, 
  themeColor, 
  currentQuestion, 
  totalQuestions, 
  onAnswerChange 
}) => {
  const [answer, setAnswer] = useState('');

  useEffect(() => {
    // Initialize with existing answer if available
    if (question.existingAnswer) {
      setAnswer(question.existingAnswer);
    }
  }, [question.existingAnswer]);

  const handleAnswerChange = (value) => {
    setAnswer(value);
    onAnswerChange(question.id, {
      questionTypeId: 2,
      answer: value.trim() !== '' ? value : null
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

          {/* Long Text Input */}
          <Box sx={{ width: '100%', maxWidth: 400 }}>
            <TextField
              fullWidth
              multiline
              minRows={5}
              maxRows={5}
              value={answer}
              onChange={(e) => handleAnswerChange(e.target.value)}
              placeholder="回答を入力してください"
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#F1F4F8',
                  borderRadius: '4px',
                  fontFamily: '"Noto Sans JP", sans-serif',
                  padding: 0,
                  '& fieldset': {
                    borderColor: question.hasValidationError ? '#F44336' : '#E5E7EB',
                    borderWidth: question.hasValidationError ? 2 : 1
                  },
                  '&:hover fieldset': {
                    borderColor: question.hasValidationError ? '#F44336' : '#E5E7EB'
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: question.hasValidationError ? '#F44336' : stringToColor(themeColor),
                    borderWidth: question.hasValidationError ? 2 : 1
                  }
                },
                '& .MuiOutlinedInput-input': {
                  padding: '12px 16px',
                  fontSize: '1rem',
                  fontFamily: '"Noto Sans JP", sans-serif',
                  lineHeight: 1.6
                },
                '& .MuiInputBase-inputMultiline': {
                  padding: '12px 16px !important',
                  fontSize: '1rem',
                  fontFamily: '"Noto Sans JP", sans-serif',
                  lineHeight: 1.6,
                  height: 'auto !important',
                  minHeight: 'calc(5 * 1.6em) !important',
                  maxHeight: 'calc(5 * 1.6em) !important'
                }
              }}
            />
          </Box>
        </Box>
      </Container>
    </>
  );
};

export default LongTextQuestion;