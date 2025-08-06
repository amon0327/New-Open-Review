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
  ChevronLeft,
  ChevronRight
} from '@mui/icons-material';

export default function AnalyticsPage({ onNavCollapse }) {
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const [analysisMode, setAnalysisMode] = useState('single'); // 'single' or 'comparison'

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


  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', p: 1 }}>


        {/* メインコンテンツ */}
        <Box sx={{ flexGrow: 1, display: 'flex', gap: 1.5, minHeight: 0 }}>
          {/* 質問選択サイドバー */}
          <Box
            sx={{
              width: 280,
              bgcolor: '#ffffff',
              borderRadius: 2,
              border: '1px solid #e5e7eb',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}
          >
            {/* 検索 */}
            <Box sx={{ p: 1.5, borderBottom: '1px solid #e5e7eb' }}>
              <TextField
                fullWidth
                size="small"
                placeholder="質問を検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ color: '#9ca3af', fontSize: 16, mr: 0.5 }} />
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    fontSize: '0.813rem',
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
              <Box sx={{ p: 1.5 }}>
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
                          gap: 1.25,
                          p: 1.5,
                          cursor: canSelect ? 'pointer' : 'not-allowed',
                          borderRadius: 1.5,
                          border: '1px solid #e5e7eb',
                          backgroundColor: isSelected ? '#f0f9ff' : '#ffffff',
                          borderColor: isSelected ? '#3b82f6' : '#e5e7eb',
                          opacity: canSelect ? 1 : 0.5,
                          transition: 'all 0.2s ease',
                          '&:hover': canSelect ? {
                            borderColor: isSelected ? '#2563eb' : '#9ca3af',
                            backgroundColor: isSelected ? '#e0f2fe' : '#f9fafb',
                            transform: 'translateY(-1px)',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                          } : {},
                          mb: 1,
                          boxShadow: isSelected ? '0 2px 8px rgba(59, 130, 246, 0.15)' : 'none'
                        }}
                      >
                        <Box
                          sx={{
                            bgcolor: `${categoryColors[question.category]}15`,
                            color: categoryColors[question.category],
                            borderRadius: 1.25,
                            p: 0.75,
                            display: 'flex',
                            fontSize: '20px'
                          }}
                        >
                          {question.icon}
                        </Box>
                        
                        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                          <Typography 
                            variant="body2"
                            sx={{
                              fontSize: '0.875rem',
                              fontWeight: 600,
                              color: '#111827',
                              mb: 0.5,
                              lineHeight: 1.4
                            }}
                          >
                            {question.title}
                          </Typography>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: '#6b7280',
                              fontSize: '0.75rem',
                              lineHeight: 1.25,
                              mb: 1
                            }}
                          >
                            {question.responseCount.toLocaleString()}件の回答
                          </Typography>
                          
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                            <Chip 
                              label={question.category} 
                              size="small" 
                              variant="outlined"
                              sx={{ 
                                fontSize: '0.688rem',
                                height: 18,
                                bgcolor: `${categoryColors[question.category]}10`,
                                color: categoryColors[question.category],
                                borderColor: `${categoryColors[question.category]}40`,
                                fontWeight: 500,
                                '& .MuiChip-label': {
                                  px: 0.75
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
                      background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                      border: '1px solid #e2e8f0',
                      borderRadius: 2,
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
                          '50%': { transform: 'scale(1.1)', opacity: 0.1 }
                        }
                      }}
                    />
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
                      borderRadius: 2,
                      border: '1px solid #e5e7eb',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                      display: 'flex',
                      flexDirection: 'column',
                      overflow: 'hidden'
                    }}
                  >
                    {/* コンパクトな分析ヘッダー */}
                    <Box 
                      sx={{ 
                        p: 2, 
                        borderBottom: '1px solid #f1f5f9',
                        background: 'linear-gradient(90deg, #ffffff 0%, #f8fafc 100%)'
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {selectedQuestions.length === 1 ? (
                          <>
                            <Box
                              sx={{
                                bgcolor: `${categoryColors[selectedQuestions[0].category]}15`,
                                color: categoryColors[selectedQuestions[0].category],
                                borderRadius: 1.5,
                                p: 1,
                                display: 'flex'
                              }}
                            >
                              {getChartIcon(selectedQuestions[0].chartType)}
                            </Box>
                            <Box sx={{ flexGrow: 1 }}>
                              <Typography 
                                variant="h6" 
                                sx={{ 
                                  fontWeight: 700,
                                  color: '#1e293b',
                                  fontSize: '1.1rem',
                                  mb: 0.25
                                }}
                              >
                                {selectedQuestions[0].title}
                              </Typography>
                              <Typography 
                                variant="body2" 
                                sx={{
                                  color: '#64748b',
                                  fontSize: '0.875rem'
                                }}
                              >
                                {selectedQuestions[0].responseCount.toLocaleString()}件の回答データ
                              </Typography>
                            </Box>
                            
                            {/* フィルターボタンをヘッダーに統合 */}
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
                          </>
                        ) : (
                          <>
                            <Box
                              sx={{
                                bgcolor: '#6366f115',
                                color: '#6366f1',
                                borderRadius: 1.5,
                                p: 1,
                                display: 'flex'
                              }}
                            >
                              <Compare sx={{ fontSize: 28 }} />
                            </Box>
                            <Box sx={{ flexGrow: 1 }}>
                              <Typography 
                                variant="h6" 
                                sx={{ 
                                  fontWeight: 700,
                                  color: '#1e293b',
                                  fontSize: '1.1rem',
                                  mb: 0.25
                                }}
                              >
                                比較・クロス分析
                              </Typography>
                              <Typography 
                                variant="body2" 
                                sx={{
                                  color: '#64748b',
                                  fontSize: '0.875rem'
                                }}
                              >
                                {selectedQuestions.length}つの質問を比較分析
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
                          </>
                        )}
                      </Box>
                    </Box>

                    {/* スマートフィルターパネル */}
                    <AnimatePresence>
                      {showFilters && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: 'easeInOut' }}
                        >
                          <Box
                            sx={{
                              borderTop: '1px solid #f1f5f9',
                              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                              maxHeight: 240,
                              overflow: 'auto',
                              '&::-webkit-scrollbar': { width: 6 },
                              '&::-webkit-scrollbar-track': { 
                                bgcolor: 'rgba(241, 245, 249, 0.5)',
                                borderRadius: 3
                              },
                              '&::-webkit-scrollbar-thumb': { 
                                bgcolor: 'rgba(203, 213, 225, 0.8)',
                                borderRadius: 3,
                                '&:hover': {
                                  bgcolor: 'rgba(148, 163, 184, 0.9)'
                                }
                              }
                            }}
                          >
                            <Box 
                              sx={{ 
                                p: 2,
                                display: 'grid',
                                gridTemplateColumns: selectedQuestions.length === 2 ? '1fr 1fr' : '1fr',
                                gap: 2
                              }}
                            >
                              {selectedQuestions.map((question, index) => {
                                const filterConfig = generateFilterOptions(question);
                                
                                return (
                                  <motion.div
                                    key={question.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                  >
                                    <Box
                                      sx={{
                                        p: 2,
                                        border: '1px solid #e2e8f0',
                                        borderRadius: 2,
                                        background: 'rgba(255, 255, 255, 0.8)',
                                        backdropFilter: 'blur(10px)',
                                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                                        minHeight: 70,
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column'
                                      }}
                                    >
                                      {/* コンパクトな質問ヘッダー */}
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                                        <Box
                                          sx={{
                                            width: 6,
                                            height: 6,
                                            borderRadius: '50%',
                                            bgcolor: categoryColors[question.category]
                                          }}
                                        />
                                        <Typography
                                          sx={{
                                            fontWeight: 600,
                                            color: '#1e293b',
                                            fontSize: '0.85rem',
                                            lineHeight: 1.3
                                          }}
                                        >
                                          {question.title}
                                        </Typography>
                                      </Box>

                                      {/* コンパクトなフィルター要素 */}
                                      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                        {/* Range フィルター */}
                                        {filterConfig.type === 'range' && (
                                          <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
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
                                                  fontSize: '0.75rem',
                                                  height: 28,
                                                  borderRadius: 1.5,
                                                  bgcolor: activeFilters[question.id]?.value === option.value 
                                                    ? categoryColors[question.category] 
                                                    : 'transparent',
                                                  color: activeFilters[question.id]?.value === option.value 
                                                    ? 'white' 
                                                    : '#64748b',
                                                  borderColor: activeFilters[question.id]?.value === option.value 
                                                    ? categoryColors[question.category] 
                                                    : '#e2e8f0',
                                                  transition: 'all 0.2s ease',
                                                  '&:hover': {
                                                    transform: 'translateY(-1px)',
                                                    boxShadow: `0 4px 12px ${categoryColors[question.category]}30`
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
                                                borderRadius: 1.5,
                                                fontSize: '0.8rem',
                                                '& .MuiOutlinedInput-notchedOutline': {
                                                  borderColor: '#e2e8f0',
                                                },
                                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                                  borderColor: categoryColors[question.category],
                                                },
                                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                  borderColor: categoryColors[question.category],
                                                  borderWidth: '2px'
                                                }
                                              }}
                                            >
                                              <MenuItem value="">
                                                <Typography sx={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                                                  すべて選択
                                                </Typography>
                                              </MenuItem>
                                              {filterConfig.options.map((option) => (
                                                <MenuItem key={option.value} value={option.value}>
                                                  <Typography sx={{ fontSize: '0.8rem' }}>
                                                    {option.label}
                                                  </Typography>
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
                                            size="small"
                                            InputProps={{
                                              startAdornment: (
                                                <Search sx={{ color: '#94a3b8', fontSize: 16, mr: 0.5 }} />
                                              )
                                            }}
                                            sx={{
                                              '& .MuiOutlinedInput-root': {
                                                height: 36,
                                                borderRadius: 1.5,
                                                fontSize: '0.8rem',
                                                '& fieldset': {
                                                  borderColor: '#e2e8f0',
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
                                    </Box>
                                  </motion.div>
                                );
                              })}
                            </Box>

                            {/* フィルタークリアボタン */}
                            {Object.keys(activeFilters).length > 0 && (
                              <Box 
                                sx={{ 
                                  display: 'flex', 
                                  justifyContent: 'center', 
                                  p: 1.5, 
                                  borderTop: '1px solid #f1f5f9',
                                  background: 'rgba(248, 250, 252, 0.8)'
                                }}
                              >
                                <Button
                                  startIcon={<Close sx={{ fontSize: 14 }} />}
                                  onClick={() => setActiveFilters({})}
                                  variant="outlined"
                                  size="small"
                                  sx={{
                                    textTransform: 'none',
                                    fontSize: '0.75rem',
                                    fontWeight: 500,
                                    height: 28,
                                    px: 2,
                                    borderRadius: 1.5,
                                    color: '#ef4444',
                                    borderColor: '#fecaca',
                                    bgcolor: '#fef2f2',
                                    '&:hover': {
                                      bgcolor: '#fee2e2',
                                      borderColor: '#f87171',
                                      transform: 'translateY(-1px)'
                                    }
                                  }}
                                >
                                  すべてクリア
                                </Button>
                              </Box>
                            )}
                          </Box>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* モダンなグラフエリア */}
                    <Box
                      sx={{
                        flexGrow: 1,
                        p: 3,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                    >
                      {/* 背景装飾 */}
                      <Box
                        sx={{
                          position: 'absolute',
                          top: '20%',
                          left: '20%',
                          width: '60%',
                          height: '60%',
                          borderRadius: '50%',
                          background: selectedQuestions.length === 1 
                            ? `radial-gradient(circle, ${categoryColors[selectedQuestions[0].category]}15 0%, transparent 70%)`
                            : 'radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%)',
                          animation: 'pulse 6s ease-in-out infinite',
                          '@keyframes pulse': {
                            '0%, 100%': { transform: 'scale(1)', opacity: 0.6 },
                            '50%': { transform: 'scale(1.05)', opacity: 0.3 }
                          }
                        }}
                      />

                      <Box sx={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 0.4 }}
                        >
                          {selectedQuestions.length === 1 ? (
                            <Box
                              sx={{
                                p: 3,
                                borderRadius: '50%',
                                background: `linear-gradient(135deg, ${categoryColors[selectedQuestions[0].category]}20 0%, ${categoryColors[selectedQuestions[0].category]}10 100%)`,
                                border: `2px solid ${categoryColors[selectedQuestions[0].category]}30`,
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mb: 2
                              }}
                            >
                              {getChartIcon(selectedQuestions[0].chartType)}
                            </Box>
                          ) : (
                            <Box
                              sx={{
                                p: 3,
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(99, 102, 241, 0.1) 100%)',
                                border: '2px solid rgba(99, 102, 241, 0.3)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mb: 2
                              }}
                            >
                              <AutoGraph sx={{ fontSize: 40, color: '#6366f1' }} />
                            </Box>
                          )}
                        </motion.div>

                        <Typography 
                          variant="h5" 
                          sx={{ 
                            fontWeight: 700,
                            color: '#1e293b',
                            fontSize: '1.25rem',
                            mb: 1
                          }}
                        >
                          {selectedQuestions.length === 1 
                            ? selectedQuestions[0].chartType.replace('_', ' ').toUpperCase()
                            : 'クロス集計分析'
                          }
                        </Typography>

                        <Typography 
                          variant="body1" 
                          sx={{ 
                            color: '#64748b',
                            fontSize: '0.95rem',
                            mb: 2
                          }}
                        >
                          グラフライブラリ統合予定
                        </Typography>

                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                          <Chip 
                            label="Chart.js" 
                            size="small" 
                            variant="outlined"
                            sx={{ 
                              fontSize: '0.75rem',
                              fontWeight: 500
                            }}
                          />
                          <Chip 
                            label="D3.js" 
                            size="small" 
                            variant="outlined"
                            sx={{ 
                              fontSize: '0.75rem',
                              fontWeight: 500
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
        </Box>
      </Box>
    </motion.div>
  );
}