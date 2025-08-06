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
  const [hasStartedChat, setHasStartedChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);

  const handleInputChange = (e) => {
    setChatMessage(e.target.value);
    setIsCommandMode(e.target.value.startsWith('/'));
    setIsActive(e.target.value.length > 0);
  };

  const handleSendMessage = () => {
    if (chatMessage.trim()) {
      setHasStartedChat(true);
      setChatMessages(prev => [...prev, {
        id: Date.now(),
        type: 'user',
        content: chatMessage.trim(),
        timestamp: new Date()
      }]);
      setChatMessage('');
      setIsActive(false);
      
      // Simulate AI response
      setTimeout(() => {
        setChatMessages(prev => [...prev, {
          id: Date.now() + 1,
          type: 'assistant',
          content: 'I\'m analyzing your data. Here are the key insights I found...',
          timestamp: new Date()
        }]);
      }, 1000);
    }
  };

  const quickActions = [
    { label: 'Trends', query: 'Show me the trends' },
    { label: 'Compare', query: 'Compare segments' },
    { label: 'Patterns', query: 'Find patterns' },
    { label: 'Export', query: 'Export data' }
  ];

  if (!hasStartedChat) {
    return (
      <Box
        sx={{
          width: 340,
          height: '100%',
          ml: 1,
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '16px',
          overflow: 'hidden',
          position: 'relative',
          boxShadow: '0 20px 40px rgba(102, 126, 234, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        {/* Animated Background */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
            opacity: 0.9,
            zIndex: 0
          }}
        />
        
        {/* Floating Particles */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            initial={{
              x: Math.random() * 340,
              y: Math.random() * 400,
              opacity: 0
            }}
            animate={{
              x: Math.random() * 340,
              y: Math.random() * 400,
              opacity: [0, 0.3, 0]
            }}
            transition={{
              duration: 8 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 3
            }}
            style={{
              position: 'absolute',
              width: 2,
              height: 2,
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.6)',
              zIndex: 1
            }}
          />
        ))}

        <Box sx={{ position: 'relative', zIndex: 2, flex: 1, display: 'flex', flexDirection: 'column', p: 3 }}>
          
          {/* Header with Status */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(10px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(255, 255, 255, 0.3)'
                }}
              >
                <Typography sx={{ fontSize: '1rem', color: 'white' }}>✨</Typography>
              </Box>
              <Box>
                <Typography
                  sx={{
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    color: 'white',
                    letterSpacing: '-0.02em'
                  }}
                >
                  AI Analytics
                </Typography>
                <Typography
                  sx={{
                    fontSize: '0.7rem',
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontWeight: 500
                  }}
                >
                  Neural Engine Ready
                </Typography>
              </Box>
            </Box>
            
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                boxShadow: [
                  '0 0 10px rgba(34, 197, 94, 0.5)',
                  '0 0 20px rgba(34, 197, 94, 0.8)',
                  '0 0 10px rgba(34, 197, 94, 0.5)'
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: '#22c55e',
                  boxShadow: '0 0 15px rgba(34, 197, 94, 0.6)'
                }}
              />
            </motion.div>
          </Box>

          {/* Welcome Message */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography
              sx={{
                fontSize: '1.4rem',
                fontWeight: 800,
                color: 'white',
                mb: 1,
                letterSpacing: '-0.03em',
                textShadow: '0 2px 10px rgba(0, 0, 0, 0.2)'
              }}
            >
              Ready to unlock insights?
            </Typography>
            <Typography
              sx={{
                fontSize: '0.9rem',
                color: 'rgba(255, 255, 255, 0.85)',
                fontWeight: 500,
                lineHeight: 1.5
              }}
            >
              Ask me anything about your data and I'll provide intelligent analysis
            </Typography>
          </Box>

          {/* Smart Action Cards */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 1.5,
              mb: 4
            }}
          >
            {quickActions.map((action, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <Box
                  onClick={() => {
                    setChatMessage(action.query);
                    handleSendMessage();
                  }}
                  sx={{
                    p: 2,
                    background: 'rgba(255, 255, 255, 0.15)',
                    backdropFilter: 'blur(20px)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    cursor: 'pointer',
                    textAlign: 'center',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                    '&:hover': {
                      background: 'rgba(255, 255, 255, 0.25)',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)'
                    },
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      color: 'white',
                      letterSpacing: '0.02em',
                      textShadow: '0 1px 3px rgba(0, 0, 0, 0.2)'
                    }}
                  >
                    {action.label}
                  </Typography>
                </Box>
              </motion.div>
            ))}
          </Box>

          {/* Premium Input */}
          <Box sx={{ mt: 'auto' }}>
            <Box
              sx={{
                position: 'relative',
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(20px)',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                p: 1.5,
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
              }}
            >
              <TextField
                fullWidth
                placeholder="What insights do you need?"
                value={chatMessage}
                onChange={handleInputChange}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                variant="standard"
                InputProps={{
                  disableUnderline: true,
                  endAdornment: (
                    <motion.div
                      animate={{
                        scale: chatMessage.trim() ? 1 : 0.8,
                        opacity: chatMessage.trim() ? 1 : 0.5
                      }}
                      transition={{ duration: 0.2 }}
                    >
                      <IconButton
                        onClick={handleSendMessage}
                        disabled={!chatMessage.trim()}
                        sx={{
                          width: 36,
                          height: 36,
                          background: chatMessage.trim()
                            ? 'linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%)'
                            : 'rgba(255, 255, 255, 0.3)',
                          color: chatMessage.trim() ? '#667eea' : 'rgba(255, 255, 255, 0.6)',
                          backdropFilter: 'blur(10px)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          boxShadow: chatMessage.trim()
                            ? '0 4px 15px rgba(255, 255, 255, 0.3)'
                            : 'none',
                          '&:hover': {
                            background: chatMessage.trim()
                              ? 'linear-gradient(135deg, #ffffff 0%, #e0e0e0 100%)'
                              : 'rgba(255, 255, 255, 0.4)',
                            transform: 'scale(1.05)'
                          },
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <Send sx={{ fontSize: 16 }} />
                      </IconButton>
                    </motion.div>
                  )
                }}
                sx={{
                  '& .MuiInputBase-input': {
                    fontSize: '0.95rem',
                    color: 'white',
                    fontWeight: 500,
                    '&::placeholder': {
                      color: 'rgba(255, 255, 255, 0.7)',
                      opacity: 1,
                      fontWeight: 400
                    }
                  }
                }}
              />
            </Box>
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: 340,
        height: '100%',
        ml: 1,
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(145deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        borderRadius: '16px',
        overflow: 'hidden',
        position: 'relative',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}
    >
      {/* Neural Header */}
      <Box
        sx={{
          p: 2,
          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          position: 'relative'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
              }}
            >
              <Typography sx={{ fontSize: '0.9rem', color: 'white' }}>🧠</Typography>
            </Box>
            <Box>
              <Typography
                sx={{
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: 'white',
                  letterSpacing: '-0.01em'
                }}
              >
                Neural Chat
              </Typography>
              <Typography
                sx={{
                  fontSize: '0.65rem',
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontWeight: 500
                }}
              >
                Processing insights
              </Typography>
            </Box>
          </Box>
          
          <motion.div
            animate={{
              opacity: [0.5, 1, 0.5],
              scale: [1, 1.1, 1]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                bgcolor: '#00ff87',
                boxShadow: '0 0 12px rgba(0, 255, 135, 0.8)'
              }}
            />
          </motion.div>
        </Box>
      </Box>

      {/* Messages Area with Glow */}
      <Box
        sx={{
          flex: 1,
          px: 2,
          py: 1.5,
          overflowY: 'auto',
          position: 'relative',
          '&::-webkit-scrollbar': { width: 3 },
          '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: 'rgba(102, 126, 234, 0.5)',
            borderRadius: 2
          }
        }}
      >
        {chatMessages.map((message, index) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
          >
            <Box
              sx={{
                mb: 1.5,
                display: 'flex',
                justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start'
              }}
            >
              <Box
                sx={{
                  maxWidth: '80%',
                  px: 1.5,
                  py: 1,
                  borderRadius: message.type === 'user' 
                    ? '18px 18px 4px 18px' 
                    : '18px 18px 18px 4px',
                  background: message.type === 'user'
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    : 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(20px)',
                  border: message.type === 'user' 
                    ? 'none'
                    : '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: message.type === 'user'
                    ? '0 8px 25px rgba(102, 126, 234, 0.4)'
                    : '0 4px 15px rgba(255, 255, 255, 0.1)',
                  position: 'relative'
                }}
              >
                <Typography
                  sx={{
                    fontSize: '0.85rem',
                    lineHeight: 1.5,
                    color: 'white',
                    fontWeight: 500
                  }}
                >
                  {message.content}
                </Typography>
                
                {/* Glow effect for user messages */}
                {message.type === 'user' && (
                  <Box
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: 'inherit',
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 100%)',
                      pointerEvents: 'none'
                    }}
                  />
                )}
              </Box>
            </Box>
          </motion.div>
        ))}
      </Box>

      {/* Futuristic Input */}
      <Box
        sx={{
          p: 2,
          background: 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <Box
          sx={{
            position: 'relative',
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            border: isActive ? '2px solid rgba(102, 126, 234, 0.5)' : '1px solid rgba(255, 255, 255, 0.1)',
            p: 1.5,
            boxShadow: isActive ? '0 0 20px rgba(102, 126, 234, 0.3)' : 'none',
            transition: 'all 0.3s ease'
          }}
        >
          <TextField
            fullWidth
            placeholder="Ask anything about your data..."
            value={chatMessage}
            onChange={handleInputChange}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
            variant="standard"
            multiline
            maxRows={4}
            InputProps={{
              disableUnderline: true,
              endAdornment: (
                <motion.div
                  animate={{
                    scale: chatMessage.trim() ? 1 : 0.8,
                    rotate: chatMessage.trim() ? 0 : -45
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <IconButton
                    onClick={handleSendMessage}
                    disabled={!chatMessage.trim()}
                    sx={{
                      width: 36,
                      height: 36,
                      background: chatMessage.trim()
                        ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                        : 'rgba(255, 255, 255, 0.1)',
                      color: 'white',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      boxShadow: chatMessage.trim()
                        ? '0 4px 20px rgba(102, 126, 234, 0.5)'
                        : 'none',
                      '&:hover': {
                        background: chatMessage.trim()
                          ? 'linear-gradient(135deg, #5a67d8 0%, #6366f1 100%)'
                          : 'rgba(255, 255, 255, 0.2)',
                        transform: 'scale(1.1)',
                        boxShadow: chatMessage.trim()
                          ? '0 6px 30px rgba(102, 126, 234, 0.6)'
                          : '0 2px 10px rgba(255, 255, 255, 0.2)'
                      },
                      '&.Mui-disabled': {
                        background: 'rgba(255, 255, 255, 0.05)',
                        color: 'rgba(255, 255, 255, 0.3)'
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <Send sx={{ fontSize: 16 }} />
                  </IconButton>
                </motion.div>
              )
            }}
            sx={{
              '& .MuiInputBase-input': {
                fontSize: '0.9rem',
                color: 'white',
                fontWeight: 500,
                '&::placeholder': {
                  color: 'rgba(255, 255, 255, 0.5)',
                  opacity: 1,
                  fontWeight: 400
                }
              }
            }}
          />
        </Box>
      </Box>
    </Box>
  );
}