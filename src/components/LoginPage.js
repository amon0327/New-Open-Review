import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../supabaseClient';
import {
  Container,
  Paper,
  Box,
  Typography,
  TextField,
  Button,
  Tab,
  Tabs,
  InputAdornment,
  IconButton,
  Divider,
  Chip,
  Alert
} from '@mui/material';
import {
  Email,
  Lock,
  Visibility,
  VisibilityOff,
  Google,
  Person
} from '@mui/icons-material';

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function LoginPage({ onLogin }) {
  const [tabValue, setTabValue] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    company: ''
  });

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleInputChange = (field) => (event) => {
    setFormData({
      ...formData,
      [field]: event.target.value
    });
  };

  const ensureBusinessUserExists = async (user) => {
    try {
      // タイムアウト設定付きでbusiness_usersテーブルにエントリが存在するかチェック
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Database timeout')), 5000); // 5秒タイムアウト
      });

      const selectPromise = supabase
        .from('business_users')
        .select('id')
        .eq('id', user.id)
        .single();

      const { data: existingUser, error: selectError } = await Promise.race([
        selectPromise,
        timeoutPromise
      ]);

      if (selectError && selectError.code === 'PGRST116') {
        // エントリが存在しない場合は作成（タイムアウト付き）
        const insertPromise = supabase
          .from('business_users')
          .insert({
            id: user.id,
            email: user.email,
            name: user.user_metadata?.name || '',
            company_name: user.user_metadata?.company || ''
          });

        const insertTimeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Insert timeout')), 5000);
        });

        const { error: insertError } = await Promise.race([
          insertPromise,
          insertTimeoutPromise
        ]);

        if (insertError) {
          console.error('business_users自動作成エラー:', insertError);
        }
      } else if (selectError && selectError.message !== 'Database timeout') {
        console.error('business_usersチェックエラー:', selectError);
      }
    } catch (error) {
      console.error('ensureBusinessUserExists エラー:', error);
      // エラーが発生してもログイン処理は継続する
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;

      if (data.user) {
        // business_usersテーブルにエントリが存在するかチェック（エラーでも継続）
        try {
          await ensureBusinessUserExists(data.user);
        } catch (businessUserError) {
          console.error('business_users処理でエラーが発生しましたが、ログインを継続します:', businessUserError);
        }
        onLogin(data.user);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            company: formData.company,
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        // business_usersテーブルに新規ユーザー情報を挿入
        const { error: insertError } = await supabase
          .from('business_users')
          .insert({
            id: data.user.id,
            email: formData.email,
            name: formData.name,
            company_name: formData.company
          });

        if (insertError) {
          console.error('business_users挿入エラー:', insertError);
        }

        setError('確認メールを送信しました。メールをご確認ください。');
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });

      if (error) throw error;
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Background Animation Elements */}
      <Box
        sx={{
          position: 'absolute',
          width: '150%',
          height: '150%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
          animation: 'float 20s infinite linear',
          '@keyframes float': {
            '0%': { transform: 'translate(-50px, -50px)' },
            '100%': { transform: 'translate(50px, 50px)' }
          }
        }}
      />
      
      <Container maxWidth="sm">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Paper
            elevation={24}
            sx={{
              p: 4,
              borderRadius: 3,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}
          >
            {/* Logo and Brand */}
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              >
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    borderRadius: 2,
                    background: 'linear-gradient(45deg, #5e17eb 30%, #764ba2 90%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto',
                    mb: 2,
                    boxShadow: '0 8px 32px rgba(94, 23, 235, 0.3)'
                  }}
                >
                  <Typography
                    variant="h4"
                    sx={{ color: 'white', fontWeight: 'bold' }}
                  >
                    O
                  </Typography>
                </Box>
              </motion.div>
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
                OpenReview
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Create beautiful review forms with ease
              </Typography>
            </Box>

            {/* Tab Navigation */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 0 }}>
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                variant="fullWidth"
                sx={{
                  '& .MuiTab-root': {
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '1rem'
                  }
                }}
              >
                <Tab label="ログイン" />
                <Tab label="新規登録" />
              </Tabs>
            </Box>

            {/* Error Message */}
            {error && (
              <Alert 
                severity={error.includes('確認メール') ? 'info' : 'error'} 
                sx={{ mb: 2 }}
              >
                {error}
              </Alert>
            )}

            {/* Login Form */}
            <TabPanel value={tabValue} index={0}>
              <Box component="form" onSubmit={handleLogin}>
                <TextField
                  fullWidth
                  label="メールアドレス"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange('email')}
                  sx={{ mb: 3 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email color="primary" />
                      </InputAdornment>
                    ),
                  }}
                />
                
                <TextField
                  fullWidth
                  label="パスワード"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleInputChange('password')}
                  sx={{ mb: 3 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock color="primary" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading}
                  sx={{
                    mb: 3,
                    py: 1.5,
                    background: 'linear-gradient(45deg, #5e17eb 30%, #764ba2 90%)',
                    borderRadius: 2,
                    textTransform: 'none',
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    boxShadow: '0 8px 32px rgba(94, 23, 235, 0.3)',
                    '&:hover': {
                      boxShadow: '0 12px 40px rgba(94, 23, 235, 0.4)',
                    }
                  }}
                >
                  {loading ? 'ログイン中...' : 'ログイン'}
                </Button>
              </Box>
            </TabPanel>

            {/* Sign Up Form */}
            <TabPanel value={tabValue} index={1}>
              <Box component="form" onSubmit={handleSignUp}>
                <TextField
                  fullWidth
                  label="お名前"
                  value={formData.name}
                  onChange={handleInputChange('name')}
                  sx={{ mb: 3 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Person color="primary" />
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  fullWidth
                  label="会社名"
                  value={formData.company}
                  onChange={handleInputChange('company')}
                  sx={{ mb: 3 }}
                />

                <TextField
                  fullWidth
                  label="メールアドレス"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange('email')}
                  sx={{ mb: 3 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email color="primary" />
                      </InputAdornment>
                    ),
                  }}
                />
                
                <TextField
                  fullWidth
                  label="パスワード"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleInputChange('password')}
                  sx={{ mb: 3 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock color="primary" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading}
                  sx={{
                    mb: 3,
                    py: 1.5,
                    background: 'linear-gradient(45deg, #5e17eb 30%, #764ba2 90%)',
                    borderRadius: 2,
                    textTransform: 'none',
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    boxShadow: '0 8px 32px rgba(94, 23, 235, 0.3)',
                    '&:hover': {
                      boxShadow: '0 12px 40px rgba(94, 23, 235, 0.4)',
                    }
                  }}
                >
                  {loading ? 'アカウント作成中...' : 'アカウント作成'}
                </Button>
              </Box>
            </TabPanel>

            {/* Social Login Options */}
            <Box sx={{ mt: 3 }}>
              <Divider sx={{ mb: 3 }}>
                <Chip label="または" size="small" />
              </Divider>
              
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Google />}
                onClick={handleGoogleLogin}
                disabled={loading}
                sx={{
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: 'none',
                  borderColor: '#ddd',
                  color: '#666',
                  '&:hover': {
                    borderColor: '#5e17eb',
                    color: '#5e17eb'
                  }
                }}
              >
                {loading ? 'Googleログイン中...' : 'Googleでログイン'}
              </Button>
            </Box>
          </Paper>
        </motion.div>
      </Container>
    </Box>
  );
}