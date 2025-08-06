// Color utility functions used across preview question components

export const stringToColor = (colorString) => {
  if (!colorString) return '#8C52FF';
  return colorString;
};

export const colorWithLightOpacity = (color, opacity = 8) => {
  return `${color}${Math.round(255 * opacity / 100).toString(16).padStart(2, '0')}`;
};

export const colorWithBorderOpacity = (color, opacity = 30) => {
  return `${color}${Math.round(255 * opacity / 100).toString(16).padStart(2, '0')}`;
};