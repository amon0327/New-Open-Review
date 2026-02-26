import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
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
import { SingleChoiceTwoColumnQuestion, MultipleChoiceTwoColumnQuestion } from './questions';
import { getQuestionsWithOptions, getQuestionPageSettings } from '../../services/QuestionService';
import { usePartnerTheme } from '../../contexts/PartnerThemeContext';

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
                color: question.question_text ? '#14181B' : '#9CA3AF',
                fontSize: '1.25rem',
                fontWeight: question.question_text ? 600 : 400,
                fontFamily: '"Noto Sans JP", sans-serif',
                lineHeight: 1.4,
                mb: 2,
                fontStyle: question.question_text ? 'normal' : 'italic'
              }}
            >
              {question.question_text || '質問を入力...'}
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
                color: question.question_text ? '#14181B' : '#9CA3AF',
                fontSize: '1.25rem',
                fontWeight: question.question_text ? 600 : 400,
                fontFamily: '"Noto Sans JP", sans-serif',
                lineHeight: 1.4,
                mb: 2,
                fontStyle: question.question_text ? 'normal' : 'italic'
              }}
            >
              {question.question_text || '質問を入力...'}
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

  // ローカルのchoicesを優先（楽観的UI更新用）、Supabaseデータはフォールバック
  let choices = [];
  
  if (question.choices) {
    // ローカルのchoicesを使用（楽観的更新で即座に反映）
    choices = JSON.parse(question.choices);
  } else if (question.options && Array.isArray(question.options) && question.options.length > 0) {
    // Supabaseの選択肢オプションをフォールバックとして使用
    choices = question.options.map(option => option.choice_name);
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
                color: question.question_text ? '#14181B' : '#9CA3AF',
                fontSize: '1.25rem',
                fontWeight: question.question_text ? 600 : 400,
                fontFamily: '"Noto Sans JP", sans-serif',
                lineHeight: 1.4,
                mb: 2,
                fontStyle: question.question_text ? 'normal' : 'italic'
              }}
            >
              {question.question_text || '質問を入力...'}
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

  // ローカルのchoicesを優先（楽観的UI更新用）、Supabaseデータはフォールバック
  let choices = [];
  
  if (question.choices) {
    // ローカルのchoicesを使用（楽観的更新で即座に反映）
    choices = JSON.parse(question.choices);
  } else if (question.options && Array.isArray(question.options) && question.options.length > 0) {
    // Supabaseの選択肢オプションをフォールバックとして使用
    choices = question.options.map(option => option.choice_name);
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
                color: question.question_text ? '#14181B' : '#9CA3AF',
                fontSize: '1.25rem',
                fontWeight: question.question_text ? 600 : 400,
                fontFamily: '"Noto Sans JP", sans-serif',
                lineHeight: 1.4,
                mb: 2,
                fontStyle: question.question_text ? 'normal' : 'italic'
              }}
            >
              {question.question_text || '質問を入力...'}
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

  // ローカルのchoicesを優先（楽観的UI更新用）、Supabaseデータはフォールバック
  let choices = [];
  
  if (question.choices) {
    // ローカルのchoicesを使用（楽観的更新で即座に反映）
    choices = JSON.parse(question.choices);
  } else if (question.options && Array.isArray(question.options) && question.options.length > 0) {
    // Supabaseの選択肢オプションをフォールバックとして使用
    choices = question.options.map(option => option.choice_name);
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
                color: question.question_text ? '#14181B' : '#9CA3AF',
                fontSize: '1.25rem',
                fontWeight: question.question_text ? 600 : 400,
                fontFamily: '"Noto Sans JP", sans-serif',
                lineHeight: 1.4,
                mb: 2,
                fontStyle: question.question_text ? 'normal' : 'italic'
              }}
            >
              {question.question_text || '質問を入力...'}
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

  // ローカルのchoicesを優先（楽観的UI更新用）、Supabaseデータはフォールバック
  let choices = [];
  
  if (question.choices) {
    // ローカルのchoicesを使用（楽観的更新で即座に反映）
    choices = JSON.parse(question.choices);
  } else if (question.options && Array.isArray(question.options) && question.options.length > 0) {
    // Supabaseの選択肢オプションをフォールバックとして使用
    choices = question.options.map(option => option.choice_name);
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
                color: question.question_text ? '#14181B' : '#9CA3AF',
                fontSize: '1.25rem',
                fontWeight: question.question_text ? 600 : 400,
                fontFamily: '"Noto Sans JP", sans-serif',
                lineHeight: 1.4,
                mb: 2,
                fontStyle: question.question_text ? 'normal' : 'italic'
              }}
            >
              {question.question_text || '質問を入力...'}
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

  // ローカルのscale_settingsを優先（楽観的UI更新用）、Supabaseデータはフォールバック
  let minLabel, maxLabel, minValue, maxValue;
  
  if (question.scale_settings) {
    // ローカルのscale_settingsを使用（楽観的更新で即座に反映）
    const scaleData = JSON.parse(question.scale_settings);
    minLabel = scaleData.minLabel || scaleData.min_label || 'そう思わない';
    maxLabel = scaleData.maxLabel || scaleData.max_label || 'そう思う';
    minValue = scaleData.minValue !== null && scaleData.minValue !== undefined ? scaleData.minValue : (isLoyaltyScore ? 0 : 1);
    maxValue = scaleData.maxValue !== null && scaleData.maxValue !== undefined ? scaleData.maxValue : (isLoyaltyScore ? 10 : 5);
  } else if (question.scale_labels) {
    // 後方互換性のため
    const scaleData = JSON.parse(question.scale_labels);
    minLabel = scaleData.minLabel || scaleData.min_label || 'そう思わない';
    maxLabel = scaleData.maxLabel || scaleData.max_label || 'そう思う';
    minValue = scaleData.minValue !== null && scaleData.minValue !== undefined ? scaleData.minValue : (isLoyaltyScore ? 0 : 1);
    maxValue = scaleData.maxValue !== null && scaleData.maxValue !== undefined ? scaleData.maxValue : (isLoyaltyScore ? 10 : 5);
  } else if (question.options && question.options.min_text && question.options.max_text) {
    // Supabaseのlinear_scaleオプションをフォールバックとして使用
    minLabel = question.options.min_text;
    maxLabel = question.options.max_text;
    minValue = isLoyaltyScore ? 0 : 1;
    maxValue = isLoyaltyScore ? 10 : 5;
  } else {
    // デフォルト値
    minLabel = 'そう思わない';
    maxLabel = 'そう思う';
    minValue = isLoyaltyScore ? 0 : 1;
    maxValue = isLoyaltyScore ? 10 : 5;
  }
  
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
                color: question.question_text ? '#14181B' : '#9CA3AF',
                fontSize: '1.25rem',
                fontWeight: question.question_text ? 600 : 400,
                fontFamily: '"Noto Sans JP", sans-serif',
                lineHeight: 1.4,
                mb: 2,
                fontStyle: question.question_text ? 'normal' : 'italic'
              }}
            >
              {question.question_text || '質問を入力...'}
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
                  <Box sx={{ textAlign: 'center', mt: 1 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#57636C',
                        fontSize: '0.75rem',
                        fontFamily: '"Noto Sans JP", sans-serif'
                      }}
                    >
                      {value}
                    </Typography>
                  </Box>
                </Box>
              ))
            )}
          </Box>
        </Box>
      </Container>
    </>
  );
};

