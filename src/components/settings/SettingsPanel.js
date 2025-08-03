import React from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Typography,
  Stack
} from '@mui/material';
import ThemeSettings from './ThemeSettings';
import ProjectSettings from './ProjectSettings';
import PublishSettings from './PublishSettings';

const SettingsPanel = ({
  // テーマ設定のprops
  selectedColor,
  setSelectedColor,
  selectedFont,
  setSelectedFont,
  logoImage,
  setLogoImage,
  
  // プロジェクト設定のprops
  projectTitle,
  setProjectTitle,
  
  // 公開設定のprops
  isPublished,
  setIsPublished,
  
  // Supabase連携用のprops
  onThemeColorUpdate,
  onLogoImageUpdate,
  onProjectTitleUpdate,
  
  // アクティブセクション指定用
  activeSection = 'all' // 'all', 'design', 'project', 'publish', 'login', 'completion'
}) => {
  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 10,
        overflowY: 'auto',
        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
        '&::-webkit-scrollbar': {
          width: '6px'
        },
        '&::-webkit-scrollbar-track': {
          background: 'transparent'
        },
        '&::-webkit-scrollbar-thumb': {
          background: '#cbd5e1',
          borderRadius: '3px'
        },
        '&::-webkit-scrollbar-thumb:hover': {
          background: '#94a3b8'
        }
      }}
    >
      <Box sx={{ px: 4, py: 4, width: '100%' }}>

        {/* 設定カード */}
        <Stack spacing={3} sx={{ width: '100%' }}>
          {/* テーマ設定 */}
          {(activeSection === 'all' || activeSection === 'design') && (
            <ThemeSettings
              selectedColor={selectedColor}
              setSelectedColor={setSelectedColor}
              selectedFont={selectedFont}
              setSelectedFont={setSelectedFont}
              logoImage={logoImage}
              setLogoImage={setLogoImage}
              onThemeColorUpdate={onThemeColorUpdate}
              onLogoImageUpdate={onLogoImageUpdate}
            />
          )}

          {/* プロジェクト設定 */}
          {(activeSection === 'all' || activeSection === 'project') && (
            <ProjectSettings
              projectTitle={projectTitle}
              setProjectTitle={setProjectTitle}
              onProjectTitleUpdate={onProjectTitleUpdate}
            />
          )}

          {/* 公開設定 */}
          {(activeSection === 'all' || activeSection === 'publish') && (
            <PublishSettings
              isPublished={isPublished}
              setIsPublished={setIsPublished}
              projectTitle={projectTitle}
            />
          )}

          {/* ログイン設定メッセージ */}
          {activeSection === 'login' && (
            <Box
              sx={{
                p: 3,
                border: '1px solid #e5e7eb',
                borderRadius: 2,
                backgroundColor: '#f9fafb',
                textAlign: 'center'
              }}
            >
              <Typography variant="h6" sx={{ mb: 1, color: '#374151' }}>
                ログイン画面設定
              </Typography>
              <Typography variant="body2" sx={{ color: '#6b7280' }}>
                ログイン画面の設定は左側のメニューから「ログイン画面」を選択してください。
              </Typography>
            </Box>
          )}

          {/* 完了画面設定メッセージ */}
          {activeSection === 'completion' && (
            <Box
              sx={{
                p: 3,
                border: '1px solid #e5e7eb',
                borderRadius: 2,
                backgroundColor: '#f9fafb',
                textAlign: 'center'
              }}
            >
              <Typography variant="h6" sx={{ mb: 1, color: '#374151' }}>
                完了画面設定
              </Typography>
              <Typography variant="body2" sx={{ color: '#6b7280' }}>
                完了画面の設定は左側のメニューから「完了画面」を選択してください。
              </Typography>
            </Box>
          )}
        </Stack>

        {/* フッター余白 */}
        <Box sx={{ height: 60 }} />
      </Box>
    </Box>
  );
};

export default SettingsPanel;