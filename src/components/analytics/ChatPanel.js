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
          width: 320,
          height: '100%',
          ml: 0.5,
          display: 'flex',
          flexDirection: 'column',
          bgcolor: '#fff',
          position: 'relative'
        }}
      >
        {/* Borderless Content */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', py: 3, px: 2 }}>
          
          {/* Status */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 4, opacity: 0.4 }}>
            <Box
              sx={{
                width: 4,
                height: 4,
                borderRadius: '50%',
                bgcolor: '#22c55e'
              }}
            />
            <Typography
              sx={{
                fontSize: '0.65rem',
                color: '#000',
                fontWeight: 500,
                letterSpacing: '0.1em',
                textTransform: 'uppercase'
              }}
            >
              Ready
            </Typography>
          </Box>

          {/* Main Content */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Typography
              sx={{
                fontSize: '1.1rem',
                fontWeight: 600,
                color: '#000',
                mb: 1,
                letterSpacing: '-0.02em'
              }}
            >
              What would you like to know?
            </Typography>

            {/* Actions */}
            <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {quickActions.map((action, index) => (
                <Box
                  key={index}
                  onClick={() => {
                    setChatMessage(action.query);
                    handleSendMessage();
                  }}
                  sx={{
                    py: 1,
                    px: 1.5,
                    cursor: 'pointer',
                    borderRadius: '4px',
                    fontSize: '0.85rem',
                    color: '#666',
                    fontWeight: 500,
                    '&:hover': {
                      bgcolor: '#f8f8f8',
                      color: '#000'
                    },
                    transition: 'all 0.15s ease'
                  }}
                >
                  {action.label}
                </Box>
              ))}
            </Box>
          </Box>

          {/* Bottom Input */}
          <Box sx={{ mt: 'auto' }}>
            <Box
              sx={{
                position: 'relative',
                borderTop: '1px solid #eee',
                pt: 2
              }}
            >
              <TextField
                fullWidth
                placeholder="Ask anything..."
                value={chatMessage}
                onChange={handleInputChange}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                variant="standard"
                InputProps={{
                  disableUnderline: true,
                  endAdornment: chatMessage.trim() && (
                    <IconButton
                      onClick={handleSendMessage}
                      sx={{
                        width: 24,
                        height: 24,
                        bgcolor: '#000',
                        color: '#fff',
                        '&:hover': { bgcolor: '#333' }
                      }}
                    >
                      <Send sx={{ fontSize: 12 }} />
                    </IconButton>
                  )
                }}
                sx={{
                  '& .MuiInputBase-input': {
                    fontSize: '0.9rem',
                    color: '#000',
                    fontWeight: 400,
                    '&::placeholder': {
                      color: '#999',
                      opacity: 1
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
        width: 320,
        height: '100%',
        ml: 0.5,
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#fff',
        position: 'relative'
      }}
    >
      {/* Clean Messages */}
      <Box
        sx={{
          flex: 1,
          px: 2,
          py: 2,
          overflowY: 'auto',
          '&::-webkit-scrollbar': { display: 'none' }
        }}
      >
        {chatMessages.map((message, index) => (
          <Box
            key={message.id}
            sx={{
              mb: 2,
              display: 'flex',
              justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start'
            }}
          >
            <Box
              sx={{
                maxWidth: '75%',
                py: 1,
                px: 1.5,
                borderRadius: message.type === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                bgcolor: message.type === 'user' ? '#000' : '#f5f5f5',
                color: message.type === 'user' ? '#fff' : '#000'
              }}
            >
              <Typography
                sx={{
                  fontSize: '0.85rem',
                  lineHeight: 1.4,
                  fontWeight: 400
                }}
              >
                {message.content}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>

      {/* Bottom Input */}
      <Box
        sx={{
          px: 2,
          pb: 2,
          borderTop: '1px solid #f0f0f0',
          pt: 1.5
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
          maxRows={4}
          InputProps={{
            disableUnderline: true,
            endAdornment: chatMessage.trim() && (
              <IconButton
                onClick={handleSendMessage}
                sx={{
                  width: 24,
                  height: 24,
                  bgcolor: '#000',
                  color: '#fff',
                  '&:hover': { bgcolor: '#333' },
                  ml: 1
                }}
              >
                <Send sx={{ fontSize: 12 }} />
              </IconButton>
            )
          }}
          sx={{
            '& .MuiInputBase-input': {
              fontSize: '0.9rem',
              color: '#000',
              fontWeight: 400,
              '&::placeholder': {
                color: '#999',
                opacity: 1
              }
            }
          }}
        />
      </Box>
    </Box>
  );
}