import React, { useState } from 'react';
import { Box } from '@mui/material';
import {
  ArrowLeft,
  Star,
  TrendingUp,
  TrendingDown,
  Target,
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  MessageSquare,
  Users,
  Utensils,
  Sparkles,
  Calendar,
  BarChart3,
  Download,
  Share2,
  Printer,
  Clock,
  ThumbsUp,
  ThumbsDown,
  Eye,
  MessageCircle,
  Award,
  Zap,
  Activity,
  PieChart,
  MapPin,
  Filter,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Hash,
  Minus
} from 'lucide-react';

// 本格的なサンプルレポートデータ
const sampleReportData = {
  // メタ情報
  meta: {
    period: '2024年12月',
    periodStart: '2024/12/01',
    periodEnd: '2024/12/31',
    generatedAt: '2025年1月15日 09:30',
    store: '渋谷店',
    storeCode: 'SBY-001',
    reportVersion: 'v2.1',
  },

  // サマリー統計
  summary: {
    totalReviews: 128,
    previousReviews: 112,
    reviewsChange: 14.3,
    averageRating: 3.8,
    previousRating: 4.1,
    ratingChange: -7.3,
    responseRate: 94.5,
    previousResponseRate: 89.2,
    responseRateChange: 5.9,
    averageResponseTime: 2.3, // 時間
    previousResponseTime: 3.1,
    responseTimeChange: -25.8,
    nps: 32,
    previousNps: 45,
    npsChange: -28.9,
  },

  // 評価分布
  ratingDistribution: [
    { rating: 5, count: 28, percentage: 21.9 },
    { rating: 4, count: 42, percentage: 32.8 },
    { rating: 3, count: 31, percentage: 24.2 },
    { rating: 2, count: 18, percentage: 14.1 },
    { rating: 1, count: 9, percentage: 7.0 },
  ],

  // 月次トレンド（過去6ヶ月）
  monthlyTrend: [
    { month: '7月', rating: 4.2, reviews: 98, nps: 52 },
    { month: '8月', rating: 4.3, reviews: 105, nps: 55 },
    { month: '9月', rating: 4.1, reviews: 110, nps: 48 },
    { month: '10月', rating: 4.0, reviews: 108, nps: 44 },
    { month: '11月', rating: 4.1, reviews: 112, nps: 45 },
    { month: '12月', rating: 3.8, reviews: 128, nps: 32 },
  ],

  // 総合評価
  overall: {
    score: 3.8,
    previousScore: 4.1,
    aiSummary: `12月は年末繁忙期による影響で全体的なサービス品質が低下しました。特に清掃面（-24%）とサービス面（-10%）で顕著な課題が見られます。

一方、Quality（品質）スコアは前月比+5%と改善傾向にあり、新メニュー「特製チキン南蛮」の導入効果が表れています。

NPS（推奨度スコア）は32ポイントと前月比-13ポイントの大幅低下。清掃・待ち時間への不満がリピート意向に影響している可能性が高く、早急な対応が必要です。`,
    keyFindings: [
      { type: 'negative', text: '清掃評価が前月比-24%と大幅低下' },
      { type: 'negative', text: '待ち時間に関する不満が12件増加' },
      { type: 'positive', text: '新メニューへの好評価が32件' },
      { type: 'positive', text: 'スタッフ田中さんへの指名来店3件' },
    ],
  },

  // QSCスコア詳細
  qsc: {
    quality: {
      score: 4.2,
      previousScore: 4.0,
      trend: 5,
      comment: '新メニュー「特製チキン南蛮」の導入が成功。ボリューム感とタルタルソースの評価が特に高く、リピート注文も増加しています。既存メニューの品質も安定を維持。',
      mentionCount: 85,
      positiveMentions: 72,
      negativeMentions: 13,
      details: [
        { item: '料理の味', score: 4.4, previousScore: 4.2, mentions: 45 },
        { item: '盛り付け・見た目', score: 4.1, previousScore: 4.0, mentions: 22 },
        { item: '提供温度', score: 4.0, previousScore: 3.9, mentions: 12 },
        { item: 'ボリューム・量', score: 4.3, previousScore: 4.1, mentions: 28 },
        { item: 'メニューの多様性', score: 4.0, previousScore: 4.0, mentions: 18 },
      ],
      keywords: [
        { word: 'チキン南蛮', count: 32, sentiment: 'positive' },
        { word: '美味しい', count: 28, sentiment: 'positive' },
        { word: 'ボリューム', count: 18, sentiment: 'positive' },
        { word: 'タルタルソース', count: 15, sentiment: 'positive' },
        { word: '冷めていた', count: 5, sentiment: 'negative' },
      ],
    },
    service: {
      score: 3.6,
      previousScore: 4.0,
      trend: -10,
      comment: '年末繁忙期における人員不足が原因で、待ち時間と対応スピードに課題が発生。特に土日ランチタイムの混雑時に不満が集中しています。',
      mentionCount: 62,
      positiveMentions: 35,
      negativeMentions: 27,
      details: [
        { item: '接客態度', score: 4.0, previousScore: 4.2, mentions: 28 },
        { item: '待ち時間', score: 3.0, previousScore: 3.8, mentions: 32 },
        { item: '注文対応', score: 3.5, previousScore: 3.9, mentions: 18 },
        { item: '会計対応', score: 4.0, previousScore: 4.1, mentions: 12 },
        { item: '気配り・配慮', score: 3.8, previousScore: 4.0, mentions: 15 },
      ],
      keywords: [
        { word: '待ち時間', count: 24, sentiment: 'negative' },
        { word: '混雑', count: 18, sentiment: 'negative' },
        { word: '田中さん', count: 18, sentiment: 'positive' },
        { word: '笑顔', count: 12, sentiment: 'positive' },
        { word: '遅い', count: 10, sentiment: 'negative' },
      ],
    },
    cleanliness: {
      score: 3.2,
      previousScore: 4.2,
      trend: -24,
      comment: '清掃品質が大幅に低下。テーブル清掃とトイレ清掃への指摘が急増しており、最優先で対応が必要な状況です。清掃スタッフのシフト不足と研修不備が主因。',
      mentionCount: 48,
      positiveMentions: 12,
      negativeMentions: 36,
      details: [
        { item: 'テーブル清掃', score: 3.0, previousScore: 4.2, mentions: 22 },
        { item: 'トイレ清掃', score: 2.8, previousScore: 4.0, mentions: 18 },
        { item: '店内清潔感', score: 3.5, previousScore: 4.3, mentions: 15 },
        { item: '食器の清潔さ', score: 3.6, previousScore: 4.2, mentions: 8 },
        { item: '床・通路', score: 3.4, previousScore: 4.1, mentions: 6 },
      ],
      keywords: [
        { word: 'テーブル', count: 22, sentiment: 'negative' },
        { word: 'トイレ', count: 18, sentiment: 'negative' },
        { word: 'ベタベタ', count: 12, sentiment: 'negative' },
        { word: '汚い', count: 8, sentiment: 'negative' },
        { word: '清潔', count: 6, sentiment: 'positive' },
      ],
    },
  },

  // 時間帯別分析
  timeAnalysis: [
    { time: 'モーニング(7-10時)', reviews: 18, rating: 4.0, satisfaction: 82 },
    { time: 'ランチ(11-14時)', reviews: 52, rating: 3.5, satisfaction: 68 },
    { time: 'カフェ(14-17時)', reviews: 22, rating: 4.2, satisfaction: 88 },
    { time: 'ディナー(17-21時)', reviews: 36, rating: 3.8, satisfaction: 75 },
  ],

  // 曜日別分析
  dayOfWeekAnalysis: [
    { day: '月', reviews: 12, rating: 4.0 },
    { day: '火', reviews: 14, rating: 4.1 },
    { day: '水', reviews: 15, rating: 3.9 },
    { day: '木', reviews: 16, rating: 4.0 },
    { day: '金', reviews: 22, rating: 3.8 },
    { day: '土', reviews: 28, rating: 3.5 },
    { day: '日', reviews: 21, rating: 3.6 },
  ],

  // 競合比較（エリア平均）
  benchmark: {
    areaAverage: 3.9,
    categoryAverage: 4.0,
    ranking: 12,
    totalStores: 28,
    percentile: 57,
  },

  // 目標管理
  targets: [
    {
      id: 1,
      category: 'クリティカル',
      indicator: '清掃評価スコア',
      current: 3.2,
      target: 4.0,
      baseline: 4.2,
      unit: 'pt',
      startDate: '2025/01/01',
      endDate: '2025/02/28',
      owner: '店長 山田',
      measures: '清掃チェックリスト導入、巡回頻度を30分→15分に変更、新人清掃研修の実施',
      status: 'behind',
      progress: 0,
      milestones: [
        { date: '1/15', target: 3.5, status: 'pending' },
        { date: '2/1', target: 3.7, status: 'pending' },
        { date: '2/28', target: 4.0, status: 'pending' },
      ],
    },
    {
      id: 2,
      category: '重要',
      indicator: '平均待ち時間',
      current: 18,
      target: 10,
      baseline: 10,
      unit: '分',
      startDate: '2025/01/01',
      endDate: '2025/03/31',
      owner: 'SV 佐藤',
      measures: 'ピーク時のキッチンスタッフ1名増員、調理工程の最適化',
      status: 'in-progress',
      progress: 20,
      milestones: [
        { date: '1/31', target: 15, status: 'pending' },
        { date: '2/28', target: 12, status: 'pending' },
        { date: '3/31', target: 10, status: 'pending' },
      ],
    },
    {
      id: 3,
      category: '改善',
      indicator: '接客評価スコア',
      current: 3.6,
      target: 4.2,
      baseline: 4.0,
      unit: 'pt',
      startDate: '2025/01/15',
      endDate: '2025/03/31',
      owner: '店長 山田',
      measures: '接客研修（2時間×週1回）実施、ロールプレイ訓練導入',
      status: 'in-progress',
      progress: 10,
      milestones: [
        { date: '2/15', target: 3.8, status: 'pending' },
        { date: '3/31', target: 4.2, status: 'pending' },
      ],
    },
    {
      id: 4,
      category: '長期',
      indicator: 'NPS（推奨度）',
      current: 32,
      target: 50,
      baseline: 45,
      unit: 'pt',
      startDate: '2025/01/01',
      endDate: '2025/06/30',
      owner: 'エリアMGR 田中',
      measures: '総合的なサービス改善施策の実行、顧客フォローアップ強化',
      status: 'on-track',
      progress: 15,
      milestones: [
        { date: '3/31', target: 40, status: 'pending' },
        { date: '6/30', target: 50, status: 'pending' },
      ],
    },
  ],

  // 改善アクション
  improvements: [
    {
      id: 1,
      priority: 1,
      severity: 'critical',
      category: '清掃',
      title: 'テーブル・トイレ清掃の品質改善',
      status: '対応中',
      insight: {
        summary: '清掃関連のネガティブコメントが前月比+78%（23件→41件）に急増',
        details: [
          '「テーブルがベタベタする」という指摘が12件',
          '「トイレが汚い」という指摘が8件',
          '特に12/23-12/31の年末期間に集中（全体の68%）',
          '新人アルバイト2名の清掃品質にばらつき',
        ],
      },
      impact: {
        financial: -180000,
        financialDetail: '清掃評価低下によるリピート率8%低下の推定影響',
        customerSatisfaction: -15,
        npsImpact: -8,
      },
      rootCause: [
        '年末繁忙期の清掃スタッフシフト不足（通常5名→3名体制）',
        '新人2名への清掃マニュアル研修が未完了',
        '清掃チェックリストが形骸化（実施率42%）',
        '巡回間隔が30分と長く、汚れの蓄積が発生',
      ],
      actionPlan: [
        { action: '清掃チェックリストのデジタル化と徹底', deadline: '即日', owner: '店長', status: 'done' },
        { action: '清掃巡回を30分→15分間隔に変更', deadline: '1/5', owner: '副店長', status: 'in-progress' },
        { action: '新人向け清掃研修の再実施（2時間）', deadline: '1/10', owner: '店長', status: 'pending' },
        { action: '清掃専任スタッフの追加採用', deadline: '1/20', owner: 'SV', status: 'pending' },
      ],
      expectedOutcome: '2月末までに清掃評価スコア4.0以上を達成',
    },
    {
      id: 2,
      priority: 2,
      severity: 'high',
      category: '接客',
      title: 'ピーク時の待ち時間短縮',
      status: '計画中',
      insight: {
        summary: '「待ち時間が長い」関連コメントが前月比+12件増加',
        details: [
          '土日ランチタイム（11:30-13:30）に問題が集中',
          '平均待ち時間が10分→18分に悪化（+80%）',
          '待ち時間15分超過で満足度が急落する傾向',
          '入店を諦める顧客が週末で推定15組/日発生',
        ],
      },
      impact: {
        financial: -120000,
        financialDetail: '機会損失（入店断念顧客×客単価）の月間推定値',
        customerSatisfaction: -12,
        npsImpact: -5,
      },
      rootCause: [
        '11月末のキッチンスタッフ退職（経験者1名）',
        '代替要員の採用が12月中旬まで未完了',
        '新人の調理スピードが既存スタッフの60%程度',
        'オーダー集中時の調理工程に非効率あり',
      ],
      actionPlan: [
        { action: 'ピーク時間帯のキッチンスタッフ1名増員', deadline: '1/15', owner: 'SV', status: 'in-progress' },
        { action: '調理工程の見直しと効率化', deadline: '1/20', owner: '料理長', status: 'pending' },
        { action: '待ち時間表示システムの導入検討', deadline: '2/1', owner: '店長', status: 'pending' },
        { action: 'ピーク時限定メニューの検討', deadline: '2/15', owner: '料理長', status: 'pending' },
      ],
      expectedOutcome: '3月末までに平均待ち時間10分以下を達成',
    },
  ],

  // 良かった点
  positives: [
    {
      id: 1,
      category: '品質',
      title: '新メニュー「特製チキン南蛮」が大好評',
      highlight: true,
      insight: {
        summary: '導入1ヶ月で高評価コメント32件を獲得',
        details: [
          '「ボリューム満点」「タルタルソースが絶品」など具体的な称賛',
          'リピート注文率が既存メニュー平均の1.5倍',
          'SNSでの投稿数が前月比2倍（#チキン南蛮 #渋谷ランチ）',
          '客単価アップに直接貢献',
        ],
      },
      impact: {
        financial: 200000,
        financialDetail: '客単価+¥150向上（+8%）による月間売上増',
        metrics: [
          { label: '注文数', value: '312食/月' },
          { label: 'リピート率', value: '42%' },
        ],
      },
      recommendation: 'シーズン限定メニューとしてバリエーション展開を検討。「チキン南蛮おろしポン酢」「辛口チキン南蛮」など',
    },
    {
      id: 2,
      category: '接客',
      title: 'スタッフ田中さんへの高評価が継続',
      highlight: true,
      insight: {
        summary: '名指しで褒めるコメントが18件で店舗最多',
        details: [
          '「笑顔が素敵」「気配りが素晴らしい」「また会いたい」',
          '指名来店が3件発生（過去最高）',
          '田中さんシフト日の売上が平均+12%',
          '他スタッフへの好影響（接客マインドの向上）',
        ],
      },
      impact: {
        financial: 85000,
        financialDetail: 'シフト日売上上昇分の月間推定値',
        metrics: [
          { label: '指名来店', value: '3件/月' },
          { label: '高評価コメント', value: '18件' },
        ],
      },
      recommendation: '田中さんを接客リーダーに任命し、新人研修のOJT担当として活用。優秀スタッフ表彰制度の導入も検討',
    },
    {
      id: 3,
      category: '雰囲気',
      title: 'クリスマス装飾がSNSで話題に',
      highlight: false,
      insight: {
        summary: '季節装飾への好評価コメント15件',
        details: [
          '「写真映えする」「季節感があって良い」',
          'Instagram投稿数が前月比2.5倍',
          '新規来店のきっかけとして「SNSで見た」が増加',
        ],
      },
      impact: {
        financial: 50000,
        financialDetail: 'SNS経由の新規来店増加分の推定値',
        metrics: [
          { label: 'SNS投稿数', value: '48件' },
          { label: '新規来店', value: '+22名' },
        ],
      },
      recommendation: '季節イベントごとのフォトスポット設置を継続。次回は節分・バレンタインの装飾を計画',
    },
  ],

  // 要注目レビュー
  featuredReviews: [
    {
      id: 1,
      type: 'critical',
      rating: 1,
      date: '2024/12/28',
      platform: 'Google',
      content: 'トイレがとても汚く、二度と行きたくありません。テーブルもベタベタで不衛生でした。料理は美味しかっただけに残念。',
      response: 'この度は不快な思いをさせてしまい、誠に申し訳ございませんでした。清掃体制を抜本的に見直し、改善を実施しております。',
      responseTime: 45, // 分
      sentiment: 'negative',
    },
    {
      id: 2,
      type: 'praise',
      rating: 5,
      date: '2024/12/15',
      platform: 'Tabelog',
      content: '新メニューのチキン南蛮が絶品！ボリュームたっぷりでタルタルソースも最高。田中さんの接客も素晴らしかったです。',
      response: 'ありがとうございます！田中も大変喜んでおります。またのご来店を心よりお待ちしております。',
      responseTime: 30,
      sentiment: 'positive',
    },
    {
      id: 3,
      type: 'insight',
      rating: 3,
      date: '2024/12/22',
      platform: 'Retty',
      content: '土曜のランチで20分以上待たされました。味は良いのですが、この待ち時間は改善してほしいです。',
      response: '長時間お待たせしてしまい申し訳ございません。現在、ピーク時の人員配置を見直しております。',
      responseTime: 60,
      sentiment: 'mixed',
    },
  ],
};

