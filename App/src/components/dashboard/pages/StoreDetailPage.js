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
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  CircularProgress,
  Alert,
  Fab
} from '@mui/material';
import {
  Store,
  Person,
  Add,
  LocationOn,
  ArrowBack,
  PersonAdd,
  AdminPanelSettings,
  WorkOutline,
  Email,
  Schedule
} from '@mui/icons-material';
// import { useParams, useNavigate } from 'react-router-dom'; // TODO: React Router設定後に有効化
import { supabase } from '../../../lib/supabase';
import StaffInvitationForm from '../../StaffInvitationForm';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function StoreDetailPage({ storeId: propStoreId, onClose }) {
  // TODO: React Router設定後に有効化
  // const { storeId } = useParams();
  // const navigate = useNavigate();
  const storeId = propStoreId;
  const [store, setStore] = useState(null);
  const [staffMembers, setStaffMembers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [showInvitationForm, setShowInvitationForm] = useState(false);

  useEffect(() => {
    if (storeId) {
      fetchStoreData();
    } else {
      setError('店舗IDが指定されていません');
      setLoading(false);
    }
  }, [storeId]);

  const fetchStoreData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('fetchStoreData - storeId:', storeId); // デバッグ用

      // 店舗情報を取得
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select('*')
        .eq('id', storeId);

      console.log('fetchStoreData - storeData:', storeData); // デバッグ用
      console.log('fetchStoreData - storeError:', storeError); // デバッグ用

      if (storeError) throw storeError;
      
      if (!storeData || storeData.length === 0) {
        throw new Error(`店舗が見つかりません (ID: ${storeId})`);
      }
      
      setStore(storeData[0]);

      // スタッフメンバーを取得
      const { data: staffData, error: staffError } = await supabase
        .from('store_memberships')
        .select(`
          *,
          business_users (
            id,
            email,
            name
          )
        `)
        .eq('store_id', storeId);

      if (staffError) throw staffError;
      setStaffMembers(staffData || []);

      // 招待一覧を取得
      const { data: invitationData, error: invitationError } = await supabase
        .from('store_invitations')
        .select('*')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });

      if (invitationError) throw invitationError;
      setInvitations(invitationData || []);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const getRoleIcon = (role) => {
    return role === 'STORE' ? <AdminPanelSettings /> : <WorkOutline />;
  };

  const getRoleColor = (role) => {
    return role === 'STORE' ? '#f59e0b' : '#10b981';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'invited': return '#3b82f6';
      case 'completed': return '#10b981';
      case 'expired': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'invited': return '招待中';
      case 'completed': return '完了';
      case 'expired': return '期限切れ';
      default: return '不明';
    }
  };

  const copyInvitationUrl = (token, environment = 'dev') => {
    let url;
    if (environment === 'production') {
      url = `https://app.openreview.jp/staff-invitation/${token}`;
    } else {
      url = `http://localhost:3000/staff-invitation/${token}`;
    }
    navigator.clipboard.writeText(url);
    // TODO: トースト通知を表示
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

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          {error}
        </Alert>
      </Container>
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
              <IconButton
                onClick={() => {
                  if (onClose) {
                    onClose();
                  } else {
                    // TODO: React Router設定後にナビゲーション実装
                    console.log('ダッシュボードに戻る');
                    alert('ダッシュボードに戻る\n※ 後でルーティング実装予定');
                  }
                }}
                sx={{ mr: 2 }}
              >
                <ArrowBack />
              </IconButton>
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
                {store?.name}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <LocationOn sx={{ color: '#64748b', mr: 1 }} />
              <Typography variant="body1" sx={{ color: '#64748b' }}>
                {store?.address}
              </Typography>
            </Box>

            {/* スタッフ招待ボタン */}
            <Button
              variant="contained"
              startIcon={<PersonAdd />}
              onClick={() => setShowInvitationForm(true)}
              sx={{
                background: 'linear-gradient(45deg, #5e17eb 30%, #764ba2 90%)',
                boxShadow: '0 4px 15px rgba(94, 23, 235, 0.3)',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 20px rgba(94, 23, 235, 0.4)',
                }
              }}
            >
              スタッフを招待
            </Button>
          </Box>
        </motion.div>

        {/* タブ */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="スタッフ一覧" />
            <Tab label="招待一覧" />
          </Tabs>
        </Box>

        {/* スタッフ一覧タブ */}
        <TabPanel value={tabValue} index={0}>
          {staffMembers.length === 0 ? (
            <Card sx={{ textAlign: 'center', py: 8 }}>
              <CardContent>
                <Person sx={{ fontSize: 64, color: '#cbd5e1', mb: 2 }} />
                <Typography variant="h6" sx={{ color: '#64748b', mb: 2 }}>
                  スタッフが登録されていません
                </Typography>
                <Typography variant="body2" sx={{ color: '#94a3b8', mb: 3 }}>
                  スタッフ招待ボタンから最初のスタッフを招待してください
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<PersonAdd />}
                  onClick={() => setShowInvitationForm(true)}
                  sx={{
                    background: 'linear-gradient(45deg, #5e17eb 30%, #764ba2 90%)',
                    boxShadow: '0 4px 15px rgba(94, 23, 235, 0.3)',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 20px rgba(94, 23, 235, 0.4)',
                    }
                  }}
                >
                  スタッフを招待
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>スタッフ</TableCell>
                      <TableCell>メールアドレス</TableCell>
                      <TableCell>ロール</TableCell>
                      <TableCell>参加日</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {staffMembers.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar sx={{ mr: 2 }}>
                              {member.business_users?.name?.charAt(0) || 
                               member.business_users?.email?.charAt(0)}
                            </Avatar>
                            <Typography variant="body2">
                              {member.business_users?.name || 'ユーザー'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{member.business_users?.email}</TableCell>
                        <TableCell>
                          <Chip
                            icon={getRoleIcon(member.role)}
                            label={member.role === 'STORE' ? '店舗管理者' : 'スタッフ'}
                            sx={{
                              backgroundColor: `${getRoleColor(member.role)}20`,
                              color: getRoleColor(member.role),
                              fontWeight: 500
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          {new Date(member.created_at).toLocaleDateString('ja-JP')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              
              {/* スタッフ一覧タブのアクションボタン */}
              <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button
                  variant="contained"
                  startIcon={<PersonAdd />}
                  onClick={() => setShowInvitationForm(true)}
                  sx={{
                    background: 'linear-gradient(45deg, #5e17eb 30%, #764ba2 90%)',
                    boxShadow: '0 4px 15px rgba(94, 23, 235, 0.3)',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 20px rgba(94, 23, 235, 0.4)',
                    }
                  }}
                >
                  スタッフを招待
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Email />}
                  onClick={() => setTabValue(1)}
                  sx={{
                    borderColor: '#5e17eb',
                    color: '#5e17eb',
                    '&:hover': {
                      borderColor: '#4c1d95',
                      backgroundColor: 'rgba(94, 23, 235, 0.05)',
                    }
                  }}
                >
                  招待一覧を見る
                </Button>
              </Box>
            </>
          )}
        </TabPanel>

        {/* 招待一覧タブ */}
        <TabPanel value={tabValue} index={1}>
          {invitations.length === 0 ? (
            <Card sx={{ textAlign: 'center', py: 8 }}>
              <CardContent>
                <Email sx={{ fontSize: 64, color: '#cbd5e1', mb: 2 }} />
                <Typography variant="h6" sx={{ color: '#64748b', mb: 2 }}>
                  招待履歴がありません
                </Typography>
                <Typography variant="body2" sx={{ color: '#94a3b8', mb: 3 }}>
                  スタッフ招待ボタンから招待を送信してください
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<PersonAdd />}
                  onClick={() => setShowInvitationForm(true)}
                  sx={{
                    background: 'linear-gradient(45deg, #5e17eb 30%, #764ba2 90%)',
                    boxShadow: '0 4px 15px rgba(94, 23, 235, 0.3)',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 20px rgba(94, 23, 235, 0.4)',
                    }
                  }}
                >
                  スタッフを招待
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>招待者名</TableCell>
                      <TableCell>ロール</TableCell>
                      <TableCell>ステータス</TableCell>
                      <TableCell>招待日</TableCell>
                      <TableCell>招待URL</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {invitations.map((invitation) => (
                      <TableRow key={invitation.id}>
                        <TableCell>{invitation.name}</TableCell>
                        <TableCell>
                          <Chip
                            icon={getRoleIcon(invitation.role)}
                            label={invitation.role === 'STORE' ? '店舗管理者' : 'スタッフ'}
                            sx={{
                              backgroundColor: `${getRoleColor(invitation.role)}20`,
                              color: getRoleColor(invitation.role),
                              fontWeight: 500
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={getStatusText(invitation.status)}
                            sx={{
                              backgroundColor: `${getStatusColor(invitation.status)}20`,
                              color: getStatusColor(invitation.status),
                              fontWeight: 500
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          {new Date(invitation.created_at).toLocaleDateString('ja-JP')}
                        </TableCell>
                        <TableCell>
                          {invitation.status === 'invited' && (
                            <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column' }}>
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => copyInvitationUrl(invitation.token, 'dev')}
                                sx={{ 
                                  textTransform: 'none',
                                  borderColor: '#5e17eb',
                                  color: '#5e17eb',
                                  fontSize: '0.75rem',
                                  py: 0.5,
                                  '&:hover': {
                                    borderColor: '#4c1d95',
                                    backgroundColor: 'rgba(94, 23, 235, 0.05)',
                                  }
                                }}
                              >
                                開発版
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => copyInvitationUrl(invitation.token, 'production')}
                                sx={{ 
                                  textTransform: 'none',
                                  borderColor: '#10b981',
                                  color: '#10b981',
                                  fontSize: '0.75rem',
                                  py: 0.5,
                                  '&:hover': {
                                    borderColor: '#059669',
                                    backgroundColor: 'rgba(16, 185, 129, 0.05)',
                                  }
                                }}
                              >
                                本番版
                              </Button>
                            </Box>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* 招待一覧タブのアクションボタン */}
              <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button
                  variant="contained"
                  startIcon={<PersonAdd />}
                  onClick={() => setShowInvitationForm(true)}
                  sx={{
                    background: 'linear-gradient(45deg, #5e17eb 30%, #764ba2 90%)',
                    boxShadow: '0 4px 15px rgba(94, 23, 235, 0.3)',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 20px rgba(94, 23, 235, 0.4)',
                    }
                  }}
                >
                  新しいスタッフを招待
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Person />}
                  onClick={() => setTabValue(0)}
                  sx={{
                    borderColor: '#5e17eb',
                    color: '#5e17eb',
                    '&:hover': {
                      borderColor: '#4c1d95',
                      backgroundColor: 'rgba(94, 23, 235, 0.05)',
                    }
                  }}
                >
                  スタッフ一覧に戻る
                </Button>
              </Box>
            </>
          )}
        </TabPanel>

        {/* フローティングアクションボタン */}
        <Fab
          color="primary"
          onClick={() => setShowInvitationForm(true)}
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
          <PersonAdd />
        </Fab>
      </Container>

      {/* スタッフ招待フォーム */}
      {showInvitationForm && (
        <StaffInvitationForm
          storeId={storeId}
          storeName={store?.name}
          onClose={() => setShowInvitationForm(false)}
          onInvitationSent={fetchStoreData}
        />
      )}
    </Box>
  );
}