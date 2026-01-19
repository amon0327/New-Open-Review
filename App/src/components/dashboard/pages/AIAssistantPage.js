import React, { useState, useRef, useEffect } from 'react';
import { Box } from '@mui/material';
import { Skeleton } from '../../ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../ui/table';
import {
  Sparkles,
  Send,
  FileText,
  Clock,
  CheckCircle2,
  Loader2,
  ChevronRight,
  Bot,
  Plus,
  Play,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  X,
  History,
  Zap,
  Calendar,
  Lightbulb,
  Store,
  Star,
  Users,
  MessageSquare,
  Target,
  ArrowRight
} from 'lucide-react';

// AIメッセージバナー
const AIMessageBanner = ({ message, onAction }) => (
  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-purple-200 bg-white p-5 shadow-sm">
    <div className="flex gap-4 items-start sm:items-center">
      <div className="bg-purple-100 p-3 rounded-full text-purple-600 flex-shrink-0">
        <AlertTriangle className="w-5 h-5" />
      </div>
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <p className="text-purple-600 text-sm font-bold">AIからの優先メッセージ</p>
          <span className="bg-purple-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
            URGENT
          </span>
        </div>
        <p className="text-gray-900 text-base font-medium">{message}</p>
      </div>
    </div>
    <button
      onClick={onAction}
      className="flex items-center justify-center px-5 py-2.5 bg-purple-600 text-white text-sm font-bold rounded-lg shadow-lg shadow-purple-200 hover:bg-purple-700 transition-all whitespace-nowrap"
    >
      詳細を分析
    </button>
  </div>
);

