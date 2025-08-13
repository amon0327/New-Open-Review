import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress
} from '@mui/material';
import {
  DateRange,
  Psychology
} from '@mui/icons-material';
import MultiDateCalendar from './MultiDateCalendar';
import FilteredTextData from './FilteredTextData';
import { supabase } from '../../lib/supabase';

// メインのテキスト質問チャートコンポーネント
export default function TextQuestionChart({ 
  question, 
  secondQuestion = null,
  activeFilters, 
  setActiveFilters,
  isTestMode: propIsTestMode
}) {
  const [selectedDates, setSelectedDates] = useState([]);
  const [mainQuestion, setMainQuestion] = useState(question);
  const [reviewDates, setReviewDates] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // テストモードの判定（propsから受け取る場合はそれを優先）
  const isTestMode = propIsTestMode !== undefined ? propIsTestMode : 
    (process.env.REACT_APP_TEST_MODE === 'true' || window.location.search.includes('testmode=true'));
  
  // レビュー日付を取得
  useEffect(() => {
    const fetchReviewDates = async () => {
      try {
        setLoading(true);
        
        if (isTestMode) {
          // テストモード：ダミーデータを使用
          const dummyDates = [
            "2024-12-15",
            "2024-12-14", 
            "2024-12-13",
            "2024-12-12",
            "2024-12-11",
            "2024-12-10",
            "2024-12-09"
          ];
          setReviewDates(dummyDates);
        } else {
          // 本番モード：実際のデータを取得
          console.log('本番モード: レビュー日付取得開始');
          
          if (!question?.id) {
            console.warn('質問IDが不明のため、レビュー日付を取得できません');
            setReviewDates([]);
            return;
          }

          // review_question_answersからcreated_atを取得
          const { data: answers, error: answersError } = await supabase
            .from('review_question_answers')
            .select('created_at')
            .eq('review_questions_id', question.id)
            .order('created_at', { ascending: false });

          console.log('本番レビュー日付取得結果:', { data: answers, error: answersError });

          if (answersError) {
            console.error('本番レビュー日付取得エラー:', answersError);
            setReviewDates([]);
          } else if (answers && answers.length > 0) {
            // 日付のみを抽出し、重複を削除
            const uniqueDates = [...new Set(
              answers.map(answer => 
                new Date(answer.created_at).toISOString().split('T')[0]
              )
            )];
            console.log('取得された一意の日付:', uniqueDates);
            setReviewDates(uniqueDates);
          } else {
            console.warn('本番モード: 回答データが見つかりません');
            setReviewDates([]);
          }
        }
      } catch (error) {
        console.error('レビュー日付取得エラー:', error);
        // エラー時はダミーデータ
        setReviewDates([
          "2024-12-15",
          "2024-12-14", 
          "2024-12-13",
          "2024-12-12",
          "2024-12-11"
        ]);
      } finally {
        setLoading(false);
      }
    };
    
    if (question?.id) {
      fetchReviewDates();
    }
  }, [question?.id, isTestMode]);
  
  return (
    <Box sx={{ p: 2, pb: '100px' }}>
      {/* メイン分析質問の選択（2つのテキスト質問が選択されている場合のみ表示） */}
      {secondQuestion && (
        <Box sx={{ mb: 4 }}>
          <Typography 
            variant="h6" 
            sx={{ 
              mb: 2, 
              fontWeight: 700, 
              color: '#1e293b',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            <Psychology sx={{ color: '#6366f1' }} />
            メイン分析質問
          </Typography>
          <FormControl 
            fullWidth 
            sx={{ 
              bgcolor: '#ffffff',
              borderRadius: 1,
              border: '1px solid #e2e8f0'
            }}
          >
            <InputLabel 
              sx={{ 
                color: '#64748b',
                fontWeight: 500,
                '&.Mui-focused': { color: '#6366f1' }
              }}
            >
              分析の中心となる質問を選択
            </InputLabel>
            <Select
              value={mainQuestion.id}
              onChange={(e) => {
                const selectedId = e.target.value;
                setMainQuestion(selectedId === question.id ? question : secondQuestion);
              }}
              label="分析の中心となる質問を選択"
              sx={{
                borderRadius: 1,
                '& .MuiOutlinedInput-notchedOutline': {
                  border: 'none'
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  border: 'none'
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  border: '2px solid #6366f1'
                }
              }}
            >
              <MenuItem value={question.id}>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {question.title}
                </Typography>
              </MenuItem>
              <MenuItem value={secondQuestion.id}>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {secondQuestion.title}
                </Typography>
              </MenuItem>
            </Select>
          </FormControl>
        </Box>
      )}

      {/* カレンダーセクション */}
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h6" 
          sx={{ 
            mb: 2, 
            fontWeight: 700, 
            color: '#1e293b',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          <DateRange sx={{ color: '#6366f1' }} />
          日付選択
        </Typography>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={30} />
          </Box>
        ) : (
          <MultiDateCalendar 
            selectedDates={selectedDates}
            onDatesChange={setSelectedDates}
            reviewDates={reviewDates}
          />
        )}
      </Box>
      
      {/* フィルター済みテキストデータ */}
      <FilteredTextData 
        question={mainQuestion}
        secondQuestion={secondQuestion}
        activeFilters={activeFilters}
        selectedDates={selectedDates}
        isTestMode={isTestMode}
      />
    </Box>
  );
}