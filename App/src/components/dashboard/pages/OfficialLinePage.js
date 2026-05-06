import React, { useEffect, useState } from 'react';
import { Box, Tabs, Tab, Typography, Card, Alert, Skeleton, Tooltip } from '@mui/material';
import { Mail, FilterAlt, LocalOffer, AllInclusive, Info } from '@mui/icons-material';
import { fetchLineSettings, fetchLineQuota } from '../../../lib/lineMessaging';
import { usePartnerTheme } from '../../../contexts/PartnerThemeContext';
import MessagesTab from '../line/MessagesTab';
import SegmentsTab from '../line/SegmentsTab';
import CouponsTab from '../line/CouponsTab';
import { OfficialLineSkeleton } from '../line/LineSkeletons';

// 今月の送信可能残数 (枠なし)
function QuotaCard({ quota, loading, theme }) {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
        <Skeleton variant="text" width={140} height={16} />
        <Skeleton variant="text" width={120} height={32} />
      </Box>
    );
  }
  if (!quota || quota.enabled === false) return null;

  const isUnlimited = !!quota.unlimited;
  const tooltipText = isUnlimited
    ? '月ごとの送信上限は無制限です。'
    : `現在の月ごとの上限は ${(quota.limit ?? 0).toLocaleString()} 通です。`;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.25 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
        <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', letterSpacing: 0.5 }}>
          今月の送信可能数
        </Typography>
        <Tooltip title={tooltipText} arrow>
          <Info sx={{ fontSize: 14, color: '#94a3b8', cursor: 'help' }} />
        </Tooltip>
      </Box>
      {isUnlimited ? (
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75 }}>
          <AllInclusive sx={{ fontSize: 28, color: theme.primary }} />
          <Typography sx={{
            fontSize: '1.5rem', fontWeight: 700, color: theme.primary, lineHeight: 1.1,
          }}>
            無制限
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
          <Typography sx={{
            fontSize: '1.75rem', fontWeight: 800, color: theme.primary, lineHeight: 1.1,
          }}>
            {quota.remaining?.toLocaleString() ?? '-'}
          </Typography>
          <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>通</Typography>
        </Box>
      )}
    </Box>
  );
}

export default function OfficialLinePage({ companyId, user }) {
  const theme = usePartnerTheme();
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(false);

  // 子タブが「新規作成/編集」フォームに入っているかを保持
  // フォーム中は header / tabs を非表示にして「新しいページに遷移した」体験を出す
  const [inFormMode, setInFormMode] = useState(false);

  // LINE 月次送信枠
  const [quota, setQuota] = useState(null);
  const [quotaLoading, setQuotaLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!companyId) return;
      try {
        setLoading(true);
        const s = await fetchLineSettings(companyId);
        setEnabled(!!s?.line_messaging_enabled);
        if (s?.line_messaging_enabled) {
          setQuotaLoading(true);
          try {
            const q = await fetchLineQuota(companyId);
            setQuota(q);
          } catch (e) {
            // quota 取得失敗時は表示しない (連携自体は有効)
            setQuota(null);
          } finally {
            setQuotaLoading(false);
          }
        }
      } finally { setLoading(false); }
    };
    load();
  }, [companyId]);

  if (loading) {
    return <OfficialLineSkeleton />;
  }

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex', flexDirection: 'column',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
    }}>
      {!inFormMode && (
        <Box sx={{ p: 3, pb: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 2 }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#1a202c' }}>LINEメッセージ</Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                アンケート回答者にターゲットを絞ったメッセージやクーポンを配信
              </Typography>
            </Box>
            {/* 今月の送信枠表示 */}
            {enabled && (
              <QuotaCard quota={quota} loading={quotaLoading} theme={theme} />
            )}
          </Box>

          {!enabled && (
            <Alert severity="warning" sx={{ mt: 2, mb: 2, borderRadius: 1 }}>
              LINE 連携が未設定です。「設定」ページで Channel ID / Channel Secret / Channel Access Token を登録してください。
            </Alert>
          )}
        </Box>
      )}

      <Card sx={{
        mx: inFormMode ? 0 : 3,
        mb: inFormMode ? 0 : 3,
        mt: inFormMode ? 0 : 0,
        borderRadius: inFormMode ? 0 : 1,
        boxShadow: inFormMode ? 'none' : '0 10px 40px rgba(0, 0, 0, 0.08)',
        overflow: 'hidden', flex: 1,
        display: 'flex', flexDirection: 'column',
        background: inFormMode ? 'transparent' : '#fff',
      }}>
        {!inFormMode && (
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
        )}

        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {tab === 0 && <MessagesTab companyId={companyId} user={user} onFormModeChange={setInFormMode} />}
          {tab === 1 && <SegmentsTab companyId={companyId} onFormModeChange={setInFormMode} />}
          {tab === 2 && <CouponsTab companyId={companyId} onFormModeChange={setInFormMode} />}
        </Box>
      </Card>
    </Box>
  );
}
