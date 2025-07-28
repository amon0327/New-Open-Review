import React from 'react';
import { motion } from 'framer-motion';
import QRCode from 'react-qr-code';
import toast from 'react-hot-toast';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Switch,
  TextField,
  IconButton,
  Tooltip
} from '@mui/material';
import { Public, CheckCircle } from '@mui/icons-material';
import { 
  ClipboardDocumentIcon, 
  ArrowDownTrayIcon 
} from '@heroicons/react/24/outline';

const PublishSettings = ({
  isPublished,
  setIsPublished,
  projectTitle
}) => {
  const formUrl = `https://forms.openreview.app/${projectTitle.toLowerCase().replace(/\s+/g, '-')}`;

  const copyUrl = () => {
    navigator.clipboard.writeText(formUrl);
    toast.success('URLをコピーしました！');
  };

  const downloadQR = () => {
    const svg = document.getElementById('qr-code');
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
      downloadLink.download = `${projectTitle}-qr.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    toast.success('QRコードをダウンロードしました！');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <Paper
        elevation={4}
        sx={{
          p: 4,
          borderRadius: 3,
          border: '1px solid rgba(94, 23, 235, 0.1)',
          '&:hover': {
            boxShadow: '0 8px 30px rgba(94, 23, 235, 0.15)',
            transform: 'translateY(-2px)'
          },
          transition: 'all 0.3s ease'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 2,
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
            }}
          >
            <Public sx={{ color: 'white', fontSize: '1.5rem' }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a202c' }}>
              公開設定
            </Typography>
            <Typography variant="body2" sx={{ color: '#6b7280' }}>
              フォームの公開状態を管理
            </Typography>
          </Box>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500, color: '#374151' }}>
                  フォームを公開する
                </Typography>
                <Typography variant="caption" sx={{ color: '#6b7280' }}>
                  オンにするとフォームが一般公開されます
                </Typography>
              </Box>
              <Switch
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: '#5e17eb'
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: '#5e17eb'
                  }
                }}
              />
            </Box>
          </Grid>

          {isPublished && (
            <>
              <Grid item xs={12}>
                <Typography variant="body2" sx={{ fontWeight: 500, mb: 2, color: '#374151' }}>
                  公開URL
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    fullWidth
                    value={formUrl}
                    InputProps={{
                      readOnly: true,
                      endAdornment: (
                        <Tooltip title="URLをコピー">
                          <IconButton onClick={copyUrl} edge="end">
                            <ClipboardDocumentIcon className="w-5 h-5" />
                          </IconButton>
                        </Tooltip>
                      )
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: '#f8fafc'
                      }
                    }}
                  />
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="body2" sx={{ fontWeight: 500, mb: 2, color: '#374151' }}>
                  QRコード
                </Typography>
                <Paper
                  elevation={2}
                  sx={{
                    p: 3,
                    textAlign: 'center',
                    backgroundColor: '#f8fafc',
                    borderRadius: 2
                  }}
                >
                  <QRCode
                    id="qr-code"
                    value={formUrl}
                    size={120}
                    style={{ marginBottom: '16px' }}
                  />
                  <Box>
                    <Tooltip title="QRコードをダウンロード">
                      <IconButton 
                        onClick={downloadQR}
                        sx={{
                          backgroundColor: '#5e17eb',
                          color: 'white',
                          '&:hover': {
                            backgroundColor: '#4c1d95'
                          }
                        }}
                      >
                        <ArrowDownTrayIcon className="w-5 h-5" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="body2" sx={{ fontWeight: 500, mb: 2, color: '#374151' }}>
                  公開状態
                </Typography>
                <Box
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    border: '1px solid rgba(34, 197, 94, 0.2)'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <CheckCircle sx={{ color: '#16a34a', fontSize: '1.2rem' }} />
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#16a34a' }}>
                      公開中
                    </Typography>
                  </Box>
                  <Typography variant="caption" sx={{ color: '#15803d' }}>
                    フォームにアクセス可能です
                  </Typography>
                </Box>
              </Grid>
            </>
          )}
        </Grid>
      </Paper>
    </motion.div>
  );
};

export default PublishSettings;