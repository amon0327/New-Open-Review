import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Checkbox
} from '@mui/material';
import { stringToColor } from '../../lib/supabase';

const LinearScaleQuestion = ({ 
  question, 
  themeColor, 
  currentQuestion, 
  totalQuestions, 
  onAnswerChange 
}) => {
  const [selectedValue, setSelectedValue] = useState(null);

  useEffect(() => {
    // Initialize with existing answer if available
    if (question.existingAnswer) {
      setSelectedValue(parseInt(question.existingAnswer));
    }
  }, [question.existingAnswer]);

  const handleValueChange = (value) => {
    const newValue = selectedValue === value ? null : value;
    setSelectedValue(newValue);
    onAnswerChange(question.id, {
      questionTypeId: question.question_types_id,
      answer: newValue ? newValue.toString() : null
    });
  };

  // Get linear scale settings (min/max text and loyalty flag)
  const scaleSettings = question.question_option_linear_scale?.[0];
  const minText = scaleSettings?.scale_min_label || 'そう思わない';
  const maxText = scaleSettings?.scale_max_label || 'そう思う';
  const isLoyaltyScore = question.question_type_id === 9 || question.question_types_id === 9;
  const is7PointScale = question.question_type_id === 7 || question.question_types_id === 7;
  
  // Get scale range from settings if available
  const minScale = scaleSettings?.scale_min_number || 1;
  const maxScale = scaleSettings?.scale_max_number || 5;
  
  // Debug logging (commented out)
  // console.log('LinearScaleQuestion Debug:', {
  //   question_type_id: question.question_type_id,
  //   question_types_id: question.question_types_id,
  //   isLoyaltyScore: isLoyaltyScore,
  //   is7PointScale: is7PointScale,
  //   scaleSettings: scaleSettings,
  //   minScale: minScale,
  //   maxScale: maxScale
  // });

  // Linear scale values - use scale settings to determine range
  let scaleValues;
  if (isLoyaltyScore) {
    scaleValues = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  } else if (scaleSettings && minScale !== undefined && maxScale !== undefined) {
    // Generate scale values based on min/max from settings
    scaleValues = [];
    for (let i = minScale; i <= maxScale; i++) {
      scaleValues.push(i);
    }
  } else {
    // Default to 1-5
    scaleValues = [1, 2, 3, 4, 5];
  }

  return (
    <>
      <Container maxWidth={false} sx={{ width: '100%', px: 0 }}>
        <Box sx={{ pt: '50px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* Question Header */}
          <Box sx={{ mb: '30px', width: '100%', textAlign: 'center' }}>
            {/* Required Indicator */}
            {question.is_required && (
              <Typography
                variant="body2"
                sx={{
                  color: '#57636C',
                  fontSize: '0.875rem',
                  fontFamily: '"Noto Sans JP", sans-serif',
                  mb: 1
                }}
              >
                必須
              </Typography>
            )}

            {/* Question Text */}
            <Typography
              variant="h6"
              sx={{
                color: '#14181B',
                fontSize: '1.25rem',
                fontWeight: 600,
                fontFamily: '"Noto Sans JP", sans-serif',
                lineHeight: 1.4,
                mb: 2
              }}
            >
              {question.question_text}
            </Typography>

            {/* Detail Text */}
            {question.is_detail_enabled && question.question_detail_text && (
              <Typography
                variant="body2"
                sx={{
                  color: '#57636C',
                  fontSize: '0.875rem',
                  fontFamily: '"Noto Sans JP", sans-serif',
                  lineHeight: 1.6,
                  mb: 2
                }}
              >
                {question.question_detail_text}
              </Typography>
            )}

            {/* Validation Error Message */}
            {question.hasValidationError && (
              <Typography
                variant="body2"
                sx={{
                  color: '#F44336',
                  fontSize: '0.875rem',
                  fontFamily: '"Noto Sans JP", sans-serif',
                  mb: 2,
                  fontWeight: 500
                }}
              >
                {question.validationMessage}
              </Typography>
            )}

            {/* Progress Badge */}
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                height: 32,
                px: 2,
                backgroundColor: stringToColor(themeColor),
                borderRadius: '16px',
                mb: 2
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: 'white',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  fontFamily: '"Noto Sans JP", sans-serif'
                }}
              >
                {currentQuestion}/{totalQuestions}
              </Typography>
            </Box>
          </Box>

          {/* Linear Scale Container */}
          <Box sx={{ width: '100%', maxWidth: isLoyaltyScore ? 600 : 400 }}>
            {/* Min/Max Labels */}
            <Box 
              sx={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                mb: 3,
                px: 1
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontSize: '0.875rem',
                  fontFamily: '"Noto Sans JP", sans-serif',
                  color: '#57636C'
                }}
              >
                {minText}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontSize: '0.875rem',
                  fontFamily: '"Noto Sans JP", sans-serif',
                  color: '#57636C'
                }}
              >
                {maxText}
              </Typography>
            </Box>

            {/* Scale Values */}
            <Box 
              sx={{ 
                display: 'flex', 
                justifyContent: isLoyaltyScore ? 'center' : 'space-between',
                alignItems: 'center',
                px: 1,
                gap: 0,
                flexWrap: 'nowrap'
              }}
            >
              {scaleValues.map((value) => (
                <Box
                  key={value}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    minWidth: isLoyaltyScore ? 'auto' : 'auto'
                  }}
                >
                  {isLoyaltyScore ? (
                    // Loyalty Score UI - Container with number
                    <Box
                      onClick={() => handleValueChange(value)}
                      sx={{
                        width: 28,
                        height: 36,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: `2px solid ${stringToColor(themeColor)}`,
                        borderRight: value === scaleValues[scaleValues.length - 1] ? `2px solid ${stringToColor(themeColor)}` : 'none',
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
                  ) : (
                    // Regular Linear Scale UI - Checkbox style
                    <>
                      <Checkbox
                        checked={selectedValue === value}
                        onChange={() => handleValueChange(value)}
                        icon={
                          <Box
                            sx={{
                              width: 24,
                              height: 24,
                              borderRadius: '50%',
                              border: `2px solid ${stringToColor(themeColor)}`,
                              backgroundColor: 'transparent',
                              transition: 'all 0.2s ease-in-out'
                            }}
                          />
                        }
                        checkedIcon={
                          <Box
                            sx={{
                              width: 24,
                              height: 24,
                              borderRadius: '50%',
                              border: `2px solid ${stringToColor(themeColor)}`,
                              backgroundColor: stringToColor(themeColor),
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.2s ease-in-out'
                            }}
                          >
                            <Box
                              sx={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                backgroundColor: 'white',
                                transition: 'all 0.2s ease-in-out'
                              }}
                            />
                          </Box>
                        }
                        sx={{
                          padding: '9px',
                          '&:hover': {
                            backgroundColor: 'transparent'
                          },
                          '&.Mui-focusVisible': {
                            backgroundColor: 'transparent'
                          },
                          '& .MuiTouchRipple-root': {
                            display: 'none'
                          }
                        }}
                        disableRipple
                      />
                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: '0.875rem',
                          fontFamily: '"Noto Sans JP", sans-serif',
                          color: '#14181B',
                          mt: 1,
                          fontWeight: selectedValue === value ? 600 : 400
                        }}
                      >
                        {value}
                      </Typography>
                    </>
                  )}
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      </Container>
    </>
  );
};

export default LinearScaleQuestion;