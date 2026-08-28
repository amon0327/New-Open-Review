import React from 'react';
import { Tooltip } from '@mui/material';
import { Info } from 'lucide-react';

export const InfoTooltip = ({ content, className = "" }) => {
  return (
    <Tooltip title={content} placement="top">
      <Info 
        className={`w-4 h-4 text-gray-400 hover:text-gray-600 transition-colors cursor-help ${className}`} 
      />
    </Tooltip>
  );
};