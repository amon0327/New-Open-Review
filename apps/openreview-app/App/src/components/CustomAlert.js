import React from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Button,
  IconButton
} from '@mui/material';
import {
  ErrorOutline,
  Close
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

const CustomAlert = ({ open, onClose, title = 'お知らせ', message, type = 'error' }) => {
  const getTypeConfig = (type) => {
    switch (type) {
      case 'error':
        return {
          icon: <ErrorOutline sx={{ fontSize: '2rem', color: '#EF4444' }} />,
          iconBg: 'rgba(239, 68, 68, 0.1)',
          borderColor: '#EF4444'
        };
      case 'warning':
        return {
          icon: <ErrorOutline sx={{ fontSize: '2rem', color: '#F59E0B' }} />,
          iconBg: 'rgba(245, 158, 11, 0.1)',
          borderColor: '#F59E0B'
        };
      default:
        return {
          icon: <ErrorOutline sx={{ fontSize: '2rem', color: '#6B7280' }} />,
          iconBg: 'rgba(107, 114, 128, 0.1)',
          borderColor: '#6B7280'
        };
    }
  };

  const config = getTypeConfig(type);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      PaperProps={{
        sx: {
          borderRadius: '12px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.12)',
          border: 'none',
          background: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(20px)',
          overflow: 'visible',
          width: '320px',
          margin: 'auto'
        }
      }}
      BackdropProps={{
        sx: {
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(6px)'
        }
      }}
    >
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          >
            <DialogContent sx={{ p: 0, position: 'relative' }}>
              {/* 閉じるボタン */}
              <IconButton
                onClick={onClose}
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  color: '#9CA3AF',
                  zIndex: 1,
                  width: 32,
                  height: 32,
                  '&:hover': {
                    backgroundColor: 'rgba(156, 163, 175, 0.1)',
                    color: '#6B7280'
                  }
                }}
              >
                <Close sx={{ fontSize: '1rem' }} />
              </IconButton>

              <Box
                sx={{
                  p: 3,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  gap: 2
                }}
              >
                {/* アイコン */}
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    backgroundColor: config.iconBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: `2px solid ${config.borderColor}20`
                  }}
                >
                  <ErrorOutline sx={{ fontSize: '1.5rem', color: config.borderColor }} />
                </Box>

                {/* テキスト */}
                <Box sx={{ maxWidth: 280 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      color: '#1F2937',
                      mb: 0.5,
                      fontSize: '1.1rem'
                    }}
                  >
                    {title}
                  </Typography>
                  
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#6B7280',
                      lineHeight: 1.5,
                      fontSize: '0.9rem'
                    }}
                  >
                    {message}
                  </Typography>
                </Box>

                {/* ボタン */}
                <Button
                  onClick={onClose}
                  variant="contained"
                  sx={{
                    mt: 0.5,
                    px: 3,
                    py: 1,
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    textTransform: 'none',
                    background: 'linear-gradient(135deg, #5E17EB 0%, #764BA2 100%)',
                    boxShadow: '0 3px 12px rgba(94, 23, 235, 0.3)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #4C1D95 0%, #6D28D9 100%)',
                      boxShadow: '0 4px 16px rgba(94, 23, 235, 0.4)',
                      transform: 'translateY(-1px)'
                    },
                    transition: 'all 0.2s ease'
                  }}
                >
                  OK
                </Button>
              </Box>
            </DialogContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Dialog>
  );
};

export default CustomAlert;