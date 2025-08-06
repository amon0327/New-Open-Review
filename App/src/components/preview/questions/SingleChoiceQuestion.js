import React, { useState } from 'react';
import { Box, Button } from '@mui/material';
import QuestionWrapper from '../common/QuestionWrapper';
import QuestionHeader from '../common/QuestionHeader';
import { stringToColor, colorWithLightOpacity, colorWithBorderOpacity } from '../utils/colorUtils';

const SingleChoiceQuestion = ({ question, themeColor, currentQuestion, totalQuestions, onAnswerChange }) => {
  const [selectedChoice, setSelectedChoice] = useState(null);

  const handleChoiceSelect = (choiceValue) => {
    setSelectedChoice(choiceValue);
    onAnswerChange(question.id, {
      questionTypeId: 3,
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

      <Box sx={{ width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {choices.map((choice, index) => (
          <Button
            key={index}
            variant="outlined"
            onClick={() => handleChoiceSelect(choice)}
            disableRipple
            sx={{
              py: 2,
              px: 3,
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: 500,
              textTransform: 'none',
              fontFamily: '"Noto Sans JP", sans-serif',
              backgroundColor: selectedChoice === choice 
                ? stringToColor(themeColor)
                : colorWithLightOpacity(stringToColor(themeColor)),
              color: selectedChoice === choice ? 'white' : '#14181B',
              borderColor: colorWithBorderOpacity(stringToColor(themeColor)),
              '&:hover': {
                backgroundColor: selectedChoice === choice 
                  ? stringToColor(themeColor)
                  : colorWithLightOpacity(stringToColor(themeColor)),
                borderColor: stringToColor(themeColor),
                transform: 'translateY(-1px)',
                boxShadow: `0 4px 12px ${colorWithBorderOpacity(stringToColor(themeColor))}`
              },
              transition: 'all 0.2s ease-in-out'
            }}
          >
            {choice}
          </Button>
        ))}
      </Box>
    </QuestionWrapper>
  );
};

export default SingleChoiceQuestion;