/**
 * ScoreRing — 综合评分圆环组件
 * SVG 描边动画，从 0 到目标值，颜色按分值渐变
 */
import { useEffect, useRef, useState } from "react";

interface ScoreRingProps {
  score: number;       // 0-100
  size?: number;       // px
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
  animated?: boolean;
}

function getScoreColor(score: number): { stroke: string; text: string; glow: string } {
  if (score >= 90) return { stroke: "#4ade80", text: "#4ade80", glow: "rgba(74,222,128,0.3)" };
  if (score >= 75) return { stroke: "#60a5fa", text: "#60a5fa", glow: "rgba(96,165,250,0.3)" };
  if (score >= 60) return { stroke: "#a78bfa", text: "#a78bfa", glow: "rgba(167,139,250,0.3)" };
  return { stroke: "#f59e0b", text: "#f59e0b", glow: "rgba(245,158,11,0.3)" };
}

export function ScoreRing({
  score,
  size = 80,
  strokeWidth = 6,
  label,
  sublabel,
  animated = true,
}: ScoreRingProps) {
  const [displayScore, setDisplayScore] = useState(animated ? 0 : score);
  const [progress, setProgress] = useState(animated ? 0 : 1);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number>(0);
  const DURATION = 1000;

  useEffect(() => {
    if (!animated) { setDisplayScore(score); setProgress(1); return; }
    setDisplayScore(0);
    setProgress(0);
    startRef.current = 0;
    const animate = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const p = Math.min(1, elapsed / DURATION);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplayScore(Math.round(score * eased));
      setProgress(eased);
      if (p < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [animated, score]);

  const r = (size - strokeWidth * 2) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference * (1 - progress * (score / 100));
  const colors = getScoreColor(score);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Background ring */}
          <circle
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={strokeWidth}
          />
          {/* Score ring */}
          <circle
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={colors.stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            transform={`rotate(-90 ${cx} ${cy})`}
            style={{ filter: `drop-shadow(0 0 6px ${colors.glow})` }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-bold tabular-nums leading-none"
            style={{ color: colors.text, fontSize: size * 0.22 }}
          >
            {displayScore}
          </span>
          {label && (
            <span
              className="text-gray-500 font-medium uppercase tracking-wider leading-none mt-0.5"
              style={{ fontSize: size * 0.1 }}
            >
              {label}
            </span>
          )}
        </div>
      </div>
      {sublabel && (
        <span className="text-[10px] text-gray-600 uppercase tracking-wider font-medium">
          {sublabel}
        </span>
      )}
    </div>
  );
}
