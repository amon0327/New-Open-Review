import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  AppBar,
  Toolbar,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  CircularProgress,
  Chip,
  Fab
} from '@mui/material';
import {
  ArrowBack,
  Business,
  Add,
  Settings,
  Logout,
  Dashboard as DashboardIcon,
  Assignment,
  Analytics,
  RateReview,
  People,
  AccountCircle
} from '@mui/icons-material';
import { supabase } from '../lib/supabase';

export default function CompanyDashboard({ company, user, onBack, onLogout }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [reviewForms, setReviewForms] = useState([]);
  const [isLoadingForms, setIsLoadingForms] = useState(true);
  const [stats, setStats] = useState({
    totalForms: 0,
    totalReviews: 0,
    activeStores: 0
  });

  // レビューフォーム一覧を取得
  const fetchReviewForms = async () => {
    try {
      setIsLoadingForms(true);

      const { data, error } = await supabase
        .from('review_forms')
        .select('*')
        .eq('company_id', company.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('レビューフォーム取得エラー:', error);
        return;
      }

      setReviewForms(data || []);
      setStats(prev => ({
        ...prev,
        totalForms: data?.length || 0
      }));
    } catch (error) {
      console.error('レビューフォーム取得エラー:', error);
    } finally {
      setIsLoadingForms(false);
    }
  };

  useEffect(() => {
    if (company) {
      fetchReviewForms();
    }
  }, [company]);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleMenuClose();
    if (onLogout) {
      onLogout();
    }
  };

  const navigationItems = [
    { id: 'dashboard', label: 'ダッシュボード', icon: <DashboardIcon /> },
    { id: 'forms', label: 'レビューフォーム', icon: <Assignment /> },
    { id: 'reviews', label: 'レビュー管理', icon: <RateReview /> },
    { id: 'analytics', label: '分析', icon: <Analytics /> },
    { id: 'settings', label: '設定', icon: <Settings /> },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 4, color: '#1a202c' }}>
              {company.name} - ダッシュボード
            </Typography>

            <Grid container spacing={3}>
              {/* 統計カード */}
              <Grid item xs={12} md={4}>
                <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Assignment sx={{ fontSize: 40, color: '#5e17eb', mr: 2 }} />
                      <Box>
                        <Typography variant="h3" sx={{ fontWeight: 700, color: '#1a202c' }}>
                          {stats.totalForms}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#64748b' }}>
                          レビューフォーム数
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <RateReview sx={{ fontSize: 40, color: '#10b981', mr: 2 }} />
                      <Box>
                        <Typography variant="h3" sx={{ fontWeight: 700, color: '#1a202c' }}>
                          {stats.totalReviews}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#64748b' }}>
                          レビュー総数
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <People sx={{ fontSize: 40, color: '#f59e0b', mr: 2 }} />
                      <Box>
                        <Typography variant="h3" sx={{ fontWeight: 700, color: '#1a202c' }}>
                          {stats.activeStores}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#64748b' }}>
                          アクティブ店舗
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* 最近のフォーム */}
              <Grid item xs={12}>
                <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        最近のレビューフォーム
                      </Typography>
                      <Button
                        variant="text"
                        onClick={() => setActiveTab('forms')}
                        sx={{ color: '#5e17eb' }}
                      >
                        すべて表示
                      </Button>
                    </Box>
                    {isLoadingForms ? (
                      <Box sx={{ textAlign: 'center', py: 5 }}>
                        <CircularProgress sx={{ color: '#5e17eb' }} />
                      </Box>
                    ) : reviewForms.length === 0 ? (
                      <Box sx={{ textAlign: 'center', py: 5 }}>
                        <Assignment sx={{ fontSize: 60, color: '#e2e8f0', mb: 2 }} />
                        <Typography variant="body1" sx={{ color: '#64748b' }}>
                          まだレビューフォームがありません
                        </Typography>
                      </Box>
                    ) : (
                      <List>
                        {reviewForms.slice(0, 5).map((form) => (
                          <ListItem
                            key={form.id}
                            sx={{
                              borderBottom: '1px solid #e2e8f0',
                              '&:last-child': { borderBottom: 'none' }
                            }}
                          >
                            <ListItemIcon>
                              <Assignment sx={{ color: '#5e17eb' }} />
                            </ListItemIcon>
                            <ListItemText
                              primary={form.form_title || 'タイトルなし'}
                              secondary={`作成日: ${new Date(form.created_at).toLocaleDateString('ja-JP')}`}
                            />
                            <Chip
                              label={form.is_active ? '有効' : '無効'}
                              size="small"
                              sx={{
                                bgcolor: form.is_active ? '#d1fae5' : '#fee2e2',
                                color: form.is_active ? '#065f46' : '#991b1b',
                                fontWeight: 600
                              }}
                            />
                          </ListItem>
                        ))}
                      </List>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        );

      case 'forms':
        return (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a202c' }}>
                レビューフォーム管理
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                sx={{
                  background: 'linear-gradient(45deg, #5e17eb 30%, #764ba2 90%)',
                  borderRadius: 2,
                  px: 3
                }}
              >
                新しいフォームを作成
              </Button>
            </Box>

            {isLoadingForms ? (
              <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)' }}>
                <CardContent>
                  <Box sx={{ textAlign: 'center', py: 8 }}>
                    <CircularProgress sx={{ color: '#5e17eb' }} />
                    <Typography variant="body1" sx={{ color: '#64748b', mt: 2 }}>
                      フォームを読み込み中...
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            ) : reviewForms.length === 0 ? (
              <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)' }}>
                <CardContent>
                  <Box sx={{ textAlign: 'center', py: 8 }}>
                    <Assignment sx={{ fontSize: 80, color: '#e2e8f0', mb: 2 }} />
                    <Typography variant="h6" sx={{ color: '#64748b', mb: 1 }}>
                      レビューフォームがありません
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                      「新しいフォームを作成」ボタンから最初のフォームを作成してください
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            ) : (
              <Grid container spacing={3}>
                {reviewForms.map((form) => (
                  <Grid item xs={12} md={6} lg={4} key={form.id}>
                    <Card sx={{
                      borderRadius: 3,
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 8px 30px rgba(94, 23, 235, 0.15)'
                      }
                    }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Assignment sx={{ fontSize: 32, color: '#5e17eb', mr: 1.5 }} />
                          <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a202c' }}>
                            {form.form_title || 'タイトルなし'}
                          </Typography>
                        </Box>

                        <Divider sx={{ my: 2 }} />

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                          <Box sx={{ mt: 1 }}>
                            <Chip
                              label={`作成日: ${new Date(form.created_at).toLocaleDateString('ja-JP')}`}
                              size="small"
                              sx={{
                                bgcolor: '#f1f5f9',
                                color: '#64748b',
                                fontSize: '0.75rem',
                                mr: 1
                              }}
                            />
                            <Chip
                              label={form.is_active ? '有効' : '無効'}
                              size="small"
                              sx={{
                                bgcolor: form.is_active ? '#d1fae5' : '#fee2e2',
                                color: form.is_active ? '#065f46' : '#991b1b',
                                fontWeight: 600,
                                fontSize: '0.75rem'
                              }}
                            />
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        );

      case 'reviews':
        return (
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 4, color: '#1a202c' }}>
              レビュー管理
            </Typography>

            <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)' }}>
              <CardContent>
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <RateReview sx={{ fontSize: 80, color: '#e2e8f0', mb: 2 }} />
                  <Typography variant="h6" sx={{ color: '#64748b', mb: 1 }}>
                    レビューがありません
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                    レビューフォームからレビューが投稿されるとここに表示されます
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Box>
        );

      case 'analytics':
        return (
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 4, color: '#1a202c' }}>
              分析
            </Typography>

            <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)' }}>
              <CardContent>
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <Analytics sx={{ fontSize: 80, color: '#e2e8f0', mb: 2 }} />
                  <Typography variant="h6" sx={{ color: '#64748b', mb: 1 }}>
                    分析データは準備中です
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                    レビューデータが蓄積されると分析結果が表示されます
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Box>
        );

      case 'settings':
        return (
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 4, color: '#1a202c' }}>
              企業設定
            </Typography>

            <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)' }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  企業情報
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box>
                    <Typography variant="body2" sx={{ color: '#64748b', mb: 0.5 }}>
                      企業名
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {company.name}
                    </Typography>
                  </Box>
                  {company.phone_number && (
                    <Box>
                      <Typography variant="body2" sx={{ color: '#64748b', mb: 0.5 }}>
                        電話番号
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {company.phone_number}
                      </Typography>
                    </Box>
                  )}
                  {company.email && (
                    <Box>
                      <Typography variant="body2" sx={{ color: '#64748b', mb: 0.5 }}>
                        メールアドレス
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {company.email}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', background: '#ffffff' }}>
      {/* AppBar */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          background: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          color: '#1a202c'
        }}
      >
        <Toolbar>
          <IconButton
            edge="start"
            onClick={onBack}
            sx={{ mr: 2, color: '#5e17eb' }}
          >
            <ArrowBack />
          </IconButton>

          <Business sx={{ fontSize: 32, color: '#5e17eb', mr: 2 }} />
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
            {company.name}
          </Typography>

          <IconButton onClick={handleMenuOpen}>
            <Avatar sx={{ bgcolor: '#5e17eb' }}>
              {user?.user_metadata?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
            </Avatar>
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            PaperProps={{
              sx: { borderRadius: 2, minWidth: 200 }
            }}
          >
            <MenuItem disabled>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {user?.user_metadata?.name || 'ユーザー'}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  {user?.email}
                </Typography>
              </Box>
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <Logout fontSize="small" />
              </ListItemIcon>
              ログアウト
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Box sx={{ display: 'flex', pt: 8 }}>
        {/* Sidebar */}
        <Paper
          elevation={0}
          sx={{
            width: 280,
            height: 'calc(100vh - 64px)',
            position: 'fixed',
            borderRight: '1px solid #e2e8f0',
            background: '#ffffff'
          }}
        >
          <List sx={{ pt: 3 }}>
            {navigationItems.map((item) => (
              <ListItem key={item.id} disablePadding sx={{ px: 2 }}>
                <ListItemButton
                  selected={activeTab === item.id}
                  onClick={() => setActiveTab(item.id)}
                  sx={{
                    borderRadius: 2,
                    mb: 1,
                    '&.Mui-selected': {
                      background: 'linear-gradient(45deg, #5e17eb 30%, #764ba2 90%)',
                      color: '#ffffff',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #5e17eb 30%, #764ba2 90%)',
                      },
                      '& .MuiListItemIcon-root': {
                        color: '#ffffff'
                      }
                    }
                  }}
                >
                  <ListItemIcon sx={{ color: activeTab === item.id ? '#ffffff' : '#64748b' }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.label} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Paper>

        {/* Content Area */}
        <Box sx={{ flexGrow: 1, ml: '280px', p: 4 }}>
          <Container maxWidth="xl">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {renderContent()}
            </motion.div>
          </Container>
        </Box>
      </Box>

      {/* フォーム作成FAB（formsタブのみ表示） */}
      {activeTab === 'forms' && (
        <Fab
          color="primary"
          aria-label="add"
          sx={{
            position: 'fixed',
            bottom: 32,
            right: 32,
            background: 'linear-gradient(45deg, #5e17eb 30%, #764ba2 90%)',
            '&:hover': {
              background: 'linear-gradient(45deg, #5e17eb 40%, #764ba2 100%)',
            }
          }}
        >
          <Add />
        </Fab>
      )}
    </Box>
  );
}
