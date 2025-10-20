import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Switch,
  FormControlLabel,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Grid,
  Alert,
  AlertTitle,
  Divider,
  Stack,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  CircularProgress,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Snackbar
} from '@mui/material';
import {
  Apps,
  Visibility,
  VisibilityOff,
  Settings,
  Add,
  Edit,
  Delete,
  Info,
  CheckCircle,
  Warning,
  QuestionAnswer,
  DisplaySettings,
  Rule,
  Save,
  Cancel,
  FilterList,
  Refresh
} from '@mui/icons-material';
import { gradients } from '../../../constants/theme';
import QuestionDisplayService from '../../../services/QuestionDisplayService';
import toast from 'react-hot-toast';

const AppPage = () => {
  const [questions, setQuestions] = useState([]);
  const [displaySettings, setDisplaySettings] = useState([]);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [selectedDisplaySetting, setSelectedDisplaySetting] = useState(null);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [displayName, setDisplayName] = useState('');
  const [npsSegment, setNpsSegment] = useState('');
  const [questionOptions, setQuestionOptions] = useState([]);
  const [selectedOptionId, setSelectedOptionId] = useState('');

  // 質問タイプの名前を取得
  const getQuestionTypeName = (question) => {
    if (question?.question_types?.type_name) {
      return question.question_types.type_name;
    }
    // フォールバック
    const typeMap = {
      1: '短文回答',
      2: '長文回答', 
      3: '単一選択',
      4: '複数選択',
      5: '線形スケール',
      6: 'プルダウン',
      7: '評価スケール',
      8: '推奨度スコア'
    };
    return typeMap[question?.question_types_id] || 'その他';
  };

  // データ読み込み
  const loadData = async () => {
    setLoading(true);
    try {
      // 質問一覧を取得
      const questionsResult = await QuestionDisplayService.getAllQuestions();
      if (questionsResult.success) {
        setQuestions(questionsResult.data || []);
      }

      // 表示設定一覧を取得
      const displaySettingsResult = await QuestionDisplayService.getQuestionsWithDisplaySettingsOnly();
      if (displaySettingsResult.success) {
        setDisplaySettings(displaySettingsResult.data || []);
      }
    } catch (error) {
      console.error('データ読み込みエラー:', error);
      toast.error('データの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // データ更新
  const refreshData = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
    toast.success('データを更新しました');
  };

  useEffect(() => {
    loadData();
  }, []);

  // 表示設定追加
  const handleAddDisplaySetting = async (question) => {
    setSelectedQuestion(question);
    setDisplayName(question.question_text);
    
    // 質問タイプが3,5,8の場合は選択肢を取得
    if (QuestionDisplayService.needsRuleSettings(question.question_types_id)) {
      const optionsResult = await QuestionDisplayService.getQuestionOptions(question.id);
      if (optionsResult.success) {
        setQuestionOptions(optionsResult.data || []);
      }
    }
    
    setSettingsDialogOpen(true);
  };

  // 表示設定保存
  const handleSaveDisplaySetting = async () => {
    if (!selectedQuestion || !displayName.trim()) {
      toast.error('表示名を入力してください');
      return;
    }

    try {
      setLoading(true);
      const result = await QuestionDisplayService.createDisplaySetting(
        selectedQuestion.id,
        displayName.trim()
      );

      if (result.success) {
        toast.success('表示設定を追加しました');
        await loadData(); // データを再読み込み
        setSettingsDialogOpen(false);
        setSelectedQuestion(null);
        setDisplayName('');
      } else {
        toast.error(result.error || '表示設定の追加に失敗しました');
      }
    } catch (error) {
      console.error('表示設定追加エラー:', error);
      toast.error('表示設定の追加に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // ルール設定追加
  const handleAddRule = async (displaySetting) => {
    setSelectedDisplaySetting(displaySetting);
    setNpsSegment('');
    setSelectedOptionId('');
    
    // 選択肢を取得
    if (displaySetting.review_questions) {
      const optionsResult = await QuestionDisplayService.getQuestionOptions(
        displaySetting.review_questions.id
      );
      if (optionsResult.success) {
        setQuestionOptions(optionsResult.data || []);
      }
    }
    
    setRuleDialogOpen(true);
  };

  // ルール設定保存
  const handleSaveRuleSetting = async () => {
    if (!selectedDisplaySetting) {
      toast.error('表示設定が選択されていません');
      return;
    }

    try {
      setLoading(true);
      const result = await QuestionDisplayService.createRuleSetting(
        selectedDisplaySetting.id,
        npsSegment || null,
        selectedOptionId || null
      );

      if (result.success) {
        toast.success('ルール設定を追加しました');
        await loadData();
        setRuleDialogOpen(false);
        setSelectedDisplaySetting(null);
        setNpsSegment('');
        setSelectedOptionId('');
      } else {
        toast.error(result.error || 'ルール設定の追加に失敗しました');
      }
    } catch (error) {
      console.error('ルール設定追加エラー:', error);
      toast.error('ルール設定の追加に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // 表示設定編集
  const handleEditDisplaySetting = (displaySetting) => {
    setSelectedDisplaySetting(displaySetting);
    setDisplayName(displaySetting.display_name);
    setEditDialogOpen(true);
  };

  // 表示設定更新
  const handleUpdateDisplaySetting = async () => {
    if (!selectedDisplaySetting || !displayName.trim()) {
      toast.error('表示名を入力してください');
      return;
    }

    try {
      setLoading(true);
      const result = await QuestionDisplayService.updateDisplaySetting(
        selectedDisplaySetting.id,
        { display_name: displayName.trim() }
      );

      if (result.success) {
        toast.success('表示設定を更新しました');
        await loadData();
        setEditDialogOpen(false);
        setSelectedDisplaySetting(null);
        setDisplayName('');
      } else {
        toast.error(result.error || '表示設定の更新に失敗しました');
      }
    } catch (error) {
      console.error('表示設定更新エラー:', error);
      toast.error('表示設定の更新に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // 表示設定削除
  const handleDeleteDisplaySetting = async (displaySetting) => {
    if (!window.confirm(`「${displaySetting.display_name}」の表示設定を削除しますか？`)) {
      return;
    }

    try {
      setLoading(true);
      const result = await QuestionDisplayService.deleteDisplaySetting(displaySetting.id);

      if (result.success) {
        toast.success('表示設定を削除しました');
        await loadData();
      } else {
        toast.error(result.error || '表示設定の削除に失敗しました');
      }
    } catch (error) {
      console.error('表示設定削除エラー:', error);
      toast.error('表示設定の削除に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const getQuestionTypeChip = (question) => {
    const typeColors = {
      1: { color: '#10b981', bg: '#ecfdf5' },
      2: { color: '#06b6d4', bg: '#cffafe' },
      3: { color: '#3b82f6', bg: '#eff6ff' },
      4: { color: '#8b5cf6', bg: '#f3e8ff' },
      5: { color: '#f59e0b', bg: '#fef3c7' },
      6: { color: '#ef4444', bg: '#fef2f2' },
      7: { color: '#84cc16', bg: '#f7fee7' },
      8: { color: '#ec4899', bg: '#fdf2f8' }
    };
    
    const typeId = question?.question_types_id || question?.review_questions?.question_types_id;
    const typeConfig = typeColors[typeId] || { color: '#6b7280', bg: '#f3f4f6' };
    
    return (
      <Chip
        size="small"
        label={getQuestionTypeName(question)}
        sx={{
          backgroundColor: typeConfig.bg,
          color: typeConfig.color,
          fontWeight: 600,
          fontSize: '0.75rem'
        }}
      />
    );
  };

  const needsRuleSettings = (type) => QuestionDisplayService.needsRuleSettings(type);

  // 統計データの計算
  const stats = {
    totalQuestions: questions.length,
    withDisplaySettings: displaySettings.length,
    needsRuleSettings: questions.filter(q => needsRuleSettings(q.question_types_id)).length,
    withRuleSettings: displaySettings.reduce((count, ds) => 
      count + (ds.question_display_rule_settings?.length || 0), 0
    )
  };

  return (
    <Box
      sx={{
        p: 4,
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        minHeight: '100vh'
      }}
    >
      {/* ヘッダー */}
      <Box sx={{ mb: 4 }}>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: 2,
                  background: gradients.primary,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 10px 30px rgba(94, 23, 235, 0.3)'
                }}
              >
                <Apps sx={{ fontSize: '2rem', color: 'white' }} />
              </Box>
              <Box>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    background: 'linear-gradient(45deg, #5e17eb 30%, #764ba2 90%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}
                >
                  App 表示設定
                </Typography>
                <Typography variant="body1" sx={{ color: '#64748b', mt: 1 }}>
                  閲覧アプリで表示する質問の設定を管理します
                </Typography>
              </Box>
            </Box>
            <Box>
              <Button
                onClick={refreshData}
                disabled={refreshing}
                startIcon={refreshing ? <CircularProgress size={20} /> : <Refresh />}
                variant="outlined"
                sx={{
                  borderColor: '#667eea',
                  color: '#667eea',
                  '&:hover': {
                    borderColor: '#5a67d8',
                    backgroundColor: 'rgba(102, 126, 234, 0.05)'
                  }
                }}
              >
                更新
              </Button>
            </Box>
          </Box>
        </motion.div>
      </Box>

      {/* 統計情報 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={3}>
            <Card
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)'
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <QuestionAnswer sx={{ fontSize: '2.5rem', opacity: 0.8 }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {stats.totalQuestions}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      総質問数
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card
              sx={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                boxShadow: '0 10px 30px rgba(16, 185, 129, 0.3)'
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Visibility sx={{ fontSize: '2.5rem', opacity: 0.8 }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {stats.withDisplaySettings}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      表示設定済み
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card
              sx={{
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: 'white',
                boxShadow: '0 10px 30px rgba(245, 158, 11, 0.3)'
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Rule sx={{ fontSize: '2.5rem', opacity: 0.8 }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {stats.needsRuleSettings}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      ルール設定対象
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card
              sx={{
                background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                color: 'white',
                boxShadow: '0 10px 30px rgba(139, 92, 246, 0.3)'
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <DisplaySettings sx={{ fontSize: '2.5rem', opacity: 0.8 }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {stats.withRuleSettings}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      ルール設定済み
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </motion.div>

      {/* タブ付きコンテンツ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Paper
          elevation={0}
          sx={{
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: 3,
            overflow: 'hidden'
          }}
        >
          <Box
            sx={{
              borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
            }}
          >
            <Tabs
              value={tabValue}
              onChange={(e, value) => setTabValue(value)}
              sx={{
                '& .MuiTabs-indicator': {
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                }
              }}
            >
              <Tab 
                label={`全質問 (${stats.totalQuestions})`}
                sx={{
                  fontWeight: 600,
                  '&.Mui-selected': {
                    background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }
                }}
              />
              <Tab 
                label={`表示設定済み (${stats.withDisplaySettings})`}
                sx={{
                  fontWeight: 600,
                  '&.Mui-selected': {
                    background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }
                }}
              />
            </Tabs>
          </Box>

          {/* 全質問タブ */}
          {tabValue === 0 && (
            <Box>
              <Box
                sx={{
                  p: 3,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white'
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  質問一覧と表示設定
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                  閲覧アプリで表示したい質問を選択し、表示設定を追加してください
                </Typography>
              </Box>

              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress />
                </Box>
              ) : questions.length === 0 ? (
                <Box sx={{ textAlign: 'center', p: 4 }}>
                  <Typography variant="h6" sx={{ color: '#64748b', mb: 1 }}>
                    質問が見つかりません
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                    まず質問を作成してください
                  </Typography>
                </Box>
              ) : (
                <List sx={{ p: 0 }}>
                  {questions.map((question, index) => {
                    const hasDisplaySetting = displaySettings.some(
                      ds => ds.review_questions?.id === question.id
                    );
                    
                    return (
                      <motion.div
                        key={question.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.1 }}
                      >
                        <ListItem
                          sx={{
                            py: 2,
                            px: 3,
                            borderBottom: index < questions.length - 1 ? '1px solid rgba(0, 0, 0, 0.05)' : 'none',
                            '&:hover': {
                              backgroundColor: 'rgba(94, 23, 235, 0.02)'
                            }
                          }}
                        >
                          <ListItemIcon>
                            <Box
                              sx={{
                                width: 40,
                                height: 40,
                                borderRadius: 2,
                                background: hasDisplaySetting
                                  ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                                  : needsRuleSettings(question.question_types_id) 
                                    ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                                    : 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white'
                              }}
                            >
                              {hasDisplaySetting ? <CheckCircle /> : <QuestionAnswer />}
                            </Box>
                          </ListItemIcon>
                          
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                  {question.question_text}
                                </Typography>
                                {getQuestionTypeChip(question)}
                                {hasDisplaySetting && (
                                  <Chip
                                    size="small"
                                    icon={<CheckCircle sx={{ fontSize: '0.875rem' }} />}
                                    label="設定済み"
                                    sx={{
                                      backgroundColor: '#ecfdf5',
                                      color: '#10b981',
                                      fontWeight: 600,
                                      fontSize: '0.7rem'
                                    }}
                                  />
                                )}
                                {needsRuleSettings(question.question_types_id) && !hasDisplaySetting && (
                                  <Chip
                                    size="small"
                                    icon={<Rule sx={{ fontSize: '0.875rem' }} />}
                                    label="ルール設定必要"
                                    sx={{
                                      backgroundColor: '#fef3c7',
                                      color: '#f59e0b',
                                      fontWeight: 600,
                                      fontSize: '0.7rem'
                                    }}
                                  />
                                )}
                              </Box>
                            }
                            secondary={
                              <Typography variant="body2" sx={{ color: '#64748b' }}>
                                質問ID: {question.id} • タイプID: {question.question_types_id} • 
                                作成日: {new Date(question.created_at).toLocaleDateString('ja-JP')}
                              </Typography>
                            }
                          />

                          <ListItemSecondaryAction>
                            <Stack direction="row" spacing={1}>
                              {!hasDisplaySetting && (
                                <Tooltip title="表示設定を追加">
                                  <IconButton
                                    onClick={() => handleAddDisplaySetting(question)}
                                    sx={{
                                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                      color: 'white',
                                      '&:hover': {
                                        background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)'
                                      }
                                    }}
                                  >
                                    <Add />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </Stack>
                          </ListItemSecondaryAction>
                        </ListItem>
                      </motion.div>
                    );
                  })}
                </List>
              )}
            </Box>
          )}

          {/* 表示設定済み質問タブ */}
          {tabValue === 1 && (
            <Box>
              <Box
                sx={{
                  p: 3,
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white'
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  表示設定済み質問
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                  閲覧アプリで表示される質問の管理（編集・削除・ルール設定）
                </Typography>
              </Box>

              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress />
                </Box>
              ) : displaySettings.length === 0 ? (
                <Box sx={{ textAlign: 'center', p: 4 }}>
                  <Typography variant="h6" sx={{ color: '#64748b', mb: 1 }}>
                    表示設定済みの質問がありません
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                    「全質問」タブから表示設定を追加してください
                  </Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>表示名</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>質問内容</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>タイプ</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>ルール設定</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>作成日</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>操作</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {displaySettings.map((setting, index) => (
                        <motion.tr
                          key={setting.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: index * 0.1 }}
                          component={TableRow}
                          sx={{
                            '&:hover': {
                              backgroundColor: 'rgba(94, 23, 235, 0.02)'
                            }
                          }}
                        >
                          <TableCell>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              {setting.display_name}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ maxWidth: 300 }}>
                              {setting.review_questions?.question_text}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {getQuestionTypeChip(setting)}
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2">
                                {setting.question_display_rule_settings?.length || 0} 件
                              </Typography>
                              {needsRuleSettings(setting.review_questions?.question_types_id) && (
                                <Tooltip title="ルール設定を追加">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleAddRule(setting)}
                                    sx={{
                                      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                      color: 'white',
                                      '&:hover': {
                                        background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)'
                                      }
                                    }}
                                  >
                                    <Add sx={{ fontSize: '1rem' }} />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ color: '#64748b' }}>
                              {new Date(setting.created_at).toLocaleDateString('ja-JP')}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={1}>
                              <Tooltip title="編集">
                                <IconButton
                                  size="small"
                                  onClick={() => handleEditDisplaySetting(setting)}
                                  sx={{
                                    color: '#667eea',
                                    '&:hover': {
                                      backgroundColor: 'rgba(102, 126, 234, 0.1)'
                                    }
                                  }}
                                >
                                  <Edit />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="削除">
                                <IconButton
                                  size="small"
                                  onClick={() => handleDeleteDisplaySetting(setting)}
                                  sx={{
                                    color: '#ef4444',
                                    '&:hover': {
                                      backgroundColor: 'rgba(239, 68, 68, 0.1)'
                                    }
                                  }}
                                >
                                  <Delete />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </TableCell>
                        </motion.tr>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}
        </Paper>
      </motion.div>

      {/* 表示設定ダイアログ */}
      <Dialog
        open={settingsDialogOpen}
        onClose={() => {
          setSettingsDialogOpen(false);
          setSelectedQuestion(null);
          setDisplayName('');
        }}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)'
          }
        }}
      >
        <DialogTitle
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}
        >
          <DisplaySettings />
          表示設定の追加
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {selectedQuestion && (
            <Box>
              <Alert severity="info" sx={{ mb: 3 }}>
                <AlertTitle>質問情報</AlertTitle>
                <Typography variant="body2">
                  {selectedQuestion.question_text}（タイプ: {getQuestionTypeName(selectedQuestion)}）
                </Typography>
              </Alert>
              
              <TextField
                fullWidth
                label="表示名"
                placeholder="閲覧アプリで表示される名前を入力"
                variant="outlined"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                sx={{ mb: 2 }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button
            onClick={() => {
              setSettingsDialogOpen(false);
              setSelectedQuestion(null);
              setDisplayName('');
            }}
            startIcon={<Cancel />}
            sx={{ color: '#64748b' }}
          >
            キャンセル
          </Button>
          <Button
            onClick={handleSaveDisplaySetting}
            variant="contained"
            startIcon={<Save />}
            disabled={loading}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)'
              }
            }}
          >
            {loading ? <CircularProgress size={20} /> : '保存'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 編集ダイアログ */}
      <Dialog
        open={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
          setSelectedDisplaySetting(null);
          setDisplayName('');
        }}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)'
          }
        }}
      >
        <DialogTitle
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}
        >
          <Edit />
          表示設定の編集
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {selectedDisplaySetting && (
            <Box>
              <Alert severity="info" sx={{ mb: 3 }}>
                <AlertTitle>質問情報</AlertTitle>
                <Typography variant="body2">
                  {selectedDisplaySetting.review_questions?.question_text}
                  （タイプ: {getQuestionTypeName(selectedDisplaySetting)}）
                </Typography>
              </Alert>
              
              <TextField
                fullWidth
                label="表示名"
                placeholder="閲覧アプリで表示される名前を入力"
                variant="outlined"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                sx={{ mb: 2 }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button
            onClick={() => {
              setEditDialogOpen(false);
              setSelectedDisplaySetting(null);
              setDisplayName('');
            }}
            startIcon={<Cancel />}
            sx={{ color: '#64748b' }}
          >
            キャンセル
          </Button>
          <Button
            onClick={handleUpdateDisplaySetting}
            variant="contained"
            startIcon={<Save />}
            disabled={loading}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)'
              }
            }}
          >
            {loading ? <CircularProgress size={20} /> : '更新'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ルール設定ダイアログ */}
      <Dialog
        open={ruleDialogOpen}
        onClose={() => {
          setRuleDialogOpen(false);
          setSelectedDisplaySetting(null);
          setNpsSegment('');
          setSelectedOptionId('');
        }}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)'
          }
        }}
      >
        <DialogTitle
          sx={{
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}
        >
          <Rule />
          ルール設定の追加
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {selectedDisplaySetting && (
            <Box>
              <Alert severity="warning" sx={{ mb: 3 }}>
                <AlertTitle>ルール設定が必要な質問</AlertTitle>
                <Typography variant="body2">
                  {selectedDisplaySetting.review_questions?.question_text}
                  （質問タイプ {selectedDisplaySetting.review_questions?.question_types_id}）には、追加のルール設定が必要です。
                </Typography>
              </Alert>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>NPSセグメント</InputLabel>
                    <Select 
                      label="NPSセグメント"
                      value={npsSegment}
                      onChange={(e) => setNpsSegment(e.target.value)}
                    >
                      {QuestionDisplayService.getNpsSegments().map((segment) => (
                        <MenuItem key={segment.value} value={segment.value}>
                          {segment.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>選択肢</InputLabel>
                    <Select 
                      label="選択肢"
                      value={selectedOptionId}
                      onChange={(e) => setSelectedOptionId(e.target.value)}
                    >
                      {questionOptions.map((option) => (
                        <MenuItem key={option.id} value={option.id}>
                          {option.option_text}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button
            onClick={() => {
              setRuleDialogOpen(false);
              setSelectedDisplaySetting(null);
              setNpsSegment('');
              setSelectedOptionId('');
            }}
            startIcon={<Cancel />}
            sx={{ color: '#64748b' }}
          >
            キャンセル
          </Button>
          <Button
            onClick={handleSaveRuleSetting}
            variant="contained"
            startIcon={<Save />}
            disabled={loading}
            sx={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)'
              }
            }}
          >
            {loading ? <CircularProgress size={20} /> : '保存'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AppPage;