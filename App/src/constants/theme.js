// テーマ定数定義
export const colors = {
  primary: '#5e17eb',
  secondary: '#764ba2',
  textPrimary: '#1a1a1a',
  textSecondary: '#64748b',
  textMuted: '#9ca3af',
  white: '#ffffff',
  transparent: 'transparent'
};

export const gradients = {
  primary: '#5e17eb',
  secondary: '#5e17eb',
  background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
  glass: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.1) 100%)'
};

export const shadows = {
  glass: '0 10px 40px rgba(0, 0, 0, 0.1)',
  card: '0 20px 60px rgba(0, 0, 0, 0.15)',
  mobile: '0 25px 80px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05)'
};

export const glassPaperStyles = {
  background: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.3)',
  boxShadow: shadows.glass
};

export const iconButtonStyles = {
  primary: {
    color: colors.primary,
    backgroundColor: `rgba(94, 23, 235, 0.1)`,
    '&:hover': {
      backgroundColor: `rgba(94, 23, 235, 0.1)`
    }
  },
  secondary: {
    color: colors.textSecondary,
    '&:hover': {
      backgroundColor: 'rgba(100, 116, 139, 0.1)'
    }
  }
};