import React from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Typography,
  Button
} from '@mui/material';
import {
  AutoGraph,
  Compare,
  Tune
} from '@mui/icons-material';
import FilterPanel from './FilterPanel';

export default function ChartArea({
  selectedQuestions,
  activeFilters,
  setActiveFilters,
  showFilters,
  setShowFilters
}) {
  if (selectedQuestions.length === 0) {
    return (
      <Box
        sx={{
          flexGrow: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: '#ffffff',
          borderRadius: 2,
          border: '1px solid #e2e8f0',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Box sx={{ textAlign: 'center', p: 4, position: 'relative', zIndex: 1 }}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            style={{ display: 'inline-block', marginBottom: 16 }}
          >
            <AutoGraph sx={{ fontSize: 64, color: '#64748b' }} />
          </motion.div>
          <Typography 
            variant="h5" 
            sx={{ 
              fontWeight: 700, 
              mb: 1,
              color: '#1e293b',
              fontSize: '1.25rem'
            }}
          >
            データ分析を開始
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              mb: 3,
              color: '#64748b',
              fontSize: '0.95rem'
            }}
          >
            左側から質問を選択してください
          </Typography>
        </Box>
        
        {/* 装飾的な背景 */}
        <Box
          sx={{
            position: 'absolute',
            top: -50,
            right: -50,
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%)',
            animation: 'pulse 4s ease-in-out infinite',
            '@keyframes pulse': {
              '0%, 100%': { transform: 'scale(1)', opacity: 0.3 },
              '50%': { transform: 'scale(1.1)', opacity: 0.5 }
            }
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: -30,
            left: -30,
            width: 150,
            height: 150,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%)',
            animation: 'pulse 6s ease-in-out infinite',
            animationDelay: '2s'
          }}
        />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#ffffff',
        borderRadius: 2,
        border: '1px solid #e2e8f0',
        overflow: 'hidden'
      }}
    >
      {/* ヘッダーセクション */}
      <Box
        sx={{
          p: 2.5,
          borderBottom: '1px solid #f1f5f9',
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box
            sx={{
              bgcolor: selectedQuestions.length === 1 ? 'rgba(59, 130, 246, 0.1)' : 'rgba(99, 102, 241, 0.1)',
              color: selectedQuestions.length === 1 ? '#3b82f6' : '#6366f1',
              borderRadius: 1.5,
              p: 1,
              display: 'flex'
            }}
          >
            {selectedQuestions.length === 1 ? (
              <AutoGraph sx={{ fontSize: 28 }} />
            ) : (
              <Compare sx={{ fontSize: 28 }} />
            )}
          </Box>
          <Box sx={{ flexGrow: 1, ml: 2 }}>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 700,
                color: '#1e293b',
                fontSize: '1.1rem',
                mb: 0.25
              }}
            >
              {selectedQuestions.length === 1 ? '単体分析' : '比較・クロス分析'}
            </Typography>
            <Typography 
              variant="body2" 
              sx={{
                color: '#64748b',
                fontSize: '0.875rem'
              }}
            >
              {selectedQuestions.length === 1 
                ? selectedQuestions[0]?.title 
                : `${selectedQuestions.length}つの質問を比較分析`
              }
            </Typography>
          </Box>
          
          <Button
            startIcon={<Tune />}
            onClick={() => setShowFilters(!showFilters)}
            variant={showFilters ? "contained" : "outlined"}
            size="small"
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontSize: '0.8rem',
              fontWeight: 600,
              px: 2,
              py: 0.75,
              bgcolor: showFilters ? '#6366f1' : 'transparent',
              color: showFilters ? 'white' : '#64748b',
              borderColor: showFilters ? '#6366f1' : '#e2e8f0',
              '&:hover': {
                bgcolor: showFilters ? '#5046e5' : '#f1f5f9',
                borderColor: showFilters ? '#5046e5' : '#cbd5e1'
              }
            }}
          >
            フィルター
          </Button>
        </Box>
      </Box>

      {/* フィルターパネル */}
      <FilterPanel
        selectedQuestions={selectedQuestions}
        activeFilters={activeFilters}
        setActiveFilters={setActiveFilters}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
      />

      {/* チャート表示エリア */}
      <Box sx={{ flexGrow: 1, p: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Box sx={{ textAlign: 'center', color: '#64748b' }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            チャートエリア
          </Typography>
          <Typography variant="body2">
            ここにグラフが表示されます
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}