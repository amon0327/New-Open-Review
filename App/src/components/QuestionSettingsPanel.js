import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Switch,
  FormControlLabel,
  Button,
  IconButton,
  Divider,
  Stack,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Slider,
  Paper,
  Collapse,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  TextFields as ShortTextIcon,
  Subject as LongTextIcon,
  RadioButtonChecked as SingleChoiceIcon,
  CheckBox as MultipleChoiceIcon,
  GridOn as MatrixIcon,
  LinearScale as ScaleIcon,
  ArrowDropDown as DropdownIcon,
  DragIndicator as DragIcon,
  Settings as SettingsIcon,
  Quiz as QuizIcon,
  ContentCopy as CopyIcon,
  Visibility as PreviewIcon,
  Save as SaveIcon,
  KeyboardArrowUp,
  KeyboardArrowDown
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

// 質問タイプのアイコンマッピング
const getQuestionTypeIcon = (typeId) => {
  const iconMap = {
    1: <ShortTextIcon />,
    2: <LongTextIcon />,
    3: <SingleChoiceIcon />,
    4: <MultipleChoiceIcon />,
    5: <MatrixIcon />,
    6: <MatrixIcon />,
    7: <ScaleIcon />,
    8: <DropdownIcon />,
    9: <SingleChoiceIcon />,
    10: <MultipleChoiceIcon />
  };
  return iconMap[typeId] || <ShortTextIcon />;
};

// 質問タイプ名のマッピング
const getQuestionTypeName = (typeId) => {
  const typeMap = {
    1: '短文テキスト',
    2: '長文テキスト',
    3: '単一選択',
    4: '複数選択',
    5: '単一選択マトリックス',
    6: '複数選択マトリックス',
    7: 'リニアスケール',
    8: 'プルダウン',
    9: '単一選択(2列)',
    10: '複数選択(2列)'
  };
  return typeMap[typeId] || '不明';
};

// 質問タイプの説明
const getQuestionTypeDescription = (typeId) => {
  const descMap = {
    1: '一行のテキスト入力フィールド',
    2: '複数行のテキスト入力エリア',
    3: 'ラジオボタンで一つだけ選択',
    4: 'チェックボックスで複数選択可能',
    5: '行と列のマトリックス形式で単一選択',
    6: '行と列のマトリックス形式で複数選択',
    7: '数値スケールでの評価',
    8: 'ドロップダウンリストから選択',
    9: 'ラジオボタンで一つだけ選択（2列表示）',
    10: 'チェックボックスで複数選択可能（2列表示）'
  };
  return descMap[typeId] || '';
};

