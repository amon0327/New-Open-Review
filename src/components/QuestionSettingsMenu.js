import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Switch,
  FormControlLabel,
  Button,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Stack,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Tooltip,
  Alert
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  DragHandle as DragHandleIcon,
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as RadioIcon,
  CheckBox as CheckboxIcon,
  TextFields as TextIcon,
  Notes as NotesIcon,
  ArrowDropDown as DropdownIcon,
  LinearScale as ScaleIcon,
  GridOn as MatrixIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

// 質問タイプのアイコンマッピング
const getQuestionTypeIcon = (typeId) => {
  const iconMap = {
    1: <TextIcon />,      // 短文テキスト
    2: <NotesIcon />,     // 長文テキスト
    3: <RadioIcon />,     // 単一選択
    4: <CheckboxIcon />,  // 複数選択
    5: <MatrixIcon />,    // 単一選択マトリックス
    6: <MatrixIcon />,    // 複数選択マトリックス
    7: <ScaleIcon />,     // リニアスケール
    8: <DropdownIcon />   // プルダウン
  };
  return iconMap[typeId] || <TextIcon />;
};

// 質問タイプ名のマッピング
const getQuestionTypeName = (typeId) => {
  const nameMap = {
    1: '短文テキスト',
    2: '長文テキスト',
    3: '単一選択',
    4: '複数選択',
    5: '単一選択マトリックス',
    6: '複数選択マトリックス',
    7: 'リニアスケール',
    8: 'プルダウン'
  };
  return nameMap[typeId] || '不明';
};

