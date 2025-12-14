import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Typography,
  FormControl,
  Select,
  MenuItem,
  InputLabel
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

  // サンプルNPSデータ（2週間間隔）- NPSは推奨者% - 批判者%で-100〜+100の範囲
  const sampleNpsData = useMemo(() => {
    const baseData = [
      { date: '10/1', nps: 15 },
      { date: '10/15', nps: 22 },
      { date: '10/29', nps: 18 },
      { date: '11/12', nps: 25 },
      { date: '11/26', nps: 32 },
      { date: '12/10', nps: 28 },
      { date: '12/24', nps: 35 },
      { date: '1/7', nps: 30 },
      { date: '1/21', nps: 38 },
      { date: '2/4', nps: 25 },  // 最新値は scoreDistribution から計算（45% - 20% = 25）
    ];
    return calculateMovingAverage(baseData);
  }, []);

  // 推奨/中立/批判の割合データ
  const scoreDistribution = useMemo(() => ({
    promoters: 45,    // 推奨者 (9-10)
    passives: 35,     // 中立者 (7-8)
    detractors: 20    // 批判者 (0-6)
  }), []);

  // 推奨スコアとトレンド（移動平均との差分）- NPS = 推奨者% - 批判者%
  const currentNps = useMemo(() => {
    // 推奨スコアは推奨者% - 批判者%で計算
    const calculatedNps = scoreDistribution.promoters - scoreDistribution.detractors;
    const latestMA = sampleNpsData[sampleNpsData.length - 1]?.movingAverage || 0;
    const diff = latestMA ? calculatedNps - latestMA : 0;
    return { score: calculatedNps, diff, trend: diff > 0 ? 'up' : diff < 0 ? 'down' : 'flat' };
  }, [sampleNpsData, scoreDistribution]);

  // グラフの縦軸範囲を動的に計算（データに合わせて最大限変動を見せる）- NPSは-100〜+100
  const yAxisDomain = useMemo(() => {
    const npsValues = sampleNpsData.map(d => d.nps);
    const minValue = Math.min(...npsValues);
    const maxValue = Math.max(...npsValues);
    const padding = Math.ceil((maxValue - minValue) * 0.15);
    return [Math.max(-100, minValue - padding), Math.min(100, maxValue + padding)];
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

  // 追加指標データ（トレンド付き）
  const additionalMetrics = useMemo(() => ({
    repeatRate: {
      value: 68,
      change: 3,
      trend: 'up'
    },
    revisitIntention: {
      value: 72,
      change: -2,
      trend: 'down'
    }
  }), []);

  return (
    <Box sx={{ p: 3 }}>
      {/* ドロップダウンエリア */}
      <Box sx={{
        display: 'flex',
        gap: 2,
        mb: 4,
        flexWrap: 'wrap'
      }}>
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

      {/* 推奨スコアトレンドグラフ */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: '#1e293b', letterSpacing: '0.05em' }}>
          推奨スコアトレンド
        </Typography>
        <Box sx={{ height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sampleNpsData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={yAxisDomain}
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 12,
                  color: '#fff'
                }}
                formatter={(value, name) => [
                  `${value}`,
                  name === 'nps' ? 'スコア' : '移動平均'
                ]}
              />
              <Line
                type="monotone"
                dataKey="nps"
                stroke="#5e17eb"
                strokeWidth={2}
                dot={{ r: 4, fill: '#5e17eb', strokeWidth: 0 }}
                activeDot={{ r: 6, fill: '#5e17eb' }}
              />
              <Line
                type="monotone"
                dataKey="movingAverage"
                stroke="#94a3b8"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
        <Box sx={{ display: 'flex', gap: 4, mt: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 16, height: 2, backgroundColor: '#5e17eb' }} />
            <Typography variant="caption" sx={{ color: '#94a3b8' }}>スコア</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 16, height: 2, backgroundColor: '#94a3b8', borderStyle: 'dashed' }} />
            <Typography variant="caption" sx={{ color: '#94a3b8' }}>5期移動平均</Typography>
          </Box>
        </Box>
      </Box>

      {/* 指標エリア: 左にスコア分布、右に3つの指標 */}
      <Box sx={{ display: 'flex', gap: 4, borderTop: '1px solid #e2e8f0', pt: 3 }}>
        {/* 左側: スコア分布（横棒グラフ） */}
        <Box sx={{ flex: 1 }}>
          <Typography variant="caption" sx={{ color: '#94a3b8', letterSpacing: '0.08em', display: 'block', mb: 2, textTransform: 'uppercase' }}>
            スコア分布
          </Typography>

          {/* 推奨 */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2" sx={{ color: '#64748b', fontSize: 13 }}>推奨</Typography>
              <Typography variant="body2" sx={{ color: '#1e293b', fontWeight: 600, fontSize: 13 }}>{scoreDistribution.promoters}%</Typography>
            </Box>
            <Box sx={{ height: 6, backgroundColor: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
              <Box sx={{
                width: `${scoreDistribution.promoters}%`,
                height: '100%',
                backgroundColor: '#22c55e',
                borderRadius: 3,
                transition: 'width 0.4s ease'
              }} />
            </Box>
          </Box>

          {/* 中立 */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2" sx={{ color: '#64748b', fontSize: 13 }}>中立</Typography>
              <Typography variant="body2" sx={{ color: '#1e293b', fontWeight: 600, fontSize: 13 }}>{scoreDistribution.passives}%</Typography>
            </Box>
            <Box sx={{ height: 6, backgroundColor: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
              <Box sx={{
                width: `${scoreDistribution.passives}%`,
                height: '100%',
                backgroundColor: '#94a3b8',
                borderRadius: 3,
                transition: 'width 0.4s ease'
              }} />
            </Box>
          </Box>

          {/* 批判 */}
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2" sx={{ color: '#64748b', fontSize: 13 }}>批判</Typography>
              <Typography variant="body2" sx={{ color: '#1e293b', fontWeight: 600, fontSize: 13 }}>{scoreDistribution.detractors}%</Typography>
            </Box>
            <Box sx={{ height: 6, backgroundColor: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
              <Box sx={{
                width: `${scoreDistribution.detractors}%`,
                height: '100%',
                backgroundColor: '#ef4444',
                borderRadius: 3,
                transition: 'width 0.4s ease'
              }} />
            </Box>
          </Box>
        </Box>

        {/* 右側: 3つの指標（横並び） */}
        <Box sx={{ display: 'flex', flex: 1, borderLeft: '1px solid #e2e8f0' }}>
          {/* 推奨スコア */}
          <Box sx={{ flex: 1, textAlign: 'center', py: 2 }}>
            <Typography variant="caption" sx={{ color: '#94a3b8', letterSpacing: '0.08em', display: 'block', mb: 1, textTransform: 'uppercase', fontSize: 10 }}>
              推奨スコア
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mb: 1 }}>
              <Typography sx={{ fontSize: 40, fontWeight: 700, color: '#1e293b', lineHeight: 1 }}>
                {currentNps.score}
              </Typography>
              {getTrendIcon(currentNps.trend)}
            </Box>
            <Box sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.5,
              backgroundColor: currentNps.diff > 0 ? '#dcfce7' : currentNps.diff < 0 ? '#fee2e2' : '#f1f5f9',
              px: 1.5,
              py: 0.5,
              borderRadius: 1
            }}>
              <Typography variant="caption" sx={{ color: '#64748b', fontSize: 10 }}>
                移動平均
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: currentNps.diff > 0 ? '#16a34a' : currentNps.diff < 0 ? '#dc2626' : '#64748b',
                  fontWeight: 600,
                  fontSize: 11
                }}
              >
                {currentNps.diff > 0 ? '+' : ''}{currentNps.diff}
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mt: 1, fontSize: 10 }}>
              推奨者% − 批判者%
            </Typography>
          </Box>

          {/* 区切り線 */}
          <Box sx={{ width: '1px', backgroundColor: '#e2e8f0' }} />

          {/* リピート率 */}
          <Box sx={{ flex: 1, textAlign: 'center', py: 2 }}>
            <Typography variant="caption" sx={{ color: '#94a3b8', letterSpacing: '0.08em', display: 'block', mb: 1, textTransform: 'uppercase', fontSize: 10 }}>
              リピート率
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mb: 1 }}>
              <Typography sx={{ fontSize: 40, fontWeight: 700, color: '#1e293b', lineHeight: 1 }}>
                {additionalMetrics.repeatRate.value}
                <Typography component="span" sx={{ fontSize: 18, fontWeight: 500, color: '#64748b' }}>%</Typography>
              </Typography>
              {getTrendIcon(additionalMetrics.repeatRate.trend)}
            </Box>
            <Box sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.5,
              backgroundColor: additionalMetrics.repeatRate.change > 0 ? '#dcfce7' : additionalMetrics.repeatRate.change < 0 ? '#fee2e2' : '#f1f5f9',
              px: 1.5,
              py: 0.5,
              borderRadius: 1
            }}>
              <Typography variant="caption" sx={{ color: '#64748b', fontSize: 10 }}>
                前期比
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: additionalMetrics.repeatRate.change > 0 ? '#16a34a' : additionalMetrics.repeatRate.change < 0 ? '#dc2626' : '#64748b',
                  fontWeight: 600,
                  fontSize: 11
                }}
              >
                {additionalMetrics.repeatRate.change > 0 ? '+' : ''}{additionalMetrics.repeatRate.change}%
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mt: 1, fontSize: 10 }}>
              2回以上来店した顧客の割合
            </Typography>
          </Box>

          {/* 区切り線 */}
          <Box sx={{ width: '1px', backgroundColor: '#e2e8f0' }} />

          {/* 3ヶ月以内再来意向率 */}
          <Box sx={{ flex: 1, textAlign: 'center', py: 2 }}>
            <Typography variant="caption" sx={{ color: '#94a3b8', letterSpacing: '0.08em', display: 'block', mb: 1, textTransform: 'uppercase', fontSize: 10 }}>
              3ヶ月以内再来意向
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mb: 1 }}>
              <Typography sx={{ fontSize: 40, fontWeight: 700, color: '#1e293b', lineHeight: 1 }}>
                {additionalMetrics.revisitIntention.value}
                <Typography component="span" sx={{ fontSize: 18, fontWeight: 500, color: '#64748b' }}>%</Typography>
              </Typography>
              {getTrendIcon(additionalMetrics.revisitIntention.trend)}
            </Box>
            <Box sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.5,
              backgroundColor: additionalMetrics.revisitIntention.change > 0 ? '#dcfce7' : additionalMetrics.revisitIntention.change < 0 ? '#fee2e2' : '#f1f5f9',
              px: 1.5,
              py: 0.5,
              borderRadius: 1
            }}>
              <Typography variant="caption" sx={{ color: '#64748b', fontSize: 10 }}>
                前期比
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: additionalMetrics.revisitIntention.change > 0 ? '#16a34a' : additionalMetrics.revisitIntention.change < 0 ? '#dc2626' : '#64748b',
                  fontWeight: 600,
                  fontSize: 11
                }}
              >
                {additionalMetrics.revisitIntention.change > 0 ? '+' : ''}{additionalMetrics.revisitIntention.change}%
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mt: 1, fontSize: 10 }}>
              また来たいと回答した割合
            </Typography>
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
