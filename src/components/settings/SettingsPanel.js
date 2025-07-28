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
  setIsPublished
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
        {/* ヘッダー */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Box sx={{ mb: 4, textAlign: 'center' }}>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 700, 
                color: '#1e293b', 
                fontSize: { xs: '1.75rem', md: '2.25rem' }
              }}
            >
              フォーム設定
            </Typography>
          </Box>
        </motion.div>

        {/* 設定カード */}
        <Stack spacing={3} sx={{ width: '100%' }}>
          {/* テーマ設定 */}
          <ThemeSettings
            selectedColor={selectedColor}
            setSelectedColor={setSelectedColor}
            selectedFont={selectedFont}
            setSelectedFont={setSelectedFont}
            logoImage={logoImage}
            setLogoImage={setLogoImage}
          />

          {/* プロジェクト設定 */}
          <ProjectSettings
            projectTitle={projectTitle}
            setProjectTitle={setProjectTitle}
          />

          {/* 公開設定 */}
          <PublishSettings
            isPublished={isPublished}
            setIsPublished={setIsPublished}
            projectTitle={projectTitle}
          />
        </Stack>

        {/* フッター余白 */}
        <Box sx={{ height: 60 }} />
      </Box>
    </Box>
  );
};

export default SettingsPanel;