import React, { useEffect, useState } from 'react';
import { Box, Tabs, Tab, Typography, Card, Alert, CircularProgress } from '@mui/material';
import { Mail, FilterAlt, LocalOffer, Chat as ChatIcon } from '@mui/icons-material';
import { fetchLineSettings } from '../../../lib/lineMessaging';
import { usePartnerTheme } from '../../../contexts/PartnerThemeContext';
import MessagesTab from '../line/MessagesTab';
import SegmentsTab from '../line/SegmentsTab';
import CouponsTab from '../line/CouponsTab';

export default function OfficialLinePage({ companyId, user }) {
  const theme = usePartnerTheme();
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!companyId) return;
      try {
        setLoading(true);
        const s = await fetchLineSettings(companyId);
        setEnabled(!!s?.line_messaging_enabled);
      } finally { setLoading(false); }
    };
    load();
  }, [companyId]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress sx={{ color: theme.primary }} />
      </Box>
    );
  }

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex', flexDirection: 'column',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
    }}>
      <Box sx={{ p: 3, pb: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Box sx={{
            width: 48, height: 48, borderRadius: 1,
            background: theme.primaryGradient || theme.primary,
            display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 2,
          }}>
            <ChatIcon sx={{ color: 'white', fontSize: 28 }} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#1a202c' }}>公式LINE</Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              アンケート回答者にターゲットを絞ったメッセージやクーポンを配信
            </Typography>
          </Box>
        </Box>

        {!enabled && (
          <Alert severity="warning" sx={{ mt: 2, mb: 2, borderRadius: 1 }}>
            LINE 連携が未設定です。「設定」ページで Channel ID / Channel Secret / Channel Access Token を登録してください。メッセージの作成はできますが、送信はできません。
          </Alert>
        )}
      </Box>

      <Card sx={{
        mx: 3, mb: 3,
        borderRadius: 1,
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.08)',
        overflow: 'hidden', flex: 1,
        display: 'flex', flexDirection: 'column',
      }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}
          sx={{
            borderBottom: '1px solid #e2e8f0',
            '& .MuiTab-root': {
              textTransform: 'none', fontWeight: 600, fontSize: '1rem', minHeight: 60,
              '&.Mui-selected': { color: theme.primary },
            },
            '& .MuiTabs-indicator': { backgroundColor: theme.primary, height: 3 },
          }}
        >
          <Tab icon={<Mail />} iconPosition="start" label="メッセージ作成" />
          <Tab icon={<FilterAlt />} iconPosition="start" label="ターゲット設定" />
          <Tab icon={<LocalOffer />} iconPosition="start" label="クーポン作成" />
        </Tabs>

        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {tab === 0 && <MessagesTab companyId={companyId} user={user} />}
          {tab === 1 && <SegmentsTab companyId={companyId} />}
          {tab === 2 && <CouponsTab companyId={companyId} />}
        </Box>
      </Card>
    </Box>
  );
}
