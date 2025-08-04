import React from 'react';
import { motion } from 'framer-motion';
import { Box, Typography } from '@mui/material';

export default function HomePage() {
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
          background: 'linear-gradient(180deg, rgba(94, 23, 235, 0.1) 0%, rgba(246, 222, 120, 0.1) 30%, rgba(255, 255, 255, 1) 70%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Typography variant="h4" color="text.secondary">
          Home Content Container
        </Typography>
      </Box>
    </motion.div>
  );
}