import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Container,
  Paper,
  useTheme,
  useMediaQuery,
  Fade
} from '@mui/material';
import { stringToColor } from '../../lib/supabase';
import { TournamentState, generateComparisonQuestion } from '../../config/questions/tournamentLogic';

const TournamentComparisonQuestion = ({ 
  question, 
  themeColor, 
  currentQuestion, 
  totalQuestions, 
  onAnswerChange 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [tournamentState, setTournamentState] = useState(null);
  const [allMatches, setAllMatches] = useState([]);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [visibleCount, setVisibleCount] = useState(1);
  const [isComplete, setIsComplete] = useState(false);

  // Get attributes from question config
  const attributes = useMemo(() => {
    return question.attributes || question.tournament_attributes || [
      {
        id: 'taste',
        name: '味',
        positive: '味は美味しい',
        negative: '味はいまいちな',
        positive_conjunction: 'が、',
        negative_conjunction: 'だが、'
      },
      {
        id: 'service',
        name: '接客',
        positive: '店員は親切',
        negative: '店員の対応が冷たい',
        positive_conjunction: 'だが、',
        negative_conjunction: 'だが、'
      },
      {
        id: 'space',
        name: '空間',
        positive: 'プライベート感のある空間',
        negative: '席同士が近くて騒がしい',
        positive_conjunction: 'だが、',
        negative_conjunction: 'だが、'
      },
      {
        id: 'hygiene',
        name: '衛生',
        positive: '店内はきれい',
        negative: '店内が汚い',
        positive_conjunction: 'だが、',
        negative_conjunction: 'だが、'
      },
      {
        id: 'price',
        name: '価格',
        positive: '値段は安い',
        negative: '値段が高い',
        positive_conjunction: 'が、',
        negative_conjunction: 'だが、'
      }
    ];
  }, [question]);

  // Initialize tournament state and generate all matches
  useEffect(() => {
    const targetRanks = question.target_ranks || 2;
    const state = new TournamentState(attributes, targetRanks);
    setTournamentState(state);
    
    // Generate all 6 matches upfront
    const matches = [];
    const tempState = new TournamentState(attributes, targetRanks);
    
    for (let i = 0; i < 6; i++) {
      const match = tempState.getNextMatch(i);
      if (match) {
        const [attr1, attr2] = match;
        const matchQuestion = generateComparisonQuestion(attr1, attr2, attributes, false);
        if (matchQuestion) {
          matches.push({
            ...matchQuestion,
            index: i,
            attr1,
            attr2
          });
        }
        // Simulate selection to continue flow
        tempState.recordMatch(attr1, attr2, i);
      }
    }
    
    setAllMatches(matches);
    setSelectedOptions({});
    setVisibleCount(1);
    setIsComplete(false);
  }, [attributes, question.target_ranks]);

  const handleOptionSelect = (matchIndex, option) => {
    const match = allMatches[matchIndex];
    if (!match || !tournamentState) return;
    
    // Check if this is the last answered question and same option - if so, deselect
    let lastAnsweredIndex = -1;
    for (let i = visibleCount - 1; i >= 0; i--) {
      if (selectedOptions[i] !== undefined) {
        lastAnsweredIndex = i;
        break;
      }
    }
    
    let newSelectedOptions;
    let shouldDeselect = false;
    
    if (matchIndex === lastAnsweredIndex && selectedOptions[matchIndex] === option) {
      // Deselect the option
      newSelectedOptions = { ...selectedOptions };
      delete newSelectedOptions[matchIndex];
      shouldDeselect = true;
      
      // Remove the match from tournament state
      const newTournamentState = new TournamentState(attributes, question.target_ranks || 2);
      // Replay all matches except the deselected one
      for (let i = 0; i < matchIndex; i++) {
        if (newSelectedOptions[i]) {
          const m = allMatches[i];
          const w = newSelectedOptions[i] === 'A' ? m.attr1 : m.attr2;
          const l = newSelectedOptions[i] === 'A' ? m.attr2 : m.attr1;
          newTournamentState.recordMatch(w, l, i);
        }
      }
      setTournamentState(newTournamentState);
      
      // Hide questions after the deselected one
      setVisibleCount(matchIndex + 1);
    } else if (matchIndex === lastAnsweredIndex && selectedOptions[matchIndex] !== option) {
      // If trying to change selection on last answered question, ignore
      // Only deselection is allowed
      return;
    } else {
      // Normal selection
      newSelectedOptions = {
        ...selectedOptions,
        [matchIndex]: option
      };
      
      // Record match in tournament state
      const winner = option === 'A' ? match.attr1 : match.attr2;
      const loser = option === 'A' ? match.attr2 : match.attr1;
      tournamentState.recordMatch(winner, loser, matchIndex);
      
      // Show next question after a short delay
      if (matchIndex === visibleCount - 1 && visibleCount < 6) {
        setTimeout(() => {
          setVisibleCount(visibleCount + 1);
        }, 300);
      }
    }
    
    setSelectedOptions(newSelectedOptions);
    
    // Check if tournament is complete
    const matchesRecorded = Object.keys(newSelectedOptions).length;
    let tournamentComplete = false;
    if (matchesRecorded >= 6) {
      const first = tournamentState.checkFirstPlace();
      const second = first ? tournamentState.checkSecondPlace() : null;
      if (first && second) {
        tournamentComplete = true;
        setIsComplete(true);
      }
    } else {
      setIsComplete(false);
    }
    
    // Save answer
    const answerData = {
      selections: newSelectedOptions,
      matches: tournamentState.matches,
      complete: tournamentComplete,
      currentIndex: matchIndex
    };
    
    onAnswerChange(question.id, {
      questionTypeId: question.question_type_id,
      answer: JSON.stringify(answerData)
    });
  };

  const isQuestionAnswered = (index) => {
    return selectedOptions[index] !== undefined;
  };

  const isQuestionEditable = (index) => {
    // Find the last answered question
    let lastAnsweredIndex = -1;
    for (let i = visibleCount - 1; i >= 0; i--) {
      if (isQuestionAnswered(i)) {
        lastAnsweredIndex = i;
        break;
      }
    }
    
    // If no questions answered, only first is editable
    if (lastAnsweredIndex === -1) {
      return index === 0;
    }
    
    // Last answered question and next unanswered are editable
    return index === lastAnsweredIndex || index === lastAnsweredIndex + 1;
  };

  if (!tournamentState || allMatches.length === 0) {
    return <Container maxWidth={false} sx={{ width: '100%', px: 0 }}>
      <Box sx={{ pt: '50px', textAlign: 'center' }}>
        <Typography>質問を準備中...</Typography>
      </Box>
    </Container>;
  }

  return (
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
        </Box>

        {/* All Questions */}
        <Box sx={{ 
          width: '100%', 
          maxWidth: 800,
          display: 'flex',
          flexDirection: 'column',
          gap: 3
        }}>
          {allMatches.map((match, index) => (
            <Fade
              key={index}
              in={index < visibleCount}
              timeout={600}
              style={{ 
                transitionDelay: index < visibleCount ? '100ms' : '0ms' 
              }}
            >
              <Box 
                sx={{ 
                  display: index < visibleCount ? 'block' : 'none'
                }}
              >
                {/* Question Number with divider lines */}
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  mb: 2,
                  width: '100%'
                }}>
                  <Box sx={{ 
                    flex: 1, 
                    height: '1px', 
                    backgroundColor: '#E5E7EB' 
                  }} />
                  <Typography
                    variant="h6"
                    sx={{
                      color: stringToColor(themeColor),
                      fontSize: '1.125rem',
                      fontFamily: '"Noto Sans JP", sans-serif',
                      fontWeight: 600,
                      mx: 3
                    }}
                  >
                    質問{index + 1}
                  </Typography>
                  <Box sx={{ 
                    flex: 1, 
                    height: '1px', 
                    backgroundColor: '#E5E7EB' 
                  }} />
                </Box>
                
                <Box sx={{ 
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  width: '100%',
                  opacity: isQuestionAnswered(index) ? 0.3 : 1,
                  transition: 'opacity 0.3s ease'
                }}>
                  {/* Option A */}
                  <Paper
                    elevation={selectedOptions[index] === 'A' ? 8 : 2}
                    onClick={() => isQuestionEditable(index) && handleOptionSelect(index, 'A')}
                    sx={{
                      p: isMobile ? 2 : 3,
                      cursor: isQuestionEditable(index) ? 'pointer' : 'default',
                      borderRadius: '12px',
                      border: selectedOptions[index] === 'A' ? `3px solid ${stringToColor(themeColor)}` : '3px solid transparent',
                      backgroundColor: selectedOptions[index] === 'A' ? `${stringToColor(themeColor)}08` : 'white',
                      transition: 'all 0.3s ease',
                      '&:hover': isQuestionEditable(index) ? {
                        transform: 'translateY(-2px)',
                        boxShadow: theme.shadows[4]
                      } : {}
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography
                        sx={{
                          color: stringToColor(themeColor),
                          fontSize: isMobile ? '1rem' : '1.125rem',
                          fontFamily: '"Noto Sans JP", sans-serif',
                          fontWeight: 700,
                          minWidth: 'fit-content'
                        }}
                      >
                        A店
                      </Typography>
                      <Typography
                        sx={{
                          color: '#14181B',
                          fontSize: isMobile ? '0.875rem' : '1rem',
                          fontFamily: '"Noto Sans JP", sans-serif',
                          lineHeight: 1.6,
                          fontWeight: selectedOptions[index] === 'A' ? 600 : 400,
                          flex: 1
                        }}
                      >
                        {match.option_a_text}
                      </Typography>
                    </Box>
                  </Paper>

                  {/* Option B */}
                  <Paper
                    elevation={selectedOptions[index] === 'B' ? 8 : 2}
                    onClick={() => isQuestionEditable(index) && handleOptionSelect(index, 'B')}
                    sx={{
                      p: isMobile ? 2 : 3,
                      cursor: isQuestionEditable(index) ? 'pointer' : 'default',
                      borderRadius: '12px',
                      border: selectedOptions[index] === 'B' ? `3px solid ${stringToColor(themeColor)}` : '3px solid transparent',
                      backgroundColor: selectedOptions[index] === 'B' ? `${stringToColor(themeColor)}08` : 'white',
                      transition: 'all 0.3s ease',
                      '&:hover': isQuestionEditable(index) ? {
                        transform: 'translateY(-2px)',
                        boxShadow: theme.shadows[4]
                      } : {}
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography
                        sx={{
                          color: stringToColor(themeColor),
                          fontSize: isMobile ? '1rem' : '1.125rem',
                          fontFamily: '"Noto Sans JP", sans-serif',
                          fontWeight: 700,
                          minWidth: 'fit-content'
                        }}
                      >
                        B店
                      </Typography>
                      <Typography
                        sx={{
                          color: '#14181B',
                          fontSize: isMobile ? '0.875rem' : '1rem',
                          fontFamily: '"Noto Sans JP", sans-serif',
                          lineHeight: 1.6,
                          fontWeight: selectedOptions[index] === 'B' ? 600 : 400,
                          flex: 1
                        }}
                      >
                        {match.option_b_text}
                      </Typography>
                    </Box>
                  </Paper>
                </Box>
                
                {/* Remaining questions indicator - show for unanswered questions */}
                {!isQuestionAnswered(index) && index > 0 && index < 5 && (
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#6B7280',
                      fontSize: '0.875rem',
                      fontFamily: '"Noto Sans JP", sans-serif',
                      textAlign: 'center',
                      mt: 3
                    }}
                  >
                    残り{5 - index}問
                  </Typography>
                )}
              </Box>
            </Fade>
          ))}
          
          
        </Box>
      </Box>
    </Container>
  );
};

export default TournamentComparisonQuestion;