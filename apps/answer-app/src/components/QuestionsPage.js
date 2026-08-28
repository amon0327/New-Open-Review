import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  getReviewForm,
  getReviewFormPages,
  getReviewFormSettings,
  getQuestionScreenSettings,
  getReviewQuestions,
  stringToColor,
  saveReviewFormAnswers,
  submitAnswersWithLottery,
  getCurrentUser,
  getAllReviewQuestions,
  checkBusinessHours,
  savePresetQuestionAnswers,
  savePresetDetailAnswers,
  savePresetUserFeatures,
  supabase
} from '../lib/supabase';

// Import question type components
import ShortTextQuestion from './QuestionTypes/ShortTextQuestion';
import LongTextQuestion from './QuestionTypes/LongTextQuestion';
import SingleChoiceQuestion from './QuestionTypes/SingleChoiceQuestion';
import MultipleChoiceQuestion from './QuestionTypes/MultipleChoiceQuestion';
import SingleChoiceMatrixQuestion from './QuestionTypes/SingleChoiceMatrixQuestion';
import MultipleChoiceMatrixQuestion from './QuestionTypes/MultipleChoiceMatrixQuestion';
import LinearScaleQuestion from './QuestionTypes/LinearScaleQuestion';
import PullDownQuestion from './QuestionTypes/PullDownQuestion';
import PreviewIndicator from './PreviewIndicator';
import DrawingLoadingScreen from './DrawingLoadingScreen';

const QuestionsPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // State management
  const [loading, setLoading] = useState(true);
  const [reviewForm, setReviewForm] = useState(null);
  const [formSettings, setFormSettings] = useState(null);
  const [questionSettings, setQuestionSettings] = useState(null);
  const [allPages, setAllPages] = useState([]);
  const [currentPageData, setCurrentPageData] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [allQuestions, setAllQuestions] = useState([]);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [showDrawingLoading, setShowDrawingLoading] = useState(false);

  const reviewFormId = searchParams.get('reviewFormId');
  const currentPage = parseInt(searchParams.get('page') || '1');
  const isPreviewMode = searchParams.get('mode') === 'preview';
  const storeCode = searchParams.get('storeCode');

  useEffect(() => {
    loadQuestionsData();
    loadCurrentUser();
  }, [reviewFormId, currentPage]);

  // Handle OAuth redirect flow
  useEffect(() => {
    const handleOAuthRedirect = async () => {

      // Check if this is an OAuth redirect (no reviewFormId in URL but has pending one in localStorage)
      if (!reviewFormId) {
        const pendingReviewFormId = localStorage.getItem('pendingReviewFormId');
        const pendingStoreCode = localStorage.getItem('pendingStoreCode');

        if (pendingReviewFormId) {
          // DON'T remove from localStorage yet - keep it as backup
          const storeParam = pendingStoreCode ? `&storeCode=${pendingStoreCode}` : '';
          navigate(`/questions?reviewFormId=${pendingReviewFormId}&page=1${storeParam}`, { replace: true });
          return; // Exit early to prevent loading with null reviewFormId
        } else {
          // Small delay to allow localStorage to be ready
          setTimeout(() => {
            const delayedCheck = localStorage.getItem('pendingReviewFormId');
            const delayedStoreCode = localStorage.getItem('pendingStoreCode');
            if (delayedCheck) {
              const storeParam = delayedStoreCode ? `&storeCode=${delayedStoreCode}` : '';
              navigate(`/questions?reviewFormId=${delayedCheck}&page=1${storeParam}`, { replace: true });
            } else {
              navigate('/not-found');
            }
          }, 500);
          return;
        }
      } else {
        // If we have reviewFormId, clean up localStorage
        const pendingReviewFormId = localStorage.getItem('pendingReviewFormId');
        const pendingStoreCode = localStorage.getItem('pendingStoreCode');
        if (pendingReviewFormId) {
          localStorage.removeItem('pendingReviewFormId');
        }
        if (pendingStoreCode) {
          localStorage.removeItem('pendingStoreCode');
        }
      }
    };

    handleOAuthRedirect();
  }, [reviewFormId, navigate]);

  // Check page access rights after data is loaded
  useEffect(() => {
    if (!loading && allPages.length > 0 && allQuestions.length > 0) {
      if (!checkPageAccess()) {
        // User is trying to access a page they shouldn't
        const firstIncompletePage = findFirstIncompletePageNumber();
        
        // If all pages are completed but user is trying to access a page beyond the last page
        const redirectPage = firstIncompletePage > allPages.length ? allPages.length : firstIncompletePage;
        
        
        // Redirect to the first incomplete page
        navigate(`/questions?reviewFormId=${reviewFormId}&page=${redirectPage}`, { replace: true });
      }
    }
  }, [loading, allPages, allQuestions, answers, currentPage, reviewFormId, navigate]);

  const loadCurrentUser = async () => {
    // プレビューモードではダミーユーザーを設定
    if (isPreviewMode) {
      setCurrentUser({ id: 'preview-user', email: 'preview@example.com' });
      return;
    }

    try {
      const user = await getCurrentUser();
      if (!user) {
        // User not logged in, redirect to home
        navigate(`/?reviewFormId=${reviewFormId}`);
        return;
      }
      setCurrentUser(user);
    } catch (error) {
      console.error('Error loading current user:', error);
      navigate(`/?reviewFormId=${reviewFormId}`);
    }
  };

  const loadQuestionsData = async () => {
    if (!reviewFormId) {
      // Don't navigate here - let the OAuth redirect handler manage this
      return;
    }

    setLoading(true);
    
    try {
      // Load form basic data and settings
      const [formData, settingsData, questionSettingsData, pagesData, allQuestionsData] = await Promise.all([
        getReviewForm(reviewFormId, isPreviewMode),
        getReviewFormSettings(reviewFormId),
        getQuestionScreenSettings(reviewFormId),
        getReviewFormPages(reviewFormId),
        getAllReviewQuestions(reviewFormId)
      ]);

      // If no pages, skip to completion
      if (!formData) {
        navigate('/not-found');
        return;
      }
      
      if (!pagesData || pagesData.length === 0) {
        // No regular questions, skip to completion
        navigate(`/completion?reviewFormId=${reviewFormId}${storeCode ? `&storeCode=${storeCode}` : ''}`);
        return;
      }

      setReviewForm(formData);
      setFormSettings(settingsData);
      setQuestionSettings(questionSettingsData);
      setAllPages(pagesData);
      setAllQuestions(allQuestionsData);

      // Find current page
      const pageData = pagesData.find(page => page.page_number === currentPage);
      if (!pageData) {
        navigate('/not-found');
        return;
      }

      setCurrentPageData(pageData);

      // Load questions for current page
      const questionsData = await getReviewQuestions(reviewFormId, pageData.id);
      
      // Check if current page has no questions
      if (!questionsData || questionsData.length === 0) {
        console.log('No questions found for page:', currentPage);
        
        // If this is the last page and no questions, go to completion
        if (currentPage >= pagesData.length) {
          const storeParam = storeCode ? `&storeCode=${storeCode}` : '';
          navigate(`/completion?reviewFormId=${reviewFormId}${storeParam}`);
          return;
        }
        
        // Otherwise, automatically skip to next page
        const storeParam = storeCode ? `&storeCode=${storeCode}` : '';
        navigate(`/questions?reviewFormId=${reviewFormId}&page=${currentPage + 1}${storeParam}`);
        return;
      }
      
      setQuestions(questionsData);

      // Load stored answers from localStorage (persist across pages)
      const storedAnswers = localStorage.getItem(`answers_${reviewFormId}`);
      if (storedAnswers) {
        setAnswers(JSON.parse(storedAnswers));
      }

    } catch (error) {
      console.error('Error loading questions data:', error);
      navigate('/not-found');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId, answerData) => {
    const newAnswers = {
      ...answers,
      [questionId]: answerData
    };
    setAnswers(newAnswers);
    
    // Persist answers to localStorage
    localStorage.setItem(`answers_${reviewFormId}`, JSON.stringify(newAnswers));
    
    // Update progress information (only if data is loaded)
    if (allPages.length > 0 && allQuestions.length > 0) {
      const lastCompletedPage = findLastCompletedPageNumber();
      const firstIncompletePage = findFirstIncompletePageNumber();
      const maxAccessiblePage = firstIncompletePage;
      localStorage.setItem(`progress_${reviewFormId}`, JSON.stringify({
        lastCompletedPage,
        firstIncompletePage,
        maxAccessiblePage,
        lastUpdated: new Date().toISOString()
      }));
    }
  };

  const validateCurrentPageRequiredQuestions = () => {
    const errors = {};
    let hasErrors = false;

    // Get current page questions
    const currentQuestions = questions;
    
    currentQuestions.forEach(question => {
      if (question.is_required) {
        const answer = answers[question.id];
        let isAnswered = false;

        if (answer) {
          // Check different question types
          switch (question.question_types_id) {
            case 1: // Short text
            case 2: // Long text
              isAnswered = answer.answer && answer.answer.trim() !== '';
              break;
            case 3: // Single choice
            case 8: // Pull down
              isAnswered = answer.answer && answer.answer !== '' && answer.answer !== null;
              break;
            case 4: // Multiple choice
              isAnswered = answer.answers && answer.answers !== null && answer.answers.length > 0;
              break;
            case 5: // Single choice matrix
              isAnswered = answer.answer && answer.answer !== '' && answer.answer !== null;
              break;
            case 6: // Multiple choice matrix
              isAnswered = answer.answers && answer.answers !== null && answer.answers.length > 0;
              break;
            case 7: // Linear scale
              isAnswered = answer.answer && answer.answer !== '' && answer.answer !== null;
              break;
            default:
              isAnswered = answer.answer && answer.answer !== '';
          }
        }

        if (!isAnswered) {
          errors[question.id] = '必須項目です。回答してください。';
          hasErrors = true;
        }
      }
    });

    setValidationErrors(errors);
    return !hasErrors;
  };

  const validateAllRequiredQuestions = () => {
    const errors = {};
    let hasErrors = false;
    let firstErrorQuestionId = null;

    // Get all questions across all pages
    allQuestions.forEach(question => {
      if (question.is_required) {
        const answer = answers[question.id];
        let isAnswered = false;

        if (answer) {
          // Check different question types
          switch (question.question_types_id) {
            case 1: // Short text
            case 2: // Long text
              isAnswered = answer.answer && answer.answer.trim() !== '';
              break;
            case 3: // Single choice
            case 8: // Pull down
              isAnswered = answer.answer && answer.answer !== '' && answer.answer !== null;
              break;
            case 4: // Multiple choice
              isAnswered = answer.answers && answer.answers !== null && answer.answers.length > 0;
              break;
            case 5: // Single choice matrix
              isAnswered = answer.answer && answer.answer !== '' && answer.answer !== null;
              break;
            case 6: // Multiple choice matrix
              isAnswered = answer.answers && answer.answers !== null && answer.answers.length > 0;
              break;
            case 7: // Linear scale
              isAnswered = answer.answer && answer.answer !== '' && answer.answer !== null;
              break;
            default:
              isAnswered = answer.answer && answer.answer !== '';
          }
        }

        if (!isAnswered) {
          errors[question.id] = '必須項目です。回答してください。';
          hasErrors = true;
          if (!firstErrorQuestionId) {
            firstErrorQuestionId = question.id;
          }
        }
      }
    });

    setValidationErrors(errors);
    return { isValid: !hasErrors, firstErrorQuestionId };
  };

  const scrollToQuestion = (questionId) => {
    const questionElement = document.getElementById(`question-${questionId}`);
    if (questionElement) {
      questionElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
      // Add highlight effect
      questionElement.style.animation = 'highlightError 2s ease-out';
      setTimeout(() => {
        if (questionElement) {
          questionElement.style.animation = '';
        }
      }, 2000);
    }
  };

  // Check if a question is properly answered
  const isQuestionAnswered = (question, answer) => {
    if (!answer) return false;
    
    let isAnswered = false;
    switch (question.question_types_id) {
      case 1: // Short text
      case 2: // Long text
        isAnswered = answer.answer && answer.answer.trim() !== '';
        break;
      case 3: // Single choice
      case 8: // Pull down
        isAnswered = answer.answer && answer.answer !== '' && answer.answer !== null;
        break;
      case 4: // Multiple choice
        isAnswered = answer.answers && answer.answers !== null && answer.answers.length > 0;
        break;
      case 5: // Single choice matrix
        isAnswered = answer.answer && answer.answer !== '' && answer.answer !== null;
        break;
      case 6: // Multiple choice matrix
        isAnswered = answer.answers && answer.answers !== null && answer.answers.length > 0;
        break;
      case 7: // Linear scale
      case 9: // Recommended score (NPS)
        isAnswered = answer.answer && answer.answer !== '' && answer.answer !== null;
        break;
      default:
        isAnswered = answer.answer && answer.answer !== '';
    }
    
    return isAnswered;
  };

  // Find the first page with unanswered required questions
  const findFirstIncompletePageNumber = () => {
    for (let i = 0; i < allPages.length; i++) {
      const page = allPages[i];
      const pageNumber = i + 1;
      
      // Get questions for this page
      const pageQuestions = allQuestions.filter(q => q.page_id === page.id);
      
      // Check if any required questions are unanswered
      const hasIncompleteRequired = pageQuestions.some(question => {
        if (!question.is_required) return false; // Non-required questions don't block progress
        
        const answer = answers[question.id];
        return !isQuestionAnswered(question, answer);
      });
      
      if (hasIncompleteRequired) {
        return pageNumber;
      }
    }
    
    // All pages completed
    return allPages.length + 1; // Beyond last page means all completed
  };

  // Find the last completed page number (all required questions answered)
  const findLastCompletedPageNumber = () => {
    let lastCompletedPage = 0;
    
    for (let i = 0; i < allPages.length; i++) {
      const page = allPages[i];
      const pageNumber = i + 1;
      
      // Get questions for this page
      const pageQuestions = allQuestions.filter(q => q.page_id === page.id);
      
      // Check if all required questions on this page are answered
      const allRequiredAnswered = pageQuestions.every(question => {
        if (!question.is_required) return true; // Non-required questions don't block progress
        
        const answer = answers[question.id];
        return isQuestionAnswered(question, answer);
      });
      
      if (allRequiredAnswered) {
        lastCompletedPage = pageNumber;
      } else {
        // Found first incomplete page, stop here
        break;
      }
    }
    
    return lastCompletedPage;
  };

  // Check if current page access is valid
  const checkPageAccess = () => {
    if (!allPages.length || !allQuestions.length) return true; // Still loading
    
    // Always allow page 1
    if (currentPage === 1) return true;
    
    // For other pages, check if there are any incomplete pages before this one
    const firstIncompletePage = findFirstIncompletePageNumber();
    
    // If there's an incomplete page before the current page, access is denied
    return firstIncompletePage >= currentPage;
  };

  const handleNextClick = () => {
    // Clear previous validation errors
    setValidationErrors({});
    
    // Validate current page required questions
    if (!validateCurrentPageRequiredQuestions()) {
      // Find first error question and scroll to it
      const currentQuestions = questions;
      const firstErrorQuestion = currentQuestions.find(q => 
        q.is_required && validationErrors[q.id]
      );
      
      if (firstErrorQuestion) {
        setTimeout(() => scrollToQuestion(firstErrorQuestion.id), 100);
      }
      return;
    }
    
    const totalPages = allPages.length;
    
    if (currentPage >= totalPages) {
      // Final page - validate all questions before showing submit dialog
      const { isValid, firstErrorQuestionId } = validateAllRequiredQuestions();
      
      if (!isValid) {
        // Find the page containing the first error question
        const errorQuestion = allQuestions.find(q => q.id === firstErrorQuestionId);
        if (errorQuestion) {
          const errorPage = allPages.find(page => page.id === errorQuestion.page_id);
          if (errorPage) {
            const errorPageNumber = allPages.indexOf(errorPage) + 1;
            if (errorPageNumber !== currentPage) {
              // Navigate to the page with the error
              navigate(`/questions?reviewFormId=${reviewFormId}&page=${errorPageNumber}`);
              // Set a timeout to scroll after navigation
              setTimeout(() => scrollToQuestion(firstErrorQuestionId), 500);
            } else {
              // Error is on current page, just scroll
              scrollToQuestion(firstErrorQuestionId);
            }
          }
        }
        return;
      }
      
      // All required questions answered - show submit confirmation
      setShowSubmitDialog(true);
    } else {
      // Go to next page
      const nextPage = currentPage + 1;
      const storeParam = storeCode ? `&storeCode=${storeCode}` : '';
      navigate(`/questions?reviewFormId=${reviewFormId}&page=${nextPage}${storeParam}`);
    }
  };

  const handleSubmitConfirm = async () => {
    setSubmitting(true);
    
    try {
      // プレビューモードでは保存をスキップして動画画面表示
      if (isPreviewMode) {
        setShowSubmitDialog(false);
        setShowDrawingLoading(true);
        return;
      }

      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // Check business hours before submitting
      const isWithinBusinessHours = await checkBusinessHours(reviewFormId);
      if (!isWithinBusinessHours) {
        navigate('/unauthorized');
        return;
      }

      // 必須質問の回答を取得して統合
      const requiredAnswers = JSON.parse(localStorage.getItem('requiredQuestionAnswers') || '{}');
      const allAnswers = { ...requiredAnswers, ...answers };
      
      // 選択された項目情報を取得
      const selectedAspectInfo = JSON.parse(localStorage.getItem('selectedAspectInfo') || 'null');
      
      // Submit answers with lottery logic (storeCodeも渡す)
      const result = await submitAnswersWithLottery(reviewFormId, currentUser.id, allAnswers, storeCode, selectedAspectInfo);
      
      if (result.success) {
        // Note: All data saving including preset answers is handled by the Edge Function
        console.log('All answers saved successfully by Edge Function');
        
        // Clear stored answers and progress
        localStorage.removeItem(`answers_${reviewFormId}`);
        localStorage.removeItem(`progress_${reviewFormId}`);
        localStorage.removeItem('requiredQuestionAnswers');
        localStorage.removeItem('selectedAspectInfo');
        
        setShowSubmitDialog(false);
        
        // Handle different lottery results
        if (!result.isEligible) {
          // User answered within 5 days - redirect to cooldown page
          navigate(`/cooldown?reviewFormId=${reviewFormId}`);
          return;
        }
        
        // Store submission data for later use
        window.submissionData = { 
          reviewFormId, 
          submissionId: result.submissionId,
          isWinner: result.isWinner,
          message: result.message,
          winnerId: result.winnerId
        };
        
        // Show drawing loading screen
        setShowDrawingLoading(true);
      } else {
        throw new Error(result.error || 'Failed to save answers');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      
      // Show specific error messages based on error type
      let errorMessage = '回答の送信に失敗しました。もう一度お試しください。';
      
      if (error.message.includes('not authenticated')) {
        errorMessage = 'ログインセッションが切れています。ページを再読み込みしてログインしてください。';
      } else if (error.message.includes('foreign key constraint')) {
        errorMessage = 'ユーザー情報の同期に失敗しました。ページを再読み込みして再度お試しください。';
      } else if (error.message.includes('duplicate key')) {
        errorMessage = 'この回答は既に送信済みです。';
      } else if (error.code === '23503') {
        errorMessage = 'ユーザー情報が見つかりません。ページを再読み込みして再度お試しください。';
      }
      
      alert(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle drawing loading completion
  const handleDrawingComplete = () => {
    setShowDrawingLoading(false);
    
    if (isPreviewMode) {
      navigate(`/completion?reviewFormId=${reviewFormId}&mode=preview`);
    } else {
      const submissionData = window.submissionData;
      if (submissionData) {
        if (submissionData.isWinner) {
          // Navigate to winner page with token
          navigate(`/winner?reviewFormId=${submissionData.reviewFormId}&submissionId=${submissionData.submissionId}&token=${submissionData.winnerId}`);
        } else {
          // Navigate to regular completion page
          navigate(`/completion?reviewFormId=${submissionData.reviewFormId}&submissionId=${submissionData.submissionId}`);
        }
        delete window.submissionData; // Clean up
      } else {
        // Fallback
        navigate(`/completion?reviewFormId=${reviewFormId}`);
      }
    }
  };

  const renderQuestion = (question, index) => {
    const questionNumber = index + 1;
    const totalQuestions = questions.length;
    const themeColor = formSettings?.theme_color || '#8C52FF';
    const hasValidationError = validationErrors[question.id];

    // Add existing answer to question object
    const questionWithAnswer = {
      ...question,
      existingAnswer: answers[question.id]?.answer,
      existingAnswers: answers[question.id]?.answers,
      hasValidationError,
      validationMessage: validationErrors[question.id]
    };

    switch (question.question_types_id) {
      case 1:
        return (
          <Box key={question.id} id={`question-${question.id}`}>
            <ShortTextQuestion
              question={questionWithAnswer}
              themeColor={themeColor}
              currentQuestion={questionNumber}
              totalQuestions={totalQuestions}
              onAnswerChange={handleAnswerChange}
            />
          </Box>
        );
      case 2:
        return (
          <Box key={question.id} id={`question-${question.id}`}>
            <LongTextQuestion
              question={questionWithAnswer}
              themeColor={themeColor}
              currentQuestion={questionNumber}
              totalQuestions={totalQuestions}
              onAnswerChange={handleAnswerChange}
            />
          </Box>
        );
      case 3:
        return (
          <Box key={question.id} id={`question-${question.id}`}>
            <SingleChoiceQuestion
              question={questionWithAnswer}
              themeColor={themeColor}
              currentQuestion={questionNumber}
              totalQuestions={totalQuestions}
              onAnswerChange={handleAnswerChange}
            />
          </Box>
        );
      case 4:
        return (
          <Box key={question.id} id={`question-${question.id}`}>
            <MultipleChoiceQuestion
              question={questionWithAnswer}
              themeColor={themeColor}
              currentQuestion={questionNumber}
              totalQuestions={totalQuestions}
              onAnswerChange={handleAnswerChange}
            />
          </Box>
        );
      case 5:
        return (
          <Box key={question.id} id={`question-${question.id}`}>
            <SingleChoiceMatrixQuestion
              question={questionWithAnswer}
              themeColor={themeColor}
              currentQuestion={questionNumber}
              totalQuestions={totalQuestions}
              onAnswerChange={handleAnswerChange}
            />
          </Box>
        );
      case 6:
        return (
          <Box key={question.id} id={`question-${question.id}`}>
            <MultipleChoiceMatrixQuestion
              question={questionWithAnswer}
              themeColor={themeColor}
              currentQuestion={questionNumber}
              totalQuestions={totalQuestions}
              onAnswerChange={handleAnswerChange}
            />
          </Box>
        );
      case 7:
        return (
          <Box key={question.id} id={`question-${question.id}`}>
            <LinearScaleQuestion
              question={questionWithAnswer}
              themeColor={themeColor}
              currentQuestion={questionNumber}
              totalQuestions={totalQuestions}
              onAnswerChange={handleAnswerChange}
            />
          </Box>
        );
      case 8:
        return (
          <Box key={question.id} id={`question-${question.id}`}>
            <PullDownQuestion
              question={questionWithAnswer}
              themeColor={themeColor}
              currentQuestion={questionNumber}
              totalQuestions={totalQuestions}
              onAnswerChange={handleAnswerChange}
            />
          </Box>
        );
      case 9:
        return (
          <Box key={question.id} id={`question-${question.id}`}>
            <LinearScaleQuestion
              question={questionWithAnswer}
              themeColor={themeColor}
              currentQuestion={questionNumber}
              totalQuestions={totalQuestions}
              onAnswerChange={handleAnswerChange}
            />
          </Box>
        );
      default:
        return (
          <Box key={question.id} sx={{ py: 4 }}>
            <Typography>Unsupported question type: {question.question_types_id}</Typography>
          </Box>
        );
    }
  };

  if (loading) {
    return null;
  }

  const themeColor = formSettings?.theme_color || '#8C52FF';
  const headerImage = questionSettings?.header_image_url || 
    'https://misezukuri.com/wp-content/uploads/2023/10/Cafebar1.png';
  const logoUrl = formSettings?.logo_image_url;

  return (
    <>
      <PreviewIndicator isPreviewMode={isPreviewMode} themeColor={themeColor} />
      <Box
        component="style"
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes highlightError {
              0% {
                background-color: transparent;
              }
              50% {
                background-color: rgba(244, 67, 54, 0.1);
                box-shadow: 0 0 20px rgba(244, 67, 54, 0.3);
              }
              100% {
                background-color: transparent;
              }
            }
          `
        }}
      />
      <Box
        sx={{
          minHeight: '100vh',
          backgroundColor: isMobile ? '#F1F4F8' : '#FFFFFF',
          // Hide scrollbars
          '&::-webkit-scrollbar': {
            display: 'none'
          },
          msOverflowStyle: 'none',
          scrollbarWidth: 'none',
          // Prevent mobile overscroll bounce
          overscrollBehavior: 'none',
          // Prevent pull-to-refresh on mobile
          touchAction: 'pan-x pan-y'
        }}
      >
        {/* Glass Header Bar for PC */}
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
            {logoUrl && (
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
            )}
          </Box>
        )}

        {/* Header Image Section */}
        <Box
          sx={{
            position: 'relative',
            height: isMobile ? 250 : 270,
            overflow: 'hidden',
            width: '100%',
            marginTop: isMobile ? 0 : '65px'
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
          {isMobile && logoUrl && (
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

        {/* Content Container - Limited Width */}
        <Container
          maxWidth={false}
          sx={{
            width: isMobile ? '100%' : '100%',
            // Hide scrollbars
            '&::-webkit-scrollbar': {
              display: 'none'
            },
            msOverflowStyle: 'none',
            scrollbarWidth: 'none',
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
              {questions.map((question, index) => (
                <Box key={question.id} sx={{ mb: '50px' }}>
                  {renderQuestion(question, index)}
                </Box>
              ))}


              {/* Navigation Section */}
              <Box sx={{ 
                py: 4,
                // Chrome mobile navigation protection
                pb: isMobile ? 'max(48px, env(safe-area-inset-bottom))' : 4
              }}>
                {/* Back Link - text link style - with access control */}
                {currentPage > 1 && allPages.length > 1 && (
                  <Box sx={{ textAlign: 'center', mb: 2 }}>
                    <Typography
                      component="span"
                      onClick={() => {
                        const prevPage = currentPage - 1;
                        const storeParam = storeCode ? `&storeCode=${storeCode}` : '';
                        // Always allow going back to previous pages (they should be accessible)
                        navigate(`/questions?reviewFormId=${reviewFormId}&page=${prevPage}${storeParam}`);
                      }}
                      sx={{
                        color: '#6B7280',
                        fontSize: '0.875rem',
                        fontWeight: 400,
                        textDecoration: 'underline',
                        cursor: 'pointer',
                        fontFamily: '"Noto Sans JP", sans-serif',
                        '&:hover': {
                          color: '#4B5563',
                          textDecoration: 'none'
                        }
                      }}
                    >
                      ← 前のページに戻る
                    </Typography>
                  </Box>
                )}
                
                {/* Main Button */}
                <Box sx={{ 
                  textAlign: 'center',
                  // Additional protection for the button itself
                  mb: isMobile ? 'max(16px, env(safe-area-inset-bottom))' : 0
                }}>
                  <Button
                    variant="contained"
                    onClick={handleNextClick}
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
                    {currentPage >= allPages.length ? '送信' : '次へ進む'}
                  </Button>
                </Box>
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Submit Confirmation Dialog */}
      <Dialog
        open={showSubmitDialog}
        onClose={() => !submitting && setShowSubmitDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '24px',
            padding: isMobile ? 2 : 3,
            margin: isMobile ? 2 : 3,
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }
        }}
        BackdropProps={{
          sx: {
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(8px)'
          }
        }}
      >
        <Box sx={{ textAlign: 'center', py: 2 }}>
          {/* Icon */}
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              backgroundColor: `${stringToColor(themeColor)}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 3,
              border: `2px solid ${stringToColor(themeColor)}30`
            }}
          >
            <Box
              sx={{
                width: 28,
                height: 28,
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 2,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 3,
                  height: 16,
                  backgroundColor: stringToColor(themeColor),
                  borderRadius: '1.5px'
                },
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  bottom: 2,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 3,
                  height: 3,
                  backgroundColor: stringToColor(themeColor),
                  borderRadius: '50%'
                }
              }}
            />
          </Box>

          {/* Title */}
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              mb: 2,
              color: '#1a1a1a',
              fontSize: isMobile ? '1.3rem' : '1.5rem',
              letterSpacing: '-0.02em'
            }}
          >
            回答を送信しますか？
          </Typography>

          {/* Description */}
          <Typography
            sx={{
              color: '#6b7280',
              mb: 4,
              fontSize: isMobile ? '0.9rem' : '1rem',
              lineHeight: 1.6,
              fontWeight: 400
            }}
          >
            送信後は回答を変更できません。<br />
            内容をご確認の上、送信してください。
          </Typography>

          {/* Actions */}
          <Box 
            sx={{ 
              display: 'flex', 
              gap: 2,
              flexDirection: isMobile ? 'column-reverse' : 'row',
              justifyContent: 'center'
            }}
          >
            <Button
              onClick={() => setShowSubmitDialog(false)}
              disabled={submitting}
              sx={{
                minWidth: isMobile ? '100%' : 120,
                height: 48,
                borderRadius: '12px',
                color: '#6b7280',
                backgroundColor: 'rgba(107, 114, 128, 0.08)',
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '0.95rem',
                border: '1px solid rgba(107, 114, 128, 0.15)',
                '&:hover': {
                  backgroundColor: 'rgba(107, 114, 128, 0.12)',
                  borderColor: 'rgba(107, 114, 128, 0.25)'
                }
              }}
            >
              キャンセル
            </Button>
            <Button
              onClick={handleSubmitConfirm}
              disabled={submitting}
              variant="contained"
              sx={{
                minWidth: isMobile ? '100%' : 120,
                height: 48,
                borderRadius: '12px',
                backgroundColor: stringToColor(themeColor),
                color: 'white',
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '0.95rem',
                boxShadow: `0 4px 20px ${stringToColor(themeColor)}40`,
                '&:hover': {
                  backgroundColor: stringToColor(themeColor),
                  boxShadow: `0 6px 25px ${stringToColor(themeColor)}50`,
                  transform: 'translateY(-1px)'
                },
                '&:disabled': {
                  backgroundColor: 'rgba(107, 114, 128, 0.3)',
                  color: 'rgba(107, 114, 128, 0.6)',
                  boxShadow: 'none'
                }
              }}
            >
              {submitting ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress 
                    size={18} 
                    sx={{ color: 'rgba(255, 255, 255, 0.7)' }} 
                  />
                  <span>送信中...</span>
                </Box>
              ) : (
                '送信する'
              )}
            </Button>
          </Box>
        </Box>
      </Dialog>

      {/* Drawing Loading Screen */}
      {showDrawingLoading && (
        <DrawingLoadingScreen
          onComplete={handleDrawingComplete}
          themeColor={stringToColor(formSettings?.theme_color)}
        />
      )}
    </>
  );
};

export default QuestionsPage;