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
  ListItemSecondaryAction
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
  FilterList
} from '@mui/icons-material';
import { gradients } from '../../../constants/theme';

const AppPage = () => {
  const [questions, setQuestions] = useState([]);
  const [displaySettings, setDisplaySettings] = useState([]);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // モックデータ
  const mockQuestions = [
    { id: 1, title: 'サービスの満足度を教えてください', type: 3, type_name: '単一選択' },
    { id: 2, title: '改善点があれば教えてください', type: 1, type_name: '短文回答' },
    { id: 3, title: 'おすすめ度はいかがですか？', type: 5, type_name: '線形スケール' },
    { id: 4, title: '今後も利用したいですか？', type: 3, type_name: '単一選択' },
    { id: 5, title: '推奨度スコア', type: 8, type_name: '推奨度スコア' }
  ];

  useEffect(() => {
    setQuestions(mockQuestions);
  }, []);

  const handleAddDisplaySetting = (question) => {
    setSelectedQuestion(question);
    setSettingsDialogOpen(true);
  };

  const handleSaveDisplaySetting = () => {
    // TODO: データベースに保存
    setSettingsDialogOpen(false);
    setSelectedQuestion(null);
  };

  const handleAddRule = (setting) => {
    setSelectedQuestion(setting);
    setRuleDialogOpen(true);
  };

  const getQuestionTypeChip = (type) => {
    const typeColors = {
      1: { color: '#10b981', bg: '#ecfdf5' },
      3: { color: '#3b82f6', bg: '#eff6ff' },
      5: { color: '#8b5cf6', bg: '#f3e8ff' },
      8: { color: '#f59e0b', bg: '#fef3c7' }
    };
    
    const typeConfig = typeColors[type] || { color: '#6b7280', bg: '#f3f4f6' };
    
    return (
      <Chip
        size="small"
        label={mockQuestions.find(q => q.type === type)?.type_name || 'その他'}
        sx={{
          backgroundColor: typeConfig.bg,
          color: typeConfig.color,
          fontWeight: 600,
          fontSize: '0.75rem'
        }}
      />
    );
  };

  const needsRuleSettings = (type) => [3, 5, 8].includes(type);

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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
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
                      {questions.length}
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
                      {displaySettings.length}
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
                      {questions.filter(q => needsRuleSettings(q.type)).length}
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
                      0
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

      {/* 質問一覧 */}
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
              p: 3,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white'
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              質問一覧と表示設定
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
              閲覧アプリで表示したい質問を選択し、必要に応じてルールを設定してください
            </Typography>
          </Box>

          <List sx={{ p: 0 }}>
            {questions.map((question, index) => (
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
                        background: needsRuleSettings(question.type) 
                          ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                          : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white'
                      }}
                    >
                      <QuestionAnswer />
                    </Box>
                  </ListItemIcon>
                  
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {question.title}
                        </Typography>
                        {getQuestionTypeChip(question.type)}
                        {needsRuleSettings(question.type) && (
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
                        質問ID: {question.id} • タイプ: {question.type}
                      </Typography>
                    }
                  />

                  <ListItemSecondaryAction>
                    <Stack direction="row" spacing={1}>
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
                      {needsRuleSettings(question.type) && (
                        <Tooltip title="ルール設定">
                          <IconButton
                            onClick={() => handleAddRule(question)}
                            sx={{
                              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                              color: 'white',
                              '&:hover': {
                                background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)'
                              }
                            }}
                          >
                            <Rule />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Stack>
                  </ListItemSecondaryAction>
                </ListItem>
              </motion.div>
            ))}
          </List>
        </Paper>
      </motion.div>

      {/* 表示設定ダイアログ */}
      <Dialog
        open={settingsDialogOpen}
        onClose={() => setSettingsDialogOpen(false)}
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
                  {selectedQuestion.title}（タイプ: {selectedQuestion.type_name}）
                </Typography>
              </Alert>
              
              <TextField
                fullWidth
                label="表示名"
                placeholder="閲覧アプリで表示される名前を入力"
                variant="outlined"
                sx={{ mb: 2 }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button
            onClick={() => setSettingsDialogOpen(false)}
            startIcon={<Cancel />}
            sx={{ color: '#64748b' }}
          >
            キャンセル
          </Button>
          <Button
            onClick={handleSaveDisplaySetting}
            variant="contained"
            startIcon={<Save />}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)'
              }
            }}
          >
            保存
          </Button>
        </DialogActions>
      </Dialog>

      {/* ルール設定ダイアログ */}
      <Dialog
        open={ruleDialogOpen}
        onClose={() => setRuleDialogOpen(false)}
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
          {selectedQuestion && (
            <Box>
              <Alert severity="warning" sx={{ mb: 3 }}>
                <AlertTitle>ルール設定が必要な質問</AlertTitle>
                <Typography variant="body2">
                  質問タイプ {selectedQuestion.type} の質問には、追加のルール設定が必要です。
                </Typography>
              </Alert>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>NPSセグメント</InputLabel>
                    <Select label="NPSセグメント">
                      <MenuItem value="promoter">Promoter</MenuItem>
                      <MenuItem value="passive">Passive</MenuItem>
                      <MenuItem value="detractor">Detractor</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>選択肢</InputLabel>
                    <Select label="選択肢">
                      <MenuItem value="option1">選択肢 1</MenuItem>
                      <MenuItem value="option2">選択肢 2</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button
            onClick={() => setRuleDialogOpen(false)}
            startIcon={<Cancel />}
            sx={{ color: '#64748b' }}
          >
            キャンセル
          </Button>
          <Button
            variant="contained"
            startIcon={<Save />}
            sx={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)'
              }
            }}
          >
            保存
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AppPage;