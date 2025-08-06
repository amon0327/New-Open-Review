import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import QRCode from 'react-qr-code';
import toast from 'react-hot-toast';
import {
  Box,
  Card,
  Typography,
  TextField,
  Button,
  Stack,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  Public, 
  CheckCircle, 
  ContentCopy,
  Download
} from '@mui/icons-material';
import PublishDialog from '../PublishDialog';
import { validateForm } from '../../utils/validation';

const PublishSettings = ({
  isPublished,
  setIsPublished,
  projectTitle,
  formId, // フォームID
  formData = {}, // フォームデータ (検証用)
  onPublishClick // HeaderBarの公開処理を呼び出すためのコールバック関数
}) => {
  const formUrl = `https://forms.openreview.app/${projectTitle.toLowerCase().replace(/\s+/g, '-')}`;
  
  // 公開ダイアログの状態
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [errorCheckProgress, setErrorCheckProgress] = useState(0);
  const [errorCheckItems, setErrorCheckItems] = useState([]);
  const [isErrorChecking, setIsErrorChecking] = useState(false);
  
  // 検証結果を状態として管理
  const [validationResults, setValidationResults] = useState({ errors: [], warnings: [] });
  const errorCount = validationResults.errors.length;


  // フォームデータが変更されるたびに検証を実行
  useEffect(() => {
    const validationData = {
      projectTitle,
      ...formData
    };
    
    const results = validateForm(validationData);
    console.log('📝 PublishSettings - 検証結果 - エラー件数:', results.errors?.length || 0);
    
    setValidationResults(results);
  }, [projectTitle, formData]);

  const handlePublishClick = async () => {
    console.log('📝 PublishSettings - 公開ボタンがクリックされました - エラー件数:', errorCount);
    
    // すでに公開済みの場合は何もしない
    if (isPublished) {
      return;
    }
    
    // エラーがある場合は公開を阻止し、エラー解決を促すメッセージを表示
    if (errorCount > 0) {
      console.log('📝 PublishSettings - エラーが残っているため公開を阻止:', validationResults.errors.map(e => e.message));
      toast.error('エラーを解決してから公開が可能です', {
        duration: 4000,
        position: 'bottom-center',
        style: {
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: '12px',
          color: '#374151',
          fontSize: '14px',
          fontWeight: '500',
          padding: '12px 20px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
        },
        iconTheme: {
          primary: '#ef4444',
          secondary: '#ffffff',
        },
      });
      return;
    }
    
    // エラーがない場合は最終チェックを実行後、直接公開確認ダイアログを表示
    console.log('✅ PublishSettings - エラーがないため最終チェックを実行します');
    
    // エラーチェック項目を定義
    const checkItems = [
      { id: 1, name: 'プロジェクトタイトル', status: 'pending' },
      { id: 2, name: '質問設定', status: 'pending' },
      { id: 3, name: 'ページ設定', status: 'pending' },
      { id: 4, name: 'ログイン画面', status: 'pending' },
      { id: 5, name: '完了画面', status: 'pending' },
      { id: 6, name: '全体設定', status: 'pending' }
    ];
    
    setErrorCheckItems(checkItems);
    setErrorCheckProgress(0);
    setIsErrorChecking(true);
    setShowPublishDialog(true); // 直接公開ダイアログを表示
    
    // エラーチェック処理をシミュレート
    let currentProgress = 0;
    const checkInterval = setInterval(() => {
      currentProgress += 1;
      setErrorCheckProgress(currentProgress);
      
      // 各項目を順次チェック完了にする
      setErrorCheckItems(prev => 
        prev.map(item => 
          item.id <= currentProgress 
            ? { ...item, status: 'completed' }
            : item
        )
      );
      
      if (currentProgress >= checkItems.length) {
        clearInterval(checkInterval);
        setIsErrorChecking(false);
      }
    }, 400);
  };

  const handlePublishConfirm = async () => {
    console.log('✅ PublishSettings - 公開処理を実行します');
    
    if (!formId) {
      toast.error('フォームIDが見つかりません', {
        duration: 3000,
        position: 'bottom-center',
      });
      return;
    }

    try {
      // Supabaseのis_publishedをtrueに更新
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
      const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase設定が見つかりません');
      }
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const { data, error } = await supabase
        .from('review_forms')
        .update({ 
          is_published: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', formId)
        .select();

      if (error) {
        throw error;
      }

      console.log('✅ PublishSettings - フォーム公開完了:', data);
      
      setShowPublishDialog(false);
      setIsPublished(true); // 公開状態を更新
      
      // 成功トースト
      toast.success('フォームが公開されました！', {
        duration: 3000,
        position: 'bottom-center',
        style: {
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(34, 197, 94, 0.2)',
          borderRadius: '12px',
          color: '#374151',
          fontSize: '14px',
          fontWeight: '500',
          padding: '12px 20px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
        },
      });
      
    } catch (error) {
      console.error('❌ PublishSettings - 公開処理エラー:', error);
      
      // エラートースト
      toast.error(`公開に失敗しました: ${error.message}`, {
        duration: 4000,
        position: 'bottom-center',
        style: {
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: '12px',
          color: '#374151',
          fontSize: '14px',
          fontWeight: '500',
          padding: '12px 20px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
        },
      });
    }
  };

  const handlePublishCancel = () => {
    setShowPublishDialog(false);
    setIsErrorChecking(false);
    setErrorCheckProgress(0);
    setErrorCheckItems([]);
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(formUrl);
    toast.success('URLをコピーしました！');
  };

  // QRコード単体のダウンロード
  const downloadQR = () => {
    const svg = document.getElementById('qr-code');
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `${projectTitle || 'form'}-qr.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      };
      
      img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
      toast.success('QRコードをダウンロードしました！');
    }
  };

  // デザイン画像のダウンロード（9.1cm x 5.5cm = 約344px x 208px at 96 DPI）
  const downloadDesignImage = () => {
    const svg = document.getElementById('qr-code');
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // 9.1cm x 5.5cm サイズ（96 DPIで計算）
        const cmToPx = 96 / 2.54; // 1cm = 約37.8px at 96 DPI
        canvas.width = Math.round(9.1 * cmToPx); // 約344px
        canvas.height = Math.round(5.5 * cmToPx); // 約208px
        
        // 背景を白で塗りつぶし
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // QRコードサイズを調整（デザイン内に収まるように）
        const qrSize = Math.min(canvas.height * 0.7, 120); // 高さの70%または120pxの小さい方
        const qrX = 20; // 左から20px
        const qrY = (canvas.height - qrSize) / 2; // 垂直中央
        
        // QRコードを描画（リサイズして配置）
        ctx.drawImage(img, qrX, qrY, qrSize, qrSize);
        
        // テキストを右側に配置
        const textX = qrX + qrSize + 30; // QRコードの右側から30px
        const textY = canvas.height / 2;
        
        ctx.fillStyle = '#374151';
        ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText('アンケートにご協力ください', textX, textY);
        
        // ダウンロード
        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `${projectTitle || 'form'}-design.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      };
      
      img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
      toast.success('デザイン画像をダウンロードしました！');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
    >
      <Card
        sx={{
          p: 3,
          borderRadius: 3,
          border: '1px solid #f1f5f9',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
          },
          transition: 'box-shadow 0.2s ease'
        }}
      >
        {/* ヘッダー */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 2
            }}
          >
            <Public sx={{ color: 'white', fontSize: '1.2rem' }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
              公開設定
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              フォームの公開状態を管理
            </Typography>
          </Box>
        </Box>

        <Stack spacing={3}>
          {/* 公開ボタン */}
          <Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#374151' }}>
                フォームを公開する
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.875rem' }}>
                ボタンを押すとフォームが一般公開されます
              </Typography>
            </Box>
            
            {isPublished ? (
              // 公開済みの場合は状態表示
              <Box
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5
                }}
              >
                <CheckCircle sx={{ color: '#10b981', fontSize: '1.25rem' }} />
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#065f46' }}>
                    公開済み
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#047857', fontSize: '0.875rem' }}>
                    フォームにアクセス可能です
                  </Typography>
                </Box>
              </Box>
            ) : (
              // 未公開の場合は公開ボタン
              <Button
                variant="contained"
                onClick={handlePublishClick}
                sx={{
                  height: 48,
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  fontSize: '1rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5a67d8 0%, #6b46a3 100%)',
                    boxShadow: '0 6px 16px rgba(102, 126, 234, 0.4)',
                    transform: 'translateY(-1px)'
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                フォームを公開する
              </Button>
            )}
          </Box>

          {isPublished && (
            <>
              <Divider />

              {/* 公開URL */}
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: '#374151' }}>
                  公開URL
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    fullWidth
                    value={formUrl}
                    InputProps={{
                      readOnly: true,
                      sx: {
                        fontSize: '0.875rem',
                        backgroundColor: '#f8fafc',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#e2e8f0'
                        }
                      }
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2
                      }
                    }}
                  />
                  <Tooltip title="URLをコピー">
                    <IconButton
                      onClick={copyUrl}
                      sx={{
                        backgroundColor: '#f1f5f9',
                        border: '1px solid #e2e8f0',
                        borderRadius: 2,
                        '&:hover': {
                          backgroundColor: '#e2e8f0'
                        }
                      }}
                    >
                      <ContentCopy sx={{ fontSize: '1.1rem', color: '#64748b' }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>

              {/* QRコード */}
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: '#374151' }}>
                  QRコード
                </Typography>
                <Box
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    textAlign: 'center',
                    display: 'inline-flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    width: 'fit-content'
                  }}
                >
                  <QRCode
                    id="qr-code"
                    value={formUrl}
                    size={120}
                    style={{ marginBottom: '16px' }}
                  />
                  <Box>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Download />}
                      onClick={downloadQR}
                      sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        borderColor: '#e2e8f0',
                        color: '#64748b',
                        '&:hover': {
                          borderColor: '#3b82f6',
                          backgroundColor: 'rgba(59, 130, 246, 0.05)'
                        }
                      }}
                    >
                      ダウンロード
                    </Button>
                  </Box>
                </Box>
              </Box>

              {/* デザインセクション */}
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: '#374151' }}>
                  デザイン
                </Typography>
                <Box
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    textAlign: 'left',
                    display: 'inline-flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    width: 'fit-content'
                  }}
                >
                  {/* デザインプレビュー */}
                  <Box
                    sx={{
                      width: '100%',
                      maxWidth: 300,
                      aspectRatio: '9.1/5.5',
                      border: '2px solid #e2e8f0',
                      borderRadius: 2,
                      backgroundColor: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '15px',
                      marginBottom: '16px',
                      overflow: 'hidden'
                    }}
                  >
                    {/* プレビュー内のQRコード */}
                    <Box sx={{ marginRight: '20px', flexShrink: 0 }}>
                      <QRCode
                        value={formUrl}
                        size={60}
                      />
                    </Box>
                    {/* プレビュー内のテキスト */}
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        color: '#374151',
                        fontSize: '12px',
                        lineHeight: 1.2
                      }}
                    >
                      アンケートに<br />ご協力ください
                    </Typography>
                  </Box>
                  
                  {/* サイズ情報 */}
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#64748b',
                      marginBottom: '12px',
                      fontSize: '11px'
                    }}
                  >
                    サイズ: 9.1cm × 5.5cm
                  </Typography>

                  {/* ダウンロードボタン */}
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Download />}
                    onClick={downloadDesignImage}
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      borderColor: '#e2e8f0',
                      color: '#64748b',
                      '&:hover': {
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.05)'
                      }
                    }}
                  >
                    デザインをダウンロード
                  </Button>
                </Box>
              </Box>
            </>
          )}
        </Stack>
      </Card>

      {/* 公開確認・エラー通知共通ダイアログ */}
      <PublishDialog
        open={showPublishDialog}
        onClose={handlePublishCancel}
        onPublish={handlePublishConfirm}
        errors={validationResults.errors}
        warnings={validationResults.warnings}
        isErrorChecking={isErrorChecking}
        errorCheckItems={errorCheckItems}
        errorCheckProgress={errorCheckProgress}
      />
    </motion.div>
  );
};

export default PublishSettings;