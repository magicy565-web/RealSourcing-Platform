/**
 * AMRDimensionBars — AMR 四维横向进度条组件
 * 颜色按分值从红→黄→绿渐变，带入场动画
 */
import { motion } from "framer-motion";

interface Dimension {
  key: string;
  label: string;
  value: number; // 0-100
  icon: string;
}

interface AMRDimensionBarsProps {
  acumen:   number;
  channel:  number;
  velocity: number;
  global:   number;
  compact?: boolean;
}

function getDimColor(value: number): string {
  if (value >= 80) return "#4ade80";
  if (value >= 65) return "#60a5fa";
  if (value >= 50) return "#a78bfa";
  if (value >= 35) return "#f59e0b";
  return "#ef4444";
}

export function AMRDimensionBars({
  acumen,
  channel,
  velocity,
  global,
  compact = false,
}: AMRDimensionBarsProps) {
  const dimensions: Dimension[] = [
    { key: "acumen",   label: "Acumen",   value: acumen,   icon: "◈" },
    { key: "channel",  label: "Channel",  value: channel,  icon: "◉" },
    { key: "velocity", label: "Velocity", value: velocity, icon: "◎" },
    { key: "global",   label: "Global",   value: global,   icon: "◍" },
  ];

  return (
    <div className={`space-y-${compact ? "1.5" : "2"}`}>
      {dimensions.map((dim, i) => {
        const color = getDimColor(dim.value);
        return (
          <div key={dim.key} className="flex items-center gap-2">
            {/* Label */}
            <div className={`flex items-center gap-1 flex-shrink-0 ${compact ? "w-16" : "w-20"}`}>
              <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.3)" }}>
                {dim.icon}
              </span>
              <span className={`uppercase tracking-wider font-semibold text-gray-500 ${compact ? "text-[9px]" : "text-[10px]"}`}>
                {dim.label}
              </span>
            </div>
            {/* Bar */}
            <div className={`flex-1 rounded-full overflow-hidden ${compact ? "h-1" : "h-1.5"}`}
              style={{ background: "rgba(255,255,255,0.06)" }}>
              <motion.div
                className="h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${dim.value}%` }}
                transition={{ duration: 0.8, delay: i * 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
                style={{
                  background: `linear-gradient(90deg, ${color}60, ${color})`,
                  boxShadow: `0 0 6px ${color}40`,
                }}
              />
            </div>
            {/* Value */}
            <span
              className={`flex-shrink-0 font-bold tabular-nums ${compact ? "text-[10px] w-6" : "text-xs w-7"} text-right`}
              style={{ color }}
            >
              {dim.value}
            </span>
          </div>
        );
      })}
    </div>
  );
}
