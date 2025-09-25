import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';
import {
  Container,
  Box,
  Typography,
  Button,
  Alert,
  Card,
  Stack
} from '@mui/material';
import {
  Google,
  Info
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');


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
                      サインイン
                    </Typography>
                    <Typography
                      variant="body1"
                      color="text.secondary"
                      sx={{ fontSize: '1rem', fontWeight: 400 }}
                    >
                      プレビュー版としてお試しいただけます
                    </Typography>
                  </Box>
                </Stack>
              </motion.div>
            </Box>

            {/* Notice Section */}
            <Box sx={{ px: 6, pb: 4 }}>
              <motion.div variants={fadeInUp}>
                <Alert 
                  severity="info" 
                  icon={<Info />}
                  sx={{ 
                    borderRadius: '12px',
                    border: 'none',
                    backgroundColor: 'rgba(33, 150, 243, 0.08)',
                    '& .MuiAlert-icon': {
                      color: '#1976d2'
                    }
                  }}
                >
                  <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                    データは一時的な保存となりますので、プレビュー版としてご利用ください。
                  </Typography>
                </Alert>
              </motion.div>
            </Box>

            {/* Login Section */}
            <Box sx={{ p: 6, pt: 0 }}>
              {/* Error Message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}hero-content
                  >
                    <Alert 
                      severity="error" 
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

              <motion.div variants={fadeInUp}>
                <Stack spacing={3}>
                  {/* Google Login */}
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<Google />}
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    size="large"
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
                    {loading ? 'Googleでサインイン中...' : 'Googleでサインイン'}
                  </Button>
                </Stack>
              </motion.div>
            </Box>
          </Card>
        </motion.div>
      </Container>
    </Box>
  );
}
