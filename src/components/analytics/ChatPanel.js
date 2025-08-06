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
          bgcolor: 'white',
          borderRadius: '12px',
          overflow: 'hidden',
          position: 'relative',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          border: '1px solid #e5e7eb',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '200px',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(168, 85, 247, 0.05) 100%)',
            zIndex: 0
          }
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column', p: 2.5 }}>
          
          {/* Clean Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: '8px',
                bgcolor: '#6366f1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Typography sx={{ fontSize: '0.9rem', color: 'white' }}>🤖</Typography>
            </Box>
            <Box>
              <Typography
                sx={{
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  color: '#111827',
                  letterSpacing: '-0.01em'
                }}
              >
                AI Assistant
              </Typography>
              <Typography
                sx={{
                  fontSize: '0.7rem',
                  color: '#6b7280',
                  fontWeight: 500
                }}
              >
                Ready to help
              </Typography>
            </Box>
          </Box>

          {/* Welcome Message */}
          <Box sx={{ mb: 3 }}>
            <Typography
              sx={{
                fontSize: '1.1rem',
                fontWeight: 700,
                color: '#111827',
                mb: 0.5,
                letterSpacing: '-0.02em'
              }}
            >
              What can I help you with?
            </Typography>
            <Typography
              sx={{
                fontSize: '0.85rem',
                color: '#6b7280',
                fontWeight: 400,
                lineHeight: 1.5
              }}
            >
              Ask me anything about your data
            </Typography>
          </Box>

          {/* Quick Actions */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 1,
              mb: 3
            }}
          >
            {quickActions.map((action, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Box
                  onClick={() => {
                    setChatMessage(action.query);
                    handleSendMessage();
                  }}
                  sx={{
                    p: 1.5,
                    bgcolor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    textAlign: 'center',
                    '&:hover': {
                      bgcolor: '#f1f5f9',
                      borderColor: '#d1d5db'
                    },
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: '#374151'
                    }}
                  >
                    {action.label}
                  </Typography>
                </Box>
              </motion.div>
            ))}
          </Box>

          {/* Compact Input */}
          <Box sx={{ mt: 'auto' }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                p: 1,
                bgcolor: '#f9fafb',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                '&:focus-within': {
                  borderColor: '#6366f1',
                  boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.1)'
                }
              }}
            >
              <TextField
                fullWidth
                placeholder="Ask anything..."
                value={chatMessage}
                onChange={handleInputChange}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                variant="standard"
                InputProps={{ disableUnderline: true }}
                sx={{
                  '& .MuiInputBase-input': {
                    fontSize: '0.85rem',
                    color: '#111827',
                    fontWeight: 400,
                    py: 0.5,
                    '&::placeholder': {
                      color: '#9ca3af',
                      opacity: 1
                    }
                  }
                }}
              />
              {chatMessage.trim() && (
                <IconButton
                  onClick={handleSendMessage}
                  size="small"
                  sx={{
                    width: 28,
                    height: 28,
                    bgcolor: '#6366f1',
                    color: 'white',
                    '&:hover': { bgcolor: '#5046e5' }
                  }}
                >
                  <Send sx={{ fontSize: 14 }} />
                </IconButton>
              )}
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
        bgcolor: 'white',
        borderRadius: '12px',
        overflow: 'hidden',
        position: 'relative',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        border: '1px solid #e5e7eb',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '60px',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(168, 85, 247, 0.08) 100%)',
          zIndex: 0
        }
      }}
    >
      {/* Minimal Header */}
      <Box
        sx={{
          px: 2,
          py: 1.5,
          borderBottom: '1px solid #f3f4f6',
          position: 'relative',
          zIndex: 1
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 24,
              height: 24,
              borderRadius: '6px',
              bgcolor: '#6366f1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Typography sx={{ fontSize: '0.8rem', color: 'white' }}>🤖</Typography>
          </Box>
          <Box>
            <Typography
              sx={{
                fontSize: '0.8rem',
                fontWeight: 700,
                color: '#111827',
                letterSpacing: '-0.01em'
              }}
            >
              Assistant
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Clean Messages */}
      <Box
        sx={{
          flex: 1,
          px: 2,
          py: 1.5,
          overflowY: 'auto',
          '&::-webkit-scrollbar': { width: 2 },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: '#e5e7eb',
            borderRadius: 1
          }
        }}
      >
        {chatMessages.map((message, index) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
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
                    ? '16px 16px 4px 16px' 
                    : '16px 16px 16px 4px',
                  bgcolor: message.type === 'user' ? '#6366f1' : '#f8fafc',
                  color: message.type === 'user' ? 'white' : '#374151',
                  border: message.type === 'user' ? 'none' : '1px solid #e5e7eb'
                }}
              >
                <Typography
                  sx={{
                    fontSize: '0.85rem',
                    lineHeight: 1.5,
                    fontWeight: 500
                  }}
                >
                  {message.content}
                </Typography>
              </Box>
            </Box>
          </motion.div>
        ))}
      </Box>

      {/* Streamlined Input */}
      <Box
        sx={{
          px: 2,
          py: 1.5,
          borderTop: '1px solid #f3f4f6'
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: 0.75,
            p: 0.75,
            bgcolor: '#f9fafb',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            '&:focus-within': {
              borderColor: '#6366f1',
              boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.1)'
            },
            transition: 'all 0.15s ease'
          }}
        >
          <TextField
            fullWidth
            placeholder="Message..."
            value={chatMessage}
            onChange={handleInputChange}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
            variant="standard"
            multiline
            maxRows={3}
            InputProps={{ disableUnderline: true }}
            sx={{
              '& .MuiInputBase-input': {
                fontSize: '0.85rem',
                color: '#111827',
                fontWeight: 400,
                py: 0.25,
                lineHeight: 1.4,
                '&::placeholder': {
                  color: '#9ca3af',
                  opacity: 1
                }
              }
            }}
          />
          {chatMessage.trim() && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.15 }}
            >
              <IconButton
                onClick={handleSendMessage}
                size="small"
                sx={{
                  width: 24,
                  height: 24,
                  bgcolor: '#6366f1',
                  color: 'white',
                  '&:hover': { 
                    bgcolor: '#5046e5',
                    transform: 'scale(1.05)'
                  },
                  transition: 'all 0.15s ease'
                }}
              >
                <Send sx={{ fontSize: 12 }} />
              </IconButton>
            </motion.div>
          )}
        </Box>
      </Box>
    </Box>
  );
}