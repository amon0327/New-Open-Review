import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Paper
} from '@mui/material';
import SelectPortalTest from './SelectPortalTest';
import SelectPositioningAnalysis from './SelectPositioningAnalysis';

/**
 * Selectコンポーネントのテストページ
 * 複数のテストコンポーネントをタブで切り替えて表示
 */
const SelectTestPage = () => {
  const [selectedTab, setSelectedTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h3" sx={{ mb: 4, textAlign: 'center', color: '#1976d2' }}>
        Material-UI Select disablePortal 調査レポート
      </Typography>

      <Typography variant="body1" sx={{ mb: 4, textAlign: 'center', color: '#666' }}>
        Material-UIのSelectコンポーネントでdisablePortal: trueを使用した場合の<br/>
        メニュー位置計算問題の調査と解決策の検証
      </Typography>

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={selectedTab}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 500,
              py: 2
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#1976d2',
              height: 3
            }
          }}
        >
          <Tab label="基本的なテストケース" />
          <Tab label="PullDownQuestion問題分析" />
        </Tabs>
      </Paper>

      <Box sx={{ mt: 3 }}>
        {selectedTab === 0 && <SelectPortalTest />}
        {selectedTab === 1 && <SelectPositioningAnalysis />}
      </Box>

      {/* 調査結果サマリー */}
      <Paper sx={{ p: 4, mt: 4, backgroundColor: '#f8f9fa' }}>
        <Typography variant="h5" sx={{ mb: 3, color: '#1976d2' }}>
          🔍 調査結果サマリー
        </Typography>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 2, color: '#d32f2f' }}>
            ❌ 問題の概要
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Material-UIのSelectコンポーネントで<strong>disablePortal: true</strong>を使用すると、
            親要素に<strong>transform: scale()</strong>が適用されている場合にメニューが正しい位置に表示されない問題が発生します。
          </Typography>
          <Typography variant="body2" sx={{ color: '#666' }}>
            この問題は特にPreviewAreaでズーム機能を使用している際に顕著に現れます。
          </Typography>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 2, color: '#1976d2' }}>
            🔧 技術的詳細
          </Typography>
          
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
            1. anchorOriginとtransformOriginの動作
          </Typography>
          <Typography variant="body2" sx={{ mb: 2, pl: 2 }}>
            • <strong>anchorOrigin</strong>: メニューが基準とする親要素上の点を指定（vertical/horizontal）<br/>
            • <strong>transformOrigin</strong>: メニュー自体の基準点を指定<br/>
            • 両プロパティの組み合わせでメニューの最終的な表示位置が決定される
          </Typography>

          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
            2. disablePortal使用時の座標系の変化
          </Typography>
          <Typography variant="body2" sx={{ mb: 2, pl: 2 }}>
            • <strong>Portal使用時（disablePortal: false）</strong>: document.body基準の絶対座標系<br/>
            • <strong>Portal無効時（disablePortal: true）</strong>: 親要素基準の相対座標系<br/>
            • 親要素にtransformが適用されている場合、座標計算が複雑化し位置ずれが発生
          </Typography>

          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
            3. 親要素のtransform scaleがある場合の影響
          </Typography>
          <Typography variant="body2" sx={{ mb: 2, pl: 2 }}>
            • scale変換によりピクセル単位の計算にずれが生じる<br/>
            • ブラウザの座標計算でtransformの影響が正しく考慮されない<br/>
            • 複数のtransformが重なった場合、計算誤差が累積する
          </Typography>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 2, color: '#388e3c' }}>
            ✅ 解決策
          </Typography>
          
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, color: '#1976d2' }}>
            推奨解決策: Portal使用（disablePortal: false）
          </Typography>
          <Typography variant="body2" sx={{ mb: 2, pl: 2 }}>
            • 最も確実で簡単な解決方法<br/>
            • メニューがdocument.bodyに直接レンダリングされるため、親要素のtransformの影響を受けない<br/>
            • Material-UIのデフォルト動作で、十分にテストされている
          </Typography>

          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, color: '#f57c00' }}>
            代替解決策: 位置補正
          </Typography>
          <Typography variant="body2" sx={{ pl: 2 }}>
            • disablePortal: trueを維持する必要がある特殊な要件がある場合<br/>
            • PaperPropsでメニューにtransform補正を適用<br/>
            • marginやpositioningによる位置微調整<br/>
            • より複雑で、異なるブラウザでの動作検証が必要
          </Typography>
        </Box>

        <Box>
          <Typography variant="h6" sx={{ mb: 2, color: '#5e17eb' }}>
            📝 実装上の変更点
          </Typography>
          <Typography variant="body1" sx={{ mb: 1 }}>
            PreviewQuestionsコンポーネントのPullDownQuestionで以下の変更を実施：
          </Typography>
          <Box sx={{ 
            backgroundColor: '#f5f5f5', 
            p: 2, 
            borderRadius: 1,
            fontFamily: 'monospace',
            fontSize: '0.875rem'
          }}>
            {`// 変更前
disablePortal: true,

// 変更後（推奨）
disablePortal: false, // Portal使用でzoom時の位置計算問題を解決`}
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default SelectTestPage;