// Pull Down Question Component - ズーム対応版
const PullDownQuestion = ({ question, themeColor, currentQuestion, totalQuestions, onAnswerChange, zoom = 1 }) => {
  const theme = usePartnerTheme();
  const [selectedValue, setSelectedValue] = useState('');

  const handleValueChange = (value) => {
    setSelectedValue(value);
    onAnswerChange(question.id, {
      questionTypeId: 8,
      answer: value
    });
  };

  // ローカルのchoicesを優先（楽観的UI更新用）、Supabaseデータはフォールバック
  let choices = [];
  
  if (question.choices) {
    // ローカルのchoicesを使用（楽観的更新で即座に反映）
    choices = JSON.parse(question.choices);
  } else if (question.options && Array.isArray(question.options) && question.options.length > 0) {
    // Supabaseの選択肢オプションをフォールバックとして使用
    choices = question.options.map(option => option.choice_name);
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
                color: question.question_text ? '#14181B' : '#9CA3AF',
                fontSize: '1.25rem',
                fontWeight: question.question_text ? 600 : 400,
                fontFamily: '"Noto Sans JP", sans-serif',
                lineHeight: 1.4,
                mb: 2,
                fontStyle: question.question_text ? 'normal' : 'italic'
              }}
            >
              {question.question_text || '質問を入力...'}
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
                          backgroundColor: theme.primaryAlpha08
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
                        backgroundColor: theme.primaryAlpha08
                      },
                      '&.Mui-selected': {
                        backgroundColor: theme.primaryAlpha10,
                        '&:hover': {
                          backgroundColor: theme.primaryAlpha15
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
  onQuestionSelect,
  // 基本設定関連
  headerImage,
  logoImage,
  onElementSelect,
  selectedElement,
  formSettings = {},
  // フォームID
  formId,
  // エラーハイライト関連
  highlightedElement,
  highlightAnimation,
  pageErrorHighlight
}) => {
  const theme = usePartnerTheme();
  const [answers, setAnswers] = useState({});
  const [hoveredQuestionId, setHoveredQuestionId] = useState(null);
  const [prevQuestionsCount, setPrevQuestionsCount] = useState(0);
  const scrollContainerRef = useRef(null);
  const [supabaseQuestions, setSupabaseQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pageSettings, setPageSettings] = useState({ questionScreenSettings: null, reviewFormSettings: null });
  const isMobile = previewMode === 'mobile';

  // ハイライトスタイルを生成するヘルパー関数
  const getHighlightStyle = (questionId) => {
    if (!highlightedElement || 
        highlightedElement.elementType !== 'question' || 
        highlightedElement.questionId !== questionId) {
      return {};
    }
    
    return {
      position: 'relative',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: -8,
        left: -8,
        right: -8,
        bottom: -8,
        background: 'rgba(239, 68, 68, 0.2)',
        borderRadius: 2,
        border: '2px solid #ef4444',
        zIndex: 1000,
        animation: highlightAnimation ? 'errorPulse 2s ease-in-out' : 'none',
        '@keyframes errorPulse': {
          '0%': { opacity: 0, transform: 'scale(0.9)' },
          '50%': { opacity: 1, transform: 'scale(1.05)' },
          '100%': { opacity: 0.8, transform: 'scale(1)' }
        }
      }
    };
  };

  // ページエラーハイライトスタイルを生成するヘルパー関数
  const getPageErrorHighlightStyle = () => {
    if (!pageErrorHighlight || pageErrorHighlight !== selectedPage?.id) {
      return {};
    }
    
    return {
      position: 'relative',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: -8,
        left: -8,
        right: -8,
        bottom: -8,
        background: 'rgba(239, 68, 68, 0.2)',
        borderRadius: 2,
        border: '2px solid #ef4444',
        zIndex: 1000,
        animation: highlightAnimation ? 'errorPulse 2s ease-in-out' : 'none',
        '@keyframes errorPulse': {
          '0%': { opacity: 0, transform: 'scale(0.9)' },
          '50%': { opacity: 1, transform: 'scale(1.05)' },
          '100%': { opacity: 0.8, transform: 'scale(1)' }
        }
      }
    };
  };

  // Supabaseのデータからテーマカラー、ロゴ、ヘッダー画像を取得
  const themeColor = formSettings.theme_color || pageSettings.reviewFormSettings?.theme_color || theme.primary;
  const defaultHeaderImage = pageSettings.questionScreenSettings?.header_image_url || 'https://misezukuri.com/wp-content/uploads/2023/10/Cafebar1.png';
  const defaultLogoUrl = formSettings.logo_image_url || pageSettings.reviewFormSettings?.logo_image_url || theme.logoLight || 'https://otfreskkeaenahqziriz.supabase.co/storage/v1/object/public/app-assets/logo/OpenReviewWhiteThemeLoog.png';
  
  const currentHeaderImage = headerImage || formSettings.header_image_url || defaultHeaderImage;
  const currentLogoUrl = logoImage || defaultLogoUrl;

  // Supabaseから質問データとページ設定を取得
  useEffect(() => {
    const fetchData = async () => {
      if (!formId) {
        return;
      }

      setLoading(true);
      try {
        // ページ設定を取得
        const settings = await getQuestionPageSettings(formId);
        setPageSettings(settings);

        // 質問データを取得
        if (selectedPage?.id) {
          const questionsWithOptions = await getQuestionsWithOptions(formId, selectedPage.id);
          setSupabaseQuestions(questionsWithOptions);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [formId, selectedPage?.id]);

  // ローカルの質問データとSupabaseの質問データを統合
  // CreatePageから渡されるquestionsプロパティを優先し、リアルタイム更新を確保
  const displayQuestions = (questions && questions.length > 0) ? questions : supabaseQuestions;

  // デバッグ用ログ（questionsプロパティが変更された時のみ）
  useEffect(() => {
    console.log('PreviewQuestions - questions prop changed:', {
      questionsLength: questions?.length || 0,
      supabaseQuestionsLength: supabaseQuestions.length,
      displayQuestionsLength: displayQuestions.length,
      selectedPageId: selectedPage?.id
    });
  }, [questions]);

  // 質問が追加された際の自動スクロール機能
  useEffect(() => {
    if (displayQuestions.length > prevQuestionsCount && scrollContainerRef.current) {
      // 新しい質問が追加された場合のみスクロール
      if (prevQuestionsCount > 0) {
        // 少し遅延を入れてスムーズにスクロール
        setTimeout(() => {
          if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTo({
              top: scrollContainerRef.current.scrollHeight,
              behavior: 'smooth'
            });
          }
        }, 100);
      }
      setPrevQuestionsCount(displayQuestions.length);
    } else if (displayQuestions.length !== prevQuestionsCount) {
      // 質問数が変更された場合は単純に数を更新
      setPrevQuestionsCount(displayQuestions.length);
    }
  }, [displayQuestions.length]);

  const handleAnswerChange = useCallback((questionId, answerData) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answerData
    }));
  }, []);

  const renderQuestion = useCallback((question, index) => {
    const questionNumber = index + 1;
    const totalQuestions = displayQuestions.length;
    const isSelected = selectedQuestionId === question.id;
    const isHovered = hoveredQuestionId === question.id;

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
        data-question-id={question.id}
        onClick={handleQuestionClick}
        onMouseEnter={() => setHoveredQuestionId(question.id)}
        onMouseLeave={() => setHoveredQuestionId(null)}
        sx={{
          position: 'relative',
          cursor: 'pointer',
          margin: (isSelected || isHovered) ? '24px -24px' : '8px 0',
          transition: 'all 0.3s ease'
        }}
      >
        <Box
          sx={{
            borderRadius: 3,
            border: isSelected ? `2px solid ${theme.primary}` :
                   isHovered ? `2px solid ${theme.primaryAlpha30}` :
                   '2px solid transparent',
            backgroundColor: isSelected ? theme.primaryAlpha02 :
                           isHovered ? theme.primaryAlpha02 :
                           'transparent',
            padding: (isSelected || isHovered) ? '24px' : '0',
            boxShadow: isSelected ? `0 8px 32px ${theme.primaryAlpha15}` :
                      isHovered ? `0 4px 16px ${theme.primaryAlpha10}` :
                      'none',
            position: 'relative',
            transition: 'all 0.3s ease',
            transform: isSelected ? 'none' : isHovered ? 'translateY(-2px)' : 'none',
            ...getHighlightStyle(question.id),
            '&::before': isSelected ? {
              content: '"選択中"',
              position: 'absolute',
              top: -12,
              right: 16,
              backgroundColor: theme.primary,
              color: 'white',
              fontSize: '0.7rem',
              fontWeight: 600,
              padding: '4px 12px',
              borderRadius: '16px',
              zIndex: 10,
              boxShadow: `0 2px 8px ${theme.primaryAlpha30}`
            } : {}
          }}
        >
          {children}
        </Box>
      </Box>
    );

    console.log(`🔍 PreviewQuestions renderQuestion: question_types_id = ${question.question_types_id}`);
    
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
      case 9:
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
      case 10:
        return questionWrapper(
          <MultipleChoiceTwoColumnQuestion
            key={question.id}
            question={question}
            themeColor={themeColor}
            currentQuestion={questionNumber}
            totalQuestions={totalQuestions}
            onAnswerChange={handleAnswerChange}
          />
        );
      default:
        return (
          <Box key={question.id} sx={{ py: 4, textAlign: 'center' }}>
            <Typography>サポートされていない質問タイプ: {question.question_types_id}</Typography>
          </Box>
        );
    }
  }, [displayQuestions.length, selectedQuestionId, hoveredQuestionId, onQuestionSelect, setHoveredQuestionId, themeColor, handleAnswerChange, zoom]);

  return (
    <Box
      ref={scrollContainerRef}
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
          <Box
            onClick={() => onElementSelect && onElementSelect('logo')}
            sx={{
              position: 'relative',
              display: 'inline-block',
              cursor: 'pointer'
            }}
          >
            <img
              src={currentLogoUrl}
              alt="Logo"
              style={{
                width: '140px',
                height: '55px',
                objectFit: 'contain',
                position: 'relative',
                zIndex: 1,
                filter: 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.1))',
                pointerEvents: 'none'
              }}
            />
            {selectedElement === 'logo' && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: theme.primaryAlpha20,
                  borderRadius: 1,
                  zIndex: 2,
                  pointerEvents: 'none'
                }}
              />
            )}
          </Box>
        </Box>
      )}

      {/* Header Image Section - AnswerAppと同じ */}
      <Box
        sx={{
          position: 'relative',
          height: isMobile ? 250 : 270,
          overflow: 'hidden',
          width: '100%',
          marginTop: isMobile ? 0 : '65px',
          cursor: 'pointer'
        }}
        onClick={() => onElementSelect && onElementSelect('header')}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `url(${currentHeaderImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            transition: 'all 0.2s ease',
            '&:hover': {
              transform: 'scale(1.02)',
              filter: 'brightness(1.1)'
            }
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

        {selectedElement === 'header' && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: theme.primaryAlpha20,
              zIndex: 3,
              pointerEvents: 'none'
            }}
          />
        )}

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
              src={currentLogoUrl}
              alt="Logo"
              onClick={(e) => {
                e.stopPropagation();
                onElementSelect && onElementSelect('logo');
              }}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'scale(1.1)';
                e.target.style.filter = `drop-shadow(0 4px 12px ${theme.primaryAlpha30})`;
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'scale(1)';
                e.target.style.filter = 'none';
              }}
            />
            {selectedElement === 'logo' && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: theme.primaryAlpha20,
                  borderRadius: 1,
                  zIndex: 2,
                  pointerEvents: 'none'
                }}
              />
            )}
          </Box>
        )}
      </Box>

      {/* Content Area - Containerを削除してシンプルに */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: 'auto',
          px: isMobile ? 4.5 : 5.5, // 左右のパディングを12px程度追加（3→4.5、4→5.5）
          py: isMobile ? 0 : 2,
          overflow: 'visible',
          backgroundColor: '#FFFFFF',
          maxWidth: isMobile ? '100%' : '900px',
          margin: '0 auto',
          width: '100%'
        }}
      >
          {/* Questions Content with Drop Zone - プレビュー画面全体でドロップ可能 */}
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
                  p: 4,
                  ...getPageErrorHighlightStyle()
                }}
              >
                {/* 固定項目ページの場合は異なる表示 */}
                {selectedPage && selectedPage.type === 'fixed' ? (
                  <>
                    {/* ロックアイコン */}
                    <Box
                      sx={{
                        width: 60,
                        height: 60,
                        borderRadius: '50%',
                        backgroundColor: 'rgba(107, 114, 128, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 3
                      }}
                    >
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19 11H5C3.89543 11 3 11.8954 3 13V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V13C21 11.8954 20.1046 11 19 11Z" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M7 11V7C7 5.67392 7.52678 4.40215 8.46447 3.46447C9.40215 2.52678 10.6739 2 12 2C13.3261 2 14.5979 2.52678 15.5355 3.46447C16.4732 4.40215 17 5.67392 17 7V11" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </Box>
                    
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        mb: 2,
                        fontWeight: 600,
                        color: '#374151'
                      }}
                    >
                      固定項目
                    </Typography>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        mb: 3, 
                        maxWidth: 350,
                        lineHeight: 1.8,
                        color: '#6b7280'
                      }}
                    >
                      お客様の属性や店舗評価についての<br />
                      質問が設定されています
                    </Typography>
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                        width: '100%',
                        maxWidth: 320
                      }}
                    >
                      <Box
                        sx={{
                          px: 3,
                          py: 2,
                          borderRadius: 2,
                          backgroundColor: 'rgba(107, 114, 128, 0.05)',
                          border: '1px solid rgba(107, 114, 128, 0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5
                        }}
                      >
                        <Box sx={{ 
                          width: 8, 
                          height: 8, 
                          borderRadius: '50%', 
                          backgroundColor: '#6b7280' 
                        }} />
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: '#4b5563',
                            fontWeight: 500
                          }}
                        >
                          この項目は変更できません
                        </Typography>
                      </Box>
                    </Box>
                  </>
                ) : (
                  <>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        mb: 2, 
                        mt: 4,
                        fontWeight: 600,
                        color: '#374151'
                      }}
                    >
                      質問を追加しましょう
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
                      左のツールから質問をドラッグして追加できます
                    </Typography>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        px: 3,
                        py: 1.5,
                        borderRadius: 2,
                        backgroundColor: theme.primaryAlpha05,
                        border: `1px solid ${theme.primaryAlpha10}`
                      }}
                    >
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: theme.primary,
                          fontWeight: 500
                        }}
                      >
                        質問タイプやテンプレートから選択できます
                      </Typography>
                    </Box>
                  </>
                )}
              </Box>
            )}


            {/* Questions List - ドロップインジケーター不要、常に最後に追加 */}
            {displayQuestions.map((question, index) => (
              <Box key={question.id} sx={{ mb: '50px', position: 'relative' }}>
                {renderQuestion(question, index)}
              </Box>
            ))}

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
    </Box>
  );
};

export default PreviewQuestions;