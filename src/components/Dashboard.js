import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Avatar,
  Paper,
  IconButton,
  Badge,
  TextField,
  Button,
  Card,
  CardContent,
  Grid,
  Container,
  Alert,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider
} from '@mui/material';
import {
  Home,
  Add,
  Analytics,
  Settings,
  Notifications,
  AccountCircle,
  PhotoCamera,
  Person,
  Business,
  Email,
  ExitToApp,
  CreditCard
} from '@mui/icons-material';
import { supabase } from '../supabaseClient';

// 各ページコンポーネント
function HomePage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Paper
        sx={{
          p: 4,
          height: 'calc(100vh - 120px)',
          borderRadius: 3,
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        }}
      >
        <Typography variant="h4" color="text.secondary">
          Home Content Container
        </Typography>
      </Paper>
    </motion.div>
  );
}

function CreatePage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Paper
        sx={{
          p: 4,
          height: 'calc(100vh - 120px)',
          borderRadius: 3,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          color: 'white'
        }}
      >
        <Typography variant="h4" color="inherit">
          Create Content Container
        </Typography>
      </Paper>
    </motion.div>
  );
}

function AnalyticsPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Paper
        sx={{
          p: 4,
          height: 'calc(100vh - 120px)',
          borderRadius: 3,
          background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        }}
      >
        <Typography variant="h4" color="text.secondary">
          Analytics Content Container
        </Typography>
      </Paper>
    </motion.div>
  );
}

