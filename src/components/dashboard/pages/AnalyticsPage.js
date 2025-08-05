import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  Paper,
  Divider
} from '@mui/material';
import {
  TrendingUp,
  Assessment,
  Quiz,
  Group,
  Today,
  Refresh,
  Download,
  FilterList,
  Timeline,
  PieChart,
  BarChart,
  ShowChart
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Cell,
  BarChart as RechartsBarChart,
  Bar,
  RadialBarChart,
  RadialBar,
  Legend,
  Pie
} from 'recharts';
import { format } from 'date-fns';
import { AnalyticsService } from '../../../services/AnalyticsService';
import { useResponsive } from '../../../hooks/useResponsive';

// カラーパレット
const COLORS = {
  primary: '#5e17eb',
  secondary: '#667eea',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  chart: ['#5e17eb', '#667eea', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16']
};

// カスタムカードコンポーネント
const StatCard = ({ title, value, change, icon, color, isLoading }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <Card
      sx={{
        borderRadius: 3,
        border: '1px solid rgba(255, 255, 255, 0.1)',
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.85) 100%)',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)'
        }
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            {isLoading ? (
              <CircularProgress size={24} sx={{ color }} />
            ) : (
              <Typography variant="h4" fontWeight="700" color={color}>
                {value}
              </Typography>
            )}
            {change && (
              <Chip
                label={change}
                size="small"
                sx={{
                  mt: 1,
                  backgroundColor: change.startsWith('+') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  color: change.startsWith('+') ? '#10b981' : '#ef4444',
                  fontWeight: '600'
                }}
              />
            )}
          </Box>
          <Avatar
            sx={{
              backgroundColor: `${color}15`,
              color: color,
              width: 56,
              height: 56
            }}
          >
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  </motion.div>
);

// チャートカードコンポーネント
const ChartCard = ({ title, children, actions, height = 300 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
  >
    <Card
      sx={{
        borderRadius: 3,
        border: '1px solid rgba(255, 255, 255, 0.1)',
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.85) 100%)',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        height: '100%'
      }}
    >
      <CardContent sx={{ p: 3, height: '100%' }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h6" fontWeight="600" color="text.primary">
            {title}
          </Typography>
          {actions && (
            <Box display="flex" gap={1}>
              {actions}
            </Box>
          )}
        </Box>
        <Box height={height}>
          {children}
        </Box>
      </CardContent>
    </Card>
  </motion.div>
);

