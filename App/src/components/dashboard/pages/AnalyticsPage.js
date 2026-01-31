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
  LocationCity,
  Close
} from '@mui/icons-material';
import { supabase } from '../../../lib/supabase';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Progress } from '../../ui/progress';
import { Separator } from '../../ui/separator';
import { Skeleton } from '../../ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '../../ui/alert';
import { InfoTooltip } from '../../ui/info-tooltip';
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
  ArrowDownRight,
  ChevronDown,
  ChevronUp,
  User,
  UtensilsCrossed,
  Sparkles,
  Target
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
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
  ComposedChart,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
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
  <div className="min-h-[calc(100vh-300px)] flex items-center justify-center">
    <div className="text-center">
      <Store className="w-16 h-16 text-gray-300 mx-auto mb-6" />
      
      <h3 className="text-xl font-medium text-gray-900 mb-2">
        全店舗分析機能
      </h3>
      
      <p className="text-gray-500 mb-1">
        2店舗以上のデータが必要です
      </p>
      
      <p className="text-sm text-gray-400">
        複数店舗を登録すると、店舗間の比較分析が可能になります
      </p>
    </div>
  </div>
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

// Modern gradient colors
const COLORS = [
  '#3b82f6', // Blue - 推奨スコア
  '#10b981', // Emerald - リピート率
  '#f59e0b', // Amber - リピーター再来店
  '#8b5cf6'  // Violet - 新規再来店
];

