import React, { useState, useRef, useEffect } from 'react';
import { Box } from '@mui/material';
import { Skeleton } from '../../ui/skeleton';
import {
  Sparkles,
  Send,
  FileText,
  BarChart3,
  MessageSquare,
  Clock,
  CheckCircle2,
  Loader2,
  ChevronRight,
  Bot,
  User,
  Lightbulb,
  TrendingUp,
  HelpCircle,
  Plus
} from 'lucide-react';

// クイックアクションカード
const QuickActionCard = ({ icon: Icon, title, description, onClick, color = 'purple' }) => {
  const colorClasses = {
    purple: 'bg-purple-50 text-purple-600 group-hover:bg-purple-100',
    blue: 'bg-blue-50 text-blue-600 group-hover:bg-blue-100',
    green: 'bg-green-50 text-green-600 group-hover:bg-green-100',
    orange: 'bg-orange-50 text-orange-600 group-hover:bg-orange-100',
  };

  return (
    <button
      onClick={onClick}
      className="group flex items-start gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:border-purple-200 hover:shadow-md transition-all duration-200 text-left w-full"
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${colorClasses[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-gray-900 mb-1">{title}</h3>
        <p className="text-sm text-gray-500 line-clamp-2">{description}</p>
      </div>
      <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-purple-500 transition-colors flex-shrink-0 mt-2" />
    </button>
  );
};

// サジェストチップ
const SuggestionChip = ({ text, onClick }) => (
  <button
    onClick={onClick}
    className="px-3 py-1.5 bg-gray-100 hover:bg-purple-100 text-gray-700 hover:text-purple-700 text-sm rounded-full transition-colors whitespace-nowrap"
  >
    {text}
  </button>
);

// チャットメッセージ
const ChatMessage = ({ message, isUser }) => (
  <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
      isUser ? 'bg-purple-600' : 'bg-gradient-to-br from-purple-500 to-indigo-600'
    }`}>
      {isUser ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
    </div>
    <div className={`max-w-[80%] ${isUser ? 'text-right' : ''}`}>
      <div className={`inline-block px-4 py-3 rounded-2xl ${
        isUser
          ? 'bg-purple-600 text-white rounded-tr-md'
          : 'bg-white border border-gray-100 text-gray-800 rounded-tl-md shadow-sm'
      }`}>
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
      </div>
      <p className={`text-xs text-gray-400 mt-1 ${isUser ? 'text-right' : ''}`}>
        {message.timestamp}
      </p>
    </div>
  </div>
);

// タスクカード
const TaskCard = ({ task }) => {
  const statusConfig = {
    pending: { icon: Clock, color: 'text-gray-400', bg: 'bg-gray-100', label: '待機中' },
    in_progress: { icon: Loader2, color: 'text-blue-600', bg: 'bg-blue-100', label: '処理中', animate: true },
    completed: { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-100', label: '完了' },
  };

  const config = statusConfig[task.status] || statusConfig.pending;
  const StatusIcon = config.icon;

  return (
    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${config.bg}`}>
        <StatusIcon className={`w-4 h-4 ${config.color} ${config.animate ? 'animate-spin' : ''}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
        <p className="text-xs text-gray-500">{task.description}</p>
      </div>
      <span className={`text-xs font-medium px-2 py-1 rounded-full ${config.bg} ${config.color}`}>
        {config.label}
      </span>
    </div>
  );
};

export default function AIAssistantPage({ onNavCollapse, companyId }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      content: 'こんにちは！OpenReview AIアシスタントです。\n\nレポートの作成、データ分析、質問への回答など、お手伝いできることがあればお気軽にお申し付けください。',
      isUser: false,
      timestamp: '今日 10:00'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tasks, setTasks] = useState([
    { id: 1, title: '2024年12月レポート作成', description: '全店舗の月次レポート', status: 'completed' },
    { id: 2, title: '2025年1月レポート作成', description: '売上分析レポート', status: 'in_progress' },
  ]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = {
      id: messages.length + 1,
      content: inputValue.trim(),
      isUser: true,
      timestamp: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // シミュレーション: AIの応答（実際の実装ではAPIを呼び出す）
    setTimeout(() => {
      const aiResponse = {
        id: messages.length + 2,
        content: 'ご質問ありがとうございます。現在この機能は開発中です。\n\n近日中に以下の機能が利用可能になります：\n• レポートの自動生成\n• データに関する質問への回答\n• 分析インサイトの提供',
        isUser: false,
        timestamp: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1500);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuickAction = (action) => {
    const actionMessages = {
      report: '新しい月次レポートを作成してください',
      analysis: '最新の売上データを分析してください',
      question: '顧客の評価傾向について教えてください',
      insight: '改善が必要な店舗を特定してください',
    };
    setInputValue(actionMessages[action] || '');
    inputRef.current?.focus();
  };

  const suggestions = [
    '先月の売上を教えて',
    'レポートを作成して',
    '評価の傾向は？',
    '改善点を分析して',
  ];

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#f8fafc' }}>
      <div className="flex h-full">
        {/* メインチャットエリア */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* ヘッダー */}
          <div className="p-6 pb-4 border-b border-gray-100 bg-white">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-200">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">AIアシスタント</h1>
                <p className="text-sm text-gray-500">データ分析・レポート作成をサポート</p>
              </div>
            </div>
          </div>

          {/* チャットメッセージエリア */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} isUser={message.isUser} />
            ))}

            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-md px-4 py-3 shadow-sm">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* サジェスト */}
          <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/50">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {suggestions.map((suggestion, index) => (
                <SuggestionChip
                  key={index}
                  text={suggestion}
                  onClick={() => {
                    setInputValue(suggestion);
                    inputRef.current?.focus();
                  }}
                />
              ))}
            </div>
          </div>

          {/* 入力エリア */}
          <div className="p-4 bg-white border-t border-gray-100">
            <div className="flex gap-3 items-end">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="メッセージを入力..."
                  rows={1}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm"
                  style={{ minHeight: '48px', maxHeight: '120px' }}
                />
              </div>
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                className="w-12 h-12 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* サイドパネル */}
        <div className="w-80 border-l border-gray-200 bg-white flex flex-col hidden lg:flex">
          {/* クイックアクション */}
          <div className="p-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-yellow-500" />
              クイックアクション
            </h2>
            <div className="space-y-2">
              <QuickActionCard
                icon={FileText}
                title="レポート作成"
                description="月次レポートを自動生成"
                onClick={() => handleQuickAction('report')}
                color="purple"
              />
              <QuickActionCard
                icon={TrendingUp}
                title="データ分析"
                description="売上・評価データを分析"
                onClick={() => handleQuickAction('analysis')}
                color="blue"
              />
              <QuickActionCard
                icon={HelpCircle}
                title="質問する"
                description="データについて質問"
                onClick={() => handleQuickAction('question')}
                color="green"
              />
              <QuickActionCard
                icon={BarChart3}
                title="インサイト取得"
                description="改善ポイントを特定"
                onClick={() => handleQuickAction('insight')}
                color="orange"
              />
            </div>
          </div>

          {/* タスク進捗 */}
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                タスク進捗
              </h2>
              <button className="text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1">
                <Plus className="w-3 h-3" />
                新規
              </button>
            </div>
            <div className="space-y-2">
              {tasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
              {tasks.length === 0 && (
                <div className="text-center py-8">
                  <Clock className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">タスクはありません</p>
                </div>
              )}
            </div>
          </div>

          {/* AIの機能説明 */}
          <div className="p-4 border-t border-gray-100 bg-gradient-to-br from-purple-50 to-indigo-50">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">AIアシスタントでできること</h3>
            <ul className="space-y-1.5 text-xs text-gray-600">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-purple-500 mt-0.5 flex-shrink-0" />
                月次レポートの自動作成
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-purple-500 mt-0.5 flex-shrink-0" />
                売上・評価データの分析
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-purple-500 mt-0.5 flex-shrink-0" />
                データに関する質問への回答
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-purple-500 mt-0.5 flex-shrink-0" />
                改善インサイトの提供
              </li>
            </ul>
          </div>
        </div>
      </div>
    </Box>
  );
}
