import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Tooltip,
  Stack
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
  FitScreen
} from '@mui/icons-material';

// ナビゲーションアイテムの定義
const navigationItems = [
  { icon: <Add />, label: '質問追加', category: 'actions' },
  { icon: <TextFields />, label: '短文回答', category: 'question-types' },
  { icon: <Description />, label: '長文回答', category: 'question-types' },
  { icon: <RadioButtonChecked />, label: '単一選択', category: 'question-types' },
  { icon: <CheckBox />, label: '複数選択', category: 'question-types' },
  { icon: <ExpandMore />, label: 'プルダウン', category: 'question-types' },
  { icon: <LinearScale />, label: '線形スケール', category: 'question-types' },
  { icon: <Image />, label: '画像アップロード', category: 'question-types' },
  { icon: <Palette />, label: 'デザイン', category: 'settings' },
  { icon: <Settings />, label: '設定', category: 'settings' }
];

export default function CreatePage({ onBackClick }) {
  const [selectedTool, setSelectedTool] = useState(null);
  const [previewMode, setPreviewMode] = useState('mobile'); // 'mobile' or 'desktop'
  const [zoom, setZoom] = useState(1); // ズーム倍率

  // ズーム制御関数（5%刻み）
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.05, 2));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.05, 0.5));
  const handleFitScreen = () => setZoom(1);

  return (
    <Box
      className="main-container"
      sx={{
        height: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        display: 'flex',
        overflow: 'hidden'
      }}
    >
      {/* 背景全体Container */}
      {/* 左端ナビゲーションバー */}
      <Paper
        elevation={4}
        sx={{
          width: 80,
          height: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          py: 2,
          boxShadow: '4px 0 20px rgba(0, 0, 0, 0.1)'
        }}
      >
        {/* ロゴ */}
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 2,
            background: 'rgba(255, 255, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 3,
            backdropFilter: 'blur(10px)'
          }}
        >
          <Typography
            variant="h6"
            sx={{ color: 'white', fontWeight: 'bold' }}
          >
            O
          </Typography>
        </Box>

        {/* 戻るボタン */}
        <Tooltip title="ダッシュボードに戻る" placement="right">
          <IconButton
            onClick={onBackClick}
            sx={{
              color: 'rgba(255, 255, 255, 0.8)',
              mb: 2,
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: 'white'
              }
            }}
          >
            <ArrowBack />
          </IconButton>
        </Tooltip>

        {/* ナビゲーションアイテム */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            width: '100%',
            px: 1
          }}
        >
          {navigationItems.map((item, index) => (
            <Tooltip key={index} title={item.label} placement="right">
              <IconButton
                onClick={() => setSelectedTool(item)}
                sx={{
                  color: selectedTool?.label === item.label ? 'white' : 'rgba(255, 255, 255, 0.7)',
                  backgroundColor: selectedTool?.label === item.label ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                  borderRadius: 2,
                  width: 48,
                  height: 48,
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    color: 'white'
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                {item.icon}
              </IconButton>
            </Tooltip>
          ))}
        </Box>
      </Paper>

      {/* 右側メインエリア */}
      <Box
        className="right-main-area"
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography
              variant="h5"
              sx={{
                color: '#1a202c',
                fontWeight: 700
              }}
            >
              フォーム作成
            </Typography>
            {selectedTool && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 2,
                  py: 0.5,
                  borderRadius: 2,
                  background: 'linear-gradient(45deg, #5e17eb 30%, #764ba2 90%)',
                  color: 'white'
                }}
              >
                {selectedTool.icon}
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {selectedTool.label}
                </Typography>
              </Box>
            )}
          </Box>

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
          className="main-content-area"
          sx={{
            flex: 1,
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          {/* 最大まで広げた背景Container */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            style={{ 
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0
            }}
          >
            <Paper
              elevation={2}
              sx={{
                height: '100%',
                width: '100%',
                borderRadius: 0,
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                position: 'relative'
              }}
            >
              {/* 背景パターン */}
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

              {/* プレビュー制御パネル - ヘッダー下固定 */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 8,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  zIndex: 20,
                  pointerEvents: 'auto'
                }}
              >
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <Paper
                    elevation={8}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      px: 1,
                      py: 0.5,
                      borderRadius: 2,
                      background: 'rgba(255, 255, 255, 0.95)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    {/* デバイス切り替え */}
                    <Tooltip title="モバイル表示">
                      <IconButton
                        onClick={() => setPreviewMode('mobile')}
                        sx={{
                          color: previewMode === 'mobile' ? '#5e17eb' : '#64748b',
                          backgroundColor: previewMode === 'mobile' ? 'rgba(94, 23, 235, 0.1)' : 'transparent',
                          '&:hover': {
                            backgroundColor: 'rgba(94, 23, 235, 0.1)'
                          }
                        }}
                      >
                        <PhoneAndroid />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="PC表示">
                      <IconButton
                        onClick={() => setPreviewMode('desktop')}
                        sx={{
                          color: previewMode === 'desktop' ? '#5e17eb' : '#64748b',
                          backgroundColor: previewMode === 'desktop' ? 'rgba(94, 23, 235, 0.1)' : 'transparent',
                          '&:hover': {
                            backgroundColor: 'rgba(94, 23, 235, 0.1)'
                          }
                        }}
                      >
                        <Computer />
                      </IconButton>
                    </Tooltip>

                    {/* 区切り線 */}
                    <Box sx={{ width: 1, height: 16, backgroundColor: 'rgba(0, 0, 0, 0.1)', mx: 0.5 }} />

                    {/* ズーム制御 */}
                    <Tooltip title="縮小">
                      <IconButton
                        onClick={handleZoomOut}
                        disabled={zoom <= 0.5}
                        sx={{
                          color: '#64748b',
                          '&:hover': {
                            backgroundColor: 'rgba(100, 116, 139, 0.1)'
                          }
                        }}
                      >
                        <ZoomOut />
                      </IconButton>
                    </Tooltip>

                    <Typography variant="caption" sx={{ minWidth: 40, textAlign: 'center', color: '#64748b', fontSize: '0.7rem' }}>
                      {Math.round(zoom * 100)}%
                    </Typography>

                    <Tooltip title="拡大">
                      <IconButton
                        onClick={handleZoomIn}
                        disabled={zoom >= 2}
                        sx={{
                          color: '#64748b',
                          '&:hover': {
                            backgroundColor: 'rgba(100, 116, 139, 0.1)'
                          }
                        }}
                      >
                        <ZoomIn />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="フィット">
                      <IconButton
                        onClick={handleFitScreen}
                        sx={{
                          color: '#64748b',
                          '&:hover': {
                            backgroundColor: 'rgba(100, 116, 139, 0.1)'
                          }
                        }}
                      >
                        <FitScreen />
                      </IconButton>
                    </Tooltip>
                  </Paper>
                </motion.div>
              </Box>

              {/* 中央プレビューエリア */}
              <Box
                className="center-preview-area"
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -45%)',
                  zIndex: 10,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                  pointerEvents: 'auto'
                }}
              >
                {/* プレビュー画面 */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: zoom }}
                  transition={{ duration: 0.3 }}
                  style={{
                    transform: `scale(${zoom})`,
                    transformOrigin: 'center'
                  }}
                >
                  <Paper
                    elevation={12}
                    sx={{
                      width: previewMode === 'mobile' ? 375 : 1024,
                      height: previewMode === 'mobile' ? 667 : 576,
                      borderRadius: previewMode === 'mobile' ? 6 : 2,
                      background: 'white',
                      border: previewMode === 'mobile' ? '8px solid #1a1a1a' : '2px solid #e2e8f0',
                      boxShadow: previewMode === 'mobile' 
                        ? '0 25px 80px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05)' 
                        : '0 20px 60px rgba(0, 0, 0, 0.15)',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    {/* モバイルの場合のノッチ */}
                    {previewMode === 'mobile' && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: 150,
                          height: 30,
                          background: '#1a1a1a',
                          borderBottomLeftRadius: 15,
                          borderBottomRightRadius: 15,
                          zIndex: 10
                        }}
                      />
                    )}

                    {/* プレビューコンテンツ */}
                    <Box
                      sx={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        p: previewMode === 'mobile' ? 2 : 4,
                        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
                      }}
                    >
                      <Box
                        sx={{
                          textAlign: 'center',
                          mb: 3
                        }}
                      >
                        <Typography
                          variant={previewMode === 'mobile' ? 'h6' : 'h4'}
                          sx={{
                            fontWeight: 700,
                            background: 'linear-gradient(45deg, #5e17eb 30%, #764ba2 90%)',
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            mb: 1
                          }}
                        >
                          {previewMode === 'mobile' ? 'モバイル' : 'デスクトップ'}プレビュー
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          フォームの{previewMode === 'mobile' ? 'スマートフォン' : 'PC'}での表示
                        </Typography>
                      </Box>

                      {/* サンプルフォーム */}
                      <Paper
                        sx={{
                          p: previewMode === 'mobile' ? 2 : 3,
                          borderRadius: 2,
                          width: '100%',
                          maxWidth: previewMode === 'mobile' ? 300 : 600,
                          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
                        }}
                      >
                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                          サンプルアンケート
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <Box>
                            <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                              お名前をお聞かせください
                            </Typography>
                            <Box
                              sx={{
                                width: '100%',
                                height: 40,
                                border: '1px solid #e2e8f0',
                                borderRadius: 1,
                                backgroundColor: '#f8fafc'
                              }}
                            />
                          </Box>
                          <Box>
                            <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                              満足度を教えてください
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                              {['とても満足', '満足', '普通', '不満'].map((option, index) => (
                                <Box
                                  key={index}
                                  sx={{
                                    px: 2,
                                    py: 1,
                                    border: '1px solid #e2e8f0',
                                    borderRadius: 1,
                                    fontSize: previewMode === 'mobile' ? '0.8rem' : '0.9rem',
                                    backgroundColor: index === 1 ? 'rgba(94, 23, 235, 0.1)' : '#f8fafc',
                                    color: index === 1 ? '#5e17eb' : '#64748b'
                                  }}
                                >
                                  {option}
                                </Box>
                              ))}
                            </Box>
                          </Box>
                        </Box>
                      </Paper>
                    </Box>
                  </Paper>
                </motion.div>
              </Box>
            </Paper>
          </motion.div>

          {/* 上のレイヤー：左右のContainer2つ */}
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="stretch"
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              p: 3,
              gap: 3,
              zIndex: 1,
              pointerEvents: 'none'
            }}
          >
            {/* 左側Container */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              style={{ flex: '0 0 300px', pointerEvents: 'auto' }}
            >
              <Paper
                elevation={8}
                sx={{
                  height: '100%',
                  borderRadius: 3,
                  background: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)',
                  p: 3,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 2,
                    boxShadow: '0 10px 30px rgba(94, 23, 235, 0.3)'
                  }}
                >
                  <Typography
                    variant="h4"
                    sx={{ color: 'white', fontWeight: 'bold' }}
                  >
                    L
                  </Typography>
                </Box>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    background: 'linear-gradient(45deg, #5e17eb 30%, #764ba2 90%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    mb: 1
                  }}
                >
                  左側Container
                </Typography>
                <Typography variant="body2" color="text.secondary" textAlign="center">
                  フォーム設定や
                  質問リストが
                  ここに表示されます
                </Typography>
              </Paper>
            </motion.div>


            {/* 右側Container */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              style={{ flex: '0 0 300px', pointerEvents: 'auto' }}
            >
              <Paper
                elevation={8}
                sx={{
                  height: '100%',
                  borderRadius: 3,
                  background: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)',
                  p: 3,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 2,
                    boxShadow: '0 10px 30px rgba(252, 182, 159, 0.3)'
                  }}
                >
                  <Typography
                    variant="h4"
                    sx={{ color: 'white', fontWeight: 'bold' }}
                  >
                    R
                  </Typography>
                </Box>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    background: 'linear-gradient(45deg, #fcb69f 30%, #ffecd2 90%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    mb: 1
                  }}
                >
                  右側Container
                </Typography>
                <Typography variant="body2" color="text.secondary" textAlign="center">
                  プレビューや
                  詳細設定が
                  ここに表示されます
                </Typography>
              </Paper>
            </motion.div>
          </Stack>

          {/* 選択ツールの表示（中央部分） */}
          {selectedTool && (
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 2
              }}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Box
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    background: 'rgba(94, 23, 235, 0.1)',
                    border: '2px dashed rgba(94, 23, 235, 0.3)',
                    backdropFilter: 'blur(10px)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 1,
                    minWidth: 200
                  }}
                >
                  {selectedTool.icon}
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {selectedTool.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    選択中
                  </Typography>
                </Box>
              </motion.div>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}