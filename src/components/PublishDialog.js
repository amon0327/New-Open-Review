import React from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Button
} from '@mui/material';

const PublishDialog = ({
  open,
  onClose,
  onPublish,
  errors = [],
  warnings = [],
  isErrorChecking = false,
  errorCheckItems = [],
  errorCheckProgress = 0
}) => {
  const errorCount = errors.length;
  const warningCount = warnings.length;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '20px',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.95) 100%)',
          backdropFilter: 'blur(24px)',
          border: '2px solid transparent',
          backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.95) 100%), ' +
                          (errorCount > 0 
                            ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%)'
                            : 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #ff6b6b 100%)'),
          backgroundOrigin: 'border-box',
          backgroundClip: 'content-box, border-box',
          boxShadow: errorCount > 0 
            ? '0 32px 80px rgba(239, 68, 68, 0.25)' 
            : '0 32px 80px rgba(102, 126, 234, 0.25)',
          overflow: 'hidden'
        }
      }}
      BackdropProps={{
        sx: {
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(12px)'
        }
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        <Box
          sx={{
            textAlign: 'center',
            py: 6,
            px: 4,
            background: errorCount > 0 
              ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(220, 38, 38, 0.08) 50%, rgba(185, 28, 28, 0.08) 100%)'
              : 'linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 50%, rgba(255, 107, 107, 0.08) 100%)',
            color: '#374151',
            mb: 0,
            minHeight: 360,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: errorCount > 0 
                ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.03) 0%, rgba(220, 38, 38, 0.03) 50%, rgba(185, 28, 28, 0.03) 100%)'
                : 'linear-gradient(135deg, rgba(102, 126, 234, 0.03) 0%, rgba(118, 75, 162, 0.03) 50%, rgba(255, 107, 107, 0.03) 100%)',
              zIndex: -1
            }
          }}
        >
          {/* メインコンテンツエリア */}
          <Box sx={{ 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center'
          }}>
            {/* ロケットアイコン - エラーチェック中は非表示 */}
            {!isErrorChecking && (
              <Box
                sx={{
                  width: 88,
                  height: 88,
                  borderRadius: '50%',
                  background: errorCount > 0
                    ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.15) 50%, rgba(185, 28, 28, 0.15) 100%)'
                    : 'linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 50%, rgba(255, 107, 107, 0.15) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 32px auto',
                  fontSize: '2.8rem',
                  boxShadow: errorCount > 0
                    ? '0 12px 32px rgba(239, 68, 68, 0.2)'
                    : '0 12px 32px rgba(102, 126, 234, 0.2)',
                  animation: 'pulse 2s ease-in-out infinite',
                  '@keyframes pulse': {
                    '0%, 100%': { transform: 'scale(1)' },
                    '50%': { transform: 'scale(1.05)' }
                  }
                }}
              >
                {errorCount > 0 ? '⚠️' : '🚀'}
              </Box>
            )}
            
            {/* エラーチェック中以外の時のみタイトルと説明を表示 */}
            {!isErrorChecking && (
              <>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    mb: 2,
                    fontSize: '1.8rem',
                    background: errorCount > 0
                      ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%)'
                      : 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #ff6b6b 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    textShadow: 'none'
                  }}
                >
                  {errorCount > 0 ? 'エラーの解決が必要です' : 'フォームを公開しますか？'}
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: '#6b7280',
                    fontSize: '1.1rem',
                    lineHeight: 1.6,
                    fontWeight: 500,
                    mb: errorCount > 0 ? 2 : 0
                  }}
                >
                  {errorCount > 0 
                    ? `${errorCount}件のエラーがあります。\nエラーを解決してから公開してください。`
                    : '公開すると質問の追加や変更など\n編集できなくなります。\nよろしいですか？'
                  }
                </Typography>
              </>
            )}

            {/* エラーがある場合のエラーリスト表示 */}
            {!isErrorChecking && errorCount > 0 && (
              <Box sx={{ mt: 3, width: '100%', maxWidth: 400 }}>
                <Typography variant="h6" sx={{ 
                  fontWeight: 600, 
                  mb: 2, 
                  color: '#ef4444',
                  fontSize: '1rem'
                }}>
                  エラー詳細:
                </Typography>
                {errors.slice(0, 5).map((error, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 1.5,
                      mb: 1.5,
                      p: 2,
                      borderRadius: 2,
                      backgroundColor: 'rgba(239, 68, 68, 0.08)',
                      border: '1px solid rgba(239, 68, 68, 0.2)'
                    }}
                  >
                    <Box
                      sx={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        backgroundColor: '#ef4444',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        mt: 0.1
                      }}
                    >
                      <Typography sx={{ color: 'white', fontSize: '0.75rem', fontWeight: 'bold' }}>
                        !
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ 
                      color: '#991b1b', 
                      fontWeight: 500,
                      fontSize: '0.875rem',
                      lineHeight: 1.4
                    }}>
                      {error.message}
                    </Typography>
                  </Box>
                ))}
                {errorCount > 5 && (
                  <Typography variant="body2" sx={{ 
                    color: '#ef4444',
                    textAlign: 'center',
                    mt: 1,
                    fontStyle: 'italic'
                  }}>
                    他 {errorCount - 5} 件のエラーがあります
                  </Typography>
                )}
              </Box>
            )}
            
            {/* レビューフォーム エラーチェック中のモダンな抽象UI */}
            {isErrorChecking && (
              <Box
                sx={{
                  width: '100%',
                  maxWidth: 360,
                  height: 160,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto',
                  position: 'relative'
                }}
              >
                {/* レビューフォームチェック表示 */}
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    mb: 3,
                    fontSize: '1.1rem',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    textAlign: 'center',
                    opacity: 0.9
                  }}
                >
                  レビューフォーム チェック中...
                </Typography>

                {/* 大型コンテナの循環チェック表現 */}
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    width: '100%',
                    maxWidth: 320,
                    mb: 3
                  }}
                >
                  {/* 循環チェック用の大型コンテナ */}
                  {Array.from({ length: 4 }, (_, index) => (
                    <Box
                      key={index}
                      sx={{
                        width: '100%',
                        height: 32,
                        borderRadius: 16,
                        border: '2px solid rgba(0, 0, 0, 0.08)',
                        background: 'rgba(255, 255, 255, 0.8)',
                        backdropFilter: 'blur(12px)',
                        position: 'relative',
                        overflow: 'hidden',
                        animation: `cycleCheck 4s ease-in-out infinite ${index * 1}s`,
                        '@keyframes cycleCheck': {
                          '0%': { 
                            borderColor: 'rgba(0, 0, 0, 0.08)',
                            background: 'rgba(255, 255, 255, 0.8)',
                            transform: 'scale(1)',
                            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)'
                          },
                          '20%': { 
                            borderColor: 'rgba(102, 126, 234, 0.4)',
                            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.08) 50%, rgba(255, 107, 107, 0.08) 100%)',
                            transform: 'scale(1.02)',
                            boxShadow: '0 8px 24px rgba(102, 126, 234, 0.2)'
                          },
                          '40%': { 
                            borderColor: 'rgba(102, 126, 234, 0.6)',
                            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.12) 50%, rgba(255, 107, 107, 0.1) 100%)',
                            transform: 'scale(1.04)',
                            boxShadow: '0 12px 32px rgba(102, 126, 234, 0.25)'
                          },
                          '60%': { 
                            borderColor: 'rgba(118, 75, 162, 0.6)',
                            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.12) 0%, rgba(118, 75, 162, 0.15) 50%, rgba(255, 107, 107, 0.12) 100%)',
                            transform: 'scale(1.02)',
                            boxShadow: '0 8px 28px rgba(118, 75, 162, 0.2)'
                          },
                          '80%': { 
                            borderColor: 'rgba(255, 107, 107, 0.6)',
                            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.1) 50%, rgba(255, 107, 107, 0.12) 100%)',
                            transform: 'scale(1)',
                            boxShadow: '0 4px 16px rgba(255, 107, 107, 0.15)'
                          },
                          '90%': { 
                            borderColor: 'rgba(34, 197, 94, 0.8)',
                            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, rgba(22, 163, 74, 0.08) 100%)',
                            transform: 'scale(1)',
                            boxShadow: '0 4px 16px rgba(34, 197, 94, 0.15)'
                          },
                          '100%': { 
                            borderColor: 'rgba(34, 197, 94, 0.8)',
                            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, rgba(22, 163, 74, 0.08) 100%)',
                            transform: 'scale(1)',
                            boxShadow: '0 4px 16px rgba(34, 197, 94, 0.15)'
                          }
                        }
                      }}
                    >
                      {/* コンテナラベル */}
                      <Typography
                        variant="caption"
                        sx={{
                          position: 'absolute',
                          left: 12,
                          top: 4,
                          fontSize: '0.65rem',
                          color: 'rgba(0, 0, 0, 0.5)',
                          fontWeight: 600,
                          letterSpacing: '0.5px',
                          textTransform: 'uppercase',
                          animation: `labelFade 4s ease-in-out infinite ${index * 1}s`,
                          '@keyframes labelFade': {
                            '0%, 15%': { opacity: 0.3 },
                            '20%, 80%': { opacity: 0.8 },
                            '85%, 100%': { opacity: 0.3 }
                          }
                        }}
                      >
                        {index === 0 && 'フォーム設定'}
                        {index === 1 && '質問チェック'}
                        {index === 2 && 'ページ検証'}
                        {index === 3 && '公開準備'}
                      </Typography>

                      {/* 進捗表示バー */}
                      <Box
                        sx={{
                          position: 'absolute',
                          left: 12,
                          bottom: 8,
                          right: 50,
                          height: 3,
                          borderRadius: 2,
                          background: 'rgba(0, 0, 0, 0.08)',
                          overflow: 'hidden'
                        }}
                      >
                        <Box
                          sx={{
                            height: '100%',
                            width: '0%',
                            background: 'linear-gradient(90deg, rgba(102, 126, 234, 0.6) 0%, rgba(118, 75, 162, 0.8) 50%, rgba(34, 197, 94, 0.6) 100%)',
                            borderRadius: 2,
                            animation: `progressFill 4s ease-in-out infinite ${index * 1}s`,
                            '@keyframes progressFill': {
                              '0%': { 
                                width: '0%',
                                background: 'linear-gradient(90deg, rgba(102, 126, 234, 0.3) 0%, rgba(118, 75, 162, 0.3) 50%, rgba(255, 107, 107, 0.3) 100%)'
                              },
                              '20%': { 
                                width: '25%',
                                background: 'linear-gradient(90deg, rgba(102, 126, 234, 0.6) 0%, rgba(118, 75, 162, 0.5) 50%, rgba(255, 107, 107, 0.4) 100%)'
                              },
                              '40%': { 
                                width: '60%',
                                background: 'linear-gradient(90deg, rgba(102, 126, 234, 0.7) 0%, rgba(118, 75, 162, 0.8) 50%, rgba(255, 107, 107, 0.6) 100%)'
                              },
                              '60%': { 
                                width: '85%',
                                background: 'linear-gradient(90deg, rgba(102, 126, 234, 0.6) 0%, rgba(118, 75, 162, 0.7) 50%, rgba(255, 107, 107, 0.8) 100%)'
                              },
                              '80%': { 
                                width: '100%',
                                background: 'linear-gradient(90deg, rgba(102, 126, 234, 0.5) 0%, rgba(118, 75, 162, 0.6) 50%, rgba(255, 107, 107, 0.7) 100%)'
                              },
                              '90%': { 
                                width: '100%',
                                background: 'linear-gradient(90deg, rgba(34, 197, 94, 0.6) 0%, rgba(22, 163, 74, 0.6) 100%)'
                              },
                              '100%': { 
                                width: '100%',
                                background: 'linear-gradient(90deg, rgba(34, 197, 94, 0.6) 0%, rgba(22, 163, 74, 0.6) 100%)'
                              }
                            }
                          }}
                        />
                      </Box>

                      {/* チェック状態インジケーター */}
                      <Box
                        sx={{
                          position: 'absolute',
                          right: 12,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          border: '2px solid rgba(0, 0, 0, 0.15)',
                          background: 'rgba(255, 255, 255, 0.9)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          animation: `statusIndicator 4s ease-in-out infinite ${index * 1}s`,
                          '@keyframes statusIndicator': {
                            '0%, 15%': { 
                              borderColor: 'rgba(0, 0, 0, 0.15)',
                              background: 'rgba(255, 255, 255, 0.9)',
                              transform: 'translateY(-50%) scale(1)',
                              boxShadow: 'none'
                            },
                            '20%': { 
                              borderColor: 'rgba(102, 126, 234, 0.5)',
                              background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.08) 50%, rgba(255, 107, 107, 0.06) 100%)',
                              transform: 'translateY(-50%) scale(1.1)',
                              boxShadow: '0 2px 8px rgba(102, 126, 234, 0.2)'
                            },
                            '90%': { 
                              borderColor: 'rgba(34, 197, 94, 0.8)',
                              background: 'rgba(34, 197, 94, 0.1)',
                              transform: 'translateY(-50%) scale(1)',
                              boxShadow: '0 2px 8px rgba(34, 197, 94, 0.2)'
                            },
                            '100%': { 
                              borderColor: 'rgba(34, 197, 94, 0.8)',
                              background: 'rgba(34, 197, 94, 0.1)',
                              transform: 'translateY(-50%) scale(1)',
                              boxShadow: '0 2px 8px rgba(34, 197, 94, 0.2)'
                            }
                          }
                        }}
                      >
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: 'rgba(102, 126, 234, 0.6)',
                            animation: `indicatorPulse 4s ease-in-out infinite ${index * 1}s`,
                            '@keyframes indicatorPulse': {
                              '0%, 15%': { 
                                background: 'rgba(0, 0, 0, 0.2)',
                                transform: 'scale(0.8)'
                              },
                              '20%, 80%': { 
                                background: 'rgba(102, 126, 234, 0.6)',
                                transform: 'scale(1)'
                              },
                              '90%, 100%': { 
                                background: 'rgba(34, 197, 94, 0.8)',
                                transform: 'scale(1)'
                              }
                            }
                          }}
                        />
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
          </Box>

          {/* ボタンエリア */}
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              justifyContent: 'center',
              pt: 2
            }}
          >
            <Button
              onClick={onClose}
              variant="outlined"
              sx={{
                minWidth: 120,
                height: 52,
                borderRadius: '26px',
                borderColor: 'rgba(0, 0, 0, 0.2)',
                color: '#64748b',
                fontSize: '1rem',
                fontWeight: 500,
                textTransform: 'none',
                '&:hover': {
                  borderColor: 'rgba(0, 0, 0, 0.3)',
                  backgroundColor: 'rgba(0, 0, 0, 0.05)'
                }
              }}
            >
              キャンセル
            </Button>
            
            <Button
              onClick={onPublish}
              variant="contained"
              disabled={isErrorChecking || errorCount > 0}
              sx={{
                minWidth: 120,
                height: 52,
                borderRadius: '26px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                fontSize: '1rem',
                fontWeight: 600,
                textTransform: 'none',
                boxShadow: '0 8px 24px rgba(102, 126, 234, 0.4)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5a67d8 0%, #6b46a3 100%)',
                  boxShadow: '0 12px 32px rgba(102, 126, 234, 0.5)',
                  transform: 'translateY(-2px)'
                },
                '&.Mui-disabled': {
                  background: 'linear-gradient(135deg, #94a3b8 0%, #8b909a 100%)',
                  color: 'white',
                  opacity: 0.7
                }
              }}
            >
              {isErrorChecking ? 'チェック中...' : (errorCount > 0 ? 'エラーを解決' : '公開する')}
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default PublishDialog;