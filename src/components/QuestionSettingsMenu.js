import React, { useState, useEffect } from 'react';
import { ChromePicker } from 'react-color';
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
  Tooltip,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Card,
  CardContent
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
  Close as CloseIcon,
  Tune as TuneIcon,
  Visibility as VisibilityIcon,
  Code as CodeIcon,
  Image as ImageIcon,
  CloudUpload as CloudUploadIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
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
const StylishTextField = ({ label, value, onChange, multiline = false, rows = 1, maxRows, minRows, placeholder, required = false, ...props }) => (
  <Box>
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
      maxRows={maxRows}
      minRows={minRows}
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
          padding: '0 !important',
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
          '& .MuiOutlinedInput-input': {
            padding: '6px 8px !important',
            fontSize: '0.875rem'
          },
          '& textarea.MuiOutlinedInput-input': {
            padding: '6px 8px !important',
            fontSize: '0.875rem',
            resize: 'none'
          },
          '&.MuiInputBase-multiline': {
            padding: '0 !important',
            '& .MuiOutlinedInput-input': {
              padding: '6px 8px !important',
              fontSize: '0.875rem'
            }
          }
        },
        '& .MuiInputBase-root': {
          padding: '0 !important'
        },
        '& .MuiInputBase-root.MuiInputBase-multiline': {
          padding: '0 !important',
          '& .MuiOutlinedInput-input': {
            padding: '6px 8px !important',
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
  onQuestionSelect,
  onQuestionReorder,
  // 基本設定用のprops
  selectedElement = null, // プレビューで選択された要素 ('header', 'logo', null)
  selectedPage = null, // 選択されたページ
  headerImage = null,
  logoImage = null,
  onHeaderImageChange,
  onLogoImageChange
}) => {
  const [editingChoices, setEditingChoices] = useState({});
  const [selectedTab, setSelectedTab] = useState(2); // デフォルトで基本設定タブ
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  
  // アコーディオンの展開状態
  const [expandedAccordion, setExpandedAccordion] = useState(null);
  
  // カラーピッカーの状態
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#5e17eb');

  const selectedQuestion = questions.find(q => q.id === selectedQuestionId);

  // ページタイプと選択状態に応じてタブを制御
  useEffect(() => {
    if (selectedQuestionId && selectedQuestion) {
      setSelectedTab(0); // 質問設定タブに切り替え
      return;
    }
    
    if (selectedElement) {
      setSelectedTab(2); // 基本設定タブに切り替え
      return;
    }
    
    // ページタイプに応じてデフォルトタブを設定
    if (selectedPage) {
      if (selectedPage.type === 'system') {
        // システムページ（ログイン画面、完了画面）は基本設定のみ
        setSelectedTab(2);
      } else {
        // 質問ページは質問一覧をデフォルト
        setSelectedTab(1);
      }
    } else {
      // ページが選択されていない場合は基本設定
      setSelectedTab(2);
    }
  }, [selectedQuestionId, selectedQuestion, selectedElement, selectedPage]);

  // プレビューで要素が選択されたときのアコーディオン制御
  useEffect(() => {
    if (selectedElement) {
      
      // ログイン画面の要素の場合
      if (selectedElement.startsWith('login-')) {
        if (selectedElement === 'login-title') {
          setExpandedAccordion('login-title');
        } else if (selectedElement === 'login-detail') {
          setExpandedAccordion('login-detail');
        } else if (selectedElement === 'login-button') {
          setExpandedAccordion('theme-color');
        }
      } 
      // 完了画面の要素の場合
      else if (selectedElement.startsWith('completion-')) {
        if (selectedElement === 'completion-background') {
          setExpandedAccordion('completion-background');
        } else if (selectedElement === 'completion-logo') {
          setExpandedAccordion('completion-logo');
        } else if (selectedElement === 'completion-title') {
          setExpandedAccordion('completion-title');
        } else if (selectedElement === 'completion-detail') {
          setExpandedAccordion('completion-detail');
        } else if (selectedElement === 'completion-button') {
          setExpandedAccordion('completion-button');
        }
      } else {
        // 質問画面の要素の場合
        setExpandedAccordion(selectedElement);
      }
    }
  }, [selectedElement]);

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

  // カラー変更ハンドラー
  const handleColorChange = (color) => {
    setSelectedColor(color.hex);
    // ここで実際のテーマカラー変更処理を行う
    console.log('Theme color changed to:', color.hex);
  };

  // タブ変更ハンドラー
  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  // 利用可能なタブのインデックスを計算
  const getAvailableTabs = () => {
    const tabs = [];
    
    // 質問設定タブ (質問ページでのみ)
    if (selectedPage && selectedPage.type === 'question') {
      tabs.push({ value: 0, label: '質問設定' });
    }
    
    // 質問一覧タブ (質問ページでのみ)
    if (selectedPage && selectedPage.type === 'question') {
      tabs.push({ value: 1, label: '質問一覧' });
    }
    
    // 基本設定タブ (常に表示)
    tabs.push({ value: 2, label: '基本設定' });
    
    return tabs;
  };

  // 現在のタブが利用可能かチェック
  const isCurrentTabAvailable = () => {
    const availableTabs = getAvailableTabs();
    return availableTabs.some(tab => tab.value === selectedTab);
  };

  // ドラッグ&ドロップハンドラー
  const handleDragStart = (e, question, index) => {
    setDraggedItem({ question, index });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.outerHTML);
    e.target.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '';
    setDraggedItem(null);
    setDragOverIndex(null);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = (e) => {
    setDragOverIndex(null);
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    
    if (!draggedItem || draggedItem.index === dropIndex) {
      return;
    }

    // 並び替えを実行
    if (onQuestionReorder) {
      onQuestionReorder(draggedItem.index, dropIndex);
    }

    setDraggedItem(null);
    setDragOverIndex(null);
  };


  // メインレンダリング関数
  const renderMainContent = () => {
    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>

        {/* タブバー */}
        <Box sx={{ borderBottom: '1px solid #E5E7EB', px: 2, pt: 2 }}>
          <Tabs
            value={selectedTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons={false}
            sx={{
              '& .MuiTabs-root': {
                minHeight: 48
              },
              '& .MuiTab-root': {
                minHeight: 48,
                textTransform: 'none',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: '#6B7280',
                minWidth: 80,
                px: 1.5,
                '&.Mui-selected': {
                  color: '#5E17EB',
                  fontWeight: 600
                }
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#5E17EB',
                height: 2
              },
              '& .MuiTabs-scroller': {
                overflow: 'auto !important',
                '&::-webkit-scrollbar': {
                  display: 'none'
                },
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              },
              '& .MuiTabs-flexContainer': {
                gap: 0.5
              }
            }}
          >
            {/* 質問設定タブ - 質問ページでのみ表示 */}
            {selectedPage && selectedPage.type === 'question' && (
              <Tab 
                icon={<TuneIcon sx={{ fontSize: '1rem' }} />} 
                iconPosition="start" 
                label="質問設定" 
                value={0}
                disabled={!selectedQuestion}
              />
            )}
            {/* 質問一覧タブ - 質問ページでのみ表示 */}
            {selectedPage && selectedPage.type === 'question' && (
              <Tab 
                icon={<EditIcon sx={{ fontSize: '1rem' }} />} 
                iconPosition="start" 
                label="質問一覧" 
                value={1}
              />
            )}
            {/* 基本設定タブ - 常に表示 */}
            <Tab 
              icon={<SettingsIcon sx={{ fontSize: '1rem' }} />} 
              iconPosition="start" 
              label="基本設定" 
              value={2}
            />
          </Tabs>
        </Box>

        {/* タブ内容 */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 0 }}>
          <Box sx={{ p: 2 }}>
            {renderTabContent()}
          </Box>
        </Box>
      </Box>
    );
  };

  // タブコンテンツのレンダリング
  const renderTabContent = () => {
    switch (selectedTab) {
      case 0: // 質問設定
        if (!selectedQuestion) {
          return (
            <Box
              sx={{
                p: 4,
                textAlign: 'center',
                color: '#9CA3AF'
              }}
            >
              <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                質問を選択してください
              </Typography>
            </Box>
          );
        }

        const { question_types_id: typeId } = selectedQuestion;

        return (
          <Stack spacing={3}>
            {/* 必須回答設定 */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: '#374151'
                }}
              >
                回答を必須にする
              </Typography>
              <Switch
                checked={selectedQuestion.is_required || false}
                onChange={(e) => handleQuestionUpdate('is_required', e.target.checked)}
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

            {/* 質問テキスト */}
            <StylishTextField
              label="質問テキスト"
              value={selectedQuestion.question_text || ''}
              onChange={(e) => handleQuestionUpdate('question_text', e.target.value)}
              multiline
              minRows={1}
              maxRows={3}
              placeholder="質問を入力してください..."
              required
            />

            {/* 詳細テキスト */}
            <StylishTextField
              label="詳細テキスト"
              value={selectedQuestion.detail_text || ''}
              onChange={(e) => handleQuestionUpdate('detail_text', e.target.value)}
              multiline
              minRows={1}
              maxRows={3}
              placeholder="詳細説明を入力してください..."
            />

            {/* 質問タイプ別の追加設定 */}
            {(typeId === 3 || typeId === 4 || typeId === 8) && (
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: '#374151',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}
                  >
                    選択肢設定
                  </Typography>
                  <Button
                    startIcon={<AddIcon />}
                    onClick={handleAddChoice}
                    variant="outlined"
                    size="small"
                    sx={{
                      borderColor: '#E5E7EB',
                      color: '#5E17EB',
                      textTransform: 'none',
                      fontSize: '0.75rem',
                      px: 1.5,
                      py: 0.5,
                      minWidth: 'auto',
                      '&:hover': {
                        borderColor: '#5E17EB',
                        backgroundColor: 'rgba(94, 23, 235, 0.05)'
                      }
                    }}
                  >
                    追加
                  </Button>
                </Box>
                <Stack spacing={1}>
                  {(selectedQuestion.choices ? JSON.parse(selectedQuestion.choices) : []).map((choice, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography sx={{ minWidth: 20, fontSize: '0.875rem', color: '#6B7280' }}>
                        {index + 1}.
                      </Typography>
                      <TextField
                        value={choice}
                        onChange={(e) => handleChoiceEdit(index, e.target.value)}
                        variant="standard"
                        placeholder={`選択肢 ${index + 1}`}
                        fullWidth
                        sx={{
                          '& .MuiInput-underline:before': {
                            borderBottomColor: '#E5E7EB'
                          },
                          '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                            borderBottomColor: '#D1D5DB'
                          },
                          '& .MuiInput-underline:after': {
                            borderBottomColor: '#5E17EB'
                          },
                          '& input': {
                            fontSize: '0.875rem',
                            padding: '4px 0'
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
                        <CloseIcon sx={{ fontSize: '0.9rem' }} />
                      </IconButton>
                    </Box>
                  ))}
                </Stack>
              </Box>
            )}

            {/* リニアスケール設定 */}
            {typeId === 7 && (
              <Box>
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
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <StylishTextField
                      label="最小値"
                      value={selectedQuestion.scale_settings ? JSON.parse(selectedQuestion.scale_settings).minValue || 1 : 1}
                      onChange={(e) => handleScaleUpdate('minValue', parseInt(e.target.value) || 1)}
                      type="number"
                      placeholder="1"
                    />
                    <StylishTextField
                      label="最大値"
                      value={selectedQuestion.scale_settings ? JSON.parse(selectedQuestion.scale_settings).maxValue || 5 : 5}
                      onChange={(e) => handleScaleUpdate('maxValue', parseInt(e.target.value) || 5)}
                      type="number"
                      placeholder="5"
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
        );

      case 1: // 質問一覧
        return (
          <Box sx={{ height: '100%' }}>
            {/* 質問リスト */}
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
                        sx={{ 
                          mb: 1,
                          position: 'relative',
                          '&::before': dragOverIndex === index ? {
                            content: '""',
                            position: 'absolute',
                            top: -2,
                            left: 0,
                            right: 0,
                            height: 4,
                            backgroundColor: '#5E17EB',
                            borderRadius: 2,
                            zIndex: 10
                          } : {}
                        }}
                      >
                        <ListItemButton
                          draggable
                          onDragStart={(e) => handleDragStart(e, question, index)}
                          onDragEnd={handleDragEnd}
                          onDragOver={(e) => handleDragOver(e, index)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, index)}
                          onClick={() => {
                            onQuestionSelect && onQuestionSelect(question.id);
                            setSelectedTab(0); // 質問設定タブに切り替え
                          }}
                          sx={{
                            borderRadius: 0,
                            border: isSelected ? '2px solid #5E17EB' : '1px solid #E5E7EB',
                            backgroundColor: isSelected ? 'rgba(94, 23, 235, 0.02)' : '#FFFFFF',
                            boxShadow: isSelected 
                              ? '0 4px 20px rgba(94, 23, 235, 0.15)' 
                              : '0 1px 3px rgba(0, 0, 0, 0.05)',
                            transition: 'all 0.2s ease',
                            cursor: 'pointer',
                            '&:hover': {
                              backgroundColor: isSelected ? 'rgba(94, 23, 235, 0.05)' : '#F9FAFB',
                              borderColor: isSelected ? '#5E17EB' : '#D1D5DB',
                              transform: draggedItem?.question.id === question.id ? 'none' : 'translateY(-1px)',
                              boxShadow: isSelected 
                                ? '0 6px 25px rgba(94, 23, 235, 0.2)' 
                                : '0 4px 12px rgba(0, 0, 0, 0.1)'
                            },
                            opacity: draggedItem?.question.id === question.id ? 0.5 : 1
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 40 }}>
                            <DragHandleIcon 
                              sx={{ 
                                color: '#9CA3AF', 
                                fontSize: '1rem',
                                cursor: 'grab',
                                '&:hover': { color: '#6B7280' },
                                '&:active': { cursor: 'grabbing' }
                              }} 
                              onMouseDown={(e) => e.stopPropagation()}
                            />
                          </ListItemIcon>
                          
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
        );

      case 1: // 質問一覧
        return (
          <Box sx={{ height: '100%' }}>
            {/* 質問リスト */}
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
                        sx={{ 
                          mb: 1,
                          position: 'relative',
                          '&::before': dragOverIndex === index ? {
                            content: '""',
                            position: 'absolute',
                            top: -2,
                            left: 0,
                            right: 0,
                            height: 4,
                            backgroundColor: '#5E17EB',
                            borderRadius: 2,
                            zIndex: 10
                          } : {}
                        }}
                      >
                        <ListItemButton
                          draggable
                          onDragStart={(e) => handleDragStart(e, question, index)}
                          onDragEnd={handleDragEnd}
                          onDragOver={(e) => handleDragOver(e, index)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, index)}
                          onClick={() => {
                            onQuestionSelect && onQuestionSelect(question.id);
                            setSelectedTab(0); // 質問設定タブに切り替え
                          }}
                          sx={{
                            borderRadius: 0,
                            border: isSelected ? '2px solid #5E17EB' : '1px solid #E5E7EB',
                            backgroundColor: isSelected ? 'rgba(94, 23, 235, 0.02)' : '#FFFFFF',
                            boxShadow: isSelected 
                              ? '0 4px 20px rgba(94, 23, 235, 0.15)' 
                              : '0 1px 3px rgba(0, 0, 0, 0.05)',
                            transition: 'all 0.2s ease',
                            cursor: 'pointer',
                            '&:hover': {
                              backgroundColor: isSelected ? 'rgba(94, 23, 235, 0.05)' : '#F9FAFB',
                              borderColor: isSelected ? '#5E17EB' : '#D1D5DB',
                              transform: draggedItem?.question.id === question.id ? 'none' : 'translateY(-1px)',
                              boxShadow: isSelected 
                                ? '0 6px 25px rgba(94, 23, 235, 0.2)' 
                                : '0 4px 12px rgba(0, 0, 0, 0.1)'
                            },
                            opacity: draggedItem?.question.id === question.id ? 0.5 : 1
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 40 }}>
                            <DragHandleIcon 
                              sx={{ 
                                color: '#9CA3AF', 
                                fontSize: '1rem',
                                cursor: 'grab',
                                '&:hover': { color: '#6B7280' },
                                '&:active': { cursor: 'grabbing' }
                              }} 
                              onMouseDown={(e) => e.stopPropagation()}
                            />
                          </ListItemIcon>
                          
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
        );

      case 2: // 基本設定
        return (
          <Box sx={{ height: '100%' }}>
            <Stack spacing={2}>
              {/* システムページまたは基本設定要素が選択されている場合の表示制御 */}
              {renderBasicSettings()}
            </Stack>
          </Box>
        );

      default:
        return null;
    }
  };

  // 基本設定のレンダリング関数
  const renderBasicSettings = () => {
    const isSystemPage = selectedPage && selectedPage.type === 'system';
    const isLoginPage = selectedPage && selectedPage.id === 'login';
    const isCompletionPage = selectedPage && selectedPage.id === 'completion';
    const isQuestionPage = selectedPage && selectedPage.type === 'question';
    
    return (
      <>
        {/* ログイン画面設定 */}
        {(isLoginPage || selectedElement?.startsWith('login-') || (!isSystemPage && !selectedElement && !selectedQuestionId)) && (
                <>
                  <Accordion 
                    expanded={expandedAccordion === 'login-title'} 
                    onChange={() => setExpandedAccordion(expandedAccordion === 'login-title' ? null : 'login-title')}
                    sx={{
                      borderRadius: '8px !important',
                      border: '1px solid #E5E7EB',
                      boxShadow: 'none',
                      '&:before': { display: 'none' },
                      backgroundColor: expandedAccordion === 'login-title' ? 'rgba(94, 23, 235, 0.02)' : '#FFFFFF'
                    }}
                  >
                    <AccordionSummary
                      expandIcon={expandedAccordion === 'login-title' ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      sx={{
                        borderRadius: '8px',
                        '& .MuiAccordionSummary-content': {
                          alignItems: 'center'
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: '6px',
                            background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 2px 8px rgba(139, 92, 246, 0.3)'
                          }}
                        >
                          <TextIcon sx={{ color: 'white', fontSize: '1rem' }} />
                        </Box>
                        <Box>
                          <Typography
                            variant="body1"
                            sx={{
                              fontWeight: 600,
                              color: '#1F2937',
                              fontSize: '0.9rem'
                            }}
                          >
                            タイトルテキスト
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              color: '#6B7280',
                              fontSize: '0.75rem'
                            }}
                          >
                            ログイン画面のメインタイトル
                          </Typography>
                        </Box>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails sx={{ pt: 0 }}>
                      <StylishTextField
                        label="タイトルテキスト"
                        value="OpenReviewへようこそ！"
                        onChange={() => {}}
                        placeholder="ログイン画面のタイトル"
                      />
                    </AccordionDetails>
                  </Accordion>

                  <Accordion 
                    expanded={expandedAccordion === 'login-detail'} 
                    onChange={() => setExpandedAccordion(expandedAccordion === 'login-detail' ? null : 'login-detail')}
                    sx={{
                      borderRadius: '8px !important',
                      border: '1px solid #E5E7EB',
                      boxShadow: 'none',
                      '&:before': { display: 'none' },
                      backgroundColor: expandedAccordion === 'login-detail' ? 'rgba(94, 23, 235, 0.02)' : '#FFFFFF'
                    }}
                  >
                    <AccordionSummary
                      expandIcon={expandedAccordion === 'login-detail' ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      sx={{
                        borderRadius: '8px',
                        '& .MuiAccordionSummary-content': {
                          alignItems: 'center'
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: '6px',
                            background: 'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 2px 8px rgba(6, 182, 212, 0.3)'
                          }}
                        >
                          <NotesIcon sx={{ color: 'white', fontSize: '1rem' }} />
                        </Box>
                        <Box>
                          <Typography
                            variant="body1"
                            sx={{
                              fontWeight: 600,
                              color: '#1F2937',
                              fontSize: '0.9rem'
                            }}
                          >
                            詳細テキスト
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              color: '#6B7280',
                              fontSize: '0.75rem'
                            }}
                          >
                            ログイン画面の説明文
                          </Typography>
                        </Box>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails sx={{ pt: 0 }}>
                      <StylishTextField
                        label="詳細テキスト"
                        value="あなたの目的に合わせたレビュー項目を設定できます。質問項目を追加して、最適なレビューを作成しましょう。"
                        onChange={() => {}}
                        multiline
                        rows={3}
                        placeholder="ログイン画面の説明文"
                      />
                    </AccordionDetails>
                  </Accordion>

                  {/* テーマカラー設定 */}
                  <Accordion 
                    expanded={expandedAccordion === 'theme-color'} 
                    onChange={() => setExpandedAccordion(expandedAccordion === 'theme-color' ? null : 'theme-color')}
                    sx={{
                      borderRadius: '8px !important',
                      border: '1px solid #E5E7EB',
                      boxShadow: 'none',
                      '&:before': { display: 'none' },
                      backgroundColor: expandedAccordion === 'theme-color' ? 'rgba(94, 23, 235, 0.02)' : '#FFFFFF'
                    }}
                  >
                    <AccordionSummary
                      expandIcon={expandedAccordion === 'theme-color' ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      sx={{
                        borderRadius: '8px',
                        '& .MuiAccordionSummary-content': {
                          alignItems: 'center'
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: '6px',
                            background: 'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 2px 8px rgba(236, 72, 153, 0.3)'
                          }}
                        >
                          <Box 
                            sx={{ 
                              width: 16, 
                              height: 16, 
                              borderRadius: '50%', 
                              backgroundColor: 'white'
                            }} 
                          />
                        </Box>
                        <Box>
                          <Typography
                            variant="body1"
                            sx={{
                              fontWeight: 600,
                              color: '#1F2937',
                              fontSize: '0.9rem'
                            }}
                          >
                            テーマカラー
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              color: '#6B7280',
                              fontSize: '0.75rem'
                            }}
                          >
                            アプリ全体のメインカラー
                          </Typography>
                        </Box>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails sx={{ pt: 0 }}>
                      <Stack spacing={3}>
                        {/* 現在の色表示 */}
                        <Box>
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
                            現在の色
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box
                              onClick={() => setShowColorPicker(!showColorPicker)}
                              sx={{
                                width: 60,
                                height: 40,
                                backgroundColor: selectedColor,
                                borderRadius: '8px',
                                cursor: 'pointer',
                                border: '2px solid #E5E7EB',
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                  transform: 'scale(1.05)',
                                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                                }
                              }}
                            />
                            <StylishTextField
                              label="カラーコード"
                              value={selectedColor}
                              onChange={(e) => {
                                setSelectedColor(e.target.value);
                                handleColorChange({ hex: e.target.value });
                              }}
                              placeholder="#5e17eb"
                              sx={{ flex: 1 }}
                            />
                          </Box>
                        </Box>
                        
                        {/* カラーピッカー */}
                        {showColorPicker && (
                          <Box sx={{ position: 'relative', zIndex: 1000 }}>
                            <Box
                              sx={{
                                position: 'fixed',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                zIndex: 999
                              }}
                              onClick={() => setShowColorPicker(false)}
                            />
                            <Box sx={{ position: 'relative', zIndex: 1001 }}>
                              <ChromePicker
                                color={selectedColor}
                                onChange={handleColorChange}
                                disableAlpha={true}
                              />
                            </Box>
                          </Box>
                        )}
                      </Stack>
                    </AccordionDetails>
                  </Accordion>

                  <Divider sx={{ my: 2 }} />
                </>
              )}

              {/* 完了画面設定 */}
              {(isCompletionPage || selectedElement?.startsWith('completion-')) && (
                <>
                  {/* 背景画像設定 */}
                  <Accordion 
                    expanded={expandedAccordion === 'completion-background'} 
                    onChange={() => setExpandedAccordion(expandedAccordion === 'completion-background' ? null : 'completion-background')}
                    sx={{
                      borderRadius: '8px !important',
                      border: '1px solid #E5E7EB',
                      boxShadow: 'none',
                      '&:before': { display: 'none' },
                      backgroundColor: expandedAccordion === 'completion-background' ? 'rgba(94, 23, 235, 0.02)' : '#FFFFFF'
                    }}
                  >
                    <AccordionSummary
                      expandIcon={expandedAccordion === 'completion-background' ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      sx={{
                        borderRadius: '8px',
                        '& .MuiAccordionSummary-content': {
                          alignItems: 'center'
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: '6px',
                            background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 2px 8px rgba(139, 92, 246, 0.3)'
                          }}
                        >
                          <ImageIcon sx={{ color: 'white', fontSize: '1rem' }} />
                        </Box>
                        <Box>
                          <Typography
                            variant="body1"
                            sx={{
                              fontWeight: 600,
                              color: '#1F2937',
                              fontSize: '0.9rem'
                            }}
                          >
                            背景画像
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              color: '#6B7280',
                              fontSize: '0.75rem'
                            }}
                          >
                            完了画面の背景画像
                          </Typography>
                        </Box>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails sx={{ pt: 0 }}>
                      <StylishTextField
                        label="背景画像URL"
                        value="https://misezukuri.com/wp-content/uploads/2023/10/b86e65d61ae3fbd3b3f1ec5c67484853.jpg"
                        onChange={() => {}}
                        placeholder="背景画像のURLを入力"
                      />
                    </AccordionDetails>
                  </Accordion>

                  {/* ロゴ設定 */}
                  <Accordion 
                    expanded={expandedAccordion === 'completion-logo'} 
                    onChange={() => setExpandedAccordion(expandedAccordion === 'completion-logo' ? null : 'completion-logo')}
                    sx={{
                      borderRadius: '8px !important',
                      border: '1px solid #E5E7EB',
                      boxShadow: 'none',
                      '&:before': { display: 'none' },
                      backgroundColor: expandedAccordion === 'completion-logo' ? 'rgba(94, 23, 235, 0.02)' : '#FFFFFF'
                    }}
                  >
                    <AccordionSummary
                      expandIcon={expandedAccordion === 'completion-logo' ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      sx={{
                        borderRadius: '8px',
                        '& .MuiAccordionSummary-content': {
                          alignItems: 'center'
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: '6px',  
                            background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)'
                          }}
                        >
                          <ImageIcon sx={{ color: 'white', fontSize: '1rem' }} />
                        </Box>
                        <Box>
                          <Typography
                            variant="body1"
                            sx={{
                              fontWeight: 600,
                              color: '#1F2937',
                              fontSize: '0.9rem'
                            }}
                          >
                            ロゴ画像
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              color: '#6B7280',
                              fontSize: '0.75rem'
                            }}
                          >
                            完了画面のロゴ画像
                          </Typography>
                        </Box>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails sx={{ pt: 0 }}>
                      <StylishTextField
                        label="ロゴ画像URL"
                        value="https://otfreskkeaenahqziriz.supabase.co/storage/v1/object/public/app-assets/logo/OpenReviewWhiteThemeLoog.png"
                        onChange={() => {}}
                        placeholder="ロゴ画像のURLを入力"
                      />
                    </AccordionDetails>
                  </Accordion>

                  {/* タイトルテキスト設定 */}
                  <Accordion 
                    expanded={expandedAccordion === 'completion-title'} 
                    onChange={() => setExpandedAccordion(expandedAccordion === 'completion-title' ? null : 'completion-title')}
                    sx={{
                      borderRadius: '8px !important',
                      border: '1px solid #E5E7EB',
                      boxShadow: 'none',
                      '&:before': { display: 'none' },
                      backgroundColor: expandedAccordion === 'completion-title' ? 'rgba(94, 23, 235, 0.02)' : '#FFFFFF'
                    }}
                  >
                    <AccordionSummary
                      expandIcon={expandedAccordion === 'completion-title' ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      sx={{
                        borderRadius: '8px',
                        '& .MuiAccordionSummary-content': {
                          alignItems: 'center'
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: '6px',
                            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                          }}
                        >
                          <TextIcon sx={{ color: 'white', fontSize: '1rem' }} />
                        </Box>
                        <Box>
                          <Typography
                            variant="body1"
                            sx={{
                              fontWeight: 600,
                              color: '#1F2937', 
                              fontSize: '0.9rem'
                            }}
                          >
                            タイトルテキスト
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              color: '#6B7280',
                              fontSize: '0.75rem'
                            }}
                          >
                            完了画面のメインタイトル
                          </Typography>
                        </Box>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails sx={{ pt: 0 }}>
                      <StylishTextField
                        label="タイトルテキスト"
                        value="ありがとうございました！"
                        onChange={() => {}}
                        placeholder="完了画面のタイトル"
                      />
                    </AccordionDetails>
                  </Accordion>

                  {/* 詳細テキスト設定 */}
                  <Accordion 
                    expanded={expandedAccordion === 'completion-detail'} 
                    onChange={() => setExpandedAccordion(expandedAccordion === 'completion-detail' ? null : 'completion-detail')}
                    sx={{
                      borderRadius: '8px !important',
                      border: '1px solid #E5E7EB',
                      boxShadow: 'none',
                      '&:before': { display: 'none' },
                      backgroundColor: expandedAccordion === 'completion-detail' ? 'rgba(94, 23, 235, 0.02)' : '#FFFFFF'
                    }}
                  >
                    <AccordionSummary
                      expandIcon={expandedAccordion === 'completion-detail' ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      sx={{
                        borderRadius: '8px',
                        '& .MuiAccordionSummary-content': {
                          alignItems: 'center'
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: '6px',
                            background: 'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 2px 8px rgba(6, 182, 212, 0.3)'
                          }}
                        >
                          <NotesIcon sx={{ color: 'white', fontSize: '1rem' }} />
                        </Box>
                        <Box>
                          <Typography
                            variant="body1"
                            sx={{
                              fontWeight: 600,
                              color: '#1F2937',
                              fontSize: '0.9rem'
                            }}
                          >
                            詳細テキスト
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              color: '#6B7280',
                              fontSize: '0.75rem'
                            }}
                          >
                            完了画面の説明文
                          </Typography>
                        </Box>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails sx={{ pt: 0 }}>
                      <StylishTextField
                        label="詳細テキスト"
                        value="あなたの貴重なご意見をお聞かせいただき、ありがとうございました。いただいたフィードバックは今後のサービス向上に活用させていただきます。"
                        onChange={() => {}}
                        multiline
                        rows={3}
                        placeholder="完了画面の説明文"
                      />
                    </AccordionDetails>
                  </Accordion>

                  {/* ボタン設定 */}
                  <Accordion 
                    expanded={expandedAccordion === 'completion-button'} 
                    onChange={() => setExpandedAccordion(expandedAccordion === 'completion-button' ? null : 'completion-button')}
                    sx={{
                      borderRadius: '8px !important',
                      border: '1px solid #E5E7EB',
                      boxShadow: 'none',
                      '&:before': { display: 'none' },
                      backgroundColor: expandedAccordion === 'completion-button' ? 'rgba(94, 23, 235, 0.02)' : '#FFFFFF'
                    }}
                  >
                    <AccordionSummary
                      expandIcon={expandedAccordion === 'completion-button' ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      sx={{
                        borderRadius: '8px',
                        '& .MuiAccordionSummary-content': {
                          alignItems: 'center'
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: '6px',
                            background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)'
                          }}
                        >
                          <Box 
                            sx={{ 
                              width: 16, 
                              height: 16, 
                              borderRadius: '6px', 
                              backgroundColor: 'white'
                            }} 
                          />
                        </Box>
                        <Box>
                          <Typography
                            variant="body1"
                            sx={{
                              fontWeight: 600,
                              color: '#1F2937',
                              fontSize: '0.9rem'
                            }}
                          >
                            ボタン設定
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              color: '#6B7280',
                              fontSize: '0.75rem'
                            }}
                          >
                            ボタンのテキストとリンク先
                          </Typography>
                        </Box>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails sx={{ pt: 0 }}>
                      <Stack spacing={2}>
                        <StylishTextField
                          label="ボタンテキスト"
                          value="完了"
                          onChange={() => {}}
                          placeholder="ボタンに表示するテキスト"
                        />
                        <StylishTextField
                          label="リンク先URL"
                          value="#"
                          onChange={() => {}}
                          placeholder="ボタンクリック時の移動先URL"
                        />
                        <StylishTextField
                          label="ボタンカラー"
                          value={selectedColor}
                          onChange={(e) => {
                            setSelectedColor(e.target.value);
                            handleColorChange({ hex: e.target.value });
                          }}
                          placeholder="#5e17eb"
                        />
                        
                        {/* カラーピッカー */}
                        <Box>
                          <Box
                            onClick={() => setShowColorPicker(!showColorPicker)}
                            sx={{
                              width: 60,
                              height: 40,
                              backgroundColor: selectedColor,
                              borderRadius: '8px',
                              cursor: 'pointer',
                              border: '2px solid #E5E7EB',
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                transform: 'scale(1.05)',
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                              }
                            }}
                          />
                          {showColorPicker && (
                            <Box sx={{ position: 'relative', zIndex: 1000, mt: 2 }}>
                              <Box
                                sx={{
                                  position: 'fixed',
                                  top: 0,
                                  left: 0,
                                  right: 0,
                                  bottom: 0,
                                  zIndex: 999
                                }}
                                onClick={() => setShowColorPicker(false)}
                              />
                              <Box sx={{ position: 'relative', zIndex: 1001 }}>
                                <ChromePicker
                                  color={selectedColor}
                                  onChange={handleColorChange}
                                  disableAlpha={true}
                                />
                              </Box>
                            </Box>
                          )}
                        </Box>
                      </Stack>
                    </AccordionDetails>
                  </Accordion>

                  <Divider sx={{ my: 2 }} />
                </>
              )}

              {/* 質問ページ用の共通設定: ヘッダー画像・ロゴ */}
              {(isQuestionPage || selectedElement === 'header' || selectedElement === 'logo') && (
                <>
                  {/* ヘッダー画像設定 */}
                  <Accordion 
                expanded={expandedAccordion === 'header'} 
                onChange={() => setExpandedAccordion(expandedAccordion === 'header' ? null : 'header')}
                sx={{
                  borderRadius: '8px !important',
                  border: '1px solid #E5E7EB',
                  boxShadow: 'none',
                  '&:before': { display: 'none' },
                  backgroundColor: expandedAccordion === 'header' ? 'rgba(94, 23, 235, 0.02)' : '#FFFFFF'
                }}
              >
                <AccordionSummary
                  expandIcon={expandedAccordion === 'header' ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  sx={{
                    borderRadius: '8px',
                    '& .MuiAccordionSummary-content': {
                      alignItems: 'center'
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: '6px',
                        background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)'
                      }}
                    >
                      <ImageIcon sx={{ color: 'white', fontSize: '1rem' }} />
                    </Box>
                    <Box>
                      <Typography
                        variant="body1"
                        sx={{
                          fontWeight: 600,
                          color: '#1F2937',
                          fontSize: '0.9rem'
                        }}
                      >
                        ヘッダー画像
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: '#6B7280',
                          fontSize: '0.75rem'
                        }}
                      >
                        フォーム上部に表示される画像
                      </Typography>
                    </Box>
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ pt: 0 }}>
                  <Stack spacing={3}>
                    {/* 画像プレビュー */}
                    {headerImage ? (
                      <Card sx={{ borderRadius: '8px', overflow: 'hidden' }}>
                        <CardContent sx={{ p: 0 }}>
                          <Box
                            component="img"
                            src={headerImage}
                            alt="ヘッダー画像"
                            sx={{
                              width: '100%',
                              height: 120,
                              objectFit: 'cover'
                            }}
                          />
                        </CardContent>
                      </Card>
                    ) : (
                      <Card 
                        sx={{ 
                          borderRadius: 0,
                          border: '2px dashed #E5E7EB',
                          backgroundColor: '#F9FAFB'
                        }}
                      >
                        <CardContent sx={{ p: 3, textAlign: 'center' }}>
                          <ImageIcon sx={{ fontSize: '2rem', color: '#9CA3AF', mb: 1 }} />
                          <Typography variant="body2" sx={{ color: '#6B7280', fontSize: '0.8rem' }}>
                            画像が設定されていません
                          </Typography>
                        </CardContent>
                      </Card>
                    )}
                    
                    {/* アップロードボタン */}
                    <Button
                      variant="outlined"
                      startIcon={<CloudUploadIcon />}
                      onClick={() => {
                        // ファイル選択のダイアログを開く処理
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.onchange = (e) => {
                          const file = e.target.files[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (e) => {
                              if (onHeaderImageChange) {
                                onHeaderImageChange(e.target.result);
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        };
                        input.click();
                      }}
                      sx={{
                        borderColor: '#E5E7EB',
                        color: '#5E17EB',
                        textTransform: 'none',
                        '&:hover': {
                          borderColor: '#5E17EB',
                          backgroundColor: 'rgba(94, 23, 235, 0.05)'
                        }
                      }}
                    >
                      {headerImage ? '画像を変更' : '画像をアップロード'}
                    </Button>
                    
                    {headerImage && (
                      <Button
                        variant="text"
                        color="error"
                        onClick={() => onHeaderImageChange && onHeaderImageChange(null)}
                        sx={{ textTransform: 'none' }}
                      >
                        画像を削除
                      </Button>
                    )}
                  </Stack>
                </AccordionDetails>
              </Accordion>

                  {/* ロゴ画像設定 */}
                  <Accordion 
                expanded={expandedAccordion === 'logo'} 
                onChange={() => setExpandedAccordion(expandedAccordion === 'logo' ? null : 'logo')}
                sx={{
                  borderRadius: '8px !important',
                  border: '1px solid #E5E7EB',
                  boxShadow: 'none',
                  '&:before': { display: 'none' },
                  backgroundColor: expandedAccordion === 'logo' ? 'rgba(94, 23, 235, 0.02)' : '#FFFFFF'
                }}
              >
                <AccordionSummary
                  expandIcon={expandedAccordion === 'logo' ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  sx={{
                    borderRadius: '8px',
                    '& .MuiAccordionSummary-content': {
                      alignItems: 'center'
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: '6px',
                        background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                      }}
                    >
                      <ImageIcon sx={{ color: 'white', fontSize: '1rem' }} />
                    </Box>
                    <Box>
                      <Typography
                        variant="body1"
                        sx={{
                          fontWeight: 600,
                          color: '#1F2937',
                          fontSize: '0.9rem'
                        }}
                      >
                        ロゴ画像
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: '#6B7280',
                          fontSize: '0.75rem'
                        }}
                      >
                        ブランドロゴやアイコン
                      </Typography>
                    </Box>
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ pt: 0 }}>
                  <Stack spacing={3}>
                    {/* 画像プレビュー */}
                    {logoImage ? (
                      <Card sx={{ borderRadius: 0, overflow: 'hidden' }}>
                        <CardContent sx={{ p: 2, textAlign: 'center' }}>
                          <Box
                            component="img"
                            src={logoImage}
                            alt="ロゴ画像"
                            sx={{
                              maxWidth: '100%',
                              maxHeight: 80,
                              objectFit: 'contain'
                            }}
                          />
                        </CardContent>
                      </Card>
                    ) : (
                      <Card 
                        sx={{ 
                          borderRadius: 0,
                          border: '2px dashed #E5E7EB',
                          backgroundColor: '#F9FAFB'
                        }}
                      >
                        <CardContent sx={{ p: 3, textAlign: 'center' }}>
                          <ImageIcon sx={{ fontSize: '2rem', color: '#9CA3AF', mb: 1 }} />
                          <Typography variant="body2" sx={{ color: '#6B7280', fontSize: '0.8rem' }}>
                            ロゴが設定されていません
                          </Typography>
                        </CardContent>
                      </Card>
                    )}
                    
                    {/* アップロードボタン */}
                    <Button
                      variant="outlined"
                      startIcon={<CloudUploadIcon />}
                      onClick={() => {
                        // ファイル選択のダイアログを開く処理
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.onchange = (e) => {
                          const file = e.target.files[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (e) => {
                              if (onLogoImageChange) {
                                onLogoImageChange(e.target.result);
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        };
                        input.click();
                      }}
                      sx={{
                        borderColor: '#E5E7EB',
                        color: '#5E17EB',
                        textTransform: 'none',
                        '&:hover': {
                          borderColor: '#5E17EB',
                          backgroundColor: 'rgba(94, 23, 235, 0.05)'
                        }
                      }}
                    >
                      {logoImage ? 'ロゴを変更' : 'ロゴをアップロード'}
                    </Button>
                    
                    {logoImage && (
                      <Button
                        variant="text"
                        color="error"
                        onClick={() => onLogoImageChange && onLogoImageChange(null)}
                        sx={{ textTransform: 'none' }}
                      >
                        ロゴを削除
                      </Button>
                    )}
                    </Stack>
                  </AccordionDetails>
                  </Accordion>
                </>
              )}
            </>
          );
  };

  return (
    <Box sx={{ height: '100%', overflow: 'hidden' }}>
      {renderMainContent()}
    </Box>
  );
};

export default QuestionSettingsMenu;