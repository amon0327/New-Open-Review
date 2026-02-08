import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';
import {
  Box,
  Typography,
  Button,
  Alert,
  Stack
} from '@mui/material';
import {
  Google
} from '@mui/icons-material';

const fadeInUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.12 } }
};

// 浮遊するオーブアニメーション
const FloatingOrb = ({ size, top, left, delay, color }) => (
  <motion.div
    style={{
      position: 'absolute',
      width: size,
      height: size,
      borderRadius: '50%',
      background: color,
      top,
      left,
      filter: 'blur(60px)',
      pointerEvents: 'none',
    }}
    animate={{
      y: [0, -30, 0],
      x: [0, 15, 0],
      scale: [1, 1.1, 1],
    }}
    transition={{
      duration: 8,
      repeat: Infinity,
      ease: 'easeInOut',
      delay,
    }}
  />
);

const features = [
  { icon: '📝', title: 'かんたん作成', desc: '直感的な操作でアンケートを数分で作成' },
  { icon: '📊', title: 'リアルタイム分析', desc: '回答をグラフで即座に可視化' },
  { icon: '🔗', title: 'QRコードで共有', desc: 'テーブルに置くだけですぐ回収' },
];

export default function LoginPage({ onLogin }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin }
      });
      if (error) throw error;
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', flexDirection: { xs: 'column', md: 'row' } }}>

      {/* 左パネル: ブランディング */}
      <Box
        sx={{
          flex: { md: '1 1 55%' },
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(160deg, #1a0533 0%, #2d1b69 40%, #5e17eb 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: { xs: 4, sm: 6, md: 8 },
          minHeight: { xs: '40vh', md: 'auto' },
        }}
      >
        <FloatingOrb size={320} top="-10%" left="-5%" delay={0} color="rgba(102, 126, 234, 0.25)" />
        <FloatingOrb size={200} top="60%" left="70%" delay={2} color="rgba(118, 75, 162, 0.3)" />
        <FloatingOrb size={150} top="30%" left="50%" delay={4} color="rgba(94, 23, 235, 0.2)" />

        <motion.div
          variants={stagger}
          initial="initial"
          animate="animate"
          style={{ position: 'relative', zIndex: 1, maxWidth: 480, width: '100%' }}
        >
          {/* ロゴ */}
          <motion.div variants={fadeInUp}>
            <Box
              component="img"
              src="https://otfreskkeaenahqziriz.supabase.co/storage/v1/object/public/app-assets/logo/OpenReviewWhiteThemeLoog.png"
              alt="OpenReview"
              sx={{ height: { xs: 32, md: 40 }, width: 'auto', mb: { xs: 3, md: 5 } }}
            />
          </motion.div>

          {/* キャッチコピー */}
          <motion.div variants={fadeInUp}>
            <Typography
              sx={{
                color: '#fff',
                fontWeight: 800,
                fontSize: { xs: '1.75rem', sm: '2.25rem', md: '2.75rem' },
                lineHeight: 1.3,
                letterSpacing: '-0.02em',
                mb: 2,
              }}
            >
              お客様の声で、
              <br />
              また来たくなるお店へ。
            </Typography>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <Typography
              sx={{
                color: 'rgba(255,255,255,0.7)',
                fontSize: { xs: '0.95rem', md: '1.1rem' },
                lineHeight: 1.7,
                mb: { xs: 3, md: 5 },
                maxWidth: 400,
              }}
            >
              飲食店に特化したアンケートツール。
              <br />
              お店の改善ポイントが見える化されます。
            </Typography>
          </motion.div>

          {/* 特徴リスト */}
          <Stack spacing={2.5} sx={{ display: { xs: 'none', md: 'flex' } }}>
            {features.map((f, i) => (
              <motion.div key={i} variants={fadeInUp}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: '12px',
                      background: 'rgba(255,255,255,0.1)',
                      backdropFilter: 'blur(10px)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.25rem',
                      flexShrink: 0,
                    }}
                  >
                    {f.icon}
                  </Box>
                  <Box>
                    <Typography sx={{ color: '#fff', fontWeight: 600, fontSize: '0.95rem' }}>
                      {f.title}
                    </Typography>
                    <Typography sx={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.85rem' }}>
                      {f.desc}
                    </Typography>
                  </Box>
                </Box>
              </motion.div>
            ))}
          </Stack>
        </motion.div>
      </Box>

      {/* 右パネル: サインインフォーム */}
      <Box
        sx={{
          flex: { md: '1 1 45%' },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: { xs: 3, sm: 5, md: 6 },
          background: '#fafafa',
          position: 'relative',
        }}
      >
        <motion.div
          variants={stagger}
          initial="initial"
          animate="animate"
          style={{ width: '100%', maxWidth: 400 }}
        >
          {/* サインインヘッダー */}
          <motion.div variants={fadeInUp}>
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: { xs: '1.5rem', sm: '1.75rem' },
                color: '#111',
                mb: 0.5,
              }}
            >
              サインイン
            </Typography>
            <Typography
              sx={{
                color: '#888',
                fontSize: '0.95rem',
                mb: 4,
              }}
            >
              アカウントにログインして始めましょう
            </Typography>
          </motion.div>

          {/* エラー表示 */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
              >
                <Alert
                  severity="error"
                  sx={{
                    mb: 3,
                    borderRadius: '12px',
                    border: '1px solid rgba(211, 47, 47, 0.2)',
                    fontSize: '0.9rem',
                  }}
                >
                  {error}
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Googleサインインボタン */}
          <motion.div variants={fadeInUp}>
            <Button
              fullWidth
              variant="contained"
              onClick={handleGoogleLogin}
              disabled={loading}
              sx={{
                py: 1.75,
                borderRadius: '14px',
                background: '#111',
                color: '#fff',
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 600,
                boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                '&:hover': {
                  background: '#222',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                  transform: 'translateY(-1px)',
                },
                '&:active': {
                  transform: 'translateY(0)',
                },
                '&.Mui-disabled': {
                  background: '#555',
                  color: 'rgba(255,255,255,0.7)',
                },
              }}
            >
              <Google sx={{ fontSize: 20 }} />
              {loading ? 'サインイン中...' : 'Googleでサインイン'}
            </Button>
          </motion.div>

          {/* 区切り線 */}
          <motion.div variants={fadeInUp}>
            <Box sx={{ display: 'flex', alignItems: 'center', my: 3.5 }}>
              <Box sx={{ flex: 1, height: '1px', background: '#e0e0e0' }} />
              <Typography sx={{ px: 2, color: '#bbb', fontSize: '0.8rem', fontWeight: 500 }}>
                または
              </Typography>
              <Box sx={{ flex: 1, height: '1px', background: '#e0e0e0' }} />
            </Box>
          </motion.div>

          {/* Apple サインインボタン（将来用） */}
          <motion.div variants={fadeInUp}>
            <Button
              fullWidth
              variant="outlined"
              disabled
              sx={{
                py: 1.75,
                borderRadius: '14px',
                borderColor: '#ddd',
                color: '#999',
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                '&.Mui-disabled': {
                  borderColor: '#eee',
                  color: '#ccc',
                },
              }}
            >
              Apple でサインイン（近日公開）
            </Button>
          </motion.div>

          {/* フッター */}
          <motion.div variants={fadeInUp}>
            <Typography
              sx={{
                mt: 4,
                textAlign: 'center',
                color: '#bbb',
                fontSize: '0.8rem',
                lineHeight: 1.6,
              }}
            >
              サインインすることで、利用規約と
              <br />
              プライバシーポリシーに同意したことになります。
            </Typography>
          </motion.div>
        </motion.div>
      </Box>
    </Box>
  );
}
