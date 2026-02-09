import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image,
  pdf,
  Svg,
  Path,
  Polygon,
  Rect,
} from '@react-pdf/renderer';

// 日本語フォントを登録（Noto Sans JP）
Font.register({
  family: 'NotoSansJP',
  src: 'https://raw.githubusercontent.com/googlefonts/noto-cjk/main/Sans/OTF/Japanese/NotoSansCJKjp-Regular.otf',
  fontWeight: 'normal',
});

Font.register({
  family: 'NotoSansJP',
  src: 'https://raw.githubusercontent.com/googlefonts/noto-cjk/main/Sans/OTF/Japanese/NotoSansCJKjp-Bold.otf',
  fontWeight: 'bold',
});

// ハイフネーション無効化（日本語対応）
Font.registerHyphenationCallback(word => [word]);

// テキストにゼロ幅スペースを挿入し、ハイフンなしで改行可能にする
const breakableText = (text) => {
  if (!text) return '';
  return text.split('').join('\u200B');
};

// AIテキスト用：句読点・記号の後にのみゼロ幅スペースを挿入（ハイフン表示を防ぐ）
const softBreakText = (text) => {
  if (!text) return '';
  return text.replace(/([。、！？）」』\n,.!?\)\s])/g, '$1\u200B');
};

// カラー定義
const colors = {
  primary: '#5e17eb',
  primaryLight: '#7c3aed',
  primaryDark: '#4c0db8',
  white: '#ffffff',
  gray50: '#f8fafc',
  gray100: '#f1f5f9',
  gray200: '#e2e8f0',
  gray400: '#94a3b8',
  gray500: '#64748b',
  gray600: '#475569',
  gray700: '#334155',
  gray900: '#0f172a',
  green500: '#22c55e',
  green100: '#dcfce7',
  green200: '#bbf7d0',
  green700: '#15803d',
  red500: '#ef4444',
  red100: '#fee2e2',
  red200: '#fecaca',
  red700: '#b91c1c',
  // KPIカード用カラー
  blue500: '#3b82f6',
  emerald500: '#10b981',
  amber500: '#f59e0b',
  amber100: '#fef3c7',
  amber200: '#fde68a',
  amber700: '#b45309',
  violet500: '#8b5cf6',
};

// スタイル定義
const styles = StyleSheet.create({
  // ============================================
  // 表紙スタイル
  // ============================================
  coverPage: {
    flexDirection: 'column',
    backgroundColor: colors.primary,
    padding: 60,
    fontFamily: 'NotoSansJP',
    justifyContent: 'center',
  },
  coverLogoContainer: {
    marginBottom: 16,
    marginLeft: -20,
  },
  coverLogoWithText: {
    height: 28,
    width: 156,
    objectFit: 'contain',
  },
  coverInfoContainer: {
    marginTop: 20,
  },
  coverCompanyStore: {
    fontSize: 13,
    color: colors.white,
    opacity: 0.85,
    marginBottom: 4,
  },
  coverDate: {
    fontSize: 13,
    color: colors.white,
    opacity: 0.85,
  },
  coverBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 8,
    backgroundColor: '#ff6b6b',
  },

  // ============================================
  // コンテンツページスタイル（ボーダー枠デザイン）
  // ============================================
  contentPageOuter: {
    flexDirection: 'column',
    backgroundColor: colors.primary,
    padding: 16,
    fontFamily: 'NotoSansJP',
  },
  contentPageInner: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingHorizontal: 28,
    paddingTop: 20,
    paddingBottom: 24,
    flexDirection: 'column',
  },

  // ページタイトル（中央配置）
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.gray900,
    textAlign: 'center',
    marginBottom: 32,
  },

  // セクションヘッダー（アイコン + タイトル + ページ番号 + 紫ライン）
  sectionHeader: {
    marginBottom: 24,
  },
  sectionHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionHeaderIcon: {
    width: 22,
    height: 22,
    objectFit: 'contain',
  },
  sectionHeaderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  sectionHeaderPageNumber: {
    fontSize: 10,
    color: colors.gray500,
  },
  sectionHeaderLine: {
    height: 3,
    backgroundColor: colors.primary,
    borderRadius: 2,
  },

  // コンテンツエリア
  content: {
    flex: 1,
  },

  // ページコメントバー
  pageCommentBarWrapper: {
    marginTop: 'auto',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  pageCommentBar: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  pageCommentText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.white,
    fontFamily: 'NotoSansJP',
    textAlign: 'center',
    lineHeight: 1.5,
  },

  // KPIカードグリッド（4列）
  kpiGrid: {
    flexDirection: 'row',
    gap: 16,
  },

  // KPIカード
  kpiCard: {
    flex: 1,
    backgroundColor: colors.white,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderStyle: 'solid',
    // 影の設定
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  kpiCardTitle: {
    fontSize: 11,
    color: colors.gray500,
    marginBottom: 8,
  },
  kpiCardMetric: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.gray900,
    marginBottom: 8,
  },
  kpiCardDeltaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  kpiCardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    gap: 2,
  },
  kpiCardBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.white,
  },
  kpiCardVsText: {
    fontSize: 9,
    color: colors.gray400,
  },

  // ヘッダー（ロゴ + ページ番号）
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLogo: {
    height: 24,
    width: 120,
    objectFit: 'contain',
  },
  headerPageNumber: {
    fontSize: 10,
    color: colors.gray500,
  },

  // フッター（未使用だが互換性のため残す）
  footer: {
    marginTop: 'auto',
    paddingTop: 12,
    alignItems: 'flex-end',
  },
  footerPageNumber: {
    fontSize: 10,
    color: colors.gray400,
  },

  // ============================================
  // チャートセクション
  // ============================================
  chartSection: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 20,
  },
  chartCard: {
    flex: 1,
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderStyle: 'solid',
    // 影の設定
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.gray900,
    marginBottom: 4,
  },
  chartSubtitle: {
    fontSize: 10,
    color: colors.gray500,
    marginBottom: 12,
  },

  // NPS分布カード
  npsDistributionLegend: {
    gap: 8,
  },
  npsLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 8,
  },
  npsLegendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  npsLegendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  npsLegendLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.gray700,
  },
  npsLegendValue: {
    fontSize: 12,
    fontWeight: 'bold',
  },

  // NPSトレンドチャート
  trendChartContainer: {
    height: 140,
    position: 'relative',
  },
  trendXAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 10,
  },
  trendXLabel: {
    fontSize: 8,
    color: colors.gray500,
  },

  // ============================================
  // 3ページ目：売上影響ページ
  // ============================================

  // 顧客カテゴリーカードグリッド
  categoryCardGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  categoryCard: {
    flex: 1,
    backgroundColor: colors.white,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderStyle: 'solid',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  categoryCardHeader: {
    marginBottom: 10,
  },
  categoryCardTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.gray900,
  },
  categoryCardSubtitle: {
    fontSize: 8,
    color: colors.gray500,
    marginTop: 2,
  },
  categoryCardMetric: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  categoryCardValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.gray900,
  },
  categoryCardUnit: {
    fontSize: 10,
    color: colors.gray500,
  },
  categoryCardProgress: {
    height: 6,
    backgroundColor: colors.gray200,
    borderRadius: 3,
    marginTop: 8,
    overflow: 'hidden',
  },
  categoryCardProgressBar: {
    height: 6,
    borderRadius: 3,
  },
  categoryCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  categoryCardLabel: {
    fontSize: 8,
    color: colors.gray500,
  },
  categoryCardPercent: {
    fontSize: 9,
    fontWeight: 'bold',
  },

  // 顧客構成比較
  compositionCard: {
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderStyle: 'solid',
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  compositionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  compositionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.gray900,
  },
  compositionLegend: {
    flexDirection: 'row',
    gap: 12,
  },
  compositionLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  compositionLegendDot: {
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  compositionLegendText: {
    fontSize: 7,
    color: colors.gray600,
  },
  compositionRow: {
    marginBottom: 10,
  },
  compositionRowLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  compositionRowTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.gray700,
  },
  compositionRowCount: {
    fontSize: 8,
    color: colors.gray500,
  },
  compositionBar: {
    flexDirection: 'row',
    height: 18,
    backgroundColor: colors.gray100,
    borderRadius: 9,
    overflow: 'hidden',
  },
  compositionBarSegment: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  compositionBarText: {
    fontSize: 7,
    fontWeight: 'bold',
    color: colors.white,
  },

  // セグメント詳細テーブル
  segmentTableCard: {
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderStyle: 'solid',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  segmentTableTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.gray900,
    marginBottom: 12,
  },
  segmentTableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
    borderBottomStyle: 'solid',
    paddingBottom: 8,
    marginBottom: 8,
  },
  segmentTableHeaderCell: {
    fontSize: 9,
    fontWeight: 'bold',
    color: colors.gray600,
  },
  segmentTableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
    borderBottomStyle: 'solid',
    alignItems: 'center',
  },
  segmentTableCell: {
    fontSize: 9,
    color: colors.gray700,
  },
  segmentBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  segmentBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: colors.white,
    textAlign: 'center',
  },
  segmentProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  segmentProgressBar: {
    width: 50,
    height: 5,
    backgroundColor: colors.gray200,
    borderRadius: 3,
    overflow: 'hidden',
  },
  segmentProgressFill: {
    height: 5,
    backgroundColor: colors.gray600,
    borderRadius: 3,
  },

  // ============================================
  // 4ページ目：店舗評価ページ
  // ============================================

  // QSCカードグリッド
  qscCardGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  qscCard: {
    flex: 1,
    backgroundColor: colors.white,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderStyle: 'solid',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  qscCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  qscCardTitleArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  qscCardIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qscCardTitleText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.gray900,
  },
  qscCardSubtitle: {
    fontSize: 9,
    color: colors.gray500,
    marginTop: 2,
  },
  qscCardTrendBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  qscCardTrendText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  qscCardScoreArea: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  qscCardScoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  qscCardScore: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  qscCardScoreMax: {
    fontSize: 10,
    color: colors.gray500,
  },
  qscCardAchievementArea: {
    alignItems: 'flex-end',
  },
  qscCardAchievementLabel: {
    fontSize: 8,
    color: colors.gray500,
  },
  qscCardAchievementValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.gray700,
  },
  qscCardProgressBar: {
    height: 6,
    backgroundColor: colors.gray200,
    borderRadius: 3,
    overflow: 'hidden',
  },
  qscCardProgressFill: {
    height: 6,
    borderRadius: 3,
  },

  // ============================================
  // 5ページ目：QSC詳細ページ
  // ============================================

  // ページ上部レイアウト（左：タイトル＋説明、右：スコアカード）
  qscDetailPageHeader: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 12,
  },
  qscDetailLeftSection: {
    flex: 1,
  },
  qscDetailRightSection: {
    width: 280,
  },

  // カテゴリータイトル（アイコン + テキスト + n=）
  qscDetailTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  qscDetailTitleLine: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginBottom: 12,
  },
  qscDetailIcon: {
    width: 24,
    height: 24,
  },
  qscDetailTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.gray900,
  },
  qscDetailTitleCount: {
    fontSize: 9,
    color: colors.gray500,
    marginLeft: 8,
  },

  // 課題説明テキスト
  qscDetailDescription: {
    fontSize: 10,
    color: colors.gray600,
    lineHeight: 1.6,
  },

  // ミニスコアカード
  qscMiniCard: {
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderStyle: 'solid',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  qscMiniCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  qscMiniCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qscMiniCardIconBox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qscMiniCardTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.gray900,
  },
  qscMiniCardSubtitle: {
    fontSize: 9,
    color: colors.gray500,
  },
  qscMiniCardTrendBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  qscMiniCardTrendText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  qscMiniCardScoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  qscMiniCardScore: {
    fontSize: 26,
    fontWeight: 'bold',
  },
  qscMiniCardScoreMax: {
    fontSize: 10,
    color: colors.gray500,
  },
  qscMiniCardAchievement: {
    alignItems: 'flex-end',
  },
  qscMiniCardAchievementLabel: {
    fontSize: 8,
    color: colors.gray500,
  },
  qscMiniCardAchievementValue: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.gray700,
  },
  qscMiniCardProgress: {
    height: 5,
    backgroundColor: colors.gray200,
    borderRadius: 3,
    overflow: 'hidden',
  },
  qscMiniCardProgressFill: {
    height: 5,
    borderRadius: 3,
  },

  // 評価項目バーチャートセクション
  qscDetailItemsContainer: {
    flexDirection: 'row',
    gap: 24,
  },
  qscDetailItemsColumn: {
    flex: 1,
  },
  qscDetailItemsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  qscDetailItemsCount: {
    fontSize: 8,
    color: colors.gray500,
  },

  // 個別評価項目
  qscDetailItem: {
    marginBottom: 10,
  },
  qscDetailItemLabel: {
    fontSize: 9,
    color: colors.gray700,
    marginBottom: 4,
  },
  qscDetailItemBar: {
    flexDirection: 'row',
    height: 16,
    borderRadius: 4,
    overflow: 'hidden',
  },
  qscDetailItemBarSegment: {
    height: 16,
  },
  qscDetailItemValues: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 3,
  },
  qscDetailItemValue: {
    fontSize: 8,
    fontWeight: 'bold',
  },

  // ============================================
  // 顧客傾向ページ
  // ============================================

  // 顧客傾向カードグリッド（2列×2行）
  customerTrendsTopRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  customerTrendsBottomRow: {
    flexDirection: 'row',
    gap: 12,
  },
  customerTrendsCard: {
    flex: 1,
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderStyle: 'solid',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  customerTrendsCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  customerTrendsCardIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customerTrendsCardTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.gray900,
  },

  // 横バーゲージ
  horizontalGaugeBar: {
    flexDirection: 'row',
    height: 16,
    borderRadius: 8,
    overflow: 'hidden',
    width: '100%',
    marginBottom: 10,
  },
  horizontalGaugeSegment: {
    height: 16,
  },

  // 横バーアイテム（年齢層・同行者用）
  horizontalBarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  horizontalBarLabel: {
    fontSize: 9,
    color: colors.gray700,
    width: 45,
    fontFamily: 'NotoSansJP',
  },
  horizontalBarTrack: {
    flex: 1,
    height: 14,
    backgroundColor: '#f1f5f9',
    borderRadius: 7,
    overflow: 'hidden',
    marginHorizontal: 8,
  },
  horizontalBarFill: {
    height: 14,
    borderRadius: 7,
  },
  horizontalBarValue: {
    fontSize: 9,
    fontWeight: 'bold',
    color: colors.gray700,
    width: 30,
    textAlign: 'right',
    fontFamily: 'NotoSansJP',
  },

  // 凡例
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 9,
    color: colors.gray600,
  },
  legendValue: {
    fontSize: 9,
    fontWeight: 'bold',
    color: colors.gray700,
  },

  // 縦バーチャート風表示（年齢層・同行者用）
  verticalBarContainer: {
    gap: 8,
  },
  verticalBarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  verticalBarLabel: {
    width: 50,
    fontSize: 9,
    color: colors.gray600,
  },
  verticalBarTrack: {
    flex: 1,
    height: 16,
    backgroundColor: colors.gray100,
    borderRadius: 4,
    overflow: 'hidden',
  },
  verticalBarFill: {
    height: 16,
    borderRadius: 4,
  },
  verticalBarValue: {
    width: 35,
    fontSize: 9,
    fontWeight: 'bold',
    color: colors.gray700,
    textAlign: 'right',
  },

  // 顧客の重視ポイントカード
  priorityCard: {
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderStyle: 'solid',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  priorityCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  priorityCardTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.gray900,
  },
  priorityColumnsContainer: {
    flexDirection: 'row',
    gap: 20,
  },
  priorityColumn: {
    flex: 1,
    alignItems: 'center',
  },
  priorityColumnTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.gray700,
    textAlign: 'center',
    marginBottom: 10,
  },
  priorityRankItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
    borderBottomStyle: 'solid',
  },
  priorityRankLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  priorityRankNumber: {
    fontSize: 9,
    fontWeight: 'bold',
    color: colors.gray500,
  },
  priorityRankLabel: {
    fontSize: 9,
    color: colors.gray700,
  },
  priorityRankValue: {
    fontSize: 9,
    fontWeight: 'bold',
  },

  // ============================================
  // 店舗別インサイトページ
  // ============================================
  insightCardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  insightCard: {
    width: '32%',
    backgroundColor: colors.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderStyle: 'solid',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    overflow: 'hidden',
  },
  insightCardInner: {
    padding: 10,
  },
  insightNpsTag: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 3,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  insightNpsTagText: {
    fontSize: 6,
    fontWeight: 'bold',
    color: colors.white,
    fontFamily: 'NotoSansJP',
  },
  insightCardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 6,
  },
  insightCardTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.gray900,
    fontFamily: 'NotoSansJP',
  },
  insightCardCount: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  insightCardCountValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.gray900,
    fontFamily: 'NotoSansJP',
  },
  insightCardCountUnit: {
    fontSize: 7,
    color: colors.gray400,
    fontFamily: 'NotoSansJP',
  },
  insightDivider: {
    height: 1,
    backgroundColor: colors.gray100,
    marginBottom: 6,
  },
  insightIssueLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 4,
  },
  insightIssueLabelText: {
    fontSize: 6,
    fontWeight: 'bold',
    color: colors.gray500,
    fontFamily: 'NotoSansJP',
    letterSpacing: 0.5,
  },
  insightIssueItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
    marginBottom: 2,
  },
  insightIssueDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.gray400,
    marginTop: 3,
    flexShrink: 0,
  },
  insightIssueText: {
    fontSize: 6.5,
    color: colors.gray600,
    fontFamily: 'NotoSansJP',
    lineHeight: 1.4,
    flex: 1,
  },

  // 詳細展開カード
  detailCard: {
    backgroundColor: colors.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderStyle: 'solid',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    marginTop: 10,
    overflow: 'hidden',
  },
  detailCardFloatingTag: {
    position: 'absolute',
    top: -8,
    left: 12,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
    zIndex: 1,
  },
  detailCardFloatingTagText: {
    fontSize: 7,
    fontWeight: 'bold',
    color: colors.white,
    fontFamily: 'NotoSansJP',
  },
  detailCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 8,
  },
  detailCardTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.gray900,
    fontFamily: 'NotoSansJP',
  },
  detailCardCountText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.gray400,
    fontFamily: 'NotoSansJP',
  },
  detailCardDivider: {
    height: 1,
    backgroundColor: colors.gray200,
    marginHorizontal: 14,
  },
  detailCardBody: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 14,
  },
  detailTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  detailTag: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  detailTagText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: colors.white,
    fontFamily: 'NotoSansJP',
  },
  detailTagCross: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.gray400,
    fontFamily: 'NotoSansJP',
  },
  detailSectionLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  detailSectionLabelText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.gray500,
    fontFamily: 'NotoSansJP',
    letterSpacing: 0.5,
  },
  detailSectionText: {
    fontSize: 10,
    color: colors.gray600,
    fontFamily: 'NotoSansJP',
    lineHeight: 1.5,
    paddingLeft: 10,
    marginBottom: 12,
  },
  detailExampleBox: {
    backgroundColor: colors.gray50,
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
  },
  detailExampleTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.gray500,
    fontFamily: 'NotoSansJP',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  detailExampleItem: {
    marginBottom: 6,
  },
  detailExampleText: {
    fontSize: 10,
    color: colors.gray700,
    fontFamily: 'NotoSansJP',
    lineHeight: 1.5,
  },
  detailExampleMeasurement: {
    fontSize: 9,
    color: colors.gray400,
    fontFamily: 'NotoSansJP',
    paddingLeft: 12,
    marginTop: 2,
  },

  // 詳細カード2枚横並び
  detailCardsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  detailCardHalf: {
    flex: 1,
    position: 'relative',
  },

  // パターンA: 顧客の声コールアウト
  voiceCallout: {
    backgroundColor: '#f3eefe',
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderStyle: 'solid',
    borderRadius: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  voiceCalloutIconWrap: {
    width: 22,
    height: 22,
    marginTop: 1,
  },
  voiceCalloutText: {
    fontSize: 11,
    color: colors.gray700,
    fontFamily: 'NotoSansJP',
    lineHeight: 1.6,
    flex: 1,
  },

  // パターンB: 評価バーチャート
  evalBarSection: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  evalBarColumn: {
    flex: 1,
  },
  evalBarLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.gray700,
    fontFamily: 'NotoSansJP',
    marginBottom: 8,
  },
  evalBar: {
    flexDirection: 'row',
    height: 20,
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.gray200,
    borderStyle: 'solid',
  },
  evalBarSegment: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  evalBarPercentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  evalBarPercentPositive: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#16a34a',
    fontFamily: 'NotoSansJP',
  },
  evalBarPercentNeutral: {
    fontSize: 9,
    fontWeight: 'bold',
    color: colors.gray500,
    fontFamily: 'NotoSansJP',
  },
  evalBarPercentNegative: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#dc2626',
    fontFamily: 'NotoSansJP',
  },
  evalBarLegend: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  evalBarLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  evalBarLegendDot: {
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  evalBarLegendText: {
    fontSize: 9,
    color: colors.gray600,
    fontFamily: 'NotoSansJP',
  },
});

