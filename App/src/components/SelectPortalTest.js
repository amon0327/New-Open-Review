import React, { useState } from 'react';
import {
  Box,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  Paper,
  Button
} from '@mui/material';

/**
 * Material-UI SelectコンポーネントのdisablePortal使用時の位置計算テストコンポーネント
 * 
 * このコンポーネントは以下の項目をテストします：
 * 1. anchorOriginとtransformOriginの動作
 * 2. disablePortal使用時の座標系の変化
 * 3. 親要素のtransform scaleがある場合の影響
 * 4. 正しい位置に表示するための設定方法
 */
const SelectPortalTest = () => {
  const [value1, setValue1] = useState('');
  const [value2, setValue2] = useState('');
  const [value3, setValue3] = useState('');
  const [value4, setValue4] = useState('');
  const [scaleValue, setScaleValue] = useState(1);

  const menuItems = [
    'オプション 1',
    'オプション 2', 
    'オプション 3',
    'オプション 4',
    'オプション 5',
    'オプション 6',
    'オプション 7',
    'オプション 8',
    'オプション 9',
    'オプション 10'
  ];

  return (
    <Box sx={{ p: 4, minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <Typography variant="h4" sx={{ mb: 4, textAlign: 'center' }}>
        Material-UI Select disablePortal 位置計算テスト
      </Typography>

      {/* スケール調整コントロール */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>スケール調整</Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
          <Button 
            variant="outlined" 
            onClick={() => setScaleValue(0.5)}
            size="small"
          >
            0.5x
          </Button>
          <Button 
            variant="outlined" 
            onClick={() => setScaleValue(0.8)}
            size="small"
          >
            0.8x
          </Button>
          <Button 
            variant="outlined" 
            onClick={() => setScaleValue(1)}
            size="small"
          >
            1.0x
          </Button>
          <Button 
            variant="outlined" 
            onClick={() => setScaleValue(1.2)}
            size="small"
          >
            1.2x
          </Button>
          <Button 
            variant="outlined" 
            onClick={() => setScaleValue(1.5)}
            size="small"
          >
            1.5x
          </Button>
        </Box>
        <Typography variant="body2" color="text.secondary">
          現在のスケール: {scaleValue}x
        </Typography>
      </Paper>

      {/* テストケース */}
      <Box 
        sx={{ 
          transform: `scale(${scaleValue})`,
          transformOrigin: 'top left',
          transition: 'transform 0.3s ease'
        }}
      >
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
          
          {/* テストケース1: デフォルト設定（Portal使用） */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, color: '#1976d2' }}>
              テストケース1: デフォルト（Portal使用）
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, color: '#666' }}>
              disablePortal: false（デフォルト）<br/>
              Portal使用により、document.bodyにレンダリング
            </Typography>
            <FormControl fullWidth>
              <InputLabel>選択してください</InputLabel>
              <Select
                value={value1}
                onChange={(e) => setValue1(e.target.value)}
                label="選択してください"
                // デフォルト設定（Portal使用）
                MenuProps={{
                  // disablePortal: false (デフォルト)
                }}
              >
                {menuItems.map((item, index) => (
                  <MenuItem key={index} value={item}>
                    {item}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Paper>

          {/* テストケース2: disablePortal: true + デフォルト位置 */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, color: '#d32f2f' }}>
              テストケース2: disablePortal: true
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, color: '#666' }}>
              disablePortal: true<br/>
              親要素内でのレンダリング（問題発生の可能性）
            </Typography>
            <FormControl fullWidth>
              <InputLabel>選択してください</InputLabel>
              <Select
                value={value2}
                onChange={(e) => setValue2(e.target.value)}
                label="選択してください"
                MenuProps={{
                  disablePortal: true
                }}
              >
                {menuItems.map((item, index) => (
                  <MenuItem key={index} value={item}>
                    {item}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Paper>

          {/* テストケース3: disablePortal + カスタム位置設定 */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, color: '#388e3c' }}>
              テストケース3: カスタム位置設定
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, color: '#666' }}>
              disablePortal: true + anchorOrigin/transformOrigin調整<br/>
              位置補正の試み
            </Typography>
            <FormControl fullWidth>
              <InputLabel>選択してください</InputLabel>
              <Select
                value={value3}
                onChange={(e) => setValue3(e.target.value)}
                label="選択してください"
                MenuProps={{
                  disablePortal: true,
                  anchorOrigin: {
                    vertical: 'bottom',
                    horizontal: 'center'
                  },
                  transformOrigin: {
                    vertical: 'top',
                    horizontal: 'center'
                  },
                  PaperProps: {
                    sx: {
                      mt: 0.5,
                      borderRadius: '8px',
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                      maxHeight: '240px',
                      minWidth: '200px'
                    }
                  }
                }}
              >
                {menuItems.map((item, index) => (
                  <MenuItem key={index} value={item}>
                    {item}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Paper>

          {/* テストケース4: 高度な位置補正 */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, color: '#f57c00' }}>
              テストケース4: 高度な位置補正
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, color: '#666' }}>
              transform scaleを考慮した位置補正<br/>
              getContentAnchorElの無効化も併用
            </Typography>
            <FormControl fullWidth>
              <InputLabel>選択してください</InputLabel>
              <Select
                value={value4}
                onChange={(e) => setValue4(e.target.value)}
                label="選択してください"
                MenuProps={{
                  disablePortal: true,
                  getContentAnchorEl: null, // スクロール位置の影響を無効化
                  anchorOrigin: {
                    vertical: 'bottom',
                    horizontal: 'left'
                  },
                  transformOrigin: {
                    vertical: 'top',
                    horizontal: 'left'
                  },
                  PaperProps: {
                    sx: {
                      mt: 0.5,
                      borderRadius: '8px',
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                      maxHeight: '240px',
                      minWidth: '200px',
                      // transform scaleによる位置ずれを補正
                      transform: `scale(${1 / scaleValue}) translate(${(scaleValue - 1) * 50}%, ${(scaleValue - 1) * 50}%)`,
                      transformOrigin: 'top left'
                    }
                  }
                }}
              >
                {menuItems.map((item, index) => (
                  <MenuItem key={index} value={item}>
                    {item}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Paper>
        </Box>

        {/* 問題の説明 */}
        <Paper sx={{ p: 3, mt: 4, backgroundColor: '#fff3e0' }}>
          <Typography variant="h6" sx={{ mb: 2, color: '#e65100' }}>
            🔍 検証ポイント
          </Typography>
          
          <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
            1. anchorOriginとtransformOriginの動作
          </Typography>
          <Typography variant="body2" sx={{ mb: 2, pl: 2 }}>
            • anchorOrigin: メニューが基準とする親要素上の点を指定<br/>
            • transformOrigin: メニュー自体の基準点を指定<br/>
            • 両者の組み合わせでメニューの表示位置が決定される
          </Typography>

          <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
            2. disablePortal使用時の座標系の変化
          </Typography>
          <Typography variant="body2" sx={{ mb: 2, pl: 2 }}>
            • Portal使用時：document.body基準の絶対座標系<br/>
            • disablePortal時：親要素基準の相対座標系<br/>
            • 親要素にtransformがある場合、座標計算が複雑化
          </Typography>

          <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
            3. 親要素のtransform scaleがある場合の影響
          </Typography>
          <Typography variant="body2" sx={{ mb: 2, pl: 2 }}>
            • scaleによりピクセル単位の計算がずれる<br/>
            • メニューの位置が意図しない場所に表示される<br/>
            • カスケード的なtransformの影響を受ける
          </Typography>

          <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
            4. 正しい位置に表示するための設定方法
          </Typography>
          <Typography variant="body2" sx={{ pl: 2 }}>
            • getContentAnchorEl: null でスクロール影響を無効化<br/>
            • PaperPropsのtransformでscale補正<br/>
            • 動的なstyle計算による位置調整<br/>
            • 必要に応じてPortalを使用する判断
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
};

export default SelectPortalTest;