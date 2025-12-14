import React, { useState, useEffect } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Typography
} from '@mui/material';
import {
  Comment,
  Assessment,
  CompareArrows
} from '@mui/icons-material';

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

// 比較データタブの内容
const CompareDataTab = () => (
  <Box sx={{ p: 3 }}>
    <Typography variant="h6" sx={{ color: '#64748b' }}>
      比較データ機能は開発中です
    </Typography>
  </Box>
);

// 分析レポートタブの内容
const AnalysisReportTab = () => (
  <Box sx={{ p: 3 }}>
    <Typography variant="h6" sx={{ color: '#64748b' }}>
      分析レポート機能は開発中です
    </Typography>
  </Box>
);

// コメントタブの内容
const CommentTab = () => (
  <Box sx={{ p: 3 }}>
    <Typography variant="h6" sx={{ color: '#64748b' }}>
      コメント機能は開発中です
    </Typography>
  </Box>
);

export default function AnalyticsPage({ onNavCollapse }) {
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
            icon={<CompareArrows sx={{ fontSize: 20 }} />}
            iconPosition="start"
            label="比較データ"
          />
          <Tab
            icon={<Assessment sx={{ fontSize: 20 }} />}
            iconPosition="start"
            label="分析レポート"
          />
          <Tab
            icon={<Comment sx={{ fontSize: 20 }} />}
            iconPosition="start"
            label="コメント"
          />
        </Tabs>
      </Box>

      {/* タブコンテンツ */}
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        <TabPanel value={activeTab} index={0}>
          <CompareDataTab />
        </TabPanel>
        <TabPanel value={activeTab} index={1}>
          <AnalysisReportTab />
        </TabPanel>
        <TabPanel value={activeTab} index={2}>
          <CommentTab />
        </TabPanel>
      </Box>
    </Box>
  );
}
