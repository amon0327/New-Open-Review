import React, { useState, useEffect } from 'react';
import {
  Popover,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
  Button,
  IconButton
} from '@mui/material';
import {
  Notifications,
  Close,
  Circle
} from '@mui/icons-material';

const NotificationDropdown = ({ anchorEl, open, onClose }) => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const sampleNotifications = [];
    setNotifications(sampleNotifications);
  }, []);


  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'たった今';
    if (minutes < 60) return `${minutes}分前`;
    if (hours < 24) return `${hours}時間前`;
    return `${days}日前`;
  };

  const handleMarkAsRead = (notificationId) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, isRead: true }
          : notification
      )
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, isRead: true }))
    );
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'center',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'center',
      }}
      PaperProps={{
        sx: {
          width: 320,
          maxHeight: 400,
          borderRadius: 0.5,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          background: '#ffffff'
        }
      }}
    >
      <Box sx={{ 
        p: 0,
        background: 'transparent'
      }}>
        {/* ヘッダー */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          px: 1.5,
          py: 1,
          borderBottom: '1px solid #e2e8f0'
        }}>
          <Typography variant="subtitle1" sx={{ 
            fontWeight: 600,
            color: '#1a202c',
            fontSize: '0.875rem'
          }}>
            通知 {unreadCount > 0 && `(${unreadCount})`}
          </Typography>
          <IconButton 
            size="small" 
            onClick={onClose}
            sx={{ 
              color: '#64748b',
              '&:hover': { backgroundColor: '#f1f5f9' },
              width: 24,
              height: 24
            }}
          >
            <Close fontSize="small" />
          </IconButton>
        </Box>

        {/* 通知リスト */}
        <Box sx={{ maxHeight: 320, overflow: 'auto' }}>
          {notifications.length === 0 ? (
            <Box sx={{ 
              textAlign: 'center', 
              py: 3,
              px: 1.5
            }}>
              <Notifications sx={{ 
                fontSize: 32, 
                color: '#cbd5e1', 
                mb: 1 
              }} />
              <Typography 
                variant="body2" 
                color="textSecondary"
                sx={{ fontWeight: 500 }}
              >
                通知はありません
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0, m: 0 }}>
              {notifications.map((notification) => (
                <ListItem
                  key={notification.id}
                  sx={{
                    px: 1.5,
                    py: 1,
                    cursor: 'pointer',
                    transition: 'background-color 0.15s ease',
                    backgroundColor: notification.isRead ? 'transparent' : '#f8fafc',
                    '&:hover': {
                      backgroundColor: '#f1f5f9'
                    },
                    '&:not(:last-child)': {
                      borderBottom: '1px solid #e2e8f0'
                    },
                    minHeight: 'auto'
                  }}
                  onClick={() => !notification.isRead && handleMarkAsRead(notification.id)}
                >
                  <Box sx={{ 
                    display: 'flex', 
                    width: '100%', 
                    alignItems: 'flex-start',
                    gap: 1
                  }}>
                    {/* 未読インジケーター */}
                    <Box
                      sx={{ 
                        width: 4,
                        height: 4,
                        borderRadius: '50%',
                        backgroundColor: notification.isRead ? 'transparent' : '#5e17eb',
                        mt: 0.5,
                        flexShrink: 0
                      }} 
                    />
                    
                    {/* 通知内容 */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: notification.isRead ? 400 : 500,
                          color: '#1a202c',
                          mb: 0.2,
                          lineHeight: 1.2,
                          fontSize: '0.8rem'
                        }}
                      >
                        {notification.title}
                      </Typography>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: '#64748b',
                          mb: 0.3,
                          lineHeight: 1.2,
                          fontSize: '0.7rem',
                          display: 'block'
                        }}
                      >
                        {notification.message}
                      </Typography>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: '#94a3b8',
                          fontSize: '0.65rem'
                        }}
                      >
                        {formatTimestamp(notification.timestamp)}
                      </Typography>
                    </Box>
                  </Box>
                </ListItem>
              ))}
            </List>
          )}
        </Box>

      </Box>
    </Popover>
  );
};

export default NotificationDropdown;