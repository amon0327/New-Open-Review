import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  AppBar,
  Toolbar,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  CircularProgress,
  Chip,
  Tabs,
  Tab
} from '@mui/material';
import {
  Handshake,
  Business,
  PersonAdd,
  Settings,
  Logout,
  Dashboard as DashboardIcon,
  People,
  AccountCircle,
  Phone,
  Email,
  Delete,
  HourglassEmpty
} from '@mui/icons-material';
import CompanyCreationDialog from './CompanyCreationDialog';
import PartnerInvitationForm from './PartnerInvitationForm';
import { supabase } from '../lib/supabase';

export default function PartnerDashboard({ user, onLogout }) {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showCompanyDialog, setShowCompanyDialog] = useState(false);
  const [showInvitationDialog, setShowInvitationDialog] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(true);
  const [partnerCompanyInfo, setPartnerCompanyInfo] = useState(null);
  const [members, setMembers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [memberTab, setMemberTab] = useState(0); // 0: メンバー, 1: 招待中

  // 紐付いている企業一覧を取得
  const fetchAffiliatedCompanies = async () => {
    try {
      setIsLoadingCompanies(true);

      // 現在のユーザーのpartner_company_idを取得
      const { data: partnerMembership, error: membershipError } = await supabase
        .from('partner_memberships')
        .select('partner_company_id, partner_company(id, company_name)')
        .eq('business_users_id', user.id)
        .single();

      if (membershipError || !partnerMembership) {
        console.error('パートナー企業情報の取得に失敗:', membershipError);
        setIsLoadingCompanies(false);
        return;
      }

      // パートナー企業情報を保存（company_name を name に変換）
      if (partnerMembership.partner_company) {
        setPartnerCompanyInfo({
          id: partnerMembership.partner_company.id,
          name: partnerMembership.partner_company.company_name
        });
      }

      // partner_affiliate_companiesから紐付いている企業を取得
      const { data: affiliations, error: affiliationsError } = await supabase
        .from('partner_affiliate_companies')
        .select(`
          id,
          created_at,
          companies:companies_id (
            id,
            name,
            phone_number,
            email,
            created_at
          )
        `)
        .eq('partner_company_id', partnerMembership.partner_company_id)
        .order('created_at', { ascending: false });

      if (affiliationsError) {
        console.error('企業一覧の取得に失敗:', affiliationsError);
        setIsLoadingCompanies(false);
        return;
      }

      // companies情報を抽出
      const companiesList = affiliations
        .map(affiliation => affiliation.companies)
        .filter(company => company !== null);

      setCompanies(companiesList);
    } catch (error) {
      console.error('企業一覧取得エラー:', error);
    } finally {
      setIsLoadingCompanies(false);
    }
  };

  // メンバーと招待を取得
  const fetchMembersAndInvitations = async () => {
    if (!partnerCompanyInfo) return;

    try {
      setIsLoadingMembers(true);

      // メンバー一覧を取得
      const { data: membersData, error: membersError } = await supabase
        .from('partner_memberships')
        .select(`
          id,
          created_at,
          role,
          business_users:business_users_id (
            id,
            name,
            email
          )
        `)
        .eq('partner_company_id', partnerCompanyInfo.id)
        .eq('is_active', true);

      if (membersError) {
        console.error('メンバー取得エラー:', membersError);
      } else {
        setMembers(membersData || []);
      }

      // 招待中のリストを取得
      const { data: invitationsData, error: invitationsError } = await supabase
        .from('partner_user_invitations')
        .select('*')
        .eq('partner_company_id', partnerCompanyInfo.id)
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
        .from('partner_user_invitations')
        .delete()
        .eq('id', invitationId);

      if (error) {
        console.error('招待削除エラー:', error);
        alert('招待の削除に失敗しました');
        return;
      }

      // リストを更新
      await fetchMembersAndInvitations();
    } catch (error) {
      console.error('招待削除エラー:', error);
      alert('招待の削除に失敗しました');
    }
  };

  // 初回ロード時に企業一覧を取得
  useEffect(() => {
    if (user) {
      fetchAffiliatedCompanies();
    }
  }, [user]);

  // パートナー企業情報が取得できたらメンバー・招待を取得
  useEffect(() => {
    if (partnerCompanyInfo) {
      fetchMembersAndInvitations();
    }
  }, [partnerCompanyInfo]);

  // メンバータブに切り替えたときにリフレッシュ
  useEffect(() => {
    if (activeTab === 'members' && partnerCompanyInfo) {
      fetchMembersAndInvitations();
    }
  }, [activeTab]);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleMenuClose();
    if (onLogout) {
      onLogout();
    }
  };

  const navigationItems = [
    { id: 'dashboard', label: 'ダッシュボード', icon: <DashboardIcon /> },
    { id: 'companies', label: '企業管理', icon: <Business /> },
    { id: 'members', label: 'メンバー招待', icon: <PersonAdd /> },
    { id: 'settings', label: '設定', icon: <Settings /> },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 4, color: '#1a202c' }}>
              ダッシュボード
            </Typography>

            <Grid container spacing={3}>
              {/* 統計カード */}
              <Grid item xs={12} md={4}>
                <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Business sx={{ fontSize: 40, color: '#5e17eb', mr: 2 }} />
                      <Box>
                        <Typography variant="h3" sx={{ fontWeight: 700, color: '#1a202c' }}>
                          {isLoadingCompanies ? '-' : companies.length}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#64748b' }}>
                          登録企業数
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <People sx={{ fontSize: 40, color: '#10b981', mr: 2 }} />
                      <Box>
                        <Typography variant="h3" sx={{ fontWeight: 700, color: '#1a202c' }}>
                          0
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#64748b' }}>
                          メンバー数
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <PersonAdd sx={{ fontSize: 40, color: '#f59e0b', mr: 2 }} />
                      <Box>
                        <Typography variant="h3" sx={{ fontWeight: 700, color: '#1a202c' }}>
                          0
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#64748b' }}>
                          招待中
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* 最近のアクティビティ */}
              <Grid item xs={12}>
                <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                      最近のアクティビティ
                    </Typography>
                    <Box sx={{ textAlign: 'center', py: 5 }}>
                      <Typography variant="body1" sx={{ color: '#64748b' }}>
                        まだアクティビティがありません
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        );

      case 'companies':
        return (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a202c' }}>
                企業管理
              </Typography>
              <Button
                variant="contained"
                startIcon={<Business />}
                onClick={() => setShowCompanyDialog(true)}
                sx={{
                  background: 'linear-gradient(45deg, #5e17eb 30%, #764ba2 90%)',
                  borderRadius: 2,
                  px: 3
                }}
              >
                企業アカウント作成
              </Button>
            </Box>

            {isLoadingCompanies ? (
              <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)' }}>
                <CardContent>
                  <Box sx={{ textAlign: 'center', py: 8 }}>
                    <CircularProgress sx={{ color: '#5e17eb' }} />
                    <Typography variant="body1" sx={{ color: '#64748b', mt: 2 }}>
                      企業一覧を読み込み中...
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            ) : companies.length === 0 ? (
              <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)' }}>
                <CardContent>
                  <Box sx={{ textAlign: 'center', py: 8 }}>
                    <Business sx={{ fontSize: 80, color: '#e2e8f0', mb: 2 }} />
                    <Typography variant="h6" sx={{ color: '#64748b', mb: 1 }}>
                      登録されている企業がありません
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                      「企業アカウント作成」ボタンから新しい企業を作成してください
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            ) : (
              <Grid container spacing={3}>
                {companies.map((company) => (
                  <Grid item xs={12} md={6} lg={4} key={company.id}>
                    <Card
                      onClick={() => {
                        console.log('🏢 Company card clicked:', company);
                        console.log('  - company.id:', company.id);
                        console.log('  - company.name:', company.name);
                        console.log('🔀 Navigating to /company/' + company.id + '/dashboard');
                        navigate(`/company/${company.id}/dashboard`);
                      }}
                      sx={{
                        borderRadius: 3,
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        cursor: 'pointer',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: '0 8px 30px rgba(94, 23, 235, 0.15)'
                        }
                      }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Business sx={{ fontSize: 32, color: '#5e17eb', mr: 1.5 }} />
                          <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a202c' }}>
                            {company.name}
                          </Typography>
                        </Box>

                        <Divider sx={{ my: 2 }} />

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                          {company.phone_number && (
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Phone sx={{ fontSize: 18, color: '#64748b', mr: 1 }} />
                              <Typography variant="body2" sx={{ color: '#64748b' }}>
                                {company.phone_number}
                              </Typography>
                            </Box>
                          )}

                          {company.email && (
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Email sx={{ fontSize: 18, color: '#64748b', mr: 1 }} />
                              <Typography variant="body2" sx={{ color: '#64748b' }}>
                                {company.email}
                              </Typography>
                            </Box>
                          )}

                          <Box sx={{ mt: 1 }}>
                            <Chip
                              label={`登録日: ${new Date(company.created_at).toLocaleDateString('ja-JP')}`}
                              size="small"
                              sx={{
                                bgcolor: '#f1f5f9',
                                color: '#64748b',
                                fontSize: '0.75rem'
                              }}
                            />
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        );

      case 'members':
        return (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a202c' }}>
                メンバー管理
              </Typography>
              <Button
                variant="contained"
                startIcon={<PersonAdd />}
                onClick={() => setShowInvitationDialog(true)}
                disabled={!partnerCompanyInfo}
                sx={{
                  background: 'linear-gradient(45deg, #5e17eb 30%, #764ba2 90%)',
                  borderRadius: 2,
                  px: 3
                }}
              >
                メンバーを招待
              </Button>
            </Box>

            <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)' }}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs
                  value={memberTab}
                  onChange={(e, newValue) => setMemberTab(newValue)}
                  sx={{
                    px: 2,
                    '& .MuiTab-root': {
                      textTransform: 'none',
                      fontWeight: 600,
                      fontSize: '1rem'
                    },
                    '& .Mui-selected': {
                      color: '#5e17eb'
                    },
                    '& .MuiTabs-indicator': {
                      backgroundColor: '#5e17eb'
                    }
                  }}
                >
                  <Tab
                    label={`メンバー (${members.length})`}
                    icon={<People sx={{ fontSize: 20 }} />}
                    iconPosition="start"
                  />
                  <Tab
                    label={`招待中 (${invitations.length})`}
                    icon={<HourglassEmpty sx={{ fontSize: 20 }} />}
                    iconPosition="start"
                  />
                </Tabs>
              </Box>

              <CardContent>
                {isLoadingMembers ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <>
                    {/* メンバータブ */}
                    {memberTab === 0 && (
                      <>
                        {members.length === 0 ? (
                          <Box sx={{ textAlign: 'center', py: 8 }}>
                            <People sx={{ fontSize: 60, color: '#e2e8f0', mb: 2 }} />
                            <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                              メンバーがいません
                            </Typography>
                          </Box>
                        ) : (
                          <List sx={{ pt: 0 }}>
                            {members.map((member, index) => (
                              <React.Fragment key={member.id}>
                                {index > 0 && <Divider />}
                                <ListItem>
                                  <ListItemIcon>
                                    <Avatar sx={{ bgcolor: '#5e17eb' }}>
                                      {member.business_users?.name?.[0] || '?'}
                                    </Avatar>
                                  </ListItemIcon>
                                  <ListItemText
                                    primary={member.business_users?.name || '名前なし'}
                                    secondary={
                                      <Box component="span" sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                        <Typography variant="body2" component="span" sx={{ color: '#64748b' }}>
                                          {member.business_users?.email}
                                        </Typography>
                                        <Chip
                                          label={member.role === 'owner' ? 'オーナー' : member.role}
                                          size="small"
                                          sx={{
                                            width: 'fit-content',
                                            bgcolor: '#f1f5f9',
                                            color: '#5e17eb',
                                            fontSize: '0.75rem',
                                            height: '20px'
                                          }}
                                        />
                                      </Box>
                                    }
                                  />
                                </ListItem>
                              </React.Fragment>
                            ))}
                          </List>
                        )}
                      </>
                    )}

                    {/* 招待中タブ */}
                    {memberTab === 1 && (
                      <>
                        {invitations.length === 0 ? (
                          <Box sx={{ textAlign: 'center', py: 8 }}>
                            <HourglassEmpty sx={{ fontSize: 60, color: '#e2e8f0', mb: 2 }} />
                            <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                              招待中のメンバーはいません
                            </Typography>
                          </Box>
                        ) : (
                          <List sx={{ pt: 0 }}>
                            {invitations.map((invitation, index) => (
                              <React.Fragment key={invitation.id}>
                                {index > 0 && <Divider />}
                                <ListItem
                                  secondaryAction={
                                    <IconButton
                                      edge="end"
                                      aria-label="delete"
                                      onClick={() => {
                                        if (window.confirm(`${invitation.name}さんへの招待を削除しますか？`)) {
                                          handleDeleteInvitation(invitation.id);
                                        }
                                      }}
                                      sx={{ color: '#ef4444' }}
                                    >
                                      <Delete />
                                    </IconButton>
                                  }
                                >
                                  <ListItemIcon>
                                    <Avatar sx={{ bgcolor: '#f59e0b' }}>
                                      {invitation.name?.[0] || '?'}
                                    </Avatar>
                                  </ListItemIcon>
                                  <ListItemText
                                    primary={invitation.name}
                                    secondary={
                                      <Box component="span" sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                        <Typography variant="body2" component="span" sx={{ color: '#64748b' }}>
                                          招待日: {new Date(invitation.created_at).toLocaleDateString('ja-JP')}
                                        </Typography>
                                        <Chip
                                          label="招待中"
                                          size="small"
                                          sx={{
                                            width: 'fit-content',
                                            bgcolor: '#fef3c7',
                                            color: '#f59e0b',
                                            fontSize: '0.75rem',
                                            height: '20px'
                                          }}
                                        />
                                      </Box>
                                    }
                                  />
                                </ListItem>
                              </React.Fragment>
                            ))}
                          </List>
                        )}
                      </>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </Box>
        );

      case 'settings':
        return (
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 4, color: '#1a202c' }}>
              設定
            </Typography>

            <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)' }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  パートナー企業情報
                </Typography>
                <Box sx={{ textAlign: 'center', py: 5 }}>
                  <Typography variant="body1" sx={{ color: '#64748b' }}>
                    設定画面は準備中です
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Box>
        );

      default:
        return null;
    }
  };

  const handleCompanyCreated = async (company) => {
    setShowCompanyDialog(false);
    // 企業一覧を再取得して最新の状態を表示
    await fetchAffiliatedCompanies();
  };

  return (
    <Box sx={{ minHeight: '100vh', background: '#ffffff' }}>
      {/* 企業作成ダイアログ */}
      <CompanyCreationDialog
        open={showCompanyDialog}
        onClose={() => setShowCompanyDialog(false)}
        onCompanyCreated={handleCompanyCreated}
      />

      {/* メンバー招待ダイアログ */}
      {showInvitationDialog && partnerCompanyInfo && (
        <PartnerInvitationForm
          partnerCompanyId={partnerCompanyInfo.id}
          partnerCompanyName={partnerCompanyInfo.name}
          onClose={() => setShowInvitationDialog(false)}
          onInvitationSent={() => {
            // 招待リストを更新
            fetchMembersAndInvitations();
          }}
        />
      )}

      {/* AppBar */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          background: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          color: '#1a202c'
        }}
      >
        <Toolbar>
          <Handshake sx={{ fontSize: 32, color: '#5e17eb', mr: 2 }} />
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
            Partner Dashboard
          </Typography>

          <IconButton onClick={handleMenuOpen}>
            <Avatar sx={{ bgcolor: '#5e17eb' }}>
              {user?.user_metadata?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
            </Avatar>
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            PaperProps={{
              sx: { borderRadius: 2, minWidth: 200 }
            }}
          >
            <MenuItem disabled>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {user?.user_metadata?.name || 'ユーザー'}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  {user?.email}
                </Typography>
              </Box>
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <Logout fontSize="small" />
              </ListItemIcon>
              ログアウト
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Box sx={{ display: 'flex', pt: 8 }}>
        {/* Sidebar */}
        <Paper
          elevation={0}
          sx={{
            width: 280,
            height: 'calc(100vh - 64px)',
            position: 'fixed',
            borderRight: '1px solid #e2e8f0',
            background: '#ffffff'
          }}
        >
          <List sx={{ pt: 3 }}>
            {navigationItems.map((item) => (
              <ListItem key={item.id} disablePadding sx={{ px: 2 }}>
                <ListItemButton
                  selected={activeTab === item.id}
                  onClick={() => setActiveTab(item.id)}
                  sx={{
                    borderRadius: 2,
                    mb: 1,
                    '&.Mui-selected': {
                      background: 'linear-gradient(45deg, #5e17eb 30%, #764ba2 90%)',
                      color: '#ffffff',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #5e17eb 30%, #764ba2 90%)',
                      },
                      '& .MuiListItemIcon-root': {
                        color: '#ffffff'
                      }
                    }
                  }}
                >
                  <ListItemIcon sx={{ color: activeTab === item.id ? '#ffffff' : '#64748b' }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.label} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Paper>

        {/* Content Area */}
        <Box sx={{ flexGrow: 1, ml: '280px', p: 4 }}>
          <Container maxWidth="xl">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {renderContent()}
            </motion.div>
          </Container>
        </Box>
      </Box>
    </Box>
  );
}
