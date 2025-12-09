import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Typography,
  Container,
  Paper,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText
} from '@mui/material';
import {
  Settings,
  Close
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';

export default function FormPublishPage({ user }) {
  // アンケートサイクル設定
  const [surveyCycleConfig, setSurveyCycleConfig] = useState({
    groupA: 'Quality',      // 1月, 4月, 7月, 10月
    groupB: 'Service',      // 2月, 5月, 8月, 11月
    groupC: 'Cleanliness'   // 3月, 6月, 9月, 12月
  });
  const [showCycleSettings, setShowCycleSettings] = useState(false);
  const [cycleConfirmDialogOpen, setCycleConfirmDialogOpen] = useState(false);

  const surveyTypes = [
    { id: 'Quality', label: 'Q', fullLabel: 'Quality', color: '#6366f1', bgColor: '#eef2ff' },
    { id: 'Service', label: 'S', fullLabel: 'Service', color: '#10b981', bgColor: '#ecfdf5' },
    { id: 'Cleanliness', label: 'C', fullLabel: 'Cleanliness', color: '#f59e0b', bgColor: '#fffbeb' }
  ];

  const cycleGroups = [
    { key: 'groupA', months: [1, 4, 7, 10], label: '1・4・7・10月' },
    { key: 'groupB', months: [2, 5, 8, 11], label: '2・5・8・11月' },
    { key: 'groupC', months: [3, 6, 9, 12], label: '3・6・9・12月' }
  ];

  // 現在の月からアンケートタイプを取得
  const getCurrentSurveyType = () => {
    const currentMonth = new Date().getMonth() + 1;
    const group = cycleGroups.find(g => g.months.includes(currentMonth));
    if (group) {
      const typeId = surveyCycleConfig[group.key];
      return surveyTypes.find(t => t.id === typeId);
    }
    return null;
  };

  const currentSurveyType = getCurrentSurveyType();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  // サイクル設定変更ハンドラー（重複を許さない）
  const handleCycleChange = (groupKey, newType) => {
    // 現在の設定から、newTypeを持っている他のグループを探す
    const otherGroupWithSameType = Object.entries(surveyCycleConfig).find(
      ([key, type]) => key !== groupKey && type === newType
    );

    if (otherGroupWithSameType) {
      // 交換する：選択したグループに新しいタイプを、元のグループに現在のタイプを
      const [otherGroupKey] = otherGroupWithSameType;
      const currentType = surveyCycleConfig[groupKey];
      setSurveyCycleConfig(prev => ({
        ...prev,
        [groupKey]: newType,
        [otherGroupKey]: currentType
      }));
    } else {
      // 重複がない場合はそのまま設定
      setSurveyCycleConfig(prev => ({
        ...prev,
        [groupKey]: newType
      }));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      style={{ width: '100%' }}
    >
      <Box
        sx={{
          width: '100%',
          minHeight: '100vh',
          backgroundColor: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          pt: 2,
          px: 0
        }}
      >
        {/* ページヘッダー */}
        <Container maxWidth="xl" sx={{ mt: 2, mb: 3 }}>
          <Box sx={{ mb: 4 }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: '#1a202c',
                mb: 1,
                fontSize: '2rem'
              }}
            >
              フォーム公開
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: 'text.secondary',
                fontSize: '1rem'
              }}
            >
              レビューフォームの公開設定と評価サイクルを管理
            </Typography>
          </Box>
        </Container>

        {/* 今月の評価項目セクション */}
        <Container maxWidth="xl" sx={{ mb: 4 }}>
          {/* セクションヘッダー */}
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                color: '#1a202c',
                mb: 0.5,
                fontSize: '1.5rem'
              }}
            >
              今月の評価項目
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                fontSize: '0.875rem'
              }}
            >
              3ヶ月サイクルで Quality・Service・Cleanliness を順番に評価
            </Typography>
          </Box>

          {/* 評価項目カード */}
          {currentSurveyType && (
            <Paper
              elevation={0}
              sx={{
                borderRadius: 2,
                border: '1px solid rgba(0, 0, 0, 0.06)',
                overflow: 'hidden'
              }}
            >
              {/* メイン表示部分 */}
              <Box
                sx={{
                  p: 3,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  {/* カラーインジケーター */}
                  <Box
                    sx={{
                      width: 6,
                      height: 60,
                      borderRadius: 1,
                      bgcolor: currentSurveyType.color
                    }}
                  />

                  {/* 年月と評価項目 */}
                  <Box>
                    <Typography sx={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 500, mb: 0.5 }}>
                      {currentYear}年{currentMonth}月
                    </Typography>
                    <Typography sx={{ fontSize: '1.75rem', fontWeight: 700, color: currentSurveyType.color }}>
                      {currentSurveyType.fullLabel}
                    </Typography>
                    <Typography sx={{ fontSize: '0.8rem', color: '#94a3b8', mt: 0.5 }}>
                      今月の評価テーマ
                    </Typography>
                  </Box>
                </Box>

                {/* 設定ボタン */}
                <IconButton
                  onClick={() => setShowCycleSettings(!showCycleSettings)}
                  sx={{
                    color: showCycleSettings ? '#5e17eb' : '#94a3b8',
                    bgcolor: showCycleSettings ? 'rgba(94, 23, 235, 0.08)' : 'transparent',
                    width: 48,
                    height: 48,
                    '&:hover': {
                      color: '#5e17eb',
                      bgcolor: 'rgba(94, 23, 235, 0.08)'
                    }
                  }}
                >
                  {showCycleSettings ? <Close /> : <Settings />}
                </IconButton>
              </Box>

              {/* 設定パネル（開閉式） */}
              {showCycleSettings && (
                <Box sx={{ borderTop: '1px solid #e5e7eb' }}>
                  <Box sx={{ p: 3 }}>
                    <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, color: '#374151', mb: 2 }}>
                      サイクル設定
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {cycleGroups.map((group) => {
                        const selectedType = surveyTypes.find(t => t.id === surveyCycleConfig[group.key]);
                        return (
                          <Box
                            key={group.key}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 3,
                              p: 2,
                              borderRadius: 1.5,
                              bgcolor: '#fafafa'
                            }}
                          >
                            {/* 月表示 */}
                            <Box sx={{ display: 'flex', gap: 0.75, minWidth: 160 }}>
                              {group.months.map((month) => (
                                <Box
                                  key={month}
                                  sx={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: 1,
                                    bgcolor: month === currentMonth ? '#1a202c' : '#fff',
                                    border: month === currentMonth ? 'none' : '1px solid #e5e7eb',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}
                                >
                                  <Typography
                                    sx={{
                                      fontSize: '0.8rem',
                                      fontWeight: 600,
                                      color: month === currentMonth ? '#fff' : '#374151'
                                    }}
                                  >
                                    {month}月
                                  </Typography>
                                </Box>
                              ))}
                            </Box>

                            {/* 矢印 */}
                            <Typography sx={{ color: '#d1d5db', fontSize: '1.25rem' }}>→</Typography>

                            {/* アンケート種類選択 */}
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              {surveyTypes.map((type) => {
                                const isSelected = surveyCycleConfig[group.key] === type.id;
                                return (
                                  <Box
                                    key={type.id}
                                    onClick={() => handleCycleChange(group.key, type.id)}
                                    sx={{
                                      px: 2,
                                      py: 1,
                                      borderRadius: 1,
                                      cursor: 'pointer',
                                      bgcolor: isSelected ? type.color : '#fff',
                                      border: `2px solid ${isSelected ? type.color : '#e5e7eb'}`,
                                      transition: 'all 0.15s',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 1,
                                      '&:hover': {
                                        borderColor: type.color,
                                        bgcolor: isSelected ? type.color : type.bgColor
                                      }
                                    }}
                                  >
                                    <Box
                                      sx={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: '50%',
                                        bgcolor: isSelected ? '#fff' : type.color
                                      }}
                                    />
                                    <Typography
                                      sx={{
                                        fontSize: '0.85rem',
                                        fontWeight: 600,
                                        color: isSelected ? '#fff' : type.color
                                      }}
                                    >
                                      {type.fullLabel}
                                    </Typography>
                                  </Box>
                                );
                              })}
                            </Box>
                          </Box>
                        );
                      })}
                    </Box>

                    {/* 説明文と確定ボタン */}
                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography sx={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        ※ 各項目は重複不可。選択すると自動で入れ替わります。
                      </Typography>
                      <Button
                        variant="contained"
                        size="medium"
                        onClick={() => setCycleConfirmDialogOpen(true)}
                        sx={{
                          background: 'linear-gradient(135deg, #5e17eb 0%, #667eea 100%)',
                          borderRadius: 1.5,
                          px: 4,
                          py: 1,
                          textTransform: 'none',
                          fontWeight: 600,
                          fontSize: '0.9rem',
                          boxShadow: 'none',
                          '&:hover': {
                            background: 'linear-gradient(135deg, #4c0dbf 0%, #5a6fd8 100%)',
                            boxShadow: '0 4px 12px rgba(94, 23, 235, 0.3)',
                          }
                        }}
                      >
                        設定を保存
                      </Button>
                    </Box>
                  </Box>
                </Box>
              )}
            </Paper>
          )}
        </Container>

        {/* サイクル設定確認ダイアログ */}
        <Dialog
          open={cycleConfirmDialogOpen}
          onClose={() => setCycleConfirmDialogOpen(false)}
          PaperProps={{
            sx: {
              borderRadius: 3,
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.15)',
              maxWidth: 440
            }
          }}
        >
          <DialogTitle sx={{
            fontWeight: 700,
            fontSize: '1.1rem',
            color: '#1a202c',
            pb: 1
          }}>
            設定変更の確認
          </DialogTitle>
          <DialogContent>
            <DialogContentText sx={{
              color: '#4b5563',
              fontSize: '0.9rem',
              lineHeight: 1.7
            }}>
              今月（{currentYear}年{currentMonth}月）は既に「<strong style={{ color: currentSurveyType?.color }}>{currentSurveyType?.fullLabel}</strong>」の項目で回答が収集されています。
              <br /><br />
              この設定は<strong>来月から</strong>適用されます。よろしいですか？
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
            <Button
              onClick={() => setCycleConfirmDialogOpen(false)}
              sx={{
                color: '#6b7280',
                fontWeight: 600,
                textTransform: 'none',
                px: 3,
                py: 1,
                borderRadius: 1.5,
                '&:hover': {
                  backgroundColor: 'rgba(107, 114, 128, 0.08)'
                }
              }}
            >
              キャンセル
            </Button>
            <Button
              onClick={() => {
                // TODO: サイクル設定をDBに保存する処理
                toast.success('設定を保存しました（来月から適用）');
                setCycleConfirmDialogOpen(false);
                setShowCycleSettings(false);
              }}
              sx={{
                background: 'linear-gradient(135deg, #5e17eb 0%, #667eea 100%)',
                color: 'white',
                fontWeight: 600,
                textTransform: 'none',
                px: 3,
                py: 1,
                borderRadius: 1.5,
                '&:hover': {
                  background: 'linear-gradient(135deg, #4c0dbf 0%, #5a6fd8 100%)',
                }
              }}
            >
              保存する
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </motion.div>
  );
}
