import React from 'react';
import { motion } from 'framer-motion';
import QRCode from 'react-qr-code';
import toast from 'react-hot-toast';
import {
  Box,
  Card,
  Typography,
  TextField,
  Button,
  Stack,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  Public, 
  CheckCircle, 
  ContentCopy,
  Download
} from '@mui/icons-material';

const PublishSettings = ({
  isPublished,
  setIsPublished,
  projectTitle,
  onPublishClick // HeaderBarの公開処理を呼び出すためのコールバック関数
}) => {
  const formUrl = `https://forms.openreview.app/${projectTitle.toLowerCase().replace(/\s+/g, '-')}`;

  const handlePublishClick = () => {
    if (onPublishClick) {
      onPublishClick(); // HeaderBarの公開処理を呼び出し
    }
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(formUrl);
    toast.success('URLをコピーしました！');
  };

  const downloadQR = () => {
    const svg = document.getElementById('qr-code');
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `${projectTitle || 'form'}-qr.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      };
      
      img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
      toast.success('QRコードをダウンロードしました！');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
    >
      <Card
        sx={{
          p: 3,
          borderRadius: 3,
          border: '1px solid #f1f5f9',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
          },
          transition: 'box-shadow 0.2s ease'
        }}
      >
        {/* ヘッダー */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 2
            }}
          >
            <Public sx={{ color: 'white', fontSize: '1.2rem' }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
              公開設定
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              フォームの公開状態を管理
            </Typography>
          </Box>
        </Box>

        <Stack spacing={3}>
          {/* 公開ボタン */}
          <Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#374151' }}>
                フォームを公開する
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.875rem' }}>
                ボタンを押すとフォームが一般公開されます
              </Typography>
            </Box>
            
            {isPublished ? (
              // 公開済みの場合は状態表示
              <Box
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5
                }}
              >
                <CheckCircle sx={{ color: '#10b981', fontSize: '1.25rem' }} />
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#065f46' }}>
                    公開済み
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#047857', fontSize: '0.875rem' }}>
                    フォームにアクセス可能です
                  </Typography>
                </Box>
              </Box>
            ) : (
              // 未公開の場合は公開ボタン
              <Button
                variant="contained"
                onClick={handlePublishClick}
                sx={{
                  height: 48,
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  fontSize: '1rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5a67d8 0%, #6b46a3 100%)',
                    boxShadow: '0 6px 16px rgba(102, 126, 234, 0.4)',
                    transform: 'translateY(-1px)'
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                フォームを公開する
              </Button>
            )}
          </Box>

          {isPublished && (
            <>
              <Divider />

              {/* 公開URL */}
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: '#374151' }}>
                  公開URL
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    fullWidth
                    value={formUrl}
                    InputProps={{
                      readOnly: true,
                      sx: {
                        fontSize: '0.875rem',
                        backgroundColor: '#f8fafc',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#e2e8f0'
                        }
                      }
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2
                      }
                    }}
                  />
                  <Tooltip title="URLをコピー">
                    <IconButton
                      onClick={copyUrl}
                      sx={{
                        backgroundColor: '#f1f5f9',
                        border: '1px solid #e2e8f0',
                        borderRadius: 2,
                        '&:hover': {
                          backgroundColor: '#e2e8f0'
                        }
                      }}
                    >
                      <ContentCopy sx={{ fontSize: '1.1rem', color: '#64748b' }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>

              {/* QRコード */}
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: '#374151' }}>
                  QRコード
                </Typography>
                <Box
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    textAlign: 'center'
                  }}
                >
                  <QRCode
                    id="qr-code"
                    value={formUrl}
                    size={120}
                    style={{ marginBottom: '16px' }}
                  />
                  <Box>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Download />}
                      onClick={downloadQR}
                      sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        borderColor: '#e2e8f0',
                        color: '#64748b',
                        '&:hover': {
                          borderColor: '#3b82f6',
                          backgroundColor: 'rgba(59, 130, 246, 0.05)'
                        }
                      }}
                    >
                      ダウンロード
                    </Button>
                  </Box>
                </Box>
              </Box>
            </>
          )}
        </Stack>
      </Card>
    </motion.div>
  );
};

export default PublishSettings;