import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box,
  Typography,
  IconButton,
  TextField,
  Chip,
  Avatar,
  Paper,
  Tooltip,
  Divider,
  Badge
} from '@mui/material';
import {
  Send,
  AutoAwesome,
  Psychology,
  SmartToy,
  TrendingUp,
  Analytics,
  FilterList,
  GetApp,
  ExpandMore,
  ExpandLess,
  Circle,
  FiberManualRecord
} from '@mui/icons-material';

export default function ChatPanel() {
  const [chatMessage, setChatMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasStartedChat, setHasStartedChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef(null);
  const textFieldRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [chatMessages]);

  const handleInputChange = (e) => {
    setChatMessage(e.target.value);
  };

  const handleSendMessage = async () => {
    if (!chatMessage.trim()) return;
    
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: chatMessage.trim(),
      timestamp: new Date()
    };
    
    setHasStartedChat(true);
    setChatMessages(prev => [...prev, userMessage]);
    setChatMessage('');
    setIsTyping(true);
    setShowSuggestions(false);
    
    // AI応答シミュレーション
    setTimeout(() => {
      const responses = [
        'データを分析しています...\n\n📊 選択された質問から以下のトレンドが見つかりました：\n• 回答率: 85% (前月比 +5%)\n• 最も多い回答: 「満足」 (42%)\n• 地域別で差異あり',
        '分析結果をお見せします。\n\n🔍 主要な洞察：\n• ユーザー満足度が向上傾向\n• モバイルからの回答が増加\n• 年齢層による回答パターンに違い\n\n詳細な比較グラフを生成しますか？',
        '興味深いパターンを発見しました。\n\n📈 データの特徴：\n• 週末の回答率が平日より20%高い\n• 特定の質問で回答の偏りあり\n• 時系列での変化が顕著\n\nさらに詳しく分析しますか？'
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      setChatMessages(prev => [...prev, {
        id: Date.now() + 1,
        type: 'assistant',
        content: randomResponse,
        timestamp: new Date()
      }]);
      setIsTyping(false);
    }, 1500);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickSuggestions = [
    { icon: <TrendingUp />, text: 'トレンド分析', query: 'この質問のトレンドを分析して' },
    { icon: <Analytics />, text: '比較分析', query: 'セグメント別に比較して' },
    { icon: <FilterList />, text: 'フィルタ提案', query: 'おすすめのフィルターを教えて' },
    { icon: <GetApp />, text: 'データ出力', query: 'このデータを出力したい' }
  ];

  const handleSuggestionClick = (query) => {
    setChatMessage(query);
    textFieldRef.current?.focus();
  };

  // チャットが開始されていない場合の初期画面
  if (!hasStartedChat) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <Paper
          elevation={0}
          sx={{
            width: 360,
            height: '100%',
            ml: 1,
            display: 'flex',
            flexDirection: 'column',
            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 30%, #e2e8f0 100%)',
            borderRadius: 2.5,
            border: '1px solid rgba(226, 232, 240, 0.6)',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 2px 20px rgba(148, 163, 184, 0.15)',
            backdropFilter: 'blur(10px)'
          }}
        >
          {/* ヘーダー */}
          <Box sx={{ p: 2.5, pb: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
              <motion.div
                animate={{ 
                  boxShadow: ['0 0 0 0 rgba(99, 102, 241, 0.4)', '0 0 0 8px rgba(99, 102, 241, 0)', '0 0 0 0 rgba(99, 102, 241, 0.4)'],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    color: 'white',
                    boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)'
                  }}
                >
                  <SmartToy sx={{ fontSize: 18 }} />
                </Avatar>
              </motion.div>
              <Box>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 700,
                    color: '#1e293b',
                    fontSize: '1rem'
                  }}
                >
                  AI Analytics Assistant
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <FiberManualRecord sx={{ fontSize: 8, color: '#10b981' }} />
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: '#64748b',
                      fontWeight: 500,
                      fontSize: '0.75rem'
                    }}
                  >
                    オンライン・準備完了
                  </Typography>
                </Box>
              </Box>
            </Box>
            
            <Typography 
              sx={{
                color: '#475569',
                fontSize: '0.875rem',
                lineHeight: 1.5,
                mb: 2.5
              }}
            >
              データの洞察を発見し、トレンドを分析します。
              質問や分析のリクエストをお聞かせください。
            </Typography>
          </Box>

          {/* クイックアクション */}
          <Box sx={{ px: 2.5, pb: 1.5 }}>
            <Typography 
              variant="subtitle2" 
              sx={{ 
                color: '#64748b',
                fontWeight: 600,
                mb: 2,
                fontSize: '0.8rem',
                textTransform: 'uppercase',
                letterSpacing: 0.5
              }}
            >
              よく使われる分析
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
              {quickSuggestions.map((suggestion, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                >
                  <Paper
                    onClick={() => handleSuggestionClick(suggestion.query)}
                    elevation={0}
                    sx={{
                      p: 1.5,
                      cursor: 'pointer',
                      background: 'rgba(255, 255, 255, 0.85)',
                      border: '1px solid rgba(226, 232, 240, 0.8)',
                      borderRadius: 1.5,
                      transition: 'all 0.2s ease',
                      backdropFilter: 'blur(5px)',
                      '&:hover': {
                        background: 'rgba(99, 102, 241, 0.06)',
                        borderColor: '#c7d2fe',
                        boxShadow: '0 3px 10px rgba(99, 102, 241, 0.2)',
                        transform: 'translateY(-1px)'
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box 
                        sx={{ 
                          color: '#6366f1',
                          display: 'flex',
                          '& svg': { fontSize: 16 }
                        }}
                      >
                        {suggestion.icon}
                      </Box>
                      <Typography 
                        sx={{ 
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          color: '#374151'
                        }}
                      >
                        {suggestion.text}
                      </Typography>
                    </Box>
                  </Paper>
                </motion.div>
              ))}
            </Box>
          </Box>

          {/* 入力フィールド */}
          <Box sx={{ p: 2.5, pt: 1.5, mt: 'auto' }}>
            <Paper
              elevation={0}
              sx={{
                p: 1.5,
                background: 'rgba(255, 255, 255, 0.95)',
                border: '2px solid rgba(226, 232, 240, 0.8)',
                borderRadius: 2,
                transition: 'all 0.2s ease',
                backdropFilter: 'blur(10px)',
                '&:focus-within': {
                  borderColor: '#6366f1',
                  boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.15)',
                  background: '#ffffff'
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
                <TextField
                  ref={textFieldRef}
                  fullWidth
                  multiline
                  maxRows={3}
                  placeholder="データについて何か聞いてください..."
                  value={chatMessage}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  variant="standard"
                  InputProps={{ disableUnderline: true }}
                  sx={{
                    '& .MuiInputBase-input': {
                      fontSize: '0.95rem',
                      color: '#1e293b',
                      fontWeight: 400,
                      lineHeight: 1.5,
                      '&::placeholder': {
                        color: '#94a3b8',
                        opacity: 1
                      }
                    }
                  }}
                />
                <motion.div
                  animate={chatMessage.trim() ? { scale: 1, opacity: 1 } : { scale: 0.8, opacity: 0.5 }}
                  transition={{ duration: 0.15 }}
                >
                  <IconButton
                    onClick={handleSendMessage}
                    disabled={!chatMessage.trim()}
                    sx={{
                      width: 36,
                      height: 36,
                      background: chatMessage.trim() 
                        ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' 
                        : '#f1f5f9',
                      color: chatMessage.trim() ? 'white' : '#94a3b8',
                      '&:hover': {
                        background: chatMessage.trim() 
                          ? 'linear-gradient(135deg, #5046e5 0%, #7c3aed 100%)' 
                          : '#e2e8f0',
                        transform: 'scale(1.05)'
                      },
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Send sx={{ fontSize: 16 }} />
                  </IconButton>
                </motion.div>
              </Box>
            </Paper>
          </Box>

          {/* 装飾的な背景要素 */}
          <Box
            sx={{
              position: 'absolute',
              top: -30,
              right: -30,
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 70%)',
              zIndex: 0
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              bottom: -40,
              left: -40,
              width: 120,
              height: 120,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(139, 92, 246, 0.05) 0%, transparent 60%)',
              zIndex: 0
            }}
          />
        </Paper>
      </motion.div>
    );
  }

  // チャット開始後の画面
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <Paper
        elevation={0}
        sx={{
          width: 360,
          height: '100%',
          ml: 1,
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 30%, #e2e8f0 100%)',
          borderRadius: 2.5,
          border: '1px solid rgba(226, 232, 240, 0.6)',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 2px 20px rgba(148, 163, 184, 0.15)',
          backdropFilter: 'blur(10px)'
        }}
      >
        {/* ヘーダー */}
        <Box 
          sx={{ 
            p: 2,
            pb: 1.5,
            borderBottom: '1px solid rgba(241, 245, 249, 0.8)',
            background: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Badge
                badgeContent=" "
                sx={{
                  '& .MuiBadge-badge': {
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: '#10b981',
                    border: '1.5px solid white'
                  }
                }}
              >
                <Avatar
                  sx={{
                    width: 30,
                    height: 30,
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)'
                  }}
                >
                  <SmartToy sx={{ fontSize: 16 }} />
                </Avatar>
              </Badge>
              <Box>
                <Typography 
                  variant="subtitle1" 
                  sx={{ 
                    fontWeight: 700,
                    color: '#1e293b',
                    fontSize: '0.9rem'
                  }}
                >
                  AI Assistant
                </Typography>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: '#64748b',
                    fontSize: '0.7rem'
                  }}
                >
                  {isTyping ? 'タイピング中...' : 'オンライン'}
                </Typography>
              </Box>
            </Box>
            <IconButton
              onClick={() => setIsMinimized(!isMinimized)}
              size="small"
              sx={{ color: '#64748b' }}
            >
              {isMinimized ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </Box>
        </Box>

        <AnimatePresence>
          {!isMinimized && (
            <>
              {/* メッセージエリア */}
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
              >
                <Box
                  sx={{
                    flex: 1,
                    px: 2,
                    py: 1.5,
                    overflowY: 'auto',
                    '&::-webkit-scrollbar': { width: 3 },
                    '&::-webkit-scrollbar-track': { background: 'transparent' },
                    '&::-webkit-scrollbar-thumb': {
                      background: 'rgba(148, 163, 184, 0.3)',
                      borderRadius: 2
                    }
                  }}
                >
                  <AnimatePresence>
                    {chatMessages.map((message, index) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 15, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      >
                        <Box
                          sx={{
                            mb: 2,
                            display: 'flex',
                            justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start',
                            alignItems: 'flex-end',
                            gap: 0.75
                          }}
                        >
                          {message.type === 'assistant' && (
                            <Avatar
                              sx={{
                                width: 20,
                                height: 20,
                                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                                mb: 0.3
                              }}
                            >
                              <AutoAwesome sx={{ fontSize: 10 }} />
                            </Avatar>
                          )}
                          <Paper
                            elevation={0}
                            sx={{
                              maxWidth: '88%',
                              px: 1.75,
                              py: 1.25,
                              borderRadius: message.type === 'user' 
                                ? '18px 18px 4px 18px' 
                                : '18px 18px 18px 4px',
                              background: message.type === 'user' 
                                ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
                                : 'rgba(255, 255, 255, 0.95)',
                              color: message.type === 'user' ? 'white' : '#374151',
                              border: message.type === 'assistant' ? '1px solid rgba(226, 232, 240, 0.8)' : 'none',
                              boxShadow: message.type === 'user' 
                                ? '0 3px 10px rgba(99, 102, 241, 0.3)' 
                                : '0 2px 6px rgba(0, 0, 0, 0.06)',
                              backdropFilter: message.type === 'assistant' ? 'blur(8px)' : 'none'
                            }}
                          >
                            <Typography
                              sx={{
                                fontSize: '0.85rem',
                                lineHeight: 1.4,
                                fontWeight: message.type === 'user' ? 500 : 400,
                                whiteSpace: 'pre-line'
                              }}
                            >
                              {message.content}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{
                                display: 'block',
                                mt: 0.3,
                                fontSize: '0.65rem',
                                color: message.type === 'user' 
                                  ? 'rgba(255, 255, 255, 0.7)' 
                                  : '#94a3b8',
                                textAlign: 'right'
                              }}
                            >
                              {message.timestamp.toLocaleTimeString('ja-JP', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </Typography>
                          </Paper>
                        </Box>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  
                  {/* タイピングインジケーター */}
                  <AnimatePresence>
                    {isTyping && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 0.75, mb: 1.5 }}>
                          <Avatar
                            sx={{
                              width: 20,
                              height: 20,
                              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
                            }}
                          >
                            <Psychology sx={{ fontSize: 10 }} />
                          </Avatar>
                          <Paper
                            elevation={0}
                            sx={{
                              px: 1.75,
                              py: 1.25,
                              borderRadius: '18px 18px 18px 4px',
                              background: 'rgba(255, 255, 255, 0.95)',
                              border: '1px solid rgba(226, 232, 240, 0.8)',
                              backdropFilter: 'blur(8px)'
                            }}
                          >
                            <motion.div
                              animate={{ opacity: [0.5, 1, 0.5] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                            >
                              <Typography sx={{ fontSize: '0.85rem', color: '#64748b' }}>
                                分析中...
                              </Typography>
                            </motion.div>
                          </Paper>
                        </Box>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  <div ref={messagesEndRef} />
                </Box>

                {/* 入力エリア */}
                <Box sx={{ p: 2, pt: 1 }}>
                  {/* 提案チップ */}
                  <AnimatePresence>
                    {showSuggestions && chatMessages.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Box sx={{ mb: 1.5, display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                          {['詳細分析', '比較グラフ', 'エクスポート'].map((suggestion, index) => (
                            <Chip
                              key={index}
                              label={suggestion}
                              size="small"
                              variant="outlined"
                              onClick={() => handleSuggestionClick(`${suggestion}をお願いします`)}
                              sx={{
                                fontSize: '0.7rem',
                                height: 24,
                                borderColor: 'rgba(226, 232, 240, 0.8)',
                                background: 'rgba(255, 255, 255, 0.6)',
                                backdropFilter: 'blur(5px)',
                                '&:hover': {
                                  borderColor: '#6366f1',
                                  backgroundColor: 'rgba(99, 102, 241, 0.06)',
                                  transform: 'translateY(-1px)'
                                }
                              }}
                            />
                          ))}
                        </Box>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  <Paper
                    elevation={0}
                    sx={{
                      p: 1.25,
                      background: 'rgba(255, 255, 255, 0.95)',
                      border: '2px solid rgba(226, 232, 240, 0.8)',
                      borderRadius: 2,
                      transition: 'all 0.2s ease',
                      backdropFilter: 'blur(10px)',
                      '&:focus-within': {
                        borderColor: '#6366f1',
                        boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.15)',
                        background: '#ffffff'
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
                      <TextField
                        ref={textFieldRef}
                        fullWidth
                        multiline
                        maxRows={4}
                        placeholder="メッセージを入力..."
                        value={chatMessage}
                        onChange={handleInputChange}
                        onKeyPress={handleKeyPress}
                        variant="standard"
                        InputProps={{ disableUnderline: true }}
                        sx={{
                          '& .MuiInputBase-input': {
                            fontSize: '0.85rem',
                            color: '#1e293b',
                            fontWeight: 400,
                            lineHeight: 1.4,
                            '&::placeholder': {
                              color: '#94a3b8',
                              opacity: 1
                            }
                          }
                        }}
                      />
                      <motion.div
                        animate={chatMessage.trim() ? { scale: 1, opacity: 1 } : { scale: 0.8, opacity: 0.5 }}
                        transition={{ duration: 0.15 }}
                      >
                        <IconButton
                          onClick={handleSendMessage}
                          disabled={!chatMessage.trim() || isTyping}
                          sx={{
                            width: 32,
                            height: 32,
                            background: chatMessage.trim() && !isTyping
                              ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' 
                              : 'rgba(241, 245, 249, 0.8)',
                            color: chatMessage.trim() && !isTyping ? 'white' : '#94a3b8',
                            '&:hover': {
                              background: chatMessage.trim() && !isTyping
                                ? 'linear-gradient(135deg, #5046e5 0%, #7c3aed 100%)' 
                                : 'rgba(226, 232, 240, 0.8)',
                              transform: chatMessage.trim() && !isTyping ? 'scale(1.05)' : 'none'
                            },
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <Send sx={{ fontSize: 14 }} />
                        </IconButton>
                      </motion.div>
                    </Box>
                  </Paper>
                </Box>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </Paper>
    </motion.div>
  );
}