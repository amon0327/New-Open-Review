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
  Tune
} from '@mui/icons-material';

export default function AnalyticsPage() {
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const [analysisMode, setAnalysisMode] = useState('single'); // 'single' or 'comparison'

  // 詳細な質問データベース
  const questionsDatabase = [
    {
      id: 'q1',
      title: '商品の総合満足度',
      category: 'satisfaction',
      type: 'scale', // scale, single_choice, multiple_choice, text
      chartType: 'bar',
      icon: <Poll />,
      responseCount: 1247,
      data: {
        labels: ['非常に満足', '満足', 'どちらでもない', '不満', '非常に不満'],
        values: [342, 511, 287, 85, 22],
        scale: [5, 4, 3, 2, 1]
      },
      demographics: {
        age: { '20-29': 312, '30-39': 425, '40-49': 398, '50+': 112 },
        gender: { male: 589, female: 658 },
        region: { tokyo: 423, osaka: 298, others: 526 }
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
      },
      demographics: {
        age: { '20-29': 298, '30-39': 401, '40-49': 389, '50+': 115 },
        gender: { male: 567, female: 636 }
      }
    },
    {
      id: 'q3',
      title: '価格の妥当性',
      category: 'pricing',
      type: 'single_choice',
      chartType: 'pie',
      icon: <DonutSmall />,
      responseCount: 1189,
      data: {
        labels: ['とても安い', '安い', '適正', '高い', 'とても高い'],
        values: [67, 298, 624, 187, 13]
      },
      demographics: {
        age: { '20-29': 289, '30-39': 395, '40-49': 378, '50+': 127 },
        gender: { male: 556, female: 633 },
        income: { low: 298, medium: 567, high: 324 }
      }
    },
    {
      id: 'q4',
      title: '購入理由（複数回答可）',
      category: 'behavior',
      type: 'multiple_choice',
      chartType: 'horizontal_bar',
      icon: <BarChartOutlined />,
      responseCount: 1156,
      data: {
        labels: ['価格が安い', '品質が良い', 'ブランドが好き', '友人の推薦', '広告を見て', 'その他'],
        values: [423, 687, 234, 189, 298, 87]
      },
      demographics: {
        age: { '20-29': 278, '30-39': 389, '40-49': 367, '50+': 122 },
        gender: { male: 542, female: 614 }
      }
    },
    {
      id: 'q5',
      title: '購入頻度',
      category: 'behavior',
      type: 'single_choice',
      chartType: 'pie',
      icon: <ShowChart />,
      responseCount: 1134,
      data: {
        labels: ['週1回以上', '月2-3回', '月1回', '2-3ヶ月に1回', '半年に1回以下'],
        values: [134, 298, 389, 234, 79]
      },
      demographics: {
        age: { '20-29': 267, '30-39': 378, '40-49': 356, '50+': 133 },
        gender: { male: 523, female: 611 }
      }
    },
    {
      id: 'q6',
      title: '年齢',
      category: 'demographics',
      type: 'single_choice',
      chartType: 'bar',
      icon: <Poll />,
      responseCount: 1289,
      data: {
        labels: ['20-29歳', '30-39歳', '40-49歳', '50-59歳', '60歳以上'],
        values: [334, 412, 398, 112, 33]
      }
    },
    {
      id: 'q7',
      title: '性別',
      category: 'demographics',
      type: 'single_choice',
      chartType: 'pie',
      icon: <DonutSmall />,
      responseCount: 1289,
      data: {
        labels: ['男性', '女性', 'その他', '回答しない'],
        values: [589, 658, 23, 19]
      }
    },
    {
      id: 'q8',
      title: 'コメント・要望',
      category: 'feedback',
      type: 'text',
      chartType: 'word_cloud',
      icon: <TextFields />,
      responseCount: 892,
      data: {
        keywords: [
          { word: '美味しい', count: 234 },
          { word: '価格', count: 189 },
          { word: '品質', count: 167 },
          { word: 'おすすめ', count: 145 },
          { word: '改善', count: 123 }
        ]
      }
    }
  ];

  // カテゴリー別の色設定
  const categoryColors = {
    satisfaction: '#667eea',
    product: '#764ba2',
    pricing: '#f093fb',
    behavior: '#f5576c',
    demographics: '#4facfe',
    feedback: '#43e97b'
  };

  // 質問タイプアイコンの取得
  const getQuestionIcon = (type) => {
    switch (type) {
      case 'scale': return <Poll />;
      case 'single_choice': return <RadioButtonUnchecked />;
      case 'multiple_choice': return <CheckCircle />;
      case 'text': return <TextFields />;
      default: return <Analytics />;
    }
  };

  // グラフタイプアイコンの取得
  const getChartIcon = (chartType) => {
    switch (chartType) {
      case 'bar': return <BarChart />;
      case 'horizontal_bar': return <BarChartOutlined />;
      case 'pie': return <DonutSmall />;
      case 'line': return <ShowChart />;
      case 'word_cloud': return <TextFields />;
      default: return <Analytics />;
    }
  };

  // 質問の追加/削除
  const handleQuestionSelect = (question) => {
    if (selectedQuestions.find(q => q.id === question.id)) {
      setSelectedQuestions(selectedQuestions.filter(q => q.id !== question.id));
      // 質問削除時にフィルターもクリア
      const newFilters = { ...activeFilters };
      delete newFilters[question.id];
      setActiveFilters(newFilters);
    } else if (selectedQuestions.length < 2) {
      setSelectedQuestions([...selectedQuestions, question]);
      setShowFilters(true);
    }
  };

  // フィルター関数の生成
  const generateFilterOptions = (question) => {
    switch (question.type) {
      case 'scale':
        return {
          type: 'range',
          options: [
            { value: '>=4', label: '4以上（高評価）' },
            { value: '>=3', label: '3以上（普通以上）' },
            { value: '<=2', label: '2以下（低評価）' },
            { value: '==5', label: '最高評価のみ' },
            { value: '==1', label: '最低評価のみ' }
          ]
        };
      case 'single_choice':
        return {
          type: 'select',
          options: question.data.labels.map((label, index) => ({
            value: index,
            label: label
          }))
        };
      case 'multiple_choice':
        return {
          type: 'multiselect',
          options: question.data.labels.map((label, index) => ({
            value: index,
            label: label
          }))
        };
      case 'text':
        return {
          type: 'text_search',
          options: [
            { value: 'contains', label: 'テキストを含む' },
            { value: 'not_contains', label: 'テキストを含まない' },
            { value: 'starts_with', label: '〜で始まる' },
            { value: 'ends_with', label: '〜で終わる' }
          ]
        };
      default:
        return { type: 'none', options: [] };
    }
  };

  // フィルター更新
  const updateFilter = (questionId, filterType, value) => {
    setActiveFilters(prev => ({
      ...prev,
      [questionId]: { type: filterType, value }
    }));
  };

  // フィルター済み質問リスト
  const filteredQuestions = questionsDatabase.filter(q => 
    q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.category.toLowerCase().includes(searchTerm.toLowerCase())
  );
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Container
        maxWidth={false}
        disableGutters
        sx={{
          width: '100%',
          m: 0,
          p: 0,
          bgcolor: '#f5f5f5'
        }}
      >
        {/* メインコンテンツエリア */}
        <Box
          sx={{
            width: '100%',
            pt: 3,
            pl: 3,
            pr: 3,
            pb: 3,
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
            bgcolor: '#f8fafc',
            minWidth: 0
          }}
        >
          {/* 上部横並びrow */}
          <Box
            sx={{
              display: 'flex',
              gap: 3,
              height: '500px',
              minWidth: 0,
              overflow: 'hidden'
            }}
          >
            {/* 左側エリア全体 */}
            <Box
              sx={{
                flex: 2,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: 3,
                minWidth: 0,
                overflow: 'hidden'
              }}
            >
              {/* 左上のContainer */}
              <Box
                sx={{
                  flex: 1.5,
                  bgcolor: '#ffffff',
                  borderRadius: 2,
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                  border: '1px solid rgba(0, 0, 0, 0.05)',
                  p: 3,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: 0,
                  overflow: 'hidden'
                }}
              >
                生成AIレポート
              </Box>

              {/* 左下横並びContainer */}
              <Box
                sx={{
                  flex: 3,
                  display: 'flex',
                  gap: 2,
                  minWidth: 0,
                  overflow: 'hidden'
                }}
              >
                {/* 左下左のContainer */}
                <Box
                  sx={{
                    flex: 1,
                    bgcolor: '#ffffff',
                    borderRadius: 2,
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                    border: '1px solid rgba(0, 0, 0, 0.05)',
                    p: 3,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: 0,
                    overflow: 'hidden'
                  }}
                >
                  直近の特徴的なデータグラフや図
                </Box>

                {/* 左下右のContainer */}
                <Box
                  sx={{
                    flex: 1,
                    bgcolor: '#ffffff',
                    borderRadius: 2,
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                    border: '1px solid rgba(0, 0, 0, 0.05)',
                    p: 3,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: 0,
                    overflow: 'hidden'
                  }}
                >
                  直近の特徴的なデータグラフや図
                </Box>
              </Box>
            </Box>

            {/* 右側のContainer */}
            <Box
              sx={{
                flex: 1,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: 3,
                minWidth: 0,
                overflow: 'hidden'
              }}
            >
              {/* 右上のContainer（横2つに分割） */}
              <Box
                sx={{
                  flex: 0.5,
                  display: 'flex',
                  gap: 2,
                  minWidth: 0,
                  overflow: 'hidden'
                }}
              >
                {/* 右上左のContainer */}
                <Box
                  sx={{
                    flex: 1,
                    bgcolor: '#ffffff',
                    borderRadius: 2,
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                    border: '1px solid rgba(0, 0, 0, 0.05)',
                    p: 3,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: 0,
                    overflow: 'hidden'
                  }}
                >
                  回答率（直近1週間）
                </Box>

                {/* 右上右のContainer */}
                <Box
                  sx={{
                    flex: 1,
                    bgcolor: '#ffffff',
                    borderRadius: 2,
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                    border: '1px solid rgba(0, 0, 0, 0.05)',
                    p: 3,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: 0,
                    overflow: 'hidden'
                  }}
                >
                  回答者数推移（直近1週間）
                </Box>
              </Box>

              {/* 右下のContainer */}
              <Box
                sx={{
                  flex: 1,
                  bgcolor: '#ffffff',
                  borderRadius: 2,
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                  border: '1px solid rgba(0, 0, 0, 0.05)',
                  p: 3,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                最新の回答者リスト
              </Box>
            </Box>
          </Box>

          {/* ITスタートアップ風 Clean Analytics UI */}
          <Box 
            sx={{ 
              width: '100%',
              bgcolor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: 1,
              overflow: 'hidden'
            }}
          >
            {/* ミニマルヘッダー */}
            <Box
              sx={{
                borderBottom: '1px solid #e5e7eb',
                px: 6,
                py: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <Box>
                <Typography 
                  variant="h4" 
                  sx={{ 
                    fontWeight: 600, 
                    color: '#111827',
                    mb: 0.5,
                    fontSize: '1.875rem',
                    lineHeight: 1.2
                  }}
                >
                  Analytics Dashboard
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    color: '#6b7280',
                    fontSize: '1rem',
                    fontWeight: 400
                  }}
                >
                  Deep dive into survey data with advanced filtering
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                {selectedQuestions.length > 0 && (
                  <Button
                    startIcon={<Tune />}
                    onClick={() => setShowFilters(!showFilters)}
                    variant={showFilters ? 'contained' : 'outlined'}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 500,
                      borderRadius: 1.5,
                      px: 3,
                      py: 1,
                      fontSize: '0.875rem',
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
                <Box
                  sx={{
                    px: 3,
                    py: 1,
                    bgcolor: selectedQuestions.length > 0 ? '#f0f9ff' : '#f9fafb',
                    color: selectedQuestions.length > 0 ? '#0369a1' : '#6b7280',
                    borderRadius: 1.5,
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    border: '1px solid',
                    borderColor: selectedQuestions.length > 0 ? '#bae6fd' : '#e5e7eb'
                  }}
                >
                  {selectedQuestions.length > 1 ? 'Comparison Mode' : 
                   selectedQuestions.length === 1 ? 'Single Analysis' : 'Ready'}
                </Box>
              </Box>
            </Box>

            {/* クリーンなフィルターパネル */}
            <AnimatePresence>
              {showFilters && selectedQuestions.length > 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                >
                  <Box
                    sx={{
                      px: 6,
                      py: 4,
                      bgcolor: '#fafafa',
                      borderBottom: '1px solid #e5e7eb'
                    }}
                  >
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        mb: 3,
                        fontSize: '1.125rem',
                        fontWeight: 600,
                        color: '#111827'
                      }}
                    >
                      Advanced Filters
                    </Typography>
                    
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {selectedQuestions.map((question) => {
                        const filterConfig = generateFilterOptions(question);
                        
                        return (
                          <Box 
                            key={question.id}
                            sx={{
                              p: 4,
                              bgcolor: 'white',
                              border: '1px solid #e5e7eb',
                              borderRadius: 1.5
                            }}
                          >
                            <Box sx={{ mb: 3 }}>
                              <Typography 
                                variant="subtitle1" 
                                sx={{ 
                                  fontWeight: 600,
                                  color: '#111827',
                                  mb: 0.5
                                }}
                              >
                                {question.title}
                              </Typography>
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  color: '#6b7280',
                                  fontSize: '0.875rem'
                                }}
                              >
                                {question.responseCount.toLocaleString()} responses • {question.type.replace('_', ' ')}
                              </Typography>
                            </Box>

                            {/* クリーンなフィルターUI */}
                            {filterConfig.type === 'range' && (
                              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                {filterConfig.options.map((option) => (
                                  <Button
                                    key={option.value}
                                    onClick={() => updateFilter(question.id, 'range', option.value)}
                                    variant={activeFilters[question.id]?.value === option.value ? 'contained' : 'outlined'}
                                    size="small"
                                    sx={{
                                      textTransform: 'none',
                                      fontWeight: 500,
                                      borderRadius: 1,
                                      px: 2,
                                      py: 0.75,
                                      fontSize: '0.813rem',
                                      bgcolor: activeFilters[question.id]?.value === option.value ? '#111827' : 'transparent',
                                      color: activeFilters[question.id]?.value === option.value ? 'white' : '#374151',
                                      borderColor: '#d1d5db',
                                      '&:hover': {
                                        bgcolor: activeFilters[question.id]?.value === option.value ? '#1f2937' : '#f9fafb',
                                        borderColor: '#9ca3af'
                                      }
                                    }}
                                  >
                                    {option.label}
                                  </Button>
                                ))}
                              </Box>
                            )}

                            {filterConfig.type === 'select' && (
                              <FormControl size="small" sx={{ minWidth: 240 }}>
                                <Select
                                  value={activeFilters[question.id]?.value || ''}
                                  onChange={(e) => updateFilter(question.id, 'select', e.target.value)}
                                  displayEmpty
                                  sx={{
                                    borderRadius: 1,
                                    '& .MuiOutlinedInput-notchedOutline': {
                                      borderColor: '#d1d5db'
                                    }
                                  }}
                                >
                                  <MenuItem value="">All options</MenuItem>
                                  {filterConfig.options.map((option) => (
                                    <MenuItem key={option.value} value={option.value}>
                                      {option.label}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            )}

                            {filterConfig.type === 'multiselect' && (
                              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                                {filterConfig.options.map((option) => {
                                  const isSelected = activeFilters[question.id]?.value?.includes?.(option.value);
                                  return (
                                    <Button
                                      key={option.value}
                                      onClick={() => {
                                        const currentValues = activeFilters[question.id]?.value || [];
                                        const newValues = isSelected 
                                          ? currentValues.filter(v => v !== option.value)
                                          : [...currentValues, option.value];
                                        updateFilter(question.id, 'multiselect', newValues);
                                      }}
                                      variant={isSelected ? 'contained' : 'outlined'}
                                      size="small"
                                      sx={{
                                        textTransform: 'none',
                                        fontWeight: 500,
                                        borderRadius: 1,
                                        px: 2,
                                        py: 0.75,
                                        fontSize: '0.813rem',
                                        bgcolor: isSelected ? '#111827' : 'transparent',
                                        color: isSelected ? 'white' : '#374151',
                                        borderColor: '#d1d5db',
                                        '&:hover': {
                                          bgcolor: isSelected ? '#1f2937' : '#f9fafb',
                                          borderColor: '#9ca3af'
                                        }
                                      }}
                                    >
                                      {option.label}
                                    </Button>
                                  );
                                })}
                              </Box>
                            )}

                            {filterConfig.type === 'text_search' && (
                              <Box sx={{ display: 'flex', gap: 2 }}>
                                <FormControl size="small" sx={{ minWidth: 160 }}>
                                  <Select
                                    value={activeFilters[question.id]?.type || 'contains'}
                                    onChange={(e) => updateFilter(question.id, e.target.value, activeFilters[question.id]?.value || '')}
                                    sx={{
                                      borderRadius: 1,
                                      '& .MuiOutlinedInput-notchedOutline': {
                                        borderColor: '#d1d5db'
                                      }
                                    }}
                                  >
                                    {filterConfig.options.map((option) => (
                                      <MenuItem key={option.value} value={option.value}>
                                        {option.label}
                                      </MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>
                                <TextField
                                  size="small"
                                  placeholder="Search text..."
                                  value={activeFilters[question.id]?.value || ''}
                                  onChange={(e) => updateFilter(question.id, activeFilters[question.id]?.type || 'contains', e.target.value)}
                                  sx={{ 
                                    flexGrow: 1,
                                    '& .MuiOutlinedInput-root': {
                                      borderRadius: 1,
                                      '& fieldset': {
                                        borderColor: '#d1d5db'
                                      }
                                    }
                                  }}
                                />
                              </Box>
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
            <Box sx={{ px: 6, py: 6 }}>
              <Box sx={{ display: 'flex', gap: 8 }}>
                {/* 左側：質問選択エリア */}
                <Box sx={{ width: '360px', flexShrink: 0 }}>
                  <Box sx={{ mb: 4 }}>
                    <TextField
                      fullWidth
                      variant="outlined"
                      placeholder="Search questions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      InputProps={{
                        startAdornment: <Search sx={{ color: '#9ca3af', mr: 1.5, fontSize: 20 }} />,
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 1.5,
                          backgroundColor: '#fafafa',
                          '& fieldset': {
                            borderColor: '#e5e7eb'
                          },
                          '&:hover fieldset': {
                            borderColor: '#d1d5db'
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#111827',
                            borderWidth: '1px'
                          }
                        }
                      }}
                    />
                  </Box>

                  {/* 選択された質問の表示 */}
                  {selectedQuestions.length > 0 && (
                    <Box sx={{ mb: 4 }}>
                      <Typography 
                        variant="subtitle1" 
                        sx={{ 
                          mb: 2, 
                          fontWeight: 600,
                          color: '#111827',
                          fontSize: '1rem'
                        }}
                      >
                        Selected Questions ({selectedQuestions.length}/2)
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {selectedQuestions.map((question, index) => (
                          <Box
                            key={question.id}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 3,
                              p: 3,
                              bgcolor: '#f8fafc',
                              border: '1px solid #e2e8f0',
                              borderRadius: 1.5
                            }}
                          >
                            <Box
                              sx={{
                                width: 32,
                                height: 32,
                                bgcolor: '#111827',
                                color: 'white',
                                borderRadius: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <Typography sx={{ fontSize: '0.75rem', fontWeight: 700 }}>
                                {index + 1}
                              </Typography>
                            </Box>
                            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  fontWeight: 600,
                                  color: '#111827',
                                  mb: 0.5
                                }}
                              >
                                {question.title}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#6b7280' }}>
                                {question.responseCount.toLocaleString()} responses
                              </Typography>
                            </Box>
                            <IconButton
                              size="small"
                              onClick={() => handleQuestionSelect(question)}
                              sx={{ 
                                color: '#9ca3af',
                                '&:hover': { 
                                  bgcolor: '#f3f4f6',
                                  color: '#6b7280'
                                }
                              }}
                            >
                              <Clear fontSize="small" />
                            </IconButton>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  )}

                  {/* 質問リスト */}
                  <Box>
                    <Typography 
                      variant="subtitle1" 
                      sx={{ 
                        mb: 3, 
                        fontWeight: 600,
                        color: '#111827',
                        fontSize: '1rem'
                      }}
                    >
                      All Questions ({filteredQuestions.length})
                    </Typography>
                    <Box 
                      sx={{ 
                        height: selectedQuestions.length > 0 ? '400px' : '500px',
                        overflowY: 'auto',
                        pr: 1,
                        '&::-webkit-scrollbar': {
                          width: '6px'
                        },
                        '&::-webkit-scrollbar-track': {
                          background: '#f1f5f9'
                        },
                        '&::-webkit-scrollbar-thumb': {
                          background: '#cbd5e1',
                          borderRadius: '3px'
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {filteredQuestions.map((question) => {
                          const isSelected = selectedQuestions.find(q => q.id === question.id);
                          const isDisabled = !isSelected && selectedQuestions.length >= 2;
                          
                          return (
                            <Box
                              key={question.id}
                              onClick={() => !isDisabled && handleQuestionSelect(question)}
                              sx={{
                                p: 3,
                                borderRadius: 1.5,
                                border: isSelected 
                                  ? '2px solid #111827' 
                                  : '1px solid #e5e7eb',
                                bgcolor: isSelected ? '#f8fafc' : 'white',
                                cursor: isDisabled ? 'not-allowed' : 'pointer',
                                opacity: isDisabled ? 0.4 : 1,
                                transition: 'all 0.15s ease',
                                '&:hover': {
                                  transform: isDisabled ? 'none' : 'translateY(-1px)',
                                  boxShadow: isDisabled ? 'none' : '0 4px 12px rgba(0, 0, 0, 0.08)',
                                  borderColor: isDisabled ? '#e5e7eb' : '#d1d5db'
                                }
                              }}
                            >
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  fontWeight: 600,
                                  mb: 1,
                                  color: isSelected ? '#111827' : '#374151',
                                  fontSize: '0.875rem'
                                }}
                              >
                                {question.title}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Typography 
                                  variant="caption" 
                                  sx={{ 
                                    color: '#6b7280',
                                    fontSize: '0.75rem'
                                  }}
                                >
                                  {question.responseCount.toLocaleString()} responses
                                </Typography>
                                <Typography 
                                  variant="caption" 
                                  sx={{ 
                                    color: '#9ca3af',
                                    fontSize: '0.75rem'
                                  }}
                                >
                                  •
                                </Typography>
                                <Typography 
                                  variant="caption" 
                                  sx={{ 
                                    color: '#6b7280',
                                    fontSize: '0.75rem',
                                    textTransform: 'capitalize'
                                  }}
                                >
                                  {question.type.replace('_', ' ')}
                                </Typography>
                              </Box>
                            </Box>
                          );
                        })}
                      </Box>
                    </Box>
                  </Box>
                </Box>

                {/* 右側：分析結果エリア */}
                <Box sx={{ flexGrow: 1 }}>
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
                            borderRadius: 2
                          }}
                        >
                          <Box sx={{ textAlign: 'center', p: 4 }}>
                            <AutoGraph sx={{ fontSize: 64, color: '#9ca3af', mb: 2 }} />
                            <Typography 
                              variant="h6" 
                              sx={{ 
                                fontWeight: 600, 
                                mb: 1,
                                color: '#111827',
                                fontSize: '1.125rem'
                              }}
                            >
                              質問を選択してください
                            </Typography>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                mb: 3,
                                color: '#6b7280',
                                fontSize: '0.875rem'
                              }}
                            >
                              1つまたは2つの質問を選んでデータ分析を開始
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                              <Chip icon={<Poll />} label="単体分析" size="small" variant="outlined" />
                              <Chip icon={<Compare />} label="比較分析" size="small" variant="outlined" />
                              <Chip icon={<Tune />} label="フィルタリング" size="small" variant="outlined" />
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
                            borderRadius: 2,
                            border: '1px solid #e5e7eb',
                            p: 4
                          }}
                        >
                          {/* 分析結果のヘッダー */}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                            {selectedQuestions.length === 1 ? (
                              <>
                                <Box
                                  sx={{
                                    bgcolor: `${categoryColors[selectedQuestions[0].category]}20`,
                                    color: categoryColors[selectedQuestions[0].category],
                                    borderRadius: 2,
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
                                      fontSize: '1.125rem'
                                    }}
                                  >
                                    {selectedQuestions[0].title}
                                  </Typography>
                                  <Typography 
                                    variant="body2" 
                                    sx={{
                                      color: '#6b7280',
                                      fontSize: '0.875rem'
                                    }}
                                  >
                                    {selectedQuestions[0].responseCount.toLocaleString()}件の回答
                                  </Typography>
                                </Box>
                              </>
                            ) : (
                              <>
                                <Compare sx={{ fontSize: 28, color: '#6366f1' }} />
                                <Typography 
                                  variant="h6" 
                                  sx={{ 
                                    fontWeight: 600,
                                    color: '#111827',
                                    fontSize: '1.125rem'
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
                              height: '400px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: '#f9fafb',
                              border: selectedQuestions.length === 1 
                                ? `1px dashed ${categoryColors[selectedQuestions[0].category]}80`
                                : '1px dashed #6366f180',
                              borderRadius: 2
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
                                      fontSize: '1rem',
                                      fontWeight: 600
                                    }}
                                  >
                                    {selectedQuestions[0].chartType.toUpperCase().replace('_', ' ')}
                                  </Typography>
                                </>
                              ) : (
                                <>
                                  <AutoGraph sx={{ fontSize: 48, color: '#6366f1' }} />
                                  <Typography 
                                    variant="h6" 
                                    sx={{ 
                                      mt: 1, 
                                      color: '#6366f1',
                                      fontSize: '1rem',
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
                                  fontSize: '0.875rem'
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
            </Box>
          </Box>
        </Box>
      </Container>
    </motion.div>
  );
}