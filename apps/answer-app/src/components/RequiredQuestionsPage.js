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
  getReviewFormSettings,
  getQuestionScreenSettings,
  stringToColor,
  getCurrentUser,
  getReviewFormPages,
  getAllReviewQuestions,
  submitAnswersWithLottery,
  saveReviewFormAnswers,
  savePresetQuestionAnswers,
  savePresetDetailAnswers,
  savePresetUserFeatures,
  supabase
} from '../lib/supabase';

// Import required questions data
import { 
  REQUIRED_PAGES, 
  REQUIRED_QUESTIONS, 
  getRequiredQuestionsForPage, 
  getRequiredPageByNumber, 
  getTotalRequiredPages 
} from '../config/questions/requiredQuestions';

// Import conditional logic
import {
  generatePage3Questions,
  determineGroup,
  QUALITY_MATRIX_ITEMS,
  SERVICE_MATRIX_ITEMS,
  CLEANLINESS_MATRIX_ITEMS
} from '../config/questions/conditionalLogic';

// Import question type components
import ShortTextQuestion from './QuestionTypes/ShortTextQuestion';
import LongTextQuestion from './QuestionTypes/LongTextQuestion';
import SingleChoiceQuestion from './QuestionTypes/SingleChoiceQuestion';
import MultipleChoiceQuestion from './QuestionTypes/MultipleChoiceQuestion';
import SingleChoiceMatrixQuestion from './QuestionTypes/SingleChoiceMatrixQuestion';
import MultipleChoiceMatrixQuestion from './QuestionTypes/MultipleChoiceMatrixQuestion';
import LinearScaleQuestion from './QuestionTypes/LinearScaleQuestion';
import PullDownQuestion from './QuestionTypes/PullDownQuestion';
import SentimentMatrixQuestion from './QuestionTypes/SentimentMatrixQuestion';
import ComparisonQuestion from './QuestionTypes/ComparisonQuestion';
import TournamentComparisonQuestion from './QuestionTypes/TournamentComparisonQuestion';
import PreviewIndicator from './PreviewIndicator';
import DrawingLoadingScreen from './DrawingLoadingScreen';

