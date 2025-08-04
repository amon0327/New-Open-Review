import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Box, Typography, Button, Card, CardContent, CardMedia, Chip } from '@mui/material';
import { Add } from '@mui/icons-material';
import { styled, keyframes } from '@mui/material/styles';

export default function HomePage({ user, onCreateFormClick }) {
  const scrollRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
    scrollRef.current.style.cursor = 'grabbing';
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    scrollRef.current.style.cursor = 'grab';
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    scrollRef.current.style.cursor = 'grab';
  };

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

  // ArticleCard スタイル（openreview-landingから完全コピー）
  const ArticleCard = styled(Card)(({ theme }) => ({
    height: '400px !important',
    minHeight: '400px !important',
    maxHeight: '400px !important',
    maxWidth: '350px',
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
      height: '200px !important',
      minHeight: '200px !important',
      maxHeight: '200px !important',
    },
    // CardContentのパディングと高さを固定
    '& .MuiCardContent-root': {
      padding: '16px !important',
      paddingTop: '12px !important',
      flex: '1 1 auto !important',
      display: 'flex !important',
      flexDirection: 'column !important',
      height: '200px !important',
      minHeight: '200px !important',
      maxHeight: '200px !important',
      overflow: 'hidden !important',
    },
  }));

  const ArticleImage = styled(CardMedia)({
    width: '100% !important',
    height: '200px !important',
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
          pt: 8,
          px: 0,
          overflow: 'hidden'
        }}
      >
        {/* シンプルなグラデーションテキスト */}
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            background: 'linear-gradient(135deg, #5e17eb 0%, #667eea 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 4,
            textAlign: 'center'
          }}
        >
          レビューフォームを作成
        </Typography>

        {/* シンプルなボタン */}
        <Button
          variant="contained"
          size="large"
          startIcon={<Add />}
          onClick={onCreateFormClick}
          sx={{
            background: 'linear-gradient(135deg, #5e17eb 0%, #667eea 100%)',
            color: 'white',
            fontWeight: 600,
            py: 1.5,
            px: 4,
            borderRadius: 1,
            textTransform: 'none',
            mb: 6,
            '&:hover': {
              background: 'linear-gradient(135deg, #4c0dbf 0%, #5a6fd8 100%)',
            }
          }}
        >
          新しいフォームを作成
        </Button>

        {/* 記事一覧セクション */}
        <Box
          sx={{
            width: '100%'
          }}
        >
          {/* セクションタイトル */}
          <Box
            sx={{
              mb: 3,
              px: 2
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                color: '#1a202c',
                textAlign: 'left'
              }}
            >
              OpenReviewの記事一覧
            </Typography>
          </Box>

          {/* スライダーカード */}
          <Box
            ref={scrollRef}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            sx={{
              display: 'flex',
              gap: 3,
              overflowX: 'auto',
              scrollbarWidth: 'none',
              '&::-webkit-scrollbar': {
                display: 'none'
              },
              pb: 2,
              pl: 2,
              pr: 0,
              cursor: 'grab',
              userSelect: 'none'
            }}
          >
            {articles.map((article, index) => (
              <ArticleCard
                key={article.id}
                sx={{
                  cursor: isDragging ? 'grabbing' : 'pointer',
                  transition: isDragging ? 'none' : 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  marginRight: index === articles.length - 1 ? 2 : 0,
                  pointerEvents: isDragging ? 'none' : 'auto',
                  animation: `${fadeInUp} 0.3s ease-out ${index * 0.05}s both`,
                  '&:hover': {
                    transform: isDragging ? 'none' : 'translateY(-8px)',
                    boxShadow: isDragging ? '0 4px 20px rgba(0, 0, 0, 0.08)' : '0 12px 40px rgba(0, 0, 0, 0.15)'
                  }
                }}
              >
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
            ))}
          </Box>
        </Box>
      </Box>
    </motion.div>
  );
}