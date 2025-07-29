import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box,
  Container,
  Typography,
  Button,
  TextField,
  FormControl,
  Select,
  MenuItem
} from '@mui/material';

// Color utility function (AnswerAppと同じ)
const stringToColor = (colorString) => {
  if (!colorString) return '#8C52FF';
  return colorString;
};

const colorWithLightOpacity = (color, opacity = 8) => {
  return `${color}${Math.round(255 * opacity / 100).toString(16).padStart(2, '0')}`;
};

const colorWithBorderOpacity = (color, opacity = 30) => {
  return `${color}${Math.round(255 * opacity / 100).toString(16).padStart(2, '0')}`;
};

// Short Text Question Component - AnswerAppの完全コピー
const ShortTextQuestion = ({ question, themeColor, currentQuestion, totalQuestions, onAnswerChange }) => {
  const [answer, setAnswer] = useState('');

  const handleAnswerChange = (value) => {
    setAnswer(value);
    onAnswerChange(question.id, {
      questionTypeId: 1,
      answer: value.trim() !== '' ? value : null
    });
  };

  return (
    <>
      <Container 
        maxWidth={false} 
        disableGutters 
        sx={{ 
          width: '100%', 
          px: '0 !important', 
          mx: '0 !important',
          paddingLeft: '0 !important',
          paddingRight: '0 !important',
          marginLeft: '0 !important',
          marginRight: '0 !important'
        }}
      >
        <Box sx={{ pt: '50px', display: 'flex', flexDirection: 'column', alignItems: 'center', px: 0, mx: 0 }}>
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
            {question.detail_text && (
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
                {question.detail_text}
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

          {/* Short Text Input */}
          <Box sx={{ width: '100%', maxWidth: 400 }}>
            <TextField
              fullWidth
              value={answer}
              onChange={(e) => handleAnswerChange(e.target.value)}
              placeholder="回答を入力してください"
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#FFFFFF',
                  borderRadius: '4px',
                  fontFamily: '"Noto Sans JP", sans-serif',
                  '& fieldset': {
                    borderColor: '#E5E7EB',
                    borderWidth: 1
                  },
                  '&:hover fieldset': {
                    borderColor: '#E5E7EB'
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: stringToColor(themeColor),
                    borderWidth: 1
                  }
                },
                '& .MuiOutlinedInput-input': {
                  padding: '12px 16px',
                  fontSize: '1rem',
                  fontFamily: '"Noto Sans JP", sans-serif'
                }
              }}
            />
          </Box>
        </Box>
      </Container>
    </>
  );
};

// Long Text Question Component - AnswerAppの完全コピー
const LongTextQuestion = ({ question, themeColor, currentQuestion, totalQuestions, onAnswerChange }) => {
  const [answer, setAnswer] = useState('');

  const handleAnswerChange = (value) => {
    setAnswer(value);
    onAnswerChange(question.id, {
      questionTypeId: 2,
      answer: value.trim() !== '' ? value : null
    });
  };

  return (
    <>
      <Container 
        maxWidth={false} 
        disableGutters 
        sx={{ 
          width: '100%', 
          px: '0 !important', 
          mx: '0 !important',
          paddingLeft: '0 !important',
          paddingRight: '0 !important',
          marginLeft: '0 !important',
          marginRight: '0 !important'
        }}
      >
        <Box sx={{ pt: '50px', display: 'flex', flexDirection: 'column', alignItems: 'center', px: 0, mx: 0 }}>
          <Box sx={{ mb: '30px', width: '100%', textAlign: 'center' }}>
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

            {question.detail_text && (
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
                {question.detail_text}
              </Typography>
            )}

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

          <Box sx={{ width: '100%', maxWidth: 400 }}>
            <TextField
              fullWidth
              multiline
              minRows={5}
              maxRows={5}
              value={answer}
              onChange={(e) => handleAnswerChange(e.target.value)}
              placeholder="回答を入力してください"
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#FFFFFF',
                  borderRadius: '4px',
                  fontFamily: '"Noto Sans JP", sans-serif',
                  padding: 0,
                  '& fieldset': {
                    borderColor: '#E5E7EB',
                    borderWidth: 1
                  },
                  '&:hover fieldset': {
                    borderColor: '#E5E7EB'
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: stringToColor(themeColor),
                    borderWidth: 1
                  }
                },
                '& .MuiOutlinedInput-input': {
                  padding: '12px 16px',
                  fontSize: '1rem',
                  fontFamily: '"Noto Sans JP", sans-serif',
                  lineHeight: 1.6
                },
                '& .MuiInputBase-inputMultiline': {
                  padding: '12px 16px !important',
                  fontSize: '1rem',
                  fontFamily: '"Noto Sans JP", sans-serif',
                  lineHeight: 1.6,
                  height: 'auto !important',
                  minHeight: 'calc(5 * 1.6em) !important',
                  maxHeight: 'calc(5 * 1.6em) !important'
                }
              }}
            />
          </Box>
        </Box>
      </Container>
    </>
  );
};

