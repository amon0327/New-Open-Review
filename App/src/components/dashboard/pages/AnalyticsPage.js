import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Typography,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import {
  Comment,
  Store,
  LocationCity,
  TrendingUp,
  TrendingDown,
  TrendingFlat
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { supabase } from '../../../lib/supabase';

// タブパネルコンポーネント
const TabPanel = ({ children, value, index, ...other }) => (
  <Box
    role="tabpanel"
    hidden={value !== index}
    id={`analytics-tabpanel-${index}`}
    aria-labelledby={`analytics-tab-${index}`}
    sx={{ height: '100%', overflow: 'auto' }}
    {...other}
  >
    {value === index && children}
  </Box>
);

// 全店舗タブの内容
const AllStoresTab = () => (
  <Box sx={{ p: 3 }}>
    <Typography variant="h6" sx={{ color: '#64748b' }}>
      全店舗機能は開発中です
    </Typography>
  </Box>
);

// 5点移動平均を計算する関数
const calculateMovingAverage = (data, windowSize = 5) => {
  return data.map((item, index) => {
    if (index < windowSize - 1) {
      // 最初のwindowSize-1個は十分なデータがないのでnull
      return { ...item, movingAverage: null };
    }
    const sum = data
      .slice(index - windowSize + 1, index + 1)
      .reduce((acc, curr) => acc + curr.nps, 0);
    return { ...item, movingAverage: Math.round(sum / windowSize) };
  });
};

// 店舗別タブの内容
const StoreByStoreTab = ({ companyId }) => {
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30days');

  // 店舗データを取得
  useEffect(() => {
    const fetchStores = async () => {
      if (!companyId) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('stores')
          .select('id, name')
          .eq('company_id', companyId)
          .order('name');

        if (error) throw error;
        setStores(data || []);
        if (data && data.length > 0) {
          setSelectedStore(data[0].id);
        }
      } catch (error) {
        console.error('Error fetching stores:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStores();
  }, [companyId]);

  // サンプルデータ
  const metricsData = {
    totalVisits: 30624,
    avgRating: 4.3,
    conversionRate: 67.4,
    activeUsers: 126,
    monthlyGrowth: 12.5,
    quarterlyGrowth: 28.3
  };

  // 週次トレンドデータ
  const weeklyTrend = [
    { name: '月', visits: 4200, satisfaction: 85, conversion: 68 },
    { name: '火', visits: 3800, satisfaction: 82, conversion: 65 },
    { name: '水', visits: 4100, satisfaction: 88, conversion: 70 },
    { name: '木', visits: 4500, satisfaction: 87, conversion: 72 },
    { name: '金', visits: 5200, satisfaction: 90, conversion: 75 },
    { name: '土', visits: 6800, satisfaction: 89, conversion: 73 },
    { name: '日', visits: 7024, satisfaction: 91, conversion: 74 }
  ];

  // 時間帯別データ
  const hourlyData = [
    { hour: '10時', count: 120, rate: 65 },
    { hour: '11時', count: 180, rate: 68 },
    { hour: '12時', count: 320, rate: 72 },
    { hour: '13時', count: 280, rate: 70 },
    { hour: '14時', count: 210, rate: 69 },
    { hour: '15時', count: 190, rate: 67 },
    { hour: '16時', count: 220, rate: 68 },
    { hour: '17時', count: 260, rate: 71 },
    { hour: '18時', count: 340, rate: 73 },
    { hour: '19時', count: 380, rate: 75 },
    { hour: '20時', count: 290, rate: 72 },
    { hour: '21時', count: 150, rate: 68 }
  ];

  // カテゴリ別スコア
  const categoryScores = [
    { category: '品質満足度', score: 88, trend: 'up', change: 3.2 },
    { category: '価格満足度', score: 75, trend: 'stable', change: 0.5 },
    { category: 'サービス品質', score: 92, trend: 'up', change: 4.1 },
    { category: '清潔感', score: 94, trend: 'up', change: 2.8 },
    { category: '利便性', score: 81, trend: 'down', change: -1.2 },
    { category: '独自性', score: 78, trend: 'up', change: 5.6 }
  ];

  // 顧客セグメント
  const customerSegments = [
    { name: '新規顧客', value: 35, color: '#5e17eb' },
    { name: 'リピーター', value: 45, color: '#22c55e' },
    { name: '常連客', value: 20, color: '#f59e0b' }
  ];

  return (
    <Box sx={{ 
      p: 2,
      backgroundColor: '#f8fafc',
      minHeight: '100%',
      overflowY: 'auto'
    }}>
      {/* ヘッダー部分 */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        mb: 3,
        backgroundColor: '#fff',
        p: 2.5,
        borderRadius: 2,
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b', mb: 0.5 }}>
            店舗分析ダッシュボード
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            リアルタイムデータと詳細な分析指標
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <Select
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              disabled={isLoading}
              sx={{ backgroundColor: '#fff' }}
            >
              {stores.map((store) => (
                <MenuItem key={store.id} value={store.id}>
                  {store.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              sx={{ backgroundColor: '#fff' }}
            >
              <MenuItem value="7days">過去7日間</MenuItem>
              <MenuItem value="30days">過去30日間</MenuItem>
              <MenuItem value="90days">過去90日間</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* メトリクスカード */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2, mb: 3 }}>
        {[
          { label: '総訪問数', value: metricsData.totalVisits.toLocaleString(), change: '+12.5%', icon: '👥', color: '#5e17eb' },
          { label: '平均評価', value: metricsData.avgRating, change: '+0.3', icon: '⭐', color: '#f59e0b' },
          { label: 'コンバージョン率', value: `${metricsData.conversionRate}%`, change: '+5.2%', icon: '📈', color: '#22c55e' },
          { label: 'アクティブユーザー', value: metricsData.activeUsers, change: '+8', icon: '👤', color: '#3b82f6' }
        ].map((metric, index) => (
          <Box
            key={index}
            sx={{
              backgroundColor: '#fff',
              p: 2.5,
              borderRadius: 2,
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
                {metric.label}
              </Typography>
              <Box sx={{ 
                width: 40, 
                height: 40, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                borderRadius: '10px',
                backgroundColor: `${metric.color}15`,
                fontSize: '20px'
              }}>
                {metric.icon}
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b' }}>
                {metric.value}
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: metric.change.startsWith('+') ? '#22c55e' : '#ef4444',
                  fontWeight: 600,
                  backgroundColor: metric.change.startsWith('+') ? '#22c55e15' : '#ef444415',
                  px: 1,
                  py: 0.3,
                  borderRadius: 1,
                  fontSize: '0.75rem'
                }}
              >
                {metric.change}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>

      {/* メインチャートエリア */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: 2, mb: 3 }}>
        {/* 週次トレンドチャート */}
        <Box sx={{
          backgroundColor: '#fff',
          p: 3,
          borderRadius: 2,
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: '#1e293b' }}>
            週次パフォーマンストレンド
          </Typography>
          <Box sx={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: 'none', 
                    borderRadius: 8,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  }}
                  itemStyle={{ color: '#fff' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="visits" 
                  stroke="#5e17eb" 
                  strokeWidth={3}
                  dot={{ fill: '#5e17eb', r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="satisfaction" 
                  stroke="#22c55e" 
                  strokeWidth={3}
                  dot={{ fill: '#22c55e', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </Box>

        {/* 顧客セグメント円グラフ */}
        <Box sx={{
          backgroundColor: '#fff',
          p: 3,
          borderRadius: 2,
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: '#1e293b' }}>
            顧客セグメント分布
          </Typography>
          <Box sx={{ position: 'relative', height: 300 }}>
            <Box sx={{ 
              position: 'absolute', 
              top: '50%', 
              left: '50%', 
              transform: 'translate(-50%, -50%)',
              textAlign: 'center'
            }}>
              <Typography variant="h3" sx={{ fontWeight: 700, color: '#1e293b' }}>
                {customerSegments.reduce((acc, seg) => acc + seg.value, 0)}%
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                総計
              </Typography>
            </Box>
            {/* 円グラフ風の表示 */}
            <Box sx={{ mt: 8 }}>
              {customerSegments.map((segment, index) => (
                <Box key={index} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: segment.color }} />
                      <Typography variant="body2" sx={{ color: '#64748b' }}>
                        {segment.name}
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>
                      {segment.value}%
                    </Typography>
                  </Box>
                  <Box sx={{ 
                    width: '100%', 
                    height: 8, 
                    backgroundColor: '#f1f5f9', 
                    borderRadius: 4,
                    overflow: 'hidden'
                  }}>
                    <Box sx={{ 
                      width: `${segment.value}%`, 
                      height: '100%', 
                      backgroundColor: segment.color,
                      borderRadius: 4,
                      transition: 'width 0.6s ease'
                    }} />
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      </Box>

      {/* カテゴリ別スコアと時間帯別分析 */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 2 }}>
        {/* カテゴリ別スコア */}
        <Box sx={{
          backgroundColor: '#fff',
          p: 3,
          borderRadius: 2,
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: '#1e293b' }}>
            カテゴリ別パフォーマンス
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {categoryScores.map((category, index) => (
              <Box key={index}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
                    {category.category}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>
                      {category.score}%
                    </Typography>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: category.trend === 'up' ? '#22c55e' : category.trend === 'down' ? '#ef4444' : '#94a3b8',
                        fontWeight: 600
                      }}
                    >
                      {category.trend === 'up' ? '↑' : category.trend === 'down' ? '↓' : '→'} {Math.abs(category.change)}%
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ 
                  width: '100%', 
                  height: 6, 
                  backgroundColor: '#f1f5f9', 
                  borderRadius: 3,
                  overflow: 'hidden'
                }}>
                  <Box sx={{ 
                    width: `${category.score}%`, 
                    height: '100%', 
                    backgroundColor: category.score >= 90 ? '#22c55e' : category.score >= 80 ? '#3b82f6' : category.score >= 70 ? '#f59e0b' : '#ef4444',
                    borderRadius: 3,
                    transition: 'width 0.6s ease'
                  }} />
                </Box>
              </Box>
            ))}
          </Box>
        </Box>

        {/* 時間帯別分析 */}
        <Box sx={{
          backgroundColor: '#fff',
          p: 3,
          borderRadius: 2,
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: '#1e293b' }}>
            時間帯別アクティビティ
          </Typography>
          <Box sx={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="hour" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: 'none', 
                    borderRadius: 8,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  }}
                  itemStyle={{ color: '#fff' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#5e17eb" 
                  strokeWidth={2}
                  dot={{ fill: '#5e17eb', r: 3 }}
                  activeDot={{ r: 5 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="rate" 
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  dot={{ fill: '#f59e0b', r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

// リアルタイムタブの内容
const RealtimeTab = () => (
  <Box sx={{ p: 3 }}>
    <Typography variant="h6" sx={{ color: '#64748b' }}>
      リアルタイム機能は開発中です
    </Typography>
  </Box>
);

export default function AnalyticsPage({ onNavCollapse, companyId }) {
  const [activeTab, setActiveTab] = useState(0);

  // マウント時にサイドバーを縮める
  useEffect(() => {
    if (onNavCollapse) {
      onNavCollapse(true);
    }
    return () => {
      if (onNavCollapse) {
        onNavCollapse(false);
      }
    };
  }, [onNavCollapse]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{
      width: '100%',
      height: '100%',
      backgroundColor: '#fff',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* タブヘッダー */}
      <Box sx={{
        borderBottom: '1px solid #e2e8f0',
        backgroundColor: '#fff'
      }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          sx={{
            minHeight: 56,
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.95rem',
              minHeight: 56,
              px: 3,
              color: '#64748b',
              '&.Mui-selected': {
                color: '#5e17eb'
              }
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#5e17eb',
              height: 3
            }
          }}
        >
          <Tab
            icon={<LocationCity sx={{ fontSize: 20 }} />}
            iconPosition="start"
            label="全店舗"
          />
          <Tab
            icon={<Store sx={{ fontSize: 20 }} />}
            iconPosition="start"
            label="店舗別"
          />
          <Tab
            icon={<Comment sx={{ fontSize: 20 }} />}
            iconPosition="start"
            label="リアルタイム"
          />
        </Tabs>
      </Box>

      {/* タブコンテンツ */}
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        <TabPanel value={activeTab} index={0}>
          <AllStoresTab />
        </TabPanel>
        <TabPanel value={activeTab} index={1}>
          <StoreByStoreTab companyId={companyId} />
        </TabPanel>
        <TabPanel value={activeTab} index={2}>
          <RealtimeTab />
        </TabPanel>
      </Box>
    </Box>
  );
}
