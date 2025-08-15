import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Container,
  Box,
  Typography,
  Button,
  Alert,
  Card,
  Stack,
  Chip
} from '@mui/material';
import {
  PlayArrow,
  Info,
  Security
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

export default function AnonymousStartPage({ onAnonymousStart }) {
  const [loading, setLoading] = useState(false);

  const handleAnonymousStart = async () => {
    setLoading(true);
    try {
      // 匿名ユーザーでの開始処理
      await new Promise(resolve => setTimeout(resolve, 1000)); // ローディング演出
      onAnonymousStart();
    } catch (error) {
      console.error('Anonymous start error:', error);
    } finally {
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
            <Box sx={{ p: 6, pb: 4 }}>
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
                  
                  {/* Preview Badge */}
                  <Chip
                    label="プレビュー版"
                    size="small"
                    sx={{
                      bgcolor: 'rgba(255, 193, 7, 0.9)',
                      color: '#000',
                      fontWeight: 600,
                      fontSize: '0.75rem'
                    }}
                  />
                  
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
                      ログイン無しで始める
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
                  <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                    プレビュー版について
                  </Typography>
                  <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                    • データは一時的な保存となります<br/>
                    • 作成したフォームやデータは定期的に削除されます<br/>
                    • あくまでもプレビュー版としてご利用ください
                  </Typography>
                </Alert>
              </motion.div>
            </Box>

            {/* Action Section */}
            <Box sx={{ p: 6, pt: 0 }}>
              <motion.div variants={fadeInUp}>
                <Stack spacing={3}>
                  {/* Start Button */}
                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    startIcon={<PlayArrow />}
                    onClick={handleAnonymousStart}
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
                    {loading ? 'プレビューを準備中...' : 'プレビューを開始'}
                  </Button>

                  {/* Security Notice */}
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1,
                      justifyContent: 'center',
                      mt: 2
                    }}
                  >
                    <Security sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography 
                      variant="caption" 
                      color="text.secondary"
                      sx={{ fontSize: '0.75rem' }}
                    >
                      セキュアな匿名アクセスで安全にお試しいただけます
                    </Typography>
                  </Box>
                </Stack>
              </motion.div>
            </Box>

            {/* Features Preview */}
            <Box sx={{ px: 6, pb: 6 }}>
              <motion.div variants={fadeInUp}>
                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  align="center"
                  sx={{ mb: 2, fontWeight: 500 }}
                >
                  プレビューで体験できる機能
                </Typography>
                <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap">
                  {[
                    'フォーム作成',
                    'リアルタイムプレビュー',
                    'テンプレート',
                    'データ分析',
                    'QRコード生成'
                  ].map((feature, index) => (
                    <Chip
                      key={index}
                      label={feature}
                      size="small"
                      variant="outlined"
                      sx={{
                        borderColor: 'rgba(94, 23, 235, 0.3)',
                        color: '#5e17eb',
                        fontSize: '0.7rem',
                        mb: 1
                      }}
                    />
                  ))}
                </Stack>
              </motion.div>
            </Box>
          </Card>
        </motion.div>
      </Container>
    </Box>
  );
}