const QuestionSettingsMenu = ({
  questions = [],
  selectedQuestionId = null,
  onQuestionUpdate,
  onQuestionDelete,
  onQuestionSelect
}) => {
  const [expandedQuestions, setExpandedQuestions] = useState({});
  const [editingChoices, setEditingChoices] = useState({});

  // 選択された質問の取得
  const selectedQuestion = questions.find(q => q.id === selectedQuestionId);

  // 質問が選択されたときに自動展開
  useEffect(() => {
    if (selectedQuestionId) {
      setExpandedQuestions(prev => ({
        ...prev,
        [selectedQuestionId]: true
      }));
    }
  }, [selectedQuestionId]);

  // アコーディオンの展開/折りたたみ
  const handleAccordionToggle = (questionId) => {
    setExpandedQuestions(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
    
    // 質問を選択
    if (onQuestionSelect) {
      onQuestionSelect(questionId);
    }
  };

  // 質問の基本設定更新
  const handleQuestionUpdate = (questionId, field, value) => {
    if (onQuestionUpdate) {
      onQuestionUpdate(questionId, { [field]: value });
    }
  };

  // 選択肢の更新
  const handleChoicesUpdate = (questionId, choices) => {
    handleQuestionUpdate(questionId, 'choices', JSON.stringify(choices));
  };

  // 選択肢の追加
  const handleAddChoice = (questionId) => {
    const question = questions.find(q => q.id === questionId);
    const currentChoices = question.choices ? JSON.parse(question.choices) : [];
    const newChoices = [...currentChoices, `選択肢 ${currentChoices.length + 1}`];
    handleChoicesUpdate(questionId, newChoices);
  };

  // 選択肢の削除
  const handleRemoveChoice = (questionId, index) => {
    const question = questions.find(q => q.id === questionId);
    const currentChoices = question.choices ? JSON.parse(question.choices) : [];
    const newChoices = currentChoices.filter((_, i) => i !== index);
    handleChoicesUpdate(questionId, newChoices);
  };

  // 選択肢の編集
  const handleChoiceEdit = (questionId, index, value) => {
    const question = questions.find(q => q.id === questionId);
    const currentChoices = question.choices ? JSON.parse(question.choices) : [];
    const newChoices = [...currentChoices];
    newChoices[index] = value;
    handleChoicesUpdate(questionId, newChoices);
  };

  // スケール設定の更新
  const handleScaleUpdate = (questionId, field, value) => {
    const question = questions.find(q => q.id === questionId);
    const currentSettings = question.scale_settings ? JSON.parse(question.scale_settings) : {};
    const newSettings = { ...currentSettings, [field]: value };
    handleQuestionUpdate(questionId, 'scale_settings', JSON.stringify(newSettings));
  };

  // 質問タイプ別の設定UI
  const renderQuestionSettings = (question) => {
    const { question_types_id: typeId } = question;

    return (
      <Box sx={{ p: 2, pt: 0 }}>
        {/* 基本設定 */}
        <Stack spacing={2}>
          {/* 質問テキスト */}
          <TextField
            label="質問テキスト"
            value={question.question_text || ''}
            onChange={(e) => handleQuestionUpdate(question.id, 'question_text', e.target.value)}
            multiline
            rows={2}
            fullWidth
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                },
                '&.Mui-focused': {
                  backgroundColor: '#ffffff',
                }
              }
            }}
          />

          {/* 詳細テキスト */}
          <TextField
            label="詳細テキスト（任意）"
            value={question.detail_text || ''}
            onChange={(e) => handleQuestionUpdate(question.id, 'detail_text', e.target.value)}
            multiline
            rows={1}
            fullWidth
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                },
                '&.Mui-focused': {
                  backgroundColor: '#ffffff',
                }
              }
            }}
          />

          {/* 必須設定 */}
          <FormControlLabel
            control={
              <Switch
                checked={question.is_required || false}
                onChange={(e) => handleQuestionUpdate(question.id, 'is_required', e.target.checked)}
                color="primary"
              />
            }
            label="必須回答"
            sx={{
              '& .MuiFormControlLabel-label': {
                fontWeight: 500,
                color: '#374151'
              }
            }}
          />

          <Divider sx={{ my: 1 }} />

          {/* 質問タイプ別設定 */}
          {[3, 4, 8].includes(typeId) && (
            // 選択肢設定（単一選択、複数選択、プルダウン）
            <Box>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 600,
                  color: '#374151',
                  mb: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <CheckboxIcon sx={{ fontSize: '1rem', color: '#5e17eb' }} />
                選択肢
              </Typography>
              
              <Stack spacing={1}>
                {(question.choices ? JSON.parse(question.choices) : []).map((choice, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      p: 1,
                      backgroundColor: 'rgba(248, 250, 252, 0.8)',
                      borderRadius: 1,
                      border: '1px solid rgba(0, 0, 0, 0.06)'
                    }}
                  >
                    <DragHandleIcon sx={{ color: '#94a3b8', fontSize: '1rem' }} />
                    <TextField
                      value={choice}
                      onChange={(e) => handleChoiceEdit(question.id, index, e.target.value)}
                      size="small"
                      variant="outlined"
                      sx={{
                        flex: 1,
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: 'white',
                          height: '36px'
                        }
                      }}
                    />
                    <IconButton
                      size="small"
                      onClick={() => handleRemoveChoice(question.id, index)}
                      sx={{
                        color: '#ef4444',
                        '&:hover': {
                          backgroundColor: 'rgba(239, 68, 68, 0.1)'
                        }
                      }}
                    >
                      <DeleteIcon sx={{ fontSize: '1rem' }} />
                    </IconButton>
                  </Box>
                ))}
                
                <Button
                  startIcon={<AddIcon />}
                  onClick={() => handleAddChoice(question.id)}
                  variant="outlined"
                  size="small"
                  sx={{
                    mt: 1,
                    color: '#5e17eb',
                    borderColor: '#5e17eb',
                    '&:hover': {
                      backgroundColor: 'rgba(94, 23, 235, 0.05)',
                      borderColor: '#5e17eb'
                    }
                  }}
                >
                  選択肢を追加
                </Button>
              </Stack>
            </Box>
          )}

          {typeId === 7 && (
            // リニアスケール設定
            <Box>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 600,
                  color: '#374151',
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <ScaleIcon sx={{ fontSize: '1rem', color: '#5e17eb' }} />
                スケール設定
              </Typography>
              
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    label="最小値"
                    type="number"
                    value={question.scale_settings ? JSON.parse(question.scale_settings).minValue || 1 : 1}
                    onChange={(e) => handleScaleUpdate(question.id, 'minValue', parseInt(e.target.value))}
                    size="small"
                    sx={{ flex: 1 }}
                  />
                  <TextField
                    label="最大値"
                    type="number"
                    value={question.scale_settings ? JSON.parse(question.scale_settings).maxValue || 5 : 5}
                    onChange={(e) => handleScaleUpdate(question.id, 'maxValue', parseInt(e.target.value))}
                    size="small"
                    sx={{ flex: 1 }}
                  />
                </Box>
                
                <TextField
                  label="最小値ラベル"
                  value={question.scale_settings ? JSON.parse(question.scale_settings).minLabel || '' : ''}
                  onChange={(e) => handleScaleUpdate(question.id, 'minLabel', e.target.value)}
                  size="small"
                  fullWidth
                />
                
                <TextField
                  label="最大値ラベル"
                  value={question.scale_settings ? JSON.parse(question.scale_settings).maxLabel || '' : ''}
                  onChange={(e) => handleScaleUpdate(question.id, 'maxLabel', e.target.value)}
                  size="small"
                  fullWidth
                />
              </Stack>
            </Box>
          )}
        </Stack>
      </Box>
    );
  };

  if (!questions.length) {
    return (
      <Box
        sx={{
          p: 3,
          textAlign: 'center',
          color: '#64748b'
        }}
      >
        <Typography variant="body2">
          質問を追加すると、ここに設定項目が表示されます
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* ヘッダー */}
      <Box sx={{ p: 2, pb: 1 }}>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            background: 'linear-gradient(45deg, #5e17eb 30%, #764ba2 90%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 1
          }}
        >
          質問設定
        </Typography>
        
        {selectedQuestion && (
          <Alert
            severity="info"
            sx={{
              backgroundColor: 'rgba(94, 23, 235, 0.05)',
              border: '1px solid rgba(94, 23, 235, 0.2)',
              '& .MuiAlert-icon': {
                color: '#5e17eb'
              }
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 500 }}>
              選択中: {selectedQuestion.question_text || '無題の質問'}
            </Typography>
          </Alert>
        )}
      </Box>

      {/* 質問リスト */}
      <Box sx={{ flex: 1, overflow: 'auto', px: 1 }}>
        {questions.map((question, index) => (
          <motion.div
            key={question.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Accordion
              expanded={expandedQuestions[question.id] || false}
              onChange={() => handleAccordionToggle(question.id)}
              sx={{
                mb: 1,
                borderRadius: '8px !important',
                border: selectedQuestionId === question.id
                  ? '2px solid #5e17eb'
                  : '1px solid rgba(0, 0, 0, 0.06)',
                backgroundColor: selectedQuestionId === question.id
                  ? 'rgba(94, 23, 235, 0.02)'
                  : 'rgba(255, 255, 255, 0.9)',
                boxShadow: selectedQuestionId === question.id
                  ? '0 4px 20px rgba(94, 23, 235, 0.15)'
                  : '0 1px 3px rgba(0, 0, 0, 0.05)',
                '&:before': {
                  display: 'none'
                },
                '&.Mui-expanded': {
                  margin: '0 0 8px 0'
                }
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  minHeight: '56px',
                  '& .MuiAccordionSummary-content': {
                    alignItems: 'center',
                    gap: 1.5
                  }
                }}
              >
                {/* 質問タイプアイコン */}
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: 1,
                    background: selectedQuestionId === question.id
                      ? 'linear-gradient(135deg, #4c1d95 0%, #5b21b6 100%)'
                      : 'linear-gradient(135deg, #5e17eb 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: '0 2px 8px rgba(94, 23, 235, 0.3)'
                  }}
                >
                  {React.cloneElement(getQuestionTypeIcon(question.question_types_id), {
                    sx: { color: 'white', fontSize: '1rem' }
                  })}
                </Box>

                {/* 質問情報 */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      color: selectedQuestionId === question.id ? '#5e17eb' : '#374151',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {question.question_text || '無題の質問'}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      mt: 0.2
                    }}
                  >
                    {getQuestionTypeName(question.question_types_id)}
                    {question.is_required && (
                      <Chip
                        label="必須"
                        size="small"
                        sx={{
                          height: 16,
                          fontSize: '0.65rem',
                          fontWeight: 500,
                          backgroundColor: '#ef4444',
                          color: 'white'
                        }}
                      />
                    )}
                  </Typography>
                </Box>

                {/* 削除ボタン */}
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onQuestionDelete) {
                      onQuestionDelete(question.id);
                    }
                  }}
                  sx={{
                    color: '#ef4444',
                    opacity: 0.7,
                    '&:hover': {
                      opacity: 1,
                      backgroundColor: 'rgba(239, 68, 68, 0.1)'
                    }
                  }}
                >
                  <DeleteIcon sx={{ fontSize: '1rem' }} />
                </IconButton>
              </AccordionSummary>

              <AccordionDetails sx={{ pt: 0 }}>
                {renderQuestionSettings(question)}
              </AccordionDetails>
            </Accordion>
          </motion.div>
        ))}
      </Box>
    </Box>
  );
};

export default QuestionSettingsMenu;