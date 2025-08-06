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
  const [filters, setFilters] = useState({});
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
    } else if (selectedQuestions.length < 2) {
      setSelectedQuestions([...selectedQuestions, question]);
    }
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

          {/* 新しい高度な質問分析システム */}
          <Paper
            elevation={3}
            sx={{
              width: '100%',
              borderRadius: 4,
              overflow: 'hidden',
              background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)',
              mb: 3
            }}
          >
            {/* プレミアムヘッダー */}
            <Box
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
                color: 'white',
                p: 4,
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.1 }}>
                <Box
                  sx={{
                    position: 'absolute',
                    top: '-50%',
                    left: '-50%',
                    width: '200%',
                    height: '200%',
                    background: 'radial-gradient(circle, rgba(255,255,255,0.2) 1px, transparent 1px)',
                    backgroundSize: '30px 30px',
                    animation: 'float 6s ease-in-out infinite'
                  }}
                />
              </Box>
              
              <Box sx={{ position: 'relative', zIndex: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar
                      sx={{
                        bgcolor: 'rgba(255, 255, 255, 0.2)',
                        width: 48,
                        height: 48,
                        backdropFilter: 'blur(10px)'
                      }}
                    >
                      <Insights sx={{ fontSize: 24 }} />
                    </Avatar>
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                        Advanced Analytics
                      </Typography>
                      <Typography variant="body1" sx={{ opacity: 0.9 }}>
                        質問を選択してデータを深掘り分析
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Chip
                      icon={<Analytics />}
                      label={`${questionsDatabase.length}個の質問`}
                      sx={{
                        bgcolor: 'rgba(255, 255, 255, 0.15)',
                        color: 'white',
                        fontWeight: 600,
                        backdropFilter: 'blur(10px)'
                      }}
                    />
                    <Chip
                      icon={<Compare />}
                      label={selectedQuestions.length > 1 ? '比較分析モード' : '単体分析モード'}
                      color={selectedQuestions.length > 1 ? 'secondary' : 'default'}
                      sx={{
                        bgcolor: selectedQuestions.length > 1 ? 'rgba(240, 147, 251, 0.8)' : 'rgba(255, 255, 255, 0.15)',
                        color: 'white',
                        fontWeight: 600,
                        backdropFilter: 'blur(10px)'
                      }}
                    />
                  </Box>
                </Box>

                {/* 選択された質問の表示 */}
                <AnimatePresence>
                  {selectedQuestions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          gap: 2,
                          mt: 3,
                          p: 2,
                          bgcolor: 'rgba(255, 255, 255, 0.1)',
                          borderRadius: 2,
                          backdropFilter: 'blur(10px)'
                        }}
                      >
                        {selectedQuestions.map((question, index) => (
                          <Chip
                            key={question.id}
                            icon={getChartIcon(question.chartType)}
                            label={`${index + 1}. ${question.title}`}
                            onDelete={() => handleQuestionSelect(question)}
                            deleteIcon={<Clear />}
                            sx={{
                              bgcolor: 'rgba(255, 255, 255, 0.9)',
                              color: categoryColors[question.category],
                              fontWeight: 600,
                              '& .MuiChip-deleteIcon': {
                                color: 'rgba(255, 255, 255, 0.7)',
                                '&:hover': {
                                  color: 'white'
                                }
                              }
                            }}
                          />
                        ))}
                        {selectedQuestions.length < 2 && (
                          <Chip
                            icon={<Add />}
                            label={selectedQuestions.length === 0 ? "質問を選択" : "比較する質問を追加"}
                            variant="outlined"
                            sx={{
                              borderColor: 'rgba(255, 255, 255, 0.5)',
                              color: 'rgba(255, 255, 255, 0.8)',
                              '&:hover': {
                                bgcolor: 'rgba(255, 255, 255, 0.1)'
                              }
                            }}
                          />
                        )}
                      </Box>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Box>
            </Box>

            {/* メインコンテンツエリア */}
            <Box sx={{ p: 4 }}>
              <Grid container spacing={4}>
                {/* 質問選択サイドバー */}
                <Grid item xs={12} lg={4}>
                  <Card 
                    elevation={2}
                    sx={{ 
                      height: '600px',
                      borderRadius: 3,
                      border: '1px solid rgba(0, 0, 0, 0.08)',
                      background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)'
                    }}
                  >
                    <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                        <Search color="primary" />
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          質問を選択
                        </Typography>
                        <Badge
                          badgeContent={selectedQuestions.length}
                          color="primary"
                          sx={{ ml: 'auto' }}
                        >
                          <Chip
                            label={`${filteredQuestions.length}個`}
                            size="small"
                            color="default"
                            variant="outlined"
                          />
                        </Badge>
                      </Box>

                      {/* 検索バー */}
                      <TextField
                        fullWidth
                        variant="outlined"
                        placeholder="質問を検索..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{
                          startAdornment: <Search sx={{ color: 'text.secondary', mr: 1 }} />
                        }}
                        sx={{ mb: 3 }}
                      />

                      {/* 質問リスト */}
                      <Box sx={{ flexGrow: 1, overflowY: 'auto', pr: 1 }}>
                        <AnimatePresence>
                          {filteredQuestions.map((question, index) => {
                            const isSelected = selectedQuestions.find(q => q.id === question.id);
                            const isDisabled = !isSelected && selectedQuestions.length >= 2;
                            
                            return (
                              <motion.div
                                key={question.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ delay: index * 0.05 }}
                              >
                                <Card
                                  sx={{
                                    mb: 2,
                                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                                    borderRadius: 2,
                                    border: isSelected 
                                      ? `2px solid ${categoryColors[question.category]}` 
                                      : '1px solid rgba(0, 0, 0, 0.08)',
                                    opacity: isDisabled ? 0.5 : 1,
                                    background: isSelected 
                                      ? `linear-gradient(135deg, ${categoryColors[question.category]}15 0%, ${categoryColors[question.category]}08 100%)`
                                      : 'white',
                                    transition: 'all 0.2s ease-in-out',
                                    '&:hover': {
                                      transform: isDisabled ? 'none' : 'translateY(-2px)',
                                      boxShadow: isDisabled ? 'none' : `0 8px 25px ${categoryColors[question.category]}20`
                                    }
                                  }}
                                  onClick={() => !isDisabled && handleQuestionSelect(question)}
                                >
                                  <CardContent sx={{ p: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                                      <Avatar
                                        sx={{
                                          bgcolor: `${categoryColors[question.category]}20`,
                                          color: categoryColors[question.category],
                                          width: 40,
                                          height: 40
                                        }}
                                      >
                                        {getChartIcon(question.chartType)}
                                      </Avatar>
                                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                        <Typography 
                                          variant="subtitle2" 
                                          sx={{ 
                                            fontWeight: 600,
                                            mb: 0.5,
                                            color: isSelected ? categoryColors[question.category] : 'text.primary'
                                          }}
                                        >
                                          {question.title}
                                        </Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                          <Chip
                                            size="small"
                                            label={question.category}
                                            sx={{
                                              fontSize: '0.7rem',
                                              height: 20,
                                              bgcolor: `${categoryColors[question.category]}15`,
                                              color: categoryColors[question.category],
                                              fontWeight: 500
                                            }}
                                          />
                                          <Typography variant="caption" color="text.secondary">
                                            {question.responseCount.toLocaleString()}件
                                          </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                          {getQuestionIcon(question.type)}
                                          <Typography variant="caption" color="text.secondary">
                                            {question.type.replace('_', ' ')}
                                          </Typography>
                                        </Box>
                                      </Box>
                                      {isSelected && (
                                        <IconButton
                                          size="small"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleQuestionSelect(question);
                                          }}
                                          sx={{ color: categoryColors[question.category] }}
                                        >
                                          <Clear fontSize="small" />
                                        </IconButton>
                                      )}
                                    </Box>
                                  </CardContent>
                                </Card>
                              </motion.div>
                            );
                          })}
                        </AnimatePresence>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* 分析結果エリア */}
                <Grid item xs={12} lg={8}>
                  <AnimatePresence mode="wait">
                    {selectedQuestions.length === 0 ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <Card
                          sx={{
                            height: '600px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: 3,
                            background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
                            border: '2px dashed #e2e8f0'
                          }}
                        >
                          <Box sx={{ textAlign: 'center', p: 4 }}>
                            <AutoGraph sx={{ fontSize: 80, color: '#cbd5e0', mb: 3 }} />
                            <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, color: 'text.primary' }}>
                              分析を始めましょう
                            </Typography>
                            <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 400 }}>
                              左側から1つまたは2つの質問を選択して、詳細なデータ分析と可視化を開始してください
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                              <Chip icon={<Poll />} label="単一質問分析" variant="outlined" />
                              <Chip icon={<Compare />} label="比較・クロス分析" variant="outlined" />
                              <Chip icon={<Tune />} label="高度なフィルタリング" variant="outlined" />
                            </Box>
                          </Box>
                        </Card>
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.4 }}
                      >
                        <Card
                          elevation={2}
                          sx={{
                            minHeight: '600px',
                            borderRadius: 3,
                            border: '1px solid rgba(0, 0, 0, 0.08)',
                            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)'
                          }}
                        >
                          <CardContent sx={{ p: 4 }}>
                            {selectedQuestions.length === 1 ? (
                              // 単一質問分析
                              <Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                                  <Avatar
                                    sx={{
                                      bgcolor: `${categoryColors[selectedQuestions[0].category]}20`,
                                      color: categoryColors[selectedQuestions[0].category],
                                      width: 48,
                                      height: 48
                                    }}
                                  >
                                    {getChartIcon(selectedQuestions[0].chartType)}
                                  </Avatar>
                                  <Box>
                                    <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
                                      {selectedQuestions[0].title}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                      {selectedQuestions[0].responseCount.toLocaleString()}件の回答 • {selectedQuestions[0].type.replace('_', ' ')}
                                    </Typography>
                                  </Box>
                                </Box>

                                {/* グラフプレースホルダー */}
                                <Card
                                  variant="outlined"
                                  sx={{
                                    minHeight: '400px',
                                    borderRadius: 2,
                                    border: `2px dashed ${categoryColors[selectedQuestions[0].category]}40`
                                  }}
                                >
                                  <CardContent sx={{ p: 4, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Box sx={{ textAlign: 'center' }}>
                                      {getChartIcon(selectedQuestions[0].chartType)}
                                      <Typography variant="h6" sx={{ mt: 2, color: categoryColors[selectedQuestions[0].category] }}>
                                        {selectedQuestions[0].chartType.toUpperCase().replace('_', ' ')} グラフ
                                      </Typography>
                                      <Typography variant="body2" color="text.secondary">
                                        Chart.js / Recharts 実装予定
                                      </Typography>
                                    </Box>
                                  </CardContent>
                                </Card>
                              </Box>
                            ) : (
                              // 比較分析
                              <Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                                  <Compare sx={{ fontSize: 32, color: '#667eea' }} />
                                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                                    比較・クロス分析
                                  </Typography>
                                </Box>

                                <Grid container spacing={3}>
                                  {selectedQuestions.map((question, index) => (
                                    <Grid item xs={12} md={6} key={question.id}>
                                      <Card
                                        variant="outlined"
                                        sx={{
                                          minHeight: '300px',
                                          borderRadius: 2,
                                          border: `2px dashed ${categoryColors[question.category]}40`
                                        }}
                                      >
                                        <CardContent sx={{ p: 3 }}>
                                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                                            <Avatar
                                              sx={{
                                                bgcolor: `${categoryColors[question.category]}20`,
                                                color: categoryColors[question.category],
                                                width: 40,
                                                height: 40
                                              }}
                                            >
                                              {getChartIcon(question.chartType)}
                                            </Avatar>
                                            <Box>
                                              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                                {question.title}
                                              </Typography>
                                              <Typography variant="caption" color="text.secondary">
                                                {question.responseCount.toLocaleString()}件
                                              </Typography>
                                            </Box>
                                          </Box>

                                          <Box sx={{ textAlign: 'center', py: 4 }}>
                                            {getChartIcon(question.chartType)}
                                            <Typography variant="body2" sx={{ mt: 1, color: categoryColors[question.category] }}>
                                              {question.chartType.replace('_', ' ')}
                                            </Typography>
                                          </Box>
                                        </CardContent>
                                      </Card>
                                    </Grid>
                                  ))}

                                  {/* クロス分析結果 */}
                                  <Grid item xs={12}>
                                    <Card
                                      variant="outlined"
                                      sx={{
                                        minHeight: '200px',
                                        borderRadius: 2,
                                        border: '2px dashed #667eea40',
                                        background: 'linear-gradient(135deg, #667eea10 0%, #764ba210 100%)'
                                      }}
                                    >
                                      <CardContent sx={{ p: 4, textAlign: 'center' }}>
                                        <AutoGraph sx={{ fontSize: 48, color: '#667eea', mb: 2 }} />
                                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                                          クロス分析結果
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                          2つの質問の相関関係と組み合わせ分析
                                        </Typography>
                                      </CardContent>
                                    </Card>
                                  </Grid>
                                </Grid>
                              </Box>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Box>
      </Container>
    </motion.div>
  );
}