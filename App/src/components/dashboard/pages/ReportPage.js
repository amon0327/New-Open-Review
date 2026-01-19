import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../ui/table';
import {
  FileText,
  Calendar,
  ChevronRight,
  CheckCircle2
} from 'lucide-react';

export default function ReportPage({ onNavCollapse, companyId }) {
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState('all');
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

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

        // Edge Function経由でレポート一覧を取得
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
            // 利用可能な期間からレポート一覧を作成
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

  // スケルトンスクリーン
  if (loading) {
    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#f8fafc' }}>
        <div className="p-6">
          <div className="mb-6">
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="mb-6">
            <Skeleton className="h-10 w-44 rounded-md" />
          </div>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="border-b border-gray-100">
              <div className="flex items-center px-6 py-4">
                <Skeleton className="h-4 w-24 mr-auto" />
                <Skeleton className="h-4 w-20 mx-8" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex items-center px-6 py-4 border-b border-gray-50">
                <Skeleton className="h-5 w-32 mr-auto" />
                <Skeleton className="h-6 w-16 rounded-full mx-8" />
                <Skeleton className="h-5 w-5" />
              </div>
            ))}
          </div>
        </div>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#f8fafc' }}>
      <div className="p-6">
        {/* ヘッダー */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-7 h-7 text-purple-600" />
            月次レポート
          </h1>
          <p className="text-gray-500 mt-1">月別の分析レポートを確認できます</p>
        </div>

        {/* フィルター */}
        <div className="mb-6 flex gap-3 items-center">
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
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/50">
                  <TableHead className="font-semibold text-gray-700">レポート期間</TableHead>
                  <TableHead className="font-semibold text-gray-700">対象店舗</TableHead>
                  <TableHead className="font-semibold text-gray-700">ステータス</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow
                    key={report.yearMonth}
                    className="cursor-pointer hover:bg-gray-50 transition-colors group"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-purple-600" />
                        </div>
                        <span className="font-medium text-gray-900">{report.displayName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-gray-600">
                        {selectedStore === 'all' ? '全店舗' : stores.find(s => s.id === selectedStore)?.name}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        作成済み
                      </span>
                    </TableCell>
                    <TableCell>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </Box>
  );
}