// インサイトカード
const InsightCard = ({ insight }) => {
  const priorityConfig = {
    critical: { bg: 'bg-red-50', border: 'border-l-red-500', icon: AlertTriangle, iconColor: 'text-red-500' },
    high: { bg: 'bg-orange-50', border: 'border-l-orange-500', icon: Zap, iconColor: 'text-orange-500' },
    medium: { bg: 'bg-amber-50', border: 'border-l-amber-500', icon: Lightbulb, iconColor: 'text-amber-500' },
    positive: { bg: 'bg-emerald-50', border: 'border-l-emerald-500', icon: TrendingUp, iconColor: 'text-emerald-500' },
  };

  const config = priorityConfig[insight.priority] || priorityConfig.medium;
  const Icon = config.icon;

  return (
    <div className={`${config.bg} ${config.border} border-l-4 rounded-lg p-4 hover:shadow-md transition-shadow`}>
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg bg-white shadow-sm`}>
          <Icon className={`w-4 h-4 ${config.iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{insight.store}</span>
            {insight.priority === 'critical' && (
              <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded font-bold">要対応</span>
            )}
          </div>
          <p className="text-sm font-bold text-gray-900 mb-1">{insight.title}</p>
          <p className="text-xs text-gray-600 line-clamp-2">{insight.description}</p>
          {insight.metric && (
            <div className="mt-2 flex items-center gap-2">
              <span className={`text-sm font-black ${insight.metricChange > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {insight.metricChange > 0 ? '+' : ''}{insight.metricChange}%
              </span>
              <span className="text-xs text-gray-500">{insight.metric}</span>
            </div>
          )}
        </div>
        <button className="p-1.5 hover:bg-white rounded-lg transition-colors">
          <ArrowRight className="w-4 h-4 text-gray-400" />
        </button>
      </div>
    </div>
  );
};

// 概要カード
const SummaryCard = ({ icon: Icon, label, value, subValue, trend, color }) => {
  const colorClasses = {
    purple: 'bg-purple-100 text-purple-600',
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-emerald-100 text-emerald-600',
    amber: 'bg-amber-100 text-amber-600',
    red: 'bg-red-100 text-red-600',
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-4 h-4" />
        </div>
        {trend !== undefined && (
          <span className={`text-xs font-bold ${trend >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <div className="text-2xl font-black text-gray-900">{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
      {subValue && <div className="text-[10px] text-gray-400 mt-0.5">{subValue}</div>}
    </div>
  );
};

// AIチャットパネル
const AIChatPanel = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([
    { id: 1, content: 'こんにちは！データについて質問があればお気軽にどうぞ。', isUser: false }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    setMessages(prev => [...prev, { id: prev.length + 1, content: input, isUser: true }]);
    setInput('');
    setIsLoading(true);

    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: prev.length + 1,
        content: 'ご質問ありがとうございます。この機能は現在開発中です。近日中にデータ分析やレポートに関する質問にお答えできるようになります。',
        isUser: false
      }]);
      setIsLoading(false);
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-24 right-6 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-50 overflow-hidden" style={{ height: '480px' }}>
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-white" />
          <span className="font-medium text-white">AIアシスタント</span>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${
              msg.isUser
                ? 'bg-purple-600 text-white rounded-br-md'
                : 'bg-gray-100 text-gray-800 rounded-bl-md'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-md">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-t border-gray-100">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="質問を入力..."
            className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="p-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:bg-gray-300 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default function AIAssistantPage({ onNavCollapse, companyId, onOpenReportDetail }) {
  const [insights, setInsights] = useState([
    {
      id: 1,
      store: '渋谷店',
      title: '清掃評価が大幅に低下',
      description: '12月の清掃スコアが前月比-24%。特にトイレ清掃への不満が急増しています。早急な対応が必要です。',
      priority: 'critical',
      metric: '清掃スコア',
      metricChange: -24
    },
    {
      id: 2,
      store: '新宿店',
      title: '待ち時間に関する不満が増加',
      description: '土日ランチタイムの平均待ち時間が18分に悪化。入店を諦める顧客が発生している可能性があります。',
      priority: 'high',
      metric: '待ち時間',
      metricChange: 80
    },
    {
      id: 3,
      store: '渋谷店',
      title: '新メニューが好評',
      description: '「特製チキン南蛮」への高評価コメントが32件。客単価向上に貢献しています。',
      priority: 'positive',
      metric: '客単価',
      metricChange: 8
    },
    {
      id: 4,
      store: '池袋店',
      title: 'スタッフ田中さんへの高評価',
      description: '名指しで褒めるコメントが18件。指名来店も発生しています。',
      priority: 'positive',
      metric: '指名来店',
      metricChange: 3
    },
    {
      id: 5,
      store: '横浜店',
      title: '接客態度の改善が必要',
      description: '「愛想がない」「対応が雑」などのコメントが前月比で増加傾向です。',
      priority: 'medium',
      metric: '接客スコア',
      metricChange: -8
    },
  ]);

  const [reports, setReports] = useState([
    { id: 1, period: '2025年1月', reviewCount: 142, avgRating: 4.2, trend: 3, status: 'stable', alert: false },
    { id: 2, period: '2024年12月', reviewCount: 128, avgRating: 3.1, trend: -8, status: 'alert', alert: true },
    { id: 3, period: '2024年11月', reviewCount: 156, avgRating: 4.0, trend: 5, status: 'stable', alert: false },
    { id: 4, period: '2024年10月', reviewCount: 134, avgRating: 3.8, trend: 1, status: 'stable', alert: false },
    { id: 5, period: '2024年9月', reviewCount: 145, avgRating: 3.9, trend: 0, status: 'stable', alert: false },
  ]);

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleOpenReport = (report) => {
    if (onOpenReportDetail) {
      onOpenReportDetail(report);
    }
  };

  // サマリーデータ
  const summaryData = {
    totalReviews: 560,
    reviewsTrend: 12,
    avgRating: 3.9,
    ratingTrend: -3,
    responseRate: 94.5,
    responseTrend: 5,
    nps: 38,
    npsTrend: -8,
  };

  if (loading) {
    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#f8fafc' }}>
        <div className="p-6 space-y-6">
          <Skeleton className="h-24 rounded-xl" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5">
              <Skeleton className="h-96 rounded-xl" />
            </div>
            <div className="lg:col-span-7">
              <Skeleton className="h-96 rounded-xl" />
            </div>
          </div>
        </div>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#f8fafc', position: 'relative' }}>
      <div className="p-6 space-y-6 overflow-y-auto h-full">
        {/* ヘッダー */}
        <div className="flex flex-wrap justify-between items-end gap-3">
          <div>
            <p className="text-purple-600 text-xs font-bold uppercase tracking-widest mb-1">System Operational</p>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">AIアシスタント</h1>
            <p className="text-gray-500 text-sm mt-1">
              {new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
            </p>
          </div>
          <div className="flex items-center gap-2 bg-purple-100 border border-purple-200 px-4 py-2 rounded-lg">
            <Zap className="w-4 h-4 text-purple-600" />
            <span className="text-purple-600 font-bold text-sm">AI予測: 今月の評価改善 +12%見込み</span>
          </div>
        </div>

        {/* AIメッセージバナー */}
        <AIMessageBanner
          message="12月の評価が低下しています。接客品質の見直しが必要です。"
          onAction={() => {}}
        />

        {/* メインコンテンツ: インサイト（左） + 概要（右） */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 左側: インサイト */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm h-full">
              <div className="p-5 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-purple-600" />
                    <h2 className="text-lg font-bold text-gray-900">店舗別インサイト</h2>
                  </div>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    {insights.length}件
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">AIが検出した重要な傾向と改善点</p>
              </div>
              <div className="p-4 space-y-3 max-h-[480px] overflow-y-auto">
                {insights.map(insight => (
                  <InsightCard key={insight.id} insight={insight} />
                ))}
              </div>
              <div className="p-3 border-t border-gray-100 bg-gray-50">
                <button className="w-full text-center text-sm text-purple-600 font-bold hover:underline">
                  すべてのインサイトを見る
                </button>
              </div>
            </div>
          </div>

          {/* 右側: 概要 */}
          <div className="lg:col-span-7 space-y-6">
            {/* KPIサマリー */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <SummaryCard
                icon={MessageSquare}
                label="総レビュー数"
                value={summaryData.totalReviews}
                subValue="今月"
                trend={summaryData.reviewsTrend}
                color="blue"
              />
              <SummaryCard
                icon={Star}
                label="平均評価"
                value={summaryData.avgRating.toFixed(1)}
                subValue="全店舗"
                trend={summaryData.ratingTrend}
                color="purple"
              />
              <SummaryCard
                icon={CheckCircle2}
                label="返信率"
                value={`${summaryData.responseRate}%`}
                subValue="目標: 95%"
                trend={summaryData.responseTrend}
                color="green"
              />
              <SummaryCard
                icon={Target}
                label="NPS"
                value={summaryData.nps}
                subValue="推奨度"
                trend={summaryData.npsTrend}
                color="amber"
              />
            </div>

            {/* 月次レポート */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
              <div className="p-5 border-b border-gray-100">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-bold text-gray-900">月次レポート</h2>
                  <button className="text-purple-600 text-sm font-bold hover:underline">
                    すべて見る
                  </button>
                </div>
                <p className="text-gray-500 text-xs mt-1">AIが異常値を自動ハイライトしています</p>
              </div>

              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/50">
                    <TableHead className="font-semibold text-gray-700 text-xs">期間</TableHead>
                    <TableHead className="font-semibold text-gray-700 text-xs">レビュー</TableHead>
                    <TableHead className="font-semibold text-gray-700 text-xs">評価</TableHead>
                    <TableHead className="font-semibold text-gray-700 text-xs">前月比</TableHead>
                    <TableHead className="font-semibold text-gray-700 text-xs">状態</TableHead>
                    <TableHead className="w-[40px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.slice(0, 4).map(report => (
                    <TableRow
                      key={report.id}
                      onClick={() => handleOpenReport(report)}
                      className={`cursor-pointer hover:bg-gray-50 transition-colors group ${report.alert ? 'bg-purple-50/30' : ''}`}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${report.alert ? 'bg-purple-100' : 'bg-gray-100'}`}>
                            <Calendar className={`w-3.5 h-3.5 ${report.alert ? 'text-purple-600' : 'text-gray-600'}`} />
                          </div>
                          <span className="font-medium text-gray-900 text-sm">{report.period}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-gray-600 text-sm">{report.reviewCount}件</span>
                      </TableCell>
                      <TableCell>
                        <span className={`text-sm ${report.alert ? 'text-purple-600 font-bold' : 'text-gray-600'}`}>
                          {report.avgRating}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`flex items-center text-sm font-medium ${
                          report.trend > 0 ? 'text-green-600' : report.trend < 0 ? 'text-red-500' : 'text-gray-400'
                        }`}>
                          {report.trend > 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : report.trend < 0 ? <TrendingDown className="w-3 h-3 mr-1" /> : null}
                          {report.trend > 0 ? '+' : ''}{report.trend}%
                        </span>
                      </TableCell>
                      <TableCell>
                        {report.alert ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-600 text-white">
                            <Sparkles className="w-2.5 h-2.5" />
                            ALERT
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-700">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            OK
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-purple-600 transition-colors" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="p-2 bg-gray-50 text-center">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                  Next Report: February 1st
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* フローティングAIボタン */}
      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className={`fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all z-50 ${
          isChatOpen
            ? 'bg-gray-800 hover:bg-gray-900 shadow-gray-400/30'
            : 'bg-purple-600 hover:bg-purple-700 shadow-purple-400/40'
        }`}
      >
        {isChatOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <Sparkles className="w-6 h-6 text-white" />
        )}
      </button>

      {/* AIチャットパネル */}
      <AIChatPanel isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </Box>
  );
}
