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
    8: { icon: <DropdownIcon />, name: 'プルダウン', color: '#84CC16', gradient: 'linear-gradient(135deg, #84CC16 0%, #65A30D 100%)' },
    9: { icon: <RadioIcon />, name: '単一選択(2列)', color: '#F59E0B', gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' },
    10: { icon: <CheckboxIcon />, name: '複数選択(2列)', color: '#EF4444', gradient: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)' }
  };
  return configs[typeId] || configs[1];
};

// スタイリッシュなテキストフィールドコンポーネント
const StylishTextField = ({ label, value, onChange, onBlur, multiline = false, rows = 1, maxRows, minRows, placeholder, required = false, ...props }) => (
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
      onBlur={onBlur}
      multiline={multiline}
      rows={multiline ? undefined : rows}
      maxRows={maxRows}
      minRows={minRows}
      placeholder={placeholder}
      fullWidth
      variant="outlined"
      sx={{
        '& .MuiOutlinedInput-root': {
          backgroundColor: '#F8FAFC',
          borderRadius: '2px',
          fontSize: '0.875rem',
          fontWeight: 400,
          border: 'none',
          padding: '0 !important',
          '& fieldset': {
            border: '1px solid #E2E8F0',
            borderRadius: '2px'
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
            fontSize: '0.875rem',
            lineHeight: '1.4375em',
            verticalAlign: 'middle'
          },
          '& textarea.MuiOutlinedInput-input': {
            padding: '8px 8px 0 8px !important',
            fontSize: '0.875rem',
            resize: 'none',
            lineHeight: '1.4375em',
            verticalAlign: 'top'
          },
          '& textarea.MuiOutlinedInput-input::placeholder': {
            lineHeight: '1.4375em',
            opacity: 0.6
          },
          '&.MuiInputBase-multiline': {
            padding: '0 !important',
            '& .MuiOutlinedInput-input': {
              padding: '8px 8px 0 8px !important',
              fontSize: '0.875rem',
              lineHeight: '1.4375em',
              verticalAlign: 'top'
            },
            '& .MuiOutlinedInput-input::placeholder': {
              lineHeight: '1.4375em',
              opacity: 0.6
            }
          }
        },
        '& .MuiInputBase-root': {
          padding: '0 !important'
        },
        '& .MuiInputBase-root.MuiInputBase-multiline': {
          padding: '0 !important',
          '& .MuiOutlinedInput-input': {
            padding: '8px 8px 0 8px !important',
            fontSize: '0.875rem',
            lineHeight: '1.4375em',
            verticalAlign: 'top'
          },
          '& .MuiOutlinedInput-input::placeholder': {
            lineHeight: '1.4375em',
            opacity: 0.6
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
  // 専用テーブル更新用のprops
  onChoiceOptionsUpdate,
  onLinearScaleOptionsUpdate,
  // 基本設定用のprops
  selectedElement = null, // プレビューで選択された要素 ('header', 'logo', null)
  selectedPage = null, // 選択されたページ
  questionTypesData = [], // Supabaseから取得した質問タイプデータ
  headerImage = null,
  logoImage = null,
  onHeaderImageChange,
  onLogoImageChange,
  // テキスト設定のprops
  loginTitle,
  setLoginTitle,
  loginDetail,
  setLoginDetail,
  completionTitle,
  setCompletionTitle,
  completionDetail,
  setCompletionDetail,
  completionBackground,
  setCompletionBackground
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
  
  // テキストフィールドのローカル状態管理（onBlur時に更新）
  const [localTextValues, setLocalTextValues] = useState({
    question_text: '',
    question_detail_text: ''
  });
  const [localLoginTitle, setLocalLoginTitle] = useState('');
  const [localLoginDetail, setLocalLoginDetail] = useState('');
  const [localCompletionTitle, setLocalCompletionTitle] = useState('');
  const [localCompletionDetail, setLocalCompletionDetail] = useState('');
  
  // 選択肢のローカル状態
  const [localChoices, setLocalChoices] = useState([]);
  
  // 質問設定のローカル状態
  const [localQuestionSettings, setLocalQuestionSettings] = useState({
    is_required: false
  });
  
  // スケール設定のローカル状態
  const [localScaleSettings, setLocalScaleSettings] = useState({
    minValue: 1,
    maxValue: 5,
    minLabel: 'そう思わない',
    maxLabel: 'そう思う'
  });

  const selectedQuestion = questions.find(q => q.id === selectedQuestionId);

  // 選択された質問が変更された時にローカル状態を初期化
  useEffect(() => {
    if (selectedQuestion) {
      setLocalTextValues({
        question_text: selectedQuestion.question_text || '',
        question_detail_text: selectedQuestion.question_detail_text || ''
      });
      
      // 選択肢のローカル状態も初期化
      const currentChoices = selectedQuestion.choices ? JSON.parse(selectedQuestion.choices) : [];
      setLocalChoices(currentChoices);
      
      // 質問設定のローカル状態も初期化
      setLocalQuestionSettings({
        is_required: selectedQuestion.is_required || false
      });
      
      // スケール設定のローカル状態も初期化
      if (selectedQuestion.scale_settings) {
        const scaleSettings = JSON.parse(selectedQuestion.scale_settings);
        setLocalScaleSettings({
          minValue: scaleSettings.minValue || 1,
          maxValue: scaleSettings.maxValue || 5,
          minLabel: scaleSettings.minLabel || 'そう思わない',
          maxLabel: scaleSettings.maxLabel || 'そう思う'
        });
      } else {
        setLocalScaleSettings({
          minValue: 1,
          maxValue: 5,
          minLabel: 'そう思わない',
          maxLabel: 'そう思う'
        });
      }
    }
  }, [selectedQuestion]);

  // ログイン・完了画面のテキストのローカル状態を初期化
  useEffect(() => {
    setLocalLoginTitle(loginTitle || '');
  }, [loginTitle]);

  useEffect(() => {
    setLocalLoginDetail(loginDetail || '');
  }, [loginDetail]);

  useEffect(() => {
    setLocalCompletionTitle(completionTitle || '');
  }, [completionTitle]);

  useEffect(() => {
    setLocalCompletionDetail(completionDetail || '');
  }, [completionDetail]);

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

  // 質問の基本設定更新（楽観的UI更新）
  const handleQuestionUpdate = (field, value) => {
    if (onQuestionUpdate && selectedQuestion) {
      // バックグラウンドでSupabaseに同期
      onQuestionUpdate(selectedQuestion.id, { [field]: value });
    }
  };

  // テキスト変更時の即座更新（プレビュー用）
  const handleTextChange = (field, value) => {
    // ローカル状態を即座に更新
    setLocalTextValues(prev => ({ ...prev, [field]: value }));
    
    // プレビューにも即座に反映（楽観的更新）
    if (onQuestionUpdate && selectedQuestion) {
      onQuestionUpdate(selectedQuestion.id, { [field]: value });
    }
  };

  // 必須設定の楽観的更新ハンドラ
  const handleRequiredChange = (checked) => {
    // 即座にローカル状態を更新（楽観的更新）
    setLocalQuestionSettings(prev => ({ ...prev, is_required: checked }));
    
    // バックグラウンドでSupabaseに同期
    handleQuestionUpdate('is_required', checked);
  };

  // テキストフィールドのonBlur時更新ハンドラ
  const handleTextBlur = (field, value) => {
    if (selectedQuestion && selectedQuestion[field] !== value) {
      handleQuestionUpdate(field, value);
    }
  };

  // ログイン・完了画面のテキスト即座更新ハンドラ
  const handleLoginTitleChange = (value) => {
    setLocalLoginTitle(value);
    setLoginTitle(value); // 即座にプレビューに反映
  };

  const handleLoginDetailChange = (value) => {
    setLocalLoginDetail(value);
    setLoginDetail(value); // 即座にプレビューに反映
  };

  const handleCompletionTitleChange = (value) => {
    setLocalCompletionTitle(value);
    setCompletionTitle(value); // 即座にプレビューに反映
  };

  const handleCompletionDetailChange = (value) => {
    setLocalCompletionDetail(value);
    setCompletionDetail(value); // 即座にプレビューに反映
  };

  // ログイン・完了画面のテキストのonBlur時更新ハンドラ（データベース保存用）
  const handleLoginTitleBlur = () => {
    if (loginTitle !== localLoginTitle) {
      setLoginTitle(localLoginTitle);
    }
  };

  const handleLoginDetailBlur = () => {
    if (loginDetail !== localLoginDetail) {
      setLoginDetail(localLoginDetail);
    }
  };

  const handleCompletionTitleBlur = () => {
    if (completionTitle !== localCompletionTitle) {
      setCompletionTitle(localCompletionTitle);
    }
  };

  const handleCompletionDetailBlur = () => {
    if (completionDetail !== localCompletionDetail) {
      setCompletionDetail(localCompletionDetail);
    }
  };

  // 選択肢の更新（専用テーブルに直接保存）
  const handleChoicesUpdate = (choices) => {
    if (onChoiceOptionsUpdate && selectedQuestion) {
      onChoiceOptionsUpdate(selectedQuestion.id, choices);
    }
  };

  // 選択肢の追加（楽観的更新）
  const handleAddChoice = () => {
    const newLocalChoices = [...localChoices, `選択肢 ${localChoices.length + 1}`];
    // 即座にローカル状態を更新
    setLocalChoices(newLocalChoices);
    // バックグラウンドでSupabaseに同期
    handleChoicesUpdate(newLocalChoices);
  };

  // 選択肢の削除（楽観的更新）
  const handleRemoveChoice = (index) => {
    const newLocalChoices = localChoices.filter((_, i) => i !== index);
    // 即座にローカル状態を更新
    setLocalChoices(newLocalChoices);
    // バックグラウンドでSupabaseに同期
    handleChoicesUpdate(newLocalChoices);
  };

  // 選択肢の編集
  const handleChoiceEdit = (index, value) => {
    const currentChoices = selectedQuestion.choices ? JSON.parse(selectedQuestion.choices) : [];
    const newChoices = [...currentChoices];
    newChoices[index] = value;
    handleChoicesUpdate(newChoices);
  };

  // 選択肢のローカル変更ハンドラ（即座にプレビューに反映）
  const handleLocalChoiceChange = (index, value) => {
    const newLocalChoices = [...localChoices];
    newLocalChoices[index] = value;
    setLocalChoices(newLocalChoices);
    
    // プレビューにも即座に反映
    handleChoicesUpdate(newLocalChoices);
  };

  // 選択肢のonBlur時更新ハンドラ
  const handleChoiceBlur = (index, value) => {
    const currentChoices = selectedQuestion.choices ? JSON.parse(selectedQuestion.choices) : [];
    if (currentChoices[index] !== value) {
      handleChoiceEdit(index, value);
    }
  };

  // スケール設定の楽観的更新（専用テーブルに直接保存）
  const handleScaleUpdate = (field, value) => {
    // 即座にローカル状態を更新
    const newSettings = { ...localScaleSettings, [field]: value };
    setLocalScaleSettings(newSettings);
    
    // 専用テーブルに保存（プレビューには楽観的更新で即座に反映）
    if (onLinearScaleOptionsUpdate && selectedQuestion) {
      onLinearScaleOptionsUpdate(selectedQuestion.id, newSettings);
    }
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
        
        // Supabaseから取得した質問タイプデータを使用して動的に判定
        const questionTypeData = questionTypesData.find(qt => qt.id === typeId);
        const typeName = questionTypeData ? questionTypeData.japanese : '';
        const needsChoicesForType = typeName.includes('選択') || typeName.includes('プルダウン');
        

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
                checked={localQuestionSettings.is_required}
                onChange={(e) => handleRequiredChange(e.target.checked)}
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
              value={localTextValues.question_text}
              onChange={(e) => handleTextChange('question_text', e.target.value)}
              onBlur={(e) => handleTextBlur('question_text', e.target.value)}
              multiline
              minRows={1}
              maxRows={3}
              placeholder="質問を入力してください..."
            />

            {/* 詳細テキスト */}
            <StylishTextField
              label="詳細テキスト (オプション)"
              value={localTextValues.question_detail_text}
              onChange={(e) => handleTextChange('question_detail_text', e.target.value)}
              onBlur={(e) => handleTextBlur('question_detail_text', e.target.value)}
              multiline
              minRows={1}
              maxRows={3}
              placeholder="詳細説明を入力してください..."
            />

            {/* 質問タイプ別の追加設定 - Supabaseデータベースに基づいて動的に判定 */}
            {needsChoicesForType && (
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
                  {localChoices.map((choice, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography sx={{ minWidth: 20, fontSize: '0.875rem', color: '#6B7280' }}>
                        {index + 1}.
                      </Typography>
                      <TextField
                        value={choice}
                        onChange={(e) => handleLocalChoiceChange(index, e.target.value)}
                        onBlur={(e) => handleChoiceBlur(index, e.target.value)}
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

            {/* リニアスケール設定 - Supabaseデータベースに基づいて動的に判定 */}
            {(typeName.includes('スケール') || typeName.includes('リニア') || typeId === 7) && (
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
                      value={localScaleSettings.minValue}
                      onChange={(e) => handleScaleUpdate('minValue', parseInt(e.target.value) || 1)}
                      type="number"
                      placeholder="1"
                    />
                    <StylishTextField
                      label="最大値"
                      value={localScaleSettings.maxValue}
                      onChange={(e) => handleScaleUpdate('maxValue', parseInt(e.target.value) || 5)}
                      type="number"
                      placeholder="5"
                    />
                  </Box>
                  <StylishTextField
                    label="最小値ラベル"
                    value={localScaleSettings.minLabel}
                    onChange={(e) => handleScaleUpdate('minLabel', e.target.value)}
                    placeholder="例: そう思わない"
                  />
                  <StylishTextField
                    label="最大値ラベル"
                    value={localScaleSettings.maxLabel}
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
                  // Supabaseデータから質問タイプ情報を取得
                  const questionTypeData = questionTypesData.find(qt => qt.id === question.question_types_id);
                  const config = questionTypeData ? {
                    icon: <TextIcon />, // SVGアイコンは後で実装
                    name: questionTypeData.japanese,
                    color: '#3B82F6',
                    gradient: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)'
                  } : getQuestionTypeConfig(question.question_types_id);
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
                            sx={{ 
                              minWidth: 0, // フレックスコンテナ内での縮小を有効化
                              overflow: 'hidden' // コンテナのオーバーフローを防止
                            }}
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
                                  mb: 0.3,
                                  maxWidth: '100%' // 明示的に最大幅を指定
                                }}
                                title={question.question_text || '無題の質問'} // ホバー時に全文表示
                              >
                                {question.question_text || '無題の質問'}
                              </Typography>
                            }
                            secondary={
                              <Box sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 1,
                                minWidth: 0, // フレックスコンテナ内での縮小を有効化
                                overflow: 'hidden' // コンテナのオーバーフローを防止
                              }}>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: '#6B7280',
                                    fontSize: '0.7rem',
                                    fontWeight: 500,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    flex: '1 1 auto', // フレックスアイテムとして縮小可能
                                    minWidth: 0 // 縮小を有効化
                                  }}
                                  title={config.name} // ホバー時に全文表示
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
                                      flexShrink: 0, // チップの縮小を防止
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
        {/* フォーム基本設定 - 常に表示 */}
        <Box sx={{ mb: 3 }}>
          
          {/* テーマカラー設定 */}
          <Accordion 
            expanded={expandedAccordion === 'theme-color'} 
            onChange={() => setExpandedAccordion(expandedAccordion === 'theme-color' ? null : 'theme-color')}
            sx={{
              borderRadius: '8px !important',
              border: '1px solid #E5E7EB',
              boxShadow: 'none',
              '&:before': { display: 'none' },
              backgroundColor: expandedAccordion === 'theme-color' ? 'rgba(94, 23, 235, 0.02)' : '#FFFFFF',
              mb: 2
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
                <Box sx={{ minWidth: 0, overflow: 'hidden' }}>
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: 600,
                      color: '#1F2937',
                      fontSize: '0.9rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                    title="テーマカラー"
                  >
                    テーマカラー
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#6B7280',
                      fontSize: '0.75rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                    title="アプリ全体のメインカラー"
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
                      value={selectedColor}
                      onChange={(e) => {
                        setSelectedColor(e.target.value);
                        handleColorChange({ hex: e.target.value });
                      }}
                      placeholder="#5e17eb"
                      sx={{ 
                        flex: 1,
                        '& .MuiOutlinedInput-input': {
                          padding: '8px 8px !important'
                        }
                      }}
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

          {/* ヘッダー画像設定 */}
          <Accordion 
            expanded={expandedAccordion === 'header'} 
            onChange={() => setExpandedAccordion(expandedAccordion === 'header' ? null : 'header')}
            sx={{
              borderRadius: '8px !important',
              border: '1px solid #E5E7EB',
              boxShadow: 'none',
              '&:before': { display: 'none' },
              backgroundColor: expandedAccordion === 'header' ? 'rgba(94, 23, 235, 0.02)' : '#FFFFFF',
              mb: 2
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
                <Box sx={{ minWidth: 0, overflow: 'hidden' }}>
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: 600,
                      color: '#1F2937',
                      fontSize: '0.9rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                    title="背景画像"
                  >
                    背景画像
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#6B7280',
                      fontSize: '0.75rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                    title="画面の背景に表示される画像"
                  >
                    画面の背景に表示される画像
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
                  {headerImage ? '背景画像を変更' : '背景画像をアップロード'}
                </Button>
                
                {headerImage && (
                  <Button
                    variant="text"
                    color="error"
                    onClick={() => onHeaderImageChange && onHeaderImageChange(null)}
                    sx={{ textTransform: 'none' }}
                  >
                    背景画像を削除
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
                <Box sx={{ minWidth: 0, overflow: 'hidden' }}>
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: 600,
                      color: '#1F2937',
                      fontSize: '0.9rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                    title="ロゴ画像"
                  >
                    ロゴ画像
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#6B7280',
                      fontSize: '0.75rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                    title="ブランドロゴやアイコン"
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
        </Box>

          {/* ログイン画面テキスト設定 - フォーム基本設定に統合 */}
          {(isLoginPage || selectedElement?.startsWith('login-')) && (
            <>
              <Accordion 
                expanded={expandedAccordion === 'login-title'} 
                onChange={() => setExpandedAccordion(expandedAccordion === 'login-title' ? null : 'login-title')}
                sx={{
                  borderRadius: '8px !important',
                  border: '1px solid #E5E7EB',
                  boxShadow: 'none',
                  '&:before': { display: 'none' },
                  backgroundColor: expandedAccordion === 'login-title' ? 'rgba(94, 23, 235, 0.02)' : '#FFFFFF',
                  mb: 2
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
                    value={localLoginTitle}
                    onChange={(e) => handleLoginTitleChange(e.target.value)}
                    onBlur={handleLoginTitleBlur}
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
                  backgroundColor: expandedAccordion === 'login-detail' ? 'rgba(94, 23, 235, 0.02)' : '#FFFFFF',
                  mb: 2
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
                </AccordionSummary>
                <AccordionDetails sx={{ pt: 0 }}>
                  <StylishTextField
                    label="詳細テキスト"
                    value={localLoginDetail}
                    onChange={(e) => handleLoginDetailChange(e.target.value)}
                    onBlur={handleLoginDetailBlur}
                    multiline
                    minRows={1}
                    maxRows={3}
                    placeholder="ログイン画面の説明文"
                  />
                </AccordionDetails>
              </Accordion>
            </>
          )}

        {/* 完了画面設定 */}
        {(isCompletionPage || selectedElement?.startsWith('completion-')) && (
          <>
            
            {/* ボタン設定 */}
            <Accordion 
              expanded={expandedAccordion === 'completion-button'} 
              onChange={() => setExpandedAccordion(expandedAccordion === 'completion-button' ? null : 'completion-button')}
              sx={{
                borderRadius: '8px !important',
                border: '1px solid #E5E7EB',
                boxShadow: 'none',
                '&:before': { display: 'none' },
                backgroundColor: expandedAccordion === 'completion-button' ? 'rgba(94, 23, 235, 0.02)' : '#FFFFFF',
                mb: 2
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
                </Stack>
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
                backgroundColor: expandedAccordion === 'completion-title' ? 'rgba(94, 23, 235, 0.02)' : '#FFFFFF',
                mb: 2
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
                  value={localCompletionTitle}
                  onChange={(e) => handleCompletionTitleChange(e.target.value)}
                  onBlur={handleCompletionTitleBlur}
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
                  value={localCompletionDetail}
                  onChange={(e) => handleCompletionDetailChange(e.target.value)}
                  onBlur={handleCompletionDetailBlur}
                  multiline
                  minRows={1}
                  maxRows={3}
                  placeholder="完了画面の説明文"
                />
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