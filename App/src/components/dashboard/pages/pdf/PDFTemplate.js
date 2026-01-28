import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  pdf,
} from '@react-pdf/renderer';

// 日本語フォントを登録（Noto Sans JP）
Font.register({
  family: 'NotoSansJP',
  fonts: [
    {
      src: 'https://fonts.gstatic.com/s/notosansjp/v52/-F6jfjtqLzI2JPCgQBnw7HFyzSD-AsregP8VFBEi75vY0rw-oME.ttf',
      fontWeight: 'normal',
    },
    {
      src: 'https://fonts.gstatic.com/s/notosansjp/v52/-F6jfjtqLzI2JPCgQBnw7HFyzSD-AsregP8VFJki75vY0rw-oME.ttf',
      fontWeight: 'bold',
    },
  ],
});

// スタイル定義
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 40,
    fontFamily: 'NotoSansJP',
  },
  // ヘッダー
  header: {
    textAlign: 'center',
    marginBottom: 30,
    paddingBottom: 15,
    borderBottomWidth: 3,
    borderBottomColor: '#5e17eb',
    borderBottomStyle: 'solid',
  },
  headerTitle: {
    fontSize: 24,
    color: '#5e17eb',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 10,
    color: '#64748b',
  },
  // セクション
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a202c',
    marginBottom: 12,
    paddingBottom: 6,
    borderBottomWidth: 2,
    borderBottomColor: '#e2e8f0',
    borderBottomStyle: 'solid',
  },
  // 統計カードグリッド
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'solid',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#5e17eb',
  },
  statLabel: {
    fontSize: 9,
    color: '#64748b',
    marginTop: 4,
  },
  // トレンドカード
  trendCard: {
    backgroundColor: '#f8fafc',
    padding: 12,
    paddingLeft: 20,
    paddingRight: 20,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'solid',
  },
  trendLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  trendValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  trendPositive: {
    color: '#22c55e',
  },
  trendNegative: {
    color: '#ef4444',
  },
  trendNeutral: {
    color: '#64748b',
  },
  // フッター
  footer: {
    marginTop: 'auto',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    borderTopStyle: 'solid',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 8,
    color: '#94a3b8',
    marginBottom: 2,
  },
  // コンテンツエリア
  content: {
    flex: 1,
  },
});

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
 * PDFドキュメントコンポーネント
 */
export const PDFDocument = ({ report, reportData, storeName }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {report.displayName} 月次レポート
        </Text>
        <Text style={styles.headerSubtitle}>
          {storeName} | 作成日: {new Date().toLocaleDateString('ja-JP')}
        </Text>
      </View>

      {/* コンテンツ */}
      <View style={styles.content}>
        {/* サマリーセクション */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>サマリー</Text>
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
        </View>

        {/* トレンドセクション */}
        {reportData.monthlyTrend && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>月間トレンド</Text>
            <TrendCard change={reportData.monthlyTrend.change} />
          </View>
        )}
      </View>

      {/* フッター */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>OpenReview - 月次分析レポート</Text>
        <Text style={styles.footerText}>このレポートは自動生成されました</Text>
      </View>
    </Page>
  </Document>
);

/**
 * PDFをBlobとして生成
 */
export const generatePDFBlob = async (report, reportData, storeName) => {
  const blob = await pdf(
    <PDFDocument
      report={report}
      reportData={reportData}
      storeName={storeName}
    />
  ).toBlob();
  return blob;
};

/**
 * PDFをダウンロード
 */
export const downloadPDF = async (report, reportData, storeName) => {
  const blob = await generatePDFBlob(report, reportData, storeName);
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
  generatePDFBlob,
  downloadPDF,
};
