import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Calendar, Clock, CheckCircle, ChevronLeft, ChevronRight,
  Building2, Star, Globe, Award, Package, Loader2, Video
} from "lucide-react";

const TIME_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00",
];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function BookMeeting() {
  const params = useParams<{ factoryId: string }>();
  const factoryId = parseInt(params.factoryId || "0");
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [step, setStep] = useState<"select" | "confirm" | "success">("select");

  // ── tRPC Queries ──────────────────────────────────────────────────────────────
  const { data: factory, isLoading } = trpc.factories.byId.useQuery(
    { id: factoryId },
    { enabled: !!factoryId }
  );

  // ── tRPC Mutations ────────────────────────────────────────────────────────────
  const createMeeting = trpc.meetings.create.useMutation({
    onSuccess: () => setStep("success"),
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0F0F23] flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-xl mb-4">请先登录后再预约会议</p>
          <Button onClick={() => setLocation("/login")} className="bg-purple-600 hover:bg-purple-700">前往登录</Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0F0F23] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    );
  }

  if (!factory) {
    return (
      <div className="min-h-screen bg-[#0F0F23] flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-xl mb-4">工厂不存在</p>
          <Button onClick={() => setLocation("/factories")} variant="outline" className="border-white/20 text-gray-400">返回工厂列表</Button>
        </div>
      </div>
    );
  }

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  const monthNames = ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"];
  const dayNames = ["日", "一", "二", "三", "四", "五", "六"];

  const handlePrevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
  };
  const handleNextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
  };

  const isDateDisabled = (day: number) => {
    const date = new Date(currentYear, currentMonth, day);
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return date < todayStart || date.getDay() === 0 || date.getDay() === 6;
  };

  const formatSelectedDate = () => {
    if (!selectedDate) return "";
    const d = new Date(selectedDate);
    return d.toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric", weekday: "long" });
  };

  const handleConfirm = () => {
    if (!selectedDate || !selectedTime || !title) return;
    const scheduledAt = `${selectedDate}T${selectedTime}:00`;
    createMeeting.mutate({ title, factoryId, scheduledAt });
  };

  if (step === "success") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0F0F23] via-[#1A1A2E] to-[#16213E] flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">预约成功！</h2>
          <p className="text-gray-400 mb-2">您已成功预约与 <span className="text-purple-400 font-medium">{factory.name}</span> 的 1:1 选品会</p>
          <p className="text-gray-500 text-sm mb-8">
            {formatSelectedDate()} {selectedTime}
          </p>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 mb-8 text-left">
            <div className="flex items-center gap-3 mb-2">
              <Video className="w-4 h-4 text-purple-400" />
              <span className="text-white text-sm font-medium">会议将通过 RealSourcing 视频系统进行</span>
            </div>
            <p className="text-gray-400 text-xs">工厂确认后，您将收到会议链接。请提前5分钟进入等候室。</p>
          </div>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => setLocation("/dashboard")} className="bg-purple-600 hover:bg-purple-700">
              查看我的会议
            </Button>
            <Button variant="outline" onClick={() => setLocation(`/factory/${factoryId}`)} className="border-white/20 text-gray-400">
              返回工厂主页
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F0F23] via-[#1A1A2E] to-[#16213E]">
      {/* 顶部导航 */}
      <div className="border-b border-white/10 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <button onClick={() => setLocation(`/factory/${factoryId}`)} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
            <ChevronLeft className="w-4 h-4" />
            <span className="text-sm">返回工厂主页</span>
          </button>
          <div className="h-4 w-px bg-white/20" />
          <h1 className="text-white font-semibold">预约 1:1 选品会</h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-3 gap-8">

          {/* ── 左侧：工厂信息 ── */}
          <div className="col-span-1">
            <div className="p-6 rounded-xl bg-white/5 border border-white/10 sticky top-8">
              {/* 工厂头像 */}
              <div className="flex items-center gap-3 mb-4">
                {factory.logo ? (
                  <img src={factory.logo} alt="logo" className="w-14 h-14 rounded-xl object-cover" />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-xl font-bold">
                    {factory.name?.[0] || "F"}
                  </div>
                )}
                <div>
                  <h2 className="text-white font-semibold">{factory.name}</h2>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Globe className="w-3 h-3 text-gray-400" />
                    <span className="text-gray-400 text-xs">{factory.city}, {factory.country}</span>
                  </div>
                </div>
              </div>

              {/* 评分 */}
              {factory.overallScore && (
                <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span className="text-yellow-400 font-semibold">{factory.overallScore}</span>
                  <span className="text-gray-400 text-sm">综合评分</span>
                </div>
              )}

              {/* 工厂描述 */}
              {factory.description && (
                <p className="text-gray-400 text-sm leading-relaxed mb-4 line-clamp-4">{factory.description}</p>
              )}

              {/* 产品类别 */}
              {factory.category && (
                <div className="flex items-center gap-2 mb-3">
                  <Package className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-300 text-sm">{factory.category}</span>
                </div>
              )}

              {/* 信任指标 */}
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-gray-500 text-xs mb-3">信任认证</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-gray-300 text-sm">已实名认证</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-blue-400" />
                    <span className="text-gray-300 text-sm">ISO 9001 认证</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Video className="w-4 h-4 text-purple-400" />
                    <span className="text-gray-300 text-sm">视频验厂支持</span>
                  </div>
                </div>
              </div>

              {/* 会议说明 */}
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-gray-500 text-xs mb-2">关于 1:1 选品会</p>
                <ul className="space-y-1.5 text-gray-400 text-xs">
                  <li className="flex items-start gap-2"><span className="text-purple-400 mt-0.5">•</span>视频会议，无需出行</li>
                  <li className="flex items-start gap-2"><span className="text-purple-400 mt-0.5">•</span>工厂实时展示产品</li>
                  <li className="flex items-start gap-2"><span className="text-purple-400 mt-0.5">•</span>AI 自动生成会议摘要</li>
                  <li className="flex items-start gap-2"><span className="text-purple-400 mt-0.5">•</span>会后可直接发起询价</li>
                </ul>
              </div>
            </div>
          </div>

          {/* ── 右侧：预约表单 ── */}
          <div className="col-span-2">
            {step === "select" && (
              <div>
                <h2 className="text-xl font-bold text-white mb-6">选择会议时间</h2>

                {/* 日历 */}
                <div className="p-6 rounded-xl bg-white/5 border border-white/10 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <button onClick={handlePrevMonth} className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <h3 className="text-white font-semibold">{currentYear} 年 {monthNames[currentMonth]}</h3>
                    <button onClick={handleNextMonth} className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* 星期标题 */}
                  <div className="grid grid-cols-7 mb-2">
                    {dayNames.map(d => (
                      <div key={d} className="text-center text-gray-500 text-xs py-2">{d}</div>
                    ))}
                  </div>

                  {/* 日期格子 */}
                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: firstDay }).map((_, i) => (
                      <div key={`empty-${i}`} />
                    ))}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const day = i + 1;
                      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                      const disabled = isDateDisabled(day);
                      const selected = selectedDate === dateStr;
                      const isToday = dateStr === today.toISOString().split("T")[0];
                      return (
                        <button
                          key={day}
                          disabled={disabled}
                          onClick={() => { setSelectedDate(dateStr); setSelectedTime(null); }}
                          className={`
                            aspect-square flex items-center justify-center rounded-lg text-sm transition-all
                            ${disabled ? "text-gray-600 cursor-not-allowed" : "hover:bg-purple-500/20 hover:text-purple-300 cursor-pointer"}
                            ${selected ? "bg-purple-600 text-white font-semibold" : ""}
                            ${isToday && !selected ? "border border-purple-500/50 text-purple-400" : ""}
                            ${!disabled && !selected ? "text-gray-300" : ""}
                          `}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 时间段选择 */}
                {selectedDate && (
                  <div className="p-6 rounded-xl bg-white/5 border border-white/10 mb-6">
                    <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-purple-400" />
                      {formatSelectedDate()} — 选择时间
                    </h3>
                    <div className="grid grid-cols-5 gap-2">
                      {TIME_SLOTS.map(slot => (
                        <button
                          key={slot}
                          onClick={() => setSelectedTime(slot)}
                          className={`
                            py-2.5 px-3 rounded-lg text-sm font-medium transition-all
                            ${selectedTime === slot
                              ? "bg-purple-600 text-white"
                              : "bg-white/5 text-gray-300 hover:bg-purple-500/20 hover:text-purple-300 border border-white/10"
                            }
                          `}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                    <p className="text-gray-500 text-xs mt-3">时间为北京时间 (UTC+8)，工厂将在24小时内确认</p>
                  </div>
                )}

                {/* 下一步按钮 */}
                <Button
                  onClick={() => setStep("confirm")}
                  disabled={!selectedDate || !selectedTime}
                  className="w-full bg-purple-600 hover:bg-purple-700 py-3 text-base"
                >
                  下一步：填写会议信息
                </Button>
              </div>
            )}

            {step === "confirm" && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <button onClick={() => setStep("select")} className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <h2 className="text-xl font-bold text-white">确认预约信息</h2>
                </div>

                {/* 已选时间摘要 */}
                <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30 mb-6 flex items-center gap-4">
                  <Calendar className="w-8 h-8 text-purple-400 flex-shrink-0" />
                  <div>
                    <p className="text-white font-medium">{formatSelectedDate()}</p>
                    <p className="text-purple-300 text-sm">{selectedTime} (北京时间) · 约 60 分钟</p>
                  </div>
                </div>

                {/* 会议信息填写 */}
                <div className="p-6 rounded-xl bg-white/5 border border-white/10 mb-6">
                  <h3 className="text-white font-semibold mb-4">会议信息</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-gray-400 text-sm mb-1.5 block">会议主题 *</label>
                      <Input
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="e.g. 蓝牙耳机新品选品会议"
                        className="bg-white/5 border-white/20 text-white placeholder:text-gray-500"
                      />
                    </div>
                    <div>
                      <label className="text-gray-400 text-sm mb-1.5 block">备注（可选）</label>
                      <Textarea
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        placeholder="告诉工厂您感兴趣的产品类别、预算范围、采购需求等..."
                        className="bg-white/5 border-white/20 text-white placeholder:text-gray-500"
                        rows={4}
                      />
                    </div>
                  </div>
                </div>

                {/* 预约须知 */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 mb-6">
                  <h4 className="text-gray-300 text-sm font-medium mb-2">预约须知</h4>
                  <ul className="space-y-1.5 text-gray-500 text-xs">
                    <li>• 工厂将在24小时内确认您的预约请求</li>
                    <li>• 确认后您将收到视频会议链接</li>
                    <li>• 如需取消，请提前24小时通知</li>
                    <li>• 会议全程将由 AI 自动生成摘要和跟进建议</li>
                  </ul>
                </div>

                <Button
                  onClick={handleConfirm}
                  disabled={!title || createMeeting.isPending}
                  className="w-full bg-purple-600 hover:bg-purple-700 py-3 text-base"
                >
                  {createMeeting.isPending ? (
                    <><Loader2 className="w-4 h-4 animate-spin mr-2" />提交中...</>
                  ) : (
                    "确认预约"
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