// ロゴURL
const LOGO_URL = 'https://otfreskkeaenahqziriz.supabase.co/storage/v1/object/public/app-assets/logo/OpenReviewWhiteThemeLoog.png';
const LOGO_ICON_URL = 'https://otfreskkeaenahqziriz.supabase.co/storage/v1/object/public/app-assets/logo/OpenReviewLogo.png';
const LOGO_WITH_TEXT_URL = 'https://otfreskkeaenahqziriz.supabase.co/storage/v1/object/public/app-assets/logo/OpenReviewDarkThemeLoog.png';

// KPIカードのカラー配列
const KPI_COLORS = [colors.blue500, colors.emerald500, colors.amber500, colors.violet500];

// ============================================
// 店舗別インサイト用データ
// ============================================
const SEGMENT_INSIGHTS_PDF = {
  1: { issues: ['ロイヤル顧客の維持・強化が最重要課題', '離脱した場合の売上インパクトが最も大きい', '特別な体験や特典で関係性をさらに深化させる余地'] },
  2: { issues: ['初回体験は好印象だがリピーター定着が未確定', '2回目の来店につなげる施策が重要', '推奨者として口コミ効果を最大化する機会'] },
  3: { issues: ['高評価にもかかわらず再来店意向がない', '引越しや生活環境の変化など外的要因の可能性', '競合店への流出リスクが潜在的に存在'] },
  4: { issues: ['初回体験は高評価だが再来店動機が不足', '立地やアクセスなど利便性の課題の可能性', 'リピートにつながる仕掛けが不足'] },
  5: { issues: ['リピーターだが推奨するほどの満足度に達していない', 'サービスに慣れが生じ、特別感が薄れている可能性', '競合との差別化ポイントが実感されていない'] },
  6: { issues: ['再来店意向はあるが、強い印象を残せていない', '商品やサービスの魅力が十分に伝わっていない', '「また行ってもいい」程度の弱い動機'] },
  7: { issues: ['リピーターが満足度低下により離脱を検討', 'サービス品質の低下や期待とのギャップが蓄積', '対策しなければ離脱が確定する危険な状態'] },
  8: { issues: ['初回体験が印象に残らず離脱', '店舗の差別化ポイントが伝わっていない', '新規獲得コストが回収できていない'] },
  9: { issues: ['不満を抱えながらも来店を続けている', '代替店がない、または習慣的に来店している状態', 'ネガティブな口コミを発信するリスクが高い'] },
  10: { issues: ['初回体験に明確な不満がある', '再来店意向はあるが改善がなければ離脱確実', '具体的な改善ポイントが存在するサイン'] },
  11: { issues: ['リピーターの信頼を失い完全離脱の状態', '不満が蓄積し、もう来店する意思がない', 'ネガティブ口コミの最大リスク要因'] },
  12: { issues: ['初回体験が非常に悪く完全離脱', '新規獲得にかけたコストが無駄になっている', '悪い口コミの拡散リスクが最も高い'] },
};

