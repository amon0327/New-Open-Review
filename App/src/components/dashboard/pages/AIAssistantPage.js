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
  Star,
  ThumbsUp,
  ThumbsDown,
  Target,
  Lightbulb,
  ArrowLeft,
  MessageSquare
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

// プログレスサークル
const ProgressCircle = ({ percentage }) => {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative w-44 h-44 flex items-center justify-center">
      <svg className="w-full h-full transform -rotate-90">
        <circle
          cx="88"
          cy="88"
          r={radius}
          fill="transparent"
          stroke="#e5e7eb"
          strokeWidth="10"
        />
        <circle
          cx="88"
          cy="88"
          r={radius}
          fill="transparent"
          stroke="#7c3aed"
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-black text-gray-900">{percentage}%</span>
        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Completed</span>
      </div>
    </div>
  );
};

// タスクアイテム
const TaskItem = ({ task, onRun }) => {
  const isCompleted = task.status === 'completed';
  const isCritical = task.priority === 'critical';
  const isInProgress = task.status === 'in_progress';

  return (
    <div className={`p-3 rounded-lg border-l-4 ${
      isCompleted
        ? 'bg-gray-50 border-gray-300 opacity-60'
        : isCritical
          ? 'bg-purple-50 border-purple-600'
          : 'bg-gray-50 border-gray-300'
    }`}>
      <div className="flex justify-between items-start">
        <p className={`text-sm font-bold text-gray-900 ${isCompleted ? 'line-through' : ''}`}>
          {task.title}
        </p>
        {isCritical && !isCompleted && (
          <span className="text-[10px] bg-purple-200 text-purple-700 px-1.5 py-0.5 rounded font-bold uppercase">
            Critical
          </span>
        )}
        {isInProgress && (
          <Loader2 className="w-4 h-4 text-purple-600 animate-spin" />
        )}
      </div>
      <p className="text-xs text-gray-500 mt-1">{task.description}</p>
      {task.status === 'pending' && (
        <button
          onClick={() => onRun(task.id)}
          className="mt-2 flex items-center gap-1 text-xs text-purple-600 font-medium hover:text-purple-700"
        >
          <Play className="w-3 h-3" />
          実行する
        </button>
      )}
    </div>
  );
};


// スコアカード
const ScoreCard = ({ label, score, maxScore = 5, comment, color = 'purple' }) => {
  const percentage = (score / maxScore) * 100;
  const colors = {
    purple: { bg: 'bg-purple-100', text: 'text-purple-600', bar: 'bg-purple-500' },
    blue: { bg: 'bg-blue-100', text: 'text-blue-600', bar: 'bg-blue-500' },
    green: { bg: 'bg-green-100', text: 'text-green-600', bar: 'bg-green-500' },
    orange: { bg: 'bg-orange-100', text: 'text-orange-600', bar: 'bg-orange-500' },
  };
  const c = colors[color];

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className={`text-lg font-bold ${c.text}`}>{score.toFixed(1)}</span>
      </div>
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
        <div className={`h-full ${c.bar} rounded-full transition-all`} style={{ width: `${percentage}%` }} />
      </div>
      <p className="text-xs text-gray-500">{comment}</p>
    </div>
  );
};

