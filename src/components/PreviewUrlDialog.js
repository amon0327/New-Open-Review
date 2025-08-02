import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Paper,
  Stack,
  Divider,
  Chip,
  Alert
} from '@mui/material';
import {
  Close as CloseIcon,
  ContentCopy as CopyIcon,
  QrCode as QrCodeIcon,
  Launch as LaunchIcon,
  Preview as PreviewIcon
} from '@mui/icons-material';
import QRCode from 'qrcode';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const PreviewUrlDialog = ({ open, onClose, formId }) => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [copied, setCopied] = useState(false);

  // プレビューURLを生成
  const previewUrl = `http://localhost:3000/?reviewFormId=${formId}&preview=true`;

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
          maxWidth="sm"
          fullWidth
          PaperProps={{
            component: motion.div,
            initial: { opacity: 0, scale: 0.9, y: 50 },
            animate: { opacity: 1, scale: 1, y: 0 },
            exit: { opacity: 0, scale: 0.9, y: 50 },
            transition: { duration: 0.3, ease: "easeOut" },
            sx: {
              borderRadius: 3,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden'
            }
          }}
        >
          {/* ヘッダー */}
          <DialogTitle
            sx={{
              background: 'linear-gradient(135deg, #5e17eb 0%, #764ba2 100%)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              py: 2.5,
              position: 'relative'
            }}
          >
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <PreviewIcon sx={{ fontSize: '1.2rem' }} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
                プレビューURL
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.85rem' }}>
                フォームをプレビューで確認
              </Typography>
            </Box>
            <IconButton
              onClick={onClose}
              sx={{
                color: 'white',
                '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' }
              }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>

          {/* コンテンツ */}
          <DialogContent sx={{ p: 3 }}>
            <Stack spacing={3}>
              {/* URL表示セクション */}
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, color: '#374151' }}>
                  プレビューURL
                </Typography>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: 2
                  }}
                >
                  <TextField
                    value={previewUrl}
                    variant="outlined"
                    size="small"
                    fullWidth
                    InputProps={{
                      readOnly: true,
                      endAdornment: (
                        <IconButton
                          onClick={handleCopyUrl}
                          size="small"
                          sx={{
                            color: copied ? '#10b981' : '#6b7280',
                            '&:hover': { backgroundColor: 'rgba(94, 23, 235, 0.1)' }
                          }}
                        >
                          <CopyIcon fontSize="small" />
                        </IconButton>
                      ),
                      sx: {
                        backgroundColor: 'white',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#d1d5db'
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#5e17eb'
                        }
                      }
                    }}
                    sx={{ fontSize: '0.85rem' }}
                  />
                  
                  {copied && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                    >
                      <Chip
                        label="コピーしました！"
                        size="small"
                        color="success"
                        sx={{ mt: 1, fontSize: '0.75rem' }}
                      />
                    </motion.div>
                  )}
                </Paper>
              </Box>

              <Divider />

              {/* QRコードセクション */}
              <Box sx={{ textAlign: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 2 }}>
                  <QrCodeIcon sx={{ color: '#5e17eb', fontSize: '1.2rem' }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#374151' }}>
                    QRコード
                  </Typography>
                </Box>
                
                {qrCodeDataUrl ? (
                  <Paper
                    elevation={0}
                    sx={{
                      display: 'inline-block',
                      p: 2,
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: 2,
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    <Box
                      component="img"
                      src={qrCodeDataUrl}
                      alt="QR Code"
                      sx={{
                        width: 180,
                        height: 180,
                        display: 'block'
                      }}
                    />
                  </Paper>
                ) : (
                  <Box
                    sx={{
                      width: 180,
                      height: 180,
                      backgroundColor: '#f3f4f6',
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto'
                    }}
                  >
                    <Typography variant="body2" sx={{ color: '#9ca3af' }}>
                      QRコード生成中...
                    </Typography>
                  </Box>
                )}
                
                <Typography variant="caption" sx={{ color: '#6b7280', mt: 1, display: 'block' }}>
                  スマートフォンでQRコードを読み取ってプレビューを確認
                </Typography>
              </Box>

              {/* 注意事項 */}
              <Alert
                severity="info"
                sx={{
                  borderRadius: 2,
                  backgroundColor: 'rgba(59, 130, 246, 0.05)',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                  '& .MuiAlert-icon': { color: '#3b82f6' }
                }}
              >
                <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                  このURLは開発環境用です。本番環境では適切なドメインが使用されます。
                </Typography>
              </Alert>
            </Stack>
          </DialogContent>

          {/* アクション */}
          <DialogActions sx={{ p: 3, pt: 0 }}>
            <Button
              variant="outlined"
              onClick={handleCopyUrl}
              startIcon={<CopyIcon />}
              sx={{
                borderColor: '#d1d5db',
                color: '#374151',
                '&:hover': {
                  borderColor: '#5e17eb',
                  backgroundColor: 'rgba(94, 23, 235, 0.05)'
                }
              }}
            >
              URLをコピー
            </Button>
            <Button
              variant="contained"
              onClick={handleOpenPreview}
              startIcon={<LaunchIcon />}
              sx={{
                backgroundColor: '#5e17eb',
                '&:hover': { backgroundColor: '#4c1d95' },
                boxShadow: '0 4px 12px rgba(94, 23, 235, 0.4)'
              }}
            >
              プレビューを開く
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </AnimatePresence>
  );
};

export default PreviewUrlDialog;