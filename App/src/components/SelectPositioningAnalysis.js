import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Select,
  MenuItem,
  FormControl,
  Typography,
  Paper,
  Button,
  Slider,
  Alert,
  AlertTitle
} from '@mui/material';

/**
 * PullDownQuestionコンポーネントの位置計算問題分析
 * 
 * 実際のPreviewQuestionsコンポーネントで発生している問題を再現し、
 * 解決策を提案するためのテストコンポーネント
 */
const SelectPositioningAnalysis = () => {
  const [selectedValue, setSelectedValue] = useState('');
  const [zoom, setZoom] = useState(1);
  const [containerTransform, setContainerTransform] = useState(1);
  const selectRef = useRef(null);
  const [selectRect, setSelectRect] = useState(null);

  // 選択肢データ
  const choices = [
    '選択肢1',
    '選択肢2', 
    '選択肢3',
    '選択肢4',
    '選択肢5',
    '選択肢6',
    '選択肢7',
    '選択肢8',
    '選択肢9',
    '選択肢10'
  ];

  // Selectの位置情報を取得
  useEffect(() => {
    if (selectRef.current) {
      const rect = selectRef.current.getBoundingClientRect();
      setSelectRect(rect);
    }
  }, [zoom, containerTransform]);

  return (
    <Box sx={{ p: 4, minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      <Typography variant="h4" sx={{ mb: 4, textAlign: 'center' }}>
        PullDownQuestion 位置計算問題分析
      </Typography>

      {/* コントロールパネル */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 3 }}>パラメータ調整</Typography>
        
        <Box sx={{ mb: 3 }}>
          <Typography gutterBottom>Zoom (PreviewAreaのzoom)</Typography>
          <Slider
            value={zoom}
            onChange={(e, newValue) => setZoom(newValue)}
            min={0.3}
            max={2}
            step={0.1}
            marks={[
              { value: 0.5, label: '0.5x' },
              { value: 1, label: '1.0x' },
              { value: 1.5, label: '1.5x' }
            ]}
            valueLabelDisplay="auto"
          />
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography gutterBottom>Container Scale (追加のtransform)</Typography>
          <Slider
            value={containerTransform}
            onChange={(e, newValue) => setContainerTransform(newValue)}
            min={0.5}
            max={2}
            step={0.1}
            marks={[
              { value: 0.8, label: '0.8x' },
              { value: 1, label: '1.0x' },
              { value: 1.2, label: '1.2x' }
            ]}
            valueLabelDisplay="auto"
          />
        </Box>

        {selectRect && (
          <Box sx={{ mt: 2, p: 2, backgroundColor: '#e3f2fd', borderRadius: 1 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Select要素の位置情報:</Typography>
            <Typography variant="body2">
              Top: {selectRect.top.toFixed(2)}px, Left: {selectRect.left.toFixed(2)}px<br/>
              Width: {selectRect.width.toFixed(2)}px, Height: {selectRect.height.toFixed(2)}px
            </Typography>
          </Box>
        )}
      </Paper>

      {/* 問題の説明 */}
      <Alert severity="warning" sx={{ mb: 4 }}>
        <AlertTitle>現在の問題</AlertTitle>
        PreviewQuestionsコンポーネントでzoomプロパティが適用されているとき、
        PullDownQuestionのSelectメニューが正しい位置に表示されない問題が発生しています。
        disablePortal: trueを使用することで親要素内でのレンダリングが行われますが、
        transform scaleによる座標計算のずれが原因です。
      </Alert>

      {/* テストケース比較 */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 3 }}>
        
        {/* 問題のあるケース（現在の実装） */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, color: '#d32f2f' }}>
            ❌ 問題のあるケース
          </Typography>
          <Typography variant="body2" sx={{ mb: 2, color: '#666' }}>
            現在のPullDownQuestion実装
          </Typography>
          
          <Box 
            sx={{ 
              transform: `scale(${zoom * containerTransform})`,
              transformOrigin: 'top left',
              transition: 'transform 0.3s ease'
            }}
          >
            <FormControl fullWidth>
              <Select
                ref={selectRef}
                value={selectedValue}
                onChange={(e) => setSelectedValue(e.target.value)}
                displayEmpty
                MenuProps={{
                  disablePortal: true,
                  PaperProps: {
                    sx: {
                      mt: 0.5,
                      borderRadius: '8px',
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                      maxHeight: '240px',
                      minWidth: '200px'
                    }
                  },
                  anchorOrigin: {
                    vertical: 'bottom',
                    horizontal: 'center'
                  },
                  transformOrigin: {
                    vertical: 'top',
                    horizontal: 'center'
                  }
                }}
                sx={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: `${4 * zoom}px`,
                  fontSize: `${1 * zoom}rem`,
                  '& .MuiSelect-select': {
                    padding: `${12 * zoom}px ${16 * zoom}px`,
                    fontSize: `${1 * zoom}rem`
                  }
                }}
              >
                <MenuItem value="" disabled>選択してください</MenuItem>
                {choices.map((choice, index) => (
                  <MenuItem key={index} value={choice}>
                    {choice}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Paper>

        {/* 解決策1: Portal使用 */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, color: '#388e3c' }}>
            ✅ 解決策1: Portal使用
          </Typography>
          <Typography variant="body2" sx={{ mb: 2, color: '#666' }}>
            disablePortal: falseでPortal使用
          </Typography>
          
          <Box 
            sx={{ 
              transform: `scale(${zoom * containerTransform})`,
              transformOrigin: 'top left',
              transition: 'transform 0.3s ease'
            }}
          >
            <FormControl fullWidth>
              <Select
                value={selectedValue}
                onChange={(e) => setSelectedValue(e.target.value)}
                displayEmpty
                MenuProps={{
                  disablePortal: false, // Portal使用
                  PaperProps: {
                    sx: {
                      mt: 0.5,
                      borderRadius: '8px',
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                      maxHeight: '240px',
                      minWidth: '200px'
                    }
                  },
                  anchorOrigin: {
                    vertical: 'bottom',
                    horizontal: 'center'
                  },
                  transformOrigin: {
                    vertical: 'top',
                    horizontal: 'center'
                  }
                }}
                sx={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: `${4 * zoom}px`,
                  fontSize: `${1 * zoom}rem`,
                  '& .MuiSelect-select': {
                    padding: `${12 * zoom}px ${16 * zoom}px`,
                    fontSize: `${1 * zoom}rem`
                  }
                }}
              >
                <MenuItem value="" disabled>選択してください</MenuItem>
                {choices.map((choice, index) => (
                  <MenuItem key={index} value={choice}>
                    {choice}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Paper>

        {/* 解決策2: 位置補正 */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, color: '#1976d2' }}>
            ✅ 解決策2: 位置補正
          </Typography>
          <Typography variant="body2" sx={{ mb: 2, color: '#666' }}>
            transform scaleを考慮した位置補正
          </Typography>
          
          <Box 
            sx={{ 
              transform: `scale(${zoom * containerTransform})`,
              transformOrigin: 'top left',
              transition: 'transform 0.3s ease'
            }}
          >
            <FormControl fullWidth>
              <Select
                value={selectedValue}
                onChange={(e) => setSelectedValue(e.target.value)}
                displayEmpty
                MenuProps={{
                  disablePortal: true,
                  getContentAnchorEl: null,
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
                      // スケール補正
                      transform: `scale(${1 / (zoom * containerTransform)})`,
                      transformOrigin: 'top left',
                      // 位置補正
                      marginTop: `${(zoom * containerTransform - 1) * 20}px`,
                      marginLeft: `${(zoom * containerTransform - 1) * 10}px`
                    }
                  }
                }}
                sx={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: `${4 * zoom}px`,
                  fontSize: `${1 * zoom}rem`,
                  '& .MuiSelect-select': {
                    padding: `${12 * zoom}px ${16 * zoom}px`,
                    fontSize: `${1 * zoom}rem`
                  }
                }}
              >
                <MenuItem value="" disabled>選択してください</MenuItem>
                {choices.map((choice, index) => (
                  <MenuItem key={index} value={choice}>
                    {choice}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Paper>
      </Box>

      {/* 技術的な詳細説明 */}
      <Paper sx={{ p: 3, mt: 4, backgroundColor: '#fafafa' }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          🔧 技術的詳細と解決策
        </Typography>
        
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
            1. 問題の根本原因
          </Typography>
          <Typography variant="body2" sx={{ pl: 2, color: '#555' }}>
            • PreviewAreaでzoomが適用されると、親要素にtransform: scale()が設定される<br/>
            • disablePortal: trueの場合、メニューが親要素内でレンダリングされる<br/>
            • ブラウザの座標計算でtransformの影響を正しく考慮されない<br/>
            • 結果としてメニューが意図しない位置に表示される
          </Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
            2. 解決策の比較
          </Typography>
          
          <Box sx={{ pl: 2 }}>
            <Typography variant="body2" sx={{ mb: 2, color: '#1976d2' }}>
              <strong>解決策1: Portal使用（推奨）</strong><br/>
              • disablePortal: falseにしてPortalを使用<br/>
              • メニューがdocument.bodyに直接レンダリングされる<br/>
              • transform scaleの影響を受けない<br/>
              • 最も確実で簡単な解決方法
            </Typography>
            
            <Typography variant="body2" sx={{ color: '#388e3c' }}>
              <strong>解決策2: 位置補正</strong><br/>
              • disablePortal: trueを維持しつつ位置を補正<br/>
              • PaperPropsでメニューにscale補正を適用<br/>
              • marginで位置を微調整<br/>
              • より複雑だが、特殊な要件がある場合に有用
            </Typography>
          </Box>
        </Box>

        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
            3. 推奨実装コード
          </Typography>
          <Box sx={{ 
            backgroundColor: '#f5f5f5', 
            p: 2, 
            borderRadius: 1,
            fontFamily: 'monospace',
            fontSize: '0.875rem',
            overflow: 'auto'
          }}>
            {`MenuProps={{
  disablePortal: false, // Portal使用で位置問題を解決
  PaperProps: {
    sx: {
      mt: 0.5,
      borderRadius: '8px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
      maxHeight: '240px',
      minWidth: '200px'
    }
  },
  anchorOrigin: {
    vertical: 'bottom',
    horizontal: 'center'
  },
  transformOrigin: {
    vertical: 'top',
    horizontal: 'center'
  }
}}`}
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default SelectPositioningAnalysis;