import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Card,
  Typography,
  TextField,
  Grid,
  Divider,
  Alert,
  CircularProgress
} from '@mui/material';
import { CasinoOutlined } from '@mui/icons-material';
import { LotteryService } from '../../services/LotteryService';

const LotterySettings = ({
  formId,
  onLotteryUpdate
}) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [lotteryData, setLotteryData] = useState({
    maxWinsPerMonth: 1,
    winRateDivisor: 1000,
    currentWins: 0,
    currentTrials: 0
  });

  const [debounceTimeout, setDebounceTimeout] = useState(null);

  useEffect(() => {
    if (formId) {
      loadLotteryData();
    }
  }, [formId]);

  const loadLotteryData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const lottery = await LotteryService.getLotteryByFormId(formId);
      
      if (lottery) {
        setLotteryData({
          maxWinsPerMonth: lottery.max_wins_per_month,
          winRateDivisor: lottery.win_rate_divisor,
          currentWins: lottery.current_wins,
          currentTrials: lottery.current_trials
        });
      } else {
        const newLottery = await LotteryService.createLotteryForForm(formId);
        setLotteryData({
          maxWinsPerMonth: newLottery.max_wins_per_month,
          winRateDivisor: newLottery.win_rate_divisor,
          currentWins: newLottery.current_wins,
          currentTrials: newLottery.current_trials
        });
      }
    } catch (err) {
      setError('抽選設定の読み込みに失敗しました');
      console.error('Lottery data load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (field, value) => {
    const numericValue = parseInt(value) || 0;
    
    // バリデーション
    if (field === 'maxWinsPerMonth' && numericValue < 1) return;
    if (field === 'winRateDivisor' && numericValue < 1) return;
    
    const newData = {
      ...lotteryData,
      [field]: numericValue
    };
    
    setLotteryData(newData);

    // 既存のタイムアウトをクリア
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    // 500ms後にAPIで保存
    const timeout = setTimeout(async () => {
      await saveLotterySettings(newData);
    }, 500);

    setDebounceTimeout(timeout);
  };

  const saveLotterySettings = async (data) => {
    try {
      setSaving(true);
      setError(null);
      
      await LotteryService.updateLotterySettings(formId, {
        max_wins_per_month: data.maxWinsPerMonth,
        win_rate_divisor: data.winRateDivisor
      });
      
      if (onLotteryUpdate) {
        await onLotteryUpdate(data);
      }
    } catch (err) {
      setError('抽選設定の保存に失敗しました');
      console.error('Lottery settings save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const calculateWinRate = () => {
    if (lotteryData.winRateDivisor <= 0) return '0%';
    const percentage = (1 / lotteryData.winRateDivisor * 100).toFixed(3);
    return `${percentage}%`;
  };

  if (loading) {
    return (
      <Card sx={{ p: 3, borderRadius: 3, border: '1px solid #f1f5f9' }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <CircularProgress size={24} />
        </Box>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
    >
      <Card
        sx={{
          p: 3,
          borderRadius: 3,
          border: '1px solid #f1f5f9',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
          },
          transition: 'box-shadow 0.2s ease'
        }}
      >
        {/* ヘッダー */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              background: 'linear-gradient(135deg, #ff9a56 0%, #ff6b95 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 2
            }}
          >
            <CasinoOutlined sx={{ color: 'white', fontSize: '1.2rem' }} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
              抽選設定
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              フォーム回答者向けの抽選機能を設定
            </Typography>
          </Box>
          {saving && (
            <CircularProgress size={16} sx={{ color: '#5e17eb' }} />
          )}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* 設定項目 */}
        <Grid container spacing={3}>
          {/* 月最大当選回数 */}
          <Grid item xs={12} md={6}>
            <Typography 
              variant="subtitle2" 
              sx={{ mb: 2, fontWeight: 600, color: '#374151' }}
            >
              月最大当選回数
            </Typography>
            <TextField
              fullWidth
              type="number"
              value={lotteryData.maxWinsPerMonth}
              onChange={(e) => handleSettingChange('maxWinsPerMonth', e.target.value)}
              inputProps={{ min: 1 }}
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  backgroundColor: '#fafbfc',
                  '& fieldset': {
                    borderColor: '#e2e8f0'
                  },
                  '&:hover fieldset': {
                    borderColor: '#cbd5e1'
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#5e17eb',
                    borderWidth: '2px'
                  },
                  '&.Mui-focused': {
                    backgroundColor: 'white'
                  }
                }
              }}
            />
            <Typography 
              variant="caption" 
              sx={{ color: '#94a3b8', mt: 1, display: 'block' }}
            >
              1ヶ月あたりの最大当選回数
            </Typography>
          </Grid>

          {/* 当選確率 */}
          <Grid item xs={12} md={6}>
            <Typography 
              variant="subtitle2" 
              sx={{ mb: 2, fontWeight: 600, color: '#374151' }}
            >
              当選確率分母
            </Typography>
            <TextField
              fullWidth
              type="number"
              value={lotteryData.winRateDivisor}
              onChange={(e) => handleSettingChange('winRateDivisor', e.target.value)}
              inputProps={{ min: 1 }}
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  backgroundColor: '#fafbfc',
                  '& fieldset': {
                    borderColor: '#e2e8f0'
                  },
                  '&:hover fieldset': {
                    borderColor: '#cbd5e1'
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#5e17eb',
                    borderWidth: '2px'
                  },
                  '&.Mui-focused': {
                    backgroundColor: 'white'
                  }
                }
              }}
            />
            <Typography 
              variant="caption" 
              sx={{ color: '#94a3b8', mt: 1, display: 'block' }}
            >
              1/{lotteryData.winRateDivisor} = {calculateWinRate()} の確率
            </Typography>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        {/* 統計情報 */}
        <Typography 
          variant="subtitle2" 
          sx={{ mb: 2, fontWeight: 600, color: '#374151' }}
        >
          今月の統計
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0'
              }}
            >
              <Typography variant="body2" sx={{ color: '#64748b', mb: 1 }}>
                今月の当選回数
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b' }}>
                {lotteryData.currentWins}
              </Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                / {lotteryData.maxWinsPerMonth} 回
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0'
              }}
            >
              <Typography variant="body2" sx={{ color: '#64748b', mb: 1 }}>
                今月の試行回数
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b' }}>
                {lotteryData.currentTrials}
              </Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                回
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Card>
    </motion.div>
  );
};

export default LotterySettings;