import React, { useState } from 'react';
import { motion } from 'framer-motion';
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
  Button
} from '@mui/material';
import {
  ArrowBack,
  Save,
  Preview,
  MoreVert,
  Add,
  TextFields,
  RadioButtonChecked,
  CheckBox,
  LinearScale,
  ExpandMore,
  Image,
  Description,
  Settings,
  Palette,
  PhoneAndroid,
  Computer,
  ZoomIn,
  ZoomOut,
  FitScreen,
  Folder,
  Edit,
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
  KeyboardArrowDown
} from '@mui/icons-material';

// 左ナビゲーションアイテムの定義
const leftNavigationItems = [
  { icon: null, label: 'OpenReview', category: 'main', isLogo: true },
  { icon: <Folder />, label: 'フォルダー', category: 'main' },
  { icon: <Edit />, label: '編集', category: 'main' },
  { icon: <Settings />, label: '設定', category: 'main' }
];

// 質問タイプの定義
const questionTypes = [
  { icon: <TextFields />, label: '短文回答', type: 'text' },
  { icon: <Description />, label: '長文回答', type: 'textarea' },
  { icon: <RadioButtonChecked />, label: '単一選択', type: 'radio' },
  { icon: <CheckBox />, label: '複数選択', type: 'checkbox' },
  { icon: <ExpandMore />, label: 'プルダウン', type: 'select' },
  { icon: <LinearScale />, label: '線形スケール', type: 'scale' },
  { icon: <Image />, label: '画像アップロード', type: 'image' }
];

// テンプレート質問の定義
const questionTemplates = [
  {
    id: 'business',
    title: 'ビジネス',
    expanded: false,
    categories: [
      {
        id: 'customer-satisfaction',
        title: '顧客満足度',
        expanded: false,
        templates: [
          { id: 'cs1', question: 'サービスの満足度を教えてください', type: 'scale' },
          { id: 'cs2', question: '改善点があれば教えてください', type: 'textarea' },
          { id: 'cs3', question: 'おすすめ度はいかがですか？', type: 'scale' },
          { id: 'cs4', question: '今後も利用したいですか？', type: 'radio' },
          { id: 'cs5', question: '他の人におすすめしますか？', type: 'scale' }
        ]
      },
      {
        id: 'employee-evaluation',
        title: '従業員評価',
        expanded: false,
        templates: [
          { id: 'emp1', question: '職場環境の満足度', type: 'scale' },
          { id: 'emp2', question: '上司とのコミュニケーション', type: 'radio' },
          { id: 'emp3', question: '改善してほしい点', type: 'textarea' },
          { id: 'emp4', question: '研修の有効性はいかがですか？', type: 'scale' },
          { id: 'emp5', question: '働きがいを感じますか？', type: 'radio' }
        ]
      }
    ]
  },
  {
    id: 'personal',
    title: '個人情報',
    expanded: false,
    categories: [
      {
        id: 'basic-info',
        title: '基本情報',
        expanded: false,
        templates: [
          { id: 'p1', question: 'お名前を教えてください', type: 'text' },
          { id: 'p2', question: '年齢を選択してください', type: 'select' },
          { id: 'p3', question: '性別を選択してください', type: 'radio' }
        ]
      },
      {
        id: 'contact-info',
        title: '連絡先情報',
        expanded: false,
        templates: [
          { id: 'p4', question: 'メールアドレス', type: 'text' },
          { id: 'p5', question: '電話番号', type: 'text' },
          { id: 'p6', question: '住所', type: 'textarea' }
        ]
      }
    ]
  },
  {
    id: 'education',
    title: '教育・研修',
    expanded: false,
    categories: [
      {
        id: 'course-evaluation',
        title: '講座評価',
        expanded: false,
        templates: [
          { id: 'edu1', question: '講座の理解度はいかがでしたか？', type: 'scale' },
          { id: 'edu2', question: '講師の説明は分かりやすかったですか？', type: 'radio' },
          { id: 'edu3', question: '今後学びたい内容', type: 'checkbox' },
          { id: 'edu4', question: '講座の難易度はいかがでしたか？', type: 'scale' },
          { id: 'edu5', question: '資料の分かりやすさ', type: 'scale' }
        ]
      }
    ]
  },
  {
    id: 'events',
    title: 'イベント',
    expanded: false,
    categories: [
      {
        id: 'event-feedback',
        title: 'イベントフィードバック',
        expanded: false,
        templates: [
          { id: 'evt1', question: 'イベントの満足度', type: 'scale' },
          { id: 'evt2', question: '最も良かったセッション', type: 'checkbox' },
          { id: 'evt3', question: '改善提案があれば教えてください', type: 'textarea' },
          { id: 'evt4', question: '来年も参加したいですか？', type: 'radio' },
          { id: 'evt5', question: '会場の環境はいかがでしたか？', type: 'scale' }
        ]
      }
    ]
  },
  {
    id: 'products',
    title: '製品・サービス',
    expanded: false,
    categories: [
      {
        id: 'product-feedback',
        title: '製品フィードバック',
        expanded: false,
        templates: [
          { id: 'prd1', question: '製品の使いやすさ', type: 'scale' },
          { id: 'prd2', question: '機能で最も重要なもの', type: 'checkbox' },
          { id: 'prd3', question: 'バグや問題を経験しましたか？', type: 'radio' },
          { id: 'prd4', question: '追加してほしい機能', type: 'textarea' },
          { id: 'prd5', question: '価格に対する満足度', type: 'scale' }
        ]
      }
    ]
  }
];

