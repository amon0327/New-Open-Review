import React, { useEffect, useState } from 'react';
import { Box, Tabs, Tab, Typography, Card, Alert, Button, CircularProgress } from '@mui/material';
import { Mail, FilterAlt, LocalOffer, Chat as ChatIcon, OpenInNew } from '@mui/icons-material';
import { fetchLineSettings } from '../../../lib/lineMessaging';
import MessagesTab from '../line/MessagesTab';
import SegmentsTab from '../line/SegmentsTab';
import CouponsTab from '../line/CouponsTab';

export default function OfficialLinePage({ companyId, user }) {
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
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><CircularProgress /></Box>;
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc' }}>
      <Box sx={{ p: 3, pb: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <ChatIcon sx={{ color: '#06C755', mr: 1.5, fontSize: 32 }} />
          <Typography variant="h5" sx={{ fontWeight: 700, flex: 1 }}>公式LINE</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          LINE 公式アカウントを通じて、アンケート回答者にターゲットを絞ったメッセージやクーポンを配信できます。
        </Typography>

        {!enabled && (
          <Alert severity="warning" sx={{ mb: 2 }}
            action={
              <Button color="inherit" size="small" endIcon={<OpenInNew />}
                onClick={() => alert('左メニューの「設定」→「LINE 公式アカウント連携」から認証情報を登録してください。')}>
                設定方法
              </Button>
            }
          >
            LINE 連携が未設定です。まず「設定」ページで Channel ID / Channel Secret / Channel Access Token を登録してください。メッセージの作成はできますが、送信はできません。
          </Alert>
        )}
      </Box>

      <Card sx={{ mx: 3, mb: 3, borderRadius: 3, overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}
          sx={{
            borderBottom: '1px solid #e2e8f0',
            '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, minHeight: 60 },
            '& .Mui-selected': { color: '#06C755' },
            '& .MuiTabs-indicator': { backgroundColor: '#06C755', height: 3 },
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
