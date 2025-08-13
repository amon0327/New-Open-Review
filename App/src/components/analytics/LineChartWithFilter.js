import React, { useState } from 'react';
import { 
  LineChart, 
  Line, 
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

const LineChartWithFilter = ({ data, title = "回答数推移" }) => {
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

  const lines = filteredData.length > 0 
    ? Object.keys(filteredData[0]).filter(key => key !== 'date').map((key, index) => (
        <Line
          key={key}
          type="monotone"
          dataKey={key}
          stroke={colors[index % colors.length]}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 6, stroke: colors[index % colors.length], strokeWidth: 2 }}
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
              fontSize: '0.8rem',
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

      {filteredData.length > 0 ? (
        <Box sx={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <LineChart
              data={filteredData}
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
                tick={{ fontSize: 12 }}
                stroke="#666"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Legend />
              {lines}
            </LineChart>
          </ResponsiveContainer>
        </Box>
      ) : (
        <Box 
          sx={{ 
            height: 300, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: 'text.secondary'
          }}
        >
          <Typography variant="body1">
            データがありません
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default LineChartWithFilter;