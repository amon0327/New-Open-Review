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
      <Box
        sx={{
          height: 'calc(100vh - 120px)',
          overflow: 'auto',
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
          p: 3
        }}
      >
        {/* ヘッダー */}
        <Box sx={{ mb: 4 }}>
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 700, 
              color: '#1a202c',
              mb: 1
            }}
          >
            アカウント設定
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              color: '#64748b',
              fontSize: '1.1rem'
            }}
          >
            プロフィール情報とアカウント設定を管理
          </Typography>
        </Box>

        {/* メッセージ表示 */}
        {message.text && (
          <Alert 
            severity={message.type} 
            sx={{ 
              mb: 3,
              borderRadius: 3,
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
            }}
            onClose={() => setMessage({ type: '', text: '' })}
          >
            {message.text}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* プロフィール情報 */}
          <Grid item xs={12} lg={8}>
            <Card
              sx={{
                borderRadius: 4,
                border: 'none',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.08)',
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                overflow: 'visible'
              }}
            >
              <CardContent sx={{ p: 5 }}>
                {/* セクションヘッダー */}
                <Box sx={{ mb: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 3,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Person sx={{ color: 'white', fontSize: 24 }} />
                    </Box>
                    <Box>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: '#1a202c' }}>
                        プロフィール情報
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
                        個人情報と会社情報を管理
                      </Typography>
                    </Box>
                  </Box>
                  <Divider sx={{ borderColor: 'rgba(100, 116, 139, 0.12)' }} />
                </Box>

                <Grid container spacing={4} sx={{ alignItems: 'stretch' }}>
                  {/* プロフィール画像セクション */}
                  <Grid item xs={12} md={4}>
                    <Box 
                      sx={{ 
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        height: '100%',
                        justifyContent: 'flex-start',
                        py: 2
                      }}
                    >
                      <Box sx={{ position: 'relative', mb: 3 }}>
                        <Avatar
                          src={userProfile.profile_image}
                          sx={{ 
                            width: 120, 
                            height: 120, 
                            border: '4px solid white',
                            boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            fontSize: '2.5rem',
                            fontWeight: 700
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
                              bottom: 4,
                              right: 4,
                              backgroundColor: 'white',
                              color: '#667eea',
                              boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)',
                              width: 32,
                              height: 32,
                              '&:hover': {
                                backgroundColor: '#f8fafc',
                                transform: 'scale(1.1)'
                              },
                              transition: 'all 0.3s ease'
                            }}
                          >
                            {imageUploading ? <CircularProgress size={16} /> : <PhotoCamera sx={{ fontSize: 16 }} />}
                          </IconButton>
                        </label>
                      </Box>
                      <Button
                        variant="outlined"
                        startIcon={<PhotoCamera />}
                        component="label"
                        disabled={imageUploading}
                        size="small"
                        sx={{
                          borderRadius: 3,
                          borderColor: '#667eea',
                          color: '#667eea',
                          textTransform: 'none',
                          fontWeight: 600,
                          px: 2,
                          py: 1,
                          fontSize: '0.875rem',
                          '&:hover': {
                            borderColor: '#5a67d8',
                            backgroundColor: 'rgba(102, 126, 234, 0.04)'
                          }
                        }}
                      >
                        画像を変更
                        <input
                          accept="image/*"
                          style={{ display: 'none' }}
                          type="file"
                          onChange={handleImageUpload}
                        />
                      </Button>
                    </Box>
                  </Grid>

                  {/* フォーム項目 */}
                  <Grid item xs={12} md={8}>
                    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <Grid container spacing={3} sx={{ flex: 1 }}>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="会社名"
                            value={userProfile.company_name}
                            onChange={(e) => handleInputChange('company_name', e.target.value)}
                            variant="outlined"
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 3,
                                backgroundColor: '#f8fafc',
                                height: '56px',
                                '&:hover': {
                                  backgroundColor: '#f1f5f9',
                                },
                                '&.Mui-focused': {
                                  backgroundColor: 'white',
                                }
                              }
                            }}
                            InputProps={{
                              startAdornment: (
                                <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
                                  <Business sx={{ color: '#667eea', fontSize: 20 }} />
                                </Box>
                              )
                            }}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <FormControl fullWidth>
                            <InputLabel sx={{ color: '#64748b' }}>業種</InputLabel>
                            <Select
                              value={userProfile.business_category}
                              onChange={(e) => handleInputChange('business_category', e.target.value)}
                              label="業種"
                              sx={{
                                borderRadius: 3,
                                backgroundColor: '#f8fafc',
                                height: '56px',
                                '&:hover': {
                                  backgroundColor: '#f1f5f9',
                                },
                                '&.Mui-focused': {
                                  backgroundColor: 'white',
                                }
                              }}
                            >
                              {businessCategories.map((category) => (
                                <MenuItem key={category.id} value={category.id}>
                                  {category.japanese}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="名前"
                            value={userProfile.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 3,
                                backgroundColor: '#f8fafc',
                                height: '56px',
                                '&:hover': {
                                  backgroundColor: '#f1f5f9',
                                },
                                '&.Mui-focused': {
                                  backgroundColor: 'white',
                                }
                              }
                            }}
                            InputProps={{
                              startAdornment: (
                                <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
                                  <Person sx={{ color: '#667eea', fontSize: 20 }} />
                                </Box>
                              )
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="メールアドレス"
                            value={userProfile.email}
                            disabled
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 3,
                                backgroundColor: '#f1f5f9',
                                height: '56px',
                              }
                            }}
                            InputProps={{
                              startAdornment: (
                                <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
                                  <Email sx={{ color: '#94a3b8', fontSize: 20 }} />
                                </Box>
                              )
                            }}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 'auto', pt: 2 }}>
                            <Button
                              variant="contained"
                              onClick={handleSaveProfile}
                              disabled={saving}
                              sx={{
                                borderRadius: 3,
                                px: 4,
                                py: 1.5,
                                textTransform: 'none',
                                fontWeight: 600,
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)',
                                '&:hover': {
                                  boxShadow: '0 8px 25px rgba(102, 126, 234, 0.4)',
                                  transform: 'translateY(-2px)'
                                },
                                transition: 'all 0.3s ease',
                                minWidth: 140
                              }}
                            >
                              {saving ? <CircularProgress size={20} sx={{ color: 'white' }} /> : '変更を保存'}
                            </Button>
                          </Box>
                        </Grid>
                      </Grid>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* サイドカラム */}
          <Grid item xs={12} lg={4}>
            <Box sx={{ position: 'sticky', top: 20 }}>
              <Grid container spacing={3}>
                {/* 料金プラン */}
                <Grid item xs={12} sm={6} lg={12}>
                  <Card
                    sx={{
                      borderRadius: 4,
                      border: 'none',
                      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.08)',
                      background: 'rgba(255, 255, 255, 0.95)',
                      backdropFilter: 'blur(20px)',
                      height: 'fit-content'
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: 2,
                            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}
                        >
                          <CreditCard sx={{ color: 'white', fontSize: 20 }} />
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a202c' }}>
                          料金プラン
                        </Typography>
                      </Box>
                      
                      <Box
                        sx={{
                          p: 2.5,
                          borderRadius: 3,
                          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                          border: '1px solid rgba(148, 163, 184, 0.2)',
                          mb: 3
                        }}
                      >
                        <Typography 
                          variant="subtitle1" 
                          sx={{ 
                            fontWeight: 700, 
                            color: '#1a202c',
                            mb: 0.5
                          }}
                        >
                          {currentPlan?.japanese || 'フリープラン'}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#64748b' }}>
                          現在ご利用中のプラン
                        </Typography>
                      </Box>
                      
                      <Button
                        variant="outlined"
                        fullWidth
                        onClick={() => {
                          console.log('料金プラン確認');
                        }}
                        sx={{
                          borderRadius: 3,
                          borderColor: '#f5576c',
                          color: '#f5576c',
                          textTransform: 'none',
                          fontWeight: 600,
                          py: 1.2,
                          height: '44px',
                          '&:hover': {
                            borderColor: '#e53e3e',
                            backgroundColor: 'rgba(245, 87, 108, 0.04)'
                          }
                        }}
                      >
                        プランを確認・変更
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>

                {/* ログアウト */}
                <Grid item xs={12} sm={6} lg={12}>
                  <Card
                    sx={{
                      borderRadius: 4,
                      border: 'none',
                      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.08)',
                      background: 'rgba(255, 255, 255, 0.95)',
                      backdropFilter: 'blur(20px)',
                      height: 'fit-content'
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: 2,
                            background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}
                        >
                          <ExitToApp sx={{ color: 'white', fontSize: 20 }} />
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a202c' }}>
                          セッション
                        </Typography>
                      </Box>
                      
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: '#64748b',
                          mb: 3,
                          lineHeight: 1.6
                        }}
                      >
                        セッションを終了してログアウトします
                      </Typography>
                      
                      <Button
                        variant="contained"
                        color="error"
                        fullWidth
                        startIcon={<ExitToApp />}
                        onClick={handleLogout}
                        sx={{
                          borderRadius: 3,
                          textTransform: 'none',
                          fontWeight: 600,
                          py: 1.2,
                          height: '44px',
                          background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
                          boxShadow: '0 4px 20px rgba(255, 107, 107, 0.3)',
                          '&:hover': {
                            boxShadow: '0 8px 25px rgba(255, 107, 107, 0.4)',
                            transform: 'translateY(-2px)'
                          },
                          transition: 'all 0.3s ease'
                        }}
                      >
                        ログアウト
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          </Grid>
        </Grid>
      </Box>
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
            boxShadow: '4px 0 20px rgba(0, 0, 0, 0.1)',
            borderRadius: 0
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
            borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
            borderRadius: 0
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