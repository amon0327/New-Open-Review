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
          width: '100vw',
          m: 0,
          p: 0,
          bgcolor: '#f5f5f5'
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
            bgcolor: '#f8fafc'
          }}
        >
          {/* 上部横並びrow */}
          <Box
            sx={{
              display: 'flex',
              gap: 3,
              height: '50%'
            }}
          >
            {/* 左側のContainer */}
            <Box
              sx={{
                flex: 1,
                height: '100%',
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
              左側コンテンツ
            </Box>

            {/* 右側のContainer */}
            <Box
              sx={{
                flex: 1,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: 3
              }}
            >
              {/* 右上のContainer */}
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
                右上コンテンツ
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
                右下コンテンツ
              </Box>
            </Box>
          </Box>
        </Box>
      </Container>
    </motion.div>
  );
}