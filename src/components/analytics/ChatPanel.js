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
    { icon: '📊', title: 'Show Trends', query: 'Show me the latest data trends' },
    { icon: '🔍', title: 'Deep Analysis', query: 'Perform a deep analysis of the data' },
    { icon: '📈', title: 'Performance', query: 'How is the performance trending?' },
    { icon: '🎯', title: 'Key Metrics', query: 'What are the key metrics I should focus on?' }
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
          bgcolor: '#fafbfc',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          overflow: 'hidden'
        }}
      >
        {/* Compact Header */}
        <Box
          sx={{
            px: 1.5,
            py: 1,
            bgcolor: 'white',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          <Box
            sx={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              bgcolor: '#10b981'
            }}
          />
          <Typography
            sx={{
              fontSize: '0.8rem',
              fontWeight: 600,
              color: '#1a202c'
            }}
          >
            AI Assistant
          </Typography>
        </Box>

        {/* Welcome Screen */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            px: 2,
            py: 3
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '12px',
                bgcolor: 'rgba(94, 23, 235, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2
              }}
            >
              <Typography sx={{ fontSize: '1.5rem' }}>🤖</Typography>
            </Box>
            <Typography
              sx={{
                fontSize: '1rem',
                fontWeight: 700,
                color: '#1a202c',
                mb: 0.5
              }}
            >
              Ready to analyze
            </Typography>
            <Typography
              sx={{
                fontSize: '0.8rem',
                color: '#64748b',
                lineHeight: 1.4
              }}
            >
              Ask me anything about your data
            </Typography>
          </Box>

          {/* Quick Actions Grid */}
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
                    setIsActive(true);
                  }}
                  sx={{
                    p: 1.5,
                    bgcolor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    textAlign: 'center',
                    '&:hover': {
                      borderColor: '#5e17eb',
                      boxShadow: '0 2px 8px rgba(94, 23, 235, 0.1)'
                    },
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Typography sx={{ fontSize: '1.2rem', mb: 0.5 }}>
                    {action.icon}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      color: '#374151',
                      lineHeight: 1.2
                    }}
                  >
                    {action.title}
                  </Typography>
                </Box>
              </motion.div>
            ))}
          </Box>
        </Box>

        {/* Input Area */}
        <Box
          sx={{
            p: 1.5,
            bgcolor: 'white',
            borderTop: '1px solid #f1f5f9'
          }}
        >
          <TextField
            fullWidth
            placeholder="Ask about your data..."
            value={chatMessage}
            onChange={handleInputChange}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            variant="outlined"
            size="small"
            InputProps={{
              endAdornment: (
                <motion.div
                  animate={{ 
                    scale: isActive ? 1 : 0.8,
                    opacity: isActive ? 1 : 0.5
                  }}
                  transition={{ duration: 0.2 }}
                >
                  <IconButton
                    onClick={handleSendMessage}
                    disabled={!chatMessage.trim()}
                    size="small"
                    sx={{
                      bgcolor: isActive ? '#5e17eb' : '#f1f5f9',
                      color: isActive ? 'white' : '#94a3b8',
                      width: 28,
                      height: 28,
                      '&:hover': {
                        bgcolor: isActive ? '#4c0db8' : '#e2e8f0'
                      }
                    }}
                  >
                    <Send sx={{ fontSize: 14 }} />
                  </IconButton>
                </motion.div>
              )
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: '#fafbfc',
                borderRadius: '8px',
                fontSize: '0.85rem',
                '& fieldset': { 
                  borderColor: '#e2e8f0'
                },
                '&:hover fieldset': { 
                  borderColor: '#cbd5e1'
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#5e17eb'
                }
              }
            }}
          />
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
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        overflow: 'hidden'
      }}
    >
      {/* Minimal Header */}
      <Box
        sx={{
          px: 1.5,
          py: 1,
          bgcolor: '#5e17eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              bgcolor: '#10b981'
            }}
          />
          <Typography
            sx={{
              fontSize: '0.8rem',
              fontWeight: 600,
              color: 'white'
            }}
          >
            AI Assistant
          </Typography>
        </Box>
        <Typography
          sx={{
            fontSize: '0.7rem',
            color: 'rgba(255, 255, 255, 0.8)'
          }}
        >
          Active
        </Typography>
      </Box>

      {/* Compact Message Display */}
      <Box
        sx={{
          flex: 1,
          px: 1.5,
          py: 1,
          overflowY: 'auto',
          '&::-webkit-scrollbar': { width: 2 },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: '#e2e8f0',
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
                  px: 1.25,
                  py: 0.75,
                  borderRadius: message.type === 'user' 
                    ? '12px 12px 2px 12px' 
                    : '12px 12px 12px 2px',
                  bgcolor: message.type === 'user' ? '#5e17eb' : '#f8fafc',
                  border: message.type === 'user' ? 'none' : '1px solid #e2e8f0',
                  boxShadow: message.type === 'user' 
                    ? '0 2px 8px rgba(94, 23, 235, 0.2)' 
                    : '0 1px 2px rgba(0, 0, 0, 0.05)'
                }}
              >
                <Typography
                  sx={{
                    fontSize: '0.8rem',
                    lineHeight: 1.4,
                    color: message.type === 'user' ? 'white' : '#1a202c',
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

      {/* Compact Input */}
      <Box
        sx={{
          px: 1.5,
          py: 1,
          borderTop: '1px solid #f1f5f9',
          bgcolor: '#fafbfc'
        }}
      >
        <TextField
          fullWidth
          placeholder="Type a message..."
          value={chatMessage}
          onChange={handleInputChange}
          onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
          variant="outlined"
          size="small"
          multiline
          maxRows={3}
          InputProps={{
            endAdornment: (
              <motion.div
                animate={{ 
                  scale: isActive ? 1 : 0.8,
                  opacity: isActive ? 1 : 0.5
                }}
                transition={{ duration: 0.2 }}
              >
                <IconButton
                  onClick={handleSendMessage}
                  disabled={!chatMessage.trim()}
                  size="small"
                  sx={{
                    bgcolor: isActive ? '#5e17eb' : '#f1f5f9',
                    color: isActive ? 'white' : '#94a3b8',
                    width: 28,
                    height: 28,
                    '&:hover': {
                      bgcolor: isActive ? '#4c0db8' : '#e2e8f0'
                    }
                  }}
                >
                  <Send sx={{ fontSize: 14 }} />
                </IconButton>
              </motion.div>
            )
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              bgcolor: 'white',
              borderRadius: '8px',
              fontSize: '0.8rem',
              '& fieldset': { 
                borderColor: '#e2e8f0'
              },
              '&:hover fieldset': { 
                borderColor: '#cbd5e1'
              },
              '&.Mui-focused fieldset': {
                borderColor: '#5e17eb'
              }
            }
          }}
        />
      </Box>
    </Box>
  );
}