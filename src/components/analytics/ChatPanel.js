import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Stack,
  Chip,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Send,
  AutoAwesome,
  SmartToy,
  Person,
  HelpOutline,
  BarChart,
  Analytics
} from '@mui/icons-material';

export default function ChatPanel() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      content: 'データ分析をお手伝いします',
      timestamp: new Date(Date.now() - 60000)
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isDataMode, setIsDataMode] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // AIの応答をシミュレート
    setTimeout(() => {
      const aiResponse = {
        id: Date.now() + 1,
        type: 'ai',
        content: generateAIResponse(inputValue),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500 + Math.random() * 1000);
  };

  const generateAIResponse = (question) => {
    const responses = [
      `分析結果: ${question}について重要なパターンを発見しました。`,
      `データ処理完了。${question}に関する洞察をまとめました。`,
      `${question}の分析が完了。次のアクションを提案します。`
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };



  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      style={{ width: 360, height: '100%', marginLeft: 8 }}
    >
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 50%, #fce7f3 100%)',
          borderRadius: 2,
          overflow: 'hidden',
          border: '1px solid rgba(99, 102, 241, 0.1)',
          boxShadow: '0 4px 20px rgba(99, 102, 241, 0.08)'
        }}
      >
        {/* Header */}
        <Box sx={{ 
          p: 1.5,
          borderBottom: '1px solid rgba(99, 102, 241, 0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(250,245,255,0.95) 100%)',
          backdropFilter: 'blur(10px)'
        }}>
          <Box sx={{ 
            width: 8, 
            height: 8, 
            borderRadius: '50%', 
            bgcolor: '#6366f1',
            animation: 'pulse 2s ease-in-out infinite',
            '@keyframes pulse': {
              '0%, 100%': { opacity: 1 },
              '50%': { opacity: 0.4 }
            }
          }} />
          <Typography sx={{ 
            color: '#1e293b', 
            fontSize: '0.9rem', 
            fontWeight: 600,
            flex: 1
          }}>
            AI Assistant
          </Typography>
        </Box>

        {/* Messages */}
        <Box
          sx={{
            flexGrow: 1,
            overflowY: 'auto',
            p: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 0.5,
            '&::-webkit-scrollbar': { width: 2 },
            '&::-webkit-scrollbar-track': { bgcolor: 'rgba(99, 102, 241, 0.05)' },
            '&::-webkit-scrollbar-thumb': { 
              bgcolor: 'rgba(99, 102, 241, 0.3)', 
              borderRadius: 1,
              '&:hover': { bgcolor: 'rgba(99, 102, 241, 0.5)' }
            }
          }}
        >
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    gap: 0.75,
                    alignItems: 'flex-start',
                    flexDirection: message.type === 'user' ? 'row-reverse' : 'row'
                  }}
                >
                  {message.type === 'ai' && (
                    <Box
                      sx={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        bgcolor: '#6366f1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        mt: 0.25,
                        boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)'
                      }}
                    >
                      <SmartToy sx={{ fontSize: 12, color: '#fff' }} />
                    </Box>
                  )}
                  <Box
                    sx={{
                      maxWidth: '80%',
                      px: 1.25,
                      py: 0.75,
                      borderRadius: 1.5,
                      bgcolor: message.type === 'ai' 
                        ? 'rgba(255, 255, 255, 0.8)' 
                        : '#6366f1',
                      border: message.type === 'ai' 
                        ? '1px solid rgba(99, 102, 241, 0.15)' 
                        : 'none',
                      boxShadow: message.type === 'ai' 
                        ? '0 2px 8px rgba(99, 102, 241, 0.08)' 
                        : '0 2px 8px rgba(99, 102, 241, 0.3)',
                      backdropFilter: message.type === 'ai' ? 'blur(10px)' : 'none',
                      ml: message.type === 'user' ? 'auto' : 0,
                      mr: message.type === 'ai' ? 'auto' : 0
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: '0.8rem',
                        lineHeight: 1.4,
                        color: message.type === 'ai' ? '#1e293b' : '#fff',
                        whiteSpace: 'pre-wrap'
                      }}
                    >
                      {message.content}
                    </Typography>
                  </Box>
                </Box>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing Indicator */}
          <AnimatePresence>
            {isTyping && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'flex-start' }}>
                  <Box
                    sx={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      bgcolor: '#6366f1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mt: 0.25,
                      boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)'
                    }}
                  >
                    <SmartToy sx={{ fontSize: 12, color: '#fff' }} />
                  </Box>
                  <Box
                    sx={{
                      px: 1.25,
                      py: 0.75,
                      borderRadius: 1.5,
                      bgcolor: 'rgba(255, 255, 255, 0.8)',
                      border: '1px solid rgba(99, 102, 241, 0.15)',
                      boxShadow: '0 2px 8px rgba(99, 102, 241, 0.08)',
                      backdropFilter: 'blur(10px)'
                    }}
                  >
                    <Stack direction="row" spacing={0.25} alignItems="center">
                      {[0, 0.2, 0.4].map((delay, index) => (
                        <Box
                          key={index}
                          sx={{
                            width: 4,
                            height: 4,
                            borderRadius: '50%',
                            bgcolor: '#6366f1',
                            animation: 'typing 1.4s ease-in-out infinite',
                            animationDelay: `${delay}s`,
                            '@keyframes typing': {
                              '0%, 60%, 100%': { opacity: 0.3 },
                              '30%': { opacity: 1 }
                            }
                          }}
                        />
                      ))}
                    </Stack>
                  </Box>
                </Box>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </Box>

        {/* Data Analysis Actions */}
        <Box sx={{ 
          px: 1, 
          py: 0.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start'
        }}>
          <Box
            onClick={() => setIsDataMode(!isDataMode)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.75,
              px: 1.5,
              py: 0.75,
              borderRadius: 1.5,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              bgcolor: isDataMode ? 'rgba(99, 102, 241, 0.1)' : 'rgba(100, 116, 139, 0.05)',
              border: isDataMode ? '1px solid rgba(99, 102, 241, 0.2)' : '1px solid rgba(100, 116, 139, 0.1)',
              '&:hover': {
                bgcolor: isDataMode ? 'rgba(99, 102, 241, 0.15)' : 'rgba(100, 116, 139, 0.1)',
                transform: 'translateY(-1px)',
                boxShadow: isDataMode ? '0 2px 8px rgba(99, 102, 241, 0.15)' : '0 2px 8px rgba(100, 116, 139, 0.1)'
              }
            }}
          >
            <BarChart sx={{ 
              fontSize: 14, 
              color: isDataMode ? '#6366f1' : '#64748b'
            }} />
            <Typography sx={{ 
              fontSize: '0.75rem', 
              fontWeight: isDataMode ? 600 : 500,
              color: isDataMode ? '#6366f1' : '#64748b',
              userSelect: 'none'
            }}>
              データ質問
            </Typography>
          </Box>
        </Box>

        {/* Input Area */}
        <Box sx={{ 
          p: 1,
          background: 'transparent'
        }}>
          <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'flex-end' }}>
            <TextField
              fullWidth
              multiline
              maxRows={2}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={isDataMode ? "選択中のデータについて質問..." : "AIに質問を入力..."}
              variant="outlined"
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1.5,
                  bgcolor: 'rgba(255, 255, 255, 0.9)',
                  color: '#1e293b',
                  fontSize: '0.8rem',
                  '& fieldset': {
                    borderColor: 'rgba(99, 102, 241, 0.2)'
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(99, 102, 241, 0.4)'
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#6366f1',
                    boxShadow: '0 0 0 2px rgba(99, 102, 241, 0.1)'
                  },
                  '& input::placeholder': {
                    color: '#64748b',
                    opacity: 1
                  }
                }
              }}
            />
            <IconButton
              onClick={handleSend}
              disabled={!inputValue.trim() || isTyping}
              size="small"
              sx={{
                width: 32,
                height: 32,
                bgcolor: inputValue.trim() ? '#6366f1' : 'rgba(99, 102, 241, 0.1)',
                color: inputValue.trim() ? '#fff' : '#64748b',
                borderRadius: 1.5,
                boxShadow: inputValue.trim() ? '0 2px 8px rgba(99, 102, 241, 0.3)' : 'none',
                '&:hover': {
                  bgcolor: inputValue.trim() ? '#5046e5' : 'rgba(99, 102, 241, 0.2)',
                  transform: 'translateY(-1px)'
                },
                '&.Mui-disabled': {
                  bgcolor: 'rgba(99, 102, 241, 0.05)',
                  color: '#94a3b8'
                }
              }}
            >
              <Send sx={{ fontSize: 16 }} />
            </IconButton>
          </Box>
        </Box>
      </Box>
    </motion.div>
  );
}