const SEGMENT_DETAILS_PDF = {
  1: {
    title: 'ロイヤル顧客の維持・強化戦略',
    detail: 'お店を最も高く評価し、定期的に来店しているロイヤル顧客。満足度は高いが、競合の台頭や環境変化によって離脱するリスクは常に存在する。この層の維持が売上安定の最大の鍵。',
    impact: 'ロイヤル顧客1人の離脱は新規顧客5人分の損失に相当。維持率を高めることで安定収益の確保に加え、口コミによる新規集客効果も持続する。',
    examples: ['VIP限定の先行メニュー体験や特別イベントの開催', '来店回数に応じたランクアップ制度の導入'],
    measurement: 'ロイヤル顧客の継続率（月次）、来店頻度の推移、客単価の変化をトラッキング。',
  },
  2: {
    title: '新規推奨者のリピーター転換',
    detail: '初回来店で高い満足度を示し、再来店意向もある新規顧客。ただしリピーターとして定着するかは未確定で、2回目の来店への橋渡しが成否を分ける。',
    impact: '新規→リピーター転換率の向上は、新規獲得コストの回収効率を大幅に改善する。推奨者としての口コミ拡散も期待できる。',
    examples: ['来店後24時間以内のサンキューメッセージ配信', '2回目来店時の特別クーポンの提供'],
    measurement: '2回目来店率、新規→リピーター転換率、初回来店後30日以内の再来店率。',
  },
  3: {
    title: '高評価リピーターの離脱防止',
    detail: '高い評価をしているにもかかわらず再来店意向がないリピーター。引越しや生活スタイルの変化などの外的要因、あるいは競合店への流出が考えられる。',
    impact: '離脱を防げれば、高い推奨度を活かした口コミ効果の維持と安定売上の確保が見込める。ロイヤル顧客への復帰可能性が最も高い層。',
    examples: ['離脱理由のヒアリングアンケートの実施', '復帰特典（期間限定クーポン）の提供'],
    measurement: '離脱率の推移、復帰来店率、離脱理由の傾向分析、復帰後の継続率。',
  },
  4: {
    title: '好印象新規の再来店促進',
    detail: '初回来店で高評価だったが、再来店する動機がない新規顧客。立地やアクセスの問題、またはリピートにつながる仕掛けの不足が原因と考えられる。',
    impact: '再来店のきっかけを提供するだけでリピーター化が期待でき、高い推奨度からの口コミ効果も見込める。',
    examples: ['初回来店者限定の次回割引クーポン配布', 'お気に入り登録やアプリ登録の促進'],
    measurement: '初回来店者の再来店率、クーポン利用率、アプリ登録率、紹介経由の来店数。',
  },
  5: {
    title: '中立リピーターの推奨者化',
    detail: '定期的に来店しているが、推奨するほどの満足度には達していないリピーター。サービスへの慣れや特別感の薄れが背景にある可能性がある。',
    impact: '推奨者に引き上げれば、口コミによる新規獲得と来店頻度・客単価の向上が同時に実現する。LTV向上の最大チャンス。',
    examples: ['期待を超えるサプライズ体験の提供（一品サービスなど）', '常連客向けの限定メニューや裏メニューの案内'],
    measurement: 'NPS7-8点→9-10点への転換率、来店頻度の変化、客単価の推移。',
  },
  6: {
    title: '印象の薄い新規への差別化',
    detail: '再来店意向はあるが、強い印象を残せていない新規顧客。「また行ってもいい」程度の弱い動機で、競合にスイッチされやすい状態。',
    impact: '次回来店時の体験向上で推奨者化が可能。初期段階でファンになれば、長期的な売上貢献と口コミ効果が期待できる。',
    examples: ['2回目来店時にパーソナライズされた接客', '新規客向けの体験プログラムの提案'],
    measurement: '2回目来店率、NPS中立→推奨者への転換率、リピーター定着率。',
  },
  7: {
    title: 'リピーター離脱の兆候と対策',
    detail: 'これまで来店していたリピーターが満足度低下により離脱を検討している状態。サービス品質の低下や期待とのギャップが蓄積しており、対策しなければ離脱が確定する。',
    impact: '離脱防止と推奨者への転換で、安定した売上基盤の維持とネガティブ口コミの防止につながる。既存顧客の維持は新規獲得の5倍効率的。',
    examples: ['直近の来店体験についてのフィードバック収集', '改善完了の報告と復帰インセンティブの提供'],
    measurement: '離脱予兆スコアの推移、復帰率、改善施策実施後のNPS変化。',
  },
  8: {
    title: '初回体験の印象強化',
    detail: '初回体験が印象に残らず、再来店する理由がない新規顧客。店舗の差別化ポイントが伝わっておらず、新規獲得にかけたコストが回収できていない状態。',
    impact: '初回体験の改善で再来店率を向上させれば、新規獲得コストの回収効率が大幅に改善する。中立者は改善余地が最も大きいセグメント。',
    examples: ['初回来店者向けのウェルカムプログラムの導入', '店舗の強みやこだわりを伝えるPOP・説明の充実'],
    measurement: '初回来店者の再来店率、初回体験満足度スコア、ウェルカムプログラムの利用率。',
  },
  9: {
    title: '不満蓄積リピーターの改善',
    detail: '不満を抱えながらも来店を続けているリピーター。代替店がない、立地的に便利、または習慣的に来店している状態。ネガティブ口コミを発信するリスクが高い。',
    impact: '不満の根本原因を解消すれば、中立者→推奨者への段階的な転換チャンスがある。ネガティブ口コミの抑制は見えない機会損失を防ぐ。',
    examples: ['不満ポイントの特定と優先的な改善実施', 'クレーム対応プロセスの見直しとスタッフ研修'],
    measurement: 'NPS批判者→中立者への転換率、クレーム件数の推移、ネガティブ口コミ数の変化。',
  },
  10: {
    title: '不満新規の逆転チャンス',
    detail: '初回体験に明確な不満があった新規顧客だが、再来店意向はある。具体的な改善ポイントが存在するサインであり、対応すれば満足度を大幅に向上できる可能性がある。',
    impact: 'フィードバックに基づく具体的改善で満足度を大幅向上させる余地がある。改善後のリピーター化で新規獲得コストの回収が可能。',
    examples: ['不満要因のカテゴリ別分析と優先改善', '改善完了を伝えるフォローアップ通知の配信'],
    measurement: '再来店率、再来店時のNPS改善幅、不満カテゴリ別の解消率。',
  },
  11: {
    title: 'リピーター完全離脱の危機対応',
    detail: 'リピーターの信頼を完全に失い、離脱が確定している状態。不満が蓄積し、もう来店する意思がない。ネガティブ口コミの最大リスク要因であり、最優先で対処すべきセグメント。',
    impact: '離脱防止できれば安定売上の維持に直結。1人のリピーター維持は新規顧客5人分の獲得に相当。ネガティブ口コミの拡散防止も重要な効果。',
    examples: ['店長からの直接的な謝罪と改善コミットの伝達', '離脱理由の詳細ヒアリングと即時改善の実施'],
    measurement: '離脱率の推移、復帰成功率、離脱理由の分布、ネガティブ口コミの発生件数。',
  },
  12: {
    title: '初回体験の根本的な改善',
    detail: '初回体験が非常に悪く、完全に離脱した新規顧客。新規獲得にかけたコストが完全に無駄になっており、悪い口コミの拡散リスクが最も高い状態。',
    impact: '初回体験の根本改善で新規→リピーター転換率を向上できる。口コミサイトでの評判改善は、新規集客力の底上げにつながる。',
    examples: ['初回来店体験の全プロセスの総点検', '新規顧客に特に多い不満要因の特定と重点改善'],
    measurement: '新規顧客のNPS分布の変化、初回離脱率、口コミサイトの評価推移。',
  },
};

const SEGMENT_PRIORITY_PDF = {
  11: 6, 12: 5, 7: 5, 9: 4, 10: 4,
  3: 3, 8: 3, 4: 2, 5: 1, 6: 1,
};

const getCategoryTagPdf = (seg) => {
  const isRepeater = seg.customerLabel === 'リピーター';
  const hasRevisit = seg.revisitLabel === '再来店あり';
  if (isRepeater && hasRevisit) return { label: '安定リピーター', color: '#22c55e' };
  if (isRepeater && !hasRevisit) return { label: 'リピーター離脱', color: '#f97316' };
  if (!isRepeater && hasRevisit) return { label: '新規リピーター', color: '#3b82f6' };
  return { label: '新規離脱', color: '#6b7280' };
};

const getNpsTagPdf = (seg) => {
  if (seg.npsLabel === '推奨者') return { label: '推奨者', color: '#16a34a' };
  if (seg.npsLabel === '中立者') return { label: '中立者', color: '#f59e0b' };
  return { label: '批判者', color: '#dc2626' };
};

// result_type(1-12)からタグ情報を導出するヘルパー
const getTagsFromResultType = (resultType) => {
  if (!resultType) return { categoryTag: null, npsTag: null };
  const t = Number(resultType);
  // NPS: 1-4=推奨者, 5-8=中立者, 9-12=批判者
  const npsTag = t <= 4
    ? { label: '推奨者', color: '#16a34a' }
    : t <= 8
      ? { label: '中立者', color: '#f59e0b' }
      : { label: '批判者', color: '#dc2626' };
  // リピーター/新規: 奇数=リピーター, 偶数=新規
  const isRepeater = t % 2 === 1;
  // 再来店: 1,2,5,6,9,10=あり, 3,4,7,8,11,12=なし
  const hasRevisit = [1, 2, 5, 6, 9, 10].includes(t);
  let categoryTag;
  if (isRepeater && hasRevisit) categoryTag = { label: '安定リピーター', color: '#22c55e' };
  else if (isRepeater && !hasRevisit) categoryTag = { label: 'リピーター離脱', color: '#f97316' };
  else if (!isRepeater && hasRevisit) categoryTag = { label: '新規リピーター', color: '#3b82f6' };
  else categoryTag = { label: '新規離脱', color: '#6b7280' };
  return { categoryTag, npsTag };
};

/**
 * 表紙ページコンポーネント
 */
const CoverPage = ({ report, storeName, companyName }) => {
  const formatYearMonth = (yearMonth) => {
    if (!yearMonth) return '';
    return yearMonth.replace('-', '/');
  };

  return (
    <Page size="A4" orientation="landscape" style={styles.coverPage}>
      <View style={styles.coverLogoContainer}>
        <Image src={LOGO_WITH_TEXT_URL} style={styles.coverLogoWithText} />
      </View>

      <Text style={{ fontSize: 32, color: colors.white, fontWeight: 'bold', lineHeight: 1.3, letterSpacing: -0.5, marginBottom: 16 }}>
        お客様の声で、{'\n'}また来たくなるお店へ。
      </Text>
      <Text style={{ fontSize: 14, color: colors.white, opacity: 0.7, marginBottom: 16 }}>
        飲食店に特化したアンケートツール
      </Text>

      <View style={styles.coverInfoContainer}>
        <Text style={styles.coverCompanyStore}>
          {companyName ? `${companyName} ${storeName}` : storeName}
        </Text>
        <Text style={styles.coverDate}>{formatYearMonth(report.yearMonth)}</Text>
      </View>
    </Page>
  );
};

/**
 * 矢印アイコン（上向き）
 */
const ArrowUpIcon = ({ color = colors.white }) => (
  <Svg width={10} height={10} viewBox="0 0 24 24">
    <Path
      d="M7 17L17 7M17 7H7M17 7V17"
      stroke={color}
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </Svg>
);

/**
 * 矢印アイコン（下向き）
 */
const ArrowDownIcon = ({ color = colors.white }) => (
  <Svg width={10} height={10} viewBox="0 0 24 24">
    <Path
      d="M7 7L17 17M17 17H7M17 17V7"
      stroke={color}
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </Svg>
);

/**
 * 課題アイコン（ボックス/キューブ）
 */
const TaskIcon = () => (
  <Svg width={22} height={22} viewBox="0 0 24 24">
    {/* ボックスの上面（黄色） */}
    <Polygon
      points="12,2 3,7 12,12 21,7"
      fill="#fbbf24"
    />
    {/* ボックスの左面（青紫） */}
    <Polygon
      points="3,7 3,17 12,22 12,12"
      fill="#4f46e5"
    />
    {/* ボックスの右面（紫） */}
    <Polygon
      points="21,7 21,17 12,22 12,12"
      fill="#7c3aed"
    />
  </Svg>
);

