import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Tooltip
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
  Palette
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

  return (
    {/* 背景全体Container */}
    <Box
      sx={{
        height: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        display: 'flex',
        overflow: 'hidden'
      }}
    >
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
            height: 80,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
            borderRadius: 0,
            display: 'flex',
            alignItems: 'center',
            px: 3,
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
          sx={{
            flex: 1,
            p: 3,
            overflow: 'hidden'
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            style={{ height: '100%' }}
          >
            <Paper
              elevation={8}
              sx={{
                height: '100%',
                borderRadius: 3,
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden'
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

              {/* コンテンツ */}
              <Box
                sx={{
                  textAlign: 'center',
                  zIndex: 1,
                  maxWidth: '600px',
                  px: 4
                }}
              >
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                >
                  <Box
                    sx={{
                      width: 120,
                      height: 120,
                      borderRadius: 3,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto',
                      mb: 3,
                      boxShadow: '0 20px 60px rgba(94, 23, 235, 0.3)'
                    }}
                  >
                    <Typography
                      variant="h2"
                      sx={{ color: 'white', fontWeight: 'bold' }}
                    >
                      +
                    </Typography>
                  </Box>
                </motion.div>

                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                >
                  <Typography
                    variant="h3"
                    sx={{
                      fontWeight: 700,
                      background: 'linear-gradient(45deg, #5e17eb 30%, #764ba2 90%)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      mb: 2
                    }}
                  >
                    フォーム作成エリア
                  </Typography>
                </motion.div>

                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                >
                  <Typography
                    variant="h6"
                    color="text.secondary"
                    sx={{
                      mb: 4,
                      lineHeight: 1.6
                    }}
                  >
                    左のナビゲーションから質問タイプを選択して
                    ドラッグ&ドロップでフォームを作成できます
                  </Typography>
                </motion.div>

                {selectedTool && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Box
                      sx={{
                        p: 4,
                        borderRadius: 3,
                        background: 'rgba(94, 23, 235, 0.1)',
                        border: '2px dashed rgba(94, 23, 235, 0.3)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 2
                      }}
                    >
                      {selectedTool.icon}
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {selectedTool.label}が選択されています
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        ここに{selectedTool.label}の設定UIが表示されます
                      </Typography>
                    </Box>
                  </motion.div>
                )}
              </Box>
            </Paper>
          </motion.div>
        </Box>
      </Box>
    </Box>
  );
}