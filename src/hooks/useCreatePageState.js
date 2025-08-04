import { useState, useEffect } from 'react';

// CreatePageの状態管理をまとめるカスタムフック
export const useCreatePageState = () => {
  // ツール・プレビュー関連
  const [selectedTool, setSelectedTool] = useState(null);
  const [previewMode, setPreviewMode] = useState('mobile'); // 'mobile' or 'desktop'
  const [zoom, setZoom] = useState(0.7); // ズーム倍率（モバイルデフォルト70%）
  
  // プレビューモードが変更されたときにズームを調整
  useEffect(() => {
    if (previewMode === 'mobile') {
      setZoom(0.7); // モバイル: 70%
    } else {
      setZoom(0.5); // PC: 50%
    }
  }, [previewMode]);
  
  // テンプレート関連
  const [expandedTemplates, setExpandedTemplates] = useState({}); // テンプレートの展開状態
  
  // ページ管理関連
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
  
  // 設定・UI関連
  const [showSettings, setShowSettings] = useState(false); // 設定画面表示状態
  const [activeSection, setActiveSection] = useState('all'); // アクティブな設定セクション
  const [projectTitle, setProjectTitle] = useState('OpenReview フォーム'); // プロジェクトタイトル
  const [isEditingTitle, setIsEditingTitle] = useState(false); // タイトル編集状態
  const [showColorPicker, setShowColorPicker] = useState(false); // カラーピッカー表示状態
  const [selectedColor, setSelectedColor] = useState('#5e17eb'); // 選択されたテーマカラー
  const [isPublished, setIsPublished] = useState(true); // 公開状態
  const [projectDescription, setProjectDescription] = useState(''); // プロジェクト説明
  const [selectedFont, setSelectedFont] = useState('Inter'); // 選択されたフォント
  const [logoPreview, setLogoPreview] = useState(null); // ロゴプレビュー
  const [pageErrorHighlight, setPageErrorHighlight] = useState(null); // ページエラーハイライト
  const [questionErrorHighlight, setQuestionErrorHighlight] = useState(null); // 質問エラーハイライト
  const [loginErrorHighlight, setLoginErrorHighlight] = useState(null); // ログインエラーハイライト

  return {
    // ツール・プレビュー関連
    selectedTool,
    setSelectedTool,
    previewMode,
    setPreviewMode,
    zoom,
    setZoom,
    
    // テンプレート関連
    expandedTemplates,
    setExpandedTemplates,
    
    // ページ管理関連
    showPageManager,
    setShowPageManager,
    draggedPage,
    setDraggedPage,
    deleteMode,
    setDeleteMode,
    showDeleteConfirm,
    setShowDeleteConfirm,
    pageToDelete,
    setPageToDelete,
    sortingAnimation,
    setSortingAnimation,
    dropIndicator,
    setDropIndicator,
    selectedPage,
    setSelectedPage,
    editingPageId,
    setEditingPageId,
    editingTitle,
    setEditingTitle,
    
    // 設定・UI関連
    showSettings,
    setShowSettings,
    activeSection,
    setActiveSection,
    projectTitle,
    setProjectTitle,
    isEditingTitle,
    setIsEditingTitle,
    showColorPicker,
    setShowColorPicker,
    selectedColor,
    setSelectedColor,
    isPublished,
    setIsPublished,
    projectDescription,
    setProjectDescription,
    selectedFont,
    setSelectedFont,
    logoPreview,
    setLogoPreview,
    pageErrorHighlight,
    setPageErrorHighlight,
    questionErrorHighlight,
    setQuestionErrorHighlight,
    loginErrorHighlight,
    setLoginErrorHighlight
  };
};