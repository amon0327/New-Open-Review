import React from 'react';
import { motion } from 'framer-motion';
import { Box } from '@mui/material';

export default function ChatPanel() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
    >
      <Box
        sx={{
          width: 340,
          height: '100%',
          ml: 1,
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(145deg, rgba(248,250,252,0.8) 0%, rgba(241,245,249,0.9) 50%, rgba(226,232,240,0.8) 100%)',
          borderRadius: 2,
          border: '1px solid rgba(148,163,184,0.2)',
          backdropFilter: 'blur(20px)',
          overflow: 'hidden'
        }}
      >
        {/* 空のコンテナ */}
      </Box>
    </motion.div>
  );
}