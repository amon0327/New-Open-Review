import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { 
  Box, 
  Typography
} from '@mui/material';

const VerticalBarChart = ({ data, title = "選択肢別回答数" }) => {
  
  const colors = [
    '#5e17eb', '#667eea', '#764ba2', '#f093fb', '#f5576c',
    '#4facfe', '#43e97b', '#fa709a', '#feb47b', '#ff9a9e',
    '#a8edea', '#fed6e3', '#d299c2', '#ffecd2', '#fcb69f'
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <Box
          sx={{
            backgroundColor: 'white',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            padding: '12px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {label}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            回答数: {data.value} 件
          </Typography>
          <Typography variant="body2" color="text.secondary">
            割合: {((data.value / data.payload.total) * 100).toFixed(1)}%
          </Typography>
        </Box>
      );
    }
    return null;
  };

  // データに総計を追加
  const dataWithTotal = data.map(item => ({
    ...item,
    total: data.reduce((sum, d) => sum + d.value, 0)
  }));

  if (!data) {
    return (
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
    );
  }

  if (data.length === 0) {
    return (
      <Box sx={{ 
        height: 400, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        color: 'text.secondary'
      }}>
        <Typography variant="body1">
          表示するデータがありません
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ width: '100%', height: 400 }}>
        <ResponsiveContainer>
          <BarChart
            data={dataWithTotal}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 60,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="name"
              tick={{ fontSize: 12 }}
              stroke="#666"
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              stroke="#666"
              domain={[0, 'dataMax']}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="value" 
              fill="#5e17eb"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </Box>

      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
          合計回答数: {data.reduce((sum, item) => sum + item.value, 0)} 件
        </Typography>
      </Box>
    </Box>
  );
};

export default VerticalBarChart;