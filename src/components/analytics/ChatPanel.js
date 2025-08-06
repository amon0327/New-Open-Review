import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Avatar,
  Paper,
  Stack,
  Fab
} from '@mui/material';
import {
  Send,
  AutoAwesome,
  Insights,
  Timeline,
  Psychology,
  Clear,
  Minimize
} from '@mui/icons-material';

const quickPrompts = [
  { icon: <Timeline />, text: "データトレンドを分析", gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" },
  { icon: <Insights />, text: "異常値を検出", gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)" },
  { icon: <Psychology />, text: "予測分析を実行", gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)" }
];

export default function ChatPanel() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      content: 'こんにちは！私はあなたの分析パートナーです。データから洞察を見つけるお手伝いをします。',
      timestamp: new Date(Date.now() - 60000)
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
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
      `分析を実行しました。データパターンから興味深い洞察が得られています。具体的にどの部分を深掘りしますか？`,
      `データを調査した結果、いくつかの重要な傾向を発見しました。詳細な分析結果をお見せできます。`,
      `優れた質問ですね。現在のデータセットから改善の機会を特定しました。次のステップについて相談しましょう。`,
      `分析完了です。重要な指標とアクションアイテムを整理しました。どの観点から確認していきますか？`
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleQuickPrompt = (prompt) => {
    setInputValue(prompt);
  };

  const formatTime = (timestamp) => {
    return timestamp.toLocaleTimeString('ja-JP', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!isExpanded) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Fab
          onClick={() => setIsExpanded(true)}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            width: 64,
            height: 64,
            '&:hover': {
              background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
              transform: 'scale(1.1)'
            }
          }}
        >
          <AutoAwesome sx={{ fontSize: 28 }} />
        </Fab>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
    >
      <Paper
        elevation={0}
        sx={{
          width: 420,
          height: '100%',
          ml: 2,
          display: 'flex',
          flexDirection: 'column',
          bgcolor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(0, 0, 0, 0.08)',
          borderRadius: 4,
          overflow: 'hidden',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }}
      >
        {/* Header */}
        <Box
          sx={{
            p: 4,
            borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 2,
              background: 'linear-gradient(90deg, #667eea, #764ba2, #f093fb, #f5576c, #4facfe, #00f2fe)'
            }}
          />
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)',
                    borderRadius: 'inherit'
                  }
                }}
              >
                <AutoAwesome sx={{ color: 'white', fontSize: 24, position: 'relative' }} />
              </Box>
              <Box>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    fontSize: '1.25rem',
                    color: '#0f172a',
                    mb: 0.5
                  }}
                >
                  AI アシスタント
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: '#64748b',
                    fontSize: '0.875rem'
                  }}
                >
                  データ分析をサポート
                </Typography>
              </Box>
            </Box>
            <IconButton
              onClick={() => setIsExpanded(false)}
              sx={{
                bgcolor: 'rgba(0, 0, 0, 0.04)',
                width: 36,
                height: 36,
                '&:hover': {
                  bgcolor: 'rgba(0, 0, 0, 0.08)'
                }
              }}
            >
              <Minimize sx={{ fontSize: 18, color: '#64748b' }} />
            </IconButton>
          </Box>
        </Box>

        {/* Quick Prompts */}
        <Box sx={{ p: 3, borderBottom: '1px solid rgba(0, 0, 0, 0.06)' }}>
          <Stack spacing={1.5}>
            {quickPrompts.map((prompt, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Paper
                  elevation={0}
                  onClick={() => handleQuickPrompt(prompt.text)}
                  sx={{
                    p: 2.5,
                    background: prompt.gradient,
                    borderRadius: 3,
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)'
                    },
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)',
                      borderRadius: 'inherit'
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, position: 'relative' }}>
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: 2,
                        bgcolor: 'rgba(255, 255, 255, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {React.cloneElement(prompt.icon, { sx: { color: 'white', fontSize: 18 } })}
                    </Box>
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'white',
                        fontWeight: 600,
                        fontSize: '0.9rem'
                      }}
                    >
                      {prompt.text}
                    </Typography>
                  </Box>
                </Paper>
              </motion.div>
            ))}
          </Stack>
        </Box>

        {/* Messages */}
        <Box
          sx={{
            flexGrow: 1,
            overflowY: 'auto',
            p: 3,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            '&::-webkit-scrollbar': {
              width: 6
            },
            '&::-webkit-scrollbar-track': {
              bgcolor: 'rgba(0, 0, 0, 0.04)',
              borderRadius: 3
            },
            '&::-webkit-scrollbar-thumb': {
              bgcolor: 'rgba(0, 0, 0, 0.12)',
              borderRadius: 3,
              '&:hover': {
                bgcolor: 'rgba(0, 0, 0, 0.2)'
              }
            }
          }}
        >
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    gap: 2,
                    alignItems: 'flex-start',
                    flexDirection: message.type === 'user' ? 'row-reverse' : 'row'
                  }}
                >
                  <Avatar
                    sx={{
                      width: 36,
                      height: 36,
                      ...(message.type === 'ai' ? {
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                      } : {
                        bgcolor: '#0f172a'
                      })
                    }}
                  >
                    {message.type === 'ai' ? (
                      <AutoAwesome sx={{ fontSize: 18 }} />
                    ) : (
                      <Box
                        sx={{
                          width: 18,
                          height: 18,
                          borderRadius: '50%',
                          bgcolor: 'white'
                        }}
                      />
                    )}
                  </Avatar>
                  <Paper
                    elevation={0}
                    sx={{
                      maxWidth: '80%',
                      p: 2.5,
                      borderRadius: message.type === 'user' ? '20px 20px 6px 20px' : '20px 20px 20px 6px',
                      ...(message.type === 'ai' ? {
                        bgcolor: '#f8fafc',
                        border: '1px solid rgba(0, 0, 0, 0.08)',
                        color: '#0f172a'
                      } : {
                        bgcolor: '#0f172a',
                        color: 'white'
                      })
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: '0.9rem',
                        lineHeight: 1.6,
                        whiteSpace: 'pre-wrap'
                      }}
                    >
                      {message.content}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        display: 'block',
                        mt: 1,
                        opacity: 0.7,
                        fontSize: '0.75rem',
                        textAlign: message.type === 'user' ? 'right' : 'left'
                      }}
                    >
                      {formatTime(message.timestamp)}
                    </Typography>
                  </Paper>
                </Box>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing Indicator */}
          <AnimatePresence>
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                  <Avatar
                    sx={{
                      width: 36,
                      height: 36,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    }}
                  >
                    <AutoAwesome sx={{ fontSize: 18 }} />
                  </Avatar>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.5,
                      borderRadius: '20px 20px 20px 6px',
                      bgcolor: '#f8fafc',
                      border: '1px solid rgba(0, 0, 0, 0.08)'
                    }}
                  >
                    <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center' }}>
                      {[0, 0.2, 0.4].map((delay, index) => (
                        <Box
                          key={index}
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            bgcolor: '#94a3b8',
                            animation: 'typing 1.4s ease-in-out infinite',
                            animationDelay: `${delay}s`,
                            '@keyframes typing': {
                              '0%, 60%, 100%': { opacity: 0.3, transform: 'scale(1)' },
                              '30%': { opacity: 1, transform: 'scale(1.2)' }
                            }
                          }}
                        />
                      ))}
                    </Box>
                  </Paper>
                </Box>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </Box>

        {/* Input Area */}
        <Box
          sx={{
            p: 3,
            borderTop: '1px solid rgba(0, 0, 0, 0.06)',
            background: 'rgba(248, 250, 252, 0.8)'
          }}
        >
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
            <TextField
              fullWidth
              multiline
              maxRows={3}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="メッセージを入力..."
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                  bgcolor: 'white',
                  fontSize: '0.9rem',
                  '& fieldset': {
                    borderColor: 'rgba(0, 0, 0, 0.12)'
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(0, 0, 0, 0.2)'
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#667eea',
                    borderWidth: 2
                  }
                }
              }}
            />
            <IconButton
              onClick={handleSend}
              disabled={!inputValue.trim() || isTyping}
              sx={{
                width: 48,
                height: 48,
                bgcolor: inputValue.trim() ? '#667eea' : 'rgba(0, 0, 0, 0.08)',
                color: inputValue.trim() ? 'white' : 'rgba(0, 0, 0, 0.4)',
                borderRadius: 3,
                '&:hover': {
                  bgcolor: inputValue.trim() ? '#5a67d8' : 'rgba(0, 0, 0, 0.12)',
                  transform: 'translateY(-1px)'
                },
                '&.Mui-disabled': {
                  bgcolor: 'rgba(0, 0, 0, 0.04)',
                  color: 'rgba(0, 0, 0, 0.2)'
                }
              }}
            >
              <Send sx={{ fontSize: 20 }} />
            </IconButton>
          </Box>
        </Box>
      </Paper>
    </motion.div>
  );
}