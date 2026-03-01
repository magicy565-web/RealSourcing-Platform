/**
 * SkeletonCard — 统一骨架屏组件库
 *
 * 提供多种预设骨架屏，覆盖工厂卡片、消息气泡、报价卡片等场景
 * 使用 CSS shimmer 动画，无外部依赖
 */

import React from "react";

// ─── 基础 shimmer 动画样式 ────────────────────────────────────────────────────
const shimmerStyle: React.CSSProperties = {
  background: "linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.03) 75%)",
  backgroundSize: "200% 100%",
  animation: "shimmer 1.6s infinite",
  borderRadius: 6,
};

const shimmerKeyframes = `
  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
`;

// ─── 基础 Skeleton 块 ─────────────────────────────────────────────────────────
export function SkeletonBlock({
  width = "100%",
  height = 14,
  borderRadius = 6,
  style,
}: {
  width?: string | number;
  height?: number;
  borderRadius?: number;
  style?: React.CSSProperties;
}) {
  return (
    <>
      <style>{shimmerKeyframes}</style>
      <div style={{ ...shimmerStyle, width, height, borderRadius, ...style }} />
    </>
  );
}

// ─── 工厂卡片骨架屏 ───────────────────────────────────────────────────────────
export function FactoryCardSkeleton() {
  return (
    <>
      <style>{shimmerKeyframes}</style>
      <div style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 16, overflow: "hidden",
      }}>
        {/* 封面图 */}
        <div style={{ ...shimmerStyle, height: 160, borderRadius: 0 }} />
        {/* 内容区 */}
        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
          <SkeletonBlock height={16} width="65%" />
          <SkeletonBlock height={11} width="45%" />
          {/* AMR 评分区 */}
          <div style={{
            background: "rgba(255,255,255,0.02)", borderRadius: 12,
            padding: "10px 12px", display: "flex", alignItems: "center", gap: 12,
          }}>
            <div style={{ ...shimmerStyle, width: 48, height: 48, borderRadius: "50%" }} />
            <div style={{ flex: 1, display: "flex", gap: 6, alignItems: "flex-end" }}>
              {[24, 18, 20, 14].map((h, i) => (
                <div key={i} style={{ ...shimmerStyle, width: 16, height: h, borderRadius: 3 }} />
              ))}
            </div>
          </div>
          {/* 标签行 */}
          <div style={{ display: "flex", gap: 6 }}>
            {[60, 80, 55].map((w, i) => (
              <div key={i} style={{ ...shimmerStyle, width: w, height: 20, borderRadius: 999 }} />
            ))}
          </div>
          {/* CTA */}
          <div style={{ ...shimmerStyle, height: 36, borderRadius: 10 }} />
        </div>
      </div>
    </>
  );
}

// ─── 报价卡片骨架屏 ───────────────────────────────────────────────────────────
export function QuoteCardSkeleton() {
  return (
    <>
      <style>{shimmerKeyframes}</style>
      <div style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 14, padding: 16, marginBottom: 10,
        display: "flex", flexDirection: "column", gap: 12,
      }}>
        {/* 顶部：工厂名 + 匹配分 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ ...shimmerStyle, width: 36, height: 36, borderRadius: 8 }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <SkeletonBlock height={14} width={120} />
              <SkeletonBlock height={10} width={80} />
            </div>
          </div>
          <SkeletonBlock height={24} width={48} borderRadius={8} />
        </div>
        {/* 中部：规格 */}
        <div style={{ display: "flex", gap: 20, paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <SkeletonBlock height={9} width={40} />
              <SkeletonBlock height={15} width={60} />
            </div>
          ))}
        </div>
        {/* 底部：按钮 */}
        <div style={{ ...shimmerStyle, height: 38, borderRadius: 10 }} />
      </div>
    </>
  );
}

// ─── 消息气泡骨架屏 ───────────────────────────────────────────────────────────
export function MessageBubbleSkeleton({ isUser = false }: { isUser?: boolean }) {
  return (
    <>
      <style>{shimmerKeyframes}</style>
      <div style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        gap: 10,
      }}>
        {!isUser && (
          <div style={{ ...shimmerStyle, width: 30, height: 30, borderRadius: "50%", flexShrink: 0 }} />
        )}
        <div style={{
          ...shimmerStyle,
          width: isUser ? "45%" : "60%",
          height: isUser ? 38 : 72,
          borderRadius: isUser ? "16px 4px 16px 16px" : "4px 16px 16px 16px",
        }} />
      </div>
    </>
  );
}

// ─── 表格行骨架屏 ─────────────────────────────────────────────────────────────
export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <>
      <style>{shimmerKeyframes}</style>
      <div style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: 12, padding: "12px 16px",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
      }}>
        {Array.from({ length: cols }).map((_, i) => (
          <SkeletonBlock key={i} height={13} width={i === 0 ? "80%" : "60%"} />
        ))}
      </div>
    </>
  );
}

// ─── 工厂网格骨架屏（多卡片） ─────────────────────────────────────────────────
export function FactoryGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
      gap: 16,
    }}>
      {Array.from({ length: count }).map((_, i) => (
        <FactoryCardSkeleton key={i} />
      ))}
    </div>
  );
}
