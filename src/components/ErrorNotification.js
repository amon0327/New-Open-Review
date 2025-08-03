import React from 'react';
import {
  Snackbar,
  Alert,
  Box,
  Typography,
  IconButton
} from '@mui/material';
import {
  Close as CloseIcon,
  ErrorOutline
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

const ErrorNotification = ({ open, onClose, message, errorCount = 0 }) => {
  return (
    <Snackbar
      open={open}
      onClose={onClose}
      anchorOrigin={{ 
        vertical: 'bottom', 
        horizontal: 'center' 
      }}
      sx={{
        '& .MuiSnackbar-root': {
          position: 'static'
        }
      }}
    >
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ 
              duration: 0.3, 
              ease: [0.4, 0, 0.2, 1] 
            }}
          >
            <Alert
              severity="error"
              onClose={onClose}
              sx={{
                borderRadius: '12px',
                backgroundColor: '#FEF2F2',
                border: '1px solid #FECACA',
                color: '#1F2937',
                boxShadow: '0 10px 25px rgba(239, 68, 68, 0.15), 0 4px 12px rgba(0, 0, 0, 0.1)',
                backdropFilter: 'blur(8px)',
                minWidth: '320px',
                maxWidth: '480px',
                '& .MuiAlert-icon': {
                  color: '#EF4444',
                  fontSize: '1.25rem'
                },
                '& .MuiAlert-message': {
                  flex: 1,
                  padding: 0
                },
                '& .MuiAlert-action': {
                  padding: 0,
                  marginLeft: 1
                }
              }}
              icon={<ErrorOutline />}
              action={
                <IconButton
                  size="small"
                  onClick={onClose}
                  sx={{
                    color: '#9CA3AF',
                    '&:hover': {
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      color: '#EF4444'
                    }
                  }}
                >
                  <CloseIcon sx={{ fontSize: '1rem' }} />
                </IconButton>
              }
            >
              <Box sx={{ py: 0.5 }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: '#EF4444',
                    fontSize: '0.9rem',
                    mb: 0.25
                  }}
                >
                  プレビューできません
                </Typography>
                
                <Typography
                  variant="body2"
                  sx={{
                    color: '#6B7280',
                    fontSize: '0.85rem',
                    lineHeight: 1.4
                  }}
                >
                  {message}
                  {errorCount > 0 && (
                    <Box component="span" sx={{ ml: 0.5 }}>
                      ({errorCount}件のエラー)
                    </Box>
                  )}
                </Typography>
              </Box>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>
    </Snackbar>
  );
};

export default ErrorNotification;