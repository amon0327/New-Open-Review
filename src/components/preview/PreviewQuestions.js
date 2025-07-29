import React, { useState } from 'react';
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

// Short Text Question Component
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
                backgroundColor: '#F1F4F8',
                '&.Mui-focused fieldset': {
                  borderColor: stringToColor(themeColor)
                },
                '&.Mui-error fieldset': {
                  borderColor: '#F44336'
                }
              }
            }}
          />
        </Box>
      </Container>
    </Box>
  );
};

// Long Text Question Component
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
                backgroundColor: '#F1F4F8',
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

// Single Choice Question Component
const SingleChoiceQuestion = ({ question, themeColor, currentQuestion, totalQuestions, onAnswerChange }) => {
  const [selectedChoice, setSelectedChoice] = useState(null);

  const handleChoiceSelect = (choiceValue) => {
    setSelectedChoice(choiceValue);
    onAnswerChange(question.id, { answer: choiceValue });
  };

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
      </Container>
    </Box>
  );
};

// Multiple Choice Question Component  
const MultipleChoiceQuestion = ({ question, themeColor, currentQuestion, totalQuestions, onAnswerChange }) => {
  const [selectedChoices, setSelectedChoices] = useState([]);

  const handleChoiceToggle = (choiceValue) => {
    const newSelectedChoices = selectedChoices.includes(choiceValue)
      ? selectedChoices.filter(choice => choice !== choiceValue)
      : [...selectedChoices, choiceValue];
    
    setSelectedChoices(newSelectedChoices);
    onAnswerChange(question.id, { answers: newSelectedChoices });
  };

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
      </Container>
    </Box>
  );
};

// Single Choice Matrix Question Component
const SingleChoiceMatrixQuestion = ({ question, themeColor, currentQuestion, totalQuestions, onAnswerChange }) => {
  const [selectedChoice, setSelectedChoice] = useState(null);

  const handleChoiceSelect = (choiceValue) => {
    setSelectedChoice(choiceValue);
    onAnswerChange(question.id, { answer: choiceValue });
  };

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
      </Container>
    </Box>
  );
};

// Multiple Choice Matrix Question Component
const MultipleChoiceMatrixQuestion = ({ question, themeColor, currentQuestion, totalQuestions, onAnswerChange }) => {
  const [selectedChoices, setSelectedChoices] = useState([]);

  const handleChoiceToggle = (choiceValue) => {
    const newSelectedChoices = selectedChoices.includes(choiceValue)
      ? selectedChoices.filter(choice => choice !== choiceValue)
      : [...selectedChoices, choiceValue];
    
    setSelectedChoices(newSelectedChoices);
    onAnswerChange(question.id, { answers: newSelectedChoices });
  };

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
      </Container>
    </Box>
  );
};

// Linear Scale Question Component
const LinearScaleQuestion = ({ question, themeColor, currentQuestion, totalQuestions, onAnswerChange }) => {
  const [selectedValue, setSelectedValue] = useState(null);

  const handleValueSelect = (value) => {
    setSelectedValue(value);
    onAnswerChange(question.id, { answer: value.toString() });
  };

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

// Pull Down Question Component
const PullDownQuestion = ({ question, themeColor, currentQuestion, totalQuestions, onAnswerChange }) => {
  const [selectedValue, setSelectedValue] = useState('');

  const handleValueChange = (value) => {
    setSelectedValue(value);
    onAnswerChange(question.id, { answer: value });
  };

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
                },
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#F1F4F8'
                }
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    maxHeight: 280,
                    borderRadius: '8px',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                    '&::-webkit-scrollbar': {
                      width: '8px'
                    },
                    '&::-webkit-scrollbar-track': {
                      backgroundColor: '#f1f3f4',
                      borderRadius: '10px'
                    },
                    '&::-webkit-scrollbar-thumb': {
                      backgroundColor: '#dadce0',
                      borderRadius: '10px',
                      '&:hover': {
                        backgroundColor: '#bdc1c6'
                      }
                    }
                  }
                }
              }}
            >
              <MenuItem value="" disabled>
                <Typography 
                  sx={{ 
                    color: 'rgba(0, 0, 0, 0.6)',
                    fontFamily: '"Noto Sans JP", sans-serif'
                  }}
                >
                  選択してください
                </Typography>
              </MenuItem>
              {choices.map((choice, index) => (
                <MenuItem 
                  key={index} 
                  value={choice}
                  sx={{
                    fontFamily: '"Noto Sans JP", sans-serif'
                  }}
                >
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

  const themeColor = '#5e17eb';
  const headerImage = 'https://misezukuri.com/wp-content/uploads/2023/10/Cafebar1.png';
  const logoUrl = 'https://otfreskkeaenahqziriz.supabase.co/storage/v1/object/public/app-assets/logo/OpenReviewWhiteThemeLoog.png';

  // 全質問タイプのサンプルデータ
  const sampleQuestions = [
    {
      id: 1,
      question_types_id: 1,
      question_text: 'お名前を教えてください',
      detail_text: 'フルネームでご記入ください',
      is_required: true
    },
    {
      id: 2,
      question_types_id: 2,
      question_text: 'ご意見・ご感想をお聞かせください',
      detail_text: '詳しくお聞かせください',
      is_required: false
    },
    {
      id: 3,
      question_types_id: 3,
      question_text: '満足度を選択してください',
      detail_text: 'サービスに対する満足度を選んでください',
      choices: '["大変満足", "満足", "普通", "不満", "大変不満"]',
      is_required: true
    },
    {
      id: 4,
      question_types_id: 4,
      question_text: '利用したサービスを選択してください（複数選択可）',
      detail_text: '該当するものをすべて選んでください',
      choices: '["レストラン", "カフェ", "バー", "テイクアウト", "デリバリー"]',
      is_required: false
    },
    {
      id: 5,
      question_types_id: 5,
      question_text: '各項目について評価してください',
      detail_text: '当てはまるものを一つ選んでください',
      choices: '["とても良い", "良い", "普通", "悪い"]',
      is_required: true
    },
    {
      id: 6,
      question_types_id: 6,
      question_text: '改善してほしい項目を選択してください（複数選択可）',
      detail_text: '該当するものをすべて選んでください',
      choices: '["接客", "料理の質", "価格", "雰囲気"]',
      is_required: false
    },
    {
      id: 7,
      question_types_id: 7,
      question_text: 'サービスの総合評価をお聞かせください',
      detail_text: '1から5までの段階で評価してください',
      scale_labels: '{"min_label": "悪い", "max_label": "良い"}',
      is_required: true
    },
    {
      id: 8,
      question_types_id: 8,
      question_text: '年齢層を選択してください',
      detail_text: 'あなたの年齢層を選んでください',
      choices: '["10代", "20代", "30代", "40代", "50代", "60代以上"]',
      is_required: false
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
      case 5:
        return (
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
        return (
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

      {/* Questions Content */}
      <Box sx={{ backgroundColor: '#FFFFFF' }}>
        {sampleQuestions.map((question, index) => renderQuestion(question, index))}

        {/* Navigation Section */}
        <Box sx={{ py: 4, textAlign: 'center', backgroundColor: '#FFFFFF' }}>
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
    </Box>
  );
};

export default PreviewQuestions;