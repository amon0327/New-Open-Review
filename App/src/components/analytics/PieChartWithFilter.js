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
  FormControl, 
  Select, 
  MenuItem, 
  Typography,
  Paper,
  InputLabel
} from '@mui/material';
import { format, subDays, subMonths, subYears } from 'date-fns';
import { ja } from 'date-fns/locale';

const PieChartWithFilter = ({ data, title = "回答分布" }) => {
  const [periodFilter, setPeriodFilter] = useState('all');

  const handlePeriodChange = (event) => {
    setPeriodFilter(event.target.value);
  };

  const filterDataByPeriod = (data, period) => {
    if (!data || data.length === 0) return [];
    
    if (period === 'all') return data;
    
    const now = new Date();
    let cutoffDate;
    
    switch (period) {
      case 'week':
        cutoffDate = subDays(now, 7);
        break;
      case 'month':
        cutoffDate = subMonths(now, 1);
        break;
      case 'quarter':
        cutoffDate = subMonths(now, 3);
        break;
      case 'year':
        cutoffDate = subYears(now, 1);
        break;
      default:
        return data;
    }
    
    return data.filter(item => {
      if (item.date) {
        return new Date(item.date) >= cutoffDate;
      }
      return true;
    });
  };

  const filteredData = filterDataByPeriod(data, periodFilter);

  const colors = [
    '#5e17eb', '#667eea', '#764ba2', '#f093fb', '#f5576c',
    '#4facfe', '#43e97b', '#fa709a', '#feb47b', '#ff9a9e',
    '#a8edea', '#fed6e3', '#d299c2', '#ffecd2', '#fcb69f'
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
    <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
        
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>期間</InputLabel>
          <Select
            value={periodFilter}
            label="期間"
            onChange={handlePeriodChange}
            sx={{
              '& .MuiOutlinedInput-root': {
                '&.Mui-focused fieldset': {
                  borderColor: '#5e17eb',
                }
              }
            }}
          >
            <MenuItem value="all">全期間</MenuItem>
            <MenuItem value="week">1週間</MenuItem>
            <MenuItem value="month">1ヶ月</MenuItem>
            <MenuItem value="quarter">3ヶ月</MenuItem>
            <MenuItem value="year">1年</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {filteredData.length > 0 ? (
        <Box sx={{ width: '100%', height: 400 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={filteredData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={CustomLabel}
                outerRadius={120}
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
            選択した期間にデータがありません
          </Typography>
        </Box>
      )}

      {filteredData.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            総計: {filteredData.reduce((sum, item) => sum + item.value, 0)} 件
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default PieChartWithFilter;