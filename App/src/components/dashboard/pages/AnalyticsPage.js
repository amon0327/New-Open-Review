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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Progress } from '../../ui/progress';
import { Separator } from '../../ui/separator';
import { Skeleton } from '../../ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '../../ui/alert';
import { Tabs as ShadcnTabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '../../ui/select';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  Users,
  ShoppingCart,
  Clock,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  BarChart3,
  Calendar,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import { ja } from 'date-fns/locale';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

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

// Custom tooltip for charts
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background p-3 border rounded-lg shadow-lg">
        <p className="text-sm font-medium">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.value.toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Chart colors
const COLORS = ['#5e17eb', '#667eea', '#764ba2', '#f093fb', '#4facfe', '#00f2fe', '#fa709a', '#fee140'];

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-100 p-6">
      {/* ヘッダー */}
      <Card className="mb-6 border-0 shadow-xl bg-white/80 backdrop-blur">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                店舗パフォーマンス分析
              </CardTitle>
              <CardDescription className="mt-2">
                リアルタイムデータと詳細な分析
              </CardDescription>
            </div>
            <div className="flex gap-3">
              <Select value={selectedStore} onValueChange={setSelectedStore}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="店舗を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全店舗</SelectItem>
                  {stores.map((store) => (
                    <SelectItem key={store.id} value={store.id}>
                      {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="期間を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">本日</SelectItem>
                  <SelectItem value="week">今週</SelectItem>
                  <SelectItem value="month">今月</SelectItem>
                  <SelectItem value="quarter">四半期</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* リアルタイムステータスバー */}
      <div className="mb-6 bg-gradient-to-r from-primary via-purple-600 to-pink-600 text-white rounded-2xl shadow-2xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-white/80 text-sm font-medium mb-1">アクティブユーザー</div>
            <div className="text-4xl font-bold">{realtimeData.activeUsers}</div>
            <div className="text-white/60 text-xs mt-1">リアルタイム</div>
          </div>
          <div className="text-center">
            <div className="text-white/80 text-sm font-medium mb-1">注文/分</div>
            <div className="text-4xl font-bold">{realtimeData.ordersPerMinute}</div>
            <div className="text-white/60 text-xs mt-1">過去5分平均</div>
          </div>
          <div className="text-center">
            <div className="text-white/80 text-sm font-medium mb-1">平均待ち時間</div>
            <div className="text-4xl font-bold">{realtimeData.avgWaitTime}分</div>
            <div className="text-white/60 text-xs mt-1">現在</div>
          </div>
          <div className="text-center">
            <div className="text-white/80 text-sm font-medium mb-1">満足度スコア</div>
            <div className="text-4xl font-bold">{realtimeData.satisfaction}%</div>
            <div className="text-white/60 text-xs mt-1">本日平均</div>
          </div>
        </div>
      </div>

      {/* KPIカード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpiCards.map((kpi, index) => (
          <Card key={index} className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 bg-white/80 backdrop-blur">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="text-3xl font-bold">{kpi.metric}</div>
                  <div className="flex items-center gap-2">
                    <Badge variant={kpi.deltaType === 'increase' ? 'default' : 'destructive'} className="gap-1">
                      {kpi.deltaType === 'increase' ? (
                        <ArrowUpRight className="w-3 h-3" />
                      ) : (
                        <ArrowDownRight className="w-3 h-3" />
                      )}
                      {kpi.delta}
                    </Badge>
                    <span className="text-xs text-muted-foreground">vs 前日</span>
                  </div>
                </div>
                <div className="w-20 h-12">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={kpi.sparklineData.map((value, i) => ({ value }))}>
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke={COLORS[index % COLORS.length]}
                        fill={COLORS[index % COLORS.length]}
                        fillOpacity={0.2}
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <Progress value={kpi.progress} className="h-2" />
                <div className="text-xs text-muted-foreground">
                  目標: {kpi.target} ({kpi.progress}%)
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* メインチャートセクション */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* 時間帯別売上トレンド */}
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur h-full">
            <CardHeader>
              <CardTitle>時間帯別パフォーマンス</CardTitle>
            </CardHeader>
            <CardContent>
              <ShadcnTabs defaultValue="sales" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="sales">売上高</TabsTrigger>
                  <TabsTrigger value="orders">注文数</TabsTrigger>
                  <TabsTrigger value="satisfaction">満足度</TabsTrigger>
                </TabsList>
                <TabsContent value="sales" className="mt-4">
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={hourlyPerformance}>
                        <defs>
                          <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={COLORS[0]} stopOpacity={0.8}/>
                            <stop offset="95%" stopColor={COLORS[0]} stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="hour" className="text-xs" />
                        <YAxis className="text-xs" tickFormatter={(value) => `¥${(value / 1000).toFixed(0)}K`} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area 
                          type="monotone" 
                          dataKey="sales" 
                          stroke={COLORS[0]}
                          fillOpacity={1} 
                          fill="url(#colorSales)" 
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </TabsContent>
                <TabsContent value="orders" className="mt-4">
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={hourlyPerformance}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="hour" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="orders" fill={COLORS[1]} radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </TabsContent>
                <TabsContent value="satisfaction" className="mt-4">
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={hourlyPerformance}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="hour" className="text-xs" />
                        <YAxis className="text-xs" domain={[80, 100]} />
                        <Tooltip content={<CustomTooltip />} />
                        <Line 
                          type="monotone" 
                          dataKey="satisfaction" 
                          stroke={COLORS[2]} 
                          strokeWidth={3}
                          dot={{ fill: COLORS[2], r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </TabsContent>
              </ShadcnTabs>
            </CardContent>
          </Card>
        </div>

        {/* トップ商品 */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur h-full">
          <CardHeader>
            <CardTitle>売上トップ5商品</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.units}個販売</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">¥{(product.sales / 1000).toFixed(0)}K</p>
                      <Badge 
                        variant={product.growth > 0 ? "default" : "destructive"} 
                        className="text-xs gap-1"
                      >
                        {product.growth > 0 ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        {product.growth > 0 ? '+' : ''}{product.growth}%
                      </Badge>
                    </div>
                  </div>
                  <Progress 
                    value={(product.sales / topProducts[0].sales) * 100} 
                    className="h-2"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 店舗比較セクション */}
      <Card className="mb-6 border-0 shadow-xl bg-white/80 backdrop-blur">
        <CardHeader>
          <CardTitle>店舗間パフォーマンス比較</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* スコア比較 */}
            <div>
              <h4 className="text-sm font-semibold mb-4">総合スコア</h4>
              <div className="space-y-3">
                {storeComparison.map((store, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">{store.store}</span>
                      <span className="text-sm font-bold">{store.score}点</span>
                    </div>
                    <Progress 
                      value={store.score} 
                      className={`h-2 ${
                        store.score >= 90 ? '[&>*]:bg-green-500' : 
                        store.score >= 80 ? '[&>*]:bg-yellow-500' : 
                        '[&>*]:bg-red-500'
                      }`}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* 売上比較 */}
            <div>
              <h4 className="text-sm font-semibold mb-4">売上高</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={storeComparison}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="store" className="text-xs" angle={-45} textAnchor="end" height={60} />
                    <YAxis className="text-xs" tickFormatter={(value) => `¥${(value / 1000000).toFixed(1)}M`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="sales" fill={COLORS[3]} radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 効率性比較 */}
            <div>
              <h4 className="text-sm font-semibold mb-4">運営効率性</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={storeComparison.map(s => ({ name: s.store, value: s.efficiency }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {storeComparison.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* アラートとインサイト */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur">
          <CardHeader>
            <CardTitle>アラート & 通知</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertTitle className="text-yellow-800">在庫アラート</AlertTitle>
              <AlertDescription className="text-yellow-700">
                渋谷店でカフェラテの材料が残り20%です
              </AlertDescription>
            </Alert>
            <Alert className="border-blue-200 bg-blue-50">
              <Clock className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-blue-800">混雑予測</AlertTitle>
              <AlertDescription className="text-blue-700">
                12:00-13:00に混雑が予想されます
              </AlertDescription>
            </Alert>
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">達成通知</AlertTitle>
              <AlertDescription className="text-green-700">
                本日の売上目標を80%達成しました
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur">
          <CardHeader>
            <CardTitle>AIインサイト</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center shrink-0">
                  <Lightbulb className="w-5 h-5 text-yellow-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold">売上予測</h4>
                  <p className="text-sm text-muted-foreground">
                    現在のペースで本日¥5.2M達成見込み
                  </p>
                </div>
              </div>
              <Separator />
              <div className="flex gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold">トレンド分析</h4>
                  <p className="text-sm text-muted-foreground">
                    抹茶系商品の需要が前週比15%上昇
                  </p>
                </div>
              </div>
              <Separator />
              <div className="flex gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold">顧客行動</h4>
                  <p className="text-sm text-muted-foreground">
                    午後の来店客の70%がリピーター
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
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
