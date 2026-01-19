import React, { useState, useRef, useEffect } from 'react';
import { Box } from '@mui/material';
import { Skeleton } from '../../ui/skeleton';
import {
  Sparkles,
  Send,
  FileText,
  BarChart3,
  Clock,
  CheckCircle2,
  Loader2,
  ChevronRight,
  Bot,
  User,
  Plus,
  Play,
  Calendar,
  TrendingUp,
  AlertCircle,
  X,
  MessageSquare,
  Zap,
  Target,
  RefreshCw
} from 'lucide-react';

// ステータスバッジ
const StatusBadge = ({ status }) => {
  const config = {
    pending: { bg: 'bg-gray-100', text: 'text-gray-600', label: '待機中' },
    in_progress: { bg: 'bg-blue-100', text: 'text-blue-600', label: '処理中' },
    completed: { bg: 'bg-green-100', text: 'text-green-600', label: '完了' },
    failed: { bg: 'bg-red-100', text: 'text-red-600', label: 'エラー' },
  };
  const c = config[status] || config.pending;
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
};

// 統計カード
const StatCard = ({ icon: Icon, label, value, subValue, color = 'purple' }) => {
  const colors = {
    purple: 'bg-purple-100 text-purple-600',
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    orange: 'bg-orange-100 text-orange-600',
  };
  return (
    <div className="bg-white rounded-xl p-5 border border-gray-100">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-sm text-gray-500">{label}</span>
      </div>
      <div className="flex items-end justify-between">
        <span className="text-2xl font-bold text-gray-900">{value}</span>
        {subValue && <span className="text-xs text-gray-400">{subValue}</span>}
      </div>
    </div>
  );
};