/**
 * セクションヘッダーコンポーネント
 */
const SectionHeader = ({ title, pageNumber }) => (
  <View style={styles.sectionHeader}>
    <View style={styles.sectionHeaderTop}>
      <View style={styles.sectionHeaderLeft}>
        <Image src={LOGO_ICON_URL} style={styles.sectionHeaderIcon} />
        <Text style={styles.sectionHeaderTitle}>{title}</Text>
      </View>
      {pageNumber && <Text style={styles.sectionHeaderPageNumber}>{pageNumber}</Text>}
    </View>
    <View style={styles.sectionHeaderLine} />
  </View>
);

/**
 * ページコメントバーコンポーネント
 */
const PageComment = ({ comment }) => {
  if (!comment) return null;
  return (
    <View style={styles.pageCommentBarWrapper}>
      <View style={styles.pageCommentBar}>
        <Text style={styles.pageCommentText}>{softBreakText(comment)}</Text>
      </View>
    </View>
  );
};

/**
 * KPIカードコンポーネント
 */
const KPICard = ({ title, metric, delta, deltaType, color }) => {
  const isIncrease = deltaType === 'increase';

  return (
    <View style={styles.kpiCard}>
      <Text style={styles.kpiCardTitle}>{title}</Text>
      <Text style={styles.kpiCardMetric}>{metric}</Text>
      <View style={styles.kpiCardDeltaRow}>
        <View style={[styles.kpiCardBadge, { backgroundColor: color }]}>
          {isIncrease ? <ArrowUpIcon /> : <ArrowDownIcon />}
          <Text style={styles.kpiCardBadgeText}>{delta}</Text>
        </View>
        <Text style={styles.kpiCardVsText}>vs 先月</Text>
      </View>
    </View>
  );
};

/**
 * コンテンツページコンポーネント（ボーダー枠デザイン）
 */
const ContentPage = ({ title, children }) => (
  <Page size="A4" orientation="landscape" style={styles.contentPageOuter}>
    <View style={styles.contentPageInner}>
      {/* ページタイトル（中央配置） */}
      {title && <Text style={styles.pageTitle}>{title}</Text>}

      {/* コンテンツ */}
      <View style={styles.content}>
        {children}
      </View>
    </View>
  </Page>
);

/**
 * NPS分布カードコンポーネント
 */
const NPSDistributionCard = ({ npsDistribution }) => {
  const promoters = npsDistribution?.promoters || 0;
  const passives = npsDistribution?.passives || 0;
  const detractors = npsDistribution?.detractors || 0;

  return (
    <View style={styles.chartCard}>
      <Text style={styles.chartTitle}>推奨スコア詳細分析</Text>
      <Text style={styles.chartSubtitle}>推奨者・中立者・批判者の内訳</Text>

      {/* 凡例 */}
      <View style={styles.npsDistributionLegend}>
        <View style={[styles.npsLegendItem, { backgroundColor: colors.green100, borderWidth: 1, borderColor: colors.green200, borderStyle: 'solid' }]}>
          <View style={styles.npsLegendLeft}>
            <View style={[styles.npsLegendDot, { backgroundColor: colors.emerald500 }]} />
            <Text style={styles.npsLegendLabel}>推奨者（9-10点）</Text>
          </View>
          <Text style={[styles.npsLegendValue, { color: colors.green700 }]}>{promoters}%</Text>
        </View>
        <View style={[styles.npsLegendItem, { backgroundColor: colors.amber100, borderWidth: 1, borderColor: colors.amber200, borderStyle: 'solid' }]}>
          <View style={styles.npsLegendLeft}>
            <View style={[styles.npsLegendDot, { backgroundColor: colors.amber500 }]} />
            <Text style={styles.npsLegendLabel}>中立者（7-8点）</Text>
          </View>
          <Text style={[styles.npsLegendValue, { color: colors.amber700 }]}>{passives}%</Text>
        </View>
        <View style={[styles.npsLegendItem, { backgroundColor: colors.red100, borderWidth: 1, borderColor: colors.red200, borderStyle: 'solid' }]}>
          <View style={styles.npsLegendLeft}>
            <View style={[styles.npsLegendDot, { backgroundColor: colors.red500 }]} />
            <Text style={styles.npsLegendLabel}>批判者（0-6点）</Text>
          </View>
          <Text style={[styles.npsLegendValue, { color: colors.red700 }]}>{detractors}%</Text>
        </View>
      </View>
    </View>
  );
};

/**
 * NPSトレンドチャートコンポーネント
 */
const NPSTrendChart = ({ monthlyPerformance }) => {
  const data = monthlyPerformance || [];

  if (data.length === 0) {
    return (
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>推奨スコア推移</Text>
        <Text style={styles.chartSubtitle}>月別の推奨スコアトレンド</Text>
        <View style={{ height: 140, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 11, color: colors.gray400 }}>データがありません</Text>
        </View>
      </View>
    );
  }

  if (data.length === 1) {
    return (
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>推奨スコア推移</Text>
        <Text style={styles.chartSubtitle}>月別の推奨スコアトレンド</Text>
        <View style={{ height: 140, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 11, color: colors.gray400 }}>推移グラフの表示には2ヶ月以上のデータが必要です</Text>
        </View>
      </View>
    );
  }

  // データからminとmaxを計算
  const values = data.map(d => d.nps || 0);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue || 1;
  const padding = range * 0.1;
  const chartMin = minValue - padding;
  const chartMax = maxValue + padding;
  const chartRange = chartMax - chartMin;

  // SVGのサイズ
  const chartWidth = 320;
  const chartHeight = 120;

  // ポイントを計算
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1 || 1)) * chartWidth;
    const y = chartHeight - ((d.nps - chartMin) / chartRange) * chartHeight;
    return { x, y, value: d.nps, month: d.month };
  });

  // 折れ線のパス
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  // エリアのパス（グラデーション用）
  const areaPath = `${linePath} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z`;

  return (
    <View style={styles.chartCard}>
      <Text style={styles.chartTitle}>推奨スコア推移</Text>
      <Text style={styles.chartSubtitle}>月別の推奨スコアトレンド</Text>

      <View style={styles.trendChartContainer}>
        <Svg width={chartWidth} height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
          {/* エリア塗りつぶし */}
          <Path d={areaPath} fill={colors.primary} fillOpacity={0.15} />
          {/* 折れ線 */}
          <Path d={linePath} stroke={colors.primary} strokeWidth={2.5} fill="none" />
          {/* ポイント */}
          {points.map((p, i) => (
            <React.Fragment key={i}>
              <Path
                d={`M ${p.x - 4} ${p.y} a 4 4 0 1 0 8 0 a 4 4 0 1 0 -8 0`}
                fill={colors.white}
                stroke={colors.primary}
                strokeWidth={2}
              />
            </React.Fragment>
          ))}
        </Svg>
      </View>

      {/* X軸ラベル */}
      <View style={styles.trendXAxis}>
        {data.slice(0, 6).map((d, i) => (
          <Text key={i} style={styles.trendXLabel}>{d.month}</Text>
        ))}
      </View>
    </View>
  );
};

/**
 * 概要ページコンポーネント（KPIカード3枚 + チャート2枚）
 */
const OverviewPage = ({ reportData, pageNumber, comment }) => {
  // KPIデータを取得（reportData.overviewから）
  const overview = reportData?.overview || {};
  const kpi = overview.kpi || {
    nps: { current: 0, delta: 0 },
    repeatRate: { current: 0, delta: 0 },
    repeaterRevisit: { current: 0, delta: 0 },
    newRevisit: { current: 0, delta: 0 }
  };

  // NPS分布データ
  const npsDistribution = overview.npsDistribution || {
    promoters: 0,
    passives: 0,
    detractors: 0
  };

  // 月別パフォーマンスデータ
  const monthlyPerformance = overview.monthlyPerformance || [];

  const kpiCards = [
    {
      title: "推奨スコア",
      metric: `${kpi.nps.current >= 0 ? '+' : ''}${kpi.nps.current}pt`,
      delta: `${kpi.nps.delta >= 0 ? '+' : ''}${Number(kpi.nps.delta).toFixed(1)}pt`,
      deltaType: kpi.nps.delta >= 0 ? "increase" : "decrease",
      color: KPI_COLORS[0]
    },
    {
      title: "リピート率",
      metric: `${Number(kpi.repeatRate.current).toFixed(1)}%`,
      delta: `${kpi.repeatRate.delta >= 0 ? '+' : ''}${Number(kpi.repeatRate.delta).toFixed(1)}%`,
      deltaType: kpi.repeatRate.delta >= 0 ? "increase" : "decrease",
      color: KPI_COLORS[1]
    },
    {
      title: "3ヶ月以内再来店意向",
      metric: `${Number(kpi.repeaterRevisit.current).toFixed(1)}%`,
      delta: `${kpi.repeaterRevisit.delta >= 0 ? '+' : ''}${Number(kpi.repeaterRevisit.delta).toFixed(1)}%`,
      deltaType: kpi.repeaterRevisit.delta >= 0 ? "increase" : "decrease",
      color: KPI_COLORS[2]
    }
  ];

  return (
    <ContentPage>
      {/* セクションヘッダー */}
      <SectionHeader title="概要" pageNumber={pageNumber} />

      {/* KPIカード（3枚） */}
      <View style={styles.kpiGrid}>
        {kpiCards.map((kpi, index) => (
          <KPICard
            key={index}
            title={kpi.title}
            metric={kpi.metric}
            delta={kpi.delta}
            deltaType={kpi.deltaType}
            color={kpi.color}
          />
        ))}
      </View>

      {/* チャートセクション（2枚） */}
      <View style={styles.chartSection}>
        <NPSDistributionCard npsDistribution={npsDistribution} />
        <NPSTrendChart monthlyPerformance={monthlyPerformance} />
      </View>

      {/* コメント */}
      <PageComment comment={comment} />
    </ContentPage>
  );
};

/**
 * 顧客カテゴリーカードコンポーネント
 */
const CustomerCategoryCard = ({ title, subtitle, count, percentage, color }) => (
  <View style={styles.categoryCard}>
    <View style={styles.categoryCardHeader}>
      <Text style={styles.categoryCardTitle}>{title}</Text>
      <Text style={styles.categoryCardSubtitle}>{subtitle}</Text>
    </View>
    <View style={styles.categoryCardMetric}>
      <Text style={styles.categoryCardValue}>{count}</Text>
      <Text style={styles.categoryCardUnit}>人</Text>
    </View>
    <View style={styles.categoryCardProgress}>
      <View style={[styles.categoryCardProgressBar, { width: `${percentage}%`, backgroundColor: color }]} />
    </View>
    <View style={styles.categoryCardFooter}>
      <Text style={styles.categoryCardLabel}>構成比</Text>
      <Text style={[styles.categoryCardPercent, { color }]}>{percentage}%</Text>
    </View>
  </View>
);

/**
 * 顧客構成比較コンポーネント
 */
const CustomerCompositionChart = ({ thisMonth, sixMonthAvg }) => {
  const segments = [
    { key: 'newChurn', label: '新規離脱', color: '#6b7280' },
    { key: 'newRepeaters', label: '新規リピーター', color: '#3b82f6' },
    { key: 'stableRepeaters', label: '安定リピーター', color: '#22c55e' },
    { key: 'churnRisk', label: 'リピーター離脱', color: '#f97316' },
  ];

  const renderBar = (data, label, count) => (
    <View style={styles.compositionRow}>
      <View style={styles.compositionRowLabel}>
        <Text style={styles.compositionRowTitle}>{label}</Text>
        <Text style={styles.compositionRowCount}>{count}件</Text>
      </View>
      <View style={styles.compositionBar}>
        {segments.map((seg) => {
          const value = data?.[seg.key] || 0;
          if (value === 0) return null;
          return (
            <View
              key={seg.key}
              style={[styles.compositionBarSegment, { width: `${value}%`, backgroundColor: seg.color }]}
            >
              {value > 8 && <Text style={styles.compositionBarText}>{value}%</Text>}
            </View>
          );
        })}
      </View>
    </View>
  );

  return (
    <View style={styles.compositionCard}>
      <View style={styles.compositionHeader}>
        <Text style={styles.compositionTitle}>顧客構成比較</Text>
        <View style={styles.compositionLegend}>
          {segments.map((seg) => (
            <View key={seg.key} style={styles.compositionLegendItem}>
              <View style={[styles.compositionLegendDot, { backgroundColor: seg.color }]} />
              <Text style={styles.compositionLegendText}>{seg.label}</Text>
            </View>
          ))}
        </View>
      </View>
      {renderBar(thisMonth, '今月', thisMonth?.total || 0)}
      {renderBar(sixMonthAvg, '6ヶ月平均', '100%')}
    </View>
  );
};

