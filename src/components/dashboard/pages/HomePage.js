import React from 'react';
import { motion } from 'framer-motion';
import { Paper, Typography } from '@mui/material';

export default function HomePage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Paper
        sx={{
          p: 4,
          height: 'calc(100vh - 120px)',
          borderRadius: 3,
          background: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid rgba(0, 0, 0, 0.1)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
        }}
      >
        <Typography variant="h4" color="text.secondary">
          Home Content Container
        </Typography>
      </Paper>
    </motion.div>
  );
}