import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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
  Fab,
  Skeleton
} from '@mui/material';
import {
  Store,
  Add,
  LocationOn,
  Edit,
  Delete,
  Close,
  Visibility,
  People
} from '@mui/icons-material';
import { supabase } from '../../../lib/supabase';
import StoreRegistrationForm from '../../StoreRegistrationForm';
import StoreDetailPage from './StoreDetailPage';
export default function StoresManagementPage() {
  const { companyId: urlCompanyId } = useParams(); // URLからcompanyIdを取得

  // デバッグ用ログ
  console.log('🔍 StoresManagementPage - urlCompanyId:', urlCompanyId);
  console.log('🔍 StoresManagementPage - window.location.pathname:', window.location.pathname);

  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState(null);
  const [showStoreDetail, setShowStoreDetail] = useState(false);

  // 店舗一覧を取得
  useEffect(() => {
    fetchStores();
  }, [urlCompanyId]); // urlCompanyIdが変わったら再取得

  const fetchStores = async () => {
    try {
      console.log('🔄 fetchStores called - urlCompanyId:', urlCompanyId);
      setLoading(true);
      setError(null);

      // 認証されたユーザーの取得
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('認証が必要です');
      }
      console.log('✅ User authenticated:', user.id);

      let companyId = null;

      // URLにcompanyIdがある場合はそれを使用（パートナーユーザー用）
      if (urlCompanyId) {
        console.log('✅ Using companyId from URL:', urlCompanyId);
        companyId = urlCompanyId;
      } else {
        // URLにない場合はcompany_membershipsから取得（通常ユーザー用）
        console.log('⚠️ No companyId in URL, checking company_memberships');
        const { data: companyRelation, error: relationError } = await supabase
          .from('company_memberships')
          .select('company_id')
          .eq('business_user_id', user.id);

        if (relationError) {
          console.error('❌ company_memberships query error:', relationError);
          throw new Error('会社情報の取得に失敗しました');
        }

        if (!companyRelation || companyRelation.length === 0) {
          console.error('❌ No company_memberships found for user:', user.id);
          throw new Error('会社情報が見つかりません');
        }

        companyId = companyRelation[0].company_id;
        console.log('✅ Company ID from company_memberships:', companyId);
      }

      console.log('📍 Querying stores with company_id:', companyId);

      // 会社の店舗一覧を取得
      const { data: storesData, error: storesError } = await supabase
        .from('stores')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (storesError) {
        console.error('❌ Stores query error:', storesError);
        throw new Error('店舗情報の取得に失敗しました');
      }

      console.log('✅ Stores loaded:', storesData?.length || 0);
      console.log('📦 Stores data:', storesData);
      setStores(storesData || []);
    } catch (err) {
      console.error('❌ Error fetching stores:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStoreRegistered = async (newStore) => {
    // 店舗作成後、サーバーから最新の店舗一覧を取得
    await fetchStores();
    setShowRegistrationForm(false);
  };

  const handleCloseRegistrationForm = () => {
    setShowRegistrationForm(false);
  };

  const handleViewStoreDetail = (storeId) => {
    console.log('handleViewStoreDetail - storeId:', storeId); // デバッグ用
    setSelectedStoreId(storeId);
    setShowStoreDetail(true);
  };

  const handleCloseStoreDetail = () => {
    setShowStoreDetail(false);
    setSelectedStoreId(null);
  };

  if (loading) {
    return (
      <Box sx={{ height: '100%', overflow: 'auto', bgcolor: '#f8fafc' }}>
        <Container maxWidth="xl" sx={{ py: 4 }}>
          {/* ヘッダー スケルトン */}
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Skeleton variant="circular" width={32} height={32} sx={{ mr: 2 }} />
              <Skeleton variant="text" width={150} height={40} />
            </Box>
            <Skeleton variant="text" width={250} height={24} sx={{ mb: 3 }} />
            <Skeleton variant="rectangular" width={140} height={40} sx={{ borderRadius: 1 }} />
          </Box>

          {/* 店舗カード スケルトン */}
          <Grid container spacing={3}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Grid item xs={12} sm={6} md={4} key={i}>
                <Card
                  sx={{
                    height: '100%',
                    background: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    {/* 店舗名 */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Skeleton variant="circular" width={24} height={24} sx={{ mr: 1 }} />
                      <Skeleton variant="text" width="70%" height={28} />
                    </Box>

                    {/* 住所 */}
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 3 }}>
                      <Skeleton variant="circular" width={20} height={20} sx={{ mr: 1, mt: 0.5 }} />
                      <Box sx={{ flex: 1 }}>
                        <Skeleton variant="text" width="100%" height={20} />
                        <Skeleton variant="text" width="60%" height={20} />
                      </Box>
                    </Box>

                    {/* 登録日 */}
                    <Box sx={{ mb: 2 }}>
                      <Skeleton variant="rectangular" width={120} height={24} sx={{ borderRadius: 2 }} />
                    </Box>

                    {/* アクションボタン */}
                    <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                      <Skeleton variant="circular" width={32} height={32} />
                      <Skeleton variant="circular" width={32} height={32} />
                      <Skeleton variant="circular" width={32} height={32} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
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
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, minHeight: 32 }}>
                        <Store sx={{ color: '#5e17eb', mr: 1, flexShrink: 0 }} />
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 600,
                            color: '#1a202c',
                            flex: 1,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {store.name}
                        </Typography>
                      </Box>

                      {/* 住所 */}
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 3, minHeight: 48 }}>
                        <LocationOn sx={{ color: '#64748b', mr: 1, mt: 0.5, fontSize: 20, flexShrink: 0 }} />
                        <Typography
                          variant="body2"
                          sx={{
                            color: '#64748b',
                            lineHeight: 1.5,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
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
                          onClick={() => handleViewStoreDetail(store.id)}
                          sx={{
                            color: '#5e17eb',
                            '&:hover': {
                              backgroundColor: 'rgba(94, 23, 235, 0.1)'
                            }
                          }}
                          title="店舗詳細・スタッフ管理"
                        >
                          <People />
                        </IconButton>
                        <IconButton
                          size="small"
                          sx={{
                            color: '#10b981',
                            '&:hover': {
                              backgroundColor: 'rgba(16, 185, 129, 0.1)'
                            }
                          }}
                          title="店舗情報を編集"
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
                          title="店舗を削除"
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

      {/* 店舗詳細ダイアログ */}
      <Dialog
        open={showStoreDetail}
        onClose={handleCloseStoreDetail}
        maxWidth="lg"
        fullWidth
        fullScreen
        PaperProps={{
          sx: {
            borderRadius: 0,
            background: '#f8fafc'
          }
        }}
      >
        {selectedStoreId && (
          <StoreDetailPage 
            storeId={selectedStoreId}
            onClose={handleCloseStoreDetail}
          />
        )}
        {!selectedStoreId && (
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <p>店舗IDが選択されていません</p>
            <p>selectedStoreId: {selectedStoreId}</p>
          </div>
        )}
      </Dialog>
    </Box>
  );
}