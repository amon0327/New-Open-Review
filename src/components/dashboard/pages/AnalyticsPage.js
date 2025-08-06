import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Box, 
  Container, 
  Tabs, 
  Tab, 
  Typography, 
  Paper,
  Grid,
  Chip,
  Card,
  CardContent,
  ButtonGroup,
  Button,
  Divider
} from '@mui/material';
import {
  BarChart,
  PieChart,
  TrendingUp,
  FilterList,
  Analytics
} from '@mui/icons-material';

export default function AnalyticsPage() {
  const [selectedQuestion, setSelectedQuestion] = useState(0);
  const [selectedAttribute, setSelectedAttribute] = useState('all');

  // モックデータ: 質問とそのデータ
  const questionData = [
    {
      id: 1,
      title: "商品の味について",
      type: "rating", // rating, choice, text
      chartType: "bar", // bar, pie, line
      data: {
        labels: ['とても美味しい', '美味しい', '普通', 'イマイチ', '不満'],
        values: [45, 38, 12, 3, 2],
        total: 100
      },
      analysis: {
        summary: "83%のユーザーが「美味しい」以上の評価をしており、味に対する満足度は高い水準です。",
        trend: "前月比で「とても美味しい」の回答が8%増加しています。",
        insights: [
          "20-30代女性からの評価が特に高い",
          "リピート率との相関が強い（r=0.87）",
          "SNS投稿率も高評価ユーザーで2.3倍高い"
        ]
      }
    },
    {
      id: 2,
      title: "価格の妥当性について",
      type: "choice",
      chartType: "pie",
      data: {
        labels: ['とても安い', '安い', '適正', '高い', 'とても高い'],
        values: [5, 23, 52, 18, 2],
        total: 100
      },
      analysis: {
        summary: "80%のユーザーが価格を適正または安いと感じており、価格設定は適切です。",
        trend: "原材料費上昇の影響で「高い」の回答が前月比3%増加。",
        insights: [
          "年収400万円以下では「高い」回答率が28%",
          "競合商品Aより15%高いが満足度は上回る",
          "まとめ買いユーザーの価格満足度が高い"
        ]
      }
    },
    {
      id: 3,
      title: "購入頻度について",
      type: "frequency",
      chartType: "line",
      data: {
        labels: ['週1回以上', '月2-3回', '月1回', '2-3ヶ月に1回', '半年に1回以下'],
        values: [12, 28, 35, 20, 5],
        total: 100
      },
      analysis: {
        summary: "75%のユーザーが月1回以上購入しており、リピート率は良好です。",
        trend: "サブスクリプション開始後、週1回以上の購入が4%増加。",
        insights: [
          "定期購入ユーザーの満足度が単発購入より23%高い",
          "季節商品の影響で冬季は購入頻度が15%上昇",
          "初回購入から2回目までの期間が短いほど継続率が高い"
        ]
      }
    }
  ];

  // 属性フィルターのオプション
  const attributeOptions = [
    { value: 'all', label: 'すべて', count: 1250 },
    { value: 'age_20s', label: '20代', count: 380 },
    { value: 'age_30s', label: '30代', count: 420 },
    { value: 'age_40s', label: '40代以上', count: 450 },
    { value: 'gender_male', label: '男性', count: 580 },
    { value: 'gender_female', label: '女性', count: 670 },
    { value: 'new_user', label: '新規ユーザー', count: 320 },
    { value: 'repeat_user', label: 'リピーター', count: 930 }
  ];
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
          height: '100vh',
          width: '100%',
          m: 0,
          p: 0,
          bgcolor: '#f5f5f5',
          overflow: 'hidden'
        }}
      >
        {/* メインコンテンツエリア */}
        <Box
          sx={{
            width: '100%',
            height: '100%',
            pt: 3,
            pl: 3,
            pr: 3,
            pb: 3,
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
            bgcolor: '#f8fafc',
            overflow: 'hidden',
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

          {/* 質問分析エリア */}
          <Paper
            elevation={2}
            sx={{
              width: '100%',
              minHeight: '600px',
              borderRadius: 3,
              overflow: 'hidden',
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              border: '1px solid rgba(0, 0, 0, 0.05)',
              mb: 3
            }}
          >
            {/* ヘッダー部分 */}
            <Box
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                p: 3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Analytics sx={{ fontSize: 28 }} />
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  質問別データ分析
                </Typography>
              </Box>
              <Chip
                label={`${questionData[selectedQuestion]?.data.total || 0}件の回答`}
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  fontWeight: 600
                }}
              />
            </Box>

            {/* 質問選択タブ */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: '#f8fafc' }}>
              <Tabs
                value={selectedQuestion}
                onChange={(e, newValue) => setSelectedQuestion(newValue)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                  '& .MuiTab-root': {
                    textTransform: 'none',
                    fontWeight: 500,
                    fontSize: '0.95rem',
                    minHeight: 48
                  },
                  '& .Mui-selected': {
                    fontWeight: 700
                  }
                }}
              >
                {questionData.map((question, index) => (
                  <Tab
                    key={question.id}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {question.chartType === 'bar' && <BarChart fontSize="small" />}
                        {question.chartType === 'pie' && <PieChart fontSize="small" />}
                        {question.chartType === 'line' && <TrendingUp fontSize="small" />}
                        {question.title}
                      </Box>
                    }
                  />
                ))}
              </Tabs>
            </Box>

            {/* メインコンテンツエリア */}
            <Box sx={{ p: 3 }}>
              <Grid container spacing={3}>
                {/* 属性フィルター */}
                <Grid item xs={12}>
                  <Card variant="outlined" sx={{ mb: 2 }}>
                    <CardContent sx={{ pb: '16px !important', minHeight: 'auto' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <FilterList color="primary" />
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          属性フィルター
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {attributeOptions.map((option) => (
                          <Chip
                            key={option.value}
                            label={`${option.label} (${option.count})`}
                            onClick={() => setSelectedAttribute(option.value)}
                            color={selectedAttribute === option.value ? 'primary' : 'default'}
                            variant={selectedAttribute === option.value ? 'filled' : 'outlined'}
                            sx={{
                              fontWeight: selectedAttribute === option.value ? 600 : 400,
                              '&:hover': {
                                bgcolor: selectedAttribute === option.value ? 'primary.dark' : 'action.hover'
                              }
                            }}
                          />
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* グラフエリア */}
                <Grid item xs={12} lg={8}>
                  <Card variant="outlined" sx={{ minHeight: '500px', height: 'auto' }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                        {questionData[selectedQuestion]?.title}
                      </Typography>
                      
                      {/* グラフプレースホルダー */}
                      <Box
                        sx={{
                          minHeight: '400px',
                          height: 'auto',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: '#f8fafc',
                          borderRadius: 2,
                          border: '2px dashed #e2e8f0',
                          p: 3
                        }}
                      >
                        <Box sx={{ textAlign: 'center' }}>
                          {questionData[selectedQuestion]?.chartType === 'bar' && <BarChart sx={{ fontSize: 48, color: '#667eea', mb: 1 }} />}
                          {questionData[selectedQuestion]?.chartType === 'pie' && <PieChart sx={{ fontSize: 48, color: '#667eea', mb: 1 }} />}
                          {questionData[selectedQuestion]?.chartType === 'line' && <TrendingUp sx={{ fontSize: 48, color: '#667eea', mb: 1 }} />}
                          <Typography variant="body1" color="text.secondary">
                            {questionData[selectedQuestion]?.chartType.toUpperCase()}グラフ
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            グラフライブラリ実装予定
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* 分析・傾向エリア */}
                <Grid item xs={12} lg={4}>
                  <Card variant="outlined" sx={{ minHeight: '500px', height: 'auto' }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                        データ分析・傾向
                      </Typography>
                      
                      {/* サマリー */}
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 600, mb: 1 }}>
                          概要
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
                          {questionData[selectedQuestion]?.analysis.summary}
                        </Typography>
                      </Box>

                      <Divider sx={{ my: 2 }} />

                      {/* トレンド */}
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" sx={{ color: 'warning.main', fontWeight: 600, mb: 1 }}>
                          トレンド
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
                          {questionData[selectedQuestion]?.analysis.trend}
                        </Typography>
                      </Box>

                      <Divider sx={{ my: 2 }} />

                      {/* インサイト */}
                      <Box>
                        <Typography variant="subtitle2" sx={{ color: 'success.main', fontWeight: 600, mb: 1 }}>
                          重要なインサイト
                        </Typography>
                        <Box component="ul" sx={{ m: 0, pl: 2 }}>
                          {questionData[selectedQuestion]?.analysis.insights.map((insight, index) => (
                            <Typography
                              key={index}
                              component="li"
                              variant="body2"
                              sx={{ color: 'text.secondary', lineHeight: 1.6, mb: 0.5 }}
                            >
                              {insight}
                            </Typography>
                          ))}
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Box>
      </Container>
    </motion.div>
  );
}