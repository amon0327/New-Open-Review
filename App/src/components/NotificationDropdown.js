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
          width: 340,
          maxHeight: 450,
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
          border: 'none',
          overflow: 'hidden'
        }
      }}
    >
      <Box sx={{ 
        p: 0,
        background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)'
      }}>
        {/* ヘッダー */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          p: 2.5,
          borderBottom: '1px solid #f1f5f9'
        }}>
          <Typography variant="h6" sx={{ 
            fontWeight: 600,
            color: '#1e293b',
            fontSize: '1.1rem'
          }}>
            通知 {unreadCount > 0 && `(${unreadCount})`}
          </Typography>
          <IconButton 
            size="small" 
            onClick={onClose}
            sx={{ 
              color: '#64748b',
              '&:hover': { backgroundColor: '#f1f5f9' }
            }}
          >
            <Close fontSize="small" />
          </IconButton>
        </Box>

        {/* 通知リスト */}
        <Box sx={{ maxHeight: 350, overflow: 'auto' }}>
          {notifications.length === 0 ? (
            <Box sx={{ 
              textAlign: 'center', 
              py: 6,
              px: 3
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
                    px: 2.5,
                    py: 2,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    backgroundColor: notification.isRead ? 'transparent' : 'rgba(59, 130, 246, 0.04)',
                    '&:hover': {
                      backgroundColor: '#f8fafc'
                    },
                    '&:not(:last-child)': {
                      borderBottom: '1px solid #f1f5f9'
                    }
                  }}
                  onClick={() => !notification.isRead && handleMarkAsRead(notification.id)}
                >
                  <Box sx={{ 
                    display: 'flex', 
                    width: '100%', 
                    alignItems: 'flex-start',
                    gap: 1.5
                  }}>
                    {/* 未読インジケーター */}
                    <Circle 
                      sx={{ 
                        fontSize: 8, 
                        color: notification.isRead ? 'transparent' : '#3b82f6',
                        mt: 1,
                        flexShrink: 0
                      }} 
                    />
                    
                    {/* 通知内容 */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography 
                        variant="subtitle2" 
                        sx={{ 
                          fontWeight: notification.isRead ? 500 : 600,
                          color: '#1e293b',
                          mb: 0.5,
                          lineHeight: 1.4
                        }}
                      >
                        {notification.title}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: '#64748b',
                          mb: 1,
                          lineHeight: 1.4
                        }}
                      >
                        {notification.message}
                      </Typography>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: '#94a3b8',
                          fontSize: '0.75rem'
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
            p: 2,
            borderTop: '1px solid #f1f5f9',
            textAlign: 'center'
          }}>
            <Button 
              size="small" 
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0}
              sx={{ 
                textTransform: 'none',
                color: '#3b82f6',
                fontWeight: 500,
                fontSize: '0.875rem',
                '&:hover': {
                  backgroundColor: 'rgba(59, 130, 246, 0.08)'
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