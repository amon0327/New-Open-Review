import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  IconButton,
  Chip,
  Container,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Fab
} from '@mui/material';
import {
  Store,
  Add,
  LocationOn,
  Edit,
  Delete,
  Close
} from '@mui/icons-material';
import { supabase } from '../../../lib/supabase';
import StoreRegistrationForm from '../../StoreRegistrationForm';

export default function StoresManagementPage() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);

  // 店舗一覧を取得
  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      setLoading(true);
      setError(null);

      // 認証されたユーザーの会社IDを取得
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('認証が必要です');
      }

      // ユーザーの会社情報を取得
      const { data: companyRelation, error: relationError } = await supabase
        .from('company_memberships')
        .select('company_id')
        .eq('business_user_id', user.id)
        .single();

      if (relationError) {
        throw new Error('会社情報の取得に失敗しました');
      }

      // 会社の店舗一覧を取得
      const { data: storesData, error: storesError } = await supabase
        .from('stores')
        .select('*')
        .eq('company_id', companyRelation.company_id)
        .order('created_at', { ascending: false });

      if (storesError) {
        throw new Error('店舗情報の取得に失敗しました');
      }

      setStores(storesData || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStoreRegistered = (newStore) => {
    setStores(prev => [newStore, ...prev]);
    setShowRegistrationForm(false);
  };

  const handleCloseRegistrationForm = () => {
    setShowRegistrationForm(false);
  };

  if (loading) {
    return (
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <CircularProgress size={50} sx={{ color: '#5e17eb' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', overflow: 'auto', bgcolor: '#f8fafc' }}>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* ヘッダー */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Store sx={{ fontSize: 32, color: '#5e17eb', mr: 2 }} />
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  background: 'linear-gradient(45deg, #5e17eb 30%, #764ba2 90%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                店舗管理
              </Typography>
            </Box>
            <Typography variant="body1" sx={{ color: '#64748b', mb: 3 }}>
              会社の店舗情報を管理できます
            </Typography>

            {/* 新規登録ボタン */}
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setShowRegistrationForm(true)}
              sx={{
                background: 'linear-gradient(45deg, #5e17eb 30%, #764ba2 90%)',
                boxShadow: '0 4px 15px rgba(94, 23, 235, 0.3)',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 20px rgba(94, 23, 235, 0.4)',
                }
              }}
            >
              新規店舗登録
            </Button>
          </Box>
        </motion.div>

        {/* エラー表示 */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ marginBottom: 24 }}
          >
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              {error}
            </Alert>
          </motion.div>
        )}

        {/* 店舗一覧 */}
        {stores.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card
              sx={{
                textAlign: 'center',
                py: 8,
                background: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}
            >
              <CardContent>
                <Store sx={{ fontSize: 64, color: '#cbd5e1', mb: 2 }} />
                <Typography variant="h6" sx={{ color: '#64748b', mb: 2 }}>
                  店舗が登録されていません
                </Typography>
                <Typography variant="body2" sx={{ color: '#94a3b8', mb: 3 }}>
                  新規店舗登録ボタンから最初の店舗を登録してください
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setShowRegistrationForm(true)}
                  sx={{
                    background: 'linear-gradient(45deg, #5e17eb 30%, #764ba2 90%)',
                  }}
                >
                  新規店舗登録
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <Grid container spacing={3}>
            {stores.map((store, index) => (
              <Grid item xs={12} sm={6} md={4} key={store.id}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card
                    sx={{
                      height: '100%',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 8px 25px rgba(0,0,0,0.1)'
                      },
                      background: 'rgba(255, 255, 255, 0.9)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      {/* 店舗名 */}
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Store sx={{ color: '#5e17eb', mr: 1 }} />
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 600,
                            color: '#1a202c',
                            flex: 1
                          }}
                        >
                          {store.name}
                        </Typography>
                      </Box>

                      {/* 住所 */}
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 3 }}>
                        <LocationOn sx={{ color: '#64748b', mr: 1, mt: 0.5, fontSize: 20 }} />
                        <Typography
                          variant="body2"
                          sx={{
                            color: '#64748b',
                            lineHeight: 1.5
                          }}
                        >
                          {store.address}
                        </Typography>
                      </Box>

                      {/* 登録日 */}
                      <Box sx={{ mb: 2 }}>
                        <Chip
                          label={`登録日: ${new Date(store.created_at).toLocaleDateString('ja-JP')}`}
                          size="small"
                          sx={{
                            backgroundColor: 'rgba(94, 23, 235, 0.1)',
                            color: '#5e17eb',
                            fontWeight: 500
                          }}
                        />
                      </Box>

                      {/* アクションボタン */}
                      <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                        <IconButton
                          size="small"
                          sx={{
                            color: '#5e17eb',
                            '&:hover': {
                              backgroundColor: 'rgba(94, 23, 235, 0.1)'
                            }
                          }}
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          size="small"
                          sx={{
                            color: '#ef4444',
                            '&:hover': {
                              backgroundColor: 'rgba(239, 68, 68, 0.1)'
                            }
                          }}
                        >
                          <Delete />
                        </IconButton>
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        )}

        {/* フローティングアクションボタン */}
        <Fab
          color="primary"
          onClick={() => setShowRegistrationForm(true)}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            background: 'linear-gradient(45deg, #5e17eb 30%, #764ba2 90%)',
            '&:hover': {
              transform: 'scale(1.1)',
            }
          }}
        >
          <Add />
        </Fab>
      </Container>

      {/* 店舗登録ダイアログ */}
      <Dialog
        open={showRegistrationForm}
        onClose={handleCloseRegistrationForm}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)'
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Store sx={{ color: '#5e17eb', mr: 2 }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              新規店舗登録
            </Typography>
          </Box>
          <IconButton onClick={handleCloseRegistrationForm}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <StoreRegistrationForm
            onStoreRegistered={handleStoreRegistered}
            onCancel={handleCloseRegistrationForm}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
}