import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChromePicker } from 'react-color';
import QRCode from 'react-qr-code';
import toast, { Toaster } from 'react-hot-toast';
import { 
  PaintBrushIcon, 
  FolderIcon, 
  GlobeAltIcon,
  PhotoIcon,
  SwatchIcon,
  DocumentTextIcon,
  EyeIcon,
  EyeSlashIcon,
  ClipboardDocumentIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Tooltip,
  Stack,
  Grid,
  Button,
  Switch,
  TextField,
  FormControl,
  Select,
  MenuItem
} from '@mui/material';
import {
  ArrowBack,
  Save,
  Preview,
  MoreVert,
  Add,
  TextFields,
  RadioButtonChecked,
  CheckBox,
  LinearScale,
  ExpandMore,
  Image,
  Description,
  Settings,
  Palette,
  PhoneAndroid,
  Computer,
  ZoomIn,
  ZoomOut,
  FitScreen,
  Folder,
  Edit
} from '@mui/icons-material';

// 左ナビゲーションアイテムの定義
const leftNavigationItems = [
  { icon: null, label: 'OpenReview', category: 'main', isLogo: true },
  { icon: <Folder />, label: 'フォルダー', category: 'main' },
  { icon: <Edit />, label: '編集', category: 'main' },
  { icon: <Settings />, label: '設定', category: 'main' }
];

