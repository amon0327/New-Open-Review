import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  IconButton,
  Tabs,
  Tab,
  Chip,
  Skeleton
} from '@mui/material';
import {
  ExitToApp,
  PersonAdd,
  People,
  HourglassEmpty,
  Delete,
  ContentCopy
} from '@mui/icons-material';
import { supabase } from '../../../lib/supabase';
import toast from 'react-hot-toast';
import CompanyInvitationForm from '../../CompanyInvitationForm';
import { usePartnerTheme } from '../../../contexts/PartnerThemeContext';

export default function SettingsPage({ user, onLogout, companyId, companyName }) {
  const theme = usePartnerTheme();
  // 管理メンバー関連の状態
  const [members, setMembers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [memberTab, setMemberTab] = useState(0); // 0: メンバー, 1: 招待中
  const [showInvitationDialog, setShowInvitationDialog] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // メンバーと招待を取得
  const fetchMembersAndInvitations = async () => {
    if (!companyId) return;

    try {
      setIsLoadingMembers(true);

      // メンバー一覧を取得
      const { data: membersData, error: membersError } = await supabase
        .from('company_memberships')
        .select(`
          id,
          created_at,
          business_users:business_user_id (
            id,
            name,
            email
          )
        `)
        .eq('company_id', companyId);

      if (membersError) {
        console.error('メンバー取得エラー:', membersError);
      } else {
        setMembers(membersData || []);
      }

      // 招待中のリストを取得
      const { data: invitationsData, error: invitationsError } = await supabase
        .from('company_user_invitations')
        .select('*')
        .eq('company_id', companyId)
        .eq('status', 'invited')
        .order('created_at', { ascending: false });

      if (invitationsError) {
        console.error('招待取得エラー:', invitationsError);
      } else {
        setInvitations(invitationsData || []);
      }
    } catch (error) {
      console.error('メンバー・招待取得エラー:', error);
    } finally {
      setIsLoadingMembers(false);
    }
  };

  // 招待を削除
  const handleDeleteInvitation = async (invitationId) => {
    try {
      const { error } = await supabase
        .from('company_user_invitations')
        .delete()
        .eq('id', invitationId);

      if (error) {
        console.error('招待削除エラー:', error);
        toast.error('招待の削除に失敗しました');
        return;
      }

      toast.success('招待を削除しました');
      // リストを更新
      await fetchMembersAndInvitations();
    } catch (error) {
      console.error('招待削除エラー:', error);
      toast.error('招待の削除に失敗しました');
    }
  };

  // メンバーを削除
  const handleDeleteMember = async (memberId, memberName) => {
    if (!window.confirm(`${memberName}さんをメンバーから削除しますか？`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('company_memberships')
        .delete()
        .eq('id', memberId);

      if (error) {
        console.error('メンバー削除エラー:', error);
        toast.error('メンバーの削除に失敗しました');
        return;
      }

      toast.success(`${memberName}さんをメンバーから削除しました`);
      // リストを更新
      await fetchMembersAndInvitations();
    } catch (error) {
      console.error('メンバー削除エラー:', error);
      toast.error('メンバーの削除に失敗しました');
    }
  };

  // 初回ロード時にメンバー・招待を取得
  useEffect(() => {
    fetchMembersAndInvitations();
  }, [companyId]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      onLogout();
    } catch (error) {
      console.error('ログアウトエラー:', error);
      setMessage({ type: 'error', text: 'ログアウトに失敗しました' });
    }
  };

  // URLをコピー
  const handleCopyInvitationUrl = (url) => {
    navigator.clipboard.writeText(url);
    toast.success('招待URLをコピーしました');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Box
        sx={{
          minHeight: '100vh',
          overflow: 'auto',
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
          p: 3
        }}
      >
        {/* メッセージ表示 */}
        {message.text && (
          <Alert 
            severity={message.type} 
            sx={{ 
              mb: 3,
              borderRadius: 1,
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
            }}
            onClose={() => setMessage({ type: '', text: '' })}
          >
            {message.text}
          </Alert>
        )}

        {/* 管理メンバー設定 */}
        <Card
          sx={{
            borderRadius: 1,
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.08)',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            mb: 3
          }}
        >
          {/* ヘッダー */}
          <Box sx={{ 
            p: 3, 
            borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 1,
                  background: `linear-gradient(135deg, ${theme.accent} 0%, ${theme.secondary} 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <People sx={{ color: 'white', fontSize: 24 }} />
              </Box>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#1a202c' }}>
                  管理メンバー
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
                  チームメンバーの管理と招待
                </Typography>
              </Box>
            </Box>
            <Button
              variant="contained"
              startIcon={<PersonAdd />}
              onClick={() => setShowInvitationDialog(true)}
              sx={{
                background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.accent} 100%)`,
                borderRadius: 1,
                px: 3,
                py: 1.5,
                textTransform: 'none',
                fontWeight: 600,
                boxShadow: `0 4px 20px ${theme.primaryAlpha30}`,
                '&:hover': {
                  background: 'linear-gradient(135deg, #4c0dbf 0%, #5a6fd8 100%)',
                  transform: 'translateY(-2px)',
                  boxShadow: `0 8px 30px ${theme.primaryAlpha40}`,
                }
              }}
            >
              メンバーを招待
            </Button>
          </Box>

          {/* タブ */}
          <Tabs
            value={memberTab}
            onChange={(e, newValue) => setMemberTab(newValue)}
            sx={{
              borderBottom: '1px solid #e2e8f0',
              px: 2,
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '1rem',
                minHeight: 60,
                '&.Mui-selected': {
                  color: theme.primary
                }
              },
              '& .MuiTabs-indicator': {
                backgroundColor: theme.primary,
                height: 3
              }
            }}
          >
            <Tab 
              label="メンバー" 
              icon={<People />}
              iconPosition="start"
            />
            <Tab 
              label="招待中" 
              icon={<HourglassEmpty />}
              iconPosition="start"
            />
          </Tabs>

          <CardContent sx={{ p: 0 }}>
            {/* ローディング */}
            {isLoadingMembers ? (
              <Box sx={{ p: 3 }}>
                {[1, 2, 3].map((i) => (
                  <Skeleton 
                    key={i} 
                    variant="rectangular" 
                    height={72} 
                    sx={{ mb: 2, borderRadius: 1 }} 
                  />
                ))}
              </Box>
            ) : (
              <>
                {/* メンバータブ */}
                {memberTab === 0 && (
                  <List sx={{ p: 2 }}>
                    {members.length === 0 ? (
                      <Box sx={{ py: 6, textAlign: 'center' }}>
                        <Typography color="text.secondary">
                          まだメンバーがいません
                        </Typography>
                      </Box>
                    ) : (
                      members.map((member) => (
                        <ListItem
                          key={member.id}
                          sx={{
                            borderRadius: 1,
                            mb: 1,
                            '&:hover': {
                              backgroundColor: `${theme.primary}0a`
                            }
                          }}
                          secondaryAction={
                            <IconButton 
                              edge="end" 
                              onClick={() => handleDeleteMember(member.id, member.business_users?.name || member.business_users?.email)}
                              sx={{
                                color: '#ef4444',
                                '&:hover': {
                                  backgroundColor: 'rgba(239, 68, 68, 0.08)'
                                }
                              }}
                            >
                              <Delete />
                            </IconButton>
                          }
                        >
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: theme.accent }}>
                              {member.business_users?.name?.charAt(0) || member.business_users?.email?.charAt(0)}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={member.business_users?.name || '名前未設定'}
                            secondary={member.business_users?.email}
                            primaryTypographyProps={{
                              fontWeight: 600
                            }}
                          />
                        </ListItem>
                      ))
                    )}
                  </List>
                )}

                {/* 招待中タブ */}
                {memberTab === 1 && (
                  <List sx={{ p: 2 }}>
                    {invitations.length === 0 ? (
                      <Box sx={{ py: 6, textAlign: 'center' }}>
                        <Typography color="text.secondary">
                          招待中のメンバーはいません
                        </Typography>
                      </Box>
                    ) : (
                      invitations.map((invitation) => (
                        <ListItem
                          key={invitation.id}
                          sx={{
                            borderRadius: 1,
                            mb: 1,
                            backgroundColor: `${theme.primary}05`,
                            '&:hover': {
                              backgroundColor: `${theme.primary}0f`
                            }
                          }}
                          secondaryAction={
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                              <IconButton
                                size="small"
                                onClick={() => handleCopyInvitationUrl(`https://app.openreview.jp/company-invitation/${invitation.token}`)}
                                sx={{
                                  color: '#64748b',
                                  '&:hover': {
                                    color: theme.primary
                                  }
                                }}
                              >
                                <ContentCopy fontSize="small" />
                              </IconButton>
                              <IconButton 
                                edge="end" 
                                onClick={() => handleDeleteInvitation(invitation.id)}
                                sx={{
                                  color: '#ef4444',
                                  '&:hover': {
                                    backgroundColor: 'rgba(239, 68, 68, 0.08)'
                                  }
                                }}
                              >
                                <Delete />
                              </IconButton>
                            </Box>
                          }
                        >
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: '#f59e0b' }}>
                              <HourglassEmpty />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <span>{invitation.name || '名前未設定'}</span>
                                <Chip 
                                  label="招待中" 
                                  size="small" 
                                  sx={{ 
                                    bgcolor: '#fef3c7',
                                    color: '#d97706',
                                    fontWeight: 600,
                                    fontSize: '0.75rem'
                                  }} 
                                />
                              </Box>
                            }
                            secondary={`招待日: ${new Date(invitation.created_at).toLocaleDateString('ja-JP')}`}
                            primaryTypographyProps={{
                              fontWeight: 600
                            }}
                          />
                        </ListItem>
                      ))
                    )}
                  </List>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* ログアウトセクション */}
        <Card
          sx={{
            borderRadius: 1,
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.08)',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)'
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 1,
                    background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <ExitToApp sx={{ color: 'white', fontSize: 24 }} />
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a202c' }}>
                    ログアウト
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
                    現在のセッションを終了します
                  </Typography>
                </Box>
              </Box>
              
              <Button
                variant="contained"
                color="error"
                startIcon={<ExitToApp />}
                onClick={handleLogout}
                sx={{
                  borderRadius: 1,
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 3,
                  py: 1.5,
                  fontSize: '1rem',
                  background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
                  boxShadow: '0 4px 20px rgba(255, 107, 107, 0.3)',
                  '&:hover': {
                    boxShadow: '0 8px 25px rgba(255, 107, 107, 0.4)',
                    transform: 'translateY(-2px)'
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                ログアウト
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* 招待フォームダイアログ */}
        {showInvitationDialog && (
          <CompanyInvitationForm
            open={showInvitationDialog}
            onClose={() => setShowInvitationDialog(false)}
            companyId={companyId}
            companyName={companyName}
            onInvitationCreated={async () => {
              await fetchMembersAndInvitations();
              setShowInvitationDialog(false);
            }}
          />
        )}
      </Box>
    </motion.div>
  );
}