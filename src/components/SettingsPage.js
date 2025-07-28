import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Avatar,
  Container,
  Grid,
  Card,
  CardContent,
  Divider,
  Alert,
  CircularProgress,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  PhotoCamera,
  Settings,
  Person,
  Business,
  Email,
  ExitToApp,
  CreditCard
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { supabase } from '../supabaseClient';

const SettingsPage = ({ user, onLogout, onBackClick }) => {
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
    fetchUserProfile();
    fetchBusinessCategories();
    fetchCurrentPlan();
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
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}
      >
        <CircularProgress sx={{ color: 'white' }} />
      </Box>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
    >
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          py: 4
        }}
      >
        <Container maxWidth="lg">
          {/* ヘッダー */}
          <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Settings sx={{ color: 'white', fontSize: 32 }} />
              <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>
                設定
              </Typography>
            </Box>
            <Button
              variant="outlined"
              onClick={onBackClick}
              sx={{
                color: 'white',
                borderColor: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  borderColor: 'white',
                }
              }}
            >
              ダッシュボードに戻る
            </Button>
          </Box>

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
                            borderColor: 'primary.main'
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
                        // プラン確認ページへの遷移処理
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
      </Box>
    </motion.div>
  );
};

export default SettingsPage;