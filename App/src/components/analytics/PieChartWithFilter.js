import React, { useState } from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  Legend 
} from 'recharts';
import { 
  Box, 
  Typography,
  TextField,
  Button,
  ButtonGroup
} from '@mui/material';

const PieChartWithFilter = ({ data, title = "回答分布" }) => {
  const [dateRange, setDateRange] = useState('');

  const getPresetDateRange = (preset) => {
    const today = new Date();
    const formatDate = (date) => date.toISOString().split('T')[0];
    
    switch (preset) {
      case '1week':
        const oneWeekAgo = new Date(today);
        oneWeekAgo.setDate(today.getDate() - 7);
        return `${formatDate(oneWeekAgo)} - ${formatDate(today)}`;
      case '1month':
        const oneMonthAgo = new Date(today);
        oneMonthAgo.setMonth(today.getMonth() - 1);
        return `${formatDate(oneMonthAgo)} - ${formatDate(today)}`;
      case '3months':
        const threeMonthsAgo = new Date(today);
        threeMonthsAgo.setMonth(today.getMonth() - 3);
        return `${formatDate(threeMonthsAgo)} - ${formatDate(today)}`;
      case 'all':
        return '';
      default:
        return '';
    }
  };

  const parseDateRange = (dateRangeStr) => {
    if (!dateRangeStr || !dateRangeStr.includes(' - ')) return { startDate: null, endDate: null };
    
    const [startStr, endStr] = dateRangeStr.split(' - ');
    return {
      startDate: startStr ? new Date(startStr) : null,
      endDate: endStr ? new Date(endStr) : null
    };
  };

  const filterDataByDateRange = (data, dateRangeStr) => {
    if (!data || data.length === 0) return [];
    
    const { startDate, endDate } = parseDateRange(dateRangeStr);
    
    // 日付範囲が設定されていない場合は全期間
    if (!startDate && !endDate) return data;
    
    return data.filter(item => {
      if (!item.date) return true;
      
      const itemDate = new Date(item.date);
      
      if (startDate && endDate) {
        return itemDate >= startDate && itemDate <= endDate;
      } else if (startDate) {
        return itemDate >= startDate;
      } else if (endDate) {
        return itemDate <= endDate;
      }
      
      return true;
    });
  };

  const filteredData = filterDataByDateRange(data, dateRange);

  const colors = [
    '#5e17eb', '#667eea', '#764ba2', '#f093fb', '#f5576c',
    '#4facfe', '#43e97b', '#fa709a', '#feb47b', '#ff9a9e'
  ];

  const CustomTooltip = ({ active, payload }) => {
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
            {data.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            値: {data.value}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            割合: {((data.value / filteredData.reduce((sum, item) => sum + item.value, 0)) * 100).toFixed(1)}%
          </Typography>
        </Box>
      );
    }
    return null;
  };

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    if (percent < 0.05) return null;
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize="12"
        fontWeight="600"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1.5, mb: 2 }}>
        <TextField
          label="カスタム期間"
          placeholder="2024-01-01 - 2024-12-31"
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          size="small"
          InputLabelProps={{
            shrink: true,
          }}
          sx={{
            minWidth: 220,
            '& .MuiOutlinedInput-root': {
              '&.Mui-focused fieldset': {
                borderColor: '#5e17eb',
              }
            }
          }}
        />
        
        <ButtonGroup size="small" variant="outlined">
          <Button 
            onClick={() => setDateRange(getPresetDateRange('1week'))}
            variant={dateRange === getPresetDateRange('1week') ? 'contained' : 'outlined'}
            sx={{
              bgcolor: dateRange === getPresetDateRange('1week') ? '#5e17eb' : 'transparent',
              borderColor: '#5e17eb',
              color: dateRange === getPresetDateRange('1week') ? 'white' : '#5e17eb',
              px: 1.5,
              py: 0.5,
              fontSize: '0.8rem',
              '&:hover': {
                bgcolor: '#5e17eb',
                color: 'white'
              }
            }}
          >
            1週間
          </Button>
          <Button 
            onClick={() => setDateRange(getPresetDateRange('1month'))}
            variant={dateRange === getPresetDateRange('1month') ? 'contained' : 'outlined'}
            sx={{
              bgcolor: dateRange === getPresetDateRange('1month') ? '#5e17eb' : 'transparent',
              borderColor: '#5e17eb',
              color: dateRange === getPresetDateRange('1month') ? 'white' : '#5e17eb',
              px: 1.5,
              py: 0.5,
              fontSize: '0.8rem',
              '&:hover': {
                bgcolor: '#5e17eb',
                color: 'white'
              }
            }}
          >
            1ヶ月
          </Button>
          <Button 
            onClick={() => setDateRange(getPresetDateRange('3months'))}
            variant={dateRange === getPresetDateRange('3months') ? 'contained' : 'outlined'}
            sx={{
              bgcolor: dateRange === getPresetDateRange('3months') ? '#5e17eb' : 'transparent',
              borderColor: '#5e17eb',
              color: dateRange === getPresetDateRange('3months') ? 'white' : '#5e17eb',
              px: 1.5,
              py: 0.5,
              fontSize: '0.8rem',
              '&:hover': {
                bgcolor: '#5e17eb',
                color: 'white'
              }
            }}
          >
            3ヶ月
          </Button>
          <Button 
            onClick={() => setDateRange('')}
            variant={dateRange === '' ? 'contained' : 'outlined'}
            sx={{
              bgcolor: dateRange === '' ? '#5e17eb' : 'transparent',
              borderColor: '#5e17eb',
              color: dateRange === '' ? 'white' : '#5e17eb',
              px: 1.5,
              py: 0.5,
              fontSize: '0.8rem',
              '&:hover': {
                bgcolor: '#5e17eb',
                color: 'white'
              }
            }}
          >
            全期間
          </Button>
        </ButtonGroup>
      </Box>

      {filteredData.length > 0 ? (
        <Box sx={{ width: '100%', height: 500 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={filteredData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={CustomLabel}
                outerRadius={160}
                fill="#8884d8"
                dataKey="value"
                animationBegin={0}
                animationDuration={800}
              >
                {filteredData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={colors[index % colors.length]}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                formatter={(value, entry) => (
                  <span style={{ color: entry.color, fontWeight: 500 }}>
                    {value}
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </Box>
      ) : (
        <Box 
          sx={{ 
            height: 400, 
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

export default PieChartWithFilter;