export default function CreatePage({ onBackClick }) {
  const [selectedTool, setSelectedTool] = useState(null);
  const [previewMode, setPreviewMode] = useState('mobile'); // 'mobile' or 'desktop'
  const [zoom, setZoom] = useState(1); // ズーム倍率
  const [expandedTemplates, setExpandedTemplates] = useState({}); // テンプレートの展開状態
  const [showPageManager, setShowPageManager] = useState(false); // ページ管理UI表示状態
  const [draggedPage, setDraggedPage] = useState(null); // ドラッグ中のページ
  const [deleteMode, setDeleteMode] = useState(false); // 削除モード
  const [selectedForDeletion, setSelectedForDeletion] = useState([]); // 削除対象選択
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false); // 削除確認ダイアログ
  
  // サンプルページデータ
  const [pages, setPages] = useState([
    { id: 'login', title: 'ログイン画面', type: 'system', icon: <Login />, canDelete: false },
    { id: 'page1', title: '基本情報', type: 'question', icon: <Pages />, canDelete: true, questions: 5 },
    { id: 'page2', title: '満足度調査', type: 'question', icon: <Pages />, canDelete: true, questions: 3 },
    { id: 'page3', title: '追加質問', type: 'question', icon: <Pages />, canDelete: true, questions: 2 },
    { id: 'completion', title: '完了画面', type: 'system', icon: <CheckCircle />, canDelete: false }
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
      questions: 0
    };
    // 完了画面の前に挿入
    const completionIndex = pages.findIndex(p => p.id === 'completion');
    const newPages = [...pages];
    newPages.splice(completionIndex, 0, newPage);
    setPages(newPages);
  };

  const handleMovePageUp = (pageId) => {
    const pageIndex = pages.findIndex(p => p.id === pageId);
    if (pageIndex > 1) { // ログイン画面より後ろの場合のみ
      const newPages = [...pages];
      [newPages[pageIndex], newPages[pageIndex - 1]] = [newPages[pageIndex - 1], newPages[pageIndex]];
      setPages(newPages);
    }
  };

  const handleMovePageDown = (pageId) => {
    const pageIndex = pages.findIndex(p => p.id === pageId);
    if (pageIndex < pages.length - 2) { // 完了画面より前の場合のみ
      const newPages = [...pages];
      [newPages[pageIndex], newPages[pageIndex + 1]] = [newPages[pageIndex + 1], newPages[pageIndex]];
      setPages(newPages);
    }
  };

  // ドラッグ&ドロップハンドラ
  const handleDragStart = (e, page) => {
    if (page.type === 'system') return; // システムページはドラッグ不可
    setDraggedPage(page);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', '');
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetPage) => {
    e.preventDefault();
    if (!draggedPage || draggedPage.id === targetPage.id || targetPage.type === 'system') return;

    const draggedIndex = pages.findIndex(p => p.id === draggedPage.id);
    const targetIndex = pages.findIndex(p => p.id === targetPage.id);
    
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
  };

  // 削除モード関連ハンドラ
  const handleDeleteModeToggle = () => {
    setDeleteMode(!deleteMode);
    setSelectedForDeletion([]);
  };

  const handlePageSelection = (pageId) => {
    if (!deleteMode) return;
    
    setSelectedForDeletion(prev => {
      if (prev.includes(pageId)) {
        return prev.filter(id => id !== pageId);
      } else {
        return [...prev, pageId];
      }
    });
  };

  const handleConfirmDelete = () => {
    if (selectedForDeletion.length > 0) {
      setShowDeleteConfirm(true);
    }
  };

  const handleExecuteDelete = () => {
    setPages(prev => prev.filter(page => !selectedForDeletion.includes(page.id)));
    setSelectedForDeletion([]);
    setDeleteMode(false);
    setShowDeleteConfirm(false);
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  return (
    <Box
      className="main-container"
      sx={{
        height: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        display: 'flex',
        overflow: 'hidden'
      }}
    >
      {/* 背景全体Container */}
      {/* 左端ナビゲーションバー */}
      <Paper
        elevation={4}
        sx={{
          width: 80,
          height: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          py: 2,
          boxShadow: '4px 0 20px rgba(0, 0, 0, 0.1)'
        }}
      >

        {/* ナビゲーションアイテム */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            width: '100%',
            px: 1
          }}
        >
          {leftNavigationItems.map((item, index) => (
            <Tooltip key={index} title={item.label} placement="right">
              <IconButton
                onClick={() => {
                  if (item.isLogo) {
                    onBackClick();
                  } else if (item.label === 'フォルダー') {
                    setShowPageManager(true);
                  } else if (item.label === '編集') {
                    setShowPageManager(false);
                    setSelectedTool(item);
                  } else {
                    setSelectedTool(item);
                  }
                }}
                sx={{
                  color: ((selectedTool?.label === item.label && !showPageManager) || (item.label === 'フォルダー' && showPageManager)) ? 'white' : 'rgba(255, 255, 255, 0.7)',
                  backgroundColor: ((selectedTool?.label === item.label && !showPageManager) || (item.label === 'フォルダー' && showPageManager)) ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                  borderRadius: 2,
                  width: 48,
                  height: 48,
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    color: 'white'
                  },
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {item.isLogo ? (
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: 1,
                      background: 'rgba(255, 255, 255, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backdropFilter: 'blur(10px)',
                      // 画像を追加する場合のスタイル
                      backgroundImage: 'none', // ここに 'url("/path/to/logo.png")' を指定
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  >
                    {/* 画像がない場合のフォールバック */}
                    <Typography
                      variant="caption"
                      sx={{ 
                        color: 'white', 
                        fontWeight: 'bold',
                        fontSize: '0.7rem'
                      }}
                    >
                      OR
                    </Typography>
                  </Box>
                ) : (
                  item.icon
                )}
              </IconButton>
            </Tooltip>
          ))}
        </Box>
      </Paper>

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
        <Paper
          elevation={0}
          sx={{
            height: 65,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
            borderRadius: 0,
            display: 'flex',
            alignItems: 'center',
            px: 2,
            justifyContent: 'space-between'
          }}
        >
          {/* ヘッダー左側 */}
          <Typography
            variant="h5"
            sx={{
              color: '#1a202c',
              fontWeight: 700
            }}
          >
            フォーム作成
          </Typography>

          {/* ヘッダー右側のアクションボタン */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="プレビュー">
              <IconButton
                sx={{
                  color: '#64748b',
                  '&:hover': {
                    backgroundColor: 'rgba(100, 116, 139, 0.1)'
                  }
                }}
              >
                <Preview />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="保存">
              <IconButton
                sx={{
                  color: '#64748b',
                  '&:hover': {
                    backgroundColor: 'rgba(100, 116, 139, 0.1)'
                  }
                }}
              >
                <Save />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="その他">
              <IconButton
                sx={{
                  color: '#64748b',
                  '&:hover': {
                    backgroundColor: 'rgba(100, 116, 139, 0.1)'
                  }
                }}
              >
                <MoreVert />
              </IconButton>
            </Tooltip>
          </Box>
        </Paper>

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

              {/* プレビュー制御パネル - ヘッダー下固定 */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 8,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  zIndex: 20,
                  pointerEvents: 'auto'
                }}
              >
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <Paper
                    elevation={8}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      px: 1,
                      py: 0.5,
                      borderRadius: 2,
                      background: 'rgba(255, 255, 255, 0.95)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    {/* デバイス切り替え */}
                    <Tooltip title="モバイル表示">
                      <IconButton
                        onClick={() => setPreviewMode('mobile')}
                        sx={{
                          color: previewMode === 'mobile' ? '#5e17eb' : '#64748b',
                          backgroundColor: previewMode === 'mobile' ? 'rgba(94, 23, 235, 0.1)' : 'transparent',
                          '&:hover': {
                            backgroundColor: 'rgba(94, 23, 235, 0.1)'
                          }
                        }}
                      >
                        <PhoneAndroid />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="PC表示">
                      <IconButton
                        onClick={() => setPreviewMode('desktop')}
                        sx={{
                          color: previewMode === 'desktop' ? '#5e17eb' : '#64748b',
                          backgroundColor: previewMode === 'desktop' ? 'rgba(94, 23, 235, 0.1)' : 'transparent',
                          '&:hover': {
                            backgroundColor: 'rgba(94, 23, 235, 0.1)'
                          }
                        }}
                      >
                        <Computer />
                      </IconButton>
                    </Tooltip>


                    {/* ズーム制御 */}
                    <Tooltip title="縮小">
                      <IconButton
                        onClick={handleZoomOut}
                        disabled={zoom <= 0.5}
                        sx={{
                          color: '#64748b',
                          '&:hover': {
                            backgroundColor: 'rgba(100, 116, 139, 0.1)'
                          }
                        }}
                      >
                        <ZoomOut />
                      </IconButton>
                    </Tooltip>

                    <Typography variant="caption" sx={{ minWidth: 40, textAlign: 'center', color: '#64748b', fontSize: '0.7rem' }}>
                      {Math.round(zoom * 100)}%
                    </Typography>

                    <Tooltip title="拡大">
                      <IconButton
                        onClick={handleZoomIn}
                        disabled={zoom >= 2}
                        sx={{
                          color: '#64748b',
                          '&:hover': {
                            backgroundColor: 'rgba(100, 116, 139, 0.1)'
                          }
                        }}
                      >
                        <ZoomIn />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="フィット">
                      <IconButton
                        onClick={handleFitScreen}
                        sx={{
                          color: '#64748b',
                          '&:hover': {
                            backgroundColor: 'rgba(100, 116, 139, 0.1)'
                          }
                        }}
                      >
                        <FitScreen />
                      </IconButton>
                    </Tooltip>
                  </Paper>
                </motion.div>
              </Box>

              {/* 中央プレビューエリア */}
              <Box
                className="center-preview-area"
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -45%)',
                  zIndex: 10,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                  pointerEvents: 'auto'
                }}
              >
                {/* プレビュー画面 */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: zoom }}
                  transition={{ duration: 0.3 }}
                  style={{
                    transform: `scale(${zoom})`,
                    transformOrigin: 'center'
                  }}
                >
                  <Paper
                    elevation={12}
                    sx={{
                      width: previewMode === 'mobile' ? 390 : 1024,
                      height: previewMode === 'mobile' ? 820 : 576,
                      borderRadius: previewMode === 'mobile' ? 6 : 0,
                      background: 'white',
                      border: previewMode === 'mobile' ? '8px solid #1a1a1a' : '2px solid #e2e8f0',
                      boxShadow: previewMode === 'mobile' 
                        ? '0 25px 80px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05)' 
                        : '0 20px 60px rgba(0, 0, 0, 0.15)',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    {/* モバイルの場合のノッチ */}
                    {previewMode === 'mobile' && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: 150,
                          height: 30,
                          background: '#1a1a1a',
                          borderBottomLeftRadius: 15,
                          borderBottomRightRadius: 15,
                          zIndex: 10
                        }}
                      />
                    )}

                    {/* プレビューコンテンツ */}
                    <Box
                      sx={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        p: previewMode === 'mobile' ? 2 : 4,
                        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
                      }}
                    >
                      <Box
                        sx={{
                          textAlign: 'center',
                          mb: 3
                        }}
                      >
                        <Typography
                          variant={previewMode === 'mobile' ? 'h6' : 'h4'}
                          sx={{
                            fontWeight: 700,
                            background: 'linear-gradient(45deg, #5e17eb 30%, #764ba2 90%)',
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            mb: 1
                          }}
                        >
                          {previewMode === 'mobile' ? 'モバイル' : 'デスクトップ'}プレビュー
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          フォームの{previewMode === 'mobile' ? 'スマートフォン' : 'PC'}での表示
                        </Typography>
                      </Box>

                      {/* サンプルフォーム */}
                      <Paper
                        sx={{
                          p: previewMode === 'mobile' ? 2 : 3,
                          borderRadius: 2,
                          width: '100%',
                          maxWidth: previewMode === 'mobile' ? 300 : 600,
                          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
                        }}
                      >
                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                          サンプルアンケート
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <Box>
                            <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                              お名前をお聞かせください
                            </Typography>
                            <Box
                              sx={{
                                width: '100%',
                                height: 40,
                                border: '1px solid #e2e8f0',
                                borderRadius: 1,
                                backgroundColor: '#f8fafc'
                              }}
                            />
                          </Box>
                          <Box>
                            <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                              満足度を教えてください
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                              {['とても満足', '満足', '普通', '不満'].map((option, index) => (
                                <Box
                                  key={index}
                                  sx={{
                                    px: 2,
                                    py: 1,
                                    border: '1px solid #e2e8f0',
                                    borderRadius: 1,
                                    fontSize: previewMode === 'mobile' ? '0.8rem' : '0.9rem',
                                    backgroundColor: index === 1 ? 'rgba(94, 23, 235, 0.1)' : '#f8fafc',
                                    color: index === 1 ? '#5e17eb' : '#64748b'
                                  }}
                                >
                                  {option}
                                </Box>
                              ))}
                            </Box>
                          </Box>
                        </Box>
                      </Paper>
                    </Box>
                  </Paper>
                </motion.div>
              </Box>
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
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              style={{ flex: '0 0 300px', pointerEvents: 'auto' }}
            >
              <Paper
                elevation={8}
                sx={{
                  height: '100%',
                  borderRadius: 0,
                  background: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)',
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
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
                        sx={{
                          fontWeight: 600,
                          background: 'linear-gradient(45deg, #5e17eb 30%, #764ba2 90%)',
                          backgroundClip: 'text',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent'
                        }}
                      >
                        ページ管理
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {deleteMode && selectedForDeletion.length > 0 && (
                          <IconButton
                            onClick={handleConfirmDelete}
                            sx={{
                              color: '#ef4444',
                              backgroundColor: 'rgba(239, 68, 68, 0.1)',
                              '&:hover': { 
                                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                                transform: 'scale(1.05)'
                              }
                            }}
                          >
                            <Delete />
                          </IconButton>
                        )}
                        <IconButton
                          onClick={deleteMode ? handleDeleteModeToggle : handleDeleteModeToggle}
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
                      </Box>
                    </Box>


                    {/* ページリスト */}
                    <Box sx={{ flex: 1 }}>
                      {pages.map((page, index) => (
                        <motion.div
                          key={page.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: index * 0.05 }}
                        >
                          <Box
                            draggable={page.type === 'question' && !deleteMode}
                            onDragStart={(e) => handleDragStart(e, page)}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, page)}
                            onDragEnd={handleDragEnd}
                            onClick={() => deleteMode && page.canDelete && handlePageSelection(page.id)}
                            sx={{
                              p: 1.5,
                              mb: 1,
                              borderRadius: 1,
                              backgroundColor: selectedForDeletion.includes(page.id)
                                ? 'rgba(239, 68, 68, 0.1)'
                                : draggedPage?.id === page.id 
                                ? 'rgba(94, 23, 235, 0.1)' 
                                : 'rgba(255, 255, 255, 0.8)',
                              border: selectedForDeletion.includes(page.id)
                                ? '2px solid rgba(239, 68, 68, 0.3)'
                                : '1px solid rgba(0, 0, 0, 0.06)',
                              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                              minHeight: 72,
                              display: 'flex',
                              alignItems: 'center',
                              cursor: deleteMode && page.canDelete 
                                ? 'pointer' 
                                : page.type === 'question' && !deleteMode 
                                ? 'move' 
                                : 'default',
                              opacity: draggedPage?.id === page.id ? 0.5 : deleteMode && !page.canDelete ? 0.5 : 1,
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                backgroundColor: selectedForDeletion.includes(page.id)
                                  ? 'rgba(239, 68, 68, 0.15)'
                                  : deleteMode && page.canDelete
                                  ? 'rgba(239, 68, 68, 0.05)'
                                  : draggedPage?.id === page.id 
                                  ? 'rgba(94, 23, 235, 0.1)' 
                                  : 'rgba(94, 23, 235, 0.04)',
                                borderColor: selectedForDeletion.includes(page.id)
                                  ? 'rgba(239, 68, 68, 0.5)'
                                  : 'rgba(94, 23, 235, 0.15)',
                                transform: draggedPage?.id === page.id ? 'none' : 'translateY(-1px)',
                                boxShadow: '0 3px 12px rgba(0, 0, 0, 0.1)'
                              }
                            }}
                          >
                            {/* ドラッグハンドル領域 (統一幅) */}
                            <Box
                              sx={{
                                width: 32,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mr: 1,
                                flexShrink: 0
                              }}
                            >
                              {page.type === 'question' && (
                                <Box
                                  sx={{
                                    color: '#94a3b8',
                                    cursor: 'grab',
                                    '&:active': { cursor: 'grabbing' },
                                    '&:hover': { color: '#5e17eb' }
                                  }}
                                >
                                  <DragHandle sx={{ fontSize: '1.2rem' }} />
                                </Box>
                              )}
                            </Box>

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
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: 600,
                                  color: '#2d3748',
                                  fontSize: '0.8rem',
                                  mb: 0.3
                                }}
                              >
                                {page.title}
                              </Typography>
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
                  <>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 600,
                    background: 'linear-gradient(45deg, #5e17eb 30%, #764ba2 90%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    mb: 2,
                    textAlign: 'center'
                  }}
                >
                  質問作成
                </Typography>
                
                {/* 質問タイプグリッド */}
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#64748b' }}>
                  質問タイプ
                </Typography>
                <Grid container spacing={1} sx={{ mb: 3 }}>
                  {questionTypes.map((item, index) => (
                    <Grid item xs={4} key={index}>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      >
                        <Paper
                          elevation={2}
                          sx={{
                            p: 1,
                            borderRadius: 1,
                            background: 'rgba(255, 255, 255, 0.8)',
                            border: '1px solid rgba(0, 0, 0, 0.05)',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 0.5,
                            minHeight: 70,
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)',
                              background: 'rgba(94, 23, 235, 0.05)'
                            }
                          }}
                          onClick={() => setSelectedTool(item)}
                        >
                          <Box
                            sx={{
                              width: 28,
                              height: 28,
                              borderRadius: 1,
                              background: `linear-gradient(135deg, ${
                                ['#667eea', '#ff9a9e', '#a8edea', '#fed6e3', '#d299c2', '#89f7fe', '#66a6ff'][index % 7]
                              } 0%, ${
                                ['#764ba2', '#fecfef', '#d299c2', '#d8edea', '#fecfef', '#bfe9ff', '#8aa7ff'][index % 7]
                              } 100%)`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                            }}
                          >
                            {React.cloneElement(item.icon, { 
                              sx: { color: 'white', fontSize: '0.9rem' } 
                            })}
                          </Box>
                          <Typography
                            variant="caption"
                            sx={{
                              fontWeight: 500,
                              color: '#2d3748',
                              fontSize: '0.65rem',
                              textAlign: 'center',
                              lineHeight: 1.2
                            }}
                          >
                            {item.label}
                          </Typography>
                        </Paper>
                      </motion.div>
                    </Grid>
                  ))}
                </Grid>

                {/* テンプレート質問 */}
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: '#64748b' }}>
                  テンプレート質問
                </Typography>
                <Box sx={{ flex: 1 }}>
                  {questionTemplates.map((majorCategory, index) => (
                    <Box key={majorCategory.id} sx={{ mb: 3 }}>
                      {/* 大区分ヘッダー（テキスト表示のみ） */}
                      <Box sx={{ mb: 2 }}>
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            fontWeight: 700, 
                            fontSize: '0.9rem', 
                            color: '#1a202c',
                            letterSpacing: '0.02em',
                            mb: 0.5
                          }}
                        >
                          {majorCategory.title}
                        </Typography>
                        <Box
                          sx={{
                            width: '100%',
                            height: 2,
                            background: 'linear-gradient(90deg, #5e17eb 0%, #764ba2 100%)',
                            borderRadius: 0.5,
                            opacity: 0.3
                          }}
                        />
                      </Box>
                      
                      {/* 中区分とテンプレート質問 */}
                      <Box sx={{ pl: 0 }}>
                        {majorCategory.categories.map((category, catIndex) => (
                          <Box key={category.id} sx={{ mb: 2 }}>
                            {/* 中区分ヘッダー（トグル機能付き） */}
                            <Box
                              onClick={() => toggleExpanded(`${majorCategory.id}-${category.id}`)}
                              sx={{
                                p: 1.5,
                                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                borderRadius: 1,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                border: '1px solid rgba(94, 23, 235, 0.1)',
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                  backgroundColor: 'rgba(94, 23, 235, 0.05)',
                                  borderColor: 'rgba(94, 23, 235, 0.2)',
                                  transform: 'translateY(-1px)',
                                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
                                }
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box
                                  sx={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: 1,
                                    background: 'linear-gradient(135deg, #5e17eb 0%, #764ba2 100%)',
                                    boxShadow: '0 2px 4px rgba(94, 23, 235, 0.3)'
                                  }}
                                />
                                <Typography 
                                  variant="body2" 
                                  sx={{ 
                                    fontWeight: 600, 
                                    fontSize: '0.8rem',
                                    color: '#2d3748'
                                  }}
                                >
                                  {category.title}
                                </Typography>
                              </Box>
                              <ExpandMoreIcon 
                                sx={{ 
                                  fontSize: '1rem',
                                  color: '#5e17eb',
                                  transform: expandedTemplates[`${majorCategory.id}-${category.id}`] ? 'rotate(180deg)' : 'rotate(0deg)',
                                  transition: 'transform 0.3s ease'
                                }} 
                              />
                            </Box>
                            
                            {/* テンプレート質問リスト */}
                            <Collapse in={expandedTemplates[`${majorCategory.id}-${category.id}`] || false}>
                              <Box sx={{ pt: 1, pl: 2 }}>
                                {category.templates.map((temp, tempIndex) => (
                                  <motion.div
                                    key={temp.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.2, delay: tempIndex * 0.05 }}
                                  >
                                    <Box
                                      onClick={() => setSelectedTool({ ...temp, isTemplate: true })}
                                      sx={{
                                        p: 1.5,
                                        mb: 1,
                                        cursor: 'pointer',
                                        borderRadius: 1,
                                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                        border: '1px solid rgba(0, 0, 0, 0.06)',
                                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1.5,
                                        '&:hover': {
                                          backgroundColor: 'rgba(94, 23, 235, 0.04)',
                                          borderColor: 'rgba(94, 23, 235, 0.15)',
                                          transform: 'translateX(3px)',
                                          boxShadow: '0 3px 12px rgba(0, 0, 0, 0.1)'
                                        },
                                        transition: 'all 0.3s ease'
                                      }}
                                    >
                                      {/* 左側: アイコン */}
                                      <Box
                                        sx={{
                                          width: 32,
                                          height: 32,
                                          borderRadius: 1,
                                          background: 'linear-gradient(135deg, #5e17eb 0%, #764ba2 100%)',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          flexShrink: 0,
                                          boxShadow: '0 2px 8px rgba(94, 23, 235, 0.3)'
                                        }}
                                      >
                                        {React.cloneElement(
                                          questionTypes.find(qt => qt.type === temp.type)?.icon || <TextFields />,
                                          { 
                                            sx: { 
                                              color: 'white', 
                                              fontSize: '1rem' 
                                            } 
                                          }
                                        )}
                                      </Box>

                                      {/* 右側: テキスト（最大2行） */}
                                      <Typography
                                        variant="body2"
                                        sx={{
                                          fontSize: '0.8rem',
                                          lineHeight: 1.3,
                                          color: '#2d3748',
                                          fontWeight: 500,
                                          flex: 1,
                                          display: '-webkit-box',
                                          WebkitLineClamp: 2,
                                          WebkitBoxOrient: 'vertical',
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis'
                                        }}
                                      >
                                        {temp.question}
                                      </Typography>
                                    </Box>
                                  </motion.div>
                                ))}
                              </Box>
                            </Collapse>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  ))}
                </Box>
                  </>
                )}
              </Paper>
            </motion.div>


            {/* 右側Container - フォーム設定 */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              style={{ flex: '0 0 300px', pointerEvents: 'auto' }}
            >
              <Paper
                elevation={8}
                sx={{
                  height: '100%',
                  borderRadius: 0,
                  background: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)',
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column'
                }}
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
                    sx={{
                      width: 60,
                      height: 60,
                      borderRadius: 2,
                      background: 'linear-gradient(135deg, #fcb69f 0%, #ffecd2 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 8px 24px rgba(252, 182, 159, 0.3)'
                    }}
                  >
                    <Settings sx={{ color: 'white', fontSize: '1.5rem' }} />
                  </Box>
                  <Typography variant="body2" color="text.secondary" textAlign="center">
                    フォームの設定や
                    プレビューが
                    ここに表示されます
                  </Typography>
                </Box>
              </Paper>
            </motion.div>
          </Stack>

          {/* 選択ツールの表示（中央部分） */}
          {selectedTool && (
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 2
              }}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Box
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    background: 'rgba(94, 23, 235, 0.1)',
                    border: '2px dashed rgba(94, 23, 235, 0.3)',
                    backdropFilter: 'blur(10px)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 1,
                    minWidth: 200
                  }}
                >
                  {selectedTool.icon}
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {selectedTool.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    選択中
                  </Typography>
                </Box>
              </motion.div>
            </Box>
          )}
        </Box>

        {/* 削除確認ダイアログ */}
        <Dialog
          open={showDeleteConfirm}
          onClose={handleCancelDelete}
          PaperProps={{
            sx: {
              borderRadius: 2,
              minWidth: 400
            }
          }}
        >
          <DialogTitle sx={{ fontWeight: 600, color: '#ef4444' }}>
            ページを削除しますか？
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ mb: 2 }}>
              以下のページを削除します。この操作は元に戻せません。
            </Typography>
            <Box sx={{ bgcolor: '#f8fafc', p: 2, borderRadius: 1 }}>
              {selectedForDeletion.map(pageId => {
                const page = pages.find(p => p.id === pageId);
                return page ? (
                  <Box key={pageId} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    {React.cloneElement(page.icon, { 
                      sx: { color: '#64748b', fontSize: '1rem' } 
                    })}
                    <Typography variant="body2" sx={{ color: '#2d3748' }}>
                      {page.title}
                    </Typography>
                  </Box>
                ) : null;
              })}
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button
              onClick={handleCancelDelete}
              variant="outlined"
              sx={{
                borderColor: '#e2e8f0',
                color: '#64748b',
                '&:hover': {
                  borderColor: '#cbd5e1',
                  backgroundColor: '#f8fafc'
                }
              }}
            >
              キャンセル
            </Button>
            <Button
              onClick={handleExecuteDelete}
              variant="contained"
              sx={{
                backgroundColor: '#ef4444',
                '&:hover': {
                  backgroundColor: '#dc2626'
                }
              }}
            >
              削除する
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
}