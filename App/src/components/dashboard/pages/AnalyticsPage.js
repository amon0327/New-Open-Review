import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Typography,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import {
  Comment,
  Store,
  LocationCity,
  TrendingUp,
  TrendingDown,
  TrendingFlat
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
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

// 5点移動平均を計算する関数
const calculateMovingAverage = (data, windowSize = 5) => {
  return data.map((item, index) => {
    if (index < windowSize - 1) {
      // 最初のwindowSize-1個は十分なデータがないのでnull
      return { ...item, movingAverage: null };
    }
    const sum = data
      .slice(index - windowSize + 1, index + 1)
      .reduce((acc, curr) => acc + curr.nps, 0);
    return { ...item, movingAverage: Math.round(sum / windowSize) };
  });
};

// 店舗別タブの内容
const StoreByStoreTab = ({ companyId }) => {
  return (
    <Box sx={{ 
      p: 3,
      backgroundColor: '#ffffff',
      minHeight: '100%'
    }}>
      {/* 白いページを表示 */}
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
