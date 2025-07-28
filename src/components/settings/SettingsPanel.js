import React from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Typography,
  Grid,
  Stack
} from '@mui/material';
import ThemeSettings from './ThemeSettings';
import ProjectSettings from './ProjectSettings';
import PublishSettings from './PublishSettings';

const SettingsPanel = ({
  // テーマ設定のprops
  selectedTheme,
  setSelectedTheme,
  customColor,
  setCustomColor,
  showColorPicker,
  setShowColorPicker,
  themes,
  
  // プロジェクト設定のprops
  projectTitle,
  setProjectTitle,
  projectDescription,
  setProjectDescription,
  projectImage,
  setProjectImage,
  
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
        p: 3,
        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)'
      }}
    >
      <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
        {/* ヘッダー */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Box sx={{ mb: 4 }}>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 700, 
                color: '#1a202c', 
                mb: 1,
                fontSize: { xs: '1.75rem', md: '2.25rem' }
              }}
            >
              フォーム設定
            </Typography>
            <Typography variant="body1" sx={{ 
              color: '#64748b', 
              fontSize: '1.1rem'
            }}>
              フォームのテーマ、プロジェクト情報、公開設定
            </Typography>
          </Box>
        </motion.div>

        {/* 設定セクション - PC専用2カラムレイアウト */}
        <Grid container spacing={4}>
          {/* 左列: テーマ設定とプロジェクト設定 */}
          <Grid item xs={12} lg={8}>
            <Stack spacing={4}>
              {/* テーマ設定 */}
              <ThemeSettings
                selectedTheme={selectedTheme}
                setSelectedTheme={setSelectedTheme}
                customColor={customColor}
                setCustomColor={setCustomColor}
                showColorPicker={showColorPicker}
                setShowColorPicker={setShowColorPicker}
                themes={themes}
              />

              {/* プロジェクト設定 */}
              <ProjectSettings
                projectTitle={projectTitle}
                setProjectTitle={setProjectTitle}
                projectDescription={projectDescription}
                setProjectDescription={setProjectDescription}
                projectImage={projectImage}
                setProjectImage={setProjectImage}
              />
            </Stack>
          </Grid>

          {/* 公開設定 */}
          <Grid item xs={12} lg={4}>
            <PublishSettings
              isPublished={isPublished}
              setIsPublished={setIsPublished}
              projectTitle={projectTitle}
            />
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default SettingsPanel;