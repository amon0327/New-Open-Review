import React from 'react'
import './Skeleton.css'

// 基本スケルトン要素
export const Sk = ({ w, h, r = 8, style, className = '' }) => (
  <span
    className={`sk ${className}`}
    style={{
      width: typeof w === 'number' ? `${w}px` : w,
      height: typeof h === 'number' ? `${h}px` : h,
      borderRadius: typeof r === 'number' ? `${r}px` : r,
      ...style
    }}
  />
)

// 共通: 行ベースの汎用スケルトン (タイトル + サブ × N)
const SkRow = () => (
  <div className="sk-row">
    <Sk w="60%" h={14} r={4} />
    <Sk w="40%" h={11} r={4} />
  </div>
)

// 統一スケルトン: シンプルな行リスト形式
export const SkList = ({ count = 5 }) => (
  <div className="sk-list">
    {Array.from({ length: count }).map((_, i) => (
      <SkRow key={i} />
    ))}
  </div>
)

// 後方互換 (既存呼び出し名)
export const SkCardList = SkList
export const SkCouponList = SkList
export const SkKpiGrid = () => <SkList count={4} />
export const SkChart = ({ rows = 8 }) => <SkList count={rows} />
export const SkSettings = () => <SkList count={4} />
export const SkBroadcast = () => <SkList count={5} />
