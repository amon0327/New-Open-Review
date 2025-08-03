import React, { useState } from 'react';
import { Box, Button, Grid, Typography } from '@mui/material';
import QuestionWrapper from '../common/QuestionWrapper';
import QuestionHeader from '../common/QuestionHeader';
import { stringToColor, colorWithLightOpacity, colorWithBorderOpacity } from '../utils/colorUtils';

const SingleChoiceTwoColumnQuestion = ({ question, themeColor, currentQuestion, totalQuestions, onAnswerChange }) => {
  const [selectedChoice, setSelectedChoice] = useState(null);

  const handleChoiceSelect = (choiceValue) => {
    setSelectedChoice(choiceValue);
    onAnswerChange(question.id, {
      questionTypeId: 9, // 新しいquestionTypeId
      answer: choiceValue
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

      <Box sx={{ width: '100%', maxWidth: 500 }}>
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
          <Grid container spacing={1}>
            {choices.map((choice, index) => (
              <Grid item xs={6} key={index}>
                <Button
                  variant="outlined"
                  onClick={() => handleChoiceSelect(choice)}
                  disableRipple
                  sx={{
                    width: '100%',
                    py: 1.5,
                    px: 2,
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    textTransform: 'none',
                    fontFamily: '"Noto Sans JP", sans-serif',
                    backgroundColor: selectedChoice === choice 
                      ? stringToColor(themeColor)
                      : colorWithLightOpacity(stringToColor(themeColor)),
                    color: selectedChoice === choice ? 'white' : '#14181B',
                    borderColor: colorWithBorderOpacity(stringToColor(themeColor)),
                    minHeight: '48px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    wordBreak: 'break-word',
                    '&:hover': {
                      backgroundColor: selectedChoice === choice 
                        ? stringToColor(themeColor)
                        : colorWithLightOpacity(stringToColor(themeColor)),
                      borderColor: stringToColor(themeColor),
                      transform: 'translateY(-1px)',
                      boxShadow: `0 3px 8px ${colorWithBorderOpacity(stringToColor(themeColor))}`
                    },
                    transition: 'all 0.2s ease-in-out'
                  }}
                >
                  {choice}
                </Button>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </QuestionWrapper>
  );
};

export default SingleChoiceTwoColumnQuestion;