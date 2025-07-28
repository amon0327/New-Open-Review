import React from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Card,
  Typography,
  TextField
} from '@mui/material';
import { Folder } from '@mui/icons-material';

const ProjectSettings = ({
  projectTitle,
  setProjectTitle
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
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
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 2
            }}
          >
            <Folder sx={{ color: 'white', fontSize: '1.2rem' }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
              プロジェクト設定
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              フォームの基本情報を設定
            </Typography>
          </Box>
        </Box>

        {/* プロジェクト名 */}
        <Box>
          <Typography 
            variant="subtitle2" 
            sx={{ mb: 2, fontWeight: 600, color: '#374151' }}
          >
            プロジェクト名
          </Typography>
          <TextField
            fullWidth
            value={projectTitle}
            onChange={(e) => setProjectTitle(e.target.value)}
            placeholder="フォームのタイトルを入力してください"
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                backgroundColor: '#fafbfc',
                '& fieldset': {
                  borderColor: '#e2e8f0'
                },
                '&:hover fieldset': {
                  borderColor: '#cbd5e1'
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#5e17eb',
                  borderWidth: '2px'
                },
                '&.Mui-focused': {
                  backgroundColor: 'white'
                }
              },
              '& .MuiInputBase-input': {
                fontSize: '1rem',
                fontWeight: 500,
                color: '#1e293b',
                '&::placeholder': {
                  color: '#94a3b8',
                  opacity: 1
                }
              }
            }}
          />
          <Typography 
            variant="caption" 
            sx={{ color: '#94a3b8', mt: 1, display: 'block' }}
          >
            このタイトルがフォーム上部に表示されます
          </Typography>
        </Box>
      </Card>
    </motion.div>
  );
};

export default ProjectSettings;