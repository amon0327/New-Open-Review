import React from 'react';
import {
  Poll,
  DonutSmall,
  BarChartOutlined,
  TrendingUp,
  ShowChart,
  TextFields
} from '@mui/icons-material';

// 質問データベース
export const questionsDatabase = [
  {
    id: 'q1',
    title: '商品の総合満足度',
    category: 'satisfaction',
    type: 'scale',
    chartType: 'bar',
    icon: <Poll />,
    responseCount: 1247,
    data: {
      labels: ['非常に満足', '満足', 'どちらでもない', '不満', '非常に不満'],
      values: [342, 511, 287, 85, 22],
      scale: [5, 4, 3, 2, 1]
    }
  },
  {
    id: 'q2',
    title: '商品の味・風味',
    category: 'product',
    type: 'scale',
    chartType: 'bar',
    icon: <Poll />,
    responseCount: 1203,
    data: {
      labels: ['とても美味しい', '美味しい', '普通', 'イマイチ', 'まずい'],
      values: [456, 398, 234, 89, 26],
      scale: [5, 4, 3, 2, 1]
    }
  },
  {
    id: 'q3',
    title: '購入場所',
    category: 'behavior',
    type: 'single_choice',
    chartType: 'pie',
    icon: <DonutSmall />,
    responseCount: 1156,
    data: {
      labels: ['スーパー', 'コンビニ', 'オンライン', '専門店', 'その他'],
      values: [478, 312, 243, 98, 25]
    }
  },
  {
    id: 'q4',
    title: '価格の満足度',
    category: 'satisfaction',
    type: 'scale',
    chartType: 'horizontal_bar',
    icon: <BarChartOutlined />,
    responseCount: 1198,
    data: {
      labels: ['とても満足', '満足', '普通', '高い', 'とても高い'],
      values: [298, 445, 312, 112, 31],
      scale: [5, 4, 3, 2, 1]
    }
  },
  {
    id: 'q5',
    title: 'リピート購入意向',
    category: 'behavior',
    type: 'single_choice',
    chartType: 'bar',
    icon: <TrendingUp />,
    responseCount: 1089,
    data: {
      labels: ['絶対に購入', '多分購入', 'どちらでもない', '多分購入しない', '購入しない'],
      values: [387, 342, 234, 89, 37]
    }
  },
  {
    id: 'q6',
    title: '年齢層',
    category: 'demographics',
    type: 'single_choice',
    chartType: 'horizontal_bar',
    icon: <ShowChart />,
    responseCount: 1267,
    data: {
      labels: ['10代', '20代', '30代', '40代', '50代以上'],
      values: [89, 312, 398, 287, 181]
    }
  },
  {
    id: 'q7',
    title: '改善要望',
    category: 'feedback',
    type: 'text',
    chartType: 'word_cloud',
    icon: <TextFields />,
    responseCount: 834,
    data: {
      keywords: ['価格', '味', 'パッケージ', '量', '配送', '種類'],
      frequency: [234, 198, 156, 142, 98, 76]
    }
  }
];

// カテゴリ定義
export const categoryDefinitions = {
  satisfaction: { name: '満足度', color: '#3b82f6', description: '顧客満足に関する質問' },
  product: { name: '商品', color: '#10b981', description: '商品の特性に関する質問' },
  behavior: { name: '行動', color: '#f59e0b', description: '購買行動に関する質問' },
  demographics: { name: '属性', color: '#8b5cf6', description: '回答者の属性に関する質問' },
  feedback: { name: 'フィードバック', color: '#ef4444', description: '意見・要望に関する質問' }
};

// カテゴリカラー（後方互換性のため）
export const categoryColors = Object.keys(categoryDefinitions).reduce((colors, key) => {
  colors[key] = categoryDefinitions[key].color;
  return colors;
}, {});