export default function CreatePage() {
  // 状態管理
  const [selectedTool, setSelectedTool] = useState(null);
  const [showPageManager, setShowPageManager] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [projectTitle, setProjectTitle] = useState('OpenReview フォーム');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  
  // 設定関連の状態
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#5e17eb');
  const [isPublished, setIsPublished] = useState(true);
  const [projectDescription, setProjectDescription] = useState('');
  const [selectedFont, setSelectedFont] = useState('Inter');
  const [logoPreview, setLogoPreview] = useState(null);

  return (
    <Box
      sx={{
        display: 'flex',
        height: '100vh',
        overflow: 'hidden',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
      }}
    >
      {/* 左側ナビゲーション */}
      <Paper
        elevation={4}
        sx={{
          width: 72,
          height: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          py: 2,
          zIndex: 10,
          boxShadow: '4px 0 20px rgba(0, 0, 0, 0.1)'
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {leftNavigationItems.map((item, index) => (
            <Tooltip key={index} title={item.label} placement="right">
              <IconButton
                onClick={() => {
                  if (item.label === 'フォルダー') {
                    setShowPageManager(true);
                    setShowSettings(false);
                  } else if (item.label === '編集') {
                    setShowPageManager(false);
                    setShowSettings(false);
                    setSelectedTool(item);
                  } else if (item.label === '設定') {
                    setShowSettings(true);
                    setShowPageManager(false);
                    setSelectedTool(item);
                  } else {
                    setSelectedTool(item);
                  }
                }}
                sx={{
                  color: ((selectedTool?.label === item.label && !showPageManager && !showSettings) || (item.label === 'フォルダー' && showPageManager) || (item.label === '設定' && showSettings)) ? 'white' : 'rgba(255, 255, 255, 0.7)',
                  backgroundColor: ((selectedTool?.label === item.label && !showPageManager && !showSettings) || (item.label === 'フォルダー' && showPageManager) || (item.label === '設定' && showSettings)) ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                  borderRadius: 2,
                  width: 48,
                  height: 48,
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    color: 'white'
                  },
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {item.isLogo ? (
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: 1,
                      background: 'rgba(255, 255, 255, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backdropFilter: 'blur(10px)',
                      backgroundImage: 'none',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{ 
                        color: 'white', 
                        fontWeight: 'bold',
                        fontSize: '0.7rem'
                      }}
                    >
                      OR
                    </Typography>
                  </Box>
                ) : (
                  item.icon
                )}
              </IconButton>
            </Tooltip>
          ))}
        </Box>
      </Paper>

      {/* 右側メインエリア */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          height: '100vh'
        }}
      >
        {/* ヘッダー */}
        <Paper
          elevation={0}
          sx={{
            height: 65,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
            borderRadius: 0,
            display: 'flex',
            alignItems: 'center',
            px: 2,
            justifyContent: 'space-between'
          }}
        >
          {/* ヘッダー左側 */}
          <Typography
            variant="h5"
            sx={{
              color: '#1a202c',
              fontWeight: 700
            }}
          >
            {showSettings ? 'フォーム設定' : projectTitle}
          </Typography>

          {/* ヘッダー右側のアクションボタン */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="プレビュー">
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
            </Tooltip>
            
            <Tooltip title="保存">
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
            </Tooltip>
            
            <Tooltip title="その他">
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
            </Tooltip>
          </Box>
        </Paper>

        {/* メインコンテンツエリア */}
        <Box
          sx={{
            flex: 1,
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {showSettings ? (
            // シンプルでモダンな設定画面
            <Box
              sx={{
                p: 3,
                height: '100%',
                overflowY: 'auto',
                background: '#f8fafc',
                '&::-webkit-scrollbar': {
                  width: 6
                },
                '&::-webkit-scrollbar-track': {
                  background: '#f1f5f9',
                  borderRadius: 3
                },
                '&::-webkit-scrollbar-thumb': {
                  background: '#cbd5e1',
                  borderRadius: 3,
                  '&:hover': {
                    background: '#94a3b8'
                  }
                }
              }}
            >
              <Toaster position="top-right" />
              
              {/* シンプルな設定ヘッダー */}
              <Box sx={{ mb: 4 }}>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    color: '#1e293b',
                    mb: 1
                  }}
                >
                  フォーム設定
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    color: '#64748b'
                  }}
                >
                  フォームの外観と公開設定を管理します
                </Typography>
              </Box>

              {/* シンプルな設定グリッド */}
              <Grid container spacing={3} sx={{ maxWidth: 1200, mx: 'auto' }}>
                {/* テーマ設定 */}
                <Grid item xs={12} md={6} lg={4}>
                  <Paper
                    elevation={2}
                    sx={{
                      p: 3,
                      borderRadius: 2,
                      height: '100%',
                      border: '1px solid #e2e8f0',
                      '&:hover': {
                        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)',
                        transform: 'translateY(-2px)'
                      },
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: 2,
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mr: 2
                        }}
                      >
                        <PaintBrushIcon style={{ color: 'white', width: 24, height: 24 }} />
                      </Box>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
                          テーマ設定
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#64748b' }}>
                          ロゴ・カラー・フォント
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {/* ロゴ設定 */}
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                          ロゴ
                        </Typography>
                        <Box
                          component="label"
                          sx={{
                            display: 'block',
                            p: 2,
                            border: '2px dashed #cbd5e1',
                            borderRadius: 2,
                            textAlign: 'center',
                            cursor: 'pointer',
                            backgroundColor: '#f8fafc',
                            '&:hover': {
                              borderColor: '#667eea',
                              backgroundColor: '#f1f5f9'
                            }
                          }}
                        >
                          {logoPreview ? (
                            <img src={logoPreview} alt="Logo" style={{ maxHeight: 60 }} />
                          ) : (
                            <Typography variant="body2" sx={{ color: '#64748b' }}>
                              画像をアップロード
                            </Typography>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (e) => setLogoPreview(e.target.result);
                                reader.readAsDataURL(file);
                                toast.success('ロゴをアップロード');
                              }
                            }}
                          />
                        </Box>
                      </Box>

                      {/* カラー設定 */}
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                          テーマカラー
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Box
                            sx={{
                              width: 40,
                              height: 40,
                              borderRadius: 1,
                              backgroundColor: selectedColor,
                              cursor: 'pointer',
                              border: '2px solid white',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                            }}
                            onClick={() => setShowColorPicker(!showColorPicker)}
                          />
                          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                            {selectedColor}
                          </Typography>
                        </Box>
                        {showColorPicker && (
                          <Box sx={{ mt: 2 }}>
                            <ChromePicker
                              color={selectedColor}
                              onChange={(color) => setSelectedColor(color.hex)}
                            />
                          </Box>
                        )}
                      </Box>

                      {/* フォント設定 */}
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                          フォント
                        </Typography>
                        <Select
                          value={selectedFont}
                          onChange={(e) => setSelectedFont(e.target.value)}
                          size="small"
                          fullWidth
                          sx={{ backgroundColor: '#f8fafc' }}
                        >
                          <MenuItem value="Inter">Inter</MenuItem>
                          <MenuItem value="Noto Sans JP">Noto Sans JP</MenuItem>
                          <MenuItem value="Roboto">Roboto</MenuItem>
                        </Select>
                      </Box>
                    </Box>
                  </Paper>
                </Grid>

                {/* プロジェクト設定 */}
                <Grid item xs={12} md={6} lg={4}>
                  <Paper
                    elevation={2}
                    sx={{
                      p: 3,
                      borderRadius: 2,
                      height: '100%',
                      border: '1px solid #e2e8f0',
                      '&:hover': {
                        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)',
                        transform: 'translateY(-2px)'
                      },
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: 2,
                          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mr: 2
                        }}
                      >
                        <FolderIcon style={{ color: 'white', width: 24, height: 24 }} />
                      </Box>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
                          プロジェクト設定
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#64748b' }}>
                          基本情報
                        </Typography>
                      </Box>
                    </Box>

                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                        プロジェクト名
                      </Typography>
                      <TextField
                        fullWidth
                        size="small"
                        value={projectDescription}
                        onChange={(e) => setProjectDescription(e.target.value)}
                        placeholder="プロジェクト名を入力"
                        sx={{ backgroundColor: '#f8fafc' }}
                      />
                    </Box>
                  </Paper>
                </Grid>

                {/* 公開設定 */}
                <Grid item xs={12} md={12} lg={4}>
                  <Paper
                    elevation={2}
                    sx={{
                      p: 3,
                      borderRadius: 2,
                      height: '100%',
                      border: '1px solid #e2e8f0',
                      '&:hover': {
                        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)',
                        transform: 'translateY(-2px)'
                      },
                      transition: 'all 0.2s ease'
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
                          mr: 2
                        }}
                      >
                        <GlobeAltIcon style={{ color: 'white', width: 24, height: 24 }} />
                      </Box>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
                          公開設定
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#64748b' }}>
                          公開状態・URL・QR
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {/* 公開ステータス */}
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {isPublished ? '公開中' : '非公開'}
                        </Typography>
                        <Switch
                          checked={isPublished}
                          onChange={(e) => {
                            setIsPublished(e.target.checked);
                            toast.success(e.target.checked ? '公開しました' : '非公開にしました');
                          }}
                          size="small"
                        />
                      </Box>

                      {/* URL */}
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                          URL
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <TextField
                            value="openreview.app/abc123"
                            size="small"
                            fullWidth
                            InputProps={{ readOnly: true }}
                            sx={{ backgroundColor: '#f8fafc', fontFamily: 'monospace' }}
                          />
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => {
                              navigator.clipboard.writeText('https://openreview.app/form/abc123');
                              toast.success('コピーしました');
                            }}
                          >
                            コピー
                          </Button>
                        </Box>
                      </Box>

                      {/* QRコード */}
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                          QRコード
                        </Typography>
                        <Box sx={{ p: 1, backgroundColor: 'white', borderRadius: 1, display: 'inline-block' }}>
                          <QRCode value="https://openreview.app/form/abc123" size={80} />
                        </Box>
                        <Box sx={{ mt: 1 }}>
                          <Button size="small" variant="outlined" onClick={() => toast.success('ダウンロード完了')}>
                            ダウンロード
                          </Button>
                        </Box>
                      </Box>
                    </Box>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          ) : (
            // 通常の編集画面
            <Box
              sx={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
              }}
            >
              <Typography variant="h6" sx={{ color: '#64748b' }}>
                {showPageManager ? 'ページ管理' : '編集エリア'}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}