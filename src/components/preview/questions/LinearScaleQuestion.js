import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';
import QuestionWrapper from '../common/QuestionWrapper';
import QuestionHeader from '../common/QuestionHeader';
import { stringToColor } from '../utils/colorUtils';

const LinearScaleQuestion = ({ question, themeColor, currentQuestion, totalQuestions, onAnswerChange }) => {
  const [selectedValue, setSelectedValue] = useState(null);

  const handleValueSelect = (value) => {
    setSelectedValue(value);
    onAnswerChange(question.id, {
      questionTypeId: 7,
      answer: value.toString()
    });
  };

  // scale_settingsまたはscale_labelsから読み取り
  const scaleData = question.scale_settings ? JSON.parse(question.scale_settings) : 
                    question.scale_labels ? JSON.parse(question.scale_labels) : {};
  const minLabel = scaleData.minLabel || scaleData.min_label || '';
  const maxLabel = scaleData.maxLabel || scaleData.max_label || '';
  const minValue = scaleData.minValue !== null && scaleData.minValue !== undefined ? scaleData.minValue : 1;
  const maxValue = scaleData.maxValue !== null && scaleData.maxValue !== undefined ? scaleData.maxValue : 5;
  
  // 動的にスケール配列を生成
  const scaleOptions = [];
  for (let i = minValue; i <= maxValue; i++) {
    scaleOptions.push(i);
  }

  return (
    <QuestionWrapper>
      <QuestionHeader 
        question={question}
        themeColor={themeColor}
        currentQuestion={currentQuestion}
        totalQuestions={totalQuestions}
      />

      {/* Scale Labels */}
      <Box sx={{ width: '100%', maxWidth: 400, display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography 
          variant="body2" 
          sx={{ 
            color: '#57636C', 
            fontSize: '0.875rem',
            fontFamily: '"Noto Sans JP", sans-serif'
          }}
        >
          {minLabel}
        </Typography>
        <Typography 
          variant="body2" 
          sx={{ 
            color: '#57636C', 
            fontSize: '0.875rem',
            fontFamily: '"Noto Sans JP", sans-serif'
          }}
        >
          {maxLabel}
        </Typography>
      </Box>

      {/* Scale Options */}
      <Box sx={{ width: '100%', maxWidth: 400, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {scaleOptions.map((value) => (
          <Box
            key={value}
            onClick={() => handleValueSelect(value)}
            sx={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              border: `2px solid ${stringToColor(themeColor)}`,
              backgroundColor: selectedValue === value ? stringToColor(themeColor) : 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                transform: 'scale(1.1)'
              }
            }}
          >
            {selectedValue === value && (
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: 'white'
                }}
              />
            )}
          </Box>
        ))}
      </Box>

      {/* Scale Numbers */}
      <Box sx={{ width: '100%', maxWidth: 400, display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
        {scaleOptions.map((value) => (
          <Typography
            key={value}
            variant="body2"
            sx={{
              color: '#57636C',
              fontSize: '0.75rem',
              fontFamily: '"Noto Sans JP", sans-serif',
              width: 24,
              textAlign: 'center'
            }}
          >
            {value}
          </Typography>
        ))}
      </Box>
    </QuestionWrapper>
  );
};

export default LinearScaleQuestion;