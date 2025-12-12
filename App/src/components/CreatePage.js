import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import PreviewControlPanel from './PreviewControlPanel';
import LeftNavigationBar from './LeftNavigationBar';
import HeaderBar from './HeaderBar';
import PreviewArea from './PreviewArea';
import QuestionToolsSidebar from './QuestionToolsSidebar';
import QuestionSettingsPanel from './QuestionSettingsPanel';
import QuestionSettingsMenu from './QuestionSettingsMenu';
import DeleteConfirmationDialog from './DeleteConfirmationDialog';
import SettingsPanel from './settings/SettingsPanel';
import SvgIcon from './SvgIcon';
import { useCreatePageState } from '../hooks/useCreatePageState';
import useQuestionData from '../hooks/useQuestionData';
import { leftNavigationItems, questionTypes, settingsCategories } from '../constants/createPageData';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import FormDataService from '../services/FormDataService';
import { createQuestionWithOptions, updateReviewQuestion, getCompanyPastQuestions, linkQuestionToForm } from '../services/QuestionService';
// import CompletionScreenService from '../services/CompletionScreenService'; // FormDataServiceを使用するため削除
import { supabase } from '../lib/supabase';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Tooltip,
  Stack,
  Grid,
  Button,
  Input,
  Dialog,
  DialogContent
} from '@mui/material';
import {
  ArrowBack,
  Save,
  Preview,
  MoreVert,
  Add,
  Settings,
  Palette,
  PhoneAndroid,
  Computer,
  ZoomIn,
  ZoomOut,
  FitScreen,
  RateReview,
  ExpandMore as ExpandMoreIcon,
  Business,
  Person,
  School,
  LocalHospital,
  Close,
  Delete,
  DragHandle,
  Login,
  CheckCircle,
  Pages,
  ContentCopy,
  KeyboardArrowUp,
  KeyboardArrowDown,
  Backup,
  Key,
  Schedule,
  Public,
  ChevronRight,
  PersonAdd,
  Quiz
} from '@mui/icons-material';

// スタイル定数
const PURPLE_GRADIENT_TEXT_STYLE = {
  fontWeight: 600,
  background: 'linear-gradient(45deg, #5e17eb 30%, #764ba2 90%)',
  backgroundClip: 'text',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent'
};

// サイドバーPaperの基本スタイル
const SIDEBAR_PAPER_BASE_STYLE = {
  height: '100%',
  borderRadius: 0,
  background: 'rgba(255, 255, 255, 0.9)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.3)',
  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)',
  p: 2,
  display: 'flex',
  flexDirection: 'column'
};

// Motionアニメーション定数
const SLIDE_IN_LEFT_ANIMATION = {
  initial: { opacity: 0, x: -50 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.6, delay: 0.2 }
};

const SLIDE_IN_RIGHT_ANIMATION = {
  initial: { opacity: 0, x: 50 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.6, delay: 0.4 }
};

// カテゴリグラデーション関数
const getCategoryGradient = (categoryId) => {
  const gradients = {
    account: '#667eea, #764ba2',
    database: '#5e17eb, #764ba2',
    forms: '#5e17eb, #764ba2',
    security: '#ef4444, #dc2626',
    integrations: '#3b82f6, #1d4ed8',
    advanced: '#6b7280, #4b5563'
  };
  return `linear-gradient(135deg, ${gradients[categoryId] || '#6b7280, #4b5563'})`;
};

// アイコンコンテナユーティリティ関数
const createIconContainerStyle = (size, gradient, shadowColor = 'rgba(94, 23, 235, 0.3)', borderRadius = null) => ({
  width: size,
  height: size,
  borderRadius: borderRadius || (size > 40 ? 2 : 1),
  background: gradient,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  boxShadow: `0 ${Math.ceil(size/16)}px ${Math.ceil(size/4)}px ${shadowColor}`
});

// アニメーションユーティリティ関数
const executeWithAnimation = (setSortingAnimation, operation, delay = 100, animationClearDelay = 200) => {
  setTimeout(() => {
    operation();
    setTimeout(() => {
      setSortingAnimation(null);
    }, animationClearDelay);
  }, delay);
};

