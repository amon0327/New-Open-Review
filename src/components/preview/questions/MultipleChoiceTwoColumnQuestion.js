import React, { useState } from 'react';
import { Box, Button, Grid } from '@mui/material';
import QuestionWrapper from '../common/QuestionWrapper';
import QuestionHeader from '../common/QuestionHeader';
import { stringToColor, colorWithLightOpacity, colorWithBorderOpacity } from '../utils/colorUtils';

const MultipleChoiceTwoColumnQuestion = ({ question, themeColor, currentQuestion, totalQuestions, onAnswerChange }) => {
  const [selectedChoices, setSelectedChoices] = useState([]);

  const handleChoiceToggle = (choiceValue) => {
    const newSelectedChoices = selectedChoices.includes(choiceValue)
      ? selectedChoices.filter(choice => choice !== choiceValue)
      : [...selectedChoices, choiceValue];
    
    setSelectedChoices(newSelectedChoices);
    onAnswerChange(question.id, {
      questionTypeId: 10, // 新しいquestionTypeId
      answers: newSelectedChoices
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
        <Grid container spacing={1}>
          {choices.map((choice, index) => (
            <Grid item xs={6} key={index}>
              <Button
                variant="outlined"
                onClick={() => handleChoiceToggle(choice)}
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
                  backgroundColor: selectedChoices.includes(choice) 
                    ? stringToColor(themeColor)
                    : colorWithLightOpacity(stringToColor(themeColor)),
                  color: selectedChoices.includes(choice) ? 'white' : '#14181B',
                  borderColor: colorWithBorderOpacity(stringToColor(themeColor)),
                  minHeight: '48px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  wordBreak: 'break-word',
                  '&:hover': {
                    backgroundColor: selectedChoices.includes(choice) 
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
      </Box>
    </QuestionWrapper>
  );
};

export default MultipleChoiceTwoColumnQuestion;