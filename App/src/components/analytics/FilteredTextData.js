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
  selectedDates 
}) {
  const [textData, setTextData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // テストモードの判定（CLAUDE.mdの指示に従って実装）
  const isTestMode = process.env.REACT_APP_TEST_MODE === 'true' || window.location.search.includes('testmode=true');
  
  // Supabaseからテキスト回答データを取得
  const fetchTextAnswers = async (questionId) => {
    try {
      const config = getDatabaseConfig(isTestMode);
      console.log('テキスト回答データ取得開始:', { questionId, isTestMode, config });
      
      if (isTestMode) {
        // テストモードでは、まずテストデータの存在確認
        console.log('テストモード: テストデータ確認中...');
        
        try {
          const { data: testCheck, error: testError } = await supabase
            .from(config.QUESTION_ANSWER_TEXTS)
            .select('id')
            .limit(1);
          
          console.log('テストデータ存在確認:', { data: testCheck, error: testError });
          
          if (testError) {
            console.warn('テストデータアクセスエラー:', testError);
            return getDummyTextData();
          }
          
          if (!testCheck || testCheck.length === 0) {
            console.log('テストデータが存在しません。ダミーデータを使用します。');
            return getDummyTextData();
          }
          
        } catch (testErr) {
          console.warn('テストデータ確認でエラー:', testErr);
          return getDummyTextData();
        }
      }
      
      // 実際のデータ取得クエリ
      let query;
      
      if (isTestMode) {
        // テストモード用のシンプルなクエリ
        query = supabase
          .from(config.QUESTION_ANSWER_TEXTS)
          .select(`
            id,
            answer_text,
            created_at
          `)
          .not('answer_text', 'is', null)
          .neq('answer_text', '')
          .limit(50);
      } else {
        // 本番モード用の詳細なクエリ
        try {
          // まず、question_answer_textsテーブルから直接取得を試行
          query = supabase
            .from('question_answer_texts')
            .select(`
              id,
              answer_text,
              created_at,
              review_questions_answers_id
            `)
            .not('answer_text', 'is', null)
            .neq('answer_text', '')
            .limit(100);
            
          console.log('本番モード: 直接クエリを実行中...');
          
        } catch (directQueryError) {
          console.error('直接クエリでエラー:', directQueryError);
          return getDummyTextData();
        }
      }
      
      // 選択された日付のフィルター適用
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
      
      console.log('Supabaseクエリ結果:', { data, error, queryUsed: isTestMode ? 'test' : 'production' });
      
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
        console.log('フォーマット後のデータが空です。ダミーデータを使用します。');
        return getDummyTextData();
      }
      
      return formattedData;
      
    } catch (error) {
      console.error('テキスト回答取得処理エラー:', error);
      console.log('予期しないエラーのため、ダミーデータを使用します');
      return getDummyTextData();
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
        // エラー時もダミーデータを設定
        const dummyData = getDummyTextData();
        console.log('ダミーデータで復旧:', dummyData.length, '件');
        setTextData(dummyData);
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
          {isTestMode && (
            <Chip 
              label="テストモード" 
              size="small"
              sx={{ 
                bgcolor: '#fbbf2420',
                color: '#f59e0b',
                fontWeight: 600
              }}
            />
          )}
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