import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Avatar,
  IconButton,
  Badge,
  CircularProgress,
  Backdrop,
  Card,
  CardContent,
  Tooltip,
  Chip
} from '@mui/material';
import {
  Home,
  Add,
  Analytics,
  Settings,
  Notifications,
  AccountCircle,
  Info,
  Business,
  Apps,
  ArrowBack
} from '@mui/icons-material';
import FormCreator from './FormCreator';
import NotificationDropdown from './NotificationDropdown';
import CompanySetup from './CompanySetup';
import PartnerCompanySetup from './PartnerCompanySetup';
import PartnerDashboard from './PartnerDashboard';
import { supabase } from '../lib/supabase';

// 分離したページコンポーネントをインポート
import HomePage from './dashboard/pages/HomePage';
import CreatePagePlaceholder from './dashboard/pages/CreatePagePlaceholder';
import AnalyticsPage from './dashboard/pages/AnalyticsPage';
import SettingsPage from './dashboard/pages/SettingsPage';
import StoresManagementPage from './dashboard/pages/StoresManagementPage';
import AppPage from './dashboard/pages/AppPage';

const drawerWidth = 280;
const collapsedDrawerWidth = 72;

const navigationItems = [
  { text: 'ホーム', icon: <Home />, component: HomePage },
  { text: '店舗管理', icon: <Business />, component: StoresManagementPage },
  { text: 'アプリ表示', icon: <Apps />, component: AppPage },
  { text: '分析', icon: <Analytics />, component: AnalyticsPage },
  { text: '設定', icon: <Settings />, component: SettingsPage },
];

