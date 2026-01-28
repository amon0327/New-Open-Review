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
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
  },
  coverLogoWithText: {
    height: 50,
    width: 280,
    objectFit: 'contain',
  },
  coverInfoContainer: {
    marginTop: 20,
  },
  coverCompanyName: {
    fontSize: 24,
    color: colors.white,
    marginBottom: 8,
    fontWeight: 'bold',
  },
  coverStoreName: {
    fontSize: 24,
    color: colors.white,
    marginBottom: 16,
  },
  coverDate: {
    fontSize: 20,
    color: colors.white,
    opacity: 0.9,
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
});

// ロゴURL
const LOGO_URL = 'https://otfreskkeaenahqziriz.supabase.co/storage/v1/object/public/app-assets/logo/OpenReviewWhiteThemeLoog.png';
const LOGO_ICON_URL = 'https://otfreskkeaenahqziriz.supabase.co/storage/v1/object/public/app-assets/logo/OpenReviewLogo.png';
const LOGO_WITH_TEXT_URL = 'https://otfreskkeaenahqziriz.supabase.co/storage/v1/object/public/app-assets/logo/OpenReviewDarkThemeLoog.png';

// KPIカードのカラー配列
const KPI_COLORS = [colors.blue500, colors.emerald500, colors.amber500, colors.violet500];

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

      <View style={styles.coverInfoContainer}>
        {companyName && (
          <Text style={styles.coverCompanyName}>{companyName}</Text>
        )}
        <Text style={styles.coverStoreName}>{storeName} 様</Text>
        <Text style={styles.coverDate}>{formatYearMonth(report.yearMonth)}</Text>
      </View>

      <View style={styles.coverBottomBar} />
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
const OverviewPage = ({ reportData, pageNumber }) => {
  // KPIデータを取得（reportDataから）
  const kpi = reportData?.kpi || {
    nps: { current: 0, delta: 0 },
    repeatRate: { current: 0, delta: 0 },
    repeaterRevisit: { current: 0, delta: 0 },
    newRevisit: { current: 0, delta: 0 }
  };

  // NPS分布データ
  const npsDistribution = reportData?.npsDistribution || {
    promoters: 0,
    passives: 0,
    detractors: 0
  };

  // 月別パフォーマンスデータ
  const monthlyPerformance = reportData?.monthlyPerformance || [];

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
      <SectionHeader title="課題" pageNumber={pageNumber} />

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
    <View style={styles.segmentTableCard}>
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
const SalesImpactPage = ({ reportData, pageNumber }) => {
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
    </ContentPage>
  );
};

/**
 * QSCアイコン - Quality (UtensilsCrossed)
 */
const QualityIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24">
    <Path
      d="M16 2v20M12 2v6M8 2v6"
      stroke={colors.white}
      strokeWidth={2}
      strokeLinecap="round"
      fill="none"
    />
    <Path
      d="M8 8a4 4 0 0 0 4 4h0a4 4 0 0 0 4-4"
      stroke={colors.white}
      strokeWidth={2}
      strokeLinecap="round"
      fill="none"
    />
    <Path
      d="M3 2l7 7M21 2l-7 7"
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

  // AIサマリーデータ
  const aiSummary = reportData?.storeEvaluation?.aiSummary || {
    Q: '',
    S: '',
    C: ''
  };

  const scoreData = qscScores[category] || { label: '', score: 0, trend: 0, color: 'violet' };
  const detailData = qscDetailedData[category] || { items: [], totalResponses: 0 };
  const summary = aiSummary[category] || 'データが不足しています。';

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
              d="M16 2v20M12 2v6M8 2v6"
              stroke={iconColor}
              strokeWidth={2}
              strokeLinecap="round"
              fill="none"
            />
            <Path
              d="M8 8a4 4 0 0 0 4 4h0a4 4 0 0 0 4-4"
              stroke={iconColor}
              strokeWidth={2}
              strokeLinecap="round"
              fill="none"
            />
            <Path
              d="M3 2l7 7M21 2l-7 7"
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
          <Text style={styles.qscDetailDescription}>{summary}</Text>
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
 * 店舗評価ページコンポーネント（4ページ目）
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
 * PDFドキュメントコンポーネント
 */
export const PDFDocument = ({ report, reportData, storeName, companyName = '' }) => (
  <Document>
    {/* 表紙 */}
    <CoverPage
      report={report}
      storeName={storeName}
      companyName={companyName}
    />

    {/* 概要ページ */}
    <OverviewPage
      reportData={reportData}
      pageNumber={1}
    />

    {/* 売上影響ページ */}
    <SalesImpactPage
      reportData={reportData}
      pageNumber={2}
    />

    {/* 店舗評価ページ */}
    <StoreEvaluationPage
      reportData={reportData}
      pageNumber={3}
    />

    {/* Quality詳細ページ */}
    <QSCDetailPage
      reportData={reportData}
      category="Q"
      pageNumber={4}
    />

    {/* Service詳細ページ */}
    <QSCDetailPage
      reportData={reportData}
      category="S"
      pageNumber={5}
    />

    {/* Cleanliness詳細ページ */}
    <QSCDetailPage
      reportData={reportData}
      category="C"
      pageNumber={6}
    />
  </Document>
);

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
  StoreEvaluationPage,
  QSCDetailPage,
  KPICard,
  generatePDFBlob,
  downloadPDF,
};
