import React, { useState, useEffect } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Typography,
  FormControl,
  Select,
  MenuItem,
  InputLabel
} from '@mui/material';
import {
  Comment,
  Store,
  LocationCity
} from '@mui/icons-material';
import { supabase } from '../../../lib/supabase';

// タブパネルコンポーネント
const TabPanel = ({ children, value, index, ...other }) => (
  <Box
    role="tabpanel"
    hidden={value !== index}
    id={`analytics-tabpanel-${index}`}
    aria-labelledby={`analytics-tab-${index}`}
    sx={{ height: '100%', overflow: 'auto' }}
    {...other}
  >
    {value === index && children}
  </Box>
);

// 全店舗タブの内容
const AllStoresTab = () => (
  <Box sx={{ p: 3 }}>
    <Typography variant="h6" sx={{ color: '#64748b' }}>
      全店舗機能は開発中です
    </Typography>
  </Box>
);

// 店舗別タブの内容
const StoreByStoreTab = ({ companyId }) => {
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState('');
  const [selectedQSC, setSelectedQSC] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // QSCオプション
  const qscOptions = [
    { value: 'quality', label: 'Quality（品質）' },
    { value: 'service', label: 'Service（サービス）' },
    { value: 'cleanliness', label: 'Cleanliness（清潔さ）' }
  ];

  // 店舗データを取得
  useEffect(() => {
    const fetchStores = async () => {
      if (!companyId) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('stores')
          .select('id, name')
          .eq('company_id', companyId)
          .order('name');

        if (error) throw error;
        setStores(data || []);
      } catch (error) {
        console.error('Error fetching stores:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStores();
  }, [companyId]);

  return (
    <Box sx={{ p: 3 }}>
      {/* ドロップダウンエリア */}
      <Box sx={{
        display: 'flex',
        gap: 2,
        mb: 3,
        flexWrap: 'wrap'
      }}>
        {/* 店舗選択ドロップダウン */}
        <FormControl sx={{ minWidth: 200 }} size="small">
          <InputLabel>店舗を選択</InputLabel>
          <Select
            value={selectedStore}
            label="店舗を選択"
            onChange={(e) => setSelectedStore(e.target.value)}
            disabled={isLoading}
          >
            <MenuItem value="">
              <em>すべての店舗</em>
            </MenuItem>
            {stores.map((store) => (
              <MenuItem key={store.id} value={store.id}>
                {store.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* QSC選択ドロップダウン */}
        <FormControl sx={{ minWidth: 200 }} size="small">
          <InputLabel>QSCを選択</InputLabel>
          <Select
            value={selectedQSC}
            label="QSCを選択"
            onChange={(e) => setSelectedQSC(e.target.value)}
          >
            <MenuItem value="">
              <em>すべて</em>
            </MenuItem>
            {qscOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* コンテンツエリア（今後開発） */}
      <Box sx={{
        p: 4,
        backgroundColor: '#f8fafc',
        borderRadius: 2,
        textAlign: 'center'
      }}>
        <Typography variant="body1" sx={{ color: '#64748b' }}>
          {selectedStore || selectedQSC
            ? `選択中: ${stores.find(s => s.id === selectedStore)?.name || 'すべての店舗'} / ${qscOptions.find(q => q.value === selectedQSC)?.label || 'すべてのQSC'}`
            : '店舗とQSCを選択してください'}
        </Typography>
      </Box>
    </Box>
  );
};

// リアルタイムタブの内容
const RealtimeTab = () => (
  <Box sx={{ p: 3 }}>
    <Typography variant="h6" sx={{ color: '#64748b' }}>
      リアルタイム機能は開発中です
    </Typography>
  </Box>
);

export default function AnalyticsPage({ onNavCollapse, companyId }) {
  const [activeTab, setActiveTab] = useState(0);

  // マウント時にサイドバーを縮める
  useEffect(() => {
    if (onNavCollapse) {
      onNavCollapse(true);
    }
    return () => {
      if (onNavCollapse) {
        onNavCollapse(false);
      }
    };
  }, [onNavCollapse]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{
      width: '100%',
      height: '100%',
      backgroundColor: '#fff',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* タブヘッダー */}
      <Box sx={{
        borderBottom: '1px solid #e2e8f0',
        backgroundColor: '#fff'
      }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          sx={{
            minHeight: 56,
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.95rem',
              minHeight: 56,
              px: 3,
              color: '#64748b',
              '&.Mui-selected': {
                color: '#5e17eb'
              }
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#5e17eb',
              height: 3
            }
          }}
        >
          <Tab
            icon={<LocationCity sx={{ fontSize: 20 }} />}
            iconPosition="start"
            label="全店舗"
          />
          <Tab
            icon={<Store sx={{ fontSize: 20 }} />}
            iconPosition="start"
            label="店舗別"
          />
          <Tab
            icon={<Comment sx={{ fontSize: 20 }} />}
            iconPosition="start"
            label="リアルタイム"
          />
        </Tabs>
      </Box>

      {/* タブコンテンツ */}
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        <TabPanel value={activeTab} index={0}>
          <AllStoresTab />
        </TabPanel>
        <TabPanel value={activeTab} index={1}>
          <StoreByStoreTab companyId={companyId} />
        </TabPanel>
        <TabPanel value={activeTab} index={2}>
          <RealtimeTab />
        </TabPanel>
      </Box>
    </Box>
  );
}
