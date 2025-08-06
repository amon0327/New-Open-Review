import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';
import QuestionWrapper from '../common/QuestionWrapper';
import QuestionHeader from '../common/QuestionHeader';
import { stringToColor } from '../utils/colorUtils';

const MultipleChoiceMatrixQuestion = ({ question, themeColor, currentQuestion, totalQuestions, onAnswerChange }) => {
  const [selectedAnswers, setSelectedAnswers] = useState({});

  // 暫定的な簡単な実装
  return (
    <QuestionWrapper>
      <QuestionHeader 
        question={question}
        themeColor={themeColor}
        currentQuestion={currentQuestion}
        totalQuestions={totalQuestions}
      />

      <Box sx={{ width: '100%', maxWidth: 600, textAlign: 'center' }}>
        <Typography variant="body1" sx={{ color: '#666', fontFamily: '"Noto Sans JP", sans-serif' }}>
          複数選択マトリックス質問（実装中）
        </Typography>
      </Box>
    </QuestionWrapper>
  );
};

export default MultipleChoiceMatrixQuestion;