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
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      type: 'assistant',
      content: 'Hi! I\'m here to help analyze your data. What would you like to explore?',
      timestamp: new Date()
    }
  ]);

  return (
    <Box
      sx={{
        width: 340,
        height: '100%',
        ml: 1,
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
      }}
    >
      {/* Modern Header */}
      <Box
        sx={{
          px: 1.5,
          py: 1.25,
          borderBottom: '1px solid #f3f4f6',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          bgcolor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)'
        }}
      >
        <Box
          sx={{
            width: 28,
            height: 28,
            borderRadius: '8px',
            bgcolor: 'rgba(255, 255, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(10px)'
          }}
        >
          <Typography
            sx={{
              fontSize: '1rem',
              fontWeight: 700,
              color: 'white'
            }}
          >
            AI
          </Typography>
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography
            sx={{
              color: 'white',
              fontSize: '0.9rem',
              fontWeight: 700,
              letterSpacing: '-0.01em'
            }}
          >
            Analytics Assistant
          </Typography>
          <Typography
            sx={{
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '0.75rem',
              fontWeight: 500
            }}
          >
            Ready to help
          </Typography>
        </Box>
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            bgcolor: '#10b981',
            boxShadow: '0 0 12px rgba(16, 185, 129, 0.8)'
          }}
        />
      </Box>

      {/* Messages Area */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          px: 1.5,
          py: 1,
          '&::-webkit-scrollbar': { width: 3 },
          '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: '#d1d5db',
            borderRadius: 1.5,
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
                mb: 1.5,
                display: 'flex',
                justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start'
              }}
            >
              <Box
                sx={{
                  maxWidth: '85%',
                  px: 1.5,
                  py: 1,
                  borderRadius: message.type === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  bgcolor: message.type === 'user' 
                    ? 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)'
                    : '#f8fafc',
                  border: message.type === 'user' ? 'none' : '1px solid #e2e8f0',
                  boxShadow: message.type === 'user' 
                    ? '0 2px 8px rgba(79, 70, 229, 0.3)'
                    : '0 1px 3px rgba(0, 0, 0, 0.1)'
                }}
              >
                <Typography
                  sx={{
                    fontSize: '0.85rem',
                    lineHeight: 1.5,
                    color: message.type === 'user' ? 'white' : '#374151',
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

      {/* Smart Suggestions */}
      <Box
        sx={{
          px: 1.5,
          py: 1,
          borderTop: '1px solid #f3f4f6',
          bgcolor: '#fafbfc'
        }}
      >
        <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
          {[
            { label: '📊 Show trends', query: 'Show me the latest trends in the data' },
            { label: '🔍 Compare', query: 'Compare different data segments' },
            { label: '💡 Insights', query: 'Generate key insights from this data' }
          ].map((suggestion, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Box
                onClick={() => setChatMessage(suggestion.query)}
                sx={{
                  px: 1.25,
                  py: 0.5,
                  bgcolor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                  '&:hover': {
                    bgcolor: '#f9fafb',
                    borderColor: '#d1d5db',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                  },
                  transition: 'all 0.15s ease'
                }}
              >
                <Typography
                  sx={{
                    fontSize: '0.75rem',
                    color: '#4b5563',
                    fontWeight: 600,
                    letterSpacing: '0.01em'
                  }}
                >
                  {suggestion.label}
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
          borderTop: '1px solid #f3f4f6'
        }}
      >
        <Box sx={{ position: 'relative' }}>
          <TextField
            fullWidth
            placeholder="Type your question..."
            value={chatMessage}
            onChange={(e) => setChatMessage(e.target.value)}
            variant="outlined"
            size="small"
            multiline
            maxRows={4}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <IconButton
                      edge="end"
                      size="small"
                      disabled={!chatMessage.trim()}
                      sx={{
                        width: 32,
                        height: 32,
                        bgcolor: chatMessage.trim() 
                          ? 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)'
                          : '#f3f4f6',
                        color: chatMessage.trim() ? 'white' : '#9ca3af',
                        boxShadow: chatMessage.trim() 
                          ? '0 2px 8px rgba(79, 70, 229, 0.3)'
                          : 'none',
                        '&:hover': {
                          bgcolor: chatMessage.trim() 
                            ? 'linear-gradient(135deg, #4338ca 0%, #6d28d9 100%)'
                            : '#f3f4f6',
                          boxShadow: chatMessage.trim() 
                            ? '0 4px 12px rgba(79, 70, 229, 0.4)'
                            : 'none'
                        },
                        '&.Mui-disabled': {
                          bgcolor: '#f3f4f6',
                          color: '#9ca3af'
                        },
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <Send sx={{ fontSize: 16 }} />
                    </IconButton>
                  </motion.div>
                </InputAdornment>
              )
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: '#fafbfc',
                borderRadius: '12px',
                fontSize: '0.875rem',
                '& fieldset': { 
                  borderColor: '#e5e7eb',
                  borderWidth: '1px'
                },
                '&:hover fieldset': { 
                  borderColor: '#d1d5db'
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#4f46e5',
                  borderWidth: '2px'
                },
                '& .MuiInputBase-input': {
                  color: '#374151',
                  fontWeight: 500,
                  '&::placeholder': {
                    color: '#9ca3af',
                    opacity: 1,
                    fontWeight: 400
                  }
                }
              }
            }}
          />
        </Box>
        <Typography
          sx={{
            fontSize: '0.7rem',
            color: '#9ca3af',
            textAlign: 'center',
            mt: 0.75,
            fontWeight: 500
          }}
        >
          AI can make mistakes. Verify important information.
        </Typography>
      </Box>
    </Box>
  );
}