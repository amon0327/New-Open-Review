import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Alert,
  Card,
  CardContent,
  CircularProgress,
  Chip,
  Stack
} from '@mui/material';
import {
  Storage,
  Refresh,
  Add,
  Delete,
  CheckCircle,
  Error
} from '@mui/icons-material';
import TestDataService from '../../services/TestDataService';

export default function DebugDataPanel() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [dataCount, setDataCount] = useState(null);

  const handleTestConnection = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const result = await TestDataService.testConnection();
      setResult({
        type: result.success ? 'success' : 'error',
        message: result.success ? 'データベース接続成功' : `接続エラー: ${result.error}`
      });
    } catch (error) {
      setResult({
        type: 'error',
        message: `接続テストエラー: ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGetDataCount = async () => {
    setLoading(true);
    
    try {
      const result = await TestDataService.getDataCount();
      if (result.success) {
        setDataCount(result.count);
        setResult({
          type: 'info',
          message: `現在のデータ件数: ${result.count}件`
        });
      } else {
        setResult({
          type: 'error',
          message: `データ件数取得エラー: ${result.error}`
        });
      }
    } catch (error) {
      setResult({
        type: 'error',
        message: `データ件数取得エラー: ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTestData = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const result = await TestDataService.createTestTextAnswers();
      setResult({
        type: result.success ? 'success' : 'error',
        message: result.success 
          ? `テストデータ作成成功: ${result.data?.length || 0}件` 
          : `作成エラー: ${result.error}`
      });
      
      if (result.success) {
        // データ件数を更新
        handleGetDataCount();
      }
    } catch (error) {
      setResult({
        type: 'error',
        message: `テストデータ作成エラー: ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClearTestData = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const result = await TestDataService.clearTestTextAnswers();
      setResult({
        type: result.success ? 'success' : 'warning',
        message: result.success 
          ? 'テストデータ削除完了' 
          : `削除エラー: ${result.error}`
      });
      
      if (result.success) {
        // データ件数を更新
        handleGetDataCount();
      }
    } catch (error) {
      setResult({
        type: 'error',
        message: `テストデータ削除エラー: ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInitializeData = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const result = await TestDataService.initializeTestData();
      setResult({
        type: result.success ? 'success' : 'error',
        message: result.success 
          ? `初期化完了: ${result.initialCount} → ${result.finalCount}件` 
          : `初期化エラー: ${result.error}`
      });
      
      if (result.success) {
        setDataCount(result.finalCount);
      }
    } catch (error) {
      setResult({
        type: 'error',
        message: `初期化エラー: ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCompleteTestData = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const result = await TestDataService.createCompleteTestDataSet();
      setResult({
        type: result.success ? 'success' : 'error',
        message: result.success 
          ? `完全なテストデータセット作成完了: ${result.data.textAnswers.data.length}件のテキスト回答` 
          : `作成エラー: ${result.error}`
      });
      
      if (result.success) {
        // データ件数を更新
        handleGetDataCount();
      }
    } catch (error) {
      setResult({
        type: 'error',
        message: `完全テストデータ作成エラー: ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClearAllTestData = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const result = await TestDataService.clearAllTestData();
      setResult({
        type: result.success ? 'success' : 'warning',
        message: result.success 
          ? '全テストデータ削除完了' 
          : `削除エラー: ${result.error}`
      });
      
      if (result.success) {
        // データ件数を更新
        handleGetDataCount();
      }
    } catch (error) {
      setResult({
        type: 'error',
        message: `全データ削除エラー: ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card sx={{ m: 2, border: '2px solid #f59e0b' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Storage sx={{ color: '#f59e0b' }} />
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#92400e' }}>
            データベースデバッグパネル
          </Typography>
          <Chip 
            label="開発用" 
            size="small" 
            sx={{ bgcolor: '#fbbf2420', color: '#f59e0b' }}
          />
        </Box>

        {dataCount !== null && (
          <Alert severity="info" sx={{ mb: 2 }}>
            現在のテキスト回答データ件数: {dataCount}件
          </Alert>
        )}

        {result && (
          <Alert severity={result.type} sx={{ mb: 2 }}>
            {result.message}
          </Alert>
        )}

        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={loading ? <CircularProgress size={16} /> : <CheckCircle />}
            onClick={handleTestConnection}
            disabled={loading}
            size="small"
          >
            接続テスト
          </Button>

          <Button
            variant="outlined"
            startIcon={loading ? <CircularProgress size={16} /> : <Refresh />}
            onClick={handleGetDataCount}
            disabled={loading}
            size="small"
          >
            件数確認
          </Button>

          <Button
            variant="contained"
            startIcon={loading ? <CircularProgress size={16} /> : <Add />}
            onClick={handleCreateCompleteTestData}
            disabled={loading}
            size="small"
            color="success"
          >
            完全テストデータ作成
          </Button>

          <Button
            variant="outlined"
            startIcon={loading ? <CircularProgress size={16} /> : <Delete />}
            onClick={handleClearAllTestData}
            disabled={loading}
            size="small"
            color="error"
          >
            全テストデータ削除
          </Button>

          <Button
            variant="outlined"
            startIcon={loading ? <CircularProgress size={16} /> : <Add />}
            onClick={handleCreateTestData}
            disabled={loading}
            size="small"
            color="success"
          >
            シンプルデータ作成
          </Button>

          <Button
            variant="outlined"
            startIcon={loading ? <CircularProgress size={16} /> : <Delete />}
            onClick={handleClearTestData}
            disabled={loading}
            size="small"
            color="warning"
          >
            シンプルデータ削除
          </Button>

          <Button
            variant="contained"
            startIcon={loading ? <CircularProgress size={16} /> : <Storage />}
            onClick={handleInitializeData}
            disabled={loading}
            size="small"
            sx={{ bgcolor: '#f59e0b', '&:hover': { bgcolor: '#d97706' } }}
          >
            旧方式初期化
          </Button>
        </Stack>

        <Typography variant="caption" sx={{ display: 'block', mt: 2, color: '#64748b' }}>
          ※ 本パネルは開発・デバッグ用です。本番環境では非表示にしてください。
        </Typography>
      </CardContent>
    </Card>
  );
}