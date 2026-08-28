import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Paper,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { stringToColor } from '../../lib/supabase';

const ComparisonQuestion = ({ 
  question, 
  themeColor, 
  currentQuestion, 
  totalQuestions, 
  onAnswerChange 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [selectedOption, setSelectedOption] = useState(null);

  // Initialize with existing answer if available
  useEffect(() => {
    if (question.existingAnswer) {
      setSelectedOption(question.existingAnswer);
    }
  }, [question.existingAnswer]);

  const handleOptionSelect = (option) => {
    setSelectedOption(option);
    
    onAnswerChange(question.id, {
      questionTypeId: question.question_type_id,
      answer: option
    });
  };

  // Get option texts from question config
  const optionAText = question.option_a_text || 'オプションA';
  const optionBText = question.option_b_text || 'オプションB';
  const optionALabel = question.option_a_label || 'A';
  const optionBLabel = question.option_b_label || 'B';

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

        {/* Options */}
        <Box sx={{ 
          width: '100%', 
          maxWidth: 800,
          display: 'flex',
          flexDirection: 'column',
          gap: 2
        }}>
          {/* Option A */}
          <Paper
            elevation={selectedOption === 'A' ? 8 : 2}
            onClick={() => handleOptionSelect('A')}
            sx={{
              p: isMobile ? 2 : 3,
              cursor: 'pointer',
              borderRadius: '12px',
              border: selectedOption === 'A' ? `3px solid ${stringToColor(themeColor)}` : '3px solid transparent',
              backgroundColor: selectedOption === 'A' ? `${stringToColor(themeColor)}08` : 'white',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: theme.shadows[4]
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography
                sx={{
                  color: stringToColor(themeColor),
                  fontSize: isMobile ? '1rem' : '1.125rem',
                  fontFamily: '"Noto Sans JP", sans-serif',
                  fontWeight: 700,
                  minWidth: 'fit-content'
                }}
              >
                {optionALabel}
              </Typography>
              <Typography
                sx={{
                  color: '#14181B',
                  fontSize: isMobile ? '0.875rem' : '1rem',
                  fontFamily: '"Noto Sans JP", sans-serif',
                  lineHeight: 1.6,
                  fontWeight: selectedOption === 'A' ? 600 : 400,
                  flex: 1
                }}
              >
                {optionAText}
              </Typography>
            </Box>
          </Paper>

          {/* Option B */}
          <Paper
            elevation={selectedOption === 'B' ? 8 : 2}
            onClick={() => handleOptionSelect('B')}
            sx={{
              p: isMobile ? 2 : 3,
              cursor: 'pointer',
              borderRadius: '12px',
              border: selectedOption === 'B' ? `3px solid ${stringToColor(themeColor)}` : '3px solid transparent',
              backgroundColor: selectedOption === 'B' ? `${stringToColor(themeColor)}08` : 'white',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: theme.shadows[4]
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography
                sx={{
                  color: stringToColor(themeColor),
                  fontSize: isMobile ? '1rem' : '1.125rem',
                  fontFamily: '"Noto Sans JP", sans-serif',
                  fontWeight: 700,
                  minWidth: 'fit-content'
                }}
              >
                {optionBLabel}
              </Typography>
              <Typography
                sx={{
                  color: '#14181B',
                  fontSize: isMobile ? '0.875rem' : '1rem',
                  fontFamily: '"Noto Sans JP", sans-serif',
                  lineHeight: 1.6,
                  fontWeight: selectedOption === 'B' ? 600 : 400,
                  flex: 1
                }}
              >
                {optionBText}
              </Typography>
            </Box>
          </Paper>
        </Box>
      </Box>
    </Container>
  );
};

export default ComparisonQuestion;