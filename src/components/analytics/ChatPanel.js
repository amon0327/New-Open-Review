import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Typography,
  IconButton,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  Send
} from '@mui/icons-material';

export default function ChatPanel() {
  const [chatMessage, setChatMessage] = useState('');
  const [isCommandMode, setIsCommandMode] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      type: 'system',
      content: 'AI Analytics ready',
      timestamp: new Date()
    }
  ]);

  const handleInputChange = (e) => {
    setChatMessage(e.target.value);
    setIsCommandMode(e.target.value.startsWith('/'));
    setIsActive(e.target.value.length > 0);
  };

  return (
    <Box
      sx={{
        width: 320,
        height: '100%',
        ml: 1,
        position: 'relative',
        bgcolor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: 2,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          boxShadow: '0 10px 25px -3px rgba(0, 0, 0, 0.1)',
          borderColor: '#5e17eb20'
        }
      }}
    >
      {/* Neural Network Header */}
      <Box
        sx={{
          position: 'relative',
          background: 'linear-gradient(135deg, #5e17eb 0%, #667eea 100%)',
          px: 2,
          py: 1.5,
          overflow: 'hidden'
        }}
      >
        {/* Animated particles */}
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              x: Math.random() * 300,
              y: Math.random() * 60,
              opacity: 0
            }}
            animate={{
              x: Math.random() * 300,
              y: Math.random() * 60,
              opacity: [0, 0.6, 0]
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2
            }}
            style={{
              position: 'absolute',
              width: 2,
              height: 2,
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              pointerEvents: 'none'
            }}
          />
        ))}
        
        <Box sx={{ position: 'relative', zIndex: 2 }}>
          <Typography
            sx={{
              color: 'white',
              fontSize: '0.9rem',
              fontWeight: 700,
              letterSpacing: '-0.025em',
              mb: 0.25
            }}
          >
            AI Analytics
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <motion.div
              animate={{
                rotate: 360
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "linear"
              }}
            >
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: 'conic-gradient(from 0deg, #10b981, #06d6a0, #10b981)',
                  boxShadow: '0 0 12px rgba(16, 185, 129, 0.6)'
                }}
              />
            </motion.div>
            <Typography
              sx={{
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '0.75rem',
                fontWeight: 500,
                letterSpacing: '0.01em'
              }}
            >
              Neural processing active
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Modern Message Display */}
      <Box
        sx={{
          flex: 1,
          px: 2,
          py: 1.5,
          overflowY: 'auto',
          position: 'relative',
          '&::-webkit-scrollbar': { 
            width: 4
          },
          '&::-webkit-scrollbar-track': { 
            bgcolor: 'transparent'
          },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: '#e2e8f0',
            borderRadius: 2,
            '&:hover': { bgcolor: '#cbd5e1' }
          }
        }}
      >
        {chatMessages.map((message, index) => (
          <motion.div
            key={message.id}
            initial={{ 
              opacity: 0, 
              x: message.type === 'user' ? 20 : -20,
              scale: 0.95 
            }}
            animate={{ 
              opacity: 1, 
              x: 0,
              scale: 1 
            }}
            transition={{
              duration: 0.4,
              delay: index * 0.1,
              ease: [0.25, 0.46, 0.45, 0.94]
            }}
          >
            {message.type === 'system' ? (
              <Box
                sx={{
                  textAlign: 'center',
                  py: 3,
                  position: 'relative'
                }}
              >
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 3,
                    py: 1,
                    bgcolor: 'rgba(94, 23, 235, 0.05)',
                    borderRadius: '20px',
                    border: '1px solid rgba(94, 23, 235, 0.1)'
                  }}
                >
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.7, 1, 0.7]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <Box
                      sx={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        bgcolor: '#5e17eb'
                      }}
                    />
                  </motion.div>
                  <Typography
                    sx={{
                      fontSize: '0.8rem',
                      color: '#64748b',
                      fontWeight: 500,
                      letterSpacing: '0.025em'
                    }}
                  >
                    {message.content}
                  </Typography>
                </Box>
              </Box>
            ) : (
              <Box
                sx={{
                  mb: 2,
                  display: 'flex',
                  justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start'
                }}
              >
                <Box
                  sx={{
                    maxWidth: '85%',
                    position: 'relative'
                  }}
                >
                  <Box
                    sx={{
                      px: 1.5,
                      py: 1,
                      borderRadius: message.type === 'user' 
                        ? '16px 16px 4px 16px' 
                        : '16px 16px 16px 4px',
                      bgcolor: message.type === 'user'
                        ? 'linear-gradient(135deg, #5e17eb 0%, #667eea 100%)'
                        : '#f8fafc',
                      border: message.type === 'user' 
                        ? 'none'
                        : '1px solid #e2e8f0',
                      boxShadow: message.type === 'user'
                        ? '0 4px 12px rgba(94, 23, 235, 0.25)'
                        : '0 1px 3px rgba(0, 0, 0, 0.1)',
                      position: 'relative',
                      '&::before': message.type === 'user' ? {
                        content: '""',
                        position: 'absolute',
                        inset: 0,
                        borderRadius: 'inherit',
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 100%)',
                        pointerEvents: 'none'
                      } : {}
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: '0.85rem',
                        lineHeight: 1.5,
                        color: message.type === 'user' ? 'white' : '#1a202c',
                        fontWeight: 500,
                        position: 'relative'
                      }}
                    >
                      {message.content}
                    </Typography>
                  </Box>
                  
                  {/* Timestamp */}
                  <Typography
                    sx={{
                      fontSize: '0.7rem',
                      color: '#94a3b8',
                      textAlign: message.type === 'user' ? 'right' : 'left',
                      mt: 0.5,
                      px: 0.5
                    }}
                  >
                    now
                  </Typography>
                </Box>
              </Box>
            )}
          </motion.div>
        ))}
      </Box>

      {/* Smart Suggestions */}
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ 
          opacity: isCommandMode ? 1 : 0,
          height: isCommandMode ? 'auto' : 0
        }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        style={{ overflow: 'hidden' }}
      >
        <Box
          sx={{
            px: 2,
            py: 1,
            borderTop: '1px solid #f1f5f9',
            bgcolor: '#fafbfc'
          }}
        >
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {[
              { cmd: 'trends', icon: '📈', desc: 'Analyze trends' },
              { cmd: 'compare', icon: '⚖️', desc: 'Compare data' },
              { cmd: 'insights', icon: '💡', desc: 'Get insights' }
            ].map((item, index) => (
              <motion.div
                key={item.cmd}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05, duration: 0.2 }}
              >
                <Box
                  onClick={() => setChatMessage(`/${item.cmd} `)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 1.5,
                    py: 0.75,
                    cursor: 'pointer',
                    borderRadius: '8px',
                    bgcolor: 'white',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                    '&:hover': {
                      borderColor: '#5e17eb',
                      boxShadow: '0 4px 12px rgba(94, 23, 235, 0.15)',
                      transform: 'translateY(-1px)'
                    },
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Typography sx={{ fontSize: '0.8rem' }}>
                    {item.icon}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '0.75rem',
                      color: '#64748b',
                      fontWeight: 500
                    }}
                  >
                    {item.desc}
                  </Typography>
                </Box>
              </motion.div>
            ))}
          </Box>
        </Box>
      </motion.div>

      {/* Premium Input Area */}
      <Box
        sx={{
          p: 2,
          borderTop: '1px solid #f1f5f9',
          bgcolor: 'white',
          position: 'relative'
        }}
      >
        <Box sx={{ position: 'relative' }}>
          <TextField
            fullWidth
            placeholder="Ask about your data..."
            value={chatMessage}
            onChange={handleInputChange}
            variant="outlined"
            multiline
            maxRows={4}
            InputProps={{
              endAdornment: (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, rotate: -90 }}
                  animate={{ 
                    opacity: chatMessage.trim() ? 1 : 0.3,
                    scale: chatMessage.trim() ? 1 : 0.8,
                    rotate: chatMessage.trim() ? 0 : -90
                  }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                >
                  <IconButton
                    edge="end"
                    size="small"
                    disabled={!chatMessage.trim()}
                    sx={{
                      width: 36,
                      height: 36,
                      background: chatMessage.trim() 
                        ? 'linear-gradient(135deg, #5e17eb 0%, #667eea 100%)'
                        : '#f1f5f9',
                      color: chatMessage.trim() ? 'white' : '#94a3b8',
                      boxShadow: chatMessage.trim() 
                        ? '0 4px 12px rgba(94, 23, 235, 0.3)'
                        : 'none',
                      '&:hover': {
                        background: chatMessage.trim() 
                          ? 'linear-gradient(135deg, #4c0db8 0%, #5046e5 100%)'
                          : '#e2e8f0',
                        transform: 'scale(1.05)',
                        boxShadow: chatMessage.trim() 
                          ? '0 6px 20px rgba(94, 23, 235, 0.4)'
                          : '0 2px 4px rgba(0, 0, 0, 0.1)'
                      },
                      '&.Mui-disabled': {
                        background: '#f1f5f9',
                        color: '#94a3b8'
                      },
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                  >
                    <Send sx={{ fontSize: 18 }} />
                  </IconButton>
                </motion.div>
              )
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: '#fafbfc',
                borderRadius: '12px',
                fontSize: '0.9rem',
                transition: 'all 0.2s ease',
                '& fieldset': { 
                  borderColor: isActive ? '#5e17eb' : '#e2e8f0',
                  borderWidth: isActive ? '2px' : '1px'
                },
                '&:hover fieldset': { 
                  borderColor: isActive ? '#5e17eb' : '#cbd5e1'
                },
                '&.Mui-focused': {
                  bgcolor: 'white',
                  boxShadow: '0 0 0 3px rgba(94, 23, 235, 0.1)'
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#5e17eb',
                  borderWidth: '2px'
                },
                '& .MuiInputBase-input': {
                  fontWeight: 500,
                  color: '#1a202c',
                  '&::placeholder': {
                    color: '#94a3b8',
                    opacity: 1,
                    fontWeight: 400
                  }
                }
              }
            }}
          />
          
          {/* Active typing indicator */}
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: isActive ? '100%' : 0 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'absolute',
              bottom: -2,
              left: 0,
              height: 2,
              background: 'linear-gradient(90deg, #5e17eb, #667eea)',
              borderRadius: '1px'
            }}
          />
        </Box>
        
        {/* Command hint */}
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ 
            opacity: chatMessage.trim() || isCommandMode ? 0 : 0.6,
            y: chatMessage.trim() || isCommandMode ? 5 : 0
          }}
          transition={{ duration: 0.2 }}
          style={{
            position: 'absolute',
            bottom: 8,
            left: 16,
            fontSize: '0.7rem',
            color: '#94a3b8',
            pointerEvents: 'none'
          }}
        >
          Type "/" for quick commands
        </motion.div>
      </Box>
    </Box>
  );
}