import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box,
  Typography,
  IconButton,
  TextField,
  Avatar,
  Chip
} from '@mui/material';
import {
  Send,
  SmartToy,
  AutoAwesome,
  TrendingUp,
  Analytics,
  FilterList,
  Download,
  Circle
} from '@mui/icons-material';

export default function ChatPanel() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async () => {
    if (!message.trim()) return;
    
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: message.trim(),
      timestamp: new Date()
    };
    
    setHasStarted(true);
    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    setIsTyping(true);
    
    setTimeout(() => {
      const responses = [
        '📊 データを分析中...\n\n主要な洞察:\n• 回答率: 87% (前月比 +3%)\n• 満足度が向上傾向\n• モバイル利用が増加\n\n詳細な分析を表示しますか？',
        '🔍 パターン分析完了\n\n発見した傾向:\n• 週末の回答率が高い\n• 年齢層による回答差\n• 地域別の特徴あり\n\nビジュアル化しますか？',
        '⚡ リアルタイム分析結果\n\n重要なメトリクス:\n• エンゲージメント率: 92%\n• 完了率: 78%\n• 平均回答時間: 3.2分\n\nレポート生成しますか？'
      ];
      
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        type: 'assistant',
        content: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date()
      }]);
      setIsTyping(false);
    }, 1200);
  };

  const quickActions = [
    { icon: <TrendingUp />, text: 'トレンド分析', action: 'データのトレンドを分析して' },
    { icon: <Analytics />, text: '比較分析', action: 'セグメント別に比較して' },
    { icon: <FilterList />, text: 'フィルター', action: 'おすすめのフィルターを教えて' },
    { icon: <Download />, text: 'エクスポート', action: 'データをエクスポートしたい' }
  ];

  if (!hasStarted) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      >
        <Box
          sx={{
            width: 340,
            height: '100%',
            ml: 1,
            display: 'flex',
            flexDirection: 'column',
            background: 'linear-gradient(145deg, rgba(248,250,252,0.8) 0%, rgba(241,245,249,0.9) 50%, rgba(226,232,240,0.8) 100%)',
            borderRadius: 2,
            border: '1px solid rgba(148,163,184,0.2)',
            backdropFilter: 'blur(20px)',
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          {/* ヘッダー */}
          <Box sx={{ p: 2, pb: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              <motion.div
                animate={{ 
                  boxShadow: ['0 0 0 0 rgba(99,102,241,0.3)', '0 0 0 6px rgba(99,102,241,0)', '0 0 0 0 rgba(99,102,241,0.3)']
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Avatar
                  sx={{
                    width: 28,
                    height: 28,
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    boxShadow: '0 4px 12px rgba(99,102,241,0.3)'
                  }}
                >
                  <SmartToy sx={{ fontSize: 16 }} />
                </Avatar>
              </motion.div>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>
                  AI Analytics
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Circle sx={{ fontSize: 6, color: '#10b981' }} />
                  <Typography variant="caption" sx={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 500 }}>
                    オンライン
                  </Typography>
                </Box>
              </Box>
            </Box>
            <Typography sx={{ fontSize: '0.8rem', color: '#475569', lineHeight: 1.4 }}>
              データの洞察とトレンド分析をサポートします
            </Typography>
          </Box>

          {/* クイックアクション */}
          <Box sx={{ px: 2, pb: 2 }}>
            <Typography variant="subtitle2" sx={{ 
              fontSize: '0.7rem', 
              fontWeight: 600, 
              color: '#64748b', 
              mb: 1.5, 
              textTransform: 'uppercase',
              letterSpacing: 0.5
            }}>
              よく使う機能
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.75 }}>
              {quickActions.map((action, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Box
                    onClick={() => setMessage(action.action)}
                    sx={{
                      p: 1.25,
                      background: 'rgba(255,255,255,0.8)',
                      border: '1px solid rgba(148,163,184,0.2)',
                      borderRadius: 1.5,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      backdropFilter: 'blur(10px)',
                      '&:hover': {
                        background: 'rgba(255,255,255,0.95)',
                        borderColor: 'rgba(99,102,241,0.3)',
                        transform: 'translateY(-1px)',
                        boxShadow: '0 4px 12px rgba(99,102,241,0.15)'
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ color: '#6366f1', '& svg': { fontSize: 14 } }}>
                        {action.icon}
                      </Box>
                      <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#334155' }}>
                        {action.text}
                      </Typography>
                    </Box>
                  </Box>
                </motion.div>
              ))}
            </Box>
          </Box>

          {/* 入力エリア */}
          <Box sx={{ p: 2, mt: 'auto' }}>
            <Box
              sx={{
                background: 'rgba(255,255,255,0.9)',
                border: '1px solid rgba(148,163,184,0.2)',
                borderRadius: 2,
                p: 1.25,
                backdropFilter: 'blur(10px)',
                transition: 'all 0.2s ease',
                '&:focus-within': {
                  borderColor: '#6366f1',
                  boxShadow: '0 0 0 2px rgba(99,102,241,0.1)'
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
                <TextField
                  fullWidth
                  multiline
                  maxRows={3}
                  placeholder="データについて質問してください..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                  variant="standard"
                  InputProps={{ disableUnderline: true }}
                  sx={{
                    '& .MuiInputBase-input': {
                      fontSize: '0.8rem',
                      color: '#1e293b',
                      '&::placeholder': {
                        color: '#94a3b8',
                        opacity: 1
                      }
                    }
                  }}
                />
                <IconButton
                  onClick={handleSend}
                  disabled={!message.trim()}
                  sx={{
                    width: 28,
                    height: 28,
                    background: message.trim() 
                      ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
                      : 'rgba(148,163,184,0.2)',
                    color: message.trim() ? 'white' : '#94a3b8',
                    '&:hover': {
                      background: message.trim()
                        ? 'linear-gradient(135deg, #5046e5 0%, #7c3aed 100%)'
                        : 'rgba(148,163,184,0.3)',
                      transform: message.trim() ? 'scale(1.05)' : 'none'
                    },
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Send sx={{ fontSize: 12 }} />
                </IconButton>
              </Box>
            </Box>
          </Box>

          {/* 装飾要素 */}
          <Box
            sx={{
              position: 'absolute',
              top: -20,
              right: -20,
              width: 60,
              height: 60,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)',
              pointerEvents: 'none'
            }}
          />
        </Box>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
    >
      <Box
        sx={{
          width: 340,
          height: '100%',
          ml: 1,
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(145deg, rgba(248,250,252,0.8) 0%, rgba(241,245,249,0.9) 50%, rgba(226,232,240,0.8) 100%)',
          borderRadius: 2,
          border: '1px solid rgba(148,163,184,0.2)',
          backdropFilter: 'blur(20px)',
          overflow: 'hidden'
        }}
      >
        {/* ヘッダー */}
        <Box sx={{ 
          p: 1.5, 
          borderBottom: '1px solid rgba(148,163,184,0.15)',
          background: 'rgba(255,255,255,0.5)',
          backdropFilter: 'blur(10px)'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <Avatar
              sx={{
                width: 24,
                height: 24,
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                boxShadow: '0 2px 8px rgba(99,102,241,0.3)'
              }}
            >
              <SmartToy sx={{ fontSize: 14 }} />
            </Avatar>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f172a' }}>
                AI Assistant
              </Typography>
              <Typography variant="caption" sx={{ fontSize: '0.65rem', color: '#64748b' }}>
                {isTyping ? '入力中...' : 'オンライン'}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* メッセージエリア */}
        <Box
          sx={{
            flex: 1,
            p: 1.5,
            overflowY: 'auto',
            '&::-webkit-scrollbar': { width: 2 },
            '&::-webkit-scrollbar-thumb': {
              background: 'rgba(148,163,184,0.3)',
              borderRadius: 1
            }
          }}
        >
          <AnimatePresence>
            {messages.map((msg, index) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.03 }}
              >
                <Box
                  sx={{
                    mb: 1.5,
                    display: 'flex',
                    justifyContent: msg.type === 'user' ? 'flex-end' : 'flex-start',
                    alignItems: 'flex-end',
                    gap: 0.5
                  }}
                >
                  {msg.type === 'assistant' && (
                    <Avatar
                      sx={{
                        width: 18,
                        height: 18,
                        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                        mb: 0.25
                      }}
                    >
                      <AutoAwesome sx={{ fontSize: 8 }} />
                    </Avatar>
                  )}
                  <Box
                    sx={{
                      maxWidth: '85%',
                      px: 1.5,
                      py: 1,
                      borderRadius: msg.type === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      background: msg.type === 'user'
                        ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
                        : 'rgba(255,255,255,0.9)',
                      color: msg.type === 'user' ? 'white' : '#334155',
                      border: msg.type === 'assistant' ? '1px solid rgba(148,163,184,0.2)' : 'none',
                      boxShadow: msg.type === 'user'
                        ? '0 2px 8px rgba(99,102,241,0.3)'
                        : '0 1px 4px rgba(0,0,0,0.05)',
                      backdropFilter: msg.type === 'assistant' ? 'blur(10px)' : 'none'
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: '0.8rem',
                        lineHeight: 1.4,
                        fontWeight: msg.type === 'user' ? 500 : 400,
                        whiteSpace: 'pre-line'
                      }}
                    >
                      {msg.content}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        display: 'block',
                        mt: 0.25,
                        fontSize: '0.6rem',
                        color: msg.type === 'user' ? 'rgba(255,255,255,0.7)' : '#94a3b8',
                        textAlign: 'right'
                      }}
                    >
                      {msg.timestamp.toLocaleTimeString('ja-JP', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Typography>
                  </Box>
                </Box>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* タイピング中 */}
          <AnimatePresence>
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
              >
                <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 0.5, mb: 1.5 }}>
                  <Avatar
                    sx={{
                      width: 18,
                      height: 18,
                      background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
                    }}
                  >
                    <AutoAwesome sx={{ fontSize: 8 }} />
                  </Avatar>
                  <Box
                    sx={{
                      px: 1.5,
                      py: 1,
                      borderRadius: '16px 16px 16px 4px',
                      background: 'rgba(255,255,255,0.9)',
                      border: '1px solid rgba(148,163,184,0.2)',
                      backdropFilter: 'blur(10px)'
                    }}
                  >
                    <motion.div
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <Typography sx={{ fontSize: '0.8rem', color: '#64748b' }}>
                        分析中...
                      </Typography>
                    </motion.div>
                  </Box>
                </Box>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={messagesEndRef} />
        </Box>

        {/* 提案チップ */}
        {messages.length > 0 && (
          <Box sx={{ px: 1.5, pb: 1 }}>
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              {['詳細分析', '比較', 'エクスポート'].map((suggestion) => (
                <Chip
                  key={suggestion}
                  label={suggestion}
                  size="small"
                  onClick={() => setMessage(`${suggestion}をお願いします`)}
                  sx={{
                    fontSize: '0.65rem',
                    height: 20,
                    background: 'rgba(255,255,255,0.7)',
                    border: '1px solid rgba(148,163,184,0.2)',
                    backdropFilter: 'blur(10px)',
                    '&:hover': {
                      background: 'rgba(99,102,241,0.05)',
                      borderColor: 'rgba(99,102,241,0.3)',
                      transform: 'translateY(-1px)'
                    }
                  }}
                />
              ))}
            </Box>
          </Box>
        )}

        {/* 入力エリア */}
        <Box sx={{ p: 1.5, pt: 1 }}>
          <Box
            sx={{
              background: 'rgba(255,255,255,0.9)',
              border: '1px solid rgba(148,163,184,0.2)',
              borderRadius: 2,
              p: 1.25,
              backdropFilter: 'blur(10px)',
              transition: 'all 0.2s ease',
              '&:focus-within': {
                borderColor: '#6366f1',
                boxShadow: '0 0 0 2px rgba(99,102,241,0.1)'
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
              <TextField
                fullWidth
                multiline
                maxRows={3}
                placeholder="メッセージを入力..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                variant="standard"
                InputProps={{ disableUnderline: true }}
                sx={{
                  '& .MuiInputBase-input': {
                    fontSize: '0.8rem',
                    color: '#1e293b',
                    '&::placeholder': {
                      color: '#94a3b8',
                      opacity: 1
                    }
                  }
                }}
              />
              <IconButton
                onClick={handleSend}
                disabled={!message.trim() || isTyping}
                sx={{
                  width: 28,
                  height: 28,
                  background: message.trim() && !isTyping
                    ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
                    : 'rgba(148,163,184,0.2)',
                  color: message.trim() && !isTyping ? 'white' : '#94a3b8',
                  '&:hover': {
                    background: message.trim() && !isTyping
                      ? 'linear-gradient(135deg, #5046e5 0%, #7c3aed 100%)'
                      : 'rgba(148,163,184,0.3)',
                    transform: message.trim() && !isTyping ? 'scale(1.05)' : 'none'
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                <Send sx={{ fontSize: 12 }} />
              </IconButton>
            </Box>
          </Box>
        </Box>
      </Box>
    </motion.div>
  );
}