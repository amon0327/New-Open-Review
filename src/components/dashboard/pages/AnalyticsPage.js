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
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 400, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          style={{ overflow: 'hidden' }}
        >
          <Box
            sx={{
              width: 400,
              height: '100%',
              bgcolor: '#ffffff',
              borderRadius: 1,
              border: '1px solid #e5e7eb',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
            }}
          >
            {/* チャットヘッダー */}
            <Box
              sx={{
                p: 3,
                borderBottom: '1px solid #e5e7eb',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '4px 4px 0 0'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <SmartToy sx={{ color: 'white', fontSize: 20 }} />
                </Box>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      color: 'white',
                      fontWeight: 600,
                      fontSize: '1rem',
                      mb: 0.5
                    }}
                  >
                    Analytics AI Assistant
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'rgba(255, 255, 255, 0.8)',
                      fontSize: '0.75rem'
                    }}
                  >
                    データ分析をサポート
                  </Typography>
                </Box>
                <IconButton
                  onClick={() => setIsChatOpen(false)}
                  sx={{ color: 'white', p: 1 }}
                >
                  <Close />
                </IconButton>
              </Box>
            </Box>

            {/* チャットメッセージ */}
            <Box
              sx={{
                flexGrow: 1,
                p: 2,
                overflow: 'auto',
                bgcolor: '#f9fafb',
                '&::-webkit-scrollbar': { width: 4 },
                '&::-webkit-scrollbar-track': { bgcolor: '#f1f5f9' },
                '&::-webkit-scrollbar-thumb': { bgcolor: '#cbd5e1', borderRadius: 2 }
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
                      justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start',
                      mb: 2
                    }}
                  >
                    <Box
                      sx={{
                        maxWidth: '80%',
                        p: 2,
                        borderRadius: 2,
                        bgcolor: message.type === 'user' ? '#6366f1' : '#ffffff',
                        color: message.type === 'user' ? 'white' : '#374151',
                        border: message.type === 'ai' ? '1px solid #e5e7eb' : 'none',
                        boxShadow: message.type === 'ai' ? '0 1px 3px rgba(0, 0, 0, 0.1)' : 'none'
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: '0.875rem',
                          lineHeight: 1.5
                        }}
                      >
                        {message.content}
                      </Typography>
                    </Box>
                  </Box>
                </motion.div>
              ))}
            </Box>

            {/* チャット入力 */}
            <Box
              sx={{
                p: 2,
                borderTop: '1px solid #e5e7eb',
                bgcolor: '#ffffff'
              }}
            >
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  placeholder="データについて質問してください..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleChatSend()}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      fontSize: '0.875rem',
                      borderRadius: 1.5,
                      '& fieldset': {
                        borderColor: '#d1d5db',
                      },
                      '&:hover fieldset': {
                        borderColor: '#9ca3af',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#6366f1',
                      }
                    }
                  }}
                />
                <IconButton
                  onClick={handleChatSend}
                  disabled={!chatInput.trim()}
                  sx={{
                    bgcolor: '#6366f1',
                    color: 'white',
                    '&:hover': {
                      bgcolor: '#5046e5'
                    },
                    '&:disabled': {
                      bgcolor: '#e5e7eb',
                      color: '#9ca3af'
                    }
                  }}
                >
                  <Send sx={{ fontSize: 16 }} />
                </IconButton>
              </Box>
            </Box>
          </Box>
        </motion.div>
      )}
      
      {/* チャットトグルボタン */}
      {!isChatOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Box
            onClick={() => setIsChatOpen(true)}
            sx={{
              width: 60,
              height: '100%',
              bgcolor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              border: '1px solid #e5e7eb',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateX(-2px)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
              }
            }}
          >
            <Chat sx={{ color: 'white', fontSize: 24, mb: 1 }} />
            <Typography
              variant="caption"
              sx={{
                color: 'white',
                fontWeight: 600,
                fontSize: '0.75rem',
                writingMode: 'vertical-rl',
                textOrientation: 'mixed'
              }}
            >
              AI Chat
            </Typography>
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