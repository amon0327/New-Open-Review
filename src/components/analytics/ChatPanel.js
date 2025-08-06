import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Avatar,
  Chip,
  Divider,
  Tooltip
} from '@mui/material';
import {
  Send,
  SmartToy,
  Person,
  AutoAwesome,
  Psychology,
  TrendingUp,
  Lightbulb,
  DataUsage
} from '@mui/icons-material';

const sampleQuestions = [
  "このデータの傾向を教えて",
  "顧客満足度の改善点は？",
  "売上予測をしてもらえる？",
  "異常値の原因は何？"
];

const aiSuggestions = [
  { icon: <TrendingUp />, text: "トレンド分析", color: "#3b82f6" },
  { icon: <Psychology />, text: "洞察発見", color: "#8b5cf6" },
  { icon: <Lightbulb />, text: "改善提案", color: "#f59e0b" },
  { icon: <DataUsage />, text: "データ解析", color: "#10b981" }
];

export default function ChatPanel() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      content: '👋 こんにちは！データ分析AIアシスタントです。\n\n分析結果について何でもお聞きください。トレンド分析、洞察発見、改善提案など、お手伝いします！',
      timestamp: new Date(Date.now() - 60000)
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
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
      `📊 「${question}」について分析しました。\n\nデータを見る限り、興味深いパターンが見つかります。詳細な分析結果をお示しできますが、どの観点から深掘りしたいでしょうか？`,
      `🔍 ご質問の件について調査しました。\n\n現在のデータから以下の傾向が読み取れます：\n• 主要指標は上昇トレンド\n• 特定の期間で変動あり\n• さらなる分析が可能です`,
      `💡 素晴らしい質問ですね！\n\n分析結果から、改善の機会がいくつか見つかりました。具体的な提案をするために、もう少し詳しい条件を教えていただけますか？`,
      `🎯 データ分析の結果、以下のポイントが重要だと思われます：\n\n1. 現在の状況\n2. 改善の余地\n3. 次のアクション\n\nどの部分について詳しく知りたいですか？`
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleQuickQuestion = (question) => {
    setInputValue(question);
  };

  const formatTime = (timestamp) => {
    return timestamp.toLocaleTimeString('ja-JP', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
    >
      <Box
        sx={{
          width: { xs: '100%', sm: 380 },
          height: '100%',
          ml: { xs: 0, sm: 1 },
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.98) 100%)',
          borderRadius: 3,
          border: '1px solid rgba(148,163,184,0.15)',
          backdropFilter: 'blur(20px)',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
          position: { xs: 'fixed', sm: 'static' },
          top: { xs: 0, sm: 'auto' },
          right: { xs: 0, sm: 'auto' },
          zIndex: { xs: 1300, sm: 'auto' },
          transform: { xs: 'translateX(100%)', sm: 'translateX(0)' },
          transition: 'transform 0.3s ease-in-out'
        }}
      >
        {/* ヘッダー */}
        <Box
          sx={{
            p: 3,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: -20,
              right: -20,
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.1)',
              animation: 'float 3s ease-in-out infinite'
            }}
          />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, position: 'relative', zIndex: 1 }}>
            <Avatar
              sx={{
                bgcolor: 'rgba(255,255,255,0.2)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.3)'
              }}
            >
              <SmartToy sx={{ color: 'white' }} />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
                AI分析アシスタント
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.85rem' }}>
                データ洞察をサポート
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* AI機能ショートカット */}
        <Box sx={{ p: 2, borderBottom: '1px solid rgba(148,163,184,0.1)' }}>
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              mb: 1.5,
              color: '#64748b',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: 0.5
            }}
          >
            AI機能
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {aiSuggestions.map((suggestion, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Chip
                  icon={React.cloneElement(suggestion.icon, { sx: { color: suggestion.color + '!important' } })}
                  label={suggestion.text}
                  size="small"
                  onClick={() => handleQuickQuestion(`${suggestion.text}について教えて`)}
                  sx={{
                    bgcolor: suggestion.color + '15',
                    color: suggestion.color,
                    border: `1px solid ${suggestion.color}30`,
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    '&:hover': {
                      bgcolor: suggestion.color + '25',
                      transform: 'translateY(-1px)'
                    }
                  }}
                />
              </motion.div>
            ))}
          </Box>
        </Box>

        {/* メッセージエリア */}
        <Box
          sx={{
            flexGrow: 1,
            overflowY: 'auto',
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
            '&::-webkit-scrollbar': {
              width: '4px'
            },
            '&::-webkit-scrollbar-track': {
              background: 'rgba(148,163,184,0.1)',
              borderRadius: 2
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'rgba(148,163,184,0.3)',
              borderRadius: 2,
              '&:hover': {
                background: 'rgba(148,163,184,0.5)'
              }
            }
          }}
        >
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    gap: 1.5,
                    alignItems: 'flex-start',
                    flexDirection: message.type === 'user' ? 'row-reverse' : 'row'
                  }}
                >
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      bgcolor: message.type === 'ai' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#3b82f6',
                      fontSize: '1rem'
                    }}
                  >
                    {message.type === 'ai' ? <SmartToy /> : <Person />}
                  </Avatar>
                  <Box
                    sx={{
                      maxWidth: '75%',
                      p: 1.5,
                      borderRadius: 2.5,
                      bgcolor: message.type === 'ai' ? '#f8fafc' : '#3b82f6',
                      color: message.type === 'ai' ? '#1e293b' : 'white',
                      border: message.type === 'ai' ? '1px solid rgba(148,163,184,0.15)' : 'none',
                      position: 'relative',
                      boxShadow: message.type === 'user' ? '0 2px 8px rgba(59,130,246,0.3)' : '0 2px 8px rgba(0,0,0,0.05)'
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: '0.875rem',
                        lineHeight: 1.5,
                        whiteSpace: 'pre-line'
                      }}
                    >
                      {message.content}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        display: 'block',
                        mt: 0.5,
                        opacity: 0.7,
                        fontSize: '0.7rem',
                        textAlign: message.type === 'user' ? 'right' : 'left'
                      }}
                    >
                      {formatTime(message.timestamp)}
                    </Typography>
                  </Box>
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
              >
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    }}
                  >
                    <SmartToy />
                  </Avatar>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 2.5,
                      bgcolor: '#f8fafc',
                      border: '1px solid rgba(148,163,184,0.15)'
                    }}
                  >
                    <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                      <Box
                        sx={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          bgcolor: '#64748b',
                          animation: 'typing 1.5s ease-in-out infinite',
                          '@keyframes typing': {
                            '0%, 60%, 100%': { opacity: 0.3 },
                            '30%': { opacity: 1 }
                          }
                        }}
                      />
                      <Box
                        sx={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          bgcolor: '#64748b',
                          animation: 'typing 1.5s ease-in-out infinite 0.2s'
                        }}
                      />
                      <Box
                        sx={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          bgcolor: '#64748b',
                          animation: 'typing 1.5s ease-in-out infinite 0.4s'
                        }}
                      />
                    </Box>
                  </Box>
                </Box>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </Box>

        {/* クイック質問 */}
        <Box sx={{ px: 2, pb: 2 }}>
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              mb: 1,
              color: '#64748b',
              fontWeight: 600
            }}
          >
            よくある質問
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {sampleQuestions.slice(0, 2).map((question, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Chip
                  label={question}
                  variant="outlined"
                  size="small"
                  onClick={() => handleQuickQuestion(question)}
                  sx={{
                    justifyContent: 'flex-start',
                    width: '100%',
                    bgcolor: 'rgba(99, 102, 241, 0.05)',
                    borderColor: 'rgba(99, 102, 241, 0.2)',
                    color: '#6366f1',
                    fontSize: '0.75rem',
                    '&:hover': {
                      bgcolor: 'rgba(99, 102, 241, 0.1)',
                      borderColor: 'rgba(99, 102, 241, 0.3)'
                    }
                  }}
                />
              </motion.div>
            ))}
          </Box>
        </Box>

        <Divider sx={{ opacity: 0.3 }} />

        {/* 入力エリア */}
        <Box
          sx={{
            p: 2,
            background: 'rgba(248,250,252,0.8)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
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
              placeholder="AIに質問してみましょう..."
              variant="outlined"
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                  bgcolor: 'white',
                  border: '1px solid rgba(148,163,184,0.2)',
                  fontSize: '0.875rem',
                  '& fieldset': {
                    border: 'none'
                  },
                  '&:hover': {
                    bgcolor: 'rgba(248,250,252,0.8)',
                    border: '1px solid rgba(148,163,184,0.3)'
                  },
                  '&.Mui-focused': {
                    bgcolor: 'white',
                    border: '1px solid #6366f1',
                    boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.1)'
                  }
                }
              }}
            />
            <Tooltip title="送信 (Enter)">
              <IconButton
                onClick={handleSend}
                disabled={!inputValue.trim() || isTyping}
                sx={{
                  bgcolor: inputValue.trim() ? '#6366f1' : '#e2e8f0',
                  color: 'white',
                  borderRadius: 2,
                  width: 44,
                  height: 44,
                  '&:hover': {
                    bgcolor: inputValue.trim() ? '#5046e5' : '#cbd5e1',
                    transform: 'translateY(-1px)'
                  },
                  '&.Mui-disabled': {
                    bgcolor: '#e2e8f0',
                    color: '#94a3b8'
                  }
                }}
              >
                <Send sx={{ fontSize: 20 }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Box>
    </motion.div>
  );
}