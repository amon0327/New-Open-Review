import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Tooltip,
  Stack,
  Grid,
  Collapse,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  ArrowBack,
  Save,
  Preview,
  MoreVert,
  Add,
  TextFields,
  RadioButtonChecked,
  CheckBox,
  LinearScale,
  ExpandMore,
  Image,
  Description,
  Settings,
  Palette,
  PhoneAndroid,
  Computer,
  ZoomIn,
  ZoomOut,
  FitScreen,
  Folder,
  Edit,
  RateReview,
  ExpandMore as ExpandMoreIcon,
  Business,
  Person,
  School,
  LocalHospital
} from '@mui/icons-material';

// 左ナビゲーションアイテムの定義
const leftNavigationItems = [
  { icon: <RateReview />, label: 'OpenReview', category: 'main' },
  { icon: <Folder />, label: 'フォルダー', category: 'main' },
  { icon: <Edit />, label: '編集', category: 'main' },
  { icon: <Settings />, label: '設定', category: 'main' }
];

// 質問タイプの定義
const questionTypes = [
  { icon: <TextFields />, label: '短文回答', type: 'text' },
  { icon: <Description />, label: '長文回答', type: 'textarea' },
  { icon: <RadioButtonChecked />, label: '単一選択', type: 'radio' },
  { icon: <CheckBox />, label: '複数選択', type: 'checkbox' },
  { icon: <ExpandMore />, label: 'プルダウン', type: 'select' },
  { icon: <LinearScale />, label: '線形スケール', type: 'scale' },
  { icon: <Image />, label: '画像アップロード', type: 'image' }
];

// テンプレート質問の定義
const questionTemplates = [
  {
    id: 'business',
    icon: <Business />,
    title: 'ビジネス',
    expanded: false,
    categories: [
      {
        id: 'customer',
        title: '顧客満足度',
        expanded: false,
        templates: [
          { id: 'cs1', question: 'サービスの満足度を教えてください', type: 'scale' },
          { id: 'cs2', question: '改善点があれば教えてください', type: 'textarea' },
          { id: 'cs3', question: 'おすすめ度はいかがですか？', type: 'scale' }
        ]
      },
      {
        id: 'employee',
        title: '従業員評価',
        expanded: false,
        templates: [
          { id: 'emp1', question: '職場環境の満足度', type: 'scale' },
          { id: 'emp2', question: '上司とのコミュニケーション', type: 'radio' },
          { id: 'emp3', question: '改善してほしい点', type: 'textarea' }
        ]
      }
    ]
  },
  {
    id: 'personal',
    icon: <Person />,
    title: '個人情報',
    expanded: false,
    categories: [
      {
        id: 'basic',
        title: '基本情報',
        expanded: false,
        templates: [
          { id: 'p1', question: 'お名前を教えてください', type: 'text' },
          { id: 'p2', question: '年齢を選択してください', type: 'select' },
          { id: 'p3', question: '性別を選択してください', type: 'radio' }
        ]
      },
      {
        id: 'contact',
        title: '連絡先',
        expanded: false,
        templates: [
          { id: 'c1', question: 'メールアドレス', type: 'text' },
          { id: 'c2', question: '電話番号', type: 'text' },
          { id: 'c3', question: '住所', type: 'textarea' }
        ]
      }
    ]
  },
  {
    id: 'education',
    icon: <School />,
    title: '教育',
    expanded: false,
    categories: [
      {
        id: 'course',
        title: '講座評価',
        expanded: false,
        templates: [
          { id: 'edu1', question: '講座の理解度はいかがでしたか？', type: 'scale' },
          { id: 'edu2', question: '講師の説明は分かりやすかったですか？', type: 'radio' },
          { id: 'edu3', question: '今後学びたい内容', type: 'checkbox' }
        ]
      }
    ]
  }
];

