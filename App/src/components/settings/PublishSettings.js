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
import { svgRenderer } from '../../utils/SvgTemplateRenderer';

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

  // デザイン画像のダウンロード（外部テンプレート使用）
  const downloadDesignImage = async () => {
    try {
      // 指定されたSupabase SVGテンプレートURL
      const externalSvgUrl = 'https://ngayxdzippnqkzufqxhr.supabase.co/storage/v1/object/public/home-page-asset/asset/test.png';
      
      console.log('外部テンプレートを使用してデザインを生成中...');
      await downloadExternalDesign(externalSvgUrl);
      
    } catch (error) {
      console.error('外部SVGデザインのダウンロードに失敗:', error);
      console.log('フォールバック: 内蔵テンプレートを使用中...');
      
      // フォールバック1: 内蔵SVGテンプレート
      try {
        const projectConfig = getProjectDesignConfig();
        await svgRenderer.generateAndDownload(projectConfig);
        toast.success('デザイン画像をダウンロードしました！');
      } catch (svgError) {
        console.error('SVGテンプレートも失敗:', svgError);
        console.log('フォールバック: Canvas版を試行中...');
        
        // フォールバック2: Canvas版でダウンロード
        try {
          await downloadDesignImageCanvas();
        } catch (fallbackError) {
          console.error('全てのフォールバックが失敗:', fallbackError);
          toast.error('デザインのダウンロードに失敗しました。後でもう一度お試しください。');
        }
      }
    }
  };

  // フォールバック用のCanvas版デザインダウンロード
  const downloadDesignImageCanvas = async () => {
    const svg = document.getElementById('qr-code');
    if (!svg) {
      throw new Error('QRコードが見つかりません');
    }

    return new Promise((resolve, reject) => {
      try {
        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = () => {
          try {
            // プロジェクト設定を取得
            const projectConfig = getProjectDesignConfig();
            
            // 9.1cm x 5.5cm サイズ（600 DPIで超高解像度計算）
            const cmToPx = 600 / 2.54;
            canvas.width = Math.round(9.1 * cmToPx);
            canvas.height = Math.round(5.5 * cmToPx);
            
            // 高品質レンダリング設定
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            
            // 背景グラデーション
            const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            gradient.addColorStop(0, projectConfig.primaryColor + '15');
            gradient.addColorStop(1, projectConfig.secondaryColor + '15');
            
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // QRコードを配置
            const qrSize = Math.round(canvas.height * 0.6);
            const qrX = Math.round(canvas.width * 0.08);
            const qrY = (canvas.height - qrSize) / 2;
            
            // QRコード背景
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(qrX - 20, qrY - 20, qrSize + 40, qrSize + 40);
            ctx.strokeStyle = projectConfig.primaryColor;
            ctx.lineWidth = 4;
            ctx.strokeRect(qrX - 20, qrY - 20, qrSize + 40, qrSize + 40);
            
            ctx.drawImage(img, qrX, qrY, qrSize, qrSize);
            
            // テキストを配置
            const textX = qrX + qrSize + Math.round(canvas.width * 0.05);
            const textY = canvas.height / 2;
            
            ctx.fillStyle = projectConfig.textColor;
            ctx.font = `bold ${Math.round(canvas.height * 0.08)}px system-ui, -apple-system, sans-serif`;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(projectConfig.mainText, textX, textY - 40);
            
            // サブテキスト
            if (projectConfig.subText) {
              ctx.font = `normal ${Math.round(canvas.height * 0.05)}px system-ui, -apple-system, sans-serif`;
              ctx.fillStyle = projectConfig.subTextColor;
              ctx.fillText(projectConfig.subText, textX, textY + 20);
            }
            
            // ダウンロード
            const pngFile = canvas.toDataURL('image/png');
            const downloadLink = document.createElement('a');
            downloadLink.download = `${projectTitle || 'form'}-design.png`;
            downloadLink.href = pngFile;
            downloadLink.click();
            
            toast.success('デザイン画像をダウンロードしました！');
            resolve();
            
          } catch (canvasError) {
            reject(canvasError);
          }
        };
        
        img.onerror = () => reject(new Error('QRコード画像の読み込みに失敗'));
        img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
        
      } catch (error) {
        reject(error);
      }
    });
  };

  // プロジェクト情報を取得してデザインに適用
  const getProjectDesignConfig = () => {
    // フォームデータからテーマカラー情報を取得
    const primaryColor = formData?.formSettings?.primaryColor || '#5e17eb';
    const secondaryColor = formData?.formSettings?.secondaryColor || '#764ba2';
    
    // ロゴ画像情報を取得
    const logoImage = formData?.headerImage?.logo || formData?.logoImage;
    
    // プロジェクト固有の設定
    return {
      template: 'poster', // 新しいポスターテンプレートを使用
      qrText: formUrl,
      filename: `${projectTitle || 'form'}-poster`,
      
      // カラーテーマ
      primaryColor: primaryColor,
      secondaryColor: secondaryColor,
      
      // ポスター用テキスト設定
      mainTitle: 'アンケートにご協力ください',
      subTitle: `${projectTitle} への回答をお願いします`,
      titleSize: '96',
      subTitleSize: '64',
      qrText: 'QRコードでアクセス',
      description: '所要時間：約5分　匿名回答可能',
      descSize: '48',
      
      // ロゴ設定
      logoImage: logoImage,
      
      // デザイン設定
      showDecorations: true,
      textColor: '#2d3748',
      subTextColor: '#4a5568'
    };
  };

  // SVGベースの高度なデザインダウンロード
  const downloadAdvancedDesign = async (customOptions = {}) => {
    try {
      const projectConfig = getProjectDesignConfig();
      const config = { ...projectConfig, ...customOptions };

      await svgRenderer.generateAndDownload(config);
      toast.success('プロジェクトデザイン画像をダウンロードしました！');
    } catch (error) {
      console.error('SVGデザインのダウンロードに失敗:', error);
      toast.error('デザインのダウンロードに失敗しました');
    }
  };

  // 外部SVGテンプレートを使用したデザインダウンロード
  const downloadExternalDesign = async (svgUrl) => {
    try {
      const projectConfig = getProjectDesignConfig();
      
      // 外部SVGテンプレートを読み込み
      const template = await svgRenderer.loadExternalSvgTemplate(svgUrl);
      
      // プロジェクト設定でプレースホルダーを置換
      const qrCodeDataUrl = await svgRenderer.generateQRCodeDataUrl(projectConfig.qrText);
      
      const variables = {
        QR_CODE_DATA: qrCodeDataUrl,
        PRIMARY_COLOR: projectConfig.primaryColor,
        SECONDARY_COLOR: projectConfig.secondaryColor,
        MAIN_TITLE: projectConfig.mainTitle,
        SUB_TITLE: projectConfig.subTitle,
        TITLE_SIZE: projectConfig.titleSize,
        SUB_TITLE_SIZE: projectConfig.subTitleSize,
        SUB_TITLE_OPACITY: '1',
        QR_TEXT: projectConfig.qrText || 'QRコードでアクセス',
        DESCRIPTION: projectConfig.description,
        DESC_SIZE: projectConfig.descSize,
        DESC_OPACITY: '1',
        LOGO_IMAGE: '',
        LOGO_OPACITY: '0'
      };

      // ロゴ画像の処理
      if (projectConfig.logoImage) {
        const logoDataUrl = await svgRenderer.convertImageToDataUrl(projectConfig.logoImage, 280, 120);
        variables.LOGO_IMAGE = logoDataUrl;
        variables.LOGO_OPACITY = '1';
      }

      // SVG生成とダウンロード
      const finalSvg = svgRenderer.replacePlaceholders(template, variables);
      const pngBlob = await svgRenderer.svgToPng(finalSvg, 1);
      const url = URL.createObjectURL(pngBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${projectTitle || 'form'}-external-design.png`;
      link.click();
      
      URL.revokeObjectURL(url);
      toast.success('外部テンプレートデザインをダウンロードしました！');
      
    } catch (error) {
      console.error('外部SVGデザインのダウンロードに失敗:', error);
      toast.error('外部テンプレートの処理に失敗しました');
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
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
              {/* 左側にテキストを配置 */}
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#374151' }}>
                  フォームを公開する
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.875rem' }}>
                  ボタンを押すとフォームが一般公開されます
                </Typography>
              </Box>
              
              {/* 右側にボタンを配置 */}
              {isPublished ? (
                // 公開済みの場合は状態表示
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    minWidth: 'fit-content',
                    flexShrink: 0
                  }}
                >
                  <CheckCircle sx={{ color: '#10b981', fontSize: '1.1rem' }} />
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#065f46', fontSize: '0.875rem' }}>
                    公開済み
                  </Typography>
                </Box>
              ) : (
                // 未公開の場合は公開ボタン
                <Button
                  variant="contained"
                  onClick={handlePublishClick}
                  sx={{
                    height: 40,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    textTransform: 'none',
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                    minWidth: 'fit-content',
                    flexShrink: 0,
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

              {/* TODO: デザインセクション - 後で実装予定 
                  機能:
                  - 外部SVGテンプレートを使用したポスターデザイン生成
                  - プロジェクトのQRコード・ロゴ・テーマカラーの動的適用
                  - 9.1cm × 5.5cm サイズのプレビュー・ダウンロード機能
                  - Supabase連携による高品質デザインテンプレート取得
                  
                  実装済み関数:
                  - downloadDesignImage(): 外部テンプレートダウンロード
                  - downloadExternalDesign(): SVG処理・編集
                  - getProjectDesignConfig(): プロジェクト設定取得
              */}
              {/* デザインセクション - 一時的にコメントアウト */}
              {/* 
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
                  <Box
                    sx={{
                      width: '100%',
                      maxWidth: 300,
                      aspectRatio: '9.1/5.5',
                      border: '2px solid #e2e8f0',
                      borderRadius: 2,
                      background: `linear-gradient(135deg, ${formData?.formSettings?.primaryColor || '#5e17eb'}15, ${formData?.formSettings?.secondaryColor || '#764ba2'}15)`,
                      position: 'relative',
                      marginBottom: '16px',
                      overflow: 'hidden'
                    }}
                  >
                    <Box
                      sx={{
                        position: 'absolute',
                        top: '15%',
                        left: '8%',
                        right: '8%',
                        bottom: '15%',
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        borderRadius: '8px',
                        padding: '10px',
                        display: 'flex',
                        flexDirection: 'column'
                      }}
                    >
                      {(formData?.headerImage?.logo || formData?.logoImage) && (
                        <Box
                          sx={{
                            position: 'absolute',
                            top: '8px',
                            left: '8px',
                            width: '40px',
                            height: '20px',
                            backgroundColor: '#f8f9fa',
                            border: '1px solid #e9ecef',
                            borderRadius: '4px',
                            fontSize: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#6c757d'
                          }}
                        >
                          LOGO
                        </Box>
                      )}
                      
                      <Typography
                        sx={{
                          fontSize: '10px',
                          fontWeight: 'bold',
                          color: '#2d3748',
                          marginTop: '25px',
                          marginBottom: '4px',
                          lineHeight: 1.2
                        }}
                      >
                        アンケートにご協力ください
                      </Typography>
                      
                      <Typography
                        sx={{
                          fontSize: '7px',
                          color: '#4a5568',
                          marginBottom: '8px',
                          lineHeight: 1.2
                        }}
                      >
                        {projectTitle} への回答をお願いします
                      </Typography>
                      
                      <Box
                        sx={{
                          position: 'absolute',
                          top: '15px',
                          right: '15px',
                          width: '45px',
                          height: '45px',
                          border: `2px solid ${formData?.formSettings?.primaryColor || '#5e17eb'}`,
                          borderRadius: '6px',
                          backgroundColor: '#ffffff',
                          padding: '4px'
                        }}
                      >
                        <QRCode
                          value={formUrl}
                          size={35}
                        />
                      </Box>
                      
                      <Typography
                        sx={{
                          position: 'absolute',
                          bottom: '15px',
                          right: '8px',
                          fontSize: '6px',
                          fontWeight: 600,
                          color: '#2d3748',
                          textAlign: 'center'
                        }}
                      >
                        QRコードでアクセス
                      </Typography>
                      
                      <Typography
                        sx={{
                          position: 'absolute',
                          bottom: '8px',
                          left: '8px',
                          fontSize: '6px',
                          color: '#718096'
                        }}
                      >
                        所要時間：約5分　匿名回答可能
                      </Typography>
                    </Box>
                  </Box>
                  
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
              */}
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