/**
 * セグメント詳細テーブルコンポーネント（上位3件）
 */
const SegmentTable = ({ segments }) => {
  const top3 = (segments || []).slice(0, 3);

  const getNpsBadgeColor = (npsLabel) => {
    if (npsLabel === '推奨者') return colors.emerald500;
    if (npsLabel === '批判者') return colors.red500;
    return colors.amber500;
  };

  return (
    <View>
      <Text style={styles.segmentTableTitle}>セグメント別詳細分析（上位3）</Text>

      {/* ヘッダー */}
      <View style={styles.segmentTableHeader}>
        <Text style={[styles.segmentTableHeaderCell, { width: '15%' }]}>推奨度</Text>
        <Text style={[styles.segmentTableHeaderCell, { width: '18%' }]}>再来店意向</Text>
        <Text style={[styles.segmentTableHeaderCell, { width: '17%' }]}>顧客タイプ</Text>
        <Text style={[styles.segmentTableHeaderCell, { width: '15%' }]}>影響度</Text>
        <Text style={[styles.segmentTableHeaderCell, { width: '15%', textAlign: 'right' }]}>先月比</Text>
        <Text style={[styles.segmentTableHeaderCell, { width: '20%', textAlign: 'center' }]}>構成比</Text>
      </View>

      {/* データ行 */}
      {top3.map((segment, index) => (
        <View key={index} style={styles.segmentTableRow}>
          {/* 推奨度バッジ */}
          <View style={{ width: '15%', flexDirection: 'row' }}>
            <View style={[styles.segmentBadge, { backgroundColor: getNpsBadgeColor(segment.npsLabel || '中立者') }]}>
              <Text style={styles.segmentBadgeText}>{segment.npsLabel || '中立者'}</Text>
            </View>
          </View>

          {/* 再来店意向 */}
          <Text style={[styles.segmentTableCell, { width: '18%', color: segment.revisitLabel === '再来店あり' ? colors.emerald500 : colors.gray500 }]}>
            {segment.revisitLabel}
          </Text>

          {/* 顧客タイプ */}
          <Text style={[styles.segmentTableCell, { width: '17%', color: segment.customerLabel === 'リピーター' ? colors.emerald500 : colors.gray500 }]}>
            {segment.customerLabel}
          </Text>

          {/* 影響度 */}
          <Text style={[styles.segmentTableCell, { width: '15%' }]}>
            {segment.impactLabel || '中立'}
          </Text>

          {/* 先月比 */}
          <Text style={[styles.segmentTableCell, {
            width: '15%',
            textAlign: 'right',
            color: segment.monthOverMonth > 0 ? colors.emerald500 : segment.monthOverMonth < 0 ? colors.red500 : colors.gray600
          }]}>
            {segment.monthOverMonth > 0 ? '+' : ''}{segment.monthOverMonth || 0}pt
          </Text>

          {/* 構成比 */}
          <View style={[styles.segmentProgressContainer, { width: '20%', justifyContent: 'flex-end' }]}>
            <View style={styles.segmentProgressBar}>
              <View style={[styles.segmentProgressFill, { width: `${segment.percentage || 0}%` }]} />
            </View>
            <Text style={[styles.segmentTableCell, { width: 30, textAlign: 'right' }]}>{segment.percentage || 0}%</Text>
          </View>
        </View>
      ))}
    </View>
  );
};

/**
 * 売上影響ページコンポーネント（3ページ目）
 */
const SalesImpactPage = ({ reportData, pageNumber, comment }) => {
  // カテゴリーデータ
  const categoryData = reportData?.salesImpact?.categoryData || {
    newChurn: { count: 0 },
    newRepeaters: { count: 0 },
    stableRepeaters: { count: 0 },
    churnRisk: { count: 0 }
  };

  // 合計人数
  const totalCustomers =
    (categoryData.newChurn?.count || 0) +
    (categoryData.newRepeaters?.count || 0) +
    (categoryData.stableRepeaters?.count || 0) +
    (categoryData.churnRisk?.count || 0);

  // 構成比を計算
  const getPercentage = (count) =>
    totalCustomers > 0 ? ((count / totalCustomers) * 100).toFixed(1) : '0.0';

  // セグメントデータ
  const segments = reportData?.salesImpact?.segments || [];

  const categories = [
    { title: '新規離脱', subtitle: '再来店意向なし', count: categoryData.newChurn?.count || 0, color: '#6b7280' },
    { title: '新規リピーター', subtitle: '再来店意向あり', count: categoryData.newRepeaters?.count || 0, color: '#3b82f6' },
    { title: '安定リピーター', subtitle: '継続的な来店', count: categoryData.stableRepeaters?.count || 0, color: '#22c55e' },
    { title: 'リピーター離脱', subtitle: '再来店意向なし', count: categoryData.churnRisk?.count || 0, color: '#f97316' },
  ];

  return (
    <ContentPage>
      {/* セクションヘッダー */}
      <SectionHeader title="売上影響" pageNumber={pageNumber} />

      {/* 顧客カテゴリーカード（4枚） */}
      <View style={styles.categoryCardGrid}>
        {categories.map((cat, index) => (
          <CustomerCategoryCard
            key={index}
            title={cat.title}
            subtitle={cat.subtitle}
            count={cat.count}
            percentage={getPercentage(cat.count)}
            color={cat.color}
          />
        ))}
      </View>

      {/* セグメント詳細テーブル（上位3件） */}
      <SegmentTable segments={segments} />

      {/* コメント */}
      <PageComment comment={comment} />
    </ContentPage>
  );
};

/**
 * QSCアイコン - Quality (UtensilsCrossed)
 */
const QualityIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24">
    <Path
      d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"
      stroke={colors.white}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <Path
      d="M7 2v20"
      stroke={colors.white}
      strokeWidth={2}
      strokeLinecap="round"
      fill="none"
    />
    <Path
      d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3"
      stroke={colors.white}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <Path
      d="M21 15v7"
      stroke={colors.white}
      strokeWidth={2}
      strokeLinecap="round"
      fill="none"
    />
  </Svg>
);

/**
 * QSCアイコン - Service
 */
const ServiceIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24">
    <Path
      d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21"
      stroke={colors.white}
      strokeWidth={2}
      strokeLinecap="round"
      fill="none"
    />
    <Path
      d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z"
      stroke={colors.white}
      strokeWidth={2}
      fill="none"
    />
    <Path
      d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13"
      stroke={colors.white}
      strokeWidth={2}
      strokeLinecap="round"
      fill="none"
    />
    <Path
      d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88"
      stroke={colors.white}
      strokeWidth={2}
      strokeLinecap="round"
      fill="none"
    />
  </Svg>
);

/**
 * QSCアイコン - Cleanliness (Sparkles)
 */
const CleanlinessIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24">
    <Path
      d="M12 3l-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3Z"
      stroke={colors.white}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <Path
      d="M5 3v4M19 17v4M3 5h4M17 19h4"
      stroke={colors.white}
      strokeWidth={2}
      strokeLinecap="round"
      fill="none"
    />
  </Svg>
);

/**
 * QSCカードコンポーネント
 */
const QSCCard = ({ category, label, score, trend, colorTheme }) => {
  const getColors = () => {
    switch (colorTheme) {
      case 'violet':
        return { bg: '#8b5cf6', light: '#ede9fe', text: '#6d28d9' };
      case 'blue':
        return { bg: '#3b82f6', light: '#dbeafe', text: '#1d4ed8' };
      case 'emerald':
        return { bg: '#10b981', light: '#d1fae5', text: '#047857' };
      default:
        return { bg: '#6b7280', light: '#f3f4f6', text: '#374151' };
    }
  };

  const themeColors = getColors();
  const isPositive = trend >= 0;
  const achievementRate = ((score / 5) * 100).toFixed(0);

  const renderIcon = () => {
    switch (category) {
      case 'Q':
        return <QualityIcon />;
      case 'S':
        return <ServiceIcon />;
      case 'C':
        return <CleanlinessIcon />;
      default:
        return <QualityIcon />;
    }
  };

  const getCategoryTitle = () => {
    switch (category) {
      case 'Q':
        return 'Quality';
      case 'S':
        return 'Service';
      case 'C':
        return 'Cleanliness';
      default:
        return category;
    }
  };

  return (
    <View style={styles.qscCard}>
      {/* ヘッダー */}
      <View style={styles.qscCardHeader}>
        <View style={styles.qscCardTitleArea}>
          <View style={[styles.qscCardIcon, { backgroundColor: themeColors.bg }]}>
            {renderIcon()}
          </View>
          <View>
            <Text style={styles.qscCardTitleText}>{getCategoryTitle()}</Text>
            <Text style={styles.qscCardSubtitle}>{label}</Text>
          </View>
        </View>
        <View style={[styles.qscCardTrendBadge, { backgroundColor: isPositive ? '#dcfce7' : '#fee2e2' }]}>
          <Text style={[styles.qscCardTrendText, { color: isPositive ? '#15803d' : '#b91c1c' }]}>
            {isPositive ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}
          </Text>
        </View>
      </View>

      {/* スコアエリア */}
      <View style={styles.qscCardScoreArea}>
        <View style={styles.qscCardScoreRow}>
          <Text style={[styles.qscCardScore, { color: themeColors.bg }]}>{score.toFixed(2)}</Text>
          <Text style={styles.qscCardScoreMax}>/ 5.00</Text>
        </View>
        <View style={styles.qscCardAchievementArea}>
          <Text style={styles.qscCardAchievementLabel}>達成率</Text>
          <Text style={styles.qscCardAchievementValue}>{achievementRate}%</Text>
        </View>
      </View>

      {/* プログレスバー */}
      <View style={styles.qscCardProgressBar}>
        <View style={[styles.qscCardProgressFill, { width: `${achievementRate}%`, backgroundColor: themeColors.bg }]} />
      </View>
    </View>
  );
};

/**
 * QSCミニスコアカード（詳細ページ用）
 */
