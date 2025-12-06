import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  IconButton,
  Tabs,
  Tab,
  Chip
} from '@mui/material';
import {
  PersonAdd,
  People,
  HourglassEmpty,
  Delete,
  ContentCopy,
  Email
} from '@mui/icons-material';
import { supabase } from '../../../lib/supabase';
import toast from 'react-hot-toast';
import CompanyInvitationForm from '../../CompanyInvitationForm';

export default function CompanyAdminPage({ companyId, companyName }) {
  const [members, setMembers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [memberTab, setMemberTab] = useState(0); // 0: メンバー, 1: 招待中
  const [showInvitationDialog, setShowInvitationDialog] = useState(false);

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

  // 初回ロード時にメンバー・招待を取得
  useEffect(() => {
    fetchMembersAndInvitations();
  }, [companyId]);

  return (
    <Box>
      {/* ヘッダー */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          企業管理者
        </Typography>
        <Button
          variant="contained"
          startIcon={<PersonAdd />}
          onClick={() => setShowInvitationDialog(true)}
          sx={{
            background: 'linear-gradient(45deg, #5e17eb 30%, #764ba2 90%)',
            boxShadow: '0 4px 15px rgba(94, 23, 235, 0.3)',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 6px 20px rgba(94, 23, 235, 0.4)',
            }
          }}
        >
          メンバーを招待
        </Button>
      </Box>

      {/* メンバー・招待リストカード */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card
          sx={{
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
            border: '1px solid rgba(0, 0, 0, 0.05)'
          }}
        >
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
                  color: '#5e17eb'
                }
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#5e17eb',
                height: 3
              }
            }}
          >
            <Tab
              label={`メンバー (${members.length})`}
              icon={<People />}
              iconPosition="start"
            />
            <Tab
              label={`招待中 (${invitations.length})`}
              icon={<HourglassEmpty />}
              iconPosition="start"
            />
          </Tabs>

          <CardContent sx={{ p: 0 }}>
            {isLoadingMembers ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
                <CircularProgress sx={{ color: '#5e17eb' }} />
              </Box>
            ) : (
              <>
                {/* メンバー一覧 */}
                {memberTab === 0 && (
                  <List sx={{ p: 0 }}>
                    {members.length === 0 ? (
                      <Box sx={{ p: 6, textAlign: 'center' }}>
                        <People sx={{ fontSize: 64, color: '#cbd5e1', mb: 2 }} />
                        <Typography variant="body1" sx={{ color: '#64748b' }}>
                          まだメンバーがいません
                        </Typography>
                      </Box>
                    ) : (
                      members.map((member, index) => (
                        <ListItem
                          key={member.id}
                          sx={{
                            borderBottom: index < members.length - 1 ? '1px solid #f1f5f9' : 'none',
                            py: 2,
                            px: 3
                          }}
                        >
                          <ListItemAvatar>
                            <Avatar
                              sx={{
                                background: 'linear-gradient(45deg, #5e17eb 30%, #764ba2 90%)',
                                width: 48,
                                height: 48,
                                fontSize: '1.2rem'
                              }}
                            >
                              {member.business_users?.name?.charAt(0) || '?'}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                                {member.business_users?.name || '名前なし'}
                              </Typography>
                            }
                            secondary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                <Email sx={{ fontSize: 16, color: '#64748b' }} />
                                <Typography variant="body2" sx={{ color: '#64748b' }}>
                                  {member.business_users?.email || 'メールなし'}
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                      ))
                    )}
                  </List>
                )}

                {/* 招待中一覧 */}
                {memberTab === 1 && (
                  <List sx={{ p: 0 }}>
                    {invitations.length === 0 ? (
                      <Box sx={{ p: 6, textAlign: 'center' }}>
                        <HourglassEmpty sx={{ fontSize: 64, color: '#cbd5e1', mb: 2 }} />
                        <Typography variant="body1" sx={{ color: '#64748b' }}>
                          招待中のユーザーはいません
                        </Typography>
                      </Box>
                    ) : (
                      invitations.map((invitation, index) => (
                        <ListItem
                          key={invitation.id}
                          sx={{
                            borderBottom: index < invitations.length - 1 ? '1px solid #f1f5f9' : 'none',
                            py: 2,
                            px: 3
                          }}
                          secondaryAction={
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<ContentCopy />}
                                onClick={() => {
                                  const url = `http://localhost:3000/company-invitation/${invitation.token}`;
                                  navigator.clipboard.writeText(url);
                                  toast.success('開発版URLをコピーしました');
                                }}
                                sx={{
                                  borderColor: '#e2e8f0',
                                  color: '#64748b',
                                  fontSize: '0.75rem',
                                  py: 0.5,
                                  px: 1,
                                  '&:hover': {
                                    borderColor: '#5e17eb',
                                    background: '#f8f4ff'
                                  }
                                }}
                              >
                                開発版
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<ContentCopy />}
                                onClick={() => {
                                  const url = `https://app.openreview.jp/company-invitation/${invitation.token}`;
                                  navigator.clipboard.writeText(url);
                                  toast.success('本番版URLをコピーしました');
                                }}
                                sx={{
                                  borderColor: '#e2e8f0',
                                  color: '#64748b',
                                  fontSize: '0.75rem',
                                  py: 0.5,
                                  px: 1,
                                  '&:hover': {
                                    borderColor: '#5e17eb',
                                    background: '#f8f4ff'
                                  }
                                }}
                              >
                                本番版
                              </Button>
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteInvitation(invitation.id)}
                                sx={{
                                  color: '#ef4444',
                                  '&:hover': {
                                    background: '#fee2e2'
                                  }
                                }}
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            </Box>
                          }
                        >
                          <ListItemAvatar>
                            <Avatar
                              sx={{
                                background: '#fbbf24',
                                width: 48,
                                height: 48,
                                fontSize: '1.2rem'
                              }}
                            >
                              <HourglassEmpty />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                                  {invitation.name}
                                </Typography>
                                <Chip
                                  label="招待中"
                                  size="small"
                                  sx={{
                                    background: '#fef3c7',
                                    color: '#92400e',
                                    fontWeight: 500,
                                    fontSize: '0.7rem'
                                  }}
                                />
                              </Box>
                            }
                            secondary={
                              <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
                                招待日: {new Date(invitation.created_at).toLocaleDateString('ja-JP')}
                              </Typography>
                            }
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
      </motion.div>

      {/* 招待ダイアログ */}
      {showInvitationDialog && (
        <CompanyInvitationForm
          companyId={companyId}
          companyName={companyName}
          onClose={() => setShowInvitationDialog(false)}
          onInvitationSent={() => {
            fetchMembersAndInvitations();
          }}
        />
      )}
    </Box>
  );
}
