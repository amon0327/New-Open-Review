import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Card,
  Typography,
  Grid,
  Alert,
  CircularProgress,
  Button,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import {
  CategoryOutlined,
  SaveOutlined,
  RestaurantOutlined,
  CleaningServicesOutlined,
  SupportAgentOutlined
} from '@mui/icons-material';
import { FormDataService } from '../../services/FormDataService';

// QSCテーマの定義
const QSC_THEMES = [
  {
    value: 'quality',
    label: 'Quality',
    description: '品質・クオリティ',
    icon: RestaurantOutlined,
    color: '#10b981'
  },
  {
    value: 'service',
    label: 'Service',
    description: 'サービス・接客',
    icon: SupportAgentOutlined,
    color: '#3b82f6'
  },
  {
    value: 'cleanliness',
    label: 'Cleanliness',
    description: '清潔さ・衛生',
    icon: CleaningServicesOutlined,
    color: '#8b5cf6'
  }
];

const QSCThemeSettings = ({
  formId,
  initialTheme = null,
  onThemeUpdate
}) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);

  // 元データ（保存済みデータ）
  const [originalTheme, setOriginalTheme] = useState(null);

  // 編集中データ
  const [selectedTheme, setSelectedTheme] = useState(null);

  useEffect(() => {
    if (formId) {
      loadThemeData();
    }
  }, [formId]);

  const loadThemeData = async () => {
    try {
      setLoading(true);
      setError(null);

      // review_formsテーブルからqsc_themeを取得
      const result = await FormDataService.getFormBasicData(formId);

      if (result.success && result.data) {
        // getFormBasicDataにqsc_themeが含まれていない場合があるので、直接取得
        const { data, error } = await FormDataService.getFormDetails(formId);
        if (data && data.qsc_theme) {
          setSelectedTheme(data.qsc_theme);
          setOriginalTheme(data.qsc_theme);
        } else {
          setSelectedTheme(null);
          setOriginalTheme(null);
        }
      }

      setHasChanges(false);
    } catch (err) {
      setError('QSCテーマの読み込みに失敗しました');
      console.error('QSC theme load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleThemeChange = (event, newTheme) => {
    if (newTheme !== null) {
      setSelectedTheme(newTheme);
      setSuccessMessage(null);
      setHasChanges(newTheme !== originalTheme);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      const result = await FormDataService.updateForm(formId, {
        qsc_theme: selectedTheme
      });

      if (result.success) {
        setOriginalTheme(selectedTheme);
        setHasChanges(false);
        setSuccessMessage('QSCテーマを保存しました');

        if (onThemeUpdate) {
          await onThemeUpdate(selectedTheme);
        }
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      setError('QSCテーマの保存に失敗しました');
      console.error('QSC theme save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setSelectedTheme(originalTheme);
    setHasChanges(false);
    setError(null);
    setSuccessMessage(null);
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
      transition={{ duration: 0.3, delay: 0.1 }}
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
              background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 2
            }}
          >
            <CategoryOutlined sx={{ color: 'white', fontSize: '1.2rem' }} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
              QSCテーマ設定
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              レビューフォームのテーマカテゴリを設定
            </Typography>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {successMessage && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {successMessage}
          </Alert>
        )}

        {/* テーマ選択 */}
        <Typography
          variant="subtitle2"
          sx={{ mb: 2, fontWeight: 600, color: '#374151' }}
        >
          テーマを選択
        </Typography>

        <ToggleButtonGroup
          value={selectedTheme}
          exclusive
          onChange={handleThemeChange}
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 2,
            '& .MuiToggleButtonGroup-grouped': {
              border: '2px solid #e2e8f0 !important',
              borderRadius: '12px !important',
              margin: 0
            }
          }}
        >
          {QSC_THEMES.map((theme) => {
            const IconComponent = theme.icon;
            const isSelected = selectedTheme === theme.value;

            return (
              <ToggleButton
                key={theme.value}
                value={theme.value}
                sx={{
                  flex: '1 1 calc(33.333% - 16px)',
                  minWidth: 140,
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 1,
                  textTransform: 'none',
                  backgroundColor: isSelected ? `${theme.color}10` : 'white',
                  borderColor: isSelected ? `${theme.color} !important` : '#e2e8f0',
                  '&:hover': {
                    backgroundColor: `${theme.color}08`,
                    borderColor: theme.color
                  },
                  '&.Mui-selected': {
                    backgroundColor: `${theme.color}15`,
                    borderColor: `${theme.color} !important`,
                    '&:hover': {
                      backgroundColor: `${theme.color}20`
                    }
                  }
                }}
              >
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '12px',
                    backgroundColor: isSelected ? theme.color : '#f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <IconComponent
                    sx={{
                      fontSize: 24,
                      color: isSelected ? 'white' : '#64748b'
                    }}
                  />
                </Box>
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 600,
                    color: isSelected ? theme.color : '#374151'
                  }}
                >
                  {theme.label}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: '#64748b' }}
                >
                  {theme.description}
                </Typography>
              </ToggleButton>
            );
          })}
        </ToggleButtonGroup>

        {/* 現在の選択 */}
        {selectedTheme && (
          <Box
            sx={{
              mt: 3,
              p: 2,
              borderRadius: 2,
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0'
            }}
          >
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              現在の選択: <strong style={{ color: QSC_THEMES.find(t => t.value === selectedTheme)?.color }}>
                {QSC_THEMES.find(t => t.value === selectedTheme)?.label}
              </strong>
              {' - '}
              {QSC_THEMES.find(t => t.value === selectedTheme)?.description}
            </Typography>
          </Box>
        )}

        {!selectedTheme && (
          <Box
            sx={{
              mt: 3,
              p: 2,
              borderRadius: 2,
              backgroundColor: '#fef3c7',
              border: '1px solid #fbbf24'
            }}
          >
            <Typography variant="body2" sx={{ color: '#92400e' }}>
              テーマが未設定です。Quality、Service、Cleanlinessのいずれかを選択してください。
            </Typography>
          </Box>
        )}

        {/* 保存ボタン */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
          {hasChanges && (
            <Button
              variant="outlined"
              onClick={handleCancel}
              sx={{
                borderColor: '#e2e8f0',
                color: '#64748b',
                '&:hover': {
                  borderColor: '#cbd5e1',
                  backgroundColor: '#f8fafc'
                }
              }}
            >
              キャンセル
            </Button>
          )}
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={!hasChanges || saving}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveOutlined />}
            sx={{
              background: hasChanges ? 'linear-gradient(135deg, #5e17eb 0%, #7c3aed 100%)' : '#e2e8f0',
              color: hasChanges ? 'white' : '#94a3b8',
              '&:hover': {
                background: hasChanges ? 'linear-gradient(135deg, #4c0fd9 0%, #6d28d9 100%)' : '#e2e8f0'
              },
              '&.Mui-disabled': {
                background: '#e2e8f0',
                color: '#94a3b8'
              }
            }}
          >
            {saving ? '保存中...' : '設定を保存'}
          </Button>
        </Box>
      </Card>
    </motion.div>
  );
};

export default QSCThemeSettings;
