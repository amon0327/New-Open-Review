import React, { useState, useEffect } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { PDFViewer } from '@react-pdf/renderer';
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
  X
} from 'lucide-react';

// PDFテンプレートコンポーネントをインポート
import { PDFDocument, downloadPDF } from './pdf/PDFTemplate';

export default function PDFPage({ onNavCollapse, companyId }) {
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState('all');
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [reportData, setReportData] = useState(null);

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

    try {
      const data = await fetchReportData(report.yearMonth);
      if (data) {
        const storeName = getStoreName();
        await downloadPDF(report, data, storeName);
      }
    } catch (error) {
      console.error('PDF生成エラー:', error);
    }

    setGeneratingPDF(false);
  };

  // プレビューを閉じる
  const closePreview = () => {
    setPreviewMode(false);
    setSelectedReport(null);
    setReportData(null);
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
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleDownload(selectedReport)}
              disabled={generatingPDF}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {generatingPDF ? (
                <CircularProgress size={16} sx={{ color: 'white' }} />
              ) : (
                <Download className="w-4 h-4" />
              )}
              ダウンロード
            </button>
          </div>
        </div>

        {/* PDFプレビュー - react-pdf PDFViewer */}
        <div className="flex-1 overflow-hidden">
          <PDFViewer
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
            }}
            showToolbar={true}
          >
            <PDFDocument
              report={selectedReport}
              reportData={reportData}
              storeName={storeName}
            />
          </PDFViewer>
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
                        {getStoreName()}
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