function SettingsPage({ user, onLogout }) {
  // 状態管理
  const [userProfile, setUserProfile] = useState({
    name: '',
    company_name: '',
    email: user?.email || '',
    profile_image: null,
    business_category: ''
  });
  const [businessCategories, setBusinessCategories] = useState([]);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [imageUploading, setImageUploading] = useState(false);

  // ページ読み込み時にユーザー情報を取得
  useEffect(() => {
    if (user) {
      fetchUserProfile();
      fetchBusinessCategories();
      fetchCurrentPlan();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('business_users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setUserProfile({
          name: data.name || '',
          company_name: data.company_name || '',
          email: data.email || user.email,
          profile_image: data.profile_image || null,
          business_category: data.business_categories || ''
        });
      }
    } catch (error) {
      console.error('プロフィール取得エラー:', error);
      setMessage({ type: 'error', text: 'プロフィール情報の取得に失敗しました' });
    } finally {
      setLoading(false);
    }
  };

  const fetchBusinessCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('business_categories')
        .select('*')
        .order('japanese');

      if (error) throw error;
      setBusinessCategories(data || []);
    } catch (error) {
      console.error('業種カテゴリ取得エラー:', error);
    }
  };

  const fetchCurrentPlan = async () => {
    try {
      if (!user) return;
      
      const { data: userData, error: userError } = await supabase
        .from('business_users')
        .select('plan_categories')
        .eq('id', user.id)
        .single();

      if (userError) throw userError;

      if (userData?.plan_categories) {
        const { data: planData, error: planError } = await supabase
          .from('plan_categories')
          .select('*')
          .eq('id', userData.plan_categories)
          .single();

        if (!planError && planData) {
          setCurrentPlan(planData);
        }
      }
    } catch (error) {
      console.error('プラン情報取得エラー:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setUserProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setImageUploading(true);
    try {
      // ファイル名を生成
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;

      // Supabase Storageにアップロード
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(`profile-images/${fileName}`, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // 公開URLを取得
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(`profile-images/${fileName}`);

      const imageUrl = urlData.publicUrl;

      // データベースを更新
      await updateProfile({ profile_image: imageUrl });
      
      setUserProfile(prev => ({
        ...prev,
        profile_image: imageUrl
      }));

      setMessage({ type: 'success', text: 'プロフィール画像を更新しました' });
    } catch (error) {
      console.error('画像アップロードエラー:', error);
      setMessage({ type: 'error', text: '画像のアップロードに失敗しました' });
    } finally {
      setImageUploading(false);
    }
  };

  const updateProfile = async (updates) => {
    const { error } = await supabase
      .from('business_users')
      .update(updates)
      .eq('id', user.id);

    if (error) throw error;
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await updateProfile({
        name: userProfile.name,
        company_name: userProfile.company_name,
        business_categories: userProfile.business_category
      });

      setMessage({ type: 'success', text: 'プロフィールを更新しました' });
    } catch (error) {
      console.error('プロフィール更新エラー:', error);
      setMessage({ type: 'error', text: 'プロフィールの更新に失敗しました' });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      onLogout();
    } catch (error) {
      console.error('ログアウトエラー:', error);
      setMessage({ type: 'error', text: 'ログアウトに失敗しました' });
    }
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        <Paper
          sx={{
            p: 4,
            height: 'calc(100vh - 120px)',
            borderRadius: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
          }}
        >
          <CircularProgress />
        </Paper>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Paper
        sx={{
          height: 'calc(100vh - 120px)',
          borderRadius: 3,
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          overflow: 'auto'
        }}
      >
        <Container maxWidth="lg" sx={{ py: 4 }}>
          {/* メッセージ表示 */}
          {message.text && (
            <Alert 
              severity={message.type} 
              sx={{ mb: 3 }}
              onClose={() => setMessage({ type: '', text: '' })}
            >
              {message.text}
            </Alert>
          )}

          <Grid container spacing={3}>
            {/* プロフィール情報 */}
            <Grid item xs={12}>
              <Card>
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="h5" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Person color="primary" />
                    プロフィール情報
                  </Typography>
                  
                  <Grid container spacing={3}>
                    {/* プロフィール画像 */}
                    <Grid item xs={12} md={3} sx={{ textAlign: 'center' }}>
                      <Box sx={{ position: 'relative', display: 'inline-block' }}>
                        <Avatar
                          src={userProfile.profile_image}
                          sx={{ 
                            width: 120, 
                            height: 120, 
                            mb: 2,
                            border: '4px solid',
                            borderColor: 'primary.main',
                            mx: 'auto'
                          }}
                        >
                          {userProfile.name?.charAt(0) || user?.email?.charAt(0)}
                        </Avatar>
                        <input
                          accept="image/*"
                          style={{ display: 'none' }}
                          id="profile-image-upload"
                          type="file"
                          onChange={handleImageUpload}
                          disabled={imageUploading}
                        />
                        <label htmlFor="profile-image-upload">
                          <IconButton
                            component="span"
                            disabled={imageUploading}
                            sx={{
                              position: 'absolute',
                              bottom: 16,
                              right: -8,
                              backgroundColor: 'primary.main',
                              color: 'white',
                              '&:hover': {
                                backgroundColor: 'primary.dark',
                              }
                            }}
                          >
                            {imageUploading ? <CircularProgress size={16} /> : <PhotoCamera />}
                          </IconButton>
                        </label>
                      </Box>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<PhotoCamera />}
                        component="label"
                        disabled={imageUploading}
                        sx={{ mt: 1 }}
                      >
                        画像を変更
                        <input
                          accept="image/*"
                          style={{ display: 'none' }}
                          type="file"
                          onChange={handleImageUpload}
                        />
                      </Button>
                    </Grid>

                    {/* フォーム項目 */}
                    <Grid item xs={12} md={9}>
                      <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="会社名"
                            value={userProfile.company_name}
                            onChange={(e) => handleInputChange('company_name', e.target.value)}
                            InputProps={{
                              startAdornment: <Business sx={{ color: 'text.secondary', mr: 1 }} />
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <FormControl fullWidth>
                            <InputLabel>業種</InputLabel>
                            <Select
                              value={userProfile.business_category}
                              onChange={(e) => handleInputChange('business_category', e.target.value)}
                              label="業種"
                            >
                              {businessCategories.map((category) => (
                                <MenuItem key={category.id} value={category.id}>
                                  {category.japanese}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="名前"
                            value={userProfile.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            InputProps={{
                              startAdornment: <Person sx={{ color: 'text.secondary', mr: 1 }} />
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="メールアドレス"
                            value={userProfile.email}
                            disabled
                            InputProps={{
                              startAdornment: <Email sx={{ color: 'text.secondary', mr: 1 }} />
                            }}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <Button
                              variant="contained"
                              onClick={handleSaveProfile}
                              disabled={saving}
                              sx={{ minWidth: 120 }}
                            >
                              {saving ? <CircularProgress size={20} /> : '変更する'}
                            </Button>
                          </Box>
                        </Grid>
                      </Grid>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* 料金プラン */}
            <Grid item xs={12}>
              <Card>
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="h5" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CreditCard color="primary" />
                    料金プラン
                  </Typography>
                  
                  <Box
                    sx={{
                      p: 3,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {currentPlan?.japanese || 'フリープラン'}
                    </Typography>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => {
                        console.log('料金プラン確認');
                      }}
                    >
                      料金プランを確認
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* ログアウト */}
            <Grid item xs={12}>
              <Card>
                <CardContent sx={{ p: 4 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <Typography variant="h6">
                      セッションを終了します。ログアウトしますか？
                    </Typography>
                    <Button
                      variant="contained"
                      color="error"
                      startIcon={<ExitToApp />}
                      onClick={handleLogout}
                      sx={{ minWidth: 120 }}
                    >
                      ログアウト
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Paper>
    </motion.div>
  );
}

const drawerWidth = 280;

const navigationItems = [
  { text: 'Home', icon: <Home />, component: HomePage },
  { text: 'Create', icon: <Add />, component: CreatePage },
  { text: 'Analytics', icon: <Analytics />, component: AnalyticsPage },
  { text: 'Settings', icon: <Settings />, component: SettingsPage },
];

export default function Dashboard({ onCreateClick, onLogout, user }) {
  const [activeTab, setActiveTab] = useState(0);

  const renderContent = () => {
    const ActiveComponent = navigationItems[activeTab].component;
    if (navigationItems[activeTab].text === 'Settings') {
      return <ActiveComponent user={user} onLogout={onLogout} />;
    }
    return <ActiveComponent />;
  };

  const handleNavClick = (index) => {
    if (navigationItems[index].text === 'Create') {
      onCreateClick();
    } else {
      setActiveTab(index);
    }
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: 'none',
            boxShadow: '4px 0 20px rgba(0, 0, 0, 0.1)'
          },
        }}
      >
        {/* Logo Section */}
        <Box
          sx={{
            p: 3,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <Box
            sx={{
              width: 40,
              height: 40,
              background: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(10px)'
            }}
          >
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
              O
            </Typography>
          </Box>
          <Typography
            variant="h6"
            sx={{
              color: 'white',
              fontWeight: 700,
              fontSize: '1.3rem'
            }}
          >
            OpenReview
          </Typography>
        </Box>

        {/* Navigation Items */}
        <List sx={{ px: 2, py: 3 }}>
          {navigationItems.map((item, index) => (
            <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
              <ListItemButton
                onClick={() => handleNavClick(index)}
                sx={{
                  py: 1.5,
                  px: 2,
                  color: 'rgba(255, 255, 255, 0.8)',
                  backgroundColor: activeTab === index ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                <ListItemIcon
                  sx={{
                    color: activeTab === index ? 'white' : 'rgba(255, 255, 255, 0.8)',
                    minWidth: 40
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontWeight: activeTab === index ? 600 : 400,
                    color: activeTab === index ? 'white' : 'rgba(255, 255, 255, 0.8)'
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>

        {/* User Profile Section */}
        <Box
          sx={{
            mt: 'auto',
            p: 3,
            borderTop: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              p: 2,
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)'
            }}
          >
            <Avatar sx={{ width: 40, height: 40 }}>
              <AccountCircle />
            </Avatar>
            <Box>
              <Typography
                variant="body2"
                sx={{ color: 'white', fontWeight: 600 }}
              >
                田中太郎
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
              >
                admin@company.com
              </Typography>
            </Box>
          </Box>
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: '#f8fafc',
          overflow: 'hidden'
        }}
      >
        {/* Top App Bar */}
        <AppBar
          position="static"
          elevation={0}
          sx={{
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(0, 0, 0, 0.05)'
          }}
        >
          <Toolbar>
            <Typography
              variant="h6"
              sx={{
                flexGrow: 1,
                color: '#1a202c',
                fontWeight: 600
              }}
            >
              {navigationItems[activeTab].text}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton color="inherit">
                <Badge badgeContent={4} color="error">
                  <Notifications sx={{ color: '#64748b' }} />
                </Badge>
              </IconButton>
              <Avatar sx={{ width: 32, height: 32, ml: 1 }}>
                <AccountCircle />
              </Avatar>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Page Content */}
        <Box sx={{ p: 3 }}>
          <AnimatePresence mode="wait">
            {renderContent()}
          </AnimatePresence>
        </Box>
      </Box>
    </Box>
  );
}