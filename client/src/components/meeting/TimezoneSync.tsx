import React, { useMemo } from "react";
import { Globe, Clock, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";

// ─── 常见时区数据库 ────────────────────────────────────────────────────────────
const TIMEZONE_DB: Record<string, { label: string; offset: number; flag: string }> = {
  "America/New_York":     { label: "纽约 (EST/EDT)",       offset: -5,  flag: "🇺🇸" },
  "America/Chicago":      { label: "芝加哥 (CST/CDT)",     offset: -6,  flag: "🇺🇸" },
  "America/Denver":       { label: "丹佛 (MST/MDT)",       offset: -7,  flag: "🇺🇸" },
  "America/Los_Angeles":  { label: "洛杉矶 (PST/PDT)",     offset: -8,  flag: "🇺🇸" },
  "America/Toronto":      { label: "多伦多 (EST/EDT)",      offset: -5,  flag: "🇨🇦" },
  "America/Vancouver":    { label: "温哥华 (PST/PDT)",     offset: -8,  flag: "🇨🇦" },
  "Europe/London":        { label: "伦敦 (GMT/BST)",       offset: 0,   flag: "🇬🇧" },
  "Europe/Paris":         { label: "巴黎 (CET/CEST)",      offset: 1,   flag: "🇫🇷" },
  "Europe/Berlin":        { label: "柏林 (CET/CEST)",      offset: 1,   flag: "🇩🇪" },
  "Europe/Amsterdam":     { label: "阿姆斯特丹 (CET/CEST)", offset: 1,  flag: "🇳🇱" },
  "Europe/Madrid":        { label: "马德里 (CET/CEST)",    offset: 1,   flag: "🇪🇸" },
  "Europe/Rome":          { label: "罗马 (CET/CEST)",      offset: 1,   flag: "🇮🇹" },
  "Europe/Warsaw":        { label: "华沙 (CET/CEST)",      offset: 1,   flag: "🇵🇱" },
  "Europe/Stockholm":     { label: "斯德哥尔摩 (CET/CEST)", offset: 1,  flag: "🇸🇪" },
  "Europe/Helsinki":      { label: "赫尔辛基 (EET/EEST)",  offset: 2,   flag: "🇫🇮" },
  "Europe/Athens":        { label: "雅典 (EET/EEST)",      offset: 2,   flag: "🇬🇷" },
  "Europe/Moscow":        { label: "莫斯科 (MSK)",          offset: 3,   flag: "🇷🇺" },
  "Asia/Dubai":           { label: "迪拜 (GST)",            offset: 4,   flag: "🇦🇪" },
  "Asia/Karachi":         { label: "卡拉奇 (PKT)",          offset: 5,   flag: "🇵🇰" },
  "Asia/Kolkata":         { label: "孟买/新德里 (IST)",     offset: 5.5, flag: "🇮🇳" },
  "Asia/Dhaka":           { label: "达卡 (BST)",            offset: 6,   flag: "🇧🇩" },
  "Asia/Bangkok":         { label: "曼谷 (ICT)",            offset: 7,   flag: "🇹🇭" },
  "Asia/Singapore":       { label: "新加坡 (SGT)",          offset: 8,   flag: "🇸🇬" },
  "Asia/Shanghai":        { label: "上海/北京 (CST)",       offset: 8,   flag: "🇨🇳" },
  "Asia/Tokyo":           { label: "东京 (JST)",            offset: 9,   flag: "🇯🇵" },
  "Asia/Seoul":           { label: "首尔 (KST)",            offset: 9,   flag: "🇰🇷" },
  "Australia/Sydney":     { label: "悉尼 (AEST/AEDT)",     offset: 10,  flag: "🇦🇺" },
  "Australia/Melbourne":  { label: "墨尔本 (AEST/AEDT)",   offset: 10,  flag: "🇦🇺" },
  "Pacific/Auckland":     { label: "奥克兰 (NZST/NZDT)",   offset: 12,  flag: "🇳🇿" },
};

// ─── 工厂时区（固定为北京时间 UTC+8）─────────────────────────────────────────
const FACTORY_TIMEZONE = { label: "北京时间 (CST)", offset: 8, flag: "🇨🇳" };

// ─── 自动检测用户时区 ──────────────────────────────────────────────────────────
function detectUserTimezone(): string {
  try {
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (TIMEZONE_DB[detected]) return detected;
    // 回退：按 offset 匹配
    const offset = -new Date().getTimezoneOffset() / 60;
    const match = Object.entries(TIMEZONE_DB).find(([, v]) => v.offset === offset);
    return match ? match[0] : "America/New_York";
  } catch {
    return "America/New_York";
  }
}

// ─── 时间转换 ──────────────────────────────────────────────────────────────────
function convertTime(
  timeStr: string,        // "HH:MM"
  fromOffset: number,     // UTC+X
  toOffset: number,       // UTC+X
): { time: string; dayDiff: number } {
  const [h, m] = timeStr.split(":").map(Number);
  const totalMins = h * 60 + m;
  const diffMins = (toOffset - fromOffset) * 60;
  let newMins = totalMins + diffMins;
  let dayDiff = 0;
  if (newMins < 0) { newMins += 1440; dayDiff = -1; }
  if (newMins >= 1440) { newMins -= 1440; dayDiff = 1; }
  const newH = Math.floor(newMins / 60);
  const newM = newMins % 60;
  return {
    time: `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`,
    dayDiff,
  };
}

function isBusinessHour(timeStr: string): boolean {
  const [h] = timeStr.split(":").map(Number);
  return h >= 9 && h < 18;
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface TimezoneSyncProps {
  selectedTime: string | null;   // 北京时间 "HH:MM"
  selectedDate: string | null;   // "YYYY-MM-DD"
  userTimezone?: string;         // 可选，默认自动检测
  onTimezoneChange?: (tz: string) => void;
  compact?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function TimezoneSync({
  selectedTime,
  selectedDate,
  userTimezone,
  onTimezoneChange,
  compact = false,
}: TimezoneSyncProps) {
  const detectedTz = useMemo(() => detectUserTimezone(), []);
  const activeTz = userTimezone || detectedTz;
  const tzInfo = TIMEZONE_DB[activeTz] || TIMEZONE_DB["America/New_York"];

  // 将北京时间转换为用户本地时间
  const localTime = useMemo(() => {
    if (!selectedTime) return null;
    return convertTime(selectedTime, FACTORY_TIMEZONE.offset, tzInfo.offset);
  }, [selectedTime, tzInfo.offset]);

  // 判断是否是工作时间
  const factoryBusinessHour = selectedTime ? isBusinessHour(selectedTime) : null;
  const buyerBusinessHour = localTime ? isBusinessHour(localTime.time) : null;

  const dayDiffLabel = localTime?.dayDiff === 1 ? "（次日）" : localTime?.dayDiff === -1 ? "（前一天）" : "";

  if (compact && !selectedTime) return null;

  return (
    <div style={{
      background: "rgba(14,165,233,0.06)",
      border: "1px solid rgba(14,165,233,0.2)",
      borderRadius: 14, padding: compact ? "12px 14px" : "16px 18px",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <Globe size={14} color="#38bdf8" />
        <span style={{ color: "#38bdf8", fontWeight: 700, fontSize: 13 }}>智能时区同步</span>
        <span style={{
          marginLeft: "auto",
          background: "rgba(14,165,233,0.12)",
          border: "1px solid rgba(14,165,233,0.3)",
          borderRadius: 6, padding: "1px 8px",
          color: "#7dd3fc", fontSize: 10, fontWeight: 700,
        }}>自动检测</span>
      </div>

      {/* Timezone selector */}
      {!compact && (
        <div style={{ marginBottom: 12 }}>
          <label style={{ color: "#64748b", fontSize: 11, fontWeight: 600, display: "block", marginBottom: 6 }}>
            您的时区
          </label>
          <select
            value={activeTz}
            onChange={e => onTimezoneChange?.(e.target.value)}
            style={{
              width: "100%",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 8, padding: "8px 12px",
              color: "#e2e8f0", fontSize: 13,
              cursor: "pointer", outline: "none",
            }}
          >
            {Object.entries(TIMEZONE_DB).map(([tz, info]) => (
              <option key={tz} value={tz} style={{ background: "#0f172a" }}>
                {info.flag} {info.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Time comparison */}
      {selectedTime ? (
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 10, padding: "10px 14px",
        }}>
          {/* Factory time */}
          <div style={{ flex: 1 }}>
            <div style={{ color: "#64748b", fontSize: 10, fontWeight: 700, marginBottom: 4 }}>
              {FACTORY_TIMEZONE.flag} 工厂时间（北京）
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Clock size={14} color="#94a3b8" />
              <span style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 16 }}>{selectedTime}</span>
              {factoryBusinessHour !== null && (
                <span style={{
                  background: factoryBusinessHour ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.1)",
                  border: `1px solid ${factoryBusinessHour ? "rgba(16,185,129,0.4)" : "rgba(239,68,68,0.3)"}`,
                  borderRadius: 5, padding: "1px 6px",
                  color: factoryBusinessHour ? "#34d399" : "#f87171",
                  fontSize: 9, fontWeight: 700,
                }}>
                  {factoryBusinessHour ? "工作时间" : "非工作时间"}
                </span>
              )}
            </div>
            {selectedDate && (
              <div style={{ color: "#475569", fontSize: 10, marginTop: 2 }}>{selectedDate}</div>
            )}
          </div>

          {/* Arrow */}
          <div style={{ color: "#334155" }}>
            <ArrowRight size={16} />
          </div>

          {/* Buyer time */}
          <div style={{ flex: 1 }}>
            <div style={{ color: "#64748b", fontSize: 10, fontWeight: 700, marginBottom: 4 }}>
              {tzInfo.flag} 您的本地时间
            </div>
            {localTime ? (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Clock size={14} color="#38bdf8" />
                <span style={{ color: "#38bdf8", fontWeight: 700, fontSize: 16 }}>
                  {localTime.time}
                </span>
                <span style={{ color: "#475569", fontSize: 10 }}>{dayDiffLabel}</span>
                {buyerBusinessHour !== null && (
                  <span style={{
                    background: buyerBusinessHour ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.1)",
                    border: `1px solid ${buyerBusinessHour ? "rgba(16,185,129,0.4)" : "rgba(245,158,11,0.3)"}`,
                    borderRadius: 5, padding: "1px 6px",
                    color: buyerBusinessHour ? "#34d399" : "#fbbf24",
                    fontSize: 9, fontWeight: 700,
                  }}>
                    {buyerBusinessHour ? "工作时间" : "非工作时间"}
                  </span>
                )}
              </div>
            ) : (
              <span style={{ color: "#475569", fontSize: 13 }}>—</span>
            )}
            <div style={{ color: "#334155", fontSize: 10, marginTop: 2 }}>{tzInfo.label}</div>
          </div>
        </div>
      ) : (
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.05)",
          borderRadius: 10, padding: "10px 14px",
        }}>
          <Clock size={14} color="#334155" />
          <span style={{ color: "#334155", fontSize: 12 }}>请先选择会议时间以查看时区对照</span>
        </div>
      )}

      {/* Warning: both non-business hours */}
      {localTime && factoryBusinessHour === false && buyerBusinessHour === false && (
        <div style={{
          marginTop: 10, display: "flex", alignItems: "flex-start", gap: 7,
          background: "rgba(239,68,68,0.06)",
          border: "1px solid rgba(239,68,68,0.2)",
          borderRadius: 8, padding: "8px 12px",
        }}>
          <AlertCircle size={13} color="#f87171" style={{ flexShrink: 0, marginTop: 1 }} />
          <span style={{ color: "#f87171", fontSize: 11, lineHeight: 1.5 }}>
            所选时间对双方均为非工作时间，建议调整为工厂工作时间（北京时间 9:00-18:00）
          </span>
        </div>
      )}

      {/* Tip: optimal time */}
      {localTime && factoryBusinessHour && buyerBusinessHour && (
        <div style={{
          marginTop: 10, display: "flex", alignItems: "center", gap: 7,
          background: "rgba(16,185,129,0.06)",
          border: "1px solid rgba(16,185,129,0.2)",
          borderRadius: 8, padding: "8px 12px",
        }}>
          <CheckCircle2 size={13} color="#34d399" />
          <span style={{ color: "#34d399", fontSize: 11 }}>
            最佳时段！双方均在工作时间内，沟通效率最高
          </span>
        </div>
      )}
    </div>
  );
}
