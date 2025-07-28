import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Paper,
  IconButton,
  Badge
} from '@mui/material';
import {
  Home,
  Add,
  Analytics,
  Settings,
  Notifications,
  AccountCircle
} from '@mui/icons-material';

// 各ページコンポーネント
function HomePage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Paper
        sx={{
          p: 4,
          height: 'calc(100vh - 120px)',
          borderRadius: 3,
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        }}
      >
        <Typography variant="h4" color="text.secondary">
          Home Content Container
        </Typography>
      </Paper>
    </motion.div>
  );
}

function CreatePage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Paper
        sx={{
          p: 4,
          height: 'calc(100vh - 120px)',
          borderRadius: 3,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          color: 'white'
        }}
      >
        <Typography variant="h4" color="inherit">
          Create Content Container
        </Typography>
      </Paper>
    </motion.div>
  );
}

function AnalyticsPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Paper
        sx={{
          p: 4,
          height: 'calc(100vh - 120px)',
          borderRadius: 3,
          background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        }}
      >
        <Typography variant="h4" color="text.secondary">
          Analytics Content Container
        </Typography>
      </Paper>
    </motion.div>
  );
}

function SettingsPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Paper
        sx={{
          p: 4,
          height: 'calc(100vh - 120px)',
          borderRadius: 3,
          background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        }}
      >
        <Typography variant="h4" color="text.secondary">
          Settings Content Container
        </Typography>
      </Paper>
    </motion.div>
  );
}

const drawerWidth = 280;

const navigationItems = [
  { text: 'Home', icon: <Home />, component: HomePage },
  { text: 'Create', icon: <Add />, component: CreatePage },
  { text: 'Analytics', icon: <Analytics />, component: AnalyticsPage },
  { text: 'Settings', icon: <Settings />, component: SettingsPage },
];

export default function Dashboard({ onCreateClick, onSettingsClick }) {
  const [activeTab, setActiveTab] = useState(0);

  const renderContent = () => {
    const ActiveComponent = navigationItems[activeTab].component;
    return <ActiveComponent />;
  };

  const handleNavClick = (index) => {
    if (navigationItems[index].text === 'Create') {
      onCreateClick();
    } else if (navigationItems[index].text === 'Settings') {
      onSettingsClick();
    } else {
      setActiveTab(index);
    }
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
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
            boxShadow: '4px 0 20px rgba(0, 0, 0, 0.1)'
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
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              background: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(10px)'
            }}
          >
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
              O
            </Typography>
          </Box>
          <Typography
            variant="h6"
            sx={{
              color: 'white',
              fontWeight: 700,
              fontSize: '1.3rem'
            }}
          >
            OpenReview
          </Typography>
        </Box>

        {/* Navigation Items */}
        <List sx={{ px: 2, py: 3 }}>
          {navigationItems.map((item, index) => (
            <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
              <ListItemButton
                onClick={() => handleNavClick(index)}
                sx={{
                  borderRadius: 2,
                  py: 1.5,
                  px: 2,
                  color: 'rgba(255, 255, 255, 0.8)',
                  backgroundColor: activeTab === index ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
                  {item.icon}
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
              borderRadius: 2,
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
          overflow: 'hidden'
        }}
      >
        {/* Top App Bar */}
        <AppBar
          position="static"
          elevation={0}
          sx={{
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(0, 0, 0, 0.05)'
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
        <Box sx={{ p: 3 }}>
          <AnimatePresence mode="wait">
            {renderContent()}
          </AnimatePresence>
        </Box>
      </Box>
    </Box>
  );
}