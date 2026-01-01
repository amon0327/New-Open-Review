import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Typography
} from '@mui/material';
import {
  Comment,
  Store,
  LocationCity
} from '@mui/icons-material';
import { supabase } from '../../../lib/supabase';
import {
  Card,
  Metric,
  Text,
  Title,
  BarList,
  Flex,
  Grid,
  Col,
  DonutChart,
  AreaChart,
  BadgeDelta,
  DeltaType,
  CategoryBar,
  Legend,
  TabGroup,
  TabList,
  Tab as TremorTab,
  TabPanels,
  TabPanel as TremorTabPanel,
  Select,
  SelectItem,
  MultiSelect,
  MultiSelectItem,
  DateRangePicker,
  DateRangePickerItem,
  LineChart as TremorLineChart,
  ProgressBar,
  Callout,
  Subtitle,
  Divider,
  BarChart,
  Tracker,
  NumberInput
} from '@tremor/react';
import {
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowRightIcon,
  ChartBarIcon,
  ClockIcon,
  UserGroupIcon,
  ShoppingCartIcon,
  CurrencyYenIcon,
  CalendarIcon,
  TrendingUpIcon,
  ExclamationIcon
} from '@heroicons/react/24/outline';
import { format, subDays } from 'date-fns';
import { ja } from 'date-fns/locale';

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

// KPIデータのタイプ定義
const deltaTypes = {
  increase: 'moderateIncrease',
  decrease: 'moderateDecrease',
  unchanged: 'unchanged'
};

