import React, { useState } from 'react';
import { Box, Button } from '@mui/material';
import QuestionWrapper from '../common/QuestionWrapper';
import QuestionHeader from '../common/QuestionHeader';
import { stringToColor, colorWithLightOpacity, colorWithBorderOpacity } from '../utils/colorUtils';

// Single Choice Matrix Question Component
const SingleChoiceMatrixQuestion = ({ question, themeColor, currentQuestion, totalQuestions, onAnswerChange }) => {
  const [selectedChoice, setSelectedChoice] = useState(null);

  const handleChoiceSelect = (choiceValue) => {
    setSelectedChoice(choiceValue);
    onAnswerChange(question.id, {
      questionTypeId: 5,
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

      <Box 
        sx={{ 
          width: '100%',
          maxWidth: { xs: '320px', sm: '400px', md: '500px' },
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 1.5,
          justifyContent: 'center'
        }}
      >
        {choices.map((choice, index) => (
          <Button
            key={index}
            variant="outlined"
            onClick={() => handleChoiceSelect(choice)}
            disableRipple
            sx={{
              width: { xs: 'calc(50% - 6px)', sm: 'calc(50% - 6px)', md: 'calc(50% - 6px)' },
              height: { xs: 40, md: 48 },
              borderRadius: '12px',
              fontSize: { xs: '0.7rem', md: '0.875rem' },
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

export default SingleChoiceMatrixQuestion;