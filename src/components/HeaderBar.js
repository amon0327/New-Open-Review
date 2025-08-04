import React, { useState } from 'react';
import toast from 'react-hot-toast';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Tooltip,
  Input,
  Badge,
  Popover,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogContent,
  Button,
  Divider,
  Chip
} from '@mui/material';
import {
  Preview,
  Rocket,
  Sync,
  ErrorOutline,
  WarningAmber,
  CheckCircle,
  Close,
  CheckCircleOutline,
  Public,
  CloudDone
} from '@mui/icons-material';
import { colors, glassPaperStyles, iconButtonStyles } from '../constants/theme';
import PreviewUrlDialog from './PreviewUrlDialog';
import { validateForm } from '../utils/validation';

const HeaderBar = ({
  isEditingTitle,
  projectTitle,
  setProjectTitle,
  setIsEditingTitle,
  // Supabase連携用のprops
  onProjectTitleUpdate,
  // 保存状態の表示用
  isSaving = false,
  // フォームID
  formId,
  // 検証用のフォームデータ
  formData = {},
  // 設定メニューを開くコールバック関数
  onOpenDesignSettings,
  onOpenLoginSettings,
  onOpenCompletionSettings,
  onOpenSettings,
  // 質問選択用のコールバック関数
  onQuestionSelect,
  // エラーハイライト用のコールバック関数
  onHighlightElement,
  // ページナビゲーション用のコールバック関数
  onNavigateToPage,
  onShowPageError,
  // 質問エラー表示用のコールバック関数
  onShowQuestionError,
  // ログイン画面ナビゲーション用のコールバック関数
  onNavigateToLoginScreen,
  onShowLoginError,
  // 完了画面ナビゲーション用のコールバック関数
  onNavigateToCompletionScreen,
  onShowCompletionError,
}) => {
  // デバウンス用のタイムアウト
  const [debounceTimeout, setDebounceTimeout] = React.useState(null);
  // プレビューダイアログの状態
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  // 公開確認ダイアログの状態
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [errorCheckProgress, setErrorCheckProgress] = useState(0);
  const [errorCheckItems, setErrorCheckItems] = useState([]);
  const [isErrorChecking, setIsErrorChecking] = useState(false);
  // 公開済みアラートの状態
  const [showPublishedAlert, setShowPublishedAlert] = useState(false);
  // 公開状態（propsから受け取るか、独自に管理）
  const [isPublished, setIsPublished] = useState(false);
  // エラー・警告ポップオーバーの状態
  const [errorAnchorEl, setErrorAnchorEl] = useState(null);
  const [warningAnchorEl, setWarningAnchorEl] = useState(null);

  // フォーム検証の実行
  const validationData = {
    projectTitle,
    ...formData
  };
  
  const { errors, warnings } = validateForm(validationData);

  const errorCount = errors.length;
  const warningCount = warnings.length;

  const handleErrorClick = (event) => {
    setErrorAnchorEl(event.currentTarget);
  };

  const handleWarningClick = (event) => {
    setWarningAnchorEl(event.currentTarget);
  };

  const handleErrorClose = () => {
    setErrorAnchorEl(null);
  };

  const handleWarningClose = () => {
    setWarningAnchorEl(null);
  };

  const handleErrorItemClick = (error) => {
    // エラー項目がクリックされた時の処理
    console.log('🔴 HeaderBar - エラー項目がクリックされました:', error);
    console.log('🔴 HeaderBar - エラーアクション評価:', {
      action: error.action,
      isNavigateToPage: error.action === 'navigateToPage' && error.pageId,
      isNavigateToLoginScreen: error.action === 'navigateToLoginScreen',
      isOpenCompletionSettings: error.action === 'openCompletionSettings',
      hasQuestionId: !!error.questionId
    });
    setErrorAnchorEl(null); // ポップオーバーを閉じる
    
    // ページエラーの場合は特別処理
    if (error.action === 'navigateToPage' && error.pageId) {
      // ページに遷移してエラー表示
      if (onNavigateToPage) {
        onNavigateToPage(error.pageId);
      }
      if (onShowPageError) {
        onShowPageError(error.pageId);
      }
    }
    // ログイン画面エラーの場合は特別処理
    else if (error.action === 'navigateToLoginScreen') {
      console.log('🔴 HeaderBar - ログイン画面エラー処理開始:', { errorId: error.id, fieldType: error.fieldType });
      if (onNavigateToLoginScreen) {
        console.log('🔴 HeaderBar - ログイン画面に遷移中...');
        onNavigateToLoginScreen(error.fieldType);
      }
      if (onShowLoginError) {
        console.log('🔴 HeaderBar - ログインエラーハイライト設定中...');
        onShowLoginError(error.id, error.fieldType);
      }
    }
    // 完了画面エラーの場合は特別処理
    else if (error.action === 'openCompletionSettings') {
      console.log('🔴 HeaderBar - 完了画面エラー処理開始:', { errorId: error.id, fieldType: error.fieldType });
      if (onNavigateToCompletionScreen) {
        console.log('🔴 HeaderBar - 完了画面に遷移中...');
        onNavigateToCompletionScreen(error.fieldType);
      }
      if (onShowCompletionError) {
        console.log('🔴 HeaderBar - 完了画面エラーハイライト設定中...');
        onShowCompletionError(error.id, error.fieldType);
      }
    }
    // 質問エラーの場合は特別処理
    else if (error.questionId) {
      // 質問を選択してハイライト
      if (onQuestionSelect) {
        onQuestionSelect(error.questionId);
      }
      if (onHighlightElement) {
        onHighlightElement({
          elementType: 'question',
          questionId: error.questionId
        });
      }
      // 質問設定でのフィールドエラー表示
      if (onShowQuestionError) {
        onShowQuestionError(error.questionId, error.id, error.choiceIndex, error.labelType);
      }
    }
    // それ以外のエラーは何もしない
  };

  const handleWarningItemClick = (warning) => {
    // 警告項目がクリックされた時の処理
    setWarningAnchorEl(null); // ポップオーバーを閉じる
    
    // 質問関連の警告の場合は質問を選択とハイライト
    if (warning.questionId && onQuestionSelect) {
      onQuestionSelect(warning.questionId);
      // プレビュー画面で質問をハイライト
      if (onHighlightElement) {
        onHighlightElement({
          elementType: 'question',
          questionId: warning.questionId
        });
      }
    }
    
    // 警告クリック時の遷移を無効化
    // 何もしない
  };

  const handlePreviewClick = () => {
    console.log('🔍 プレビューボタンがクリックされました');
    
    // エラーがある場合はプレビューを阻止し、エラー解決を促すメッセージを表示
    if (errorCount > 0) {
      // react-hot-toastで中央下にエラーメッセージを表示
      toast.error('エラーを解決してからプレビューが可能です', {
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
        iconTheme: {
          primary: '#ef4444',
          secondary: '#ffffff',
        },
      });
      return;
    }
    
    console.log('✅ プレビューダイアログを表示します');
    setShowPreviewDialog(true);
  };

  const handlePublishClick = async () => {
    console.log('🚀 公開ボタンがクリックされました');
    
    // すでに公開済みの場合は公開済みアラートを表示
    if (isPublished) {
      setShowPublishedAlert(true);
      return;
    }
    
    // エラーがある場合は公開を阻止し、モダンなダイアログで表示
    if (errorCount > 0) {
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
      // Supabaseのis_publishedをtrueに更新
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
      
      setShowPublishDialog(false);
      setIsPublished(true); // 公開状態を更新
      
      // 成功トースト
      toast.success('フォームを公開しました', {
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
  };
  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setProjectTitle(newTitle);

    // 既存のタイムアウトをクリア
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    // 500ms後にSupabaseに保存
    const timeout = setTimeout(async () => {
      if (onProjectTitleUpdate) {
        try {
          await onProjectTitleUpdate(newTitle);
        } catch (error) {
          console.error('Project title update error:', error);
        }
      }
    }, 500);

    setDebounceTimeout(timeout);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      setIsEditingTitle(false);
    } else if (e.key === 'Escape') {
      setProjectTitle('OpenReview フォーム');
      setIsEditingTitle(false);
    }
  };

  const handleBlur = async () => {
    setIsEditingTitle(false);
    // ブラー時にも即座に保存
    if (onProjectTitleUpdate && debounceTimeout) {
      clearTimeout(debounceTimeout);
      try {
        await onProjectTitleUpdate(projectTitle);
      } catch (error) {
        console.error('Project title update error:', error);
      }
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        height: 65,
        background: glassPaperStyles.background,
        backdropFilter: glassPaperStyles.backdropFilter,
        borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
        borderRadius: 0,
        display: 'flex',
        alignItems: 'center',
        px: 2,
        justifyContent: 'space-between'
      }}
    >
      {/* ヘッダー左側 - プロジェクトタイトル */}
      {isEditingTitle ? (
        <Input
          value={projectTitle}
          onChange={handleTitleChange}
          onBlur={handleBlur}
          onKeyPress={handleKeyPress}
          autoFocus
          sx={{
            fontSize: '1.5rem',
            fontWeight: 700,
            color: colors.textPrimary,
            minWidth: 200,
            '&:before': {
              borderBottom: `2px solid ${colors.primary}`
            },
            '&:after': {
              borderBottom: `2px solid ${colors.primary}`
            }
          }}
        />
      ) : (
        <Typography
          variant="h5"
          onClick={() => setIsEditingTitle(true)}
          sx={{
            color: colors.textPrimary,
            fontWeight: 700,
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: 1,
            '&:hover': {
              backgroundColor: 'rgba(94, 23, 235, 0.05)',
              color: colors.primary
            },
            transition: 'all 0.2s ease'
          }}
        >
          {projectTitle}
        </Typography>
      )}

      {/* ヘッダー右側のアクションボタン */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {/* 保存状態インジケーター */}
        {isSaving && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 2 }}>
            <Sync 
              sx={{ 
                color: '#5E17EB', 
                fontSize: '1rem',
                animation: 'rotate 1s linear infinite',
                '@keyframes rotate': {
                  '0%': { transform: 'rotate(0deg)' },
                  '100%': { transform: 'rotate(360deg)' }
                }
              }} 
            />
            <Typography 
              variant="caption" 
              sx={{ 
                color: '#5E17EB', 
                fontSize: '0.75rem',
                fontWeight: 500
              }}
            >
              保存中...
            </Typography>
          </Box>
        )}

        {/* エラー・警告表示 */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 1 }}>
          {/* エラー件数 */}
          <Tooltip title={errorCount > 0 ? `${errorCount}件のエラーがあります` : 'エラーチェック完了'}>
            <Box
              onClick={handleErrorClick}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.75,
                px: 1,
                py: 0.5,
                borderRadius: 1.5,
                cursor: 'pointer',
                backgroundColor: errorCount > 0 ? 'rgba(239, 68, 68, 0.05)' : 'rgba(16, 185, 129, 0.08)',
                border: `1px solid ${errorCount > 0 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.25)'}`,
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: errorCount > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.12)',
                  borderColor: errorCount > 0 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.35)'
                }
              }}
            >
              <ErrorOutline sx={{ color: errorCount > 0 ? '#ef4444' : '#10b981', fontSize: '1rem' }} />
              
              <Box
                sx={{
                  backgroundColor: errorCount > 0 ? '#ef4444' : '#10b981',
                  color: 'white',
                  borderRadius: '50%',
                  width: 18,
                  height: 18,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  minWidth: 18
                }}
              >
                {errorCount > 99 ? '99+' : errorCount}
              </Box>
            </Box>
          </Tooltip>

          {/* 警告件数 */}
          <Tooltip title={warningCount > 0 ? `${warningCount}件の警告があります` : '警告チェック完了'}>
            <Box
              onClick={handleWarningClick}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.75,
                px: 1,
                py: 0.5,
                borderRadius: 1.5,
                cursor: 'pointer',
                backgroundColor: warningCount > 0 ? 'rgba(245, 158, 11, 0.05)' : 'rgba(16, 185, 129, 0.08)',
                border: `1px solid ${warningCount > 0 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.25)'}`,
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: warningCount > 0 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.12)',
                  borderColor: warningCount > 0 ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.35)'
                }
              }}
            >
              <WarningAmber sx={{ color: warningCount > 0 ? '#f59e0b' : '#10b981', fontSize: '1rem' }} />
              
              <Box
                sx={{
                  backgroundColor: warningCount > 0 ? '#f59e0b' : '#10b981',
                  color: 'white',
                  borderRadius: '50%',
                  width: 18,
                  height: 18,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  minWidth: 18
                }}
              >
                {warningCount > 99 ? '99+' : warningCount}
              </Box>
            </Box>
          </Tooltip>
        </Box>
        
        <Tooltip title="プレビュー">
          <IconButton 
            onClick={handlePreviewClick}
            sx={iconButtonStyles.secondary}
          >
            <Preview />
          </IconButton>
        </Tooltip>
        
        <Tooltip title={isPublished ? "公開中" : "公開"}>
          <IconButton 
            onClick={handlePublishClick}
            sx={iconButtonStyles.secondary}
          >
            <Rocket sx={{ color: isPublished ? '#22c55e' : 'inherit' }} />
          </IconButton>
        </Tooltip>
        
        {/* スペース確保用の空要素 */}
        <Box sx={{ width: 18 }} />
      </Box>

      {/* プレビューURLダイアログ */}
      <PreviewUrlDialog
        open={showPreviewDialog}
        onClose={() => setShowPreviewDialog(false)}
        formId={formId}
      />


      {/* 公開確認・エラー通知共通ダイアログ */}
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
                            (errorCount > 0 
                              ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%)'
                              : 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #ff6b6b 100%)'),
            backgroundOrigin: 'border-box',
            backgroundClip: 'content-box, border-box',
            boxShadow: errorCount > 0 
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
              background: errorCount > 0 
                ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(220, 38, 38, 0.08) 50%, rgba(185, 28, 28, 0.08) 100%)'
                : 'linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 50%, rgba(255, 107, 107, 0.08) 100%)',
              color: '#374151',
              mb: 0,
              minHeight: 360, // ボタンエリアも含めた固定高さを設定
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
                background: errorCount > 0 
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
                    background: errorCount > 0
                      ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.15) 50%, rgba(185, 28, 28, 0.15) 100%)'
                      : 'linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 50%, rgba(255, 107, 107, 0.15) 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 32px auto',
                    fontSize: '2.8rem',
                    boxShadow: errorCount > 0
                      ? '0 12px 32px rgba(239, 68, 68, 0.2)'
                      : '0 12px 32px rgba(102, 126, 234, 0.2)',
                    animation: 'pulse 2s ease-in-out infinite',
                    '@keyframes pulse': {
                      '0%, 100%': { transform: 'scale(1)' },
                      '50%': { transform: 'scale(1.05)' }
                    }
                  }}
                >
                  {errorCount > 0 ? '⚠️' : '🚀'}
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
                      background: errorCount > 0
                        ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%)'
                        : 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #ff6b6b 100%)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      textShadow: 'none'
                    }}
                  >
                    {errorCount > 0 ? 'エラーの解決が必要です' : 'フォームを公開しますか？'}
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      color: '#6b7280',
                      fontSize: '1.1rem',
                      lineHeight: 1.6,
                      fontWeight: 500,
                      mb: errorCount > 0 ? 2 : 0
                    }}
                  >
                    {errorCount > 0 
                      ? `${errorCount}件のエラーがあります。\nエラーを解決してから公開してください。`
                      : '公開すると質問の追加や変更など\n編集できなくなります。\nよろしいですか？'
                    }
                  </Typography>
                </>
              )}
            
              {/* レビューフォーム エラーチェック中のモダンな抽象UI */}
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
                    margin: '0 auto',
                    position: 'relative'
                  }}
                >
                  {/* レビューフォームチェック表示 */}
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

                  {/* 大型コンテナの循環チェック表現 */}
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 2,
                      width: '100%',
                      maxWidth: 320,
                      mb: 3
                    }}
                  >
                    {/* 循環チェック用の大型コンテナ */}
                    {Array.from({ length: 4 }, (_, index) => (
                      <Box
                        key={index}
                        sx={{
                          width: '100%',
                          height: 32,
                          borderRadius: 16,
                          border: '2px solid rgba(0, 0, 0, 0.08)',
                          background: 'rgba(255, 255, 255, 0.8)',
                          backdropFilter: 'blur(12px)',
                          position: 'relative',
                          overflow: 'hidden',
                          animation: `cycleCheck 4s ease-in-out infinite ${index * 1}s`,
                          '@keyframes cycleCheck': {
                            '0%': { 
                              borderColor: 'rgba(0, 0, 0, 0.08)',
                              background: 'rgba(255, 255, 255, 0.8)',
                              transform: 'scale(1)',
                              boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)'
                            },
                            '20%': { 
                              borderColor: 'rgba(102, 126, 234, 0.4)',
                              background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.08) 50%, rgba(255, 107, 107, 0.08) 100%)',
                              transform: 'scale(1.02)',
                              boxShadow: '0 8px 24px rgba(102, 126, 234, 0.2)'
                            },
                            '40%': { 
                              borderColor: 'rgba(102, 126, 234, 0.6)',
                              background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.12) 50%, rgba(255, 107, 107, 0.1) 100%)',
                              transform: 'scale(1.04)',
                              boxShadow: '0 12px 32px rgba(102, 126, 234, 0.25)'
                            },
                            '60%': { 
                              borderColor: 'rgba(118, 75, 162, 0.6)',
                              background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.12) 0%, rgba(118, 75, 162, 0.15) 50%, rgba(255, 107, 107, 0.12) 100%)',
                              transform: 'scale(1.02)',
                              boxShadow: '0 8px 28px rgba(118, 75, 162, 0.2)'
                            },
                            '80%': { 
                              borderColor: 'rgba(255, 107, 107, 0.6)',
                              background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.1) 50%, rgba(255, 107, 107, 0.12) 100%)',
                              transform: 'scale(1)',
                              boxShadow: '0 4px 16px rgba(255, 107, 107, 0.15)'
                            },
                            '90%': { 
                              borderColor: 'rgba(34, 197, 94, 0.8)',
                              background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, rgba(22, 163, 74, 0.08) 100%)',
                              transform: 'scale(1)',
                              boxShadow: '0 4px 16px rgba(34, 197, 94, 0.15)'
                            },
                            '100%': { 
                              borderColor: 'rgba(34, 197, 94, 0.8)',
                              background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, rgba(22, 163, 74, 0.08) 100%)',
                              transform: 'scale(1)',
                              boxShadow: '0 4px 16px rgba(34, 197, 94, 0.15)'
                            }
                          }
                        }}
                      >
                        {/* コンテナラベル */}
                        <Typography
                          variant="caption"
                          sx={{
                            position: 'absolute',
                            left: 12,
                            top: 4,
                            fontSize: '0.65rem',
                            color: 'rgba(0, 0, 0, 0.5)',
                            fontWeight: 600,
                            letterSpacing: '0.5px',
                            textTransform: 'uppercase',
                            animation: `labelFade 4s ease-in-out infinite ${index * 1}s`,
                            '@keyframes labelFade': {
                              '0%, 15%': { opacity: 0.3 },
                              '20%, 80%': { opacity: 0.8 },
                              '85%, 100%': { opacity: 0.3 }
                            }
                          }}
                        >
                          {index === 0 && 'フォーム設定'}
                          {index === 1 && '質問チェック'}
                          {index === 2 && 'ページ検証'}
                          {index === 3 && '公開準備'}
                        </Typography>

                        {/* 進捗表示バー */}
                        <Box
                          sx={{
                            position: 'absolute',
                            left: 12,
                            bottom: 8,
                            right: 50,
                            height: 3,
                            borderRadius: 2,
                            background: 'rgba(0, 0, 0, 0.08)',
                            overflow: 'hidden'
                          }}
                        >
                          <Box
                            sx={{
                              height: '100%',
                              width: '0%',
                              background: 'linear-gradient(90deg, rgba(102, 126, 234, 0.6) 0%, rgba(118, 75, 162, 0.8) 50%, rgba(34, 197, 94, 0.6) 100%)',
                              borderRadius: 2,
                              animation: `progressFill 4s ease-in-out infinite ${index * 1}s`,
                              '@keyframes progressFill': {
                                '0%': { 
                                  width: '0%',
                                  background: 'linear-gradient(90deg, rgba(102, 126, 234, 0.3) 0%, rgba(118, 75, 162, 0.3) 50%, rgba(255, 107, 107, 0.3) 100%)'
                                },
                                '20%': { 
                                  width: '25%',
                                  background: 'linear-gradient(90deg, rgba(102, 126, 234, 0.6) 0%, rgba(118, 75, 162, 0.5) 50%, rgba(255, 107, 107, 0.4) 100%)'
                                },
                                '40%': { 
                                  width: '60%',
                                  background: 'linear-gradient(90deg, rgba(102, 126, 234, 0.7) 0%, rgba(118, 75, 162, 0.8) 50%, rgba(255, 107, 107, 0.6) 100%)'
                                },
                                '60%': { 
                                  width: '85%',
                                  background: 'linear-gradient(90deg, rgba(102, 126, 234, 0.6) 0%, rgba(118, 75, 162, 0.7) 50%, rgba(255, 107, 107, 0.8) 100%)'
                                },
                                '80%': { 
                                  width: '100%',
                                  background: 'linear-gradient(90deg, rgba(102, 126, 234, 0.5) 0%, rgba(118, 75, 162, 0.6) 50%, rgba(255, 107, 107, 0.7) 100%)'
                                },
                                '90%': { 
                                  width: '100%',
                                  background: 'linear-gradient(90deg, rgba(34, 197, 94, 0.6) 0%, rgba(22, 163, 74, 0.6) 100%)'
                                },
                                '100%': { 
                                  width: '100%',
                                  background: 'linear-gradient(90deg, rgba(34, 197, 94, 0.6) 0%, rgba(22, 163, 74, 0.6) 100%)'
                                }
                              }
                            }}
                          />
                        </Box>

                        {/* チェック状態インジケーター */}
                        <Box
                          sx={{
                            position: 'absolute',
                            right: 12,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            border: '2px solid rgba(0, 0, 0, 0.15)',
                            background: 'rgba(255, 255, 255, 0.9)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            animation: `statusIndicator 4s ease-in-out infinite ${index * 1}s`,
                            '@keyframes statusIndicator': {
                              '0%, 15%': { 
                                borderColor: 'rgba(0, 0, 0, 0.15)',
                                background: 'rgba(255, 255, 255, 0.9)',
                                transform: 'translateY(-50%) scale(1)',
                                boxShadow: 'none'
                              },
                              '20%': { 
                                borderColor: 'rgba(102, 126, 234, 0.5)',
                                background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.08) 50%, rgba(255, 107, 107, 0.06) 100%)',
                                transform: 'translateY(-50%) scale(1.1)',
                                boxShadow: '0 2px 8px rgba(102, 126, 234, 0.2)'
                              },
                              '60%': { 
                                borderColor: 'rgba(118, 75, 162, 0.8)',
                                background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.15) 50%, rgba(255, 107, 107, 0.1) 100%)',
                                transform: 'translateY(-50%) scale(1.2)',
                                boxShadow: '0 4px 12px rgba(118, 75, 162, 0.25)'
                              },
                              '80%': { 
                                borderColor: 'rgba(255, 107, 107, 0.8)',
                                background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.1) 50%, rgba(255, 107, 107, 0.12) 100%)',
                                transform: 'translateY(-50%) scale(1)',
                                boxShadow: '0 2px 8px rgba(255, 107, 107, 0.2)'
                              },
                              '90%, 100%': { 
                                borderColor: 'rgba(34, 197, 94, 0.8)',
                                background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(22, 163, 74, 0.1) 100%)',
                                transform: 'translateY(-50%) scale(1)',
                                boxShadow: '0 2px 8px rgba(34, 197, 94, 0.2)'
                              }
                            }
                          }}
                        >
                          {/* 回転するローディング要素 */}
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              border: '1.5px solid transparent',
                              borderTop: '1.5px solid rgba(102, 126, 234, 0.8)',
                              borderRight: '1.5px solid rgba(118, 75, 162, 0.6)',
                              borderRadius: '50%',
                              opacity: 0,
                              animation: `loadingSpin 4s ease-in-out infinite ${index * 1}s`,
                              '@keyframes loadingSpin': {
                                '0%, 15%': { 
                                  opacity: 0,
                                  transform: 'rotate(0deg)',
                                  borderTop: '1.5px solid rgba(102, 126, 234, 0.8)'
                                },
                                '20%': { 
                                  opacity: 1,
                                  transform: 'rotate(90deg)',
                                  borderTop: '1.5px solid rgba(102, 126, 234, 0.8)'
                                },
                                '40%': { 
                                  opacity: 1,
                                  transform: 'rotate(270deg)',
                                  borderTop: '1.5px solid rgba(118, 75, 162, 0.8)'
                                },
                                '60%': { 
                                  opacity: 1,
                                  transform: 'rotate(450deg)',
                                  borderTop: '1.5px solid rgba(255, 107, 107, 0.8)'
                                },
                                '85%': { 
                                  opacity: 0,
                                  transform: 'rotate(540deg)'
                                },
                                '90%, 100%': { 
                                  opacity: 0,
                                  transform: 'rotate(540deg)'
                                }
                              }
                            }}
                          />
                          
                          {/* チェックマーク */}
                          <Box
                            sx={{
                              position: 'absolute',
                              width: 8,
                              height: 5,
                              opacity: 0,
                              animation: `checkComplete 4s ease-in-out infinite ${index < 3 ? index * 1 : 2.5}s`,
                              '@keyframes checkComplete': {
                                '0%, 75%': { opacity: 0 },
                                '85%': { 
                                  opacity: 1,
                                  transform: 'scale(1.2)'
                                },
                                '90%, 100%': { 
                                  opacity: 1,
                                  transform: 'scale(1)'
                                }
                              },
                              '&::before': {
                                content: '""',
                                position: 'absolute',
                                left: 0,
                                top: 2.5,
                                width: 3,
                                height: 1.2,
                                background: 'rgba(34, 197, 94, 0.9)',
                                borderRadius: '0.6px',
                                transform: 'rotate(45deg)',
                                transformOrigin: 'left bottom'
                              },
                              '&::after': {
                                content: '""',
                                position: 'absolute',
                                left: 2,
                                top: 1,
                                width: 5,
                                height: 1.2,
                                background: 'rgba(34, 197, 94, 0.9)',
                                borderRadius: '0.6px',
                                transform: 'rotate(-45deg)',
                                transformOrigin: 'left bottom'
                              }
                            }}
                          />
                        </Box>
                      </Box>
                    ))}
                  </Box>

                  {/* スキャン効果 */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 40,
                      left: '10%',
                      right: '10%',
                      height: 80,
                      background: 'linear-gradient(180deg, transparent 0%, rgba(102, 126, 234, 0.15) 45%, rgba(102, 126, 234, 0.25) 50%, rgba(102, 126, 234, 0.15) 55%, transparent 100%)',
                      animation: 'scanEffect 3s ease-in-out infinite',
                      '@keyframes scanEffect': {
                        '0%': { 
                          transform: 'translateY(-20px)',
                          opacity: 0
                        },
                        '20%': { 
                          opacity: 1
                        },
                        '80%': { 
                          opacity: 1
                        },
                        '100%': { 
                          transform: 'translateY(20px)',
                          opacity: 0
                        }
                      }
                    }}
                  />

                  {/* 浮遊する検証ポイント */}
                  {[0, 1, 2].map((index) => (
                    <Box
                      key={index}
                      sx={{
                        position: 'absolute',
                        width: 2,
                        height: 2,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        opacity: 0.4,
                        left: `${20 + index * 15}%`,
                        animation: `float 4s ease-in-out infinite ${index * 0.8}s`,
                        '@keyframes float': {
                          '0%, 100%': { 
                            transform: 'translateY(0px)',
                            opacity: 0.2
                          },
                          '50%': { 
                            transform: 'translateY(-20px)',
                            opacity: 0.8
                          }
                        }
                      }}
                    />
                  ))}
                </Box>
              )}
            
              {/* エラーがある場合の追加メッセージ */}
              {errorCount > 0 && (
                <Box
                  sx={{
                    mt: 3,
                    p: 3,
                    borderRadius: '12px',
                    background: 'rgba(239, 68, 68, 0.05)',
                    border: '1px solid rgba(239, 68, 68, 0.15)'
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#ef4444',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      textAlign: 'left'
                    }}
                  >
                    💡 エラーを確認するには：<br />
                    ヘッダーの赤いエラーカウンターをクリックしてください
                  </Typography>
                </Box>
              )}
            </Box>

            {/* ボタンエリア - エラーチェック中は非表示 */}
            {!isErrorChecking && (
              <Box
                sx={{
                  display: 'flex',
                  gap: 2,
                  justifyContent: 'center',
                  pt: 2
                }}
              >
                {errorCount > 0 ? (
                  // エラーがある場合は閉じるボタンのみ
                  <Button
                    onClick={handlePublishCancel}
                    variant="outlined"
                    sx={{
                      minWidth: 120,
                      height: 52,
                      borderRadius: '26px',
                      border: '2px solid rgba(239, 68, 68, 0.3)',
                      color: '#ef4444',
                      fontSize: '1rem',
                      fontWeight: 600,
                      textTransform: 'none',
                      backgroundColor: 'rgba(239, 68, 68, 0.05)',
                      '&:hover': {
                        border: '2px solid rgba(239, 68, 68, 0.4)',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        transform: 'translateY(-1px)'
                      }
                    }}
                  >
                    閉じる
                  </Button>
                ) : (
                  // エラーがない場合はキャンセルと公開ボタン
                  <>
                    <Button
                      onClick={handlePublishCancel}
                      variant="outlined"
                      sx={{
                        minWidth: 120,
                        height: 52,
                        borderRadius: '26px',
                        border: '2px solid rgba(107, 114, 128, 0.3)',
                        color: '#6b7280',
                        fontSize: '1rem',
                        fontWeight: 600,
                        textTransform: 'none',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(10px)',
                        '&:hover': {
                          border: '2px solid rgba(107, 114, 128, 0.4)',
                          backgroundColor: 'rgba(255, 255, 255, 0.15)',
                          transform: 'translateY(-1px)'
                        }
                      }}
                    >
                      キャンセル
                    </Button>
                    <Button
                      onClick={handlePublishConfirm}
                      variant="contained"
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
                        }
                      }}
                    >
                      公開する
                    </Button>
                  </>
                )}
              </Box>
            )}
          </Box>
        </DialogContent>
      </Dialog>

      {/* 公開済みアラートダイアログ */}
      <Dialog
        open={showPublishedAlert}
        onClose={() => setShowPublishedAlert(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '20px',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.95) 100%)',
            backdropFilter: 'blur(24px)',
            border: '2px solid transparent',
            backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.95) 100%), ' +
                            'linear-gradient(135deg, #22c55e 0%, #16a34a 50%, #15803d 100%)',
            backgroundOrigin: 'border-box',
            backgroundClip: 'content-box, border-box',
            boxShadow: '0 32px 80px rgba(34, 197, 94, 0.25)',
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
              background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, rgba(22, 163, 74, 0.08) 50%, rgba(21, 128, 61, 0.08) 100%)',
              color: '#374151',
              mb: 0,
              minHeight: 300,
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
                background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.03) 0%, rgba(22, 163, 74, 0.03) 50%, rgba(21, 128, 61, 0.03) 100%)',
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
              {/* 公開中アイコン */}
              <Box
                sx={{
                  width: 88,
                  height: 88,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(22, 163, 74, 0.15) 50%, rgba(21, 128, 61, 0.15) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 32px auto',
                  fontSize: '2.8rem',
                  boxShadow: '0 12px 32px rgba(34, 197, 94, 0.2)',
                  animation: 'pulse 2s ease-in-out infinite',
                  '@keyframes pulse': {
                    '0%, 100%': { transform: 'scale(1)' },
                    '50%': { transform: 'scale(1.05)' }
                  }
                }}
              >
                <CloudDone sx={{ fontSize: '2.8rem', color: '#22c55e' }} />
              </Box>

              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  mb: 2,
                  fontSize: '1.8rem',
                  background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 50%, #15803d 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: 'none'
                }}
              >
                フォーム公開中
              </Typography>
              
              <Typography
                variant="body1"
                sx={{
                  color: '#6b7280',
                  fontSize: '1.1rem',
                  lineHeight: 1.6,
                  fontWeight: 500,
                  mb: 2
                }}
              >
                このフォームはすでに公開されており、
                <br />
                ユーザーが回答できる状態です。
              </Typography>
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
                onClick={() => setShowPublishedAlert(false)}
                variant="contained"
                sx={{
                  minWidth: 120,
                  height: 52,
                  borderRadius: '26px',
                  background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                  color: 'white',
                  fontSize: '1rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  boxShadow: '0 8px 24px rgba(34, 197, 94, 0.4)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                    boxShadow: '0 12px 32px rgba(34, 197, 94, 0.5)',
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                確認
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      {/* エラー詳細ポップオーバー */}
      <Popover
        open={Boolean(errorAnchorEl)}
        anchorEl={errorAnchorEl}
        onClose={handleErrorClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
            border: '1px solid #f3f4f6',
            mt: 1,
            maxWidth: 400,
            minWidth: 300
          }
        }}
      >
        <Box sx={{ p: 2, borderBottom: '1px solid #f3f4f6' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ErrorOutline sx={{ color: '#ef4444', fontSize: '1.1rem' }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#374151' }}>
              エラー ({errorCount}件)
            </Typography>
          </Box>
        </Box>
        <List sx={{ 
          p: 0, 
          maxHeight: 300, 
          overflow: 'auto',
          '&::-webkit-scrollbar': {
            display: 'none'
          },
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}>
          {errors.map((error, index) => (
            <ListItem
              key={error.id}
              onClick={() => handleErrorItemClick(error)}
              sx={{
                borderBottom: index < errors.length - 1 ? '1px solid #f9fafb' : 'none',
                '&:hover': { backgroundColor: '#fef2f2' },
                cursor: 'pointer',
                px: 2,
                py: 1.5
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <ErrorOutline sx={{ color: '#ef4444', fontSize: '1rem' }} />
              </ListItemIcon>
              <ListItemText
                primary={error.message}
                secondary={error.location}
                primaryTypographyProps={{
                  sx: { fontWeight: 500, color: '#374151', fontSize: '0.85rem', lineHeight: 1.4 }
                }}
                secondaryTypographyProps={{
                  sx: { color: '#6b7280', fontSize: '0.75rem', mt: 0.25 }
                }}
              />
            </ListItem>
          ))}
        </List>
      </Popover>

      {/* 警告詳細ポップオーバー */}
      <Popover
        open={Boolean(warningAnchorEl)}
        anchorEl={warningAnchorEl}
        onClose={handleWarningClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
            border: '1px solid #f3f4f6',
            mt: 1,
            maxWidth: 400,
            minWidth: 300
          }
        }}
      >
        <Box sx={{ p: 2, borderBottom: '1px solid #f3f4f6' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WarningAmber sx={{ color: '#f59e0b', fontSize: '1.1rem' }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#374151' }}>
              警告 ({warningCount}件)
            </Typography>
          </Box>
        </Box>
        <List sx={{ 
          p: 0, 
          maxHeight: 300, 
          overflow: 'auto',
          '&::-webkit-scrollbar': {
            display: 'none'
          },
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}>
          {warnings.map((warning, index) => (
            <ListItem
              key={warning.id}
              onClick={() => handleWarningItemClick(warning)}
              sx={{
                borderBottom: index < warnings.length - 1 ? '1px solid #f9fafb' : 'none',
                '&:hover': { backgroundColor: '#fffbeb' },
                cursor: 'pointer',
                px: 2,
                py: 1.5
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <WarningAmber sx={{ color: '#f59e0b', fontSize: '1rem' }} />
              </ListItemIcon>
              <ListItemText
                primary={warning.message}
                secondary={warning.location}
                primaryTypographyProps={{
                  sx: { fontWeight: 500, color: '#374151', fontSize: '0.85rem', lineHeight: 1.4 }
                }}
                secondaryTypographyProps={{
                  sx: { color: '#6b7280', fontSize: '0.75rem', mt: 0.25 }
                }}
              />
            </ListItem>
          ))}
        </List>
      </Popover>
    </Paper>
  );
};

export default HeaderBar;