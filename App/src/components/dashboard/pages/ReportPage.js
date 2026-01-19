import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import { supabase } from '../../../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
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
  Calendar,
  TrendingUp,
  Users,
  Store,
  ChevronRight,
  BarChart3
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-xl p-5 shadow-sm">
                <Skeleton className="h-5 w-24 mb-3" />
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-3 w-20" />
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reports.map((report) => (
              <Card
                key={report.yearMonth}
                className="border-0 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group bg-white"
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-semibold flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-purple-600" />
                      {report.displayName}
                    </span>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <BarChart3 className="w-4 h-4" />
                      概要
                    </span>
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" />
                      売上影響
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      顧客傾向
                    </span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <span className="text-xs text-gray-400">
                      {selectedStore === 'all' ? '全店舗データ' : stores.find(s => s.id === selectedStore)?.name}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Box>
  );
}