// Single Choice Question Component - AnswerAppの完全コピー
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
    <>
      <Container 
        maxWidth={false} 
        disableGutters 
        sx={{ 
          width: '100%', 
          px: '0 !important', 
          mx: '0 !important',
          paddingLeft: '0 !important',
          paddingRight: '0 !important',
          marginLeft: '0 !important',
          marginRight: '0 !important'
        }}
      >
        <Box sx={{ pt: '50px', display: 'flex', flexDirection: 'column', alignItems: 'center', px: 0, mx: 0 }}>
          <Box sx={{ mb: '30px', width: '100%', textAlign: 'center' }}>
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

            {question.detail_text && (
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
                {question.detail_text}
              </Typography>
            )}

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
        </Box>
      </Container>
    </>
  );
};

// Multiple Choice Question Component - AnswerAppの完全コピー
const MultipleChoiceQuestion = ({ question, themeColor, currentQuestion, totalQuestions, onAnswerChange }) => {
  const [selectedChoices, setSelectedChoices] = useState([]);

  const handleChoiceToggle = (choiceValue) => {
    const newSelectedChoices = selectedChoices.includes(choiceValue)
      ? selectedChoices.filter(choice => choice !== choiceValue)
      : [...selectedChoices, choiceValue];
    
    setSelectedChoices(newSelectedChoices);
    onAnswerChange(question.id, {
      questionTypeId: 4,
      answers: newSelectedChoices
    });
  };

  const choices = question.choices ? JSON.parse(question.choices) : [];

  return (
    <>
      <Container 
        maxWidth={false} 
        disableGutters 
        sx={{ 
          width: '100%', 
          px: '0 !important', 
          mx: '0 !important',
          paddingLeft: '0 !important',
          paddingRight: '0 !important',
          marginLeft: '0 !important',
          marginRight: '0 !important'
        }}
      >
        <Box sx={{ pt: '50px', display: 'flex', flexDirection: 'column', alignItems: 'center', px: 0, mx: 0 }}>
          <Box sx={{ mb: '30px', width: '100%', textAlign: 'center' }}>
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

            {question.detail_text && (
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
                {question.detail_text}
              </Typography>
            )}

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

          <Box sx={{ width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {choices.map((choice, index) => (
              <Button
                key={index}
                variant="outlined"
                onClick={() => handleChoiceToggle(choice)}
                disableRipple
                sx={{
                  py: 2,
                  px: 3,
                  borderRadius: '12px',
                  fontSize: '1rem',
                  fontWeight: 500,
                  textTransform: 'none',
                  fontFamily: '"Noto Sans JP", sans-serif',
                  backgroundColor: selectedChoices.includes(choice) 
                    ? stringToColor(themeColor)
                    : colorWithLightOpacity(stringToColor(themeColor)),
                  color: selectedChoices.includes(choice) ? 'white' : '#14181B',
                  borderColor: colorWithBorderOpacity(stringToColor(themeColor)),
                  '&:hover': {
                    backgroundColor: selectedChoices.includes(choice) 
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
        </Box>
      </Container>
    </>
  );
};

// Single Choice Matrix Question Component - AnswerAppの完全コピー
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
    <>
      <Container 
        maxWidth={false} 
        disableGutters 
        sx={{ 
          width: '100%', 
          px: '0 !important', 
          mx: '0 !important',
          paddingLeft: '0 !important',
          paddingRight: '0 !important',
          marginLeft: '0 !important',
          marginRight: '0 !important'
        }}
      >
        <Box sx={{ pt: '50px', display: 'flex', flexDirection: 'column', alignItems: 'center', px: 0, mx: 0 }}>
          <Box sx={{ mb: '30px', width: '100%', textAlign: 'center' }}>
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

            {question.detail_text && (
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
                {question.detail_text}
              </Typography>
            )}

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
        </Box>
      </Container>
    </>
  );
};

// Multiple Choice Matrix Question Component - AnswerAppの完全コピー
const MultipleChoiceMatrixQuestion = ({ question, themeColor, currentQuestion, totalQuestions, onAnswerChange }) => {
  const [selectedChoices, setSelectedChoices] = useState([]);

  const handleChoiceToggle = (choiceValue) => {
    const newSelectedChoices = selectedChoices.includes(choiceValue)
      ? selectedChoices.filter(choice => choice !== choiceValue)
      : [...selectedChoices, choiceValue];
    
    setSelectedChoices(newSelectedChoices);
    onAnswerChange(question.id, {
      questionTypeId: 6,
      answers: newSelectedChoices
    });
  };

  const choices = question.choices ? JSON.parse(question.choices) : [];

  return (
    <>
      <Container 
        maxWidth={false} 
        disableGutters 
        sx={{ 
          width: '100%', 
          px: '0 !important', 
          mx: '0 !important',
          paddingLeft: '0 !important',
          paddingRight: '0 !important',
          marginLeft: '0 !important',
          marginRight: '0 !important'
        }}
      >
        <Box sx={{ pt: '50px', display: 'flex', flexDirection: 'column', alignItems: 'center', px: 0, mx: 0 }}>
          <Box sx={{ mb: '30px', width: '100%', textAlign: 'center' }}>
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

            {question.detail_text && (
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
                {question.detail_text}
              </Typography>
            )}

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
                onClick={() => handleChoiceToggle(choice)}
                disableRipple
                sx={{
                  width: { xs: 'calc(50% - 6px)', sm: 'calc(50% - 6px)', md: 'calc(50% - 6px)' },
                  height: { xs: 40, md: 48 },
                  borderRadius: '12px',
                  fontSize: { xs: '0.7rem', md: '0.875rem' },
                  fontWeight: 500,
                  textTransform: 'none',
                  fontFamily: '"Noto Sans JP", sans-serif',
                  backgroundColor: selectedChoices.includes(choice) 
                    ? stringToColor(themeColor)
                    : colorWithLightOpacity(stringToColor(themeColor)),
                  color: selectedChoices.includes(choice) ? 'white' : '#14181B',
                  borderColor: colorWithBorderOpacity(stringToColor(themeColor)),
                  '&:hover': {
                    backgroundColor: selectedChoices.includes(choice) 
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
        </Box>
      </Container>
    </>
  );
};

// Linear Scale Question Component - AnswerAppの完全コピー
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
  const minLabel = scaleData.minLabel || scaleData.min_label || 'そう思わない';
  const maxLabel = scaleData.maxLabel || scaleData.max_label || 'そう思う';
  const minValue = scaleData.minValue || 1;
  const maxValue = scaleData.maxValue || 5;
  
  // 動的にスケール配列を生成
  const scaleOptions = [];
  for (let i = minValue; i <= maxValue; i++) {
    scaleOptions.push(i);
  }

  return (
    <>
      <Container 
        maxWidth={false} 
        disableGutters 
        sx={{ 
          width: '100%', 
          px: '0 !important', 
          mx: '0 !important',
          paddingLeft: '0 !important',
          paddingRight: '0 !important',
          marginLeft: '0 !important',
          marginRight: '0 !important'
        }}
      >
        <Box sx={{ pt: '50px', display: 'flex', flexDirection: 'column', alignItems: 'center', px: 0, mx: 0 }}>
          <Box sx={{ mb: '30px', width: '100%', textAlign: 'center' }}>
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

            {question.detail_text && (
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
                {question.detail_text}
              </Typography>
            )}

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
        </Box>
      </Container>
    </>
  );
};

// Pull Down Question Component - AnswerAppの完全コピー
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
    <>
      <Container 
        maxWidth={false} 
        disableGutters 
        sx={{ 
          width: '100%', 
          px: '0 !important', 
          mx: '0 !important',
          paddingLeft: '0 !important',
          paddingRight: '0 !important',
          marginLeft: '0 !important',
          marginRight: '0 !important'
        }}
      >
        <Box sx={{ pt: '50px', display: 'flex', flexDirection: 'column', alignItems: 'center', px: 0, mx: 0 }}>
          <Box sx={{ mb: '30px', width: '100%', textAlign: 'center' }}>
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

            {question.detail_text && (
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
                {question.detail_text}
              </Typography>
            )}

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

          <Box sx={{ width: '100%', maxWidth: 400 }}>
            <FormControl fullWidth>
              <Select
                value={selectedValue}
                onChange={(e) => handleValueChange(e.target.value)}
                displayEmpty
                MenuProps={{
                  disablePortal: true,
                  PaperProps: {
                    sx: {
                      mt: 0.5,
                      borderRadius: '8px',
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                      maxHeight: `${240 * zoom}px`,
                      minWidth: `${200 * zoom}px`,
                      maxWidth: `${400 * zoom}px`,
                      '& .MuiMenuItem-root': {
                        fontSize: `${1 * zoom}rem`,
                        fontFamily: '"Noto Sans JP", sans-serif',
                        minHeight: `${44 * zoom}px`,
                        padding: `${8 * zoom}px ${16 * zoom}px`,
                        '&:hover': {
                          backgroundColor: 'rgba(94, 23, 235, 0.08)'
                        }
                      },
                      '&::-webkit-scrollbar': {
                        width: `${6 * zoom}px`
                      },
                      '&::-webkit-scrollbar-track': {
                        background: 'rgba(0, 0, 0, 0.02)',
                        borderRadius: `${3 * zoom}px`
                      },
                      '&::-webkit-scrollbar-thumb': {
                        background: 'rgba(0, 0, 0, 0.1)',
                        borderRadius: `${3 * zoom}px`,
                        '&:hover': {
                          background: 'rgba(0, 0, 0, 0.15)'
                        }
                      },
                      scrollbarWidth: 'thin',
                      scrollbarColor: 'rgba(0, 0, 0, 0.1) rgba(0, 0, 0, 0.02)'
                    }
                  },
                  anchorOrigin: {
                    vertical: 'bottom',
                    horizontal: 'left'
                  },
                  transformOrigin: {
                    vertical: 'top',
                    horizontal: 'left'
                  }
                }}
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
        </Box>
      </Container>
    </>
  );
};

// Main PreviewQuestions component - ドロップゾーン対応版
const PreviewQuestions = ({ 
  previewMode, 
  zoom = 1,
  questions = [], 
  selectedPage,
  isDragActive = false,
  dropIndicator = null,
  onDragOver,
  onDragLeave,
  onDrop,
  dropRef,
  selectedQuestionId,
  onQuestionSelect
}) => {
  const [answers, setAnswers] = useState({});
  const isMobile = previewMode === 'mobile';

  const themeColor = '#5e17eb';
  const headerImage = 'https://misezukuri.com/wp-content/uploads/2023/10/Cafebar1.png';
  const logoUrl = 'https://otfreskkeaenahqziriz.supabase.co/storage/v1/object/public/app-assets/logo/OpenReviewWhiteThemeLoog.png';

  // 実際の質問データを使用
  const displayQuestions = questions || [];

  const handleAnswerChange = (questionId, answerData) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answerData
    }));
  };

  const renderQuestion = (question, index) => {
    const questionNumber = index + 1;
    const totalQuestions = displayQuestions.length;
    const isSelected = selectedQuestionId === question.id;

    const handleQuestionClick = (e) => {
      // 入力フィールドをクリックした場合は質問選択を発火しない
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }
      if (onQuestionSelect) {
        onQuestionSelect(question.id);
      }
    };

    const questionWrapper = (children) => (
      <Box
        onClick={handleQuestionClick}
        sx={{
          position: 'relative',
          cursor: 'pointer',
          borderRadius: 2,
          border: isSelected ? '3px solid #5e17eb' : '3px solid transparent',
          backgroundColor: isSelected ? 'rgba(94, 23, 235, 0.02)' : 'transparent',
          transition: 'all 0.3s ease',
          '&::before': isSelected ? {
            content: '"選択中"',
            position: 'absolute',
            top: -10,
            right: 10,
            backgroundColor: '#5e17eb',
            color: 'white',
            fontSize: '0.7rem',
            fontWeight: 600,
            padding: '2px 8px',
            borderRadius: '12px',
            zIndex: 10
          } : {},
          '&:hover': {
            backgroundColor: isSelected ? 'rgba(94, 23, 235, 0.05)' : 'rgba(94, 23, 235, 0.01)',
            border: isSelected ? '3px solid #5e17eb' : '3px solid rgba(94, 23, 235, 0.2)'
          }
        }}
      >
        {children}
      </Box>
    );

    switch (question.question_types_id) {
      case 1:
        return questionWrapper(
          <ShortTextQuestion
            key={question.id}
            question={question}
            themeColor={themeColor}
            currentQuestion={questionNumber}
            totalQuestions={totalQuestions}
            onAnswerChange={handleAnswerChange}
          />
        );
      case 2:
        return questionWrapper(
          <LongTextQuestion
            key={question.id}
            question={question}
            themeColor={themeColor}
            currentQuestion={questionNumber}
            totalQuestions={totalQuestions}
            onAnswerChange={handleAnswerChange}
          />
        );
      case 3:
        return questionWrapper(
          <SingleChoiceQuestion
            key={question.id}
            question={question}
            themeColor={themeColor}
            currentQuestion={questionNumber}
            totalQuestions={totalQuestions}
            onAnswerChange={handleAnswerChange}
          />
        );
      case 4:
        return questionWrapper(
          <MultipleChoiceQuestion
            key={question.id}
            question={question}
            themeColor={themeColor}
            currentQuestion={questionNumber}
            totalQuestions={totalQuestions}
            onAnswerChange={handleAnswerChange}
          />
        );
      case 5:
        return questionWrapper(
          <SingleChoiceMatrixQuestion
            key={question.id}
            question={question}
            themeColor={themeColor}
            currentQuestion={questionNumber}
            totalQuestions={totalQuestions}
            onAnswerChange={handleAnswerChange}
          />
        );
      case 6:
        return questionWrapper(
          <MultipleChoiceMatrixQuestion
            key={question.id}
            question={question}
            themeColor={themeColor}
            currentQuestion={questionNumber}
            totalQuestions={totalQuestions}
            onAnswerChange={handleAnswerChange}
          />
        );
      case 7:
        return questionWrapper(
          <LinearScaleQuestion
            key={question.id}
            question={question}
            themeColor={themeColor}
            currentQuestion={questionNumber}
            totalQuestions={totalQuestions}
            onAnswerChange={handleAnswerChange}
          />
        );
      case 8:
        return questionWrapper(
          <PullDownQuestion
            key={question.id}
            question={question}
            themeColor={themeColor}
            currentQuestion={questionNumber}
            totalQuestions={totalQuestions}
            onAnswerChange={handleAnswerChange}
            zoom={zoom}
          />
        );
      default:
        return (
          <Box key={question.id} sx={{ py: 4, textAlign: 'center' }}>
            <Typography>サポートされていない質問タイプ: {question.question_types_id}</Typography>
          </Box>
        );
    }
  };

  return (
    <Box
      sx={{
        height: '100%',
        width: '100%',
        backgroundColor: '#FFFFFF',
        overflow: 'auto',
        padding: '0 !important',
        margin: '0 !important',
        paddingLeft: '0 !important',
        paddingRight: '0 !important',
        marginLeft: '0 !important',
        marginRight: '0 !important',
        '&::-webkit-scrollbar': {
          display: 'none'
        },
        msOverflowStyle: 'none',
        scrollbarWidth: 'none',
        overscrollBehavior: 'contain',
        touchAction: 'pan-y'
      }}
    >
      {/* Glass Header Bar for PC - AnswerAppと同じ */}
      {!isMobile && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 65,
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(40px) saturate(180%)',
            WebkitBackdropFilter: 'blur(40px) saturate(180%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px rgba(31, 38, 135, 0.15)',
            zIndex: 10,
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.02) 100%)',
              pointerEvents: 'none'
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '1px',
              background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent)',
              pointerEvents: 'none'
            }
          }}
        >
          <img
            src={logoUrl}
            alt="Logo"
            style={{
              width: '140px',
              height: '55px',
              objectFit: 'contain',
              position: 'relative',
              zIndex: 1,
              filter: 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.1))'
            }}
          />
        </Box>
      )}

      {/* Header Image Section - AnswerAppと同じ */}
      <Box
        sx={{
          position: 'relative',
          height: isMobile ? 250 : 270,
          overflow: 'hidden',
          width: '100%',
          marginTop: isMobile ? 0 : '65px'
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `url(${headerImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />

        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: isMobile 
              ? 'linear-gradient(to bottom, transparent 0%, rgba(255, 255, 255, 0.8) 70%, rgba(255, 255, 255, 1) 100%)'
              : 'linear-gradient(to bottom, transparent 0%, rgba(255, 255, 255, 0.6) 85%, rgba(255, 255, 255, 1) 100%)'
          }}
        />

        {isMobile && (
          <Box
            sx={{
              position: 'absolute',
              top: 20,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 120,
              height: 50,
              zIndex: 2
            }}
          >
            <img
              src={logoUrl}
              alt="Logo"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain'
              }}
            />
          </Box>
        )}
      </Box>

      {/* Content Container - AnswerAppと同じ */}
      <Container
        maxWidth={false}
        sx={{
          width: '100%',
          '&::-webkit-scrollbar': {
            display: 'none'
          },
          msOverflowStyle: 'none',
          scrollbarWidth: 'none',
          maxWidth: isMobile ? '100%' : '900px',
          margin: '0 auto',
          backgroundColor: '#FFFFFF',
          minHeight: 'auto',
          overflow: 'visible'
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: 'auto',
            px: isMobile ? 3 : 4,
            py: isMobile ? 0 : 2,
            overflow: 'visible',
            backgroundColor: '#FFFFFF'
          }}
        >
          {/* Questions Content with Drop Zone */}
          <Box 
            ref={dropRef}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            sx={{ 
              flex: 1,
              position: 'relative',
              minHeight: displayQuestions.length === 0 ? '300px' : 'fit-content',
              overflow: 'visible'
            }}
          >
            {/* Empty State - 初期状態の説明文 */}
            {displayQuestions.length === 0 && !isDragActive && (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: '#6b7280',
                  textAlign: 'center',
                  p: 4
                }}
              >
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 3,
                    border: '2px dashed #d1d5db'
                  }}
                >
                  <Typography variant="h3" sx={{ opacity: 0.7 }}>📝</Typography>
                </Box>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    mb: 2, 
                    fontWeight: 600,
                    color: '#374151'
                  }}
                >
                  質問を追加してフォームを作成
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    mb: 3, 
                    maxWidth: 300,
                    lineHeight: 1.6,
                    color: '#6b7280'
                  }}
                >
                  左側の質問作成ツールから質問をドラッグ&ドロップしてフォームを作成してください
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 3,
                    py: 1.5,
                    borderRadius: 2,
                    backgroundColor: 'rgba(94, 23, 235, 0.05)',
                    border: '1px solid rgba(94, 23, 235, 0.1)'
                  }}
                >
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: '#5e17eb',
                      fontWeight: 500
                    }}
                  >
                    💡 ヒント: 質問タイプやテンプレートから選択できます
                  </Typography>
                </Box>
              </Box>
            )}


            {/* Questions List */}
            {displayQuestions.map((question, index) => (
              <Box key={question.id} sx={{ mb: '50px', position: 'relative' }}>
                {/* Drop Indicator */}
                {dropIndicator === index && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: -25,
                      left: 0,
                      right: 0,
                      height: 4,
                      backgroundColor: '#5e17eb',
                      borderRadius: 2,
                      zIndex: 5,
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: -4,
                        left: -4,
                        width: 12,
                        height: 12,
                        backgroundColor: '#5e17eb',
                        borderRadius: '50%'
                      }
                    }}
                  />
                )}
                {renderQuestion(question, index)}
              </Box>
            ))}

            {/* Final Drop Indicator */}
            {dropIndicator === displayQuestions.length && (
              <Box
                sx={{
                  height: 4,
                  backgroundColor: '#5e17eb',
                  borderRadius: 2,
                  mb: 2,
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: -4,
                    left: -4,
                    width: 12,
                    height: 12,
                    backgroundColor: '#5e17eb',
                    borderRadius: '50%'
                  }
                }}
              />
            )}

            {/* Navigation Section */}
            {displayQuestions.length > 0 && (
              <Box sx={{ py: 4 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Button
                    variant="contained"
                    sx={{
                      backgroundColor: stringToColor(themeColor),
                      color: 'white',
                      width: 200,
                      height: 50,
                      borderRadius: '24px',
                      fontSize: '1rem',
                      fontWeight: 600,
                      textTransform: 'none',
                      fontFamily: '"Noto Sans JP", sans-serif',
                      boxShadow: 'none',
                      '&:hover': {
                        backgroundColor: stringToColor(themeColor),
                        opacity: 0.9,
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
                      }
                    }}
                  >
                    送信
                  </Button>
                </Box>
              </Box>
            )}
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default PreviewQuestions;