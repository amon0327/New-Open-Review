import React from 'react';
import { Box } from '@mui/material';

/**
 * SVG画像を表示するコンポーネント
 * @param {string} src - SVG画像のURL
 * @param {number} size - アイコンのサイズ（デフォルト: 24）
 * @param {string} color - アイコンの色（デフォルト: white）
 * @param {object} sx - MUIのSXプロパティ
 */
const SvgIcon = ({ src, size = 24, color = 'white', sx = {}, ...props }) => {
  return (
    <Box
      component="img"
      src={src}
      sx={{
        width: size,
        height: size,
        filter: color === 'white' ? 'brightness(0) invert(1)' : 'none',
        ...sx
      }}
      {...props}
    />
  );
};

export default SvgIcon;