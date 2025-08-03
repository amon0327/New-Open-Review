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
  
  // セクション選択機能
  activeSection = null,
  onSectionChange
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
          <Box 
            sx={{
              border: activeSection === 'theme' ? '2px solid #5e17eb' : 'none',
              borderRadius: activeSection === 'theme' ? 2 : 0,
              p: activeSection === 'theme' ? 1 : 0,
              background: activeSection === 'theme' ? 'rgba(94, 23, 235, 0.05)' : 'transparent',
              transition: 'all 0.3s ease'
            }}
          >
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
          </Box>

          {/* プロジェクト設定 */}
          <Box 
            sx={{
              border: activeSection === 'project' ? '2px solid #5e17eb' : 'none',
              borderRadius: activeSection === 'project' ? 2 : 0,
              p: activeSection === 'project' ? 1 : 0,
              background: activeSection === 'project' ? 'rgba(94, 23, 235, 0.05)' : 'transparent',
              transition: 'all 0.3s ease'
            }}
          >
            <ProjectSettings
              projectTitle={projectTitle}
              setProjectTitle={setProjectTitle}
              onProjectTitleUpdate={onProjectTitleUpdate}
            />
          </Box>

          {/* 公開設定 */}
          <Box 
            sx={{
              border: activeSection === 'publish' ? '2px solid #5e17eb' : 'none',
              borderRadius: activeSection === 'publish' ? 2 : 0,
              p: activeSection === 'publish' ? 1 : 0,
              background: activeSection === 'publish' ? 'rgba(94, 23, 235, 0.05)' : 'transparent',
              transition: 'all 0.3s ease'
            }}
          >
            <PublishSettings
              isPublished={isPublished}
              setIsPublished={setIsPublished}
              projectTitle={projectTitle}
            />
          </Box>
        </Stack>

        {/* フッター余白 */}
        <Box sx={{ height: 60 }} />
      </Box>
    </Box>
  );
};

export default SettingsPanel;