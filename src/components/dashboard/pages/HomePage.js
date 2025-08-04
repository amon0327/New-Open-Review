import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Box, Typography, Button, Card, CardContent, IconButton } from '@mui/material';
import { Add, ChevronLeft, ChevronRight } from '@mui/icons-material';

export default function HomePage({ user, onCreateFormClick }) {
  const scrollRef = useRef(null);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  // サンプル記事データ
  const articles = [
    {
      id: 1,
      title: "レビューフォームの効果的な活用方法",
      description: "チームの生産性を向上させるレビューフォームの設計と運用について解説します。",
      date: "2024年8月1日"
    },
    {
      id: 2,
      title: "OpenReviewで始める360度フィードバック",
      description: "多角的な視点でのフィードバック収集の手法とその効果について紹介します。",
      date: "2024年7月28日"
    },
    {
      id: 3,
      title: "リモートワークでのパフォーマンス評価",
      description: "分散チームでの効果的な評価システムの構築方法をご紹介します。",
      date: "2024年7月25日"
    },
    {
      id: 4,
      title: "フィードバック文化の醸成",
      description: "組織全体でのフィードバック文化を根付かせるための実践的なアプローチ。",
      date: "2024年7月22日"
    },
    {
      id: 5,
      title: "データドリブンな人材育成",
      description: "レビューデータを活用した効果的な人材育成戦略について解説します。",
      date: "2024年7月19日"
    }
  ];

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
          px: 4,
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
            width: '100%',
            maxWidth: '1200px',
            px: 2
          }}
        >
          {/* セクションタイトル */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 3
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
            
            {/* スライダーコントロール */}
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton
                onClick={scrollLeft}
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.9)',
                  '&:hover': { bgcolor: 'rgba(255, 255, 255, 1)' },
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                }}
              >
                <ChevronLeft />
              </IconButton>
              <IconButton
                onClick={scrollRight}
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.9)',
                  '&:hover': { bgcolor: 'rgba(255, 255, 255, 1)' },
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                }}
              >
                <ChevronRight />
              </IconButton>
            </Box>
          </Box>

          {/* スライダーカード */}
          <Box
            ref={scrollRef}
            sx={{
              display: 'flex',
              gap: 3,
              overflowX: 'auto',
              scrollbarWidth: 'none',
              '&::-webkit-scrollbar': {
                display: 'none'
              },
              pb: 2
            }}
          >
            {articles.map((article) => (
              <Card
                key={article.id}
                sx={{
                  minWidth: 350,
                  height: 180,
                  borderRadius: 0,
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.15)'
                  }
                }}
              >
                <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      color: '#1a202c',
                      mb: 2,
                      lineHeight: 1.3
                    }}
                  >
                    {article.title}
                  </Typography>
                  
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#64748b',
                      lineHeight: 1.5,
                      flex: 1,
                      mb: 2
                    }}
                  >
                    {article.description}
                  </Typography>
                  
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#94a3b8',
                      fontWeight: 500
                    }}
                  >
                    {article.date}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Box>
      </Box>
    </motion.div>
  );
}