import React, { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, TextField, Button, Alert, Chip, CircularProgress,
} from '@mui/material';
import { Chat as ChatIcon, CheckCircle, Visibility, VisibilityOff, Edit as EditIcon } from '@mui/icons-material';
import toast from 'react-hot-toast';
import { fetchLineSettings, updateLineCredentials } from '../../../lib/lineMessaging';
import { usePartnerTheme } from '../../../contexts/PartnerThemeContext';
import { SettingsCardSkeleton } from './LineSkeletons';

export default function LineSettingsCard({ companyId }) {
  const theme = usePartnerTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState(null);
  const [showSecret, setShowSecret] = useState(false);
  const [showToken, setShowToken] = useState(false);

  // 設定済みなら最初はフォーム非表示。「変更する」を押したら表示
  const [editMode, setEditMode] = useState(false);

  const [channelId, setChannelId] = useState('');
  const [channelSecret, setChannelSecret] = useState('');
  const [channelAccessToken, setChannelAccessToken] = useState('');

  const load = async () => {
    if (!companyId) return;
    try {
      setLoading(true);
      const data = await fetchLineSettings(companyId);
      setSettings(data);
      setChannelId(data?.line_channel_id || '');
      // 未設定の場合は最初からフォーム展開
      setEditMode(!data?.line_messaging_enabled);
    } catch (e) {
      toast.error('LINE 連携設定の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [companyId]);

  const handleSave = async () => {
    if (!channelId.trim()) return toast.error('チャネル ID を入力してください');
    if (!channelSecret.trim()) return toast.error('シークレットキーを入力してください');
    if (!channelAccessToken.trim()) return toast.error('アクセストークンを入力してください');

    try {
      setSaving(true);
      const res = await updateLineCredentials({
        companyId,
        channelId: channelId.trim(),
        basicId: null,
        channelSecret: channelSecret.trim(),
        channelAccessToken: channelAccessToken.trim(),
      });
      toast.success(`LINE 連携を有効化しました${res?.bot_info?.display_name ? ` (${res.bot_info.display_name})` : ''}`);
      setChannelSecret('');
      setChannelAccessToken('');
      setEditMode(false);
      await load();
    } catch (e) {
      toast.error(e?.message || 'LINE 連携設定の保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setChannelId(settings?.line_channel_id || '');
    setChannelSecret('');
    setChannelAccessToken('');
    setEditMode(false);
  };

  if (loading) {
    return <SettingsCardSkeleton />;
  }

  const isEnabled = settings?.line_messaging_enabled;

  return (
    <Card sx={{ borderRadius: 1, boxShadow: '0 10px 40px rgba(0, 0, 0, 0.08)', mb: 4 }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box sx={{
            width: 48, height: 48, borderRadius: 1,
            background: theme.primaryGradient || theme.primary,
            display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 2,
          }}>
            <ChatIcon sx={{ color: 'white', fontSize: 24 }} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a202c' }}>LINE 公式アカウント連携</Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>お客様のLINE公式アカウントにメッセージを配信</Typography>
          </Box>
          {isEnabled && (
            <Chip icon={<CheckCircle />} label="設定済み" color="success" size="small" sx={{ fontWeight: 600 }} />
          )}
        </Box>

        {/* 設定済みかつ編集モードでない時の表示 */}
        {isEnabled && !editMode && (
          <Box>
            <Alert severity="success" sx={{ mb: 2 }}>
              LINE 連携が有効です。メッセージの送信ができます。
            </Alert>
            <Box sx={{
              p: 2, borderRadius: 1, bgcolor: '#f8fafc', border: '1px solid #e2e8f0',
              display: 'flex', alignItems: 'center', gap: 2,
            }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 0.5 }}>
                  チャネル ID
                </Typography>
                <Typography sx={{ fontWeight: 600, fontFamily: 'monospace' }}>
                  {settings.line_channel_id}
                </Typography>
                {settings.line_messaging_updated_at && (
                  <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mt: 0.5 }}>
                    最終更新: {new Date(settings.line_messaging_updated_at).toLocaleString('ja-JP')}
                  </Typography>
                )}
              </Box>
              <Button onClick={() => setEditMode(true)} variant="outlined" startIcon={<EditIcon />}
                sx={{ borderColor: theme.primary, color: theme.primary }}>
                変更する
              </Button>
            </Box>
          </Box>
        )}

        {/* 編集モードまたは未設定 */}
        {(!isEnabled || editMode) && (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              LINE 公式アカウントの管理画面で発行された情報を入力してください。入力した情報は暗号化して安全に保管されます。
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField label="チャネル ID" value={channelId}
                onChange={(e) => setChannelId(e.target.value)}
                placeholder="数字10桁ほどの ID"
                size="small" fullWidth />
              <TextField label="シークレットキー" type={showSecret ? 'text' : 'password'}
                value={channelSecret}
                onChange={(e) => setChannelSecret(e.target.value)}
                placeholder={isEnabled ? '更新する場合のみ入力' : '半角英数 32 文字のキー'}
                size="small" fullWidth
                InputProps={{
                  endAdornment: (
                    <Button size="small" onClick={() => setShowSecret(s => !s)} sx={{ minWidth: 0 }}>
                      {showSecret ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </Button>
                  ),
                }}
              />
              <TextField label="アクセストークン" type={showToken ? 'text' : 'password'}
                value={channelAccessToken}
                onChange={(e) => setChannelAccessToken(e.target.value)}
                placeholder={isEnabled ? '更新する場合のみ入力' : '長期利用のアクセストークン'}
                size="small" fullWidth multiline maxRows={3}
                InputProps={{
                  endAdornment: (
                    <Button size="small" onClick={() => setShowToken(s => !s)} sx={{ minWidth: 0 }}>
                      {showToken ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </Button>
                  ),
                }}
              />
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                {isEnabled && (
                  <Button onClick={handleCancel} sx={{ color: '#64748b' }}>キャンセル</Button>
                )}
                <Button variant="contained" onClick={handleSave} disabled={saving}
                  sx={{
                    background: theme.primaryGradient || theme.primary,
                    color: 'white', fontWeight: 600, px: 3,
                    '&:hover': { background: theme.primaryGradient || theme.primary, opacity: 0.9 },
                  }}>
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
