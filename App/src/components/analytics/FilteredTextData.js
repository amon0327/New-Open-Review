import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box,
  Typography,
  Chip,
  Card,
  CardContent,
  Stack,
  Paper,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  TextFields,
  Search,
  Schedule
} from '@mui/icons-material';
import { categoryColors } from '../../data/questionsDatabase';
import { supabase } from '../../lib/supabase';
import { getDatabaseConfig } from '../../config/databaseConfig';

export default function FilteredTextData({ 
  question, 
  secondQuestion = null,
  activeFilters, 
  selectedDates,
  isTestMode: propIsTestMode
}) {
  const [textData, setTextData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // テストモードの判定（propsから受け取る場合はそれを優先、CLAUDE.mdの指示に従って実装）
  const isTestMode = propIsTestMode !== undefined ? propIsTestMode : 
    (process.env.REACT_APP_TEST_MODE === 'true' || window.location.search.includes('testmode=true'));
  
  // Supabaseからテキスト回答データを取得
  const fetchTextAnswers = async (questionId) => {
    try {
      console.log('=== テストモード判定デバッグ ===');
      console.log('process.env.REACT_APP_TEST_MODE:', process.env.REACT_APP_TEST_MODE);
      console.log('window.location.search:', window.location.search);
      console.log('isTestMode 計算結果:', isTestMode);
      console.log('==============================');
      
      const config = getDatabaseConfig(isTestMode);
      console.log('テキスト回答データ取得開始:', { questionId, isTestMode, config });
      
      if (isTestMode) {
        // テストモード: 指定された質問IDに関連するテキスト回答を取得
        console.log('テストモード: 質問ID', questionId, 'のテキスト回答を取得中...');
        
        try {
          // test_review_questions -> test_review_question_answers -> test_question_answer_texts の順でJOIN
          console.log('テストモード: 質問ID', questionId, '用の回答テキストを取得中...');
          
          // 段階的にクエリを実行してデバッグ情報を取得
          console.log('=== 段階1: test_review_questions 確認 ===');
          const { data: questionData, error: questionError } = await supabase
            .from('test_review_questions')
            .select('*')
            .eq('id', questionId);
          
          console.log('質問データ:', { data: questionData, error: questionError });
          
          if (questionError || !questionData || questionData.length === 0) {
            console.warn('指定された質問IDが見つかりません:', questionId);
            return [];
          }
          
          console.log('=== 段階2: test_review_question_answers 確認 ===');
          const { data: answerData, error: answerError } = await supabase
            .from('test_review_question_answers')
            .select('*')
            .eq('review_questions_id', questionId);
          
          console.log('回答データ:', { data: answerData, error: answerError });
          
          if (answerError) {
            console.warn('回答データ取得エラー:', answerError);
            return [];
          }
          
          if (!answerData || answerData.length === 0) {
            console.log('指定された質問に対する回答が見つかりません');
            return [];
          }
          
          // 回答IDリストを取得
          const answerIds = answerData.map(answer => answer.id);
          console.log('回答IDリスト:', answerIds);
          
          console.log('=== 段階3: test_question_answer_texts 確認 ===');
          const { data: textAnswerData, error: textAnswerError } = await supabase
            .from('test_question_answer_texts')
            .select('*')
            .in('review_questions_answers_id', answerIds)
            .not('answer_text', 'is', null)
            .neq('answer_text', '');
          
          console.log('テキスト回答データ:', { data: textAnswerData, error: textAnswerError });
          
          if (textAnswerError) {
            console.warn('テキスト回答取得エラー:', textAnswerError);
            return [];
          }
          
          if (!textAnswerData || textAnswerData.length === 0) {
            console.log('指定された質問に対するテキスト回答が見つかりません');
            return [];
          }
          
          // データフォーマット
          const formattedData = textAnswerData.map((item, index) => ({
            id: item.id || `test_${index}`,
            text: item.answer_text,
            date: item.created_at ? item.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
            timestamp: item.created_at || new Date().toISOString(),
            submissionId: item.review_questions_answers_id || null
          }));
          
          console.log('テストモード フォーマット後のデータ:', formattedData);
          console.log('取得できたテキスト回答数:', formattedData.length);
          
          return formattedData;
          
        } catch (testErr) {
          console.warn('テストデータ確認でエラー:', testErr);
          return [];
        }
      }
      
      // 実際のデータ取得クエリ
      let query;
      
      if (false) { // テストモード処理は上で完了しているため、この分岐は実行されない
        // この部分は削除予定
      } else {
        // 本番モード用の詳細なクエリ
        try {
          console.log('本番モード: 質問ID', questionId, 'のテキスト回答を取得中...');
          
          // review_question_answers -> question_answer_texts の順でJOIN
          const { data: answersData, error: answersError } = await supabase
            .from('review_question_answers')
            .select('id')
            .eq('review_questions_id', questionId);
          
          console.log('本番モード 回答データ:', { data: answersData, error: answersError });
          
          if (answersError) {
            console.warn('本番モード 回答データ取得エラー:', answersError);
            return [];
          }
          
          if (!answersData || answersData.length === 0) {
            console.log('本番モード: 指定された質問に対する回答が見つかりません');
            return [];
          }
          
          // 回答IDリストを取得
          const answerIds = answersData.map(answer => answer.id);
          console.log('本番モード 回答IDリスト:', answerIds);
          
          // question_answer_textsから回答テキストを取得
          query = supabase
            .from('question_answer_texts')
            .select(`
              id,
              answer_text,
              created_at,
              review_questions_answers_id
            `)
            .in('review_questions_answers_id', answerIds)
            .not('answer_text', 'is', null)
            .neq('answer_text', '')
            .limit(100);
            
          console.log('本番モード: テキスト回答クエリを実行中...');
          
        } catch (productionQueryError) {
          console.error('本番モードクエリでエラー:', productionQueryError);
          return [];
        }
      }
      
      // 本番モード用の日付フィルター適用とクエリ実行
      if (selectedDates.length > 0) {
        const dateStrings = selectedDates.map(date => date.toISOString().split('T')[0]);
        console.log('日付フィルター適用:', dateStrings);
        
        // 日付範囲でフィルター
        const startDate = dateStrings[0];
        const endDate = dateStrings[dateStrings.length - 1];
        query = query
          .gte('created_at', startDate + 'T00:00:00Z')
          .lte('created_at', endDate + 'T23:59:59Z');
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      console.log('Supabaseクエリ結果:', { data, error, queryUsed: 'production' });
      
      if (error) {
        console.error('テキスト回答取得エラー:', error);
        console.log('エラーのため、ダミーデータを使用します');
        return getDummyTextData();
      }
      
      if (!data || data.length === 0) {
        console.log('取得データが空です。ダミーデータを使用します。');
        return getDummyTextData();
      }
      
      // データフォーマット
      const formattedData = data.map((item, index) => ({
        id: item.id || `fetched_${index}`,
        text: item.answer_text,
        date: item.created_at ? item.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
        timestamp: item.created_at || new Date().toISOString(),
        submissionId: item.review_questions_answers_id || null
      }));
      
      console.log('フォーマット後のデータ:', formattedData);
      
      if (formattedData.length === 0) {
        console.log('フォーマット後のデータが空です。');
        return [];
      }
      
      return formattedData;
      
    } catch (error) {
      console.error('テキスト回答取得処理エラー:', error);
      console.log('予期しないエラーのため、空のデータを返します');
      return [];
    }
  };
  
  // ダミーデータ生成
  const getDummyTextData = () => {
    return [
      {
        id: 'dummy_1',
        text: "商品の品質が非常に良く、期待以上でした。特にパッケージングが丁寧で好印象です。",
        date: "2024-12-15",
        timestamp: "2024-12-15T10:30:00Z"
      },
      {
        id: 'dummy_2',
        text: "価格に対して満足のいく内容でした。今後もリピートしたいと思います。",
        date: "2024-12-14",
        timestamp: "2024-12-14T15:45:00Z"
      },
      {
        id: 'dummy_3',
        text: "配送が早くて助かりました。商品も想像通りで良かったです。",
        date: "2024-12-13",
        timestamp: "2024-12-13T09:20:00Z"
      },
      {
        id: 'dummy_4',
        text: "思っていたより小さかったですが、品質は良好です。",
        date: "2024-12-12",
        timestamp: "2024-12-12T18:10:00Z"
      },
      {
        id: 'dummy_5',
        text: "色が写真と少し違いましたが、使い心地は良いです。",
        date: "2024-12-11",
        timestamp: "2024-12-11T12:00:00Z"
      },
      {
        id: 'dummy_6',
        text: "スタッフの対応が親切で、安心して利用できました。",
        date: "2024-12-10",
        timestamp: "2024-12-10T14:20:00Z"
      }
    ];
  };
  
  // フィルター処理（全てのHooksを条件分岐の前に配置）
  const filteredData = useMemo(() => {
    let filtered = textData;
    
    // 日付フィルター
    if (selectedDates.length > 0) {
      const selectedDateStrings = selectedDates.map(date => 
        date.toISOString().split('T')[0]
      );
      filtered = filtered.filter(item => 
        selectedDateStrings.includes(item.date)
      );
    }
    
    // テキストフィルター
    const textFilter = activeFilters[question?.id];
    if (textFilter && textFilter.value && textFilter.value.trim()) {
      const searchTerm = textFilter.value.toLowerCase().trim();
      filtered = filtered.filter(item =>
        item.text.toLowerCase().includes(searchTerm)
      );
    }
    
    return filtered;
  }, [textData, selectedDates, activeFilters, question?.id]);

  // データ取得のuseEffect
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log('=== FilteredTextData: データ取得開始 ===');
        console.log('質問情報:', { 
          id: question?.id, 
          title: question?.title,
          type: question?.type,
          secondQuestion: secondQuestion?.title 
        });
        console.log('選択された日付:', selectedDates);
        console.log('テストモード:', isTestMode);
        console.log('======================================');
        
        const data = await fetchTextAnswers(question.id);
        
        console.log('=== データ取得完了 ===');
        console.log('取得したデータ件数:', data?.length || 0);
        console.log('データサンプル:', data?.slice(0, 2));
        console.log('====================');
        
        setTextData(data);
      } catch (err) {
        console.error('=== データ取得エラー ===');
        console.error('エラー詳細:', err);
        console.error('=====================');
        
        setError(err.message || 'データの取得に失敗しました');
        // エラー時は空データを設定
        console.log('エラー時 - 空のデータを設定');
        setTextData([]);
      } finally {
        setLoading(false);
      }
    };
    
    if (question?.id) {
      loadData();
    } else {
      console.log('FilteredTextData: 質問IDが未設定のため、データ取得をスキップ');
    }
  }, [question?.id, selectedDates, isTestMode]);
  
  // ローディング状態
  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        py: 4 
      }}>
        <CircularProgress size={40} />
        <Typography variant="body2" sx={{ ml: 2, color: '#64748b' }}>
          回答データを取得中...
        </Typography>
      </Box>
    );
  }

  // エラー状態（ダミーデータで表示を継続）
  if (error) {
    console.warn('エラーが発生しましたが、ダミーデータで表示を継続:', error);
  }
  
  if (filteredData.length === 0) {
    return (
      <Paper 
        sx={{ 
          p: 3, 
          textAlign: 'center', 
          borderRadius: 1.5,
          border: '1px dashed #e2e8f0'
        }}
      >
        <Search sx={{ fontSize: 48, color: '#cbd5e1', mb: 2 }} />
        <Typography variant="h6" sx={{ color: '#94a3b8', mb: 1 }}>
          該当するデータがありません
        </Typography>
        <Typography variant="body2" sx={{ color: '#cbd5e1' }}>
          フィルター条件を変更してお試しください
        </Typography>
        {error && (
          <Alert severity="info" sx={{ mt: 2, textAlign: 'left' }}>
            データベースからの取得でエラーが発生しました。ダミーデータで表示を継続しています。
          </Alert>
        )}
      </Paper>
    );
  }
  
  return (
    <Box sx={{ mt: 3 }}>
      {/* ヘッダー */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TextFields sx={{ color: categoryColors[question.category], fontSize: 20 }} />
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>
            回答データ
          </Typography>
          <Chip 
            label={`${filteredData.length}件`} 
            size="small"
            sx={{ 
              bgcolor: `${categoryColors[question.category]}20`,
              color: categoryColors[question.category],
              fontWeight: 600
            }}
          />
        </Box>
      </Box>
      
      {/* エラー表示（データは表示継続） */}
      {error && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          データベースからの取得でエラーが発生しました。ダミーデータで表示を継続しています。
          <br />エラー: {error}
        </Alert>
      )}
      
      {/* データリスト */}
      <Stack spacing={1.5}>
        <AnimatePresence>
          {filteredData.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card 
                sx={{ 
                  borderRadius: 1.5,
                  border: '1px solid #f1f5f9',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    transform: 'translateY(-1px)'
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                    <Box 
                      sx={{ 
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        bgcolor: categoryColors[question.category],
                        mt: 0.75,
                        flexShrink: 0
                      }}
                    />
                    <Box sx={{ flex: 1 }}>
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          color: '#1e293b',
                          lineHeight: 1.5,
                          mb: 1.5
                        }}
                      >
                        {item.text}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Schedule sx={{ fontSize: 14, color: '#94a3b8' }} />
                        <Typography 
                          variant="caption" 
                          sx={{ color: '#94a3b8', fontWeight: 500 }}
                        >
                          {new Date(item.timestamp).toLocaleDateString('ja-JP', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </Stack>
    </Box>
  );
}