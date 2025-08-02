import React from 'react';
import { motion } from 'framer-motion';
import { Paper, Typography } from '@mui/material';

export default function HomePage({ onCreateFormClick, user }) {
  const [forms, setForms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingForm, setIsCreatingForm] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedForm, setSelectedForm] = useState(null);

  // フォーム一覧を取得
  useEffect(() => {
    const loadForms = async () => {
      if (!user?.id) return;
      
      setIsLoading(true);
      try {
        const result = await FormDataService.getUserForms(user.id);
        if (result.success) {
          setForms(result.data);
        } else {
          toast.error('フォームの取得に失敗しました');
        }
      } catch (error) {
        console.error('Forms load error:', error);
        toast.error('フォームの読み込み中にエラーが発生しました');
      } finally {
        setIsLoading(false);
      }
    };

    loadForms();
  }, [user]);

  // 新規フォーム作成
  const handleCreateForm = async () => {
    if (!user?.id) {
      toast.error('ユーザー情報が取得できません');
      return;
    }

    setIsCreatingForm(true);
    try {
      const result = await FormDataService.createNewForm(user.id);
      
      if (result.success) {
        toast.success('新しいフォームを作成しました');
        // フォーム一覧を再読み込み
        const formsResult = await FormDataService.getUserForms(user.id);
        if (formsResult.success) {
          setForms(formsResult.data);
        }
        // フォーム作成画面に遷移
        if (onCreateFormClick) {
          onCreateFormClick(result.data.reviewFormId);
        }
      } else {
        toast.error(result.error || 'フォームの作成に失敗しました');
      }
    } catch (error) {
      console.error('Form creation error:', error);
      toast.error('フォームの作成中にエラーが発生しました');
    } finally {
      setIsCreatingForm(false);
    }
  };

  // メニューのハンドラー
  const handleMenuClick = (event, form) => {
    setAnchorEl(event.currentTarget);
    setSelectedForm(form);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedForm(null);
  };

  const handleEditForm = () => {
    if (selectedForm && onCreateFormClick) {
      onCreateFormClick(selectedForm.id);
    }
    handleMenuClose();
  };

  const handleDeleteForm = async () => {
    if (!selectedForm) return;
    
    try {
      const result = await FormDataService.deleteForm(selectedForm.id);
      if (result.success) {
        toast.success('フォームを削除しました');
        setForms(forms.filter(form => form.id !== selectedForm.id));
      } else {
        toast.error('フォームの削除に失敗しました');
      }
    } catch (error) {
      console.error('Form deletion error:', error);
      toast.error('フォームの削除中にエラーが発生しました');
    }
    handleMenuClose();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Box sx={{ position: 'relative', height: 'calc(100vh - 120px)' }}>
        {/* ヘッダー部分 */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
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
              レビューフォーム一覧
            </Typography>
            <Typography variant="body1" color="text.secondary">
              作成したフォームを管理・編集できます
            </Typography>
          </Box>
        </Box>

        {/* メインコンテンツ */}
        <Paper
          sx={{
            p: 3,
            height: 'calc(100% - 100px)',
            borderRadius: 3,
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            overflow: 'auto'
          }}
        >
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <CircularProgress size={40} sx={{ color: '#5e17eb' }} />
            </Box>
          ) : forms.length === 0 ? (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '100%',
              textAlign: 'center'
            }}>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                まだフォームが作成されていません
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                下のボタンから新しいレビューフォームを作成してみましょう
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {forms.map((form) => (
                <Grid item xs={12} sm={6} md={4} key={form.id}>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    whileHover={{ y: -4 }}
                  >
                    <Card
                      sx={{
                        height: '100%',
                        borderRadius: 2,
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                        background: 'rgba(255, 255, 255, 0.95)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          boxShadow: '0 8px 30px rgba(94, 23, 235, 0.15)',
                          borderColor: 'rgba(94, 23, 235, 0.3)'
                        }
                      }}
                    >
                      <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Typography variant="h6" sx={{ fontWeight: 600, color: '#2d3748' }}>
                            フォーム #{form.id}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuClick(e, form)}
                            sx={{ color: '#64748b' }}
                          >
                            <MoreVert />
                          </IconButton>
                        </Box>

                        <Box sx={{ mb: 2 }}>
                          <Chip
                            icon={<DateRange />}
                            label={formatDate(form.created_at)}
                            size="small"
                            sx={{
                              backgroundColor: 'rgba(94, 23, 235, 0.1)',
                              color: '#5e17eb',
                              '& .MuiChip-icon': { color: '#5e17eb' }
                            }}
                          />
                        </Box>

                        {form.review_form_settings && form.review_form_settings[0] && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box
                              sx={{
                                width: 16,
                                height: 16,
                                borderRadius: '50%',
                                backgroundColor: form.review_form_settings[0].theme_color || '#5e17eb'
                              }}
                            />
                            <Typography variant="body2" color="text.secondary">
                              テーマカラー設定済み
                            </Typography>
                          </Box>
                        )}
                      </CardContent>

                      <CardActions sx={{ p: 2, pt: 0 }}>
                        <Button
                          size="small"
                          startIcon={<Edit />}
                          onClick={() => {
                            if (onCreateFormClick) {
                              onCreateFormClick(form.id);
                            }
                          }}
                          sx={{
                            color: '#5e17eb',
                            '&:hover': { backgroundColor: 'rgba(94, 23, 235, 0.1)' }
                          }}
                        >
                          編集
                        </Button>
                        <Button
                          size="small"
                          startIcon={<Assessment />}
                          sx={{
                            color: '#64748b',
                            '&:hover': { backgroundColor: 'rgba(100, 116, 139, 0.1)' }
                          }}
                        >
                          分析
                        </Button>
                      </CardActions>
                    </Card>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          )}
        </Paper>

        {/* 新規作成フローティングアクションボタン */}
        <Fab
          color="primary"
          onClick={handleCreateForm}
          disabled={isCreatingForm}
          sx={{
            position: 'absolute',
            bottom: 24,
            right: 24,
            background: 'linear-gradient(45deg, #5e17eb 30%, #764ba2 90%)',
            '&:hover': {
              background: 'linear-gradient(45deg, #4c1d95 30%, #5b21b6 90%)',
              transform: 'scale(1.05)'
            },
            '&.Mui-disabled': {
              background: 'rgba(156, 163, 175, 0.5)'
            },
            transition: 'all 0.3s ease'
          }}
        >
          {isCreatingForm ? <CircularProgress size={24} color="inherit" /> : <Add />}
        </Fab>

        {/* フォームアクションメニュー */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          PaperProps={{
            sx: { 
              borderRadius: 2, 
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }
          }}
        >
          <MenuItem onClick={handleEditForm}>
            <ListItemIcon>
              <Edit fontSize="small" />
            </ListItemIcon>
            <ListItemText>編集</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleMenuClose()}>
            <ListItemIcon>
              <Launch fontSize="small" />
            </ListItemIcon>
            <ListItemText>プレビュー</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleMenuClose()}>
            <ListItemIcon>
              <Assessment fontSize="small" />
            </ListItemIcon>
            <ListItemText>分析</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleMenuClose()}>
            <ListItemIcon>
              <SettingsIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>設定</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleDeleteForm} sx={{ color: 'error.main' }}>
            <ListItemIcon>
              <Delete fontSize="small" sx={{ color: 'error.main' }} />
            </ListItemIcon>
            <ListItemText>削除</ListItemText>
          </MenuItem>
        </Menu>
      </Box>
    </motion.div>
  );
}