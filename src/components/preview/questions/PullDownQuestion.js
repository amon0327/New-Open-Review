import React, { useState } from 'react';
import { Box, FormControl, Select, MenuItem } from '@mui/material';
import QuestionWrapper from './QuestionWrapper';
import QuestionHeader from './QuestionHeader';
import { stringToColor } from '../../../utils/colorUtils';

const PullDownQuestion = ({ question, themeColor, currentQuestion, totalQuestions, onAnswerChange, zoom = 1 }) => {
  const [selectedValue, setSelectedValue] = useState('');

  const handleValueChange = (value) => {
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
            onChange={(e) => handleValueChange(e.target.value)}
            displayEmpty
            MenuProps={{
              PaperProps: {
                sx: {
                  mt: 0.5,
                  borderRadius: '8px',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                  maxHeight: '240px',
                  minWidth: '200px',
                  maxWidth: '400px',
                  '& .MuiMenuItem-root': {
                    fontSize: '1rem',
                    fontFamily: '"Noto Sans JP", sans-serif',
                    minHeight: '44px',
                    padding: '8px 16px',
                    '&:hover': {
                      backgroundColor: 'rgba(94, 23, 235, 0.08)'
                    }
                  },
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
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'rgba(0, 0, 0, 0.1) rgba(0, 0, 0, 0.02)'
                }
              }
            }}
            sx={{
              backgroundColor: '#FFFFFF',
              borderRadius: '4px',
              fontFamily: '"Noto Sans JP", sans-serif',
              fontSize: '1rem',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#E5E7EB',
                borderWidth: '1px'
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: '#E5E7EB'
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: stringToColor(themeColor),
                borderWidth: '1px'
              },
              '& .MuiSelect-select': {
                padding: '12px 16px',
                fontSize: '1rem',
                fontFamily: '"Noto Sans JP", sans-serif'
              }
            }}
          >
            <MenuItem 
              value="" 
              disabled
              sx={{
                fontSize: '1rem',
                fontFamily: '"Noto Sans JP", sans-serif',
                color: '#9CA3AF',
                minHeight: '44px',
                '&.Mui-disabled': {
                  opacity: 0.6
                }
              }}
            >
              選択してください
            </MenuItem>
            {choices.map((choice, index) => (
              <MenuItem 
                key={index} 
                value={choice}
                sx={{
                  fontSize: '1rem',
                  fontFamily: '"Noto Sans JP", sans-serif',
                  color: '#14181B',
                  minHeight: '44px',
                  padding: '10px 16px',
                  '&:hover': {
                    backgroundColor: 'rgba(94, 23, 235, 0.08)'
                  },
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(94, 23, 235, 0.12)',
                    '&:hover': {
                      backgroundColor: 'rgba(94, 23, 235, 0.16)'
                    }
                  }
                }}
              >
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