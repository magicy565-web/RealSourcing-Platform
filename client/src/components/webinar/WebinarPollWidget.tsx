/**
 * WebinarPollWidget — Webinar 实时投票组件
 *
 * 功能：
 *   - 主持人可创建投票（满意度/质量/信任度三种类型）
 *   - 观众实时投票，结果即时刷新
 *   - 投票结果自动贡献到工厂 FTGI 人工评分
 *
 * 使用位置：WebinarLiveRoom.tsx 的右侧面板
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BarChart2, Plus, ChevronRight, CheckCircle2,
  Loader2, Users, Trophy, X,
} from "lucide-react";

// ── 投票类型配置 ──────────────────────────────────────────────────────────────
const POLL_TYPE_CONFIG = {
  satisfaction: {
    label: "满意度投票",
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
    defaultOptions: ["非常满意", "满意", "一般", "不满意"],
    defaultQuestion: "您对本次工厂展示的满意度如何？",
  },
  quality: {
    label: "质量评估",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
    defaultOptions: ["超出预期", "符合预期", "基本符合", "不符合预期"],
    defaultQuestion: "工厂展示的产品质量是否符合您的采购标准？",
  },
  trust: {
    label: "信任度投票",
    color: "text-violet-400",
    bg: "bg-violet-500/10 border-violet-500/20",
    defaultOptions: ["非常信任", "比较信任", "需要更多了解", "暂不信任"],
    defaultQuestion: "您对这家工厂的整体信任度如何？",
  },
} as const;

type PollType = keyof typeof POLL_TYPE_CONFIG;

// ── 投票结果条 ────────────────────────────────────────────────────────────────
function PollResultBar({
  option,
  votes,
  percentage,
  isTop,
  index,
  totalOptions,
}: {
  option: string;
  votes: number;
  percentage: number;
  isTop: boolean;
  index: number;
  totalOptions: number;
}) {
  // 颜色从绿到红渐变（第一个选项最正面）
  const colors = [
    "bg-emerald-500",
    "bg-blue-500",
    "bg-amber-500",
    "bg-orange-500",
    "bg-red-500",
    "bg-red-700",
  ];
  const barColor = colors[Math.min(index, colors.length - 1)];

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          {isTop && <Trophy className="w-3 h-3 text-amber-400" />}
          <span className={cn("font-medium", isTop ? "text-white" : "text-slate-300")}>
            {option}
          </span>
        </div>
        <div className="flex items-center gap-2 text-slate-400">
          <span>{votes} 票</span>
          <span className="font-bold text-white">{percentage}%</span>
        </div>
      </div>
      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-700", barColor)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// ── 创建投票面板 ──────────────────────────────────────────────────────────────
function CreatePollPanel({
  webinarId,
  factoryId,
  onCreated,
  onCancel,
}: {
  webinarId: number;
  factoryId?: number;
  onCreated: () => void;
  onCancel: () => void;
}) {
  const [pollType, setPollType] = useState<PollType>("satisfaction");
  const [question, setQuestion] = useState(POLL_TYPE_CONFIG.satisfaction.defaultQuestion);
  const [options, setOptions] = useState<string[]>(POLL_TYPE_CONFIG.satisfaction.defaultOptions);

  const createPoll = trpc.humanScores.createPoll.useMutation({
    onSuccess: () => {
      toast.success("投票已创建并开始！");
      onCreated();
    },
    onError: (err) => toast.error(`创建失败：${err.message}`),
  });

  const handleTypeChange = (type: PollType) => {
    setPollType(type);
    setQuestion(POLL_TYPE_CONFIG[type].defaultQuestion);
    setOptions([...POLL_TYPE_CONFIG[type].defaultOptions]);
  };

  return (
    <div className="space-y-4 p-4 bg-[#141628] rounded-xl border border-white/5">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-white">创建投票</h4>
        <button onClick={onCancel} className="text-slate-500 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 投票类型 */}
      <div className="grid grid-cols-3 gap-2">
        {(Object.entries(POLL_TYPE_CONFIG) as [PollType, typeof POLL_TYPE_CONFIG[PollType]][]).map(([type, cfg]) => (
          <button
            key={type}
            onClick={() => handleTypeChange(type)}
            className={cn(
              "text-[11px] font-medium px-2 py-2 rounded-lg border transition-all",
              pollType === type
                ? `${cfg.bg} ${cfg.color} border-current`
                : "border-white/5 text-slate-500 hover:text-white hover:border-white/10"
            )}
          >
            {cfg.label}
          </button>
        ))}
      </div>

      {/* 问题 */}
      <div>
        <label className="text-xs text-slate-400 mb-1 block">投票问题</label>
        <textarea
          value={question}
          onChange={e => setQuestion(e.target.value)}
          rows={2}
          className="w-full bg-[#0a0b1a] border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500/50 resize-none"
        />
      </div>

      {/* 选项 */}
      <div>
        <label className="text-xs text-slate-400 mb-1 block">选项（第一个 = 最正面）</label>
        <div className="space-y-1.5">
          {options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-[10px] text-slate-600 w-4 shrink-0">{i + 1}</span>
              <input
                value={opt}
                onChange={e => {
                  const next = [...options];
                  next[i] = e.target.value;
                  setOptions(next);
                }}
                className="flex-1 bg-[#0a0b1a] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-violet-500/50"
              />
            </div>
          ))}
        </div>
      </div>

      <Button
        onClick={() => createPoll.mutate({ webinarId, factoryId, question, options, pollType })}
        disabled={!question.trim() || options.some(o => !o.trim()) || createPoll.isPending}
        className="w-full bg-violet-600 hover:bg-violet-500 text-white text-xs h-8"
      >
        {createPoll.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
        开始投票
      </Button>
    </div>
  );
}

