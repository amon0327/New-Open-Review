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
  red500: '#ef4444',
  // KPIカード用カラー
  blue500: '#3b82f6',
  emerald500: '#10b981',
  amber500: '#f59e0b',
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
    padding: 32,
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
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
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

  // フッター（ページ番号のみ）
  footer: {
    marginTop: 'auto',
    paddingTop: 12,
    alignItems: 'flex-end',
  },
  footerPageNumber: {
    fontSize: 10,
    color: colors.gray400,
  },
});

// ロゴURL
const LOGO_URL = 'https://otfreskkeaenahqziriz.supabase.co/storage/v1/object/public/app-assets/logo/OpenReviewLogo.png';
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
const ContentPage = ({ title, children, pageNumber }) => (
  <Page size="A4" orientation="landscape" style={styles.contentPageOuter}>
    <View style={styles.contentPageInner}>
      {/* ページタイトル（中央配置） */}
      {title && <Text style={styles.pageTitle}>{title}</Text>}

      {/* コンテンツ */}
      <View style={styles.content}>
        {children}
      </View>

      {/* フッター */}
      <View style={styles.footer}>
        <Text style={styles.footerPageNumber}>{pageNumber}</Text>
      </View>
    </View>
  </Page>
);

/**
 * 概要ページコンポーネント（KPIカード4枚）
 */
const OverviewPage = ({ reportData, pageNumber }) => {
  // KPIデータを取得（reportDataから）
  const kpi = reportData?.kpi || {
    nps: { current: 0, delta: 0 },
    repeatRate: { current: 0, delta: 0 },
    repeaterRevisit: { current: 0, delta: 0 },
    newRevisit: { current: 0, delta: 0 }
  };

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
      title: "3ヶ月以内再来店意向（リピーター）",
      metric: `${Number(kpi.repeaterRevisit.current).toFixed(1)}%`,
      delta: `${kpi.repeaterRevisit.delta >= 0 ? '+' : ''}${Number(kpi.repeaterRevisit.delta).toFixed(1)}%`,
      deltaType: kpi.repeaterRevisit.delta >= 0 ? "increase" : "decrease",
      color: KPI_COLORS[2]
    },
    {
      title: "3ヶ月以内再来店意向（新規）",
      metric: `${Number(kpi.newRevisit.current).toFixed(1)}%`,
      delta: `${kpi.newRevisit.delta >= 0 ? '+' : ''}${Number(kpi.newRevisit.delta).toFixed(1)}%`,
      deltaType: kpi.newRevisit.delta >= 0 ? "increase" : "decrease",
      color: KPI_COLORS[3]
    }
  ];

  return (
    <ContentPage title="概要" pageNumber={pageNumber}>
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
  KPICard,
  generatePDFBlob,
  downloadPDF,
};