// 選択肢編集コンポーネント
const ChoicesEditor = ({ choices, onChange, disabled = false }) => {
  const handleAddChoice = () => {
    onChange([...choices, `選択肢 ${choices.length + 1}`]);
  };

  const handleUpdateChoice = (index, value) => {
    const updated = [...choices];
    updated[index] = value;
    onChange(updated);
  };

  const handleRemoveChoice = (index) => {
    if (choices.length > 1) {
      onChange(choices.filter((_, i) => i !== index));
    }
  };

  const handleMoveChoice = (index, direction) => {
    if ((direction === 'up' && index > 0) || (direction === 'down' && index < choices.length - 1)) {
      const updated = [...choices];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      [updated[index], updated[targetIndex]] = [updated[targetIndex], updated[index]];
      onChange(updated);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="body2" sx={{ fontWeight: 600, color: '#374151' }}>
          選択肢設定
        </Typography>
        {!disabled && (
          <Button
            size="small"
            startIcon={<AddIcon />}
            onClick={handleAddChoice}
            sx={{
              color: '#5e17eb',
              textTransform: 'none',
              fontSize: '0.8rem',
              fontWeight: 500,
              '&:hover': { backgroundColor: 'rgba(94, 23, 235, 0.08)' }
            }}
          >
            追加
          </Button>
        )}
      </Box>
      
      <Stack spacing={1}>
        <AnimatePresence>
          {choices.map((choice, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Paper
                elevation={0}
                sx={{
                  p: 1.5,
                  border: '1px solid #e5e7eb',
                  borderRadius: 2,
                  backgroundColor: '#fafafa',
                  '&:hover': !disabled ? { borderColor: '#5e17eb', backgroundColor: '#f8f9ff' } : {}
                }}
              >
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Typography
                    variant="caption"
                    sx={{
                      minWidth: 24,
                      height: 24,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#5e17eb',
                      color: 'white',
                      borderRadius: 1,
                      fontSize: '0.7rem',
                      fontWeight: 600
                    }}
                  >
                    {index + 1}
                  </Typography>
                  <TextField
                    fullWidth
                    value={choice}
                    onChange={(e) => handleUpdateChoice(index, e.target.value)}
                    placeholder={`選択肢 ${index + 1}`}
                    disabled={disabled}
                    variant="outlined"
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: disabled ? '#f1f5f9' : 'white',
                        fontSize: '0.85rem',
                        '& fieldset': { borderColor: 'transparent' },
                        '&:hover fieldset': { borderColor: disabled ? 'transparent' : '#5e17eb' },
                        '&.Mui-focused fieldset': { borderColor: '#5e17eb' }
                      }
                    }}
                  />
                  {!disabled && (
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                      <IconButton
                        size="small"
                        onClick={() => handleMoveChoice(index, 'up')}
                        disabled={index === 0}
                        sx={{ p: 0.25, color: '#6b7280' }}
                      >
                        <KeyboardArrowUp fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleMoveChoice(index, 'down')}
                        disabled={index === choices.length - 1}
                        sx={{ p: 0.25, color: '#6b7280' }}
                      >
                        <KeyboardArrowDown fontSize="small" />
                      </IconButton>
                    </Box>
                  )}
                  {!disabled && choices.length > 1 && (
                    <IconButton
                      size="small"
                      onClick={() => handleRemoveChoice(index)}
                      sx={{
                        color: '#ef4444',
                        '&:hover': { backgroundColor: 'rgba(239, 68, 68, 0.1)' }
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  )}
                </Box>
              </Paper>
            </motion.div>
          ))}
        </AnimatePresence>
      </Stack>
    </Box>
  );
};

// スケール設定コンポーネント
const ScaleSettings = ({ settings, onChange, disabled = false }) => {
  const handleChange = (key, value) => {
    onChange({ ...settings, [key]: value });
  };

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="body2" sx={{ fontWeight: 600, color: '#374151', mb: 2 }}>
          スケール範囲
        </Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          <Box sx={{ minWidth: 80 }}>
            <TextField
              label="最小値"
              type="number"
              value={settings.minValue || 1}
              onChange={(e) => handleChange('minValue', parseInt(e.target.value) || 1)}
              disabled={disabled}
              size="small"
              variant="outlined"
              sx={{ '& .MuiOutlinedInput-root': { fontSize: '0.85rem' } }}
            />
          </Box>
          <Typography variant="body2" color="text.secondary">〜</Typography>
          <Box sx={{ minWidth: 80 }}>
            <TextField
              label="最大値"
              type="number"
              value={settings.maxValue || 5}
              onChange={(e) => handleChange('maxValue', parseInt(e.target.value) || 5)}
              disabled={disabled}
              size="small"
              variant="outlined"
              sx={{ '& .MuiOutlinedInput-root': { fontSize: '0.85rem' } }}
            />
          </Box>
        </Stack>
      </Box>

      <Box>
        <Typography variant="body2" sx={{ fontWeight: 600, color: '#374151', mb: 2 }}>
          ラベル設定
        </Typography>
        <Stack spacing={2}>
          <TextField
            label="最小値ラベル"
            value={settings.minLabel || ''}
            onChange={(e) => handleChange('minLabel', e.target.value)}
            disabled={disabled}
            size="small"
            placeholder="例: 全くそう思わない"
            variant="outlined"
            sx={{ '& .MuiOutlinedInput-root': { fontSize: '0.85rem' } }}
          />
          <TextField
            label="最大値ラベル"
            value={settings.maxLabel || ''}
            onChange={(e) => handleChange('maxLabel', e.target.value)}
            disabled={disabled}
            size="small"
            placeholder="例: とてもそう思う"
            variant="outlined"
            sx={{ '& .MuiOutlinedInput-root': { fontSize: '0.85rem' } }}
          />
        </Stack>
      </Box>
    </Stack>
  );
};

