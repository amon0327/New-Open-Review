import React from 'react';
import { Box, Typography } from '@mui/material';

// Color utility function
const stringToColor = (colorString) => {
  if (!colorString) return '#8C52FF';
  return colorString;
};

// Question Header Component - 全質問タイプで共通使用
const QuestionHeader = ({ question, themeColor, currentQuestion, totalQuestions }) => {
  return (
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
      {question.detail_text && (
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
          {question.detail_text}
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
  );
};

export default QuestionHeader;