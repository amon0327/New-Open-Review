import React, { useState, useEffect } from 'react';
import {
  Dialog,
  Box,
  Typography,
  Button,
  IconButton,
  Paper,
  Stack,
  Chip
} from '@mui/material';
import {
  Close as CloseIcon,
  ContentCopy as CopyIcon,
  Launch as LaunchIcon,
  Smartphone as SmartphoneIcon
} from '@mui/icons-material';
import QRCode from 'qrcode';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const PreviewUrlDialog = ({ open, onClose, formId }) => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [copied, setCopied] = useState(false);

  // プレビューURLを生成
  const previewUrl = `http://localhost:3000/preview?reviewFormId=${formId}`;

  // QRコード生成
  useEffect(() => {
    if (open && formId) {
      QRCode.toDataURL(previewUrl, {
        width: 200,
        margin: 2,
        color: {
          dark: '#1a1a1a',
          light: '#ffffff'
        }
      })
      .then(url => setQrCodeDataUrl(url))
      .catch(err => console.error('QR Code generation error:', err));
    }
  }, [open, formId, previewUrl]);

  // URLをクリップボードにコピー
  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(previewUrl);
      setCopied(true);
      toast.success('URLをコピーしました');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy error:', err);
      toast.error('コピーに失敗しました');
    }
  };

  // プレビューを新しいタブで開く
  const handleOpenPreview = () => {
    window.open(previewUrl, '_blank');
  };

  return (
    <AnimatePresence>
      {open && (
        <Dialog
          open={open}
          onClose={onClose}
          maxWidth="xs"
          fullWidth
          PaperProps={{
            component: motion.div,
            initial: { opacity: 0, scale: 0.8, y: 50 },
            animate: { opacity: 1, scale: 1, y: 0 },
            exit: { opacity: 0, scale: 0.8, y: 50 },
            transition: { duration: 0.3, ease: "easeOut" },
            sx: {
              borderRadius: 4,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden',
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)'
            }
          }}
        >
          {/* ヘッダー */}
          <Box
            sx={{
              position: 'relative',
              p: 3,
              pb: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 700,
                color: '#1f2937',
                fontSize: '1.1rem'
              }}
            >
              プレビュー共有
            </Typography>
            <IconButton
              onClick={onClose}
              sx={{
                position: 'absolute',
                right: 8,
                top: 8,
                color: '#6b7280',
                '&:hover': { 
                  backgroundColor: 'rgba(0, 0, 0, 0.05)',
                  color: '#374151'
                }
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          {/* コンテンツ */}
          <Box sx={{ px: 3, pb: 3 }}>
            <Stack spacing={3} alignItems="center">
              {/* QRコード */}
              <Box sx={{ textAlign: 'center' }}>
                {qrCodeDataUrl ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <Paper
                      elevation={0}
                      sx={{
                        display: 'inline-block',
                        p: 2.5,
                        backgroundColor: '#ffffff',
                        border: '1px solid #e5e7eb',
                        borderRadius: 3,
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    >
                      <Box
                        component="img"
                        src={qrCodeDataUrl}
                        alt="QR Code"
                        sx={{
                          width: 140,
                          height: 140,
                          display: 'block'
                        }}
                      />
                    </Paper>
                  </motion.div>
                ) : (
                  <Box
                    sx={{
                      width: 140,
                      height: 140,
                      backgroundColor: '#f9fafb',
                      borderRadius: 3,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto',
                      border: '1px solid #e5e7eb'
                    }}
                  >
                    <Typography variant="body2" sx={{ color: '#9ca3af', fontSize: '0.85rem' }}>
                      生成中...
                    </Typography>
                  </Box>
                )}
                
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mt: 2 }}>
                  <SmartphoneIcon sx={{ color: '#6b7280', fontSize: '1rem' }} />
                  <Typography variant="caption" sx={{ color: '#6b7280', fontSize: '0.8rem' }}>
                    スマホで読み取り
                  </Typography>
                </Box>
              </Box>

              {/* URL表示 */}
              <Box sx={{ width: '100%' }}>
                <Paper
                  elevation={0}
                  onClick={handleCopyUrl}
                  sx={{
                    p: 2,
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e5e7eb',
                    borderRadius: 2,
                    width: '100%',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: '#5e17eb',
                      backgroundColor: 'rgba(94, 23, 235, 0.02)'
                    }
                  }}
                >
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: '#374151',
                      fontSize: '0.8rem',
                      wordBreak: 'break-all',
                      lineHeight: 1.4
                    }}
                  >
                    {previewUrl}
                  </Typography>
                </Paper>
                
                {copied && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    <Chip
                      label="コピー完了"
                      size="small"
                      color="success"
                      sx={{ 
                        mt: 1.5, 
                        fontSize: '0.75rem',
                        height: 24
                      }}
                    />
                  </motion.div>
                )}
              </Box>

              {/* アクションボタン */}
              <Stack direction="row" spacing={2} sx={{ width: '100%' }}>
                <Button
                  variant="outlined"
                  onClick={handleCopyUrl}
                  startIcon={<CopyIcon fontSize="small" />}
                  sx={{
                    flex: 1,
                    borderColor: '#d1d5db',
                    color: '#374151',
                    fontSize: '0.85rem',
                    py: 1.2,
                    '&:hover': {
                      borderColor: '#5e17eb',
                      backgroundColor: 'rgba(94, 23, 235, 0.05)'
                    }
                  }}
                >
                  コピー
                </Button>
                <Button
                  variant="contained"
                  onClick={handleOpenPreview}
                  startIcon={<LaunchIcon fontSize="small" />}
                  sx={{
                    flex: 1,
                    backgroundColor: '#5e17eb',
                    fontSize: '0.85rem',
                    py: 1.2,
                    '&:hover': { backgroundColor: '#4c1d95' },
                    boxShadow: '0 4px 12px rgba(94, 23, 235, 0.3)'
                  }}
                >
                  開く
                </Button>
              </Stack>
            </Stack>
          </Box>
        </Dialog>
      )}
    </AnimatePresence>
  );
};

export default PreviewUrlDialog;