export default function CreatePage({ onBackClick }) {
  const [selectedTool, setSelectedTool] = useState(null);
  const [previewMode, setPreviewMode] = useState('mobile'); // 'mobile' or 'desktop'
  const [zoom, setZoom] = useState(1); // ズーム倍率
  const [expandedTemplates, setExpandedTemplates] = useState({}); // テンプレートの展開状態

  // ズーム制御関数（5%刻み）
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.05, 2));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.05, 0.5));
  const handleFitScreen = () => setZoom(1);

  // テンプレート展開制御
  const toggleExpanded = (key) => {
    setExpandedTemplates(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <Box
      className="main-container"
      sx={{
        height: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        display: 'flex',
        overflow: 'hidden'
      }}
    >
      {/* 背景全体Container */}
      {/* 左端ナビゲーションバー */}
      <Paper
        elevation={4}
        sx={{
          width: 80,
          height: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          py: 2,
          boxShadow: '4px 0 20px rgba(0, 0, 0, 0.1)'
        }}
      >
        {/* ロゴ */}
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 2,
            background: 'rgba(255, 255, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 3,
            backdropFilter: 'blur(10px)'
          }}
        >
          <Typography
            variant="h6"
            sx={{ color: 'white', fontWeight: 'bold' }}
          >
            O
          </Typography>
        </Box>

        {/* 戻るボタン */}
        <Tooltip title="ダッシュボードに戻る" placement="right">
          <IconButton
            onClick={onBackClick}
            sx={{
              color: 'rgba(255, 255, 255, 0.8)',
              mb: 2,
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: 'white'
              }
            }}
          >
            <ArrowBack />
          </IconButton>
        </Tooltip>

        {/* ナビゲーションアイテム */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            width: '100%',
            px: 1
          }}
        >
          {leftNavigationItems.map((item, index) => (
            <Tooltip key={index} title={item.label} placement="right">
              <IconButton
                onClick={() => setSelectedTool(item)}
                sx={{
                  color: selectedTool?.label === item.label ? 'white' : 'rgba(255, 255, 255, 0.7)',
                  backgroundColor: selectedTool?.label === item.label ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                  borderRadius: 2,
                  width: 48,
                  height: 48,
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    color: 'white'
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                {item.icon}
              </IconButton>
            </Tooltip>
          ))}
        </Box>
      </Paper>

      {/* 右側メインエリア */}
      <Box
        className="right-main-area"
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          height: '100vh'
        }}
      >
        {/* ヘッダー */}
        <Paper
          elevation={0}
          sx={{
            height: 65,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
            borderRadius: 0,
            display: 'flex',
            alignItems: 'center',
            px: 2,
            justifyContent: 'space-between'
          }}
        >
          {/* ヘッダー左側 */}
          <Typography
            variant="h5"
            sx={{
              color: '#1a202c',
              fontWeight: 700
            }}
          >
            フォーム作成
          </Typography>

          {/* ヘッダー右側のアクションボタン */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="プレビュー">
              <IconButton
                sx={{
                  color: '#64748b',
                  '&:hover': {
                    backgroundColor: 'rgba(100, 116, 139, 0.1)'
                  }
                }}
              >
                <Preview />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="保存">
              <IconButton
                sx={{
                  color: '#64748b',
                  '&:hover': {
                    backgroundColor: 'rgba(100, 116, 139, 0.1)'
                  }
                }}
              >
                <Save />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="その他">
              <IconButton
                sx={{
                  color: '#64748b',
                  '&:hover': {
                    backgroundColor: 'rgba(100, 116, 139, 0.1)'
                  }
                }}
              >
                <MoreVert />
              </IconButton>
            </Tooltip>
          </Box>
        </Paper>

        {/* メインコンテンツエリア */}
        <Box
          className="main-content-area"
          sx={{
            flex: 1,
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          {/* 最大まで広げた背景Container */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            style={{ 
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0
            }}
          >
            <Paper
              elevation={2}
              sx={{
                height: '100%',
                width: '100%',
                borderRadius: 0,
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                position: 'relative'
              }}
            >
              {/* 背景パターン */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'radial-gradient(circle at 20% 20%, rgba(94, 23, 235, 0.05) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(118, 75, 162, 0.05) 0%, transparent 50%)',
                  zIndex: 0
                }}
              />

              {/* プレビュー制御パネル - ヘッダー下固定 */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 8,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  zIndex: 20,
                  pointerEvents: 'auto'
                }}
              >
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <Paper
                    elevation={8}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      px: 1,
                      py: 0.5,
                      borderRadius: 2,
                      background: 'rgba(255, 255, 255, 0.95)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    {/* デバイス切り替え */}
                    <Tooltip title="モバイル表示">
                      <IconButton
                        onClick={() => setPreviewMode('mobile')}
                        sx={{
                          color: previewMode === 'mobile' ? '#5e17eb' : '#64748b',
                          backgroundColor: previewMode === 'mobile' ? 'rgba(94, 23, 235, 0.1)' : 'transparent',
                          '&:hover': {
                            backgroundColor: 'rgba(94, 23, 235, 0.1)'
                          }
                        }}
                      >
                        <PhoneAndroid />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="PC表示">
                      <IconButton
                        onClick={() => setPreviewMode('desktop')}
                        sx={{
                          color: previewMode === 'desktop' ? '#5e17eb' : '#64748b',
                          backgroundColor: previewMode === 'desktop' ? 'rgba(94, 23, 235, 0.1)' : 'transparent',
                          '&:hover': {
                            backgroundColor: 'rgba(94, 23, 235, 0.1)'
                          }
                        }}
                      >
                        <Computer />
                      </IconButton>
                    </Tooltip>


                    {/* ズーム制御 */}
                    <Tooltip title="縮小">
                      <IconButton
                        onClick={handleZoomOut}
                        disabled={zoom <= 0.5}
                        sx={{
                          color: '#64748b',
                          '&:hover': {
                            backgroundColor: 'rgba(100, 116, 139, 0.1)'
                          }
                        }}
                      >
                        <ZoomOut />
                      </IconButton>
                    </Tooltip>

                    <Typography variant="caption" sx={{ minWidth: 40, textAlign: 'center', color: '#64748b', fontSize: '0.7rem' }}>
                      {Math.round(zoom * 100)}%
                    </Typography>

                    <Tooltip title="拡大">
                      <IconButton
                        onClick={handleZoomIn}
                        disabled={zoom >= 2}
                        sx={{
                          color: '#64748b',
                          '&:hover': {
                            backgroundColor: 'rgba(100, 116, 139, 0.1)'
                          }
                        }}
                      >
                        <ZoomIn />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="フィット">
                      <IconButton
                        onClick={handleFitScreen}
                        sx={{
                          color: '#64748b',
                          '&:hover': {
                            backgroundColor: 'rgba(100, 116, 139, 0.1)'
                          }
                        }}
                      >
                        <FitScreen />
                      </IconButton>
                    </Tooltip>
                  </Paper>
                </motion.div>
              </Box>

              {/* 中央プレビューエリア */}
              <Box
                className="center-preview-area"
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -45%)',
                  zIndex: 10,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                  pointerEvents: 'auto'
                }}
              >
                {/* プレビュー画面 */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: zoom }}
                  transition={{ duration: 0.3 }}
                  style={{
                    transform: `scale(${zoom})`,
                    transformOrigin: 'center'
                  }}
                >
                  <Paper
                    elevation={12}
                    sx={{
                      width: previewMode === 'mobile' ? 380 : 1024,
                      height: previewMode === 'mobile' ? 720 : 576,
                      borderRadius: previewMode === 'mobile' ? 6 : 2,
                      background: 'white',
                      border: previewMode === 'mobile' ? '8px solid #1a1a1a' : '2px solid #e2e8f0',
                      boxShadow: previewMode === 'mobile' 
                        ? '0 25px 80px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05)' 
                        : '0 20px 60px rgba(0, 0, 0, 0.15)',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    {/* モバイルの場合のノッチ */}
                    {previewMode === 'mobile' && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: 150,
                          height: 30,
                          background: '#1a1a1a',
                          borderBottomLeftRadius: 15,
                          borderBottomRightRadius: 15,
                          zIndex: 10
                        }}
                      />
                    )}

                    {/* プレビューコンテンツ */}
                    <Box
                      sx={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        p: previewMode === 'mobile' ? 2 : 4,
                        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
                      }}
                    >
                      <Box
                        sx={{
                          textAlign: 'center',
                          mb: 3
                        }}
                      >
                        <Typography
                          variant={previewMode === 'mobile' ? 'h6' : 'h4'}
                          sx={{
                            fontWeight: 700,
                            background: 'linear-gradient(45deg, #5e17eb 30%, #764ba2 90%)',
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            mb: 1
                          }}
                        >
                          {previewMode === 'mobile' ? 'モバイル' : 'デスクトップ'}プレビュー
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          フォームの{previewMode === 'mobile' ? 'スマートフォン' : 'PC'}での表示
                        </Typography>
                      </Box>

                      {/* サンプルフォーム */}
                      <Paper
                        sx={{
                          p: previewMode === 'mobile' ? 2 : 3,
                          borderRadius: 2,
                          width: '100%',
                          maxWidth: previewMode === 'mobile' ? 300 : 600,
                          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
                        }}
                      >
                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                          サンプルアンケート
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <Box>
                            <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                              お名前をお聞かせください
                            </Typography>
                            <Box
                              sx={{
                                width: '100%',
                                height: 40,
                                border: '1px solid #e2e8f0',
                                borderRadius: 1,
                                backgroundColor: '#f8fafc'
                              }}
                            />
                          </Box>
                          <Box>
                            <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                              満足度を教えてください
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                              {['とても満足', '満足', '普通', '不満'].map((option, index) => (
                                <Box
                                  key={index}
                                  sx={{
                                    px: 2,
                                    py: 1,
                                    border: '1px solid #e2e8f0',
                                    borderRadius: 1,
                                    fontSize: previewMode === 'mobile' ? '0.8rem' : '0.9rem',
                                    backgroundColor: index === 1 ? 'rgba(94, 23, 235, 0.1)' : '#f8fafc',
                                    color: index === 1 ? '#5e17eb' : '#64748b'
                                  }}
                                >
                                  {option}
                                </Box>
                              ))}
                            </Box>
                          </Box>
                        </Box>
                      </Paper>
                    </Box>
                  </Paper>
                </motion.div>
              </Box>
            </Paper>
          </motion.div>

          {/* 上のレイヤー：左右のContainer2つ */}
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="stretch"
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 1,
              pointerEvents: 'none'
            }}
          >
            {/* 左側Container - 質問作成ツール */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              style={{ flex: '0 0 300px', pointerEvents: 'auto' }}
            >
              <Paper
                elevation={8}
                sx={{
                  height: '100%',
                  borderRadius: 0,
                  background: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)',
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  overflowY: 'auto'
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    background: 'linear-gradient(45deg, #5e17eb 30%, #764ba2 90%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    mb: 2,
                    textAlign: 'center'
                  }}
                >
                  質問作成
                </Typography>
                
                {/* 質問タイプグリッド */}
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#64748b' }}>
                  質問タイプ
                </Typography>
                <Grid container spacing={1} sx={{ mb: 3 }}>
                  {questionTypes.map((item, index) => (
                    <Grid item xs={4} key={index}>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      >
                        <Paper
                          elevation={2}
                          sx={{
                            p: 1,
                            borderRadius: 2,
                            background: 'rgba(255, 255, 255, 0.8)',
                            border: '1px solid rgba(0, 0, 0, 0.05)',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 0.5,
                            minHeight: 70,
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)',
                              background: 'rgba(94, 23, 235, 0.05)'
                            }
                          }}
                          onClick={() => setSelectedTool(item)}
                        >
                          <Box
                            sx={{
                              width: 28,
                              height: 28,
                              borderRadius: 1.5,
                              background: `linear-gradient(135deg, ${
                                ['#667eea', '#ff9a9e', '#a8edea', '#fed6e3', '#d299c2', '#89f7fe', '#66a6ff'][index % 7]
                              } 0%, ${
                                ['#764ba2', '#fecfef', '#d299c2', '#d8edea', '#fecfef', '#bfe9ff', '#8aa7ff'][index % 7]
                              } 100%)`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                            }}
                          >
                            {React.cloneElement(item.icon, { 
                              sx: { color: 'white', fontSize: '0.9rem' } 
                            })}
                          </Box>
                          <Typography
                            variant="caption"
                            sx={{
                              fontWeight: 500,
                              color: '#2d3748',
                              fontSize: '0.65rem',
                              textAlign: 'center',
                              lineHeight: 1.2
                            }}
                          >
                            {item.label}
                          </Typography>
                        </Paper>
                      </motion.div>
                    </Grid>
                  ))}
                </Grid>

                {/* テンプレート質問 */}
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#64748b' }}>
                  テンプレート質問
                </Typography>
                <Box sx={{ flex: 1 }}>
                  {questionTemplates.map((template, index) => (
                    <Accordion
                      key={template.id}
                      expanded={expandedTemplates[template.id] || false}
                      onChange={() => toggleExpanded(template.id)}
                      sx={{
                        mb: 1,
                        borderRadius: 2,
                        '&:before': { display: 'none' },
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
                      }}
                    >
                      <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        sx={{
                          backgroundColor: 'rgba(255, 255, 255, 0.8)',
                          borderRadius: 2,
                          minHeight: 40,
                          '& .MuiAccordionSummary-content': {
                            margin: '8px 0',
                            alignItems: 'center'
                          }
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {template.icon}
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {template.title}
                          </Typography>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails sx={{ p: 1 }}>
                        {template.categories.map((category, catIndex) => (
                          <Accordion
                            key={category.id}
                            expanded={expandedTemplates[`${template.id}-${category.id}`] || false}
                            onChange={() => toggleExpanded(`${template.id}-${category.id}`)}
                            sx={{
                              mb: 0.5,
                              boxShadow: 'none',
                              '&:before': { display: 'none' }
                            }}
                          >
                            <AccordionSummary
                              expandIcon={<ExpandMoreIcon sx={{ fontSize: '1rem' }} />}
                              sx={{
                                backgroundColor: 'rgba(94, 23, 235, 0.05)',
                                borderRadius: 1,
                                minHeight: 32,
                                '& .MuiAccordionSummary-content': {
                                  margin: '4px 0'
                                }
                              }}
                            >
                              <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>
                                {category.title}
                              </Typography>
                            </AccordionSummary>
                            <AccordionDetails sx={{ p: 1 }}>
                              {category.templates.map((temp, tempIndex) => (
                                <Paper
                                  key={temp.id}
                                  elevation={1}
                                  sx={{
                                    p: 1,
                                    mb: 0.5,
                                    cursor: 'pointer',
                                    borderRadius: 1,
                                    '&:hover': {
                                      backgroundColor: 'rgba(94, 23, 235, 0.05)'
                                    }
                                  }}
                                  onClick={() => setSelectedTool({ ...temp, isTemplate: true })}
                                >
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      display: 'block',
                                      fontSize: '0.7rem',
                                      lineHeight: 1.3,
                                      color: '#2d3748'
                                    }}
                                  >
                                    {temp.question}
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      fontSize: '0.6rem',
                                      color: '#64748b',
                                      fontStyle: 'italic'
                                    }}
                                  >
                                    ({questionTypes.find(qt => qt.type === temp.type)?.label})
                                  </Typography>
                                </Paper>
                              ))}
                            </AccordionDetails>
                          </Accordion>
                        ))}
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Box>
              </Paper>
            </motion.div>


            {/* 右側Container - フォーム設定 */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              style={{ flex: '0 0 300px', pointerEvents: 'auto' }}
            >
              <Paper
                elevation={8}
                sx={{
                  height: '100%',
                  borderRadius: 0,
                  background: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)',
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    background: 'linear-gradient(45deg, #fcb69f 30%, #ffecd2 90%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    mb: 2,
                    textAlign: 'center'
                  }}
                >
                  フォーム設定
                </Typography>
                
                <Box sx={{ 
                  flex: 1, 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 2 
                }}>
                  <Box
                    sx={{
                      width: 60,
                      height: 60,
                      borderRadius: 2,
                      background: 'linear-gradient(135deg, #fcb69f 0%, #ffecd2 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 8px 24px rgba(252, 182, 159, 0.3)'
                    }}
                  >
                    <Settings sx={{ color: 'white', fontSize: '1.5rem' }} />
                  </Box>
                  <Typography variant="body2" color="text.secondary" textAlign="center">
                    フォームの設定や
                    プレビューが
                    ここに表示されます
                  </Typography>
                </Box>
              </Paper>
            </motion.div>
          </Stack>

          {/* 選択ツールの表示（中央部分） */}
          {selectedTool && (
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 2
              }}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Box
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    background: 'rgba(94, 23, 235, 0.1)',
                    border: '2px dashed rgba(94, 23, 235, 0.3)',
                    backdropFilter: 'blur(10px)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 1,
                    minWidth: 200
                  }}
                >
                  {selectedTool.icon}
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {selectedTool.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    選択中
                  </Typography>
                </Box>
              </motion.div>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}