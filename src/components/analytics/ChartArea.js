import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Fade,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  AutoGraph,
  Compare,
  Tune,
  Chat,
  ChevronRight,
  Send,
  SmartToy,
  FlashOn,
  TrendingUp as TrendingUpIcon,
  InsightsOutlined,
  Psychology
} from '@mui/icons-material';
import FilterPanel from './FilterPanel';

// CSS アニメーション用のスタイル定義
const globalStyles = `
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;

// グローバルスタイルを適用
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.type = 'text/css';
  styleSheet.innerText = globalStyles;
  document.head.appendChild(styleSheet);
}

export default function ChartArea({
  selectedQuestions,
  activeFilters,
  setActiveFilters,
  showFilters,
  setShowFilters
}) {
  const [showChatPanel, setShowChatPanel] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      type: 'system',
      content: 'データ分析を始めましょう。何かお手伝いできることはありますか？',
      timestamp: new Date()
    }
  ]);
  if (selectedQuestions.length === 0) {
    return (
      <Box sx={{ flexGrow: 1, display: 'flex', position: 'relative' }}>
        <Box
          sx={{
            flex: showChatPanel ? 1 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: '#ffffff',
            borderRadius: 2,
            border: '1px solid #e2e8f0',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <Box sx={{ textAlign: 'center', p: 4, position: 'relative', zIndex: 1 }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              style={{ display: 'inline-block', marginBottom: 16 }}
            >
              <AutoGraph sx={{ fontSize: 64, color: '#64748b' }} />
            </motion.div>
            <Typography 
              variant="h5" 
              sx={{ 
                fontWeight: 700, 
                mb: 1,
                color: '#1e293b',
                fontSize: '1.25rem'
              }}
            >
              データ分析を開始
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                mb: 3,
                color: '#64748b',
                fontSize: '0.95rem'
              }}
            >
              左側から質問を選択してください
            </Typography>
          </Box>
          
          {/* 装飾的な背景 */}
          <Box
            sx={{
              position: 'absolute',
              top: -50,
              right: -50,
              width: 200,
              height: 200,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%)',
              animation: 'pulse 4s ease-in-out infinite',
              '@keyframes pulse': {
                '0%, 100%': { transform: 'scale(1)', opacity: 0.3 },
                '50%': { transform: 'scale(1.1)', opacity: 0.5 }
              }
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              bottom: -30,
              left: -30,
              width: 150,
              height: 150,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%)',
              animation: 'pulse 6s ease-in-out infinite',
              animationDelay: '2s'
            }}
          />

          {/* Chatボタン - 右下に固定配置 */}
          <IconButton
            onClick={() => setShowChatPanel(!showChatPanel)}
            sx={{
              position: 'absolute',
              bottom: 16,
              right: 16,
              width: 56,
              height: 56,
              bgcolor: showChatPanel ? '#64748b' : '#6366f1',
              color: 'white',
              boxShadow: showChatPanel 
                ? '0 4px 20px rgba(100, 116, 139, 0.4)' 
                : '0 4px 20px rgba(99, 102, 241, 0.4)',
              '&:hover': {
                bgcolor: showChatPanel ? '#475569' : '#5046e5',
                transform: 'translateY(-2px)',
                boxShadow: showChatPanel 
                  ? '0 8px 30px rgba(100, 116, 139, 0.6)' 
                  : '0 8px 30px rgba(99, 102, 241, 0.6)',
              },
              transition: 'all 0.3s ease',
              zIndex: 10
            }}
          >
            {showChatPanel ? (
              <ChevronRight sx={{ fontSize: 24 }} />
            ) : (
              <Chat sx={{ fontSize: 24 }} />
            )}
          </IconButton>
        </Box>

        {/* Chat Panel */}
        <AnimatePresence>
          {showChatPanel && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 380, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              style={{ overflow: 'hidden' }}
            >
              <Box
                sx={{
                  width: 380,
                  height: '100%',
                  bgcolor: '#fefefe',
                  borderRadius: 1.5,
                  border: '1px solid #e1e5e9',
                  ml: 1.5,
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: '0 8px 40px rgba(0, 0, 0, 0.08)',
                  overflow: 'hidden'
                }}
              >
                {/* Ultra-modern Header */}
                <Box
                  sx={{
                    position: 'relative',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    overflow: 'hidden'
                  }}
                >
                  {/* Animated background elements */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: -20,
                      right: -20,
                      width: 60,
                      height: 60,
                      borderRadius: '50%',
                      background: 'rgba(255, 255, 255, 0.1)',
                      animation: 'float 3s ease-in-out infinite'
                    }}
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: -10,
                      left: -10,
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      background: 'rgba(255, 255, 255, 0.08)',
                      animation: 'float 4s ease-in-out infinite reverse'
                    }}
                  />
                  
                  <Box sx={{ position: 'relative', p: 1.5, py: 1.25 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: 2,
                          background: 'rgba(255, 255, 255, 0.15)',
                          backdropFilter: 'blur(10px)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '1px solid rgba(255, 255, 255, 0.2)'
                        }}
                      >
                        <Psychology sx={{ fontSize: 18, color: 'white' }} />
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          sx={{
                            color: 'white',
                            fontWeight: 700,
                            fontSize: '0.95rem',
                            letterSpacing: '-0.02em'
                          }}
                        >
                          AI Analytics
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Box
                            sx={{
                              width: 6,
                              height: 6,
                              borderRadius: '50%',
                              bgcolor: '#10b981',
                              animation: 'pulse 2s infinite'
                            }}
                          />
                          <Typography
                            sx={{
                              color: 'rgba(255, 255, 255, 0.9)',
                              fontSize: '0.75rem',
                              fontWeight: 500
                            }}
                          >
                            Ready to analyze
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                </Box>

                {/* Quick Actions Bar */}
                <Box
                  sx={{
                    p: 1,
                    bgcolor: '#f8fafc',
                    borderBottom: '1px solid #e2e8f0'
                  }}
                >
                  <Box sx={{ display: 'flex', gap: 0.75 }}>
                    {[
                      { icon: <TrendingUpIcon />, label: 'Insights', color: '#3b82f6' },
                      { icon: <InsightsOutlined />, label: 'Compare', color: '#8b5cf6' },
                      { icon: <FlashOn />, label: 'Quick', color: '#f59e0b' }
                    ].map((action, index) => (
                      <Box
                        key={index}
                        sx={{
                          flex: 1,
                          py: 0.75,
                          px: 1,
                          borderRadius: 1,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          bgcolor: 'white',
                          border: '1px solid #e5e7eb',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            transform: 'translateY(-1px)',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            borderColor: action.color
                          }
                        }}
                      >
                        <Box sx={{ color: action.color }}>
                          {React.cloneElement(action.icon, { sx: { fontSize: 14 } })}
                        </Box>
                        <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: '#374151' }}>
                          {action.label}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>

                {/* Chat Messages */}
                <Box
                  sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden'
                  }}
                >
                  <Box
                    sx={{
                      flex: 1,
                      overflowY: 'auto',
                      px: 1.5,
                      py: 1.5,
                      '&::-webkit-scrollbar': { width: 4 },
                      '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
                      '&::-webkit-scrollbar-thumb': {
                        bgcolor: '#d1d5db',
                        borderRadius: 2,
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
                            display: 'flex',
                            gap: 1,
                            mb: 1.5,
                            alignItems: 'flex-start'
                          }}
                        >
                          <Box
                            sx={{
                              width: 28,
                              height: 28,
                              borderRadius: 1.5,
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flex: 'none'
                            }}
                          >
                            <SmartToy sx={{ fontSize: 16, color: 'white' }} />
                          </Box>
                          <Box
                            sx={{
                              flex: 1,
                              bgcolor: 'white',
                              borderRadius: 1.5,
                              p: 1.25,
                              border: '1px solid #e5e7eb',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                            }}
                          >
                            <Typography
                              sx={{
                                fontSize: '0.85rem',
                                lineHeight: 1.5,
                                color: '#1f2937',
                                fontWeight: 500
                              }}
                            >
                              {message.content}
                            </Typography>
                            <Typography
                              sx={{
                                fontSize: '0.7rem',
                                color: '#9ca3af',
                                mt: 0.5,
                                fontWeight: 500
                              }}
                            >
                              AI Assistant
                            </Typography>
                          </Box>
                        </Box>
                      </motion.div>
                    ))}
                  </Box>

                  {/* Message Input */}
                  <Box
                    sx={{
                      p: 1.5,
                      borderTop: '1px solid #e5e7eb',
                      bgcolor: '#fafbfc'
                    }}
                  >
                    <Box sx={{ position: 'relative' }}>
                      <TextField
                        fullWidth
                        placeholder="Ask about your data..."
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        variant="outlined"
                        size="small"
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                edge="end"
                                size="small"
                                disabled={!chatMessage.trim()}
                                sx={{
                                  bgcolor: chatMessage.trim() ? '#667eea' : '#e5e7eb',
                                  color: 'white',
                                  width: 28,
                                  height: 28,
                                  '&:hover': {
                                    bgcolor: chatMessage.trim() ? '#5a67d8' : '#e5e7eb',
                                    transform: chatMessage.trim() ? 'scale(1.05)' : 'none'
                                  },
                                  transition: 'all 0.2s ease',
                                  '&.Mui-disabled': {
                                    bgcolor: '#e5e7eb',
                                    color: '#9ca3af'
                                  }
                                }}
                              >
                                <Send sx={{ fontSize: 14 }} />
                              </IconButton>
                            </InputAdornment>
                          )
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 1.5,
                            bgcolor: 'white',
                            fontSize: '0.85rem',
                            '& fieldset': { borderColor: '#d1d5db' },
                            '&:hover fieldset': { borderColor: '#667eea' },
                            '&.Mui-focused fieldset': {
                              borderColor: '#667eea',
                              borderWidth: '2px'
                            }
                          }
                        }}
                      />
                    </Box>
                  </Box>
                </Box>
              </Box>
            </motion.div>
          )}
        </AnimatePresence>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, display: 'flex', position: 'relative' }}>
      <Box
        sx={{
          flex: showChatPanel ? 1 : 1,
          display: 'flex',
          flexDirection: 'column',
          bgcolor: '#ffffff',
          borderRadius: 2,
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
      {/* ヘッダーセクション */}
      <Box
        sx={{
          p: 2.5,
          borderBottom: '1px solid #f1f5f9',
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box
            sx={{
              bgcolor: selectedQuestions.length === 1 ? 'rgba(59, 130, 246, 0.1)' : 'rgba(99, 102, 241, 0.1)',
              color: selectedQuestions.length === 1 ? '#3b82f6' : '#6366f1',
              borderRadius: 1.5,
              p: 1,
              display: 'flex'
            }}
          >
            {selectedQuestions.length === 1 ? (
              <AutoGraph sx={{ fontSize: 28 }} />
            ) : (
              <Compare sx={{ fontSize: 28 }} />
            )}
          </Box>
          <Box sx={{ flexGrow: 1, ml: 2 }}>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 700,
                color: '#1e293b',
                fontSize: '1.1rem',
                mb: 0.25
              }}
            >
              {selectedQuestions.length === 1 ? '単体分析' : '比較・クロス分析'}
            </Typography>
            <Typography 
              variant="body2" 
              sx={{
                color: '#64748b',
                fontSize: '0.875rem'
              }}
            >
              {selectedQuestions.length === 1 
                ? selectedQuestions[0]?.title 
                : `${selectedQuestions.length}つの質問を比較分析`
              }
            </Typography>
          </Box>
          
          <Button
            startIcon={<Tune />}
            onClick={() => setShowFilters(!showFilters)}
            variant={showFilters ? "contained" : "outlined"}
            size="small"
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontSize: '0.8rem',
              fontWeight: 600,
              px: 2,
              py: 0.75,
              bgcolor: showFilters ? '#6366f1' : 'transparent',
              color: showFilters ? 'white' : '#64748b',
              borderColor: showFilters ? '#6366f1' : '#e2e8f0',
              '&:hover': {
                bgcolor: showFilters ? '#5046e5' : '#f1f5f9',
                borderColor: showFilters ? '#5046e5' : '#cbd5e1'
              }
            }}
          >
            フィルター
          </Button>
        </Box>
      </Box>

      {/* フィルターパネル */}
      <FilterPanel
        selectedQuestions={selectedQuestions}
        activeFilters={activeFilters}
        setActiveFilters={setActiveFilters}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
      />

        {/* チャート表示エリア */}
        <Box sx={{ flexGrow: 1, p: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Box sx={{ textAlign: 'center', color: '#64748b' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
              チャートエリア
            </Typography>
            <Typography variant="body2">
              ここにグラフが表示されます
            </Typography>
          </Box>
        </Box>

        {/* Chatボタン - 右下に固定配置 */}
        <IconButton
          onClick={() => setShowChatPanel(!showChatPanel)}
          sx={{
            position: 'absolute',
            bottom: 16,
            right: 16,
            width: 56,
            height: 56,
            bgcolor: showChatPanel ? '#64748b' : '#6366f1',
            color: 'white',
            boxShadow: showChatPanel 
              ? '0 4px 20px rgba(100, 116, 139, 0.4)' 
              : '0 4px 20px rgba(99, 102, 241, 0.4)',
            '&:hover': {
              bgcolor: showChatPanel ? '#475569' : '#5046e5',
              transform: 'translateY(-2px)',
              boxShadow: showChatPanel 
                ? '0 8px 30px rgba(100, 116, 139, 0.6)' 
                : '0 8px 30px rgba(99, 102, 241, 0.6)',
            },
            transition: 'all 0.3s ease',
            zIndex: 10
          }}
        >
          {showChatPanel ? (
            <ChevronRight sx={{ fontSize: 24 }} />
          ) : (
            <Chat sx={{ fontSize: 24 }} />
          )}
        </IconButton>
      </Box>

      {/* Chat Panel */}
      <AnimatePresence>
        {showChatPanel && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 380, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <Box
              sx={{
                width: 380,
                height: '100%',
                bgcolor: '#fefefe',
                borderRadius: 1.5,
                border: '1px solid #e1e5e9',
                ml: 1.5,
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 8px 40px rgba(0, 0, 0, 0.08)',
                overflow: 'hidden'
              }}
            >
              {/* Ultra-modern Header */}
              <Box
                sx={{
                  position: 'relative',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  overflow: 'hidden'
                }}
              >
                {/* Animated background elements */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: -20,
                    right: -20,
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.1)',
                    animation: 'float 3s ease-in-out infinite'
                  }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: -10,
                    left: -10,
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.08)',
                    animation: 'float 4s ease-in-out infinite reverse'
                  }}
                />
                
                <Box sx={{ position: 'relative', p: 1.5, py: 1.25 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: 2,
                        background: 'rgba(255, 255, 255, 0.15)',
                        backdropFilter: 'blur(10px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid rgba(255, 255, 255, 0.2)'
                      }}
                    >
                      <Psychology sx={{ fontSize: 18, color: 'white' }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        sx={{
                          color: 'white',
                          fontWeight: 700,
                          fontSize: '0.95rem',
                          letterSpacing: '-0.02em'
                        }}
                      >
                        AI Analytics
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box
                          sx={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            bgcolor: '#10b981',
                            animation: 'pulse 2s infinite'
                          }}
                        />
                        <Typography
                          sx={{
                            color: 'rgba(255, 255, 255, 0.9)',
                            fontSize: '0.75rem',
                            fontWeight: 500
                          }}
                        >
                          Ready to analyze
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </Box>

              {/* Quick Actions Bar */}
              <Box
                sx={{
                  p: 1,
                  bgcolor: '#f8fafc',
                  borderBottom: '1px solid #e2e8f0'
                }}
              >
                <Box sx={{ display: 'flex', gap: 0.75 }}>
                  {[
                    { icon: <TrendingUpIcon />, label: 'Insights', color: '#3b82f6' },
                    { icon: <InsightsOutlined />, label: 'Compare', color: '#8b5cf6' },
                    { icon: <FlashOn />, label: 'Quick', color: '#f59e0b' }
                  ].map((action, index) => (
                    <Box
                      key={index}
                      sx={{
                        flex: 1,
                        py: 0.75,
                        px: 1,
                        borderRadius: 1,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        bgcolor: 'white',
                        border: '1px solid #e5e7eb',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          transform: 'translateY(-1px)',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                          borderColor: action.color
                        }
                      }}
                    >
                      <Box sx={{ color: action.color }}>
                        {React.cloneElement(action.icon, { sx: { fontSize: 14 } })}
                      </Box>
                      <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: '#374151' }}>
                        {action.label}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>

              {/* Chat Messages */}
              <Box
                sx={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden'
                }}
              >
                <Box
                  sx={{
                    flex: 1,
                    overflowY: 'auto',
                    px: 1.5,
                    py: 1.5,
                    '&::-webkit-scrollbar': { width: 4 },
                    '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
                    '&::-webkit-scrollbar-thumb': {
                      bgcolor: '#d1d5db',
                      borderRadius: 2,
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
                          display: 'flex',
                          gap: 1,
                          mb: 1.5,
                          alignItems: 'flex-start'
                        }}
                      >
                        <Box
                          sx={{
                            width: 28,
                            height: 28,
                            borderRadius: 1.5,
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flex: 'none'
                          }}
                        >
                          <SmartToy sx={{ fontSize: 16, color: 'white' }} />
                        </Box>
                        <Box
                          sx={{
                            flex: 1,
                            bgcolor: 'white',
                            borderRadius: 1.5,
                            p: 1.25,
                            border: '1px solid #e5e7eb',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                          }}
                        >
                          <Typography
                            sx={{
                              fontSize: '0.85rem',
                              lineHeight: 1.5,
                              color: '#1f2937',
                              fontWeight: 500
                            }}
                          >
                            {message.content}
                          </Typography>
                          <Typography
                            sx={{
                              fontSize: '0.7rem',
                              color: '#9ca3af',
                              mt: 0.5,
                              fontWeight: 500
                            }}
                          >
                            AI Assistant
                          </Typography>
                        </Box>
                      </Box>
                    </motion.div>
                  ))}
                </Box>

                {/* Message Input */}
                <Box
                  sx={{
                    p: 1.5,
                    borderTop: '1px solid #e5e7eb',
                    bgcolor: '#fafbfc'
                  }}
                >
                  <Box sx={{ position: 'relative' }}>
                    <TextField
                      fullWidth
                      placeholder="Ask about your data..."
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      variant="outlined"
                      size="small"
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              edge="end"
                              size="small"
                              disabled={!chatMessage.trim()}
                              sx={{
                                bgcolor: chatMessage.trim() ? '#667eea' : '#e5e7eb',
                                color: 'white',
                                width: 28,
                                height: 28,
                                '&:hover': {
                                  bgcolor: chatMessage.trim() ? '#5a67d8' : '#e5e7eb',
                                  transform: chatMessage.trim() ? 'scale(1.05)' : 'none'
                                },
                                transition: 'all 0.2s ease',
                                '&.Mui-disabled': {
                                  bgcolor: '#e5e7eb',
                                  color: '#9ca3af'
                                }
                              }}
                            >
                              <Send sx={{ fontSize: 14 }} />
                            </IconButton>
                          </InputAdornment>
                        )
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 1.5,
                          bgcolor: 'white',
                          fontSize: '0.85rem',
                          '& fieldset': { borderColor: '#d1d5db' },
                          '&:hover fieldset': { borderColor: '#667eea' },
                          '&.Mui-focused fieldset': {
                            borderColor: '#667eea',
                            borderWidth: '2px'
                          }
                        }
                      }}
                    />
                  </Box>
                </Box>
              </Box>
            </Box>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
}