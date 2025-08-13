import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Container,
  Alert,
  CircularProgress
} from '@mui/material';
import StackedAreaChart from './StackedAreaChart';
import PieChartWithFilter from './PieChartWithFilter';

const QuestionType345678Analytics = ({ questionData, questionId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [areaChartData, setAreaChartData] = useState([]);
  const [pieChartData, setPieChartData] = useState([]);

  useEffect(() => {
    const processQuestionData = async () => {
      try {
        setLoading(true);
        
        if (!questionData || !questionId) {
          setError('質問データが見つかりません');
          return;
        }

        const question = questionData.find(q => q.id === questionId);
        if (!question) {
          setError('指定された質問が見つかりません');
          return;
        }

        if (!['3', '4', '5', '6', '7', '8'].includes(question.type)) {
          setError('このコンポーネントは質問タイプ3,4,5,6,7,8のみ対応しています');
          return;
        }

        if (!question.required) {
          setError('この質問は必須ではありません');
          return;
        }

        const responses = question.responses || [];
        
        const areaData = generateAreaChartData(responses);
        setAreaChartData(areaData);
        
        const pieData = generatePieChartData(responses, question);
        setPieChartData(pieData);
        
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

  const generateAreaChartData = (responses) => {
    const dailyData = {};
    
    responses.forEach(response => {
      const date = response.created_at ? 
        new Date(response.created_at).toISOString().split('T')[0] : 
        new Date().toISOString().split('T')[0];
      
      if (!dailyData[date]) {
        dailyData[date] = { date, total: 0 };
      }
      dailyData[date].total += 1;
    });

    const last30Days = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      last30Days.push({
        date: dateStr,
        回答数: dailyData[dateStr]?.total || 0
      });
    }
    
    return last30Days;
  };

  const generatePieChartData = (responses, question) => {
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
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
          <CircularProgress size={40} sx={{ color: '#5e17eb' }} />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  const currentQuestion = questionData?.find(q => q.id === questionId);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h4" 
          component="h1" 
          sx={{ 
            fontWeight: 700, 
            mb: 1,
            background: 'linear-gradient(135deg, #5e17eb 0%, #667eea 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}
        >
          質問分析ダッシュボード
        </Typography>
        
        {currentQuestion && (
          <Box>
            <Typography variant="h6" sx={{ color: 'text.secondary', mb: 1 }}>
              {currentQuestion.title || '質問タイトル'}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              タイプ: {getQuestionTypeLabel(currentQuestion.type)} | 必須回答
            </Typography>
          </Box>
        )}
      </Box>

      <Box sx={{ mb: 4 }}>
        <StackedAreaChart 
          data={areaChartData}
          title="回答数の推移"
        />
      </Box>

      <Box>
        <PieChartWithFilter 
          data={pieChartData}
          title="回答内容の分布"
        />
      </Box>
    </Container>
  );
};

export default QuestionType345678Analytics;