// ユーティリティ関数
const getScoreColor = (score) => {
  if (score >= 4.5) return { bg: 'bg-emerald-500', text: 'text-emerald-600', light: 'bg-emerald-50', border: 'border-emerald-200' };
  if (score >= 4.0) return { bg: 'bg-blue-500', text: 'text-blue-600', light: 'bg-blue-50', border: 'border-blue-200' };
  if (score >= 3.5) return { bg: 'bg-amber-500', text: 'text-amber-600', light: 'bg-amber-50', border: 'border-amber-200' };
  if (score >= 3.0) return { bg: 'bg-orange-500', text: 'text-orange-600', light: 'bg-orange-50', border: 'border-orange-200' };
  return { bg: 'bg-red-500', text: 'text-red-600', light: 'bg-red-50', border: 'border-red-200' };
};

const formatNumber = (num) => {
  if (num >= 10000) return (num / 10000).toFixed(1) + '万';
  return num.toLocaleString();
};

const formatCurrency = (num) => {
  const abs = Math.abs(num);
  const sign = num >= 0 ? '+' : '';
  if (abs >= 10000) return sign + '¥' + (num / 10000).toFixed(1) + '万';
  return sign + '¥' + num.toLocaleString();
};

// SVGミニチャート: 折れ線グラフ
const MiniLineChart = ({ data, dataKey, color = '#8b5cf6', height = 40, width = 120 }) => {
  const values = data.map(d => d[dataKey]);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;

  const points = values.map((v, i) => ({
    x: (i / (values.length - 1)) * width,
    y: height - ((v - min) / range) * (height - 8) - 4,
  }));

  const pathD = points.map((p, i) => (i === 0 ? `M ${p.x},${p.y}` : `L ${p.x},${p.y}`)).join(' ');

  return (
    <svg width={width} height={height} className="overflow-visible">
      <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="white" stroke={color} strokeWidth="2" />
      ))}
    </svg>
  );
};

