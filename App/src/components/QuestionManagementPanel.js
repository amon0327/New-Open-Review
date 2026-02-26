import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Switch,
  FormControlLabel,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Chip,
  Stack,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  DragIndicator as DragIcon,
  TextFields as ShortTextIcon,
  Subject as LongTextIcon,
  RadioButtonChecked as SingleChoiceIcon,
  CheckBox as MultipleChoiceIcon,
  GridOn as MatrixIcon,
  LinearScale as ScaleIcon,
  ArrowDropDown as DropdownIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { usePartnerTheme } from '../contexts/PartnerThemeContext';

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
    8: <DropdownIcon />
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
    8: 'プルダウン'
  };
  return typeMap[typeId] || '不明';
};

// 質問設定コンポーネント
const QuestionSettings = ({ question, onUpdate, onDelete }) => {
  const theme = usePartnerTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [tempQuestion, setTempQuestion] = useState(question);

  const handleSave = () => {
    onUpdate(tempQuestion);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempQuestion(question);
    setIsEditing(false);
  };

  const addChoice = () => {
    const choices = tempQuestion.choices ? JSON.parse(tempQuestion.choices) : [];
    choices.push(`選択肢 ${choices.length + 1}`);
    setTempQuestion({ ...tempQuestion, choices: JSON.stringify(choices) });
  };

  const updateChoice = (index, value) => {
    const choices = JSON.parse(tempQuestion.choices);
    choices[index] = value;
    setTempQuestion({ ...tempQuestion, choices: JSON.stringify(choices) });
  };

  const removeChoice = (index) => {
    const choices = JSON.parse(tempQuestion.choices);
    choices.splice(index, 1);
    setTempQuestion({ ...tempQuestion, choices: JSON.stringify(choices) });
  };

  const choices = tempQuestion.choices ? JSON.parse(tempQuestion.choices) : [];
  const needsChoices = [3, 4, 8].includes(tempQuestion.question_types_id);

  return (
    <Accordion
      sx={{
        mb: 2,
        borderRadius: '12px !important',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        border: '1px solid rgba(0,0,0,0.08)',
        '&:before': { display: 'none' },
        '&.Mui-expanded': {
          boxShadow: '0 4px 16px rgba(94, 23, 235, 0.12)',
          borderColor: theme.primaryAlpha20
        }
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{
          minHeight: '64px',
          '& .MuiAccordionSummary-content': {
            alignItems: 'center',
            gap: 2
          }
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            background: `linear-gradient(135deg, ${
              [theme.accent, '#ff9a9e', '#a8edea', '#fed6e3', '#d299c2', '#89f7fe', '#66a6ff'][(tempQuestion.question_types_id - 1) % 7]
            } 0%, ${
              [theme.secondary, '#fecfef', '#d299c2', '#d8edea', '#fecfef', '#bfe9ff', '#8aa7ff'][(tempQuestion.question_types_id - 1) % 7]
            } 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            flexShrink: 0,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
          }}
        >
          {getQuestionTypeIcon(tempQuestion.question_types_id)}
        </Box>
        
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#2d3748' }}>
            {tempQuestion.question_text || '新しい質問'}
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
            <Chip
              label={getQuestionTypeName(tempQuestion.question_types_id)}
              size="small"
              sx={{
                backgroundColor: theme.primaryAlpha10,
                color: theme.primary,
                fontWeight: 500
              }}
            />
            {tempQuestion.is_required && (
              <Chip
                label="必須"
                size="small"
                color="error"
                variant="outlined"
              />
            )}
          </Stack>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(!isEditing);
            }}
            sx={{
              color: isEditing ? theme.primary : '#64748b',
              backgroundColor: isEditing ? theme.primaryAlpha10 : 'transparent'
            }}
          >
            {isEditing ? <CancelIcon /> : <EditIcon />}
          </IconButton>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(question.id);
            }}
            sx={{
              color: '#ef4444',
              '&:hover': { backgroundColor: 'rgba(239, 68, 68, 0.1)' }
            }}
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      </AccordionSummary>

      <AccordionDetails sx={{ pt: 0 }}>
        <Stack spacing={3}>
          {/* 質問文 */}
          <Box>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#374151' }}>
              質問文
            </Typography>
            <TextField
              fullWidth
              value={tempQuestion.question_text}
              onChange={(e) => setTempQuestion({ ...tempQuestion, question_text: e.target.value })}
              placeholder="質問を入力してください"
              disabled={!isEditing}
              variant="outlined"
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: isEditing ? '#f8fafc' : '#f1f5f9'
                }
              }}
            />
          </Box>

          {/* 詳細文 */}
          <Box>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#374151' }}>
              詳細文（任意）
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={2}
              value={tempQuestion.detail_text || ''}
              onChange={(e) => setTempQuestion({ ...tempQuestion, detail_text: e.target.value })}
              placeholder="質問の詳細や補足説明を入力してください"
              disabled={!isEditing}
              variant="outlined"
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: isEditing ? '#f8fafc' : '#f1f5f9'
                }
              }}
            />
          </Box>

          {/* 必須設定 */}
          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={tempQuestion.is_required}
                  onChange={(e) => setTempQuestion({ ...tempQuestion, is_required: e.target.checked })}
                  disabled={!isEditing}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: theme.primary,
                      '& + .MuiSwitch-track': {
                        backgroundColor: theme.primary
                      }
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
          </Box>

          {/* 選択肢設定（必要な質問タイプのみ） */}
          {needsChoices && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 500, color: '#374151' }}>
                  選択肢
                </Typography>
                {isEditing && (
                  <Button
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={addChoice}
                    sx={{
                      color: theme.primary,
                      textTransform: 'none',
                      fontSize: '0.875rem'
                    }}
                  >
                    選択肢を追加
                  </Button>
                )}
              </Box>
              
              <Stack spacing={1}>
                {choices.map((choice, index) => (
                  <Box key={index} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <TextField
                      fullWidth
                      value={choice}
                      onChange={(e) => updateChoice(index, e.target.value)}
                      placeholder={`選択肢 ${index + 1}`}
                      disabled={!isEditing}
                      variant="outlined"
                      size="small"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: isEditing ? '#f8fafc' : '#f1f5f9'
                        }
                      }}
                    />
                    {isEditing && choices.length > 1 && (
                      <IconButton
                        size="small"
                        onClick={() => removeChoice(index)}
                        sx={{
                          color: '#ef4444',
                          '&:hover': { backgroundColor: 'rgba(239, 68, 68, 0.1)' }
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </Box>
                ))}
              </Stack>
            </Box>
          )}

          {/* 保存・キャンセルボタン */}
          {isEditing && (
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', pt: 1 }}>
              <Button
                variant="outlined"
                size="small"
                onClick={handleCancel}
                sx={{
                  color: '#64748b',
                  borderColor: '#d1d5db',
                  textTransform: 'none'
                }}
              >
                キャンセル
              </Button>
              <Button
                variant="contained"
                size="small"
                onClick={handleSave}
                sx={{
                  backgroundColor: theme.primary,
                  textTransform: 'none',
                  '&:hover': { backgroundColor: '#4c1d95' }
                }}
              >
                保存
              </Button>
            </Box>
          )}
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
};

// メインコンポーネント
const QuestionManagementPanel = ({ selectedPage, questions = [], onUpdateQuestions }) => {
  const theme = usePartnerTheme();
  const [newQuestionType, setNewQuestionType] = useState(1);

  const handleAddQuestion = () => {
    const newQuestion = {
      id: Date.now(),
      question_types_id: newQuestionType,
      question_text: '',
      detail_text: '',
      is_required: false,
      choices: needsChoices(newQuestionType) ? JSON.stringify(['選択肢 1', '選択肢 2']) : null
    };
    onUpdateQuestions([...questions, newQuestion]);
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
  };

  const needsChoices = (typeId) => [3, 4, 8].includes(typeId);

  if (!selectedPage || selectedPage.type === 'system') {
    return (
      <Box sx={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        p: 3,
        textAlign: 'center'
      }}>
        <Box
          sx={{
            width: 60,
            height: 60,
            borderRadius: 2,
            background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 1
          }}
        >
          <EditIcon sx={{ color: 'white', fontSize: '1.5rem' }} />
        </Box>
        <Typography variant="h6" sx={{ color: '#374151', fontWeight: 600 }}>
          質問設定
        </Typography>
        <Typography variant="body2" sx={{ color: '#6b7280' }}>
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
      <Box sx={{ p: 2, borderBottom: '1px solid #e5e7eb' }}>
        <Typography variant="h6" sx={{ color: '#374151', fontWeight: 600, mb: 1 }}>
          質問設定
        </Typography>
        <Typography variant="body2" sx={{ color: '#6b7280' }}>
          {selectedPage.title}
        </Typography>
      </Box>

      {/* 質問追加 */}
      <Box sx={{ p: 2, borderBottom: '1px solid #e5e7eb' }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>質問タイプ</InputLabel>
            <Select
              value={newQuestionType}
              onChange={(e) => setNewQuestionType(e.target.value)}
              label="質問タイプ"
            >
              <MenuItem value={1}>短文テキスト</MenuItem>
              <MenuItem value={2}>長文テキスト</MenuItem>
              <MenuItem value={3}>単一選択</MenuItem>
              <MenuItem value={4}>複数選択</MenuItem>
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
              backgroundColor: theme.primary,
              textTransform: 'none',
              '&:hover': { backgroundColor: '#4c1d95' }
            }}
          >
            追加
          </Button>
        </Stack>
      </Box>

      {/* 質問一覧 */}
      <Box sx={{ 
        flex: 1, 
        overflow: 'auto', 
        p: 2,
        '&::-webkit-scrollbar': { width: '6px' },
        '&::-webkit-scrollbar-track': { background: '#f1f5f9' },
        '&::-webkit-scrollbar-thumb': { 
          background: '#cbd5e1', 
          borderRadius: '3px',
          '&:hover': { background: '#94a3b8' }
        }
      }}>
        {questions.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" sx={{ color: '#6b7280' }}>
              まだ質問がありません。<br />
              上のボタンから質問を追加してください。
            </Typography>
          </Box>
        ) : (
          <AnimatePresence>
            {questions.map((question) => (
              <motion.div
                key={question.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <QuestionSettings
                  question={question}
                  onUpdate={handleUpdateQuestion}
                  onDelete={handleDeleteQuestion}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </Box>
    </Box>
  );
};

export default QuestionManagementPanel;