const QSCMiniScoreCard = ({ category, label, score, trend, colorTheme }) => {
  const getColors = () => {
    switch (colorTheme) {
      case 'violet':
        return { bg: '#8b5cf6', light: '#ede9fe', text: '#6d28d9' };
      case 'blue':
        return { bg: '#3b82f6', light: '#dbeafe', text: '#1d4ed8' };
      case 'emerald':
        return { bg: '#10b981', light: '#d1fae5', text: '#047857' };
      default:
        return { bg: '#6b7280', light: '#f3f4f6', text: '#374151' };
    }
  };

  const themeColors = getColors();
  const isPositive = trend >= 0;
  const achievementRate = ((score / 5) * 100).toFixed(0);

  const renderIcon = () => {
    switch (category) {
      case 'Q':
        return <QualityIcon />;
      case 'S':
        return <ServiceIcon />;
      case 'C':
        return <CleanlinessIcon />;
      default:
        return <QualityIcon />;
    }
  };

  const getCategoryTitle = () => {
    switch (category) {
      case 'Q':
        return 'Quality';
      case 'S':
        return 'Service';
      case 'C':
        return 'Cleanliness';
      default:
        return category;
    }
  };

  return (
    <View style={styles.qscMiniCard}>
      {/* ヘッダー */}
      <View style={styles.qscMiniCardHeader}>
        <View style={styles.qscMiniCardTitleRow}>
          <View style={[styles.qscMiniCardIconBox, { backgroundColor: themeColors.bg }]}>
            {renderIcon()}
          </View>
          <View>
            <Text style={styles.qscMiniCardTitle}>{getCategoryTitle()}</Text>
            <Text style={styles.qscMiniCardSubtitle}>{label}</Text>
          </View>
        </View>
        <View style={[styles.qscMiniCardTrendBadge, { backgroundColor: isPositive ? '#dcfce7' : '#fee2e2' }]}>
          <Text style={[styles.qscMiniCardTrendText, { color: isPositive ? '#15803d' : '#b91c1c' }]}>
            {isPositive ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}
          </Text>
        </View>
      </View>

      {/* スコア */}
      <View style={styles.qscMiniCardScoreRow}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 2 }}>
          <Text style={[styles.qscMiniCardScore, { color: themeColors.bg }]}>{score.toFixed(2)}</Text>
          <Text style={styles.qscMiniCardScoreMax}>/ 5.00</Text>
        </View>
        <View style={styles.qscMiniCardAchievement}>
          <Text style={styles.qscMiniCardAchievementLabel}>達成率</Text>
          <Text style={styles.qscMiniCardAchievementValue}>{achievementRate}%</Text>
        </View>
      </View>

      {/* プログレスバー */}
      <View style={styles.qscMiniCardProgress}>
        <View style={[styles.qscMiniCardProgressFill, { width: `${achievementRate}%`, backgroundColor: themeColors.bg }]} />
      </View>
    </View>
  );
};

/**
 * 評価項目バーチャート
 */
const QSCDetailItem = ({ label, positive, neutral, negative }) => (
  <View style={styles.qscDetailItem}>
    <Text style={styles.qscDetailItemLabel}>{label}</Text>
    <View style={styles.qscDetailItemBar}>
      {/* ポジティブ（緑） */}
      <View style={[styles.qscDetailItemBarSegment, { width: `${positive}%`, backgroundColor: '#22c55e' }]} />
      {/* ニュートラル（グレー） */}
      <View style={[styles.qscDetailItemBarSegment, { width: `${neutral}%`, backgroundColor: '#d1d5db' }]} />
      {/* ネガティブ（赤） */}
      <View style={[styles.qscDetailItemBarSegment, { width: `${negative}%`, backgroundColor: '#ef4444' }]} />
    </View>
    <View style={styles.qscDetailItemValues}>
      <Text style={[styles.qscDetailItemValue, { color: '#22c55e' }]}>{Math.round(positive)}%</Text>
      <Text style={[styles.qscDetailItemValue, { color: '#9ca3af' }]}>{Math.round(neutral)}%</Text>
      <Text style={[styles.qscDetailItemValue, { color: '#ef4444' }]}>{Math.round(negative)}%</Text>
    </View>
  </View>
);

/**
 * QSC詳細ページコンポーネント（5ページ目：Quality）
 */
const QSCDetailPage = ({ reportData, category, pageNumber }) => {
  // QSCスコアデータ
  const qscScores = reportData?.storeEvaluation?.qscScores || {
    Q: { label: 'クオリティ', score: 0, trend: 0, color: 'violet' },
    S: { label: 'サービス', score: 0, trend: 0, color: 'blue' },
    C: { label: 'クレンリネス', score: 0, trend: 0, color: 'emerald' }
  };

  // QSC詳細データ
  const qscDetailedData = reportData?.storeEvaluation?.qscDetailedData || {
    Q: { items: [], totalResponses: 0 },
    S: { items: [], totalResponses: 0 },
    C: { items: [], totalResponses: 0 }
  };

  // AIサマリーデータ（monthly_analytics_ai_textから取得）
  const aiTextMap = {
    Q: reportData?.aiText?.quality || '',
    S: reportData?.aiText?.service || '',
    C: reportData?.aiText?.cleanliness || ''
  };

  // サンプルテキスト（フォールバック用）
  const sampleSummary = {
    Q: '料理の味付けや盛り付けに対する評価が高く、特にメイン料理の満足度が前月比で向上しています。食材の鮮度についても好意的な意見が多く見られます。',
    S: '接客対応のスピードと丁寧さに関して高評価が多い一方、ピーク時の待ち時間に対する改善要望が一部見受けられます。',
    C: '店内の清潔感について全体的に良好な評価を維持しています。特にトイレや客席周りの清掃が行き届いているとの声が目立ちます。'
  };

  const scoreData = qscScores[category] || { label: '', score: 0, trend: 0, color: 'violet' };
  const detailData = qscDetailedData[category] || { items: [], totalResponses: 0 };
  const summary = aiTextMap[category] || sampleSummary[category] || 'データが不足しています。';

  // カテゴリー名を取得
  const getCategoryTitle = () => {
    switch (category) {
      case 'Q':
        return 'Quality';
      case 'S':
        return 'Service';
      case 'C':
        return 'Cleanliness';
      default:
        return category;
    }
  };

  // アイコンを描画
  const renderCategoryIcon = () => {
    const iconColor = scoreData.color === 'violet' ? '#8b5cf6' : scoreData.color === 'blue' ? '#3b82f6' : '#10b981';
    return (
      <Svg width={24} height={24} viewBox="0 0 24 24">
        {category === 'Q' && (
          <>
            <Path
              d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"
              stroke={iconColor}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <Path
              d="M7 2v20"
              stroke={iconColor}
              strokeWidth={2}
              strokeLinecap="round"
              fill="none"
            />
            <Path
              d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3"
              stroke={iconColor}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <Path
              d="M21 15v7"
              stroke={iconColor}
              strokeWidth={2}
              strokeLinecap="round"
              fill="none"
            />
          </>
        )}
        {category === 'S' && (
          <>
            <Path
              d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21"
              stroke={iconColor}
              strokeWidth={2}
              strokeLinecap="round"
              fill="none"
            />
            <Path
              d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z"
              stroke={iconColor}
              strokeWidth={2}
              fill="none"
            />
          </>
        )}
        {category === 'C' && (
          <>
            <Path
              d="M12 3l-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3Z"
              stroke={iconColor}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <Path
              d="M5 3v4M19 17v4M3 5h4M17 19h4"
              stroke={iconColor}
              strokeWidth={2}
              strokeLinecap="round"
              fill="none"
            />
          </>
        )}
      </Svg>
    );
  };

  // 評価項目を左右に分割（各5項目）
  const items = detailData.items || [];
  const leftItems = items.slice(0, 5);
  const rightItems = items.slice(5, 10);

  return (
    <ContentPage>
      {/* セクションヘッダー */}
      <SectionHeader title="店舗評価" pageNumber={pageNumber} />

      {/* 上部セクション：左（タイトル＋説明）、右（ミニスコアカード） */}
      <View style={styles.qscDetailPageHeader}>
        {/* 左セクション */}
        <View style={styles.qscDetailLeftSection}>
          <View style={styles.qscDetailTitleRow}>
            {renderCategoryIcon()}
            <Text style={styles.qscDetailTitle}>{getCategoryTitle()}</Text>
            <Text style={styles.qscDetailTitleCount}>n={detailData.totalResponses || 0}</Text>
          </View>
          <View style={styles.qscDetailTitleLine} />
          <Text style={styles.qscDetailDescription}>{softBreakText(summary)}</Text>
        </View>

        {/* 右セクション：ミニスコアカード */}
        <View style={styles.qscDetailRightSection}>
          <QSCMiniScoreCard
            category={category}
            label={scoreData.label}
            score={scoreData.score}
            trend={scoreData.trend}
            colorTheme={scoreData.color}
          />
        </View>
      </View>

      {/* 評価項目バーチャート（2列） */}
      <View style={styles.qscDetailItemsContainer}>
        {/* 左列 */}
        <View style={styles.qscDetailItemsColumn}>
          {leftItems.map((item, index) => (
            <QSCDetailItem
              key={index}
              label={item.label}
              positive={item.positive || 0}
              neutral={item.neutral || 0}
              negative={item.negative || 0}
            />
          ))}
        </View>

        {/* 右列 */}
        <View style={styles.qscDetailItemsColumn}>
          {rightItems.map((item, index) => (
            <QSCDetailItem
              key={index}
              label={item.label}
              positive={item.positive || 0}
              neutral={item.neutral || 0}
              negative={item.negative || 0}
            />
          ))}
        </View>
      </View>
    </ContentPage>
  );
};

/**
 * 顧客傾向ページコンポーネント
 */
const CustomerTrendsPage = ({ reportData, pageNumber }) => {
  // 顧客傾向データ
  const customerTrends = reportData?.customerTrends || {};
  const genderDistribution = customerTrends.genderDistribution || [];
  const customerTypeDistribution = customerTrends.customerTypeDistribution || [];
  const ageDistribution = customerTrends.ageDistribution || [];
  const companionDistribution = customerTrends.companionDistribution || [];

  // 色定義
  const genderColors = { '男性': '#3b82f6', '女性': '#ec4899', 'その他': '#9ca3af' };
  const customerTypeColors = { 'リピーター': '#10b981', '新規': '#f59e0b' };
  const ageColors = ['#8b5cf6', '#6366f1', '#3b82f6', '#0ea5e9', '#06b6d4'];
  const companionColors = ['#f97316', '#fb923c', '#fdba74', '#fed7aa'];

  // 半円ゲージのSVGアークパスを生成するヘルパー
  const createSemiDonutArc = (cx, cy, r, startAngle, endAngle) => {
    const rad1 = (Math.PI * startAngle) / 180;
    const rad2 = (Math.PI * endAngle) / 180;
    const x1 = cx + r * Math.cos(rad1);
    const y1 = cy + r * Math.sin(rad1);
    const x2 = cx + r * Math.cos(rad2);
    const y2 = cy + r * Math.sin(rad2);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
  };

  // 半円ゲージのセグメントを生成
  const renderSemiDonut = (data, colorMap) => {
    const cx = 70;
    const cy = 65;
    const outerR = 50;
    const innerR = 30;
    let currentAngle = 180;

    return (
      <Svg width={140} height={75} viewBox="0 0 140 75">
        {data.map((item, index) => {
          const sweep = (item.value / 100) * 180;
          const endAngle = currentAngle + sweep;
          const outerPath = createSemiDonutArc(cx, cy, outerR, currentAngle, endAngle);
          const iRad1 = (Math.PI * endAngle) / 180;
          const iRad2 = (Math.PI * currentAngle) / 180;
          const ix1 = cx + innerR * Math.cos(iRad1);
          const iy1 = cy + innerR * Math.sin(iRad1);
          const ix2 = cx + innerR * Math.cos(iRad2);
          const iy2 = cy + innerR * Math.sin(iRad2);
          const innerLarge = sweep > 180 ? 1 : 0;
          const innerArc = `L ${ix1} ${iy1} A ${innerR} ${innerR} 0 ${innerLarge} 0 ${ix2} ${iy2} Z`;
          const fullPath = outerPath + innerArc;
          const color = colorMap[item.name] || '#9ca3af';
          currentAngle = endAngle;
          return <Path key={index} d={fullPath} fill={color} />;
        })}
      </Svg>
    );
  };

  return (
    <ContentPage>
      {/* セクションヘッダー */}
      <SectionHeader title="顧客傾向" pageNumber={pageNumber} />

      {/* 上段: 性別比率 + 顧客タイプ（半円ゲージ） */}
      <View style={styles.customerTrendsTopRow}>
        {/* 性別比率 */}
        <View style={styles.customerTrendsCard}>
          <View style={styles.customerTrendsCardHeader}>
            <View style={[styles.customerTrendsCardIcon, { backgroundColor: '#dbeafe' }]}>
              <Svg width={14} height={14} viewBox="0 0 24 24">
                <Path d="M17 21V19C17 17.94 16.58 16.92 15.83 16.17C15.08 15.42 14.06 15 13 15H5C3.94 15 2.92 15.42 2.17 16.17C1.42 16.92 1 17.94 1 19V21" stroke="#3b82f6" strokeWidth={2} strokeLinecap="round" fill="none" />
                <Path d="M9 11C11.21 11 13 9.21 13 7C13 4.79 11.21 3 9 3C6.79 3 5 4.79 5 7C5 9.21 6.79 11 9 11Z" stroke="#3b82f6" strokeWidth={2} fill="none" />
              </Svg>
            </View>
            <Text style={styles.customerTrendsCardTitle}>性別比率</Text>
          </View>
          <View style={{ alignItems: 'center', marginBottom: 4 }}>
            {renderSemiDonut(genderDistribution, genderColors)}
          </View>
          <View style={styles.legendContainer}>
            {genderDistribution.map((item, index) => (
              <View key={index} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: genderColors[item.name] || '#9ca3af' }]} />
                <Text style={styles.legendText}>{item.name} {item.value}%</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 顧客タイプ */}
        <View style={styles.customerTrendsCard}>
          <View style={styles.customerTrendsCardHeader}>
            <View style={[styles.customerTrendsCardIcon, { backgroundColor: '#d1fae5' }]}>
              <Svg width={14} height={14} viewBox="0 0 24 24">
                <Path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke="#10b981" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </Svg>
            </View>
            <Text style={styles.customerTrendsCardTitle}>顧客タイプ</Text>
          </View>
          <View style={{ alignItems: 'center', marginBottom: 4 }}>
            {renderSemiDonut(customerTypeDistribution, customerTypeColors)}
          </View>
          <View style={styles.legendContainer}>
            {customerTypeDistribution.map((item, index) => (
              <View key={index} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: customerTypeColors[item.name] || '#9ca3af' }]} />
                <Text style={styles.legendText}>{item.name} {item.value}%</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* 下段: 年齢層 + 同行者（横バー） */}
      <View style={styles.customerTrendsBottomRow}>
        {/* 年齢層 */}
        <View style={styles.customerTrendsCard}>
          <View style={styles.customerTrendsCardHeader}>
            <View style={[styles.customerTrendsCardIcon, { backgroundColor: '#ede9fe' }]}>
              <Svg width={14} height={14} viewBox="0 0 24 24">
                <Path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" stroke="#8b5cf6" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </Svg>
            </View>
            <Text style={styles.customerTrendsCardTitle}>年齢層</Text>
          </View>
          {ageDistribution.slice(0, 5).map((item, index) => (
            <View key={index} style={styles.horizontalBarItem}>
              <Text style={styles.horizontalBarLabel}>{item.name}</Text>
              <View style={styles.horizontalBarTrack}>
                <View style={[styles.horizontalBarFill, { width: `${item.value}%`, backgroundColor: ageColors[index % ageColors.length] }]} />
              </View>
              <Text style={styles.horizontalBarValue}>{item.value}%</Text>
            </View>
          ))}
        </View>

        {/* 同行者 */}
        <View style={styles.customerTrendsCard}>
          <View style={styles.customerTrendsCardHeader}>
            <View style={[styles.customerTrendsCardIcon, { backgroundColor: '#ffedd5' }]}>
              <Svg width={14} height={14} viewBox="0 0 24 24">
                <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="#f97316" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                <Path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="#f97316" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </Svg>
            </View>
            <Text style={styles.customerTrendsCardTitle}>同行者</Text>
          </View>
          {companionDistribution.slice(0, 4).map((item, index) => (
            <View key={index} style={styles.horizontalBarItem}>
              <Text style={styles.horizontalBarLabel}>{item.name}</Text>
              <View style={styles.horizontalBarTrack}>
                <View style={[styles.horizontalBarFill, { width: `${item.value}%`, backgroundColor: companionColors[index % companionColors.length] }]} />
              </View>
              <Text style={styles.horizontalBarValue}>{item.value}%</Text>
            </View>
          ))}
        </View>
      </View>
    </ContentPage>
  );
};

