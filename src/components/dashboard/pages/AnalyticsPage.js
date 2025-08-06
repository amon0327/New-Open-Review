import React from 'react';
import { motion } from 'framer-motion';
import { Box, Container } from '@mui/material';

export default function AnalyticsPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Container
        maxWidth={false}
        disableGutters
        sx={{
          height: '100vh',
          width: '100%',
          m: 0,
          p: 0,
          bgcolor: '#f5f5f5',
          overflow: 'hidden'
        }}
      >
        {/* メインコンテンツエリア */}
        <Box
          sx={{
            width: '100%',
            height: '100%',
            pt: 3,
            pl: 3,
            pr: 3,
            pb: 3,
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
            bgcolor: '#f8fafc',
            overflow: 'hidden',
            minWidth: 0
          }}
        >
          {/* 上部横並びrow */}
          <Box
            sx={{
              display: 'flex',
              gap: 3,
              flex: 3,
              minWidth: 0,
              overflow: 'hidden'
            }}
          >
            {/* 左側エリア全体 */}
            <Box
              sx={{
                flex: 2,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: 3,
                minWidth: 0,
                overflow: 'hidden'
              }}
            >
              {/* 左上のContainer */}
              <Box
                sx={{
                  flex: 1.5,
                  bgcolor: '#ffffff',
                  borderRadius: 2,
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                  border: '1px solid rgba(0, 0, 0, 0.05)',
                  p: 3,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: 0,
                  overflow: 'hidden'
                }}
              >
                生成AIレポート
              </Box>

              {/* 左下横並びContainer */}
              <Box
                sx={{
                  flex: 3,
                  display: 'flex',
                  gap: 2,
                  minWidth: 0,
                  overflow: 'hidden'
                }}
              >
                {/* 左下左のContainer */}
                <Box
                  sx={{
                    flex: 1,
                    bgcolor: '#ffffff',
                    borderRadius: 2,
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                    border: '1px solid rgba(0, 0, 0, 0.05)',
                    p: 3,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: 0,
                    overflow: 'hidden'
                  }}
                >
                  直近の特徴的なデータグラフや図
                </Box>

                {/* 左下右のContainer */}
                <Box
                  sx={{
                    flex: 1,
                    bgcolor: '#ffffff',
                    borderRadius: 2,
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                    border: '1px solid rgba(0, 0, 0, 0.05)',
                    p: 3,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: 0,
                    overflow: 'hidden'
                  }}
                >
                  直近の特徴的なデータグラフや図
                </Box>
              </Box>
            </Box>

            {/* 右側のContainer */}
            <Box
              sx={{
                flex: 1,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: 3,
                minWidth: 0,
                overflow: 'hidden'
              }}
            >
              {/* 右上のContainer（横2つに分割） */}
              <Box
                sx={{
                  flex: 0.5,
                  display: 'flex',
                  gap: 2,
                  minWidth: 0,
                  overflow: 'hidden'
                }}
              >
                {/* 右上左のContainer */}
                <Box
                  sx={{
                    flex: 1,
                    bgcolor: '#ffffff',
                    borderRadius: 2,
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                    border: '1px solid rgba(0, 0, 0, 0.05)',
                    p: 3,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: 0,
                    overflow: 'hidden'
                  }}
                >
                  回答率（直近1週間）
                </Box>

                {/* 右上右のContainer */}
                <Box
                  sx={{
                    flex: 1,
                    bgcolor: '#ffffff',
                    borderRadius: 2,
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                    border: '1px solid rgba(0, 0, 0, 0.05)',
                    p: 3,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: 0,
                    overflow: 'hidden'
                  }}
                >
                  回答者数推移（直近1週間）
                </Box>
              </Box>

              {/* 右下のContainer */}
              <Box
                sx={{
                  flex: 1,
                  bgcolor: '#ffffff',
                  borderRadius: 2,
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                  border: '1px solid rgba(0, 0, 0, 0.05)',
                  p: 3,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                最新の回答者リスト
              </Box>
            </Box>
          </Box>

          {/* 下部横幅最大のContainer */}
          <Box
            sx={{
              flex: 1,
              width: '100%',
              bgcolor: '#ffffff',
              borderRadius: 2,
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              border: '1px solid rgba(0, 0, 0, 0.05)',
              p: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: 0,
              overflow: 'hidden'
            }}
          >
            下部コンテンツ
          </Box>
        </Box>
      </Container>
    </motion.div>
  );
}