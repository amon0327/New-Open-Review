import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Alert,
  CircularProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import { FilterList, BarChart, PieChart } from '@mui/icons-material';
import StackedAreaChart from './StackedAreaChart';
import PieChartWithFilter from './PieChartWithFilter';
import FilterPanel from './FilterPanel';
import { applyCombinedFilters } from '../../utils/dataFilterUtils';
import { supabase } from '../../supabaseClient';
import { getDatabaseConfig } from '../../config/databaseConfig';

const QuestionType345678Analytics = ({ questionData, questionId, activeFilters, setActiveFilters, isTestMode }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [areaChartData, setAreaChartData] = useState([]);
  const [pieChartData, setPieChartData] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [allResponses, setAllResponses] = useState([]);
  const [filteredResponses, setFilteredResponses] = useState([]);

  useEffect(() => {
    const processQuestionData = async () => {
      try {
        setLoading(true);
        
        console.log('QuestionType345678Analytics - 受信データ:', { questionData, questionId });
        
        if (!questionData || !questionId) {
          console.error('データまたはIDが不足:', { questionData, questionId });
          setError('質問データが見つかりません');
          return;
        }

        const question = questionData.find(q => q.id === questionId);
        console.log('見つかった質問:', question);
        console.log('質問の全フィールド:', Object.keys(question || {}));
        if (!question) {
          setError('指定された質問が見つかりません');
          return;
        }

        // 質問タイプの取得（複数のフィールド名に対応）
        console.log('質問タイプ判定開始');
        console.log('question.type:', question.type);
        console.log('question.typeId:', question.typeId);
        console.log('question.question_types_id:', question.question_types_id);
        console.log('question.type_id:', question.type_id);
        
        // 質問タイプの取得 - typeIdを優先し、文字列typeは無視
        const questionType = question.typeId || question.question_types_id || question.type_id;
        let questionTypeNum = typeof questionType === 'string' ? parseInt(questionType) : questionType;
        
        console.log('判定された質問タイプ:', questionTypeNum);
        console.log('対象タイプかチェック:', [3, 4, 5, 6, 7, 8].includes(questionTypeNum));
        
        // 質問タイプのチェック - 正常な場合はそのまま、異常な場合はデフォルト設定
        if (![3, 4, 5, 6, 7, 8].includes(questionTypeNum)) {
          console.warn('質問タイプが対象外 - デフォルトタイプで継続:', questionTypeNum, 'question:', question);
          // 質問タイプが無効な場合のみデフォルト設定
          questionTypeNum = 3; // デフォルトとして複数選択を設定
          console.log('デフォルト質問タイプに設定:', questionTypeNum);
        } else {
          console.log('質問タイプ確認完了:', questionTypeNum);
        }

        // 質問タイプ3,5,7,8用のコンポーネント（積み上げ面グラフ + 円グラフ）
        console.log('質問タイプ3,5,7,8用コンポーネントで処理開始');

        // サンプルデータの生成（実際のresponses データがない場合）
        console.log('元の回答データ:', question.responses, 'タイプ:', typeof question.responses);
        
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
          if (Array.isArray(question.responses)) {
            responses = question.responses;
            console.log('エラー時既存回答データを使用:', responses.length, '件');
          } else {
            responses = generateSampleResponses(questionTypeNum);
            console.log('エラー時サンプルデータを生成:', responses.length, '件');
          }
        }
        
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
            // フォールバック: サンプルデータ
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
          // エラー時はサンプルデータを使用
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
        
        // 全データを保存
        setAllResponses(responses);
        
        console.log('データ処理完了 - エラーをクリア');
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
        
        const areaData = generateAreaChartData(filteredResponseData);
        console.log('フィルター適用後エリアチャートデータ:', areaData);
        setAreaChartData(areaData);
        
        const pieData = generatePieChartData(filteredResponseData, currentQuestion, currentQuestion.typeId || currentQuestion.question_types_id || currentQuestion.type_id);
        console.log('フィルター適用後円グラフデータ:', pieData);
        setPieChartData(pieData);
      }
    }
  }, [allResponses, activeFilters, questionData, questionId, isTestMode]);

  // 実際のデータベースから選択肢データを取得
  const fetchQuestionChoices = async (questionId, questionTypeNum, isTestMode) => {
    try {
      const config = getDatabaseConfig(isTestMode);
      
      // 単一選択（2列）（質問タイプ5）の場合 - 従来の選択肢処理に戻す
      // この処理は削除し、通常の選択肢系として処理する
      
      // その他の選択肢系（質問タイプ3,4,6,7,8）の場合
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
      
      // 質問タイプ5は通常の選択肢系として処理
      
      // 選択肢系（質問タイプ3,4,5,6,8）の場合
      const { data: choiceAnswers, error: choiceError } = await supabase
        .from(config.QUESTION_ANSWER_OPTION_CHOICES)
        .select(`
          question_option_choices_id,
          review_question_answers_id,
          ${config.REVIEW_QUESTION_ANSWERS}!inner(
            created_at,
            review_questions_id
          ),
          ${config.QUESTION_OPTION_CHOICES}!inner(
            choice_name
          )
        `)
        .eq(`${config.REVIEW_QUESTION_ANSWERS}.review_questions_id`, questionId);
        
      if (choiceError) {
        console.warn('選択肢回答取得エラー:', choiceError);
        return null;
      }
      
      if (choiceAnswers && choiceAnswers.length > 0) {
        return choiceAnswers.map(answer => ({
          id: answer.review_question_answers_id,
          created_at: answer[config.REVIEW_QUESTION_ANSWERS].created_at,
          answer: answer[config.QUESTION_OPTION_CHOICES].choice_name || '未回答'
        }));
      }
      
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
    for (let i = 0; i < 150; i++) {
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
      5: ['20代', '30代', '40代', '50代', '60代以上'], // 年齢関連の選択肢
      6: ['1', '2', '3', '4', '5'],
      7: ['とても良い', '良い', '普通', '悪い', 'とても悪い'],
      8: ['カテゴリA', 'カテゴリB', 'カテゴリC']
    };
    return choiceMap[questionTypeNum] || ['回答1', '回答2', '回答3'];
  };

  const generateAreaChartData = (responses) => {
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

  const generatePieChartData = (responses, question, questionTypeNum) => {
    const answerCounts = {};
    
    responses.forEach(response => {
      const answer = response.answer || '未回答';
      answerCounts[answer] = (answerCounts[answer] || 0) + 1;
    });

    return Object.entries(answerCounts).map(([name, value]) => ({
      name,
      value,
      date: new Date().toISOString()
    }));
  };

  const getQuestionTypeLabel = (type) => {
    const typeLabels = {
      '3': '複数選択',
      '4': '単一選択',
      '5': '線形スケール',
      '6': 'テキスト（短文）',
      '7': 'テキスト（長文）',
      '8': 'プルダウン'
    };
    return typeLabels[type] || `タイプ${type}`;
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
    <Box sx={{ p: 2, pb: '100px' }}>
      {/* ヘッダー - TextQuestionChartスタイル */}
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
          <BarChart sx={{ color: '#5e17eb' }} />
          回答分布の推移（積み上げ100%）
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

      {/* 積み上げ面グラフ */}
      <Box sx={{ mb: 3 }}>
        <StackedAreaChart 
          data={areaChartData}
          title="回答分布の推移（積み上げ100%）"
        />
      </Box>

      {/* 円グラフ */}
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
          <PieChart sx={{ color: '#5e17eb' }} />
          回答内容の分布
        </Typography>
        
        <PieChartWithFilter 
          data={pieChartData}
        />
      </Box>
    </Box>
  );
};

export default QuestionType345678Analytics;