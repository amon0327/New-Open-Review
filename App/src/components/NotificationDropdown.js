import React, { useState, useEffect } from 'react';
import {
  Popover,
  Box,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Divider,
  Button,
  IconButton,
  Chip,
  Badge
} from '@mui/material';
import {
  Notifications,
  Info,
  CheckCircle,
  Warning,
  Error,
  Close,
  MarkEmailRead
} from '@mui/icons-material';

const NotificationDropdown = ({ anchorEl, open, onClose }) => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const sampleNotifications = [
      {
        id: 1,
        type: 'info',
        title: 'システム更新',
        message: '新機能が追加されました',
        timestamp: new Date(Date.now() - 2 * 60 * 1000),
        isRead: false
      },
      {
        id: 2,
        type: 'success',
        title: 'フォーム送信完了',
        message: 'レビューフォームが正常に送信されました',
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        isRead: false
      },
      {
        id: 3,
        type: 'warning',
        title: '期限警告',
        message: 'レビュー期限まで残り3日です',
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
        isRead: true
      },
      {
        id: 4,
        type: 'error',
        title: 'エラー発生',
        message: 'データの同期に失敗しました',
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
        isRead: false
      }
    ];
    setNotifications(sampleNotifications);
  }, []);

  const getNotificationIcon = (type) => {
    const iconProps = { fontSize: 'small' };
    switch (type) {
      case 'success':
        return <CheckCircle {...iconProps} sx={{ color: '#10b981' }} />;
      case 'warning':
        return <Warning {...iconProps} sx={{ color: '#f59e0b' }} />;
      case 'error':
        return <Error {...iconProps} sx={{ color: '#ef4444' }} />;
      default:
        return <Info {...iconProps} sx={{ color: '#3b82f6' }} />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'success':
        return '#dcfce7';
      case 'warning':
        return '#fef3c7';
      case 'error':
        return '#fee2e2';
      default:
        return '#dbeafe';
    }
  };

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
          width: 380,
          maxHeight: 500,
          borderRadius: 2,
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb'
        }
      }}
    >
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Notifications sx={{ color: '#6b7280' }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              通知
            </Typography>
            {unreadCount > 0 && (
              <Chip 
                label={unreadCount} 
                size="small" 
                color="error" 
                sx={{ height: 20, minWidth: 20, '& .MuiChip-label': { px: 0.5 } }}
              />
            )}
          </Box>
          <IconButton size="small" onClick={onClose}>
            <Close fontSize="small" />
          </IconButton>
        </Box>

        {unreadCount > 0 && (
          <Button
            size="small"
            onClick={handleMarkAllAsRead}
            startIcon={<MarkEmailRead />}
            sx={{ mb: 1, textTransform: 'none' }}
          >
            すべて既読にする
          </Button>
        )}

        <Divider />

        <List sx={{ p: 0, maxHeight: 350, overflow: 'auto' }}>
          {notifications.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="textSecondary">通知はありません</Typography>
            </Box>
          ) : (
            notifications.map((notification, index) => (
              <React.Fragment key={notification.id}>
                <ListItem
                  sx={{
                    px: 0,
                    py: 1.5,
                    backgroundColor: notification.isRead ? 'transparent' : getNotificationColor(notification.type),
                    borderRadius: 1,
                    mb: 0.5,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: notification.isRead 
                        ? 'rgba(0,0,0,0.04)' 
                        : getNotificationColor(notification.type)
                    }
                  }}
                  onClick={() => !notification.isRead && handleMarkAsRead(notification.id)}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ 
                      backgroundColor: 'white', 
                      width: 36, 
                      height: 36,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                      {getNotificationIcon(notification.type)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography variant="subtitle2" sx={{ fontWeight: notification.isRead ? 400 : 600 }}>
                        {notification.title}
                      </Typography>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                          {notification.message}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {formatTimestamp(notification.timestamp)}
                        </Typography>
                      </Box>
                    }
                  />
                  {!notification.isRead && (
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        backgroundColor: '#3b82f6',
                        borderRadius: '50%',
                        ml: 1
                      }}
                    />
                  )}
                </ListItem>
                {index < notifications.length - 1 && <Divider variant="middle" />}
              </React.Fragment>
            ))
          )}
        </List>

        {notifications.length > 0 && (
          <>
            <Divider sx={{ mt: 1 }} />
            <Box sx={{ textAlign: 'center', pt: 1 }}>
              <Button 
                size="small" 
                sx={{ textTransform: 'none', color: '#6b7280' }}
                onClick={onClose}
              >
                すべての通知を見る
              </Button>
            </Box>
          </>
        )}
      </Box>
    </Popover>
  );
};

export default NotificationDropdown;