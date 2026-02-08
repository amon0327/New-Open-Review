import React, { useState, useEffect } from 'react';
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
  X,
  RefreshCw
} from 'lucide-react';

// PDFテンプレートコンポーネントをインポート
import { PDFDocument, downloadPDF, generatePDFBlob } from './pdf/PDFTemplate';

export default function PDFPage({ onNavCollapse, companyId, companyName = '' }) {
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState('all');
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState(null);

  // 店舗名を取得するヘルパー関数
  const getStoreName = () => {
    return selectedStore === 'all'
      ? '全店舗'
      : stores.find(s => s.id === selectedStore)?.name || '不明';
  };

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

  // PDF Blobを生成してURLを作成
  const generatePdfUrl = async (report, data, storeName) => {
    setPdfLoading(true);
    setPdfError(null);

    try {
      const blob = await generatePDFBlob(report, data, storeName, companyName);
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (error) {
      console.error('PDF生成エラー:', error);
      setPdfError(error.message || 'PDF生成に失敗しました');
    } finally {
      setPdfLoading(false);
    }
  };

  // プレビュー表示
  const handlePreview = async (report) => {
    setSelectedReport(report);
    setPreviewLoading(true);
    setPdfUrl(null);
    setPdfError(null);

    const data = await fetchReportData(report.yearMonth);
    setReportData(data);

    if (data) {
      const storeName = getStoreName();
      await generatePdfUrl(report, data, storeName);
    }

    setPreviewMode(true);
    setPreviewLoading(false);
  };

  // PDFダウンロード
  const handleDownload = async (report) => {
    setSelectedReport(report);
    setDownloadLoading(true);

    try {
      const data = reportData || await fetchReportData(report.yearMonth);
      if (data) {
        const storeName = getStoreName();
        await downloadPDF(report, data, storeName, companyName);
      }
    } catch (error) {
      console.error('PDF生成エラー:', error);
    }

    setDownloadLoading(false);
  };

  // プレビューを閉じる
  const closePreview = () => {
    // 古いURLを解放
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
    }
    setPreviewMode(false);
    setSelectedReport(null);
    setReportData(null);
    setPdfUrl(null);
    setPdfError(null);
  };

  // 再試行
  const retryGeneratePdf = async () => {
    if (selectedReport && reportData) {
      const storeName = getStoreName();
      await generatePdfUrl(selectedReport, reportData, storeName);
    }
  };

  // コンポーネントのクリーンアップ
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

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
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-3 flex gap-6">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16 ml-auto" />
            </div>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="px-6 py-4 flex items-center gap-6 border-b border-gray-50">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-lg" />
                  <Skeleton className="h-5 w-24" />
                </div>
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-16 rounded-full" />
                <div className="flex gap-2 ml-auto">
                  <Skeleton className="h-8 w-24 rounded-lg" />
                  <Skeleton className="h-8 w-28 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Box>
    );
  }

  // プレビューモード
  if (previewMode && selectedReport) {
    const storeName = getStoreName();

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
            <div className="flex items-center gap-3">
              <span className="text-white font-medium">
                {selectedReport.displayName} レポート - {storeName}
              </span>
              <span className="px-2 py-0.5 bg-gray-700 text-gray-300 text-xs rounded">
                A4
              </span>
            </div>
          </div>
          {pdfLoading && (
            <span className="text-gray-400 text-sm flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              生成中...
            </span>
          )}
        </div>

        {/* PDFプレビュー */}
        <div className="flex-1 overflow-hidden bg-gray-800 flex items-center justify-center">
          {pdfLoading ? (
            <div className="flex flex-col items-center gap-4">
              <CircularProgress size={48} sx={{ color: '#a855f7' }} />
              <span className="text-gray-400">PDFを生成中...</span>
            </div>
          ) : pdfError ? (
            <div className="flex flex-col items-center gap-4 text-center p-8">
              <div className="w-16 h-16 rounded-full bg-red-900/30 flex items-center justify-center">
                <X className="w-8 h-8 text-red-400" />
              </div>
              <div>
                <p className="text-white font-medium mb-2">PDF生成エラー</p>
                <p className="text-gray-400 text-sm">{pdfError}</p>
              </div>
              <button
                onClick={retryGeneratePdf}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                再試行
              </button>
            </div>
          ) : pdfUrl ? (
            <iframe
              src={pdfUrl}
              title="PDF Preview"
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
              }}
            />
          ) : !reportData ? (
            <div className="flex flex-col items-center gap-4 text-center p-8">
              <FileText className="w-16 h-16 text-gray-600" />
              <p className="text-gray-400">データがありません</p>
            </div>
          ) : null}
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
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">期間</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">店舗</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">ステータス</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report, index) => (
                  <tr
                    key={report.yearMonth}
                    className={`hover:bg-gray-50 transition-colors ${index !== reports.length - 1 ? 'border-b border-gray-100' : ''}`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                          <Calendar className="w-4.5 h-4.5 text-purple-600" />
                        </div>
                        <span className="font-medium text-gray-900">{report.displayName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600 flex items-center gap-1.5">
                        <Store className="w-3.5 h-3.5 text-gray-400" />
                        {getStoreName()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        <CheckCircle2 className="w-3 h-3" />
                        作成済み
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handlePreview(report)}
                          disabled={previewLoading || downloadLoading}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors disabled:opacity-50"
                        >
                          {previewLoading && selectedReport?.yearMonth === report.yearMonth ? (
                            <CircularProgress size={14} sx={{ color: '#64748b' }} />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                          プレビュー
                        </button>
                        <button
                          onClick={() => handleDownload(report)}
                          disabled={previewLoading || downloadLoading}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                        >
                          {downloadLoading && selectedReport?.yearMonth === report.yearMonth ? (
                            <CircularProgress size={14} sx={{ color: 'white' }} />
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                          ダウンロード
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Box>
  );
}
