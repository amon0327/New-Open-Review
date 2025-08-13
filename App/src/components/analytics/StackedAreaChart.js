import React, { useState } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { 
  Box, 
  ToggleButton, 
  ToggleButtonGroup, 
  Typography
} from '@mui/material';

const StackedAreaChart = ({ data, title = "回答数推移" }) => {
  const [timeRange, setTimeRange] = useState('week');

  const handleTimeRangeChange = (event, newRange) => {
    if (newRange !== null) {
      setTimeRange(newRange);
    }
  };

  const filterDataByRange = (data, range) => {
    if (!data || data.length === 0) return [];
    
    const now = new Date();
    const cutoffDate = new Date();
    
    if (range === 'week') {
      cutoffDate.setDate(now.getDate() - 7);
    } else if (range === 'month') {
      cutoffDate.setMonth(now.getMonth() - 1);
    }
    
    return data.filter(item => new Date(item.date) >= cutoffDate);
  };

  const filteredData = filterDataByRange(data, timeRange);

  const colors = [
    '#5e17eb', '#667eea', '#764ba2', '#f093fb', '#f5576c',
    '#4facfe', '#43e97b', '#fa709a', '#feb47b', '#ff9a9e'
  ];

  // 100%積み上げ用にデータを正規化
  const normalizedData = filteredData.map(item => {
    const total = Object.keys(item)
      .filter(key => key !== 'date')
      .reduce((sum, key) => sum + (item[key] || 0), 0);
    
    if (total === 0) return item;
    
    const normalized = { date: item.date };
    Object.keys(item)
      .filter(key => key !== 'date')
      .forEach(key => {
        normalized[key] = total > 0 ? (item[key] / total) * 100 : 0;
      });
    
    return normalized;
  });

  const areas = normalizedData.length > 0 
    ? Object.keys(normalizedData[0]).filter(key => key !== 'date').map((key, index) => (
        <Area
          key={key}
          type="monotone"
          dataKey={key}
          stackId="1"
          stroke={colors[index % colors.length]}
          fill={colors[index % colors.length]}
          fillOpacity={0.7}
        />
      ))
    : [];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mb: 2 }}>
        <ToggleButtonGroup
          value={timeRange}
          exclusive
          onChange={handleTimeRangeChange}
          size="small"
          sx={{
            '& .MuiToggleButton-root': {
              px: 2,
              py: 0.5,
              border: '1px solid #e0e0e0',
              '&.Mui-selected': {
                backgroundColor: '#5e17eb',
                color: 'white',
                '&:hover': {
                  backgroundColor: '#4a0fc7'
                }
              }
            }
          }}
        >
          <ToggleButton value="week">
            1週間
          </ToggleButton>
          <ToggleButton value="month">
            1ヶ月
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {normalizedData.length > 0 ? (
        <Box sx={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <AreaChart
              data={normalizedData}
              margin={{
                top: 10,
                right: 30,
                left: 0,
                bottom: 0,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                stroke="#666"
              />
              <YAxis 
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
                tick={{ fontSize: 12 }}
                stroke="#666"
              />
              <Tooltip
                formatter={(value, name) => [`${value.toFixed(1)}%`, name]}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Legend />
              {areas}
            </AreaChart>
          </ResponsiveContainer>
        </Box>
      ) : (
        <Box sx={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <AreaChart
              data={[]}
              margin={{
                top: 10,
                right: 30,
                left: 0,
                bottom: 0,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                stroke="#666"
              />
              <YAxis 
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
                tick={{ fontSize: 12 }}
                stroke="#666"
              />
              <Tooltip
                formatter={(value, name) => [`${value.toFixed(1)}%`, name]}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Legend />
            </AreaChart>
          </ResponsiveContainer>
        </Box>
      )}
    </Box>
  );
};

export default StackedAreaChart;