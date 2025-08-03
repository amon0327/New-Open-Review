import React, { useState, useEffect } from 'react';
import {
  Dialog,
  Box,
  Typography,
  IconButton,
  Paper
} from '@mui/material';
import {
  Close as CloseIcon
} from '@mui/icons-material';
import QRCode from 'qrcode';
import { motion, AnimatePresence } from 'framer-motion';

const PreviewUrlDialog = ({ open, onClose, formId }) => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');

  // プレビューURLを生成
  const previewUrl = `http://localhost:3000/preview?reviewFormId=${formId}`;

  // QRコード生成
  useEffect(() => {
    if (open && formId) {
      QRCode.toDataURL(previewUrl, {
        width: 200,
        margin: 2,
        color: {
          dark: '#5e17eb',
          light: '#ffffff'
        }
      })
      .then(url => setQrCodeDataUrl(url))
      .catch(err => console.error('QR Code generation error:', err));
    }
  }, [open, formId, previewUrl]);

  return (
    <AnimatePresence>
      {open && (
        <Dialog
          open={open}
          onClose={onClose}
          maxWidth="xs"
          PaperProps={{
            component: motion.div,
            initial: { opacity: 0, scale: 0.8, y: 30 },
            animate: { opacity: 1, scale: 1, y: 0 },
            exit: { opacity: 0, scale: 0.8, y: 30 },
            transition: { duration: 0.4, ease: "easeOut" },
            sx: {
              borderRadius: 5,
              boxShadow: '0 25px 50px -12px rgba(94, 23, 235, 0.3)',
              overflow: 'hidden',
              background: 'linear-gradient(135deg, #5e17eb 0%, #764ba2 100%)',
              color: 'white',
              minWidth: 320
            }
          }}
        >
          <Box
            sx={{
              position: 'relative',
              p: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center'
            }}
          >
            {/* 閉じるボタン */}
            <IconButton
              onClick={onClose}
              sx={{
                position: 'absolute',
                right: 12,
                top: 12,
                color: 'rgba(255, 255, 255, 0.8)',
                width: 40,
                height: 40,
                '&:hover': { 
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: 'white'
                }
              }}
            >
              <CloseIcon sx={{ fontSize: '1.5rem' }} />
            </IconButton>

            {/* ロゴ */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Box
                component="img"
                src="https://otfreskkeaenahqziriz.supabase.co/storage/v1/object/public/app-assets/logo/OpenReviewDarkThemeLoog.png"
                alt="OpenReview Logo"
                sx={{
                  height: 40,
                  objectFit: 'contain',
                  mb: 3
                }}
              />
            </motion.div>

            {/* タイトル */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 700,
                  mb: 1,
                  fontSize: '1.25rem'
                }}
              >
                プレビューを確認
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  opacity: 0.9,
                  mb: 3,
                  fontSize: '0.9rem'
                }}
              >
                QRコードをスマートフォンで読み取ってください
              </Typography>
            </motion.div>

            {/* QRコード */}
            {qrCodeDataUrl ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                <Paper
                  elevation={0}
                  sx={{
                    display: 'inline-block',
                    p: 3,
                    backgroundColor: 'white',
                    borderRadius: 4,
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)'
                  }}
                >
                  <Box
                    component="img"
                    src={qrCodeDataUrl}
                    alt="QR Code"
                    sx={{
                      width: 160,
                      height: 160,
                      display: 'block'
                    }}
                  />
                </Paper>
              </motion.div>
            ) : (
              <Box
                sx={{
                  width: 160,
                  height: 160,
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px dashed rgba(255, 255, 255, 0.3)'
                }}
              >
                <Typography variant="body2" sx={{ opacity: 0.7, fontSize: '0.9rem' }}>
                  QRコード生成中...
                </Typography>
              </Box>
            )}
          </Box>
        </Dialog>
      )}
    </AnimatePresence>
  );
};

export default PreviewUrlDialog;