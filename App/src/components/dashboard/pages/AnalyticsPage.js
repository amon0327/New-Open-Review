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
  LineChart,
  SparkAreaChart,
  SparkLineChart,
  ProgressBar,
  Callout,
  Subtitle,
  Divider,
  BarChart,
  Tracker,
  NumberInput,
  List,
  ListItem,
  Icon,
  Bold
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
  ArrowTrendingUpIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  LightBulbIcon
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

// 店舗別タブの内容 - 超モダンなダッシュボード
const StoreByStoreTab = ({ companyId }) => {
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [isLoading, setIsLoading] = useState(true);

  // 店舗データ取得
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
        console.error('Error:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStores();
  }, [companyId]);

  // リアルタイムメトリクスデータ
  const [realtimeData, setRealtimeData] = useState({
    activeUsers: 342,
    ordersPerMinute: 12.5,
    avgWaitTime: 3.2,
    satisfaction: 94.5
  });

  // リアルタイム更新シミュレーション
  useEffect(() => {
    const interval = setInterval(() => {
      setRealtimeData(prev => ({
        activeUsers: Math.max(0, prev.activeUsers + Math.floor(Math.random() * 21) - 10),
        ordersPerMinute: Math.max(0, +(prev.ordersPerMinute + (Math.random() * 2 - 1)).toFixed(1)),
        avgWaitTime: Math.max(0, +(prev.avgWaitTime + (Math.random() * 0.4 - 0.2)).toFixed(1)),
        satisfaction: Math.min(100, Math.max(80, +(prev.satisfaction + (Math.random() * 1 - 0.5)).toFixed(1)))
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // KPIカード設定
  const kpiCards = [
    {
      title: "本日の売上",
      metric: "¥4,892,450",
      progress: 82,
      target: "¥6,000,000",
      delta: "+23.5%",
      deltaType: "increase",
      sparklineData: [30, 35, 40, 38, 45, 50, 48, 55, 60, 58, 65, 70]
    },
    {
      title: "来店客数",
      metric: "2,847",
      progress: 71,
      target: "4,000",
      delta: "+12.3%",
      deltaType: "increase",
      sparklineData: [20, 25, 23, 30, 35, 33, 40, 38, 45, 50, 48, 55]
    },
    {
      title: "平均客単価",
      metric: "¥1,719",
      progress: 95,
      target: "¥1,800",
      delta: "+5.8%",
      deltaType: "increase",
      sparklineData: [1600, 1650, 1620, 1680, 1700, 1690, 1710, 1705, 1720, 1715, 1719, 1719]
    },
    {
      title: "顧客満足度",
      metric: "4.8",
      progress: 96,
      target: "5.0",
      delta: "+0.3",
      deltaType: "increase",
      sparklineData: [4.5, 4.6, 4.5, 4.7, 4.7, 4.8, 4.7, 4.8, 4.8, 4.9, 4.8, 4.8]
    }
  ];

  // 時間帯別パフォーマンスデータ
  const hourlyPerformance = [
    { hour: "9:00", sales: 234000, orders: 45, satisfaction: 92 },
    { hour: "10:00", sales: 456000, orders: 89, satisfaction: 94 },
    { hour: "11:00", sales: 678000, orders: 134, satisfaction: 91 },
    { hour: "12:00", sales: 892000, orders: 187, satisfaction: 89 },
    { hour: "13:00", sales: 756000, orders: 156, satisfaction: 87 },
    { hour: "14:00", sales: 534000, orders: 98, satisfaction: 93 },
    { hour: "15:00", sales: 445000, orders: 87, satisfaction: 95 },
    { hour: "16:00", sales: 567000, orders: 112, satisfaction: 94 },
    { hour: "17:00", sales: 789000, orders: 156, satisfaction: 92 },
    { hour: "18:00", sales: 923000, orders: 189, satisfaction: 90 },
    { hour: "19:00", sales: 834000, orders: 167, satisfaction: 88 },
    { hour: "20:00", sales: 645000, orders: 128, satisfaction: 91 }
  ];

  // トップ商品データ
  const topProducts = [
    { name: "カフェラテ", sales: 892340, units: 456, growth: 12.3 },
    { name: "アメリカーノ", sales: 734560, units: 523, growth: 8.7 },
    { name: "キャラメルマキアート", sales: 623890, units: 234, growth: 15.2 },
    { name: "抹茶ラテ", sales: 556780, units: 312, growth: -2.1 },
    { name: "チーズケーキ", sales: 445670, units: 189, growth: 22.5 }
  ];

  // 店舗比較データ
  const storeComparison = [
    { store: "渋谷店", score: 94, sales: 1234567, efficiency: 89 },
    { store: "新宿店", score: 91, sales: 1123456, efficiency: 85 },
    { store: "池袋店", score: 88, sales: 987654, efficiency: 82 },
    { store: "品川店", score: 92, sales: 1098765, efficiency: 88 },
    { store: "上野店", score: 87, sales: 876543, efficiency: 79 }
  ];

  return (
    <Box sx={{ 
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      minHeight: '100vh',
      p: 3
    }}>
      {/* ヘッダー */}
      <Card className="mb-6">
        <Flex justifyContent="between" alignItems="start">
          <div>
            <Title className="text-gray-900">店舗パフォーマンス分析</Title>
            <Text className="mt-1">
              リアルタイムデータと詳細な分析
            </Text>
          </div>
          <Flex className="gap-3">
            <Select value={selectedStore} onValueChange={setSelectedStore}>
              <SelectItem value="all" text="全店舗" />
              {stores.map((store) => (
                <SelectItem key={store.id} value={store.id} text={store.name} />
              ))}
            </Select>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectItem value="today" text="本日" />
              <SelectItem value="week" text="今週" />
              <SelectItem value="month" text="今月" />
              <SelectItem value="quarter" text="四半期" />
            </Select>
          </Flex>
        </Flex>
      </Card>

      {/* リアルタイムステータスバー */}
      <Card className="mb-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
        <Grid numItems={4} className="gap-4">
          <div className="text-center">
            <Text className="text-white/80">アクティブユーザー</Text>
            <Metric className="text-white">{realtimeData.activeUsers}</Metric>
            <Text className="text-white/60 text-xs">リアルタイム</Text>
          </div>
          <div className="text-center">
            <Text className="text-white/80">注文/分</Text>
            <Metric className="text-white">{realtimeData.ordersPerMinute}</Metric>
            <Text className="text-white/60 text-xs">過去5分平均</Text>
          </div>
          <div className="text-center">
            <Text className="text-white/80">平均待ち時間</Text>
            <Metric className="text-white">{realtimeData.avgWaitTime}分</Metric>
            <Text className="text-white/60 text-xs">現在</Text>
          </div>
          <div className="text-center">
            <Text className="text-white/80">満足度スコア</Text>
            <Metric className="text-white">{realtimeData.satisfaction}%</Metric>
            <Text className="text-white/60 text-xs">本日平均</Text>
          </div>
        </Grid>
      </Card>

      {/* KPIカード */}
      <Grid numItems={1} numItemsSm={2} numItemsLg={4} className="gap-4 mb-6">
        {kpiCards.map((kpi, index) => (
          <Card key={index} decoration="top" decorationColor="indigo">
            <Flex>
              <div className="w-full">
                <Text>{kpi.title}</Text>
                <Metric className="mt-2">{kpi.metric}</Metric>
                <Flex className="mt-4" justifyContent="start">
                  <BadgeDelta deltaType={kpi.deltaType}>{kpi.delta}</BadgeDelta>
                  <Text className="ml-2 text-xs">vs 前日</Text>
                </Flex>
              </div>
              <div>
                <SparkAreaChart
                  data={kpi.sparklineData.map((value, i) => ({ value, index: i }))}
                  categories={["value"]}
                  index="index"
                  colors={["indigo"]}
                  className="h-12 w-20"
                  showGradient={false}
                  showYAxis={false}
                  showXAxis={false}
                  showTooltip={false}
                />
              </div>
            </Flex>
            <ProgressBar value={kpi.progress} className="mt-3" color="indigo" />
            <Text className="text-xs text-gray-500 mt-1">
              目標: {kpi.target} ({kpi.progress}%)
            </Text>
          </Card>
        ))}
      </Grid>

      {/* メインチャートセクション */}
      <Grid numItems={1} numItemsLg={3} className="gap-6 mb-6">
        {/* 時間帯別売上トレンド */}
        <Col numColSpan={1} numColSpanLg={2}>
          <Card>
            <Title>時間帯別パフォーマンス</Title>
            <TabGroup className="mt-2">
              <TabList variant="solid">
                <TremorTab>売上高</TremorTab>
                <TremorTab>注文数</TremorTab>
                <TremorTab>満足度</TremorTab>
              </TabList>
              <TabPanels>
                <TremorTabPanel>
                  <AreaChart
                    className="h-80 mt-4"
                    data={hourlyPerformance}
                    index="hour"
                    categories={["sales"]}
                    colors={["indigo"]}
                    valueFormatter={(value) => `¥${(value / 1000).toFixed(0)}K`}
                    showLegend={false}
                    showYAxis={true}
                    showGradient={true}
                    curveType="natural"
                  />
                </TremorTabPanel>
                <TremorTabPanel>
                  <BarChart
                    className="h-80 mt-4"
                    data={hourlyPerformance}
                    index="hour"
                    categories={["orders"]}
                    colors={["emerald"]}
                    valueFormatter={(value) => `${value}件`}
                    showLegend={false}
                  />
                </TremorTabPanel>
                <TremorTabPanel>
                  <LineChart
                    className="h-80 mt-4"
                    data={hourlyPerformance}
                    index="hour"
                    categories={["satisfaction"]}
                    colors={["amber"]}
                    valueFormatter={(value) => `${value}%`}
                    yAxisWidth={40}
                    showLegend={false}
                  />
                </TremorTabPanel>
              </TabPanels>
            </TabGroup>
          </Card>
        </Col>

        {/* トップ商品 */}
        <Card>
          <Title>売上トップ5商品</Title>
          <Flex className="mt-6">
            <Text className="text-xs font-medium">商品名</Text>
            <Text className="text-xs font-medium">売上</Text>
          </Flex>
          <BarList
            data={topProducts.map(product => ({
              name: product.name,
              value: product.sales,
              units: `${product.units}個`,
              deltaType: product.growth > 0 ? "increase" : "decrease",
              growth: `${product.growth > 0 ? '+' : ''}${product.growth}%`
            }))}
            valueFormatter={(value) => `¥${(value / 1000).toFixed(0)}K`}
            className="mt-3"
          />
        </Card>
      </Grid>

      {/* 店舗比較セクション */}
      <Card className="mb-6">
        <Title>店舗間パフォーマンス比較</Title>
        <Grid numItems={1} numItemsLg={3} className="gap-6 mt-6">
          {/* スコア比較 */}
          <div>
            <Text className="text-sm font-medium mb-3">総合スコア</Text>
            {storeComparison.map((store, index) => (
              <div key={index} className="mb-3">
                <Flex>
                  <Text className="text-sm">{store.store}</Text>
                  <Text className="text-sm font-medium">{store.score}点</Text>
                </Flex>
                <ProgressBar
                  value={store.score}
                  color={store.score >= 90 ? "emerald" : store.score >= 80 ? "amber" : "red"}
                  className="mt-1"
                />
              </div>
            ))}
          </div>

          {/* 売上比較 */}
          <div>
            <Text className="text-sm font-medium mb-3">売上高</Text>
            <BarChart
              data={storeComparison}
              index="store"
              categories={["sales"]}
              colors={["indigo"]}
              valueFormatter={(value) => `¥${(value / 1000000).toFixed(1)}M`}
              showYAxis={false}
              showLegend={false}
              className="h-64"
            />
          </div>

          {/* 効率性比較 */}
          <div>
            <Text className="text-sm font-medium mb-3">運営効率性</Text>
            <DonutChart
              data={storeComparison.map(s => ({ name: s.store, value: s.efficiency }))}
              category="value"
              index="name"
              valueFormatter={(value) => `${value}%`}
              colors={["indigo", "cyan", "amber", "emerald", "rose"]}
              className="h-64"
              showLabel={true}
            />
          </div>
        </Grid>
      </Card>

      {/* アラートとインサイト */}
      <Grid numItems={1} numItemsLg={2} className="gap-6">
        <Card>
          <Title>アラート & 通知</Title>
          <div className="mt-4 space-y-3">
            <Callout title="在庫アラート" icon={ExclamationTriangleIcon} color="amber">
              渋谷店でカフェラテの材料が残り20%です
            </Callout>
            <Callout title="混雑予測" icon={ClockIcon} color="blue">
              12:00-13:00に混雑が予想されます
            </Callout>
            <Callout title="達成通知" icon={CheckCircleIcon} color="emerald">
              本日の売上目標を80%達成しました
            </Callout>
          </div>
        </Card>

        <Card>
          <Title>AIインサイト</Title>
          <List className="mt-4">
            <ListItem>
              <Flex justifyContent="start" className="truncate space-x-2.5">
                <Icon icon={LightBulbIcon} variant="light" color="amber" size="sm" />
                <div className="truncate">
                  <Text className="truncate">
                    <Bold>売上予測</Bold>
                  </Text>
                  <Text className="truncate text-gray-500">
                    現在のペースで本日¥5.2M達成見込み
                  </Text>
                </div>
              </Flex>
            </ListItem>
            <ListItem>
              <Flex justifyContent="start" className="truncate space-x-2.5">
                <Icon icon={TrendingUpIcon} variant="light" color="emerald" size="sm" />
                <div className="truncate">
                  <Text className="truncate">
                    <Bold>トレンド分析</Bold>
                  </Text>
                  <Text className="truncate text-gray-500">
                    抹茶系商品の需要が前週比15%上昇
                  </Text>
                </div>
              </Flex>
            </ListItem>
            <ListItem>
              <Flex justifyContent="start" className="truncate space-x-2.5">
                <Icon icon={UserGroupIcon} variant="light" color="indigo" size="sm" />
                <div className="truncate">
                  <Text className="truncate">
                    <Bold>顧客行動</Bold>
                  </Text>
                  <Text className="truncate text-gray-500">
                    午後の来店客の70%がリピーター
                  </Text>
                </div>
              </Flex>
            </ListItem>
          </List>
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
