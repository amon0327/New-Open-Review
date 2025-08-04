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
          background: 'linear-gradient(90deg, rgba(94, 23, 235, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%)',
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