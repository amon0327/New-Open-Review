import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Switch,
  FormControlLabel,
  Button,
  IconButton,
  Chip,
  Stack,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Fade,
  Slide,
  Paper,
  InputBase,
  Tooltip
} from '@mui/material';
import {
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
  GridOn as MatrixIcon,
  Settings as SettingsIcon,
  ArrowBack as ArrowBackIcon,
  Star as StarIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

// 質問タイプのアイコンとカラーマッピング
const getQuestionTypeConfig = (typeId) => {
  const configs = {
    1: { icon: <TextIcon />, name: '短文テキスト', color: '#3B82F6', gradient: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)' },
    2: { icon: <NotesIcon />, name: '長文テキスト', color: '#10B981', gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' },
    3: { icon: <RadioIcon />, name: '単一選択', color: '#F59E0B', gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' },
    4: { icon: <CheckboxIcon />, name: '複数選択', color: '#EF4444', gradient: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)' },
    5: { icon: <MatrixIcon />, name: '単一選択マトリックス', color: '#8B5CF6', gradient: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)' },
    6: { icon: <MatrixIcon />, name: '複数選択マトリックス', color: '#EC4899', gradient: 'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)' },
    7: { icon: <ScaleIcon />, name: 'リニアスケール', color: '#06B6D4', gradient: 'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)' },
    8: { icon: <DropdownIcon />, name: 'プルダウン', color: '#84CC16', gradient: 'linear-gradient(135deg, #84CC16 0%, #65A30D 100%)' }
  };
  return configs[typeId] || configs[1];
};

// スタイリッシュなテキストフィールドコンポーネント
const StylishTextField = ({ label, value, onChange, multiline = false, rows = 1, placeholder, required = false, ...props }) => (
  <Box sx={{ mb: 2.5 }}>
    <Typography 
      variant="body2" 
      sx={{ 
        mb: 1,
        fontSize: '0.75rem',
        fontWeight: 600,
        color: '#374151',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }}
    >
      {label} {required && <StarIcon sx={{ fontSize: '0.6rem', color: '#EF4444', ml: 0.3 }} />}
    </Typography>
    <TextField
      value={value}
      onChange={onChange}
      multiline={multiline}
      rows={rows}
      placeholder={placeholder}
      fullWidth
      variant="outlined"
      sx={{
        '& .MuiOutlinedInput-root': {
          backgroundColor: '#F8FAFC',
          borderRadius: '6px',
          fontSize: '0.875rem',
          fontWeight: 400,
          border: 'none',
          '& fieldset': {
            border: '1px solid #E2E8F0',
            borderRadius: '6px'
          },
          '&:hover fieldset': {
            borderColor: '#CBD5E1'
          },
          '&.Mui-focused': {
            backgroundColor: '#FFFFFF',
            '& fieldset': {
              borderColor: '#5E17EB',
              borderWidth: '1px'
            }
          },
          '& input': {
            padding: '0px',
            fontSize: '0.875rem'
          },
          '& textarea': {
            padding: '0px',
            fontSize: '0.875rem'
          }
        }
      }}
      {...props}
    />
  </Box>
);

// スタイリッシュなスイッチコンポーネント
const StylishSwitch = ({ label, checked, onChange, description }) => (
  <Box 
    sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between',
      p: 2,
      backgroundColor: '#F8FAFC',
      borderRadius: '8px',
      border: '1px solid #E2E8F0',
      mb: 2.5,
      transition: 'all 0.2s ease'
    }}
  >
    <Box>
      <Typography 
        variant="body2" 
        sx={{ 
          fontWeight: 600,
          color: '#1F2937',
          fontSize: '0.875rem',
          mb: description ? 0.5 : 0
        }}
      >
        {label}
      </Typography>
      {description && (
        <Typography 
          variant="caption" 
          sx={{ 
            color: '#6B7280',
            fontSize: '0.75rem'
          }}
        >
          {description}
        </Typography>
      )}
    </Box>
    <Switch
      checked={checked}
      onChange={onChange}
      sx={{
        '& .MuiSwitch-switchBase': {
          '&.Mui-checked': {
            color: '#5E17EB',
            '& + .MuiSwitch-track': {
              backgroundColor: '#5E17EB'
            }
          }
        }
      }}
    />
  </Box>
);

const QuestionSettingsMenu = ({
  questions = [],
  selectedQuestionId = null,
  onQuestionUpdate,
  onQuestionDelete,
  onQuestionSelect
}) => {
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'settings'
  const [editingChoices, setEditingChoices] = useState({});

  const selectedQuestion = questions.find(q => q.id === selectedQuestionId);

  // 質問が選択されたら設定モードに切り替え
  useEffect(() => {
    if (selectedQuestionId && selectedQuestion) {
      setViewMode('settings');
    } else {
      setViewMode('list');
    }
  }, [selectedQuestionId, selectedQuestion]);

  // 質問の基本設定更新
  const handleQuestionUpdate = (field, value) => {
    if (onQuestionUpdate && selectedQuestion) {
      onQuestionUpdate(selectedQuestion.id, { [field]: value });
    }
  };

  // 選択肢の更新
  const handleChoicesUpdate = (choices) => {
    handleQuestionUpdate('choices', JSON.stringify(choices));
  };

  // 選択肢の追加
  const handleAddChoice = () => {
    const currentChoices = selectedQuestion.choices ? JSON.parse(selectedQuestion.choices) : [];
    const newChoices = [...currentChoices, `選択肢 ${currentChoices.length + 1}`];
    handleChoicesUpdate(newChoices);
  };

  // 選択肢の削除
  const handleRemoveChoice = (index) => {
    const currentChoices = selectedQuestion.choices ? JSON.parse(selectedQuestion.choices) : [];
    const newChoices = currentChoices.filter((_, i) => i !== index);
    handleChoicesUpdate(newChoices);
  };

  // 選択肢の編集
  const handleChoiceEdit = (index, value) => {
    const currentChoices = selectedQuestion.choices ? JSON.parse(selectedQuestion.choices) : [];
    const newChoices = [...currentChoices];
    newChoices[index] = value;
    handleChoicesUpdate(newChoices);
  };

  // スケール設定の更新
  const handleScaleUpdate = (field, value) => {
    const currentSettings = selectedQuestion.scale_settings ? JSON.parse(selectedQuestion.scale_settings) : {};
    const newSettings = { ...currentSettings, [field]: value };
    handleQuestionUpdate('scale_settings', JSON.stringify(newSettings));
  };

  // 質問リスト表示
  const renderQuestionList = () => (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* ヘッダー */}
      <Box sx={{ p: 3, pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #5E17EB 0%, #764BA2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(94, 23, 235, 0.3)'
            }}
          >
            <SettingsIcon sx={{ color: 'white', fontSize: '1.1rem' }} />
          </Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              fontSize: '1.1rem',
              color: '#1F2937',
              letterSpacing: '-0.025em'
            }}
          >
            質問設定
          </Typography>
        </Box>
        <Typography
          variant="body2"
          sx={{
            color: '#6B7280',
            fontSize: '0.8rem',
            fontWeight: 400
          }}
        >
          質問を選択して設定を編集
        </Typography>
      </Box>

      {/* 質問リスト */}
      <Box sx={{ flex: 1, overflow: 'auto', px: 2 }}>
        {questions.length === 0 ? (
          <Box
            sx={{
              p: 4,
              textAlign: 'center',
              color: '#9CA3AF'
            }}
          >
            <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
              質問を追加すると、ここに表示されます
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {questions.map((question, index) => {
              const config = getQuestionTypeConfig(question.question_types_id);
              const isSelected = selectedQuestionId === question.id;
              
              return (
                <motion.div
                  key={question.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <ListItem
                    disablePadding
                    sx={{ mb: 1 }}
                  >
                    <ListItemButton
                      onClick={() => onQuestionSelect && onQuestionSelect(question.id)}
                      sx={{
                        borderRadius: '8px',
                        border: isSelected ? '2px solid #5E17EB' : '1px solid #E5E7EB',
                        backgroundColor: isSelected ? 'rgba(94, 23, 235, 0.02)' : '#FFFFFF',
                        boxShadow: isSelected 
                          ? '0 4px 20px rgba(94, 23, 235, 0.15)' 
                          : '0 1px 3px rgba(0, 0, 0, 0.05)',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          backgroundColor: isSelected ? 'rgba(94, 23, 235, 0.05)' : '#F9FAFB',
                          borderColor: isSelected ? '#5E17EB' : '#D1D5DB',
                          transform: 'translateY(-1px)',
                          boxShadow: isSelected 
                            ? '0 6px 25px rgba(94, 23, 235, 0.2)' 
                            : '0 4px 12px rgba(0, 0, 0, 0.1)'
                        }
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        <Box
                          sx={{
                            width: 28,
                            height: 28,
                            borderRadius: '6px',
                            background: config.gradient,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
                          }}
                        >
                          {React.cloneElement(config.icon, {
                            sx: { color: 'white', fontSize: '0.9rem' }
                          })}
                        </Box>
                      </ListItemIcon>
                      
                      <ListItemText
                        primary={
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 600,
                              color: isSelected ? '#5E17EB' : '#1F2937',
                              fontSize: '0.85rem',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              mb: 0.3
                            }}
                          >
                            {question.question_text || '無題の質問'}
                          </Typography>
                        }
                        secondary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography
                              variant="caption"
                              sx={{
                                color: '#6B7280',
                                fontSize: '0.7rem',
                                fontWeight: 500
                              }}
                            >
                              {config.name}
                            </Typography>
                            {question.is_required && (
                              <Chip
                                label="必須"
                                size="small"
                                sx={{
                                  height: 14,
                                  fontSize: '0.6rem',
                                  fontWeight: 600,
                                  backgroundColor: '#FEF3C7',
                                  color: '#D97706',
                                  '& .MuiChip-label': {
                                    px: 0.8
                                  }
                                }}
                              />
                            )}
                          </Box>
                        }
                      />
                      
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onQuestionDelete) {
                            onQuestionDelete(question.id);
                          }
                        }}
                        sx={{
                          color: '#9CA3AF',
                          opacity: 0,
                          transition: 'all 0.2s ease',
                          '.MuiListItemButton-root:hover &': {
                            opacity: 1
                          },
                          '&:hover': {
                            color: '#EF4444',
                            backgroundColor: 'rgba(239, 68, 68, 0.1)'
                          }
                        }}
                      >
                        <DeleteIcon sx={{ fontSize: '0.9rem' }} />
                      </IconButton>
                    </ListItemButton>
                  </ListItem>
                </motion.div>
              );
            })}
          </List>
        )}
      </Box>
    </Box>
  );

  // 質問設定表示
  const renderQuestionSettings = () => {
    if (!selectedQuestion) return null;

    const config = getQuestionTypeConfig(selectedQuestion.question_types_id);
    const { question_types_id: typeId } = selectedQuestion;

    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* ヘッダー */}
        <Box 
          sx={{ 
            p: 3, 
            pb: 2,
            borderBottom: '1px solid #E5E7EB'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <IconButton
              onClick={() => {
                setViewMode('list');
                onQuestionSelect && onQuestionSelect(null);
              }}
              sx={{
                color: '#6B7280',
                '&:hover': {
                  backgroundColor: 'rgba(107, 114, 128, 0.1)',
                  color: '#374151'
                }
              }}
            >
              <ArrowBackIcon sx={{ fontSize: '1.1rem' }} />
            </IconButton>
            
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '8px',
                background: config.gradient,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
              }}
            >
              {React.cloneElement(config.icon, {
                sx: { color: 'white', fontSize: '1.1rem' }
              })}
            </Box>
            
            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  color: '#1F2937',
                  letterSpacing: '-0.025em'
                }}
              >
                質問設定
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: '#6B7280',
                  fontSize: '0.75rem',
                  fontWeight: 500
                }}
              >
                {config.name}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* 設定内容 */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
          <Stack spacing={0}>
            {/* 基本設定 */}
            <StylishTextField
              label="質問テキスト"
              value={selectedQuestion.question_text || ''}
              onChange={(e) => handleQuestionUpdate('question_text', e.target.value)}
              placeholder="質問を入力してください"
              multiline
              rows={2}
              required
            />

            <StylishTextField
              label="詳細テキスト"
              value={selectedQuestion.detail_text || ''}
              onChange={(e) => handleQuestionUpdate('detail_text', e.target.value)}
              placeholder="補足説明を入力（任意）"
              multiline
              rows={1}
            />

            <StylishSwitch
              label="必須回答"
              description="回答者に必須で答えてもらう質問にする"
              checked={selectedQuestion.is_required || false}
              onChange={(e) => handleQuestionUpdate('is_required', e.target.checked)}
            />

            {/* 質問タイプ別設定 */}
            {[3, 4, 8].includes(typeId) && (
              <Box sx={{ mt: 1 }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    mb: 2,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: '#374151',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}
                >
                  選択肢設定
                </Typography>
                
                <Stack spacing={1.5}>
                  {(selectedQuestion.choices ? JSON.parse(selectedQuestion.choices) : []).map((choice, index) => (
                    <Box
                      key={index}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        p: 1.5,
                        backgroundColor: '#F8FAFC',
                        borderRadius: '8px',
                        border: '1px solid #E2E8F0',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          borderColor: '#CBD5E1'
                        }
                      }}
                    >
                      <DragHandleIcon sx={{ color: '#9CA3AF', fontSize: '1rem' }} />
                      <TextField
                        value={choice}
                        onChange={(e) => handleChoiceEdit(index, e.target.value)}
                        size="small"
                        variant="outlined"
                        sx={{
                          flex: 1,
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: 'white',
                            borderRadius: '6px',
                            fontSize: '0.875rem',
                            '& fieldset': {
                              borderColor: '#E2E8F0'
                            },
                            '&:hover fieldset': {
                              borderColor: '#CBD5E1'
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: '#5E17EB'
                            }
                          }
                        }}
                      />
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveChoice(index)}
                        sx={{
                          color: '#9CA3AF',
                          '&:hover': {
                            color: '#EF4444',
                            backgroundColor: 'rgba(239, 68, 68, 0.1)'
                          }
                        }}
                      >
                        <DeleteIcon sx={{ fontSize: '0.9rem' }} />
                      </IconButton>
                    </Box>
                  ))}
                  
                  <Button
                    startIcon={<AddIcon />}
                    onClick={handleAddChoice}
                    variant="outlined"
                    size="small"
                    sx={{
                      mt: 1,
                      color: '#5E17EB',
                      borderColor: '#E2E8F0',
                      backgroundColor: '#F8FAFC',
                      fontWeight: 500,
                      fontSize: '0.8rem',
                      textTransform: 'none',
                      borderRadius: '6px',
                      '&:hover': {
                        backgroundColor: 'rgba(94, 23, 235, 0.04)',
                        borderColor: '#5E17EB'
                      }
                    }}
                  >
                    選択肢を追加
                  </Button>
                </Stack>
              </Box>
            )}

            {typeId === 7 && (
              <Box sx={{ mt: 1 }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    mb: 2,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: '#374151',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}
                >
                  スケール設定
                </Typography>
                
                <Stack spacing={2.5}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <StylishTextField
                      label="最小値"
                      value={selectedQuestion.scale_settings ? JSON.parse(selectedQuestion.scale_settings).minValue || 1 : 1}
                      onChange={(e) => handleScaleUpdate('minValue', parseInt(e.target.value))}
                      type="number"
                    />
                    <StylishTextField
                      label="最大値"
                      value={selectedQuestion.scale_settings ? JSON.parse(selectedQuestion.scale_settings).maxValue || 5 : 5}
                      onChange={(e) => handleScaleUpdate('maxValue', parseInt(e.target.value))}
                      type="number"
                    />
                  </Box>
                  
                  <StylishTextField
                    label="最小値ラベル"
                    value={selectedQuestion.scale_settings ? JSON.parse(selectedQuestion.scale_settings).minLabel || '' : ''}
                    onChange={(e) => handleScaleUpdate('minLabel', e.target.value)}
                    placeholder="例: そう思わない"
                  />
                  
                  <StylishTextField
                    label="最大値ラベル"
                    value={selectedQuestion.scale_settings ? JSON.parse(selectedQuestion.scale_settings).maxLabel || '' : ''}
                    onChange={(e) => handleScaleUpdate('maxLabel', e.target.value)}
                    placeholder="例: そう思う"
                  />
                </Stack>
              </Box>
            )}
          </Stack>
        </Box>
      </Box>
    );
  };

  return (
    <Box sx={{ height: '100%', overflow: 'hidden' }}>
      <AnimatePresence mode="wait">
        {viewMode === 'list' ? (
          <motion.div
            key="list"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            style={{ height: '100%' }}
          >
            {renderQuestionList()}
          </motion.div>
        ) : (
          <motion.div
            key="settings"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            style={{ height: '100%' }}
          >
            {renderQuestionSettings()}
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
};

export default QuestionSettingsMenu;