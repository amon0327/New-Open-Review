import React from 'react';
import { Box, Card, Skeleton, Stack } from '@mui/material';

// 一覧 (クーポン / セグメント / メッセージ) のスケルトン
export function ListSkeleton({ count = 4 }) {
  return (
    <Stack spacing={1.5}>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} sx={{
          borderRadius: 1, p: 2, display: 'flex', alignItems: 'center', gap: 2,
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        }}>
          <Skeleton variant="rounded" width={48} height={48} animation="wave" />
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
              <Skeleton variant="text" width={`${30 + (i * 7) % 30}%`} height={20} animation="wave" />
              <Skeleton variant="rounded" width={56} height={20} animation="wave" />
            </Box>
            <Skeleton variant="text" width={`${50 + (i * 11) % 30}%`} height={14} animation="wave" />
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Skeleton variant="circular" width={32} height={32} animation="wave" />
            <Skeleton variant="circular" width={32} height={32} animation="wave" />
          </Box>
        </Card>
      ))}
    </Stack>
  );
}

// 設定カード (LineSettingsCard) のスケルトン
export function SettingsCardSkeleton() {
  return (
    <Card sx={{ borderRadius: 1, boxShadow: '0 10px 40px rgba(0, 0, 0, 0.08)', mb: 4 }}>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Skeleton variant="rounded" width={48} height={48} sx={{ mr: 2 }} animation="wave" />
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width={220} height={26} animation="wave" />
            <Skeleton variant="text" width={300} height={18} animation="wave" />
          </Box>
        </Box>
        <Skeleton variant="text" width="85%" height={20} sx={{ mb: 2 }} animation="wave" />
        <Stack spacing={2}>
          <Skeleton variant="rounded" height={40} animation="wave" />
          <Skeleton variant="rounded" height={40} animation="wave" />
          <Skeleton variant="rounded" height={56} animation="wave" />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Skeleton variant="rounded" width={120} height={36} animation="wave" />
          </Box>
        </Stack>
      </Box>
    </Card>
  );
}

// LINEメッセージ ページ全体のスケルトン (ヘッダー + Quota + タブ + 一覧)
export function OfficialLineSkeleton() {
  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
    }}>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Skeleton variant="text" width={180} height={32} animation="wave" />
            <Skeleton variant="text" width={400} height={20} animation="wave" />
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
            <Skeleton variant="text" width={140} height={16} animation="wave" />
            <Skeleton variant="text" width={120} height={32} animation="wave" />
          </Box>
        </Box>
      </Box>
      <Card sx={{ mx: 3, mb: 3, borderRadius: 1, boxShadow: '0 10px 40px rgba(0, 0, 0, 0.08)' }}>
        <Box sx={{ borderBottom: '1px solid #e2e8f0', display: 'flex', gap: 4, px: 3 }}>
          {[0, 1, 2].map((i) => (
            <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 2 }}>
              <Skeleton variant="circular" width={20} height={20} animation="wave" />
              <Skeleton variant="text" width={100} height={20} animation="wave" />
            </Box>
          ))}
        </Box>
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', mb: 3, alignItems: 'center' }}>
            <Skeleton variant="text" width={120} height={28} sx={{ flex: 1 }} animation="wave" />
            <Skeleton variant="rounded" width={140} height={36} animation="wave" />
          </Box>
          <ListSkeleton count={3} />
        </Box>
      </Card>
    </Box>
  );
}

// 編集フォーム画面のスケルトン (sticky ヘッダー + 各セクションカード)
export function FormSkeleton({ sections = 4 }) {
  return (
    <Box sx={{ minHeight: '100%', background: '#f8fafc' }}>
      <Box sx={{
        position: 'sticky', top: 0, zIndex: 10,
        backgroundColor: '#fff', borderBottom: '1px solid #e2e8f0',
        px: 3, py: 2, display: 'flex', alignItems: 'center', gap: 2,
      }}>
        <Skeleton variant="circular" width={40} height={40} animation="wave" />
        <Skeleton variant="text" width={240} height={28} sx={{ flex: 1 }} animation="wave" />
        <Skeleton variant="rounded" width={88} height={36} animation="wave" />
        <Skeleton variant="rounded" width={88} height={36} animation="wave" />
      </Box>

      <Box sx={{ p: 3 }}>
        <Stack spacing={2.5}>
          {Array.from({ length: sections }).map((_, i) => (
            <Card key={i} sx={{ p: 3, borderRadius: 1, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2.5 }}>
                <Skeleton variant="rounded" width={4} height={24} sx={{ mr: 1.5 }} animation="wave" />
                <Skeleton variant="text" width={140} height={22} animation="wave" />
              </Box>
              <Stack spacing={2}>
                <Skeleton variant="rounded" height={40} animation="wave" />
                {i % 2 === 0 && <Skeleton variant="rounded" height={56} animation="wave" />}
                {i % 3 === 0 && (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Skeleton key={j} variant="rounded" width={80 + (j * 13) % 40} height={32} animation="wave" />
                    ))}
                  </Box>
                )}
              </Stack>
            </Card>
          ))}
        </Stack>
      </Box>
    </Box>
  );
}