const RequiredQuestionsPage = () => {
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
  const [currentGroup, setCurrentGroup] = useState(null);
  const [page3DynamicQuestions, setPage3DynamicQuestions] = useState(null);
  const [selectedAspectInfo, setSelectedAspectInfo] = useState(null);
  const [hasRegularQuestions, setHasRegularQuestions] = useState(false);
  const [showDrawingLoading, setShowDrawingLoading] = useState(false);

  const reviewFormId = searchParams.get('reviewFormId');
  const currentPage = parseInt(searchParams.get('page') || '1');
  const isPreviewMode = searchParams.get('mode') === 'preview';
  const storeCode = searchParams.get('storeCode');

  useEffect(() => {
    loadRequiredQuestionsData();
    loadCurrentUser();
  }, [reviewFormId, currentPage]);

  // Separate useEffect for selectedAspectInfo restoration
  useEffect(() => {
    // Only restore on pages 3, 4, 5
    if (currentPage >= 3 && !selectedAspectInfo) {
      const savedAspectInfo = localStorage.getItem('selectedAspectInfo');
      if (savedAspectInfo) {
        const restoredInfo = JSON.parse(savedAspectInfo);
        console.log(`Restoring selectedAspectInfo on page ${currentPage}:`, restoredInfo);
        setSelectedAspectInfo(restoredInfo);
      }
    }
  }, [currentPage]); // Only depend on currentPage, not selectedAspectInfo

  // Debug selectedAspectInfo
  useEffect(() => {
    console.log('selectedAspectInfo state updated:', selectedAspectInfo);
  }, [selectedAspectInfo]);

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
          navigate(`/required-questions?reviewFormId=${pendingReviewFormId}&page=1${storeParam}`, { replace: true });
          return; // Exit early to prevent loading with null reviewFormId
        } else {
          // Small delay to allow localStorage to be ready
          setTimeout(() => {
            const delayedCheck = localStorage.getItem('pendingReviewFormId');
            const delayedStoreCode = localStorage.getItem('pendingStoreCode');
            if (delayedCheck) {
              const storeParam = delayedStoreCode ? `&storeCode=${delayedStoreCode}` : '';
              navigate(`/required-questions?reviewFormId=${delayedCheck}&page=1${storeParam}`, { replace: true });
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
        
        console.log('Page access denied - currentPage:', currentPage, 'firstIncompletePage:', firstIncompletePage);
        
        // If all pages are completed but user is trying to access a page beyond the last page
        const redirectPage = firstIncompletePage > allPages.length ? allPages.length : firstIncompletePage;
        
        
        // Redirect to the first incomplete page
        const storeParam = storeCode ? `&storeCode=${storeCode}` : '';
        navigate(`/required-questions?reviewFormId=${reviewFormId}&page=${redirectPage}${storeParam}`, { replace: true });
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

  const loadRequiredQuestionsData = async () => {
    console.log('loadRequiredQuestionsData called - currentPage:', currentPage);
    
    if (!reviewFormId) {
      // Don't navigate here - let the OAuth redirect handler manage this
      return;
    }

    setLoading(true);
    
    try {
      // Load form basic data and settings
      const [formData, settingsData, questionSettingsData, regularPages, allRegularQuestions] = await Promise.all([
        getReviewForm(reviewFormId, isPreviewMode),
        getReviewFormSettings(reviewFormId),
        getQuestionScreenSettings(reviewFormId),
        getReviewFormPages(reviewFormId, isPreviewMode),
        getAllReviewQuestions(reviewFormId)
      ]);

      if (!formData) {
        navigate('/not-found');
        return;
      }

      setReviewForm(formData);
      setFormSettings(settingsData);
      setQuestionSettings(questionSettingsData);
      
      // Check if there are regular questions (pages exist AND questions exist)
      setHasRegularQuestions(regularPages && regularPages.length > 0 && allRegularQuestions && allRegularQuestions.length > 0);
      
      // Use hardcoded required pages and questions
      setAllPages(REQUIRED_PAGES);
      setAllQuestions(REQUIRED_QUESTIONS);

      // Find current page
      const pageData = getRequiredPageByNumber(currentPage);
      if (!pageData) {
        navigate('/not-found');
        return;
      }

      setCurrentPageData(pageData);

      // Load questions for current page
      let questionsData = getRequiredQuestionsForPage(currentPage);
      
      // For page 2, check if we need to add the additional question for Group C
      if (currentPage === 2) {
        // Check if user belongs to Group C based on page 1 answers
        const page1Answers = JSON.parse(localStorage.getItem('requiredQuestionAnswers') || '{}');
        
        // Debug logging
        console.log('Page 2 - Checking for Group C:', {
          page1Answers,
          hasNPS: !!page1Answers['required_1_1'],
          hasRevisit: !!page1Answers['required_1_2'],  
          hasExperience: !!page1Answers['required_1_3']
        });
        
        if (page1Answers['required_1_1'] && page1Answers['required_1_2'] && page1Answers['required_1_3']) {
          console.log('Revisit answer raw value:', page1Answers['required_1_2']);
          
          const npsScore = parseInt(page1Answers['required_1_1'].answer);
          // 再来店意向あり = 1ヶ月以内(1) または 3ヶ月以内(2)
          const revisitAnswer = page1Answers['required_1_2'].answer;
          const willRevisit = revisitAnswer === '1' || revisitAnswer === '2';
          const visitHistory = page1Answers['required_1_3'].answer;
          // 選択肢番号1が「初めて」なので、それ以外は経験あり
          const hasVisitedBefore = visitHistory !== '1' && visitHistory !== 'opt_1_3_1';
          
          const group = determineGroup(npsScore, willRevisit, hasVisitedBefore);
          setCurrentGroup(group);
          
          console.log('Group determination:', {
            npsScore,
            willRevisit,
            visitHistory,
            hasVisitedBefore,
            group
          });
          
          // Add the conditional question only if Group C
          if (group === 'C') {
            console.log('Group is C - Adding additional question');
            const conditionalQuestion = {
              id: 'required_2_4',
              review_fome_id: 'required',
              review_form_pages_id: 'required-page-2',
              pege_number: 2,
              question_type_id: 3,
              question_number: 4,
              question_text: 'ご来店中、何か気になる点はございましたか？',
              is_required: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              question_option_choices: [
                { id: 'opt_2_4_1', review_questions_id: 'required_2_4', choice_number: 1, choice_name: 'はい' },
                { id: 'opt_2_4_2', review_questions_id: 'required_2_4', choice_number: 2, choice_name: 'いいえ' }
              ],
              question_option_linear_scale: []
            };
            questionsData = [...questionsData, conditionalQuestion];
          } else {
            console.log('Group is NOT C - Group is:', group);
          }
        } else {
          console.log('Missing required answers for group determination');
        }
      }
      
      // For page 3, generate dynamic questions based on previous answers
      if (currentPage === 3) {
        const storedAnswers = JSON.parse(localStorage.getItem('requiredQuestionAnswers') || '{}');
        const page1Answers = {};
        const page2Answers = {};
        
        // Separate answers by page
        Object.keys(storedAnswers).forEach(questionId => {
          if (questionId.startsWith('required_1_')) {
            page1Answers[questionId] = storedAnswers[questionId];
          } else if (questionId.startsWith('required_2_')) {
            page2Answers[questionId] = storedAnswers[questionId];
          }
        });
        
        // Get additional answer for Group C from page 2
        const page2AdditionalAnswer = page2Answers['required_2_4']?.answer || null;
        
        // Generate page 3 questions
        console.log('Generating page 3 questions with:', {
          page1Answers,
          page2Answers,
          page2AdditionalAnswer
        });
        const dynamicQuestions = generatePage3Questions(page1Answers, page2Answers, page2AdditionalAnswer);
        console.log('Generated dynamic questions:', dynamicQuestions);
        
        if (dynamicQuestions) {
          setPage3DynamicQuestions(dynamicQuestions);
          const aspectInfo = {
            aspectLabel: dynamicQuestions.selectedAspect.label,
            aspectShortLabel: dynamicQuestions.selectedAspect.shortLabel,
            aspectType: dynamicQuestions.selectedAspect.aspectType,
            questionType: dynamicQuestions.questionType,
            selectedRating: dynamicQuestions.selectedRating,
            group: dynamicQuestions.group
          };
          console.log('Setting selectedAspectInfo:', aspectInfo);
          setSelectedAspectInfo(aspectInfo);
          // Save to localStorage for persistence across pages
          localStorage.setItem('selectedAspectInfo', JSON.stringify(aspectInfo));
          
          // Get aspect type to determine which matrix items to use
          let matrixItems = [];
          const aspectType = dynamicQuestions.selectedAspect.aspectType;
          
          if (aspectType === 'quality') {
            matrixItems = QUALITY_MATRIX_ITEMS;
          } else if (aspectType === 'service') {
            matrixItems = SERVICE_MATRIX_ITEMS;
          } else if (aspectType === 'cleanliness') {
            matrixItems = CLEANLINESS_MATRIX_ITEMS;
          }
          
          // Convert dynamic questions to the expected format
          const formattedQuestions = [
            {
              id: 'required_3_1',
              review_fome_id: 'required',
              review_form_pages_id: 'required-page-3',
              pege_number: 3,
              question_type_id: 10, // Sentiment Matrix
              question_number: 1,
              question_text: `${dynamicQuestions.selectedAspect.label}の詳細について教えてください`,
              is_required: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              question_option_choices: [],
              question_option_linear_scale: [],
              matrix_items: matrixItems
            }
          ];
          
          questionsData = formattedQuestions;
        } else {
          // Fallback to empty questions if generation fails
          questionsData = [];
        }
      }
      
      // For page 4, generate text questions based on page 3 selected aspect
      if (currentPage === 4) {
        const storedAnswers = JSON.parse(localStorage.getItem('requiredQuestionAnswers') || '{}');
        const page1Answers = {};
        const page2Answers = {};
        
        // Separate answers by page
        Object.keys(storedAnswers).forEach(questionId => {
          if (questionId.startsWith('required_1_')) {
            page1Answers[questionId] = storedAnswers[questionId];
          } else if (questionId.startsWith('required_2_')) {
            page2Answers[questionId] = storedAnswers[questionId];
          }
        });
        
        // Get additional answer for Group C from page 2
        const page2AdditionalAnswer = page2Answers['required_2_4']?.answer || null;
        
        // First try to get selectedAspectInfo from state or localStorage
        let aspectInfo = selectedAspectInfo;
        
        if (!aspectInfo) {
          // Try to restore from localStorage
          const savedAspectInfo = localStorage.getItem('selectedAspectInfo');
          if (savedAspectInfo) {
            aspectInfo = JSON.parse(savedAspectInfo);
            console.log('Restored selectedAspectInfo from localStorage for page 4:', aspectInfo);
            setSelectedAspectInfo(aspectInfo);
          }
        }
        
        // Only regenerate if absolutely necessary (should not happen in normal flow)
        if (!aspectInfo) {
          console.warn('selectedAspectInfo not found, regenerating (this should not happen in normal flow)');
          const dynamicQuestions = generatePage3Questions(page1Answers, page2Answers, page2AdditionalAnswer);
          
          if (dynamicQuestions && dynamicQuestions.selectedAspect) {
            aspectInfo = {
              aspectLabel: dynamicQuestions.selectedAspect.label,
              aspectShortLabel: dynamicQuestions.selectedAspect.shortLabel,
              aspectType: dynamicQuestions.selectedAspect.aspectType,
              questionType: dynamicQuestions.questionType,
              selectedRating: dynamicQuestions.selectedRating,
              group: dynamicQuestions.group
            };
            console.log('Generated new selectedAspectInfo on page 4:', aspectInfo);
            setSelectedAspectInfo(aspectInfo);
            // Save to localStorage for persistence
            localStorage.setItem('selectedAspectInfo', JSON.stringify(aspectInfo));
          }
        }
        
        if (aspectInfo && aspectInfo.aspectType) {
          const aspectType = aspectInfo.aspectType;
          
          let formattedQuestions = [];
          
          if (aspectType === 'quality') {
            formattedQuestions = [
              {
                id: 'required_4_1',
                review_fome_id: 'required',
                review_form_pages_id: 'required-page-4',
                pege_number: 4,
                question_type_id: 1, // Short text
                question_number: 1,
                question_text: '料理について、良かった点や改善してほしい点があればお聞かせください',
                is_required: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                question_option_choices: [],
                question_option_linear_scale: []
              },
              {
                id: 'required_4_2',
                review_fome_id: 'required',
                review_form_pages_id: 'required-page-4',
                pege_number: 4,
                question_type_id: 1, // Short text
                question_number: 2,
                question_text: 'ドリンクについて、良かった点や改善してほしい点があればお聞かせください',
                is_required: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                question_option_choices: [],
                question_option_linear_scale: []
              },
              {
                id: 'required_4_3',
                review_fome_id: 'required',
                review_form_pages_id: 'required-page-4',
                pege_number: 4,
                question_type_id: 1, // Short text
                question_number: 3,
                question_text: 'メニューについて、良かった点や改善点があればお聞かせください',
                is_required: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                question_option_choices: [],
                question_option_linear_scale: []
              },
              {
                id: 'required_4_4',
                review_fome_id: 'required',
                review_form_pages_id: 'required-page-4',
                pege_number: 4,
                question_type_id: 1, // Short text
                question_number: 4,
                question_text: '当店ならではの魅力、または他店と比べて物足りない点があればお聞かせください',
                is_required: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                question_option_choices: [],
                question_option_linear_scale: []
              },
              {
                id: 'required_4_5',
                review_fome_id: 'required',
                review_form_pages_id: 'required-page-4',
                pege_number: 4,
                question_type_id: 2, // Long text
                question_number: 5,
                question_text: 'その他、気になる点があればご記入ください。',
                is_required: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                question_option_choices: [],
                question_option_linear_scale: []
              }
            ];
          } else if (aspectType === 'service') {
            formattedQuestions = [
              {
                id: 'required_4_1',
                review_fome_id: 'required',
                review_form_pages_id: 'required-page-4',
                pege_number: 4,
                question_type_id: 1, // Short text
                question_number: 1,
                question_text: '入店から注文までの接客で、良かった点や気になった点があればお聞かせください',
                is_required: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                question_option_choices: [],
                question_option_linear_scale: []
              },
              {
                id: 'required_4_2',
                review_fome_id: 'required',
                review_form_pages_id: 'required-page-4',
                pege_number: 4,
                question_type_id: 1, // Short text
                question_number: 2,
                question_text: '提供スピードや正確さについて、良かった点や気になった点があればお聞かせください',
                is_required: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                question_option_choices: [],
                question_option_linear_scale: []
              },
              {
                id: 'required_4_3',
                review_fome_id: 'required',
                review_form_pages_id: 'required-page-4',
                pege_number: 4,
                question_type_id: 1, // Short text
                question_number: 3,
                question_text: 'スタッフの対応で、良かった点や改善してほしい点があればお聞かせください',
                is_required: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                question_option_choices: [],
                question_option_linear_scale: []
              },
              {
                id: 'required_4_4',
                review_fome_id: 'required',
                review_form_pages_id: 'required-page-4',
                pege_number: 4,
                question_type_id: 1, // Short text
                question_number: 4,
                question_text: '特に良かったスタッフがいれば、その理由を教えてください',
                is_required: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                question_option_choices: [],
                question_option_linear_scale: []
              },
              {
                id: 'required_4_5',
                review_fome_id: 'required',
                review_form_pages_id: 'required-page-4',
                pege_number: 4,
                question_type_id: 2, // Long text
                question_number: 5,
                question_text: 'その他、気になる点があればご記入ください。',
                is_required: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                question_option_choices: [],
                question_option_linear_scale: []
              }
            ];
          } else if (aspectType === 'cleanliness') {
            formattedQuestions = [
              {
                id: 'required_4_1',
                review_fome_id: 'required',
                review_form_pages_id: 'required-page-4',
                pege_number: 4,
                question_type_id: 1, // Short text
                question_number: 1,
                question_text: '店内環境（外観・床・空気・整頓・トイレ）で良かった点や気になった点があればお聞かせください',
                is_required: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                question_option_choices: [],
                question_option_linear_scale: []
              },
              {
                id: 'required_4_2',
                review_fome_id: 'required',
                review_form_pages_id: 'required-page-4',
                pege_number: 4,
                question_type_id: 1, // Short text
                question_number: 2,
                question_text: 'テーブル・椅子・食器など、座席周りで良かった点や気になった点があればお聞かせください',
                is_required: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                question_option_choices: [],
                question_option_linear_scale: []
              },
              {
                id: 'required_4_3',
                review_fome_id: 'required',
                review_form_pages_id: 'required-page-4',
                pege_number: 4,
                question_type_id: 1, // Short text
                question_number: 3,
                question_text: 'スタッフの身だしなみで良かった点や気になった点があればお聞かせください',
                is_required: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                question_option_choices: [],
                question_option_linear_scale: []
              },
              {
                id: 'required_4_4',
                review_fome_id: 'required',
                review_form_pages_id: 'required-page-4',
                pege_number: 4,
                question_type_id: 2, // Long text
                question_number: 4,
                question_text: 'その他、気になる点があればご記入ください。',
                is_required: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                question_option_choices: [],
                question_option_linear_scale: []
              }
            ];
          }
          
          questionsData = formattedQuestions;
        } else {
          // If we can't determine the aspect, use default questions from requiredQuestions.js
          questionsData = getRequiredQuestionsForPage(currentPage);
        }
      }
      
      // For page 5, get comparison questions from requiredQuestions
      if (currentPage === 5) {
        // Use the questions already defined in requiredQuestions.js
        questionsData = getRequiredQuestionsForPage(currentPage);
        // console.log('Page 5 questions:', questionsData.length, 'questions found');
      }
      setQuestions(questionsData);

      // Load stored answers from localStorage (persist across pages)
      const storedAnswers = localStorage.getItem('requiredQuestionAnswers');
      if (storedAnswers) {
        setAnswers(JSON.parse(storedAnswers));
      }

    } catch (error) {
      console.error('Error loading required questions data:', error);
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
    localStorage.setItem('requiredQuestionAnswers', JSON.stringify(newAnswers));
    
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
          switch (question.question_type_id) {
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
            case 9: // NPS scale
              // For numeric scales, 0 is a valid answer
              isAnswered = answer.answer !== undefined && answer.answer !== '' && answer.answer !== null;
              break;
            case 10: // Sentiment Matrix
              if (answer.answer && answer.answer !== '' && answer.answer !== null) {
                try {
                  const matrixAnswers = JSON.parse(answer.answer);
                  const matrixItems = question.matrix_items || [];
                  // Check if all matrix items have been answered
                  isAnswered = matrixItems.length > 0 && 
                    matrixItems.every(item => matrixAnswers.hasOwnProperty(item.id) && matrixAnswers[item.id] !== null);
                } catch {
                  isAnswered = false;
                }
              } else {
                isAnswered = false;
              }
              break;
            case 11: // Comparison
              if (answer.answer && answer.answer !== '' && answer.answer !== null) {
                try {
                  const comparisonAnswers = JSON.parse(answer.answer);
                  
                  // Check if this is tournament mode
                  if (question.is_tournament) {
                    // For tournament mode, check if all 6 questions have been answered
                    isAnswered = comparisonAnswers.selections && 
                      Object.keys(comparisonAnswers.selections).length === 6;
                  } else {
                    // For regular comparison mode
                    const comparisonItems = question.comparison_items || [];
                    // Check if all comparison items have been answered
                    isAnswered = comparisonItems.length > 0 && 
                      comparisonItems.every(item => comparisonAnswers.hasOwnProperty(item.id) && 
                        (comparisonAnswers[item.id] === 'A' || comparisonAnswers[item.id] === 'B'));
                  }
                } catch {
                  isAnswered = false;
                }
              } else {
                isAnswered = false;
              }
              break;
            default:
              isAnswered = answer.answer && answer.answer !== '';
          }
        }

        if (!isAnswered) {
          // Custom error message for Sentiment Matrix
          if (question.question_type_id === 10 || question.question_types_id === 10) {
            errors[question.id] = 'すべての項目に回答してください。';
          } else if (question.question_type_id === 11 || question.question_types_id === 11) {
            errors[question.id] = 'すべての質問でA店またはB店を選択してください。';
          } else {
            errors[question.id] = '必須項目です。回答してください。';
          }
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
          switch (question.question_type_id) {
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
            case 9: // NPS scale
              // For numeric scales, 0 is a valid answer
              isAnswered = answer.answer !== undefined && answer.answer !== '' && answer.answer !== null;
              break;
            case 10: // Sentiment Matrix
              if (answer.answer && answer.answer !== '' && answer.answer !== null) {
                try {
                  const matrixAnswers = JSON.parse(answer.answer);
                  const matrixItems = question.matrix_items || [];
                  // Check if all matrix items have been answered
                  isAnswered = matrixItems.length > 0 && 
                    matrixItems.every(item => matrixAnswers.hasOwnProperty(item.id) && matrixAnswers[item.id] !== null);
                } catch {
                  isAnswered = false;
                }
              } else {
                isAnswered = false;
              }
              break;
            case 11: // Comparison
              if (answer.answer && answer.answer !== '' && answer.answer !== null) {
                try {
                  const comparisonAnswers = JSON.parse(answer.answer);
                  
                  // Check if this is tournament mode
                  if (question.is_tournament) {
                    // For tournament mode, check if all 6 questions have been answered
                    isAnswered = comparisonAnswers.selections && 
                      Object.keys(comparisonAnswers.selections).length === 6;
                  } else {
                    // For regular comparison mode
                    const comparisonItems = question.comparison_items || [];
                    // Check if all comparison items have been answered
                    isAnswered = comparisonItems.length > 0 && 
                      comparisonItems.every(item => comparisonAnswers.hasOwnProperty(item.id) && 
                        (comparisonAnswers[item.id] === 'A' || comparisonAnswers[item.id] === 'B'));
                  }
                } catch {
                  isAnswered = false;
                }
              } else {
                isAnswered = false;
              }
              break;
            default:
              isAnswered = answer.answer && answer.answer !== '';
          }
        }

        if (!isAnswered) {
          console.log('Question not answered in validateAllRequiredQuestions:', {
            questionId: question.id,
            questionType: question.question_type_id,
            pageNumber: question.pege_number,
            answer: answer
          });
          
          // Custom error message for Sentiment Matrix
          if (question.question_type_id === 10 || question.question_types_id === 10) {
            errors[question.id] = 'すべての項目に回答してください。';
          } else if (question.question_type_id === 11 || question.question_types_id === 11) {
            errors[question.id] = 'すべての質問でA店またはB店を選択してください。';
          } else {
            errors[question.id] = '必須項目です。回答してください。';
          }
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
    switch (question.question_type_id) {
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
      case 10: // Sentiment Matrix
        if (answer.answer && answer.answer !== '' && answer.answer !== null) {
          try {
            const matrixAnswers = JSON.parse(answer.answer);
            const matrixItems = question.matrix_items || [];
            // Check if all matrix items have been answered
            isAnswered = matrixItems.length > 0 && 
              matrixItems.every(item => matrixAnswers.hasOwnProperty(item.id) && matrixAnswers[item.id] !== null);
          } catch {
            isAnswered = false;
          }
        } else {
          isAnswered = false;
        }
        break;
      case 11: // Comparison
        if (answer.answer && answer.answer !== '' && answer.answer !== null) {
          try {
            const comparisonAnswers = JSON.parse(answer.answer);
            const comparisonItems = question.comparison_items || [];
            // Check if all comparison items have been answered
            isAnswered = comparisonItems.length > 0 && 
              comparisonItems.every(item => comparisonAnswers.hasOwnProperty(item.id) && 
                (comparisonAnswers[item.id] === 'A' || comparisonAnswers[item.id] === 'B'));
          } catch {
            isAnswered = false;
          }
        } else {
          isAnswered = false;
        }
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
      
      // Skip page 4 as it has dynamically generated questions
      // But don't skip page 5 - it has regular questions from requiredQuestions.js
      if (pageNumber === 4) {
        continue;
      }
      
      // Get questions for this page
      const pageQuestions = allQuestions.filter(q => q.pege_number === pageNumber);
      
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
      const pageQuestions = allQuestions.filter(q => q.pege_number === pageNumber);
      
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
    
    // Always allow page 4 (dynamically generated questions)
    if (currentPage === 4) return true;
    
    // For other pages, check if there are any incomplete pages before this one
    const firstIncompletePage = findFirstIncompletePageNumber();
    
    // If there's an incomplete page before the current page, access is denied
    return firstIncompletePage >= currentPage;
  };

  const handleNextClick = () => {
    // Clear previous validation errors
    setValidationErrors({});
    
    console.log('handleNextClick - currentPage:', currentPage, 'totalPages:', allPages.length);
    
    // Validate current page required questions
    const errors = {};
    let hasErrors = false;

    // Get current page questions
    const currentQuestions = questions;
    console.log('Current page questions:', currentQuestions.length);
    
    currentQuestions.forEach(question => {
      if (question.is_required) {
        const answer = answers[question.id];
        let isAnswered = false;

        if (answer) {
          // Check different question types
          switch (question.question_type_id) {
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
            case 9: // NPS scale
              // For numeric scales, 0 is a valid answer
              isAnswered = answer.answer !== undefined && answer.answer !== '' && answer.answer !== null;
              break;
            case 10: // Sentiment Matrix
              if (answer.answer && answer.answer !== '' && answer.answer !== null) {
                try {
                  const matrixAnswers = JSON.parse(answer.answer);
                  const matrixItems = question.matrix_items || [];
                  // Check if all matrix items have been answered
                  isAnswered = matrixItems.length > 0 && 
                    matrixItems.every(item => matrixAnswers.hasOwnProperty(item.id) && matrixAnswers[item.id] !== null);
                } catch {
                  isAnswered = false;
                }
              } else {
                isAnswered = false;
              }
              break;
            case 11: // Comparison
              if (answer.answer && answer.answer !== '' && answer.answer !== null) {
                try {
                  const comparisonAnswers = JSON.parse(answer.answer);
                  
                  // Check if this is tournament mode
                  if (question.is_tournament) {
                    // For tournament mode, check if all 6 questions have been answered
                    isAnswered = comparisonAnswers.selections && 
                      Object.keys(comparisonAnswers.selections).length === 6;
                  } else {
                    // For regular comparison mode
                    const comparisonItems = question.comparison_items || [];
                    // Check if all comparison items have been answered
                    isAnswered = comparisonItems.length > 0 && 
                      comparisonItems.every(item => comparisonAnswers.hasOwnProperty(item.id) && 
                        (comparisonAnswers[item.id] === 'A' || comparisonAnswers[item.id] === 'B'));
                  }
                } catch {
                  isAnswered = false;
                }
              } else {
                isAnswered = false;
              }
              break;
            default:
              isAnswered = answer.answer && answer.answer !== '';
          }
        }

        if (!isAnswered) {
          // Custom error message for Sentiment Matrix
          if (question.question_type_id === 10 || question.question_types_id === 10) {
            errors[question.id] = 'すべての項目に回答してください。';
          } else if (question.question_type_id === 11 || question.question_types_id === 11) {
            errors[question.id] = 'すべての質問でA店またはB店を選択してください。';
          } else {
            errors[question.id] = '必須項目です。回答してください。';
          }
          console.error(`Validation failed for question ${question.id}:`, errors[question.id]);
          hasErrors = true;
        }
      }
    });

    if (hasErrors) {
      console.log('Validation errors found:', errors);
      // Set validation errors
      setValidationErrors(errors);
      
      // Find first error question and scroll to it
      const firstErrorQuestion = currentQuestions.find(q => 
        q.is_required && errors[q.id]
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
      
      console.log('Final page validation - isValid:', isValid, 'firstErrorQuestionId:', firstErrorQuestionId);
      console.log('Current answers:', answers);
      
      if (!isValid) {
        // Find the page containing the first error question
        const errorQuestion = allQuestions.find(q => q.id === firstErrorQuestionId);
        console.log('Error question:', errorQuestion);
        
        if (errorQuestion) {
          const errorPageNumber = errorQuestion.pege_number;
          console.log('Error on page:', errorPageNumber, 'current page:', currentPage);
          
          if (errorPageNumber) {
            if (errorPageNumber !== currentPage) {
              // Navigate to the page with the error
              console.log('Navigating to error page:', errorPageNumber);
              const storeParam = storeCode ? `&storeCode=${storeCode}` : '';
              navigate(`/required-questions?reviewFormId=${reviewFormId}&page=${errorPageNumber}${storeParam}`);
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
      
      // All required questions answered
      if (hasRegularQuestions) {
        // If there are regular questions, go directly to them
        const storeParam = storeCode ? `&storeCode=${storeCode}` : '';
        const modeParam = isPreviewMode ? '&mode=preview' : '';
        navigate(`/questions?reviewFormId=${reviewFormId}&page=1${storeParam}${modeParam}`);
      } else {
        // If only preset questions, show submit confirmation
        setShowSubmitDialog(true);
      }
    } else {
      // Go to next page
      const nextPage = currentPage + 1;
      const storeParam = storeCode ? `&storeCode=${storeCode}` : '';
      navigate(`/required-questions?reviewFormId=${reviewFormId}&page=${nextPage}${storeParam}`);
    }
  };

  const handleSubmitConfirm = async () => {
    setSubmitting(true);
    setShowSubmitDialog(false);
    
    if (hasRegularQuestions) {
      // Save selected aspect information for later submission
      if (selectedAspectInfo) {
        localStorage.setItem('selectedAspectInfo', JSON.stringify(selectedAspectInfo));
      }
      
      // Navigate to regular questions page
      const storeParam = storeCode ? `&storeCode=${storeCode}` : '';
      const modeParam = isPreviewMode ? '&mode=preview' : '';
      navigate(`/questions?reviewFormId=${reviewFormId}&page=1${storeParam}${modeParam}`);
    } else {
      // Only preset questions - submit answers directly
      try {
        // Skip submission in preview mode
        if (isPreviewMode) {
          navigate(`/completion?reviewFormId=${reviewFormId}&mode=preview`);
          return;
        }

        // Check if user is logged in
        if (!currentUser) {
          console.error('No user logged in');
          navigate(`/?reviewFormId=${reviewFormId}`);
          return;
        }

        console.log('Submitting answers...', { answers });
        console.log('Current selectedAspectInfo state:', selectedAspectInfo);

        // Prepare answers data
        const answersData = { ...answers };
        
        // Get selected aspect information if any
        let storedAspectInfo = selectedAspectInfo;
        
        // If selectedAspectInfo is not in state, try localStorage first
        if (!storedAspectInfo) {
          const savedAspectInfo = localStorage.getItem('selectedAspectInfo');
          if (savedAspectInfo) {
            storedAspectInfo = JSON.parse(savedAspectInfo);
            console.log('Restored selectedAspectInfo from localStorage:', storedAspectInfo);
          }
        }
        
        // If still not available, regenerate it from answers
        if (!storedAspectInfo) {
          console.log('selectedAspectInfo not found, regenerating...');
          const storedAnswers = JSON.parse(localStorage.getItem('requiredQuestionAnswers') || '{}');
          const page1Answers = {};
          const page2Answers = {};
          
          Object.keys(storedAnswers).forEach(questionId => {
            if (questionId.startsWith('required_1_')) {
              page1Answers[questionId] = storedAnswers[questionId];
            } else if (questionId.startsWith('required_2_')) {
              page2Answers[questionId] = storedAnswers[questionId];
            }
          });
          
          const page2AdditionalAnswer = page2Answers['required_2_4']?.answer || null;
          const dynamicQuestions = generatePage3Questions(page1Answers, page2Answers, page2AdditionalAnswer);
          
          if (dynamicQuestions) {
            storedAspectInfo = {
              aspectLabel: dynamicQuestions.selectedAspect.label,
              aspectShortLabel: dynamicQuestions.selectedAspect.shortLabel,
              aspectType: dynamicQuestions.selectedAspect.aspectType,
              questionType: dynamicQuestions.questionType,
              selectedRating: dynamicQuestions.selectedRating,
              group: dynamicQuestions.group
            };
            console.log('Regenerated selectedAspectInfo:', storedAspectInfo);
          }
        }
        
        console.log('storedAspectInfo to send:', storedAspectInfo);

        // Submit using the lottery system (which handles regular submissions too)
        const result = await submitAnswersWithLottery(
          reviewFormId,
          currentUser.id,
          answersData,
          storeCode || null,
          storedAspectInfo
        );

        if (!result.success || result.error) {
          console.error('Submission error:', result.error || 'Unknown error');
          alert('回答の送信中にエラーが発生しました。もう一度お試しください。');
          setSubmitting(false);
          return;
        }

        console.log('Submission result:', result);

        // Note: All data saving is handled by the Edge Function
        // No need for additional saves here

        // Clear local storage
        localStorage.removeItem('requiredQuestionAnswers');
        localStorage.removeItem(`progress_${reviewFormId}`);
        localStorage.removeItem('selectedAspectInfo');

        // Handle different lottery results
        if (result.cooldownActive) {
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
          winnerId: result.winnerToken || result.winnerId
        };
        
        // Show drawing loading screen
        setShowSubmitDialog(false);
        setShowDrawingLoading(true);
      } catch (error) {
        console.error('Error submitting answers:', error);
        alert('回答の送信中にエラーが発生しました。もう一度お試しください。');
        setSubmitting(false);
      }
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
      }
    }
  };

  const renderQuestion = (question, index) => {
    const questionNumber = index + 1;
    const totalQuestions = questions.length;
    const themeColor = formSettings?.theme_color || '#8C52FF';
    const hasValidationError = validationErrors[question.id];

    // console.log('Rendering question:', { id: question.id, type: question.question_type_id });

    // Add existing answer to question object
    const questionWithAnswer = {
      ...question,
      existingAnswer: answers[question.id]?.answer,
      existingAnswers: answers[question.id]?.answers,
      hasValidationError,
      validationMessage: validationErrors[question.id]
    };
    
    // // Log question type 11 specifically
    // if (question.question_type_id === 11) {
    //   console.log('Question Type 11 data:', {
    //     id: question.id,
    //     is_tournament: question.is_tournament,
    //     has_tournament_attributes: !!question.tournament_attributes,
    //     tournament_attributes_length: question.tournament_attributes?.length
    //   });
    // }

    switch (question.question_type_id) {
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
      case 10:
        return (
          <Box key={question.id} id={`question-${question.id}`}>
            <SentimentMatrixQuestion
              question={questionWithAnswer}
              themeColor={themeColor}
              currentQuestion={questionNumber}
              totalQuestions={totalQuestions}
              onAnswerChange={handleAnswerChange}
            />
          </Box>
        );
      case 11:
        // Check if this is tournament mode or regular comparison mode
        if (question.is_tournament) {
          return (
            <Box key={question.id} id={`question-${question.id}`}>
              <TournamentComparisonQuestion
                question={questionWithAnswer}
                themeColor={themeColor}
                currentQuestion={questionNumber}
                totalQuestions={totalQuestions}
                onAnswerChange={handleAnswerChange}
              />
            </Box>
          );
        } else {
          return (
            <Box key={question.id} id={`question-${question.id}`}>
              <ComparisonQuestion
                question={questionWithAnswer}
                themeColor={themeColor}
                currentQuestion={questionNumber}
                totalQuestions={totalQuestions}
                onAnswerChange={handleAnswerChange}
              />
            </Box>
          );
        }
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
                    {currentPage >= allPages.length && !hasRegularQuestions ? '回答を送信' : '次へ進む'}
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

export default RequiredQuestionsPage;