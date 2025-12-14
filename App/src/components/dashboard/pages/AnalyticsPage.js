import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  ButtonBase
} from '@mui/material';
import {
  Comment,
  Assessment
} from '@mui/icons-material';
import { motion } from 'framer-motion';

// タブ定義
const tabs = [
  { id: 'comment', label: 'コメント', icon: Comment },
  { id: 'report', label: 'レポート', icon: Assessment }
];

// タブパネルコンポーネント
const TabPanel = ({ children, value, index }) => (
  <Box
    role="tabpanel"
    hidden={value !== index}
    sx={{ height: '100%', overflow: 'auto' }}
  >
    {value === index && children}
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

// レポートタブの内容
const ReportTab = () => (
  <Box sx={{ p: 3 }}>
    <Typography variant="h6" sx={{ color: '#64748b' }}>
      レポート機能は開発中です
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

  return (
    <Box sx={{
      width: '100%',
      height: '100%',
      backgroundColor: '#f8fafc',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* タブヘッダー */}
      <Box sx={{
        px: 3,
        py: 2,
        backgroundColor: '#fff',
        borderBottom: '1px solid #e2e8f0'
      }}>
        {/* モダンなピルスタイルタブ */}
        <Box sx={{
          display: 'inline-flex',
          backgroundColor: '#f1f5f9',
          borderRadius: '12px',
          p: 0.5,
          gap: 0.5
        }}>
          {tabs.map((tab, index) => {
            const Icon = tab.icon;
            const isActive = activeTab === index;

            return (
              <ButtonBase
                key={tab.id}
                onClick={() => setActiveTab(index)}
                sx={{
                  position: 'relative',
                  px: 2.5,
                  py: 1.25,
                  borderRadius: '10px',
                  transition: 'all 0.2s ease',
                  overflow: 'hidden'
                }}
              >
                {/* アクティブ時の背景 */}
                {isActive && (
                  <motion.div
                    layoutId="activeTabBg"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundColor: '#fff',
                      borderRadius: '10px',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)'
                    }}
                  />
                )}

                {/* タブコンテンツ */}
                <Box sx={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  zIndex: 1
                }}>
                  <Icon sx={{
                    fontSize: 18,
                    color: isActive ? '#5e17eb' : '#64748b',
                    transition: 'color 0.2s ease'
                  }} />
                  <Typography sx={{
                    fontSize: '0.875rem',
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? '#1e293b' : '#64748b',
                    transition: 'all 0.2s ease'
                  }}>
                    {tab.label}
                  </Typography>
                </Box>
              </ButtonBase>
            );
          })}
        </Box>
      </Box>

      {/* タブコンテンツ */}
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        <TabPanel value={activeTab} index={0}>
          <CommentTab />
        </TabPanel>
        <TabPanel value={activeTab} index={1}>
          <ReportTab />
        </TabPanel>
      </Box>
    </Box>
  );
}
