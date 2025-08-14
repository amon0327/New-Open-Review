import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  InputAdornment,
  IconButton,
  Alert,
  Card,
  Stack,
  Link
} from '@mui/material';
import {
  Email,
  Lock,
  Visibility,
  VisibilityOff,
  Google,
  Person,
  Business
} from '@mui/icons-material';

// モダンなアニメーションバリアント
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function LoginPage({ onLogin }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    company: ''
  });

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setError('');
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
      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          <Card
            elevation={0}
            sx={{
              borderRadius: '16px',
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
              overflow: 'hidden'
            }}
          >
            {/* Header Section */}
            <Box sx={{ p: 6, pb: 0 }}>
              <motion.div variants={fadeInUp}>
                <Stack alignItems="center" spacing={3}>
                  {/* Logo */}
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Box
                      component="img"
                      src="https://otfreskkeaenahqziriz.supabase.co/storage/v1/object/public/app-assets/logo/OpenReviewWhiteThemeLoog.png"
                      alt="OpenReview Logo"
                      sx={{
                        height: 48,
                        width: 'auto',
                        filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1))'
                      }}
                    />
                  </motion.div>
                  
                  {/* Title */}
                  <Box textAlign="center">
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 700,
                        background: 'linear-gradient(135deg, #5e17eb 0%, #764ba2 100%)',
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        mb: 1,
                        fontSize: { xs: '1.75rem', sm: '2.125rem' }
                      }}
                    >
                      {isSignUp ? 'アカウント作成' : 'サインイン'}
                    </Typography>
                    <Typography
                      variant="body1"
                      color="text.secondary"
                      sx={{ fontSize: '1rem', fontWeight: 400 }}
                    >
                      {isSignUp 
                        ? 'OpenReviewで美しいレビューフォームを作成しましょう'
                        : 'アカウントにサインインしてください'
                      }
                    </Typography>
                  </Box>
                </Stack>
              </motion.div>
            </Box>

            {/* Form Section */}
            <Box sx={{ p: 6, pt: 4 }}>
              {/* Error Message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <Alert 
                      severity={error.includes('確認メール') ? 'info' : 'error'} 
                      sx={{ 
                        mb: 3,
                        borderRadius: '12px',
                        border: 'none'
                      }}
                    >
                      {error}
                    </Alert>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Form Content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={isSignUp ? 'signup' : 'signin'}
                  variants={fadeInUp}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.3 }}
                >
                  <Box component="form" onSubmit={isSignUp ? handleSignUp : handleLogin}>
                    <Stack spacing={3}>
                      {/* Sign Up Fields */}
                      {isSignUp && (
                        <>
                          <TextField
                            fullWidth
                            label="お名前"
                            value={formData.name}
                            onChange={handleInputChange('name')}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <Person sx={{ color: 'text.secondary' }} />
                                </InputAdornment>
                              ),
                            }}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: '12px',
                                backgroundColor: 'rgba(248, 250, 252, 0.8)',
                                '&:hover fieldset': {
                                  borderColor: '#5e17eb',
                                },
                                '&.Mui-focused fieldset': {
                                  borderColor: '#5e17eb',
                                }
                              }
                            }}
                          />

                          <TextField
                            fullWidth
                            label="会社名"
                            value={formData.company}
                            onChange={handleInputChange('company')}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <Business sx={{ color: 'text.secondary' }} />
                                </InputAdornment>
                              ),
                            }}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: '12px',
                                backgroundColor: 'rgba(248, 250, 252, 0.8)',
                                '&:hover fieldset': {
                                  borderColor: '#5e17eb',
                                },
                                '&.Mui-focused fieldset': {
                                  borderColor: '#5e17eb',
                                }
                              }
                            }}
                          />
                        </>
                      )}

                      {/* Email Field */}
                      <TextField
                        fullWidth
                        label="メールアドレス"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange('email')}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Email sx={{ color: 'text.secondary' }} />
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '12px',
                            backgroundColor: 'rgba(248, 250, 252, 0.8)',
                            '&:hover fieldset': {
                              borderColor: '#5e17eb',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: '#5e17eb',
                            }
                          }
                        }}
                      />
                      
                      {/* Password Field */}
                      <TextField
                        fullWidth
                        label="パスワード"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={handleInputChange('password')}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Lock sx={{ color: 'text.secondary' }} />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                onClick={() => setShowPassword(!showPassword)}
                                edge="end"
                                sx={{ color: 'text.secondary' }}
                              >
                                {showPassword ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '12px',
                            backgroundColor: 'rgba(248, 250, 252, 0.8)',
                            '&:hover fieldset': {
                              borderColor: '#5e17eb',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: '#5e17eb',
                            }
                          }
                        }}
                      />

                      {/* Submit Button */}
                      <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        size="large"
                        disabled={loading}
                        sx={{
                          py: 1.5,
                          borderRadius: '12px',
                          background: 'linear-gradient(135deg, #5e17eb 0%, #764ba2 100%)',
                          textTransform: 'none',
                          fontSize: '1rem',
                          fontWeight: 600,
                          boxShadow: '0 4px 20px rgba(94, 23, 235, 0.3)',
                          transition: 'all 0.2s ease-in-out',
                          '&:hover': {
                            boxShadow: '0 6px 25px rgba(94, 23, 235, 0.4)',
                            transform: 'translateY(-1px)',
                          },
                          '&:active': {
                            transform: 'translateY(0px)',
                          }
                        }}
                      >
                        {loading 
                          ? (isSignUp ? 'アカウント作成中...' : 'サインイン中...') 
                          : (isSignUp ? 'アカウント作成' : 'サインイン')
                        }
                      </Button>

                      {/* Divider */}
                      <Box sx={{ position: 'relative', py: 1 }}>
                        <Box
                          sx={{
                            position: 'absolute',
                            top: '50%',
                            left: 0,
                            right: 0,
                            height: '1px',
                            backgroundColor: 'rgba(0, 0, 0, 0.08)'
                          }}
                        />
                        <Typography
                          variant="body2"
                          sx={{
                            position: 'relative',
                            textAlign: 'center',
                            backgroundColor: 'transparent',
                            px: 2,
                            color: 'text.secondary',
                            fontSize: '0.875rem'
                          }}
                        >
                          または
                        </Typography>
                      </Box>

                      {/* Google Login */}
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<Google />}
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        sx={{
                          py: 1.5,
                          borderRadius: '12px',
                          textTransform: 'none',
                          borderColor: 'divider',
                          color: 'text.primary',
                          backgroundColor: 'rgba(248, 250, 252, 0.5)',
                          transition: 'all 0.2s ease-in-out',
                          '&:hover': {
                            borderColor: '#5e17eb',
                            backgroundColor: 'rgba(94, 23, 235, 0.04)',
                            transform: 'translateY(-1px)',
                          }
                        }}
                      >
                        {loading ? 'Googleサインイン中...' : 'Googleでサインイン'}
                      </Button>
                    </Stack>
                  </Box>
                </motion.div>
              </AnimatePresence>

              {/* Toggle Auth Mode */}
              <Box sx={{ textAlign: 'center', mt: 4 }}>
                <Typography variant="body2" color="text.secondary">
                  {isSignUp ? 'すでにアカウントをお持ちですか？' : 'アカウントをお持ちでない方は'}
                  <Link
                    component="button"
                    type="button"
                    onClick={toggleMode}
                    sx={{
                      ml: 1,
                      color: '#5e17eb',
                      textDecoration: 'none',
                      fontWeight: 600,
                      '&:hover': {
                        textDecoration: 'underline',
                      }
                    }}
                  >
                    {isSignUp ? 'サインイン' : 'アカウント作成'}
                  </Link>
                </Typography>
              </Box>
            </Box>
          </Card>
        </motion.div>
      </Container>
    </Box>
  );
}