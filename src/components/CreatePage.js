import React, { useState, useEffect } from 'react';
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
import { leftNavigationItems, questionTypes, questionTemplates, settingsCategories } from '../constants/createPageData';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import FormDataService from '../services/FormDataService';
import { createQuestionWithOptions, createTemplateQuestionWithOptions } from '../services/QuestionService';
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
  Input
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
  // カスタムフックから状態を取得
  const {
    selectedTool, setSelectedTool,
    previewMode, setPreviewMode,
    zoom, setZoom,
    expandedTemplates, setExpandedTemplates,
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
    projectTitle, setProjectTitle,
    isEditingTitle, setIsEditingTitle,
    showColorPicker, setShowColorPicker,
    selectedColor, setSelectedColor,
    isPublished, setIsPublished,
    projectDescription, setProjectDescription,
    selectedFont, setSelectedFont,
    logoPreview, setLogoPreview
  } = useCreatePageState();

  // 質問データ管理フック
  const {
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

  // テンプレート質問データ（Supabaseから取得）
  const [templateQuestionsData, setTemplateQuestionsData] = useState({
    categories: [],
    subcategories: [],
    templateQuestions: [],
    choices: [],
    scaleSettings: []
  });
  const [isLoadingTemplateQuestions, setIsLoadingTemplateQuestions] = useState(false);

  // ログイン画面設定の状態
  const [loginScreenSettings, setLoginScreenSettings] = useState({
    background_image_url: 'https://img.freepik.com/premium-photo/generative-ai-illustration-luxury-stores-decorated-different-colors-with-beautiful-interior-design_58460-12582.jpg',
    title_text: '',
    detail_text: ''
  });
  const [isLoadingLoginSettings, setIsLoadingLoginSettings] = useState(false);

  // 完了画面設定の状態
  const [completionScreenSettings, setCompletionScreenSettings] = useState({
    title_text: 'ありがとうございました！',
    detail_text: 'あなたの貴重なご意見をお聞かせいただき、ありがとうございました。いただいたフィードバックは今後のサービス向上に活用させていただきます。',
    background_image_url: 'https://misezukuri.com/wp-content/uploads/2023/10/b86e65d61ae3fbd3b3f1ec5c67484853.jpg',
    is_button_1_enabled: true,
    button_text_1: '完了',
    button_url_1: '#'
  });
  const [isLoadingCompletionSettings, setIsLoadingCompletionSettings] = useState(false);

  // テキスト設定の状態（後方互換性のため残す）
  const [loginTitle, setLoginTitle] = useState('');
  const [loginDetail, setLoginDetail] = useState('');
  const [completionTitle, setCompletionTitle] = useState('ありがとうございました！');
  const [completionDetail, setCompletionDetail] = useState('あなたの貴重なご意見をお聞かせいただき、ありがとうございました。いただいたフィードバックは今後のサービス向上に活用させていただきます。');
  const [completionBackground, setCompletionBackground] = useState('https://misezukuri.com/wp-content/uploads/2023/10/b86e65d61ae3fbd3b3f1ec5c67484853.jpg');

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

  // テンプレート質問を読み込み
  useEffect(() => {
    const loadTemplateQuestions = async () => {
      setIsLoadingTemplateQuestions(true);
      try {
        const result = await FormDataService.getTemplateQuestions();
        if (result.success) {
          setTemplateQuestionsData(result.data);
        } else {
          toast.error('テンプレート質問の読み込みに失敗しました');
        }
      } catch (error) {
        console.error('Template questions loading error:', error);
        toast.error('テンプレート質問の読み込み中にエラーが発生しました');
      } finally {
        setIsLoadingTemplateQuestions(false);
      }
    };

    loadTemplateQuestions();
  }, []);

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
          const result = await FormDataService.getReviewFormWithDetails(formId);
          if (result.success && result.data.completion_screen_settings && result.data.completion_screen_settings.length > 0) {
            const completionData = result.data.completion_screen_settings[0];
            setCompletionScreenSettings(completionData);
            // 後方互換性のため、completionTitle、completionDetail、completionBackgroundも更新
            setCompletionTitle(completionData.title_text || 'ありがとうございました！');
            setCompletionDetail(completionData.detail_text || 'あなたの貴重なご意見をお聞かせいただき、ありがとうございました。いただいたフィードバックは今後のサービス向上に活用させていただきます。');
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

  // 選択されたページが変更された時、質問データを読み込み
  useEffect(() => {
    if (selectedPage && selectedPage.type === 'question' && formId) {
      loadQuestionsForPage(selectedPage.id);
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

  // Supabaseから取得したテンプレート質問データを既存フォーマットに変換
  const convertedQuestionTemplates = templateQuestionsData.categories.map(category => {
    const categorySubcategories = templateQuestionsData.subcategories
      .filter(sub => sub.category_id === category.id)
      .map(subcategory => {
        const subcategoryQuestions = templateQuestionsData.templateQuestions
          .filter(q => q.question_subcategories_id === subcategory.id)
          .map(question => {
            // 選択肢データを取得
            const questionChoices = templateQuestionsData.choices
              .filter(choice => choice.template_review_questions_id === question.id)
              .sort((a, b) => a.choice_number - b.choice_number)
              .map(choice => choice.choice_name);

            // スケール設定を取得
            const scaleData = templateQuestionsData.scaleSettings
              .find(scale => scale.template_review_questions_id === question.id);

            return {
              id: question.id,
              question: question.question_text,
              type: questionTypesData.find(qt => qt.id === question.question_types_id)?.name || 'text',
              question_types_id: question.question_types_id,
              detail: question.is_detail_enabled ? question.question_detail_text : '',
              required: question.is_required,
              choices: questionChoices.length > 0 ? questionChoices : null,
              scale_settings: scaleData ? {
                minValue: 1,
                maxValue: 5,
                minLabel: scaleData.min_text,
                maxLabel: scaleData.max_text
              } : null,
              isTemplate: true
            };
          });

        return {
          id: subcategory.id,
          title: subcategory.japanese_name,
          expanded: false,
          templates: subcategoryQuestions
        };
      });

    return {
      id: category.id,
      title: category.japanese_name,
      expanded: false,
      categories: categorySubcategories
    };
  });

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

  // ページの質問数を更新する処理を追加
  useEffect(() => {
    if (selectedPage && selectedPage.type === 'question') {
      const currentQuestions = getQuestionsForPage(selectedPage.id);
      setPages(prev => prev.map(page => 
        page.id === selectedPage.id 
          ? { ...page, questions: currentQuestions.length }
          : page
      ));
    }
  }, [selectedPage, getQuestionsForPage, setPages]);

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
      const needsChoices = [3, 4, 8, 9, 10].includes(questionTypeId) || typeName.includes('選択') || typeName.includes('プルダウン');
      
      if (needsChoices) {
        // 通常の質問作成時は選択肢を1つ作成
        optimisticQuestion.choices = JSON.stringify(['選択肢1']);
      }

      if (questionTypeId === 7 || typeName.includes('スケール') || typeName.includes('リニア')) {
        optimisticQuestion.scale_settings = JSON.stringify({
          minValue: 1,
          maxValue: 5,
          minLabel: '',
          maxLabel: ''
        });
      }

      // テンプレート質問の場合は内容をコピー
      if (draggedData.isTemplate) {
        optimisticQuestion.question_types_id = draggedData.question_types_id || getQuestionTypeId(draggedData.type);
        optimisticQuestion.is_required = draggedData.required !== undefined ? draggedData.required : true;
        
        if (draggedData.detail) {
          optimisticQuestion.question_detail_text = draggedData.detail;
        }

        if (draggedData.choices && Array.isArray(draggedData.choices) && draggedData.choices.length > 0) {
          optimisticQuestion.choices = JSON.stringify(draggedData.choices);
        } else if (needsChoices) {
          // テンプレート質問でも選択肢が空の場合はデフォルト選択肢を作成
          optimisticQuestion.choices = JSON.stringify(['選択肢1']);
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
        if (draggedData.isTemplate) {
          supabaseQuestion = await createTemplateQuestionWithOptions({
            reviewFormId: formId,
            questionTypesId: questionTypeId,
            reviewFormPagesId: selectedPage.id,
            questionNumber: questionNumber,
            questionText: optimisticQuestion.question_text,
            questionCategoriesId: draggedData.question_categories_id || null,
            questionSubcategoriesId: draggedData.question_subcategories_id || null,
            templateReviewQuestionsId: draggedData.id || null
          });
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
        
        toast.success('質問を追加しました');
        
      } catch (error) {
        console.error('質問作成エラー:', error);
        // エラー時：楽観的更新を取り消し
        handleQuestionsUpdate(selectedPage.id, currentQuestions);
        toast.error('質問の追加に失敗しました');
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

  // テンプレート展開制御
  const toggleExpanded = (key) => {
    setExpandedTemplates(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
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
        toast.success('ページを削除しました');
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
          
          toast.success('ページを追加しました');
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

  // 質問更新ハンドラー（楽観的UI更新）
  const handleQuestionUpdate = async (questionId, updates) => {
    if (!selectedPage) return;
    
    // 即座にローカル状態を更新（楽観的更新）
    const currentQuestions = getQuestionsForPage(selectedPage.id);
    const optimisticQuestions = currentQuestions.map(q => 
      q.id === questionId ? { ...q, ...updates } : q
    );
    handleQuestionsUpdate(selectedPage.id, optimisticQuestions);
    
    // バックグラウンドでSupabaseに同期
    try {
      await updateQuestion(selectedPage.id, questionId, updates);
      // 成功時は何もしない（既にUIは更新済み）
    } catch (error) {
      console.error('Question update error:', error);
      // エラー時は元の状態に戻す
      handleQuestionsUpdate(selectedPage.id, currentQuestions);
      toast.error('質問の更新に失敗しました');
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

    // バックグラウンドで専用テーブルに保存
    try {
      await updateChoiceOptions(questionId, choices);
    } catch (error) {
      console.error('Choice options update error:', error);
      // エラー時は元の状態に戻す
      handleQuestionsUpdate(selectedPage.id, currentQuestions);
      toast.error('選択肢の更新に失敗しました');
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

    // バックグラウンドで専用テーブルに保存
    try {
      await updateLinearScaleOptions(questionId, scaleSettings);
    } catch (error) {
      console.error('Linear scale options update error:', error);
      // エラー時は元の状態に戻す
      handleQuestionsUpdate(selectedPage.id, currentQuestions);
      toast.error('均等目盛り設定の更新に失敗しました');
    }
  };

  // 質問削除ハンドラー（楽観的UI更新）
  const handleQuestionDelete = async (questionId) => {
    if (!selectedPage) return;
    
    // 即座にローカル状態を更新（楽観的削除）
    const currentQuestions = getQuestionsForPage(selectedPage.id);
    const optimisticQuestions = currentQuestions.filter(q => q.id !== questionId);
    handleQuestionsUpdate(selectedPage.id, optimisticQuestions);
    
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
    }
  };

  // 質問順序変更ハンドラー
  const handleQuestionReorder = (dragIndex, hoverIndex) => {
    if (!selectedPage) return;
    
    const currentQuestions = getQuestionsForPage(selectedPage.id);
    const draggedQuestion = currentQuestions[dragIndex];
    
    // 配列を複製して順序を変更
    const updatedQuestions = [...currentQuestions];
    updatedQuestions.splice(dragIndex, 1);
    updatedQuestions.splice(hoverIndex, 0, draggedQuestion);
    
    handleQuestionsUpdate(selectedPage.id, updatedQuestions);
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
  };

  // 基本設定更新ハンドラー（楽観的UI更新 + Supabase保存）
  const handleThemeColorUpdate = async (themeColor) => {
    console.log('handleThemeColorUpdate called with:', themeColor);
    console.log('formId:', formId);
    
    // 即座にローカル状態を更新
    setFormSettings(prev => ({ ...prev, theme_color: themeColor }));

    // バックグラウンドでSupabaseに保存
    try {
      console.log('Calling FormDataService.updateThemeColor...');
      const result = await FormDataService.updateThemeColor(formId, themeColor);
      console.log('FormDataService.updateThemeColor result:', result);
      if (!result.success) {
        throw new Error(result.error);
      }
      console.log('Theme color saved successfully');
      toast.success('テーマカラーを更新しました');
    } catch (error) {
      console.error('Theme color update error:', error);
      // エラー時は元の状態に戻す
      setFormSettings(prev => ({ ...prev, theme_color: formSettings.theme_color }));
      toast.error('テーマカラーの更新に失敗しました');
    }
  };

  const handleLogoImageUpdate = async (logoImageUrl) => {
    // 即座にローカル状態を更新
    setFormSettings(prev => ({ ...prev, logo_image_url: logoImageUrl }));
    setLogoImageState(logoImageUrl);

    // バックグラウンドでSupabaseに保存
    try {
      const result = await FormDataService.updateLogoImage(formId, logoImageUrl);
      if (!result.success) {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Logo image update error:', error);
      // エラー時は元の状態に戻す
      setFormSettings(prev => ({ ...prev, logo_image_url: formSettings.logo_image_url }));
      setLogoImageState(formSettings.logo_image_url);
      toast.error('ロゴ画像の更新に失敗しました');
    }
  };

  const handleHeaderImageUpdate = async (headerImageUrl) => {
    // 即座にローカル状態を更新
    setHeaderImage(headerImageUrl);

    // バックグラウンドでSupabaseに保存（question_screen_settingsテーブル）
    try {
      const result = await FormDataService.updateHeaderImage(formId, headerImageUrl);
      if (!result.success) {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Header image update error:', error);
      // エラー時は元の状態に戻す
      setHeaderImage(headerImage);
      toast.error('ヘッダー画像の更新に失敗しました');
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
      toast.success('ヘッダー画像をアップロードしました', { id: 'header-upload' });
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
      toast.success('ロゴ画像をアップロードしました', { id: 'logo-upload' });
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
      toast.success('ログイン背景画像をアップロードしました', { id: 'login-bg-upload' });
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
    }
  };

  // ログイン詳細テキスト更新ハンドラー
  const handleLoginDetailUpdate = async (detailText) => {
    // 即座にローカル状態を更新
    setLoginScreenSettings(prev => ({ ...prev, detail_text: detailText }));
    setLoginDetail(detailText);

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
    }
  };

  // 完了画面タイトルテキスト更新ハンドラー
  const handleCompletionTitleUpdate = async (titleText) => {
    // 即座にローカル状態を更新（楽観的更新）
    setCompletionScreenSettings(prev => ({ ...prev, title_text: titleText }));
    setCompletionTitle(titleText);

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
    }
  };

  // 完了画面詳細テキスト更新ハンドラー
  const handleCompletionDetailUpdate = async (detailText) => {
    // 即座にローカル状態を更新（楽観的更新）
    setCompletionScreenSettings(prev => ({ ...prev, detail_text: detailText }));
    setCompletionDetail(detailText);

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
    }
  };

  // 完了背景画像更新ハンドラー
  const handleCompletionBackgroundUpdate = async (backgroundImageUrl) => {
    // 即座にローカル状態を更新（楽観的更新）
    setCompletionScreenSettings(prev => ({ ...prev, background_image_url: backgroundImageUrl }));
    setCompletionBackground(backgroundImageUrl);

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
      toast.success('完了背景画像をアップロードしました', { id: 'completion-bg-upload' });
    } catch (error) {
      console.error('Completion background image file upload error:', error);
      toast.error(`完了背景画像のアップロードに失敗: ${error.message}`, { id: 'completion-bg-upload' });
    }
  };

  // 完了ボタン1有効/無効更新ハンドラー
  const handleCompletionButton1EnabledUpdate = async (isEnabled) => {
    // 即座にローカル状態を更新（楽観的更新）
    setCompletionScreenSettings(prev => ({ ...prev, is_button_1_enabled: isEnabled }));

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
    }
  };

  // 完了ボタン1テキスト更新ハンドラー
  const handleCompletionButton1TextUpdate = async (buttonText) => {
    // 即座にローカル状態を更新（楽観的更新）
    setCompletionScreenSettings(prev => ({ ...prev, button_text_1: buttonText }));

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
    }
  };

  // 完了ボタン1URL更新ハンドラー
  const handleCompletionButton1UrlUpdate = async (buttonUrl) => {
    // 即座にローカル状態を更新（楽観的更新）
    setCompletionScreenSettings(prev => ({ ...prev, button_url_1: buttonUrl }));

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
    }
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
        <HeaderBar
          isEditingTitle={isEditingTitle}
          projectTitle={projectTitle}
          setProjectTitle={setProjectTitle}
          setIsEditingTitle={setIsEditingTitle}
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
                  // テーマ設定のprops
                  selectedColor={selectedColor}
                  setSelectedColor={setSelectedColor}
                  selectedFont={selectedFont}
                  setSelectedFont={setSelectedFont}
                  logoImage={logoImage}
                  setLogoImage={setLogoImage}
                  
                  // プロジェクト設定のprops
                  projectTitle={projectTitle}
                  setProjectTitle={setProjectTitle}
                  
                  // 公開設定のprops
                  isPublished={isPublished}
                  setIsPublished={setIsPublished}
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
                    questions={selectedPage ? getQuestionsForPage(selectedPage.id) : []}
                    onQuestionAdd={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    isDragActive={isDragActive}
                    pages={pages}
                    selectedQuestionId={selectedQuestionId}
                    onQuestionSelect={handleQuestionSelect}
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
                  />
                  
                  {/* プレビューコントロール */}
                  <PreviewControlPanel
                    previewMode={previewMode}
                    setPreviewMode={setPreviewMode}
                    zoom={zoom}
                    handleZoomIn={handleZoomIn}
                    handleZoomOut={handleZoomOut}
                    handleFitScreen={handleFitScreen}
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
                                  ? 'linear-gradient(135deg, #4c1d95 0%, #5b21b6 100%)'
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
                    questionTemplates={convertedQuestionTemplates}
                    expandedTemplates={expandedTemplates}
                    toggleExpanded={toggleExpanded}
                    setSelectedTool={setSelectedTool}
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
                    questions={selectedPage ? getQuestionsForPage(selectedPage.id) : []}
                    selectedQuestionId={selectedQuestionId}
                    onQuestionUpdate={handleQuestionUpdate}
                    onQuestionDelete={handleQuestionDelete}
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

      </Box>
    </Box>
  );
}
