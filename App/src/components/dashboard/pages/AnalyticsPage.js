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
  Paper
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
  const [selectedQSC, setSelectedQSC] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // QSCオプション
  const qscOptions = [
    { value: 'quality', label: 'Quality（品質）' },
    { value: 'service', label: 'Service（サービス）' },
    { value: 'cleanliness', label: 'Cleanliness（清潔さ）' }
  ];

  // サンプルNPSデータ（2週間間隔）
  const sampleNpsData = useMemo(() => {
    const baseData = [
      { date: '10/1', nps: 35 },
      { date: '10/15', nps: 42 },
      { date: '10/29', nps: 38 },
      { date: '11/12', nps: 45 },
      { date: '11/26', nps: 52 },
      { date: '12/10', nps: 48 },
      { date: '12/24', nps: 55 },
      { date: '1/7', nps: 50 },
      { date: '1/21', nps: 58 },
      { date: '2/4', nps: 62 },
    ];
    return calculateMovingAverage(baseData);
  }, []);

  // 推奨/中立/批判の割合データ
  const scoreDistribution = useMemo(() => ({
    promoters: 45,    // 推奨者 (9-10)
    passives: 35,     // 中立者 (7-8)
    detractors: 20    // 批判者 (0-6)
  }), []);

  // NPSスコアとトレンド
  const currentNps = useMemo(() => {
    const latest = sampleNpsData[sampleNpsData.length - 1]?.nps || 0;
    const previous = sampleNpsData[sampleNpsData.length - 2]?.nps || 0;
    const change = latest - previous;
    return { score: latest, change, trend: change > 0 ? 'up' : change < 0 ? 'down' : 'flat' };
  }, [sampleNpsData]);

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
      } catch (error) {
        console.error('Error fetching stores:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStores();
  }, [companyId]);

  // トレンドアイコンを取得
  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up':
        return <TrendingUp sx={{ color: '#22c55e', fontSize: 28 }} />;
      case 'down':
        return <TrendingDown sx={{ color: '#ef4444', fontSize: 28 }} />;
      default:
        return <TrendingFlat sx={{ color: '#64748b', fontSize: 28 }} />;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* ドロップダウンエリア */}
      <Box sx={{
        display: 'flex',
        gap: 2,
        mb: 3,
        flexWrap: 'wrap'
      }}>
        {/* 店舗選択ドロップダウン */}
        <FormControl sx={{ minWidth: 200 }} size="small">
          <InputLabel>店舗を選択</InputLabel>
          <Select
            value={selectedStore}
            label="店舗を選択"
            onChange={(e) => setSelectedStore(e.target.value)}
            disabled={isLoading}
          >
            {stores.map((store) => (
              <MenuItem key={store.id} value={store.id}>
                {store.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* QSC選択ドロップダウン */}
        <FormControl sx={{ minWidth: 200 }} size="small">
          <InputLabel>QSCを選択</InputLabel>
          <Select
            value={selectedQSC}
            label="QSCを選択"
            onChange={(e) => setSelectedQSC(e.target.value)}
          >
            {qscOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* NPSトレンドグラフ */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }} elevation={0} variant="outlined">
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#1e293b' }}>
          推奨スコア（NPS）トレンド
        </Typography>
        <Box sx={{ height: 300, width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sampleNpsData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12, fill: '#64748b' }}
                axisLine={{ stroke: '#e2e8f0' }}
              />
              <YAxis
                domain={[-100, 100]}
                tick={{ fontSize: 12, fill: '#64748b' }}
                axisLine={{ stroke: '#e2e8f0' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                formatter={(value, name) => [
                  value,
                  name === 'nps' ? 'NPSスコア' : '5期移動平均'
                ]}
              />
              <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="5 5" />
              {/* 実際のNPSスコア（点） */}
              <Line
                type="monotone"
                dataKey="nps"
                stroke="#5e17eb"
                strokeWidth={2}
                dot={{ r: 5, fill: '#5e17eb', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 7, fill: '#5e17eb' }}
              />
              {/* 5点移動平均線 */}
              <Line
                type="monotone"
                dataKey="movingAverage"
                stroke="#f97316"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
        <Box sx={{ display: 'flex', gap: 3, mt: 2, justifyContent: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 20, height: 3, backgroundColor: '#5e17eb', borderRadius: 1 }} />
            <Typography variant="body2" sx={{ color: '#64748b' }}>NPSスコア</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 20, height: 3, backgroundColor: '#f97316', borderRadius: 1, borderStyle: 'dashed' }} />
            <Typography variant="body2" sx={{ color: '#64748b' }}>5期移動平均</Typography>
          </Box>
        </Box>
      </Paper>

      {/* 推奨/中立/批判の割合 */}
      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        {/* トレンド表示 */}
        <Paper sx={{
          p: 3,
          borderRadius: 2,
          minWidth: 180,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }} elevation={0} variant="outlined">
          <Typography variant="body2" sx={{ color: '#64748b', mb: 1 }}>
            現在のNPS
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h3" sx={{ fontWeight: 700, color: '#1e293b' }}>
              {currentNps.score}
            </Typography>
            {getTrendIcon(currentNps.trend)}
          </Box>
          <Typography
            variant="body2"
            sx={{
              color: currentNps.change > 0 ? '#22c55e' : currentNps.change < 0 ? '#ef4444' : '#64748b',
              fontWeight: 600,
              mt: 1
            }}
          >
            {currentNps.change > 0 ? '+' : ''}{currentNps.change} ポイント
          </Typography>
          <Typography variant="caption" sx={{ color: '#94a3b8' }}>
            前回比
          </Typography>
        </Paper>

        {/* 横棒グラフ */}
        <Paper sx={{
          p: 3,
          borderRadius: 2,
          flex: 1,
          minWidth: 300
        }} elevation={0} variant="outlined">
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1e293b', mb: 2 }}>
            スコア分布
          </Typography>

          {/* 横棒グラフ */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{
              display: 'flex',
              height: 32,
              borderRadius: 2,
              overflow: 'hidden',
              backgroundColor: '#f1f5f9'
            }}>
              {/* 推奨者（緑） */}
              <Box sx={{
                width: `${scoreDistribution.promoters}%`,
                backgroundColor: '#22c55e',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'width 0.3s ease'
              }}>
                <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600, fontSize: 12 }}>
                  {scoreDistribution.promoters}%
                </Typography>
              </Box>
              {/* 中立者（グレー） */}
              <Box sx={{
                width: `${scoreDistribution.passives}%`,
                backgroundColor: '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'width 0.3s ease'
              }}>
                <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600, fontSize: 12 }}>
                  {scoreDistribution.passives}%
                </Typography>
              </Box>
              {/* 批判者（赤） */}
              <Box sx={{
                width: `${scoreDistribution.detractors}%`,
                backgroundColor: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'width 0.3s ease'
              }}>
                <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600, fontSize: 12 }}>
                  {scoreDistribution.detractors}%
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* 凡例 */}
          <Box sx={{ display: 'flex', gap: 3, justifyContent: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#22c55e' }} />
              <Typography variant="body2" sx={{ color: '#64748b' }}>推奨（9-10）</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#94a3b8' }} />
              <Typography variant="body2" sx={{ color: '#64748b' }}>中立（7-8）</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#ef4444' }} />
              <Typography variant="body2" sx={{ color: '#64748b' }}>批判（0-6）</Typography>
            </Box>
          </Box>
        </Paper>
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
