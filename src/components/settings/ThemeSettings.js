import React from 'react';
import { motion } from 'framer-motion';
import { ChromePicker } from 'react-color';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Collapse,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Avatar,
  Chip
} from '@mui/material';
import { PaintBrushIcon, SwatchIcon } from '@heroicons/react/24/outline';
import { ExpandMore } from '@mui/icons-material';

const ThemeSettings = ({
  selectedTheme,
  setSelectedTheme,
  customColor,
  setCustomColor,
  showColorPicker,
  setShowColorPicker,
  themes
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
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
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 2,
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
            }}
          >
            <PaintBrushIcon className="w-6 h-6 text-white" />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a202c' }}>
              テーマ設定
            </Typography>
            <Typography variant="body2" sx={{ color: '#6b7280' }}>
              フォームの外観をカスタマイズ
            </Typography>
          </Box>
        </Box>

        <Grid container spacing={4}>
          {themes.map((theme) => (
            <Grid item xs={12} md={4} key={theme.id}>
              <Box
                onClick={() => setSelectedTheme(theme.id)}
                sx={{
                  p: 3,
                  borderRadius: 2,
                  cursor: 'pointer',
                  border: selectedTheme === theme.id ? '2px solid #5e17eb' : '1px solid #e2e8f0',
                  backgroundColor: selectedTheme === theme.id ? 'rgba(94, 23, 235, 0.05)' : 'white',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: selectedTheme === theme.id ? '#5e17eb' : '#cbd5e1',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 500, color: '#374151' }}>
                      {theme.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#6b7280' }}>
                      {theme.description}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  {theme.colors.map((color, index) => (
                    <Box
                      key={index}
                      sx={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        backgroundColor: color,
                        border: '2px solid white',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                  ))}
                </Box>
                {selectedTheme === theme.id && (
                  <Chip
                    label="選択中"
                    size="small"
                    sx={{
                      backgroundColor: '#5e17eb',
                      color: 'white',
                      fontWeight: 500
                    }}
                  />
                )}
              </Box>
            </Grid>
          ))}
        </Grid>

        <Accordion 
          sx={{ 
            mt: 3, 
            border: '1px solid #e2e8f0',
            '&:before': { display: 'none' },
            boxShadow: 'none'
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMore />}
            sx={{
              '&:hover': { backgroundColor: '#f8fafc' }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <SwatchIcon className="w-5 h-5 text-gray-600 mr-2" />
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                カスタムカラー
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Box
                onClick={() => setShowColorPicker(!showColorPicker)}
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  backgroundColor: customColor,
                  border: '2px solid #e2e8f0',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: '#cbd5e1',
                    transform: 'scale(1.05)'
                  }
                }}
              />
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  メインカラー
                </Typography>
                <Typography variant="caption" sx={{ color: '#6b7280' }}>
                  クリックしてカラーピッカーを開く
                </Typography>
              </Box>
            </Box>
            <Collapse in={showColorPicker}>
              <Box sx={{ mt: 2 }}>
                <ChromePicker
                  color={customColor}
                  onChange={(color) => setCustomColor(color.hex)}
                  width="100%"
                />
              </Box>
            </Collapse>
          </AccordionDetails>
        </Accordion>
      </Paper>
    </motion.div>
  );
};

export default ThemeSettings;