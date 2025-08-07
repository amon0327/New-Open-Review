import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Box, 
  Typography, 
  Button, 
  Card, 
  CardContent, 
  CardMedia, 
  Chip, 
  Grid, 
  Container, 
  CircularProgress, 
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  Checkbox
} from '@mui/material';
import { 
  Add, 
  Description, 
  Visibility, 
  Edit, 
  MoreVert, 
  Delete,
  Share,
  Analytics,
  ContentCopy,
  KeyboardArrowUp,
  KeyboardArrowDown
} from '@mui/icons-material';
import { styled, keyframes } from '@mui/material/styles';
import FormDataService from '../../../services/FormDataService';
import ArticleDataService from '../../../services/ArticleDataService';
import FormCreator from '../../FormCreator';
import { toast } from 'react-hot-toast';

export default function HomePage({ user, onCreateFormClick }) {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedForm, setSelectedForm] = useState(null);
  const [articles, setArticles] = useState([]);
  const [articlesLoading, setArticlesLoading] = useState(true);
  const [articlesError, setArticlesError] = useState(null);
  
  // ソート関連の状態
  const [sortField, setSortField] = useState('updated_at'); // デフォルトは更新日
  const [sortDirection, setSortDirection] = useState('desc'); // デフォルトは降順（最新順）

  // フォーム選択関連の状態
  const [selectedForms, setSelectedForms] = useState(new Set());

  // ドラッグスクロール用の状態
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [dragDistance, setDragDistance] = useState(0); // ドラッグ距離を追跡
  const scrollContainerRef = useRef(null);


  // フォーム一覧を取得
  useEffect(() => {
    const fetchForms = async () => {
      if (!user?.id) return;
      
      setLoading(true);
      try {
        const result = await FormDataService.getUserForms(user.id);
        if (result.success) {
          setForms(result.data);
        } else {
          setError(result.error);
        }
      } catch (err) {
        setError('フォームの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchForms();
  }, [user?.id]);

  // 記事一覧を取得
  useEffect(() => {
    const fetchArticles = async () => {
      setArticlesLoading(true);
      try {
        const result = await ArticleDataService.getPublishedArticles(5);
        if (result.success) {
          setArticles(result.data);
        } else {
          setArticlesError(result.error);
          console.error('記事取得エラー:', result.error);
        }
      } catch (err) {
        setArticlesError('記事の取得に失敗しました');
        console.error('記事取得中にエラー:', err);
      } finally {
        setArticlesLoading(false);
      }
    };

    fetchArticles();
  }, []);


  // メニューハンドラー
  const handleMenuClick = (event, form) => {
    setAnchorEl(event.currentTarget);
    setSelectedForm(form);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedForm(null);
  };


  // ソートハンドラー
  const handleSort = (field) => {
    if (sortField === field) {
      // 同じフィールドをクリックした場合は方向を切り替え
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // 違うフィールドをクリックした場合は新しいフィールドを設定し、降順から開始
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // チェックボックス関連のハンドラー
  const handleSelectForm = (formId) => {
    const newSelected = new Set(selectedForms);
    if (newSelected.has(formId)) {
      newSelected.delete(formId);
    } else {
      newSelected.add(formId);
    }
    setSelectedForms(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedForms.size === sortedForms.length) {
      setSelectedForms(new Set());
    } else {
      setSelectedForms(new Set(sortedForms.map(form => form.id)));
    }
  };

  // フォームデータの変換
  const formatFormData = (form) => ({
    id: form.id,
    title: form.title || '名称未設定',
    description: 'レビューフォーム',
    status: form.is_published ? '公開中' : '下書き',
    responses: 0, // TODO: 実際の回答数を取得
    questionCount: form.review_questions ? form.review_questions.length : 0, // 質問数を追加
    lastModified: new Date(form.updated_at).toISOString().split('T')[0],
    category: 'レビュー',
    themeColor: form.review_form_settings?.[0]?.theme_color || '#5e17eb',
    createdAt: new Date(form.created_at).toLocaleDateString('ja-JP'),
    // ソート用の生データも保持
    created_at: form.created_at,
    updated_at: form.updated_at
  });

  // ソートされたフォームデータを生成
  const sortedForms = useMemo(() => {
    if (!forms.length) return [];
    
    const formattedFormsWithOriginal = forms.map(form => ({
      ...formatFormData(form),
      originalForm: form // 元のformオブジェクトも保持
    }));
    
    return [...formattedFormsWithOriginal].sort((a, b) => {
      let valueA, valueB;
      
      switch (sortField) {
        case 'responses':
          valueA = a.responses;
          valueB = b.responses;
          break;
        case 'created_at':
          valueA = new Date(a.created_at);
          valueB = new Date(b.created_at);
          break;
        case 'updated_at':
          valueA = new Date(a.updated_at);
          valueB = new Date(b.updated_at);
          break;
        default:
          return 0;
      }
      
      if (sortDirection === 'asc') {
        return valueA > valueB ? 1 : -1;
      } else {
        return valueA < valueB ? 1 : -1;
      }
    });
  }, [forms, sortField, sortDirection]);

  // アニメーション定義
  const fadeInUp = keyframes`
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  `;


  const CategoryChip = styled(Chip)(({ theme, categorycolor }) => ({
    backgroundColor: categorycolor || theme.palette.primary.main,
    color: '#fff',
    fontWeight: 600,
    fontSize: '0.75rem',
    height: 24,
    borderRadius: 12,
    transition: 'all 0.3s ease',
    '&:hover': {
      backgroundColor: categorycolor || theme.palette.primary.dark,
      transform: 'scale(1.05)',
    },
  }));

  const StatsChip = styled(Chip)(({ theme }) => ({
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    color: theme.palette.primary.main,
    fontWeight: 500,
    fontSize: '0.75rem',
    height: 20,
    borderRadius: 10,
    '& .MuiChip-icon': {
      fontSize: 14,
    },
  }));

  // シンプルな記事カード用スタイル  
  const ArticleCard = styled(Card)(({ theme }) => ({
    height: '320px',
    minHeight: '320px',
    maxWidth: '280px',
    width: '100%',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    borderRadius: 12,
    border: 'none',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: 'pointer',
    overflow: 'hidden',
    background: '#ffffff',
    position: 'relative',
    '&:hover': {
      boxShadow: '0 8px 30px rgba(94, 23, 235, 0.15)',
      '& .article-image': {
        transform: 'scale(1.05)',
      },
    },
  }));

  const ArticleImage = styled(CardMedia)({
    width: '100%',
    aspectRatio: '16 / 9',
    position: 'relative',
    overflow: 'hidden',
    display: 'block',
    backgroundColor: '#f5f5f5',
    flex: 'none',
    '& img': {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      objectPosition: 'center',
      transition: 'transform 0.4s ease',
      display: 'block',
      verticalAlign: 'top',
    },
  });


  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  };

  // ドラッグスクロール用の関数
  const handleMouseDown = (e) => {
    if (!scrollContainerRef.current) return;
    // 記事カードのクリックを妨げないように、記事カード内の要素はスキップ
    if (e.target.closest('.MuiCard-root')) return;
    
    setIsDragging(true);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
    setDragDistance(0); // ドラッグ距離をリセット
    scrollContainerRef.current.style.cursor = 'grabbing';
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    setDragDistance(0);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.style.cursor = 'grab';
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragDistance(0);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.style.cursor = 'grab';
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 2; // スクロール速度調整
    const currentDragDistance = Math.abs(walk);
    setDragDistance(currentDragDistance);
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  // 記事クリック時の処理
  const handleArticleClick = (article) => {
    console.log('🔍 handleArticleClick が呼ばれました');
    console.log('🔍 isDragging:', isDragging, 'dragDistance:', dragDistance);
    console.log('🔍 article:', article);
    
    // 実際のドラッグ（5px以上移動）の場合のみクリックを無効化
    if (isDragging && dragDistance > 5) {
      console.log('🚫 ドラッグ中のためクリックを無効化');
      return;
    }
    
    // openreview.jpサイトの記事URLを生成
    let articleUrl;
    
    if (article.slug) {
      // slugがある場合はslugを使用
      articleUrl = `https://openreview.jp/blog/${article.slug}`;
    } else {
      // slugがない場合はIDを使用
      articleUrl = `https://openreview.jp/blog/${article.id}`;
    }
    
    console.log('✅ 記事クリック:', article.title);
    console.log('🔗 URL:', articleUrl);
    console.log('🌐 window.openを実行中...');
    
    // 新しいタブで記事を開く
    try {
      const newWindow = window.open(articleUrl, '_blank', 'noopener,noreferrer');
      console.log('🎯 window.open結果:', newWindow);
      if (!newWindow) {
        console.error('❌ ポップアップがブロックされました');
      }
    } catch (error) {
      console.error('❌ window.open実行エラー:', error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      style={{ width: '100%' }}
    >
      <Box
        sx={{
          width: '100%',
          minHeight: '100vh',
          backgroundColor: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          pt: 2,
          px: 0
        }}
      >

        {/* 記事一覧セクション */}
        <Container maxWidth="xl" sx={{ mt: 1, mb: 6 }}>
          {/* セクションヘッダー */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            mb: 4 
          }}>
            <Box>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  color: '#1a202c',
                  mb: 0.5,
                  fontSize: '1.75rem'
                }}
              >
                記事一覧
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: 'text.secondary',
                  fontSize: '0.875rem'
                }}
              >
                OpenReview Blogの記事の一覧
              </Typography>
            </Box>
          </Box>

          {/* ローディング状態 */}
          {articlesLoading && (
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              minHeight: '400px' 
            }}>
              <CircularProgress 
                sx={{ 
                  color: '#5e17eb',
                  '& .MuiCircularProgress-circle': {
                    strokeLinecap: 'round',
                  }
                }} 
              />
            </Box>
          )}

          {/* エラー状態 */}
          {articlesError && (
            <Box sx={{ 
              textAlign: 'center', 
              py: 6,
              color: 'text.secondary'
            }}>
              <Typography variant="body1">
                記事の読み込みに失敗しました: {articlesError}
              </Typography>
            </Box>
          )}

          {/* 記事一覧（横スクロール） */}
          {!articlesLoading && !articlesError && articles && articles.length > 0 && (
            <Box
              ref={scrollContainerRef}
              onMouseDown={handleMouseDown}
              onMouseLeave={handleMouseLeave}
              onMouseUp={handleMouseUp}
              onMouseMove={handleMouseMove}
              sx={{
                display: 'flex',
                gap: 2,
                overflowX: 'auto',
                overflowY: 'hidden',
                pb: 2,
                cursor: 'grab',
                userSelect: 'none',
                '&::-webkit-scrollbar': {
                  display: 'none',
                },
                msOverflowStyle: 'none',
                scrollbarWidth: 'none',
              }}
            >
              {articles.map((article, index) => (
                <Box
                  key={article.id}
                  sx={{
                    flex: '0 0 auto',
                    animation: `${fadeInUp} 0.3s ease-out ${index * 0.1}s both`,
                  }}
                >
                  <ArticleCard 
                    onClick={(e) => {
                      console.log('🎯 ArticleCard onClick発火');
                      console.log('🎯 event:', e);
                      console.log('🎯 記事:', article.title);
                      e.stopPropagation();
                      handleArticleClick(article);
                    }}
                  >
                    <ArticleImage
                      className="article-image"
                      component="img"
                      image={article.thumbnail_url}
                      alt={article.title}
                    />
                    <CardContent sx={{ flexGrow: 1, p: 2 }}>
                      <Box sx={{ mb: 2 }}>
                        <CategoryChip
                          label={article.category_name}
                          categorycolor={article.category_color}
                          size="small"
                          sx={{ mb: 1 }}
                        />
                        <StatsChip 
                          label={`${article.read_time_minutes}分で読了`}
                          size="small"
                        />
                      </Box>
                      
                      <Typography 
                        variant="h6" 
                        component="h3" 
                        sx={{ 
                          fontWeight: 600,
                          mb: 1,
                          lineHeight: 1.3,
                          fontSize: '1rem',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {article.title}
                      </Typography>
                      
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: 'text.secondary',
                          fontSize: '0.75rem'
                        }}
                      >
                        {formatDate(article.published_at)}
                      </Typography>
                    </CardContent>
                  </ArticleCard>
                </Box>
              ))}
            </Box>
          )}

          {/* 記事が0件の場合 */}
          {!articlesLoading && !articlesError && (!articles || articles.length === 0) && (
            <Box sx={{ 
              textAlign: 'center', 
              py: 8,
              px: 4,
              backgroundColor: 'rgba(248, 249, 250, 0.8)',
              borderRadius: 4,
              border: '2px dashed rgba(0, 0, 0, 0.1)'
            }}>
              <Description sx={{ 
                fontSize: 64, 
                color: 'text.disabled',
                mb: 2 
              }} />
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 600, 
                  color: 'text.secondary',
                  mb: 1 
                }}
              >
                記事がありません
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: 'text.secondary' 
                }}
              >
                記事が公開されるまでお待ちください
              </Typography>
            </Box>
          )}
        </Container>

        {/* フォーム一覧セクション */}
        <Container maxWidth="xl" sx={{ mt: 4, mb: 6 }}>
          {/* セクションヘッダー */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            mb: 4 
          }}>
            <Box>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  color: '#1a202c',
                  mb: 0.5,
                  fontSize: '1.75rem'
                }}
              >
                レビューフォーム一覧
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: 'text.secondary',
                  fontSize: '0.875rem'
                }}
              >
                作成したレビューフォームを管理
              </Typography>
            </Box>
            <FormCreator user={user} onCreateFormClick={onCreateFormClick}>
              {({ onCreateForm, isCreatingForm }) => (
                <Button
                  variant="contained"
                  startIcon={isCreatingForm ? <CircularProgress size={16} sx={{ color: 'white' }} /> : <Add />}
                  onClick={onCreateForm}
                  disabled={isCreatingForm}
                  sx={{
                    background: 'linear-gradient(135deg, #5e17eb 0%, #667eea 100%)',
                    borderRadius: 3,
                    px: 3,
                    py: 1.5,
                    textTransform: 'none',
                    fontWeight: 600,
                    boxShadow: '0 4px 20px rgba(94, 23, 235, 0.3)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #4c0dbf 0%, #5a6fd8 100%)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 30px rgba(94, 23, 235, 0.4)',
                    },
                    '&.Mui-disabled': {
                      opacity: 0.7,
                      background: 'linear-gradient(135deg, #5e17eb 0%, #667eea 100%)',
                      color: 'white'
                    }
                  }}
                >
                  {isCreatingForm ? '作成中...' : '新規作成'}
                </Button>
              )}
            </FormCreator>
          </Box>

          {/* ローディング状態 */}
          {loading && (
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              minHeight: '300px' 
            }}>
              <CircularProgress 
                sx={{ 
                  color: '#5e17eb',
                  '& .MuiCircularProgress-circle': {
                    strokeLinecap: 'round',
                  }
                }} 
              />
            </Box>
          )}

          {/* エラー状態 */}
          {error && (
            <Box sx={{ 
              textAlign: 'center', 
              py: 6,
              color: 'text.secondary'
            }}>
              <Typography variant="body1">
                {error}
              </Typography>
            </Box>
          )}

          {/* フォーム一覧テーブル */}
          {!loading && !error && (
            <>
              {sortedForms.length === 0 ? (
                // 空の状態
                <Box sx={{ 
                  textAlign: 'center',
                  py: 8,
                  px: 4,
                  backgroundColor: 'rgba(248, 249, 250, 0.8)',
                  borderRadius: 4,
                  border: '2px dashed rgba(0, 0, 0, 0.1)'
                }}>
                  <Description sx={{ 
                    fontSize: 64, 
                    color: 'text.disabled',
                    mb: 2 
                  }} />
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 600, 
                      color: 'text.secondary',
                      mb: 1 
                    }}
                  >
                    まだフォームがありません
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: 'text.secondary',
                      mb: 3 
                    }}
                  >
                    新しいレビューフォームを作成してみましょう
                  </Typography>
                  <FormCreator user={user} onCreateFormClick={onCreateFormClick}>
                    {({ onCreateForm, isCreatingForm }) => (
                      <Button
                        variant="contained"
                        startIcon={isCreatingForm ? <CircularProgress size={16} sx={{ color: 'white' }} /> : <Add />}
                        onClick={onCreateForm}
                        disabled={isCreatingForm}
                        sx={{
                          background: 'linear-gradient(135deg, #5e17eb 0%, #667eea 100%)',
                          borderRadius: 2,
                          px: 3,
                          py: 1,
                          textTransform: 'none',
                          fontWeight: 600,
                          '&.Mui-disabled': {
                            opacity: 0.7,
                            background: 'linear-gradient(135deg, #5e17eb 0%, #667eea 100%)',
                            color: 'white'
                          }
                        }}
                      >
                        {isCreatingForm ? '作成中...' : '最初のフォームを作成'}
                      </Button>
                    )}
                  </FormCreator>
                </Box>
              ) : (
                <TableContainer 
                  component={Paper} 
                  sx={{ 
                    borderRadius: 0.5,
                    boxShadow: 'none',
                    border: '1px solid rgba(0, 0, 0, 0.06)',
                    overflow: 'hidden'
                  }}
                >
                  <Table sx={{ minWidth: 650 }}>
                    <TableHead>
                      <TableRow 
                        sx={{ 
                          backgroundColor: '#f8fafc',
                          '& .MuiTableCell-head': {
                            fontWeight: 700,
                            fontSize: '0.875rem',
                            color: '#374151',
                            borderBottom: '2px solid #e5e7eb',
                            py: 2
                          }
                        }}
                      >
                        <TableCell>
                          <Checkbox
                            size="small"
                            checked={selectedForms.size === sortedForms.length && sortedForms.length > 0}
                            indeterminate={selectedForms.size > 0 && selectedForms.size < sortedForms.length}
                            onChange={handleSelectAll}
                            sx={{ p: 0.5 }}
                          />
                        </TableCell>
                        <TableCell>フォーム名</TableCell>
                        <TableCell align="center">ステータス</TableCell>
                        <TableCell 
                          align="center"
                          sx={{ 
                            cursor: 'pointer',
                            '&:hover': { backgroundColor: 'rgba(94, 23, 235, 0.05)' },
                            userSelect: 'none'
                          }}
                          onClick={() => handleSort('questionCount')}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                            質問数
                            {sortField === 'questionCount' && (
                              sortDirection === 'desc' ? 
                                <KeyboardArrowDown sx={{ fontSize: 16 }} /> : 
                                <KeyboardArrowUp sx={{ fontSize: 16 }} />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell 
                          align="center"
                          sx={{ 
                            cursor: 'pointer',
                            '&:hover': { backgroundColor: 'rgba(94, 23, 235, 0.05)' },
                            userSelect: 'none'
                          }}
                          onClick={() => handleSort('responses')}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                            回答数
                            {sortField === 'responses' && (
                              sortDirection === 'desc' ? 
                                <KeyboardArrowDown sx={{ fontSize: 16 }} /> : 
                                <KeyboardArrowUp sx={{ fontSize: 16 }} />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell 
                          align="center"
                          sx={{ 
                            cursor: 'pointer',
                            '&:hover': { backgroundColor: 'rgba(94, 23, 235, 0.05)' },
                            userSelect: 'none'
                          }}
                          onClick={() => handleSort('created_at')}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                            作成日
                            {sortField === 'created_at' && (
                              sortDirection === 'desc' ? 
                                <KeyboardArrowDown sx={{ fontSize: 16 }} /> : 
                                <KeyboardArrowUp sx={{ fontSize: 16 }} />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell 
                          align="center"
                          sx={{ 
                            cursor: 'pointer',
                            '&:hover': { backgroundColor: 'rgba(94, 23, 235, 0.05)' },
                            userSelect: 'none'
                          }}
                          onClick={() => handleSort('updated_at')}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                            更新日
                            {sortField === 'updated_at' && (
                              sortDirection === 'desc' ? 
                                <KeyboardArrowDown sx={{ fontSize: 16 }} /> : 
                                <KeyboardArrowUp sx={{ fontSize: 16 }} />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell align="center">アクション</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {sortedForms.map((formattedForm) => {
                        return (
                          <TableRow
                            key={formattedForm.id}
                            sx={{
                              '&:hover': {
                                backgroundColor: 'rgba(94, 23, 235, 0.02)',
                                '& .action-buttons': {
                                  opacity: 1,
                                }
                              },
                              '&:last-child td, &:last-child th': { 
                                border: 0 
                              },
                              transition: 'all 0.2s ease',
                              borderBottom: '1px solid rgba(0, 0, 0, 0.04)'
                            }}
                          >
                            {/* チェックボックス */}
                            <TableCell sx={{ py: 2 }}>
                              <Checkbox
                                size="small"
                                checked={selectedForms.has(formattedForm.id)}
                                onChange={() => handleSelectForm(formattedForm.id)}
                                sx={{ p: 0.5 }}
                              />
                            </TableCell>

                            {/* フォーム名 */}
                            <TableCell sx={{ py: 2 }}>
                              <Box>
                                <Typography
                                  variant="body1"
                                  sx={{
                                    fontWeight: 600,
                                    color: '#1a202c',
                                    fontSize: '0.95rem',
                                    lineHeight: 1.2,
                                    mb: 0.5
                                  }}
                                >
                                  {formattedForm.title}
                                </Typography>
                              </Box>
                            </TableCell>

                            {/* ステータス */}
                            <TableCell align="center" sx={{ py: 2 }}>
                              <Chip
                                label={formattedForm.status}
                                size="small"
                                sx={{
                                  backgroundColor: formattedForm.status === '公開中' 
                                    ? 'rgba(76, 175, 80, 0.12)' 
                                    : 'rgba(255, 152, 0, 0.12)',
                                  color: formattedForm.status === '公開中' 
                                    ? '#2e7d32' 
                                    : '#ed6c02',
                                  fontWeight: 600,
                                  fontSize: '0.75rem',
                                  height: 28,
                                  borderRadius: 6,
                                  border: `1px solid ${formattedForm.status === '公開中' 
                                    ? 'rgba(76, 175, 80, 0.2)' 
                                    : 'rgba(255, 152, 0, 0.2)'}`,
                                }}
                              />
                            </TableCell>

                            {/* 質問数 */}
                            <TableCell align="center" sx={{ py: 2 }}>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: 600,
                                  color: '#6b7280',
                                  fontSize: '0.95rem'
                                }}
                              >
                                {formattedForm.questionCount}
                              </Typography>
                            </TableCell>

                            {/* 回答数 */}
                            <TableCell align="center" sx={{ py: 2 }}>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: 600,
                                  color: formattedForm.themeColor,
                                  fontSize: '1rem'
                                }}
                              >
                                {formattedForm.responses}
                              </Typography>
                            </TableCell>

                            {/* 作成日 */}
                            <TableCell align="center" sx={{ py: 2 }}>
                              <Typography
                                variant="body2"
                                sx={{
                                  color: 'text.secondary',
                                  fontSize: '0.875rem'
                                }}
                              >
                                {formattedForm.createdAt}
                              </Typography>
                            </TableCell>

                            {/* 更新日 */}
                            <TableCell align="center" sx={{ py: 2 }}>
                              <Typography
                                variant="body2"
                                sx={{
                                  color: 'text.secondary',
                                  fontSize: '0.875rem'
                                }}
                              >
                                {new Date(formattedForm.lastModified).toLocaleDateString('ja-JP')}
                              </Typography>
                            </TableCell>

                            {/* アクション */}
                            <TableCell align="center" sx={{ py: 2 }}>
                              <Box 
                                className="action-buttons"
                                sx={{ 
                                  display: 'flex', 
                                  gap: 0.5, 
                                  justifyContent: 'center',
                                  opacity: 0.7,
                                  transition: 'opacity 0.2s ease'
                                }}
                              >
                                <Tooltip title="その他">
                                  <IconButton
                                    size="small"
                                    onClick={(e) => handleMenuClick(e, formattedForm.originalForm)}
                                    sx={{
                                      color: '#64748b',
                                      '&:hover': {
                                        backgroundColor: 'rgba(100, 116, 139, 0.1)',
                                      }
                                    }}
                                  >
                                    <MoreVert sx={{ fontSize: 18 }} />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </>
          )}

          {/* アクションメニュー */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            PaperProps={{
              sx: {
                borderRadius: 1,
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
                border: '1px solid rgba(0, 0, 0, 0.06)',
                mt: 1
              }
            }}
          >
            <MenuItem 
              onClick={() => {
                console.log('🔍 HomePage - 編集ボタンがクリックされました');
                console.log('🔍 HomePage - selectedForm:', selectedForm);
                console.log('🔍 HomePage - selectedForm.id:', selectedForm?.id);
                handleMenuClose();
                if (selectedForm) {
                  console.log('🔍 HomePage - onCreateFormClickを呼び出し中:', selectedForm.id);
                  onCreateFormClick(selectedForm.id);
                }
              }} 
              sx={{ py: 1, px: 2 }}
            >
              <Edit sx={{ mr: 1.5, fontSize: 18, color: '#5e17eb' }} />
              編集
            </MenuItem>
            <MenuItem onClick={handleMenuClose} sx={{ py: 1, px: 2 }}>
              <Analytics sx={{ mr: 1.5, fontSize: 18, color: '#059669' }} />
              分析
            </MenuItem>
            <MenuItem onClick={handleMenuClose} sx={{ py: 1, px: 2 }}>
              <Share sx={{ mr: 1.5, fontSize: 18, color: '#0ea5e9' }} />
              共有
            </MenuItem>
            <MenuItem onClick={handleMenuClose} sx={{ py: 1, px: 2 }}>
              <ContentCopy sx={{ mr: 1.5, fontSize: 18, color: '#6b7280' }} />
              複製
            </MenuItem>
            <MenuItem onClick={handleMenuClose} sx={{ py: 1, px: 2 }}>
              <Delete sx={{ mr: 1.5, fontSize: 18, color: '#ef4444' }} />
              削除
            </MenuItem>
          </Menu>
        </Container>
      </Box>
    </motion.div>
  );
}