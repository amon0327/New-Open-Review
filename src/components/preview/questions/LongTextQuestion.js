import React, { useState } from 'react';
import { Box, TextField } from '@mui/material';
import QuestionWrapper from '../common/QuestionWrapper';
import QuestionHeader from '../common/QuestionHeader';
import { stringToColor } from '../utils/colorUtils';

// Long Text Question Component
const LongTextQuestion = ({ question, themeColor, currentQuestion, totalQuestions, onAnswerChange }) => {
  const [answer, setAnswer] = useState('');

  const handleAnswerChange = (value) => {
    setAnswer(value);
    onAnswerChange(question.id, {
      questionTypeId: 2,
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
              backgroundColor: '#FFFFFF',
              borderRadius: '4px',
              fontFamily: '"Noto Sans JP", sans-serif',
              padding: 0,
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
    </QuestionWrapper>
  );
};

export default LongTextQuestion;