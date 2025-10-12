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
import LotterySettings from './LotterySettings';

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
  onPublishClick, // HeaderBarの公開処理を呼び出すためのコールバック関数
  formId,
  formData,
  
  // Supabase連携用のprops
  onThemeColorUpdate,
  onLogoImageUpdate,
  onProjectTitleUpdate,
  
  // アクティブセクション指定用
  activeSection = 'all', // 'all', 'design', 'project', 'publish', 'lottery', 'login', 'completion'
  
  // 抽選設定用のprops
  onLotteryUpdate
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
              formId={formId}
              formData={formData}
              onPublishClick={onPublishClick}
            />
          )}

          {/* 抽選設定 */}
          {(activeSection === 'all' || activeSection === 'lottery') && (
            <LotterySettings
              formId={formId}
              onLotteryUpdate={onLotteryUpdate}
            />
          )}

        </Stack>

        {/* フッター余白 */}
        <Box sx={{ height: 60 }} />
      </Box>
    </Box>
  );
};

export default SettingsPanel;