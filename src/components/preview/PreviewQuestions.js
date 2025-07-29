import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  TextField,
  FormControl,
  Select,
  MenuItem,
  Checkbox
} from '@mui/material';

// Color utility function
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

// Question components
const ShortTextQuestion = ({ question, themeColor, currentQuestion, totalQuestions, onAnswerChange }) => {
  const [answer, setAnswer] = useState('');

  const handleAnswerChange = (value) => {
    setAnswer(value);
    onAnswerChange(question.id, { answer: value });
  };

  return (
    <Box
      sx={{
        py: '50px',
        px: 3,
        backgroundColor: '#F1F4F8',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minHeight: '100vh'
      }}
    >
      <Container
        maxWidth="md"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        {/* Required Badge */}
        {question.is_required && (
          <Box
            sx={{
              backgroundColor: stringToColor(themeColor),
              color: 'white',
              px: 2,
              py: 0.5,
              borderRadius: '12px',
              fontSize: '0.875rem',
              fontWeight: 500,
              mb: 2,
              fontFamily: '"Noto Sans JP", sans-serif'
            }}
          >
            必須
          </Box>
        )}

        {/* Question Text */}
        <Typography
          variant="h5"
          sx={{
            fontWeight: 600,
            color: '#14181B',
            textAlign: 'center',
            mb: 2,
            fontSize: '1.25rem',
            fontFamily: '"Noto Sans JP", sans-serif'
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
              textAlign: 'center',
              mb: 3,
              fontSize: '0.875rem',
              fontFamily: '"Noto Sans JP", sans-serif'
            }}
          >
            {question.detail_text}
          </Typography>
        )}

        {/* Progress Badge */}
        <Box
          sx={{
            backgroundColor: 'rgba(0, 0, 0, 0.05)',
            px: 2,
            py: 0.5,
            borderRadius: '12px',
            fontSize: '0.875rem',
            fontWeight: 500,
            mb: 4,
            color: '#57636C',
            fontFamily: '"Noto Sans JP", sans-serif'
          }}
        >
          {currentQuestion} / {totalQuestions}
        </Box>

        {/* Answer Input */}
        <Box sx={{ width: '100%', maxWidth: 400 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="回答を入力してください"
            value={answer}
            onChange={(e) => handleAnswerChange(e.target.value)}
            sx={{
              backgroundColor: '#F1F4F8',
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                '&.Mui-focused fieldset': {
                  borderColor: stringToColor(themeColor)
                }
              }
            }}
          />
        </Box>
      </Container>
    </Box>
  );
};

const LongTextQuestion = ({ question, themeColor, currentQuestion, totalQuestions, onAnswerChange }) => {
  const [answer, setAnswer] = useState('');

  const handleAnswerChange = (value) => {
    setAnswer(value);
    onAnswerChange(question.id, { answer: value });
  };

  return (
    <Box
      sx={{
        py: '50px',
        px: 3,
        backgroundColor: '#F1F4F8',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minHeight: '100vh'
      }}
    >
      <Container
        maxWidth="md"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        {/* Required Badge */}
        {question.is_required && (
          <Box
            sx={{
              backgroundColor: stringToColor(themeColor),
              color: 'white',
              px: 2,
              py: 0.5,
              borderRadius: '12px',
              fontSize: '0.875rem',
              fontWeight: 500,
              mb: 2,
              fontFamily: '"Noto Sans JP", sans-serif'
            }}
          >
            必須
          </Box>
        )}

        {/* Question Text */}
        <Typography
          variant="h5"
          sx={{
            fontWeight: 600,
            color: '#14181B',
            textAlign: 'center',
            mb: 2,
            fontSize: '1.25rem',
            fontFamily: '"Noto Sans JP", sans-serif'
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
              textAlign: 'center',
              mb: 3,
              fontSize: '0.875rem',
              fontFamily: '"Noto Sans JP", sans-serif'
            }}
          >
            {question.detail_text}
          </Typography>
        )}

        {/* Progress Badge */}
        <Box
          sx={{
            backgroundColor: 'rgba(0, 0, 0, 0.05)',
            px: 2,
            py: 0.5,
            borderRadius: '12px',
            fontSize: '0.875rem',
            fontWeight: 500,
            mb: 4,
            color: '#57636C',
            fontFamily: '"Noto Sans JP", sans-serif'
          }}
        >
          {currentQuestion} / {totalQuestions}
        </Box>

        {/* Answer Input */}
        <Box sx={{ width: '100%', maxWidth: 400 }}>
          <TextField
            fullWidth
            multiline
            minRows={5}
            maxRows={5}
            variant="outlined"
            placeholder="回答を入力してください"
            value={answer}
            onChange={(e) => handleAnswerChange(e.target.value)}
            sx={{
              backgroundColor: '#F1F4F8',
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                '&.Mui-focused fieldset': {
                  borderColor: stringToColor(themeColor)
                }
              }
            }}
          />
        </Box>
      </Container>
    </Box>
  );
};

