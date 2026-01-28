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
  gray700: '#334155',
  gray900: '#0f172a',
  green500: '#22c55e',
  red500: '#ef4444',
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

  // コンテンツエリア
  content: {
    flex: 1,
  },

  // セクション
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.gray900,
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
    borderBottomStyle: 'solid',
  },

  // 統計カードグリッド（横向き用）
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.gray50,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gray200,
    borderStyle: 'solid',
  },
  statValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: colors.gray500,
    marginTop: 8,
  },

  // トレンドカード
  trendCard: {
    backgroundColor: colors.gray50,
    padding: 16,
    paddingLeft: 24,
    paddingRight: 24,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.gray200,
    borderStyle: 'solid',
  },
  trendLabel: {
    fontSize: 14,
    color: colors.gray500,
  },
  trendValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  trendPositive: {
    color: colors.green500,
  },
  trendNegative: {
    color: colors.red500,
  },
  trendNeutral: {
    color: colors.gray500,
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

/**
 * 表紙ページコンポーネント
 */
const CoverPage = ({ report, storeName, companyName }) => {
  // 年月をフォーマット（例：2026/01）
  const formatYearMonth = (yearMonth) => {
    if (!yearMonth) return '';
    return yearMonth.replace('-', '/');
  };

  return (
    <Page size="A4" orientation="landscape" style={styles.coverPage}>
      {/* ロゴ（テキスト入り） */}
      <View style={styles.coverLogoContainer}>
        <Image src={LOGO_WITH_TEXT_URL} style={styles.coverLogoWithText} />
      </View>

      {/* 会社名・店舗名・日付 */}
      <View style={styles.coverInfoContainer}>
        {companyName && (
          <Text style={styles.coverCompanyName}>{companyName}</Text>
        )}
        <Text style={styles.coverStoreName}>{storeName} 様</Text>
        <Text style={styles.coverDate}>{formatYearMonth(report.yearMonth)}</Text>
      </View>

      {/* 下部のアクセントバー */}
      <View style={styles.coverBottomBar} />
    </Page>
  );
};

/**
 * PDF統計カードコンポーネント
 */
const StatCard = ({ value, label }) => (
  <View style={styles.statCard}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

/**
 * PDFトレンドカードコンポーネント
 */
const TrendCard = ({ change }) => {
  const isPositive = change > 0;
  const isNegative = change < 0;
  const trendStyle = isPositive
    ? styles.trendPositive
    : isNegative
    ? styles.trendNegative
    : styles.trendNeutral;

  return (
    <View style={styles.trendCard}>
      <Text style={styles.trendLabel}>前月比:</Text>
      <Text style={[styles.trendValue, trendStyle]}>
        {isPositive ? '+' : ''}{change}%
      </Text>
    </View>
  );
};

/**
 * コンテンツページコンポーネント（ボーダー枠デザイン）
 */
const ContentPage = ({ children, pageNumber }) => (
  <Page size="A4" orientation="landscape" style={styles.contentPageOuter}>
    <View style={styles.contentPageInner}>
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
 * サマリーページコンポーネント
 */
const SummaryPage = ({ reportData, pageNumber }) => (
  <ContentPage pageNumber={pageNumber}>
    <View style={styles.statsGrid}>
      <StatCard
        value={reportData.totalResponses || 0}
        label="総回答数"
      />
      <StatCard
        value={reportData.averageScore ? reportData.averageScore.toFixed(1) : '-'}
        label="平均スコア"
      />
      <StatCard
        value={reportData.responseRate ? `${reportData.responseRate.toFixed(1)}%` : '-'}
        label="回答率"
      />
    </View>

    {/* トレンドセクション */}
    {reportData.monthlyTrend && (
      <View style={{ marginTop: 24 }}>
        <Text style={styles.sectionTitle}>月間トレンド</Text>
        <TrendCard change={reportData.monthlyTrend.change} />
      </View>
    )}
  </ContentPage>
);

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

    {/* サマリーページ */}
    <SummaryPage
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
  SummaryPage,
  generatePDFBlob,
  downloadPDF,
};
