import React, { useState } from 'react';
import { Box, TextField } from '@mui/material';
import QuestionWrapper from '../common/QuestionWrapper';
import QuestionHeader from '../common/QuestionHeader';
import { stringToColor } from '../utils/colorUtils';

const ShortTextQuestion = ({ question, themeColor, currentQuestion, totalQuestions, onAnswerChange }) => {
  const [answer, setAnswer] = useState('');

  const handleAnswerChange = (value) => {
    setAnswer(value);
    onAnswerChange(question.id, {
      questionTypeId: 1,
      answer: value.trim() !== '' ? value : null
    });
  };

  return (
    <QuestionWrapper>
      <QuestionHeader 
        question={question}
        themeColor={themeColor}
        currentQuestion={currentQuestion}
        totalQuestions={totalQuestions}
      />

      {/* Short Text Input */}
      <Box sx={{ width: '100%', maxWidth: 400 }}>
        <TextField
          fullWidth
          value={answer}
          onChange={(e) => handleAnswerChange(e.target.value)}
          placeholder="回答を入力してください"
          variant="outlined"
          sx={{
            '& .MuiOutlinedInput-root': {
              backgroundColor: '#FFFFFF',
              borderRadius: '4px',
              fontFamily: '"Noto Sans JP", sans-serif',
              '& fieldset': {
                borderColor: '#E5E7EB',
                borderWidth: 1
              },
              '&:hover fieldset': {
                borderColor: '#E5E7EB'
              },
              '&.Mui-focused fieldset': {
                borderColor: stringToColor(themeColor),
                borderWidth: 1
              }
            },
            '& .MuiOutlinedInput-input': {
              padding: '12px 16px',
              fontSize: '1rem',
              fontFamily: '"Noto Sans JP", sans-serif'
            }
          }}
        />
      </Box>
    </QuestionWrapper>
  );
};

export default ShortTextQuestion;