import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Box, Typography, Button, Card, CardContent, IconButton } from '@mui/material';
import { Add, ChevronLeft, ChevronRight } from '@mui/icons-material';

export default function HomePage({ user, onCreateFormClick }) {
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
          px: 4
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
            '&:hover': {
              background: 'linear-gradient(135deg, #4c0dbf 0%, #5a6fd8 100%)',
            }
          }}
        >
          新しいフォームを作成
        </Button>
      </Box>
    </motion.div>
  );
}