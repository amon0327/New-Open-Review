import React, { createContext, useContext } from 'react';

// デフォルトカラー
const DEFAULT_PRIMARY = '#5e17eb';
const DEFAULT_SECONDARY = '#764ba2';
const DEFAULT_ACCENT = '#667eea';

const PartnerThemeContext = createContext(null);

// hex色からrgba文字列を生成
const hexToRgba = (hex, alpha) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// プライマリーカラーから派生色を生成
const buildThemeColors = (partnerTheme) => {
  const primary = partnerTheme?.primary_color || DEFAULT_PRIMARY;
  const hasPrimary = !!partnerTheme?.primary_color;
  const secondary = hasPrimary ? primary + 'cc' : DEFAULT_SECONDARY;
  const accent = hasPrimary ? primary : DEFAULT_ACCENT;

  return {
    primary,
    secondary,
    accent,
    // グラデーション
    sidebarGradient: hasPrimary
      ? `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`
      : `linear-gradient(135deg, ${DEFAULT_ACCENT} 0%, ${DEFAULT_SECONDARY} 100%)`,
    primaryGradient: hasPrimary
      ? `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`
      : `linear-gradient(135deg, ${DEFAULT_PRIMARY} 0%, ${DEFAULT_SECONDARY} 100%)`,
    accentGradient: hasPrimary
      ? `linear-gradient(45deg, ${primary} 30%, ${secondary} 90%)`
      : `linear-gradient(45deg, ${DEFAULT_PRIMARY} 30%, ${DEFAULT_SECONDARY} 90%)`,
    secondaryGradient: hasPrimary
      ? `linear-gradient(135deg, ${accent} 0%, ${secondary} 100%)`
      : `linear-gradient(135deg, ${DEFAULT_ACCENT} 0%, ${DEFAULT_SECONDARY} 100%)`,
    // 透明度バリエーション
    primaryAlpha02: hexToRgba(primary, 0.02),
    primaryAlpha05: hexToRgba(primary, 0.05),
    primaryAlpha08: hexToRgba(primary, 0.08),
    primaryAlpha10: hexToRgba(primary, 0.1),
    primaryAlpha15: hexToRgba(primary, 0.15),
    primaryAlpha20: hexToRgba(primary, 0.2),
    primaryAlpha30: hexToRgba(primary, 0.3),
    primaryAlpha40: hexToRgba(primary, 0.4),
    // ロゴURL
    logoLight: partnerTheme?.logo_light_url || null,
    logoDark: partnerTheme?.logo_dark_url || null,
    logoIcon: partnerTheme?.logo_icon_url || null,
  };
};

export const PartnerThemeProvider = ({ partnerTheme, isThemeLoaded = true, children }) => {
  const theme = { ...buildThemeColors(partnerTheme), isThemeLoaded };
  return (
    <PartnerThemeContext.Provider value={theme}>
      {children}
    </PartnerThemeContext.Provider>
  );
};

export const usePartnerTheme = () => {
  const theme = useContext(PartnerThemeContext);
  // Context外でも動作するようデフォルト値を返す
  if (!theme) return { ...buildThemeColors(null), isThemeLoaded: true };
  return theme;
};

export { buildThemeColors };
export default PartnerThemeContext;
