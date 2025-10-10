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
  Info
} from '@mui/icons-material';
import FormCreator from './FormCreator';
import NotificationDropdown from './NotificationDropdown';
import CompanySetup from './CompanySetup';
import { supabase } from '../lib/supabase';

// 分離したページコンポーネントをインポート
import HomePage from './dashboard/pages/HomePage';
import CreatePagePlaceholder from './dashboard/pages/CreatePagePlaceholder';
import AnalyticsPage from './dashboard/pages/AnalyticsPage';
import SettingsPage from './dashboard/pages/SettingsPage';

const drawerWidth = 280;
const collapsedDrawerWidth = 72;

const navigationItems = [
  { text: 'Create', icon: <Add /> },
  { text: 'Home', icon: <Home />, component: HomePage },
  { text: 'Analytics', icon: <Analytics />, component: AnalyticsPage },
  { text: 'Settings', icon: <Settings />, component: SettingsPage },
];

export default function Dashboard({ onCreateClick, onLogout, user }) {
  const [activeTab, setActiveTab] = useState(1);
  const [isNavCollapsed, setIsNavCollapsed] = useState(false);
  const [notificationAnchor, setNotificationAnchor] = useState(null);
  const [showCompanySetup, setShowCompanySetup] = useState(false);
  const [isCheckingCompany, setIsCheckingCompany] = useState(true);

  // ユーザーの会社情報をチェック
  useEffect(() => {
    const checkUserCompany = async () => {
      try {
        // 🔒 セキュリティ：認証されたユーザーの情報を直接取得
        const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !currentUser) {
          console.error('認証情報の取得に失敗:', authError);
          setShowCompanySetup(true);
          setIsCheckingCompany(false);
          return;
        }

        // 🔒 セキュリティ：認証されたユーザーIDでのみ会社情報をチェック
        const { data, error } = await supabase
          .from('created_by_business_user_id')
          .select('id, company_id')
          .eq('business_user_id', currentUser.id)
          .single();

        if (error && error.code === 'PGRST116') {
          // レコードが見つからない場合
          setShowCompanySetup(true);
        } else if (error) {
          console.error('会社情報チェック中にエラー:', error);
          setShowCompanySetup(true);
        }
        // データが存在する場合はshowCompanySetupはfalseのまま
      } catch (error) {
        console.error('会社情報チェック中にエラー:', error);
        setShowCompanySetup(true);
      } finally {
        setIsCheckingCompany(false);
      }
    };

    checkUserCompany();
  }, []);

  const handleCompanyCreated = (companyData) => {
    setShowCompanySetup(false);
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

  // 会社セットアップが必要な場合
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
    if (navigationItems[activeTab].text === 'Settings') {
      return <ActiveComponent user={user} onLogout={onLogout} />;
    } else if (navigationItems[activeTab].text === 'Home') {
      return <ActiveComponent user={user} onCreateFormClick={onCreateClick} />;
    } else if (navigationItems[activeTab].text === 'Analytics') {
      return <ActiveComponent onNavCollapse={(collapsed) => setIsNavCollapsed(collapsed)} />;
    }
    return <ActiveComponent />;
  };

  const handleNavClick = (index, onCreateForm) => {
    if (navigationItems[index].text === 'Create') {
      if (onCreateForm) {
        onCreateForm();
      }
    } else {
      setActiveTab(index);
    }
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
            overflow: 'hidden'
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
          {navigationItems.map((item, index) => {
            const isCreateButton = item.text === 'Create';
            const isCreateButtonDisabled = isCreateButton && isCreatingForm;
            
            return (
              <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
                <ListItemButton
                  onClick={() => handleNavClick(index, onCreateForm)}
                  disabled={isCreateButtonDisabled}
                  sx={{
                    py: 1.5,
                    px: isNavCollapsed ? 1 : 2,
                    color: 'rgba(255, 255, 255, 0.8)',
                    backgroundColor: activeTab === index ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                    ...(isCreateButton ? {
                      background: 'white',
                      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
                      '&:hover': {
                        background: '#f8f9fa',
                        boxShadow: '0 6px 20px rgba(0, 0, 0, 0.15)',
                        transform: 'translateY(-2px)'
                      }
                    } : {
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      }
                    }),
                    justifyContent: isNavCollapsed ? 'center' : 'flex-start',
                    borderRadius: '100px',
                    minHeight: 48,
                    alignItems: 'center',
                    '&.Mui-disabled': {
                      opacity: 0.6
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: isCreateButton ? '#8b5cf6' : activeTab === index ? 'white' : 'rgba(255, 255, 255, 0.8)',
                      minWidth: isNavCollapsed ? 24 : 40,
                      justifyContent: 'center',
                      display: 'flex',
                      alignItems: 'center',
                      height: 24
                    }}
                  >
                    {isCreateButton && isCreatingForm ? (
                      <CircularProgress size={20} sx={{ color: '#8b5cf6' }} />
                    ) : (
                      item.icon
                    )}
                  </ListItemIcon>
                  {!isNavCollapsed && (
                    <ListItemText
                      primary={
                        isCreateButton ? (
                          <Box
                            sx={{
                              background: 'linear-gradient(45deg, #8b5cf6 30%, #a855f7 70%)',
                              backgroundClip: 'text',
                              WebkitBackgroundClip: 'text',
                              WebkitTextFillColor: 'transparent',
                              fontWeight: 600,
                              display: 'inline-block'
                            }}
                          >
                            {item.text}
                          </Box>
                        ) : (
                          item.text
                        )
                      }
                      primaryTypographyProps={{
                        fontWeight: isCreateButton ? 600 : activeTab === index ? 600 : 400,
                        color: isCreateButton ? 'transparent' : activeTab === index ? 'white' : 'rgba(255, 255, 255, 0.8)'
                      }}
                    />
                  )}
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>


        {/* Preview Version Notice */}
        <Box
          sx={{
            mt: 'auto',
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
              {navigationItems[activeTab].text}
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