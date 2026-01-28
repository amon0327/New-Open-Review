import React, { useState, useEffect, useRef } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { supabase } from '../../../lib/supabase';
import { Skeleton } from '../../ui/skeleton';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '../../ui/select';
import {
  FileText,
  Download,
  Eye,
  Calendar,
  Store,
  CheckCircle2,
  AlertCircle,
  Printer,
  ZoomIn,
  ZoomOut,
  RotateCw,
  X
} from 'lucide-react';

export default function PDFPage({ onNavCollapse, companyId }) {
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState('all');
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [zoom, setZoom] = useState(100);
  const previewRef = useRef(null);

  // 店舗データを取得
  useEffect(() => {
    const fetchStores = async () => {
      if (!companyId) return;

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) return;

        const response = await fetch(
          `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/get-monthly-analytics?company_id=${companyId}&store_id=all`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data?.allCompanyStores) {
            setStores(result.data.allCompanyStores);
          }
        }
      } catch (error) {
        console.error('店舗データの取得エラー:', error);
      }
    };

    fetchStores();
  }, [companyId]);

  // レポート一覧を取得
  useEffect(() => {
    const fetchReports = async () => {
      if (!companyId) return;
      setLoading(true);

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          setLoading(false);
          return;
        }

        const params = new URLSearchParams({
          company_id: companyId,
          store_id: selectedStore
        });

        const response = await fetch(
          `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/get-monthly-analytics?${params}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data?.availablePeriods) {
            const reportList = result.data.availablePeriods.map(period => ({
              yearMonth: period,
              displayName: period.replace('-', '年') + '月',
              hasData: true
            }));
            setReports(reportList);
          } else {
            setReports([]);
          }
        }
      } catch (error) {
        console.error('レポート一覧の取得エラー:', error);
        setReports([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [companyId, selectedStore]);

  // レポートデータを取得
  const fetchReportData = async (yearMonth) => {
    if (!companyId) return null;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return null;

      const params = new URLSearchParams({
        company_id: companyId,
        store_id: selectedStore,
        year_month: yearMonth
      });

      const response = await fetch(
        `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/get-monthly-analytics?${params}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          return result.data;
        }
      }
      return null;
    } catch (error) {
      console.error('レポートデータの取得エラー:', error);
      return null;
    }
  };

  // プレビュー表示
  const handlePreview = async (report) => {
    setSelectedReport(report);
    setGeneratingPDF(true);

    const data = await fetchReportData(report.yearMonth);
    setReportData(data);
    setPreviewMode(true);
    setGeneratingPDF(false);
  };

  // PDFダウンロード
  const handleDownload = async (report) => {
    setSelectedReport(report);
    setGeneratingPDF(true);

    const data = await fetchReportData(report.yearMonth);

    if (data) {
      // ブラウザの印刷機能を使用してPDFとして保存
      const printContent = generatePrintableHTML(data, report);
      const printWindow = window.open('', '_blank');
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();

      // 印刷ダイアログを表示（PDF保存用）
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }

    setGeneratingPDF(false);
  };

  // 印刷用HTMLを生成
  const generatePrintableHTML = (data, report) => {
    const storeName = selectedStore === 'all'
      ? '全店舗'
      : stores.find(s => s.id === selectedStore)?.name || '不明';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${report.displayName} レポート - ${storeName}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Noto Sans JP', sans-serif;
            padding: 40px;
            color: #1a202c;
            line-height: 1.6;
          }
          .header {
            text-align: center;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 3px solid #5e17eb;
          }
          .header h1 {
            font-size: 28px;
            color: #5e17eb;
            margin-bottom: 8px;
          }
          .header .subtitle {
            color: #64748b;
            font-size: 14px;
          }
          .section {
            margin-bottom: 32px;
          }
          .section-title {
            font-size: 18px;
            font-weight: 600;
            color: #1a202c;
            margin-bottom: 16px;
            padding-bottom: 8px;
            border-bottom: 2px solid #e2e8f0;
          }
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 16px;
            margin-bottom: 24px;
          }
          .stat-card {
            background: #f8fafc;
            padding: 20px;
            border-radius: 12px;
            text-align: center;
          }
          .stat-value {
            font-size: 32px;
            font-weight: 700;
            color: #5e17eb;
          }
          .stat-label {
            font-size: 12px;
            color: #64748b;
            margin-top: 4px;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            color: #94a3b8;
            font-size: 12px;
          }
          @media print {
            body {
              padding: 20px;
            }
            .no-print {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${report.displayName} 月次レポート</h1>
          <div class="subtitle">${storeName} | 作成日: ${new Date().toLocaleDateString('ja-JP')}</div>
        </div>

        <div class="section">
          <h2 class="section-title">サマリー</h2>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-value">${data.totalResponses || 0}</div>
              <div class="stat-label">総回答数</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${data.averageScore ? data.averageScore.toFixed(1) : '-'}</div>
              <div class="stat-label">平均スコア</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${data.responseRate ? data.responseRate.toFixed(1) + '%' : '-'}</div>
              <div class="stat-label">回答率</div>
            </div>
          </div>
        </div>

        ${data.monthlyTrend ? `
        <div class="section">
          <h2 class="section-title">月間トレンド</h2>
          <p>前月比: ${data.monthlyTrend.change > 0 ? '+' : ''}${data.monthlyTrend.change}%</p>
        </div>
        ` : ''}

        <div class="footer">
          <p>OpenReview - 月次分析レポート</p>
          <p>このレポートは自動生成されました</p>
        </div>
      </body>
      </html>
    `;
  };

  // 印刷
  const handlePrint = () => {
    if (previewRef.current) {
      window.print();
    }
  };

  // ズーム操作
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 50));
  const handleZoomReset = () => setZoom(100);

  // プレビューを閉じる
  const closePreview = () => {
    setPreviewMode(false);
    setSelectedReport(null);
    setReportData(null);
    setZoom(100);
  };

  // スケルトンスクリーン
  if (loading) {
    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#f8fafc' }}>
        <div className="p-6">
          <div className="mb-6 flex items-start justify-between">
            <div>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-10 w-44 rounded-md" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm">
                <Skeleton className="h-6 w-32 mb-4" />
                <Skeleton className="h-4 w-24 mb-6" />
                <div className="flex gap-2">
                  <Skeleton className="h-9 flex-1 rounded-lg" />
                  <Skeleton className="h-9 flex-1 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Box>
    );
  }

  // プレビューモード
  if (previewMode && selectedReport && reportData) {
    const storeName = selectedStore === 'all'
      ? '全店舗'
      : stores.find(s => s.id === selectedStore)?.name || '不明';

    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#1a202c' }}>
        {/* プレビューツールバー */}
        <div className="bg-gray-900 px-4 py-3 flex items-center justify-between border-b border-gray-700">
          <div className="flex items-center gap-4">
            <button
              onClick={closePreview}
              className="p-2 rounded-lg hover:bg-gray-800 text-gray-300 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="text-white font-medium">
              {selectedReport.displayName} レポート - {storeName}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleZoomOut}
              className="p-2 rounded-lg hover:bg-gray-800 text-gray-300 hover:text-white transition-colors"
              title="縮小"
            >
              <ZoomOut className="w-5 h-5" />
            </button>
            <span className="text-gray-400 text-sm min-w-[50px] text-center">{zoom}%</span>
            <button
              onClick={handleZoomIn}
              className="p-2 rounded-lg hover:bg-gray-800 text-gray-300 hover:text-white transition-colors"
              title="拡大"
            >
              <ZoomIn className="w-5 h-5" />
            </button>
            <button
              onClick={handleZoomReset}
              className="p-2 rounded-lg hover:bg-gray-800 text-gray-300 hover:text-white transition-colors"
              title="リセット"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <div className="w-px h-6 bg-gray-700 mx-2" />
            <button
              onClick={handlePrint}
              className="p-2 rounded-lg hover:bg-gray-800 text-gray-300 hover:text-white transition-colors"
              title="印刷"
            >
              <Printer className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleDownload(selectedReport)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              ダウンロード
            </button>
          </div>
        </div>

        {/* プレビューコンテンツ */}
        <div className="flex-1 overflow-auto p-8 flex justify-center">
          <div
            ref={previewRef}
            className="bg-white shadow-2xl rounded-lg"
            style={{
              width: `${595 * (zoom / 100)}px`,
              minHeight: `${842 * (zoom / 100)}px`,
              padding: `${40 * (zoom / 100)}px`,
              transform: 'origin-top',
            }}
          >
            {/* レポートヘッダー */}
            <div className="text-center mb-10 pb-5 border-b-4 border-purple-600">
              <h1 className="text-3xl font-bold text-purple-600 mb-2">
                {selectedReport.displayName} 月次レポート
              </h1>
              <p className="text-gray-500 text-sm">
                {storeName} | 作成日: {new Date().toLocaleDateString('ja-JP')}
              </p>
            </div>

            {/* サマリーセクション */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b-2 border-gray-200">
                サマリー
              </h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 p-5 rounded-xl text-center">
                  <div className="text-4xl font-bold text-purple-600">
                    {reportData.totalResponses || 0}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">総回答数</div>
                </div>
                <div className="bg-gray-50 p-5 rounded-xl text-center">
                  <div className="text-4xl font-bold text-purple-600">
                    {reportData.averageScore ? reportData.averageScore.toFixed(1) : '-'}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">平均スコア</div>
                </div>
                <div className="bg-gray-50 p-5 rounded-xl text-center">
                  <div className="text-4xl font-bold text-purple-600">
                    {reportData.responseRate ? `${reportData.responseRate.toFixed(1)}%` : '-'}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">回答率</div>
                </div>
              </div>
            </div>

            {/* トレンドセクション */}
            {reportData.monthlyTrend && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b-2 border-gray-200">
                  月間トレンド
                </h2>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-gray-700">
                    前月比:
                    <span className={`ml-2 font-semibold ${reportData.monthlyTrend.change > 0 ? 'text-green-600' : reportData.monthlyTrend.change < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                      {reportData.monthlyTrend.change > 0 ? '+' : ''}{reportData.monthlyTrend.change}%
                    </span>
                  </p>
                </div>
              </div>
            )}

            {/* フッター */}
            <div className="mt-auto pt-8 border-t border-gray-200 text-center text-gray-400 text-xs">
              <p>OpenReview - 月次分析レポート</p>
              <p>このレポートは自動生成されました</p>
            </div>
          </div>
        </div>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#f8fafc' }}>
      <div className="p-6">
        {/* ヘッダー */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-7 h-7 text-purple-600" />
              PDFレポート
            </h1>
            <p className="text-gray-500 mt-1">レポートをプレビュー・PDFダウンロードできます</p>
          </div>
          <Select value={selectedStore} onValueChange={setSelectedStore}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="店舗を選択" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>店舗選択</SelectLabel>
                <SelectItem value="all">全店舗</SelectItem>
                {stores.map((store) => (
                  <SelectItem key={store.id} value={store.id}>
                    {store.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        {/* レポート一覧 */}
        {reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <FileText className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">レポートがありません</h3>
            <p className="text-gray-500 text-sm">
              {selectedStore === 'all'
                ? 'この企業のレポートはまだ作成されていません'
                : 'この店舗のレポートはまだ作成されていません'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reports.map((report) => (
              <div
                key={report.yearMonth}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{report.displayName}</h3>
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <Store className="w-3.5 h-3.5" />
                        {selectedStore === 'all' ? '全店舗' : stores.find(s => s.id === selectedStore)?.name}
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                    <CheckCircle2 className="w-3 h-3" />
                    作成済み
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handlePreview(report)}
                    disabled={generatingPDF}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    {generatingPDF && selectedReport?.yearMonth === report.yearMonth ? (
                      <CircularProgress size={16} sx={{ color: '#64748b' }} />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                    プレビュー
                  </button>
                  <button
                    onClick={() => handleDownload(report)}
                    disabled={generatingPDF}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    {generatingPDF && selectedReport?.yearMonth === report.yearMonth ? (
                      <CircularProgress size={16} sx={{ color: 'white' }} />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    ダウンロード
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Box>
  );
}