// SVGミニチャート: バーチャート
const MiniBarChart = ({ data, height = 60, width = 200 }) => {
  const max = Math.max(...data.map(d => d.count));
  const barWidth = (width - (data.length - 1) * 4) / data.length;

  return (
    <svg width={width} height={height + 20} className="overflow-visible">
      {data.map((d, i) => {
        const barHeight = (d.count / max) * height;
        const color = d.rating >= 4 ? '#10b981' : d.rating >= 3 ? '#f59e0b' : '#ef4444';
        return (
          <g key={i}>
            <rect
              x={i * (barWidth + 4)}
              y={height - barHeight}
              width={barWidth}
              height={barHeight}
              fill={color}
              rx="2"
            />
            <text
              x={i * (barWidth + 4) + barWidth / 2}
              y={height + 14}
              textAnchor="middle"
              className="text-[10px] fill-gray-500"
            >
              {d.rating}★
            </text>
          </g>
        );
      })}
    </svg>
  );
};

// レーダーチャート（QSC比較）
const RadarChart = ({ current, previous, size = 160 }) => {
  const center = size / 2;
  const radius = (size - 40) / 2;
  const labels = ['Quality', 'Service', 'Cleanliness'];
  const angles = labels.map((_, i) => (i * 2 * Math.PI) / 3 - Math.PI / 2);

  const getPoint = (value, angle) => ({
    x: center + (value / 5) * radius * Math.cos(angle),
    y: center + (value / 5) * radius * Math.sin(angle),
  });

  const currentPoints = [current.quality, current.service, current.cleanliness].map((v, i) => getPoint(v, angles[i]));
  const previousPoints = [previous.quality, previous.service, previous.cleanliness].map((v, i) => getPoint(v, angles[i]));

  const createPath = (points) => points.map((p, i) => (i === 0 ? `M ${p.x},${p.y}` : `L ${p.x},${p.y}`)).join(' ') + ' Z';

  return (
    <svg width={size} height={size} className="overflow-visible">
      {/* グリッド */}
      {[1, 2, 3, 4, 5].map(level => (
        <polygon
          key={level}
          points={angles.map(a => `${center + (level / 5) * radius * Math.cos(a)},${center + (level / 5) * radius * Math.sin(a)}`).join(' ')}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="1"
        />
      ))}
      {/* 軸 */}
      {angles.map((a, i) => (
        <line key={i} x1={center} y1={center} x2={center + radius * Math.cos(a)} y2={center + radius * Math.sin(a)} stroke="#e5e7eb" strokeWidth="1" />
      ))}
      {/* 前月データ */}
      <polygon points={previousPoints.map(p => `${p.x},${p.y}`).join(' ')} fill="rgba(156, 163, 175, 0.2)" stroke="#9ca3af" strokeWidth="1.5" strokeDasharray="4,2" />
      {/* 当月データ */}
      <polygon points={currentPoints.map(p => `${p.x},${p.y}`).join(' ')} fill="rgba(139, 92, 246, 0.2)" stroke="#8b5cf6" strokeWidth="2" />
      {/* ポイント */}
      {currentPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="4" fill="#8b5cf6" stroke="white" strokeWidth="2" />
      ))}
      {/* ラベル */}
      {labels.map((label, i) => {
        const labelPos = getPoint(5.8, angles[i]);
        return (
          <text key={i} x={labelPos.x} y={labelPos.y} textAnchor="middle" dominantBaseline="middle" className="text-[10px] font-medium fill-gray-600">
            {label}
          </text>
        );
      })}
    </svg>
  );
};