// 店舗別タブの内容
const StoreByStoreTab = ({ companyId }) => {
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 30),
    to: new Date()
  });

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

  // KPIデータ
  const kpiData = [
    {
      title: '総売上高',
      metric: '¥3,456,890',
      progress: 78.9,
      target: '¥4,000,000',
      delta: '12.3%',
      deltaType: 'moderateIncrease',
      icon: CurrencyYenIcon
    },
    {
      title: '来店客数',
      metric: '12,450',
      progress: 65.2,
      target: '15,000',
      delta: '23.1%',
      deltaType: 'moderateIncrease',
      icon: UserGroupIcon
    },
    {
      title: '平均客単価',
      metric: '¥2,780',
      progress: 92.5,
      target: '¥3,000',
      delta: '-3.2%',
      deltaType: 'moderateDecrease',
      icon: ShoppingCartIcon
    },
    {
      title: '顧客満足度',
      metric: '4.6',
      progress: 92,
      target: '5.0',
      delta: '8.5%',
      deltaType: 'moderateIncrease',
      icon: ChartBarIcon
    }
  ];

  // 売上トレンドデータ
  const salesTrendData = [
    { date: '2024-01-01', 売上高: 2890000, 前年同期: 2390000, 客数: 890 },
    { date: '2024-01-02', 売上高: 3120000, 前年同期: 2790000, 客数: 920 },
    { date: '2024-01-03', 売上高: 3456000, 前年同期: 3100000, 客数: 1050 },
    { date: '2024-01-04', 売上高: 3890000, 前年同期: 3290000, 客数: 1180 },
    { date: '2024-01-05', 売上高: 4120000, 前年同期: 3590000, 客数: 1320 },
    { date: '2024-01-06', 売上高: 4560000, 前年同期: 3890000, 客数: 1450 },
    { date: '2024-01-07', 売上高: 4890000, 前年同期: 4190000, 客数: 1580 }
  ];

  // カテゴリ別売上
  const categorySales = [
    { name: 'ドリンク', value: 45678900, share: 35 },
    { name: 'フード', value: 38902340, share: 30 },
    { name: 'デザート', value: 25678900, share: 20 },
    { name: 'その他', value: 19456780, share: 15 }
  ];

  // 店舗パフォーマンス
  const storePerformance = [
    { name: '渋谷店', sales: 8900000, target: 9000000, satisfaction: 4.5 },
    { name: '新宿店', sales: 7800000, target: 8000000, satisfaction: 4.3 },
    { name: '池袋店', sales: 6500000, target: 7000000, satisfaction: 4.6 },
    { name: '品川店', sales: 5200000, target: 6000000, satisfaction: 4.4 },
    { name: '上野店', sales: 4300000, target: 5000000, satisfaction: 4.7 }
  ];

  // 時間帯別データ
  const hourlyPerformance = [
    { hour: '10:00', orders: 45, revenue: 156000 },
    { hour: '11:00', orders: 78, revenue: 234000 },
    { hour: '12:00', orders: 156, revenue: 467000 },
    { hour: '13:00', orders: 134, revenue: 402000 },
    { hour: '14:00', orders: 89, revenue: 267000 },
    { hour: '15:00', orders: 67, revenue: 201000 },
    { hour: '16:00', orders: 78, revenue: 234000 },
    { hour: '17:00', orders: 112, revenue: 336000 },
    { hour: '18:00', orders: 189, revenue: 567000 },
    { hour: '19:00', orders: 223, revenue: 669000 },
    { hour: '20:00', orders: 178, revenue: 534000 },
    { hour: '21:00', orders: 89, revenue: 267000 }
  ];

  // 顧客セグメント
  const customerSegments = [
    { segment: '新規顧客', value: 35, count: 4358 },
    { segment: 'リピーター', value: 45, count: 5603 },
    { segment: '常連客', value: 20, count: 2489 }
  ];

  // Trackerデータ（アラート表示用）
  const alertsData = [
    { color: 'emerald', tooltip: '正常' },
    { color: 'emerald', tooltip: '正常' },
    { color: 'yellow', tooltip: '在庫少' },
    { color: 'emerald', tooltip: '正常' },
    { color: 'red', tooltip: 'スタッフ不足' },
    { color: 'emerald', tooltip: '正常' },
    { color: 'emerald', tooltip: '正常' },
    { color: 'yellow', tooltip: '混雑' },
    { color: 'emerald', tooltip: '正常' },
    { color: 'emerald', tooltip: '正常' }
  ];

  return (
    <Box sx={{ 
      p: 3,
      backgroundColor: '#f9fafb',
      minHeight: '100%',
      overflowY: 'auto'
    }}>
      {/* ヘッダーセクション */}
      <Flex justifyContent="between" alignItems="center" className="mb-6">
        <div>
          <Title>店舗分析ダッシュボード</Title>
          <Text className="mt-1">リアルタイムデータと詳細な分析指標</Text>
        </div>
        <Flex justifyContent="end" className="space-x-2">
          <Select
            value={selectedStore}
            onValueChange={setSelectedStore}
            placeholder="店舗を選択"
            className="w-56"
          >
            <SelectItem value="all" text="全店舗" />
            {stores.map((store) => (
              <SelectItem key={store.id} value={store.id} text={store.name} />
            ))}
          </Select>
          <DateRangePicker
            value={dateRange}
            onValueChange={setDateRange}
            placeholder="期間を選択"
            className="w-72"
            locale={ja}
          />
        </Flex>
      </Flex>

      {/* アラート表示 */}
      <Callout
        className="mb-6"
        title="本日のアラート"
        icon={ExclamationIcon}
        color="yellow"
      >
        <Text>渋谷店で在庫不足、新宿店でスタッフ不足が発生しています。</Text>
        <Tracker data={alertsData} className="mt-3" />
      </Callout>

      {/* KPIカード */}
      <Grid numItemsSm={2} numItemsLg={4} className="gap-6 mb-6">
        {kpiData.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.title} decoration="top" decorationColor="indigo">
              <Flex justifyContent="start" className="space-x-4">
                <Icon className="h-12 w-12 text-indigo-600" />
                <div className="truncate">
                  <Text>{kpi.title}</Text>
                  <Metric className="truncate">{kpi.metric}</Metric>
                </div>
              </Flex>
              <Flex className="mt-4 space-x-2">
                <BadgeDelta deltaType={kpi.deltaType} size="xs">
                  {kpi.delta}
                </BadgeDelta>
                <Text className="truncate text-xs">目標: {kpi.target}</Text>
              </Flex>
              <ProgressBar
                value={kpi.progress}
                className="mt-3"
                color="indigo"
              />
            </Card>
          );
        })}
      </Grid>

      {/* メインチャートエリア */}
      <Grid numItemsSm={1} numItemsLg={3} className="gap-6 mb-6">
        {/* 売上トレンド */}
        <Col numColSpan={1} numColSpanLg={2}>
          <Card>
            <Title>売上トレンド</Title>
            <Subtitle>前年同期比較</Subtitle>
            <AreaChart
              className="h-80 mt-4"
              data={salesTrendData}
              index="date"
              categories={["売上高", "前年同期"]}
              colors={["indigo", "gray"]}
              valueFormatter={(value) => `¥${(value / 1000000).toFixed(1)}M`}
              showLegend
              showYAxis
              showGradient
              curveType="natural"
            />
          </Card>
        </Col>

        {/* カテゴリ別売上 */}
        <Card>
          <Title>カテゴリ別売上</Title>
          <DonutChart
            className="h-80 mt-4"
            data={categorySales}
            category="share"
            index="name"
            valueFormatter={(value) => `¥${(value / 1000000).toFixed(1)}M`}
            colors={["indigo", "cyan", "amber", "emerald"]}
            showLabel
            showTooltip
          />
          <Legend
            categories={categorySales.map(c => c.name)}
            colors={["indigo", "cyan", "amber", "emerald"]}
            className="mt-3"
          />
        </Card>
      </Grid>

      {/* 店舗パフォーマンス */}
      <Card className="mb-6">
        <Title>店舗別パフォーマンス</Title>
        <TabGroup className="mt-2">
          <TabList>
            <TremorTab>売上達成率</TremorTab>
            <TremorTab>顧客満足度</TremorTab>
            <TremorTab>時間帯別パフォーマンス</TremorTab>
          </TabList>
          <TabPanels>
            <TremorTabPanel>
              <Card className="mt-4">
                <BarList
                  data={storePerformance.map(store => ({
                    name: store.name,
                    value: (store.sales / store.target) * 100,
                    sales: `¥${(store.sales / 1000000).toFixed(1)}M`,
                    target: `¥${(store.target / 1000000).toFixed(1)}M`
                  }))}
                  valueFormatter={(value) => `${value.toFixed(1)}%`}
                  color="indigo"
                  showAnimation
                />
              </Card>
            </TremorTabPanel>
            <TremorTabPanel>
              <Card className="mt-4">
                <BarList
                  data={storePerformance.map(store => ({
                    name: store.name,
                    value: store.satisfaction,
                    rating: store.satisfaction
                  }))}
                  valueFormatter={(value) => value.toFixed(1)}
                  color="emerald"
                  showAnimation
                />
              </Card>
            </TremorTabPanel>
            <TremorTabPanel>
              <Card className="mt-4">
                <BarChart
                  className="h-80"
                  data={hourlyPerformance}
                  index="hour"
                  categories={["orders", "revenue"]}
                  colors={["indigo", "emerald"]}
                  valueFormatter={(value) => 
                    typeof value === 'number' && value > 1000 
                      ? `¥${(value / 1000).toFixed(0)}K` 
                      : value.toString()
                  }
                  showLegend
                  showYAxis={false}
                  showGridLines
                  stack={false}
                />
              </Card>
            </TremorTabPanel>
          </TabPanels>
        </TabGroup>
      </Card>

      {/* 顧客分析セクション */}
      <Grid numItemsSm={1} numItemsLg={2} className="gap-6">
        {/* 顧客セグメント */}
        <Card>
          <Title>顧客セグメント分析</Title>
          <Flex className="mt-4">
            <Text>合計顧客数</Text>
            <Text className="font-semibold">{customerSegments.reduce((acc, seg) => acc + seg.count, 0).toLocaleString()}</Text>
          </Flex>
          <CategoryBar
            values={customerSegments.map(seg => seg.value)}
            colors={["amber", "emerald", "indigo"]}
            markerValue={0}
            className="mt-3"
          />
          <Legend
            categories={customerSegments.map(seg => `${seg.segment} (${seg.count.toLocaleString()}人)`)}
            colors={["amber", "emerald", "indigo"]}
            className="mt-3"
          />
        </Card>

        {/* リアルタイムメトリクス */}
        <Card>
          <Title>リアルタイムメトリクス</Title>
          <Grid numItemsLg={2} className="mt-4 gap-4">
            <Card decoration="left" decorationColor="emerald">
              <Flex alignItems="start">
                <div>
                  <Text>現在の来店客数</Text>
                  <Metric>234</Metric>
                </div>
                <BadgeDelta deltaType="moderateIncrease">12%</BadgeDelta>
              </Flex>
            </Card>
            <Card decoration="left" decorationColor="red">
              <Flex alignItems="start">
                <div>
                  <Text>平均滞在時間</Text>
                  <Metric>42分</Metric>
                </div>
                <BadgeDelta deltaType="moderateDecrease">-5%</BadgeDelta>
              </Flex>
            </Card>
            <Card decoration="left" decorationColor="gray">
              <Flex alignItems="start">
                <div>
                  <Text>待ち時間</Text>
                  <Metric>8分</Metric>
                </div>
                <BadgeDelta deltaType="unchanged">0%</BadgeDelta>
              </Flex>
            </Card>
            <Card decoration="left" decorationColor="emerald">
              <Flex alignItems="start">
                <div>
                  <Text>スタッフ稼働率</Text>
                  <Metric>87%</Metric>
                </div>
                <BadgeDelta deltaType="moderateIncrease">3%</BadgeDelta>
              </Flex>
            </Card>
          </Grid>
        </Card>
      </Grid>
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
