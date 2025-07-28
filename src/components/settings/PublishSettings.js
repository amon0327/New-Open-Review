import React from 'react';
import { motion } from 'framer-motion';
import QRCode from 'react-qr-code';
import toast from 'react-hot-toast';
import {
  Box,
  Card,
  Typography,
  Switch,
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
  projectTitle
}) => {
  const formUrl = `https://forms.openreview.app/${projectTitle.toLowerCase().replace(/\s+/g, '-')}`;

  const copyUrl = () => {
    navigator.clipboard.writeText(formUrl);
    toast.success('URLをコピーしました！', {
      style: {
        borderRadius: '8px',
        background: '#10b981',
        color: '#fff',
      }
    });
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
      toast.success('QRコードをダウンロードしました！', {
        style: {
          borderRadius: '8px',
          background: '#10b981',
          color: '#fff',
        }
      });
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
          {/* 公開スイッチ */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#374151' }}>
                  フォームを公開する
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.875rem' }}>
                  オンにするとフォームが一般公開されます
                </Typography>
              </Box>
              <Switch
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: '#10b981'
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: '#10b981'
                  },
                  '& .MuiSwitch-track': {
                    backgroundColor: '#e5e7eb'
                  }
                }}
              />
            </Box>
          </Box>

          {isPublished && (
            <>
              <Divider />

              {/* 公開状態表示 */}
              <Box
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.2)'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <CheckCircle sx={{ color: '#10b981', fontSize: '1.25rem' }} />
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#065f46' }}>
                      公開中
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#047857', fontSize: '0.875rem' }}>
                      フォームにアクセス可能です
                    </Typography>
                  </Box>
                </Box>
              </Box>

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