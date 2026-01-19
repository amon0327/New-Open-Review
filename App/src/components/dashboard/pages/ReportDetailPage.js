import React, { useState } from 'react';
import { Box } from '@mui/material';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../ui/table';
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
  ChevronRight,
  Calendar,
  BarChart3,
  FileText,
  Edit3,
  Download,
  Share2
} from 'lucide-react';

// サンプルレポートデータ
const sampleReportData = {
  period: '2024年12月',
  generatedAt: '2025年1月15日 09:30',
  store: '渋谷店',
  reviewCount: 128,

  // 総合評価
  overall: {
    score: 3.8,
    previousScore: 4.1,
    comment: '12月は全体的に評価が低下しました。特に清掃面での課題が顕著です。年末の繁忙期における人員配置の見直しと、清掃マニュアルの徹底が急務です。一方で、新メニューの評価は好調で、今後の売上向上に期待できます。',
  },

  // QSCスコア
  qsc: {
    quality: {
      score: 4.2,
      previousScore: 4.0,
      trend: 5,
      comment: '新メニュー「特製チキン南蛮」が好評。味付けの安定性も向上しています。',
      details: [
        { item: '料理の味', score: 4.4 },
        { item: '盛り付け', score: 4.1 },
        { item: '提供温度', score: 4.0 },
        { item: 'ボリューム', score: 4.3 },
      ]
    },
    service: {
      score: 3.6,
      previousScore: 4.0,
      trend: -10,
      comment: '混雑時の対応に課題あり。特に待ち時間に関する不満が増加しています。',
      details: [
        { item: '接客態度', score: 4.0 },
        { item: '待ち時間', score: 3.0 },
        { item: '注文対応', score: 3.5 },
        { item: '会計対応', score: 4.0 },
      ]
    },
    cleanliness: {
      score: 3.2,
      previousScore: 4.2,
      trend: -24,
      comment: 'テーブル清掃、トイレ清掃ともに評価が大幅低下。早急な改善が必要です。',
      details: [
        { item: 'テーブル清掃', score: 3.0 },
        { item: 'トイレ清掃', score: 2.8 },
        { item: '店内清潔感', score: 3.5 },
        { item: '食器の清潔さ', score: 3.6 },
      ]
    },
  },

  // 目標管理
  targets: [
    {
      id: 1,
      indicator: '清掃評価スコア',
      current: 3.2,
      target: 4.0,
      unit: 'pt',
      startDate: '2025/01/01',
      endDate: '2025/02/28',
      measures: '清掃チェックリスト導入、巡回頻度を30分→15分に変更',
      memo: '最優先課題',
      progress: 0,
    },
    {
      id: 2,
      indicator: '平均待ち時間',
      current: 18,
      target: 10,
      unit: '分',
      startDate: '2025/01/01',
      endDate: '2025/03/31',
      measures: 'ピーク時のキッチンスタッフ1名増員',
      memo: '人件費+5万/月',
      progress: 20,
    },
    {
      id: 3,
      indicator: '接客評価スコア',
      current: 3.6,
      target: 4.2,
      unit: 'pt',
      startDate: '2025/01/15',
      endDate: '2025/03/31',
      measures: '接客研修（2時間×週1回）実施',
      memo: '新人スタッフ重点',
      progress: 10,
    },
    {
      id: 4,
      indicator: 'リピート来店率',
      current: 38,
      target: 50,
      unit: '%',
      startDate: '2025/01/01',
      endDate: '2025/06/30',
      measures: 'LINE会員限定クーポン施策',
      memo: '長期目標',
      progress: 15,
    },
  ],

  // 改善点
  improvements: [
    {
      id: 1,
      category: '清掃',
      severity: 'critical',
      title: 'テーブル・トイレ清掃の品質低下',
      insight: '前月比で清掃関連のネガティブコメントが23件→41件に増加（+78%）。特に「テーブルがベタベタする」「トイレが汚い」という具体的な指摘が目立つ。',
      salesImpact: {
        description: '清掃評価の低下により、リピート率が推定8%低下。月間売上への影響は約¥180,000の機会損失。',
        amount: -180000,
      },
      causeAnalysis: '年末の繁忙期に清掃スタッフのシフトが不足。特に12/23-12/31の期間で問題が集中。また、新人アルバイト2名への清掃研修が不十分だった。',
      actionPlan: '1. 清掃チェックリストの導入（即日）\n2. 清掃巡回を30分→15分間隔に変更\n3. 新人向け清掃研修の再実施',
    },
    {
      id: 2,
      category: '接客',
      severity: 'high',
      title: '待ち時間に関する不満増加',
      insight: '「待ち時間が長い」関連のコメントが前月比で12件増加。特に土日のランチタイム（11:30-13:30）に集中。平均待ち時間が10分→18分に悪化。',
      salesImpact: {
        description: '待ち時間増加により、入店を諦める顧客が推定で週末あたり15組発生。月間約¥120,000の損失。',
        amount: -120000,
      },
      causeAnalysis: 'キッチンスタッフの退職（11月末）により、ピーク時の調理能力が低下。代替要員の採用が12月中旬まで完了せず。',
      actionPlan: '1. ピーク時のキッチンスタッフを1名増員\n2. 調理工程の見直しで効率化\n3. 待ち時間表示システムの導入検討',
    },
  ],

  // 良かった点
  positives: [
    {
      id: 1,
      category: '品質',
      title: '新メニューが好評',
      insight: '12月導入の「特製チキン南蛮」に関するポジティブコメントが32件。「ボリューム満点」「タルタルソースが絶品」など具体的な称賛が多数。',
      impact: '新メニュー効果で客単価が前月比+¥150（+8%）向上。月間売上への貢献は約+¥200,000。',
    },
    {
      id: 2,
      category: '接客',
      title: 'スタッフ田中さんへの高評価',
      insight: 'スタッフ田中さんを名指しで褒めるコメントが18件。「笑顔が素敵」「気配りが素晴らしい」「また会いたい」など。指名来店も3件発生。',
      impact: '優秀スタッフの存在がリピート率向上に貢献。田中さんシフト日の売上は平均+12%。',
    },
    {
      id: 3,
      category: '雰囲気',
      title: 'クリスマス装飾が好評',
      insight: '店内のクリスマス装飾に関するポジティブコメントが15件。「写真映えする」「季節感があって良い」などSNS投稿も増加。',
      impact: 'Instagram投稿数が前月比2.5倍。新規来店のきっかけとして「SNSで見た」が増加。',
    },
  ],
};

