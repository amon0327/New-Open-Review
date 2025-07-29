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
import { useCreatePageState } from '../hooks/useCreatePageState';
import useQuestionData from '../hooks/useQuestionData';
import { leftNavigationItems, questionTypes, questionTemplates, settingsCategories } from '../constants/createPageData';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
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
    forms: '#22c55e, #16a34a',
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

export default function CreatePage({ onBackClick }) {
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
    addQuestion,
    updateQuestion,
    deleteQuestion,
    duplicateQuestion,
    getQuestionCountForPage
  } = useQuestionData();

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

  // 質問タイプの文字列を数値IDにマッピング
  const getQuestionTypeId = (typeString) => {
    const typeMapping = {
      'text': 1,        // 短文テキスト
      'textarea': 2,    // 長文テキスト
      'radio': 3,       // 単一選択
      'checkbox': 4,    // 複数選択
      'matrix-single': 5, // 単一選択マトリックス
      'matrix-multiple': 6, // 複数選択マトリックス
      'scale': 7,       // リニアスケール
      'select': 8       // プルダウン
    };
    return typeMapping[typeString] || 1; // デフォルトは短文テキスト
  };

  // サンプルページデータ
  const [pages, setPages] = useState([
    { id: 'login', title: 'ログイン画面', type: 'system', icon: <Login />, canDelete: false, canEdit: false },
    { id: 'page1', title: '基本情報', type: 'question', icon: <Pages />, canDelete: true, canEdit: true, questions: 0 },
    { id: 'page2', title: '満足度調査', type: 'question', icon: <Pages />, canDelete: true, canEdit: true, questions: 0 },
    { id: 'page3', title: '追加質問', type: 'question', icon: <Pages />, canDelete: true, canEdit: true, questions: 0 },
    { id: 'completion', title: '完了画面', type: 'system', icon: <CheckCircle />, canDelete: false, canEdit: false }
  ]);

  // 初期化時に最初の質問ページを選択
  useEffect(() => {
    if (!selectedPage) {
      const firstQuestionPage = pages.find(page => page.type === 'question');
      if (firstQuestionPage) {
        setSelectedPage(firstQuestionPage);
      }
    }
  }, [pages, selectedPage, setSelectedPage]);

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

  // ドラッグ&ドロップハンドラ
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDrop = (e) => {
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
      
      let newQuestion = {
        id: Date.now() + Math.random(),
        question_types_id: questionTypeId,
        question_text: draggedData.question || draggedData.question_text || draggedData.label || '新しい質問',
        detail_text: draggedData.detail || draggedData.detail_text || '',
        is_required: draggedData.required || false,
        choices: null,
        scale_settings: null
      };

      // 質問タイプに応じてデフォルト設定を追加
      const needsChoices = [3, 4, 8].includes(questionTypeId);
      if (needsChoices) {
        newQuestion.choices = JSON.stringify(['選択肢 1', '選択肢 2']);
      }

      if (questionTypeId === 7) {
        newQuestion.scale_settings = JSON.stringify({
          minValue: 1,
          maxValue: 5,
          minLabel: 'そう思わない',
          maxLabel: 'そう思う'
        });
      }

      // テンプレート質問の場合は内容をコピー
      if (draggedData.isTemplate) {
        // テンプレートの質問タイプを適用
        newQuestion.question_types_id = getQuestionTypeId(draggedData.type);
        
        if (draggedData.choices) {
          newQuestion.choices = JSON.stringify(draggedData.choices);
        }
        // テンプレート質問の詳細設定があれば適用
        if (draggedData.detail) {
          newQuestion.detail_text = draggedData.detail;
        }
        
        // テンプレート質問タイプに応じた設定を再適用
        const templateTypeId = getQuestionTypeId(draggedData.type);
        if (templateTypeId === 7 && !newQuestion.scale_settings) {
          newQuestion.scale_settings = JSON.stringify({
            minValue: 1,
            maxValue: 5,
            minLabel: 'そう思わない',
            maxLabel: 'そう思う'
          });
        }
      }

      // 常に質問リストの最後に追加（挿入位置は指定しない）
      const currentQuestions = getQuestionsForPage(selectedPage.id);
      const updatedQuestions = [...currentQuestions, newQuestion];
      
      handleQuestionsUpdate(selectedPage.id, updatedQuestions);
      toast.success('質問を追加しました');
      
    } catch (error) {
      console.error('ドロップエラー:', error);
      toast.error('質問の追加に失敗しました');
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

  // ページ管理ハンドラ
  const handleDeletePage = (pageId) => {
    setPages(prev => prev.filter(page => page.id !== pageId));
  };

  const handleAddPage = () => {
    const newPage = {
      id: `page${pages.filter(p => p.type === 'question').length + 1}`,
      title: `新しいページ${pages.filter(p => p.type === 'question').length + 1}`,
      type: 'question',
      icon: <Pages />,
      canDelete: true,
      canEdit: true,
      questions: 0
    };
    // 完了画面の前に挿入
    const completionIndex = pages.findIndex(p => p.id === 'completion');
    const newPages = [...pages];
    newPages.splice(completionIndex, 0, newPage);
    setPages(newPages);
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

  const handleExecuteDelete = () => {
    if (pageToDelete) {
      setPages(prev => prev.filter(p => p.id !== pageToDelete.id));
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
    setEditingPageId(page.id);
    setEditingTitle(page.title);
  };

  const handleSaveEdit = () => {
    if (editingPageId && editingTitle.trim()) {
      setPages(prev => prev.map(page => 
        page.id === editingPageId 
          ? { ...page, title: editingTitle.trim() }
          : page
      ));
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
    setSelectedQuestionId(questionId);
    setSelectedElement(null); // 基本設定要素の選択を解除
  };

  // 質問更新ハンドラー
  const handleQuestionUpdate = (questionId, updates) => {
    if (!selectedPage) return;
    
    const currentQuestions = getQuestionsForPage(selectedPage.id);
    const updatedQuestions = currentQuestions.map(q => 
      q.id === questionId ? { ...q, ...updates } : q
    );
    
    handleQuestionsUpdate(selectedPage.id, updatedQuestions);
  };

  // 質問削除ハンドラー
  const handleQuestionDelete = (questionId) => {
    if (!selectedPage) return;
    
    const currentQuestions = getQuestionsForPage(selectedPage.id);
    const updatedQuestions = currentQuestions.filter(q => q.id !== questionId);
    
    handleQuestionsUpdate(selectedPage.id, updatedQuestions);
    
    // 削除された質問が選択されていた場合、選択を解除
    if (selectedQuestionId === questionId) {
      setSelectedQuestionId(null);
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
    setHeaderImage(imageData);
  };

  const handleLogoImageChange = (imageData) => {
    setLogoImageState(imageData);
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
              onClick={() => {
                // プレビュー画面外側をクリックした時に要素選択を解除
                setSelectedElement(null);
                setSelectedQuestionId(null);
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
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'radial-gradient(circle at 20% 20%, rgba(94, 23, 235, 0.05) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(118, 75, 162, 0.05) 0%, transparent 50%)',
                  zIndex: 0
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
                style={{ flex: '0 0 300px', pointerEvents: 'auto' }}
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
                          sx={{
                            color: '#5e17eb',
                            backgroundColor: 'rgba(94, 23, 235, 0.1)',
                            '&:hover': { 
                              backgroundColor: 'rgba(94, 23, 235, 0.2)',
                              transform: 'scale(1.05)'
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
                            <Box sx={{ flex: 1, minWidth: 0, ml: 2 }}>
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
                                  onClick={() => {
                                    if (!deleteMode) {
                                      handleStartEditing(page);
                                    }
                                  }}
                                  sx={{
                                    fontWeight: 600,
                                    color: selectedPage?.id === page.id ? '#5e17eb' : '#2d3748',
                                    fontSize: '0.8rem',
                                    mb: 0.3,
                                    cursor: page.type === 'question' && !deleteMode ? 'text' : 'default',
                                    transition: 'color 0.2s ease',
                                    '&:hover': page.type === 'question' && !deleteMode ? {
                                      textDecoration: 'underline',
                                      color: '#5e17eb'
                                    } : {}
                                  }}
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
                    questionTypes={questionTypes}
                    questionTemplates={questionTemplates}
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
                style={{ flex: '0 0 320px', pointerEvents: 'auto' }}
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
                    headerImage={headerImage}
                    logoImage={logoImageState}
                    onHeaderImageChange={handleHeaderImageChange}
                    onLogoImageChange={handleLogoImageChange}
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

        {/* トースト通知 */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              style: {
                background: '#22c55e',
              },
            },
            error: {
              style: {
                background: '#ef4444',
              },
            },
          }}
        />
      </Box>
    </Box>
  );
}
