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
    const sampleNotifications = [
      {
        id: 1,
        title: 'システム更新',
        message: '新機能が追加されました',
        timestamp: new Date(Date.now() - 2 * 60 * 1000),
        isRead: false
      },
      {
        id: 2,
        title: 'フォーム送信完了',
        message: 'レビューフォームが正常に送信されました',
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        isRead: false
      },
      {
        id: 3,
        title: '期限警告',
        message: 'レビュー期限まで残り3日です',
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
        isRead: true
      },
      {
        id: 4,
        title: 'データ同期エラー',
        message: 'データの同期に失敗しました',
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
        isRead: false
      }
    ];
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
          width: 380,
          maxHeight: 480,
          borderRadius: 2,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          border: '1px solid rgba(0, 0, 0, 0.06)',
          overflow: 'hidden',
          backdropFilter: 'blur(10px)',
          background: 'rgba(255, 255, 255, 0.98)'
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
          p: 2,
          borderBottom: '1px solid rgba(0, 0, 0, 0.05)'
        }}>
          <Typography variant="h6" sx={{ 
            fontWeight: 600,
            color: '#1a202c',
            fontSize: '1rem'
          }}>
            通知 {unreadCount > 0 && `(${unreadCount})`}
          </Typography>
          <IconButton 
            size="small" 
            onClick={onClose}
            sx={{ 
              color: '#64748b',
              '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
              width: 32,
              height: 32
            }}
          >
            <Close fontSize="small" />
          </IconButton>
        </Box>

        {/* 通知リスト */}
        <Box sx={{ maxHeight: 380, overflow: 'auto' }}>
          {notifications.length === 0 ? (
            <Box sx={{ 
              textAlign: 'center', 
              py: 4,
              px: 2
            }}>
              <Notifications sx={{ 
                fontSize: 48, 
                color: '#cbd5e1', 
                mb: 2 
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
            <List sx={{ p: 0 }}>
              {notifications.map((notification) => (
                <ListItem
                  key={notification.id}
                  sx={{
                    px: 2,
                    py: 1.5,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    backgroundColor: notification.isRead ? 'transparent' : 'rgba(94, 23, 235, 0.03)',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.02)',
                      transform: 'translateX(2px)'
                    },
                    '&:not(:last-child)': {
                      borderBottom: '1px solid rgba(0, 0, 0, 0.05)'
                    },
                    borderRadius: 1,
                    mx: 0.5
                  }}
                  onClick={() => !notification.isRead && handleMarkAsRead(notification.id)}
                >
                  <Box sx={{ 
                    display: 'flex', 
                    width: '100%', 
                    alignItems: 'flex-start',
                    gap: 1.2
                  }}>
                    {/* 未読インジケーター */}
                    <Box
                      sx={{ 
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        backgroundColor: notification.isRead ? 'transparent' : '#5e17eb',
                        mt: 0.8,
                        flexShrink: 0
                      }} 
                    />
                    
                    {/* 通知内容 */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography 
                        variant="subtitle2" 
                        sx={{ 
                          fontWeight: notification.isRead ? 500 : 600,
                          color: '#1a202c',
                          mb: 0.3,
                          lineHeight: 1.3,
                          fontSize: '0.875rem'
                        }}
                      >
                        {notification.title}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: '#64748b',
                          mb: 0.5,
                          lineHeight: 1.3,
                          fontSize: '0.8rem'
                        }}
                      >
                        {notification.message}
                      </Typography>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: '#94a3b8',
                          fontSize: '0.7rem'
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

        {/* フッター */}
        {notifications.length > 0 && (
          <Box sx={{ 
            p: 1.5,
            borderTop: '1px solid rgba(0, 0, 0, 0.05)',
            textAlign: 'center'
          }}>
            <Button 
              size="small" 
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0}
              sx={{ 
                textTransform: 'none',
                color: '#5e17eb',
                fontWeight: 500,
                fontSize: '0.8rem',
                py: 0.5,
                px: 2,
                '&:hover': {
                  backgroundColor: 'rgba(94, 23, 235, 0.06)'
                },
                '&.Mui-disabled': {
                  color: '#94a3b8'
                }
              }}
            >
              すべて既読にする
            </Button>
          </Box>
        )}
      </Box>
    </Popover>
  );
};

export default NotificationDropdown;