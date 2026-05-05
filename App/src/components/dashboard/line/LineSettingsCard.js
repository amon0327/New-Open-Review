import React, { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, TextField, Button, Alert, Chip, CircularProgress,
} from '@mui/material';
import { Chat as ChatIcon, CheckCircle, Visibility, VisibilityOff } from '@mui/icons-material';
import toast from 'react-hot-toast';
import { fetchLineSettings, updateLineCredentials } from '../../../lib/lineMessaging';

export default function LineSettingsCard({ companyId }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState(null);
  const [showSecret, setShowSecret] = useState(false);
  const [showToken, setShowToken] = useState(false);

  const [channelId, setChannelId] = useState('');
  const [basicId, setBasicId] = useState('');
  const [channelSecret, setChannelSecret] = useState('');
  const [channelAccessToken, setChannelAccessToken] = useState('');

  const load = async () => {
    if (!companyId) return;
    try {
      setLoading(true);
      const data = await fetchLineSettings(companyId);
      setSettings(data);
      setChannelId(data?.line_channel_id || '');
      setBasicId(data?.line_basic_id || '');
    } catch (e) {
      toast.error('LINE 連携設定の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [companyId]);

  const handleSave = async () => {
    if (!channelId.trim()) return toast.error('Channel ID を入力してください');
    if (!channelSecret.trim()) return toast.error('Channel Secret を入力してください');
    if (!channelAccessToken.trim()) return toast.error('Channel Access Token を入力してください');

    try {
      setSaving(true);
      const res = await updateLineCredentials({
        companyId,
        channelId: channelId.trim(),
        basicId: basicId.trim() || null,
        channelSecret: channelSecret.trim(),
        channelAccessToken: channelAccessToken.trim(),
      });
      toast.success(`LINE 連携を有効化しました (${res?.bot_info?.display_name || ''})`);
      setChannelSecret('');
      setChannelAccessToken('');
      await load();
    } catch (e) {
      toast.error(e?.message || 'LINE 連携設定の保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const isEnabled = settings?.line_messaging_enabled;

  return (
    <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', mb: 4 }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <ChatIcon sx={{ color: '#06C755', mr: 1.5, fontSize: 28 }} />
          <Typography variant="h6" sx={{ fontWeight: 700, flex: 1 }}>LINE 公式アカウント連携</Typography>
          {isEnabled && (
            <Chip icon={<CheckCircle />} label="有効" color="success" size="small" sx={{ fontWeight: 600 }} />
          )}
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          LINE Developers で発行した Messaging API チャネルの認証情報を設定すると、アンケート回答者へメッセージを送信できるようになります。Channel Secret と Channel Access Token は Supabase Vault に暗号化して保管されます。
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
        ) : (
          <>
            {isEnabled && (
              <Alert severity="success" sx={{ mb: 2 }}>
                現在 <strong>Channel ID: {settings.line_channel_id}</strong>{settings.line_basic_id && <> / Basic ID: {settings.line_basic_id}</>} で連携中。再設定する場合は下記フォームに新しい値を入力してください。
              </Alert>
            )}

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Channel ID *"
                value={channelId}
                onChange={(e) => setChannelId(e.target.value)}
                placeholder="例: 1656987654"
                size="small"
                fullWidth
              />
              <TextField
                label="ベーシック ID (任意)"
                value={basicId}
                onChange={(e) => setBasicId(e.target.value)}
                placeholder="例: @abc1234x"
                size="small"
                fullWidth
                helperText="未入力の場合は LINE API から自動取得します"
              />
              <TextField
                label="Channel Secret *"
                type={showSecret ? 'text' : 'password'}
                value={channelSecret}
                onChange={(e) => setChannelSecret(e.target.value)}
                placeholder={isEnabled ? '更新する場合のみ入力' : '32文字の Channel Secret'}
                size="small"
                fullWidth
                InputProps={{
                  endAdornment: (
                    <Button size="small" onClick={() => setShowSecret(s => !s)} sx={{ minWidth: 0 }}>
                      {showSecret ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </Button>
                  ),
                }}
              />
              <TextField
                label="Channel Access Token (long-lived) *"
                type={showToken ? 'text' : 'password'}
                value={channelAccessToken}
                onChange={(e) => setChannelAccessToken(e.target.value)}
                placeholder={isEnabled ? '更新する場合のみ入力' : '長期 Access Token'}
                size="small"
                fullWidth
                multiline
                maxRows={3}
                InputProps={{
                  endAdornment: (
                    <Button size="small" onClick={() => setShowToken(s => !s)} sx={{ minWidth: 0 }}>
                      {showToken ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </Button>
                  ),
                }}
              />
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  onClick={handleSave}
                  disabled={saving}
                  sx={{
                    backgroundColor: '#06C755',
                    '&:hover': { backgroundColor: '#05a648' },
                  }}
                >
                  {saving ? <CircularProgress size={20} sx={{ color: 'white' }} /> : (isEnabled ? '更新する' : '連携する')}
                </Button>
              </Box>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
}
