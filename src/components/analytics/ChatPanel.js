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
  Send,
  SmartToy,
  FlashOn,
  TrendingUp as TrendingUpIcon,
  InsightsOutlined,
  Psychology
} from '@mui/icons-material';

export default function ChatPanel() {
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      type: 'system',
      content: 'データ分析を始めましょう。何かお手伝いできることはありますか？',
      timestamp: new Date()
    }
  ]);

  return (
    <Box
      sx={{
        width: 380,
        height: '100%',
        ml: 1.5
      }}
    >
      <Box
        sx={{
          width: '100%',
          height: '100%',
          bgcolor: '#fefefe',
          borderRadius: 1.5,
          border: '1px solid #e1e5e9',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 8px 40px rgba(0, 0, 0, 0.08)',
          overflow: 'hidden'
        }}
      >
        {/* Ultra-modern Header */}
        <Box
          sx={{
            position: 'relative',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            overflow: 'hidden'
          }}
        >
          {/* Animated background elements */}
          <Box
            sx={{
              position: 'absolute',
              top: -20,
              right: -20,
              width: 60,
              height: 60,
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.1)',
              animation: 'float 3s ease-in-out infinite'
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              bottom: -10,
              left: -10,
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.08)',
              animation: 'float 4s ease-in-out infinite reverse'
            }}
          />
          
          <Box sx={{ position: 'relative', p: 1.5, py: 1.25 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: 2,
                  background: 'rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(10px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}
              >
                <Psychology sx={{ fontSize: 18, color: 'white' }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography
                  sx={{
                    color: 'white',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    letterSpacing: '-0.02em'
                  }}
                >
                  AI Analytics
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      bgcolor: '#10b981',
                      animation: 'pulse 2s infinite'
                    }}
                  />
                  <Typography
                    sx={{
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontSize: '0.75rem',
                      fontWeight: 500
                    }}
                  >
                    Ready to analyze
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Chat Messages */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          <Box
            sx={{
              flex: 1,
              overflowY: 'auto',
              px: 1.5,
              py: 1.5,
              '&::-webkit-scrollbar': { width: 4 },
              '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
              '&::-webkit-scrollbar-thumb': {
                bgcolor: '#d1d5db',
                borderRadius: 2,
                '&:hover': { bgcolor: '#9ca3af' }
              }
            }}
          >
            {chatMessages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    gap: 1,
                    mb: 1.5,
                    alignItems: 'flex-start'
                  }}
                >
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: 1.5,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flex: 'none'
                    }}
                  >
                    <SmartToy sx={{ fontSize: 16, color: 'white' }} />
                  </Box>
                  <Box
                    sx={{
                      flex: 1,
                      bgcolor: 'white',
                      borderRadius: 1.5,
                      p: 1.25,
                      border: '1px solid #e5e7eb',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: '0.85rem',
                        lineHeight: 1.5,
                        color: '#1f2937',
                        fontWeight: 500
                      }}
                    >
                      {message.content}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: '0.7rem',
                        color: '#9ca3af',
                        mt: 0.5,
                        fontWeight: 500
                      }}
                    >
                      AI Assistant
                    </Typography>
                  </Box>
                </Box>
              </motion.div>
            ))}
          </Box>

          {/* Smart Input Area with Quick Actions */}
          <Box
            sx={{
              p: 1.5,
              background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 1,
                background: 'linear-gradient(90deg, transparent 0%, rgba(99, 102, 241, 0.2) 50%, transparent 100%)'
              }
            }}
          >
            {/* Quick Actions Pills */}
            <Box sx={{ mb: 1.5 }}>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {[
                  { 
                    icon: <TrendingUpIcon />, 
                    label: 'Generate Insights', 
                    gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                    shadow: 'rgba(59, 130, 246, 0.3)'
                  },
                  { 
                    icon: <InsightsOutlined />, 
                    label: 'Compare Data', 
                    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                    shadow: 'rgba(139, 92, 246, 0.3)'
                  },
                  { 
                    icon: <FlashOn />, 
                    label: 'Quick Analysis', 
                    gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    shadow: 'rgba(245, 158, 11, 0.3)'
                  }
                ].map((action, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Box
                      onClick={() => setChatMessage(action.label)}
                      sx={{
                        py: 0.75,
                        px: 1.5,
                        borderRadius: 2.5,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.75,
                        background: action.gradient,
                        color: 'white',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        letterSpacing: '0.02em',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        boxShadow: `0 2px 8px ${action.shadow}`,
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        position: 'relative',
                        overflow: 'hidden',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: -100,
                          width: '100%',
                          height: '100%',
                          background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
                          transition: 'left 0.6s ease',
                        },
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: `0 6px 20px ${action.shadow}`,
                          '&::before': {
                            left: '100%',
                          }
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', zIndex: 1 }}>
                        {React.cloneElement(action.icon, { sx: { fontSize: 16 } })}
                      </Box>
                      <Typography sx={{ 
                        fontSize: '0.75rem', 
                        fontWeight: 700,
                        zIndex: 1,
                        textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                      }}>
                        {action.label.replace(' ', '\u00A0')}
                      </Typography>
                    </Box>
                  </motion.div>
                ))}
              </Box>
            </Box>

            {/* Advanced Message Input */}
            <Box sx={{ position: 'relative' }}>
              <Box
                sx={{
                  position: 'relative',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    inset: -1,
                    borderRadius: 2.5,
                    padding: 1,
                    background: chatMessage.trim() 
                      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                      : 'linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%)',
                    mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    maskComposite: 'xor',
                    transition: 'all 0.3s ease',
                    opacity: chatMessage.trim() ? 1 : 0.5
                  }
                }}
              >
                <TextField
                  fullWidth
                  placeholder="✨ Ask me anything about your data..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  variant="outlined"
                  multiline
                  maxRows={3}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <IconButton
                            edge="end"
                            size="small"
                            disabled={!chatMessage.trim()}
                            sx={{
                              width: 36,
                              height: 36,
                              background: chatMessage.trim() 
                                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                                : '#f3f4f6',
                              color: 'white',
                              boxShadow: chatMessage.trim() 
                                ? '0 4px 12px rgba(102, 126, 234, 0.4)'
                                : 'none',
                              '&:hover': {
                                background: chatMessage.trim() 
                                  ? 'linear-gradient(135deg, #5a67d8 0%, #6366f1 100%)'
                                  : '#f3f4f6',
                                transform: 'translateY(-1px)',
                                boxShadow: chatMessage.trim() 
                                  ? '0 6px 20px rgba(102, 126, 234, 0.5)'
                                  : 'none',
                              },
                              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                              '&.Mui-disabled': {
                                background: '#f3f4f6',
                                color: '#9ca3af'
                              }
                            }}
                          >
                            <Send sx={{ fontSize: 18 }} />
                          </IconButton>
                        </motion.div>
                      </InputAdornment>
                    )
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2.5,
                      bgcolor: 'rgba(255, 255, 255, 0.9)',
                      backdropFilter: 'blur(10px)',
                      fontSize: '0.9rem',
                      fontWeight: 500,
                      minHeight: 48,
                      '& fieldset': { 
                        border: 'none'
                      },
                      '&:hover fieldset': { 
                        border: 'none'
                      },
                      '&.Mui-focused fieldset': {
                        border: 'none'
                      },
                      '& .MuiInputBase-input': {
                        '&::placeholder': {
                          color: '#9ca3af',
                          fontWeight: 500,
                          opacity: 1
                        }
                      }
                    }
                  }}
                />
              </Box>
            </Box>

            {/* Typing Indicator */}
            <Box
              sx={{
                mt: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                opacity: chatMessage.trim() ? 1 : 0,
                transition: 'opacity 0.3s ease'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box
                  sx={{
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    bgcolor: '#667eea',
                    animation: 'pulse 1.5s infinite'
                  }}
                />
                <Typography
                  sx={{
                    fontSize: '0.7rem',
                    color: '#6b7280',
                    fontWeight: 500,
                    fontStyle: 'italic'
                  }}
                >
                  AI is ready to help
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}