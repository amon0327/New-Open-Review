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
        {/* コンテンツエリア */}
        <Box
          sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: '#ffffff'
          }}
        >
          {/* 今後ここにコンテンツを追加 */}
        </Box>
      </Container>
    </motion.div>
  );
}