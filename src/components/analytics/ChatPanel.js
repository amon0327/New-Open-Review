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
      content: 'Ready to analyze your data. What insights are you looking for?',
      timestamp: new Date()
    }
  ]);

  return (
    <Box
      sx={{
        width: 320,
        height: '100%',
        ml: 1,
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#0a0a0b',
        border: '1px solid #1e1e20',
        borderRadius: '8px',
        overflow: 'hidden'
      }}
    >
      {/* Minimal Header */}
      <Box
        sx={{
          px: 1.5,
          py: 1,
          borderBottom: '1px solid #1e1e20',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          bgcolor: '#0f0f10'
        }}
      >
        <Box
          sx={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            bgcolor: '#00d9ff',
            boxShadow: '0 0 8px rgba(0, 217, 255, 0.6)'
          }}
        />
        <Typography
          sx={{
            color: '#ffffff',
            fontSize: '0.8rem',
            fontWeight: 600,
            letterSpacing: '0.02em'
          }}
        >
          AI Assistant
        </Typography>
      </Box>

      {/* Messages Area */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          px: 1,
          py: 0.5,
          '&::-webkit-scrollbar': { width: 2 },
          '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: '#2a2a2c',
            borderRadius: 1
          }
        }}
      >
        {chatMessages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Box
              sx={{
                mb: 1,
                p: 1,
                bgcolor: message.type === 'user' ? '#1a1a1c' : 'transparent',
                borderRadius: '6px',
                border: message.type === 'user' ? '1px solid #2a2a2c' : 'none'
              }}
            >
              <Typography
                sx={{
                  fontSize: '0.8rem',
                  lineHeight: 1.4,
                  color: message.type === 'user' ? '#ffffff' : '#a1a1aa',
                  fontWeight: 400
                }}
              >
                {message.content}
              </Typography>
            </Box>
          </motion.div>
        ))}
      </Box>

      {/* Quick Actions */}
      <Box
        sx={{
          px: 1,
          py: 0.5,
          borderTop: '1px solid #1e1e20',
          display: 'flex',
          gap: 0.5,
          flexWrap: 'wrap'
        }}
      >
        {['Trends', 'Compare', 'Insights'].map((action, index) => (
          <motion.div
            key={index}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Box
              onClick={() => setChatMessage(`Analyze ${action.toLowerCase()}`)}
              sx={{
                px: 1,
                py: 0.375,
                bgcolor: '#1a1a1c',
                border: '1px solid #2a2a2c',
                borderRadius: '4px',
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: '#2a2a2c',
                  borderColor: '#3a3a3c'
                }
              }}
            >
              <Typography
                sx={{
                  fontSize: '0.7rem',
                  color: '#71717a',
                  fontWeight: 500
                }}
              >
                {action}
              </Typography>
            </Box>
          </motion.div>
        ))}
      </Box>

      {/* Input Area */}
      <Box
        sx={{
          p: 1,
          borderTop: '1px solid #1e1e20',
          bgcolor: '#0f0f10'
        }}
      >
        <Box sx={{ position: 'relative' }}>
          <TextField
            fullWidth
            placeholder="Ask anything..."
            value={chatMessage}
            onChange={(e) => setChatMessage(e.target.value)}
            variant="outlined"
            size="small"
            multiline
            maxRows={3}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    edge="end"
                    size="small"
                    disabled={!chatMessage.trim()}
                    sx={{
                      width: 24,
                      height: 24,
                      bgcolor: chatMessage.trim() ? '#00d9ff' : '#2a2a2c',
                      color: chatMessage.trim() ? '#000000' : '#71717a',
                      '&:hover': {
                        bgcolor: chatMessage.trim() ? '#00c4e6' : '#2a2a2c'
                      },
                      '&.Mui-disabled': {
                        bgcolor: '#2a2a2c',
                        color: '#71717a'
                      }
                    }}
                  >
                    <Send sx={{ fontSize: 12 }} />
                  </IconButton>
                </InputAdornment>
              )
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: '#1a1a1c',
                borderRadius: '6px',
                fontSize: '0.8rem',
                '& fieldset': { 
                  borderColor: '#2a2a2c'
                },
                '&:hover fieldset': { 
                  borderColor: '#3a3a3c'
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#00d9ff',
                  borderWidth: '1px'
                },
                '& .MuiInputBase-input': {
                  color: '#ffffff',
                  '&::placeholder': {
                    color: '#71717a',
                    opacity: 1
                  }
                }
              }
            }}
          />
        </Box>
      </Box>
    </Box>
  );
}