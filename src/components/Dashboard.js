import React, { useState } from 'react';
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
  CardContent
} from '@mui/material';
import {
  Home,
  Add,
  Analytics,
  Settings,
  Notifications,
  AccountCircle
} from '@mui/icons-material';
import FormDataService from '../services/FormDataService';
import { toast } from 'react-hot-toast';

// 分離したページコンポーネントをインポート
import HomePage from './dashboard/pages/HomePage';
import CreatePagePlaceholder from './dashboard/pages/CreatePagePlaceholder';
import AnalyticsPage from './dashboard/pages/AnalyticsPage';
import SettingsPage from './dashboard/pages/SettingsPage';

const drawerWidth = 280;

const navigationItems = [
  { text: 'Home', icon: <Home />, component: HomePage },
  { text: 'Create', icon: <Add />, component: CreatePagePlaceholder },
  { text: 'Analytics', icon: <Analytics />, component: AnalyticsPage },
  { text: 'Settings', icon: <Settings />, component: SettingsPage },
];

export default function Dashboard({ onCreateClick, onLogout, user }) {
  const [activeTab, setActiveTab] = useState(0);
  const [isCreatingForm, setIsCreatingForm] = useState(false);

  const renderContent = () => {
    const ActiveComponent = navigationItems[activeTab].component;
    if (navigationItems[activeTab].text === 'Settings') {
      return <ActiveComponent user={user} onLogout={onLogout} />;
    } else if (navigationItems[activeTab].text === 'Home') {
      return <ActiveComponent user={user} onCreateFormClick={onCreateClick} />;
    }
    return <ActiveComponent />;
  };

  const handleCreateForm = async () => {
    if (!user) {
      toast.error('ユーザー情報が取得できません');
      return;
    }

    setIsCreatingForm(true);
    try {
      const result = await FormDataService.createNewForm(user.id);
      
      if (result.success) {
        // フォーム作成成功時は通知なし
        // フォーム作成画面に遷移（formIdを渡す）
        onCreateClick(result.data.reviewFormId);
      } else {
        toast.error(result.error || 'フォームの作成に失敗しました');
      }
    } catch (error) {
      console.error('Form creation error:', error);
      toast.error('フォームの作成中にエラーが発生しました');
    } finally {
      setIsCreatingForm(false);
    }
  };

  const handleNavClick = (index) => {
    if (navigationItems[index].text === 'Create') {
      handleCreateForm();
    } else {
      setActiveTab(index);
    }
  };

  return (
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
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: 'none',
            boxShadow: '4px 0 20px rgba(0, 0, 0, 0.1)',
            borderRadius: 0
          },
        }}
      >
        {/* Logo Section */}
        <Box
          sx={{
            p: 3,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <img
            src="https://otfreskkeaenahqziriz.supabase.co/storage/v1/object/public/app-assets/logo/OpenReviewDarkThemeLoog.png"
            alt="OpenReview"
            style={{
              height: '40px',
              width: 'auto',
              objectFit: 'contain'
            }}
          />
        </Box>

        {/* Navigation Items */}
        <List sx={{ px: 2, py: 3 }}>
          {navigationItems.map((item, index) => (
            <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
              <ListItemButton
                onClick={() => handleNavClick(index)}
                disabled={item.text === 'Create' && isCreatingForm}
                sx={{
                  py: 1.5,
                  px: 2,
                  color: 'rgba(255, 255, 255, 0.8)',
                  backgroundColor: activeTab === index ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  },
                  '&.Mui-disabled': {
                    opacity: 0.6
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                <ListItemIcon
                  sx={{
                    color: activeTab === index ? 'white' : 'rgba(255, 255, 255, 0.8)',
                    minWidth: 40
                  }}
                >
                  {item.text === 'Create' && isCreatingForm ? (
                    <CircularProgress size={20} sx={{ color: 'rgba(255, 255, 255, 0.8)' }} />
                  ) : (
                    item.icon
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontWeight: activeTab === index ? 600 : 400,
                    color: activeTab === index ? 'white' : 'rgba(255, 255, 255, 0.8)'
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>

        {/* User Profile Section */}
        <Box
          sx={{
            mt: 'auto',
            p: 3,
            borderTop: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              p: 2,
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)'
            }}
          >
            <Avatar sx={{ width: 40, height: 40 }}>
              <AccountCircle />
            </Avatar>
            <Box>
              <Typography
                variant="body2"
                sx={{ color: 'white', fontWeight: 600 }}
              >
                田中太郎
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
              >
                admin@company.com
              </Typography>
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
          overflow: 'auto',
          height: '100vh'
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
              <IconButton color="inherit">
                <Badge badgeContent={4} color="error">
                  <Notifications sx={{ color: '#64748b' }} />
                </Badge>
              </IconButton>
              <Avatar sx={{ width: 32, height: 32, ml: 1 }}>
                <AccountCircle />
              </Avatar>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Page Content */}
        <Box sx={{ height: 'calc(100vh - 64px)', overflow: 'auto' }}>
          <AnimatePresence mode="wait">
            {renderContent()}
          </AnimatePresence>
        </Box>
      </Box>
    </Box>
  );
}