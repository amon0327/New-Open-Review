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
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      type: 'system',
      content: '◉ ready',
      timestamp: new Date()
    }
  ]);

  const handleInputChange = (e) => {
    setChatMessage(e.target.value);
    setIsCommandMode(e.target.value.startsWith('/'));
  };

  return (
    <Box
      sx={{
        width: 280,
        height: '100%',
        position: 'relative',
        bgcolor: 'transparent',
        display: 'flex',
        flexDirection: 'column',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: '10%',
          left: 0,
          width: 1,
          height: '80%',
          background: 'linear-gradient(to bottom, transparent, #e4e4e7, transparent)',
          opacity: 0.5
        }
      }}
    >
      {/* Floating Status */}
      <Box
        sx={{
          position: 'absolute',
          top: 24,
          right: 24,
          zIndex: 10
        }}
      >
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
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
              bgcolor: '#10b981',
              boxShadow: '0 0 20px rgba(16, 185, 129, 0.6)'
            }}
          />
        </motion.div>
      </Box>

      {/* Terminal-style Messages */}
      <Box
        sx={{
          flex: 1,
          px: 3,
          pt: 8,
          pb: 2,
          position: 'relative',
          overflowY: 'auto',
          '&::-webkit-scrollbar': { display: 'none' },
          fontFamily: '"JetBrains Mono", "Fira Code", monospace'
        }}
      >
        {chatMessages.map((message, index) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{
              duration: 0.6,
              delay: index * 0.2,
              ease: [0.16, 1, 0.3, 1]
            }}
          >
            {message.type === 'system' ? (
              <Box
                sx={{
                  mb: 6,
                  textAlign: 'left',
                  position: 'relative'
                }}
              >
                <Typography
                  sx={{
                    fontSize: '0.8rem',
                    fontFamily: 'inherit',
                    color: '#71717a',
                    letterSpacing: '0.05em',
                    fontWeight: 400
                  }}
                >
                  {message.content}
                </Typography>
                
                {/* Cursor blink effect for system messages */}
                <motion.span
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  style={{
                    display: 'inline-block',
                    width: '2px',
                    height: '1em',
                    backgroundColor: '#71717a',
                    marginLeft: '4px',
                    verticalAlign: 'text-top'
                  }}
                />
              </Box>
            ) : (
              <Box
                sx={{
                  mb: 5,
                  position: 'relative',
                  pl: message.type === 'user' ? 2 : 0
                }}
              >
                {/* Command prefix */}
                <Typography
                  component="span"
                  sx={{
                    fontSize: '0.8rem',
                    fontFamily: 'inherit',
                    color: message.type === 'user' ? '#3b82f6' : '#f59e0b',
                    letterSpacing: '0.02em',
                    fontWeight: 500,
                    opacity: 0.8
                  }}
                >
                  {message.type === 'user' ? '$ ' : '→ '}
                </Typography>
                
                {/* Message content */}
                <Typography
                  component="span"
                  sx={{
                    fontSize: '0.85rem',
                    fontFamily: 'inherit',
                    color: '#18181b',
                    letterSpacing: '0.01em',
                    fontWeight: 400,
                    lineHeight: 1.6
                  }}
                >
                  {message.content}
                </Typography>
              </Box>
            )}
          </motion.div>
        ))}
      </Box>

      {/* Floating Command Palette */}
      <motion.div
        initial={{ opacity: 0, y: 10, filter: 'blur(8px)' }}
        animate={{ 
          opacity: isCommandMode ? 1 : 0,
          y: isCommandMode ? 0 : 10,
          filter: isCommandMode ? 'blur(0px)' : 'blur(8px)'
        }}
        transition={{ 
          duration: 0.3,
          ease: [0.16, 1, 0.3, 1]
        }}
        style={{
          position: 'absolute',
          bottom: 100,
          left: 24,
          right: 24,
          pointerEvents: isCommandMode ? 'auto' : 'none',
          zIndex: 20
        }}
      >
        <Box
          sx={{
            bgcolor: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(20px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '12px',
            p: 1.5,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
            fontFamily: '"JetBrains Mono", monospace'
          }}
        >
          {[
            { cmd: 'trends', desc: 'Show data trends' },
            { cmd: 'compare', desc: 'Compare segments' },
            { cmd: 'insights', desc: 'Generate insights' },
            { cmd: 'export', desc: 'Export results' }
          ].map((item, index) => (
            <motion.div
              key={item.cmd}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05, duration: 0.2 }}
            >
              <Box
                onClick={() => setChatMessage(`/${item.cmd} `)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  px: 1,
                  py: 0.75,
                  mb: index < 3 ? 0.5 : 0,
                  cursor: 'pointer',
                  borderRadius: '6px',
                  '&:hover': {
                    bgcolor: 'rgba(0, 0, 0, 0.05)'
                  },
                  transition: 'background-color 0.15s ease'
                }}
              >
                <Typography
                  sx={{
                    fontSize: '0.75rem',
                    fontFamily: 'inherit',
                    color: '#3b82f6',
                    fontWeight: 600,
                    minWidth: '4rem'
                  }}
                >
                  /{item.cmd}
                </Typography>
                <Typography
                  sx={{
                    fontSize: '0.7rem',
                    color: '#71717a',
                    fontWeight: 400
                  }}
                >
                  {item.desc}
                </Typography>
              </Box>
            </motion.div>
          ))}
        </Box>
      </motion.div>

      {/* Terminal Input */}
      <Box
        sx={{
          position: 'relative',
          px: 3,
          pb: 4,
          pt: 2
        }}
      >
        {/* Input prompt */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 1,
            fontFamily: '"JetBrains Mono", "Fira Code", monospace',
            position: 'relative'
          }}
        >
          {/* Terminal prompt */}
          <Typography
            sx={{
              fontSize: '0.85rem',
              color: '#3b82f6',
              fontWeight: 500,
              fontFamily: 'inherit',
              mt: 0.125,
              opacity: 0.8,
              letterSpacing: '0.02em'
            }}
          >
            $
          </Typography>
          
          {/* Invisible input field */}
          <TextField
            fullWidth
            multiline
            maxRows={8}
            placeholder="ask anything or type / for commands"
            value={chatMessage}
            onChange={handleInputChange}
            variant="standard"
            InputProps={{
              disableUnderline: true,
              sx: {
                '&::before': { display: 'none' },
                '&::after': { display: 'none' }
              }
            }}
            sx={{
              '& .MuiInputBase-root': {
                fontSize: '0.85rem',
                fontFamily: 'inherit',
                lineHeight: 1.6,
                color: '#18181b',
                fontWeight: 400,
                '& .MuiInputBase-input': {
                  padding: 0,
                  '&::placeholder': {
                    color: '#a1a1aa',
                    opacity: 0.6,
                    fontStyle: 'italic'
                  }
                }
              }
            }}
          />
        </Box>
        
        {/* Glowing cursor effect */}
        <motion.div
          animate={{
            opacity: [0.5, 1, 0.5],
            scale: [0.8, 1, 0.8]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{
            position: 'absolute',
            right: 24,
            bottom: 20,
            width: 2,
            height: 14,
            backgroundColor: '#3b82f6',
            borderRadius: 1,
            display: chatMessage.trim() ? 'none' : 'block'
          }}
        />
        
        {/* Send on Enter hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: chatMessage.trim() ? 0.5 : 0 }}
          transition={{ duration: 0.2 }}
          style={{
            position: 'absolute',
            right: 24,
            bottom: 12,
            fontSize: '0.65rem',
            color: '#a1a1aa',
            fontFamily: '"JetBrains Mono", monospace',
            letterSpacing: '0.02em'
          }}
        >
          ⏎ to send
        </motion.div>
        
        {/* Subtle glow effect when typing */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ 
            opacity: chatMessage.trim() ? 0.1 : 0,
            scale: chatMessage.trim() ? 1 : 0.8
          }}
          transition={{ duration: 0.3 }}
          style={{
            position: 'absolute',
            inset: 8,
            background: 'radial-gradient(ellipse at center, rgba(59, 130, 246, 0.1) 0%, transparent 70%)',
            borderRadius: 12,
            pointerEvents: 'none'
          }}
        />
      </Box>
    </Box>
  );
}