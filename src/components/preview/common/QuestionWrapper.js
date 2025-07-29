import React from 'react';
import { Container, Box } from '@mui/material';

// Question Wrapper Component - 全質問タイプの共通コンテナ
const QuestionWrapper = ({ children }) => {
  return (
    <Container 
      maxWidth={false} 
      disableGutters 
      sx={{ 
        width: '100%', 
        px: '0 !important', 
        mx: '0 !important',
        paddingLeft: '0 !important',
        paddingRight: '0 !important',
        marginLeft: '0 !important',
        marginRight: '0 !important'
      }}
    >
      <Box sx={{ pt: '50px', display: 'flex', flexDirection: 'column', alignItems: 'center', px: 0, mx: 0 }}>
        {children}
      </Box>
    </Container>
  );
};

export default QuestionWrapper;