// レポート詳細モーダル
const ReportDetailModal = ({ report, onClose }) => {
  if (!report) return null;

  // サンプルデータ
  const reportData = {
    recommendScore: 4.2,
    overallComment: '全体的に高評価を維持していますが、清掃面でのばらつきが見られます。特にピーク時間帯の清掃体制の見直しを推奨します。',
    qsc: {
      quality: { score: 4.5, comment: '料理の品質は安定しており、特に看板メニューの評価が高いです。' },
      service: { score: 4.0, comment: '接客態度は概ね良好ですが、混雑時の対応にばらつきがあります。' },
      cleanliness: { score: 3.8, comment: 'テーブル清掃のタイミングに課題があります。特に12-14時の時間帯で低評価が集中しています。' },
    },
    targets: [
      { id: 1, indicator: '清掃評価スコア', current: 3.8, target: 4.2, startDate: '2025/01/01', endDate: '2025/03/31', measures: '清掃チェックリストの導入', memo: 'ピーク時間帯重点' },
      { id: 2, indicator: '接客評価スコア', current: 4.0, target: 4.3, startDate: '2025/01/01', endDate: '2025/02/28', measures: '接客研修の実施', memo: '新人スタッフ優先' },
      { id: 3, indicator: 'リピート率', current: 42, target: 50, startDate: '2025/01/01', endDate: '2025/06/30', measures: 'ポイントカード施策', memo: '単位: %' },
    ],
    improvements: [
      {
        id: 1,
        insight: '前月比で清掃評価が15%低下。「テーブルが汚れていた」という同様のコメントが8件増加。',
        salesImpact: '清掃評価の低下により、推定で月間売上の約3%（¥120,000相当）の機会損失が発生している可能性があります。',
        causeAnalysis: 'ランチタイム（12-14時）の来客数増加に対し、清掃スタッフの配置が不足。特に金曜日の混雑時に問題が顕著。',
      },
      {
        id: 2,
        insight: '「待ち時間が長い」というコメントが前月比で5件増加。',
        salesImpact: '待ち時間の増加により、来店を諦める顧客が推定で週10組発生。月間約¥80,000の損失。',
        causeAnalysis: 'キッチンスタッフの配置見直しが必要。特にピーク時のオーダー処理能力に課題。',
      },
    ],
    positives: [
      {
        id: 1,
        insight: '「料理が美味しい」のコメントが前月比で20%増加。特に新メニューへの評価が高い。',
      },
      {
        id: 2,
        insight: 'スタッフ田中さんを名指しで褒めるコメントが12件。「笑顔が素敵」「気配りが素晴らしい」という声が多数。',
      },
      {
        id: 3,
        insight: '店内の雰囲気に関するポジティブコメントが前月比で8件増加。照明の改善効果が表れている。',
      },
    ],
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto py-8">
      <div className="bg-gray-50 w-full max-w-4xl rounded-2xl shadow-2xl mx-4 my-auto">
        {/* ヘッダー */}
        <div className="sticky top-0 bg-white rounded-t-2xl border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{report.period} レポート</h2>
              <p className="text-sm text-gray-500">レビュー数: {report.reviewCount}件</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* 推奨スコアと総合コメント */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-start gap-6">
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                  <span className="text-3xl font-black text-white">{reportData.recommendScore}</span>
                </div>
                <span className="text-sm font-medium text-gray-500 mt-2">推奨スコア</span>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-purple-600" />
                  総合コメント
                </h3>
                <p className="text-gray-600 leading-relaxed">{reportData.overallComment}</p>
              </div>
            </div>
          </div>

          {/* QSCスコア */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              QSCスコア
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ScoreCard
                label="Quality（品質）"
                score={reportData.qsc.quality.score}
                comment={reportData.qsc.quality.comment}
                color="blue"
              />
              <ScoreCard
                label="Service（接客）"
                score={reportData.qsc.service.score}
                comment={reportData.qsc.service.comment}
                color="green"
              />
              <ScoreCard
                label="Cleanliness（清掃）"
                score={reportData.qsc.cleanliness.score}
                comment={reportData.qsc.cleanliness.comment}
                color="orange"
              />
            </div>
          </div>

          {/* 目標達成管理 */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-600" />
                目標達成管理
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">成果指標</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">現在地</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">目標値</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">開始日</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">終了日</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">行う施策</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">メモ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {reportData.targets.map(target => (
                    <tr key={target.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{target.indicator}</td>
                      <td className="px-4 py-3 text-gray-600">{target.current}</td>
                      <td className="px-4 py-3 text-purple-600 font-medium">{target.target}</td>
                      <td className="px-4 py-3 text-gray-500">{target.startDate}</td>
                      <td className="px-4 py-3 text-gray-500">{target.endDate}</td>
                      <td className="px-4 py-3 text-gray-600">{target.measures}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{target.memo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action 改善点 */}
          <div className="bg-white rounded-xl border border-red-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-red-100 bg-red-50">
              <h3 className="text-lg font-bold text-red-700 flex items-center gap-2">
                <ThumbsDown className="w-5 h-5" />
                Action 改善点
              </h3>
            </div>
            <div className="divide-y divide-gray-100">
              {reportData.improvements.map((item, index) => (
                <div key={item.id} className="p-5">
                  <div className="flex items-start gap-3 mb-4">
                    <span className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {index + 1}
                    </span>
                    <div className="flex-1 space-y-3">
                      <div>
                        <p className="text-xs font-bold text-red-600 uppercase tracking-wider mb-1">きっかけインサイト</p>
                        <p className="text-sm text-gray-800 bg-red-50 p-3 rounded-lg">{item.insight}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-1">売上インパクト</p>
                        <p className="text-sm text-gray-600">{item.salesImpact}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">原因分析</p>
                        <p className="text-sm text-gray-600">{item.causeAnalysis}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 良かった点 */}
          <div className="bg-white rounded-xl border border-green-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-green-100 bg-green-50">
              <h3 className="text-lg font-bold text-green-700 flex items-center gap-2">
                <ThumbsUp className="w-5 h-5" />
                良かった点
              </h3>
            </div>
            <div className="divide-y divide-gray-100">
              {reportData.positives.map((item, index) => (
                <div key={item.id} className="p-5">
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-start gap-2">
                        <Lightbulb className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-800">{item.insight}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
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

export default function AIAssistantPage({ onNavCollapse, companyId }) {
  const [tasks, setTasks] = useState([
    { id: 1, title: '低評価レビューへの対応', description: 'AI推奨: 接客品質の改善が必要です', status: 'pending', priority: 'critical' },
    { id: 2, title: '2025年1月レポート確認', description: '処理中...', status: 'in_progress', priority: 'normal' },
    { id: 3, title: 'スタッフ評価の分析', description: '完了 09:30 AM', status: 'completed', priority: 'normal' },
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
  const [selectedReport, setSelectedReport] = useState(null);

  const handleRunTask = (taskId) => {
    setTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, status: 'in_progress', description: '処理中...' } : t
    ));
    setTimeout(() => {
      setTasks(prev => prev.map(t =>
        t.id === taskId ? { ...t, status: 'completed', description: `完了 ${new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}` } : t
      ));
    }, 3000);
  };

  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const totalTasks = tasks.length;
  const progressPercentage = Math.round((completedTasks / totalTasks) * 100);

  if (loading) {
    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#f8fafc' }}>
        <div className="p-6 space-y-6">
          <Skeleton className="h-24 rounded-xl" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7">
              <Skeleton className="h-80 rounded-xl" />
            </div>
            <div className="lg:col-span-5">
              <Skeleton className="h-80 rounded-xl" />
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

        {/* タスク進捗 */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">タスク進捗</h2>
            <div className="flex gap-2">
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium hover:bg-gray-50 transition-colors">
                <History className="w-4 h-4" />
                過去ログ
              </button>
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-600 text-white text-sm font-bold hover:bg-purple-700 transition-colors">
                <Plus className="w-4 h-4" />
                新規タスク
              </button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-8 py-4">
            <ProgressCircle percentage={progressPercentage} />

            <div className="flex-1 w-full space-y-4">
              <div className="flex justify-between items-end">
                <p className="text-base font-bold text-gray-900">本日の重点タスク</p>
                <p className="text-sm text-gray-500">
                  残り{totalTasks - completedTasks} / 全{totalTasks}件
                </p>
              </div>
              <div className="space-y-3">
                {tasks.map(task => (
                  <TaskItem key={task.id} task={task} onRun={handleRunTask} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 月次レポート */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="p-5 border-b border-gray-100">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">月次レポート</h2>
              <button className="text-purple-600 text-sm font-bold hover:underline">
                すべて見る
              </button>
            </div>
            <p className="text-gray-500 text-sm mt-1">AIが異常値を自動ハイライトしています</p>
          </div>

          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50">
                <TableHead className="font-semibold text-gray-700">レポート期間</TableHead>
                <TableHead className="font-semibold text-gray-700">レビュー数</TableHead>
                <TableHead className="font-semibold text-gray-700">平均評価</TableHead>
                <TableHead className="font-semibold text-gray-700">前月比</TableHead>
                <TableHead className="font-semibold text-gray-700">ステータス</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map(report => (
                <TableRow
                  key={report.id}
                  onClick={() => setSelectedReport(report)}
                  className={`cursor-pointer hover:bg-gray-50 transition-colors group ${report.alert ? 'bg-purple-50/30' : ''}`}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${report.alert ? 'bg-purple-100' : 'bg-gray-100'}`}>
                        <Calendar className={`w-4 h-4 ${report.alert ? 'text-purple-600' : 'text-gray-600'}`} />
                      </div>
                      <span className="font-medium text-gray-900">{report.period}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-gray-600">{report.reviewCount}件</span>
                  </TableCell>
                  <TableCell>
                    <span className={report.alert ? 'text-purple-600 font-bold' : 'text-gray-600'}>
                      {report.avgRating}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`flex items-center font-medium ${
                      report.trend > 0 ? 'text-green-600' : report.trend < 0 ? 'text-red-500' : 'text-gray-400'
                    }`}>
                      {report.trend > 0 ? <TrendingUp className="w-3.5 h-3.5 mr-1" /> : report.trend < 0 ? <TrendingDown className="w-3.5 h-3.5 mr-1" /> : null}
                      {report.trend > 0 ? '+' : ''}{report.trend}%
                    </span>
                  </TableCell>
                  <TableCell>
                    {report.alert ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-purple-600 text-white">
                        <Sparkles className="w-3 h-3" />
                        AI ALERT
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        <CheckCircle2 className="w-3 h-3" />
                        STABLE
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="p-3 bg-gray-50 text-center">
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
              Next Report scheduled: February 1st
            </p>
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

      {/* レポート詳細モーダル */}
      {selectedReport && (
        <ReportDetailModal
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
        />
      )}
    </Box>
  );
}
