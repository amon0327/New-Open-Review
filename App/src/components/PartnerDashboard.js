import React, { useState } from 'react';
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
  Paper
} from '@mui/material';
import {
  Handshake,
  Business,
  PersonAdd,
  Settings,
  Logout,
  Dashboard as DashboardIcon,
  People,
  AccountCircle
} from '@mui/icons-material';

export default function PartnerDashboard({ user, onLogout }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');

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
                          0
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
                sx={{
                  background: 'linear-gradient(45deg, #5e17eb 30%, #764ba2 90%)',
                  borderRadius: 2,
                  px: 3
                }}
              >
                企業を招待
              </Button>
            </Box>

            <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)' }}>
              <CardContent>
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <Business sx={{ fontSize: 80, color: '#e2e8f0', mb: 2 }} />
                  <Typography variant="h6" sx={{ color: '#64748b', mb: 1 }}>
                    登録されている企業がありません
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                    「企業を招待」ボタンから企業を招待してください
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Box>
        );

      case 'members':
        return (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a202c' }}>
                メンバー招待
              </Typography>
              <Button
                variant="contained"
                startIcon={<PersonAdd />}
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
              <CardContent>
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <People sx={{ fontSize: 80, color: '#e2e8f0', mb: 2 }} />
                  <Typography variant="h6" sx={{ color: '#64748b', mb: 1 }}>
                    メンバーがいません
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                    「メンバーを招待」ボタンからメンバーを招待してください
                  </Typography>
                </Box>
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

  return (
    <Box sx={{ minHeight: '100vh', background: '#ffffff' }}>
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
