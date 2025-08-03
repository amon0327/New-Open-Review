import React, { useState } from 'react';
import { Box, FormControl, Select, MenuItem, Typography } from '@mui/material';
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
        {choices.length === 0 ? (
          // 選択肢が0個の場合のエラー表示
          <Box 
            sx={{ 
              p: 3,
              borderRadius: '12px',
              backgroundColor: '#FEF2F2',
              border: '2px dashed #FECACA',
              textAlign: 'center'
            }}
          >
            <Typography 
              sx={{ 
                color: '#DC2626',
                fontSize: '0.9rem',
                fontWeight: 500,
                mb: 1,
                fontFamily: '"Noto Sans JP", sans-serif'
              }}
            >
              ⚠️ 選択肢が設定されていません
            </Typography>
            <Typography 
              sx={{ 
                color: '#7F1D1D',
                fontSize: '0.8rem',
                fontFamily: '"Noto Sans JP", sans-serif'
              }}
            >
              右側の設定パネルから選択肢を追加してください
            </Typography>
          </Box>
        ) : (
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
        )}
      </Box>
    </QuestionWrapper>
  );
};

export default PullDownQuestion;