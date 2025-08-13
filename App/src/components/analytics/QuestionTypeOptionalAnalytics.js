import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Alert,
  CircularProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import { FilterList, TrendingUp, BarChart } from '@mui/icons-material';
import LineChartWithFilter from './LineChartWithFilter';
import VerticalBarChart from './VerticalBarChart';
import FilterPanel from './FilterPanel';
import { applyCombinedFilters } from '../../utils/dataFilterUtils';
import { supabase } from '../../supabaseClient';
import { getDatabaseConfig } from '../../config/databaseConfig';

const QuestionTypeOptionalAnalytics = ({ questionData, questionId, activeFilters, setActiveFilters, isTestMode }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lineChartData, setLineChartData] = useState([]);
  const [barChartData, setBarChartData] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [allResponses, setAllResponses] = useState([]);
  const [filteredResponses, setFilteredResponses] = useState([]);

  useEffect(() => {
    const processQuestionData = async () => {
      try {
        setLoading(true);
        
        console.log('QuestionTypeOptionalAnalytics - 受信データ:', { questionData, questionId });
        
        if (!questionData || !questionId) {
          console.error('データまたはIDが不足:', { questionData, questionId });
          setError('質問データが見つかりません');
          return;
        }

        const question = questionData.find(q => q.id === questionId);
        console.log('見つかった質問:', question);
        
        if (!question) {
          setError('指定された質問が見つかりません');
          return;
        }

        // 質問タイプの取得
        const questionType = question.typeId || question.question_types_id || question.type_id;
        let questionTypeNum = typeof questionType === 'string' ? parseInt(questionType) : questionType;
        
        console.log('判定された質問タイプ:', questionTypeNum);
        
        // 質問タイプのチェック
        if (![3, 4, 5, 6, 7, 8].includes(questionTypeNum)) {
          console.warn('質問タイプが対象外 - デフォルトタイプで継続:', questionTypeNum);
          questionTypeNum = 3; // デフォルト設定
        }

        // 質問タイプ4,5,6用のコンポーネント（折れ線グラフ + 縦棒グラフ）
        console.log('質問タイプ4,5,6用コンポーネントで処理開始');

        // 実際のデータベースから回答データを取得
        let responses;
        try {
          const realResponses = await fetchQuestionResponses(question.id, questionTypeNum, isTestMode);
          if (realResponses && realResponses.length > 0) {
            responses = realResponses;
            console.log('データベースから回答データを取得:', responses.length, '件');
          } else if (Array.isArray(question.responses)) {
            responses = question.responses;
            console.log('既存の回答データを使用:', responses.length, '件');
          } else {
            responses = generateSampleResponses(questionTypeNum);
            console.log('サンプルデータを生成:', responses.length, '件');
          }
        } catch (responseError) {
          console.error('回答データ取得エラー:', responseError);
          responses = generateSampleResponses(questionTypeNum);
          console.log('エラー時サンプルデータを生成:', responses.length, '件');
        }
        
        // デバッグ：生成されたresponses データを確認
        console.log('最終的なresponses データ:', responses);
        
        // 実際のデータベースから選択肢データを取得
        try {
          const realChoices = await fetchQuestionChoices(question.id, questionTypeNum, isTestMode);
          if (realChoices && realChoices.length > 0) {
            question.data = {
              labels: realChoices
            };
            question.options = realChoices.map(choice => ({
              label: choice,
              value: choice
            }));
            console.log('データベースから選択肢データを取得:', realChoices);
          } else {
            const choices = getChoicesForQuestionType(questionTypeNum);
            question.data = {
              labels: choices
            };
            question.options = choices.map(choice => ({
              label: choice,
              value: choice
            }));
            console.log('サンプル選択肢データを使用:', choices);
          }
        } catch (choiceError) {
          console.error('選択肢データ取得エラー:', choiceError);
          const choices = getChoicesForQuestionType(questionTypeNum);
          question.data = {
            labels: choices
          };
          question.options = choices.map(choice => ({
            label: choice,
            value: choice
          }));
          console.log('エラー時サンプル選択肢データを使用:', choices);
        }
        
        setAllResponses(responses);
        setError(null);
      } catch (err) {
        console.error('データ処理エラー:', err);
        setError('データの処理中にエラーが発生しました');
      } finally {
        setLoading(false);
      }
    };

    processQuestionData();
  }, [questionData, questionId]);

  // フィルター適用の処理
  useEffect(() => {
    if (allResponses.length > 0) {
      const currentQuestion = questionData?.find(q => q.id === questionId);
      if (currentQuestion) {
        const filtered = applyCombinedFilters([currentQuestion], { responses: allResponses }, activeFilters || {}, isTestMode);
        const filteredResponseData = filtered.responses || allResponses;
        
        setFilteredResponses(filteredResponseData);
        
        const lineData = generateLineChartData(filteredResponseData);
        console.log('フィルター適用後折れ線グラフデータ:', lineData);
        setLineChartData(lineData);
        
        const barData = generateBarChartData(filteredResponseData, currentQuestion, currentQuestion.typeId || currentQuestion.question_types_id || currentQuestion.type_id);
        console.log('フィルター適用後棒グラフデータ:', barData);
        console.log('棒グラフ用responses データ:', filteredResponseData);
        setBarChartData(barData);
      }
    }
  }, [allResponses, activeFilters, questionData, questionId, isTestMode]);

  // 実際のデータベースから選択肢データを取得
  const fetchQuestionChoices = async (questionId, questionTypeNum, isTestMode) => {
    try {
      const config = getDatabaseConfig(isTestMode);
      
      // 線形スケール（質問タイプ5）の場合
      if (questionTypeNum === 5) {
        const { data: scaleData, error: scaleError } = await supabase
          .from(config.QUESTION_OPTION_LINEAR_SCALE)
          .select('min_text, max_text')
          .eq('review_questions_id', questionId)
          .single();
          
        if (scaleError) {
          console.warn('線形スケールデータ取得エラー:', scaleError);
          return null;
        }
        
        if (scaleData) {
          return ['1', '2', '3', '4', '5'];
        }
      }
      
      // その他の選択肢系の場合
      const { data: choicesData, error: choicesError } = await supabase
        .from(config.QUESTION_OPTION_CHOICES)
        .select('choice_name, choice_number')
        .eq('review_questions_id', questionId)
        .order('choice_number', { ascending: true });
        
      if (choicesError) {
        console.warn('選択肢データ取得エラー:', choicesError);
        return null;
      }
      
      if (choicesData && choicesData.length > 0) {
        return choicesData.map(choice => choice.choice_name);
      }
      
      return null;
    } catch (error) {
      console.error('選択肢取得関数エラー:', error);
      return null;
    }
  };

  // 実際のデータベースから回答データを取得
  const fetchQuestionResponses = async (questionId, questionTypeNum, isTestMode) => {
    try {
      const config = getDatabaseConfig(isTestMode);
      console.log(`質問タイプ${questionTypeNum}の回答データ取得開始 - 質問ID: ${questionId}`);
      console.log('使用するデータベース設定:', config);
      
      // 線形スケール（質問タイプ5）の場合
      if (questionTypeNum === 5) {
        console.log('線形スケール（質問タイプ5）の処理開始');
        console.log('取得テーブル:', config.QUESTION_ANSWER_OPTION_LINEAR_SCALE);
        console.log('JOINテーブル:', config.REVIEW_QUESTION_ANSWERS);
        
        const { data: scaleAnswers, error: scaleError } = await supabase
          .from(config.QUESTION_ANSWER_OPTION_LINEAR_SCALE)
          .select(`
            answer_number,
            review_question_answers_id,
            ${config.REVIEW_QUESTION_ANSWERS}!inner(
              created_at,
              review_questions_id
            )
          `)
          .eq(`${config.REVIEW_QUESTION_ANSWERS}.review_questions_id`, questionId);
          
        console.log('線形スケール回答取得結果:', { data: scaleAnswers, error: scaleError });
        
        if (scaleError) {
          console.error('線形スケール回答取得エラー:', scaleError);
          return null;
        }
        
        if (scaleAnswers && scaleAnswers.length > 0) {
          const formattedAnswers = scaleAnswers.map(answer => ({
            id: answer.review_question_answers_id,
            created_at: answer[config.REVIEW_QUESTION_ANSWERS].created_at,
            answer: answer.answer_number?.toString() || '未回答'
          }));
          console.log('フォーマット済み線形スケール回答:', formattedAnswers);
          return formattedAnswers;
        } else {
          console.log('線形スケール回答データなし');
        }
      }
      
      // その他の選択肢系の場合
      console.log(`選択肢系（質問タイプ${questionTypeNum}）の処理開始`);
      console.log('取得テーブル:', config.QUESTION_ANSWER_OPTION_CHOICES);
      
      const { data: choiceAnswers, error: choiceError } = await supabase
        .from(config.QUESTION_ANSWER_OPTION_CHOICES)
        .select(`
          question_option_choices_id,
          review_question_answers_id,
          ${config.REVIEW_QUESTION_ANSWERS}!inner(
            created_at,
            review_questions_id
          )
        `)
        .eq(`${config.REVIEW_QUESTION_ANSWERS}.review_questions_id`, questionId);
        
      console.log('選択肢回答取得結果:', { data: choiceAnswers, error: choiceError });
      
      if (choiceError) {
        console.error('選択肢回答取得エラー:', choiceError);
        return null;
      }
      
      if (choiceAnswers && choiceAnswers.length > 0) {
        // 選択肢IDから選択肢名を取得
        const choiceIds = choiceAnswers.map(answer => answer.question_option_choices_id).filter(Boolean);
        console.log('選択肢IDリスト:', choiceIds);
        
        const { data: choiceNames } = await supabase
          .from(config.QUESTION_OPTION_CHOICES)
          .select('id, choice_name')
          .in('id', choiceIds);
        
        console.log('取得した選択肢名:', choiceNames);
        
        const choiceMap = {};
        if (choiceNames) {
          choiceNames.forEach(choice => {
            choiceMap[choice.id] = choice.choice_name;
          });
        }
        
        const formattedChoiceAnswers = choiceAnswers.map(answer => ({
          id: answer.review_question_answers_id,
          created_at: answer[config.REVIEW_QUESTION_ANSWERS].created_at,
          answer: choiceMap[answer.question_option_choices_id] || '未回答'
        }));
        
        console.log('フォーマット済み選択肢回答:', formattedChoiceAnswers);
        return formattedChoiceAnswers;
      } else {
        console.log('選択肢回答データなし');
      }
      
      console.log('回答データの取得処理終了 - 返却値: null');
      return null;
    } catch (error) {
      console.error('回答取得関数エラー:', error);
      return null;
    }
  };

  const generateSampleResponses = (questionTypeNum) => {
    const sampleData = [];
    const choices = getChoicesForQuestionType(questionTypeNum);
    
    // 過去30日間のサンプルデータを生成
    for (let i = 0; i < 120; i++) {
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 30));
      
      sampleData.push({
        id: `sample_${i}`,
        created_at: date.toISOString(),
        answer: choices[Math.floor(Math.random() * choices.length)]
      });
    }
    
    return sampleData;
  };

  const getChoicesForQuestionType = (questionTypeNum) => {
    const choiceMap = {
      3: ['選択肢A', '選択肢B', '選択肢C', '選択肢D'],
      4: ['オプション1', 'オプション2', 'オプション3'],
      5: ['1', '2', '3', '4', '5'],
      6: ['とても良い', '良い', '普通', '悪い', 'とても悪い'],
      7: ['カテゴリA', 'カテゴリB', 'カテゴリC'],
      8: ['項目1', '項目2', '項目3', '項目4']
    };
    return choiceMap[questionTypeNum] || ['回答1', '回答2', '回答3'];
  };

  const generateLineChartData = (responses) => {
    const dailyData = {};
    
    // 各日付と回答選択肢の組み合わせでカウント
    responses.forEach(response => {
      const date = response.created_at ? 
        new Date(response.created_at).toISOString().split('T')[0] : 
        new Date().toISOString().split('T')[0];
      const answer = response.answer || '未回答';
      
      if (!dailyData[date]) {
        dailyData[date] = { date };
      }
      
      if (!dailyData[date][answer]) {
        dailyData[date][answer] = 0;
      }
      dailyData[date][answer] += 1;
    });

    // 過去30日間のデータを生成
    const last30Days = [];
    const allAnswers = [...new Set(responses.map(r => r.answer || '未回答'))];
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayData = { date: dateStr };
      
      // すべての回答選択肢に対してデータを設定
      allAnswers.forEach(answer => {
        dayData[answer] = dailyData[dateStr]?.[answer] || 0;
      });
      
      last30Days.push(dayData);
    }
    
    return last30Days;
  };

  const generateBarChartData = (responses, question, questionTypeNum) => {
    const answerCounts = {};
    
    responses.forEach(response => {
      const answer = response.answer || '未回答';
      answerCounts[answer] = (answerCounts[answer] || 0) + 1;
    });

    return Object.entries(answerCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value); // 回答数の多い順にソート
  };

  if (loading) {
    return (
      <Box sx={{ p: 4, height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress size={40} sx={{ color: '#5e17eb' }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      </Box>
    );
  }

  const currentQuestion = questionData?.find(q => q.id === questionId);

  return (
    <Box sx={{ p: 2 }}>
      {/* ヘッダー */}
      <Box sx={{ mb: 3 }}>
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
          <TrendingUp sx={{ color: '#5e17eb' }} />
          回答数推移
        </Typography>
      </Box>

      {/* フィルターパネル */}
      {currentQuestion && (
        <FilterPanel
          selectedQuestions={[currentQuestion]}
          activeFilters={activeFilters || {}}
          setActiveFilters={setActiveFilters || (() => {})}
          showFilters={showFilters}
          setShowFilters={setShowFilters}
        />
      )}

      {/* 折れ線グラフ */}
      <Box sx={{ mb: 4 }}>
        <LineChartWithFilter 
          data={lineChartData}
          title="回答数推移"
        />
      </Box>

      {/* 棒グラフ */}
      <Box sx={{ mb: 2 }}>
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
          <BarChart sx={{ color: '#5e17eb' }} />
          選択肢別回答数
        </Typography>
        
        {barChartData ? (
          <VerticalBarChart 
            data={barChartData}
          />
        ) : (
          <Box sx={{ 
            height: 400, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: 'text.secondary'
          }}>
            <Typography variant="body1">
              データを読み込み中...
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default QuestionTypeOptionalAnalytics;