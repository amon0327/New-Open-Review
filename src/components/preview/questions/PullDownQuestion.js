import React, { useState } from 'react';
import { Box, FormControl, Select, MenuItem } from '@mui/material';
import QuestionWrapper from '../common/QuestionWrapper';
import QuestionHeader from '../common/QuestionHeader';
import { stringToColor } from '../utils/colorUtils';

const PullDownQuestion = ({ question, themeColor, currentQuestion, totalQuestions, onAnswerChange, zoom = 1 }) => {
  const [selectedValue, setSelectedValue] = useState('');

  const handleValueChange = (event) => {
    const value = event.target.value;
    setSelectedValue(value);
    onAnswerChange(question.id, {
      questionTypeId: 8,
      answer: value
    });
  };

  const choices = question.choices ? JSON.parse(question.choices) : [];

  return (
    <QuestionWrapper>
      <QuestionHeader 
        question={question}
        themeColor={themeColor}
        currentQuestion={currentQuestion}
        totalQuestions={totalQuestions}
      />

      <Box sx={{ width: '100%', maxWidth: 400 }}>
        <FormControl fullWidth>
          <Select
            value={selectedValue}
            onChange={handleValueChange}
            displayEmpty
            sx={{
              backgroundColor: '#FFFFFF',
              borderRadius: '4px',
              fontFamily: '"Noto Sans JP", sans-serif',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#E5E7EB',
                borderWidth: 1
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: '#E5E7EB'
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: stringToColor(themeColor),
                borderWidth: 1
              }
            }}
          >
            <MenuItem value="" disabled>
              選択してください
            </MenuItem>
            {choices.map((choice, index) => (
              <MenuItem key={index} value={choice}>
                {choice}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
    </QuestionWrapper>
  );
};

export default PullDownQuestion;