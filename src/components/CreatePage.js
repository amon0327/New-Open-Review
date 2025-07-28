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
                    setShowSettings(false);
                  } else if (item.label === '編集') {
                    setShowPageManager(false);
                    setShowSettings(false);
                    setSelectedTool(item);
                  } else if (item.label === '設定') {
                    setShowSettings(true);
                    setShowPageManager(false);
                    setSelectedTool(item);
                  } else {
                    setSelectedTool(item);
                  }
                }}
                sx={{
                  color: ((selectedTool?.label === item.label && !showPageManager && !showSettings) || (item.label === 'フォルダー' && showPageManager) || (item.label === '設定' && showSettings)) ? 'white' : 'rgba(255, 255, 255, 0.7)',
                  backgroundColor: ((selectedTool?.label === item.label && !showPageManager && !showSettings) || (item.label === 'フォルダー' && showPageManager) || (item.label === '設定' && showSettings)) ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
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
          {isEditingTitle ? (
            <Input
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              onBlur={() => setIsEditingTitle(false)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  setIsEditingTitle(false);
                } else if (e.key === 'Escape') {
                  setProjectTitle('OpenReview フォーム');
                  setIsEditingTitle(false);
                }
              }}
              autoFocus
              sx={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: '#1a202c',
                minWidth: 200,
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
              variant="h5"
              onClick={() => setIsEditingTitle(true)}
              sx={{
                color: '#1a202c',
                fontWeight: 700,
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: 1,
                '&:hover': {
                  backgroundColor: 'rgba(94, 23, 235, 0.05)',
                  color: '#5e17eb'
                },
                transition: 'all 0.2s ease'
              }}
            >
              {projectTitle}
            </Typography>
          )}

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

              {/* 設定画面でない場合のみプレビュー制御パネルを表示 */}
              {!showSettings && (
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
              )}

              {/* 設定画面または中央プレビューエリア */}
              {showSettings ? (
                /* 設定画面全体表示 */
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 10,
                    p: 4,
                    overflowY: 'auto',
                    background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                    '&::-webkit-scrollbar': {
                      width: 8
                    },
                    '&::-webkit-scrollbar-track': {
                      background: 'rgba(0,0,0,0.1)',
                      borderRadius: 4
                    },
                    '&::-webkit-scrollbar-thumb': {
                      background: 'rgba(94, 23, 235, 0.3)',
                      borderRadius: 4,
                      '&:hover': {
                        background: 'rgba(94, 23, 235, 0.5)'
                      }
                    }
                  }}
                >
                  {/* 設定ヘッダー */}
                  <Box sx={{ mb: 4, textAlign: 'center' }}>
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 700,
                        background: 'linear-gradient(45deg, #5e17eb 30%, #764ba2 90%)',
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        mb: 1
                      }}
                    >
                      フォーム設定
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#6b7280' }}>
                      フォームの外観と設定を管理します
                    </Typography>
                  </Box>

                  {/* 設定カテゴリグリッド */}
                  <Box 
                    sx={{ 
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))',
                      gap: 3,
                      maxWidth: 1400,
                      margin: '0 auto'
                    }}
                  >
                    {/* フォームデザイン */}
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0 * 0.1 }}
                    >
                      <Paper
                        elevation={3}
                        sx={{
                          p: 4,
                          borderRadius: 3,
                          background: 'rgba(255, 255, 255, 0.95)',
                          backdropFilter: 'blur(10px)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)'
                          },
                          transition: 'all 0.3s ease'
                        }}
                      >
                        {/* カテゴリヘッダー */}
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                          <Box
                            sx={{
                              width: 48,
                              height: 48,
                              borderRadius: 3,
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              mr: 3
                            }}
                          >
                            <Palette sx={{ color: 'white', fontSize: '1.5rem' }} />
                          </Box>
                          <Box>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a202c', mb: 0.5 }}>
                              フォームデザイン
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#6b7280' }}>
                              ロゴ、テーマ、カラー設定
                            </Typography>
                          </Box>
                        </Box>

                        {/* 設定項目 */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#374151', mb: 1 }}>
                              ロゴ画像
                            </Typography>
                            <Button
                              variant="outlined"
                              component="label"
                              sx={{
                                borderRadius: 2,
                                textTransform: 'none',
                                borderStyle: 'dashed',
                                height: 80,
                                width: '100%',
                                color: '#6b7280',
                                borderColor: '#d1d5db',
                                '&:hover': {
                                  borderColor: '#5e17eb',
                                  backgroundColor: 'rgba(94, 23, 235, 0.04)'
                                }
                              }}
                            >
                              <Image sx={{ mr: 1 }} />
                              画像をアップロード
                              <input type="file" accept="image/*" hidden />
                            </Button>
                          </Box>

                          <Box>
                            <FormControlLabel
                              control={
                                <Switch
                                  defaultChecked={false}
                                  sx={{
                                    '& .MuiSwitch-switchBase.Mui-checked': {
                                      color: '#5e17eb'
                                    },
                                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                      backgroundColor: '#5e17eb'
                                    }
                                  }}
                                />
                              }
                              label={
                                <Box>
                                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#374151' }}>
                                    ダークモード
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: '#6b7280' }}>
                                    フォームをダークテーマで表示
                                  </Typography>
                                </Box>
                              }
                              sx={{ alignItems: 'flex-start', m: 0 }}
                            />
                          </Box>

                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#374151', mb: 1 }}>
                              テーマカラー
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              {['#5e17eb', '#667eea', '#22c55e', '#ef4444', '#f59e0b'].map((color) => (
                                <Box
                                  key={color}
                                  sx={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: 2,
                                    backgroundColor: color,
                                    cursor: 'pointer',
                                    border: color === '#5e17eb' ? '3px solid #1a202c' : '1px solid rgba(0,0,0,0.1)',
                                    '&:hover': {
                                      transform: 'scale(1.1)'
                                    },
                                    transition: 'all 0.2s ease'
                                  }}
                                />
                              ))}
                            </Box>
                          </Box>
                        </Box>
                      </Paper>
                    </motion.div>

                    {/* ログイン画面設定 */}
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 1 * 0.1 }}
                    >
                      <Paper
                        elevation={3}
                        sx={{
                          p: 4,
                          borderRadius: 3,
                          background: 'rgba(255, 255, 255, 0.95)',
                          backdropFilter: 'blur(10px)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)'
                          },
                          transition: 'all 0.3s ease'
                        }}
                      >
                        {/* カテゴリヘッダー */}
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                          <Box
                            sx={{
                              width: 48,
                              height: 48,
                              borderRadius: 3,
                              background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              mr: 3
                            }}
                          >
                            <PersonAdd sx={{ color: 'white', fontSize: '1.5rem' }} />
                          </Box>
                          <Box>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a202c', mb: 0.5 }}>
                              ログイン画面設定
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#6b7280' }}>
                              ログイン画面の外観設定
                            </Typography>
                          </Box>
                        </Box>

                        {/* 設定項目 */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#374151', mb: 1 }}>
                              背景画像
                            </Typography>
                            <Button
                              variant="outlined"
                              component="label"
                              sx={{
                                borderRadius: 2,
                                textTransform: 'none',
                                borderStyle: 'dashed',
                                height: 80,
                                width: '100%',
                                color: '#6b7280',
                                borderColor: '#d1d5db',
                                '&:hover': {
                                  borderColor: '#16a34a',
                                  backgroundColor: 'rgba(34, 197, 94, 0.04)'
                                }
                              }}
                            >
                              <Image sx={{ mr: 1 }} />
                              背景画像をアップロード
                              <input type="file" accept="image/*" hidden />
                            </Button>
                          </Box>

                          <TextField
                            label="タイトルテキスト"
                            defaultValue="アンケートにご協力ください"
                            variant="outlined"
                            fullWidth
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                                backgroundColor: '#f8fafc',
                                '&:hover': {
                                  backgroundColor: '#f1f5f9'
                                },
                                '&.Mui-focused': {
                                  backgroundColor: 'white'
                                }
                              }
                            }}
                          />

                          <TextField
                            label="詳細テキスト"
                            defaultValue="ログインして回答を開始してください"
                            variant="outlined"
                            fullWidth
                            multiline
                            rows={3}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                                backgroundColor: '#f8fafc',
                                '&:hover': {
                                  backgroundColor: '#f1f5f9'
                                },
                                '&.Mui-focused': {
                                  backgroundColor: 'white'
                                }
                              }
                            }}
                          />
                        </Box>
                      </Paper>
                    </motion.div>

                    {/* 完了画面設定 */}
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 2 * 0.1 }}
                    >
                      <Paper
                        elevation={3}
                        sx={{
                          p: 4,
                          borderRadius: 3,
                          background: 'rgba(255, 255, 255, 0.95)',
                          backdropFilter: 'blur(10px)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)'
                          },
                          transition: 'all 0.3s ease'
                        }}
                      >
                        {/* カテゴリヘッダー */}
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                          <Box
                            sx={{
                              width: 48,
                              height: 48,
                              borderRadius: 3,
                              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              mr: 3
                            }}
                          >
                            <CheckCircle sx={{ color: 'white', fontSize: '1.5rem' }} />
                          </Box>
                          <Box>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a202c', mb: 0.5 }}>
                              完了画面設定
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#6b7280' }}>
                              完了時の画面とボタン設定
                            </Typography>
                          </Box>
                        </Box>

                        {/* 設定項目 */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                          <TextField
                            label="タイトルテキスト"
                            defaultValue="ご回答ありがとうございました"
                            variant="outlined"
                            fullWidth
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                                backgroundColor: '#f8fafc',
                                '&:hover': {
                                  backgroundColor: '#f1f5f9'
                                },
                                '&.Mui-focused': {
                                  backgroundColor: 'white'
                                }
                              }
                            }}
                          />

                          <TextField
                            label="詳細テキスト"
                            defaultValue="アンケートの回答が完了しました"
                            variant="outlined"
                            fullWidth
                            multiline
                            rows={3}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                                backgroundColor: '#f8fafc',
                                '&:hover': {
                                  backgroundColor: '#f1f5f9'
                                },
                                '&.Mui-focused': {
                                  backgroundColor: 'white'
                                }
                              }
                            }}
                          />

                          <Box>
                            <FormControlLabel
                              control={
                                <Switch
                                  defaultChecked={false}
                                  sx={{
                                    '& .MuiSwitch-switchBase.Mui-checked': {
                                      color: '#3b82f6'
                                    },
                                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                      backgroundColor: '#3b82f6'
                                    }
                                  }}
                                />
                              }
                              label={
                                <Box>
                                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#374151' }}>
                                    ボタン1を有効化
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: '#6b7280' }}>
                                    完了画面にアクションボタンを表示
                                  </Typography>
                                </Box>
                              }
                              sx={{ alignItems: 'flex-start', m: 0 }}
                            />
                          </Box>

                          <TextField
                            label="ボタン1テキスト"
                            defaultValue="ホームページへ"
                            variant="outlined"
                            fullWidth
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                                backgroundColor: '#f8fafc',
                                '&:hover': {
                                  backgroundColor: '#f1f5f9'
                                },
                                '&.Mui-focused': {
                                  backgroundColor: 'white'
                                }
                              }
                            }}
                          />

                          <TextField
                            label="ボタン1 URL"
                            placeholder="https://example.com"
                            variant="outlined"
                            fullWidth
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                                backgroundColor: '#f8fafc',
                                '&:hover': {
                                  backgroundColor: '#f1f5f9'
                                },
                                '&.Mui-focused': {
                                  backgroundColor: 'white'
                                }
                              }
                            }}
                          />
                        </Box>
                      </Paper>
                    </motion.div>

                    {/* 質問タイプ設定 */}
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 3 * 0.1 }}
                    >
                      <Paper
                        elevation={3}
                        sx={{
                          p: 4,
                          borderRadius: 3,
                          background: 'rgba(255, 255, 255, 0.95)',
                          backdropFilter: 'blur(10px)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)'
                          },
                          transition: 'all 0.3s ease'
                        }}
                      >
                        {/* カテゴリヘッダー */}
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                          <Box
                            sx={{
                              width: 48,
                              height: 48,
                              borderRadius: 3,
                              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              mr: 3
                            }}
                          >
                            <Quiz sx={{ color: 'white', fontSize: '1.5rem' }} />
                          </Box>
                          <Box>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a202c', mb: 0.5 }}>
                              質問タイプ設定
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#6b7280' }}>
                              利用可能な質問タイプの設定
                            </Typography>
                          </Box>
                        </Box>

                        {/* 設定項目 */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          {[
                            { label: '短文テキスト', icon: <TextFields /> },
                            { label: '長文テキスト', icon: <Description /> },
                            { label: '単一選択', icon: <RadioButtonChecked /> },
                            { label: '複数選択', icon: <CheckBox /> },
                            { label: 'リニアスケール', icon: <LinearScale /> },
                            { label: 'プルダウン', icon: <ExpandMoreIcon /> }
                          ].map((item, index) => (
                            <Box
                              key={index}
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                p: 2.5,
                                borderRadius: 2,
                                backgroundColor: 'rgba(248, 250, 252, 0.8)',
                                border: '1px solid rgba(226, 232, 240, 0.6)',
                                '&:hover': {
                                  backgroundColor: 'rgba(245, 158, 11, 0.04)',
                                  borderColor: 'rgba(245, 158, 11, 0.2)'
                                },
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                {React.cloneElement(item.icon, { sx: { mr: 2, color: '#f59e0b' } })}
                                <Typography variant="body2" sx={{ fontWeight: 600, color: '#374151' }}>
                                  {item.label}
                                </Typography>
                              </Box>
                              <Switch
                                defaultChecked={true}
                                size="small"
                                sx={{
                                  '& .MuiSwitch-switchBase.Mui-checked': {
                                    color: '#f59e0b'
                                  },
                                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                    backgroundColor: '#f59e0b'
                                  }
                                }}
                              />
                            </Box>
                          ))}
                        </Box>
                      </Paper>
                    </motion.div>
                  </Box>
                </Box>
              ) : (
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
                        background: selectedPage?.id === 'login' 
                          ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                          : selectedPage?.id === 'completion'
                          ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
                          : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
                      }}
                    >
                      {selectedPage ? (
                        <Box
                          sx={{
                            textAlign: 'center',
                            width: '100%',
                            maxWidth: previewMode === 'mobile' ? 300 : 600
                          }}
                        >
                          <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                            <Box sx={{
                              width: 48,
                              height: 48,
                              borderRadius: 2,
                              background: selectedPage.type === 'system' 
                                ? 'rgba(255, 255, 255, 0.2)'
                                : 'linear-gradient(135deg, #5e17eb 0%, #764ba2 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
                            }}>
                              {React.cloneElement(selectedPage.icon, { 
                                sx: { color: 'white', fontSize: '1.5rem' } 
                              })}
                            </Box>
                            <Typography
                              variant={previewMode === 'mobile' ? 'h5' : 'h4'}
                              sx={{
                                fontWeight: 700,
                                color: selectedPage.type === 'system' ? 'white' : '#1a202c'
                              }}
                            >
                              {selectedPage.title}
                            </Typography>
                          </Box>

                          {/* ページ固有のコンテンツ */}
                          {selectedPage.id === 'login' && (
                            <Paper
                              sx={{
                                p: previewMode === 'mobile' ? 3 : 4,
                                borderRadius: 3,
                                width: '100%',
                                background: 'rgba(255, 255, 255, 0.95)',
                                backdropFilter: 'blur(10px)',
                                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                              }}
                            >
                              <Typography variant="h5" sx={{ mb: 3, fontWeight: 700, textAlign: 'center', color: '#1a202c' }}>
                                ログイン
                              </Typography>
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                                <Box>
                                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: '#374151' }}>
                                    メールアドレス
                                  </Typography>
                                  <Box sx={{ width: '100%', height: 44, background: '#f3f4f6', borderRadius: 1, border: '1px solid #d1d5db' }} />
                                </Box>
                                <Box>
                                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: '#374151' }}>
                                    パスワード
                                  </Typography>
                                  <Box sx={{ width: '100%', height: 44, background: '#f3f4f6', borderRadius: 1, border: '1px solid #d1d5db' }} />
                                </Box>
                                <Box sx={{ width: '100%', height: 48, background: 'linear-gradient(135deg, #5e17eb 0%, #764ba2 100%)', borderRadius: 1.5, mt: 1 }} />
                              </Box>
                            </Paper>
                          )}
                          
                          {selectedPage.id === 'completion' && (
                            <Paper
                              sx={{
                                p: previewMode === 'mobile' ? 3 : 4,
                                borderRadius: 3,
                                width: '100%',
                                background: 'rgba(255, 255, 255, 0.95)',
                                backdropFilter: 'blur(10px)',
                                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                                textAlign: 'center'
                              }}
                            >
                              <Box sx={{ mb: 3 }}>
                                <CheckCircle sx={{ fontSize: '4rem', color: '#22c55e', mb: 2 }} />
                                <Typography variant="h5" sx={{ fontWeight: 700, color: '#1a202c', mb: 1 }}>
                                  回答ありがとうございました！
                                </Typography>
                                <Typography variant="body1" sx={{ color: '#6b7280' }}>
                                  お答えいただいた内容を確認し、後日回答いたします。
                                </Typography>
                              </Box>
                              <Box sx={{ width: '100%', height: 48, background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', borderRadius: 1.5 }} />
                            </Paper>
                          )}
                          
                          {selectedPage.type === 'question' && (
                            <Paper
                              sx={{
                                p: previewMode === 'mobile' ? 3 : 4,
                                borderRadius: 3,
                                width: '100%',
                                background: 'rgba(255, 255, 255, 0.95)',
                                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                              }}
                            >
                              <Typography variant="body2" sx={{ mb: 2, color: '#6b7280', textAlign: 'center' }}>
                                {selectedPage.questions}個の質問が含まれています
                              </Typography>
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                <Box>
                                  <Typography variant="body1" sx={{ mb: 1.5, fontWeight: 600, color: '#1a202c' }}>
                                    お名前をお聞かせください
                                  </Typography>
                                  <Box sx={{ width: '100%', height: 44, background: '#f3f4f6', borderRadius: 1, border: '1px solid #d1d5db' }} />
                                </Box>
                                <Box>
                                  <Typography variant="body1" sx={{ mb: 1.5, fontWeight: 600, color: '#1a202c' }}>
                                    満足度を教えてください
                                  </Typography>
                                  <Box sx={{ display: 'flex', gap: 1 }}>
                                    {[1,2,3,4,5].map(i => (
                                      <Box key={i} sx={{ width: 40, height: 40, background: i <= 3 ? '#5e17eb' : '#e5e7eb', borderRadius: 1 }} />
                                    ))}
                                  </Box>
                                </Box>
                                <Box>
                                  <Typography variant="body1" sx={{ mb: 1.5, fontWeight: 600, color: '#1a202c' }}>
                                    ご意見・ご要望
                                  </Typography>
                                  <Box sx={{ width: '100%', height: 80, background: '#f3f4f6', borderRadius: 1, border: '1px solid #d1d5db' }} />
                                </Box>
                              </Box>
                            </Paper>
                          )}
                        </Box>
                      ) : (
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
                            ページを選択してプレビューを表示
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Paper>
                </motion.div>
                </Box>
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