/**
 * 顧客の重視ポイントページコンポーネント
 */
const CustomerPriorityPage = ({ reportData, pageNumber }) => {
  const customerTrends = reportData?.customerTrends || {};
  const radarData = customerTrends.radarData || [];

  const priorityColumnColors = {
    total: '#3b82f6',
    repeater: '#10b981',
    newCustomer: '#f59e0b',
  };

  // レーダーチャートを生成
  const renderRadarChart = (data, dataKey, fillColor, strokeColor) => {
    const svgSize = 130;
    const cx = svgSize / 2;
    const cy = svgSize / 2;
    const maxR = 50;
    const containerSize = 180;
    const offset = (containerSize - svgSize) / 2;
    const categories = data.map(d => d.category);
    const n = categories.length;
    if (n === 0) return null;

    const gridLevels = [20, 40, 60, 80, 100];
    const gridPaths = gridLevels.map(level => {
      const r = (level / 100) * maxR;
      const points = [];
      for (let i = 0; i < n; i++) {
        const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
        points.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
      }
      return points.join(' ');
    });

    const axisLines = [];
    for (let i = 0; i < n; i++) {
      const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
      axisLines.push({
        x: cx + maxR * Math.cos(angle),
        y: cy + maxR * Math.sin(angle)
      });
    }

    const dataPoints = data.map((d, i) => {
      const val = d[dataKey] || 0;
      const r = (val / 100) * maxR;
      const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
      return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
    });

    const labelPositions = data.map((d, i) => {
      const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
      const labelR = maxR + 16;
      const x = cx + labelR * Math.cos(angle) + offset;
      const y = cy + labelR * Math.sin(angle) + offset;
      let alignY = y;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);
      if (sinA < -0.5) { alignY -= 6; }
      if (sinA > 0.3) { alignY += 2; }
      return { x, y: alignY, label: d.category, cosA };
    });

    return (
      <View style={{ alignItems: 'center', width: containerSize, height: containerSize, position: 'relative' }}>
        <View style={{ position: 'absolute', top: offset, left: offset }}>
          <Svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`}>
            {gridPaths.map((points, i) => (
              <Polygon key={i} points={points} fill="none" stroke="#e5e7eb" strokeWidth={0.5} />
            ))}
            {axisLines.map((line, i) => (
              <Path key={i} d={`M ${cx} ${cy} L ${line.x} ${line.y}`} stroke="#e5e7eb" strokeWidth={0.5} fill="none" />
            ))}
            <Polygon points={dataPoints.join(' ')} fill={fillColor} fillOpacity={0.4} stroke={strokeColor} strokeWidth={1.5} />
          </Svg>
        </View>
        {labelPositions.map((pos, i) => {
          let left = pos.x;
          let textAlign = 'center';
          const labelWidth = 50;
          if (pos.cosA > 0.3) {
            textAlign = 'left';
            left = pos.x + 2;
          } else if (pos.cosA < -0.3) {
            textAlign = 'right';
            left = pos.x - labelWidth - 2;
          } else {
            left = pos.x - labelWidth / 2;
          }
          return (
            <View
              key={i}
              style={{
                position: 'absolute',
                top: pos.y - 5,
                left: left,
                width: labelWidth,
              }}
            >
              <Text style={{
                fontSize: 7,
                color: '#374151',
                fontFamily: 'NotoSansJP',
                textAlign: textAlign,
              }}>
                {pos.label}
              </Text>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <ContentPage>
      <SectionHeader title="顧客の重視ポイント" pageNumber={pageNumber} />

      <View style={styles.priorityColumnsContainer}>
        {/* 全体の評価 */}
        <View style={styles.priorityColumn}>
          <Text style={styles.priorityColumnTitle}>全体の評価</Text>
          {renderRadarChart(radarData, 'total', '#3b82f6', '#3b82f6')}
          <View style={{ marginTop: 6, gap: 3, alignSelf: 'stretch' }}>
            {[...radarData].sort((a, b) => (b.total || 0) - (a.total || 0)).map((item, index) => (
              <View key={index} style={styles.priorityRankItem}>
                <View style={styles.priorityRankLeft}>
                  <Text style={styles.priorityRankNumber}>{index + 1}位</Text>
                  <Text style={styles.priorityRankLabel}>{item.category}</Text>
                </View>
                <Text style={[styles.priorityRankValue, { color: priorityColumnColors.total }]}>{item.total || 0}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* リピーターの評価 */}
        <View style={styles.priorityColumn}>
          <Text style={styles.priorityColumnTitle}>リピーターの評価</Text>
          {renderRadarChart(radarData, 'repeater', '#10b981', '#10b981')}
          <View style={{ marginTop: 6, gap: 3, alignSelf: 'stretch' }}>
            {[...radarData].sort((a, b) => (b.repeater || 0) - (a.repeater || 0)).map((item, index) => (
              <View key={index} style={styles.priorityRankItem}>
                <View style={styles.priorityRankLeft}>
                  <Text style={styles.priorityRankNumber}>{index + 1}位</Text>
                  <Text style={styles.priorityRankLabel}>{item.category}</Text>
                </View>
                <Text style={[styles.priorityRankValue, { color: priorityColumnColors.repeater }]}>{item.repeater || 0}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 新規顧客の評価 */}
        <View style={styles.priorityColumn}>
          <Text style={styles.priorityColumnTitle}>新規顧客の評価</Text>
          {renderRadarChart(radarData, 'newCustomer', '#f59e0b', '#f59e0b')}
          <View style={{ marginTop: 6, gap: 3, alignSelf: 'stretch' }}>
            {[...radarData].sort((a, b) => (b.newCustomer || 0) - (a.newCustomer || 0)).map((item, index) => (
              <View key={index} style={styles.priorityRankItem}>
                <View style={styles.priorityRankLeft}>
                  <Text style={styles.priorityRankNumber}>{index + 1}位</Text>
                  <Text style={styles.priorityRankLabel}>{item.category}</Text>
                </View>
                <Text style={[styles.priorityRankValue, { color: priorityColumnColors.newCustomer }]}>{item.newCustomer || 0}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </ContentPage>
  );
};

/**
 * 店舗評価ページコンポーネント（未使用）
 */
const StoreEvaluationPage = ({ reportData, pageNumber }) => {
  // QSCスコアデータ
  const qscScores = reportData?.storeEvaluation?.qscScores || {
    Q: { label: 'クオリティ', score: 0, trend: 0, color: 'violet' },
    S: { label: 'サービス', score: 0, trend: 0, color: 'blue' },
    C: { label: 'クレンリネス', score: 0, trend: 0, color: 'emerald' }
  };

  return (
    <ContentPage>
      {/* セクションヘッダー */}
      <SectionHeader title="店舗評価" pageNumber={pageNumber} />

      {/* QSCカード（3枚） */}
      <View style={styles.qscCardGrid}>
        {Object.entries(qscScores).map(([key, data]) => (
          <QSCCard
            key={key}
            category={key}
            label={data.label}
            score={data.score}
            trend={data.trend}
            colorTheme={data.color}
          />
        ))}
      </View>
    </ContentPage>
  );
};

/**
 * 店舗別インサイトページ（カード一覧）
 */
const StoreInsightCardsPage = ({ reportData, pageNumber }) => {
  const segments = reportData?.salesImpact?.segments || [];

  const issueSegments = segments
    .filter(seg => seg.count > 0 && SEGMENT_INSIGHTS_PDF[seg.id])
    .sort((a, b) => {
      const priorityDiff = (SEGMENT_PRIORITY_PDF[b.id] || 0) - (SEGMENT_PRIORITY_PDF[a.id] || 0);
      if (priorityDiff !== 0) return priorityDiff;
      return b.count - a.count;
    })
    .slice(0, 3);

  return (
    <ContentPage>
      <SectionHeader title="店舗別インサイト" pageNumber={pageNumber} />

      {issueSegments.length > 0 ? (
        <View style={styles.insightCardGrid}>
          {issueSegments.map((seg) => {
            const insights = SEGMENT_INSIGHTS_PDF[seg.id];
            const categoryTag = getCategoryTagPdf(seg);
            const npsTag = getNpsTagPdf(seg);
            return (
              <View key={seg.id} style={styles.insightCard}>
                <View style={styles.insightCardInner}>
                  <View style={[styles.insightNpsTag, { backgroundColor: npsTag.color }]}>
                    <Text style={styles.insightNpsTagText}>{npsTag.label}</Text>
                  </View>
                  <View style={styles.insightCardTitleRow}>
                    <Text style={styles.insightCardTitle}>{categoryTag.label}</Text>
                    <View style={styles.insightCardCount}>
                      <Text style={styles.insightCardCountValue}>{seg.count}</Text>
                      <Text style={styles.insightCardCountUnit}>人</Text>
                    </View>
                  </View>
                  <View style={styles.insightDivider} />
                  <View style={styles.insightIssueLabel}>
                    <Text style={styles.insightIssueLabelText}>課題&注意</Text>
                  </View>
                  {insights.issues.map((issue, idx) => (
                    <View key={idx} style={styles.insightIssueItem}>
                      <View style={styles.insightIssueDot} />
                      <Text style={styles.insightIssueText}>{issue}</Text>
                    </View>
                  ))}
                </View>
              </View>
            );
          })}
        </View>
      ) : (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 12, color: colors.gray500, fontFamily: 'NotoSansJP' }}>
            課題のあるセグメントはありません
          </Text>
        </View>
      )}
    </ContentPage>
  );
};

/**
 * インサイト詳細ページ パターンA（顧客の声）
 */
const InsightDetailVoicePage = ({ insight, pageNumber }) => {
  if (!insight) return null;

  const { categoryTag, npsTag } = getTagsFromResultType(insight.result_type);
  const points = [insight.point_1, insight.point_2, insight.point_3].filter(Boolean);

  return (
    <ContentPage>
      <SectionHeader title="課題" pageNumber={pageNumber} />

      {/* タグ行 */}
      {categoryTag && npsTag && (
        <View style={styles.detailTagRow}>
          <View style={[styles.detailTag, { backgroundColor: categoryTag.color }]}>
            <Text style={styles.detailTagText}>{categoryTag.label}</Text>
          </View>
          <Text style={styles.detailTagCross}>×</Text>
          <View style={[styles.detailTag, { backgroundColor: npsTag.color }]}>
            <Text style={styles.detailTagText}>{npsTag.label}</Text>
          </View>
        </View>
      )}

      {/* 課題タイトル・説明 */}
      <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.gray900, fontFamily: 'NotoSansJP', marginBottom: 6 }}>
        {softBreakText(insight.issue_title)}
      </Text>
      <Text style={{ fontSize: 11, color: colors.gray600, fontFamily: 'NotoSansJP', lineHeight: 1.5, marginBottom: 16 }}>
        {softBreakText(insight.issue_detail)}
      </Text>

      {/* 顧客の声 コールアウト */}
      {insight.comment && (
        <View style={styles.voiceCallout}>
          <View style={styles.voiceCalloutIconWrap}>
            <Svg width={22} height={22} viewBox="0 0 24 24">
              <Path
                d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                stroke={colors.primary}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </Svg>
          </View>
          <Text style={styles.voiceCalloutText}>{softBreakText(insight.comment)}</Text>
        </View>
      )}

      {/* 検討事項 */}
      {points.length > 0 && (
        <View style={styles.detailExampleBox}>
          <Text style={styles.detailExampleTitle}>検討事項</Text>
          {points.map((point, idx) => {
            const parts = point.split('→');
            const question = parts[0]?.trim();
            const suggestion = parts.length > 1 ? parts.slice(1).join('→').trim() : null;
            return (
              <View key={idx} style={styles.detailExampleItem}>
                <Text style={styles.detailExampleText}>{softBreakText(question)}</Text>
                {suggestion && (
                  <Text style={{ fontSize: 9, color: colors.gray500, fontFamily: 'NotoSansJP', lineHeight: 1.5, marginTop: 2, paddingLeft: 8 }}>
                    {softBreakText(`→ ${suggestion}`)}
                  </Text>
                )}
              </View>
            );
          })}
        </View>
      )}
    </ContentPage>
  );
};

/**
 * インサイト詳細ページ パターンB（評価バーチャート）
 */
const InsightDetailChartPage = ({ insight, pageNumber }) => {
  if (!insight) return null;

  const { categoryTag, npsTag } = getTagsFromResultType(insight.result_type);
  const points = [insight.point_1, insight.point_2, insight.point_3].filter(Boolean);

  const curPos = insight.current_positive || 0;
  const curNeg = insight.current_negative || 0;
  const curNeu = Math.max(0, 100 - curPos - curNeg);
  const prevPos = insight.previous_positive || 0;
  const prevNeg = insight.previous_negative || 0;
  const prevNeu = Math.max(0, 100 - prevPos - prevNeg);

  return (
    <ContentPage>
      <SectionHeader title="課題" pageNumber={pageNumber} />

      {/* タグ行 */}
      {categoryTag && npsTag && (
        <View style={styles.detailTagRow}>
          <View style={[styles.detailTag, { backgroundColor: categoryTag.color }]}>
            <Text style={styles.detailTagText}>{categoryTag.label}</Text>
          </View>
          <Text style={styles.detailTagCross}>×</Text>
          <View style={[styles.detailTag, { backgroundColor: npsTag.color }]}>
            <Text style={styles.detailTagText}>{npsTag.label}</Text>
          </View>
        </View>
      )}

      {/* 課題タイトル・説明 */}
      <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.gray900, fontFamily: 'NotoSansJP', marginBottom: 6 }}>
        {softBreakText(insight.issue_title)}
      </Text>
      <Text style={{ fontSize: 11, color: colors.gray600, fontFamily: 'NotoSansJP', lineHeight: 1.5, marginBottom: 16 }}>
        {softBreakText(insight.issue_detail)}
      </Text>

      {/* 評価バーチャート */}
      <View style={styles.evalBarSection}>
        {/* 今月の評価 */}
        <View style={styles.evalBarColumn}>
          <Text style={styles.evalBarLabel}>{insight.current_title || 'セグメント評価'}</Text>
          <View style={styles.evalBar}>
            <View style={[styles.evalBarSegment, { width: `${curPos}%`, backgroundColor: '#22c55e' }]} />
            <View style={[styles.evalBarSegment, { width: `${curNeu}%`, backgroundColor: colors.gray400 }]} />
            <View style={[styles.evalBarSegment, { width: `${curNeg}%`, backgroundColor: '#ef4444' }]} />
          </View>
          <View style={styles.evalBarPercentRow}>
            <Text style={styles.evalBarPercentPositive}>{curPos}%</Text>
            <Text style={styles.evalBarPercentNeutral}>{curNeu}%</Text>
            <Text style={styles.evalBarPercentNegative}>{curNeg}%</Text>
          </View>
        </View>

        {/* 前月の評価 */}
        <View style={styles.evalBarColumn}>
          <Text style={styles.evalBarLabel}>{insight.previous_title || '店舗全体評価'}</Text>
          <View style={styles.evalBar}>
            <View style={[styles.evalBarSegment, { width: `${prevPos}%`, backgroundColor: '#22c55e' }]} />
            <View style={[styles.evalBarSegment, { width: `${prevNeu}%`, backgroundColor: colors.gray400 }]} />
            <View style={[styles.evalBarSegment, { width: `${prevNeg}%`, backgroundColor: '#ef4444' }]} />
          </View>
          <View style={styles.evalBarPercentRow}>
            <Text style={styles.evalBarPercentPositive}>{prevPos}%</Text>
            <Text style={styles.evalBarPercentNeutral}>{prevNeu}%</Text>
            <Text style={styles.evalBarPercentNegative}>{prevNeg}%</Text>
          </View>
        </View>
      </View>

      {/* 凡例 */}
      <View style={[styles.evalBarLegend, { marginTop: 4, marginBottom: 16 }]}>
        <View style={styles.evalBarLegendItem}>
          <View style={[styles.evalBarLegendDot, { backgroundColor: '#22c55e' }]} />
          <Text style={styles.evalBarLegendText}>ポジティブ</Text>
        </View>
        <View style={styles.evalBarLegendItem}>
          <View style={[styles.evalBarLegendDot, { backgroundColor: colors.gray400 }]} />
          <Text style={styles.evalBarLegendText}>ニュートラル</Text>
        </View>
        <View style={styles.evalBarLegendItem}>
          <View style={[styles.evalBarLegendDot, { backgroundColor: '#ef4444' }]} />
          <Text style={styles.evalBarLegendText}>ネガティブ</Text>
        </View>
      </View>

      {/* 検討事項 */}
      {points.length > 0 && (
        <View style={styles.detailExampleBox}>
          <Text style={styles.detailExampleTitle}>検討事項</Text>
          {points.map((point, idx) => {
            const parts = point.split('→');
            const question = parts[0]?.trim();
            const suggestion = parts.length > 1 ? parts.slice(1).join('→').trim() : null;
            return (
              <View key={idx} style={styles.detailExampleItem}>
                <Text style={styles.detailExampleText}>{softBreakText(question)}</Text>
                {suggestion && (
                  <Text style={{ fontSize: 9, color: colors.gray500, fontFamily: 'NotoSansJP', lineHeight: 1.5, marginTop: 2, paddingLeft: 8 }}>
                    {softBreakText(`→ ${suggestion}`)}
                  </Text>
                )}
              </View>
            );
          })}
        </View>
      )}
    </ContentPage>
  );
};

/**
 * PDFドキュメントコンポーネント
 */
export const PDFDocument = ({ report, reportData, storeName, companyName = '' }) => {
  // インサイトデータを取得（最大3件）
  const insights = reportData?.insights || [];
  let insightPageNumber = 0;

  return (
  <Document>
    {/* 表紙 */}
    <CoverPage
      report={report}
      storeName={storeName}
      companyName={companyName}
    />

    {/* インサイト詳細ページ（動的） */}
    {insights.map((insight, idx) => {
      insightPageNumber = idx + 1;
      if (insight.issue_type === 'evaluation') {
        return (
          <InsightDetailChartPage
            key={insight.id || idx}
            insight={insight}
            pageNumber={insightPageNumber}
          />
        );
      }
      // comment型 or その他
      return (
        <InsightDetailVoicePage
          key={insight.id || idx}
          insight={insight}
          pageNumber={insightPageNumber}
        />
      );
    })}

    {/* 概要ページ */}
    <OverviewPage
      reportData={reportData}
      pageNumber={insightPageNumber + 1}
      comment={reportData?.aiText?.overview || reportData?.overview?.comment || '先月と比較してNPSスコアが改善傾向にあります。リピート率も安定しており、顧客満足度の向上が見られます。'}
    />

    {/* 売上影響ページ */}
    <SalesImpactPage
      reportData={reportData}
      pageNumber={insightPageNumber + 2}
      comment={reportData?.aiText?.sales_impact || reportData?.salesImpact?.comment || '新規顧客のリピーター転換率が先月より向上しています。一方でリピーター離脱の割合も微増しているため、既存顧客へのフォローアップ施策の検討をお勧めします。'}
    />

    {/* Quality詳細ページ */}
    <QSCDetailPage
      reportData={reportData}
      category="Q"
      pageNumber={insightPageNumber + 3}
    />

    {/* Service詳細ページ */}
    <QSCDetailPage
      reportData={reportData}
      category="S"
      pageNumber={insightPageNumber + 4}
    />

    {/* Cleanliness詳細ページ */}
    <QSCDetailPage
      reportData={reportData}
      category="C"
      pageNumber={insightPageNumber + 5}
    />

    {/* 顧客傾向ページ */}
    <CustomerTrendsPage
      reportData={reportData}
      pageNumber={insightPageNumber + 6}
    />

    {/* 顧客の重視ポイントページ */}
    <CustomerPriorityPage
      reportData={reportData}
      pageNumber={insightPageNumber + 7}
    />
  </Document>
  );
};

/**
 * PDFをBlobとして生成
 */
export const generatePDFBlob = async (report, reportData, storeName, companyName = '') => {
  const blob = await pdf(
    <PDFDocument
      report={report}
      reportData={reportData}
      storeName={storeName}
      companyName={companyName}
    />
  ).toBlob();
  return blob;
};

/**
 * PDFをダウンロード
 */
export const downloadPDF = async (report, reportData, storeName, companyName = '') => {
  const blob = await generatePDFBlob(report, reportData, storeName, companyName);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${report.displayName}_レポート_${storeName}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export default {
  PDFDocument,
  CoverPage,
  ContentPage,
  OverviewPage,
  SalesImpactPage,
  CustomerTrendsPage,
  QSCDetailPage,
  KPICard,
  generatePDFBlob,
  downloadPDF,
};
