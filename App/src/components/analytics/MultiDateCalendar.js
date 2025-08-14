import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid
} from '@mui/material';
import {
  CalendarToday,
  Clear
} from '@mui/icons-material';

export default function MultiDateCalendar({ 
  selectedDates, 
  onDatesChange, 
  maxSelections = null,
  reviewDates = [] // レビューがある日付の配列
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [hoveredDate, setHoveredDate] = useState(null);
  
  // 現在の月の日数とカレンダーマトリックスを計算
  const calendarData = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const weeks = [];
    let currentWeek = [];
    
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      currentWeek.push(date);
      
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }
    
    return { weeks, firstDay, lastDay };
  }, [currentMonth]);
  
  const isDateSelected = (date) => {
    return selectedDates.some(selectedDate => 
      selectedDate.getFullYear() === date.getFullYear() &&
      selectedDate.getMonth() === date.getMonth() &&
      selectedDate.getDate() === date.getDate()
    );
  };
  
  const isDateInCurrentMonth = (date) => {
    return date.getMonth() === currentMonth.getMonth();
  };
  
  const hasReview = (date) => {
    return reviewDates.some(reviewDate => {
      // reviewDateが文字列の場合は日付オブジェクトに変換して比較
      if (typeof reviewDate === 'string') {
        const reviewDateObj = new Date(reviewDate);
        // タイムゾーンを考慮した日付比較
        const reviewYear = reviewDateObj.getFullYear();
        const reviewMonth = reviewDateObj.getMonth();
        const reviewDay = reviewDateObj.getDate();
        return (
          date.getFullYear() === reviewYear &&
          date.getMonth() === reviewMonth &&
          date.getDate() === reviewDay
        );
      }
      // reviewDateが既に日付オブジェクトの場合
      return (
        date.getFullYear() === reviewDate.getFullYear() &&
        date.getMonth() === reviewDate.getMonth() &&
        date.getDate() === reviewDate.getDate()
      );
    });
  };
  
  const handleDateClick = (date) => {
    if (!isDateInCurrentMonth(date)) return;
    
    const isSelected = isDateSelected(date);
    let newDates;
    
    if (isSelected) {
      newDates = selectedDates.filter(d => 
        !(d.getFullYear() === date.getFullYear() &&
          d.getMonth() === date.getMonth() &&
          d.getDate() === date.getDate())
      );
    } else {
      if (maxSelections && selectedDates.length >= maxSelections) {
        return; // 最大選択数に達している場合は追加しない
      }
      newDates = [...selectedDates, date];
    }
    
    onDatesChange(newDates);
  };
  
  const navigateMonth = (direction) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
  };
  
  return (
    <Card 
      sx={{ 
        borderRadius: 1.5,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        border: '1px solid #f1f5f9'
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        {/* カレンダーヘッダー */}
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CalendarToday sx={{ color: '#6366f1', fontSize: 20 }} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>
              {currentMonth.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' })}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              onClick={() => navigateMonth(-1)}
              size="small"
              sx={{
                minWidth: 32,
                height: 32,
                borderRadius: 1,
                color: '#64748b',
                '&:hover': { bgcolor: '#f1f5f9' }
              }}
            >
              ‹
            </Button>
            <Button
              onClick={() => navigateMonth(1)}
              size="small"
              sx={{
                minWidth: 32,
                height: 32,
                borderRadius: 1,
                color: '#64748b',
                '&:hover': { bgcolor: '#f1f5f9' }
              }}
            >
              ›
            </Button>
          </Box>
        </Box>
        
        {/* 曜日ヘッダー */}
        <Grid container sx={{ mb: 1 }}>
          {['日', '月', '火', '水', '木', '金', '土'].map((day, index) => (
            <Grid item xs key={day} sx={{ textAlign: 'center' }}>
              <Typography 
                variant="caption" 
                sx={{ 
                  fontWeight: 600, 
                  color: index === 0 || index === 6 ? '#ef4444' : '#64748b',
                  fontSize: '0.75rem'
                }}
              >
                {day}
              </Typography>
            </Grid>
          ))}
        </Grid>
        
        {/* カレンダー本体 */}
        {calendarData.weeks.map((week, weekIndex) => (
          <Grid container key={weekIndex} sx={{ mb: 0.5 }}>
            {week.map((date, dayIndex) => {
              const isSelected = isDateSelected(date);
              const isCurrentMonth = isDateInCurrentMonth(date);
              const isToday = date.toDateString() === new Date().toDateString();
              const isHovered = hoveredDate?.toDateString() === date.toDateString();
              const hasReviewData = hasReview(date);
              
              return (
                <Grid item xs key={dayIndex} sx={{ textAlign: 'center' }}>
                  <motion.div
                    whileHover={{ scale: isCurrentMonth ? 1.1 : 1 }}
                    whileTap={{ scale: isCurrentMonth ? 0.95 : 1 }}
                  >
                    <Button
                      onClick={() => handleDateClick(date)}
                      onMouseEnter={() => setHoveredDate(date)}
                      onMouseLeave={() => setHoveredDate(null)}
                      disabled={!isCurrentMonth}
                      sx={{
                        minWidth: 32,
                        height: 32,
                        borderRadius: 1,
                        fontSize: '0.8rem',
                        fontWeight: isToday ? 700 : hasReviewData ? 600 : 500,
                        color: isSelected 
                          ? 'white' 
                          : isToday 
                            ? '#6366f1' 
                            : hasReviewData && isCurrentMonth
                              ? '#eab308' // レビューがある日は黄色
                              : isCurrentMonth 
                                ? '#1e293b' 
                                : '#cbd5e1',
                        bgcolor: isSelected 
                          ? '#6366f1' 
                          : isHovered && isCurrentMonth 
                            ? '#f1f5f9' 
                            : 'transparent',
                        border: isToday && !isSelected 
                          ? '2px solid #6366f1' 
                          : 'none',
                        transition: 'all 0.2s ease',
                        position: 'relative',
                        '&:hover': {
                          bgcolor: isSelected ? '#5046e5' : isCurrentMonth ? '#f1f5f9' : 'transparent'
                        },
                        '&:disabled': {
                          color: '#e2e8f0'
                        },
                      }}
                    >
                      {date.getDate()}
                    </Button>
                  </motion.div>
                </Grid>
              );
            })}
          </Grid>
        ))}
        
        {/* 選択状況と凡例の表示 */}
        <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #f1f5f9' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500 }}>
              {selectedDates.length === 0 
                ? 'すべての日付を表示' 
                : `${selectedDates.length}日選択中`
              }
            </Typography>
            {selectedDates.length > 0 && (
              <Button
                onClick={() => onDatesChange([])}
                size="small"
                startIcon={<Clear sx={{ fontSize: 14 }} />}
                sx={{
                  fontSize: '0.7rem',
                  color: '#94a3b8',
                  '&:hover': { color: '#ef4444', bgcolor: 'rgba(239, 68, 68, 0.05)' }
                }}
              >
                クリア
              </Button>
            )}
          </Box>
          
        </Box>
      </CardContent>
    </Card>
  );
}