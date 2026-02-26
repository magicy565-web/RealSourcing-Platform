/**
 * AMRRadarChart — 五维雷达图组件
 * 纯 SVG 实现，带入场动画，无外部图表库依赖
 *
 * 五维：Acumen（市场洞察）· Channel（渠道能力）· Velocity（响应速度）· Global（全球化）· Trust（可信度）
 */
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

export interface AMRDimensions {
  acumen:   number; // 0-100 市场洞察
  channel:  number; // 0-100 渠道能力
  velocity: number; // 0-100 响应速度
  global:   number; // 0-100 全球化
  trust:    number; // 0-100 可信度（AI验厂分）
}

interface AMRRadarChartProps {
  dimensions: AMRDimensions;
  size?: number;
  animated?: boolean;
  showLabels?: boolean;
  accentColor?: string;
}

const AXES = [
  { key: "acumen",   label: "Acumen",   labelEn: "Market" },
  { key: "channel",  label: "Channel",  labelEn: "Channel" },
  { key: "velocity", label: "Velocity", labelEn: "Speed" },
  { key: "global",   label: "Global",   labelEn: "Global" },
  { key: "trust",    label: "Trust",    labelEn: "Trust" },
] as const;

function polarToCartesian(cx: number, cy: number, r: number, angleIndex: number, total: number) {
  // Start from top (-90 deg), go clockwise
  const angle = (angleIndex / total) * 2 * Math.PI - Math.PI / 2;
  return {
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle),
  };
}

function buildPolygonPoints(cx: number, cy: number, maxR: number, values: number[]): string {
  return values
    .map((v, i) => {
      const r = (v / 100) * maxR;
      const pt = polarToCartesian(cx, cy, r, i, values.length);
      return `${pt.x},${pt.y}`;
    })
    .join(" ");
}

export function AMRRadarChart({
  dimensions,
  size = 200,
  animated = true,
  showLabels = true,
  accentColor = "#7c3aed",
}: AMRRadarChartProps) {
  const [progress, setProgress] = useState(animated ? 0 : 1);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number>(0);
  const DURATION = 900;

  useEffect(() => {
    if (!animated) { setProgress(1); return; }
    setProgress(0);
    startRef.current = 0;
    const animate = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const p = Math.min(1, elapsed / DURATION);
      // ease-out cubic
      setProgress(1 - Math.pow(1 - p, 3));
      if (p < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [animated, dimensions.acumen, dimensions.channel, dimensions.velocity, dimensions.global, dimensions.trust]);

  const cx = size / 2;
  const cy = size / 2;
  const maxR = size * 0.38;
  const labelR = size * 0.48;

  const rawValues = [
    dimensions.acumen,
    dimensions.channel,
    dimensions.velocity,
    dimensions.global,
    dimensions.trust,
  ];
  const animValues = rawValues.map(v => v * progress);

  // Grid rings
  const rings = [0.25, 0.5, 0.75, 1.0];

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="overflow-visible"
    >
      {/* ── Background rings ── */}
      {rings.map((r, ri) => {
        const pts = AXES.map((_, i) => {
          const pt = polarToCartesian(cx, cy, maxR * r, i, AXES.length);
          return `${pt.x},${pt.y}`;
        }).join(" ");
        return (
          <polygon
            key={ri}
            points={pts}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="1"
          />
        );
      })}

      {/* ── Axis lines ── */}
      {AXES.map((_, i) => {
        const outer = polarToCartesian(cx, cy, maxR, i, AXES.length);
        return (
          <line
            key={i}
            x1={cx} y1={cy}
            x2={outer.x} y2={outer.y}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="1"
          />
        );
      })}

      {/* ── Filled area (animated) ── */}
      <polygon
        points={buildPolygonPoints(cx, cy, maxR, animValues)}
        fill={`${accentColor}28`}
        stroke={accentColor}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* ── Data points ── */}
      {animValues.map((v, i) => {
        const r = (v / 100) * maxR;
        const pt = polarToCartesian(cx, cy, r, i, AXES.length);
        return (
          <circle
            key={i}
            cx={pt.x}
            cy={pt.y}
            r="3"
            fill={accentColor}
            opacity={progress}
          />
        );
      })}

      {/* ── Labels ── */}
      {showLabels && AXES.map((axis, i) => {
        const pt = polarToCartesian(cx, cy, labelR, i, AXES.length);
        const rawPt = polarToCartesian(cx, cy, maxR * 1.05, i, AXES.length);
        // Determine text anchor based on position
        const anchor = pt.x < cx - 5 ? "end" : pt.x > cx + 5 ? "start" : "middle";
        const score = rawValues[i];
        return (
          <g key={i}>
            <text
              x={pt.x}
              y={pt.y - 4}
              textAnchor={anchor}
              fontSize="9"
              fontWeight="600"
              fill="rgba(255,255,255,0.5)"
              letterSpacing="0.5"
              style={{ textTransform: "uppercase" }}
            >
              {axis.labelEn}
            </text>
            <text
              x={pt.x}
              y={pt.y + 7}
              textAnchor={anchor}
              fontSize="10"
              fontWeight="700"
              fill={score >= 75 ? "#4ade80" : score >= 50 ? "#60a5fa" : "#f59e0b"}
            >
              {score}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
