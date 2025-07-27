import React from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Container,
  Paper,
  Typography,
  IconButton,
  AppBar,
  Toolbar
} from '@mui/material';
import {
  ArrowBack,
  Save,
  Preview,
  MoreVert
} from '@mui/icons-material';

export default function CreatePage({ onBackClick }) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        overflow: 'hidden'
      }}
    >
      {/* Top Navigation Bar */}
      <AppBar
        position="static"
        elevation={0}
        sx={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(0, 0, 0, 0.05)'
        }}
      >
        <Toolbar>
          <IconButton
            edge="start"
            onClick={onBackClick}
            sx={{
              mr: 2,
              color: '#64748b',
              '&:hover': {
                backgroundColor: 'rgba(100, 116, 139, 0.1)'
              }
            }}
          >
            <ArrowBack />
          </IconButton>
          
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: 1,
              background: 'linear-gradient(45deg, #5e17eb 30%, #764ba2 90%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 2
            }}
          >
            <Typography
              variant="body2"
              sx={{ color: 'white', fontWeight: 'bold' }}
            >
              O
            </Typography>
          </Box>
          
          <Typography
            variant="h6"
            sx={{
              flexGrow: 1,
              color: '#1a202c',
              fontWeight: 600
            }}
          >
            フォーム作成
          </Typography>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton
              sx={{
                color: '#64748b',
                '&:hover': {
                  backgroundColor: 'rgba(100, 116, 139, 0.1)'
                }
              }}
            >
              <Preview />
            </IconButton>
            
            <IconButton
              sx={{
                color: '#64748b',
                '&:hover': {
                  backgroundColor: 'rgba(100, 116, 139, 0.1)'
                }
              }}
            >
              <Save />
            </IconButton>
            
            <IconButton
              sx={{
                color: '#64748b',
                '&:hover': {
                  backgroundColor: 'rgba(100, 116, 139, 0.1)'
                }
              }}
            >
              <MoreVert />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main Content Container */}
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Paper
            elevation={8}
            sx={{
              height: 'calc(100vh - 140px)',
              borderRadius: 3,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Background Pattern */}
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'radial-gradient(circle at 20% 20%, rgba(94, 23, 235, 0.05) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(118, 75, 162, 0.05) 0%, transparent 50%)',
                zIndex: 0
              }}
            />

            {/* Content */}
            <Box
              sx={{
                textAlign: 'center',
                zIndex: 1,
                maxWidth: '600px',
                px: 4
              }}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                <Box
                  sx={{
                    width: 120,
                    height: 120,
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto',
                    mb: 3,
                    boxShadow: '0 20px 60px rgba(94, 23, 235, 0.3)'
                  }}
                >
                  <Typography
                    variant="h2"
                    sx={{ color: 'white', fontWeight: 'bold' }}
                  >
                    +
                  </Typography>
                </Box>
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 700,
                    background: 'linear-gradient(45deg, #5e17eb 30%, #764ba2 90%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    mb: 2
                  }}
                >
                  フォーム作成エリア
                </Typography>
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}
              >
                <Typography
                  variant="h6"
                  color="text.secondary"
                  sx={{
                    mb: 4,
                    lineHeight: 1.6,
                    maxWidth: '500px',
                    margin: '0 auto'
                  }}
                >
                  ここにフォーム作成のUIコンポーネントが配置されます。
                  ドラッグ&ドロップでの質問追加、リアルタイムプレビュー、
                  カスタマイズ機能などが実装される予定です。
                </Typography>
              </motion.div>

              {/* Feature Highlights */}
              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.5 }}
              >
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: 3,
                    mt: 4
                  }}
                >
                  {[
                    '質問タイプ選択',
                    'ドラッグ&ドロップ',
                    'リアルタイムプレビュー',
                    'カスタムデザイン'
                  ].map((feature, index) => (
                    <Box
                      key={feature}
                      sx={{
                        p: 3,
                        borderRadius: 2,
                        background: 'rgba(255, 255, 255, 0.7)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                        transition: 'transform 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-5px)'
                        }
                      }}
                    >
                      <Typography
                        variant="body1"
                        sx={{
                          fontWeight: 600,
                          color: '#64748b'
                        }}
                      >
                        {feature}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </motion.div>
            </Box>
          </Paper>
        </motion.div>
      </Container>
    </Box>
  );
}