// コンポーネント: トレンドバッジ
const TrendBadge = ({ value, size = 'md' }) => {
  const isPositive = value > 0;
  const isNegative = value < 0;
  const sizeClasses = size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs';

  return (
    <span className={`inline-flex items-center gap-0.5 ${sizeClasses} rounded-full font-bold ${
      isPositive ? 'bg-emerald-100 text-emerald-700' : isNegative ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
    }`}>
      {isPositive ? <TrendingUp className="w-3 h-3" /> : isNegative ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
      {isPositive ? '+' : ''}{value.toFixed(1)}%
    </span>
  );
};

// コンポーネント: サマリーカード
const SummaryCard = ({ icon: Icon, label, value, previousValue, change, unit = '', color = 'purple' }) => {
  const colorClasses = {
    purple: 'bg-purple-50 text-purple-600',
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg ${colorClasses[color]} flex items-center justify-center`}>
          <Icon className="w-5 h-5" />
        </div>
        <TrendBadge value={change} size="sm" />
      </div>
      <div className="text-2xl font-black text-gray-900">{value}{unit}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
      <div className="text-xs text-gray-400 mt-0.5">前月: {previousValue}{unit}</div>
    </div>
  );
};

// コンポーネント: QSCカード（改良版）
const QSCCard = ({ title, icon: Icon, data, color, expanded = false, onToggle }) => {
  const scoreColor = getScoreColor(data.score);
  const [isExpanded, setIsExpanded] = useState(expanded);

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all">
      <div className={`px-5 py-4 ${color} border-b cursor-pointer`} onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/90 flex items-center justify-center shadow-sm">
              <Icon className="w-5 h-5 text-gray-700" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">{title}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-gray-500">言及数: {data.mentionCount}件</span>
                <span className="text-xs text-emerald-600">👍 {data.positiveMentions}</span>
                <span className="text-xs text-red-600">👎 {data.negativeMentions}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <TrendBadge value={data.trend} />
            {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </div>
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-center gap-6 mb-4">
          <div className="text-center">
            <div className={`text-4xl font-black ${scoreColor.text}`}>{data.score.toFixed(1)}</div>
            <div className="text-xs text-gray-400 mt-1">前月 {data.previousScore.toFixed(1)}</div>
          </div>
          <div className="flex-1">
            <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full ${scoreColor.bg} rounded-full transition-all duration-500 relative`}
                style={{ width: `${(data.score / 5) * 100}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20" />
              </div>
            </div>
            <div className="flex justify-between text-[10px] text-gray-400 mt-1">
              <span>0</span>
              <span>2.5</span>
              <span>5.0</span>
            </div>
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-4 leading-relaxed">{data.comment}</p>

        {isExpanded && (
          <>
            {/* 詳細スコア */}
            <div className="mb-5">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">項目別スコア</h4>
              <div className="space-y-2.5">
                {data.details.map((detail, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 flex-1">{detail.item}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-gray-400">{detail.mentions}件</span>
                      <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${getScoreColor(detail.score).bg} rounded-full`}
                          style={{ width: `${(detail.score / 5) * 100}%` }}
                        />
                      </div>
                      <span className="font-bold text-gray-700 w-8 text-right">{detail.score.toFixed(1)}</span>
                      {detail.previousScore && (
                        <span className={`text-[10px] ${detail.score > detail.previousScore ? 'text-emerald-600' : detail.score < detail.previousScore ? 'text-red-600' : 'text-gray-400'}`}>
                          {detail.score > detail.previousScore ? '↑' : detail.score < detail.previousScore ? '↓' : '→'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* キーワード */}
            <div>
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">頻出キーワード</h4>
              <div className="flex flex-wrap gap-2">
                {data.keywords.map((kw, index) => (
                  <span
                    key={index}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                      kw.sentiment === 'positive' ? 'bg-emerald-100 text-emerald-700' :
                      kw.sentiment === 'negative' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    <Hash className="w-3 h-3" />
                    {kw.word}
                    <span className="text-[10px] opacity-70">({kw.count})</span>
                  </span>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// コンポーネント: 改善アクションカード（改良版）
const ImprovementCard = ({ item, index }) => {
  const [isExpanded, setIsExpanded] = useState(item.priority <= 1);

  const severityConfig = {
    critical: { bg: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-600', text: 'CRITICAL', icon: AlertTriangle },
    high: { bg: 'bg-orange-50', border: 'border-orange-200', badge: 'bg-orange-500', text: 'HIGH', icon: Zap },
    medium: { bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-500', text: 'MEDIUM', icon: Activity },
  };
  const config = severityConfig[item.severity] || severityConfig.medium;
  const SeverityIcon = config.icon;

  const statusColors = {
    '対応中': 'bg-blue-100 text-blue-700',
    '計画中': 'bg-purple-100 text-purple-700',
    '完了': 'bg-emerald-100 text-emerald-700',
    '保留': 'bg-gray-100 text-gray-600',
  };

  return (
    <div className={`${config.bg} ${config.border} border rounded-xl overflow-hidden`}>
      <div className="p-5 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm flex-shrink-0">
              <span className="text-lg font-black text-gray-700">#{item.priority}</span>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`${config.badge} text-white text-[10px] px-2 py-0.5 rounded font-bold inline-flex items-center gap-1`}>
                  <SeverityIcon className="w-3 h-3" />
                  {config.text}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${statusColors[item.status] || statusColors['保留']}`}>
                  {item.status}
                </span>
              </div>
              <h4 className="font-bold text-gray-900">{item.title}</h4>
              <span className="text-xs text-gray-500">{item.category}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-lg font-black text-red-600">{formatCurrency(item.impact.financial)}</div>
              <div className="text-[10px] text-gray-500">月間影響</div>
            </div>
            {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="px-5 pb-5 space-y-4">
          {/* インサイト */}
          <div className="bg-white rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">インサイト</span>
            </div>
            <p className="text-sm font-medium text-gray-800 mb-2">{item.insight.summary}</p>
            <ul className="space-y-1">
              {item.insight.details.map((d, i) => (
                <li key={i} className="text-xs text-gray-600 flex items-start gap-2">
                  <span className="text-gray-400">•</span>
                  {d}
                </li>
              ))}
            </ul>
          </div>

          {/* インパクト */}
          <div className="bg-white rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">ビジネスインパクト</span>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className="text-center p-2 bg-red-50 rounded-lg">
                <div className="text-lg font-black text-red-600">{formatCurrency(item.impact.financial)}</div>
                <div className="text-[10px] text-gray-500">売上影響/月</div>
              </div>
              <div className="text-center p-2 bg-amber-50 rounded-lg">
                <div className="text-lg font-black text-amber-600">{item.impact.customerSatisfaction}%</div>
                <div className="text-[10px] text-gray-500">満足度影響</div>
              </div>
              <div className="text-center p-2 bg-purple-50 rounded-lg">
                <div className="text-lg font-black text-purple-600">{item.impact.npsImpact}pt</div>
                <div className="text-[10px] text-gray-500">NPS影響</div>
              </div>
            </div>
            <p className="text-xs text-gray-500">{item.impact.financialDetail}</p>
          </div>

          {/* 原因分析 */}
          <div className="bg-white rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">原因分析</span>
            </div>
            <ul className="space-y-1.5">
              {item.rootCause.map((cause, i) => (
                <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</span>
                  {cause}
                </li>
              ))}
            </ul>
          </div>

          {/* アクションプラン */}
          <div className="bg-white rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-4 h-4 text-purple-500" />
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">アクションプラン</span>
            </div>
            <div className="space-y-2">
              {item.actionPlan.map((action, i) => {
                const statusIcon = action.status === 'done' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> :
                                   action.status === 'in-progress' ? <Activity className="w-4 h-4 text-blue-500 animate-pulse" /> :
                                   <Clock className="w-4 h-4 text-gray-400" />;
                return (
                  <div key={i} className={`flex items-center gap-3 p-2 rounded-lg ${action.status === 'done' ? 'bg-emerald-50' : action.status === 'in-progress' ? 'bg-blue-50' : 'bg-gray-50'}`}>
                    {statusIcon}
                    <div className="flex-1">
                      <p className={`text-sm ${action.status === 'done' ? 'text-gray-500 line-through' : 'text-gray-700'}`}>{action.action}</p>
                      <div className="flex items-center gap-2 text-[10px] text-gray-500">
                        <span>期限: {action.deadline}</span>
                        <span>•</span>
                        <span>担当: {action.owner}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 p-3 bg-purple-50 rounded-lg">
              <div className="text-xs font-bold text-purple-700 mb-1">期待される成果</div>
              <p className="text-sm text-purple-900">{item.expectedOutcome}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// コンポーネント: 良かった点カード（改良版）
const PositiveCard = ({ item, index }) => {
  const [isExpanded, setIsExpanded] = useState(item.highlight);

  return (
    <div className={`bg-gradient-to-br from-emerald-50 to-teal-50 border ${item.highlight ? 'border-emerald-300' : 'border-emerald-200'} rounded-xl overflow-hidden ${item.highlight ? 'ring-2 ring-emerald-200' : ''}`}>
      <div className="p-5 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shadow-sm flex-shrink-0">
              {item.highlight ? <Award className="w-5 h-5 text-white" /> : <ThumbsUp className="w-5 h-5 text-white" />}
            </div>
            <div>
              {item.highlight && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-600 text-white font-bold mb-1 inline-block">
                  HIGHLIGHT
                </span>
              )}
              <h4 className="font-bold text-gray-900">{item.title}</h4>
              <span className="text-xs text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">{item.category}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-lg font-black text-emerald-600">{formatCurrency(item.impact.financial)}</div>
              <div className="text-[10px] text-gray-500">月間貢献</div>
            </div>
            {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="px-5 pb-5 space-y-4">
          <div className="bg-white rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">インサイト</span>
            </div>
            <p className="text-sm font-medium text-gray-800 mb-2">{item.insight.summary}</p>
            <ul className="space-y-1">
              {item.insight.details.map((d, i) => (
                <li key={i} className="text-xs text-gray-600 flex items-start gap-2">
                  <span className="text-emerald-500">✓</span>
                  {d}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">インパクト</span>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              {item.impact.metrics.map((m, i) => (
                <div key={i} className="text-center p-2 bg-emerald-50 rounded-lg">
                  <div className="text-lg font-black text-emerald-600">{m.value}</div>
                  <div className="text-[10px] text-gray-500">{m.label}</div>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500">{item.impact.financialDetail}</p>
          </div>

          <div className="bg-gradient-to-r from-emerald-100 to-teal-100 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-4 h-4 text-emerald-700" />
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">推奨アクション</span>
            </div>
            <p className="text-sm text-emerald-900">{item.recommendation}</p>
          </div>
        </div>
      )}
    </div>
  );
};

// コンポーネント: 注目レビューカード
const FeaturedReviewCard = ({ review }) => {
  const typeConfig = {
    critical: { bg: 'bg-red-50', border: 'border-red-200', icon: ThumbsDown, iconColor: 'text-red-500', label: '要対応' },
    praise: { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: ThumbsUp, iconColor: 'text-emerald-500', label: '高評価' },
    insight: { bg: 'bg-amber-50', border: 'border-amber-200', icon: Eye, iconColor: 'text-amber-500', label: '示唆' },
  };
  const config = typeConfig[review.type] || typeConfig.insight;
  const TypeIcon = config.icon;

  return (
    <div className={`${config.bg} ${config.border} border rounded-xl p-4`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <TypeIcon className={`w-4 h-4 ${config.iconColor}`} />
          <span className="text-xs font-bold text-gray-600">{config.label}</span>
          <span className="text-xs text-gray-400">•</span>
          <span className="text-xs text-gray-500">{review.platform}</span>
          <span className="text-xs text-gray-400">•</span>
          <span className="text-xs text-gray-500">{review.date}</span>
        </div>
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`} />
          ))}
        </div>
      </div>
      <p className="text-sm text-gray-700 mb-3 leading-relaxed">"{review.content}"</p>
      <div className="bg-white rounded-lg p-3">
        <div className="flex items-center gap-2 mb-1">
          <MessageCircle className="w-3 h-3 text-purple-500" />
          <span className="text-[10px] font-bold text-gray-500">返信（{review.responseTime}分後）</span>
        </div>
        <p className="text-xs text-gray-600">{review.response}</p>
      </div>
    </div>
  );
};

// メインコンポーネント
export default function ReportDetailPage({ report, onBack }) {
  const data = sampleReportData;
  const overallScoreColor = getScoreColor(data.overall.score);
  const [activeSection, setActiveSection] = useState('overview');

  const navigationItems = [
    { id: 'overview', label: 'サマリー', icon: PieChart },
    { id: 'qsc', label: 'QSC分析', icon: BarChart3 },
    { id: 'targets', label: '目標管理', icon: Target },
    { id: 'improvements', label: '改善アクション', icon: AlertTriangle },
    { id: 'positives', label: '成功事例', icon: CheckCircle2 },
    { id: 'reviews', label: '注目レビュー', icon: MessageSquare },
  ];

  const scrollToSection = (id) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#f8fafc', overflow: 'hidden' }}>
      {/* 固定ヘッダー */}
      <div className="bg-white border-b border-gray-200 shadow-sm flex-shrink-0">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="w-px h-10 bg-gray-200" />
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-black text-gray-900">{data.meta.period}</h1>
                  <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {data.meta.store}
                  </span>
                  <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded">{data.meta.reportVersion}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {data.meta.periodStart} - {data.meta.periodEnd}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    生成: {data.meta.generatedAt}
                  </span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
                <Printer className="w-4 h-4" />
                <span className="text-sm font-medium">印刷</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
                <Download className="w-4 h-4" />
                <span className="text-sm font-medium">PDF</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white hover:bg-purple-700 rounded-xl transition-colors">
                <Share2 className="w-4 h-4" />
                <span className="text-sm font-medium">共有</span>
              </button>
            </div>
          </div>
        </div>

        {/* サブナビゲーション */}
        <div className="max-w-7xl mx-auto px-6 pb-0">
          <div className="flex items-center gap-1 border-t border-gray-100 pt-3">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
                    activeSection === item.id
                      ? 'bg-purple-50 text-purple-700 border-b-2 border-purple-600'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* スクロール可能なコンテンツ */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 py-8 space-y-10">

          {/* セクション: サマリー */}
          <section id="overview" className="space-y-6">
            {/* KPIカード */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <SummaryCard
                icon={Star}
                label="総合評価"
                value={data.summary.averageRating.toFixed(1)}
                previousValue={data.summary.previousRating.toFixed(1)}
                change={data.summary.ratingChange}
                color="purple"
              />
              <SummaryCard
                icon={MessageSquare}
                label="レビュー数"
                value={data.summary.totalReviews}
                previousValue={data.summary.previousReviews}
                change={data.summary.reviewsChange}
                unit="件"
                color="blue"
              />
              <SummaryCard
                icon={Activity}
                label="NPS"
                value={data.summary.nps}
                previousValue={data.summary.previousNps}
                change={data.summary.npsChange}
                color={data.summary.nps >= 40 ? 'green' : data.summary.nps >= 20 ? 'amber' : 'red'}
              />
              <SummaryCard
                icon={CheckCircle2}
                label="返信率"
                value={data.summary.responseRate.toFixed(1)}
                previousValue={data.summary.previousResponseRate.toFixed(1)}
                change={data.summary.responseRateChange}
                unit="%"
                color="green"
              />
              <SummaryCard
                icon={Clock}
                label="平均返信時間"
                value={data.summary.averageResponseTime.toFixed(1)}
                previousValue={data.summary.previousResponseTime.toFixed(1)}
                change={data.summary.responseTimeChange}
                unit="h"
                color="amber"
              />
            </div>

            {/* 総合評価カード */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 px-6 py-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  エグゼクティブサマリー
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* 総合スコア */}
                  <div className="lg:col-span-3 flex flex-col items-center justify-center">
                    <div className={`w-36 h-36 rounded-full ${overallScoreColor.light} flex items-center justify-center relative shadow-inner`}>
                      <div className={`w-32 h-32 rounded-full ${overallScoreColor.bg} flex items-center justify-center shadow-lg relative overflow-hidden`}>
                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
                        <span className="text-5xl font-black text-white relative z-10">{data.overall.score.toFixed(1)}</span>
                      </div>
                    </div>
                    <div className="mt-4 text-center">
                      <p className="text-sm text-gray-500">前月: {data.overall.previousScore.toFixed(1)}</p>
                      <TrendBadge value={((data.overall.score - data.overall.previousScore) / data.overall.previousScore * 100)} />
                    </div>
                  </div>

                  {/* AIサマリー */}
                  <div className="lg:col-span-5">
                    <div className="flex items-center gap-2 mb-3">
                      <MessageSquare className="w-5 h-5 text-purple-600" />
                      <h3 className="font-bold text-gray-900">AI分析コメント</h3>
                    </div>
                    <p className="text-gray-600 leading-relaxed text-sm whitespace-pre-line">{data.overall.aiSummary}</p>
                    <div className="mt-4 space-y-2">
                      {data.overall.keyFindings.map((finding, i) => (
                        <div key={i} className={`flex items-center gap-2 text-sm ${finding.type === 'positive' ? 'text-emerald-700' : 'text-red-700'}`}>
                          {finding.type === 'positive' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertTriangle className="w-4 h-4 flex-shrink-0" />}
                          {finding.text}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* グラフ */}
                  <div className="lg:col-span-4 space-y-4">
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h4 className="text-xs font-bold text-gray-500 mb-3">QSC比較（当月 vs 前月）</h4>
                      <div className="flex justify-center">
                        <RadarChart
                          current={{ quality: data.qsc.quality.score, service: data.qsc.service.score, cleanliness: data.qsc.cleanliness.score }}
                          previous={{ quality: data.qsc.quality.previousScore, service: data.qsc.service.previousScore, cleanliness: data.qsc.cleanliness.previousScore }}
                          size={160}
                        />
                      </div>
                      <div className="flex justify-center gap-4 mt-2 text-[10px]">
                        <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-purple-500" /> 当月</span>
                        <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-gray-400 border-dashed" /> 前月</span>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h4 className="text-xs font-bold text-gray-500 mb-3">評価分布</h4>
                      <div className="flex justify-center">
                        <MiniBarChart data={data.ratingDistribution} height={50} width={180} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 時間帯・曜日分析 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-gray-100 p-5">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-purple-600" />
                  時間帯別パフォーマンス
                </h3>
                <div className="space-y-3">
                  {data.timeAnalysis.map((item, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <span className="text-xs text-gray-500 w-28">{item.time}</span>
                      <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden relative">
                        <div
                          className={`h-full ${item.satisfaction >= 80 ? 'bg-emerald-500' : item.satisfaction >= 70 ? 'bg-amber-500' : 'bg-red-500'} rounded-full`}
                          style={{ width: `${item.satisfaction}%` }}
                        />
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white mix-blend-difference">
                          {item.satisfaction}% ({item.reviews}件)
                        </span>
                      </div>
                      <span className={`text-sm font-bold w-8 ${getScoreColor(item.rating).text}`}>{item.rating.toFixed(1)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 p-5">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  曜日別パフォーマンス
                </h3>
                <div className="flex items-end justify-between h-32">
                  {data.dayOfWeekAnalysis.map((item, i) => {
                    const maxReviews = Math.max(...data.dayOfWeekAnalysis.map(d => d.reviews));
                    const height = (item.reviews / maxReviews) * 100;
                    return (
                      <div key={i} className="flex flex-col items-center gap-1">
                        <span className={`text-xs font-bold ${getScoreColor(item.rating).text}`}>{item.rating.toFixed(1)}</span>
                        <div className="relative w-8">
                          <div
                            className={`w-full ${getScoreColor(item.rating).bg} rounded-t`}
                            style={{ height: `${height * 0.8}px` }}
                          />
                        </div>
                        <span className="text-[10px] text-gray-500">{item.day}</span>
                        <span className="text-[10px] text-gray-400">{item.reviews}件</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ベンチマーク */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-5 text-white">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                エリアベンチマーク
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/10 rounded-lg p-3 text-center">
                  <div className="text-2xl font-black">{data.benchmark.ranking}<span className="text-sm">位</span></div>
                  <div className="text-[10px] text-gray-300">/{data.benchmark.totalStores}店舗中</div>
                </div>
                <div className="bg-white/10 rounded-lg p-3 text-center">
                  <div className="text-2xl font-black">{data.benchmark.percentile}<span className="text-sm">%</span></div>
                  <div className="text-[10px] text-gray-300">パーセンタイル</div>
                </div>
                <div className="bg-white/10 rounded-lg p-3 text-center">
                  <div className="text-2xl font-black">{data.benchmark.areaAverage.toFixed(1)}</div>
                  <div className="text-[10px] text-gray-300">エリア平均</div>
                </div>
                <div className="bg-white/10 rounded-lg p-3 text-center">
                  <div className={`text-2xl font-black ${data.summary.averageRating >= data.benchmark.areaAverage ? 'text-emerald-400' : 'text-red-400'}`}>
                    {data.summary.averageRating >= data.benchmark.areaAverage ? '+' : ''}{(data.summary.averageRating - data.benchmark.areaAverage).toFixed(2)}
                  </div>
                  <div className="text-[10px] text-gray-300">平均との差</div>
                </div>
              </div>
            </div>
          </section>

          {/* セクション: QSC分析 */}
          <section id="qsc" className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-purple-600" />
              QSCスコア詳細分析
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <QSCCard
                title="Quality（品質）"
                icon={Utensils}
                data={data.qsc.quality}
                color="bg-blue-50"
                expanded={false}
              />
              <QSCCard
                title="Service（接客）"
                icon={Users}
                data={data.qsc.service}
                color="bg-green-50"
                expanded={false}
              />
              <QSCCard
                title="Cleanliness（清掃）"
                icon={Sparkles}
                data={data.qsc.cleanliness}
                color="bg-orange-50"
                expanded={true}
              />
            </div>
          </section>

          {/* セクション: 目標管理 */}
          <section id="targets" className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Target className="w-6 h-6 text-purple-600" />
                  目標達成管理
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">優先度</th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">成果指標</th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">現在値</th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">目標値</th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">進捗</th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">期限</th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">担当</th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">施策</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.targets.map(target => {
                      const statusColors = {
                        'behind': 'bg-red-100 text-red-700',
                        'in-progress': 'bg-blue-100 text-blue-700',
                        'on-track': 'bg-emerald-100 text-emerald-700',
                      };
                      const categoryColors = {
                        'クリティカル': 'bg-red-600',
                        '重要': 'bg-orange-500',
                        '改善': 'bg-amber-500',
                        '長期': 'bg-blue-500',
                      };
                      return (
                        <tr key={target.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4">
                            <span className={`text-[10px] text-white px-2 py-0.5 rounded font-bold ${categoryColors[target.category] || 'bg-gray-500'}`}>
                              {target.category}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span className="font-medium text-gray-900">{target.indicator}</span>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-gray-600">{target.current}{target.unit}</span>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-purple-600 font-bold">{target.target}{target.unit}</span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${target.status === 'behind' ? 'bg-red-500' : target.status === 'on-track' ? 'bg-emerald-500' : 'bg-blue-500'}`}
                                  style={{ width: `${target.progress}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-500 w-8">{target.progress}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-xs text-gray-500">{target.endDate}</span>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-xs text-gray-600">{target.owner}</span>
                          </td>
                          <td className="px-4 py-4 max-w-xs">
                            <span className="text-xs text-gray-600 line-clamp-2">{target.measures}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* セクション: 改善アクション */}
          <section id="improvements" className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-red-500" />
              改善アクション
              <span className="text-sm font-normal text-gray-500 ml-2">（{data.improvements.length}件）</span>
            </h2>
            <div className="space-y-4">
              {data.improvements.map((item, index) => (
                <ImprovementCard key={item.id} item={item} index={index} />
              ))}
            </div>
          </section>

          {/* セクション: 成功事例 */}
          <section id="positives" className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              成功事例・グッドプラクティス
              <span className="text-sm font-normal text-gray-500 ml-2">（{data.positives.length}件）</span>
            </h2>
            <div className="space-y-4">
              {data.positives.map((item, index) => (
                <PositiveCard key={item.id} item={item} index={index} />
              ))}
            </div>
          </section>

          {/* セクション: 注目レビュー */}
          <section id="reviews" className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-purple-600" />
              注目レビュー
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {data.featuredReviews.map((review) => (
                <FeaturedReviewCard key={review.id} review={review} />
              ))}
            </div>
          </section>

          {/* フッター */}
          <div className="border-t border-gray-200 pt-6 pb-10">
            <div className="text-center text-xs text-gray-400">
              <p>本レポートはAIにより自動生成されています。内容の正確性については確認をお願いいたします。</p>
              <p className="mt-1">生成日時: {data.meta.generatedAt} | バージョン: {data.meta.reportVersion} | 店舗コード: {data.meta.storeCode}</p>
            </div>
          </div>

        </div>
      </div>
    </Box>
  );
}
