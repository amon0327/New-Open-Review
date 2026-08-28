import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';
import QuestionWrapper from '../common/QuestionWrapper';
import QuestionHeader from '../common/QuestionHeader';
import { stringToColor } from '../utils/colorUtils';

const LinearScaleQuestion = ({ question, themeColor, currentQuestion, totalQuestions, onAnswerChange }) => {
  const [selectedValue, setSelectedValue] = useState(null);

  // 質問タイプ9（推奨度スコア）の判定
  const isLoyaltyScore = question.question_type_id === 9 || question.question_types_id === 9;

  const handleValueSelect = (value) => {
    const newValue = selectedValue === value ? null : value;
    setSelectedValue(newValue);
    onAnswerChange(question.id, {
      questionTypeId: isLoyaltyScore ? 9 : 7,
      answer: newValue ? newValue.toString() : null
    });
  };

  // scale_settingsまたはscale_labelsから読み取り
  const scaleData = question.scale_settings ? JSON.parse(question.scale_settings) : 
                    question.scale_labels ? JSON.parse(question.scale_labels) : {};
  const minLabel = scaleData.minLabel || scaleData.min_label || '';
  const maxLabel = scaleData.maxLabel || scaleData.max_label || '';
  const minValue = scaleData.minValue !== null && scaleData.minValue !== undefined ? scaleData.minValue : (isLoyaltyScore ? 0 : 1);
  const maxValue = scaleData.maxValue !== null && scaleData.maxValue !== undefined ? scaleData.maxValue : (isLoyaltyScore ? 10 : 5);
  
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
      <Box sx={{ width: '100%', maxWidth: isLoyaltyScore ? 600 : 400, display: 'flex', justifyContent: 'space-between', mb: 3 }}>
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
      <Box sx={{ 
        width: '100%', 
        maxWidth: isLoyaltyScore ? 600 : 400, 
        display: 'flex', 
        justifyContent: isLoyaltyScore ? 'center' : 'space-between', 
        alignItems: 'center' 
      }}>
        {isLoyaltyScore ? (
          // 推奨度スコア（質問タイプ9）: 連結された長方形ボックス
          <Box sx={{ display: 'flex', gap: 0, px: 1 }}>
            {scaleOptions.map((value, index) => (
              <Box
                key={value}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  minWidth: 'auto'
                }}
              >
                <Box
                  onClick={() => handleValueSelect(value)}
                  sx={{
                    width: 28,
                    height: 36,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: `2px solid ${stringToColor(themeColor)}`,
                    borderRight: index === scaleOptions.length - 1 ? `2px solid ${stringToColor(themeColor)}` : 'none',
                    borderRadius: 0,
                    backgroundColor: selectedValue === value ? stringToColor(themeColor) : 'transparent',
                    color: selectedValue === value ? 'white' : stringToColor(themeColor),
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-in-out',
                    fontFamily: '"Noto Sans JP", sans-serif',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    '&:hover': {
                      backgroundColor: selectedValue === value 
                        ? stringToColor(themeColor) 
                        : `${stringToColor(themeColor)}15`
                    }
                  }}
                >
                  {value}
                </Box>
              </Box>
            ))}
          </Box>
        ) : (
          // 線形スケール（質問タイプ7）: 円形ボタン
          scaleOptions.map((value) => (
            <Box key={value}>
              <Box
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
              {/* Scale Numbers */}
              <Typography
                variant="body2"
                sx={{
                  color: '#57636C',
                  fontSize: '0.75rem',
                  fontFamily: '"Noto Sans JP", sans-serif',
                  width: 24,
                  textAlign: 'center',
                  mt: 1
                }}
              >
                {value}
              </Typography>
            </Box>
          ))
        )}
      </Box>
    </QuestionWrapper>
  );
};

export default LinearScaleQuestion;