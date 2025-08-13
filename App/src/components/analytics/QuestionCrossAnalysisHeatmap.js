import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Box, 
  Typography, 
  Alert,
  CircularProgress,
  Tooltip
} from '@mui/material';
import { 
  GridView
} from '@mui/icons-material';
import { applyCombinedFilters } from '../../utils/dataFilterUtils';
import { supabase } from '../../supabaseClient';
import { getDatabaseConfig } from '../../config/databaseConfig';

const QuestionCrossAnalysisHeatmap = ({ 
  questionData, 
  selectedQuestions,
  activeFilters, 
  setActiveFilters, 
  isTestMode 
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [heatmapData, setHeatmapData] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [allResponses, setAllResponses] = useState([]);
  const [crossTabulation, setCrossTabulation] = useState({});
  const [statistics, setStatistics] = useState({});

  const [questionAChoices, setQuestionAChoices] = useState([]);
  const [questionBChoices, setQuestionBChoices] = useState([]);
  const [verticalQuestion, setVerticalQuestion] = useState(null);
  const [horizontalQuestion, setHorizontalQuestion] = useState(null);
  const [verticalChoices, setVerticalChoices] = useState([]);
  const [horizontalChoices, setHorizontalChoices] = useState([]);

  // カラーパレット
  const heatmapColors = [
    '#f8fafc', '#f1f5f9', '#e2e8f0', '#cbd5e1', '#94a3b8', 
    '#64748b', '#475569', '#334155', '#1e293b', '#0f172a'
  ];

  useEffect(() => {
    const processQuestionData = async () => {
      try {
        setLoading(true);
        
        console.log('QuestionCrossAnalysisHeatmap - 受信データ:', { questionData, selectedQuestions });
        
        if (!selectedQuestions || selectedQuestions.length !== 2) {
          console.error('2つの質問が選択されていません');
          setError('クロス分析には2つの質問を選択してください');
          return;
        }

        const [questionA, questionB] = selectedQuestions;
        
        // 両方の質問の回答データを取得
        const [responsesA, responsesB] = await Promise.all([
          fetchQuestionResponses(questionA.id, questionA.typeId || questionA.question_types_id || questionA.type_id, isTestMode),
          fetchQuestionResponses(questionB.id, questionB.typeId || questionB.question_types_id || questionB.type_id, isTestMode)
        ]);
        
        // 選択肢データを取得
        const [choicesA, choicesB] = await Promise.all([
          fetchQuestionChoices(questionA.id, questionA.typeId || questionA.question_types_id || questionA.type_id, isTestMode),
          fetchQuestionChoices(questionB.id, questionB.typeId || questionB.question_types_id || questionB.type_id, isTestMode)
        ]);

        const finalChoicesA = choicesA || getChoicesForQuestionType(questionA.typeId || questionA.question_types_id || questionA.type_id);
        const finalChoicesB = choicesB || getChoicesForQuestionType(questionB.typeId || questionB.question_types_id || questionB.type_id);
        
        setQuestionAChoices(finalChoicesA);
        setQuestionBChoices(finalChoicesB);
        
        // 選択肢が多い方を縦軸に配置
        if (finalChoicesA.length >= finalChoicesB.length) {
          setVerticalQuestion(questionA);
          setHorizontalQuestion(questionB);
          setVerticalChoices(finalChoicesA);
          setHorizontalChoices(finalChoicesB);
        } else {
          setVerticalQuestion(questionB);
          setHorizontalQuestion(questionA);
          setVerticalChoices(finalChoicesB);
          setHorizontalChoices(finalChoicesA);
        }
        
        // フォールバック: サンプルデータを生成
        const finalResponsesA = responsesA?.length > 0 ? responsesA : generateSampleResponses(questionA.typeId || questionA.question_types_id || questionA.type_id, questionA.id);
        const finalResponsesB = responsesB?.length > 0 ? responsesB : generateSampleResponses(questionB.typeId || questionB.question_types_id || questionB.type_id, questionB.id);
        
        // 回答者IDでマッチングして、両方の質問に回答した人のデータを作成
        const combinedResponses = matchResponses(finalResponsesA, finalResponsesB);
        
        console.log('マッチした回答データ:', combinedResponses.length, '件');
        setAllResponses(combinedResponses);
        setError(null);
      } catch (err) {
        console.error('データ処理エラー:', err);
        setError('データの処理中にエラーが発生しました');
      } finally {
        setLoading(false);
      }
    };

    processQuestionData();
  }, [selectedQuestions, isTestMode]);

  // フィルター適用の処理
  useEffect(() => {
    if (allResponses.length > 0 && selectedQuestions.length === 2) {
      const filtered = applyCombinedFilters(selectedQuestions, { responses: allResponses }, activeFilters || {}, isTestMode);
      const filteredResponseData = filtered.responses || allResponses;
      
      // クロス集計とヒートマップデータを生成
      const crossData = generateCrossTabulation(filteredResponseData, selectedQuestions[0], selectedQuestions[1]);
      setCrossTabulation(crossData);
      
      const heatData = generateHeatmapData(crossData, verticalChoices, horizontalChoices, verticalQuestion, horizontalQuestion);
      setHeatmapData(heatData);
      
      // 統計情報を計算
      const stats = calculateStatistics(filteredResponseData, crossData);
      setStatistics(stats);
    }
  }, [allResponses, activeFilters, selectedQuestions, verticalChoices, horizontalChoices, verticalQuestion, horizontalQuestion, isTestMode]);

  // 実際のデータベースから選択肢データを取得
  const fetchQuestionChoices = async (questionId, questionTypeNum, isTestMode) => {
    try {
      const config = getDatabaseConfig(isTestMode);
      
      // 均等目盛（質問タイプ7）の場合
      if (questionTypeNum === 7) {
        console.log('ヒートマップ - 均等目盛選択肢データ取得開始');
        const { data: scaleData, error: scaleError } = await supabase
          .from(config.QUESTION_OPTION_LINEAR_SCALE)
          .select('min_text, max_text')
          .eq('review_questions_id', questionId)
          .single();
          
        console.log('ヒートマップ - 均等目盛設定取得結果:', { data: scaleData, error: scaleError });
        
        if (!scaleError && scaleData) {
          // min_text, max_textを使った1-5スケールの選択肢を生成
          const choices = [
            `1 (${scaleData.min_text || '最小'})`,
            '2',
            '3',
            '4', 
            `5 (${scaleData.max_text || '最大'})`
          ];
          console.log('ヒートマップ - 生成された均等目盛選択肢:', choices);
          return choices;
        }
      }
      
      const { data: choicesData, error: choicesError } = await supabase
        .from(config.QUESTION_OPTION_CHOICES)
        .select('choice_name, choice_number')
        .eq('review_questions_id', questionId)
        .order('choice_number', { ascending: true });
        
      if (!choicesError && choicesData?.length > 0) {
        return choicesData.map(choice => choice.choice_name);
      }
      
      return null;
    } catch (error) {
      console.error('選択肢取得エラー:', error);
      return null;
    }
  };

  // 実際のデータベースから回答データを取得
  const fetchQuestionResponses = async (questionId, questionTypeNum, isTestMode) => {
    try {
      const config = getDatabaseConfig(isTestMode);
      
      // 均等目盛（質問タイプ7）の場合
      if (questionTypeNum === 7) {
        console.log('ヒートマップ - 均等目盛回答データ取得開始');
        const { data: scaleAnswers, error: scaleError } = await supabase
          .from(config.QUESTION_ANSWER_OPTION_LINEAR_SCALE)
          .select(`
            answer_number,
            review_question_answers_id,
            ${config.REVIEW_QUESTION_ANSWERS}!inner(
              created_at,
              review_questions_id,
              review_form_submissions_id
            )
          `)
          .eq(`${config.REVIEW_QUESTION_ANSWERS}.review_questions_id`, questionId);
          
        console.log('ヒートマップ - 均等目盛回答取得結果:', { data: scaleAnswers, error: scaleError });
        
        if (!scaleError && scaleAnswers?.length > 0) {
          // 均等目盛の設定を取得（表示用）
          const { data: scaleConfig } = await supabase
            .from(config.QUESTION_OPTION_LINEAR_SCALE)
            .select('min_text, max_text')
            .eq('review_questions_id', questionId)
            .single();
          
          // 数値を表示用文字列にマッピング
          const getDisplayValue = (answerNumber, scaleConfig) => {
            if (!answerNumber) return '未回答';
            const num = parseInt(answerNumber);
            if (scaleConfig) {
              switch (num) {
                case 1: return `1 (${scaleConfig.min_text || '最小'})`;
                case 5: return `5 (${scaleConfig.max_text || '最大'})`;
                default: return num.toString();
              }
            }
            return num.toString();
          };
          
          const formattedAnswers = scaleAnswers.map(answer => ({
            id: answer.review_question_answers_id,
            submission_id: answer[config.REVIEW_QUESTION_ANSWERS].review_form_submissions_id,
            created_at: answer[config.REVIEW_QUESTION_ANSWERS].created_at,
            answer: getDisplayValue(answer.answer_number, scaleConfig),
            question_id: questionId
          }));
          
          console.log('ヒートマップ - フォーマット済み均等目盛回答:', formattedAnswers);
          return formattedAnswers;
        }
      }
      
      const { data: choiceAnswers, error: choiceError } = await supabase
        .from(config.QUESTION_ANSWER_OPTION_CHOICES)
        .select(`
          question_option_choices_id,
          review_question_answers_id,
          ${config.REVIEW_QUESTION_ANSWERS}!inner(
            created_at,
            review_questions_id,
            review_form_submissions_id
          ),
          ${config.QUESTION_OPTION_CHOICES}!inner(
            choice_name
          )
        `)
        .eq(`${config.REVIEW_QUESTION_ANSWERS}.review_questions_id`, questionId);
        
      if (!choiceError && choiceAnswers?.length > 0) {
        return choiceAnswers.map(answer => ({
          id: answer.review_question_answers_id,
          submission_id: answer[config.REVIEW_QUESTION_ANSWERS].review_form_submissions_id,
          created_at: answer[config.REVIEW_QUESTION_ANSWERS].created_at,
          answer: answer[config.QUESTION_OPTION_CHOICES].choice_name || '未回答',
          question_id: questionId
        }));
      }
      
      return null;
    } catch (error) {
      console.error('回答取得エラー:', error);
      return null;
    }
  };

  const generateSampleResponses = (questionTypeNum, questionId) => {
    const sampleData = [];
    const choices = getChoicesForQuestionType(questionTypeNum);
    
    for (let i = 0; i < 100; i++) {
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 30));
      
      sampleData.push({
        id: `sample_${questionId}_${i}`,
        submission_id: `submission_${Math.floor(i / 2)}`, // 同じ回答者が複数質問に回答
        created_at: date.toISOString(),
        answer: choices[Math.floor(Math.random() * choices.length)],
        question_id: questionId
      });
    }
    
    return sampleData;
  };

  const getChoicesForQuestionType = (questionTypeNum) => {
    const choiceMap = {
      3: ['選択肢A', '選択肢B', '選択肢C', '選択肢D'],
      4: ['オプション1', 'オプション2', 'オプション3', 'オプション4'],
      5: ['20代', '30代', '40代', '50代', '60代以上'], // 単一選択（2列）
      6: ['とても良い', '良い', '普通', '悪い', 'とても悪い'],
      7: ['1 (最小)', '2', '3', '4', '5 (最大)'], // 均等目盛
      8: ['項目1', '項目2', '項目3', '項目4', '項目5']
    };
    return choiceMap[questionTypeNum] || ['回答1', '回答2', '回答3'];
  };

  // 2つの質問の回答をsubmission_idでマッチング
  const matchResponses = (responsesA, responsesB) => {
    const submissionMap = {};
    
    // 質問Aの回答をsubmission_idでマッピング
    responsesA.forEach(response => {
      if (!submissionMap[response.submission_id]) {
        submissionMap[response.submission_id] = {};
      }
      submissionMap[response.submission_id].questionA = response.answer;
      submissionMap[response.submission_id].submission_id = response.submission_id;
      submissionMap[response.submission_id].created_at = response.created_at;
    });
    
    // 質問Bの回答を追加
    responsesB.forEach(response => {
      if (submissionMap[response.submission_id]) {
        submissionMap[response.submission_id].questionB = response.answer;
      }
    });
    
    // 両方の質問に回答したデータのみを返す
    return Object.values(submissionMap).filter(item => item.questionA && item.questionB);
  };

  // クロス集計データを生成
  const generateCrossTabulation = (responses, questionA, questionB) => {
    const crosstab = {};
    let total = 0;
    
    responses.forEach(response => {
      const answerA = response.questionA || '未回答';
      const answerB = response.questionB || '未回答';
      
      if (!crosstab[answerA]) {
        crosstab[answerA] = {};
      }
      if (!crosstab[answerA][answerB]) {
        crosstab[answerA][answerB] = 0;
      }
      
      crosstab[answerA][answerB]++;
      total++;
    });
    
    return { crosstab, total };
  };

  // ヒートマップデータを生成
  const generateHeatmapData = (crossData, verticalChoices, horizontalChoices, verticalQuestion, horizontalQuestion) => {
    const { crosstab, total } = crossData;
    const heatData = [];
    
    // 最大値を計算してカラーマッピング用
    let maxValue = 0;
    Object.values(crosstab).forEach(row => {
      Object.values(row).forEach(value => {
        maxValue = Math.max(maxValue, value);
      });
    });
    
    verticalChoices.forEach((verticalChoice, verticalIndex) => {
      horizontalChoices.forEach((horizontalChoice, horizontalIndex) => {
        // クロス集計データは元の質問A/Bの順序で格納されているため、
        // verticalQuestion が questionA か questionB かに応じて適切にマッピング
        let value = 0;
        if (verticalQuestion.id === selectedQuestions[0].id) {
          // vertical = questionA, horizontal = questionB
          value = crosstab[verticalChoice]?.[horizontalChoice] || 0;
        } else {
          // vertical = questionB, horizontal = questionA
          value = crosstab[horizontalChoice]?.[verticalChoice] || 0;
        }
        
        const percentage = total > 0 ? (value / total * 100) : 0;
        const intensity = maxValue > 0 ? (value / maxValue) : 0;
        
        heatData.push({
          x: horizontalIndex,
          y: verticalIndex,
          value,
          percentage,
          intensity,
          verticalChoice,
          horizontalChoice,
          colorIndex: Math.min(Math.floor(intensity * heatmapColors.length), heatmapColors.length - 1)
        });
      });
    });
    
    return heatData;
  };

  // 統計情報を計算
  const calculateStatistics = (responses, crossData) => {
    const stats = {
      totalResponses: responses.length,
      correlationStrength: '中程度', // 簡略化
      mostCommonCombination: null,
      leastCommonCombination: null
    };
    
    if (crossData.crosstab) {
      let maxCount = 0;
      let minCount = Infinity;
      let maxCombo = null;
      let minCombo = null;
      
      Object.entries(crossData.crosstab).forEach(([answerA, rowData]) => {
        Object.entries(rowData).forEach(([answerB, count]) => {
          if (count > maxCount) {
            maxCount = count;
            maxCombo = `${answerA} × ${answerB}`;
          }
          if (count < minCount && count > 0) {
            minCount = count;
            minCombo = `${answerA} × ${answerB}`;
          }
        });
      });
      
      stats.mostCommonCombination = { combination: maxCombo, count: maxCount };
      stats.leastCommonCombination = { combination: minCombo, count: minCount };
    }
    
    return stats;
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

  if (!selectedQuestions || selectedQuestions.length !== 2) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          クロス分析には2つの質問を選択してください
        </Typography>
      </Box>
    );
  }

  const [questionA, questionB] = selectedQuestions;

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
          <GridView sx={{ color: '#5e17eb' }} />
          クロス分析 - ヒートマップ
        </Typography>
        
      </Box>

      {/* ヒートマップ */}
      <Box sx={{ 
        position: 'relative', 
        height: 'calc(100vh - 200px)', 
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        mb: 3 
      }}>
        {verticalQuestion && horizontalQuestion && (
          <>
            {/* ヒートマップ全体 - 中央配置 */}
            <Box sx={{ 
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '100%',
              gap: 2
            }}>
              {/* 上のrow - 横軸ラベル（右寄せ） */}
              <Box sx={{ 
                width: '100%',
                display: 'flex',
                justifyContent: 'flex-end'
              }}>
                <Typography sx={{
                  fontWeight: 600,
                  color: '#677eea',
                  fontSize: '0.9rem'
                }}>
                  {horizontalQuestion.title}
                </Typography>
              </Box>
              
              {/* ヒートマップコンテンツ */}
              <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}>
                {/* X軸選択肢ラベル */}
                <Box sx={{ 
                  display: 'flex', 
                  mb: 1, 
                  ml: `${Math.max(120, verticalChoices.reduce((max, choice) => Math.max(max, choice.length * 8), 0))}px`
                }}>
                {horizontalChoices.map((choice, index) => {
                  const cellWidth = Math.max(60, Math.min(120, (window.innerWidth - 400) / horizontalChoices.length));
                  return (
                    <Box 
                      key={index}
                      sx={{ 
                        width: cellWidth, 
                        minHeight: 40,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        color: '#64748b',
                        textAlign: 'center',
                        px: 0.5
                      }}
                    >
                      {choice.length > Math.floor(cellWidth / 10) ? `${choice.substring(0, Math.floor(cellWidth / 10))}...` : choice}
                    </Box>
                  );
                })}
              </Box>
              
              {/* ヒートマップセル */}
              <Box sx={{ 
                maxHeight: 'calc(100% - 80px)',
                overflowY: verticalChoices.length > 10 ? 'auto' : 'visible',
                width: '100%'
              }}>
                {verticalChoices.map((verticalChoice, verticalIndex) => {
                  const cellWidth = Math.max(60, Math.min(120, (window.innerWidth - 400) / horizontalChoices.length));
                  const cellHeight = Math.max(40, Math.min(80, (window.innerHeight - 300) / Math.min(verticalChoices.length, 10)));
                  
                  return (
                    <Box key={verticalIndex} sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      {/* Y軸選択肢ラベル */}
                      <Box sx={{ 
                        width: Math.max(120, verticalChoices.reduce((max, choice) => Math.max(max, choice.length * 8), 0)), 
                        height: cellHeight,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        pr: 2,
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        color: '#64748b'
                      }}>
                        {verticalChoice.length > 15 ? `${verticalChoice.substring(0, 15)}...` : verticalChoice}
                      </Box>
                      
                      {/* データセル */}
                      {horizontalChoices.map((horizontalChoice, horizontalIndex) => {
                        const cellData = heatmapData.find(d => d.x === horizontalIndex && d.y === verticalIndex);
                        const intensity = cellData?.intensity || 0;
                        const bgColor = heatmapColors[cellData?.colorIndex || 0];
                        const textColor = intensity > 0.5 ? '#ffffff' : '#1e293b';
                        
                        return (
                          <Tooltip 
                            key={horizontalIndex}
                            title={
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {verticalChoice} × {horizontalChoice}
                                </Typography>
                                <Typography variant="body2">
                                  回答数: {cellData?.value || 0}件
                                </Typography>
                                <Typography variant="body2">
                                  割合: {(cellData?.percentage || 0).toFixed(1)}%
                                </Typography>
                              </Box>
                            }
                            arrow
                          >
                            <motion.div
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Box
                                sx={{
                                  width: cellWidth,
                                  height: cellHeight,
                                  bgcolor: bgColor,
                                  border: '1px solid #e2e8f0',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease',
                                  '&:hover': {
                                    border: '2px solid #5e17eb',
                                    zIndex: 1
                                  }
                                }}
                              >
                                <Typography 
                                  variant="body2" 
                                  sx={{ 
                                    fontWeight: 700, 
                                    color: textColor,
                                    fontSize: '0.85rem'
                                  }}
                                >
                                  {cellData?.value || 0}
                                </Typography>
                                <Typography 
                                  variant="caption" 
                                  sx={{ 
                                    color: textColor,
                                    fontSize: '0.65rem'
                                  }}
                                >
                                  {(cellData?.percentage || 0).toFixed(1)}%
                                </Typography>
                              </Box>
                            </motion.div>
                          </Tooltip>
                        );
                      })}
                    </Box>
                  );
                })}
              </Box>
              </Box>
              
              {/* 下のrow - 縦軸ラベル（左寄せ） */}
              <Box sx={{ 
                width: '100%',
                display: 'flex',
                justifyContent: 'flex-start'
              }}>
                <Typography sx={{
                  fontWeight: 600,
                  color: '#5e17eb',
                  fontSize: '0.9rem'
                }}>
                  {verticalQuestion.title}
                </Typography>
              </Box>
            </Box>
          </>
        )}
      </Box>

    </Box>
  );
};

export default QuestionCrossAnalysisHeatmap;