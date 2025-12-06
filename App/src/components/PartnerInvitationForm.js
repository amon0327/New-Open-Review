import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Alert,
  Stack,
  IconButton,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import {
  PersonAdd,
  Close,
  AdminPanelSettings,
  Send,
  ContentCopy,
  Link
} from '@mui/icons-material';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export default function PartnerInvitationForm({
  partnerCompanyId,
  partnerCompanyName,
  onClose,
  onInvitationSent
}) {
  const [formData, setFormData] = useState({
    name: '',
    role: 'owner'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [invitationData, setInvitationData] = useState(null);

  const handleInputChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
    if (error) setError(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // バリデーション
      if (!formData.name.trim()) {
        throw new Error('招待する人の名前を入力してください');
      }

      // 認証情報の取得
      const { data: sessionData } = await supabase.auth.getSession();

      if (!sessionData.session) {
        throw new Error('認証情報の取得に失敗しました。再ログインしてください。');
      }

      console.log('Creating partner invitation:', {
        partnerCompanyId,
        name: formData.name,
        role: formData.role
      });

      // Edge Functionを使用して招待を作成
      const { data, error } = await supabase.functions.invoke('create-partner-invitation', {
        body: {
          partnerCompanyId: partnerCompanyId,
          role: formData.role,
          name: formData.name.trim()
        },
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
      });

      console.log('Edge Function response:', { data, error });

      if (error) {
        throw new Error(`招待の作成に失敗しました: ${error.message}`);
      }

      if (!data.success) {
        throw new Error(data.error || '招待の作成に失敗しました');
      }

      setInvitationData(data.invitation);
      setSuccess(true);

      // 親コンポーネントに通知
      if (onInvitationSent) {
        onInvitationSent();
      }

    } catch (err) {
      console.error('Invitation creation error:', err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyTemplate = () => {
    if (invitationData) {
      const template = `${invitationData.name}様

${invitationData.partnerCompanyName}への招待URLです：

【開発版】
http://localhost:3000/partner-invitation/${invitationData.token}

【本番版】
https://app.openreview.jp/partner-invitation/${invitationData.token}`;
      navigator.clipboard.writeText(template);
      toast.success('テンプレートをコピーしました');
    }
  };

  const handleClose = () => {
    setFormData({ name: '', role: 'owner' });
    setError(null);
    setSuccess(false);
    setInvitationData(null);
    onClose();
  };


  return (
    <Dialog
      open={true}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          minHeight: '550px'
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <PersonAdd sx={{ color: '#5e17eb', mr: 2 }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              パートナーメンバー招待
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              {partnerCompanyName}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={handleClose}>
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 4 }}>
        {success ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Box sx={{ py: 2 }}>
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <PersonAdd sx={{ fontSize: 64, color: '#10b981', mb: 2 }} />
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, color: '#10b981' }}>
                  招待URLを発行しました！
                </Typography>
                <Typography variant="body1" sx={{ color: '#64748b' }}>
                  以下の情報を{invitationData?.name}さんに送信してください
                </Typography>
              </Box>

              {/* テンプレート表示カード */}
              <Card sx={{ mb: 3, border: '1px solid #e2e8f0' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <PersonAdd sx={{ color: '#5e17eb', mr: 1 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      招待テンプレート
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      p: 2,
                      background: '#f8fafc',
                      borderRadius: 1,
                      border: '1px solid #e2e8f0',
                      fontFamily: 'monospace',
                      fontSize: '0.9rem',
                      whiteSpace: 'pre-line',
                      color: '#374151'
                    }}
                  >
                    {`${invitationData?.name}様

${invitationData?.partnerCompanyName}への招待URLです：

【開発版】
http://localhost:3000/partner-invitation/${invitationData?.token}

【本番版】
https://app.openreview.jp/partner-invitation/${invitationData?.token}`}
                  </Box>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<ContentCopy />}
                    onClick={copyTemplate}
                    sx={{
                      mt: 2,
                      borderColor: '#5e17eb',
                      color: '#5e17eb',
                      '&:hover': {
                        borderColor: '#4c1d95',
                        backgroundColor: 'rgba(94, 23, 235, 0.05)',
                      }
                    }}
                  >
                    テンプレートをコピー
                  </Button>
                </CardContent>
              </Card>

              <Divider sx={{ my: 2 }} />

              {/* URL表示カード - 開発版 */}
              <Card sx={{ mb: 3, border: '1px solid #e2e8f0' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Link sx={{ color: '#5e17eb', mr: 1 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      招待URL（開発版）
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      p: 2,
                      background: '#f8fafc',
                      borderRadius: 1,
                      border: '1px solid #e2e8f0',
                      wordBreak: 'break-all',
                      fontFamily: 'monospace',
                      fontSize: '0.9rem',
                      color: '#374151'
                    }}
                  >
                    {invitationData?.token ? `http://localhost:3000/partner-invitation/${invitationData.token}` : ''}
                  </Box>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<ContentCopy />}
                    onClick={() => {
                      if (invitationData?.token) {
                        const localhostUrl = `http://localhost:3000/partner-invitation/${invitationData.token}`;
                        navigator.clipboard.writeText(localhostUrl);
                        toast.success('開発版URLをコピーしました');
                      }
                    }}
                    sx={{
                      mt: 2,
                      borderColor: '#5e17eb',
                      color: '#5e17eb',
                      '&:hover': {
                        borderColor: '#4c1d95',
                        backgroundColor: 'rgba(94, 23, 235, 0.05)',
                      }
                    }}
                  >
                    開発版URLをコピー
                  </Button>
                </CardContent>
              </Card>

              {/* URL表示カード - 本番版 */}
              <Card sx={{ mb: 3, border: '1px solid #e2e8f0' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Link sx={{ color: '#10b981', mr: 1 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      招待URL（本番版）
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      p: 2,
                      background: '#f0fdf4',
                      borderRadius: 1,
                      border: '1px solid #bbf7d0',
                      wordBreak: 'break-all',
                      fontFamily: 'monospace',
                      fontSize: '0.9rem',
                      color: '#166534'
                    }}
                  >
                    {invitationData?.token ? `https://app.openreview.jp/partner-invitation/${invitationData.token}` : ''}
                  </Box>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<ContentCopy />}
                    onClick={() => {
                      if (invitationData?.token) {
                        const productionUrl = `https://app.openreview.jp/partner-invitation/${invitationData.token}`;
                        navigator.clipboard.writeText(productionUrl);
                        toast.success('本番版URLをコピーしました');
                      }
                    }}
                    sx={{
                      mt: 2,
                      borderColor: '#10b981',
                      color: '#10b981',
                      '&:hover': {
                        borderColor: '#059669',
                        backgroundColor: 'rgba(16, 185, 129, 0.05)',
                      }
                    }}
                  >
                    本番版URLをコピー
                  </Button>
                </CardContent>
              </Card>

              <Button
                variant="contained"
                fullWidth
                onClick={handleClose}
                sx={{
                  background: 'linear-gradient(45deg, #5e17eb 30%, #764ba2 90%)',
                  py: 1.5
                }}
              >
                閉じる
              </Button>
            </Box>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* エラー表示 */}
            {error && (
              <Alert severity="error" sx={{ borderRadius: 2, mb: 3 }}>
                {error}
              </Alert>
            )}

            {/* フォーム */}
            <Box component="form" onSubmit={handleSubmit}>
              <Stack spacing={3}>
                {/* 招待者名 */}
                <TextField
                  label="招待する人の名前"
                  placeholder="山田太郎"
                  fullWidth
                  required
                  value={formData.name}
                  onChange={handleInputChange('name')}
                  disabled={isSubmitting}
                  InputProps={{
                    startAdornment: (
                      <AdminPanelSettings sx={{ color: '#64748b', mr: 1 }} />
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#5e17eb',
                      }
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#5e17eb'
                    }
                  }}
                />
              </Stack>
            </Box>

            {/* 注意事項 */}
            <Box
              sx={{
                mt: 3,
                p: 3,
                background: '#fef3c7',
                borderRadius: 2,
                border: '1px solid #fbbf24'
              }}
            >
              <Typography variant="body2" sx={{ color: '#92400e', lineHeight: 1.6 }}>
                <strong>注意事項:</strong><br />
                • 招待された方はGoogleアカウントでログインが必要です<br />
                • 招待URLは安全に管理してください
              </Typography>
            </Box>
          </motion.div>
        )}
      </DialogContent>

      {!success && (
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button
            onClick={handleClose}
            disabled={isSubmitting}
            sx={{ color: '#64748b' }}
          >
            キャンセル
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting || !formData.name.trim()}
            startIcon={
              isSubmitting ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <Send />
              )
            }
            onClick={handleSubmit}
            sx={{
              background: 'linear-gradient(45deg, #5e17eb 30%, #764ba2 90%)',
              boxShadow: '0 4px 15px rgba(94, 23, 235, 0.3)',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 20px rgba(94, 23, 235, 0.4)',
              },
              '&:disabled': {
                background: '#e2e8f0',
                color: '#94a3b8',
                boxShadow: 'none',
                transform: 'none'
              }
            }}
          >
            {isSubmitting ? '招待中...' : '招待を送信'}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
}