// ── 主组件 ────────────────────────────────────────────────────────────────────
interface WebinarPollWidgetProps {
  webinarId: number;
  factoryId?: number;
  isHost?: boolean;
}

export default function WebinarPollWidget({
  webinarId,
  factoryId,
  isHost = false,
}: WebinarPollWidgetProps) {
  const { user } = useAuth();
  const [showCreate, setShowCreate] = useState(false);
  const [votedPolls, setVotedPolls] = useState<Set<number>>(new Set());

  const { data: polls, refetch: refetchPolls } = trpc.humanScores.getPolls.useQuery(
    { webinarId },
    { refetchInterval: 5000 }
  );

  const submitVote = trpc.humanScores.submitVote.useMutation({
    onSuccess: (_, vars) => {
      setVotedPolls(prev => new Set([...prev, vars.pollId]));
      toast.success("投票成功！");
      refetchPolls();
    },
    onError: (err) => toast.error(err.message),
  });

  const closePoll = trpc.humanScores.closePoll.useMutation({
    onSuccess: () => {
      toast.success("投票已关闭");
      refetchPolls();
    },
  });

  const activePolls = polls?.filter(p => p.status === "active") ?? [];
  const closedPolls = polls?.filter(p => p.status === "closed") ?? [];

  return (
    <div className="space-y-4">
      {/* 标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-violet-400" />
          <span className="text-sm font-semibold text-white">社区投票</span>
          <Badge variant="outline" className="text-[10px] text-violet-400 border-violet-500/30">
            FTGI 贡献 12%
          </Badge>
        </div>
        {isHost && !showCreate && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300"
          >
            <Plus className="w-3.5 h-3.5" />
            创建投票
          </button>
        )}
      </div>

      {/* 创建投票面板 */}
      {showCreate && (
        <CreatePollPanel
          webinarId={webinarId}
          factoryId={factoryId}
          onCreated={() => { setShowCreate(false); refetchPolls(); }}
          onCancel={() => setShowCreate(false)}
        />
      )}

      {/* 进行中的投票 */}
      {activePolls.length > 0 && (
        <div className="space-y-3">
          {activePolls.map(poll => {
            const hasVoted = votedPolls.has(poll.id);
            const options = poll.options as string[];

            return (
              <div key={poll.id} className="bg-[#141628] border border-violet-500/20 rounded-xl p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Badge className="text-[10px] bg-violet-600/20 text-violet-300 border-violet-500/30 mb-1.5">
                      进行中
                    </Badge>
                    <p className="text-sm font-medium text-white leading-snug">{poll.question}</p>
                  </div>
                  {isHost && (
                    <button
                      onClick={() => closePoll.mutate({ pollId: poll.id })}
                      className="text-[10px] text-slate-500 hover:text-red-400 shrink-0 mt-1"
                    >
                      关闭
                    </button>
                  )}
                </div>

                {!hasVoted ? (
                  <div className="space-y-2">
                    {options.map((opt, i) => (
                      <button
                        key={i}
                        onClick={() => submitVote.mutate({ pollId: poll.id, selectedOption: i })}
                        disabled={submitVote.isPending}
                        className={cn(
                          "w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-all",
                          "border-white/10 text-slate-300 hover:border-violet-500/40 hover:text-white",
                          "hover:bg-violet-500/5 disabled:opacity-50"
                        )}
                      >
                        <span className="text-slate-500 mr-2 text-xs">{i + 1}</span>
                        {opt}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>已投票，感谢您的参与！</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 已关闭的投票结果 */}
      {closedPolls.length > 0 && (
        <div className="space-y-3">
          <div className="text-xs text-slate-500 font-medium">往期投票结果</div>
          {closedPolls.slice(0, 3).map(poll => (
            <PollResultsCard key={poll.id} pollId={poll.id} question={poll.question} />
          ))}
        </div>
      )}

      {/* 空状态 */}
      {activePolls.length === 0 && closedPolls.length === 0 && (
        <div className="text-center py-8 text-slate-600 text-sm">
          {isHost ? "点击"创建投票"开始第一个投票" : "暂无进行中的投票"}
        </div>
      )}
    </div>
  );
}

// ── 投票结果卡片（已关闭） ────────────────────────────────────────────────────
function PollResultsCard({ pollId, question }: { pollId: number; question: string }) {
  const { data } = trpc.humanScores.getPollResults.useQuery({ pollId });

  if (!data) return null;

  const maxVotes = Math.max(...data.results.map(r => r.votes));

  return (
    <div className="bg-[#141628] border border-white/5 rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-slate-300 leading-snug">{question}</p>
        <div className="flex items-center gap-1 text-[10px] text-slate-500 shrink-0">
          <Users className="w-3 h-3" />
          <span>{data.totalVotes}</span>
        </div>
      </div>
      <div className="space-y-2">
        {data.results.map((result, i) => (
          <PollResultBar
            key={i}
            option={result.option}
            votes={result.votes}
            percentage={result.percentage}
            isTop={result.votes === maxVotes && result.votes > 0}
            index={i}
            totalOptions={data.results.length}
          />
        ))}
      </div>
    </div>
  );
}
