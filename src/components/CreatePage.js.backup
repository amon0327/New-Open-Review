import React, { useState } from 'react';
import PreviewControlPanel from './PreviewControlPanel';
import LeftNavigationBar from './LeftNavigationBar';
import HeaderBar from './HeaderBar';
import PreviewArea from './PreviewArea';
import QuestionToolsSidebar from './QuestionToolsSidebar';
import DeleteConfirmationDialog from './DeleteConfirmationDialog';
import { useCreatePageState } from '../hooks/useCreatePageState';
import { leftNavigationItems, questionTypes, questionTemplates, settingsCategories } from '../constants/createPageData';
import { motion, AnimatePresence } from 'framer-motion';
import { ChromePicker } from 'react-color';
import QRCode from 'react-qr-code';
import toast, { Toaster } from 'react-hot-toast';
import { 
  PaintBrushIcon, 
  FolderIcon, 
  GlobeAltIcon,
  PhotoIcon,
  SwatchIcon,
  DocumentTextIcon,
  EyeIcon,
  EyeSlashIcon,
  ClipboardDocumentIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Tooltip,
  Stack,
  Grid,
  Collapse,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Input,
  Switch,
  FormControlLabel,
  Divider,
  Avatar,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem
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

  // サンプルページデータ
  const [pages, setPages] = useState([
    { id: 'login', title: 'ログイン画面', type: 'system', icon: <Login />, canDelete: false, canEdit: false },
    { id: 'page1', title: '基本情報', type: 'question', icon: <Pages />, canDelete: true, canEdit: true, questions: 5 },
    { id: 'page2', title: '満足度調査', type: 'question', icon: <Pages />, canDelete: true, canEdit: true, questions: 3 },
    { id: 'page3', title: '追加質問', type: 'question', icon: <Pages />, canDelete: true, canEdit: true, questions: 2 },
    { id: 'completion', title: '完了画面', type: 'system', icon: <CheckCircle />, canDelete: false, canEdit: false }
  ]);

  // ズーム制御関数（5%刻み）
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.05, 2));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.05, 0.5));
  const handleFitScreen = () => setZoom(1);

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

  const handleDragOver = (e, targetPageId) => {
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

  const handleDrop = (e, targetPage) => {
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
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 10,
                    overflowY: 'auto',
                    p: 3,
                    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)'
                  }}
                >
                  <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
                    {/* ヘッダー */}
                    <motion.div
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                    >
                      <Box sx={{ mb: 4 }}>
                        <Typography variant="h3" sx={{ 
                          fontWeight: 600, 
                          color: '#1e293b', 
                          mb: 1,
                          letterSpacing: '-0.025em'
                        }}>
                          設定
                        </Typography>
                        <Typography variant="body1" sx={{ 
                          color: '#64748b', 
                          fontSize: '1.1rem'
                        }}>
                          フォームのテーマ、プロジェクト情報、公開設定
                        </Typography>
                      </Box>
                    </motion.div>

                    {/* 設定セクション - PC専用2カラムレイアウト */}
                    <Grid container spacing={4}>
                      {/* 左列: テーマ設定とプロジェクト設定 */}
                      <Grid item xs={12} lg={8}>
                        <Stack spacing={4}>
                          {/* テーマ設定 */}
                          <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4, delay: 0.1 }}
                          >
                            <Paper
                              elevation={0}
                              sx={{
                                p: 4,
                                borderRadius: 2,
                                backgroundColor: 'white',
                                border: '1px solid #e2e8f0',
                                '&:hover': {
                                  borderColor: '#cbd5e1',
                                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
                                },
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <Typography variant="h5" sx={{ 
                                fontWeight: 600, 
                                color: '#1e293b', 
                                mb: 1,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 2
                              }}>
                                <Palette sx={{ color: '#5e17eb', fontSize: '1.5rem' }} />
                                テーマ設定
                              </Typography>
                              <Typography variant="body2" sx={{ color: '#64748b', mb: 4 }}>
                                ブランドアイデンティティを設定
                              </Typography>

                              <Grid container spacing={4}>
                                {/* ロゴ画像設定 */}
                                <Grid item xs={12} md={4}>
                                  <Typography variant="body2" sx={{ fontWeight: 500, mb: 2, color: '#374151' }}>
                                    ロゴ画像
                                  </Typography>
                                  <Box
                                    sx={{
                                      p: 3,
                                      border: '2px dashed #cbd5e1',
                                      borderRadius: 1.5,
                                      textAlign: 'center',
                                      backgroundColor: '#f8fafc',
                                      cursor: 'pointer',
                                      minHeight: 120,
                                      display: 'flex',
                                      flexDirection: 'column',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      '&:hover': {
                                        borderColor: '#5e17eb',
                                        backgroundColor: 'rgba(94, 23, 235, 0.02)'
                                      },
                                      transition: 'all 0.2s ease'
                                    }}
                                  >
                                    {logoPreview ? (
                                      <Box>
                                        <img 
                                          src={logoPreview} 
                                          alt="Logo Preview" 
                                          style={{ maxWidth: 80, maxHeight: 50, objectFit: 'contain' }}
                                        />
                                        <Typography variant="caption" sx={{ color: '#6b7280', mt: 1, display: 'block' }}>
                                          クリックして変更
                                        </Typography>
                                      </Box>
                                    ) : (
                                      <Box>
                                        <PhotoIcon style={{ width: 32, height: 32, color: '#9ca3af' }} />
                                        <Typography variant="body2" sx={{ color: '#6b7280', mt: 1, fontWeight: 500 }}>
                                          画像をアップロード
                                        </Typography>
                                      </Box>
                                    )}
                                  </Box>
                                </Grid>

                                {/* テーマカラー設定 */}
                                <Grid item xs={12} md={4}>
                                  <Typography variant="body2" sx={{ fontWeight: 500, mb: 2, color: '#374151' }}>
                                    テーマカラー
                                  </Typography>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                    <Box
                                      onClick={() => setShowColorPicker(!showColorPicker)}
                                      sx={{
                                        width: 48,
                                        height: 48,
                                        borderRadius: 1.5,
                                        backgroundColor: selectedColor,
                                        border: '3px solid white',
                                        cursor: 'pointer',
                                        boxShadow: '0 0 0 1px #e2e8f0, 0 2px 8px rgba(0, 0, 0, 0.1)',
                                        '&:hover': {
                                          transform: 'scale(1.05)',
                                          boxShadow: '0 0 0 2px #5e17eb, 0 4px 12px rgba(0, 0, 0, 0.15)'
                                        },
                                        transition: 'all 0.2s ease'
                                      }}
                                    />
                                    <Box>
                                      <Typography variant="body2" sx={{ fontWeight: 500, color: '#374151' }}>
                                        {selectedColor}
                                      </Typography>
                                      <Typography variant="caption" sx={{ color: '#64748b' }}>
                                        クリックして変更
                                      </Typography>
                                    </Box>
                                  </Box>
                                  
                                  {showColorPicker && (
                                    <Box sx={{ mt: 2, position: 'relative', zIndex: 10 }}>
                                      <Paper
                                        elevation={12}
                                        sx={{ p: 2, borderRadius: 2, display: 'inline-block' }}
                                      >
                                        <ChromePicker
                                          color={selectedColor}
                                          onChange={(color) => setSelectedColor(color.hex)}
                                        />
                                      </Paper>
                                    </Box>
                                  )}
                                </Grid>

                                {/* フォント設定 */}
                                <Grid item xs={12} md={4}>
                                  <Typography variant="body2" sx={{ fontWeight: 500, mb: 2, color: '#374151' }}>
                                    フォント
                                  </Typography>
                                  <FormControl fullWidth>
                                    <Select
                                      value={selectedFont}
                                      onChange={(e) => setSelectedFont(e.target.value)}
                                      sx={{
                                        backgroundColor: '#f8fafc',
                                        '& .MuiOutlinedInput-root': {
                                          '& fieldset': {
                                            borderColor: '#e2e8f0'
                                          },
                                          '&:hover fieldset': {
                                            borderColor: '#cbd5e1'
                                          },
                                          '&.Mui-focused fieldset': {
                                            borderColor: '#5e17eb'
                                          }
                                        }
                                      }}
                                    >
                                      <MenuItem value="Noto Sans JP">Noto Sans JP</MenuItem>
                                      <MenuItem value="Roboto">Roboto</MenuItem>
                                      <MenuItem value="Inter">Inter</MenuItem>
                                      <MenuItem value="Hiragino Sans">Hiragino Sans</MenuItem>
                                    </Select>
                                  </FormControl>
                                </Grid>
                              </Grid>
                            </Paper>
                          </motion.div>

                          {/* プロジェクト設定 */}
                          <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4, delay: 0.2 }}
                          >
                            <Paper
                              elevation={0}
                              sx={{
                                p: 4,
                                borderRadius: 2,
                                backgroundColor: 'white',
                                border: '1px solid #e2e8f0',
                                '&:hover': {
                                  borderColor: '#cbd5e1',
                                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
                                },
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <Typography variant="h5" sx={{ 
                                fontWeight: 600, 
                                color: '#1e293b', 
                                mb: 1,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 2
                              }}>
                                <DocumentTextIcon style={{ color: '#059669', width: 24, height: 24 }} />
                                プロジェクト設定
                              </Typography>
                              <Typography variant="body2" sx={{ color: '#64748b', mb: 4 }}>
                                プロジェクトの基本情報
                              </Typography>

                              <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                  <Typography variant="body2" sx={{ fontWeight: 500, mb: 2, color: '#374151' }}>
                                    プロジェクト名
                                  </Typography>
                                  <TextField
                                    fullWidth
                                    value={projectTitle}
                                    onChange={(e) => setProjectTitle(e.target.value)}
                                    placeholder="マイフォームプロジェクト"
                                    sx={{
                                      backgroundColor: '#f8fafc',
                                      '& .MuiOutlinedInput-root': {
                                        '& fieldset': {
                                          borderColor: '#e2e8f0'
                                        },
                                        '&:hover fieldset': {
                                          borderColor: '#cbd5e1'
                                        },
                                        '&.Mui-focused fieldset': {
                                          borderColor: '#5e17eb'
                                        }
                                      }
                                    }}
                                  />
                                </Grid>

                                <Grid item xs={12} md={6}>
                                  <Typography variant="body2" sx={{ fontWeight: 500, mb: 2, color: '#374151' }}>
                                    プロジェクトの説明
                                  </Typography>
                                  <TextField
                                    fullWidth
                                    multiline
                                    rows={3}
                                    value={projectDescription}
                                    onChange={(e) => setProjectDescription(e.target.value)}
                                    placeholder="フォームの概要や用途を記載..."
                                    sx={{
                                      backgroundColor: '#f8fafc',
                                      '& .MuiOutlinedInput-root': {
                                        '& fieldset': {
                                          borderColor: '#e2e8f0'
                                        },
                                        '&:hover fieldset': {
                                          borderColor: '#cbd5e1'
                                        },
                                        '&.Mui-focused fieldset': {
                                          borderColor: '#5e17eb'
                                        }
                                      }
                                    }}
                                  />
                                </Grid>
                              </Grid>
                            </Paper>
                          </motion.div>
                        </Stack>
                      </Grid>

                      {/* 公開設定 */}
                      <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                      >
                        <Paper
                          elevation={4}
                          sx={{
                            p: 4,
                            borderRadius: 3,
                            border: '1px solid rgba(94, 23, 235, 0.1)',
                            '&:hover': {
                              boxShadow: '0 8px 30px rgba(94, 23, 235, 0.15)',
                              transform: 'translateY(-2px)'
                            },
                            transition: 'all 0.3s ease'
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                            <Box
                              sx={{
                                width: 48,
                                height: 48,
                                borderRadius: 2,
                                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mr: 2,
                                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                              }}
                            >
                              <Public sx={{ color: 'white', fontSize: '1.5rem' }} />
                            </Box>
                            <Box>
                              <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a202c' }}>
                                公開設定
                              </Typography>
                              <Typography variant="body2" sx={{ color: '#6b7280' }}>
                                フォームの公開状態を管理
                              </Typography>
                            </Box>
                          </Box>

                          <Grid container spacing={3}>
                            <Grid item xs={12}>
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box>
                                  <Typography variant="body2" sx={{ fontWeight: 500, color: '#374151' }}>
                                    フォームを公開する
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: '#6b7280' }}>
                                    オンにするとフォームが一般公開されます
                                  </Typography>
                                </Box>
                                <Switch
                                  checked={isPublished}
                                  onChange={(e) => setIsPublished(e.target.checked)}
                                  sx={{
                                    '& .MuiSwitch-switchBase.Mui-checked': {
                                      color: '#5e17eb'
                                    },
                                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                      backgroundColor: '#5e17eb'
                                    }
                                  }}
                                />
                              </Box>
                            </Grid>

                            {isPublished && (
                              <>
                                <Grid item xs={12}>
                                  <Typography variant="body2" sx={{ fontWeight: 500, mb: 2, color: '#374151' }}>
                                    公開URL
                                  </Typography>
                                  <Box sx={{ display: 'flex', gap: 1 }}>
                                    <TextField
                                      fullWidth
                                      value={`https://forms.openreview.app/${projectTitle.toLowerCase().replace(/\s+/g, '-')}`}
                                      InputProps={{
                                        readOnly: true,
                                        endAdornment: (
                                          <IconButton
                                            onClick={() => {
                                              navigator.clipboard.writeText(`https://forms.openreview.app/${projectTitle.toLowerCase().replace(/\s+/g, '-')}`);
                                              toast.success('URLをコピーしました');
                                            }}
                                            sx={{ color: '#5e17eb' }}
                                          >
                                            <ContentCopy />
                                          </IconButton>
                                        )
                                      }}
                                      sx={{
                                        '& .MuiOutlinedInput-root': {
                                          backgroundColor: '#f8fafc'
                                        }
                                      }}
                                    />
                                  </Box>
                                </Grid>

                                <Grid item xs={12} md={6}>
                                  <Typography variant="body2" sx={{ fontWeight: 500, mb: 2, color: '#374151' }}>
                                    QRコード
                                  </Typography>
                                  <Paper
                                    elevation={2}
                                    sx={{
                                      p: 3,
                                      textAlign: 'center',
                                      backgroundColor: '#f8fafc',
                                      borderRadius: 2
                                    }}
                                  >
                                    <QRCode
                                      value={`https://forms.openreview.app/${projectTitle.toLowerCase().replace(/\s+/g, '-')}`}
                                      size={120}
                                      level="M"
                                    />
                                    <Typography variant="caption" sx={{ display: 'block', mt: 1, color: '#6b7280' }}>
                                      スマートフォンでスキャン
                                    </Typography>
                                  </Paper>
                                </Grid>

                                <Grid item xs={12} md={6}>
                                  <Typography variant="body2" sx={{ fontWeight: 500, mb: 2, color: '#374151' }}>
                                    公開状態
                                  </Typography>
                                  <Box
                                    sx={{
                                      p: 3,
                                      borderRadius: 2,
                                      backgroundColor: 'rgba(34, 197, 94, 0.1)',
                                      border: '1px solid rgba(34, 197, 94, 0.2)'
                                    }}
                                  >
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                      <CheckCircle sx={{ color: '#16a34a', fontSize: '1.2rem' }} />
                                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#16a34a' }}>
                                        公開中
                                      </Typography>
                                    </Box>
                                    <Typography variant="caption" sx={{ color: '#15803d' }}>
                                      フォームにアクセス可能です
                                    </Typography>
                                  </Box>
                                </Grid>
                              </>
                            )}
                          </Grid>
                        </Paper>
                      </motion.div>
                    </Grid>
                </Grid>
                  </Box>
                </Box>
              ) : (
                /* 中央プレビューエリア - 設定画面でない場合 */
                <>

                  {/* メインプレビューエリア */}
                  <PreviewArea
                    previewMode={previewMode}
                    zoom={zoom}
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
              zIndex: 1,
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
                            onDragOver={(e) => handleDragOver(e, page.id)}
                            onDrop={(e) => handleDrop(e, page)}
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
                                : 'rgba(255, 255, 255, 0.8)',
                              border: dropIndicator === page.id 
                                ? '2px dashed #5e17eb'
                                : sortingAnimation?.id === page.id && sortingAnimation.direction === 'success'
                                ? '1px solid rgba(34, 197, 94, 0.3)'
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
                                  : 'rgba(94, 23, 235, 0.04)',
                                borderColor: deleteMode && page.canDelete
                                  ? 'rgba(239, 68, 68, 0.3)'
                                  : 'rgba(94, 23, 235, 0.15)',
                                transform: draggedPage?.id === page.id ? 'none' : 'translateY(-1px)',
                                boxShadow: '0 3px 12px rgba(0, 0, 0, 0.1)'
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
                                background: page.type === 'system' 
                                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                                  : 'linear-gradient(135deg, #5e17eb 0%, #764ba2 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                boxShadow: '0 2px 8px rgba(94, 23, 235, 0.3)'
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
                                    color: '#2d3748',
                                    fontSize: '0.8rem',
                                    mb: 0.3,
                                    cursor: page.type === 'question' && !deleteMode ? 'text' : 'default',
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

            {/* 右側Container - フォーム設定 - 設定画面では非表示 */}
            {!showSettings && (
              <motion.div
                {...SLIDE_IN_RIGHT_ANIMATION}
                style={{ flex: '0 0 300px', pointerEvents: 'auto' }}
              >
              <Paper
                elevation={8}
                sx={SIDEBAR_PAPER_BASE_STYLE}
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    background: 'linear-gradient(45deg, #fcb69f 30%, #ffecd2 90%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    mb: 2,
                    textAlign: 'center'
                  }}
                >
                  フォーム設定
                </Typography>
                
                <Box sx={{ 
                  flex: 1, 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 2 
                }}>
                  <Box
                    sx={createIconContainerStyle(
                      60,
                      'linear-gradient(135deg, #fcb69f 0%, #ffecd2 100%)',
                      'rgba(252, 182, 159, 0.3)',
                      2
                    )}
                  >
                    <Settings sx={{ color: 'white', fontSize: '1.5rem' }} />
                  </Box>
                  <Typography variant="body2" color="text.secondary" textAlign="center">
                    フォームの設定や<br />
                    プレビューが<br />
                    ここに表示されます
                  </Typography>
                </Box>
              </Paper>
            </motion.div>
            )}

            {/* プレビューエリア - 設定画面では非表示 */}
            {!showSettings && (
              <PreviewArea previewMode={previewMode} zoom={zoom} />
            )}

            {/* プレビューコントロール - 設定画面では非表示 */}
            {!showSettings && (
              <PreviewControlPanel
                previewMode={previewMode}
                setPreviewMode={setPreviewMode}
                zoom={zoom}
                handleZoomIn={handleZoomIn}
                handleZoomOut={handleZoomOut}
                handleFitScreen={handleFitScreen}
              />
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
