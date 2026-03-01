/**
 * EmptyState — 统一空状态组件
 *
 * 提供多种预设空状态，覆盖工厂列表、询盘、会议、通知等场景
 * 支持自定义图标、标题、描述和 CTA 按钮
 */

import React from "react";
import { motion } from "framer-motion";
import {
  Search, Inbox, Calendar, Bell, Package,
  MessageSquare, Star, FileText, Sparkles,
} from "lucide-react";

// ─── 预设类型 ─────────────────────────────────────────────────────────────────
export type EmptyStatePreset =
  | "search"       // 搜索无结果
  | "inquiries"    // 无询盘
  | "meetings"     // 无会议
  | "notifications"// 无通知
  | "factories"    // 无工厂
  | "messages"     // 无消息
  | "favorites"    // 无收藏
  | "rfq"          // 无 RFQ
  | "custom";      // 自定义

const PRESET_CONFIG: Record<EmptyStatePreset, {
  icon: React.ReactNode;
  title: string;
  desc: string;
  color: string;
}> = {
  search: {
    icon: <Search size={32} />,
    title: "没有找到相关结果",
    desc: "尝试调整搜索关键词或清除筛选条件",
    color: "#64748b",
  },
  inquiries: {
    icon: <Inbox size={32} />,
    title: "暂无询盘记录",
    desc: "在 AI 助手中找到心仪工厂后，点击「握手 · 发送询盘」即可开始合作",
    color: "#10b981",
  },
  meetings: {
    icon: <Calendar size={32} />,
    title: "暂无会议安排",
    desc: "与工厂确认合作意向后，通过「预约视频会议」与工厂实时沟通",
    color: "#7c3aed",
  },
  notifications: {
    icon: <Bell size={32} />,
    title: "暂无通知",
    desc: "工厂回复、报价更新等消息将在这里显示",
    color: "#f59e0b",
  },
  factories: {
    icon: <Package size={32} />,
    title: "没有找到匹配的工厂",
    desc: "尝试修改搜索条件，或使用 AI 助手描述您的采购需求",
    color: "#0ea5e9",
  },
  messages: {
    icon: <MessageSquare size={32} />,
    title: "暂无消息",
    desc: "与工厂建立联系后，消息记录将在这里显示",
    color: "#a78bfa",
  },
  favorites: {
    icon: <Star size={32} />,
    title: "暂无收藏",
    desc: "在工厂列表中点击收藏图标，将心仪工厂加入收藏夹",
    color: "#f59e0b",
  },
  rfq: {
    icon: <FileText size={32} />,
    title: "暂无 RFQ 记录",
    desc: "向工厂发送正式采购请求后，RFQ 记录将在这里显示",
    color: "#0ea5e9",
  },
  custom: {
    icon: <Sparkles size={32} />,
    title: "暂无内容",
    desc: "这里还没有任何内容",
    color: "#7c3aed",
  },
};

// ─── 主组件 ───────────────────────────────────────────────────────────────────
interface EmptyStateProps {
  preset?: EmptyStatePreset;
  icon?: React.ReactNode;
  title?: string;
  desc?: string;
  color?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  compact?: boolean; // 紧凑模式（用于侧边栏或小容器）
}

export function EmptyState({
  preset = "custom",
  icon,
  title,
  desc,
  color,
  action,
  compact = false,
}: EmptyStateProps) {
  const cfg = PRESET_CONFIG[preset];
  const finalIcon = icon ?? cfg.icon;
  const finalTitle = title ?? cfg.title;
  const finalDesc = desc ?? cfg.desc;
  const finalColor = color ?? cfg.color;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      style={{
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        textAlign: "center",
        padding: compact ? "24px 16px" : "48px 24px",
        gap: compact ? 10 : 14,
      }}
    >
      {/* 图标 */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        style={{
          width: compact ? 52 : 72,
          height: compact ? 52 : 72,
          borderRadius: "50%",
          background: `${finalColor}12`,
          border: `1px solid ${finalColor}25`,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: finalColor,
        }}
      >
        {React.cloneElement(finalIcon as React.ReactElement<{ size?: number }>, {
          size: compact ? 22 : 30,
        })}
      </motion.div>

      {/* 文字 */}
      <div>
        <div style={{
          color: "#e2e8f0",
          fontSize: compact ? 13 : 15,
          fontWeight: 700,
          marginBottom: 5,
        }}>
          {finalTitle}
        </div>
        <div style={{
          color: "#475569",
          fontSize: compact ? 11 : 13,
          lineHeight: 1.6,
          maxWidth: compact ? 220 : 320,
        }}>
          {finalDesc}
        </div>
      </div>

      {/* CTA */}
      {action && (
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={action.onClick}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            background: `${finalColor}18`,
            border: `1px solid ${finalColor}35`,
            borderRadius: 10,
            padding: compact ? "7px 14px" : "9px 18px",
            color: finalColor,
            fontSize: compact ? 12 : 13,
            fontWeight: 700,
            cursor: "pointer",
            marginTop: 4,
            transition: "background 0.2s",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = `${finalColor}28`)}
          onMouseLeave={e => (e.currentTarget.style.background = `${finalColor}18`)}
        >
          {action.icon}
          {action.label}
        </motion.button>
      )}
    </motion.div>
  );
}
