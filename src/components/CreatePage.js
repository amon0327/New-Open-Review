import React, { useState } from 'react';
import PreviewControlPanel from './PreviewControlPanel';
import LeftNavigationBar from './LeftNavigationBar';
import HeaderBar from './HeaderBar';
import PreviewArea from './PreviewArea';
import PageManagerSidebar from './PageManagerSidebar';
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
  KeyboardArrowDown,
  AccountCircle,
  Security,
  Storage,
  Language,
  Notifications,
  CloudSync,
  Backup,
  Key,
  Schedule,
  Public,
  ChevronRight,
  PersonAdd,
  Quiz
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false); // 削除確認ダイアログ
  const [pageToDelete, setPageToDelete] = useState(null); // 削除対象ページ
  const [sortingAnimation, setSortingAnimation] = useState(null); // 並び替えアニメーション
  const [dropIndicator, setDropIndicator] = useState(null); // ドロップ位置インジケーター
  const [selectedPage, setSelectedPage] = useState(null); // 選択中のページ
  const [editingPageId, setEditingPageId] = useState(null); // 編集中のページID
  const [editingTitle, setEditingTitle] = useState(''); // 編集中のタイトル
  const [showSettings, setShowSettings] = useState(false); // 設定画面表示状態
  const [projectTitle, setProjectTitle] = useState('OpenReview フォーム'); // プロジェクトタイトル
  const [isEditingTitle, setIsEditingTitle] = useState(false); // タイトル編集状態
  const [showColorPicker, setShowColorPicker] = useState(false); // カラーピッカー表示状態
  const [selectedColor, setSelectedColor] = useState('#5e17eb'); // 選択されたテーマカラー
  const [isPublished, setIsPublished] = useState(true); // 公開状態
  const [projectDescription, setProjectDescription] = useState(''); // プロジェクト説明
  const [selectedFont, setSelectedFont] = useState('Inter'); // 選択されたフォント
  const [logoPreview, setLogoPreview] = useState(null); // ロゴプレビュー
  
  // 設定カテゴリデータ
  const settingsCategories = [
    {
      id: 'account',
      title: 'アカウント',
      description: 'プロフィールとアカウント設定',
      icon: <AccountCircle />,
      settings: [
        { id: 'profile', label: 'プロフィール編集', value: 'Claude User', type: 'text' },
        { id: 'email', label: 'メールアドレス', value: 'user@example.com', type: 'email' },
        { id: 'password', label: 'パスワード変更', value: '••••••••', type: 'password' },
        { id: 'avatar', label: 'アバター画像', value: 'アップロード', type: 'upload' }
      ]
    },
    {
      id: 'database',
      title: 'データベース',
      description: 'Supabase接続とデータ管理',
      icon: <Storage />,
      settings: [
        { id: 'connection', label: 'データベース接続', value: '接続済み', type: 'status', status: 'connected' },
        { id: 'tables', label: 'テーブル管理', value: '12テーブル', type: 'info' },
        { id: 'backup', label: '自動バックアップ', value: true, type: 'toggle' },
        { id: 'retention', label: 'データ保持期間', value: '90日', type: 'select' }
      ]
    },
    {
      id: 'forms',
      title: 'フォーム設定',
      description: 'フォームのデフォルト設定',
      icon: <Description />,
      settings: [
        { id: 'theme', label: 'デフォルトテーマ', value: 'モダン', type: 'select' },
        { id: 'language', label: '言語設定', value: '日本語', type: 'select' },
        { id: 'notifications', label: '回答通知', value: true, type: 'toggle' },
        { id: 'analytics', label: '統計情報収集', value: false, type: 'toggle' }
      ]
    },
    {
      id: 'security',
      title: 'セキュリティ',
      description: 'セキュリティとアクセス制御',
      icon: <Security />,
      settings: [
        { id: '2fa', label: '二要素認証', value: false, type: 'toggle' },
        { id: 'apikeys', label: 'APIキー管理', value: '3個のキー', type: 'info' },
        { id: 'sessions', label: 'アクティブセッション', value: '2台のデバイス', type: 'info' },
        { id: 'permissions', label: 'アクセス権限', value: '管理者', type: 'info' }
      ]
    },
    {
      id: 'integrations',
      title: '連携設定',
      description: '外部サービスとの連携',
      icon: <CloudSync />,
      settings: [
        { id: 'webhooks', label: 'Webhook URL', value: '3個設定済み', type: 'info' },
        { id: 'slack', label: 'Slack連携', value: false, type: 'toggle' },
        { id: 'email', label: 'メール通知', value: true, type: 'toggle' },
        { id: 'export', label: 'データエクスポート', value: 'CSV, JSON', type: 'info' }
      ]
    },
    {
      id: 'general',
      title: '一般設定',
      description: 'アプリケーションの一般設定',
      icon: <Public />,
      settings: [
        { id: 'timezone', label: 'タイムゾーン', value: 'Asia/Tokyo', type: 'select' },
        { id: 'dateformat', label: '日付形式', value: 'YYYY/MM/DD', type: 'select' },
        { id: 'autosave', label: '自動保存', value: true, type: 'toggle' },
        { id: 'updates', label: '自動アップデート', value: true, type: 'toggle' }
      ]
    }
  ];

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

  const handleMovePageUp = async (pageId) => {
    const pageIndex = pages.findIndex(p => p.id === pageId);
    if (pageIndex > 1) { // ログイン画面より後ろの場合のみ
      // アニメーション開始
      setSortingAnimation({ id: pageId, direction: 'up' });
      
      // 少し待ってから実際の移動を実行
      setTimeout(() => {
        const newPages = [...pages];
        [newPages[pageIndex], newPages[pageIndex - 1]] = [newPages[pageIndex - 1], newPages[pageIndex]];
        setPages(newPages);
        
        // アニメーション終了
        setTimeout(() => {
          setSortingAnimation(null);
        }, 200);
      }, 100);
    }
  };

  const handleMovePageDown = async (pageId) => {
    const pageIndex = pages.findIndex(p => p.id === pageId);
    if (pageIndex < pages.length - 2) { // 完了画面より前の場合のみ
      // アニメーション開始
      setSortingAnimation({ id: pageId, direction: 'down' });
      
      // 少し待ってから実際の移動を実行
      setTimeout(() => {
        const newPages = [...pages];
        [newPages[pageIndex], newPages[pageIndex + 1]] = [newPages[pageIndex + 1], newPages[pageIndex]];
        setPages(newPages);
        
        // アニメーション終了
        setTimeout(() => {
          setSortingAnimation(null);
        }, 200);
      }, 100);
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

              {/* 設定画面でない場合のみプレビュー制御パネルを表示 */}
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

              {/* 設定画面または中央プレビューエリア */}
              {showSettings ? (
                /* 設定画面 - Container配置のみ */
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(20px)'
                  }}
                >
                  <Paper
                    elevation={8}
                    sx={{
                      p: 4,
                      borderRadius: 3,
                      textAlign: 'center',
                      maxWidth: 600,
                      background: 'white'
                    }}
                  >
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b', mb: 2 }}>
                      フォーム設定
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#64748b', mb: 3 }}>
                      フォームの外観と公開設定を管理します
                    </Typography>
                    <Box
                      sx={{
                        p: 3,
                        border: '2px dashed #e2e8f0',
                        borderRadius: 2,
                        backgroundColor: '#f8fafc'
                      }}
                    >
                      <Typography variant="h6" sx={{ color: '#64748b' }}>
                        設定コンテナ
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#9ca3af', mt: 1 }}>
                        今後の実装予定エリア
                      </Typography>
                    </Box>
                  </Paper>
                </Box>
              ) : (
                /* 中央プレビューエリア - 設定画面でない場合 */
                <>
                  {/* プレビュー制御パネル */}
                  <PreviewControlPanel
                    previewMode={previewMode}
                    setPreviewMode={setPreviewMode}
                    zoom={zoom}
                    handleZoomIn={handleZoomIn}
                    handleZoomOut={handleZoomOut}
                    handleFitScreen={handleFitScreen}
                  />

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
                  <PageManagerSidebar
                    pages={pages}
                    editingPageId={editingPageId}
                    editingTitle={editingTitle}
                    deleteMode={deleteMode}
                    draggedPage={draggedPage}
                    dropIndicator={dropIndicator}
                    sortingAnimation={sortingAnimation}
                    handleAddPage={handleAddPage}
                    handleDeleteModeToggle={handleDeleteModeToggle}
                    handleDragStart={handleDragStart}
                    handleDragOver={handleDragOver}
                    handleDrop={handleDrop}
                    handleDragEnd={handleDragEnd}
                    handlePageDeletionRequest={handlePageDeletionRequest}
                    setSelectedPage={setSelectedPage}
                    setEditingPageId={setEditingPageId}
                    setEditingTitle={setEditingTitle}
                    handleStartEditing={handleStartEditing}
                    handleCancelEdit={handleCancelEdit}
                    handleSaveEdit={handleSaveEdit}
                  />
                ) : showSettings ? (
                  // 設定画面
                  <>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
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
                        設定
                      </Typography>
                    </Box>

                    {/* 設定カテゴリ */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {settingsCategories.map((category) => (
                        <motion.div
                          key={category.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: settingsCategories.indexOf(category) * 0.1 }}
                        >
                          <Paper
                            elevation={2}
                            sx={{
                              p: 3,
                              borderRadius: 2,
                              background: 'rgba(255, 255, 255, 0.8)',
                              border: '1px solid rgba(0, 0, 0, 0.05)',
                              '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)'
                              },
                              transition: 'all 0.2s ease'
                            }}
                          >
                            {/* カテゴリヘッダー */}
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                              <Box
                                sx={{
                                  width: 48,
                                  height: 48,
                                  borderRadius: 2,
                                  background: `linear-gradient(135deg, ${
                                    category.id === 'account' ? '#667eea, #764ba2' :
                                    category.id === 'database' ? '#5e17eb, #764ba2' :
                                    category.id === 'forms' ? '#22c55e, #16a34a' :
                                    category.id === 'security' ? '#ef4444, #dc2626' :
                                    category.id === 'integrations' ? '#3b82f6, #1d4ed8' :
                                    '#6b7280, #4b5563'
                                  })`,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  mr: 2,
                                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                                }}
                              >
                                {React.cloneElement(category.icon, { sx: { color: 'white', fontSize: '1.5rem' } })}
                              </Box>
                              <Box>
                                <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a202c' }}>
                                  {category.title}
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#6b7280' }}>
                                  {category.description}
                                </Typography>
                              </Box>
                            </Box>

                            {/* 設定項目 */}
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                              {category.settings.map((setting, index) => (
                                <Box
                                  key={setting.id}
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    p: 2,
                                    borderRadius: 1,
                                    backgroundColor: 'rgba(248, 250, 252, 0.6)',
                                    border: '1px solid rgba(226, 232, 240, 0.5)',
                                    '&:hover': {
                                      backgroundColor: 'rgba(94, 23, 235, 0.03)'
                                    },
                                    transition: 'all 0.2s ease'
                                  }}
                                >
                                  <Box>
                                    <Typography variant="body2" sx={{ fontWeight: 500, color: '#374151' }}>
                                      {setting.label}
                                    </Typography>
                                  </Box>
                                  
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    {setting.type === 'toggle' ? (
                                      <Switch
                                        checked={setting.value}
                                        size="small"
                                        sx={{
                                          '& .MuiSwitch-switchBase.Mui-checked': {
                                            color: '#5e17eb'
                                          },
                                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                            backgroundColor: '#5e17eb'
                                          }
                                        }}
                                      />
                                    ) : setting.type === 'status' ? (
                                      <Chip
                                        label={setting.value}
                                        size="small"
                                        sx={{
                                          backgroundColor: setting.status === 'connected' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                          color: setting.status === 'connected' ? '#16a34a' : '#dc2626',
                                          fontWeight: 500
                                        }}
                                      />
                                    ) : setting.type === 'info' ? (
                                      <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 500 }}>
                                        {setting.value}
                                      </Typography>
                                    ) : (
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Typography variant="body2" sx={{ color: '#6b7280', minWidth: 80, textAlign: 'right' }}>
                                          {setting.value}
                                        </Typography>
                                        <ChevronRight sx={{ color: '#9ca3af', fontSize: '1rem' }} />
                                      </Box>
                                    )}
                                  </Box>
                                </Box>
                              ))}
                            </Box>
                          </Paper>
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
            )}

            {/* 右側Container - フォーム設定 - 設定画面では非表示 */}
            {!showSettings && (
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
            )}
          </Stack>

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
            {pageToDelete && (
              <Box sx={{ bgcolor: '#f8fafc', p: 2, borderRadius: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                {React.cloneElement(pageToDelete.icon, { 
                  sx: { color: '#64748b', fontSize: '1rem' } 
                })}
                <Typography variant="body2" sx={{ color: '#2d3748' }}>
                  {pageToDelete.title}
                </Typography>
              </Box>
            )}
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
