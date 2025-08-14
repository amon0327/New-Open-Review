import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Typography, Box } from '@mui/material';

export default function MarkdownRenderer({ content, sx = {} }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        // 段落
        p: ({ children, ...props }) => (
          <Typography 
            variant="body1" 
            sx={{ 
              mb: 1, 
              lineHeight: 1.6,
              fontSize: '0.9rem',
              color: 'inherit',
              '&:last-child': { mb: 0 },
              ...sx 
            }} 
            {...props}
          >
            {children}
          </Typography>
        ),
        
        // 太字
        strong: ({ children, ...props }) => (
          <Box 
            component="strong" 
            sx={{ 
              fontWeight: 700,
              color: 'inherit'
            }} 
            {...props}
          >
            {children}
          </Box>
        ),
        
        // イタリック
        em: ({ children, ...props }) => (
          <Box 
            component="em" 
            sx={{ 
              fontStyle: 'italic',
              color: 'inherit'
            }} 
            {...props}
          >
            {children}
          </Box>
        ),
        
        // インラインコード
        code: ({ children, className, ...props }) => {
          const match = /language-(\w+)/.exec(className || '');
          
          if (!match) {
            // インラインコード
            return (
              <Box
                component="code"
                sx={{
                  px: 0.5,
                  py: 0.25,
                  borderRadius: 0.5,
                  bgcolor: 'rgba(0, 0, 0, 0.05)',
                  fontFamily: 'Monaco, Consolas, "Lucida Console", monospace',
                  fontSize: '0.85em',
                  color: '#e53e3e',
                  border: '1px solid rgba(0, 0, 0, 0.1)'
                }}
                {...props}
              >
                {children}
              </Box>
            );
          }
          
          // コードブロック
          return (
            <Box
              component="pre"
              sx={{
                p: 2,
                borderRadius: 1,
                bgcolor: '#f7fafc',
                border: '1px solid #e2e8f0',
                overflow: 'auto',
                mb: 1,
                '&:last-child': { mb: 0 }
              }}
            >
              <Box
                component="code"
                sx={{
                  fontFamily: 'Monaco, Consolas, "Lucida Console", monospace',
                  fontSize: '0.85rem',
                  color: '#2d3748',
                  lineHeight: 1.5
                }}
                {...props}
              >
                {children}
              </Box>
            </Box>
          );
        },
        
        // リスト
        ul: ({ children, ...props }) => (
          <Box 
            component="ul" 
            sx={{ 
              pl: 2, 
              mb: 1,
              fontSize: 'inherit',
              '&:last-child': { mb: 0 }
            }} 
            {...props}
          >
            {children}
          </Box>
        ),
        
        ol: ({ children, ...props }) => (
          <Box 
            component="ol" 
            sx={{ 
              pl: 2, 
              mb: 1,
              fontSize: 'inherit',
              '&:last-child': { mb: 0 }
            }} 
            {...props}
          >
            {children}
          </Box>
        ),
        
        li: ({ children, ...props }) => (
          <Box 
            component="li" 
            sx={{ 
              mb: 0.5,
              fontSize: 'inherit',
              lineHeight: 1.6,
              color: 'inherit',
              '& *': {
                fontSize: 'inherit !important'
              }
            }} 
            {...props}
          >
            {children}
          </Box>
        ),
        
        // 見出し
        h1: ({ children, ...props }) => (
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 700, 
              mb: 1.5, 
              mt: 1,
              '&:first-of-type': { mt: 0 },
              color: 'inherit'
            }} 
            {...props}
          >
            {children}
          </Typography>
        ),
        
        h2: ({ children, ...props }) => (
          <Typography 
            variant="subtitle1" 
            sx={{ 
              fontWeight: 600, 
              mb: 1, 
              mt: 1,
              '&:first-of-type': { mt: 0 },
              color: 'inherit'
            }} 
            {...props}
          >
            {children}
          </Typography>
        ),
        
        h3: ({ children, ...props }) => (
          <Typography 
            variant="subtitle2" 
            sx={{ 
              fontWeight: 600, 
              mb: 1, 
              mt: 1,
              '&:first-of-type': { mt: 0 },
              color: 'inherit'
            }} 
            {...props}
          >
            {children}
          </Typography>
        ),
        
        // 引用
        blockquote: ({ children, ...props }) => (
          <Box
            component="blockquote"
            sx={{
              pl: 2,
              py: 1,
              mb: 1,
              borderLeft: '4px solid #e2e8f0',
              bgcolor: '#f7fafc',
              fontStyle: 'italic',
              color: '#4a5568',
              '&:last-child': { mb: 0 }
            }}
            {...props}
          >
            {children}
          </Box>
        ),
        
        // 水平線
        hr: ({ ...props }) => (
          <Box
            component="hr"
            sx={{
              my: 2,
              border: 'none',
              height: '1px',
              bgcolor: '#e2e8f0'
            }}
            {...props}
          />
        ),
        
        // リンク
        a: ({ children, href, ...props }) => (
          <Box
            component="a"
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              color: '#3182ce',
              textDecoration: 'none',
              '&:hover': {
                textDecoration: 'underline'
              }
            }}
            {...props}
          >
            {children}
          </Box>
        )
      }}
    >
      {content}
    </ReactMarkdown>
  );
}