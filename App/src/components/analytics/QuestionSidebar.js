import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Typography,
  TextField,
  Card,
  Badge,
  Button,
  Chip,
  CircularProgress
} from '@mui/material';
import {
  Search,
  Add,
  Remove,
  Clear,
  QuizOutlined
} from '@mui/icons-material';
import { questionsDatabase, categoryColors } from '../../data/questionsDatabase';
import { getQuestionsForAnalytics, getQuestionAnalyticsStats } from '../../services/QuestionService';

export default function QuestionSidebar({
  searchTerm,
  setSearchTerm,
  selectedQuestions,
  setSelectedQuestions,
  // ========= テストモードparam（削除予定） =========
  isTestMode = false
  // ==============================================
}) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 質問データ取得
  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // ========= テストモード分岐（削除予定） =========
        if (isTestMode) {
          console.log('テストモード: 質問データ取得開始');
          
          // テストモード時はSupabaseから取得
          const questionsData = await getQuestionsForAnalytics(null, true);
          console.log('取得した質問データ:', questionsData);
          
          if (!questionsData || questionsData.length === 0) {
            console.warn('テストモード: 質問データが空です');
            setQuestions([]);
            return;
          }
          
          // 統計データを追加取得
          const questionsWithStats = await Promise.all(
            questionsData.map(async (question) => {
              try {
                const stats = await getQuestionAnalyticsStats(question.id, true);
                console.log(`質問ID ${question.id} の統計:`, stats);
                
                return {
                  ...question,
                  responses: stats.responses,
                  avgRating: stats.avgRating,
                  responseCount: stats.responses,
                  chartType: getChartTypeForQuestion(question.typeId),
                  icon: <QuizOutlined />
                };
              } catch (statsError) {
                console.error(`質問ID ${question.id} の統計取得エラー:`, statsError);
                return {
                  ...question,
                  responses: 0,
                  avgRating: 0,
                  responseCount: 0,
                  chartType: getChartTypeForQuestion(question.typeId),
                  icon: <QuizOutlined />
                };
              }
            })
          );
          
          console.log('統計付き質問データ:', questionsWithStats);
          setQuestions(questionsWithStats);
        } else {
          // 本番モード時はダミーデータを使用（削除不要）
          setQuestions(questionsDatabase);
        }
        // ============================================
      } catch (err) {
        console.error('質問データ取得エラー:', err);
        setError('質問データの取得に失敗しました');
        // フォールバック: ダミーデータを使用
        setQuestions(questionsDatabase);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [isTestMode, searchTerm]);

  // 検索フィルタリング（共通処理・削除不要）
  const filteredQuestions = questions.filter(question =>
    question.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    question.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 質問タイプからチャートタイプを決定（共通処理・削除不要）
  const getChartTypeForQuestion = (questionTypeId) => {
    switch (questionTypeId) {
      case 7: // リニアスケール
        return '評価グラフ';
      case 3:
      case 4: // 選択肢
        return '円グラフ';
      case 1:
      case 2: // テキスト
        return 'ワードクラウド';
      default:
        return '棒グラフ';
    }
  };

  // 質問の選択・解除（共通処理・削除不要）
  const toggleQuestion = (question) => {
    setSelectedQuestions(prev => {
      const exists = prev.find(q => q.id === question.id);
      if (exists) {
        return prev.filter(q => q.id !== question.id);
      } else {
        if (prev.length < 2) {
          return [...prev, question];
        }
        return prev;
      }
    });
  };


  return (
    <Box
      sx={{
        width: 280,
        bgcolor: '#ffffff',
        borderRadius: 2,
        border: '1px solid #e5e7eb',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}
    >
      {/* 検索 */}
      <Box sx={{ p: 1.5, borderBottom: '1px solid #e5e7eb' }}>
        <TextField
          fullWidth
          size="small"
          placeholder="質問を検索..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <Search sx={{ color: '#9ca3af', fontSize: 16, mr: 0.5 }} />
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              height: 32,
              borderRadius: 1.5,
              fontSize: '0.8rem',
              '& fieldset': { borderColor: '#e5e7eb' },
              '&:hover fieldset': { borderColor: '#6366f1' },
              '&.Mui-focused fieldset': { borderColor: '#6366f1', borderWidth: '2px' }
            }
          }}
        />
      </Box>



      {/* 質問リスト */}
      <Box sx={{ 
        flexGrow: 1, 
        overflow: 'auto',
        '&::-webkit-scrollbar': {
          display: 'none'
        },
        scrollbarWidth: 'none',
        '-ms-overflow-style': 'none'
      }}>
        <Box sx={{ p: 1 }}>
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={24} />
            </Box>
          )}

          {error && (
            <Box sx={{ textAlign: 'center', py: 4, color: '#ef4444' }}>
              <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                {error}
              </Typography>
            </Box>
          )}

          {!loading && !error && filteredQuestions.map((question, index) => {
            const isSelected = selectedQuestions.find(q => q.id === question.id);
            const canSelect = selectedQuestions.length < 2 || isSelected;
            const isDisabled = !canSelect && !isSelected;

            return (
              <motion.div
                key={question.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  onClick={() => canSelect && toggleQuestion(question)}
                  sx={{
                    mb: 1,
                    p: 1.5,
                    cursor: canSelect ? 'pointer' : 'not-allowed',
                    opacity: isDisabled ? 0.4 : 1,
                    border: isSelected ? `2px solid ${categoryColors[question.category]}` : '1px solid #e5e7eb',
                    bgcolor: '#ffffff',
                    boxShadow: isSelected ? `0 4px 16px ${categoryColors[question.category]}40` : '0 1px 3px rgba(0, 0, 0, 0.05)',
                    transition: 'all 0.2s ease',
                    '&:hover': canSelect ? {
                      boxShadow: `0 4px 12px ${categoryColors[question.category]}40`,
                      transform: 'translateY(-1px)'
                    } : {}
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: 1.5,
                        bgcolor: `${categoryColors[question.category]}20`,
                        color: categoryColors[question.category],
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flex: 'none'
                      }}
                    >
                      {React.cloneElement(question.icon, { sx: { fontSize: 18 } })}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        sx={{
                          fontWeight: 600,
                          color: '#1e293b',
                          fontSize: '0.85rem',
                          lineHeight: 1.3,
                          mb: 0.5
                        }}
                      >
                        {question.title}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Chip
                          label={question.category}
                          size="small"
                          sx={{
                            height: 18,
                            fontSize: '0.65rem',
                            fontWeight: 500,
                            bgcolor: `${categoryColors[question.category]}20`,
                            color: categoryColors[question.category],
                            '& .MuiChip-label': { px: 0.75 }
                          }}
                        />
                        <Badge
                          badgeContent={question.responseCount}
                          color="default"
                          sx={{
                            '& .MuiBadge-badge': {
                              fontSize: '0.65rem',
                              height: 16,
                              minWidth: 16,
                              bgcolor: '#f1f5f9',
                              color: '#64748b'
                            }
                          }}
                        />
                      </Box>
                      <Typography
                        variant="caption"
                        sx={{
                          color: '#64748b',
                          fontSize: '0.7rem',
                          fontWeight: 500
                        }}
                      >
                        {question.chartType} • {question.type}
                      </Typography>
                    </Box>
                  </Box>
                </Card>
              </motion.div>
            );
          })}

          {!loading && !error && filteredQuestions.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4, color: '#9ca3af' }}>
              <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                {isTestMode ? 'テストデータに質問がありません' : '検索結果がありません'}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}