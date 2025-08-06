import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Box, 
  Container, 
  Typography, 
  Paper,
  Grid,
  Chip,
  Card,
  CardContent,
  Button,
  Divider,
  IconButton,
  Fade,
  Grow,
  Slide,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Slider,
  Switch,
  FormControlLabel,
  Tooltip,
  Badge,
  Avatar
} from '@mui/material';
import {
  BarChart,
  PieChart,
  TrendingUp,
  Analytics,
  Add,
  Remove,
  Clear,
  Search,
  FilterList,
  SwapHoriz,
  DragIndicator,
  CheckCircle,
  RadioButtonUnchecked,
  TextFields,
  Poll,
  DonutSmall,
  BarChartOutlined,
  ShowChart,
  Insights,
  AutoGraph,
  Compare,
  Tune,
  Close,
  Chat,
  Send,
  SmartToy,
  ChevronLeft,
  ChevronRight
} from '@mui/icons-material';

export default function AnalyticsPage({ onNavCollapse }) {
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const [analysisMode, setAnalysisMode] = useState('single'); // 'single' or 'comparison'
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      type: 'ai',
      content: 'こんにちは！データ分析についてサポートいたします。質問や分析結果について何でもお聞きください。',
      timestamp: new Date()
    }
  ]);
  const [chatInput, setChatInput] = useState('');

  // Analyticsページが開かれた際にナビゲーションを縮小
  React.useEffect(() => {
    if (onNavCollapse) {
      onNavCollapse(true);
    }
    
    // クリーンアップ: ページを離れる際にナビゲーションを元に戻す
    return () => {
      if (onNavCollapse) {
        onNavCollapse(false);
      }
    };
  }, [onNavCollapse]);

  // チャット送信関数
  const handleChatSend = () => {
    if (!chatInput.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: chatInput,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');

    // AI返答をシミュレート
    setTimeout(() => {
      const aiResponse = {
        id: Date.now() + 1,
        type: 'ai',
        content: generateAIResponse(chatInput, selectedQuestions),
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

  // AI返答生成（シミュレーション）
  const generateAIResponse = (input, questions) => {
    const responses = [
      "選択されたデータから興味深いパターンが見えますね。詳しく分析してみましょう。",
      "このデータセットについて、どの指標を重点的に見たいでしょうか？",
      "回答数から判断すると、統計的に有意な結果が得られそうです。",
      "比較分析を行うことで、より深い洞察が得られるかもしれません。",
      "データの傾向から、顧客満足度の改善ポイントが見えてきます。"
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  // コンパクトな質問データベース
  const questionsDatabase = [
    {
      id: 'q1',
      title: '商品の総合満足度',
      category: 'satisfaction',
      type: 'scale',
      chartType: 'bar',
      icon: <Poll />,
      responseCount: 1247,
      data: {
        labels: ['非常に満足', '満足', 'どちらでもない', '不満', '非常に不満'],
        values: [342, 511, 287, 85, 22],
        scale: [5, 4, 3, 2, 1]
      }
    },
    {
      id: 'q2',
      title: '商品の味・風味',
      category: 'product',
      type: 'scale',
      chartType: 'bar',
      icon: <Poll />,
      responseCount: 1203,
      data: {
        labels: ['とても美味しい', '美味しい', '普通', 'イマイチ', 'まずい'],
        values: [456, 398, 234, 89, 26],
        scale: [5, 4, 3, 2, 1]
      }
    },
    {
      id: 'q3',
      title: '購入場所',
      category: 'behavior',
      type: 'single_choice',
      chartType: 'pie',
      icon: <DonutSmall />,
      responseCount: 1156,
      data: {
        labels: ['スーパー', 'コンビニ', 'オンライン', '専門店', 'その他'],
        values: [478, 312, 243, 98, 25]
      }
    },
    {
      id: 'q4',
      title: '価格の満足度',
      category: 'satisfaction',
      type: 'scale',
      chartType: 'horizontal_bar',
      icon: <BarChartOutlined />,
      responseCount: 1198,
      data: {
        labels: ['とても満足', '満足', '普通', '高い', 'とても高い'],
        values: [298, 445, 312, 112, 31],
        scale: [5, 4, 3, 2, 1]
      }
    },
    {
      id: 'q5',
      title: 'リピート購入意向',
      category: 'behavior',
      type: 'single_choice',
      chartType: 'bar',
      icon: <TrendingUp />,
      responseCount: 1089,
      data: {
        labels: ['絶対に購入', '多分購入', 'どちらでもない', '多分購入しない', '購入しない'],
        values: [387, 342, 234, 89, 37]
      }
    },
    {
      id: 'q6',
      title: '改善要望',
      category: 'feedback',
      type: 'multiple_choice',
      chartType: 'horizontal_bar',
      icon: <Tune />,
      responseCount: 934,
      data: {
        labels: ['味の改善', 'パッケージ', '価格', 'サイズ', '販売場所', 'その他'],
        values: [423, 298, 387, 234, 156, 78]
      }
    },
    {
      id: 'q7',
      title: 'ブランド認知度',
      category: 'brand',
      type: 'scale',
      chartType: 'line',
      icon: <ShowChart />,
      responseCount: 1345,
      data: {
        labels: ['よく知っている', '知っている', '聞いたことがある', 'あまり知らない', '知らない'],
        values: [512, 398, 287, 112, 36],
        scale: [5, 4, 3, 2, 1]
      }
    },
    {
      id: 'q8',
      title: '自由コメント',
      category: 'feedback',
      type: 'text',
      chartType: 'word_cloud',
      icon: <TextFields />,
      responseCount: 756,
      data: {
        keywords: ['美味しい', 'パッケージ', '価格', 'サイズ', '味', '品質', 'おすすめ', '購入', 'リピート', '改善']
      }
    }
  ];

  // カテゴリーカラー
  const categoryColors = {
    satisfaction: '#10b981', // green
    product: '#3b82f6',      // blue  
    behavior: '#8b5cf6',     // purple
    feedback: '#f59e0b',     // amber
    brand: '#ef4444'         // red
  };

  // チャートアイコンの取得
  const getChartIcon = (chartType) => {
    const iconMap = {
      bar: <BarChart sx={{ fontSize: 32 }} />,
      pie: <PieChart sx={{ fontSize: 32 }} />,
      line: <ShowChart sx={{ fontSize: 32 }} />,
      horizontal_bar: <BarChartOutlined sx={{ fontSize: 32 }} />,
      word_cloud: <TextFields sx={{ fontSize: 32 }} />
    };
    return iconMap[chartType] || <Analytics sx={{ fontSize: 32 }} />;
  };

  // 質問選択ハンドラー
  const handleQuestionSelect = (question) => {
    if (selectedQuestions.find(q => q.id === question.id)) {
      setSelectedQuestions(prev => prev.filter(q => q.id !== question.id));
      setActiveFilters(prev => {
        const newFilters = { ...prev };
        delete newFilters[question.id];
        return newFilters;
      });
    } else if (selectedQuestions.length < 2) {
      setSelectedQuestions(prev => [...prev, question]);
    }
  };

  // フィルター生成
  const generateFilterOptions = (question) => {
    switch (question.type) {
      case 'scale':
        return {
          type: 'range',
          options: [
            { label: '4以上', value: 4 },
            { label: '3以上', value: 3 },
            { label: '2以下', value: 2 }
          ]
        };
      case 'single_choice':
      case 'multiple_choice':
        return {
          type: 'select',
          options: question.data.labels.map(label => ({ label, value: label }))
        };
      case 'text':
        return {
          type: 'text',
          placeholder: 'キーワードを入力...'
        };
      default:
        return { type: 'none', options: [] };
    }
  };

  // フィルター更新
  const updateFilter = (questionId, type, value) => {
    setActiveFilters(prev => ({
      ...prev,
      [questionId]: { type, value }
    }));
  };

  // 検索フィルタリング
  const filteredQuestions = questionsDatabase.filter(question =>
    question.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    question.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // AIChat コンポーネント
  const AIChat = () => (
    <AnimatePresence>
      {isChatOpen && (
        <motion.div
          initial={{ width: 0, opacity: 0, scale: 0.9 }}
          animate={{ width: 420, opacity: 1, scale: 1 }}
          exit={{ width: 0, opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          style={{ overflow: 'hidden' }}
        >
          <Box
            sx={{
              width: 420,
              height: '100%',
              position: 'relative',
              borderRadius: '24px',
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(40px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'radial-gradient(circle at 50% 0%, rgba(102, 126, 234, 0.1) 0%, transparent 50%)',
                pointerEvents: 'none'
              }
            }}
          >
            {/* モダンなチャットヘッダー */}
            <Box
              sx={{
                p: 4,
                position: 'relative',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.8) 0%, rgba(118, 75, 162, 0.8) 50%, rgba(94, 23, 235, 0.8) 100%)',
                backdropFilter: 'blur(20px)',
                borderRadius: '24px 24px 0 0',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(45deg, rgba(255, 255, 255, 0.1) 0%, transparent 50%, rgba(255, 255, 255, 0.05) 100%)',
                  pointerEvents: 'none'
                }
              }}
            >
              {/* 背景装飾 */}
              <Box
                sx={{
                  position: 'absolute',
                  top: -20,
                  right: -20,
                  width: 100,
                  height: 100,
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%)',
                  animation: 'rotate 20s linear infinite',
                  '@keyframes rotate': {
                    from: { transform: 'rotate(0deg)' },
                    to: { transform: 'rotate(360deg)' }
                  }
                }}
              />
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, position: 'relative', zIndex: 1 }}>
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: '16px',
                    background: 'rgba(255, 255, 255, 0.15)',
                    backdropFilter: 'blur(20px)',
                    border: '2px solid rgba(255, 255, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      inset: 0,
                      borderRadius: '16px',
                      padding: '2px',
                      background: 'linear-gradient(45deg, rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.1))',
                      mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                      maskComposite: 'exclude'
                    }
                  }}
                >
                  <SmartToy 
                    sx={{ 
                      color: 'white', 
                      fontSize: 32,
                      filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))'
                    }} 
                  />
                </Box>
                
                <Box sx={{ flexGrow: 1 }}>
                  <Typography
                    sx={{
                      background: 'linear-gradient(135deg, #ffffff 0%, rgba(255, 255, 255, 0.9) 100%)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      fontWeight: 700,
                      fontSize: '1.25rem',
                      mb: 0.5,
                      letterSpacing: '-0.5px',
                      textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    Analytics AI
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        boxShadow: '0 0 12px rgba(16, 185, 129, 0.6)',
                        animation: 'pulse 2s infinite',
                        '@keyframes pulse': {
                          '0%': { opacity: 1, transform: 'scale(1)' },
                          '50%': { opacity: 0.5, transform: 'scale(1.2)' },
                          '100%': { opacity: 1, transform: 'scale(1)' }
                        }
                      }}
                    />
                    <Typography
                      variant="caption"
                      sx={{
                        color: 'rgba(255, 255, 255, 0.9)',
                        fontSize: '0.8rem',
                        fontWeight: 500,
                        letterSpacing: '0.5px'
                      }}
                    >
                      オンライン • データ分析サポート中
                    </Typography>
                  </Box>
                </Box>
                
                <IconButton
                  onClick={() => setIsChatOpen(false)}
                  sx={{
                    color: 'rgba(255, 255, 255, 0.9)',
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    width: 44,
                    height: 44,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.2)',
                      transform: 'scale(1.05)',
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
                    }
                  }}
                >
                  <Close sx={{ fontSize: 20 }} />
                </IconButton>
              </Box>
            </Box>

            {/* モダンなチャットメッセージエリア */}
            <Box
              sx={{
                flexGrow: 1,
                p: 3,
                overflow: 'auto',
                background: 'linear-gradient(180deg, rgba(248, 250, 252, 0.4) 0%, rgba(241, 245, 249, 0.6) 100%)',
                backdropFilter: 'blur(20px)',
                position: 'relative',
                '&::-webkit-scrollbar': { width: 6 },
                '&::-webkit-scrollbar-track': { 
                  bgcolor: 'rgba(241, 245, 249, 0.3)',
                  borderRadius: 10
                },
                '&::-webkit-scrollbar-thumb': { 
                  bgcolor: 'rgba(156, 163, 175, 0.5)',
                  borderRadius: 10,
                  '&:hover': {
                    bgcolor: 'rgba(156, 163, 175, 0.7)'
                  }
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: '20%',
                  width: '60%',
                  height: '1px',
                  background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)'
                }
              }}
            >
              {chatMessages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ 
                    duration: 0.4, 
                    delay: index * 0.1,
                    ease: "easeOut"
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start',
                      mb: 3,
                      alignItems: 'flex-end'
                    }}
                  >
                    {message.type === 'ai' && (
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: '12px',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mr: 2,
                          mb: 0.5,
                          boxShadow: '0 4px 16px rgba(102, 126, 234, 0.3)',
                          border: '2px solid rgba(255, 255, 255, 0.2)'
                        }}
                      >
                        <SmartToy sx={{ color: 'white', fontSize: 18 }} />
                      </Box>
                    )}
                    
                    <Box
                      sx={{
                        maxWidth: '75%',
                        position: 'relative'
                      }}
                    >
                      <Box
                        sx={{
                          p: 3,
                          borderRadius: message.type === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                          background: message.type === 'user' 
                            ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
                            : 'rgba(255, 255, 255, 0.9)',
                          color: message.type === 'user' ? 'white' : '#1f2937',
                          backdropFilter: 'blur(20px)',
                          border: message.type === 'ai' ? '1px solid rgba(255, 255, 255, 0.3)' : 'none',
                          boxShadow: message.type === 'user'
                            ? '0 8px 32px rgba(99, 102, 241, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                            : '0 4px 20px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'translateY(-1px)',
                            boxShadow: message.type === 'user'
                              ? '0 12px 40px rgba(99, 102, 241, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                              : '0 6px 24px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.5)'
                          }
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: '0.95rem',
                            lineHeight: 1.6,
                            fontWeight: message.type === 'user' ? 500 : 400,
                            letterSpacing: '0.2px',
                            textShadow: message.type === 'user' ? '0 1px 2px rgba(0, 0, 0, 0.1)' : 'none'
                          }}
                        >
                          {message.content}
                        </Typography>
                      </Box>
                      
                      {/* タイムスタンプ */}
                      <Typography
                        variant="caption"
                        sx={{
                          display: 'block',
                          mt: 0.5,
                          px: 1,
                          color: 'rgba(107, 114, 128, 0.8)',
                          fontSize: '0.7rem',
                          textAlign: message.type === 'user' ? 'right' : 'left'
                        }}
                      >
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Typography>
                    </Box>

                    {message.type === 'user' && (
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: '12px',
                          background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          ml: 2,
                          mb: 0.5,
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                          border: '2px solid rgba(255, 255, 255, 0.8)'
                        }}
                      >
                        <Typography sx={{ fontSize: '1rem', fontWeight: 600 }}>👤</Typography>
                      </Box>
                    )}
                  </Box>
                </motion.div>
              ))}
            </Box>

            {/* モダンなチャット入力エリア */}
            <Box
              sx={{
                p: 4,
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                background: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(40px)',
                borderRadius: '0 0 24px 24px',
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: '10%',
                  width: '80%',
                  height: '1px',
                  background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6), transparent)'
                }
              }}
            >
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
                <Box sx={{ flexGrow: 1, position: 'relative' }}>
                  <TextField
                    fullWidth
                    multiline
                    maxRows={4}
                    placeholder="AIにデータ分析について質問してみてください..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleChatSend();
                      }
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        fontSize: '0.95rem',
                        borderRadius: '20px',
                        padding: '12px 20px',
                        background: 'rgba(255, 255, 255, 0.9)',
                        backdropFilter: 'blur(20px)',
                        border: '2px solid rgba(255, 255, 255, 0.3)',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
                        transition: 'all 0.3s ease',
                        '& fieldset': {
                          border: 'none'
                        },
                        '&:hover': {
                          border: '2px solid rgba(99, 102, 241, 0.3)',
                          boxShadow: '0 6px 24px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
                          transform: 'translateY(-1px)'
                        },
                        '&.Mui-focused': {
                          border: '2px solid rgba(99, 102, 241, 0.5)',
                          boxShadow: '0 8px 32px rgba(99, 102, 241, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
                          transform: 'translateY(-2px)'
                        },
                        '& .MuiOutlinedInput-input': {
                          padding: '0',
                          fontWeight: 500,
                          letterSpacing: '0.2px',
                          color: '#1f2937',
                          '&::placeholder': {
                            color: 'rgba(107, 114, 128, 0.7)',
                            opacity: 1,
                            fontSize: '0.9rem'
                          }
                        }
                      }
                    }}
                  />
                </Box>
                
                <Box sx={{ position: 'relative' }}>
                  <IconButton
                    onClick={handleChatSend}
                    disabled={!chatInput.trim()}
                    sx={{
                      width: 56,
                      height: 56,
                      background: chatInput.trim() 
                        ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
                        : 'rgba(229, 231, 235, 0.8)',
                      color: chatInput.trim() ? 'white' : 'rgba(156, 163, 175, 0.8)',
                      backdropFilter: 'blur(20px)',
                      border: '2px solid rgba(255, 255, 255, 0.3)',
                      boxShadow: chatInput.trim()
                        ? '0 8px 32px rgba(99, 102, 241, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                        : '0 2px 8px rgba(0, 0, 0, 0.1)',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      position: 'relative',
                      overflow: 'hidden',
                      '&:hover': chatInput.trim() ? {
                        background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
                        transform: 'scale(1.05) translateY(-1px)',
                        boxShadow: '0 12px 40px rgba(99, 102, 241, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                      } : {},
                      '&:active': chatInput.trim() ? {
                        transform: 'scale(0.95)'
                      } : {},
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: '-100%',
                        width: '100%',
                        height: '100%',
                        background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent)',
                        animation: chatInput.trim() ? 'shimmer 2s infinite' : 'none',
                        '@keyframes shimmer': {
                          '0%': { left: '-100%' },
                          '100%': { left: '100%' }
                        }
                      }
                    }}
                  >
                    <Send 
                      sx={{ 
                        fontSize: 24,
                        filter: chatInput.trim() ? 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))' : 'none'
                      }} 
                    />
                  </IconButton>
                  
                  {/* 送信可能インジケーター */}
                  {chatInput.trim() && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: -2,
                        right: -2,
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        border: '2px solid white',
                        boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)',
                        animation: 'pulse 1.5s infinite',
                        '@keyframes pulse': {
                          '0%': { transform: 'scale(1)', opacity: 1 },
                          '50%': { transform: 'scale(1.2)', opacity: 0.8 },
                          '100%': { transform: 'scale(1)', opacity: 1 }
                        }
                      }}
                    />
                  )}
                </Box>
              </Box>
              
              {/* 使用ヒント */}
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: 'rgba(107, 114, 128, 0.7)',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    letterSpacing: '0.5px'
                  }}
                >
                  Enter で送信 • Shift+Enter で改行
                </Typography>
              </Box>
            </Box>
          </Box>
        </motion.div>
      )}
      
      {/* モダンなチャットトグルボタン */}
      {!isChatOpen && (
        <motion.div
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Box
            onClick={() => setIsChatOpen(true)}
            sx={{
              width: 80,
              height: '100%',
              position: 'relative',
              cursor: 'pointer',
              overflow: 'hidden',
              borderRadius: '16px 0 0 16px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #5e17eb 100%)',
              boxShadow: '0 8px 32px rgba(94, 23, 235, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                transform: 'translateX(-8px) scale(1.02)',
                boxShadow: '0 16px 48px rgba(94, 23, 235, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                background: 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 50%, #6366f1 100%)',
                '&::before': {
                  opacity: 1
                }
              },
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(45deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0) 100%)',
                opacity: 0,
                transition: 'opacity 0.3s ease'
              }
            }}
          >
            {/* アニメーションする背景パーティクル */}
            <Box
              sx={{
                position: 'absolute',
                top: '20%',
                left: '20%',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.6)',
                animation: 'float 3s ease-in-out infinite',
                '@keyframes float': {
                  '0%, 100%': { transform: 'translateY(0) scale(1)', opacity: 0.6 },
                  '50%': { transform: 'translateY(-10px) scale(1.2)', opacity: 1 }
                }
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                top: '60%',
                right: '15%',
                width: '4px',
                height: '4px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.4)',
                animation: 'float 2s ease-in-out infinite 0.5s',
                '@keyframes float': {
                  '0%, 100%': { transform: 'translateY(0) scale(1)', opacity: 0.4 },
                  '50%': { transform: 'translateY(-8px) scale(1.5)', opacity: 0.8 }
                }
              }}
            />

            {/* メインアイコン */}
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 2,
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: '-100%',
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent)',
                  animation: 'shimmer 2s infinite',
                  '@keyframes shimmer': {
                    '0%': { left: '-100%' },
                    '100%': { left: '100%' }
                  }
                }
              }}
            >
              <SmartToy 
                sx={{ 
                  color: 'white', 
                  fontSize: 28,
                  filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))'
                }} 
              />
            </Box>

            {/* テキストラベル */}
            <Box
              sx={{
                writingMode: 'vertical-rl',
                textOrientation: 'mixed',
                background: 'linear-gradient(180deg, #ffffff 0%, rgba(255, 255, 255, 0.8) 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontWeight: 700,
                fontSize: '0.85rem',
                letterSpacing: '0.5px',
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                position: 'relative'
              }}
            >
              AI CHAT
            </Box>

            {/* 通知バッジ */}
            <Box
              sx={{
                position: 'absolute',
                top: 16,
                right: 16,
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                border: '2px solid white',
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)',
                animation: 'pulse 2s infinite',
                '@keyframes pulse': {
                  '0%': { transform: 'scale(1)', opacity: 1 },
                  '50%': { transform: 'scale(1.2)', opacity: 0.7 },
                  '100%': { transform: 'scale(1)', opacity: 1 }
                }
              }}
            />
          </Box>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', p: 2 }}>
        {/* コンパクトヘッダー */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Typography 
                variant="h5" 
                sx={{ 
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: '#111827',
                  mb: 0.25,
                  letterSpacing: '-0.025em'
                }}
              >
                Analytics Dashboard
              </Typography>
              <Typography 
                variant="body2" 
                sx={{
                  color: '#6b7280',
                  fontSize: '0.813rem'
                }}
              >
                質問を選択してデータ分析を開始
              </Typography>
            </Box>
            
            {/* フィルターボタン */}
            {selectedQuestions.length > 0 && (
              <Button
                startIcon={<Tune />}
                onClick={() => setShowFilters(!showFilters)}
                variant="outlined"
                size="small"
                sx={{
                  height: 28,
                  px: 2,
                  borderRadius: 0.75,
                  textTransform: 'none',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  bgcolor: showFilters ? '#111827' : 'transparent',
                  color: showFilters ? 'white' : '#374151',
                  borderColor: '#d1d5db',
                  '&:hover': {
                    bgcolor: showFilters ? '#1f2937' : '#f9fafb',
                    borderColor: '#9ca3af'
                  }
                }}
              >
                Filters
              </Button>
            )}
          </Box>
        </Box>

        {/* フィルターパネル */}
        <AnimatePresence>
          {showFilters && selectedQuestions.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Box
                sx={{
                  mb: 2,
                  p: 2,
                  bgcolor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: 1,
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
                }}
              >
                {/* ヘッダー */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box
                      sx={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        bgcolor: '#6366f1'
                      }}
                    />
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 600,
                        color: '#111827',
                        fontSize: '0.9rem',
                        letterSpacing: '-0.01em'
                      }}
                    >
                      Filters
                    </Typography>
                    {Object.keys(activeFilters).length > 0 && (
                      <Chip
                        label={Object.keys(activeFilters).length}
                        size="small"
                        sx={{
                          height: 18,
                          fontSize: '0.688rem',
                          bgcolor: '#6366f115',
                          color: '#6366f1',
                          fontWeight: 600,
                          '& .MuiChip-label': {
                            px: 0.75
                          }
                        }}
                      />
                    )}
                  </Box>
                  {Object.keys(activeFilters).length > 0 && (
                    <Button
                      startIcon={<Close sx={{ fontSize: 14 }} />}
                      onClick={() => setActiveFilters({})}
                      variant="outlined"
                      size="small"
                      sx={{
                        textTransform: 'none',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        minWidth: 'auto',
                        height: 28,
                        px: 1.5,
                        borderRadius: 0.75,
                        color: '#ef4444',
                        borderColor: '#fecaca',
                        bgcolor: '#fef2f2',
                        '&:hover': {
                          bgcolor: '#fee2e2',
                          borderColor: '#f87171'
                        }
                      }}
                    >
                      Clear
                    </Button>
                  )}
                </Box>
                
                {/* フィルター要素 - 横並びレイアウト */}
                <Box 
                  sx={{ 
                    display: 'flex',
                    gap: 3,
                    flexWrap: 'wrap',
                    alignItems: 'flex-start'
                  }}
                >
                  {selectedQuestions.map((question) => {
                    const filterConfig = generateFilterOptions(question);
                    
                    return (
                      <Box 
                        key={question.id}
                        sx={{
                          flex: '1 1 300px',
                          minWidth: 300,
                          maxWidth: 400
                        }}
                      >
                        {/* コンパクトな質問タイトル */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Box
                            sx={{
                              bgcolor: `${categoryColors[question.category]}20`,
                              color: categoryColors[question.category],
                              borderRadius: 0.5,
                              p: 0.25,
                              display: 'flex',
                              fontSize: '14px'
                            }}
                          >
                            {question.icon}
                          </Box>
                          <Box>
                            <Typography 
                              variant="subtitle2" 
                              sx={{ 
                                fontWeight: 600,
                                color: '#111827',
                                fontSize: '0.813rem',
                                lineHeight: 1.2
                              }}
                            >
                              {question.title}
                            </Typography>
                          </Box>
                        </Box>
                        
                        {/* Range フィルター */}
                        {filterConfig.type === 'range' && (
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {filterConfig.options.map((option) => (
                              <Button
                                key={option.value}
                                onClick={() => updateFilter(question.id, 'range', option.value)}
                                variant={activeFilters[question.id]?.value === option.value ? 'contained' : 'outlined'}
                                size="small"
                                sx={{
                                  textTransform: 'none',
                                  fontWeight: 500,
                                  minWidth: 'auto',
                                  px: 1.5,
                                  py: 0.5,
                                  fontSize: '0.688rem',
                                  height: 28,
                                  borderRadius: 1,
                                  bgcolor: activeFilters[question.id]?.value === option.value ? categoryColors[question.category] : 'transparent',
                                  color: activeFilters[question.id]?.value === option.value ? 'white' : '#374151',
                                  borderColor: activeFilters[question.id]?.value === option.value ? categoryColors[question.category] : '#d1d5db',
                                  transition: 'all 0.15s ease',
                                  '&:hover': {
                                    bgcolor: activeFilters[question.id]?.value === option.value ? categoryColors[question.category] : '#f9fafb',
                                    borderColor: activeFilters[question.id]?.value === option.value ? categoryColors[question.category] : '#9ca3af',
                                    transform: 'translateY(-1px)'
                                  }
                                }}
                              >
                                {option.label}
                              </Button>
                            ))}
                          </Box>
                        )}

                        {/* Select フィルター */}
                        {filterConfig.type === 'select' && (
                          <FormControl size="small" fullWidth>
                            <Select
                              value={activeFilters[question.id]?.value || ''}
                              onChange={(e) => updateFilter(question.id, 'select', e.target.value)}
                              displayEmpty
                              sx={{
                                height: 36,
                                fontSize: '0.75rem',
                                borderRadius: 0.75,
                                bgcolor: 'white',
                                '& .MuiOutlinedInput-notchedOutline': {
                                  borderColor: '#e5e7eb',
                                },
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                  borderColor: categoryColors[question.category],
                                },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                  borderColor: categoryColors[question.category],
                                  borderWidth: '2px'
                                },
                                '& .MuiSelect-select': {
                                  py: 0.75
                                }
                              }}
                            >
                              <MenuItem value="">
                                <Typography sx={{ fontSize: '0.75rem', color: '#6b7280', fontStyle: 'italic' }}>すべての選択肢</Typography>
                              </MenuItem>
                              {filterConfig.options.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 500 }}>{option.label}</Typography>
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        )}

                        {/* Text フィルター */}
                        {filterConfig.type === 'text' && (
                          <TextField
                            fullWidth
                            placeholder={filterConfig.placeholder}
                            value={activeFilters[question.id]?.value || ''}
                            onChange={(e) => updateFilter(question.id, 'text', e.target.value)}
                            InputProps={{
                              startAdornment: <Search sx={{ color: '#9ca3af', fontSize: 16, mr: 1 }} />
                            }}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                height: 36,
                                fontSize: '0.75rem',
                                borderRadius: 0.75,
                                bgcolor: 'white',
                                '& fieldset': {
                                  borderColor: '#e5e7eb',
                                },
                                '&:hover fieldset': {
                                  borderColor: categoryColors[question.category],
                                },
                                '&.Mui-focused fieldset': {
                                  borderColor: categoryColors[question.category],
                                  borderWidth: '2px'
                                }
                              }
                            }}
                          />
                        )}
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            </motion.div>
          )}
        </AnimatePresence>

        {/* メインコンテンツ */}
        <Box sx={{ flexGrow: 1, display: 'flex', gap: 2, minHeight: 0 }}>
          {/* 左側: Analytics コンテンツ */}
          <Box sx={{ flexGrow: 1, display: 'flex', gap: 2, minHeight: 0 }}>
            {/* 質問選択サイドバー */}
            <Box
              sx={{
                width: 320,
                bgcolor: '#ffffff',
                borderRadius: 1,
                border: '1px solid #e5e7eb',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }}
            >
            {/* 検索 */}
            <Box sx={{ p: 2, borderBottom: '1px solid #e5e7eb' }}>
              <TextField
                fullWidth
                placeholder="質問を検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ color: '#9ca3af', fontSize: 16, mr: 1 }} />
                }}
                sx={{
                  height: 32,
                  fontSize: '0.813rem',
                  '& .MuiOutlinedInput-root': {
                    height: 32,
                    '& fieldset': {
                      borderColor: '#d1d5db',
                    },
                    '&:hover fieldset': {
                      borderColor: '#9ca3af',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#6366f1',
                      borderWidth: '1px'
                    }
                  }
                }}
              />
            </Box>

            {/* 質問リスト */}
            <Box 
              sx={{ 
                flexGrow: 1, 
                overflow: 'auto',
                '&::-webkit-scrollbar': { width: 4 },
                '&::-webkit-scrollbar-track': { bgcolor: '#f1f5f9' },
                '&::-webkit-scrollbar-thumb': { bgcolor: '#cbd5e1', borderRadius: 2 }
              }}
            >
              <Box sx={{ p: 2 }}>
                {filteredQuestions.map((question) => {
                  const isSelected = selectedQuestions.some(q => q.id === question.id);
                  const canSelect = selectedQuestions.length < 2 || isSelected;
                  
                  return (
                    <motion.div
                      key={question.id}
                      whileHover={{ scale: canSelect ? 1.02 : 1 }}
                      whileTap={{ scale: canSelect ? 0.98 : 1 }}
                      transition={{ duration: 0.15 }}
                    >
                      <Box
                        onClick={() => canSelect && handleQuestionSelect(question)}
                        sx={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 1.5,
                          p: 2,
                          cursor: canSelect ? 'pointer' : 'not-allowed',
                          borderRadius: 1,
                          border: '1px solid #e5e7eb',
                          backgroundColor: isSelected ? '#f0f9ff' : '#ffffff',
                          borderColor: isSelected ? '#3b82f6' : '#e5e7eb',
                          opacity: canSelect ? 1 : 0.5,
                          transition: 'all 0.2s ease',
                          '&:hover': canSelect ? {
                            borderColor: isSelected ? '#2563eb' : '#9ca3af',
                            backgroundColor: isSelected ? '#e0f2fe' : '#f9fafb'
                          } : {},
                          mb: 1
                        }}
                      >
                        <Box
                          sx={{
                            bgcolor: `${categoryColors[question.category]}15`,
                            color: categoryColors[question.category],
                            borderRadius: 1,
                            p: 0.75,
                            display: 'flex'
                          }}
                        >
                          {question.icon}
                        </Box>
                        
                        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                          <Typography 
                            variant="body2"
                            sx={{
                              fontSize: '0.813rem',
                              fontWeight: 600,
                              color: '#111827',
                              mb: 0.25,
                              lineHeight: 1.3
                            }}
                          >
                            {question.title}
                          </Typography>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: '#6b7280',
                              fontSize: '0.688rem',
                              lineHeight: 1.25,
                              mb: 0.5
                            }}
                          >
                            {question.responseCount.toLocaleString()}件 • {question.type.replace('_', ' ')}
                          </Typography>
                          
                          <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                            <Chip 
                              label={question.category} 
                              size="small" 
                              variant="outlined"
                              sx={{ 
                                fontSize: '0.688rem',
                                height: 16,
                                bgcolor: `${categoryColors[question.category]}15`,
                                color: categoryColors[question.category],
                                borderColor: `${categoryColors[question.category]}30`,
                                '& .MuiChip-label': {
                                  px: 0.5
                                }
                              }}
                            />
                            <Chip 
                              label={question.chartType.replace('_', ' ')} 
                              size="small" 
                              variant="outlined"
                              sx={{ 
                                fontSize: '0.688rem',
                                height: 16,
                                '& .MuiChip-label': {
                                  px: 0.5
                                }
                              }}
                            />
                          </Box>
                        </Box>
                      </Box>
                    </motion.div>
                  );
                })}
              </Box>
            </Box>
          </Box>

          {/* 分析結果エリア */}
          <Box sx={{ flexGrow: 1, minHeight: 0 }}>
            <AnimatePresence mode="wait">
              {selectedQuestions.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{ height: '100%' }}
                >
                  <Box
                    sx={{
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#fafafa',
                      border: '1px solid #e5e7eb',
                      borderRadius: 1
                    }}
                  >
                    <Box sx={{ textAlign: 'center', p: 3 }}>
                      <AutoGraph sx={{ fontSize: 48, color: '#9ca3af', mb: 2 }} />
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 600, 
                          mb: 1,
                          color: '#111827',
                          fontSize: '1rem'
                        }}
                      >
                        質問を選択してください
                      </Typography>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          mb: 2,
                          color: '#6b7280',
                          fontSize: '0.813rem'
                        }}
                      >
                        1つまたは2つの質問を選んでデータ分析を開始
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.75, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Chip icon={<Poll />} label="単体分析" size="small" variant="outlined" sx={{ fontSize: '0.688rem' }} />
                        <Chip icon={<Compare />} label="比較分析" size="small" variant="outlined" sx={{ fontSize: '0.688rem' }} />
                      </Box>
                    </Box>
                  </Box>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <Box
                    sx={{
                      height: '100%',
                      backgroundColor: '#ffffff',
                      borderRadius: 1,
                      border: '1px solid #e5e7eb',
                      p: 3,
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                  >
                    {/* 分析ヘッダー */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      {selectedQuestions.length === 1 ? (
                        <>
                          <Box
                            sx={{
                              bgcolor: `${categoryColors[selectedQuestions[0].category]}20`,
                              color: categoryColors[selectedQuestions[0].category],
                              borderRadius: 1,
                              p: 1,
                              display: 'flex'
                            }}
                          >
                            {getChartIcon(selectedQuestions[0].chartType)}
                          </Box>
                          <Box>
                            <Typography 
                              variant="h6" 
                              sx={{ 
                                fontWeight: 600,
                                color: '#111827',
                                fontSize: '1rem'
                              }}
                            >
                              {selectedQuestions[0].title}
                            </Typography>
                            <Typography 
                              variant="body2" 
                              sx={{
                                color: '#6b7280',
                                fontSize: '0.813rem'
                              }}
                            >
                              {selectedQuestions[0].responseCount.toLocaleString()}件の回答
                            </Typography>
                          </Box>
                        </>
                      ) : (
                        <>
                          <Compare sx={{ fontSize: 24, color: '#6366f1' }} />
                          <Typography 
                            variant="h6" 
                            sx={{ 
                              fontWeight: 600,
                              color: '#111827',
                              fontSize: '1rem'
                            }}
                          >
                            比較・クロス分析
                          </Typography>
                        </>
                      )}
                    </Box>

                    {/* グラフエリア */}
                    <Box
                      sx={{
                        flexGrow: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#f9fafb',
                        border: selectedQuestions.length === 1 
                          ? `1px dashed ${categoryColors[selectedQuestions[0].category]}80`
                          : '1px dashed #6366f180',
                        borderRadius: 1
                      }}
                    >
                      <Box sx={{ textAlign: 'center' }}>
                        {selectedQuestions.length === 1 ? (
                          <>
                            {getChartIcon(selectedQuestions[0].chartType)}
                            <Typography 
                              variant="h6" 
                              sx={{ 
                                mt: 1, 
                                color: categoryColors[selectedQuestions[0].category],
                                fontSize: '0.875rem',
                                fontWeight: 600
                              }}
                            >
                              {selectedQuestions[0].chartType.toUpperCase().replace('_', ' ')}
                            </Typography>
                          </>
                        ) : (
                          <>
                            <AutoGraph sx={{ fontSize: 32, color: '#6366f1' }} />
                            <Typography 
                              variant="h6" 
                              sx={{ 
                                mt: 1, 
                                color: '#6366f1',
                                fontSize: '0.875rem',
                                fontWeight: 600
                              }}
                            >
                              クロス集計グラフ
                            </Typography>
                          </>
                        )}
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            mt: 1,
                            color: '#6b7280',
                            fontSize: '0.75rem'
                          }}
                        >
                          Chart.js / Recharts 統合予定
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </motion.div>
              )}
            </AnimatePresence>
            </Box>
          </Box>

          {/* 右側: AIチャット */}
          <AIChat />
        </Box>
      </Box>
    </motion.div>
  );
}