export default function CreatePage({ onBackClick, user, formId }) {
  console.log('🔍 CreatePage - コンポーネントがレンダリングされました');
  console.log('🔍 CreatePage - 受け取ったformId:', formId);
  console.log('🔍 CreatePage - user:', user);
  
  // カスタムフックから状態を取得
  const {
    selectedTool, setSelectedTool,
    previewMode, setPreviewMode,
    zoom, setZoom,
    showPageManager, setShowPageManager,
    draggedPage, setDraggedPage,
    deleteMode, setDeleteMode,
    showDeleteConfirm, setShowDeleteConfirm,
    pageToDelete, setPageToDelete,
    sortingAnimation, setSortingAnimation,
    dropIndicator, setDropIndicator,
    selectedPage, setSelectedPage,
    editingPageId, setEditingPageId,
    editingTitle, setEditingTitle,
    showSettings, setShowSettings,
    activeSection, setActiveSection,
    projectTitle, setProjectTitle,
    isEditingTitle, setIsEditingTitle,
    showColorPicker, setShowColorPicker,
    selectedColor, setSelectedColor,
    isPublished, setIsPublished,
    projectDescription, setProjectDescription,
    selectedFont, setSelectedFont,
    logoPreview, setLogoPreview,
    pageErrorHighlight, setPageErrorHighlight,
    questionErrorHighlight, setQuestionErrorHighlight,
    loginErrorHighlight, setLoginErrorHighlight,
    completionErrorHighlight, setCompletionErrorHighlight
  } = useCreatePageState();

  // 質問データ管理フック
  const {
    questionsData,
    getQuestionsForPage,
    setQuestionsForPage,
    loadQuestionsForPage,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    duplicateQuestion,
    getQuestionCountForPage,
    updateChoiceOptions,
    updateLinearScaleOptions
  } = useQuestionData(formId);

  // 設定関連の追加状態
  const [logoImage, setLogoImage] = useState(null);

  // ドラッグ&ドロップ関連の状態
  const [isDragActive, setIsDragActive] = useState(false);

  // 質問選択状態
  const [selectedQuestionId, setSelectedQuestionId] = useState(null);


  // 基本設定関連の状態
  const [selectedElement, setSelectedElement] = useState(null); // 'header', 'logo', null
  const [headerImage, setHeaderImage] = useState(null);
  const [logoImageState, setLogoImageState] = useState(null);
  
  // フォーム設定の状態（Supabaseから取得・更新）
  const [formSettings, setFormSettings] = useState({
    theme_color: '#5e17eb',
    logo_image_url: 'https://otfreskkeaenahqziriz.supabase.co/storage/v1/object/public/app-assets/logo/OpenReviewWhiteThemeLoog.png',
    header_image_url: null,
    is_dark_mode: false
  });
  const [isLoadingFormSettings, setIsLoadingFormSettings] = useState(false);

  // 質問タイプデータ（Supabaseから取得）
  const [questionTypesData, setQuestionTypesData] = useState([]);
  const [isLoadingQuestionTypes, setIsLoadingQuestionTypes] = useState(false);

  // 過去の質問データ
  const [pastQuestions, setPastQuestions] = useState([]);
  const [isLoadingPastQuestions, setIsLoadingPastQuestions] = useState(false);

  // ログイン画面設定の状態
  const [loginScreenSettings, setLoginScreenSettings] = useState({
    background_image_url: 'https://img.freepik.com/premium-photo/generative-ai-illustration-luxury-stores-decorated-different-colors-with-beautiful-interior-design_58460-12582.jpg',
    title_text: '',
    detail_text: ''
  });
  const [isLoadingLoginSettings, setIsLoadingLoginSettings] = useState(false);

  // プロジェクトタイトル読み込み
  useEffect(() => {
    console.log('🔍 CreatePage - プロジェクトタイトル読み込みuseEffect実行');
    console.log('🔍 CreatePage - formId:', formId);
    
    const loadProjectTitle = async () => {
      if (formId) {
        console.log('🔍 CreatePage - プロジェクトタイトル読み込み開始:', formId);
        try {
          const result = await FormDataService.getProjectTitle(formId);
          console.log('🔍 CreatePage - プロジェクトタイトル読み込み結果:', result);
          if (result.success) {
            console.log('🔍 CreatePage - プロジェクトタイトル設定:', result.data);
            setProjectTitle(result.data);
          }
        } catch (error) {
          console.error('Project title loading error:', error);
        }
      } else {
        console.log('🔍 CreatePage - formIdがないため、プロジェクトタイトル読み込みをスキップ');
      }
    };

    loadProjectTitle();
  }, [formId, setProjectTitle]);

  // 完了画面設定の状態
  const [completionScreenSettings, setCompletionScreenSettings] = useState({
    title_text: '',
    detail_text: '',
    background_image_url: 'https://misezukuri.com/wp-content/uploads/2023/10/b86e65d61ae3fbd3b3f1ec5c67484853.jpg',
    is_button_1_enabled: true,
    button_text_1: '',
    button_url_1: '#'
  });
  const [isLoadingCompletionSettings, setIsLoadingCompletionSettings] = useState(false);

  // 保存状態管理
  const [isSaving, setIsSaving] = useState(false);
  const [showSavingIndicator, setShowSavingIndicator] = useState(false);
  const savingTimerRef = useRef(null);

  // 保存状態の効果管理
  useEffect(() => {
    if (isSaving) {
      // 1.5秒後に保存インジケーターを表示
      savingTimerRef.current = setTimeout(() => {
        setShowSavingIndicator(true);
      }, 1500);
    } else {
      // 保存が完了したらタイマーをクリアし、インジケーターを非表示
      if (savingTimerRef.current) {
        clearTimeout(savingTimerRef.current);
        savingTimerRef.current = null;
      }
      setShowSavingIndicator(false);
    }

    // クリーンアップ
    return () => {
      if (savingTimerRef.current) {
        clearTimeout(savingTimerRef.current);
        savingTimerRef.current = null;
      }
    };
  }, [isSaving]);

  // テキスト設定の状態（後方互換性のため残す）
  const [loginTitle, setLoginTitle] = useState('');
  const [loginDetail, setLoginDetail] = useState('');
  const [completionTitle, setCompletionTitle] = useState('');
  const [completionDetail, setCompletionDetail] = useState('');
  const [completionBackground, setCompletionBackground] = useState('https://misezukuri.com/wp-content/uploads/2023/10/b86e65d61ae3fbd3b3f1ec5c67484853.jpg');

  // 公開ダイアログの状態管理（HeaderBarと同じ）
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [errorCheckProgress, setErrorCheckProgress] = useState(0);
  const [errorCheckItems, setErrorCheckItems] = useState([]);
  const [isErrorChecking, setIsErrorChecking] = useState(false);
  const [publishDialogErrors, setPublishDialogErrors] = useState([]);
  const [publishDialogWarnings, setPublishDialogWarnings] = useState([]);

  // 質問タイプの文字列を数値IDにマッピング（Supabaseのデータを優先）
  const getQuestionTypeId = (typeString) => {
    // まずSupabaseから取得したデータで検索
    const foundType = questionTypesData.find(qt => qt.name === typeString);
    if (foundType) {
      return foundType.id;
    }

    // フォールバック用の旧マッピング
    const typeMapping = {
      'text': 1,        // 短文テキスト
      'textarea': 2,    // 長文テキスト
      'radio': 3,       // 単一選択
      'checkbox': 4,    // 複数選択
      'matrix-single': 5, // 単一選択マトリックス
      'matrix-multiple': 6, // 複数選択マトリックス
      'scale': 7,       // リニアスケール
      'select': 8,      // プルダウン
      'loyalty_score': 9, // 推奨度スコア
      'radio-2col': 9,  // 単一選択(2列)
      'checkbox-2col': 10 // 複数選択(2列)
    };
    return typeMapping[typeString] || 1; // デフォルトは短文テキスト
  };

  // ページデータ
  const [pages, setPages] = useState([
    { id: 'login', title: 'ログイン画面', type: 'system', icon: <Login />, canDelete: false, canEdit: false },
    { id: 'completion', title: '完了画面', type: 'system', icon: <CheckCircle />, canDelete: false, canEdit: false }
  ]);
  const [isLoadingPages, setIsLoadingPages] = useState(false);
  const [isAddingPage, setIsAddingPage] = useState(false);

  // 質問タイプを読み込み
  useEffect(() => {
    const loadQuestionTypes = async () => {
      setIsLoadingQuestionTypes(true);
      try {
        const result = await FormDataService.getQuestionTypes();
        if (result.success) {
          setQuestionTypesData(result.data);
        } else {
          toast.error('質問タイプの読み込みに失敗しました');
        }
      } catch (error) {
        console.error('Question types loading error:', error);
        toast.error('質問タイプの読み込み中にエラーが発生しました');
      } finally {
        setIsLoadingQuestionTypes(false);
      }
    };

    loadQuestionTypes();
  }, []);

  // 過去の質問を読み込み（ユーザーが作成した質問を取得）
  useEffect(() => {
    const loadPastQuestions = async () => {
      if (!user?.id) return;

      setIsLoadingPastQuestions(true);
      try {
        const questions = await getCompanyPastQuestions(user.id, null);
        setPastQuestions(questions);
      } catch (error) {
        console.error('Past questions loading error:', error);
      } finally {
        setIsLoadingPastQuestions(false);
      }
    };

    loadPastQuestions();
  }, [user?.id]);

  // フォーム設定を読み込み
  useEffect(() => {
    const loadFormSettings = async () => {
      if (formId) {
        setIsLoadingFormSettings(true);
        try {
          const result = await FormDataService.getFormSettings(formId);
          if (result.success) {
            setFormSettings(result.data);
            // ローカル状態も更新
            setLogoImageState(result.data.logo_image_url);
            // selectedColor状態も同期
            setSelectedColor(result.data.theme_color || '#5e17eb');
          } else {
            toast.error('フォーム設定の読み込みに失敗しました');
          }
        } catch (error) {
          console.error('Form settings loading error:', error);
          toast.error('フォーム設定の読み込み中にエラーが発生しました');
        } finally {
          setIsLoadingFormSettings(false);
        }
      }
    };

    loadFormSettings();
  }, [formId]);

  // ヘッダー画像設定を読み込み（question_screen_settingsから）
  useEffect(() => {
    const loadHeaderImage = async () => {
      if (formId) {
        try {
          const { data, error } = await supabase
            .from('question_screen_settings')
            .select('header_image_url')
            .eq('review_forms_id', formId)
            .single();

          if (!error && data) {
            setHeaderImage(data.header_image_url);
          }
        } catch (error) {
          console.error('Header image loading error:', error);
        }
      }
    };

    loadHeaderImage();
  }, [formId]);

  // ログイン画面設定を読み込み
  useEffect(() => {
    const loadLoginScreenSettings = async () => {
      if (formId) {
        setIsLoadingLoginSettings(true);
        try {
          const result = await FormDataService.getLoginScreenSettings(formId);
          if (result.success) {
            setLoginScreenSettings(result.data);
            // 後方互換性のため、loginTitleとloginDetailも更新
            setLoginTitle(result.data.title_text || '');
            setLoginDetail(result.data.detail_text || '');
          }
        } catch (error) {
          console.error('Login screen settings loading error:', error);
        } finally {
          setIsLoadingLoginSettings(false);
        }
      }
    };

    loadLoginScreenSettings();
  }, [formId]);

  // 完了画面設定を読み込み
  useEffect(() => {
    const loadCompletionScreenSettings = async () => {
      if (formId) {
        setIsLoadingCompletionSettings(true);
        try {
          const result = await FormDataService.getFormDetails(formId);
          if (result.success && result.data.completion_screen_settings && result.data.completion_screen_settings.length > 0) {
            const completionData = result.data.completion_screen_settings[0];
            setCompletionScreenSettings(completionData);
            // 後方互換性のため、completionTitle、completionDetail、completionBackgroundも更新
            setCompletionTitle(completionData.title_text || '');
            setCompletionDetail(completionData.detail_text || '');
            setCompletionBackground(completionData.background_image_url || 'https://misezukuri.com/wp-content/uploads/2023/10/b86e65d61ae3fbd3b3f1ec5c67484853.jpg');
          }
        } catch (error) {
          console.error('Completion screen settings loading error:', error);
        } finally {
          setIsLoadingCompletionSettings(false);
        }
      }
    };

    loadCompletionScreenSettings();
  }, [formId]);

  // フォームIDが存在する場合にページを読み込み
  useEffect(() => {
    const loadFormPages = async () => {
      if (formId) {
        setIsLoadingPages(true);
        try {
          const result = await FormDataService.getFormPages(formId);
          if (result.success) {
            const questionPages = result.data.map(page => ({
              id: page.id,
              title: page.name,
              type: 'question',
              icon: <Pages />,
              canDelete: true,
              canEdit: true,
              questions: 0,
              page_number: page.page_number
            }));

            // システムページと質問ページを結合
            const systemPages = [
              { id: 'login', title: 'ログイン画面', type: 'system', icon: <Login />, canDelete: false, canEdit: false },
              ...questionPages,
              { id: 'completion', title: '完了画面', type: 'system', icon: <CheckCircle />, canDelete: false, canEdit: false }
            ];

            setPages(systemPages);
          } else {
            toast.error('ページの読み込みに失敗しました');
          }
        } catch (error) {
          console.error('Page loading error:', error);
          toast.error('ページの読み込み中にエラーが発生しました');
        } finally {
          setIsLoadingPages(false);
        }
      }
    };

    loadFormPages();
  }, [formId]);

  // 初期化時に最初の質問ページを選択
  useEffect(() => {
    if (!selectedPage) {
      const firstQuestionPage = pages.find(page => page.type === 'question');
      if (firstQuestionPage) {
        setSelectedPage(firstQuestionPage);
      }
    }
  }, [pages, selectedPage, setSelectedPage]);

  // フォーム基本データを読み込み（公開状態を含む）
  useEffect(() => {
    const loadFormBasicData = async () => {
      if (formId) {
        try {
          const result = await FormDataService.getFormBasicData(formId);
          if (result.success) {
            console.log('📊 フォーム基本データ読み込み成功:', result.data);
            
            // 公開状態を設定
            setIsPublished(result.data.is_published || false);
            
            // プロジェクトタイトルも更新（必要に応じて）
            if (result.data.title && result.data.title !== 'OpenReview フォーム') {
              setProjectTitle(result.data.title);
            }
          } else {
            console.error('❌ フォーム基本データ読み込み失敗:', result.error);
          }
        } catch (error) {
          console.error('❌ フォーム基本データ読み込みエラー:', error);
        }
      }
    };

    loadFormBasicData();
  }, [formId, setIsPublished, setProjectTitle]);

  // 読み込み済みページを追跡するRef
  const loadedPages = useRef(new Set());

  // 選択されたページが変更された時、質問データを読み込み
  useEffect(() => {
    if (selectedPage && selectedPage.type === 'question' && formId) {
      // 既に読み込み済みの場合はスキップ
      if (loadedPages.current.has(selectedPage.id)) {
        return;
      }
      
      // 質問データを読み込み
      loadQuestionsForPage(selectedPage.id);
      // 読み込み済みとして記録
      loadedPages.current.add(selectedPage.id);
    }
  }, [selectedPage, formId, loadQuestionsForPage]);

  // Supabaseから取得した質問タイプデータを既存フォーマットに変換
  const convertedQuestionTypes = questionTypesData.map(qType => ({
    icon: <SvgIcon src={qType.image} size={20} />,
    label: qType.japanese,
    type: qType.name,
    question_types_id: qType.id,
    description: qType.description
  }));


  // 質問データ関連のハンドラ
  const handleQuestionsUpdate = (pageId, questions) => {
    setQuestionsForPage(pageId, questions);
    // ページの質問数も更新
    setPages(prev => prev.map(page => 
      page.id === pageId 
        ? { ...page, questions: questions.length }
        : page
    ));
  };

  // questionsをメモ化してPreviewAreaの不要な再レンダリングを防ぐ
  const currentQuestions = useMemo(() => {
    return selectedPage && selectedPage.type === 'question' 
      ? getQuestionsForPage(selectedPage.id) 
      : [];
  }, [selectedPage, questionsData]);

  // 全ページの質問を収集（エラー検証用）
  const allQuestions = useMemo(() => {
    const questionPages = pages.filter(page => page.type === 'question');
    const allQuestionsArray = [];
    
    questionPages.forEach(page => {
      const pageQuestions = questionsData[page.id] || [];
      // 各質問にページIDを確実に付加
      const questionsWithPageId = pageQuestions.map(question => ({
        ...question,
        review_form_pages_id: page.id,
        pageId: page.id // バックアップ用
      }));
      allQuestionsArray.push(...questionsWithPageId);
    });
    
    return allQuestionsArray;
  }, [pages, questionsData]);

  // デバッグ用：質問データの変化をログ出力（selectedPageが変更された時のみ）
  useEffect(() => {
    if (selectedPage && selectedPage.type === 'question') {
      console.log('CreatePage - page selected, questions:', {
        pageId: selectedPage.id,
        currentPageQuestionsLength: currentQuestions.length,
        allQuestionsLength: allQuestions.length,
        currentPageQuestions: currentQuestions.map(q => ({ id: q.id, text: q.question_text })),
        allQuestions: allQuestions.map(q => ({ id: q.id, text: q.question_text, pageId: q.review_form_pages_id }))
      });
    }
  }, [selectedPage, currentQuestions, allQuestions]);

  // 質問IDからページIDを検索する関数
  const findPageIdByQuestionId = (questionId) => {
    for (const pageId in questionsData) {
      const pageQuestions = questionsData[pageId] || [];
      if (pageQuestions.some(q => q.id === questionId)) {
        return pageId;
      }
    }
    return null;
  };

  // ドラッグ&ドロップハンドラ
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragActive(false);
    
    if (!selectedPage || selectedPage.type === 'system') {
      toast.error('質問を追加できるページを選択してください');
      return;
    }

    try {
      const draggedData = JSON.parse(e.dataTransfer.getData('application/json'));
      
      // 質問タイプからデフォルトデータを作成
      const questionTypeId = draggedData.question_types_id || getQuestionTypeId(draggedData.type);
      console.log(`🔍 CreatePage handleDrop: draggedData.type = "${draggedData.type}", questionTypeId = ${questionTypeId}`);
      
      // 現在のページの質問数を取得して質問番号を決定
      const currentQuestions = getQuestionsForPage(selectedPage.id);
      const questionNumber = currentQuestions.length + 1;

      // 楽観的更新用の一時的なIDを生成
      const tempId = `temp_${Date.now()}_${Math.random()}`;

      // 楽観的更新用の質問オブジェクトを作成
      let optimisticQuestion = {
        id: tempId,
        question_types_id: questionTypeId,
        question_text: draggedData.question || draggedData.question_text || '',
        question_detail_text: draggedData.detail || draggedData.detail_text || '',
        is_required: draggedData.required !== undefined ? draggedData.required : true,
        choices: null,
        scale_settings: null
      };

      // 質問タイプに応じてデフォルト設定を追加
      const questionTypeData = questionTypesData.find(qt => qt.id === questionTypeId);
      const typeName = questionTypeData ? questionTypeData.japanese : '';
      const needsChoices = [3, 4, 8, 10].includes(questionTypeId);
      
      if (needsChoices) {
        // 通常の質問作成時は選択肢を1つ作成
        optimisticQuestion.choices = JSON.stringify(['選択肢1']);
      }

      if (questionTypeId === 7 || questionTypeId === 9 || typeName.includes('スケール') || typeName.includes('リニア') || typeName.includes('推奨度')) {
        optimisticQuestion.scale_settings = JSON.stringify({
          minValue: questionTypeId === 9 ? 0 : 1,
          maxValue: questionTypeId === 9 ? 10 : 5,
          minLabel: '',
          maxLabel: ''
        });
      }

      // 過去の質問の場合は内容をコピー
      if (draggedData.isPastQuestion) {
        optimisticQuestion.question_types_id = draggedData.question_types_id;
        optimisticQuestion.is_required = draggedData.required !== undefined ? draggedData.required : true;

        if (draggedData.detail) {
          optimisticQuestion.question_detail_text = draggedData.detail;
        }

        if (draggedData.choices && Array.isArray(draggedData.choices) && draggedData.choices.length > 0) {
          optimisticQuestion.choices = JSON.stringify(draggedData.choices);
        }

        if (draggedData.scale_settings) {
          optimisticQuestion.scale_settings = JSON.stringify(draggedData.scale_settings);
        }
      }

      // 即座にローカル状態を更新（楽観的更新）
      const optimisticQuestions = [...currentQuestions, optimisticQuestion];
      handleQuestionsUpdate(selectedPage.id, optimisticQuestions);

      // バックグラウンドでSupabaseに質問を作成
      let supabaseQuestion;
      try {
        if (draggedData.isPastQuestion) {
          // 過去の質問を中間テーブル経由でリンク（新しいレコードを作成せず、既存の質問IDを共有）
          const originalQuestionId = draggedData.originalQuestionId || draggedData.id;

          // 既に現在のページに同じ質問が存在するかチェック
          const existingQuestion = currentQuestions.find(q => q.id === originalQuestionId);
          if (existingQuestion) {
            toast.error('この質問は既にこのページに追加されています');
            handleQuestionsUpdate(selectedPage.id, currentQuestions);
            return;
          }

          await linkQuestionToForm({
            reviewQuestionId: originalQuestionId,
            reviewFormId: formId,
            reviewFormPagesId: selectedPage.id,
            questionNumber: questionNumber,
            isRequired: draggedData.required
          });
          // リンクされた場合、元の質問データをそのまま使用
          supabaseQuestion = {
            id: originalQuestionId,
            question_text: draggedData.question_text || draggedData.question,
            question_types_id: draggedData.question_types_id
          };
        } else {
          supabaseQuestion = await createQuestionWithOptions({
            reviewFormId: formId,
            questionTypesId: questionTypeId,
            reviewFormPagesId: selectedPage.id,
            questionNumber: questionNumber
          });
        }

        // 成功時：一時IDを実際のIDに置き換え
        const finalQuestions = optimisticQuestions.map(q =>
          q.id === tempId ? { ...q, id: supabaseQuestion.id } : q
        );
        handleQuestionsUpdate(selectedPage.id, finalQuestions);

        // 新しい質問を作成済みの質問リストに追加（過去の質問からドラッグした場合は追加しない）
        if (!draggedData.isPastQuestion) {
          const newPastQuestion = {
            id: supabaseQuestion.id,
            formId: formId,
            formTitle: projectTitle || 'フォーム',
            question: supabaseQuestion.question_text || '',
            question_types_id: supabaseQuestion.question_types_id,
            originalQuestionId: supabaseQuestion.id
          };
          setPastQuestions(prev => {
            // 既に同じIDが存在する場合は追加しない
            if (prev.some(q => q.id === supabaseQuestion.id)) {
              return prev;
            }
            return [newPastQuestion, ...prev];
          });
        }

      } catch (error) {
        console.error('質問作成エラー:', error);
        // エラー時：楽観的更新を取り消し
        handleQuestionsUpdate(selectedPage.id, currentQuestions);

        // 重複エラーの場合は専用メッセージ
        if (error.code === '23505') {
          toast.error('この質問は既にこのページに追加されています');
        } else {
          toast.error('質問の追加に失敗しました');
        }
      }
      
    } catch (error) {
      console.error('ドロップエラー:', error);
      toast.error('質問の処理中にエラーが発生しました');
    }
  };

  const handleDragLeave = (e) => {
    // プレビューエリア外に出た場合のみドラッグ状態を解除
    const relatedTarget = e.relatedTarget;
    if (!relatedTarget || !e.currentTarget.contains(relatedTarget)) {
      setIsDragActive(false);
    }
  };

  // ズーム制御関数（5%刻み、30%〜150%の範囲）
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.05, 1.5));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.05, 0.3));
  const handleFitScreen = () => {
    // プレビューモードに応じたデフォルト値にリセット
    if (previewMode === 'mobile') {
      setZoom(0.7); // モバイル: 70%
    } else {
      setZoom(0.5); // PC: 50%
    }
  };


  // ページ管理ハンドラ（楽観的更新）
  const handleDeletePage = async (pageId) => {
    const page = pages.find(p => p.id === pageId);
    if (!page || page.type === 'system') {
      return; // システムページは削除できない
    }

    // 即座にローカル状態を更新（楽観的削除）
    const currentPages = pages;
    const optimisticPages = pages.filter(p => p.id !== pageId);
    setPages(optimisticPages);
    setIsSaving(true);

    // 削除されたページが選択されていた場合、別のページを選択
    if (selectedPage && selectedPage.id === pageId) {
      const remainingQuestionPages = optimisticPages.filter(p => p.type === 'question');
      if (remainingQuestionPages.length > 0) {
        setSelectedPage(remainingQuestionPages[0]);
      } else {
        setSelectedPage(optimisticPages.find(p => p.id === 'login') || null);
      }
    }

    // バックグラウンドでSupabaseから削除
    try {
      const result = await FormDataService.deleteFormPage(pageId);
      
      if (result.success) {
        // 成功時は何もしない（既にUIは更新済み）
      } else {
        // エラー時：楽観的更新を取り消し
        setPages(currentPages);
        if (selectedPage && selectedPage.id === pageId) {
          setSelectedPage(page); // 選択状態も復元
        }
        toast.error(result.error || 'ページの削除に失敗しました');
      }
    } catch (error) {
      console.error('Delete page error:', error);
      // エラー時：楽観的更新を取り消し
      setPages(currentPages);
      if (selectedPage && selectedPage.id === pageId) {
        setSelectedPage(page); // 選択状態も復元
      }
      toast.error('ページの削除中にエラーが発生しました');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddPage = async () => {
    if (!formId) {
      toast.error('フォームIDが見つかりません');
      return;
    }

    // 既にページ追加中の場合は処理を停止
    if (isAddingPage) {
      return;
    }

    try {
      setIsAddingPage(true);
      setIsSaving(true);
      const questionPageCount = pages.filter(p => p.type === 'question').length;
      const pageName = `新しいページ${questionPageCount + 1}`;
      
      // 楽観的更新用の一時的なIDを生成
      const tempId = `temp_page_${Date.now()}_${Math.random()}`;
      
      // 楽観的更新用のページオブジェクトを作成
      const optimisticPage = {
        id: tempId,
        title: pageName,
        type: 'question',
        icon: <Pages />,
        canDelete: true,
        canEdit: true,
        questions: 0,
        page_number: questionPageCount + 1
      };
      
      // 即座にローカル状態を更新（楽観的更新）
      const completionIndex = pages.findIndex(p => p.id === 'completion');
      const optimisticPages = [...pages];
      optimisticPages.splice(completionIndex, 0, optimisticPage);
      setPages(optimisticPages);
      
      // バックグラウンドでSupabaseにページを追加
      try {
        const result = await FormDataService.addFormPage(formId, pageName);
        
        if (result.success) {
          // 成功時：一時IDを実際のIDに置き換え
          const finalPages = optimisticPages.map(p => 
            p.id === tempId ? {
              ...p,
              id: result.data.id,
              title: result.data.name,
              page_number: result.data.page_number
            } : p
          );
          setPages(finalPages);
          
          // ページ追加成功時は通知なし
        } else {
          // エラー時：楽観的更新を取り消し
          setPages(pages);
          toast.error(result.error || 'ページの追加に失敗しました');
        }
      } catch (error) {
        console.error('Page creation error:', error);
        // エラー時：楽観的更新を取り消し
        setPages(pages);
        toast.error('ページの追加中にエラーが発生しました');
      }
    } catch (error) {
      console.error('Add page error:', error);
      toast.error('ページの処理中にエラーが発生しました');
    } finally {
      setIsAddingPage(false);
      setIsSaving(false);
    }
  };

  const handleMovePageUp = async (pageId) => {
    const pageIndex = pages.findIndex(p => p.id === pageId);
    if (pageIndex > 1) { // ログイン画面より後ろの場合のみ
      // アニメーション開始
      setSortingAnimation({ id: pageId, direction: 'up' });
      
      // アニメーション付きで移動を実行
      executeWithAnimation(setSortingAnimation, () => {
        const newPages = [...pages];
        [newPages[pageIndex], newPages[pageIndex - 1]] = [newPages[pageIndex - 1], newPages[pageIndex]];
        setPages(newPages);
      });
    }
  };

  const handleMovePageDown = async (pageId) => {
    const pageIndex = pages.findIndex(p => p.id === pageId);
    if (pageIndex < pages.length - 2) { // 完了画面より前の場合のみ
      // アニメーション開始
      setSortingAnimation({ id: pageId, direction: 'down' });
      
      // アニメーション付きで移動を実行
      executeWithAnimation(setSortingAnimation, () => {
        const newPages = [...pages];
        [newPages[pageIndex], newPages[pageIndex + 1]] = [newPages[pageIndex + 1], newPages[pageIndex]];
        setPages(newPages);
      });
    }
  };

  // ドラッグ&ドロップハンドラ
  const handleDragStart = (e, page) => {
    if (page.type === 'system') return; // システムページはドラッグ不可
    setDraggedPage(page);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', '');
    
    // ドラッグ開始アニメーション
    setSortingAnimation({ id: page.id, direction: 'dragging' });
  };

  const handlePageDragOver = (e, targetPageId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    // ドロップ位置のインジケーターを表示
    if (draggedPage && targetPageId) {
      const targetPage = pages.find(p => p.id === targetPageId);
      if (targetPage && targetPage.type !== 'system' && targetPageId !== draggedPage.id) {
        setDropIndicator(targetPageId);
      }
    }
  };

  const handlePageDrop = (e, targetPage) => {
    e.preventDefault();
    if (!draggedPage || draggedPage.id === targetPage.id || targetPage.type === 'system') return;

    const draggedIndex = pages.findIndex(p => p.id === draggedPage.id);
    const targetIndex = pages.findIndex(p => p.id === targetPage.id);
    
    // ドロップ成功アニメーション
    setSortingAnimation({ id: draggedPage.id, direction: 'success' });
    
    // システムページ間の移動は禁止
    if (draggedIndex <= 0 || draggedIndex >= pages.length - 1 || 
        targetIndex <= 0 || targetIndex >= pages.length - 1) return;

    const newPages = [...pages];
    newPages.splice(draggedIndex, 1);
    newPages.splice(targetIndex, 0, draggedPage);
    
    setPages(newPages);
    setDraggedPage(null);
  };

  const handleDragEnd = () => {
    setDraggedPage(null);
    setDropIndicator(null);
    
    // ドラッグ終了後の処理
    setTimeout(() => {
      setSortingAnimation(null);
    }, 300);
  };

  // 削除モード関連ハンドラ
  const handleDeleteModeToggle = () => {
    setDeleteMode(!deleteMode);
    setPageToDelete(null);
  };

  const handlePageDeletionRequest = (page) => {
    if (!deleteMode || !page.canDelete) return;
    setPageToDelete(page);
    setShowDeleteConfirm(true);
  };

  const handleExecuteDelete = async () => {
    if (pageToDelete) {
      await handleDeletePage(pageToDelete.id);
      setPageToDelete(null);
      setDeleteMode(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setPageToDelete(null);
  };

  // ページ名編集関連ハンドラ
  const handleStartEditing = (page) => {
    if (page.type === 'system') return; // システムページは編集不可
    // 選択されているページのみ編集可能
    if (selectedPage && selectedPage.id === page.id) {
      setEditingPageId(page.id);
      setEditingTitle(page.title);
    }
  };

  const handleSaveEdit = async () => {
    if (editingPageId && editingTitle.trim()) {
      const page = pages.find(p => p.id === editingPageId);
      if (page && page.type === 'question') {
        try {
          const result = await FormDataService.updatePageName(editingPageId, editingTitle.trim());
          
          if (result.success) {
            setPages(prev => prev.map(page => 
              page.id === editingPageId 
                ? { ...page, title: editingTitle.trim() }
                : page
            ));
          } else {
            toast.error(result.error || 'ページ名の更新に失敗しました');
          }
        } catch (error) {
          console.error('Update page name error:', error);
          toast.error('ページ名の更新中にエラーが発生しました');
        }
      } else {
        // システムページの場合はローカルのみ更新
        setPages(prev => prev.map(page => 
          page.id === editingPageId 
            ? { ...page, title: editingTitle.trim() }
            : page
        ));
      }
    }
    setEditingPageId(null);
    setEditingTitle('');
  };

  const handleCancelEdit = () => {
    setEditingPageId(null);
    setEditingTitle('');
  };

  const handleTitleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  // 質問選択ハンドラー
  const handleQuestionSelect = (questionId) => {
    // 一時IDの質問は選択できないようにする
    if (questionId && questionId.toString().startsWith('temp_')) {
      return;
    }
    setSelectedQuestionId(questionId);
    setSelectedElement(null); // 基本設定要素の選択を解除
  };

  // エラーリストから要素ハイライト用ハンドラー
  const handleElementHighlight = (highlightData) => {
    if (!highlightData) return;

    const { elementType, questionId } = highlightData;

    if (elementType === 'question' && questionId) {
      // 質問をハイライトする場合
      handleQuestionSelect(questionId);
      
      // 質問が存在するページに移動
      const questionPage = pages.find(page => {
        const pageQuestions = getQuestionsForPage(page.id);
        return pageQuestions.some(q => q.id === questionId);
      });
      
      if (questionPage && questionPage.id !== selectedPage?.id) {
        setSelectedPage(questionPage);
      }
    }
  };

  // 質問更新ハンドラー（楽観的UI更新）
  const handleQuestionUpdate = async (questionId, updates) => {
    if (!selectedPage) return;

    // 即座にローカル状態を更新（楽観的更新）
    const currentQuestions = getQuestionsForPage(selectedPage.id);
    const optimisticQuestions = currentQuestions.map(q =>
      q.id === questionId ? { ...q, ...updates } : q
    );
    handleQuestionsUpdate(selectedPage.id, optimisticQuestions);
    setIsSaving(true);

    // 作成済みの質問リストも更新（質問テキストが変更された場合）
    if (updates.question_text !== undefined) {
      setPastQuestions(prev => prev.map(q =>
        q.id === questionId
          ? { ...q, question: updates.question_text }
          : q
      ));
    }

    // バックグラウンドでSupabaseに同期
    try {
      await updateQuestion(selectedPage.id, questionId, updates);
      // 成功時は何もしない（既にUIは更新済み）
    } catch (error) {
      console.error('Question update error:', error);
      // エラー時は元の状態に戻す
      handleQuestionsUpdate(selectedPage.id, currentQuestions);
      toast.error('質問の更新に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  // 選択肢専用更新ハンドラー（楽観的UI更新 + 専用テーブル保存）
  const handleChoiceOptionsUpdate = async (questionId, choices) => {
    if (!selectedPage) return;

    // 即座にローカル状態を更新（楽観的更新）
    const currentQuestions = getQuestionsForPage(selectedPage.id);
    const optimisticQuestions = currentQuestions.map(q => 
      q.id === questionId ? { ...q, choices: JSON.stringify(choices) } : q
    );
    handleQuestionsUpdate(selectedPage.id, optimisticQuestions);
    setIsSaving(true);

    // バックグラウンドで専用テーブルに保存
    try {
      await updateChoiceOptions(questionId, choices);
    } catch (error) {
      console.error('Choice options update error:', error);
      // エラー時は元の状態に戻す
      handleQuestionsUpdate(selectedPage.id, currentQuestions);
      toast.error('選択肢の更新に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  // 均等目盛り専用更新ハンドラー（楽観的UI更新 + 専用テーブル保存）
  const handleLinearScaleOptionsUpdate = async (questionId, scaleSettings) => {
    if (!selectedPage) return;

    // 即座にローカル状態を更新（楽観的更新）
    const currentQuestions = getQuestionsForPage(selectedPage.id);
    const optimisticQuestions = currentQuestions.map(q => 
      q.id === questionId ? { ...q, scale_settings: JSON.stringify(scaleSettings) } : q
    );
    handleQuestionsUpdate(selectedPage.id, optimisticQuestions);
    setIsSaving(true);

    // バックグラウンドで専用テーブルに保存
    try {
      await updateLinearScaleOptions(questionId, scaleSettings);
    } catch (error) {
      console.error('Linear scale options update error:', error);
      // エラー時は元の状態に戻す
      handleQuestionsUpdate(selectedPage.id, currentQuestions);
      toast.error('均等目盛り設定の更新に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  // 質問削除ハンドラー（楽観的UI更新）
  const handleQuestionDelete = async (questionId) => {
    if (!selectedPage) return;
    
    // 即座にローカル状態を更新（楽観的削除）
    const currentQuestions = getQuestionsForPage(selectedPage.id);
    const optimisticQuestions = currentQuestions.filter(q => q.id !== questionId);
    handleQuestionsUpdate(selectedPage.id, optimisticQuestions);
    setIsSaving(true);
    
    // 削除された質問が選択されていた場合、選択を解除
    if (selectedQuestionId === questionId) {
      setSelectedQuestionId(null);
    }
    
    // バックグラウンドでSupabaseから削除
    try {
      await deleteQuestion(selectedPage.id, questionId);
      // 成功時は何もしない（既にUIは更新済み）
    } catch (error) {
      console.error('Question delete error:', error);
      // エラー時は元の状態に戻す
      handleQuestionsUpdate(selectedPage.id, currentQuestions);
      if (selectedQuestionId === questionId) {
        setSelectedQuestionId(questionId); // 選択状態も復元
      }
      toast.error('質問の削除に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  // 質問複製ハンドラー（楽観的UI更新）
  const handleQuestionDuplicate = async (originalQuestion) => {
    if (!selectedPage) return;
    
    try {
      setIsSaving(true);
      
      // duplicateQuestion関数を使用して複製
      const duplicatedQuestion = await duplicateQuestion(selectedPage.id, originalQuestion.id);
      
      if (duplicatedQuestion) {
        // 複製された質問を選択状態にする
        setSelectedQuestionId(duplicatedQuestion.id);
        toast.success('質問を複製しました');
      }
    } catch (error) {
      console.error('Question duplicate error:', error);
      toast.error('質問の複製に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  // 質問順序変更ハンドラー
  const handleQuestionReorder = async (dragIndex, hoverIndex) => {
    if (!selectedPage) return;
    
    const currentQuestions = getQuestionsForPage(selectedPage.id);
    const draggedQuestion = currentQuestions[dragIndex];
    
    // 配列を複製して順序を変更
    const updatedQuestions = [...currentQuestions];
    updatedQuestions.splice(dragIndex, 1);
    updatedQuestions.splice(hoverIndex, 0, draggedQuestion);
    
    // question_numberを連番で更新
    const questionsWithUpdatedNumbers = updatedQuestions.map((question, index) => ({
      ...question,
      question_number: index + 1
    }));
    
    // データベースでquestion_numberを更新
    try {
      await Promise.all(
        questionsWithUpdatedNumbers.map(question => 
          updateReviewQuestion(question.id, { question_number: question.question_number })
        )
      );
      
      // UI状態を更新
      handleQuestionsUpdate(selectedPage.id, questionsWithUpdatedNumbers);
    } catch (error) {
      console.error('質問順序の更新に失敗しました:', error);
      toast.error('質問順序の更新に失敗しました');
    }
  };

  // 基本設定関連のハンドラー
  const handleElementSelect = (elementType) => {
    setSelectedElement(elementType);
    setSelectedQuestionId(null); // 質問選択を解除
  };

  const handleHeaderImageChange = (imageData) => {
    if (imageData) {
      // Base64データの場合はそのまま使用（一時的）
      // 実際の実装では、ここでSupabase Storageにアップロードしてから
      // URLを取得してhandleHeaderImageUpdateを呼び出す
      handleHeaderImageUpdate(imageData);
    } else {
      // 画像削除の場合
      handleHeaderImageUpdate(null);
    }
  };

  const handleLogoImageChange = (imageData) => {
    if (imageData) {
      // Base64データの場合はそのまま使用（一時的）
      // 実際の実装では、ここでSupabase Storageにアップロードしてから
      // URLを取得してhandleLogoImageUpdateを呼び出す
      handleLogoImageUpdate(imageData);
    } else {
      // 画像削除の場合
      handleLogoImageUpdate(null);
    }
  };

  // テーマカラープレビュー用ハンドラー（保存なし）
  const handleThemeColorPreview = (themeColor) => {
    setFormSettings(prev => ({ ...prev, theme_color: themeColor }));
    setSelectedColor(themeColor);
  };

  // 基本設定更新ハンドラー（楽観的UI更新 + Supabase保存）
  const handleThemeColorUpdate = useCallback(async (themeColor) => {
    console.log('handleThemeColorUpdate called with:', themeColor);
    console.log('formId:', formId);
    
    // 元の値を保存（ロールバック用）
    const previousThemeColor = formSettings.theme_color;
    
    // 即座にローカル状態を更新
    setFormSettings(prev => ({ ...prev, theme_color: themeColor }));
    setSelectedColor(themeColor);
    setIsSaving(true);

    // バックグラウンドでSupabaseに保存
    try {
      console.log('Calling FormDataService.updateThemeColor...');
      const result = await FormDataService.updateThemeColor(formId, themeColor);
      console.log('FormDataService.updateThemeColor result:', result);
      if (!result.success) {
        throw new Error(result.error);
      }
      console.log('Theme color saved successfully');
    } catch (error) {
      console.error('Theme color update error:', error);
      // エラー時は元の状態に戻す
      setFormSettings(prev => ({ ...prev, theme_color: previousThemeColor }));
      setSelectedColor(previousThemeColor);
      toast.error('テーマカラーの更新に失敗しました');
    } finally {
      setIsSaving(false);
    }
  }, [formId, setSelectedColor]);

  // 抽選設定更新ハンドラー
  const handleLotteryUpdate = useCallback(async (lotterySettings) => {
    setIsSaving(true);
    
    try {
      const { LotteryService } = await import('../services/LotteryService');
      
      await LotteryService.updateLotterySettings(formId, {
        max_wins_per_month: lotterySettings.maxWinsPerMonth,
        win_rate_divisor: lotterySettings.winRateDivisor
      });
      
      console.log('Lottery settings saved successfully');
    } catch (error) {
      console.error('Lottery settings update error:', error);
      toast.error('抽選設定の更新に失敗しました');
    } finally {
      setIsSaving(false);
    }
  }, [formId]);

  const handleLogoImageUpdate = async (logoImageUrl) => {
    // 元の値を保存（ロールバック用）
    const previousLogoImageUrl = formSettings.logo_image_url;
    const previousLogoImageState = logoImageState;
    
    // 即座にローカル状態を更新
    setFormSettings(prev => ({ ...prev, logo_image_url: logoImageUrl }));
    setLogoImageState(logoImageUrl);
    setIsSaving(true);

    // バックグラウンドでSupabaseに保存
    try {
      const result = await FormDataService.updateLogoImage(formId, logoImageUrl);
      if (!result.success) {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Logo image update error:', error);
      // エラー時は元の状態に戻す
      setFormSettings(prev => ({ ...prev, logo_image_url: previousLogoImageUrl }));
      setLogoImageState(previousLogoImageState);
      toast.error('ロゴ画像の更新に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  const handleHeaderImageUpdate = async (headerImageUrl) => {
    // 元の値を保存（ロールバック用）
    const previousHeaderImage = headerImage;
    
    // 即座にローカル状態を更新
    setHeaderImage(headerImageUrl);
    setIsSaving(true);

    // バックグラウンドでSupabaseに保存（question_screen_settingsテーブル）
    try {
      const result = await FormDataService.updateHeaderImage(formId, headerImageUrl);
      if (!result.success) {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Header image update error:', error);
      // エラー時は元の状態に戻す
      setHeaderImage(previousHeaderImage);
      toast.error('ヘッダー画像の更新に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  // ヘッダー画像ファイルアップロードハンドラー
  const handleHeaderImageFileUpload = async (imageFile) => {
    if (!imageFile || !formId) return;

    toast.loading('ヘッダー画像をアップロード中...', { id: 'header-upload' });

    try {
      const result = await FormDataService.uploadAndUpdateHeaderImage(formId, imageFile);
      if (!result.success) {
        throw new Error(result.error);
      }

      // ローカル状態を更新
      setHeaderImage(result.data.url);
    } catch (error) {
      console.error('Header image file upload error:', error);
      toast.error(`ヘッダー画像のアップロードに失敗: ${error.message}`, { id: 'header-upload' });
    }
  };

  // ロゴ画像ファイルアップロードハンドラー
  const handleLogoImageFileUpload = async (imageFile) => {
    if (!imageFile || !formId) return;

    toast.loading('ロゴ画像をアップロード中...', { id: 'logo-upload' });

    try {
      const result = await FormDataService.uploadAndUpdateLogoImage(formId, imageFile);
      if (!result.success) {
        throw new Error(result.error);
      }

      // ローカル状態を更新
      setFormSettings(prev => ({ ...prev, logo_image_url: result.data.url }));
      setLogoImageState(result.data.url);
    } catch (error) {
      console.error('Logo image file upload error:', error);
      toast.error(`ロゴ画像のアップロードに失敗: ${error.message}`, { id: 'logo-upload' });
    }
  };

  // ログイン背景画像ファイルアップロードハンドラー
  const handleLoginBackgroundImageFileUpload = async (imageFile) => {
    if (!imageFile || !formId) return;

    toast.loading('ログイン背景画像をアップロード中...', { id: 'login-bg-upload' });

    try {
      const result = await FormDataService.uploadAndUpdateLoginBackgroundImage(formId, imageFile);
      if (!result.success) {
        throw new Error(result.error);
      }

      // ローカル状態を更新
      setLoginScreenSettings(prev => ({ ...prev, background_image_url: result.data.url }));
    } catch (error) {
      console.error('Login background image file upload error:', error);
      toast.error(`ログイン背景画像のアップロードに失敗: ${error.message}`, { id: 'login-bg-upload' });
    }
  };

  // ログインタイトルテキスト更新ハンドラー
  const handleLoginTitleUpdate = async (titleText) => {
    // 即座にローカル状態を更新
    setLoginScreenSettings(prev => ({ ...prev, title_text: titleText }));
    setLoginTitle(titleText);
    setIsSaving(true);

    // バックグラウンドでSupabaseに保存
    try {
      const result = await FormDataService.updateLoginTitleText(formId, titleText);
      if (!result.success) {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Login title update error:', error);
      // エラー時は元の状態に戻す
      setLoginScreenSettings(prev => ({ ...prev, title_text: loginTitle }));
      toast.error('ログインタイトルの更新に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  // ログイン詳細テキスト更新ハンドラー
  const handleLoginDetailUpdate = async (detailText) => {
    // 即座にローカル状態を更新
    setLoginScreenSettings(prev => ({ ...prev, detail_text: detailText }));
    setLoginDetail(detailText);
    setIsSaving(true);

    // バックグラウンドでSupabaseに保存
    try {
      const result = await FormDataService.updateLoginDetailText(formId, detailText);
      if (!result.success) {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Login detail update error:', error);
      // エラー時は元の状態に戻す
      setLoginScreenSettings(prev => ({ ...prev, detail_text: loginDetail }));
      toast.error('ログイン詳細テキストの更新に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  // 完了画面タイトルテキスト更新ハンドラー
  const handleCompletionTitleUpdate = async (titleText) => {
    // 即座にローカル状態を更新（楽観的更新）
    setCompletionScreenSettings(prev => ({ ...prev, title_text: titleText }));
    setCompletionTitle(titleText);
    setIsSaving(true);

    // バックグラウンドでSupabaseに保存
    try {
      const result = await FormDataService.updateCompletionTitleText(formId, titleText);
      if (!result.success) {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Completion title update error:', error);
      // エラー時は元の状態に戻す
      setCompletionScreenSettings(prev => ({ ...prev, title_text: completionTitle }));
      toast.error('完了タイトルの更新に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  // 完了画面詳細テキスト更新ハンドラー
  const handleCompletionDetailUpdate = async (detailText) => {
    // 即座にローカル状態を更新（楽観的更新）
    setCompletionScreenSettings(prev => ({ ...prev, detail_text: detailText }));
    setCompletionDetail(detailText);
    setIsSaving(true);

    // バックグラウンドでSupabaseに保存
    try {
      const result = await FormDataService.updateCompletionDetailText(formId, detailText);
      if (!result.success) {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Completion detail update error:', error);
      // エラー時は元の状態に戻す
      setCompletionScreenSettings(prev => ({ ...prev, detail_text: completionDetail }));
      toast.error('完了詳細テキストの更新に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  // 完了背景画像更新ハンドラー
  const handleCompletionBackgroundUpdate = async (backgroundImageUrl) => {
    // 即座にローカル状態を更新（楽観的更新）
    setCompletionScreenSettings(prev => ({ ...prev, background_image_url: backgroundImageUrl }));
    setCompletionBackground(backgroundImageUrl);
    setIsSaving(true);

    // バックグラウンドでSupabaseに保存
    try {
      const result = await FormDataService.updateCompletionBackgroundImage(formId, backgroundImageUrl);
      if (!result.success) {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Completion background update error:', error);
      // エラー時は元の状態に戻す
      setCompletionScreenSettings(prev => ({ ...prev, background_image_url: completionBackground }));
      toast.error('完了背景画像の更新に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  // 完了背景画像ファイルアップロードハンドラー
  const handleCompletionBackgroundImageFileUpload = async (imageFile) => {
    if (!imageFile || !formId) return;

    toast.loading('完了背景画像をアップロード中...', { id: 'completion-bg-upload' });

    try {
      const result = await FormDataService.uploadAndUpdateCompletionBackgroundImage(formId, imageFile);
      if (!result.success) {
        throw new Error(result.error);
      }

      // ローカル状態を更新
      setCompletionScreenSettings(prev => ({ ...prev, background_image_url: result.data.url }));
      setCompletionBackground(result.data.url);
    } catch (error) {
      console.error('Completion background image file upload error:', error);
      toast.error(`完了背景画像のアップロードに失敗: ${error.message}`, { id: 'completion-bg-upload' });
    }
  };

  // 完了ボタン1有効/無効更新ハンドラー
  const handleCompletionButton1EnabledUpdate = async (isEnabled) => {
    // 即座にローカル状態を更新（楽観的更新）
    setCompletionScreenSettings(prev => ({ ...prev, is_button_1_enabled: isEnabled }));
    setIsSaving(true);

    // バックグラウンドでSupabaseに保存
    try {
      const result = await FormDataService.updateCompletionButton1Enabled(formId, isEnabled);
      if (!result.success) {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Completion button enabled update error:', error);
      // エラー時は元の状態に戻す
      setCompletionScreenSettings(prev => ({ ...prev, is_button_1_enabled: !isEnabled }));
      toast.error('完了ボタン設定の更新に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  // 完了ボタン1テキスト更新ハンドラー
  const handleCompletionButton1TextUpdate = async (buttonText) => {
    // 即座にローカル状態を更新（楽観的更新）
    setCompletionScreenSettings(prev => ({ ...prev, button_text_1: buttonText }));
    setIsSaving(true);

    // バックグラウンドでSupabaseに保存
    try {
      const result = await FormDataService.updateCompletionButton1Text(formId, buttonText);
      if (!result.success) {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Completion button text update error:', error);
      // エラー時は元の状態に戻す
      setCompletionScreenSettings(prev => ({ ...prev, button_text_1: completionScreenSettings.button_text_1 }));
      toast.error('完了ボタンテキストの更新に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  // 完了ボタン1URL更新ハンドラー
  const handleCompletionButton1UrlUpdate = async (buttonUrl) => {
    // 即座にローカル状態を更新（楽観的更新）
    setCompletionScreenSettings(prev => ({ ...prev, button_url_1: buttonUrl }));
    setIsSaving(true);

    // バックグラウンドでSupabaseに保存
    try {
      const result = await FormDataService.updateCompletionButton1Url(formId, buttonUrl);
      if (!result.success) {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Completion button URL update error:', error);
      // エラー時は元の状態に戻す
      setCompletionScreenSettings(prev => ({ ...prev, button_url_1: completionScreenSettings.button_url_1 }));
      toast.error('完了ボタンURLの更新に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };



  // プロジェクトタイトル更新ハンドラー
  const handleProjectTitleUpdate = async (title) => {
    // 即座にローカル状態を更新
    setProjectTitle(title);
    setIsSaving(true);

    // バックグラウンドでSupabaseに保存
    try {
      const result = await FormDataService.updateProjectTitle(formId, title);
      if (!result.success) {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Project title update error:', error);
      toast.error('プロジェクトタイトルの更新に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  // 公開処理ハンドラー（HeaderBarの公開処理と同じロジック）
  const handlePublishClick = async () => {
    console.log('🚀 SettingsPanel: 公開ボタンがクリックされました');
    
    // すでに公開済みの場合は何もしない
    if (isPublished) {
      return;
    }
    
    // フォーム検証を実行（HeaderBarと同じ方法）
    const { validateForm } = require('../utils/validation');
    const validationData = {
      projectTitle,
      questions: allQuestions,
      pages,
      formSettings,
      loginScreenSettings,
      completionScreenSettings,
      loginTitle,
      loginDetail,
      completionTitle,
      completionDetail
    };
    const { errors, warnings } = validateForm(validationData);
    
    // エラーと警告を状態に設定
    setPublishDialogErrors(errors);
    setPublishDialogWarnings(warnings);
    
    // エラーがある場合は公開を阻止し、エラー表示ダイアログを表示
    if (errors.length > 0) {
      console.log('❌ エラーが検出されました:', errors);
      setShowPublishDialog(true);
      return;
    }
    
    // エラーがない場合は最終チェックを実行後、直接公開確認ダイアログを表示
    console.log('✅ エラーがないため最終チェックを実行します');
    
    // エラーチェック項目を定義
    const checkItems = [
      { id: 1, name: 'プロジェクトタイトル', status: 'pending' },
      { id: 2, name: '質問設定', status: 'pending' },
      { id: 3, name: 'ページ設定', status: 'pending' },
      { id: 4, name: 'ログイン画面', status: 'pending' },
      { id: 5, name: '完了画面', status: 'pending' },
      { id: 6, name: '全体設定', status: 'pending' }
    ];
    
    setErrorCheckItems(checkItems);
    setErrorCheckProgress(0);
    setIsErrorChecking(true);
    setShowPublishDialog(true); // 直接公開ダイアログを表示
    
    // エラーチェック処理をシミュレート
    let currentProgress = 0;
    const checkInterval = setInterval(() => {
      currentProgress += 1;
      setErrorCheckProgress(currentProgress);
      
      // 各項目を順次チェック完了にする
      setErrorCheckItems(prev => 
        prev.map(item => 
          item.id <= currentProgress 
            ? { ...item, status: 'completed' }
            : item
        )
      );
      
      if (currentProgress >= checkItems.length) {
        clearInterval(checkInterval);
        setIsErrorChecking(false);
      }
    }, 400);
  };

  // 公開確認処理
  const handlePublishConfirm = async () => {
    console.log('✅ 公開処理を実行します');
    
    if (!formId) {
      toast.error('フォームIDが見つかりません', {
        duration: 3000,
        position: 'bottom-center',
      });
      return;
    }

    try {
      // HeaderBarと同じ方法でSupabaseを直接使用
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
      const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase設定が見つかりません');
      }
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const { data, error } = await supabase
        .from('review_forms')
        .update({ 
          is_published: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', formId)
        .select();

      if (error) {
        throw error;
      }

      console.log('✅ フォーム公開完了:', data);
      
      setShowPublishDialog(false); // ダイアログを閉じる
      setIsPublished(true); // 公開状態を更新
      
      // 成功トースト
      toast.success('フォームが公開されました！', {
        duration: 3000,
        position: 'bottom-center',
        style: {
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(34, 197, 94, 0.2)',
          borderRadius: '12px',
          color: '#374151',
          fontSize: '14px',
          fontWeight: '500',
          padding: '12px 20px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
        },
      });
      
    } catch (error) {
      console.error('❌ 公開処理エラー:', error);
      
      // エラートースト
      toast.error(`公開に失敗しました: ${error.message}`, {
        duration: 4000,
        position: 'bottom-center',
        style: {
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: '12px',
          color: '#374151',
          fontSize: '14px',
          fontWeight: '500',
          padding: '12px 20px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
        },
      });
    }
  };

  const handlePublishCancel = () => {
    setShowPublishDialog(false);
    setIsErrorChecking(false);
    setErrorCheckProgress(0);
    setErrorCheckItems([]);
    setPublishDialogErrors([]);
    setPublishDialogWarnings([]);
  };

  return (
    <Box
      className={`main-container ${showSettings ? 'settings-active' : ''}`}
      sx={{
        height: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        display: 'flex',
        overflow: 'hidden'
      }}
    >
      {/* 背景全体Container */}
      {/* 左端ナビゲーションバー */}
      <LeftNavigationBar
        leftNavigationItems={leftNavigationItems}
        selectedTool={selectedTool}
        showPageManager={showPageManager}
        showSettings={showSettings}
        onBackClick={onBackClick}
        setShowPageManager={setShowPageManager}
        setShowSettings={setShowSettings}
        setSelectedTool={setSelectedTool}
      />

      {/* 右側メインエリア */}
      <Box
        className="right-main-area"
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          height: '100vh'
        }}
      >
        {/* ヘッダー */}
        {(() => {
          const formDataForValidation = {
            questions: allQuestions,
            pages,
            formSettings,
            loginScreenSettings,
            completionScreenSettings,
            loginTitle,
            loginDetail,
            completionTitle,
            completionDetail,
            logoImage: headerImage?.logo || logoImage,
            headerImage,
            completionBackground
          };
          
          console.log('📊 CreatePage: HeaderBarに渡すformDataを構築しました:', {
            questionsCount: allQuestions?.length || 0,
            pagesCount: pages?.length || 0,
            formSettings,
            loginScreenSettings,
            completionScreenSettings,
            loginTitle,
            loginDetail,
            completionTitle,
            completionDetail,
            logoImage: headerImage?.logo || logoImage,
            headerImage,
            completionBackground,
            projectTitle
          });
          
          return null; // このコンポーネントは何もレンダリングしない
        })()}
        <HeaderBar
          isEditingTitle={isEditingTitle}
          projectTitle={projectTitle}
          setProjectTitle={setProjectTitle}
          setIsEditingTitle={setIsEditingTitle}
          onProjectTitleUpdate={handleProjectTitleUpdate}
          isSaving={showSavingIndicator}
          formId={formId}
          isPublished={isPublished}
          setIsPublished={setIsPublished}
          formData={{
            questions: allQuestions,
            pages,
            formSettings,
            loginScreenSettings,
            completionScreenSettings,
            loginTitle,
            loginDetail,
            completionTitle,
            completionDetail,
            logoImage: headerImage?.logo || logoImage,
            headerImage,
            completionBackground
          }}
          onOpenDesignSettings={() => {
            setActiveSection('design');
            setShowSettings(true);
          }}
          onOpenLoginSettings={() => {
            // 何もしない - 遷移を無効化
          }}
          onOpenCompletionSettings={() => {
            // 何もしない - 遷移を無効化
          }}
          onOpenSettings={() => {
            setActiveSection('all');
            setShowSettings(true);
          }}
          onQuestionSelect={handleQuestionSelect}
          onHighlightElement={handleElementHighlight}
          onNavigateToPage={(pageId) => {
            const targetPage = pages.find(p => p.id === pageId);
            if (targetPage) {
              setSelectedPage(targetPage);
            }
          }}
          onShowPageError={(pageId) => {
            setPageErrorHighlight(pageId);
            setTimeout(() => setPageErrorHighlight(null), 3000);
          }}
          onShowQuestionError={(questionId, errorId, choiceIndex, labelType) => {
            // 質問があるページを見つけて移動
            const questionPageId = findPageIdByQuestionId(questionId);
            if (questionPageId) {
              const targetPage = pages.find(p => p.id === questionPageId);
              if (targetPage) {
                setSelectedPage(targetPage);
              }
            }
            // 質問を選択
            setSelectedQuestionId(questionId);
            // エラーフィールドをハイライト（選択肢インデックス、ラベルタイプも含む）
            setQuestionErrorHighlight({ errorId, choiceIndex, labelType });
            setTimeout(() => setQuestionErrorHighlight(null), 3000);
          }}
          onNavigateToLoginScreen={(fieldType) => {
            // ログイン画面に遷移
            console.log('🔴 CreatePage - ログイン画面遷移処理開始:', { fieldType });
            const loginPage = pages.find(p => p.id === 'login');
            console.log('🔴 CreatePage - ログインページ検索結果:', loginPage);
            if (loginPage) {
              console.log('🔴 CreatePage - ログインページに遷移中...');
              setSelectedPage(loginPage);
            } else {
              console.error('🔴 CreatePage - ログインページが見つかりません!');
            }
          }}
          onShowLoginError={(errorId, fieldType) => {
            // ログインエラーをハイライト
            console.log('🔴 CreatePage - ログインエラーハイライト設定:', { errorId, fieldType });
            setLoginErrorHighlight({ errorId, fieldType });
            
            // 対応するアコーディオンを開くためにelementを選択
            if (fieldType === 'title') {
              console.log('🔴 CreatePage - ログインタイトル要素を選択してアコーディオンを開く');
              handleElementSelect('login-title');
            } else if (fieldType === 'detail') {
              console.log('🔴 CreatePage - ログイン詳細要素を選択してアコーディオンを開く');
              handleElementSelect('login-detail');
            }
            
            setTimeout(() => {
              console.log('🔴 CreatePage - ログインエラーハイライト解除');
              setLoginErrorHighlight(null);
            }, 3000);
          }}
          onNavigateToCompletionScreen={(fieldType) => {
            // 完了画面に遷移
            console.log('🔴 CreatePage - 完了画面遷移処理開始:', { fieldType });
            const completionPage = pages.find(p => p.id === 'completion');
            console.log('🔴 CreatePage - 完了画面検索結果:', completionPage);
            if (completionPage) {
              console.log('🔴 CreatePage - 完了画面に遷移中...');
              setSelectedPage(completionPage);
            } else {
              console.error('🔴 CreatePage - 完了画面が見つかりません!');
            }
          }}
          onShowCompletionError={(errorId, fieldType) => {
            // 完了画面エラーをハイライト
            console.log('🔴 CreatePage - 完了画面エラーハイライト設定:', { errorId, fieldType });
            setCompletionErrorHighlight({ errorId, fieldType });
            
            // 対応するアコーディオンを開くためにelementを選択
            if (fieldType === 'title') {
              console.log('🔴 CreatePage - 完了画面タイトル要素を選択してアコーディオンを開く');
              handleElementSelect('completion-title');
            } else if (fieldType === 'detail') {
              console.log('🔴 CreatePage - 完了画面詳細要素を選択してアコーディオンを開く');
              handleElementSelect('completion-detail');
            }
            
            setTimeout(() => {
              console.log('🔴 CreatePage - 完了画面エラーハイライト解除');
              setCompletionErrorHighlight(null);
            }, 3000);
          }}
        />

        {/* メインコンテンツエリア */}
        <Box
          className="main-content-area"
          sx={{
            flex: 1,
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          {/* 最大まで広げた背景Container */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            style={{ 
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0
            }}
          >
            <Paper
              elevation={2}
              onClick={(e) => {
                // プレビュー画面内のプレビューエリア以外をクリックした時に要素選択を解除
                if (e.target === e.currentTarget) {
                  setSelectedElement(null);
                  setSelectedQuestionId(null);
                }
              }}
              sx={{
                height: '100%',
                width: '100%',
                borderRadius: 0,
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                position: 'relative'
              }}
            >
              {/* 背景パターン */}
              <Box
                onClick={() => {
                  // 背景パターンをクリックした時に要素選択を解除
                  setSelectedElement(null);
                  setSelectedQuestionId(null);
                }}
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'radial-gradient(circle at 20% 20%, rgba(94, 23, 235, 0.05) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(118, 75, 162, 0.05) 0%, transparent 50%)',
                  zIndex: 0,
                  cursor: 'default'
                }}
              />


              {/* 設定画面または中央プレビューエリア */}
              {showSettings ? (
                /* 設定画面 */
                <SettingsPanel
                  formId={formId}

                  // アクティブセクション
                  activeSection={activeSection}
                />
              ) : (
                /* 中央プレビューエリア - 設定画面でない場合 */
                <>
                  {/* プレビューエリア全体の背景（クリック可能エリア） */}
                  <Box
                    onClick={() => {
                      // プレビューエリア全体をクリックした時に要素選択を解除
                      setSelectedElement(null);
                      setSelectedQuestionId(null);
                    }}
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      zIndex: 0
                    }}
                  />
                  
                  
                  {/* メインプレビューエリア */}
                  <PreviewArea
                    previewMode={previewMode}
                    zoom={zoom}
                    selectedPage={selectedPage}
                    questions={currentQuestions}
                    onQuestionAdd={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    isDragActive={isDragActive}
                    pages={pages}
                    selectedQuestionId={selectedQuestionId}
                    onQuestionSelect={handleQuestionSelect}
                    onPageSelect={setSelectedPage}
                    headerImage={headerImage}
                    logoImage={logoImageState}
                    onElementSelect={handleElementSelect}
                    selectedElement={selectedElement}
                    // フォーム設定
                    formSettings={formSettings}
                    // ログイン画面設定
                    loginScreenSettings={loginScreenSettings}
                    // 完了画面設定
                    completionScreenSettings={completionScreenSettings}
                    // テキスト設定（後方互換性）
                    loginTitle={loginTitle}
                    loginDetail={loginDetail}
                    completionTitle={completionTitle}
                    completionDetail={completionDetail}
                    completionBackground={completionBackground}
                    // フォームID
                    formId={formId}
                    // ページエラーハイライト
                    pageErrorHighlight={pageErrorHighlight}
                  />
                  
                  {/* プレビューコントロール */}
                  <PreviewControlPanel
                    previewMode={previewMode}
                    setPreviewMode={setPreviewMode}
                    zoom={zoom}
                    handleZoomIn={handleZoomIn}
                    handleZoomOut={handleZoomOut}
                    handleFitScreen={handleFitScreen}
                    formId={formId}
                  />
                </>
              )}
            </Paper>
          </motion.div>

          {/* 上のレイヤー：左右のContainer2つ */}
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="stretch"
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 15,
              pointerEvents: 'none'
            }}
          >
            {/* 左側Container - 質問作成ツール / ページ管理 */}
            {/* 右コンテナ - 設定画面では非表示 */}
            {!showSettings && (
              <motion.div
                {...SLIDE_IN_LEFT_ANIMATION}
                style={{ width: '300px', minWidth: '300px', maxWidth: '300px', pointerEvents: 'auto' }}
              >
                <Paper
                  elevation={8}
                  sx={{
                    ...SIDEBAR_PAPER_BASE_STYLE,
                    overflowY: 'auto',
                    '&::-webkit-scrollbar': {
                      display: 'none'
                    },
                    scrollbarWidth: 'none', // Firefox
                    msOverflowStyle: 'none' // IE and Edge
                  }}
                >
                {showPageManager ? (
                  // ページ管理UI
                  <>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Typography
                        variant="h6"
                        sx={PURPLE_GRADIENT_TEXT_STYLE}
                      >
                        ページ管理
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                          onClick={handleAddPage}
                          disabled={isAddingPage}
                          sx={{
                            color: isAddingPage ? '#9ca3af' : '#5e17eb',
                            backgroundColor: isAddingPage ? 'rgba(156, 163, 175, 0.1)' : 'rgba(94, 23, 235, 0.1)',
                            '&:hover': isAddingPage ? {} : { 
                              backgroundColor: 'rgba(94, 23, 235, 0.2)',
                              transform: 'scale(1.05)'
                            },
                            '&.Mui-disabled': {
                              color: '#9ca3af',
                              backgroundColor: 'rgba(156, 163, 175, 0.1)'
                            }
                          }}
                        >
                          <Add />
                        </IconButton>
                        <IconButton
                          onClick={handleDeleteModeToggle}
                          sx={{
                            color: deleteMode ? '#ef4444' : '#64748b',
                            backgroundColor: deleteMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                            '&:hover': { 
                              backgroundColor: deleteMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(100, 116, 139, 0.2)',
                              transform: 'scale(1.05)'
                            }
                          }}
                        >
                          <Delete />
                        </IconButton>
                      </Box>
                    </Box>

                    {/* ページリスト */}
                    <Box sx={{ flex: 1 }}>
                      {pages.map((page, index) => (
                        <motion.div
                          key={page.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ 
                            opacity: 1, 
                            y: 0,
                            scale: sortingAnimation?.id === page.id && sortingAnimation.direction === 'dragging' ? 1.05 : 1,
                            x: sortingAnimation?.id === page.id && sortingAnimation.direction === 'up' ? -5 : 
                               sortingAnimation?.id === page.id && sortingAnimation.direction === 'down' ? 5 : 0
                          }}
                          transition={{ 
                            duration: sortingAnimation?.id === page.id ? 0.2 : 0.2, 
                            delay: sortingAnimation?.id === page.id ? 0 : index * 0.05 
                          }}
                        >
                          <Box
                            draggable={page.type === 'question' && !deleteMode}
                            onDragStart={(e) => handleDragStart(e, page)}
                            onDragOver={(e) => handlePageDragOver(e, page.id)}
                            onDrop={(e) => handlePageDrop(e, page)}
                            onDragEnd={handleDragEnd}
                            onClick={(e) => {
                              // 編集中の入力フィールドをクリックした場合は何もしない
                              if (editingPageId === page.id) {
                                e.stopPropagation();
                                return;
                              }
                              
                              if (deleteMode && page.canDelete) {
                                handlePageDeletionRequest(page);
                              } else if (!deleteMode) {
                                setSelectedPage(page);
                                // ページ切り替え時に選択状態をリセット
                                setSelectedQuestionId(null);
                                setSelectedElement(null);
                              }
                            }}
                            sx={{
                              p: 1.5,
                              mb: 1,
                              borderRadius: 1,
                              backgroundColor: sortingAnimation?.id === page.id && sortingAnimation.direction === 'success'
                                ? 'rgba(34, 197, 94, 0.1)'
                                : draggedPage?.id === page.id 
                                ? 'rgba(94, 23, 235, 0.1)' 
                                : dropIndicator === page.id
                                ? 'rgba(94, 23, 235, 0.08)'
                                : selectedPage?.id === page.id
                                ? 'rgba(94, 23, 235, 0.12)'
                                : 'rgba(255, 255, 255, 0.8)',
                              border: dropIndicator === page.id 
                                ? '2px dashed #5e17eb'
                                : sortingAnimation?.id === page.id && sortingAnimation.direction === 'success'
                                ? '1px solid rgba(34, 197, 94, 0.3)'
                                : selectedPage?.id === page.id
                                ? '2px solid #5e17eb'
                                : '1px solid rgba(0, 0, 0, 0.06)',
                              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                              minHeight: 72,
                              display: 'flex',
                              alignItems: 'center',
                              cursor: deleteMode && page.canDelete 
                                ? 'pointer' 
                                : 'default',
                              opacity: draggedPage?.id === page.id ? 0.5 : deleteMode && !page.canDelete ? 0.5 : 1,
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                backgroundColor: deleteMode && page.canDelete
                                  ? 'rgba(239, 68, 68, 0.05)'
                                  : draggedPage?.id === page.id 
                                  ? 'rgba(94, 23, 235, 0.1)' 
                                  : selectedPage?.id === page.id
                                  ? 'rgba(94, 23, 235, 0.15)'
                                  : 'rgba(94, 23, 235, 0.04)',
                                borderColor: deleteMode && page.canDelete
                                  ? 'rgba(239, 68, 68, 0.3)'
                                  : selectedPage?.id === page.id
                                  ? '#5e17eb'
                                  : 'rgba(94, 23, 235, 0.15)',
                                transform: draggedPage?.id === page.id ? 'none' : 'translateY(-1px)',
                                boxShadow: selectedPage?.id === page.id 
                                  ? '0 4px 16px rgba(94, 23, 235, 0.2)'
                                  : '0 3px 12px rgba(0, 0, 0, 0.1)'
                              }
                            }}
                          >
                            {/* ドラッグハンドル領域またはシステムページパディング */}
                            {page.type === 'question' && !deleteMode ? (
                              <Box
                                sx={{
                                  color: '#94a3b8',
                                  cursor: 'grab',
                                  '&:active': { cursor: 'grabbing' },
                                  '&:hover': { color: '#5e17eb' },
                                  padding: '4px',
                                  borderRadius: '4px',
                                  mr: 1,
                                  '&:hover': {
                                    backgroundColor: 'rgba(94, 23, 235, 0.1)',
                                    color: '#5e17eb'
                                  }
                                }}
                              >
                                <DragHandle sx={{ fontSize: '1.2rem' }} />
                              </Box>
                            ) : (
                              <Box sx={{ width: 16, flexShrink: 0 }} />
                            )}

                            {/* ページアイコン */}
                            <Box
                              sx={{
                                width: 32,
                                height: 32,
                                borderRadius: 1,
                                background: selectedPage?.id === page.id
                                  ? 'linear-gradient(135deg, #5e17eb 0%, #764ba2 100%)'
                                  : page.type === 'system' 
                                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                                  : 'linear-gradient(135deg, #5e17eb 0%, #764ba2 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                boxShadow: selectedPage?.id === page.id
                                  ? '0 4px 12px rgba(76, 29, 149, 0.4)'
                                  : '0 2px 8px rgba(94, 23, 235, 0.3)',
                                transform: selectedPage?.id === page.id ? 'scale(1.05)' : 'scale(1)',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              {React.cloneElement(page.icon, { 
                                sx: { color: 'white', fontSize: '1rem' } 
                              })}
                            </Box>

                            {/* ページ情報 */}
                            <Box sx={{ flex: 1, minWidth: 0, ml: 2, overflow: 'hidden' }}>
                              {editingPageId === page.id ? (
                                <Input
                                  value={editingTitle}
                                  onChange={(e) => setEditingTitle(e.target.value)}
                                  onKeyPress={handleTitleKeyPress}
                                  onBlur={handleSaveEdit}
                                  autoFocus
                                  sx={{
                                    fontWeight: 600,
                                    color: '#2d3748',
                                    fontSize: '0.8rem',
                                    width: '100%',
                                    '&:before': {
                                      borderBottom: '2px solid #5e17eb'
                                    },
                                    '&:after': {
                                      borderBottom: '2px solid #5e17eb'
                                    }
                                  }}
                                />
                              ) : (
                                <Typography
                                  variant="body2"
                                  onClick={(e) => {
                                    if (!deleteMode) {
                                      // 既に選択されている場合は編集モードに入る
                                      if (selectedPage?.id === page.id) {
                                        handleStartEditing(page);
                                      } else {
                                        // 未選択の場合はページを選択する
                                        setSelectedPage(page);
                                        setSelectedQuestionId(null);
                                        setSelectedElement(null);
                                      }
                                    }
                                  }}
                                  sx={{
                                    fontWeight: 600,
                                    color: selectedPage?.id === page.id ? '#5e17eb' : '#2d3748',
                                    fontSize: '0.8rem',
                                    mb: 0.3,
                                    cursor: page.type === 'question' && !deleteMode ? 
                                      (selectedPage?.id === page.id ? 'text' : 'pointer') : 'default',
                                    transition: 'color 0.2s ease',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis', 
                                    whiteSpace: 'nowrap',
                                    maxWidth: '100%',
                                    '&:hover': page.type === 'question' && !deleteMode ? {
                                      textDecoration: selectedPage?.id === page.id ? 'underline' : 'none',
                                      color: '#5e17eb'
                                    } : {}
                                  }}
                                  title={page.title} // ホバー時に全文表示
                                >
                                  {page.title}
                                </Typography>
                              )}
                              {page.type === 'question' && (
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: '#64748b',
                                    fontSize: '0.7rem'
                                  }}
                                >
                                  {page.questions}個の質問
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </motion.div>
                      ))}
                    </Box>
                  </>
                ) : (
                  // 通常の質問作成ツール
                  <QuestionToolsSidebar
                    questionTypes={convertedQuestionTypes}
                    setSelectedTool={setSelectedTool}
                    pastQuestions={pastQuestions}
                    isLoadingPastQuestions={isLoadingPastQuestions}
                  />
                )}
                </Paper>
              </motion.div>
            )}

            {/* 右側Container - 質問設定 - 設定画面では非表示 */}
            {!showSettings && (
              <motion.div
                {...SLIDE_IN_RIGHT_ANIMATION}
                style={{ width: '320px', minWidth: '320px', maxWidth: '320px', pointerEvents: 'auto' }}
              >
                <Paper
                  elevation={8}
                  sx={{
                    ...SIDEBAR_PAPER_BASE_STYLE,
                    overflowY: 'auto',
                    '&::-webkit-scrollbar': {
                      display: 'none'
                    },
                    scrollbarWidth: 'none', // Firefox
                    msOverflowStyle: 'none' // IE and Edge
                  }}
                >
                  {/* 質問設定メニュー */}
                  <QuestionSettingsMenu
                    questions={currentQuestions}
                    selectedQuestionId={selectedQuestionId}
                    onQuestionUpdate={handleQuestionUpdate}
                    onQuestionDelete={handleQuestionDelete}
                    onQuestionDuplicate={handleQuestionDuplicate}
                    onQuestionSelect={handleQuestionSelect}
                    onQuestionReorder={handleQuestionReorder}
                    selectedElement={selectedElement}
                    selectedPage={selectedPage}
                    questionTypesData={questionTypesData}
                    headerImage={headerImage}
                    logoImage={logoImageState}
                    onHeaderImageChange={handleHeaderImageChange}
                    onLogoImageChange={handleLogoImageChange}
                    // 画像アップロード用ハンドラー
                    onHeaderImageFileUpload={handleHeaderImageFileUpload}
                    onLogoImageFileUpload={handleLogoImageFileUpload}
                    onLoginBackgroundImageFileUpload={handleLoginBackgroundImageFileUpload}
                    // 基本設定のハンドラーを追加
                    selectedColor={formSettings.theme_color}
                    onThemeColorChange={handleThemeColorUpdate}
                    onThemeColorPreview={handleThemeColorPreview}
                    // 専用テーブル更新ハンドラー
                    onChoiceOptionsUpdate={handleChoiceOptionsUpdate}
                    onLinearScaleOptionsUpdate={handleLinearScaleOptionsUpdate}
                    // ログイン画面設定
                    loginScreenSettings={loginScreenSettings}
                    onLoginTitleUpdate={handleLoginTitleUpdate}
                    onLoginDetailUpdate={handleLoginDetailUpdate}
                    // 完了画面設定
                    completionScreenSettings={completionScreenSettings}
                    onCompletionTitleUpdate={handleCompletionTitleUpdate}
                    onCompletionDetailUpdate={handleCompletionDetailUpdate}
                    onCompletionBackgroundUpdate={handleCompletionBackgroundUpdate}
                    onCompletionBackgroundImageFileUpload={handleCompletionBackgroundImageFileUpload}
                    onCompletionButton1EnabledUpdate={handleCompletionButton1EnabledUpdate}
                    onCompletionButton1TextUpdate={handleCompletionButton1TextUpdate}
                    onCompletionButton1UrlUpdate={handleCompletionButton1UrlUpdate}
                    // テキスト設定（後方互換性）
                    loginTitle={loginTitle}
                    setLoginTitle={setLoginTitle}
                    loginDetail={loginDetail}
                    setLoginDetail={setLoginDetail}
                    completionTitle={completionTitle}
                    setCompletionTitle={setCompletionTitle}
                    completionDetail={completionDetail}
                    setCompletionDetail={setCompletionDetail}
                    completionBackground={completionBackground}
                    setCompletionBackground={setCompletionBackground}
                    questionErrorHighlight={questionErrorHighlight}
                    loginErrorHighlight={loginErrorHighlight}
                    completionErrorHighlight={completionErrorHighlight}
                  />
                </Paper>
              </motion.div>
            )}


            {/* トースト通知とその他のコントロール */}
            <Stack
              spacing={2}
              sx={{ 
                position: 'absolute',
                bottom: 20,
                right: 20,
                zIndex: 15
              }}
            >

            </Stack>

          </Stack>

        </Box>

        {/* 削除確認ダイアログ */}
        <DeleteConfirmationDialog
          open={showDeleteConfirm}
          onClose={handleCancelDelete}
          onConfirm={handleExecuteDelete}
          pageToDelete={pageToDelete}
        />

        {/* 公開確認ダイアログ（HeaderBarと同じ機能） */}
        <Dialog
          open={showPublishDialog}
          onClose={handlePublishCancel}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: '20px',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.95) 100%)',
              backdropFilter: 'blur(24px)',
              border: '2px solid transparent',
              backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.95) 100%), ' +
                              (publishDialogErrors.length > 0 
                                ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%)'
                                : 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #ff6b6b 100%)'),
              backgroundOrigin: 'border-box',
              backgroundClip: 'content-box, border-box',
              boxShadow: publishDialogErrors.length > 0 
                ? '0 32px 80px rgba(239, 68, 68, 0.25)' 
                : '0 32px 80px rgba(102, 126, 234, 0.25)',
              overflow: 'hidden'
            }
          }}
          BackdropProps={{
            sx: {
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(12px)'
            }
          }}
        >
          <DialogContent sx={{ p: 0 }}>
            <Box
              sx={{
                textAlign: 'center',
                py: 6,
                px: 4,
                background: publishDialogErrors.length > 0 
                  ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(220, 38, 38, 0.08) 50%, rgba(185, 28, 28, 0.08) 100%)'
                  : 'linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 50%, rgba(255, 107, 107, 0.08) 100%)',
                color: '#374151',
                mb: 0,
                minHeight: 360,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: publishDialogErrors.length > 0 
                    ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.03) 0%, rgba(220, 38, 38, 0.03) 50%, rgba(185, 28, 28, 0.03) 100%)'
                    : 'linear-gradient(135deg, rgba(102, 126, 234, 0.03) 0%, rgba(118, 75, 162, 0.03) 50%, rgba(255, 107, 107, 0.03) 100%)',
                  zIndex: -1
                }
              }}
            >
              {/* メインコンテンツエリア */}
              <Box sx={{ 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center'
              }}>
                {/* ロケットアイコン - エラーチェック中は非表示 */}
                {!isErrorChecking && (
                  <Box
                    sx={{
                      width: 88,
                      height: 88,
                      borderRadius: '50%',
                      background: publishDialogErrors.length > 0
                        ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.15) 50%, rgba(185, 28, 28, 0.15) 100%)'
                        : 'linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 50%, rgba(255, 107, 107, 0.15) 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 32px auto',
                      fontSize: '2.8rem',
                      boxShadow: publishDialogErrors.length > 0
                        ? '0 12px 32px rgba(239, 68, 68, 0.2)'
                        : '0 12px 32px rgba(102, 126, 234, 0.2)',
                      animation: 'pulse 2s ease-in-out infinite',
                      '@keyframes pulse': {
                        '0%, 100%': { transform: 'scale(1)' },
                        '50%': { transform: 'scale(1.05)' }
                      }
                    }}
                  >
                    {publishDialogErrors.length > 0 ? '⚠️' : '🚀'}
                  </Box>
                )}
              
                {/* エラーチェック中以外の時のみタイトルと説明を表示 */}
                {!isErrorChecking && (
                  <>
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 700,
                        mb: 2,
                        fontSize: '1.8rem',
                        background: publishDialogErrors.length > 0
                          ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%)'
                          : 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #ff6b6b 100%)',
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        textShadow: 'none'
                      }}
                    >
                      {publishDialogErrors.length > 0 ? 'エラーの解決が必要です' : 'フォームを公開しますか？'}
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        color: '#6b7280',
                        fontSize: '1.1rem',
                        lineHeight: 1.6,
                        fontWeight: 500,
                        mb: publishDialogErrors.length > 0 ? 2 : 0
                      }}
                    >
                      {publishDialogErrors.length > 0 
                        ? `${publishDialogErrors.length}件のエラーがあります。\nエラーを解決してから公開してください。`
                        : '公開すると質問の追加や変更など\n編集できなくなります。\nよろしいですか？'
                      }
                    </Typography>
                  </>
                )}

                {/* エラーがある場合のエラーリスト表示 */}
                {!isErrorChecking && publishDialogErrors.length > 0 && (
                  <Box sx={{ mt: 3, width: '100%', maxWidth: 400 }}>
                    <Typography variant="h6" sx={{ 
                      fontWeight: 600, 
                      mb: 2, 
                      color: '#ef4444',
                      fontSize: '1rem'
                    }}>
                      エラー詳細:
                    </Typography>
                    {publishDialogErrors.slice(0, 5).map((error, index) => (
                      <Box
                        key={index}
                        sx={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 1.5,
                          mb: 1.5,
                          p: 2,
                          borderRadius: 2,
                          backgroundColor: 'rgba(239, 68, 68, 0.08)',
                          border: '1px solid rgba(239, 68, 68, 0.2)'
                        }}
                      >
                        <Box
                          sx={{
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            backgroundColor: '#ef4444',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            mt: 0.1
                          }}
                        >
                          <Typography sx={{ color: 'white', fontSize: '0.75rem', fontWeight: 'bold' }}>
                            !
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ 
                          color: '#991b1b', 
                          fontWeight: 500,
                          fontSize: '0.875rem',
                          lineHeight: 1.4
                        }}>
                          {error.message}
                        </Typography>
                      </Box>
                    ))}
                    {publishDialogErrors.length > 5 && (
                      <Typography variant="body2" sx={{ 
                        color: '#ef4444',
                        textAlign: 'center',
                        mt: 1,
                        fontStyle: 'italic'
                      }}>
                        他 {publishDialogErrors.length - 5} 件のエラーがあります
                      </Typography>
                    )}
                  </Box>
                )}
              
                {/* エラーチェック中のモダンなUI */}
                {isErrorChecking && (
                  <Box
                    sx={{
                      width: '100%',
                      maxWidth: 360,
                      height: 160,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto'
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 600,
                        mb: 3,
                        fontSize: '1.1rem',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        textAlign: 'center',
                        opacity: 0.9
                      }}
                    >
                      レビューフォーム チェック中...
                    </Typography>

                    {/* シンプルなチェック項目表示 */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: '100%', maxWidth: 280 }}>
                      {errorCheckItems.map((item, index) => (
                        <Box
                          key={item.id}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                            p: 1.5,
                            borderRadius: 2,
                            backgroundColor: item.status === 'completed' 
                              ? 'rgba(34, 197, 94, 0.1)' 
                              : 'rgba(0, 0, 0, 0.05)',
                            border: '1px solid',
                            borderColor: item.status === 'completed' 
                              ? 'rgba(34, 197, 94, 0.2)' 
                              : 'rgba(0, 0, 0, 0.1)',
                            transition: 'all 0.3s ease'
                          }}
                        >
                          <Box
                            sx={{
                              width: 20,
                              height: 20,
                              borderRadius: '50%',
                              backgroundColor: item.status === 'completed' ? '#22c55e' : '#e5e7eb',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.75rem'
                            }}
                          >
                            {item.status === 'completed' ? '✓' : ''}
                          </Box>
                          <Typography variant="body2" sx={{ color: '#374151', fontWeight: 500 }}>
                            {item.name}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>

              {/* ボタンエリア */}
              <Box
                sx={{
                  display: 'flex',
                  gap: 2,
                  justifyContent: 'center',
                  pt: 2
                }}
              >
                <Button
                  onClick={handlePublishCancel}
                  variant="outlined"
                  sx={{
                    minWidth: 120,
                    height: 52,
                    borderRadius: '26px',
                    borderColor: 'rgba(0, 0, 0, 0.2)',
                    color: '#64748b',
                    fontSize: '1rem',
                    fontWeight: 500,
                    textTransform: 'none',
                    '&:hover': {
                      borderColor: 'rgba(0, 0, 0, 0.3)',
                      backgroundColor: 'rgba(0, 0, 0, 0.05)'
                    }
                  }}
                >
                  キャンセル
                </Button>
                
                <Button
                  onClick={handlePublishConfirm}
                  variant="contained"
                  disabled={isErrorChecking || publishDialogErrors.length > 0}
                  sx={{
                    minWidth: 120,
                    height: 52,
                    borderRadius: '26px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    fontSize: '1rem',
                    fontWeight: 600,
                    textTransform: 'none',
                    boxShadow: '0 8px 24px rgba(102, 126, 234, 0.4)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5a67d8 0%, #6b46a3 100%)',
                      boxShadow: '0 12px 32px rgba(102, 126, 234, 0.5)',
                      transform: 'translateY(-2px)'
                    },
                    '&.Mui-disabled': {
                      background: 'linear-gradient(135deg, #94a3b8 0%, #8b909a 100%)',
                      color: 'white',
                      opacity: 0.7
                    }
                  }}
                >
                  {isErrorChecking ? 'チェック中...' : (publishDialogErrors.length > 0 ? 'エラーを解決' : '公開する')}
                </Button>
              </Box>
            </Box>
          </DialogContent>
        </Dialog>

      </Box>
    </Box>
  );
}