export default function Dashboard({ onCreateClick, onLogout, user, selectedCompany = null, onBackToPartnerDashboard = null }) {
  const [activeTab, setActiveTab] = useState(0);
  const [isNavCollapsed, setIsNavCollapsed] = useState(false);
  const [notificationAnchor, setNotificationAnchor] = useState(null);
  const [showCompanySetup, setShowCompanySetup] = useState(false);
  const [showPartnerCompanySetup, setShowPartnerCompanySetup] = useState(false);
  const [showPartnerDashboard, setShowPartnerDashboard] = useState(false);
  const [isCheckingCompany, setIsCheckingCompany] = useState(!selectedCompany);

  // ユーザーの会社情報をチェック（selectedCompanyが渡されている場合はスキップ）
  useEffect(() => {
    // 企業コンテキストで開かれている場合は会社チェックをスキップ
    if (selectedCompany) {
      setIsCheckingCompany(false);
      return;
    }

    const checkUserCompany = async () => {
      try {
        // 認証されたユーザーの情報を取得
        const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();

        if (authError || !currentUser) {
          console.error('認証情報の取得に失敗:', authError);
          // 未ログインの場合は会社情報登録を表示しない
          if (onLogout) {
            onLogout(); // ログアウト処理を実行してログイン画面に戻る
          }
          setIsCheckingCompany(false);
          return;
        }

        // 1. まずcompany_membershipsをチェック
        const { data: companyData, error: companyError } = await supabase
          .from('company_memberships')
          .select('id, company_id')
          .eq('business_user_id', currentUser.id);

        if (!companyError && companyData && companyData.length > 0) {
          // company_membershipsにレコードがある → 既存の通常Dashboard
          console.log('✅ Company membership found - showing normal dashboard');
          setIsCheckingCompany(false);
          return;
        }

        // 2. company_membershipsにない場合、partner_membershipsをチェック
        const { data: partnerData, error: partnerError } = await supabase
          .from('partner_memberships')
          .select('id, partner_company_id')
          .eq('business_users_id', currentUser.id);

        if (!partnerError && partnerData && partnerData.length > 0) {
          // partner_company_membershipsにレコードがある → PartnerDashboard表示
          console.log('✅ Partner membership found - showing partner dashboard');
          setShowPartnerDashboard(true);
          setIsCheckingCompany(false);
          return;
        }

        // 3. どちらにもない場合 → PartnerCompanySetup表示
        console.log('⚠️ No membership found - showing partner company setup');
        setShowPartnerCompanySetup(true);

      } catch (error) {
        console.error('会社情報チェック中にエラー:', error);
        setShowPartnerCompanySetup(true);
      } finally {
        setIsCheckingCompany(false);
      }
    };

    checkUserCompany();
  }, []);

  const handleCompanyCreated = (companyData) => {
    setShowCompanySetup(false);
  };

  const handlePartnerCompanyCreated = (partnerCompanyData) => {
    console.log('✅ Partner company created:', partnerCompanyData);
    setShowPartnerCompanySetup(false);
    setShowPartnerDashboard(true);
  };

  // 会社情報チェック中の表示
  if (isCheckingCompany) {
    return (
      <Box
        sx={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}
      >
        <Card
          sx={{
            minWidth: 300,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 20px 60px rgba(94, 23, 235, 0.3)',
            borderRadius: 3,
            textAlign: 'center'
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <CircularProgress
              size={50}
              thickness={4}
              sx={{
                color: '#5e17eb',
                mb: 2
              }}
            />
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                background: 'linear-gradient(45deg, #5e17eb 30%, #764ba2 90%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 1
              }}
            >
              初期化中...
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: '#64748b' }}
            >
              アカウント情報を確認しています
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  // Partner会社セットアップが必要な場合
  if (showPartnerCompanySetup) {
    return (
      <PartnerCompanySetup
        user={user}
        onPartnerCompanyCreated={handlePartnerCompanyCreated}
      />
    );
  }

  // PartnerDashboard表示
  if (showPartnerDashboard) {
    return (
      <PartnerDashboard
        user={user}
        onLogout={onLogout}
      />
    );
  }

  // 会社セットアップが必要な場合（旧来のフロー - 通常は使用されない）
  if (showCompanySetup) {
    return (
      <CompanySetup
        user={user}
        onCompanyCreated={handleCompanyCreated}
      />
    );
  }

  const renderContent = () => {
    const ActiveComponent = navigationItems[activeTab].component;
    if (!ActiveComponent) {
      return null;
    }
    if (navigationItems[activeTab].text === '設定') {
      return <ActiveComponent user={user} onLogout={onLogout} />;
    } else if (navigationItems[activeTab].text === 'ホーム') {
      return <ActiveComponent user={user} onCreateFormClick={onCreateClick} />;
    } else if (navigationItems[activeTab].text === '分析') {
      return <ActiveComponent onNavCollapse={(collapsed) => setIsNavCollapsed(collapsed)} />;
    }
    return <ActiveComponent />;
  };

  const handleNavClick = (index) => {
    setActiveTab(index);
  };

  const handleNotificationClick = (event) => {
    setNotificationAnchor(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchor(null);
  };

  return (
    <FormCreator user={user} onCreateFormClick={onCreateClick}>
      {({ onCreateForm, isCreatingForm }) => (
        <Box sx={{ display: 'flex', height: '100vh' }}>
          {/* モダンなローディング表示 */}
          <Backdrop
            sx={{
              color: '#fff',
              zIndex: 9999,
              background: 'rgba(94, 23, 235, 0.1)',
              backdropFilter: 'blur(10px)'
            }}
            open={isCreatingForm}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <Card
                sx={{
                  minWidth: 300,
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  boxShadow: '0 20px 60px rgba(94, 23, 235, 0.3)',
                  borderRadius: 3,
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <CardContent sx={{ textAlign: 'center', p: 4 }}>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    style={{ display: 'inline-block', marginBottom: 16 }}
                  >
                    <CircularProgress
                      size={50}
                      thickness={4}
                      sx={{
                        color: '#5e17eb',
                        '& .MuiCircularProgress-circle': {
                          strokeLinecap: 'round',
                        }
                      }}
                    />
                  </motion.div>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      background: 'linear-gradient(45deg, #5e17eb 30%, #764ba2 90%)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      mb: 1
                    }}
                  >
                    フォームを作成中...
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#64748b',
                      fontWeight: 400
                    }}
                  >
                    新しいレビューフォームを準備しています
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Backdrop>

      {/* Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: isNavCollapsed ? collapsedDrawerWidth : drawerWidth,
          flexShrink: 0,
          transition: 'width 0.3s ease',
          '& .MuiDrawer-paper': {
            width: isNavCollapsed ? collapsedDrawerWidth : drawerWidth,
            boxSizing: 'border-box',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: 'none',
            boxShadow: '4px 0 20px rgba(0, 0, 0, 0.1)',
            borderRadius: 0,
            transition: 'width 0.3s ease',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          },
        }}
      >
        {/* Logo Section */}
        <Box
          sx={{
            p: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: isNavCollapsed ? 'center' : 'flex-start',
            gap: 2,
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            transition: 'all 0.3s ease',
            minHeight: 88
          }}
        >
          {isNavCollapsed ? (
            <img
              src="https://otfreskkeaenahqziriz.supabase.co/storage/v1/object/public/app-assets/logo/OpenReviewLogo.png"
              alt="OpenReview"
              style={{
                width: '40px',
                height: '40px',
                objectFit: 'contain',
                borderRadius: '50%'
              }}
            />
          ) : (
            <img
              src="https://otfreskkeaenahqziriz.supabase.co/storage/v1/object/public/app-assets/logo/OpenReviewDarkThemeLoog.png"
              alt="OpenReview"
              style={{
                height: '40px',
                width: 'auto',
                objectFit: 'contain'
              }}
            />
          )}
        </Box>

        {/* Navigation Items */}
        <List sx={{ px: isNavCollapsed ? 1 : 2, py: 3 }}>
          {/* Back to Partner Dashboard Button */}
          {onBackToPartnerDashboard && (
            <ListItem disablePadding sx={{ mb: 2 }}>
              <ListItemButton
                onClick={onBackToPartnerDashboard}
                sx={{
                  py: 1.5,
                  px: isNavCollapsed ? 1 : 2,
                  color: '#a5b4fc',
                  backgroundColor: 'transparent',
                  '&:hover': {
                    backgroundColor: 'transparent',
                    '& .MuiListItemText-primary': {
                      textDecoration: 'underline'
                    }
                  },
                  justifyContent: isNavCollapsed ? 'center' : 'flex-start',
                  borderRadius: '100px',
                  minHeight: 48,
                  alignItems: 'center',
                  transition: 'all 0.3s ease'
                }}
              >
                <ListItemIcon
                  sx={{
                    color: '#a5b4fc',
                    minWidth: isNavCollapsed ? 24 : 40,
                    justifyContent: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    height: 24
                  }}
                >
                  <ArrowBack />
                </ListItemIcon>
                {!isNavCollapsed && (
                  <ListItemText
                    primary="パートナーページに戻る"
                    primaryTypographyProps={{
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      color: '#a5b4fc'
                    }}
                  />
                )}
              </ListItemButton>
            </ListItem>
          )}

          {navigationItems.map((item, index) => (
            <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
              <ListItemButton
                onClick={() => handleNavClick(index)}
                sx={{
                  py: 1.5,
                  px: isNavCollapsed ? 1 : 2,
                  color: 'rgba(255, 255, 255, 0.8)',
                  backgroundColor: activeTab === index ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  },
                  justifyContent: isNavCollapsed ? 'center' : 'flex-start',
                  borderRadius: '100px',
                  minHeight: 48,
                  alignItems: 'center',
                  transition: 'all 0.3s ease'
                }}
              >
                <ListItemIcon
                  sx={{
                    color: activeTab === index ? 'white' : 'rgba(255, 255, 255, 0.8)',
                    minWidth: isNavCollapsed ? 24 : 40,
                    justifyContent: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    height: 24
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                {!isNavCollapsed && (
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      fontWeight: activeTab === index ? 600 : 400,
                      color: activeTab === index ? 'white' : 'rgba(255, 255, 255, 0.8)'
                    }}
                  />
                )}
              </ListItemButton>
            </ListItem>
          ))}
        </List>


        {/* Bottom Section: Preview Notice and User Profile */}
        <Box sx={{ mt: 'auto' }}>
          {/* Preview Version Notice */}
          {!onBackToPartnerDashboard && (
            <Box
              sx={{
                px: isNavCollapsed ? 1.5 : 3,
                pb: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: 1
              }}
            >
              <Tooltip
                title="プレビュー版につき、データなどは一時的な保存となります。あくまでもプレビュー版としてご利用ください。"
                placement="top"
                arrow
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    cursor: 'pointer'
                  }}
                >
                  <Info
                    sx={{
                      fontSize: 14,
                      color: 'white',
                      '&:hover': {
                        color: 'rgba(255, 255, 255, 0.8)'
                      }
                    }}
                  />
                  {!isNavCollapsed && (
                    <Typography
                      variant="caption"
                      sx={{
                        color: 'white',
                        fontWeight: 600,
                        fontSize: '0.75rem'
                      }}
                    >
                      プレビュー版
                    </Typography>
                  )}
                </Box>
              </Tooltip>
            </Box>
          )}

          {/* User Profile Section */}
          <Box
            sx={{
              p: isNavCollapsed ? 1.5 : 3,
              borderTop: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: isNavCollapsed ? 'center' : 'flex-start',
              gap: isNavCollapsed ? 0 : 2,
              p: isNavCollapsed ? 1 : 2,
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              borderRadius: isNavCollapsed ? '50%' : 1,
              transition: 'all 0.3s ease'
            }}
          >
            <Avatar 
              src={user?.user_metadata?.avatar_url}
              sx={{ width: 40, height: 40 }}
            >
              {!user?.user_metadata?.avatar_url && <AccountCircle />}
            </Avatar>
            {!isNavCollapsed && (
              <Box>
                <Typography
                  variant="body2"
                  sx={{ color: 'white', fontWeight: 600 }}
                >
                  {user?.user_metadata?.name || user?.email?.split('@')[0] || 'User'}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                >
                  {user?.email || 'No email'}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: '#f8fafc',
          overflow: 'hidden'
        }}
      >
        {/* Top App Bar */}
        <AppBar
          position="static"
          elevation={0}
          sx={{
            background: 'rgba(255, 255, 255, 1)',
            borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
            borderRadius: 0,
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}
        >
          <Toolbar>
            <Typography
              variant="h6"
              sx={{
                flexGrow: 1,
                color: '#1a202c',
                fontWeight: 600
              }}
            >
              {selectedCompany ? `${selectedCompany.name} - ${navigationItems[activeTab].text}` : navigationItems[activeTab].text}
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton 
                color="inherit" 
                onClick={handleNotificationClick}
                sx={{
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    transform: 'scale(1.1)',
                    backgroundColor: 'rgba(100, 116, 139, 0.1)'
                  }
                }}
              >
                <Badge badgeContent={0} color="error">
                  <Notifications sx={{ color: '#64748b' }} />
                </Badge>
              </IconButton>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Notification Dropdown */}
        <NotificationDropdown
          anchorEl={notificationAnchor}
          open={Boolean(notificationAnchor)}
          onClose={handleNotificationClose}
        />

        {/* Page Content */}
        <Box sx={{ 
          height: 'calc(100vh - 64px)', 
          overflow: 'auto',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
          '&': {
            msOverflowStyle: 'none',
            scrollbarWidth: 'none',
          },
        }}>
          <AnimatePresence mode="wait">
            {renderContent()}
          </AnimatePresence>
        </Box>
      </Box>
        </Box>
      )}
    </FormCreator>
  );
}