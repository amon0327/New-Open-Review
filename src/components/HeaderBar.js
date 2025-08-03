import React, { useState } from 'react';
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
  Divider,
  Chip
} from '@mui/material';
import {
  Preview,
  Save,
  MoreVert,
  Sync,
  ErrorOutline,
  WarningAmber,
  CheckCircle,
  Close,
  CheckCircleOutline
} from '@mui/icons-material';
import { colors, glassPaperStyles, iconButtonStyles } from '../constants/theme';
import PreviewUrlDialog from './PreviewUrlDialog';

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
  // エラー・警告判定用のprops
  errors = [], // エラー配列 [{ id, message, location }]
  emptyFields = [], // 未入力フィールド配列 [{ fieldName: '項目名', location: '場所' }]
  // デフォルト値使用状況
  defaultUsage = {}, // { logo: true, themeColor: true, loginBackground: true, etc... }
  // 設定メニューを開くコールバック関数
  onOpenDesignSettings,
  onOpenLoginSettings,
  onOpenCompletionSettings,
  onOpenSettings
}) => {
  // デバウンス用のタイムアウト
  const [debounceTimeout, setDebounceTimeout] = React.useState(null);
  // プレビューダイアログの状態
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  // エラー・警告ポップオーバーの状態
  const [errorAnchorEl, setErrorAnchorEl] = useState(null);
  const [warningAnchorEl, setWarningAnchorEl] = useState(null);

  // 警告条件：デフォルト要素使用時と未入力部分がある時
  const warnings = [];
  
  // デフォルト要素使用時の警告
  const defaultItems = [
    // グローバルデザイン設定
    { key: 'logo', name: 'ロゴ画像', location: 'デザイン設定', action: 'openDesignSettings' },
    { key: 'themeColor', name: 'テーマカラー', location: 'デザイン設定', action: 'openDesignSettings' },
    
    // ログイン画面設定
    { key: 'loginBackground', name: 'ログイン画面背景画像', location: 'ログイン画面設定', action: 'openLoginSettings' },
    { key: 'loginTitle', name: 'ログイン画面タイトル', location: 'ログイン画面設定', action: 'openLoginSettings' },
    { key: 'loginDetail', name: 'ログイン画面詳細テキスト', location: 'ログイン画面設定', action: 'openLoginSettings' },
    
    // 完了画面設定
    { key: 'completionBackground', name: '完了画面背景画像', location: '完了画面設定', action: 'openCompletionSettings' },
    { key: 'completionTitle', name: '完了画面タイトル', location: '完了画面設定', action: 'openCompletionSettings' },
    { key: 'completionDetail', name: '完了画面詳細テキスト', location: '完了画面設定', action: 'openCompletionSettings' },
    { key: 'completionButton', name: '完了画面ボタンテキスト', location: '完了画面設定', action: 'openCompletionSettings' },
    
    // 質問画面設定（質問が作成されていない場合）
    { key: 'noQuestions', name: '質問', location: '質問設定', action: 'openSettings' }
  ];
  
  defaultItems.forEach(item => {
    if (defaultUsage[item.key]) {
      warnings.push({
        id: `default-${item.key}`,
        message: `デフォルトの${item.name}が使用されています`,
        location: item.location,
        action: item.action,
        type: 'default'
      });
    }
  });
  
  // 未入力部分がある場合の警告
  emptyFields.forEach((field, index) => {
    warnings.push({
      id: `empty-${index}`,
      message: `${field.fieldName}が未入力です`,
      location: field.location,
      action: field.action || 'openSettings',
      type: 'empty'
    });
  });

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

  const handleWarningItemClick = (warning) => {
    // 警告項目がクリックされた時の処理
    setWarningAnchorEl(null); // ポップオーバーを閉じる
    
    // 設定メニューを開く処理
    switch(warning.action) {
      case 'openDesignSettings':
        onOpenDesignSettings?.();
        break;
      case 'openLoginSettings':
        onOpenLoginSettings?.();
        break;
      case 'openCompletionSettings':
        onOpenCompletionSettings?.();
        break;
      default:
        onOpenSettings?.();
        break;
    }
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
            onClick={() => setShowPreviewDialog(true)}
            sx={iconButtonStyles.secondary}
          >
            <Preview />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="保存">
          <IconButton sx={iconButtonStyles.secondary}>
            <Save />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="その他">
          <IconButton sx={iconButtonStyles.secondary}>
            <MoreVert />
          </IconButton>
        </Tooltip>
      </Box>

      {/* プレビューURLダイアログ */}
      <PreviewUrlDialog
        open={showPreviewDialog}
        onClose={() => setShowPreviewDialog(false)}
        formId={formId}
      />

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
              エラー一覧 ({errorCount}件)
            </Typography>
          </Box>
        </Box>
        <List sx={{ p: 0, maxHeight: 300, overflow: 'auto' }}>
          {errors.map((error, index) => (
            <ListItem
              key={error.id}
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
              警告一覧 ({warningCount}件)
            </Typography>
          </Box>
        </Box>
        <List sx={{ p: 0, maxHeight: 300, overflow: 'auto' }}>
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