export default function AnalyticsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(30);
  const [basicStats, setBasicStats] = useState({});
  const [timeSeriesData, setTimeSeriesData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [formPerformance, setFormPerformance] = useState([]);
  const [questionTypeData, setQuestionTypeData] = useState([]);
  const [todayStats, setTodayStats] = useState({});
  const [responseQuality, setResponseQuality] = useState({});
  
  // レスポンシブ対応
  const { isMobile, isTablet, isDesktop } = useResponsive();
  
  // ダミーユーザーID（実際の実装では認証システムから取得）
  const userId = 'dummy-user-id';

  const loadAnalyticsData = async () => {
    setIsLoading(true);
    try {
      const [
        basicStatsData,
        timeSeriesData,
        categoryData,
        formPerformanceData,
        questionTypeData,
        todayStatsData,
        responseQualityData
      ] = await Promise.all([
        AnalyticsService.getBasicStats(userId),
        AnalyticsService.getTimeSeriesData(userId, timeRange),
        AnalyticsService.getCategoryAnalysis(userId),
        AnalyticsService.getFormPerformance(userId),
        AnalyticsService.getQuestionTypeAnalysis(userId),
        AnalyticsService.getTodayStats(userId),
        AnalyticsService.getResponseQualityAnalysis(userId)
      ]);

      setBasicStats(basicStatsData);
      setTimeSeriesData(timeSeriesData);
      setCategoryData(categoryData);
      setFormPerformance(formPerformanceData);
      setQuestionTypeData(questionTypeData);
      setTodayStats(todayStatsData);
      setResponseQuality(responseQualityData);
    } catch (error) {
      console.error('分析データ読み込みエラー:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange]);

  const handleTimeRangeChange = (event) => {
    setTimeRange(event.target.value);
  };

  const handleRefresh = () => {
    loadAnalyticsData();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Box sx={{ p: isMobile ? 2 : 3, bgcolor: '#f8fafc', minHeight: '100vh' }}>
        {/* ヘッダー */}
        <Box 
          display="flex" 
          alignItems={isMobile ? "flex-start" : "center"} 
          justifyContent="space-between" 
          flexDirection={isMobile ? "column" : "row"}
          gap={isMobile ? 2 : 0}
          mb={4}
        >
          <Box>
            <Typography variant={isMobile ? "h5" : "h4"} fontWeight="700" color="text.primary" gutterBottom>
              分析ダッシュボード
            </Typography>
            <Typography variant="body1" color="text.secondary">
              レビューフォームのパフォーマンスと回答データを詳細に分析
            </Typography>
          </Box>
          
          <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
            <FormControl size="small" sx={{ minWidth: isMobile ? 100 : 120 }}>
              <InputLabel>期間</InputLabel>
              <Select
                value={timeRange}
                label="期間"
                onChange={handleTimeRangeChange}
              >
                <MenuItem value={7}>過去7日</MenuItem>
                <MenuItem value={30}>過去30日</MenuItem>
                <MenuItem value={90}>過去90日</MenuItem>
              </Select>
            </FormControl>
            
            <Tooltip title="データを更新">
              <IconButton onClick={handleRefresh} sx={{ bgcolor: 'white', boxShadow: 1 }}>
                <Refresh />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="レポートをダウンロード">
              <IconButton sx={{ bgcolor: 'white', boxShadow: 1 }}>
                <Download />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* 統計カード */}
        <Grid container spacing={isMobile ? 2 : 3} mb={4}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="総フォーム数"
              value={basicStats.totalForms || 0}
              change="+12%"
              icon={<Assessment />}
              color={COLORS.primary}
              isLoading={isLoading}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="総回答数"
              value={basicStats.totalSubmissions || 0}
              change="+24%"
              icon={<Group />}
              color={COLORS.success}
              isLoading={isLoading}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="今日の回答"
              value={todayStats.todaySubmissions || 0}
              change="+8%"
              icon={<Today />}
              color={COLORS.info}
              isLoading={isLoading}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="平均評価"
              value={responseQuality.averageRating || 0}
              change="+0.2"
              icon={<TrendingUp />}
              color={COLORS.warning}
              isLoading={isLoading}
            />
          </Grid>
        </Grid>

        {/* チャートエリア */}
        <Grid container spacing={isMobile ? 2 : 3}>
          {/* 時系列チャート */}
          <Grid item xs={12} lg={8}>
            <ChartCard
              title="回答数推移"
              actions={[
                <Tooltip key="timeline" title="時系列表示">
                  <IconButton size="small">
                    <Timeline />
                  </IconButton>
                </Tooltip>
              ]}
              height={isMobile ? 250 : 350}
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeSeriesData}>
                  <defs>
                    <linearGradient id="colorSubmissions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => format(new Date(value), 'MM/dd')}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <RechartsTooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: 'none',
                      borderRadius: '8px',
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="submissions"
                    stroke={COLORS.primary}
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorSubmissions)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          </Grid>

          {/* 質問タイプ分布 */}
          <Grid item xs={12} lg={4}>
            <ChartCard
              title="質問タイプ分布"
              actions={[
                <Tooltip key="pie" title="円グラフ表示">
                  <IconButton size="small">
                    <PieChart />
                  </IconButton>
                </Tooltip>
              ]}
              height={isMobile ? 250 : 350}
            >
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={questionTypeData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {questionTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS.chart[index % COLORS.chart.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </RechartsPieChart>
              </ResponsiveContainer>
            </ChartCard>
          </Grid>

          {/* カテゴリ別分析 */}
          <Grid item xs={12} md={6}>
            <ChartCard
              title="質問カテゴリ分析"
              actions={[
                <Tooltip key="bar" title="棒グラフ表示">
                  <IconButton size="small">
                    <BarChart />
                  </IconButton>
                </Tooltip>
              ]}
              height={isMobile ? 250 : 300}
            >
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={categoryData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    tick={{ fontSize: 11 }}
                    width={100}
                  />
                  <RechartsTooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: 'none',
                      borderRadius: '8px',
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Bar 
                    dataKey="count" 
                    fill={COLORS.secondary}
                    radius={[0, 4, 4, 0]}
                  />
                </RechartsBarChart>
              </ResponsiveContainer>
            </ChartCard>
          </Grid>

          {/* 評価分布 */}
          <Grid item xs={12} md={6}>
            <ChartCard
              title="評価分布"
              actions={[
                <Tooltip key="radial" title="レーダーチャート表示">
                  <IconButton size="small">
                    <ShowChart />
                  </IconButton>
                </Tooltip>
              ]}
              height={isMobile ? 250 : 300}
            >
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart 
                  cx="50%" 
                  cy="50%" 
                  innerRadius="20%" 
                  outerRadius="80%" 
                  data={responseQuality.distribution || []}
                >
                  <RadialBar
                    dataKey="percentage"
                    cornerRadius={10}
                    fill={COLORS.success}
                  />
                  <RechartsTooltip />
                  <Legend />
                </RadialBarChart>
              </ResponsiveContainer>
            </ChartCard>
          </Grid>

          {/* フォームパフォーマンス */}
          <Grid item xs={12}>
            <ChartCard
              title="フォーム別パフォーマンス"
              height={isMobile ? 300 : 400}
            >
              <Box sx={{ overflowX: 'auto' }}>
                {formPerformance.map((form, index) => (
                  <Box key={form.id} sx={{ mb: 2, p: 2, bgcolor: 'rgba(0, 0, 0, 0.02)', borderRadius: 2 }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography variant="subtitle1" fontWeight="600">
                          {form.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          作成日: {format(new Date(form.createdAt), 'yyyy/MM/dd')}
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Chip
                          label={form.status === 'published' ? '公開中' : '下書き'}
                          color={form.status === 'published' ? 'success' : 'default'}
                          size="small"
                        />
                        <Typography variant="h6" color={COLORS.primary}>
                          {form.submissions}回答
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                ))}
              </Box>
            </ChartCard>
          </Grid>
        </Grid>
      </Box>
    </motion.div>
  );
}