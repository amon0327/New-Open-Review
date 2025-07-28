import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Card,
  Typography,
  Button,
  Stack,
  IconButton,
  Avatar,
  Divider
} from '@mui/material';
import { Palette, Upload, Photo } from '@mui/icons-material';

const ThemeSettings = ({
  selectedColor,
  setSelectedColor,
  selectedFont,
  setSelectedFont,
  logoImage,
  setLogoImage
}) => {
  // カラーパレット
  const colorOptions = [
    { name: '紫', value: '#5e17eb' },
    { name: '青', value: '#3b82f6' },
    { name: '緑', value: '#10b981' },
    { name: '赤', value: '#ef4444' },
    { name: 'オレンジ', value: '#f59e0b' },
    { name: 'ピンク', value: '#ec4899' }
  ];

  // フォントオプション
  const fontOptions = [
    { name: 'デフォルト', value: 'system-ui' },
    { name: 'ゴシック', value: 'Hiragino Kaku Gothic Pro' },
    { name: '明朝', value: 'Hiragino Mincho Pro' },
    { name: 'Noto Sans', value: 'Noto Sans JP' }
  ];

  const handleLogoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
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
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 2
            }}
          >
            <Palette sx={{ color: 'white', fontSize: '1.2rem' }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
              テーマ設定
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              フォームの外観をカスタマイズ
            </Typography>
          </Box>
        </Box>

        <Stack spacing={3}>
          {/* テーマカラー */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: '#374151' }}>
              テーマカラー
            </Typography>
            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
              {colorOptions.map((color) => (
                <motion.div
                  key={color.value}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Box
                    onClick={() => setSelectedColor(color.value)}
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 2,
                      backgroundColor: color.value,
                      cursor: 'pointer',
                      border: selectedColor === color.value 
                        ? '3px solid #1e293b' 
                        : '2px solid transparent',
                      boxShadow: selectedColor === color.value 
                        ? '0 0 0 2px white, 0 0 0 4px ' + color.value
                        : '0 2px 4px rgba(0, 0, 0, 0.1)',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
                      }
                    }}
                  />
                </motion.div>
              ))}
            </Box>
          </Box>

          <Divider />

          {/* フォント */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: '#374151' }}>
              フォント
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {fontOptions.map((font) => (
                <Button
                  key={font.value}
                  variant={selectedFont === font.value ? 'contained' : 'outlined'}
                  onClick={() => setSelectedFont(font.value)}
                  size="small"
                  sx={{
                    fontFamily: font.value,
                    borderRadius: 2,
                    textTransform: 'none',
                    px: 2,
                    ...(selectedFont === font.value ? {
                      backgroundColor: selectedColor,
                      '&:hover': {
                        backgroundColor: selectedColor
                      }
                    } : {
                      borderColor: '#e2e8f0',
                      color: '#64748b',
                      '&:hover': {
                        borderColor: selectedColor,
                        backgroundColor: 'rgba(94, 23, 235, 0.05)'
                      }
                    })
                  }}
                >
                  {font.name}
                </Button>
              ))}
            </Box>
          </Box>

          <Divider />

          {/* ロゴ画像 */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: '#374151' }}>
              ロゴ画像
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {logoImage ? (
                <Avatar
                  src={logoImage}
                  sx={{ width: 60, height: 60, borderRadius: 2 }}
                  variant="rounded"
                />
              ) : (
                <Box
                  sx={{
                    width: 60,
                    height: 60,
                    borderRadius: 2,
                    border: '2px dashed #cbd5e1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#f8fafc'
                  }}
                >
                  <Photo sx={{ color: '#94a3b8', fontSize: '1.5rem' }} />
                </Box>
              )}
              
              <Box>
                <input
                  accept="image/*"
                  type="file"
                  id="logo-upload"
                  style={{ display: 'none' }}
                  onChange={handleLogoUpload}
                />
                <label htmlFor="logo-upload">
                  <Button
                    component="span"
                    variant="outlined"
                    startIcon={<Upload />}
                    size="small"
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      borderColor: '#e2e8f0',
                      color: '#64748b',
                      '&:hover': {
                        borderColor: selectedColor,
                        backgroundColor: 'rgba(94, 23, 235, 0.05)'
                      }
                    }}
                  >
                    {logoImage ? '変更' : 'アップロード'}
                  </Button>
                </label>
                {logoImage && (
                  <Button
                    variant="text"
                    size="small"
                    onClick={() => setLogoImage(null)}
                    sx={{
                      ml: 1,
                      color: '#64748b',
                      textTransform: 'none',
                      '&:hover': { color: '#ef4444' }
                    }}
                  >
                    削除
                  </Button>
                )}
              </Box>
            </Box>
            <Typography variant="caption" sx={{ color: '#94a3b8', mt: 1, display: 'block' }}>
              推奨サイズ: 200×200px以下、PNG/JPG形式
            </Typography>
          </Box>
        </Stack>
      </Card>
    </motion.div>
  );
};

export default ThemeSettings;