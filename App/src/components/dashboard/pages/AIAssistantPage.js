import React, { useState, useRef, useEffect } from 'react';
import { Box } from '@mui/material';
import { Skeleton } from '../../ui/skeleton';
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
  MessageSquare,
  History,
  Zap,
  Users,
  Timer,
  AlertCircle
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

// 月次レポートアイテム
const ReportItem = ({ report, onClick }) => {
  const hasAlert = report.alert;
  const trend = report.trend;

  return (
    <div
      onClick={onClick}
      className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer group ${
        hasAlert ? 'bg-purple-50/50' : ''
      }`}
    >
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-3">
          <p className="text-base font-bold text-gray-900">{report.period}</p>
          {report.status === 'stable' && (
            <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-bold">
              STABLE
            </span>
          )}
          {hasAlert && (
            <span className="bg-purple-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" />
              AI ALERT
            </span>
          )}
        </div>
        <ChevronRight className={`w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors ${hasAlert ? 'text-purple-600' : ''}`} />
      </div>
      <div className="flex justify-between text-xs text-gray-500">
        <span>レビュー数: {report.reviewCount}</span>
        <span className={hasAlert ? 'text-purple-600 font-bold' : ''}>
          平均評価: {report.avgRating} {hasAlert && '(LOW)'}
        </span>
        <span className={`flex items-center font-bold ${
          trend > 0 ? 'text-green-500' : trend < 0 ? 'text-purple-600' : 'text-gray-400'
        }`}>
          {trend > 0 ? <TrendingUp className="w-3 h-3 mr-0.5" /> : trend < 0 ? <TrendingDown className="w-3 h-3 mr-0.5" /> : null}
          {trend > 0 ? '+' : ''}{trend}%
        </span>
      </div>
    </div>
  );
};

// ライブモニタリングカード
const MonitorCard = ({ icon: Icon, label, value, change, color = 'purple' }) => {
  const colors = {
    purple: 'bg-purple-100 text-purple-600',
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
  };
  const isPositive = change?.startsWith('+');

  return (
    <div className="bg-white p-4 rounded-xl border border-gray-100 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${colors[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-xl font-bold text-gray-900">
          {value}
          {change && (
            <span className={`text-xs font-normal ml-1 ${isPositive ? 'text-green-500' : 'text-purple-600'}`}>
              ({change})
            </span>
          )}
        </p>
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

        {/* メイングリッド */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 左エリア: タスク進捗 */}
          <div className="lg:col-span-7 flex flex-col gap-6">
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

            {/* ライブモニタリング */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <MonitorCard
                icon={Users}
                label="今月のレビュー数"
                value="142件"
                change="+12%"
                color="blue"
              />
              <MonitorCard
                icon={Timer}
                label="平均返信時間"
                value="2.5時間"
                change="-30min"
                color="purple"
              />
            </div>
          </div>

          {/* 右エリア: 月次レポート */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm h-full flex flex-col">
              <div className="p-5 border-b border-gray-100">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-900">月次レポート</h2>
                  <button className="text-purple-600 text-sm font-bold hover:underline">
                    すべて見る
                  </button>
                </div>
                <p className="text-gray-500 text-sm mt-1">AIが異常値を自動ハイライトしています</p>
              </div>

              <div className="flex-1 divide-y divide-gray-100">
                {reports.map(report => (
                  <ReportItem key={report.id} report={report} onClick={() => {}} />
                ))}
              </div>

              <div className="p-3 bg-gray-50 text-center">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                  Next Report scheduled: February 1st
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