const SingleChoiceQuestion = ({ question, themeColor, currentQuestion, totalQuestions, onAnswerChange }) => {
  const [selectedChoice, setSelectedChoice] = useState(null);

  const handleChoiceSelect = (choiceValue) => {
    setSelectedChoice(choiceValue);
    onAnswerChange(question.id, { answer: choiceValue });
  };

  // Parse choices from JSON
  const choices = question.choices ? JSON.parse(question.choices) : [];

  return (
    <Box
      sx={{
        py: '50px',
        px: 3,
        backgroundColor: '#F1F4F8',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minHeight: '100vh'
      }}
    >
      <Container
        maxWidth="md"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        {/* Required Badge */}
        {question.is_required && (
          <Box
            sx={{
              backgroundColor: stringToColor(themeColor),
              color: 'white',
              px: 2,
              py: 0.5,
              borderRadius: '12px',
              fontSize: '0.875rem',
              fontWeight: 500,
              mb: 2,
              fontFamily: '"Noto Sans JP", sans-serif'
            }}
          >
            必須
          </Box>
        )}

        {/* Question Text */}
        <Typography
          variant="h5"
          sx={{
            fontWeight: 600,
            color: '#14181B',
            textAlign: 'center',
            mb: 2,
            fontSize: '1.25rem',
            fontFamily: '"Noto Sans JP", sans-serif'
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
              textAlign: 'center',
              mb: 3,
              fontSize: '0.875rem',
              fontFamily: '"Noto Sans JP", sans-serif'
            }}
          >
            {question.detail_text}
          </Typography>
        )}

        {/* Progress Badge */}
        <Box
          sx={{
            backgroundColor: 'rgba(0, 0, 0, 0.05)',
            px: 2,
            py: 0.5,
            borderRadius: '12px',
            fontSize: '0.875rem',
            fontWeight: 500,
            mb: 4,
            color: '#57636C',
            fontFamily: '"Noto Sans JP", sans-serif'
          }}
        >
          {currentQuestion} / {totalQuestions}
        </Box>

        {/* Answer Choices */}
        <Box 
          sx={{ 
            width: '100%', 
            maxWidth: 400,
            display: 'flex',
            flexDirection: 'column',
            gap: 2
          }}
        >
          {choices.map((choice, index) => (
            <Button
              key={index}
              variant="outlined"
              onClick={() => handleChoiceSelect(choice)}
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
      </Container>
    </Box>
  );
};

const MultipleChoiceQuestion = ({ question, themeColor, currentQuestion, totalQuestions, onAnswerChange }) => {
  const [selectedChoices, setSelectedChoices] = useState([]);

  const handleChoiceToggle = (choiceValue) => {
    const newSelectedChoices = selectedChoices.includes(choiceValue)
      ? selectedChoices.filter(choice => choice !== choiceValue)
      : [...selectedChoices, choiceValue];
    
    setSelectedChoices(newSelectedChoices);
    onAnswerChange(question.id, { answers: newSelectedChoices });
  };

  // Parse choices from JSON
  const choices = question.choices ? JSON.parse(question.choices) : [];

  return (
    <Box
      sx={{
        py: '50px',
        px: 3,
        backgroundColor: '#F1F4F8',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minHeight: '100vh'
      }}
    >
      <Container
        maxWidth="md"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        {/* Required Badge */}
        {question.is_required && (
          <Box
            sx={{
              backgroundColor: stringToColor(themeColor),
              color: 'white',
              px: 2,
              py: 0.5,
              borderRadius: '12px',
              fontSize: '0.875rem',
              fontWeight: 500,
              mb: 2,
              fontFamily: '"Noto Sans JP", sans-serif'
            }}
          >
            必須
          </Box>
        )}

        {/* Question Text */}
        <Typography
          variant="h5"
          sx={{
            fontWeight: 600,
            color: '#14181B',
            textAlign: 'center',
            mb: 2,
            fontSize: '1.25rem',
            fontFamily: '"Noto Sans JP", sans-serif'
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
              textAlign: 'center',
              mb: 3,
              fontSize: '0.875rem',
              fontFamily: '"Noto Sans JP", sans-serif'
            }}
          >
            {question.detail_text}
          </Typography>
        )}

        {/* Progress Badge */}
        <Box
          sx={{
            backgroundColor: 'rgba(0, 0, 0, 0.05)',
            px: 2,
            py: 0.5,
            borderRadius: '12px',
            fontSize: '0.875rem',
            fontWeight: 500,
            mb: 4,
            color: '#57636C',
            fontFamily: '"Noto Sans JP", sans-serif'
          }}
        >
          {currentQuestion} / {totalQuestions}
        </Box>

        {/* Answer Choices */}
        <Box 
          sx={{ 
            width: '100%', 
            maxWidth: 400,
            display: 'flex',
            flexDirection: 'column',
            gap: 2
          }}
        >
          {choices.map((choice, index) => (
            <Button
              key={index}
              variant="outlined"
              onClick={() => handleChoiceToggle(choice)}
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
      </Container>
    </Box>
  );
};

const LinearScaleQuestion = ({ question, themeColor, currentQuestion, totalQuestions, onAnswerChange }) => {
  const [selectedValue, setSelectedValue] = useState(null);

  const handleValueSelect = (value) => {
    setSelectedValue(value);
    onAnswerChange(question.id, { answer: value.toString() });
  };

  // Parse scale labels or use defaults
  const scaleLabels = question.scale_labels ? JSON.parse(question.scale_labels) : {};
  const minLabel = scaleLabels.min_label || 'そう思わない';
  const maxLabel = scaleLabels.max_label || 'そう思う';

  return (
    <Box
      sx={{
        py: '50px',
        px: 3,
        backgroundColor: '#F1F4F8',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minHeight: '100vh'
      }}
    >
      <Container
        maxWidth="md"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        {/* Required Badge */}
        {question.is_required && (
          <Box
            sx={{
              backgroundColor: stringToColor(themeColor),
              color: 'white',
              px: 2,
              py: 0.5,
              borderRadius: '12px',
              fontSize: '0.875rem',
              fontWeight: 500,
              mb: 2,
              fontFamily: '"Noto Sans JP", sans-serif'
            }}
          >
            必須
          </Box>
        )}

        {/* Question Text */}
        <Typography
          variant="h5"
          sx={{
            fontWeight: 600,
            color: '#14181B',
            textAlign: 'center',
            mb: 2,
            fontSize: '1.25rem',
            fontFamily: '"Noto Sans JP", sans-serif'
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
              textAlign: 'center',
              mb: 3,
              fontSize: '0.875rem',
              fontFamily: '"Noto Sans JP", sans-serif'
            }}
          >
            {question.detail_text}
          </Typography>
        )}

        {/* Progress Badge */}
        <Box
          sx={{
            backgroundColor: 'rgba(0, 0, 0, 0.05)',
            px: 2,
            py: 0.5,
            borderRadius: '12px',
            fontSize: '0.875rem',
            fontWeight: 500,
            mb: 4,
            color: '#57636C',
            fontFamily: '"Noto Sans JP", sans-serif'
          }}
        >
          {currentQuestion} / {totalQuestions}
        </Box>

        {/* Scale Labels */}
        <Box 
          sx={{ 
            width: '100%', 
            maxWidth: 400,
            display: 'flex',
            justifyContent: 'space-between',
            mb: 2
          }}
        >
          <Typography variant="body2" sx={{ color: '#57636C', fontSize: '0.875rem' }}>
            {minLabel}
          </Typography>
          <Typography variant="body2" sx={{ color: '#57636C', fontSize: '0.875rem' }}>
            {maxLabel}
          </Typography>
        </Box>

        {/* Scale Options */}
        <Box 
          sx={{ 
            width: '100%', 
            maxWidth: 400,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          {[1, 2, 3, 4, 5].map((value) => (
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
      </Container>
    </Box>
  );
};

const PullDownQuestion = ({ question, themeColor, currentQuestion, totalQuestions, onAnswerChange }) => {
  const [selectedValue, setSelectedValue] = useState('');

  const handleValueChange = (value) => {
    setSelectedValue(value);
    onAnswerChange(question.id, { answer: value });
  };

  // Parse choices from JSON
  const choices = question.choices ? JSON.parse(question.choices) : [];

  return (
    <Box
      sx={{
        py: '50px',
        px: 3,
        backgroundColor: '#F1F4F8',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minHeight: '100vh'
      }}
    >
      <Container
        maxWidth="md"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        {/* Required Badge */}
        {question.is_required && (
          <Box
            sx={{
              backgroundColor: stringToColor(themeColor),
              color: 'white',
              px: 2,
              py: 0.5,
              borderRadius: '12px',
              fontSize: '0.875rem',
              fontWeight: 500,
              mb: 2,
              fontFamily: '"Noto Sans JP", sans-serif'
            }}
          >
            必須
          </Box>
        )}

        {/* Question Text */}
        <Typography
          variant="h5"
          sx={{
            fontWeight: 600,
            color: '#14181B',
            textAlign: 'center',
            mb: 2,
            fontSize: '1.25rem',
            fontFamily: '"Noto Sans JP", sans-serif'
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
              textAlign: 'center',
              mb: 3,
              fontSize: '0.875rem',
              fontFamily: '"Noto Sans JP", sans-serif'
            }}
          >
            {question.detail_text}
          </Typography>
        )}

        {/* Progress Badge */}
        <Box
          sx={{
            backgroundColor: 'rgba(0, 0, 0, 0.05)',
            px: 2,
            py: 0.5,
            borderRadius: '12px',
            fontSize: '0.875rem',
            fontWeight: 500,
            mb: 4,
            color: '#57636C',
            fontFamily: '"Noto Sans JP", sans-serif'
          }}
        >
          {currentQuestion} / {totalQuestions}
        </Box>

        {/* Answer Select */}
        <Box sx={{ width: '100%', maxWidth: 400 }}>
          <FormControl fullWidth>
            <Select
              value={selectedValue}
              onChange={(e) => handleValueChange(e.target.value)}
              displayEmpty
              sx={{
                backgroundColor: '#F1F4F8',
                borderRadius: '12px',
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: stringToColor(themeColor)
                }
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    maxHeight: 280,
                    borderRadius: '8px',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
                  }
                }
              }}
            >
              <MenuItem value="" disabled>
                <Typography sx={{ color: 'rgba(0, 0, 0, 0.6)' }}>
                  選択してください
                </Typography>
              </MenuItem>
              {choices.map((choice, index) => (
                <MenuItem key={index} value={choice}>
                  {choice}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Container>
    </Box>
  );
};

// Main PreviewQuestions component
const PreviewQuestions = ({ previewMode }) => {
  const [answers, setAnswers] = useState({});
  const isMobile = previewMode === 'mobile';

  // サンプルデータ
  const themeColor = '#5e17eb';
  const headerImage = 'https://misezukuri.com/wp-content/uploads/2023/10/Cafebar1.png';
  const logoUrl = 'https://otfreskkeaenahqziriz.supabase.co/storage/v1/object/public/app-assets/logo/OpenReviewWhiteThemeLoog.png';

  // サンプル質問データ
  const sampleQuestions = [
    {
      id: 1,
      question_types_id: 1,
      question_text: '基本情報をお聞かせください',
      detail_text: 'あなたの基本的な情報について教えてください',
      is_required: true
    },
    {
      id: 2,
      question_types_id: 3,
      question_text: '満足度を選択してください',
      detail_text: 'サービスに対する満足度を選んでください',
      choices: '["大変満足", "満足", "普通", "不満", "大変不満"]',
      is_required: true
    },
    {
      id: 3,
      question_types_id: 7,
      question_text: 'サービスの評価をお聞かせください',
      detail_text: '1から5までの段階で評価してください',
      scale_labels: '{"min_label": "悪い", "max_label": "良い"}',
      is_required: true
    }
  ];

  const handleAnswerChange = (questionId, answerData) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answerData
    }));
  };

  const renderQuestion = (question, index) => {
    const questionNumber = index + 1;
    const totalQuestions = sampleQuestions.length;

    switch (question.question_types_id) {
      case 1:
        return (
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
        return (
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
        return (
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
        return (
          <MultipleChoiceQuestion
            key={question.id}
            question={question}
            themeColor={themeColor}
            currentQuestion={questionNumber}
            totalQuestions={totalQuestions}
            onAnswerChange={handleAnswerChange}
          />
        );
      case 7:
        return (
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
        return (
          <PullDownQuestion
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
  };

  return (
    <Box
      sx={{
        height: '100%',
        width: '100%',
        backgroundColor: isMobile ? '#F1F4F8' : '#FFFFFF',
        overflow: 'auto',
        '&::-webkit-scrollbar': {
          display: 'none'
        },
        msOverflowStyle: 'none',
        scrollbarWidth: 'none'
      }}
    >
      {/* Glass Header Bar for PC */}
      {!isMobile && (
        <Box
          sx={{
            position: 'sticky',
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
            zIndex: 10
          }}
        >
          <img
            src={logoUrl}
            alt="Logo"
            style={{
              width: '140px',
              height: '55px',
              objectFit: 'contain',
              filter: 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.1))'
            }}
          />
        </Box>
      )}

      {/* Header Image Section */}
      <Box
        sx={{
          position: 'relative',
          height: isMobile ? 250 : 270,
          overflow: 'hidden',
          width: '100%'
        }}
      >
        {/* Background Image */}
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

        {/* Gradient Overlay */}
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

        {/* Logo for Mobile only */}
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

      {/* Content Container */}
      <Container
        maxWidth={false}
        sx={{
          width: '100%',
          maxWidth: isMobile ? '100%' : '900px',
          margin: '0 auto',
          backgroundColor: '#FFFFFF',
          minHeight: isMobile ? 'calc(100vh - 250px)' : 'calc(100vh - 350px)'
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: isMobile ? 'calc(100vh - 250px)' : 'calc(100vh - 350px)',
            px: isMobile ? 3 : 4,
            py: isMobile ? 0 : 2
          }}
        >
          {/* Questions Content */}
          <Box sx={{ flex: 1 }}>
            {sampleQuestions.map((question, index) => (
              <Box key={question.id} sx={{ mb: '50px' }}>
                {renderQuestion(question, index)}
              </Box>
            ))}

            {/* Navigation Section */}
            <Box sx={{ py: 4, textAlign: 'center' }}>
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
                次へ進む
              </Button>
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default PreviewQuestions;