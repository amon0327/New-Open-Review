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
  Fab,
  Checkbox,
  FormControlLabel
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
  Schedule,
  Delete,
  ContentCopy
} from '@mui/icons-material';
// import { useParams, useNavigate } from 'react-router-dom'; // TODO: React Router設定後に有効化
import { supabase } from '../../../lib/supabase';
import StaffInvitationForm from '../../StaffInvitationForm';
import { usePartnerTheme } from '../../../contexts/PartnerThemeContext';
import toast from 'react-hot-toast';

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
  const theme = usePartnerTheme();
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
  const [selectedInvitations, setSelectedInvitations] = useState([]);

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

  // LINE IDパターンを除外して有効な名前を返す
  const getDisplayName = (member) => {
    const isLineId = (name) => {
      if (!name) return true;
      if (name.includes('@line.local')) return true;
      if (/^u[a-f0-9]{32}$/i.test(name)) return true;
      return false;
    };
    if (member.name && !isLineId(member.name)) return member.name;
    if (member.business_users?.name && !isLineId(member.business_users.name)) return member.business_users.name;
    return 'ユーザー';
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'invited': return '招待中';
      case 'completed': return '完了';
      case 'expired': return '期限切れ';
      default: return '不明';
    }
  };

  // LIFF URL (LINE アプリ内で開いたら自動ログインできる)
  // Endpoint URL = https://store.openreview.jp/ に LIFF が subpath を引き継ぐ
  const STAFF_INVITE_BASE = 'https://liff.line.me/2008499451-m9heDaev/staff-invitation';

  const copyInvitationUrl = (token) => {
    const url = `${STAFF_INVITE_BASE}/${token}`;
    navigator.clipboard.writeText(url);
    toast.success('URLをコピーしました');
  };

  // 招待中のものだけをフィルタ
  const invitedInvitations = invitations.filter(inv => inv.status === 'invited');

  // 全選択/全解除
  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedInvitations(invitedInvitations.map(inv => inv.id));
    } else {
      setSelectedInvitations([]);
    }
  };

  // 個別選択
  const handleSelectInvitation = (invitationId) => {
    setSelectedInvitations(prev => {
      if (prev.includes(invitationId)) {
        return prev.filter(id => id !== invitationId);
      } else {
        return [...prev, invitationId];
      }
    });
  };

  // 選択した招待を一括コピー（送信用形式）
  const copySelectedInvitations = () => {
    const selectedItems = invitations.filter(inv => selectedInvitations.includes(inv.id));

    if (selectedItems.length === 0) {
      toast.error('招待を選択してください');
      return;
    }

    const text = selectedItems.map(inv => {
      const url = `${STAFF_INVITE_BASE}/${inv.token}`;
      return `${inv.name}さん\n下記URLをタップしてスタッフ登録をお願いします\n${url}`;
    }).join('\n\n');

    navigator.clipboard.writeText(text);
    toast.success(`${selectedItems.length}件の招待URLをコピーしました`);
  };

  // スタッフメンバーを削除
  const handleDeleteMember = async (memberId, memberName) => {
    if (!window.confirm(`${memberName}さんをスタッフから削除しますか？`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('store_memberships')
        .delete()
        .eq('id', memberId);

      if (error) {
        console.error('メンバー削除エラー:', error);
        toast.error('メンバーの削除に失敗しました');
        return;
      }

      toast.success(`${memberName}さんをスタッフから削除しました`);
      // リストを更新
      await fetchStoreData();
    } catch (error) {
      console.error('メンバー削除エラー:', error);
      toast.error('メンバーの削除に失敗しました');
    }
  };

  // 招待を削除
  const handleDeleteInvitation = async (invitationId, invitationName) => {
    if (!window.confirm(`${invitationName}さんへの招待を削除しますか？`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('store_invitations')
        .delete()
        .eq('id', invitationId);

      if (error) {
        console.error('招待削除エラー:', error);
        toast.error('招待の削除に失敗しました');
        return;
      }

      toast.success('招待を削除しました');
      // リストを更新
      await fetchStoreData();
    } catch (error) {
      console.error('招待削除エラー:', error);
      toast.error('招待の削除に失敗しました');
    }
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
        <CircularProgress size={50} sx={{ color: theme.primary }} />
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
              <Store sx={{ fontSize: 32, color: theme.primary, mr: 2 }} />
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  background: theme.accentGradient,
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
                background: theme.accentGradient,
                boxShadow: `0 4px 15px ${theme.primaryAlpha30}`,
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: `0 6px 20px ${theme.primaryAlpha40}`,
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
                    background: theme.accentGradient,
                    boxShadow: `0 4px 15px ${theme.primaryAlpha30}`,
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: `0 6px 20px ${theme.primaryAlpha40}`,
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
                      <TableCell align="center">操作</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {staffMembers.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar sx={{ mr: 2 }}>
                              {getDisplayName(member).charAt(0)}
                            </Avatar>
                            <Typography variant="body2">
                              {getDisplayName(member)}
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
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteMember(member.id, getDisplayName(member))}
                            sx={{
                              color: '#94a3b8',
                              '&:hover': {
                                color: '#ef4444',
                                backgroundColor: 'rgba(239, 68, 68, 0.1)'
                              }
                            }}
                          >
                            <Delete sx={{ fontSize: 20 }} />
                          </IconButton>
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
                    background: theme.accentGradient,
                    boxShadow: `0 4px 15px ${theme.primaryAlpha30}`,
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: `0 6px 20px ${theme.primaryAlpha40}`,
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
                    borderColor: theme.primary,
                    color: theme.primary,
                    '&:hover': {
                      borderColor: theme.secondary,
                      backgroundColor: theme.primaryAlpha05,
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
                    background: theme.accentGradient,
                    boxShadow: `0 4px 15px ${theme.primaryAlpha30}`,
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: `0 6px 20px ${theme.primaryAlpha40}`,
                    }
                  }}
                >
                  スタッフを招待
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* 一括コピーエリア */}
              {invitedInvitations.length > 0 && (
                <Box sx={{
                  mb: 3,
                  p: 2,
                  background: '#f8fafc',
                  borderRadius: 2,
                  border: '1px solid #e2e8f0'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#374151' }}>
                      一括コピー:
                    </Typography>

                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<ContentCopy />}
                      onClick={copySelectedInvitations}
                      disabled={selectedInvitations.length === 0}
                      sx={{
                        background: theme.accentGradient,
                        '&:disabled': {
                          background: '#e2e8f0',
                          color: '#94a3b8'
                        }
                      }}
                    >
                      選択した{selectedInvitations.length}件をコピー
                    </Button>

                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                      ※ 招待中のみ選択可能
                    </Typography>
                  </Box>
                </Box>
              )}

              <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox">
                        <Checkbox
                          indeterminate={selectedInvitations.length > 0 && selectedInvitations.length < invitedInvitations.length}
                          checked={invitedInvitations.length > 0 && selectedInvitations.length === invitedInvitations.length}
                          onChange={handleSelectAll}
                          sx={{
                            '&.Mui-checked': { color: theme.primary },
                            '&.MuiCheckbox-indeterminate': { color: theme.primary }
                          }}
                        />
                      </TableCell>
                      <TableCell>招待者名</TableCell>
                      <TableCell>ロール</TableCell>
                      <TableCell>ステータス</TableCell>
                      <TableCell>招待日</TableCell>
                      <TableCell align="center">操作</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {invitations.map((invitation) => (
                      <TableRow
                        key={invitation.id}
                        selected={selectedInvitations.includes(invitation.id)}
                        sx={{
                          '&.Mui-selected': {
                            backgroundColor: theme.primaryAlpha08,
                          },
                          '&.Mui-selected:hover': {
                            backgroundColor: theme.primaryAlpha15,
                          }
                        }}
                      >
                        <TableCell padding="checkbox">
                          {invitation.status === 'invited' ? (
                            <Checkbox
                              checked={selectedInvitations.includes(invitation.id)}
                              onChange={() => handleSelectInvitation(invitation.id)}
                              sx={{ '&.Mui-checked': { color: theme.primary } }}
                            />
                          ) : (
                            <Checkbox disabled />
                          )}
                        </TableCell>
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
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                            {invitation.status === 'invited' && (
                              <IconButton
                                size="small"
                                onClick={() => copyInvitationUrl(invitation.token, 'production')}
                                sx={{
                                  color: theme.primary,
                                  '&:hover': {
                                    backgroundColor: theme.primaryAlpha10
                                  }
                                }}
                                title="URLをコピー"
                              >
                                <ContentCopy sx={{ fontSize: 20 }} />
                              </IconButton>
                            )}
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteInvitation(invitation.id, invitation.name)}
                              sx={{
                                color: '#94a3b8',
                                '&:hover': {
                                  color: '#ef4444',
                                  backgroundColor: 'rgba(239, 68, 68, 0.1)'
                                }
                              }}
                            >
                              <Delete sx={{ fontSize: 20 }} />
                            </IconButton>
                          </Box>
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
                    background: theme.accentGradient,
                    boxShadow: `0 4px 15px ${theme.primaryAlpha30}`,
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: `0 6px 20px ${theme.primaryAlpha40}`,
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
                    borderColor: theme.primary,
                    color: theme.primary,
                    '&:hover': {
                      borderColor: theme.secondary,
                      backgroundColor: theme.primaryAlpha05,
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
            background: theme.accentGradient,
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
          onInvitationSent={async () => {
            await fetchStoreData();
            setShowInvitationForm(false);
            setTabValue(1);
            toast.success('招待が完了しました');
          }}
        />
      )}
    </Box>
  );
}