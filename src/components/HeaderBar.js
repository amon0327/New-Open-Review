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
  CheckCircleOutline
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
  const [showErrorCheckDialog, setShowErrorCheckDialog] = useState(false);
  const [errorCheckProgress, setErrorCheckProgress] = useState(0);
  const [errorCheckItems, setErrorCheckItems] = useState([]);
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
    
    // エラーがある場合は公開を阻止し、エラー解決を促すメッセージを表示
    if (errorCount > 0) {
      // react-hot-toastで中央下にエラーメッセージを表示
      toast.error('エラーを解決してから公開が可能です', {
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
    
    // エラーがない場合は最終チェックを実行
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
    setShowErrorCheckDialog(true);
    
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
        
        // チェック完了後、少し待ってから確認ダイアログを表示
        setTimeout(() => {
          setShowErrorCheckDialog(false);
          setShowPublishDialog(true);
        }, 800);
      }
    }, 400);
  };

  const handlePublishConfirm = () => {
    console.log('✅ 公開処理を実行します');
    setShowPublishDialog(false);
    
    // 公開処理を実装
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
  };

  const handlePublishCancel = () => {
    setShowPublishDialog(false);
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
        
        <Tooltip title="公開">
          <IconButton 
            onClick={handlePublishClick}
            sx={iconButtonStyles.secondary}
          >
            <Rocket />
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

      {/* エラーチェックダイアログ */}
      <Dialog
        open={showErrorCheckDialog}
        maxWidth="sm"
        fullWidth
        disableEscapeKeyDown
        PaperProps={{
          sx: {
            borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.9) 100%)',
            backdropFilter: 'blur(20px)',
            border: '2px solid transparent',
            backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.9) 100%), linear-gradient(135deg, #667eea 0%, #764ba2 50%, #ff6b6b 100%)',
            backgroundOrigin: 'border-box',
            backgroundClip: 'content-box, border-box',
            boxShadow: '0 24px 64px rgba(0, 0, 0, 0.15)',
            overflow: 'hidden'
          }
        }}
        BackdropProps={{
          sx: {
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(8px)'
          }
        }}
      >
        <DialogContent sx={{ p: 0 }}>
          <Box
            sx={{
              textAlign: 'center',
              py: 6,
              px: 4,
              background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 50%, rgba(255, 107, 107, 0.1) 100%)',
              color: '#374151',
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 50%, rgba(255, 107, 107, 0.05) 100%)',
                zIndex: -1
              }
            }}
          >
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 50%, rgba(255, 107, 107, 0.2) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 4,
                fontSize: '2.5rem',
                boxShadow: '0 8px 24px rgba(102, 126, 234, 0.15)'
              }}
            >
              🔍
            </Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                mb: 2,
                fontSize: '1.5rem',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #ff6b6b 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: 'none'
              }}
            >
              エラーチェック中...
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: '#6b7280',
                fontSize: '1rem',
                lineHeight: 1.6,
                fontWeight: 500,
                mb: 4
              }}
            >
              フォームの設定を確認しています
            </Typography>

            {/* チェック項目リスト */}
            <Box sx={{ textAlign: 'left', maxWidth: 400, mx: 'auto' }}>
              {errorCheckItems.map((item) => (
                <Box
                  key={item.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    py: 1.5,
                    px: 3,
                    mb: 1,
                    borderRadius: '12px',
                    background: item.status === 'completed' 
                      ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(34, 197, 94, 0.05) 100%)'
                      : 'rgba(249, 250, 251, 0.8)',
                    border: item.status === 'completed' 
                      ? '1px solid rgba(34, 197, 94, 0.2)'
                      : '1px solid rgba(229, 231, 235, 0.5)',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <Box
                    sx={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      mr: 3,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: item.status === 'completed' 
                        ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
                        : 'linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%)',
                      color: item.status === 'completed' ? 'white' : '#9ca3af',
                      fontSize: '0.8rem',
                      fontWeight: 'bold'
                    }}
                  >
                    {item.status === 'completed' ? '✓' : item.id}
                  </Box>
                  <Typography
                    sx={{
                      color: item.status === 'completed' ? '#059669' : '#6b7280',
                      fontWeight: item.status === 'completed' ? 600 : 500,
                      fontSize: '0.95rem'
                    }}
                  >
                    {item.name}
                  </Typography>
                </Box>
              ))}
            </Box>

            {/* プログレスバー */}
            <Box sx={{ mt: 4, px: 2 }}>
              <Box
                sx={{
                  width: '100%',
                  height: 8,
                  borderRadius: '4px',
                  background: 'rgba(229, 231, 235, 0.5)',
                  overflow: 'hidden',
                  position: 'relative'
                }}
              >
                <Box
                  sx={{
                    height: '100%',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #ff6b6b 100%)',
                    borderRadius: '4px',
                    width: `${(errorCheckProgress / errorCheckItems.length) * 100}%`,
                    transition: 'width 0.3s ease'
                  }}
                />
              </Box>
              <Typography
                sx={{
                  textAlign: 'center',
                  mt: 2,
                  color: '#6b7280',
                  fontSize: '0.9rem',
                  fontWeight: 500
                }}
              >
                {errorCheckProgress} / {errorCheckItems.length} 項目完了
              </Typography>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      {/* 公開確認ダイアログ */}
      <Dialog
        open={showPublishDialog}
        onClose={handlePublishCancel}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.9) 100%)',
            backdropFilter: 'blur(20px)',
            border: '2px solid transparent',
            backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.9) 100%), linear-gradient(135deg, #667eea 0%, #764ba2 50%, #ff6b6b 100%)',
            backgroundOrigin: 'border-box',
            backgroundClip: 'content-box, border-box',
            boxShadow: '0 24px 64px rgba(0, 0, 0, 0.15)',
            overflow: 'hidden'
          }
        }}
        BackdropProps={{
          sx: {
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(8px)'
          }
        }}
      >
        <DialogContent sx={{ p: 0 }}>
          <Box
            sx={{
              textAlign: 'center',
              py: 6,
              px: 4,
              background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 50%, rgba(255, 107, 107, 0.1) 100%)',
              color: '#374151',
              mb: 4,
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 50%, rgba(255, 107, 107, 0.05) 100%)',
                zIndex: -1
              }
            }}
          >
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 50%, rgba(255, 107, 107, 0.2) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 3,
                fontSize: '2.5rem',
                boxShadow: '0 8px 24px rgba(102, 126, 234, 0.15)'
              }}
            >
              🚀
            </Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                mb: 2,
                fontSize: '1.75rem',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #ff6b6b 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: 'none'
              }}
            >
              フォームを公開しますか？
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: '#6b7280',
                fontSize: '1rem',
                lineHeight: 1.6,
                fontWeight: 500
              }}
            >
              エラーチェックが完了しました。<br />
              フォームを公開して利用可能にします。
            </Typography>
          </Box>

          <Box sx={{ px: 4, pb: 4 }}>
            <Box
              sx={{
                display: 'flex',
                gap: 2,
                justifyContent: 'center'
              }}
            >
              <Button
                onClick={handlePublishCancel}
                variant="outlined"
                sx={{
                  minWidth: 120,
                  height: 48,
                  borderRadius: '24px',
                  border: '2px solid #e5e7eb',
                  color: '#6b7280',
                  fontSize: '1rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  '&:hover': {
                    border: '2px solid #d1d5db',
                    backgroundColor: '#f9fafb'
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
                  height: 48,
                  borderRadius: '24px',
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