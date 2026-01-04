import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Typography,
  Container,
  Button,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Badge,
  Skeleton
} from '@mui/material';
import {
  People,
  PersonAdd,
  Search,
  FilterList,
  ExpandMore,
  ExpandLess,
  Close,
  TrendingUp,
  Campaign
} from '@mui/icons-material';
import { supabase } from '../../../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button as ShadcnButton } from '../../ui/button';

export default function CRMPage({ companyId }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    gender: [],
    age: [],
    npsType: [],
    isRepeater: [],
    revisitIntent: [],
    isLineFriend: [],
    commentSearch: ''
  });
  const [tempFilters, setTempFilters] = useState({
    gender: [],
    age: [],
    npsType: [],
    isRepeater: [],
    revisitIntent: [],
    isLineFriend: [],
    commentSearch: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [sortByHighProbability, setSortByHighProbability] = useState(false);
  const itemsPerPage = 50;

  // 相対時間を計算する関数
  const getRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return '今日';
    } else if (diffDays === 1) {
      return '昨日';
    } else if (diffDays < 7) {
      return `${diffDays}日前`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks}週間前`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months}ヶ月前`;
    } else {
      const years = Math.floor(diffDays / 365);
      return `${years}年前`;
    }
  };

  // 来店可能性を計算する関数
  const calculateVisitProbability = (customer) => {
    let score = 0;
    
    // 推奨者なら高スコア
    if (customer.npsType === '推奨者') score += 30;
    else if (customer.npsType === '中立者') score += 15;
    
    // リピーターなら高スコア
    if (customer.isRepeater === 'リピーター') score += 25;
    
    // 再来店意向ありなら高スコア
    if (customer.revisitIntent === 'あり') score += 30;
    
    // LINE友だちなら高スコア
    if (customer.isLineFriend === 'あり') score += 15;
    
    return score >= 70; // 70点以上を高可能性とする
  };

  // アプローチ推奨を判定する関数
  const shouldApproach = (customer) => {
    const lastVisitDate = new Date(customer.lastVisit);
    const daysSinceLastVisit = Math.floor((new Date() - lastVisitDate) / (1000 * 60 * 60 * 24));
    
    // 批判者は必ずアプローチ
    if (customer.npsType === '批判者') return true;
    
    // リピーターで2週間以上来店していない
    if (customer.isRepeater === 'リピーター' && daysSinceLastVisit >= 14) return true;
    
    // 中立者で再来店意向あり
    if (customer.npsType === '中立者' && customer.revisitIntent === 'あり') return true;
    
    // 推奨者だがLINE友だちではない
    if (customer.npsType === '推奨者' && customer.isLineFriend === 'なし') return true;
    
    return false;
  };

  // UUIDを生成する関数
  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  // ダミーデータを生成
  const generateDummyCustomers = () => {
    const lastNames = ['佐藤', '鈴木', '高橋', '田中', '伊藤', '渡辺', '山本', '中村', '小林', '加藤', '吉田', '山田', '佐々木', '山口', '松本', '井上', '木村', '林', '斉藤', '清水'];
    const firstNames = ['太郎', '花子', '健太', '美咲', '大輔', '愛美', '拓也', '由美', '翔太', '麻衣', '雄大', '千穂', '慎一', '彩香', '隼人', '結衣', '健一', '理恵', '和也', '明日香'];
    const genders = ['男性', '女性', 'その他'];
    const ages = ['20代', '30代', '40代', '50代', '60代'];
    const npsTypes = ['推奨者', '中立者', '批判者'];
    const repeaterTypes = ['リピーター', '新規'];
    const revisitIntents = ['あり', 'なし'];
    
    const dummyCustomers = [];
    for (let i = 1; i <= 200; i++) {
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const customer = {
        id: i,
        name: `${lastName} ${firstName}`,
        email: `${generateUUID()}@openreview.app`,
        phone: `090-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
        gender: genders[Math.floor(Math.random() * genders.length)],
        age: ages[Math.floor(Math.random() * ages.length)],
        npsType: npsTypes[Math.floor(Math.random() * npsTypes.length)],
        isRepeater: repeaterTypes[Math.floor(Math.random() * repeaterTypes.length)],
        revisitIntent: revisitIntents[Math.floor(Math.random() * revisitIntents.length)],
        lastComment: `これはサンプルコメント${i}です。サービスの品質について...`,
        lastVisit: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        isLineFriend: Math.random() > 0.5 ? 'あり' : 'なし'
      };
      customer.highVisitProbability = calculateVisitProbability(customer);
      customer.shouldApproach = shouldApproach(customer);
      dummyCustomers.push(customer);
    }
    return dummyCustomers;
  };

  useEffect(() => {
    // ダミーデータをロード
    setTimeout(() => {
      setCustomers(generateDummyCustomers());
      setLoading(false);
    }, 1000);
  }, []);

  // フィルタリング処理
  let filteredCustomers = customers.filter(customer => {
    if (filters.gender.length > 0 && !filters.gender.includes(customer.gender)) return false;
    if (filters.age.length > 0 && !filters.age.includes(customer.age)) return false;
    if (filters.npsType.length > 0 && !filters.npsType.includes(customer.npsType)) return false;
    if (filters.isRepeater.length > 0 && !filters.isRepeater.includes(customer.isRepeater)) return false;
    if (filters.revisitIntent.length > 0 && !filters.revisitIntent.includes(customer.revisitIntent)) return false;
    if (filters.isLineFriend.length > 0 && !filters.isLineFriend.includes(customer.isLineFriend)) return false;
    if (filters.commentSearch) {
      const searchLower = filters.commentSearch.toLowerCase();
      return customer.name.toLowerCase().includes(searchLower) || 
             customer.email.toLowerCase().includes(searchLower) ||
             customer.lastComment.toLowerCase().includes(searchLower);
    }
    return true;
  });

  // 来店可能性高い順でソート
  if (sortByHighProbability) {
    filteredCustomers = [...filteredCustomers].sort((a, b) => {
      if (a.highVisitProbability && !b.highVisitProbability) return -1;
      if (!a.highVisitProbability && b.highVisitProbability) return 1;
      return 0;
    });
  }

  // ページネーション
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCustomers = filteredCustomers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);

  // フィルター変更処理
  const handleTempFilterChange = (filterName, value, isChecked) => {
    if (filterName === 'commentSearch') {
      setTempFilters(prev => ({ ...prev, commentSearch: value }));
    } else {
      setTempFilters(prev => {
        const currentValues = [...prev[filterName]];
        if (isChecked) {
          if (!currentValues.includes(value)) {
            currentValues.push(value);
          }
        } else {
          const index = currentValues.indexOf(value);
          if (index > -1) {
            currentValues.splice(index, 1);
          }
        }
        return { ...prev, [filterName]: currentValues };
      });
    }
  };

  const handleSearchChange = (value) => {
    setFilters(prev => ({ ...prev, commentSearch: value }));
    setTempFilters(prev => ({ ...prev, commentSearch: value }));
    setCurrentPage(1);
  };

  const applyFilters = () => {
    setFilters(tempFilters);
    setCurrentPage(1);
    setShowFilters(false);
  };

  const toggleFilters = () => {
    if (!showFilters) {
      setTempFilters(filters);
    }
    setShowFilters(!showFilters);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // NPSタイプのバッジ表示
  const getNPSBadge = (type) => {
    switch (type) {
      case "推奨者":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-bold text-white bg-gradient-to-r from-green-500 to-emerald-500">
            推奨者
          </span>
        );
      case "批判者":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-bold text-white bg-gradient-to-r from-red-500 to-red-400">
            批判者
          </span>
        );
      case "中立者":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-orange-400">
            中立者
          </span>
        );
      default:
        return <Badge>{type}</Badge>;
    }
  };

  // 性別の表示色
  const getGenderColor = (gender) => {
    switch (gender) {
      case "男性":
        return "text-blue-600";
      case "女性":
        return "text-pink-600";
      case "その他":
        return "text-purple-600";
      default:
        return "text-gray-600";
    }
  };

  // スケルトンスクリーン
  if (loading) {
    return (
      <div className="p-6 space-y-6">
        {/* ヘッダー */}
        <div className="flex items-center justify-between">
          <div>
            <Skeleton variant="text" width={200} height={40} />
            <Skeleton variant="text" width={150} height={24} />
          </div>
        </div>

        {/* テーブル */}
        <Card className="border-0 shadow-xl bg-white overflow-hidden">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Skeleton variant="text" width={250} height={28} />
              <div className="flex items-center gap-4">
                <Skeleton variant="rectangular" width={250} height={40} className="rounded-lg" />
                <Skeleton variant="rectangular" width={120} height={40} className="rounded-lg" />
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    {[180, 80, 80, 100, 100, 100, 100, 100].map((width, index) => (
                      <th key={index} className="px-6 py-3">
                        <Skeleton variant="text" width={width} height={20} />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {[...Array(10)].map((_, rowIndex) => (
                    <tr key={rowIndex}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div>
                            <Skeleton variant="text" width={120} height={20} />
                            <Skeleton variant="text" width={180} height={16} />
                          </div>
                          {rowIndex % 3 === 0 && (
                            <Skeleton variant="circular" width={20} height={20} />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Skeleton variant="text" width={40} height={20} />
                      </td>
                      <td className="px-6 py-4">
                        <Skeleton variant="text" width={40} height={20} />
                      </td>
                      <td className="px-6 py-4">
                        <Skeleton variant="rounded" width={60} height={24} />
                      </td>
                      <td className="px-6 py-4">
                        <Skeleton variant="rounded" width={80} height={24} />
                      </td>
                      <td className="px-6 py-4">
                        <Skeleton variant="rounded" width={50} height={24} />
                      </td>
                      <td className="px-6 py-4">
                        <Skeleton variant="text" width={60} height={20} />
                      </td>
                      <td className="px-6 py-4">
                        <Skeleton variant="rounded" width={80} height={24} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* ページネーション */}
        <div className="flex justify-between items-center">
          <Skeleton variant="text" width={200} height={20} />
          <div className="flex gap-2 items-center">
            <Skeleton variant="rectangular" width={80} height={40} className="rounded" />
            <div className="flex gap-1">
              {[...Array(5)].map((_, index) => (
                <Skeleton key={index} variant="rectangular" width={40} height={40} className="rounded" />
              ))}
            </div>
            <Skeleton variant="rectangular" width={80} height={40} className="rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <People className="text-purple-600" />
            顧客管理 (CRM)
          </h1>
          <p className="text-gray-600 mt-1">顧客情報を一元管理</p>
        </div>
      </div>

      {/* テーブル */}
      <Card className="border-0 shadow-xl bg-white overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span>顧客リスト</span>
              <span className="text-sm font-normal text-gray-600">
                {filteredCustomers.length} 件の結果
              </span>
              <label className="flex items-center gap-2 ml-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sortByHighProbability}
                  onChange={(e) => setSortByHighProbability(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700">来店可能性高い順で表示</span>
              </label>
            </div>
            <div className="flex items-center gap-4">
              {/* 検索ボックス */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="顧客名、メール、コメントを検索..."
                  value={filters.commentSearch}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-64 px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                />
                {filters.commentSearch && (
                  <button
                    onClick={() => handleSearchChange('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <Close className="w-4 h-4" />
                  </button>
                )}
              </div>
              {/* フィルター開閉ボタン */}
              <ShadcnButton
                variant="outline"
                size="sm"
                onClick={toggleFilters}
                className={`flex items-center gap-2 ${showFilters ? 'bg-purple-50 border-purple-300' : ''}`}
              >
                <FilterList className="w-4 h-4" />
                フィルター
                {Object.entries(filters).filter(([key, value]) => 
                  key === 'commentSearch' ? value !== '' : value.length > 0
                ).length > 0 && (
                  <span className="ml-1 px-2 py-0.5 text-xs bg-purple-500 text-white rounded-full">
                    {Object.entries(filters).filter(([key, value]) => 
                      key === 'commentSearch' ? value !== '' : value.length > 0
                    ).length}
                  </span>
                )}
              </ShadcnButton>
            </div>
          </CardTitle>

          {/* フィルターセクション */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="space-y-4">
                {/* 性別フィルター */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">性別</p>
                  <div className="flex flex-wrap gap-3">
                    {['男性', '女性', 'その他'].map(gender => (
                      <label key={gender} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={tempFilters.gender.includes(gender)}
                          onChange={(e) => handleTempFilterChange('gender', gender, e.target.checked)}
                          className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                        />
                        <span className="text-sm text-gray-700">{gender}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* 年齢フィルター */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">年齢</p>
                  <div className="flex flex-wrap gap-3">
                    {['20代', '30代', '40代', '50代', '60代'].map(age => (
                      <label key={age} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={tempFilters.age.includes(age)}
                          onChange={(e) => handleTempFilterChange('age', age, e.target.checked)}
                          className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                        />
                        <span className="text-sm text-gray-700">{age}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* 推奨度フィルター */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">推奨度</p>
                  <div className="flex flex-wrap gap-3">
                    {['推奨者', '中立者', '批判者'].map(nps => (
                      <label key={nps} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={tempFilters.npsType.includes(nps)}
                          onChange={(e) => handleTempFilterChange('npsType', nps, e.target.checked)}
                          className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                        />
                        <span className="text-sm text-gray-700">{nps}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* リピーター・再来店意向 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* リピーター */}
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">リピーター</p>
                    <div className="space-y-2">
                      {['リピーター', '新規'].map(status => (
                        <label key={status} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={tempFilters.isRepeater.includes(status)}
                            onChange={(e) => handleTempFilterChange('isRepeater', status, e.target.checked)}
                            className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                          />
                          <span className="text-sm text-gray-700">{status}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* 再来店意向 */}
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">再来店意向</p>
                    <div className="space-y-2">
                      {['あり', 'なし'].map(intent => (
                        <label key={intent} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={tempFilters.revisitIntent.includes(intent)}
                            onChange={(e) => handleTempFilterChange('revisitIntent', intent, e.target.checked)}
                            className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                          />
                          <span className="text-sm text-gray-700">{intent}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* LINE友だち */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">LINE友だち</p>
                  <div className="space-y-2">
                    {['あり', 'なし'].map(status => (
                      <label key={status} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={tempFilters.isLineFriend.includes(status)}
                          onChange={(e) => handleTempFilterChange('isLineFriend', status, e.target.checked)}
                          className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                        />
                        <span className="text-sm text-gray-700">{status === 'あり' ? 'LINE友だち' : '未登録'}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* フィルター適用ボタン */}
                <div className="flex justify-end pt-4 border-t">
                  <ShadcnButton
                    variant="default"
                    onClick={applyFilters}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
                  >
                    フィルターを適用
                  </ShadcnButton>
                </div>
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    顧客名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    性別
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    年齢
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    推奨度
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    リピーター
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    再来店意向
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    最終来店
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    LINE友だち
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                          <div className="text-xs text-gray-500">{customer.email}</div>
                        </div>
                        <div className="flex items-center gap-1">
                          {customer.highVisitProbability && (
                            <div className="relative group">
                              <TrendingUp className="w-5 h-5 text-green-500" />
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                                来店可能性高
                              </div>
                            </div>
                          )}
                          {customer.shouldApproach && (
                            <div className="relative group">
                              <Campaign className="w-5 h-5 text-orange-500" />
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                                アプローチ推奨
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${getGenderColor(customer.gender)}`}>
                        {customer.gender}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {customer.age}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getNPSBadge(customer.npsType)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        customer.isRepeater === 'リピーター' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {customer.isRepeater}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        customer.revisitIntent === 'あり' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {customer.revisitIntent}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getRelativeTime(customer.lastVisit)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        customer.isLineFriend === 'あり' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {customer.isLineFriend === 'あり' ? 'LINE友だち' : '未登録'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ページネーション */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">
          全 {filteredCustomers.length} 件中 {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredCustomers.length)} 件を表示
        </p>
        <div className="flex gap-2 items-center">
          <ShadcnButton
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1"
          >
            <ExpandMore className="w-4 h-4 rotate-90" />
            前へ
          </ShadcnButton>
          
          <div className="flex gap-1">
            {[...Array(totalPages)].map((_, index) => {
              const page = index + 1;
              if (
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 1 && page <= currentPage + 1)
              ) {
                return (
                  <ShadcnButton
                    key={page}
                    variant={page === currentPage ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(page)}
                    className={`w-10 h-10 p-0 ${
                      page === currentPage
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white'
                        : ''
                    }`}
                  >
                    {page}
                  </ShadcnButton>
                );
              } else if (
                (page === currentPage - 2 && page > 1) ||
                (page === currentPage + 2 && page < totalPages)
              ) {
                return (
                  <span key={page} className="px-2 text-gray-400">
                    ...
                  </span>
                );
              }
              return null;
            })}
          </div>
          
          <ShadcnButton
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1"
          >
            次へ
            <ExpandLess className="w-4 h-4 rotate-90" />
          </ShadcnButton>
        </div>
      </div>
    </div>
  );
}