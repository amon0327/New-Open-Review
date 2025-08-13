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
  QuizOutlined,
  TextFields,
  PieChart,
  BarChart,
  ArrowBack,
  FolderOutlined
} from '@mui/icons-material';
import { questionsDatabase, categoryColors } from '../../data/questionsDatabase';
import { getQuestionsForAnalytics, getQuestionAnalyticsStats } from '../../services/QuestionService';
import { DataService } from '../../services/DataService';
import { supabase } from '../../lib/supabase';

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
  const [reviewForms, setReviewForms] = useState([]);
  const [selectedForm, setSelectedForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentView, setCurrentView] = useState('forms'); // 'forms' or 'questions'

  // レビューフォーム一覧取得
  useEffect(() => {
    const fetchReviewForms = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log('レビューフォーム一覧取得開始');
        
        // ========= テストモード分岐（削除予定） =========
        if (isTestMode) {
          console.log('テストモード: フォーム一覧データ取得開始');
          
          // test_review_formsからフォーム一覧を取得
          const { data: testForms, error: testFormsError } = await supabase
            .from('test_review_forms')
            .select(`
              id,
              title,
              created_at,
              updated_at,
              is_published,
              is_deleted
            `)
            .eq('is_deleted', false)
            .order('updated_at', { ascending: false });
          
          console.log('テストフォーム取得結果:', { data: testForms, error: testFormsError });
          
          if (testFormsError) {
            console.error('テストフォーム取得エラー:', testFormsError);
            setReviewForms([]);
          } else {
            // 各フォームの質問数を取得
            const formsWithQuestionCount = await Promise.all(
              testForms.map(async (form) => {
                try {
                  const { data: questions, error: questionsError } = await supabase
                    .from('test_review_questions')
                    .select('id')
                    .eq('review_fome_id', form.id);
                  
                  return {
                    ...form,
                    question_count: questionsError ? 0 : (questions?.length || 0)
                  };
                } catch (err) {
                  console.error(`フォーム ${form.id} の質問数取得エラー:`, err);
                  return {
                    ...form,
                    question_count: 0
                  };
                }
              })
            );
            
            console.log('質問数付きフォーム一覧:', formsWithQuestionCount);
            setReviewForms(formsWithQuestionCount);
          }
        } else {
          // 本番モード: DataServiceからフォーム一覧を取得
          const forms = await DataService.getReviewForms('dummy_user_id'); // 実際のユーザーIDに変更必要
          console.log('取得したフォーム一覧:', forms);
          setReviewForms(forms);
        }
        // ===============================================
        
      } catch (err) {
        console.error('フォーム一覧取得エラー:', err);
        setError('フォーム一覧の取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchReviewForms();
  }, [isTestMode]);

  // 質問データ取得（フォーム選択後）
  const fetchQuestionsForForm = async (formId) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('質問データ取得開始 for form:', formId);
      
      // ========= テストモード分岐（削除予定） =========
      if (isTestMode) {
        console.log('テストモード: 質問データ取得開始 for form:', formId);
        
        // test_review_questionsから指定されたフォームの質問を取得
        const { data: testQuestions, error: testQuestionsError } = await supabase
          .from('test_review_questions')
          .select(`
            id,
            question_text,
            question_number,
            is_required,
            question_detail_text,
            is_detail_enabled,
            created_at,
            question_types_id,
            question_categories_id,
            question_subcategories_id,
            review_fome_id
          `)
          .eq('review_fome_id', formId)
          .order('question_number', { ascending: true });
        
        console.log('テスト質問取得結果:', { data: testQuestions, error: testQuestionsError });
        
        if (testQuestionsError) {
          console.error('テスト質問取得エラー:', testQuestionsError);
          setQuestions([]);
          return;
        }
        
        if (!testQuestions || testQuestions.length === 0) {
          console.warn('テストモード: 指定されたフォームに質問がありません');
          setQuestions([]);
          return;
        }
        
        // 質問データをフォーマット（UIに必要な形式に変換）
        const formattedQuestions = await Promise.all(
          testQuestions.map(async (question) => {
            const questionTypeId = question.question_types_id;
            
            // 各質問の回答数を取得
            let responseCount = 0;
            try {
              const { data: answerData, error: answerError } = await supabase
                .from('test_review_question_answers')
                .select('id')
                .eq('review_questions_id', question.id);
              
              if (!answerError && answerData) {
                responseCount = answerData.length;
              }
            } catch (err) {
              console.error(`質問 ${question.id} の回答数取得エラー:`, err);
            }
            
            return {
              id: question.id,
              title: question.question_text || 'タイトルなし',
              category: getCategoryName(question.question_categories_id),
              type: getTypeName(questionTypeId),
              typeId: questionTypeId,
              isRequired: question.is_required,
              responses: responseCount,
              avgRating: 0,
              responseCount: responseCount,
              chartType: getChartTypeForQuestion(questionTypeId, question.is_required),
              icon: getIconForQuestion(questionTypeId, question.is_required),
              iconColor: getIconColorForQuestion(questionTypeId, question.is_required),
              categoryColor: categoryColors[getCategoryName(question.question_categories_id)] || '#6B7280',
              review_fome_id: question.review_fome_id
            };
          })
        );
        
        console.log('フォーマット済み質問データ:', formattedQuestions);
        setQuestions(formattedQuestions);
      } else {
        // 本番モード: 指定されたフォームの質問のみ取得
        const questionsData = await getQuestionsForAnalytics('dummy_user_id', false);
        const formQuestions = questionsData.filter(q => 
          q.review_fome_id === formId || q.review_forms_id === formId
        );
        setQuestions(formQuestions);
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

  // フォーム選択ハンドラー
  const handleFormSelect = async (form) => {
    setSelectedForm(form);
    setCurrentView('questions');
    // 選択された質問をクリア
    setSelectedQuestions([]);
    // そのフォームの質問を取得
    await fetchQuestionsForForm(form.id);
  };

  // フォーム一覧に戻る
  const handleBackToForms = () => {
    setCurrentView('forms');
    setSelectedForm(null);
    setQuestions([]);
    setSelectedQuestions([]);
  };

  // 検索フィルタリング（フォーム・質問両対応）
  const filteredQuestions = questions.filter(question =>
    question.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    question.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredForms = reviewForms.filter(form =>
    form.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // カテゴリID からカテゴリ名を取得
  const getCategoryName = (categoryId) => {
    const categoryMap = {
      1: '基本情報',
      2: '評価',
      3: '意見・感想',
      4: '体験・経験',
      5: 'その他'
    };
    return categoryMap[categoryId] || 'その他';
  };

  // 質問タイプIDからタイプ名を取得
  const getTypeName = (typeId) => {
    const typeMap = {
      1: '短文テキスト',
      2: '長文テキスト',
      3: '単一選択',
      4: '複数選択',
      5: '単一選択（2列）',
      6: '複数選択（2列）',
      7: '均等目盛',
      8: 'プルダウン'
    };
    return typeMap[typeId] || '不明';
  };

  // 質問タイプからチャートタイプを決定（共通処理・削除不要）
  const getChartTypeForQuestion = (questionTypeId, isRequired = true) => {
    if (questionTypeId === 1 || questionTypeId === 2) {
      return 'テキスト';
    } else if ([3, 4, 5, 6, 7, 8].includes(questionTypeId)) {
      return isRequired ? '円グラフ' : '棒グラフ';
    }
    return '棒グラフ';
  };

  // 質問タイプからアイコンを決定（共通処理・削除不要）
  const getIconForQuestion = (questionTypeId, isRequired = true) => {
    const iconMap = {
      1: <TextFields />, // 短文テキスト
      2: <TextFields />, // 長文テキスト
      3: <PieChart />,   // 単一選択
      4: <BarChart />,   // 複数選択
      5: <PieChart />,   // 単一選択（2列）
      6: <BarChart />,   // 複数選択（2列）
      7: <BarChart />,   // 均等目盛
      8: <PieChart />    // プルダウン
    };
    return iconMap[questionTypeId] || <QuizOutlined />;
  };

  // 質問タイプからアイコンカラーを決定（共通処理・削除不要）
  const getIconColorForQuestion = (questionTypeId, isRequired = true) => {
    const colorMap = {
      1: '#3b82f6', // 短文テキスト - 青
      2: '#3b82f6', // 長文テキスト - 青
      3: '#10b981', // 単一選択 - 緑
      4: '#f59e0b', // 複数選択 - オレンジ
      5: '#10b981', // 単一選択（2列）- 緑
      6: '#f59e0b', // 複数選択（2列）- オレンジ
      7: '#8b5cf6', // 均等目盛 - 紫
      8: '#06b6d4'  // プルダウン - シアン
    };
    return colorMap[questionTypeId] || '#6b7280';
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
        minWidth: 280,
        maxWidth: 280,
        flexShrink: 0,
        bgcolor: '#ffffff',
        borderRadius: 2,
        border: '1px solid #e5e7eb',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}
    >
      {/* ヘッダー */}
      <Box sx={{ p: 1.5, borderBottom: '1px solid #e5e7eb' }}>
        {currentView === 'questions' && (
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Button
              onClick={handleBackToForms}
              sx={{ 
                minWidth: 'auto', 
                p: 0.5, 
                mr: 1,
                color: '#6366f1'
              }}
            >
              <ArrowBack sx={{ fontSize: 18 }} />
            </Button>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#374151' }}>
              {selectedForm?.title}
            </Typography>
          </Box>
        )}
        
        {/* 検索 */}
        <TextField
          fullWidth
          size="small"
          placeholder={currentView === 'forms' ? 'フォームを検索...' : '質問を検索...'}
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

      {/* フォーム一覧 / 質問一覧 */}
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

          {/* フォーム一覧表示 */}
          {!loading && !error && currentView === 'forms' && filteredForms.map((form, index) => (
            <motion.div
              key={form.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card
                onClick={() => handleFormSelect(form)}
                sx={{
                  mb: 1,
                  p: 1.5,
                  cursor: 'pointer',
                  border: '2px solid transparent',
                  borderRadius: 1.5,
                  bgcolor: '#ffffff',
                  '&:hover': {
                    bgcolor: '#f8fafc',
                    border: '2px solid #e2e8f0',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FolderOutlined sx={{ color: '#6366f1', fontSize: 18 }} />
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: 600, 
                        color: '#1f2937',
                        fontSize: '0.85rem',
                        lineHeight: 1.2,
                        mb: 0.5
                      }}
                    >
                      {form.title}
                    </Typography>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: '#6b7280',
                        fontSize: '0.75rem'
                      }}
                    >
                      {form.question_count ? `${form.question_count}問` : '作成日: ' + new Date(form.created_at).toLocaleDateString('ja-JP')}
                    </Typography>
                  </Box>
                </Box>
              </Card>
            </motion.div>
          ))}

          {/* 質問一覧表示 */}
          {!loading && !error && currentView === 'questions' && filteredQuestions.map((question, index) => {
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
                    border: `2px solid ${isSelected ? (question.iconColor || question.categoryColor || categoryColors[question.category] || '#6B7280') : 'transparent'}`,
                    outline: !isSelected ? '1px solid #e5e7eb' : 'none',
                    bgcolor: '#ffffff',
                    boxShadow: isSelected ? `0 4px 16px ${question.iconColor || question.categoryColor || categoryColors[question.category] || '#6B7280'}40` : '0 1px 3px rgba(0, 0, 0, 0.05)',
                    transition: 'all 0.2s ease',
                    '&:hover': canSelect ? {
                      boxShadow: `0 4px 12px ${question.iconColor || question.categoryColor || categoryColors[question.category] || '#6B7280'}40`,
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
                        bgcolor: `${question.iconColor || question.categoryColor || categoryColors[question.category] || '#6B7280'}20`,
                        color: question.iconColor || question.categoryColor || categoryColors[question.category] || '#6B7280',
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
                            bgcolor: `${question.categoryColor || categoryColors[question.category] || '#6B7280'}20`,
                            color: question.categoryColor || categoryColors[question.category] || '#6B7280',
                            '& .MuiChip-label': { px: 0.75 }
                          }}
                        />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Typography
                            variant="caption"
                            sx={{
                              fontSize: '0.65rem',
                              color: '#64748b',
                              fontWeight: 500
                            }}
                          >
                            回答数
                          </Typography>
                          <Badge
                            badgeContent={question.responseCount > 999 ? '999+' : question.responseCount}
                            color="default"
                            max={999}
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

          {/* 空の状態メッセージ */}
          {!loading && !error && currentView === 'forms' && filteredForms.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4, color: '#9ca3af' }}>
              <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                {searchTerm ? 'フォームが見つかりません' : 'レビューフォームがありません'}
              </Typography>
            </Box>
          )}

          {!loading && !error && currentView === 'questions' && filteredQuestions.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4, color: '#9ca3af' }}>
              <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                {searchTerm ? '質問が見つかりません' : 'このフォームに質問がありません'}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}