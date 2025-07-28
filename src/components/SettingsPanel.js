import React from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Paper,
  Typography,
  Switch,
  Chip
} from '@mui/material';
import { ChevronRight } from '@mui/icons-material';

const SettingsPanel = ({ settingsCategories }) => {
  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            background: 'linear-gradient(45deg, #5e17eb 30%, #764ba2 90%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          設定
        </Typography>
      </Box>

      {/* 設定カテゴリ */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {settingsCategories.map((category) => (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: settingsCategories.indexOf(category) * 0.1 }}
          >
            <Paper
              elevation={2}
              sx={{
                p: 3,
                borderRadius: 2,
                background: 'rgba(255, 255, 255, 0.8)',
                border: '1px solid rgba(0, 0, 0, 0.05)',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)'
                },
                transition: 'all 0.2s ease'
              }}
            >
              {/* カテゴリヘッダー */}
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    background: `linear-gradient(135deg, ${
                      category.id === 'account' ? '#667eea, #764ba2' :
                      category.id === 'database' ? '#5e17eb, #764ba2' :
                      category.id === 'forms' ? '#22c55e, #16a34a' :
                      category.id === 'security' ? '#ef4444, #dc2626' :
                      category.id === 'integrations' ? '#3b82f6, #1d4ed8' :
                      '#6b7280, #4b5563'
                    })`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mr: 2,
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                  }}
                >
                  {React.cloneElement(category.icon, { sx: { color: 'white', fontSize: '1.5rem' } })}
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a202c' }}>
                    {category.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#6b7280' }}>
                    {category.description}
                  </Typography>
                </Box>
              </Box>

              {/* 設定項目 */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {category.settings.map((setting, index) => (
                  <Box
                    key={setting.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 2,
                      borderRadius: 1,
                      backgroundColor: 'rgba(248, 250, 252, 0.6)',
                      border: '1px solid rgba(226, 232, 240, 0.5)',
                      '&:hover': {
                        backgroundColor: 'rgba(94, 23, 235, 0.03)'
                      },
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500, color: '#374151' }}>
                        {setting.label}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {setting.type === 'toggle' ? (
                        <Switch
                          checked={setting.value}
                          size="small"
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': {
                              color: '#5e17eb'
                            },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                              backgroundColor: '#5e17eb'
                            }
                          }}
                        />
                      ) : setting.type === 'status' ? (
                        <Chip
                          label={setting.value}
                          size="small"
                          sx={{
                            backgroundColor: setting.status === 'connected' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            color: setting.status === 'connected' ? '#16a34a' : '#dc2626',
                            fontWeight: 500
                          }}
                        />
                      ) : setting.type === 'info' ? (
                        <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 500 }}>
                          {setting.value}
                        </Typography>
                      ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" sx={{ color: '#6b7280', minWidth: 80, textAlign: 'right' }}>
                            {setting.value}
                          </Typography>
                          <ChevronRight sx={{ color: '#9ca3af', fontSize: '1rem' }} />
                        </Box>
                      )}
                    </Box>
                  </Box>
                ))}
              </Box>
            </Paper>
          </motion.div>
        ))}
      </Box>
    </>
  );
};

export default SettingsPanel;