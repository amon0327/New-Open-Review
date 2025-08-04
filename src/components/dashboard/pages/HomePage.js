import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Box, Typography, Button, Card, CardContent, CardMedia, Chip, Grid, Container, CircularProgress, Avatar } from '@mui/material';
import { Add, Description, Visibility, Edit, MoreVert } from '@mui/icons-material';
import { styled, keyframes } from '@mui/material/styles';
import FormDataService from '../../../services/FormDataService';

export default function HomePage({ user, onCreateFormClick }) {
  const scrollContainerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // マウスドラッグスクロール機能
  const handleMouseDown = (e) => {
    // カードのクリックイベントを防止
    e.preventDefault();
    setIsDragging(true);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
    scrollContainerRef.current.style.cursor = 'grabbing';
    // スクロール機能を無効化
    scrollContainerRef.current.style.overflow = 'hidden';
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.style.cursor = 'grab';
      scrollContainerRef.current.style.overflow = 'auto';
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.style.cursor = 'grab';
      // スクロール機能を再度無効化（ドラッグのみでスクロール）
      scrollContainerRef.current.style.overflow = 'hidden';
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

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

  // フォームデータの変換
  const formatFormData = (form) => ({
    id: form.id,
    title: form.title || '名称未設定',
    description: 'レビューフォーム',
    status: form.is_published ? '公開中' : '下書き',
    responses: 0, // TODO: 実際の回答数を取得
    lastModified: new Date(form.updated_at).toISOString().split('T')[0],
    category: 'レビュー',
    themeColor: form.review_form_settings?.[0]?.theme_color || '#5e17eb'
  });

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

  // ArticleCard スタイル（4列レイアウト用に縮小）
  const ArticleCard = styled(Card)(({ theme }) => ({
    height: '320px !important',
    minHeight: '320px !important',
    maxHeight: '320px !important',
    maxWidth: '280px',
    width: '100%',
    margin: '0 auto',
    display: 'flex !important',
    flexDirection: 'column !important',
    borderRadius: 12,
    border: 'none',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: 'pointer',
    overflow: 'hidden !important',
    background: '#ffffff',
    position: 'relative',
    '&:hover': {
      transform: 'translateY(-8px)',
      boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
      '& .article-image': {
        transform: 'scale(1.05)',
      },
    },
    // 画像領域を固定
    '& .MuiCardMedia-root': {
      flex: 'none !important',
      flexShrink: '0 !important',
      flexGrow: '0 !important',
      height: '160px !important',
      minHeight: '160px !important',
      maxHeight: '160px !important',
    },
    // CardContentのパディングと高さを固定
    '& .MuiCardContent-root': {
      padding: '16px !important',
      paddingTop: '12px !important',
      flex: '1 1 auto !important',
      display: 'flex !important',
      flexDirection: 'column !important',
      height: '160px !important',
      minHeight: '160px !important',
      maxHeight: '160px !important',
      overflow: 'hidden !important',
    },
  }));

  const ArticleImage = styled(CardMedia)({
    width: '100% !important',
    height: '160px !important',
    position: 'relative',
    overflow: 'hidden',
    display: 'block !important',
    backgroundColor: '#f5f5f5',
    flex: 'none !important',
    flexShrink: '0 !important',
    '& img': {
      width: '100% !important',
      height: '100% !important',
      objectFit: 'cover !important',
      objectPosition: 'center !important',
      transition: 'transform 0.4s ease',
      display: 'block !important',
      verticalAlign: 'top !important',
    },
  });

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

  // サンプル記事データ（openreview-landing形式に更新）
  const articles = [
    {
      id: 1,
      title: "レビューフォームの効果的な活用方法",
      excerpt: "チームの生産性を向上させるレビューフォームの設計と運用について、実践的な導入方法と効果を詳しく解説します。",
      thumbnail_url: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=600&h=316&fit=crop",
      category: "technology",
      category_name: "テクノロジー",
      category_color: "#3dcc65",
      keywords: ["React", "JavaScript", "開発", "フロントエンド"],
      read_time_minutes: 5,
      published_at: "2024-08-01T10:00:00+09:00"
    },
    {
      id: 2,
      title: "OpenReviewで始める360度フィードバック",
      excerpt: "多角的な視点でのフィードバック収集の手法とその効果について、具体的な実装方法を交えて紹介します。",
      thumbnail_url: "https://images.unsplash.com/photo-1560472355-536de3962603?w=600&h=316&fit=crop",
      category: "business",
      category_name: "ビジネス",
      category_color: "#32b7f0",
      keywords: ["DX", "戦略", "組織改革", "マネジメント"],
      read_time_minutes: 4,
      published_at: "2024-07-28T14:30:00+09:00"
    },
    {
      id: 3,
      title: "リモートワークでのパフォーマンス評価",
      excerpt: "分散チームでの効果的な評価システムの構築方法と、リモート環境での適切な評価指標をご紹介します。",
      thumbnail_url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&h=316&fit=crop",
      category: "research",
      category_name: "リサーチ",
      category_color: "#8c5eee",
      keywords: ["リモートワーク", "評価", "マネジメント"],
      read_time_minutes: 6,
      published_at: "2024-07-25T09:15:00+09:00"
    },
    {
      id: 4,
      title: "フィードバック文化の醸成",
      excerpt: "組織全体でのフィードバック文化を根付かせるための実践的なアプローチと成功事例を詳しく解説します。",
      thumbnail_url: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=316&fit=crop",
      category: "case-study",
      category_name: "ケーススタディ",
      category_color: "#ff9900",
      keywords: ["組織文化", "フィードバック", "チームビルディング"],
      read_time_minutes: 7,
      published_at: "2024-07-22T16:45:00+09:00"
    },
    {
      id: 5,
      title: "データドリブンな人材育成",
      excerpt: "レビューデータを活用した効果的な人材育成戦略について、具体的な分析手法と実装方法を解説します。",
      thumbnail_url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=316&fit=crop",
      category: "technology",
      category_name: "テクノロジー", 
      category_color: "#3dcc65",
      keywords: ["データ分析", "人材育成", "HR Tech", "AI"],
      read_time_minutes: 8,
      published_at: "2024-07-19T11:20:00+09:00"
    }
  ];

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      style={{ height: '100%', width: '100%' }}
    >
      <Box
        sx={{
          height: '100%',
          width: '100%',
          background: `
            linear-gradient(180deg, transparent 0%, rgba(255, 255, 255, 1) 60%),
            linear-gradient(90deg, rgba(94, 23, 235, 0.2) 0%, rgba(102, 126, 234, 0.2) 100%)
          `,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          pt: 2,
          px: 0,
          overflow: 'hidden'
        }}
      >

        {/* 記事一覧セクション */}
        <Container maxWidth="lg" sx={{ mt: 1 }}>
          {/* セクションタイトル */}
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              color: '#1a202c',
              textAlign: 'left',
              mb: 2
            }}
          >
            OpenReviewの記事一覧
          </Typography>

          {/* 横スクロール可能なレイアウト */}
          <Box
            ref={scrollContainerRef}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            sx={{
              display: 'flex',
              gap: 2,
              overflowX: 'hidden',
              overflowY: 'hidden',
              pb: 2,
              cursor: 'grab',
              userSelect: 'none',
              '&::-webkit-scrollbar': {
                display: 'none',
              },
              '&': {
                msOverflowStyle: 'none',
                scrollbarWidth: 'none',
              },
            }}
          >
            {articles.map((article, index) => (
              <Box
                key={article.id}
                sx={{
                  flex: '0 0 auto',
                  animation: `${fadeInUp} 0.3s ease-out ${index * 0.05}s both`,
                }}
              >
                <ArticleCard>
                  <ArticleImage
                    className="article-image"
                    component="img"
                    image={article.thumbnail_url}
                    alt={article.title}
                  />
                  <CardContent sx={{ flexGrow: 1, p: 3, paddingTop: '0 !important' }}>
                    <Box sx={{ 
                      mb: 2, 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center' 
                    }}>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <CategoryChip
                          label={article.category_name}
                          categorycolor={article.category_color}
                          size="small"
                        />
                        <StatsChip 
                          label={`${article.read_time_minutes}分で読了`}
                          size="small"
                        />
                      </Box>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          fontSize: '0.7rem',
                          fontWeight: 500,
                          color: 'text.secondary',
                          letterSpacing: '0.025em',
                        }}
                      >
                        {formatDate(article.published_at)}
                      </Typography>
                    </Box>
                    
                    <Typography 
                      variant="h6" 
                      component="h3" 
                      sx={{ 
                        fontWeight: 600,
                        mb: 0.5,
                        lineHeight: 1.3,
                        height: '2.8rem',
                        fontSize: '1.1rem',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {article.title}
                    </Typography>
                    
                    <Box sx={{ 
                      display: 'flex', 
                      flexWrap: 'wrap', 
                      gap: 0.8,
                      mt: 1,
                      height: '1.5rem',
                      overflow: 'hidden'
                    }}>
                      {article.keywords.slice(0, 4).map((keyword, keywordIndex) => (
                        <Typography
                          key={keywordIndex}
                          variant="caption"
                          sx={{
                            color: 'text.secondary',
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            opacity: 0.7,
                            lineHeight: 1.5,
                            whiteSpace: 'nowrap',
                            display: '-webkit-box',
                            WebkitLineClamp: 1,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            '&:hover': {
                              opacity: 1,
                              color: 'primary.main',
                            }
                          }}
                        >
                          #{keyword}
                        </Typography>
                      ))}
                    </Box>
                  </CardContent>
                </ArticleCard>
              </Box>
            ))}
          </Box>
        </Container>

        {/* フォーム一覧セクション */}
        <Container maxWidth="xl" sx={{ mt: 6, mb: 6 }}>
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
                マイフォーム
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
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={onCreateFormClick}
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
                }
              }}
            >
              新規作成
            </Button>
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

          {/* フォーム一覧グリッド */}
          {!loading && !error && (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(2, 1fr)',
                  md: 'repeat(3, 1fr)',
                  lg: 'repeat(4, 1fr)',
                  xl: 'repeat(5, 1fr)'
                },
                gap: 3,
              }}
            >
              {forms.length === 0 ? (
                // 空の状態
                <Box sx={{ 
                  gridColumn: '1 / -1',
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
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={onCreateFormClick}
                    sx={{
                      background: 'linear-gradient(135deg, #5e17eb 0%, #667eea 100%)',
                      borderRadius: 2,
                      px: 3,
                      py: 1,
                      textTransform: 'none',
                      fontWeight: 600,
                    }}
                  >
                    最初のフォームを作成
                  </Button>
                </Box>
              ) : (
                forms.map((form) => {
                  const formattedForm = formatFormData(form);
                  return (
                    <Card
                      key={form.id}
                      sx={{
                        borderRadius: 4,
                        border: 'none',
                        background: 'linear-gradient(145deg, #ffffff 0%, #fefefe 100%)',
                        boxShadow: '0 2px 20px rgba(0, 0, 0, 0.06)',
                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                        cursor: 'pointer',
                        position: 'relative',
                        overflow: 'visible',
                        '&:hover': {
                          transform: 'translateY(-8px) scale(1.02)',
                          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.12)',
                          '& .form-actions': {
                            opacity: 1,
                            transform: 'translateY(0)',
                          }
                        },
                        '&:before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: 4,
                          background: `linear-gradient(90deg, ${formattedForm.themeColor} 0%, ${formattedForm.themeColor}cc 100%)`,
                          borderRadius: '16px 16px 0 0',
                        }
                      }}
                    >
                      <CardContent sx={{ p: 3, pb: 2 }}>
                        {/* ヘッダー部分 */}
                        <Box sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'flex-start',
                          mb: 2.5
                        }}>
                          <Box sx={{ flex: 1 }}>
                            <Chip
                              label={formattedForm.status}
                              size="small"
                              sx={{
                                backgroundColor: formattedForm.status === '公開中' 
                                  ? 'rgba(76, 175, 80, 0.1)' 
                                  : 'rgba(255, 152, 0, 0.1)',
                                color: formattedForm.status === '公開中' 
                                  ? '#388e3c' 
                                  : '#f57c00',
                                fontWeight: 600,
                                fontSize: '0.7rem',
                                height: 24,
                                borderRadius: 3,
                                border: `1px solid ${formattedForm.status === '公開中' 
                                  ? 'rgba(76, 175, 80, 0.2)' 
                                  : 'rgba(255, 152, 0, 0.2)'}`,
                              }}
                            />
                          </Box>
                          <Avatar
                            sx={{
                              width: 32,
                              height: 32,
                              background: `linear-gradient(135deg, ${formattedForm.themeColor} 0%, ${formattedForm.themeColor}aa 100%)`,
                              fontSize: '0.75rem',
                              fontWeight: 600
                            }}
                          >
                            {formattedForm.title.charAt(0)}
                          </Avatar>
                        </Box>

                        {/* タイトル */}
                        <Typography
                          variant="h6"
                          component="h3"
                          sx={{
                            fontWeight: 700,
                            mb: 1.5,
                            fontSize: '1.1rem',
                            lineHeight: 1.3,
                            color: '#1a202c',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            minHeight: '2.6rem',
                          }}
                        >
                          {formattedForm.title}
                        </Typography>

                        {/* 統計情報 */}
                        <Box sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          mb: 2,
                          py: 1.5,
                          px: 2,
                          backgroundColor: 'rgba(248, 249, 250, 0.8)',
                          borderRadius: 2,
                        }}>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography
                              variant="h6"
                              sx={{
                                fontWeight: 700,
                                color: formattedForm.themeColor,
                                fontSize: '1.25rem',
                                lineHeight: 1,
                              }}
                            >
                              {formattedForm.responses}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{
                                color: 'text.secondary',
                                fontSize: '0.7rem',
                                fontWeight: 500,
                              }}
                            >
                              回答
                            </Typography>
                          </Box>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography
                              variant="body2"
                              sx={{
                                color: 'text.secondary',
                                fontSize: '0.75rem',
                                fontWeight: 500,
                              }}
                            >
                              {new Date(formattedForm.lastModified).toLocaleDateString('ja-JP', {
                                month: 'short',
                                day: 'numeric'
                              })}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{
                                color: 'text.secondary',
                                fontSize: '0.7rem',
                                fontWeight: 500,
                              }}
                            >
                              更新
                            </Typography>
                          </Box>
                        </Box>

                        {/* アクション部分 */}
                        <Box 
                          className="form-actions"
                          sx={{ 
                            display: 'flex', 
                            gap: 1,
                            opacity: 0,
                            transform: 'translateY(10px)',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          }}
                        >
                          <Button
                            size="small"
                            startIcon={<Edit sx={{ fontSize: 16 }} />}
                            sx={{
                              flex: 1,
                              borderRadius: 2,
                              textTransform: 'none',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              color: formattedForm.themeColor,
                              backgroundColor: `${formattedForm.themeColor}15`,
                              '&:hover': {
                                backgroundColor: `${formattedForm.themeColor}25`,
                              }
                            }}
                          >
                            編集
                          </Button>
                          <Button
                            size="small"
                            startIcon={<Visibility sx={{ fontSize: 16 }} />}
                            sx={{
                              flex: 1,
                              borderRadius: 2,
                              textTransform: 'none',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              color: 'text.secondary',
                              backgroundColor: 'rgba(0, 0, 0, 0.05)',
                              '&:hover': {
                                backgroundColor: 'rgba(0, 0, 0, 0.1)',
                              }
                            }}
                          >
                            プレビュー
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </Box>
          )}
        </Container>
      </Box>
    </motion.div>
  );
}