import React from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  Tooltip
} from '@mui/material';
import { FolderIcon, PhotoIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

const ProjectSettings = ({
  projectTitle,
  setProjectTitle,
  projectDescription,
  setProjectDescription,
  projectImage,
  setProjectImage
}) => {
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setProjectImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 4,
          borderRadius: 2,
          backgroundColor: 'white',
          border: '1px solid #e2e8f0',
          '&:hover': {
            borderColor: '#cbd5e1',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
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
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 2,
              boxShadow: '0 4px 12px rgba(240, 147, 251, 0.3)'
            }}
          >
            <FolderIcon className="w-6 h-6 text-white" />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a202c' }}>
              プロジェクト設定
            </Typography>
            <Typography variant="body2" sx={{ color: '#6b7280' }}>
              フォームの基本情報を設定
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 500, mb: 1, color: '#374151' }}>
              プロジェクト名
            </Typography>
            <TextField
              fullWidth
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              placeholder="フォームのタイトルを入力"
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '&:hover fieldset': {
                    borderColor: '#5e17eb'
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#5e17eb'
                  }
                }
              }}
            />
          </Box>

          <Box>
            <Typography variant="body2" sx={{ fontWeight: 500, mb: 1, color: '#374151' }}>
              プロジェクト説明
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              placeholder="フォームの説明を入力"
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '&:hover fieldset': {
                    borderColor: '#5e17eb'
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#5e17eb'
                  }
                }
              }}
            />
          </Box>

          <Box>
            <Typography variant="body2" sx={{ fontWeight: 500, mb: 2, color: '#374151' }}>
              プロジェクト画像
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {projectImage ? (
                <Box
                  sx={{
                    width: 120,
                    height: 80,
                    borderRadius: 2,
                    overflow: 'hidden',
                    border: '2px solid #e2e8f0'
                  }}
                >
                  <img
                    src={projectImage}
                    alt="Project"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                </Box>
              ) : (
                <Box
                  sx={{
                    width: 120,
                    height: 80,
                    borderRadius: 2,
                    border: '2px dashed #cbd5e1',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#f8fafc'
                  }}
                >
                  <PhotoIcon className="w-8 h-8 text-gray-400 mb-1" />
                  <Typography variant="caption" sx={{ color: '#6b7280' }}>
                    画像なし
                  </Typography>
                </Box>
              )}
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <input
                  accept="image/*"
                  type="file"
                  id="project-image-upload"
                  style={{ display: 'none' }}
                  onChange={handleImageUpload}
                />
                <label htmlFor="project-image-upload">
                  <Tooltip title="画像をアップロード">
                    <IconButton 
                      component="span"
                      sx={{
                        backgroundColor: '#5e17eb',
                        color: 'white',
                        '&:hover': {
                          backgroundColor: '#4c1d95'
                        }
                      }}
                    >
                      <PhotoIcon className="w-5 h-5" />
                    </IconButton>
                  </Tooltip>
                </label>
                <Typography variant="caption" sx={{ color: '#6b7280', maxWidth: 120 }}>
                  JPG, PNG形式対応
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Paper>
    </motion.div>
  );
};

export default ProjectSettings;