// 個別質問設定コンポーネント
const QuestionSettingsCard = ({ question, onUpdate, onDelete, onDuplicate, isExpanded, onToggleExpand, questionErrorHighlight }) => {
  const [localQuestion, setLocalQuestion] = useState(question);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setLocalQuestion(question);
    setHasChanges(false);
  }, [question]);

  const handleLocalChange = (key, value) => {
    setLocalQuestion(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    onUpdate(localQuestion);
    setHasChanges(false);
  };

  const handleReset = () => {
    setLocalQuestion(question);
    setHasChanges(false);
  };

  const choices = localQuestion.choices ? JSON.parse(localQuestion.choices) : [];
  const typeId = parseInt(localQuestion.question_types_id);
  
  // Supabaseから取得した質問タイプデータを使用して動的に判定（将来的な拡張のため）
  // 現在は基本的な数値ベース判定を維持
  const needsChoices = [3, 4, 8, 10].includes(typeId);
  const needsMatrix = [5, 6].includes(typeId);
  const needsScale = [7, 9].includes(typeId);
  const scaleSettings = localQuestion.scale_settings ? JSON.parse(localQuestion.scale_settings) : {};
  


  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Paper
        elevation={2}
        sx={{
          mb: 2,
          borderRadius: 3,
          overflow: 'hidden',
          border: isExpanded ? '2px solid #5e17eb' : '1px solid #e5e7eb',
          transition: 'all 0.3s ease',
          '&:hover': {
            borderColor: '#5e17eb',
            boxShadow: '0 4px 20px rgba(94, 23, 235, 0.15)'
          }
        }}
      >
        {/* ヘッダー */}
        <Box
          onClick={onToggleExpand}
          sx={{
            p: 2,
            background: isExpanded 
              ? 'linear-gradient(135deg, #5e17eb 0%, #764ba2 100%)'
              : 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
            color: isExpanded ? 'white' : '#374151',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            '&:hover': {
              background: isExpanded 
                ? 'linear-gradient(135deg, #4c1d95 0%, #6b46c1 100%)'
                : 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)'
            }
          }}
        >
          <Stack direction="row" alignItems="center" spacing={2}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                background: isExpanded 
                  ? 'rgba(255, 255, 255, 0.2)' 
                  : `linear-gradient(135deg, ${
                      ['#667eea', '#ff9a9e', '#a8edea', '#fed6e3', '#d299c2', '#89f7fe', '#66a6ff'][(typeId - 1) % 7]
                    } 0%, ${
                      ['#764ba2', '#fecfef', '#d299c2', '#d8edea', '#fecfef', '#bfe9ff', '#8aa7ff'][(typeId - 1) % 7]
                    } 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isExpanded ? 'white' : 'white',
                flexShrink: 0,
                boxShadow: isExpanded ? 'none' : '0 4px 12px rgba(0, 0, 0, 0.15)'
              }}
            >
              {getQuestionTypeIcon(typeId)}
            </Box>
            
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  fontWeight: 600, 
                  fontSize: '0.95rem',
                  mb: 0.5,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {localQuestion.question_text || '新しい質問'}
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip
                  label={getQuestionTypeName(typeId)}
                  size="small"
                  sx={{
                    backgroundColor: isExpanded ? 'rgba(255, 255, 255, 0.2)' : 'rgba(94, 23, 235, 0.1)',
                    color: isExpanded ? 'white' : '#5e17eb',
                    fontWeight: 500,
                    fontSize: '0.7rem',
                    height: 20
                  }}
                />
                {localQuestion.is_required && (
                  <Chip
                    label="必須"
                    size="small"
                    sx={{
                      backgroundColor: isExpanded ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)',
                      color: isExpanded ? 'white' : '#ef4444',
                      fontWeight: 500,
                      fontSize: '0.7rem',
                      height: 20
                    }}
                  />
                )}
                {hasChanges && (
                  <Chip
                    label="未保存"
                    size="small"
                    sx={{
                      backgroundColor: isExpanded ? 'rgba(251, 191, 36, 0.2)' : 'rgba(251, 191, 36, 0.1)',
                      color: isExpanded ? 'white' : '#f59e0b',
                      fontWeight: 500,
                      fontSize: '0.7rem',
                      height: 20
                    }}
                  />
                )}
              </Stack>
            </Box>

            <Stack direction="row" spacing={0.5}>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate(question);
                }}
                sx={{
                  color: isExpanded ? 'rgba(255, 255, 255, 0.8)' : '#6b7280',
                  '&:hover': { 
                    backgroundColor: isExpanded ? 'rgba(255, 255, 255, 0.1)' : 'rgba(107, 114, 128, 0.1)',
                    color: isExpanded ? 'white' : '#374151'
                  }
                }}
              >
                <CopyIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(question.id);
                }}
                sx={{
                  color: isExpanded ? 'rgba(255, 255, 255, 0.8)' : '#ef4444',
                  '&:hover': { 
                    backgroundColor: isExpanded ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)',
                    color: isExpanded ? 'white' : '#dc2626'
                  }
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
              <ExpandMoreIcon
                sx={{
                  ml: 1,
                  transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.3s ease',
                  color: isExpanded ? 'rgba(255, 255, 255, 0.8)' : '#6b7280'
                }}
              />
            </Stack>
          </Stack>
        </Box>

        {/* 設定詳細 */}
        <Collapse in={isExpanded} timeout={300}>
          <Box sx={{ p: 3, backgroundColor: '#fafafa' }}>
            <Stack spacing={3}>
              {/* 基本設定 */}
              <Box>
                <Typography variant="h6" sx={{ color: '#374151', fontWeight: 600, mb: 2, fontSize: '1rem' }}>
                  基本設定
                </Typography>
                <Stack spacing={2}>
                  <TextField
                    label="質問文"
                    fullWidth
                    value={localQuestion.question_text}
                    onChange={(e) => handleLocalChange('question_text', e.target.value)}
                    placeholder="質問を入力してください"
                    variant="outlined"
                    size="small"
                    sx={{ 
                      '& .MuiOutlinedInput-root': { 
                        fontSize: '0.9rem',
                        ...(questionErrorHighlight === `missing-question-text-${localQuestion.id}` && {
                          '& fieldset': {
                            borderColor: '#ef4444',
                            borderWidth: '2px',
                            animation: 'errorPulse 2s ease-in-out'
                          },
                          backgroundColor: 'rgba(239, 68, 68, 0.05)',
                          '@keyframes errorPulse': {
                            '0%': { borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.05)' },
                            '50%': { borderColor: '#dc2626', backgroundColor: 'rgba(239, 68, 68, 0.1)' },
                            '100%': { borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.05)' }
                          }
                        })
                      }
                    }}
                  />
                  <TextField
                    label="詳細説明（任意）"
                    fullWidth
                    multiline
                    rows={2}
                    value={localQuestion.detail_text || ''}
                    onChange={(e) => handleLocalChange('detail_text', e.target.value)}
                    placeholder="質問の詳細や補足説明を入力してください"
                    variant="outlined"
                    size="small"
                    sx={{ '& .MuiOutlinedInput-root': { fontSize: '0.85rem' } }}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={localQuestion.is_required}
                        onChange={(e) => handleLocalChange('is_required', e.target.checked)}
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': {
                            color: '#5e17eb',
                            '& + .MuiSwitch-track': { backgroundColor: '#5e17eb' }
                          }
                        }}
                      />
                    }
                    label={
                      <Typography variant="body2" sx={{ fontWeight: 500, color: '#374151' }}>
                        必須回答
                      </Typography>
                    }
                  />
                </Stack>
              </Box>

              <Divider />

              {/* 質問タイプ固有の設定 */}
              {needsChoices && (
                <ChoicesEditor
                  choices={choices}
                  onChange={(newChoices) => handleLocalChange('choices', JSON.stringify(newChoices))}
                />
              )}

              {needsScale && (
                <Box>
                  <Typography variant="h6" sx={{ color: '#374151', fontWeight: 600, mb: 2, fontSize: '1rem' }}>
                    スケール設定
                  </Typography>
                  <ScaleSettings
                    settings={scaleSettings}
                    onChange={(newSettings) => handleLocalChange('scale_settings', JSON.stringify(newSettings))}
                  />
                </Box>
              )}

              {needsMatrix && (
                <Box>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    マトリックス設定は今後実装予定です
                  </Alert>
                </Box>
              )}

              {/* 保存・リセットボタン */}
              {hasChanges && (
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', pt: 1 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleReset}
                    sx={{
                      color: '#6b7280',
                      borderColor: '#d1d5db',
                      textTransform: 'none',
                      fontWeight: 500
                    }}
                  >
                    リセット
                  </Button>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={handleSave}
                    startIcon={<SaveIcon />}
                    sx={{
                      backgroundColor: '#5e17eb',
                      textTransform: 'none',
                      fontWeight: 500,
                      '&:hover': { backgroundColor: '#4c1d95' }
                    }}
                  >
                    保存
                  </Button>
                </Box>
              )}
            </Stack>
          </Box>
        </Collapse>
      </Paper>
    </motion.div>
  );
};

// メインコンポーネント
const QuestionSettingsPanel = ({ selectedPage, questions = [], onUpdateQuestions, questionErrorHighlight }) => {
  const [expandedQuestion, setExpandedQuestion] = useState(null);
  const [newQuestionType, setNewQuestionType] = useState(1);

  const handleToggleExpand = (questionId) => {
    setExpandedQuestion(expandedQuestion === questionId ? null : questionId);
  };

  const handleAddQuestion = () => {
    const newQuestion = {
      id: Date.now(),
      question_types_id: newQuestionType,
      question_text: '',
      detail_text: '',
      is_required: false,
      choices: needsChoices(newQuestionType) ? JSON.stringify(['選択肢 1', '選択肢 2']) : null,
      scale_settings: [7, 9].includes(newQuestionType) ? JSON.stringify({ minValue: 1, maxValue: 5, minLabel: '', maxLabel: '' }) : null
    };
    onUpdateQuestions([...questions, newQuestion]);
    setExpandedQuestion(newQuestion.id);
  };

  const handleUpdateQuestion = (updatedQuestion) => {
    const updatedQuestions = questions.map(q => 
      q.id === updatedQuestion.id ? updatedQuestion : q
    );
    onUpdateQuestions(updatedQuestions);
  };

  const handleDeleteQuestion = (questionId) => {
    const updatedQuestions = questions.filter(q => q.id !== questionId);
    onUpdateQuestions(updatedQuestions);
    if (expandedQuestion === questionId) {
      setExpandedQuestion(null);
    }
  };

  const handleDuplicateQuestion = (originalQuestion) => {
    const duplicatedQuestion = {
      ...originalQuestion,
      id: Date.now(),
      question_text: `${originalQuestion.question_text} (コピー)`
    };
    onUpdateQuestions([...questions, duplicatedQuestion]);
    setExpandedQuestion(duplicatedQuestion.id);
  };

  const needsChoices = (typeId) => [3, 4, 8, 10].includes(typeId);

  if (!selectedPage || selectedPage.type === 'system') {
    return (
      <Box sx={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
        p: 3,
        textAlign: 'center'
      }}>
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: 3,
            background: 'linear-gradient(135deg, #5e17eb 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 1
          }}
        >
          <QuizIcon sx={{ color: 'white', fontSize: '2rem' }} />
        </Box>
        <Typography variant="h6" sx={{ color: '#374151', fontWeight: 600 }}>
          質問設定
        </Typography>
        <Typography variant="body2" sx={{ color: '#6b7280', maxWidth: 200 }}>
          {!selectedPage 
            ? 'ページを選択してください' 
            : 'システムページは編集できません'
          }
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* ヘッダー */}
      <Box sx={{ p: 2, borderBottom: '1px solid #e5e7eb', backgroundColor: 'white' }}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: 1.5,
              background: 'linear-gradient(135deg, #5e17eb 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <QuizIcon sx={{ color: 'white', fontSize: '1.2rem' }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ color: '#374151', fontWeight: 600, fontSize: '1.1rem' }}>
              質問設定
            </Typography>
            <Typography variant="body2" sx={{ color: '#6b7280', fontSize: '0.85rem' }}>
              {selectedPage.title}
            </Typography>
          </Box>
        </Stack>

        {/* 質問追加 */}
        <Stack direction="row" spacing={1} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel sx={{ fontSize: '0.85rem' }}>質問タイプ</InputLabel>
            <Select
              value={newQuestionType}
              onChange={(e) => setNewQuestionType(e.target.value)}
              label="質問タイプ"
              sx={{ fontSize: '0.85rem' }}
            >
              <MenuItem value={1}>短文テキスト</MenuItem>
              <MenuItem value={2}>長文テキスト</MenuItem>
              <MenuItem value={3}>単一選択</MenuItem>
              <MenuItem value={4}>複数選択</MenuItem>
              <MenuItem value={9}>単一選択(2列)</MenuItem>
              <MenuItem value={10}>複数選択(2列)</MenuItem>
              <MenuItem value={5}>単一選択マトリックス</MenuItem>
              <MenuItem value={6}>複数選択マトリックス</MenuItem>
              <MenuItem value={7}>リニアスケール</MenuItem>
              <MenuItem value={8}>プルダウン</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddQuestion}
            sx={{
              backgroundColor: '#5e17eb',
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '0.85rem',
              '&:hover': { backgroundColor: '#4c1d95' }
            }}
          >
            質問追加
          </Button>
        </Stack>
      </Box>

      {/* 質問一覧 */}
      <Box sx={{ 
        flex: 1, 
        overflow: 'auto', 
        p: 2,
        backgroundColor: '#f8fafc',
        '&::-webkit-scrollbar': { width: '6px' },
        '&::-webkit-scrollbar-track': { background: '#f1f5f9' },
        '&::-webkit-scrollbar-thumb': { 
          background: '#cbd5e1', 
          borderRadius: '3px',
          '&:hover': { background: '#94a3b8' }
        }
      }}>
        {questions.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Box
              sx={{
                width: 60,
                height: 60,
                borderRadius: 2,
                background: 'linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2
              }}
            >
              <QuizIcon sx={{ color: '#9ca3af', fontSize: '1.5rem' }} />
            </Box>
            <Typography variant="body1" sx={{ color: '#374151', fontWeight: 500, mb: 1 }}>
              質問がありません
            </Typography>
            <Typography variant="body2" sx={{ color: '#6b7280', maxWidth: 200, mx: 'auto' }}>
              上のボタンから質問を追加してください
            </Typography>
          </Box>
        ) : (
          <AnimatePresence>
            {questions.map((question) => (
              <QuestionSettingsCard
                key={question.id}
                question={question}
                onUpdate={handleUpdateQuestion}
                onDelete={handleDeleteQuestion}
                onDuplicate={handleDuplicateQuestion}
                isExpanded={expandedQuestion === question.id}
                onToggleExpand={() => handleToggleExpand(question.id)}
                questionErrorHighlight={questionErrorHighlight}
              />
            ))}
          </AnimatePresence>
        )}
      </Box>
    </Box>
  );
};

export default QuestionSettingsPanel;