// AI分析タブ
const AIAnalysisTab = ({ selectedStore, selectedPeriod }) => {
  // AIが生成したタスクのサンプルデータ
  const aiGeneratedTasks = [
    {
      id: 1,
      priority: 'high',
      category: 'customer',
      title: '新規離脱率の改善',
      description: '新規顧客の離脱率が17%と高水準。初回体験の改善が急務',
      insights: [
        '新規顧客の再来店意向が88.5%と目標を下回る',
        '待ち時間に対する不満が新規顧客で特に顕著（85%がネガティブ）',
        '初回来店時のサービス説明不足が主要因'
      ],
      actions: [
        '新規顧客専用のファストレーンを設置',
        '初回来店客向けウェルカムプログラムの導入',
        'スタッフへの新規客対応研修の実施'
      ],
      impact: {
        revenue: '+¥2.4M/月',
        nps: '+5pt',
        timeframe: '3週間'
      },
      dataSource: ['顧客傾向', '売上影響', 'コメント分析']
    },
    {
      id: 2,
      priority: 'high',
      category: 'operation',
      title: 'ピークタイム効率化',
      description: '12-13時の待ち時間が平均15分を超過。オペレーション改善が必要',
      insights: [
        'ランチタイムの注文処理能力が需要の70%に留まる',
        '事前注文システムの未活用（利用率3%）',
        'レジ待ち時間が全体の40%を占める'
      ],
      actions: [
        'モバイルオーダーシステムの積極的プロモーション',
        'ピークタイム専用スタッフの配置最適化',
        'セルフレジの導入検討'
      ],
      impact: {
        revenue: '+¥3.8M/月',
        satisfaction: '+12%',
        timeframe: '2週間'
      },
      dataSource: ['店舗評価', '概要', 'コメント分析']
    },
    {
      id: 3,
      priority: 'medium',
      category: 'quality',
      title: '商品品質の一貫性向上',
      description: '味の一貫性スコアが93%。競合他社平均の96%を下回る',
      insights: [
        '午後の時間帯で品質評価が5%低下',
        '特定スタッフの調理時に品質バラつきが発生',
        '温度管理に関するネガティブフィードバックが増加'
      ],
      actions: [
        '調理マニュアルの標準化と徹底',
        '品質管理チェックリストの導入',
        'スタッフ間の技術共有セッション開催'
      ],
      impact: {
        nps: '+3pt',
        retention: '+5%',
        timeframe: '4週間'
      },
      dataSource: ['店舗評価', 'コメント分析']
    },
    {
      id: 4,
      priority: 'medium',
      category: 'marketing',
      title: 'リピーター特典プログラム',
      description: '安定リピーターの構成比39%を45%まで引き上げる施策',
      insights: [
        'リピート率78.5%は好調だが、頻度に改善余地あり',
        '競合店のロイヤリティプログラムへの流出懸念',
        'リピーター向け特典の認知度が低い（23%）'
      ],
      actions: [
        'デジタルスタンプカードの導入',
        'リピーター限定メニューの開発',
        'バースデー特典の充実化'
      ],
      impact: {
        revenue: '+¥1.6M/月',
        frequency: '+0.8回/月',
        timeframe: '6週間'
      },
      dataSource: ['売上影響', '顧客傾向']
    },
    {
      id: 5,
      priority: 'low',
      category: 'facility',
      title: '店内環境の改善',
      description: '清潔さスコアが4.6/5.0。特にトイレ・ゴミ箱周辺の改善が必要',
      insights: [
        'トイレの清潔さが91%と相対的に低評価',
        'ゴミ箱周辺の管理が88%と要改善',
        '午後の時間帯で清掃頻度不足'
      ],
      actions: [
        '清掃スケジュールの見直し（1時間毎→30分毎）',
        '清掃チェックリストのデジタル化',
        '消耗品の自動補充システム導入'
      ],
      impact: {
        satisfaction: '+8%',
        complaints: '-15%',
        timeframe: '1週間'
      },
      dataSource: ['店舗評価', 'コメント分析']
    }
  ];

  // カテゴリーごとのアイコンとカラー
  const categoryConfig = {
    customer: { icon: Users, color: 'blue', label: '顧客体験' },
    operation: { icon: Activity, color: 'green', label: 'オペレーション' },
    quality: { icon: ShoppingCart, color: 'purple', label: '商品品質' },
    marketing: { icon: TrendingUp, color: 'orange', label: 'マーケティング' },
    facility: { icon: CheckCircle, color: 'teal', label: '施設管理' }
  };

  // 優先度ごとのスタイル
  const priorityStyles = {
    high: 'border-red-200 bg-red-50',
    medium: 'border-yellow-200 bg-yellow-50',
    low: 'border-gray-200 bg-gray-50'
  };

  return (
    <div className="p-6">
      {/* ヘッダー */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">AI統合分析</h2>
        <p className="text-gray-600">全データソースを統合し、優先度順にインサイトを提案</p>
      </div>

      {/* サマリーカード */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-red-500 to-rose-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm">緊急インサイト</p>
                <p className="text-2xl font-bold">2件</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-200" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-lg bg-gradient-to-br from-yellow-500 to-amber-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm">中優先度</p>
                <p className="text-2xl font-bold">2件</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-200" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-500 to-slate-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-100 text-sm">低優先度</p>
                <p className="text-2xl font-bold">1件</p>
              </div>
              <CheckCircle className="w-8 h-8 text-gray-200" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">期待収益改善</p>
                <p className="text-2xl font-bold">+¥9.2M</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* インサイトリスト */}
      <div className="space-y-4">
        {aiGeneratedTasks.map((task) => {
          const config = categoryConfig[task.category];
          const Icon = config.icon;
          
          return (
            <Card key={task.id} className={`border-2 shadow-lg hover:shadow-xl transition-all ${priorityStyles[task.priority]}`}>
              <CardContent className="p-6">
                <div className="flex items-start gap-6">
                  {/* アイコン部分 */}
                  <div className={`w-12 h-12 rounded-lg bg-${config.color}-100 flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-6 h-6 text-${config.color}-600`} />
                  </div>
                  
                  {/* メインコンテンツ */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">{task.title}</h3>
                      <Badge variant="outline" className={`text-xs px-2 py-0.5 bg-${config.color}-50 text-${config.color}-700 border-${config.color}-200`}>
                        {config.label}
                      </Badge>
                      {task.priority === 'high' && (
                        <Badge variant="destructive" className="text-xs px-2 py-0.5">
                          緊急
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-gray-600 mb-4">{task.description}</p>
                    
                    {/* インサイト */}
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <Lightbulb className="w-4 h-4 text-yellow-500" />
                        AIが検出した課題
                      </h4>
                      <ul className="space-y-1">
                        {task.insights.map((insight, idx) => (
                          <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-1.5 flex-shrink-0" />
                            {insight}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    {/* 推奨アクション */}
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-blue-500" />
                        推奨アクション
                      </h4>
                      <ul className="space-y-1">
                        {task.actions.map((action, idx) => (
                          <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    {/* インパクトと期間 */}
                    <div className="flex flex-wrap gap-4 pt-3 border-t">
                      {task.impact.revenue && (
                        <div className="flex items-center gap-2 text-sm">
                          <DollarSign className="w-4 h-4 text-green-600" />
                          <span className="font-semibold text-green-700">{task.impact.revenue}</span>
                        </div>
                      )}
                      {task.impact.nps && (
                        <div className="flex items-center gap-2 text-sm">
                          <TrendingUp className="w-4 h-4 text-blue-600" />
                          <span className="font-semibold text-blue-700">NPS {task.impact.nps}</span>
                        </div>
                      )}
                      {task.impact.satisfaction && (
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="w-4 h-4 text-purple-600" />
                          <span className="font-semibold text-purple-700">満足度 {task.impact.satisfaction}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm ml-auto">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600">実施期間: {task.impact.timeframe}</span>
                      </div>
                    </div>
                    
                    {/* データソース */}
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                      <span className="text-xs text-gray-500">データソース:</span>
                      <div className="flex gap-2">
                        {task.dataSource.map((source, idx) => (
                          <span key={idx} className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                            {source}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

// セグメント別インサイトの定義
const SEGMENT_INSIGHTS = {
  1: { issues: ['ロイヤル顧客の維持・強化が最重要課題', '離脱した場合の売上インパクトが最も大きい', '特別な体験や特典で関係性をさらに深化させる余地'] },
  2: { issues: ['初回体験は好印象だがリピーター定着が未確定', '2回目の来店につなげる施策が重要', '推奨者として口コミ効果を最大化する機会'] },
  3: { issues: ['高評価にもかかわらず再来店意向がない', '引越しや生活環境の変化など外的要因の可能性', '競合店への流出リスクが潜在的に存在'] },
  4: { issues: ['初回体験は高評価だが再来店動機が不足', '立地やアクセスなど利便性の課題の可能性', 'リピートにつながる仕掛けが不足'] },
  5: { issues: ['リピーターだが推奨するほどの満足度に達していない', 'サービスに慣れが生じ、特別感が薄れている可能性', '競合との差別化ポイントが実感されていない'] },
  6: { issues: ['再来店意向はあるが、強い印象を残せていない', '商品やサービスの魅力が十分に伝わっていない', '「また行ってもいい」程度の弱い動機'] },
  7: { issues: ['リピーターが満足度低下により離脱を検討', 'サービス品質の低下や期待とのギャップが蓄積', '対策しなければ離脱が確定する危険な状態'] },
  8: { issues: ['初回体験が印象に残らず離脱', '店舗の差別化ポイントが伝わっていない', '新規獲得コストが回収できていない'] },
  9: { issues: ['不満を抱えながらも来店を続けている', '代替店がない、または習慣的に来店している状態', 'ネガティブな口コミを発信するリスクが高い'] },
  10: { issues: ['初回体験に明確な不満がある', '再来店意向はあるが改善がなければ離脱確実', '具体的な改善ポイントが存在するサイン'] },
  11: { issues: ['リピーターの信頼を失い完全離脱の状態', '不満が蓄積し、もう来店する意思がない', 'ネガティブ口コミの最大リスク要因'] },
  12: { issues: ['初回体験が非常に悪く完全離脱', '新規獲得にかけたコストが無駄になっている', '悪い口コミの拡散リスクが最も高い'] }
};

// セグメント別の詳細情報（開閉カード用）
const SEGMENT_DETAILS = {
  1: {
    title: 'ロイヤル顧客の維持・強化戦略',
    detail: 'お店を最も高く評価し、定期的に来店しているロイヤル顧客。満足度は高いが、競合の台頭や環境変化によって離脱するリスクは常に存在する。この層の維持が売上安定の最大の鍵。',
    who: 'NPS9-10点をつけ、3ヶ月以内の再来店意向があるリピーター。来店頻度が高く、客単価も安定している最重要顧客層。',
    impact: 'ロイヤル顧客1人の離脱は新規顧客5人分の損失に相当。維持率を高めることで安定収益の確保に加え、口コミによる新規集客効果も持続する。',
    examples: ['VIP限定の先行メニュー体験や特別イベントの開催', '来店回数に応じたランクアップ制度の導入', '誕生日・記念日の特別サービスの充実', '直接的な感謝の声かけやパーソナライズされた接客'],
    measurement: 'ロイヤル顧客の継続率（月次）、来店頻度の推移、客単価の変化、口コミ・紹介経由の新規来店数をトラッキング。'
  },
  2: {
    title: '新規推奨者のリピーター転換',
    detail: '初回来店で高い満足度を示し、再来店意向もある新規顧客。ただしリピーターとして定着するかは未確定で、2回目の来店への橋渡しが成否を分ける。',
    who: 'NPS9-10点をつけた初回来店の新規顧客で、3ヶ月以内に再来店したいと回答した層。',
    impact: '新規→リピーター転換率の向上は、新規獲得コストの回収効率を大幅に改善する。推奨者としての口コミ拡散も期待できる。',
    examples: ['来店後24時間以内のサンキューメッセージ配信', '2回目来店時の特別クーポンの提供', '初回の注文履歴に基づくおすすめメニューの提案', 'SNSフォロー特典による継続接点の確保'],
    measurement: '2回目来店率、新規→リピーター転換率、初回来店後30日以内の再来店率、SNSフォロー率。'
  },
  3: {
    title: '高評価リピーターの離脱防止',
    detail: '高い評価をしているにもかかわらず再来店意向がないリピーター。引越しや生活スタイルの変化などの外的要因、あるいは競合店への流出が考えられる。',
    who: 'NPS9-10点のリピーターで、3ヶ月以内の再来店予定がないと回答した層。お店自体への不満は少ない。',
    impact: '離脱を防げれば、高い推奨度を活かした口コミ効果の維持と安定売上の確保が見込める。ロイヤル顧客への復帰可能性が最も高い層。',
    examples: ['離脱理由のヒアリングアンケートの実施', '復帰特典（期間限定クーポン）の提供', 'デリバリーやテイクアウトなど来店以外の利用方法の提案', '季節限定メニューや新商品の案内による再来店動機の創出'],
    measurement: '離脱率の推移、復帰来店率、離脱理由の傾向分析、復帰後の継続率。'
  },
  4: {
    title: '好印象新規の再来店促進',
    detail: '初回来店で高評価だったが、再来店する動機がない新規顧客。立地やアクセスの問題、またはリピートにつながる仕掛けの不足が原因と考えられる。',
    who: 'NPS9-10点の新規顧客で、再来店予定がないと回答した層。体験自体は良かったが、再訪の必然性を感じていない。',
    impact: '再来店のきっかけを提供するだけでリピーター化が期待でき、高い推奨度からの口コミ効果も見込める。',
    examples: ['初回来店者限定の次回割引クーポン配布', 'お気に入り登録やアプリ登録の促進', '来店地域に応じたアクセス改善策の検討', '友人紹介キャンペーンによる再来店動機の付与'],
    measurement: '初回来店者の再来店率、クーポン利用率、アプリ登録率、紹介経由の来店数。'
  },
  5: {
    title: '中立リピーターの推奨者化',
    detail: '定期的に来店しているが、推奨するほどの満足度には達していないリピーター。サービスへの慣れや特別感の薄れが背景にある可能性がある。',
    who: 'NPS7-8点のリピーターで再来店意向がある層。不満はないが「人に勧めるほどではない」という温度感の顧客。',
    impact: '推奨者に引き上げれば、口コミによる新規獲得と来店頻度・客単価の向上が同時に実現する。LTV向上の最大チャンス。',
    examples: ['期待を超えるサプライズ体験の提供（一品サービスなど）', '常連客向けの限定メニューや裏メニューの案内', 'スタッフとの関係性強化（名前を覚える、好みを把握する）', '店舗の改善取り組みの共有による共感の醸成'],
    measurement: 'NPS7-8点→9-10点への転換率、来店頻度の変化、客単価の推移、口コミ投稿の有無。'
  },
  6: {
    title: '印象の薄い新規への差別化',
    detail: '再来店意向はあるが、強い印象を残せていない新規顧客。「また行ってもいい」程度の弱い動機で、競合にスイッチされやすい状態。',
    who: 'NPS7-8点の新規顧客で再来店意向がある層。可もなく不可もなくという評価で、差別化ポイントが十分に伝わっていない。',
    impact: '次回来店時の体験向上で推奨者化が可能。初期段階でファンになれば、長期的な売上貢献と口コミ効果が期待できる。',
    examples: ['2回目来店時にパーソナライズされた接客（前回の注文の記憶）', '新規客向けの体験プログラム（おすすめコースの提案）', '来店後のフォローアップで差別化ポイントを伝達', '次回来店時の小さなサプライズ（ドリンクサービスなど）'],
    measurement: '2回目来店率、NPS中立→推奨者への転換率、来店間隔の短縮度、リピーター定着率。'
  },
  7: {
    title: 'リピーター離脱の兆候と対策',
    detail: 'これまで来店していたリピーターが満足度低下により離脱を検討している状態。サービス品質の低下や期待とのギャップが蓄積しており、対策しなければ離脱が確定する。',
    who: 'NPS7-8点で再来店意向がないリピーター。以前は満足していたが、最近の体験で評価が下がっている可能性が高い。',
    impact: '離脱防止と推奨者への転換で、安定した売上基盤の維持とネガティブ口コミの防止につながる。既存顧客の維持は新規獲得の5倍効率的。',
    examples: ['直近の来店体験についてのフィードバック収集', '改善完了の報告と復帰インセンティブの提供', '店長やスタッフからの直接的なフォローアップ', '品質管理の強化と一貫性のあるサービス提供体制の構築'],
    measurement: '離脱予兆スコアの推移、復帰率、改善施策実施後のNPS変化、来店頻度の回復度。'
  },
  8: {
    title: '初回体験の印象強化',
    detail: '初回体験が印象に残らず、再来店する理由がない新規顧客。店舗の差別化ポイントが伝わっておらず、新規獲得にかけたコストが回収できていない状態。',
    who: 'NPS7-8点で再来店意向がない新規顧客。特に不満はないが、記憶に残る体験がなかった層。',
    impact: '初回体験の改善で再来店率を向上させれば、新規獲得コストの回収効率が大幅に改善する。中立者は改善余地が最も大きいセグメント。',
    examples: ['初回来店者向けのウェルカムプログラムの導入', '店舗の強みやこだわりを伝えるPOP・説明の充実', '初回限定の特別体験（試食、店舗ツアーなど）の提供', 'スタッフからの積極的な声かけとおすすめの提案'],
    measurement: '初回来店者の再来店率、初回体験満足度スコア、ウェルカムプログラムの利用率、NPS改善幅。'
  },
  9: {
    title: '不満蓄積リピーターの改善',
    detail: '不満を抱えながらも来店を続けているリピーター。代替店がない、立地的に便利、または習慣的に来店している状態。ネガティブ口コミを発信するリスクが高い。',
    who: 'NPS0-6点で再来店意向があるリピーター。不満があるが何らかの理由で来店を継続している層。潜在的なクレーマーリスクあり。',
    impact: '不満の根本原因を解消すれば、中立者→推奨者への段階的な転換チャンスがある。ネガティブ口コミの抑制は見えない機会損失を防ぐ。',
    examples: ['不満ポイントの特定と優先的な改善実施', 'クレーム対応プロセスの見直しとスタッフ研修', '改善取り組みの可視化と進捗共有', '不満解消後のフォローアップ（満足度再調査）'],
    measurement: 'NPS批判者→中立者への転換率、クレーム件数の推移、ネガティブ口コミ数の変化、来店継続率。'
  },
  10: {
    title: '不満新規の逆転チャンス',
    detail: '初回体験に明確な不満があった新規顧客だが、再来店意向はある。具体的な改善ポイントが存在するサインであり、対応すれば満足度を大幅に向上できる可能性がある。',
    who: 'NPS0-6点で再来店意向がある新規顧客。不満はあるが、店舗への期待値は残っている層。改善すれば逆転の余地あり。',
    impact: 'フィードバックに基づく具体的改善で満足度を大幅向上させる余地がある。改善後のリピーター化で新規獲得コストの回収が可能。',
    examples: ['不満要因のカテゴリ別分析と優先改善', '改善完了を伝えるフォローアップ通知の配信', '再来店時の特別対応（謝罪と改善の実演）', '新規顧客の初回体験フロー全体の見直し'],
    measurement: '再来店率、再来店時のNPS改善幅、不満カテゴリ別の解消率、改善通知後のアクション率。'
  },
  11: {
    title: 'リピーター完全離脱の危機対応',
    detail: 'リピーターの信頼を完全に失い、離脱が確定している状態。不満が蓄積し、もう来店する意思がない。ネガティブ口コミの最大リスク要因であり、最優先で対処すべきセグメント。',
    who: 'NPS0-6点で再来店意向がないリピーター。以前は来店していたが、不満が限界を超え離脱を決意した層。',
    impact: '離脱防止できれば安定売上の維持に直結。1人のリピーター維持は新規顧客5人分の獲得に相当。ネガティブ口コミの拡散防止も重要な効果。',
    examples: ['店長からの直接的な謝罪と改善コミットの伝達', '離脱理由の詳細ヒアリングと即時改善の実施', '復帰を促す特別オファー（無料招待など）の提供', 'サービス品質の根本的な見直しとスタッフ教育の強化'],
    measurement: '離脱率の推移、復帰成功率、離脱理由の分布、ネガティブ口コミの発生件数、改善後の再評価スコア。'
  },
  12: {
    title: '初回体験の根本的な改善',
    detail: '初回体験が非常に悪く、完全に離脱した新規顧客。新規獲得にかけたコストが完全に無駄になっており、悪い口コミの拡散リスクが最も高い状態。',
    who: 'NPS0-6点で再来店意向がない新規顧客。初回体験で強い不満を感じ、二度と来ないと判断した層。',
    impact: '初回体験の根本改善で新規→リピーター転換率を向上できる。口コミサイトでの評判改善は、新規集客力の底上げにつながる。',
    examples: ['初回来店体験の全プロセス（入店〜退店）の総点検', '新規顧客に特に多い不満要因の特定と重点改善', 'スタッフの新規客対応マニュアルの整備と研修', '口コミサイトへの改善対応の公開返信'],
    measurement: '新規顧客のNPS分布の変化、初回離脱率、口コミサイトの評価推移、新規来店数の変化。'
  }
};

// セグメントの優先度スコア（高いほど重要）
const SEGMENT_PRIORITY = {
  11: 6, // 批判者×再来店なし×リピーター - 最重要
  12: 5, // 批判者×再来店なし×新規
  7: 5,  // 中立者×再来店なし×リピーター
  8: 4,  // 中立者×再来店なし×新規
  9: 3,  // 批判者×再来店あり×リピーター
  10: 3, // 批判者×再来店あり×新規
  3: 2,  // 推奨者×再来店なし×リピーター
  4: 2,  // 推奨者×再来店なし×新規
  5: 1,  // 中立者×再来店あり×リピーター
  6: 1,  // 中立者×再来店あり×新規
};

// 4カテゴリタグの設定（再来店意向×顧客タイプ）
const getCategoryTag = (seg) => {
  const isRepeater = seg.customerLabel === 'リピーター';
  const hasRevisit = seg.revisitLabel === '再来店あり';
  if (isRepeater && hasRevisit) return { label: '安定リピーター', bg: 'bg-green-500' };
  if (isRepeater && !hasRevisit) return { label: 'リピーター離脱', bg: 'bg-orange-500' };
  if (!isRepeater && hasRevisit) return { label: '新規リピーター', bg: 'bg-blue-500' };
  return { label: '新規離脱', bg: 'bg-gray-500' };
};

// 推奨度タグの設定
const getNpsTag = (seg) => {
  if (seg.npsLabel === '推奨者') return { label: '推奨者', bg: 'bg-green-600' };
  if (seg.npsLabel === '中立者') return { label: '中立者', bg: 'bg-amber-500' };
  return { label: '批判者', bg: 'bg-red-600' };
};

// タスクタブ
const TasksTab = ({ companyId, selectedStore, selectedPeriod }) => {
  const [loading, setLoading] = useState(true);
  const [segments, setSegments] = useState([]);
  const [expandedDetail, setExpandedDetail] = useState(null);

  // selectedPeriodを年月形式に変換
  const getYearMonth = (period) => {
    if (!period) return null;
    return period.replace('/', '-');
  };

  // セグメントデータ取得
  useEffect(() => {
    const fetchSegments = async () => {
      if (!companyId || !selectedStore) {
        setSegments([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          throw new Error('認証が必要です');
        }
        const yearMonth = getYearMonth(selectedPeriod);
        const params = new URLSearchParams({ company_id: companyId, store_id: selectedStore });
        if (yearMonth) params.append('year_month', yearMonth);

        const response = await fetch(
          `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/get-monthly-analytics?${params}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
          }
        );
        const result = await response.json();
        if (!result.success) throw new Error(result.error || 'データの取得に失敗しました');
        setSegments(result.data?.salesImpact?.segments || []);
      } catch (error) {
        console.error('セグメントデータの取得エラー:', error);
        setSegments([]);
      } finally {
        setLoading(false);
      }
    };
    fetchSegments();
  }, [companyId, selectedStore, selectedPeriod]);

  // 課題セグメントの抽出（ロイヤル顧客・期待の新規を除外し、優先度×人数でソート、最大6件）
  const issueSegments = useMemo(() => {
    return segments
      .filter(seg => seg.count > 0 && SEGMENT_INSIGHTS[seg.id])
      .sort((a, b) => {
        const priorityDiff = (SEGMENT_PRIORITY[b.id] || 0) - (SEGMENT_PRIORITY[a.id] || 0);
        if (priorityDiff !== 0) return priorityDiff;
        return b.count - a.count;
      })
      .slice(0, 6);
  }, [segments]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-sm">
              <Skeleton className="h-4 w-24 mb-4" />
              <Skeleton className="h-8 w-16 mb-3" />
              <Skeleton className="h-3 w-full mb-2" />
              <Skeleton className="h-3 w-3/4 mb-2" />
              <Skeleton className="h-3 w-5/6 mb-6" />
              <Skeleton className="h-16 w-full rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (issueSegments.length === 0) {
    return (
      <div className="p-6 flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">課題のあるセグメントはありません</p>
          <p className="text-gray-400 text-sm mt-2">すべての顧客セグメントが良好な状態です</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* セグメント別 詳細分析カード */}
      <div className="space-y-5">
        {issueSegments.map((seg) => {
          const details = SEGMENT_DETAILS[seg.id];
          if (!details) return null;
          const categoryTag = getCategoryTag(seg);
          const npsTag = getNpsTag(seg);
          const isOpen = expandedDetail === seg.id;

          return (
            <div key={`detail-${seg.id}`} className="relative">
              <div className={`absolute -top-2.5 left-5 z-10 inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold text-white shadow-sm ${categoryTag.bg}`}>
                {categoryTag.label}
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden pt-2">
                <button
                  onClick={() => setExpandedDetail(isOpen ? null : seg.id)}
                  className="w-full flex items-center justify-between px-6 pt-4 pb-3 text-left hover:bg-gray-50/30 transition-colors"
                >
                  <h3 className="text-base font-bold text-gray-900">{details.title}</h3>
                  <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                  <div className="px-6 pb-6 space-y-4">
                    <Separator />
                    {/* 対象セグメント表示 */}
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold text-white ${categoryTag.bg}`}>
                        {categoryTag.label}
                      </span>
                      <span className="text-gray-300 font-bold text-xs">×</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold text-white ${npsTag.bg}`}>
                        {npsTag.label}
                      </span>
                    </div>
                    {/* 課題 */}
                    <div>
                      <div className="flex items-center gap-2 mb-1 text-red-500">
                        <Target className="w-4 h-4" />
                        <span className="text-[11px] font-bold text-gray-500 uppercase">課題＆注意</span>
                      </div>
                      <p className="text-[13px] text-gray-600 leading-relaxed pl-6 line-clamp-2">{details.detail}</p>
                    </div>
                    {/* 参考 改善案/測定方法 */}
                    <div className="bg-gray-50 rounded-xl p-4">
                      <span className="text-[11px] font-bold text-gray-500 uppercase">参考 改善案/測定方法</span>
                      <div className="mt-2.5 space-y-2.5">
                        {details.examples.slice(0, 2).map((ex, idx) => (
                          <div key={idx}>
                            <p className="text-[12px] text-gray-700">{ex}</p>
                            <p className="text-[11px] text-gray-400 pl-3">→ {details.measurement}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};


// 店舗別タブの内容 - 超モダンなダッシュボード
const StoreByStoreTab = ({ companyId }) => {
  const [activeSubTab, setActiveSubTab] = useState(0);
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [availablePeriods, setAvailablePeriods] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPeriodsLoading, setIsPeriodsLoading] = useState(false);

  // 店舗データ取得（レポートが存在する店舗のみ - Edge Function経由）
  useEffect(() => {
    const fetchStores = async () => {
      if (!companyId) {
        setIsLoading(false);
        return;
      }
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          console.error('No session');
          setIsLoading(false);
          return;
        }

        // Edge Functionでレポートが存在する店舗を取得
        const response = await fetch(
          `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/get-monthly-analytics?company_id=${companyId}&store_id=all`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (!response.ok) throw new Error('Failed to fetch stores');

        const result = await response.json();

        if (result.success && result.data?.storesWithReports) {
          setStores(result.data.storesWithReports);
        } else {
          // フォールバック: 直接storesテーブルから取得
          const { data, error } = await supabase
            .from('stores')
            .select('id, name')
            .eq('company_id', companyId)
            .order('name');
          if (error) throw error;
          setStores(data || []);
        }

        // 初期値として全店舗を選択
        if (!selectedStore) {
          setSelectedStore('all');
        }
      } catch (error) {
        console.error('Error fetching stores:', error);
        // エラー時はstoresテーブルから直接取得を試みる
        try {
          const { data } = await supabase
            .from('stores')
            .select('id, name')
            .eq('company_id', companyId)
            .order('name');
          setStores(data || []);
        } catch (e) {
          console.error('Fallback error:', e);
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchStores();
  }, [companyId]);

  // 選択された店舗の利用可能な期間を取得（Edge Function経由）
  useEffect(() => {
    const fetchAvailablePeriods = async () => {
      if (!companyId || !selectedStore) {
        setAvailablePeriods([]);
        setIsPeriodsLoading(false);
        return;
      }
      setIsPeriodsLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.error('No session');
          setAvailablePeriods([]);
          setIsPeriodsLoading(false);
          return;
        }

        const response = await fetch(
          `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/get-monthly-analytics?company_id=${companyId}&store_id=${selectedStore}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (!response.ok) throw new Error('Failed to fetch available periods');

        const result = await response.json();
        if (result.success && result.data?.availablePeriods) {
          const periods = result.data.availablePeriods.map(p => p.replace('-', '/'));
          setAvailablePeriods(periods);

          // 最新の期間を選択（または既存の選択を維持）
          if (periods.length > 0) {
            if (!selectedPeriod || !periods.includes(selectedPeriod)) {
              setSelectedPeriod(periods[0]);
            }
          } else {
            setSelectedPeriod('');
          }
        } else {
          setAvailablePeriods([]);
          setSelectedPeriod('');
        }
      } catch (error) {
        console.error('Error fetching available periods:', error);
        setAvailablePeriods([]);
      } finally {
        setIsPeriodsLoading(false);
      }
    };
    fetchAvailablePeriods();
  }, [companyId, selectedStore]);
  
  const handleSubTabChange = (event, newValue) => {
    setActiveSubTab(newValue);
  };

  return (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      backgroundColor: '#f8fafc'
    }}>
      {/* サブタブヘッダー */}
      <Box sx={{
        backgroundColor: '#fff',
        borderBottom: '1px solid #e2e8f0',
        px: 3,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Tabs
          value={activeSubTab}
          onChange={handleSubTabChange}
          sx={{
            minHeight: 48,
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.9rem',
              minHeight: 48,
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
          <Tab label="インサイト" />
          <Tab label="概要" />
          <Tab label="売上影響" />
          <Tab label="店舗評価" />
          <Tab label="顧客傾向" />
          <Tab label="コメント" />
        </Tabs>
        
        {/* 店舗選択 */}
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
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod} disabled={availablePeriods.length === 0}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder={availablePeriods.length === 0 ? "データなし" : "期間を選択"} />
            </SelectTrigger>
            <SelectContent>
              {availablePeriods.map((period) => (
                <SelectItem key={period} value={period}>
                  {period}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Box>

      {/* サブタブコンテンツ */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {isPeriodsLoading ? (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-xl p-5 shadow-sm">
                  <Skeleton className="h-3 w-20 mb-4" />
                  <Skeleton className="h-7 w-16 mb-3" />
                  <Skeleton className="h-2 w-full rounded-full" />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[1, 2].map((i) => (
                <div key={i} className="bg-white rounded-xl p-5 shadow-sm">
                  <Skeleton className="h-4 w-28 mb-6" />
                  <Skeleton className="h-44 w-full rounded-lg" />
                </div>
              ))}
            </div>
          </div>
        ) : !selectedPeriod ? (
          <div className="p-6 flex justify-center items-center min-h-[400px]">
            <div className="text-center">
              <p className="text-gray-500 text-lg">この店舗のデータがありません</p>
              <p className="text-gray-400 text-sm mt-2">別の店舗を選択してください</p>
            </div>
          </div>
        ) : (
          <>
            <TabPanel value={activeSubTab} index={0}>
              <TasksTab companyId={companyId} selectedStore={selectedStore} selectedPeriod={selectedPeriod} />
            </TabPanel>
            <TabPanel value={activeSubTab} index={1}>
              <StoreOverviewTab companyId={companyId} selectedStore={selectedStore} selectedPeriod={selectedPeriod} stores={stores} />
            </TabPanel>
            <TabPanel value={activeSubTab} index={2}>
              <SalesImpactTab companyId={companyId} selectedStore={selectedStore} selectedPeriod={selectedPeriod} />
            </TabPanel>
            <TabPanel value={activeSubTab} index={3}>
              <StoreEvaluationTab companyId={companyId} selectedStore={selectedStore} selectedPeriod={selectedPeriod} />
            </TabPanel>
            <TabPanel value={activeSubTab} index={4}>
              <CustomerTrendsTab companyId={companyId} selectedStore={selectedStore} selectedPeriod={selectedPeriod} />
            </TabPanel>
            <TabPanel value={activeSubTab} index={5}>
              <CommentsTab companyId={companyId} selectedStore={selectedStore} selectedPeriod={selectedPeriod} />
            </TabPanel>
          </>
        )}
      </Box>
    </Box>
  );
};

// 店舗概要タブ
const StoreOverviewTab = ({ companyId, selectedStore, selectedPeriod, stores }) => {
  const [isComparisonOpen, setIsComparisonOpen] = useState(true);
  const [isAlertsOpen, setIsAlertsOpen] = useState(true);
  const [isInsightsOpen, setIsInsightsOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [overviewData, setOverviewData] = useState(null);

  // selectedPeriodを年月形式に変換 (2025/12 -> 2025-12)
  const getYearMonth = (period) => {
    if (!period) return null;
    return period.replace('/', '-');
  };

  // 月次サマリーテーブルからデータを取得
  useEffect(() => {
    const fetchOverviewData = async () => {
      if (!companyId || !selectedStore) {
        setOverviewData(null);
        setLoading(false);
        return;
      }
      setLoading(true);

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          throw new Error('認証が必要です');
        }

        const yearMonth = getYearMonth(selectedPeriod);
        const params = new URLSearchParams({
          company_id: companyId,
          store_id: selectedStore
        });
        if (yearMonth) {
          params.append('year_month', yearMonth);
        }

        const response = await fetch(
          `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/get-monthly-analytics?${params}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'データの取得に失敗しました');
        }

        setOverviewData(result.data?.overview || null);
      } catch (error) {
        console.error('概要データの取得エラー:', error);
        setOverviewData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchOverviewData();
  }, [companyId, selectedStore, selectedPeriod]);

  // 5ヶ月移動平均を計算する関数
  const calculateMovingAverage = (data, key, windowSize = 5) => {
    return data.map((item, index) => {
      if (index < windowSize - 1) {
        return null;
      }
      const sum = data.slice(index - windowSize + 1, index + 1).reduce((acc, d) => acc + d[key], 0);
      return sum / windowSize;
    });
  };

  // KPIカード設定（実データから生成）
  const kpi = overviewData?.kpi || {
    nps: { current: 0, delta: 0, sparkline: [0, 0, 0] },
    repeatRate: { current: 0, delta: 0, sparkline: [0, 0, 0] },
    repeaterRevisit: { current: 0, delta: 0, sparkline: [0, 0, 0] },
    newRevisit: { current: 0, delta: 0, sparkline: [0, 0, 0] }
  };

  const kpiCards = [
    {
      title: "推奨スコア",
      metric: `${kpi.nps.current >= 0 ? '+' : ''}${kpi.nps.current}pt`,
      progress: Math.max(0, Math.min(100, kpi.nps.current + 50)),
      target: "+50pt",
      delta: `${kpi.nps.delta >= 0 ? '+' : ''}${Number(kpi.nps.delta).toFixed(1)}pt`,
      deltaType: kpi.nps.delta >= 0 ? "increase" : "decrease",
      sparklineData: kpi.nps.sparkline
    },
    {
      title: "リピート率",
      metric: `${Number(kpi.repeatRate.current).toFixed(1)}%`,
      progress: kpi.repeatRate.current,
      target: "90%",
      delta: `${kpi.repeatRate.delta >= 0 ? '+' : ''}${Number(kpi.repeatRate.delta).toFixed(1)}%`,
      deltaType: kpi.repeatRate.delta >= 0 ? "increase" : "decrease",
      sparklineData: kpi.repeatRate.sparkline
    },
    {
      title: "3ヶ月以内再来店意向（リピーター）",
      metric: `${Number(kpi.repeaterRevisit.current).toFixed(1)}%`,
      progress: kpi.repeaterRevisit.current,
      target: "100%",
      delta: `${kpi.repeaterRevisit.delta >= 0 ? '+' : ''}${Number(kpi.repeaterRevisit.delta).toFixed(1)}%`,
      deltaType: kpi.repeaterRevisit.delta >= 0 ? "increase" : "decrease",
      sparklineData: kpi.repeaterRevisit.sparkline
    },
    {
      title: "3ヶ月以内再来店意向（新規）",
      metric: `${Number(kpi.newRevisit.current).toFixed(1)}%`,
      progress: kpi.newRevisit.current,
      target: "100%",
      delta: `${kpi.newRevisit.delta >= 0 ? '+' : ''}${Number(kpi.newRevisit.delta).toFixed(1)}%`,
      deltaType: kpi.newRevisit.delta >= 0 ? "increase" : "decrease",
      sparklineData: kpi.newRevisit.sparkline
    }
  ];

  // 月別パフォーマンスデータ（実データから取得）
  const monthlyPerformanceRaw = overviewData?.monthlyPerformance || [];

  // 移動平均を追加
  const npsMA = calculateMovingAverage(monthlyPerformanceRaw, 'nps');
  const repeatRateMA = calculateMovingAverage(monthlyPerformanceRaw, 'repeatRate');
  const repeatVisitMA = calculateMovingAverage(monthlyPerformanceRaw, 'repeatVisit');
  const newVisitMA = calculateMovingAverage(monthlyPerformanceRaw, 'newVisit');

  const monthlyPerformance = monthlyPerformanceRaw.map((item, index) => ({
    ...item,
    npsMA: npsMA[index],
    repeatRateMA: repeatRateMA[index],
    repeatVisitMA: repeatVisitMA[index],
    newVisitMA: newVisitMA[index]
  }));

  // 店舗比較データ（実データから取得）
  const storeComparison = (overviewData?.storeComparison || []).map(store => ({
    store: store.store,
    score: store.nps,
    repeatRate: store.repeatRate,
    responseCount: store.responseCount
  }));

  // NPS分布データ
  const npsDistribution = overviewData?.npsDistribution || {
    promoters: 0,
    passives: 0,
    detractors: 0,
    npsScore: 0
  };

  // ローディング表示（スケルトンスクリーン）
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-100 p-6 pb-0">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl p-5 shadow-sm">
              <Skeleton className="h-3 w-20 mb-4" />
              <Skeleton className="h-7 w-16 mb-3" />
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-xl p-5 shadow-sm">
              <Skeleton className="h-4 w-28 mb-6" />
              <Skeleton className="h-56 w-full rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-100 p-6 pb-0">


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
                    <Badge
                      variant="outline"
                      className="gap-1 border-0 text-white font-semibold"
                      style={{
                        backgroundColor: COLORS[index],
                        color: 'white'
                      }}
                    >
                      {kpi.deltaType === 'increase' ? (
                        <ArrowUpRight className="w-3 h-3" />
                      ) : (
                        <ArrowDownRight className="w-3 h-3" />
                      )}
                      {kpi.delta}
                    </Badge>
                    <span className="text-xs text-muted-foreground">vs 先月</span>
                  </div>
                </div>
                <div className="w-20 h-12">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart 
                      data={kpi.sparklineData.map((value, i) => ({ value }))}
                      margin={{ top: 2, right: 2, left: 2, bottom: 2 }}
                    >
                      <defs>
                        <linearGradient id={`kpiGradient${index}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS[index]} stopOpacity={0.3}/>
                          <stop offset="95%" stopColor={COLORS[index]} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <YAxis 
                        hide 
                        domain={[
                          (dataMin) => Math.floor(dataMin * 0.98),
                          (dataMax) => Math.ceil(dataMax * 1.02)
                        ]} 
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke={COLORS[index]}
                        fill={`url(#kpiGradient${index})`}
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* メインチャートセクション */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* NPS詳細分析 - 左側に配置 */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur h-[400px] flex flex-col">
          <CardHeader className="pb-1">
            <CardTitle className="text-base">推奨スコア詳細分析</CardTitle>
            <CardDescription className="text-xs">推奨者・中立者・批判者の内訳</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 pt-0 pb-3 flex flex-col justify-between">
            <div className="space-y-2">
              {/* 半円グラフ */}
              <div className="relative h-40 -my-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <defs>
                      <linearGradient id="promoterGradient" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                        <stop offset="100%" stopColor="#34d399" stopOpacity={1} />
                      </linearGradient>
                      <linearGradient id="passiveGradient" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#f59e0b" stopOpacity={1} />
                        <stop offset="100%" stopColor="#fbbf24" stopOpacity={1} />
                      </linearGradient>
                      <linearGradient id="detractorGradient" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity={1} />
                        <stop offset="100%" stopColor="#f87171" stopOpacity={1} />
                      </linearGradient>
                    </defs>
                    <Pie
                      data={[
                        { name: '推奨者', value: npsDistribution.promoters, fill: 'url(#promoterGradient)' },
                        { name: '中立者', value: npsDistribution.passives, fill: 'url(#passiveGradient)' },
                        { name: '批判者', value: npsDistribution.detractors, fill: 'url(#detractorGradient)' }
                      ]}
                      cx="50%"
                      cy="85%"
                      startAngle={180}
                      endAngle={0}
                      outerRadius={95}
                      innerRadius={55}
                      dataKey="value"
                      strokeWidth={2}
                      stroke="#ffffff"
                      style={chartStyle}
                    >
                      <Cell style={chartStyle} />
                      <Cell style={chartStyle} />
                      <Cell style={chartStyle} />
                    </Pie>
                    <RechartsTooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-background p-2 border rounded shadow-lg">
                              <p className="text-sm font-medium">{payload[0].name}</p>
                              <p className="text-sm">{payload[0].value}%</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              {/* 詳細データ */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-200">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-br from-green-500 to-green-400"></div>
                    <span className="text-sm font-medium">推奨者（9-10点）</span>
                  </div>
                  <span className="text-sm font-bold text-green-700">{npsDistribution.promoters}%</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50 border border-amber-200">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-br from-amber-500 to-amber-400"></div>
                    <span className="text-sm font-medium">中立者（7-8点）</span>
                  </div>
                  <span className="text-sm font-bold text-amber-700">{npsDistribution.passives}%</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-red-50 border border-red-200">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-br from-red-500 to-red-400"></div>
                    <span className="text-sm font-medium">批判者（0-6点）</span>
                  </div>
                  <span className="text-sm font-bold text-red-700">{npsDistribution.detractors}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 月別トレンド - 右側に配置 */}
        <div className="lg:col-span-2 h-[400px]">
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur h-full flex flex-col">
            <CardHeader className="pb-2 shrink-0">
              <CardTitle className="text-lg">店舗パフォーマンス</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 pb-4 overflow-hidden">
              <ShadcnTabs defaultValue="nps" className="w-full h-full flex flex-col">
                <TabsList className="grid w-full grid-cols-4 shrink-0">
                  <TabsTrigger value="nps">推奨スコア</TabsTrigger>
                  <TabsTrigger value="repeat">リピート率</TabsTrigger>
                  <TabsTrigger value="repeatVisit">再来店意向（リピーター）</TabsTrigger>
                  <TabsTrigger value="newVisit">再来店意向（新規）</TabsTrigger>
                </TabsList>
                <TabsContent value="nps" className="mt-2 flex-1 overflow-hidden">
                  <div className="h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={monthlyPerformance}>
                        <defs>
                          <linearGradient id="colorNPS" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={COLORS[0]} stopOpacity={0.8}/>
                            <stop offset="95%" stopColor={COLORS[0]} stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="month" className="text-xs" />
                        <YAxis className="text-xs" domain={['auto', 'auto']} tickFormatter={(value) => `${value >= 0 ? '+' : ''}${value}pt`} />
                        <RechartsTooltip content={<CustomTooltip />} />
                        <Area 
                          type="monotone" 
                          dataKey="nps" 
                          stroke={COLORS[0]}
                          fillOpacity={1} 
                          fill="url(#colorNPS)" 
                          strokeWidth={2}
                        />
                        <Line
                          type="monotone"
                          dataKey="npsMA"
                          stroke="#6b7280"
                          strokeWidth={3}
                          strokeDasharray="5 5"
                          dot={false}
                          opacity={0.8}
                          name="5ヶ月移動平均"
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </TabsContent>
                <TabsContent value="repeat" className="mt-2 flex-1 overflow-hidden">
                  <div className="h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={monthlyPerformance}>
                        <defs>
                          <linearGradient id="colorRepeat" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={COLORS[1]} stopOpacity={0.8}/>
                            <stop offset="95%" stopColor={COLORS[1]} stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="month" className="text-xs" />
                        <YAxis className="text-xs" domain={['auto', 'auto']} tickFormatter={(value) => `${value}%`} />
                        <RechartsTooltip content={<CustomTooltip />} />
                        <Area 
                          type="monotone" 
                          dataKey="repeatRate" 
                          stroke={COLORS[1]}
                          fillOpacity={1} 
                          fill="url(#colorRepeat)" 
                          strokeWidth={2}
                        />
                        <Line
                          type="monotone"
                          dataKey="repeatRateMA"
                          stroke="#6b7280"
                          strokeWidth={3}
                          strokeDasharray="5 5"
                          dot={false}
                          opacity={0.8}
                          name="5ヶ月移動平均"
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </TabsContent>
                <TabsContent value="repeatVisit" className="mt-2 flex-1 overflow-hidden">
                  <div className="h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={monthlyPerformance}>
                        <defs>
                          <linearGradient id="colorRepeatVisit" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={COLORS[2]} stopOpacity={0.8}/>
                            <stop offset="95%" stopColor={COLORS[2]} stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="month" className="text-xs" />
                        <YAxis className="text-xs" domain={['auto', 'auto']} tickFormatter={(value) => `${value}%`} />
                        <RechartsTooltip content={<CustomTooltip />} />
                        <Area 
                          type="monotone" 
                          dataKey="repeatVisit" 
                          stroke={COLORS[2]}
                          fillOpacity={1} 
                          fill="url(#colorRepeatVisit)" 
                          strokeWidth={2}
                        />
                        <Line
                          type="monotone"
                          dataKey="repeatVisitMA"
                          stroke="#6b7280"
                          strokeWidth={3}
                          strokeDasharray="5 5"
                          dot={false}
                          opacity={0.8}
                          name="5ヶ月移動平均"
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </TabsContent>
                <TabsContent value="newVisit" className="mt-2 flex-1 overflow-hidden">
                  <div className="h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={monthlyPerformance}>
                        <defs>
                          <linearGradient id="colorNewVisit" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={COLORS[3]} stopOpacity={0.8}/>
                            <stop offset="95%" stopColor={COLORS[3]} stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="month" className="text-xs" />
                        <YAxis className="text-xs" domain={['auto', 'auto']} tickFormatter={(value) => `${value}%`} />
                        <RechartsTooltip content={<CustomTooltip />} />
                        <Area 
                          type="monotone" 
                          dataKey="newVisit" 
                          stroke={COLORS[3]}
                          fillOpacity={1} 
                          fill="url(#colorNewVisit)" 
                          strokeWidth={2}
                        />
                        <Line
                          type="monotone"
                          dataKey="newVisitMA"
                          stroke="#6b7280"
                          strokeWidth={3}
                          strokeDasharray="5 5"
                          dot={false}
                          opacity={0.8}
                          name="5ヶ月移動平均"
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </TabsContent>
              </ShadcnTabs>
            </CardContent>
          </Card>
        </div>
      </div>

    </div>
  );
};

// チャート共通スタイル
const chartStyle = { outline: 'none' };

// 売上影響タブ
const SalesImpactTab = ({ companyId, selectedStore, selectedPeriod }) => {
  const [loading, setLoading] = useState(true);
  const [impactData, setImpactData] = useState(null);

  // selectedPeriodを年月形式に変換 (2025/12 -> 2025-12)
  const getYearMonth = (period) => {
    if (!period) return null;
    return period.replace('/', '-');
  };

  // 月次サマリーテーブルからデータを取得
  useEffect(() => {
    const fetchImpactData = async () => {
      if (!companyId || !selectedStore) {
        setImpactData(null);
        setLoading(false);
        return;
      }
      setLoading(true);

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          throw new Error('認証が必要です');
        }

        const yearMonth = getYearMonth(selectedPeriod);
        const params = new URLSearchParams({
          company_id: companyId,
          store_id: selectedStore
        });
        if (yearMonth) {
          params.append('year_month', yearMonth);
        }

        const response = await fetch(
          `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/get-monthly-analytics?${params}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        const result = await response.json();
        console.log('SalesImpact API Response:', result);
        console.log('salesImpact data:', result.data?.salesImpact);

        if (!result.success) {
          throw new Error(result.error || 'データの取得に失敗しました');
        }

        setImpactData(result.data?.salesImpact || null);
      } catch (error) {
        console.error('売上影響データの取得エラー:', error);
        setImpactData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchImpactData();
  }, [companyId, selectedStore, selectedPeriod]);

  // データ取得結果から値を取得（デフォルト値付き）
  const segments = impactData?.segments || [];
  const trendData = impactData?.trendData || [];
  const totalCount = impactData?.totalCount || 0;
  const totalScore = impactData?.totalScore || 0;
  const positiveScore = impactData?.positiveScore || 0;
  const negativeScore = impactData?.negativeScore || 0;
  const normalizedScore = impactData?.normalizedScore || 50;
  const categoryDataFromApi = impactData?.categoryData || null;
  const compositionData = impactData?.compositionData || [];
  const avgComposition = impactData?.avgComposition || { newChurn: 0, newRepeaters: 0, stableRepeaters: 0, churnRisk: 0 };

  // 今月と先月のデータを取得
  const thisMonthComposition = compositionData.length > 0 ? compositionData[compositionData.length - 1] : null;
  const lastMonthComposition = compositionData.length > 1 ? compositionData[compositionData.length - 2] : null;

  // 6ヶ月平均計算
  const sixMonthAvg = trendData.length > 0
    ? Math.round(trendData.reduce((sum, d) => sum + d.score, 0) / trendData.length)
    : 0;
  const lastMonthScore = trendData.length > 0 ? trendData[trendData.length - 1].score : 0;
  const previousMonthScore = trendData.length > 1 ? trendData[trendData.length - 2].score : lastMonthScore;
  const monthlyChange = lastMonthScore - previousMonthScore;

  // 状態判定
  const getStatus = (score) => {
    if (score >= 65) return { label: '好調', color: 'text-green-600', bg: 'bg-green-50', gradient: 'from-green-500 to-emerald-500' };
    if (score >= 50) return { label: 'やや好調', color: 'text-emerald-600', bg: 'bg-emerald-50', gradient: 'from-emerald-500 to-teal-500' };
    if (score >= 40) return { label: 'やや注意', color: 'text-amber-600', bg: 'bg-amber-50', gradient: 'from-amber-500 to-orange-500' };
    return { label: '要改善', color: 'text-red-600', bg: 'bg-red-50', gradient: 'from-red-500 to-rose-500' };
  };

  const status = getStatus(normalizedScore);

  // 影響度の大きいセグメントを抽出
  const topImpacts = [...segments]
    .map(s => ({ ...s, totalImpact: s.impact * s.count }))
    .sort((a, b) => Math.abs(b.totalImpact) - Math.abs(a.totalImpact))
    .slice(0, 4);

  // 影響度ラベル
  const getImpactLabel = (impact) => {
    if (impact === 3) return { label: '非常に高い', color: 'text-green-600' };
    if (impact === 2) return { label: '高い', color: 'text-emerald-600' };
    if (impact === 1) return { label: 'やや高い', color: 'text-green-500' };
    if (impact === -1) return { label: 'やや低い', color: 'text-orange-600' };
    if (impact === -2) return { label: '低い', color: 'text-red-600' };
    if (impact === -3) return { label: '非常に低い', color: 'text-red-700' };
    return { label: '中立', color: 'text-gray-600' };
  };

  // カテゴリー別の集計データ（APIから取得またはデフォルト）
  const categoryData = categoryDataFromApi || {
    newRepeaters: { count: 0, impact: 0, nps: { promoters: 0, neutrals: 0, detractors: 0 } },
    stableRepeaters: { count: 0, impact: 0, nps: { promoters: 0, neutrals: 0, detractors: 0 } },
    churnRisk: { count: 0, impact: 0, nps: { promoters: 0, neutrals: 0, detractors: 0 } },
    newChurn: { count: 0, impact: 0, nps: { promoters: 0, neutrals: 0, detractors: 0 } }
  };

  // セグメントごとの構成比を計算
  const segmentsWithPercentage = segments.map(seg => ({
    ...seg,
    percentage: totalCount > 0 ? ((seg.count / totalCount) * 100).toFixed(1) : '0.0',
    // 実際の先月比（構成比の変化ポイント）
    monthOverMonthDisplay: seg.monthOverMonth === 0 || seg.monthOverMonth === undefined
      ? '±0pt'
      : `${seg.monthOverMonth > 0 ? '+' : ''}${seg.monthOverMonth}pt`
  })).sort((a, b) => parseFloat(b.percentage) - parseFloat(a.percentage));

  // スパークラインデータ（月別トレンドから生成）
  const sparklineData = {
    newRepeaters: trendData.slice(-3).map(d => d.positive > 0 ? Math.round(d.positive / (d.positive + d.negative) * 100) : 50),
    stableRepeaters: trendData.slice(-3).map(d => d.score),
    newChurn: trendData.slice(-3).map(d => d.negative > 0 ? Math.round(d.negative / (d.positive + d.negative) * 100) : 50),
    churnRisk: trendData.slice(-3).map(d => 100 - d.score)
  };

  // 各カテゴリーの割合を計算
  const totalCustomers = categoryData.newRepeaters.count + categoryData.stableRepeaters.count +
                        categoryData.newChurn.count + categoryData.churnRisk.count;

  const percentages = {
    newRepeaters: totalCustomers > 0 ? ((categoryData.newRepeaters.count / totalCustomers) * 100).toFixed(1) : '0.0',
    stableRepeaters: totalCustomers > 0 ? ((categoryData.stableRepeaters.count / totalCustomers) * 100).toFixed(1) : '0.0',
    newChurn: totalCustomers > 0 ? ((categoryData.newChurn.count / totalCustomers) * 100).toFixed(1) : '0.0',
    churnRisk: totalCustomers > 0 ? ((categoryData.churnRisk.count / totalCustomers) * 100).toFixed(1) : '0.0'
  };

  // ローディング表示（スケルトンスクリーン）
  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl p-5 shadow-sm">
              <Skeleton className="h-3 w-16 mb-3" />
              <Skeleton className="h-6 w-12 mb-2" />
              <Skeleton className="h-2 w-20" />
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <Skeleton className="h-4 w-32 mb-4" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <Skeleton className="h-4 w-40 mb-4" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-10 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // データがない場合の表示
  if (!impactData || segments.length === 0) {
    return (
      <div className="p-6 flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <p className="text-gray-500 text-lg">この期間のデータがありません</p>
          <p className="text-gray-400 text-sm mt-2">別の期間を選択してください</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* 顧客カテゴリー別分析 - 概要スタイル */}
      <div className="grid grid-cols-4 gap-4">
        {/* 新規離脱 */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">新規離脱</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">再来店意向なし</p>
              </div>
              <div className="w-16 h-10">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sparklineData.newChurn.map((value, index) => ({ value, index }))}>
                    <defs>
                      <linearGradient id="grayGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6b7280" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#6b7280" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#6b7280" 
                      fill="url(#grayGradient)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{categoryData.newChurn.count}</span>
                  <span className="text-sm text-muted-foreground">人</span>
                </div>
                <Progress value={parseFloat(percentages.newChurn)} className="h-2 mt-2 [&>*]:bg-gray-500" />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">構成比</span>
                <span className="font-medium text-gray-600">{percentages.newChurn}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* 新規→リピーター（増加分） */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">新規リピーター</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">再来店意向あり</p>
              </div>
              <div className="w-16 h-10">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sparklineData.newRepeaters.map((value, index) => ({ value, index }))}>
                    <defs>
                      <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#3b82f6" 
                      fill="url(#blueGradient)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{categoryData.newRepeaters.count}</span>
                  <span className="text-sm text-muted-foreground">人</span>
                </div>
                <Progress value={parseFloat(percentages.newRepeaters)} className="h-2 mt-2 [&>*]:bg-blue-500" />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">構成比</span>
                <span className="font-medium text-blue-600">{percentages.newRepeaters}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* 安定リピーター */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">安定リピーター</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">継続的な来店</p>
              </div>
              <div className="w-16 h-10">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sparklineData.stableRepeaters.map((value, index) => ({ value, index }))}>
                    <defs>
                      <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#22c55e" 
                      fill="url(#greenGradient)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{categoryData.stableRepeaters.count}</span>
                  <span className="text-sm text-muted-foreground">人</span>
                </div>
                <Progress value={parseFloat(percentages.stableRepeaters)} className="h-2 mt-2 [&>*]:bg-green-500" />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">構成比</span>
                <span className="font-medium text-green-600">{percentages.stableRepeaters}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* リピーター離脱 */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">リピーター離脱</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">再来店意向なし</p>
              </div>
              <div className="w-16 h-10">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sparklineData.churnRisk.map((value, index) => ({ value, index }))}>
                    <defs>
                      <linearGradient id="orangeGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#f97316" 
                      fill="url(#orangeGradient)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{categoryData.churnRisk.count}</span>
                  <span className="text-sm text-muted-foreground">人</span>
                </div>
                <Progress value={parseFloat(percentages.churnRisk)} className="h-2 mt-2 [&>*]:bg-orange-500" />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">構成比</span>
                <span className="font-medium text-orange-600">{percentages.churnRisk}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 顧客構成比較 */}
      <Card className="border-0 shadow-lg bg-white overflow-hidden">
        <CardContent className="p-4">
          <div>
            {/* ヘッダー */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">顧客構成比較</h3>
              {/* 凡例 */}
              <div className="flex gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-gray-500 rounded-sm"></div>
                  <span className="text-gray-600">新規離脱</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
                  <span className="text-gray-600">新規リピーター</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
                  <span className="text-gray-600">安定リピーター</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-orange-500 rounded-sm"></div>
                  <span className="text-gray-600">リピーター離脱</span>
                </div>
              </div>
            </div>

            {/* 横棒グラフ */}
            <div className="space-y-4">
              {/* 今月 */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">今月</span>
                  <span className="text-xs text-gray-500">{thisMonthComposition?.counts?.total || 0}件</span>
                </div>
                <div className="flex h-6 bg-gray-100 rounded-full overflow-hidden">
                  {thisMonthComposition ? (
                    <>
                      <div className="bg-gray-500 transition-all duration-500" style={{ width: `${thisMonthComposition.newChurn}%` }}>
                        {thisMonthComposition.newChurn > 5 && <span className="text-xs text-white font-medium flex items-center justify-center h-full">{thisMonthComposition.newChurn}%</span>}
                      </div>
                      <div className="bg-blue-500 transition-all duration-500" style={{ width: `${thisMonthComposition.newRepeaters}%` }}>
                        {thisMonthComposition.newRepeaters > 5 && <span className="text-xs text-white font-medium flex items-center justify-center h-full">{thisMonthComposition.newRepeaters}%</span>}
                      </div>
                      <div className="bg-green-500 transition-all duration-500" style={{ width: `${thisMonthComposition.stableRepeaters}%` }}>
                        {thisMonthComposition.stableRepeaters > 5 && <span className="text-xs text-white font-medium flex items-center justify-center h-full">{thisMonthComposition.stableRepeaters}%</span>}
                      </div>
                      <div className="bg-orange-500 transition-all duration-500" style={{ width: `${thisMonthComposition.churnRisk}%` }}>
                        {thisMonthComposition.churnRisk > 5 && <span className="text-xs text-white font-medium flex items-center justify-center h-full">{thisMonthComposition.churnRisk}%</span>}
                      </div>
                    </>
                  ) : (
                    <div className="w-full text-center text-xs text-gray-400 flex items-center justify-center">データなし</div>
                  )}
                </div>
              </div>

              {/* 先月 */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">先月{lastMonthComposition ? ` (${lastMonthComposition.month})` : ''}</span>
                  <span className="text-xs text-gray-500">{lastMonthComposition?.counts?.total || 0}件</span>
                </div>
                <div className="flex h-6 bg-gray-100 rounded-full overflow-hidden">
                  {lastMonthComposition ? (
                    <>
                      <div className="bg-gray-500 transition-all duration-500" style={{ width: `${lastMonthComposition.newChurn}%` }}>
                        {lastMonthComposition.newChurn > 5 && <span className="text-xs text-white font-medium flex items-center justify-center h-full">{lastMonthComposition.newChurn}%</span>}
                      </div>
                      <div className="bg-blue-500 transition-all duration-500" style={{ width: `${lastMonthComposition.newRepeaters}%` }}>
                        {lastMonthComposition.newRepeaters > 5 && <span className="text-xs text-white font-medium flex items-center justify-center h-full">{lastMonthComposition.newRepeaters}%</span>}
                      </div>
                      <div className="bg-green-500 transition-all duration-500" style={{ width: `${lastMonthComposition.stableRepeaters}%` }}>
                        {lastMonthComposition.stableRepeaters > 5 && <span className="text-xs text-white font-medium flex items-center justify-center h-full">{lastMonthComposition.stableRepeaters}%</span>}
                      </div>
                      <div className="bg-orange-500 transition-all duration-500" style={{ width: `${lastMonthComposition.churnRisk}%` }}>
                        {lastMonthComposition.churnRisk > 5 && <span className="text-xs text-white font-medium flex items-center justify-center h-full">{lastMonthComposition.churnRisk}%</span>}
                      </div>
                    </>
                  ) : (
                    <div className="w-full text-center text-xs text-gray-400 flex items-center justify-center">データなし</div>
                  )}
                </div>
              </div>

              {/* 6ヶ月平均 */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">6ヶ月平均</span>
                  <span className="text-xs text-gray-500">100%</span>
                </div>
                <div className="flex h-6 bg-gray-100 rounded-full overflow-hidden">
                  {compositionData.length > 0 ? (
                    <>
                      <div className="bg-gray-500 transition-all duration-500" style={{ width: `${avgComposition.newChurn}%` }}>
                        {avgComposition.newChurn > 5 && <span className="text-xs text-white font-medium flex items-center justify-center h-full">{avgComposition.newChurn}%</span>}
                      </div>
                      <div className="bg-blue-500 transition-all duration-500" style={{ width: `${avgComposition.newRepeaters}%` }}>
                        {avgComposition.newRepeaters > 5 && <span className="text-xs text-white font-medium flex items-center justify-center h-full">{avgComposition.newRepeaters}%</span>}
                      </div>
                      <div className="bg-green-500 transition-all duration-500" style={{ width: `${avgComposition.stableRepeaters}%` }}>
                        {avgComposition.stableRepeaters > 5 && <span className="text-xs text-white font-medium flex items-center justify-center h-full">{avgComposition.stableRepeaters}%</span>}
                      </div>
                      <div className="bg-orange-500 transition-all duration-500" style={{ width: `${avgComposition.churnRisk}%` }}>
                        {avgComposition.churnRisk > 5 && <span className="text-xs text-white font-medium flex items-center justify-center h-full">{avgComposition.churnRisk}%</span>}
                      </div>
                    </>
                  ) : (
                    <div className="w-full text-center text-xs text-gray-400 flex items-center justify-center">データなし</div>
                  )}
                </div>
              </div>
            </div>

          </div>
        </CardContent>
      </Card>


      {/* セグメント詳細テーブル */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-bold">セグメント別詳細分析</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium text-sm text-gray-600">推奨度</th>
                  <th className="text-left p-3 font-medium text-sm text-gray-600">再来店意向</th>
                  <th className="text-left p-3 font-medium text-sm text-gray-600">顧客タイプ</th>
                  <th className="text-left p-3 font-medium text-sm text-gray-600">影響度</th>
                  <th className="text-right p-3 font-medium text-sm text-gray-600">先月比</th>
                  <th className="text-center p-3 font-medium text-sm text-gray-600">構成比</th>
                </tr>
              </thead>
              <tbody>
                {segmentsWithPercentage.map((segment, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="p-3">
                      <span className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-bold text-white ${
                        segment.npsLabel === '推奨者' ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                        segment.npsLabel === '批判者' ? 'bg-gradient-to-r from-red-500 to-red-400' :
                        'bg-gradient-to-r from-amber-500 to-orange-400'
                      }`}>
                        {segment.npsLabel}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`text-sm ${
                        segment.revisitLabel === '再来店あり' ? 'text-green-600 font-medium' : 'text-gray-500'
                      }`}>
                        {segment.revisitLabel}
                      </span>
                    </td>
                    <td className="p-3">
                      {segment.customerLabel === 'リピーター' ? (
                        <div className="flex items-center">
                          <CheckCircle className="w-4 h-4 text-green-600 mr-1" />
                          <span className="text-sm text-green-700">リピーター</span>
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <User className="w-4 h-4 text-gray-400 mr-1" />
                          <span className="text-sm text-gray-500">新規</span>
                        </div>
                      )}
                    </td>
                    <td className="p-3">
                      <span className={`text-sm ${getImpactLabel(segment.impact).color}`}>
                        {getImpactLabel(segment.impact).label}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <span className={`text-sm font-medium ${
                        segment.monthOverMonth > 0 ? 'text-green-600' :
                        segment.monthOverMonth < 0 ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {segment.monthOverMonthDisplay}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-1.5">
                          <div 
                            className="bg-gray-600 h-1.5 rounded-full"
                            style={{ width: `${segment.percentage}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600 w-12 text-right">{segment.percentage}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// 店舗評価タブ
const StoreEvaluationTab = ({ companyId, selectedStore, selectedPeriod }) => {
  const [loading, setLoading] = useState(true);
  const [evaluationData, setEvaluationData] = useState(null);

  // selectedPeriodを年月形式に変換 (2025/12 -> 2025-12)
  const getYearMonth = (period) => {
    if (!period) return null;
    return period.replace('/', '-');
  };

  // 月次サマリーテーブルからデータを取得
  useEffect(() => {
    const fetchEvaluationData = async () => {
      if (!companyId || !selectedStore) {
        setEvaluationData(null);
        setLoading(false);
        return;
      }
      setLoading(true);

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          throw new Error('認証が必要です');
        }

        const yearMonth = getYearMonth(selectedPeriod);
        const params = new URLSearchParams({
          company_id: companyId,
          store_id: selectedStore
        });
        if (yearMonth) {
          params.append('year_month', yearMonth);
        }

        const response = await fetch(
          `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/get-monthly-analytics?${params}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'データの取得に失敗しました');
        }

        setEvaluationData(result.data?.storeEvaluation || null);
      } catch (error) {
        console.error('店舗評価データの取得エラー:', error);
        setEvaluationData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchEvaluationData();
  }, [companyId, selectedStore, selectedPeriod]);

  // カラーマッピング
  const colorMap = {
    violet: 'from-violet-500 to-purple-500',
    blue: 'from-blue-500 to-indigo-500',
    emerald: 'from-emerald-500 to-teal-500'
  };

  // アイコンマッピング
  const iconMap = {
    Q: UtensilsCrossed,
    S: Users,
    C: Sparkles
  };

  // QSCスコアデータ（APIから取得またはデフォルト）
  const qscScores = evaluationData?.qscScores || {
    Q: { label: 'クオリティ', score: 0, trend: 0, color: 'violet' },
    S: { label: 'サービス', score: 0, trend: 0, color: 'blue' },
    C: { label: 'クレンリネス', score: 0, trend: 0, color: 'emerald' }
  };

  // QSC詳細データ（APIから取得またはデフォルト）
  const qscDetailedData = evaluationData?.qscDetailedData || {
    Q: { items: [], positiveCount: 0, negativeCount: 0, neutralCount: 0, totalResponses: 0 },
    S: { items: [], positiveCount: 0, negativeCount: 0, neutralCount: 0, totalResponses: 0 },
    C: { items: [], positiveCount: 0, negativeCount: 0, neutralCount: 0, totalResponses: 0 }
  };

  // ローディング表示（スケルトンスクリーン）
  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="grid grid-cols-3 divide-x divide-gray-100">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-5">
                <Skeleton className="h-3 w-16 mb-3" />
                <Skeleton className="h-8 w-14 mb-3" />
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <Skeleton className="h-4 w-28 mb-5" />
          <div className="grid grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-3">
                {[1, 2, 3, 4, 5].map((j) => (
                  <Skeleton key={j} className="h-8 w-full rounded-lg" />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* QSCスコアカード - スマートでコンパクトなデザイン */}
      <Card className="border-0 shadow-xl bg-white overflow-hidden">
        <CardContent className="p-0">
          <div className="grid grid-cols-3 divide-x divide-gray-100">
            {Object.entries(qscScores).map(([key, data], index) => {
              const Icon = iconMap[key];
              const isPositive = data.trend >= 0;
              const gradientColor = colorMap[data.color];
              
              return (
                <div key={key} className="relative group">
                  {/* 背景グラデーション */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${gradientColor} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                  
                  <div className="p-6 space-y-3">
                    {/* ヘッダー部分 */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-gradient-to-br ${gradientColor} bg-opacity-10`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">{
                          key === 'Q' ? 'Quality' : key === 'S' ? 'Service' : 'Cleanliness'
                        }</h3>
                          <p className="text-xs text-muted-foreground">{data.label}</p>
                        </div>
                      </div>
                      <Badge
                        variant="secondary"
                        className={`text-xs px-2 py-0.5 ${
                          isPositive ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'
                        }`}
                      >
                        {isPositive ? '↑' : '↓'} {Math.abs(data.trend).toFixed(1)}
                      </Badge>
                    </div>

                    {/* スコア表示 */}
                    <div className="flex items-end justify-between">
                      <div className="flex items-baseline gap-1">
                        <span className={`text-3xl font-bold bg-gradient-to-r ${gradientColor} bg-clip-text text-transparent`}>
                          {data.score.toFixed(2)}
                        </span>
                        <span className="text-xs text-muted-foreground">/ 5.00</span>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">達成率</div>
                        <div className="text-sm font-semibold text-gray-700">
                          {((data.score / 5) * 100).toFixed(0)}%
                        </div>
                      </div>
                    </div>
                    
                    {/* プログレスバー */}
                    <div className="relative h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`absolute inset-y-0 left-0 bg-gradient-to-r ${gradientColor} rounded-full transition-all duration-700 ease-out`}
                        style={{ width: `${(data.score / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* QSC詳細評価 */}
      <Card className="border-0 shadow-xl bg-white">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">QSC項目別評価</CardTitle>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-gradient-to-r from-green-500 to-emerald-400"></div>
                <span className="text-gray-600">ポジティブ</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-gray-300"></div>
                <span className="text-gray-600">ニュートラル</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-gradient-to-r from-red-500 to-rose-400"></div>
                <span className="text-gray-600">ネガティブ</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pb-6">
          <div className="grid grid-cols-3 gap-6">
            {Object.entries(qscDetailedData).map(([category, data]) => {
              const totalResponses = data.totalResponses || 0;
              const items = data.items || [];
              return (
                <div key={category} className="space-y-3">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      {category === 'Q' && <UtensilsCrossed className="w-5 h-5 text-violet-600" />}
                      {category === 'S' && <Users className="w-5 h-5 text-blue-600" />}
                      {category === 'C' && <Sparkles className="w-5 h-5 text-emerald-600" />}
                      <h3 className="font-semibold text-gray-900">
                        {category === 'Q' ? 'Quality' : category === 'S' ? 'Service' : 'Cleanliness'}
                      </h3>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      n={totalResponses.toLocaleString()}
                    </span>
                  </div>

                  {items.length > 0 ? items.map((item, index) => {
                    const positivePercentage = item.positive || 0;
                    const neutralPercentage = item.neutral || 0;
                    const negativePercentage = item.negative || 0;

                    return (
                      <div key={index} className="group mb-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-600 group-hover:text-gray-900 transition-colors">
                            {item.label}
                          </span>
                        </div>
                        <div className="relative h-6 bg-gray-50 rounded overflow-hidden border border-gray-200 flex">
                          {/* ポジティブ部分 */}
                          <div
                            className="h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-700 ease-out"
                            style={{ width: `${positivePercentage}%` }}
                          >
                            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                          </div>
                          {/* ニュートラル部分 */}
                          <div
                            className="h-full bg-gray-300 transition-all duration-700 ease-out"
                            style={{ width: `${neutralPercentage}%` }}
                          >
                            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                          </div>
                          {/* ネガティブ部分 */}
                          <div
                            className="h-full bg-gradient-to-r from-rose-400 to-red-500 transition-all duration-700 ease-out"
                            style={{ width: `${negativePercentage}%` }}
                          >
                            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                          </div>
                        </div>
                        <div className="flex justify-between text-xs mt-1">
                          <span className="text-green-600 font-medium">{Math.round(positivePercentage)}%</span>
                          <span className="text-gray-500 font-medium">{Math.round(neutralPercentage)}%</span>
                          <span className="text-red-600 font-medium">{Math.round(negativePercentage)}%</span>
                        </div>
                      </div>
                    );
                  }) : (
                    <div className="text-center text-gray-400 py-8">
                      データがありません
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

    </div>
  );
};

// 顧客傾向タブ
const CustomerTrendsTab = ({ companyId, selectedStore, selectedPeriod }) => {
  const [loading, setLoading] = useState(true);
  const [trendsData, setTrendsData] = useState(null);

  // selectedPeriodを年月形式に変換 (2025/12 -> 2025-12)
  const getYearMonth = (period) => {
    if (!period) return null;
    return period.replace('/', '-');
  };

  // 月次サマリーテーブルからデータを取得
  useEffect(() => {
    const fetchTrendsData = async () => {
      if (!companyId || !selectedStore) {
        setTrendsData(null);
        setLoading(false);
        return;
      }
      setLoading(true);

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          throw new Error('認証が必要です');
        }

        const yearMonth = getYearMonth(selectedPeriod);
        const params = new URLSearchParams({
          company_id: companyId,
          store_id: selectedStore
        });
        if (yearMonth) {
          params.append('year_month', yearMonth);
        }

        const response = await fetch(
          `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/get-monthly-analytics?${params}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'データの取得に失敗しました');
        }

        setTrendsData(result.data?.customerTrends || null);
      } catch (error) {
        console.error('顧客傾向データの取得エラー:', error);
        setTrendsData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchTrendsData();
  }, [companyId, selectedStore, selectedPeriod]);

  // データ取得結果から各分布を取得
  const genderDistribution = trendsData?.genderDistribution || [];
  const customerTypeDistribution = trendsData?.customerTypeDistribution || [];
  const ageDistribution = trendsData?.ageDistribution || [];
  const companionDistribution = trendsData?.companionDistribution || [];
  const radarData = trendsData?.radarData || [];

  // 性別データのフォーマット（グラフ用）
  const genderChartData = genderDistribution.map(item => ({
    name: item.name,
    value: item.value,
    fill: item.name === '男性' ? '#3b82f6' : item.name === '女性' ? '#ec4899' : '#9ca3af'
  }));

  // 顧客タイプデータのフォーマット
  const customerTypeChartData = customerTypeDistribution.map(item => ({
    name: item.name,
    value: item.value,
    fill: item.name === 'リピーター' ? '#10b981' : '#f59e0b'
  }));

  // 年齢データのフォーマット
  const ageColors = ['#8b5cf6', '#6366f1', '#3b82f6', '#0ea5e9', '#06b6d4'];
  const ageChartData = ageDistribution.map((item, index) => ({
    name: item.name,
    value: item.value,
    fill: ageColors[index % ageColors.length]
  }));

  // 同行者データのフォーマット
  const companionColors = ['#f97316', '#fb923c', '#fdba74', '#fed7aa'];
  const companionChartData = companionDistribution.slice(0, 4).map((item, index) => ({
    name: item.name,
    value: item.value,
    fill: companionColors[index % companionColors.length]
  }));

  // ローディング表示（スケルトンスクリーン）
  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl p-5 shadow-sm">
              <Skeleton className="h-3 w-16 mb-4" />
              <Skeleton className="h-28 w-full rounded-lg" />
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <Skeleton className="h-4 w-32 mb-4" />
          <Skeleton className="h-56 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* 基本属性分析 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* 性別比率 */}
        <Card className="border-0 shadow-xl bg-white overflow-hidden">
          <CardHeader className="pb-0">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              性別比率
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-1 pb-2">
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                  <Pie
                    data={genderChartData.length > 0 ? genderChartData : [{ name: 'データなし', value: 100, fill: '#e5e7eb' }]}
                    cx="50%"
                    cy="90%"
                    startAngle={180}
                    endAngle={0}
                    outerRadius={60}
                    innerRadius={35}
                    dataKey="value"
                    style={chartStyle}
                  >
                    {(genderChartData.length > 0 ? genderChartData : [{ name: 'データなし', value: 100, fill: '#e5e7eb' }]).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} style={chartStyle} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-1 text-xs">
                {genderChartData.map((item, index) => (
                  <div key={index} className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }}></div>
                    <span>{item.name} {item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* リピーター・新規比率 */}
        <Card className="border-0 shadow-xl bg-white overflow-hidden">
          <CardHeader className="pb-0">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="w-4 h-4 text-green-600" />
              顧客タイプ
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-1 pb-2">
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                  <Pie
                    data={customerTypeChartData.length > 0 ? customerTypeChartData : [{ name: 'データなし', value: 100, fill: '#e5e7eb' }]}
                    cx="50%"
                    cy="90%"
                    startAngle={180}
                    endAngle={0}
                    outerRadius={60}
                    innerRadius={35}
                    dataKey="value"
                    style={chartStyle}
                  >
                    {(customerTypeChartData.length > 0 ? customerTypeChartData : [{ name: 'データなし', value: 100, fill: '#e5e7eb' }]).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} style={chartStyle} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-1 text-xs">
                {customerTypeChartData.map((item, index) => (
                  <div key={index} className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }}></div>
                    <span>{item.name} {item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 年齢層 */}
        <Card className="border-0 shadow-xl bg-white overflow-hidden">
          <CardHeader className="pb-0">
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-600" />
              年齢層
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-1 pb-4">
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 25, right: 40, bottom: 25, left: 40 }}>
                  <Pie
                    data={ageChartData.length > 0 ? ageChartData : [{ name: 'データなし', value: 100, fill: '#e5e7eb' }]}
                    cx="50%"
                    cy="50%"
                    outerRadius={40}
                    dataKey="value"
                    label={({ cx, cy, midAngle, outerRadius, value, index }) => {
                      const RADIAN = Math.PI / 180;
                      const radius = outerRadius + 25;
                      const x = cx + radius * Math.cos(-midAngle * RADIAN);
                      const y = cy + radius * Math.sin(-midAngle * RADIAN);
                      const chartData = ageChartData.length > 0 ? ageChartData : [{ name: 'データなし', value: 100 }];
                      return (
                        <text x={x} y={y} fontSize={10} fill="#6b7280" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
                          {`${chartData[index]?.name || ''} ${value}%`}
                        </text>
                      );
                    }}
                  >
                    {(ageChartData.length > 0 ? ageChartData : [{ name: 'データなし', value: 100, fill: '#e5e7eb' }]).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} style={chartStyle} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* 同行者 */}
        <Card className="border-0 shadow-xl bg-white overflow-hidden">
          <CardHeader className="pb-0">
            <CardTitle className="text-sm flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-orange-600" />
              同行者
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-1 pb-4">
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 25, right: 40, bottom: 25, left: 40 }}>
                  <Pie
                    data={companionChartData.length > 0 ? companionChartData : [{ name: 'データなし', value: 100, fill: '#e5e7eb' }]}
                    cx="50%"
                    cy="50%"
                    outerRadius={40}
                    dataKey="value"
                    label={({ cx, cy, midAngle, outerRadius, value, index }) => {
                      const RADIAN = Math.PI / 180;
                      const radius = outerRadius + 25;
                      const x = cx + radius * Math.cos(-midAngle * RADIAN);
                      const y = cy + radius * Math.sin(-midAngle * RADIAN);
                      const chartData = companionChartData.length > 0 ? companionChartData : [{ name: 'データなし', value: 100 }];
                      const label = chartData[index]?.name || '';
                      const shortLabel = label.length > 4 ? label.substring(0, 4) : label;
                      return (
                        <text x={x} y={y} fontSize={10} fill="#6b7280" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
                          {`${shortLabel} ${value}%`}
                        </text>
                      );
                    }}
                  >
                    {(companionChartData.length > 0 ? companionChartData : [{ name: 'データなし', value: 100, fill: '#e5e7eb' }]).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} style={chartStyle} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 顧客の重視ポイント */}
      <Card className="border-0 shadow-xl bg-white">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            顧客の重視ポイント
            <InfoTooltip content="品質・接客・空間・衛生・価格感度の5つの観点で、顧客が何を重視しているかを表示（1位=2pt、2位=1ptで重み付け）" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 全体の傾向 */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-center text-gray-700">全体の評価</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid 
                      stroke="#e5e7eb"
                      strokeDasharray="3 3"
                      radialLines={true}
                    />
                    <PolarAngleAxis 
                      dataKey="category"
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                      className="text-xs"
                    />
                    <PolarRadiusAxis
                      angle={90}
                      domain={[0, 100]}
                      tickCount={6}
                      tick={{ fontSize: 10, fill: '#9ca3af' }}
                    />
                    <Radar
                      name="全体"
                      dataKey="total"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.4}
                      strokeWidth={2}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        fontSize: '12px'
                      }}
                      formatter={(value) => [`${value}`, '評価スコア']}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1 px-4">
                {[...radarData].sort((a, b) => b.total - a.total).map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">
                      <span className="font-semibold">{index + 1}位</span> {item.category}
                    </span>
                    <span className="font-semibold text-blue-600">{item.total}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* リピーターの傾向 */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-center text-gray-700">リピーターの評価</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid 
                      stroke="#e5e7eb"
                      strokeDasharray="3 3"
                      radialLines={true}
                    />
                    <PolarAngleAxis 
                      dataKey="category"
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                      className="text-xs"
                    />
                    <PolarRadiusAxis
                      angle={90}
                      domain={[0, 100]}
                      tickCount={6}
                      tick={{ fontSize: 10, fill: '#9ca3af' }}
                    />
                    <Radar
                      name="リピーター"
                      dataKey="repeater"
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.4}
                      strokeWidth={2}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        fontSize: '12px'
                      }}
                      formatter={(value) => [`${value}`, '評価スコア']}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1 px-4">
                {[...radarData].sort((a, b) => b.repeater - a.repeater).map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">
                      <span className="font-semibold">{index + 1}位</span> {item.category}
                    </span>
                    <span className="font-semibold text-green-600">{item.repeater}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 新規の傾向 */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-center text-gray-700">新規顧客の評価</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid 
                      stroke="#e5e7eb"
                      strokeDasharray="3 3"
                      radialLines={true}
                    />
                    <PolarAngleAxis 
                      dataKey="category"
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                      className="text-xs"
                    />
                    <PolarRadiusAxis
                      angle={90}
                      domain={[0, 100]}
                      tickCount={6}
                      tick={{ fontSize: 10, fill: '#9ca3af' }}
                    />
                    <Radar
                      name="新規"
                      dataKey="newCustomer"
                      stroke="#f59e0b"
                      fill="#f59e0b"
                      fillOpacity={0.4}
                      strokeWidth={2}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        fontSize: '12px'
                      }}
                      formatter={(value) => [`${value}`, '評価スコア']}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1 px-4">
                {[...radarData].sort((a, b) => b.newCustomer - a.newCustomer).map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">
                      <span className="font-semibold">{index + 1}位</span> {item.category}
                    </span>
                    <span className="font-semibold text-amber-600">{item.newCustomer}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  );
};

// コメントタブ
const CommentsTab = ({ companyId, selectedStore, selectedPeriod }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [commentsData, setCommentsData] = useState([]);
  const itemsPerPage = 50;

  // フィルター状態
  const [filters, setFilters] = useState({
    gender: [],
    age: [],
    npsType: [],
    isRepeater: [],
    revisitIntent: [],
    commentSearch: ''
  });
  const [tempFilters, setTempFilters] = useState({
    gender: [],
    age: [],
    npsType: [],
    isRepeater: [],
    revisitIntent: [],
    commentSearch: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  // コメントデータを取得（Edge Function経由）
  useEffect(() => {
    const fetchComments = async () => {
      if (!companyId) return;
      setLoading(true);

      try {
        // 認証トークンを取得
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          throw new Error('認証が必要です');
        }

        // Edge Function経由でデータを取得
        const params = new URLSearchParams({
          company_id: companyId,
          limit: '500'
        });
        if (selectedStore !== 'all') {
          params.append('store_id', selectedStore);
        }

        const response = await fetch(
          `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/get-preset-comments?${params}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'データの取得に失敗しました');
        }

        // データを整形
        const formattedData = (result.data || []).map(item => {
          const answer = item.preset_question_answer;

          // 推奨度（p1_q1: 0-10）からNPSタイプを判定
          const npsScore = answer.p1_q1;
          let npsType = '中立者';
          if (npsScore >= 9) npsType = '推奨者';
          else if (npsScore <= 6) npsType = '批判者';

          // 来店回数からリピーター判定
          const visitCount = answer.p1_q3;
          const isRepeater = visitCount !== '初めて';

          // 再来店意向（p1_q2: enum - 1ヶ月以内,3ヶ月以内 → あり、それ以外 → なし）
          const revisitIntent = (answer.p1_q2 === '1ヶ月以内' || answer.p1_q2 === '3ヶ月以内') ? 'あり' : 'なし';

          // 年齢を整形（例: "25歳~29歳" → "20代"）
          const ageRange = answer.p1_q5 || '';
          let age = 'その他';
          if (ageRange.includes('20') || ageRange.includes('25') || ageRange.includes('29')) age = '20代';
          else if (ageRange.includes('30') || ageRange.includes('35') || ageRange.includes('39')) age = '30代';
          else if (ageRange.includes('40') || ageRange.includes('45') || ageRange.includes('49')) age = '40代';
          else if (ageRange.includes('50') || ageRange.includes('55') || ageRange.includes('59')) age = '50代';
          else if (ageRange.includes('60') || ageRange.includes('65')) age = '60代';

          return {
            id: item.id,
            gender: answer.p1_q4 || 'その他',
            age: age,
            npsType: npsType,
            npsScore: npsScore,
            isRepeater: isRepeater,
            revisitIntent: revisitIntent,
            comment: item.comment,
            date: new Date(item.created_at).toLocaleString('ja-JP', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            }),
            storeId: answer.store_id
          };
        });

        setCommentsData(formattedData);
      } catch (error) {
        console.error('コメントデータの取得エラー:', error);
        setCommentsData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
  }, [companyId, selectedStore]);

  // フィルタリング処理
  const filteredComments = commentsData.filter(comment => {
    // 性別フィルター
    if (filters.gender.length > 0 && !filters.gender.includes(comment.gender)) return false;

    // 年齢フィルター
    if (filters.age.length > 0 && !filters.age.includes(comment.age)) return false;

    // NPSタイプフィルター
    if (filters.npsType.length > 0 && !filters.npsType.includes(comment.npsType)) return false;

    // リピーターフィルター
    if (filters.isRepeater.length > 0) {
      const repeaterStatus = comment.isRepeater ? 'リピーター' : '新規';
      if (!filters.isRepeater.includes(repeaterStatus)) return false;
    }

    // 再来店意向フィルター
    if (filters.revisitIntent.length > 0 && !filters.revisitIntent.includes(comment.revisitIntent)) return false;

    // コメント検索
    if (filters.commentSearch) {
      const searchLower = filters.commentSearch.toLowerCase();
      if (!comment.comment.toLowerCase().includes(searchLower)) return false;
    }

    return true;
  });
  
  // 現在のページのデータを取得
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentComments = filteredComments.slice(indexOfFirstItem, indexOfLastItem);
  
  // ページ数を計算
  const totalPages = Math.ceil(filteredComments.length / itemsPerPage);
  
  // フィルター変更時の処理（一時的な変更）
  const handleTempFilterChange = (filterName, value, isChecked) => {
    if (filterName === 'commentSearch') {
      setTempFilters(prev => ({ ...prev, commentSearch: value }));
    } else {
      setTempFilters(prev => {
        const currentValues = [...prev[filterName]];
        if (isChecked) {
          if (!currentValues.includes(value)) {
            currentValues.push(value);
          }
        } else {
          const index = currentValues.indexOf(value);
          if (index > -1) {
            currentValues.splice(index, 1);
          }
        }
        return { ...prev, [filterName]: currentValues };
      });
    }
  };
  
  // 検索ボックスの変更（即座に反映）
  const handleSearchChange = (value) => {
    setFilters(prev => ({ ...prev, commentSearch: value }));
    setTempFilters(prev => ({ ...prev, commentSearch: value }));
    setCurrentPage(1);
  };

  // フィルター適用
  const applyFilters = () => {
    setFilters(tempFilters);
    setCurrentPage(1);
    setShowFilters(false);
  };
  
  // フィルターを開く時に一時フィルターを現在のフィルターと同期
  const toggleFilters = () => {
    if (!showFilters) {
      setTempFilters(filters);
    }
    setShowFilters(!showFilters);
  };
  
  // ページネーション制御
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // NPSタイプのカラー設定
  const getNPSBadge = (type) => {
    switch (type) {
      case "推奨者":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-bold text-white bg-gradient-to-r from-green-500 to-emerald-500">
            推奨者
          </span>
        );
      case "批判者":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-bold text-white bg-gradient-to-r from-red-500 to-red-400">
            批判者
          </span>
        );
      case "中立者":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-orange-400">
            中立者
          </span>
        );
      default:
        return <Badge>{type}</Badge>;
    }
  };

  // ローディング表示（スケルトンスクリーン）
  if (loading) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-9 w-28 rounded-lg" />
            </div>
          </div>
          <div className="divide-y divide-gray-50">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="p-4">
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* テーブル */}
      <Card className="border-0 shadow-xl bg-white overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span>顧客コメント分析</span>
              <span className="text-sm font-normal text-gray-600">
                {filteredComments.length} 件の結果
              </span>
            </div>
            <div className="flex items-center gap-4">
              {/* 検索ボックス */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="コメントを検索..."
                  value={filters.commentSearch}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-64 px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                />
                {filters.commentSearch && (
                  <button
                    onClick={() => handleSearchChange('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <Close className="w-4 h-4" />
                  </button>
                )}
              </div>
              {/* フィルター開閉ボタン */}
              <Button
                variant="outline"
                size="sm"
                onClick={toggleFilters}
                className={`flex items-center gap-2 ${showFilters ? 'bg-purple-50 border-purple-300' : ''}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                フィルター
                {Object.entries(filters).filter(([key, value]) => 
                  key === 'commentSearch' ? value !== '' : value.length > 0
                ).length > 0 && (
                  <span className="ml-1 px-2 py-0.5 text-xs bg-purple-500 text-white rounded-full">
                    {Object.entries(filters).filter(([key, value]) => 
                      key === 'commentSearch' ? value !== '' : value.length > 0
                    ).length}
                  </span>
                )}
              </Button>
            </div>
          </CardTitle>
          
          {/* フィルターセクション */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="space-y-4">
                {/* 性別フィルター */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">性別</p>
                  <div className="flex flex-wrap gap-3">
                    {['男性', '女性', 'その他'].map(gender => (
                      <label key={gender} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={tempFilters.gender.includes(gender)}
                          onChange={(e) => handleTempFilterChange('gender', gender, e.target.checked)}
                          className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                        />
                        <span className="text-sm text-gray-700">{gender}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* 年齢フィルター */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">年齢</p>
                  <div className="flex flex-wrap gap-3">
                    {['20代', '30代', '40代', '50代', '60代'].map(age => (
                      <label key={age} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={tempFilters.age.includes(age)}
                          onChange={(e) => handleTempFilterChange('age', age, e.target.checked)}
                          className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                        />
                        <span className="text-sm text-gray-700">{age}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* 推奨度フィルター */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">推奨度</p>
                  <div className="flex flex-wrap gap-3">
                    {['推奨者', '中立者', '批判者'].map(nps => (
                      <label key={nps} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={tempFilters.npsType.includes(nps)}
                          onChange={(e) => handleTempFilterChange('npsType', nps, e.target.checked)}
                          className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                        />
                        <span className="text-sm text-gray-700">{nps}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* リピーター・再来店意向 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* リピーター */}
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">リピーター</p>
                    <div className="space-y-2">
                      {['リピーター', '新規'].map(status => (
                        <label key={status} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={tempFilters.isRepeater.includes(status)}
                            onChange={(e) => handleTempFilterChange('isRepeater', status, e.target.checked)}
                            className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                          />
                          <span className="text-sm text-gray-700">{status}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* 再来店意向 */}
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">再来店意向</p>
                    <div className="space-y-2">
                      {['あり', 'なし'].map(intent => (
                        <label key={intent} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={tempFilters.revisitIntent.includes(intent)}
                            onChange={(e) => handleTempFilterChange('revisitIntent', intent, e.target.checked)}
                            className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                          />
                          <span className="text-sm text-gray-700">{intent}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* フィルター適用・リセットボタン */}
                <div className="pt-4 flex items-center justify-between border-t border-gray-200">
                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={applyFilters}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      フィルターを適用
                    </Button>
                    {Object.entries(tempFilters).some(([key, value]) => 
                      key === 'commentSearch' ? value !== '' : value.length > 0
                    ) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setTempFilters({
                            gender: [],
                            age: [],
                            npsType: [],
                            isRepeater: [],
                            revisitIntent: [],
                            commentSearch: filters.commentSearch
                          });
                        }}
                        className="text-sm"
                      >
                        クリア
                      </Button>
                    )}
                  </div>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <Close className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    性別
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    年齢
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    推奨度
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    リピーター
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    再来店意向
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    課題
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    タグ
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    コメント
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {currentComments.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2 text-gray-500">
                        <Comment className="w-12 h-12 opacity-50" />
                        <p>コメントがありません</p>
                      </div>
                    </td>
                  </tr>
                ) : currentComments.map((comment) => (
                  <tr key={comment.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                          comment.gender === "女性" ? "bg-pink-100 text-pink-700" :
                          comment.gender === "男性" ? "bg-blue-100 text-blue-700" :
                          "bg-purple-100 text-purple-700"
                        }`}>
                          {comment.gender === "女性" ? "女" :
                           comment.gender === "男性" ? "男" : "他"}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{comment.age}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getNPSBadge(comment.npsType)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {comment.isRepeater ? (
                        <div className="flex items-center">
                          <CheckCircle className="w-4 h-4 text-green-600 mr-1" />
                          <span className="text-sm text-green-700">リピーター</span>
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <User className="w-4 h-4 text-gray-400 mr-1" />
                          <span className="text-sm text-gray-500">新規</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${
                        comment.revisitIntent === 'あり' ? 'text-green-600' : 'text-gray-500'
                      }`}>
                        {comment.revisitIntent}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {/* 課題 - 将来実装予定 */}
                      <span className="text-gray-300">-</span>
                    </td>
                    <td className="px-6 py-4">
                      {/* タグ - 将来実装予定 */}
                      <span className="text-gray-300">-</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-md">
                        <p className="text-sm text-gray-900 line-clamp-2">
                          {comment.comment}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {comment.date}
                        </p>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ページネーション */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">
          全 {filteredComments.length} 件中 {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredComments.length)} 件を表示
        </p>
        <div className="flex gap-2 items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1"
          >
            <ChevronDown className="w-4 h-4 rotate-90" />
            前へ
          </Button>
          
          <div className="flex gap-1">
            {[...Array(totalPages)].map((_, index) => {
              const page = index + 1;
              // 現在のページの前後2ページまで表示
              if (
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 1 && page <= currentPage + 1)
              ) {
                return (
                  <Button
                    key={page}
                    variant={page === currentPage ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(page)}
                    className={`w-10 h-10 p-0 ${
                      page === currentPage
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white'
                        : ''
                    }`}
                  >
                    {page}
                  </Button>
                );
              } else if (
                (page === currentPage - 2 && page > 1) ||
                (page === currentPage + 2 && page < totalPages)
              ) {
                return (
                  <span key={page} className="px-2 text-gray-400">
                    ...
                  </span>
                );
              }
              return null;
            })}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1"
          >
            次へ
            <ChevronUp className="w-4 h-4 rotate-90" />
          </Button>
        </div>
      </div>
    </div>
  );
};

// リアルタイムタブの内容
const RealtimeTab = ({ companyId }) => {
  const [selectedStore, setSelectedStore] = useState('all');
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [commentsData, setCommentsData] = useState([]);
  const itemsPerPage = 50;

  // フィルター状態
  const [filters, setFilters] = useState({
    gender: [],
    age: [],
    npsType: [],
    isRepeater: [],
    revisitIntent: [],
    commentSearch: ''
  });
  const [tempFilters, setTempFilters] = useState({
    gender: [],
    age: [],
    npsType: [],
    isRepeater: [],
    revisitIntent: [],
    commentSearch: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  // 店舗データを取得（Edge Function経由 - パートナーアクセス対応）
  useEffect(() => {
    const fetchStores = async () => {
      if (!companyId) return;

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          console.error('No session');
          return;
        }

        // Edge Function経由で店舗を取得（RLSをバイパスしてパートナーアクセスをチェック）
        const response = await fetch(
          `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/get-monthly-analytics?company_id=${companyId}&store_id=all`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.ok) {
          const result = await response.json();
          // allCompanyStores を優先して使用（全店舗リスト）
          if (result.success && result.data?.allCompanyStores) {
            setStores(result.data.allCompanyStores);
            return;
          }
        }

        // フォールバック: 直接storesテーブルから取得
        const { data, error } = await supabase
          .from('stores')
          .select('id, name')
          .eq('company_id', companyId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setStores(data || []);
      } catch (error) {
        console.error('店舗データの取得エラー:', error);
      }
    };

    fetchStores();
  }, [companyId]);

  // コメントデータを取得（Edge Function経由）
  useEffect(() => {
    const fetchComments = async () => {
      if (!companyId) return;
      setLoading(true);

      try {
        // 認証トークンを取得
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          throw new Error('認証が必要です');
        }

        // Edge Function経由でデータを取得
        const params = new URLSearchParams({
          company_id: companyId,
          limit: '500'
        });
        if (selectedStore !== 'all') {
          params.append('store_id', selectedStore);
        }

        const response = await fetch(
          `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/get-preset-comments?${params}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'データの取得に失敗しました');
        }

        // データを整形
        const formattedData = (result.data || []).map(item => {
          const answer = item.preset_question_answer;

          // 推奨度（p1_q1: 0-10）からNPSタイプを判定
          const npsScore = answer.p1_q1;
          let npsType = '中立者';
          if (npsScore >= 9) npsType = '推奨者';
          else if (npsScore <= 6) npsType = '批判者';

          // 来店回数からリピーター判定
          const visitCount = answer.p1_q3;
          const isRepeater = visitCount !== '初めて';

          // 再来店意向（p1_q2: enum - 1ヶ月以内,3ヶ月以内 → あり、それ以外 → なし）
          const revisitIntent = (answer.p1_q2 === '1ヶ月以内' || answer.p1_q2 === '3ヶ月以内') ? 'あり' : 'なし';

          // 年齢を整形（例: "25歳~29歳" → "20代"）
          const ageRange = answer.p1_q5 || '';
          let age = 'その他';
          if (ageRange.includes('20') || ageRange.includes('25') || ageRange.includes('29')) age = '20代';
          else if (ageRange.includes('30') || ageRange.includes('35') || ageRange.includes('39')) age = '30代';
          else if (ageRange.includes('40') || ageRange.includes('45') || ageRange.includes('49')) age = '40代';
          else if (ageRange.includes('50') || ageRange.includes('55') || ageRange.includes('59')) age = '50代';
          else if (ageRange.includes('60') || ageRange.includes('65')) age = '60代';

          return {
            id: item.id,
            gender: answer.p1_q4 || 'その他',
            age: age,
            npsType: npsType,
            npsScore: npsScore,
            isRepeater: isRepeater,
            revisitIntent: revisitIntent,
            comment: item.comment,
            date: new Date(item.created_at).toLocaleString('ja-JP', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            }),
            storeId: answer.store_id
          };
        });

        setCommentsData(formattedData);
      } catch (error) {
        console.error('コメントデータの取得エラー:', error);
        setCommentsData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
  }, [companyId, selectedStore]);

  // フィルタリング処理
  const filteredComments = commentsData.filter(comment => {
    // 性別フィルター
    if (filters.gender.length > 0 && !filters.gender.includes(comment.gender)) return false;

    // 年齢フィルター
    if (filters.age.length > 0 && !filters.age.includes(comment.age)) return false;

    // NPSタイプフィルター
    if (filters.npsType.length > 0 && !filters.npsType.includes(comment.npsType)) return false;

    // リピーターフィルター
    if (filters.isRepeater.length > 0) {
      const repeaterStatus = comment.isRepeater ? 'リピーター' : '新規';
      if (!filters.isRepeater.includes(repeaterStatus)) return false;
    }

    // 再来店意向フィルター
    if (filters.revisitIntent.length > 0 && !filters.revisitIntent.includes(comment.revisitIntent)) return false;

    // コメント検索
    if (filters.commentSearch) {
      const searchLower = filters.commentSearch.toLowerCase();
      if (!comment.comment.toLowerCase().includes(searchLower)) return false;
    }

    return true;
  });
  
  // 現在のページのデータを取得
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentComments = filteredComments.slice(indexOfFirstItem, indexOfLastItem);
  
  // ページ数を計算
  const totalPages = Math.ceil(filteredComments.length / itemsPerPage);
  
  // フィルター変更時の処理（一時的な変更）
  const handleTempFilterChange = (filterName, value, isChecked) => {
    if (filterName === 'commentSearch') {
      setTempFilters(prev => ({ ...prev, commentSearch: value }));
    } else {
      setTempFilters(prev => {
        const currentValues = [...prev[filterName]];
        if (isChecked) {
          if (!currentValues.includes(value)) {
            currentValues.push(value);
          }
        } else {
          const index = currentValues.indexOf(value);
          if (index > -1) {
            currentValues.splice(index, 1);
          }
        }
        return { ...prev, [filterName]: currentValues };
      });
    }
  };

  // 検索ボックスの変更（即座に反映）
  const handleSearchChange = (value) => {
    setFilters(prev => ({ ...prev, commentSearch: value }));
    setTempFilters(prev => ({ ...prev, commentSearch: value }));
    setCurrentPage(1);
  };

  // フィルター適用
  const applyFilters = () => {
    setFilters(tempFilters);
    setCurrentPage(1);
    setShowFilters(false);
  };

  // フィルターを開く時に一時フィルターを現在のフィルターと同期
  const toggleFilters = () => {
    if (!showFilters) {
      setTempFilters(filters);
    }
    setShowFilters(!showFilters);
  };

  // ページネーション制御
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // NPSタイプのカラー設定
  const getNPSBadge = (type) => {
    switch (type) {
      case "推奨者":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-bold text-white bg-gradient-to-r from-green-500 to-emerald-500">
            推奨者
          </span>
        );
      case "批判者":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-bold text-white bg-gradient-to-r from-red-500 to-red-400">
            批判者
          </span>
        );
      case "中立者":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-orange-400">
            中立者
          </span>
        );
      default:
        return <Badge>{type}</Badge>;
    }
  };

  // ローディング表示（スケルトンスクリーン）
  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex gap-3 items-center">
          <Skeleton className="h-10 w-44 rounded-md" />
        </div>
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-9 w-64 rounded-lg" />
            </div>
          </div>
          <div className="divide-y divide-gray-50">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="p-4 flex items-start gap-4">
                <Skeleton className="h-6 w-16 rounded-md flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
                <Skeleton className="h-4 w-24 flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* フィルターセレクター */}
      <div className="flex gap-3 items-center">
        {/* 店舗選択 */}
        <Select value={selectedStore} onValueChange={setSelectedStore}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="店舗を選択" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>店舗選択</SelectLabel>
              <SelectItem value="all">全店舗</SelectItem>
              {stores.map((store) => (
                <SelectItem key={store.id} value={store.id}>
                  {store.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {/* テーブル */}
      <Card className="border-0 shadow-xl bg-white overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span>リアルタイム顧客コメント</span>
              <span className="text-sm font-normal text-gray-600">
                {filteredComments.length} 件の結果
              </span>
            </div>
            <div className="flex items-center gap-4">
              {/* 検索ボックス */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="コメントを検索..."
                  value={filters.commentSearch}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-64 px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                />
                {filters.commentSearch && (
                  <button
                    onClick={() => handleSearchChange('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <Close className="w-4 h-4" />
                  </button>
                )}
              </div>
              {/* フィルター開閉ボタン */}
              <Button
                variant="outline"
                size="sm"
                onClick={toggleFilters}
                className={`flex items-center gap-2 ${showFilters ? 'bg-purple-50 border-purple-300' : ''}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                フィルター
                {Object.entries(filters).filter(([key, value]) => 
                  key === 'commentSearch' ? value !== '' : value.length > 0
                ).length > 0 && (
                  <span className="ml-1 px-2 py-0.5 text-xs bg-purple-500 text-white rounded-full">
                    {Object.entries(filters).filter(([key, value]) => 
                      key === 'commentSearch' ? value !== '' : value.length > 0
                    ).length}
                  </span>
                )}
              </Button>
            </div>
          </CardTitle>
          
          {/* フィルターセクション */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="space-y-4">
                {/* 性別フィルター */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">性別</p>
                  <div className="flex flex-wrap gap-3">
                    {['男性', '女性', 'その他'].map(gender => (
                      <label key={gender} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={tempFilters.gender.includes(gender)}
                          onChange={(e) => handleTempFilterChange('gender', gender, e.target.checked)}
                          className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                        />
                        <span className="text-sm text-gray-700">{gender}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* 年齢フィルター */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">年齢</p>
                  <div className="flex flex-wrap gap-3">
                    {['20代', '30代', '40代', '50代', '60代'].map(age => (
                      <label key={age} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={tempFilters.age.includes(age)}
                          onChange={(e) => handleTempFilterChange('age', age, e.target.checked)}
                          className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                        />
                        <span className="text-sm text-gray-700">{age}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* 推奨度フィルター */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">推奨度</p>
                  <div className="flex flex-wrap gap-3">
                    {['推奨者', '中立者', '批判者'].map(nps => (
                      <label key={nps} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={tempFilters.npsType.includes(nps)}
                          onChange={(e) => handleTempFilterChange('npsType', nps, e.target.checked)}
                          className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                        />
                        <span className="text-sm text-gray-700">{nps}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* リピーター・再来店意向 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* リピーター */}
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">リピーター</p>
                    <div className="space-y-2">
                      {['リピーター', '新規'].map(status => (
                        <label key={status} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={tempFilters.isRepeater.includes(status)}
                            onChange={(e) => handleTempFilterChange('isRepeater', status, e.target.checked)}
                            className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                          />
                          <span className="text-sm text-gray-700">{status}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* 再来店意向 */}
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">再来店意向</p>
                    <div className="space-y-2">
                      {['あり', 'なし'].map(intent => (
                        <label key={intent} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={tempFilters.revisitIntent.includes(intent)}
                            onChange={(e) => handleTempFilterChange('revisitIntent', intent, e.target.checked)}
                            className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                          />
                          <span className="text-sm text-gray-700">{intent}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* フィルター適用・リセットボタン */}
                <div className="pt-4 flex items-center justify-between border-t border-gray-200">
                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={applyFilters}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      フィルターを適用
                    </Button>
                    {Object.entries(tempFilters).some(([key, value]) =>
                      key === 'commentSearch' ? value !== '' : value.length > 0
                    ) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setTempFilters({
                            gender: [],
                            age: [],
                            npsType: [],
                            isRepeater: [],
                            revisitIntent: [],
                            commentSearch: filters.commentSearch
                          });
                        }}
                        className="text-sm"
                      >
                        クリア
                      </Button>
                    )}
                  </div>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <Close className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-start gap-4 p-4 border-b border-gray-100">
                  <Skeleton className="h-6 w-12" />
                  <Skeleton className="h-6 w-12" />
                  <Skeleton className="h-6 w-16 rounded-md" />
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-16" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                  <Skeleton className="h-6 w-24" />
                </div>
              ))}
            </div>
          ) : commentsData.length === 0 ? (
            <div className="flex flex-col justify-center items-center py-12 text-gray-500">
              <Comment className="w-12 h-12 mb-4 opacity-50" />
              <p>コメントデータがありません</p>
              <p className="text-sm mt-1">店舗を選択してください</p>
            </div>
          ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    性別
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    年齢
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    推奨度
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    リピーター
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    再来店意向
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    コメント
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {currentComments.map((comment) => (
                  <tr key={comment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                          comment.gender === "女性" ? "bg-pink-100 text-pink-700" :
                          comment.gender === "男性" ? "bg-blue-100 text-blue-700" :
                          "bg-purple-100 text-purple-700"
                        }`}>
                          {comment.gender === "女性" ? "女" :
                           comment.gender === "男性" ? "男" : "他"}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{comment.age}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getNPSBadge(comment.npsType)}
                        <span className="text-xs text-gray-500">({comment.npsScore})</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {comment.isRepeater ? (
                        <div className="flex items-center">
                          <CheckCircle className="w-4 h-4 text-green-600 mr-1" />
                          <span className="text-sm text-green-700">リピーター</span>
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <User className="w-4 h-4 text-gray-400 mr-1" />
                          <span className="text-sm text-gray-500">新規</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${
                        comment.revisitIntent === 'あり' ? 'text-green-600' : 'text-gray-500'
                      }`}>
                        {comment.revisitIntent}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-md">
                        <p className="text-sm text-gray-900 line-clamp-2">
                          {comment.comment}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {comment.date}
                        </p>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </CardContent>
      </Card>

      {/* ページネーション */}
      {filteredComments.length > 0 && (
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">
          全 {filteredComments.length} 件中 {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredComments.length)} 件を表示
        </p>
        <div className="flex gap-2 items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1"
          >
            <ChevronDown className="w-4 h-4 rotate-90" />
            前へ
          </Button>
          
          <div className="flex gap-1">
            {[...Array(totalPages)].map((_, index) => {
              const page = index + 1;
              if (
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 1 && page <= currentPage + 1)
              ) {
                return (
                  <Button
                    key={page}
                    variant={page === currentPage ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(page)}
                    className={`w-10 h-10 p-0 ${
                      page === currentPage
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white'
                        : ''
                    }`}
                  >
                    {page}
                  </Button>
                );
              } else if (
                (page === currentPage - 2 && page > 1) ||
                (page === currentPage + 2 && page < totalPages)
              ) {
                return (
                  <span key={page} className="px-2 text-gray-400">
                    ...
                  </span>
                );
              }
              return null;
            })}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1"
          >
            次へ
            <ChevronUp className="w-4 h-4 rotate-90" />
          </Button>
        </div>
      </div>
      )}
    </div>
  );
};


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
          <RealtimeTab companyId={companyId} />
        </TabPanel>
      </Box>
    </Box>
  );
}
