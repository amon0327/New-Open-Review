import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChromePicker } from 'react-color';
import {
  Box,
  Card,
  Typography,
  Button,
  Stack,
  IconButton,
  Avatar,
  Divider,
  CardContent
} from '@mui/material';
import { 
  Palette, 
  Upload, 
  Photo, 
  Add, 
  Image as ImageIcon,
  CloudUpload as CloudUploadIcon
} from '@mui/icons-material';

const ThemeSettings = ({
  selectedColor,
  setSelectedColor,
  selectedFont,
  setSelectedFont,
  logoImage,
  setLogoImage,
  // Supabase連携用のprops
  onThemeColorUpdate,
  onLogoImageUpdate
}) => {
  // カラーピッカーの状態
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [lastCustomColor, setLastCustomColor] = useState('#5e17eb'); // 最後に選択されたカスタムカラー
  
  // カラーパレット
  const colorOptions = [
    { name: '紫', value: '#5e17eb' },
    { name: '青', value: '#3b82f6' },
    { name: '緑', value: '#10b981' },
    { name: '赤', value: '#ef4444' },
    { name: 'オレンジ', value: '#f59e0b' },
    { name: 'ピンク', value: '#ec4899' }
  ];

  // プリセットカラーかどうかを判定
  const isPresetColor = colorOptions.some(color => color.value === selectedColor);
  const isCustomColor = !isPresetColor;

  // フォントオプション
  const fontOptions = [
    { name: 'デフォルト', value: 'system-ui' },
    { name: 'ゴシック', value: 'Hiragino Kaku Gothic Pro' },
    { name: '明朝', value: 'Hiragino Mincho Pro' },
    { name: 'Noto Sans', value: 'Noto Sans JP' }
  ];

  const handleLogoUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      // ローカル状態を即座に更新（プレビュー用）
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoImage(e.target.result);
      };
      reader.readAsDataURL(file);

      // Supabaseにアップロード（onLogoImageUpdateハンドラーが定義されている場合）
      if (onLogoImageUpdate) {
        try {
          await onLogoImageUpdate(file);
        } catch (error) {
          console.error('Logo upload error:', error);
        }
      }
    }
  };

  // カラーピッカーのハンドラー
  const handleColorChange = async (color) => {
    setSelectedColor(color.hex);
    setLastCustomColor(color.hex); // カスタムカラーを履歴として保存
    
    // Supabaseに保存（onThemeColorUpdateハンドラーが定義されている場合）
    if (onThemeColorUpdate) {
      try {
        await onThemeColorUpdate(color.hex);
      } catch (error) {
        console.error('Theme color update error:', error);
      }
    }
  };

  const handleColorPickerToggle = () => {
    setShowColorPicker(!showColorPicker);
  };

  const handleColorPickerClose = () => {
    setShowColorPicker(false);
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
                    onClick={async () => {
                      setSelectedColor(color.value);
                      // Supabaseに保存
                      if (onThemeColorUpdate) {
                        try {
                          await onThemeColorUpdate(color.value);
                        } catch (error) {
                          console.error('Theme color update error:', error);
                        }
                      }
                    }}
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '20px', // 半径を明示的に指定
                      backgroundColor: color.value,
                      cursor: 'pointer',
                      border: selectedColor === color.value 
                        ? '3px solid #1e293b' 
                        : '2px solid transparent',
                      boxShadow: selectedColor === color.value 
                        ? '0 0 0 2px white, 0 0 0 4px ' + color.value
                        : '0 2px 4px rgba(0, 0, 0, 0.1)',
                      transition: 'all 0.2s ease',
                      overflow: 'hidden', // 内容のはみ出しを防ぐ
                      flexShrink: 0, // 縮小を防ぐ
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
                      }
                    }}
                  />
                </motion.div>
              ))}
              
              {/* カスタムカラー選択ボタン */}
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Box
                  onClick={handleColorPickerToggle}
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '20px', // 半径を明示的に指定
                    background: lastCustomColor !== '#5e17eb' && colorOptions.every(color => color.value !== lastCustomColor)
                      ? lastCustomColor // カスタムカラーが設定されている場合はその色
                      : '#e5e7eb', // 薄い灰色
                    cursor: 'pointer',
                    border: (showColorPicker || isCustomColor) ? '3px solid #1e293b' : '2px solid transparent',
                    boxShadow: (showColorPicker || isCustomColor)
                      ? `0 0 0 2px white, 0 0 0 4px ${isCustomColor ? selectedColor : lastCustomColor}`
                      : '0 2px 4px rgba(0, 0, 0, 0.1)',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden', // 内容のはみ出しを防ぐ
                    flexShrink: 0, // 縮小を防ぐ
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
                    }
                  }}
                >
                  {/* プラスアイコンはカスタムカラー未設定時のみ表示 */}
                  {(lastCustomColor === '#5e17eb' || colorOptions.some(color => color.value === lastCustomColor)) && (
                    <Add 
                      sx={{ 
                        color: '#6b7280', // 灰色背景に合わせてダークグレー
                        fontSize: '1.2rem'
                      }} 
                    />
                  )}
                </Box>
              </motion.div>
            </Box>
            
            {/* カラーピッカー */}
            {showColorPicker && (
              <Box sx={{ mt: 3, position: 'relative' }}>
                {/* 背景オーバーレイ */}
                <Box
                  sx={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 999,
                    backgroundColor: 'transparent'
                  }}
                  onClick={handleColorPickerClose}
                />
                
                {/* カラーピッカー */}
                <Box sx={{ position: 'relative', zIndex: 1000 }}>
                  <ChromePicker
                    color={selectedColor}
                    onChange={handleColorChange}
                    onChangeComplete={(color) => setSelectedColor(color.hex)}
                    disableAlpha={true}
                  />
                </Box>
              </Box>
            )}
          </Box>

          <Divider />

          {/* フォント */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#374151' }}>
                フォント
              </Typography>
              <Box
                sx={{
                  px: 1.5,
                  py: 0.5,
                  borderRadius: '12px',
                  backgroundColor: '#fef3c7',
                  border: '1px solid #fcd34d'
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: '#92400e',
                    fontSize: '0.75rem',
                    fontWeight: 600
                  }}
                >
                  実装予定
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {fontOptions.map((font) => (
                <Button
                  key={font.value}
                  variant="outlined"
                  disabled
                  size="small"
                  sx={{
                    fontFamily: font.value,
                    borderRadius: 2,
                    textTransform: 'none',
                    px: 2,
                    borderColor: '#e2e8f0',
                    color: '#94a3b8',
                    backgroundColor: '#f8fafc',
                    '&.Mui-disabled': {
                      borderColor: '#e2e8f0',
                      color: '#94a3b8'
                    }
                  }}
                >
                  {font.name}
                </Button>
              ))}
            </Box>
            <Typography variant="caption" sx={{ color: '#94a3b8', mt: 1, display: 'block' }}>
              フォント変更機能は今後のアップデートで追加予定です
            </Typography>
          </Box>

          <Divider />

          {/* ロゴ画像 */}
          <Box>
            <Box
              sx={{
                borderRadius: '8px',
                border: '1px solid #E5E7EB',
                backgroundColor: '#FFFFFF',
                p: 2
              }}
            >
              {/* ヘッダー部分 */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '6px',
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                  }}
                >
                  <ImageIcon sx={{ color: 'white', fontSize: '1rem' }} />
                </Box>
                <Box sx={{ minWidth: 0, overflow: 'hidden' }}>
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: 600,
                      color: '#1F2937',
                      fontSize: '0.9rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                    title="ロゴ画像"
                  >
                    ロゴ画像
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#6B7280',
                      fontSize: '0.75rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                    title="ブランドロゴやアイコン"
                  >
                    ブランドロゴやアイコン
                  </Typography>
                </Box>
              </Box>

              <Stack spacing={3}>
                {/* 画像プレビュー */}
                {logoImage ? (
                  <Card sx={{ borderRadius: 0, overflow: 'hidden' }}>
                    <CardContent sx={{ p: 2, textAlign: 'center' }}>
                      <Box
                        component="img"
                        src={logoImage}
                        alt="ロゴ画像"
                        sx={{
                          maxWidth: '100%',
                          maxHeight: 80,
                          objectFit: 'contain'
                        }}
                      />
                    </CardContent>
                  </Card>
                ) : (
                  <Card 
                    sx={{ 
                      borderRadius: 0,
                      border: '2px dashed #E5E7EB',
                      backgroundColor: '#F9FAFB'
                    }}
                  >
                    <CardContent sx={{ p: 3, textAlign: 'center' }}>
                      <ImageIcon sx={{ fontSize: '2rem', color: '#9CA3AF', mb: 1 }} />
                      <Typography variant="body2" sx={{ color: '#6B7280', fontSize: '0.8rem' }}>
                        ロゴが設定されていません
                      </Typography>
                    </CardContent>
                  </Card>
                )}
                
                {/* アップロード・削除ボタン */}
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<CloudUploadIcon />}
                    component="label"
                    sx={{
                      backgroundColor: '#5E17EB',
                      '&:hover': { backgroundColor: '#4C1D95' },
                      fontSize: '0.75rem',
                      px: 2,
                      py: 0.5,
                      minWidth: 'auto'
                    }}
                  >
                    アップロード
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={handleLogoUpload}
                    />
                  </Button>
                  {logoImage && (
                    <Button  
                      variant="outlined"
                      size="small"
                      onClick={async () => {
                        setLogoImage(null);
                        // Supabaseからも削除
                        if (onLogoImageUpdate) {
                          try {
                            await onLogoImageUpdate(null);
                          } catch (error) {
                            console.error('Logo deletion error:', error);
                          }
                        }
                      }}
                      sx={{
                        borderColor: '#DC2626',
                        color: '#DC2626',
                        '&:hover': {
                          borderColor: '#B91C1C',
                          backgroundColor: 'rgba(220, 38, 38, 0.04)'
                        },
                        fontSize: '0.75rem',
                        px: 2,
                        py: 0.5,
                        minWidth: 'auto'
                      }}
                    >
                      削除
                    </Button>
                  )}
                </Box>
                
                {/* 使用ガイド */}
                <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                  推奨サイズ: 200×200px以下、PNG/JPG形式
                </Typography>
              </Stack>
            </Box>
          </Box>
        </Stack>
      </Card>
    </motion.div>
  );
};

export default ThemeSettings;