// スコアリング（色分け）
const getScoreColor = (score) => {
  if (score >= 4.5) return { bg: 'bg-green-500', text: 'text-green-600', light: 'bg-green-100' };
  if (score >= 4.0) return { bg: 'bg-blue-500', text: 'text-blue-600', light: 'bg-blue-100' };
  if (score >= 3.5) return { bg: 'bg-yellow-500', text: 'text-yellow-600', light: 'bg-yellow-100' };
  if (score >= 3.0) return { bg: 'bg-orange-500', text: 'text-orange-600', light: 'bg-orange-100' };
  return { bg: 'bg-red-500', text: 'text-red-600', light: 'bg-red-100' };
};

// トレンドバッジ
const TrendBadge = ({ value }) => {
  const isPositive = value > 0;
  const isNegative = value < 0;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
      isPositive ? 'bg-green-100 text-green-700' : isNegative ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
    }`}>
      {isPositive ? <TrendingUp className="w-3 h-3" /> : isNegative ? <TrendingDown className="w-3 h-3" /> : null}
      {isPositive ? '+' : ''}{value}%
    </span>
  );
};

// QSCカード
const QSCCard = ({ title, icon: Icon, data, color }) => {
  const scoreColor = getScoreColor(data.score);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className={`px-5 py-4 ${color} border-b`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/80 flex items-center justify-center">
              <Icon className="w-5 h-5 text-gray-700" />
            </div>
            <h3 className="font-bold text-gray-900">{title}</h3>
          </div>
          <TrendBadge value={data.trend} />
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-center gap-4 mb-4">
          <div className="text-center">
            <div className={`text-4xl font-black ${scoreColor.text}`}>{data.score.toFixed(1)}</div>
            <div className="text-xs text-gray-400 mt-1">前月 {data.previousScore.toFixed(1)}</div>
          </div>
          <div className="flex-1">
            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full ${scoreColor.bg} rounded-full transition-all duration-500`}
                style={{ width: `${(data.score / 5) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-4">{data.comment}</p>

        <div className="space-y-2">
          {data.details.map((detail, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <span className="text-gray-500">{detail.item}</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getScoreColor(detail.score).bg} rounded-full`}
                    style={{ width: `${(detail.score / 5) * 100}%` }}
                  />
                </div>
                <span className="font-medium text-gray-700 w-8">{detail.score.toFixed(1)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// 改善点カード
const ImprovementCard = ({ item, index }) => {
  const severityConfig = {
    critical: { bg: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-600', text: 'CRITICAL' },
    high: { bg: 'bg-orange-50', border: 'border-orange-200', badge: 'bg-orange-500', text: 'HIGH' },
    medium: { bg: 'bg-yellow-50', border: 'border-yellow-200', badge: 'bg-yellow-500', text: 'MEDIUM' },
  };
  const config = severityConfig[item.severity] || severityConfig.medium;

  return (
    <div className={`${config.bg} ${config.border} border rounded-2xl overflow-hidden`}>
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-sm font-bold text-gray-700 shadow-sm">
              {index + 1}
            </span>
            <div>
              <span className={`${config.badge} text-white text-[10px] px-2 py-0.5 rounded font-bold`}>
                {config.text}
              </span>
              <h4 className="font-bold text-gray-900 mt-1">{item.title}</h4>
            </div>
          </div>
          <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded">{item.category}</span>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">インサイト</span>
            </div>
            <p className="text-sm text-gray-700">{item.insight}</p>
          </div>

          <div className="bg-white rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">売上インパクト</span>
            </div>
            <p className="text-sm text-gray-700 mb-2">{item.salesImpact.description}</p>
            <span className="text-lg font-bold text-red-600">
              {item.salesImpact.amount.toLocaleString()}円/月
            </span>
          </div>

          <div className="bg-white rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">原因分析</span>
            </div>
            <p className="text-sm text-gray-700">{item.causeAnalysis}</p>
          </div>

          <div className="bg-white rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-purple-500" />
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">アクションプラン</span>
            </div>
            <p className="text-sm text-gray-700 whitespace-pre-line">{item.actionPlan}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// 良かった点カード
const PositiveCard = ({ item, index }) => (
  <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-5">
    <div className="flex items-start gap-4">
      <span className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-sm font-bold text-white shadow-sm flex-shrink-0">
        {index + 1}
      </span>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-bold text-gray-900">{item.title}</h4>
          <span className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded">{item.category}</span>
        </div>
        <div className="bg-white rounded-xl p-4 mb-3">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">インサイト</span>
          </div>
          <p className="text-sm text-gray-700">{item.insight}</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-green-700">
          <TrendingUp className="w-4 h-4" />
          <span>{item.impact}</span>
        </div>
      </div>
    </div>
  </div>
);

export default function ReportDetailPage({ report, onBack }) {
  const data = sampleReportData;
  const overallScoreColor = getScoreColor(data.overall.score);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#f8fafc' }}>
      <div className="h-full overflow-y-auto">
        {/* ヘッダー */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={onBack}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-black text-gray-900">{data.period}</h1>
                    <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">{data.store}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    生成日時: {data.generatedAt} • レビュー数: {data.reviewCount}件
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
                  <Download className="w-4 h-4" />
                  <span className="text-sm font-medium">エクスポート</span>
                </button>
                <button className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
                  <Share2 className="w-4 h-4" />
                  <span className="text-sm font-medium">共有</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
          {/* 総合評価 */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Star className="w-5 h-5" />
                総合評価
              </h2>
            </div>
            <div className="p-6">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex flex-col items-center">
                  <div className={`w-32 h-32 rounded-full ${overallScoreColor.light} flex items-center justify-center relative`}>
                    <div className={`w-28 h-28 rounded-full ${overallScoreColor.bg} flex items-center justify-center shadow-lg`}>
                      <span className="text-4xl font-black text-white">{data.overall.score.toFixed(1)}</span>
                    </div>
                  </div>
                  <div className="mt-3 text-center">
                    <p className="text-sm text-gray-500">前月: {data.overall.previousScore.toFixed(1)}</p>
                    <TrendBadge value={Math.round((data.overall.score - data.overall.previousScore) / data.overall.previousScore * 100)} />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <MessageSquare className="w-5 h-5 text-purple-600" />
                    <h3 className="font-bold text-gray-900">AIサマリー</h3>
                  </div>
                  <p className="text-gray-600 leading-relaxed">{data.overall.comment}</p>
                </div>
              </div>
            </div>
          </div>

          {/* QSCスコア */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-purple-600" />
              QSCスコア詳細
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <QSCCard
                title="Quality（品質）"
                icon={Utensils}
                data={data.qsc.quality}
                color="bg-blue-50"
              />
              <QSCCard
                title="Service（接客）"
                icon={Users}
                data={data.qsc.service}
                color="bg-green-50"
              />
              <QSCCard
                title="Cleanliness（清掃）"
                icon={Sparkles}
                data={data.qsc.cleanliness}
                color="bg-orange-50"
              />
            </div>
          </div>

          {/* 目標達成管理 */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Target className="w-6 h-6 text-purple-600" />
                目標達成管理
              </h2>
              <button className="flex items-center gap-2 px-3 py-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors text-sm font-medium">
                <Edit3 className="w-4 h-4" />
                編集
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">成果指標</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">現在地</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">目標値</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">進捗</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">期間</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">施策</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">メモ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.targets.map(target => (
                    <tr key={target.id} className="hover:bg-gray-50">
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
                          <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-purple-500 rounded-full"
                              style={{ width: `${target.progress}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500">{target.progress}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-xs text-gray-500">{target.startDate} 〜 {target.endDate}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-gray-600">{target.measures}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-xs text-gray-400">{target.memo}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 改善点 */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-red-500" />
              Action 改善点
              <span className="text-sm font-normal text-gray-500 ml-2">（{data.improvements.length}件）</span>
            </h2>
            <div className="space-y-4">
              {data.improvements.map((item, index) => (
                <ImprovementCard key={item.id} item={item} index={index} />
              ))}
            </div>
          </div>

          {/* 良かった点 */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-green-500" />
              良かった点
              <span className="text-sm font-normal text-gray-500 ml-2">（{data.positives.length}件）</span>
            </h2>
            <div className="space-y-4">
              {data.positives.map((item, index) => (
                <PositiveCard key={item.id} item={item} index={index} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </Box>
  );
}
