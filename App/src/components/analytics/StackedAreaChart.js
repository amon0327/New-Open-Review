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
  Typography,
  Paper 
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
    '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', 
    '#d084d0', '#87d068', '#ffb347', '#ff9999', '#87ceeb'
  ];

  const areas = filteredData.length > 0 
    ? Object.keys(filteredData[0]).filter(key => key !== 'date').map((key, index) => (
        <Area
          key={key}
          type="monotone"
          dataKey={key}
          stackId="1"
          stroke={colors[index % colors.length]}
          fill={colors[index % colors.length]}
          fillOpacity={0.6}
        />
      ))
    : [];

  return (
    <Paper sx={{ p: 3, mb: 3, borderRadius: 2, boxShadow: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
        
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

      <Box sx={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <AreaChart
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
            {areas}
          </AreaChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
};

export default StackedAreaChart;