// タスク行
const TaskRow = ({ task, onRun }) => {
  const statusIcons = {
    pending: Clock,
    in_progress: Loader2,
    completed: CheckCircle2,
    failed: AlertCircle,
  };
  const StatusIcon = statusIcons[task.status] || Clock;

  return (
    <div className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
        task.status === 'completed' ? 'bg-green-100' :
        task.status === 'in_progress' ? 'bg-blue-100' :
        task.status === 'failed' ? 'bg-red-100' : 'bg-gray-100'
      }`}>
        <StatusIcon className={`w-5 h-5 ${
          task.status === 'completed' ? 'text-green-600' :
          task.status === 'in_progress' ? 'text-blue-600 animate-spin' :
          task.status === 'failed' ? 'text-red-600' : 'text-gray-500'
        }`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 truncate">{task.title}</p>
        <p className="text-sm text-gray-500">{task.description}</p>
      </div>
      <div className="flex items-center gap-3">
        <StatusBadge status={task.status} />
        {task.status === 'pending' && (
          <button
            onClick={() => onRun(task.id)}
            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
          >
            <Play className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

// クイックアクションボタン
const QuickActionButton = ({ icon: Icon, label, onClick, primary }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
      primary
        ? 'bg-purple-600 text-white hover:bg-purple-700 shadow-sm'
        : 'bg-white text-gray-700 border border-gray-200 hover:border-purple-300 hover:text-purple-600'
    }`}
  >
    <Icon className="w-4 h-4" />
    {label}
  </button>
);

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
    <div className="fixed bottom-24 right-6 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-50 overflow-hidden" style={{ height: '500px' }}>
      {/* ヘッダー */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-white" />
          <span className="font-medium text-white">AIアシスタント</span>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* メッセージ */}
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

      {/* 入力 */}
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
    { id: 1, title: '2024年12月 月次レポート', description: '全店舗 • 作成完了', status: 'completed', type: 'report' },
    { id: 2, title: '2025年1月 月次レポート', description: '全店舗 • 処理中...', status: 'in_progress', type: 'report' },
    { id: 3, title: '売上改善分析', description: '店舗A • 待機中', status: 'pending', type: 'analysis' },
  ]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRunTask = (taskId) => {
    setTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, status: 'in_progress' } : t
    ));
    // シミュレーション
    setTimeout(() => {
      setTasks(prev => prev.map(t =>
        t.id === taskId ? { ...t, status: 'completed' } : t
      ));
    }, 3000);
  };

  const handleCreateReport = () => {
    const newTask = {
      id: tasks.length + 1,
      title: `新規レポート作成`,
      description: '全店舗 • 待機中',
      status: 'pending',
      type: 'report'
    };
    setTasks(prev => [newTask, ...prev]);
  };

  const stats = {
    completed: tasks.filter(t => t.status === 'completed').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    pending: tasks.filter(t => t.status === 'pending').length,
    total: tasks.length,
  };

  if (loading) {
    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#f8fafc' }}>
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-36 rounded-lg" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#f8fafc', position: 'relative' }}>
      <div className="p-6 space-y-6 overflow-y-auto h-full">
        {/* ヘッダー */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-7 h-7 text-purple-600" />
              AIアシスタント
            </h1>
            <p className="text-gray-500 mt-1">レポート作成・データ分析タスクを管理</p>
          </div>
          <div className="flex gap-2">
            <QuickActionButton icon={RefreshCw} label="更新" onClick={() => {}} />
            <QuickActionButton icon={Plus} label="新規レポート作成" onClick={handleCreateReport} primary />
          </div>
        </div>

        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard icon={Target} label="合計タスク" value={stats.total} color="purple" />
          <StatCard icon={Loader2} label="処理中" value={stats.inProgress} color="blue" />
          <StatCard icon={Clock} label="待機中" value={stats.pending} color="orange" />
          <StatCard icon={CheckCircle2} label="完了" value={stats.completed} color="green" />
        </div>

        {/* メインコンテンツ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* タスク一覧 */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">タスク一覧</h2>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 text-sm font-medium text-purple-600 bg-purple-50 rounded-lg">
                  すべて
                </button>
                <button className="px-3 py-1.5 text-sm font-medium text-gray-500 hover:bg-gray-50 rounded-lg">
                  処理中
                </button>
                <button className="px-3 py-1.5 text-sm font-medium text-gray-500 hover:bg-gray-50 rounded-lg">
                  完了
                </button>
              </div>
            </div>
            <div className="divide-y divide-gray-50">
              {tasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <FileText className="w-12 h-12 text-gray-300 mb-3" />
                  <p className="text-gray-500">タスクはありません</p>
                </div>
              ) : (
                tasks.map(task => (
                  <TaskRow key={task.id} task={task} onRun={handleRunTask} />
                ))
              )}
            </div>
          </div>

          {/* サイドパネル */}
          <div className="space-y-6">
            {/* クイックアクション */}
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h3 className="font-semibold text-gray-900 mb-4">クイックアクション</h3>
              <div className="space-y-2">
                <button
                  onClick={handleCreateReport}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-purple-50 transition-colors text-left group"
                >
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                    <FileText className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">月次レポート作成</p>
                    <p className="text-xs text-gray-500">AIが自動でレポートを生成</p>
                  </div>
                </button>
                <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-blue-50 transition-colors text-left group">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">売上分析</p>
                    <p className="text-xs text-gray-500">期間別の売上を分析</p>
                  </div>
                </button>
                <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-green-50 transition-colors text-left group">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                    <BarChart3 className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">評価分析</p>
                    <p className="text-xs text-gray-500">顧客評価の傾向を分析</p>
                  </div>
                </button>
              </div>
            </div>

            {/* AIができること */}
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-5 border border-purple-100">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-gray-900">AIができること</h3>
              </div>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                  月次レポートの自動生成
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                  売上・評価データの分析
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                  改善ポイントの特定
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                  データに関する質問への回答
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* フローティングAIボタン */}
      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className={`fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all z-50 ${
          isChatOpen
            ? 'bg-gray-800 hover:bg-gray-900'
            : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700'
        }`}
      >
        {isChatOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <MessageSquare className="w-6 h-6 text-white" />
        )}
      </button>

      {/* AIチャットパネル */}
      <AIChatPanel isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </Box>
  );
}
