import React from 'react';
import { motion } from 'framer-motion';
import { Box, Typography, Button, Container } from '@mui/material';
import { Add, RocketLaunch } from '@mui/icons-material';

export default function HomePage({ user, onCreateFormClick }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      style={{ height: '100%', width: '100%' }}
    >
      <Box
        sx={{
          height: '100%',
          width: '100%',
          background: `
            linear-gradient(180deg, transparent 0%, rgba(255, 255, 255, 1) 60%),
            linear-gradient(90deg, rgba(94, 23, 235, 0.2) 0%, rgba(102, 126, 234, 0.2) 100%)
          `,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4
        }}
      >
        <Container maxWidth="md">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Box
              sx={{
                textAlign: 'center',
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                borderRadius: 4,
                p: 6,
                boxShadow: '0 20px 60px rgba(94, 23, 235, 0.15)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                maxWidth: 600,
                mx: 'auto'
              }}
            >
              {/* CTAアイコン */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.4, type: "spring", stiffness: 200 }}
                style={{ marginBottom: 24 }}
              >
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #5e17eb 0%, #667eea 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    boxShadow: '0 10px 30px rgba(94, 23, 235, 0.3)'
                  }}
                >
                  <RocketLaunch sx={{ color: 'white', fontSize: 40 }} />
                </Box>
              </motion.div>

              {/* CTAメッセージ */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #5e17eb 0%, #667eea 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    mb: 2,
                    lineHeight: 1.2
                  }}
                >
                  レビューフォームを作成しよう
                </Typography>
                
                <Typography
                  variant="h6"
                  sx={{
                    color: '#64748b',
                    fontWeight: 400,
                    mb: 4,
                    lineHeight: 1.6
                  }}
                >
                  カスタマイズ可能なレビューフォームで、
                  <br />
                  効率的なフィードバック収集を始めましょう
                </Typography>
              </motion.div>

              {/* 作成ボタン */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.8 }}
              >
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<Add />}
                  onClick={onCreateFormClick}
                  sx={{
                    background: 'linear-gradient(135deg, #5e17eb 0%, #667eea 100%)',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '1.1rem',
                    py: 1.5,
                    px: 4,
                    borderRadius: 3,
                    textTransform: 'none',
                    boxShadow: '0 8px 25px rgba(94, 23, 235, 0.3)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #4c0dbf 0%, #5a6fd8 100%)',
                      boxShadow: '0 12px 35px rgba(94, 23, 235, 0.4)',
                      transform: 'translateY(-2px)'
                    },
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                >
                  新しいフォームを作成
                </Button>
              </motion.div>
            </Box>
          </motion.div>
        </Container>
      </Box>
    </motion.div>
  );
}