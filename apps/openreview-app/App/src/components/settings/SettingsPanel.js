import React from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Typography,
  Stack
} from '@mui/material';

const SettingsPanel = ({ formId }) => {
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
        <Box sx={{ width: '100%' }}>
          <Typography sx={{ color: '#64748b', textAlign: 'center', py: 4 }}>
            設定項目はありません
          </Typography>
        </Box>

        {/* フッター余白 */}
        <Box sx={{ height: 60 }} />
      </Box>
    </Box>
  );
};

export default SettingsPanel;
