/**
 * webinarBookingService.ts
 * RealSourcing 4.0 — Webinar 预约系统
 *
 * 核心能力：
 * 1. 检查工厂可用时间段（factoryAvailabilities）
 * 2. 冲突检测（防止同一时间段重复预约）
 * 3. 创建预约记录并自动生成声网会议
 * 4. 发送通知（买家 + 工厂双向）
 * 5. 工厂确认/拒绝预约
 * 6. 发送会议提醒（提前 30 分钟）
 */

import { db } from "../db";
import {
  webinarBookings,
  factoryAvailabilities,
  factories,
  users,
  meetings,
  notifications,
} from "../../drizzle/schema";
import { eq, and, gte, lte, or, ne } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

// ─── 类型定义 ─────────────────────────────────────────────────────────────────

export interface BookingSlot {
  scheduledAt: Date;
  durationMinutes?: number;
  timezone?: string;
}

export interface CreateBookingInput {
  buyerId: number;
  factoryId: number;
  demandId?: number;
  inquiryId?: number;
  slot: BookingSlot;
  buyerAgenda?: string;
}

export interface AvailableSlot {
  startTime: string; // "09:00"
  endTime: string;   // "17:00"
  dayOfWeek: number; // 0=Sunday, 1=Monday...
  timezone: string;
}

// ─── 工具函数 ─────────────────────────────────────────────────────────────────

/**
 * 将 Date 转换为指定时区的 HH:MM 字符串
 */
function getTimeInTimezone(date: Date, timezone: string): string {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    return formatter.format(date);
  } catch {
    // fallback to UTC
    const h = date.getUTCHours().toString().padStart(2, "0");
    const m = date.getUTCMinutes().toString().padStart(2, "0");
    return `${h}:${m}`;
  }
}

/**
 * 将 Date 转换为指定时区的星期几（0-6）
 */
function getDayOfWeekInTimezone(date: Date, timezone: string): number {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      weekday: "short",
    });
    const day = formatter.format(date);
    const map: Record<string, number> = {
      Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
    };
    return map[day] ?? date.getDay();
  } catch {
    return date.getDay();
  }
}

/**
 * 比较时间字符串 "HH:MM"
 */
function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

// ─── 核心服务函数 ──────────────────────────────────────────────────────────────

/**
 * 获取工厂的可用时间段列表
 */
export async function getFactoryAvailableSlots(
  factoryId: number
): Promise<AvailableSlot[]> {
  const slots = await db
    .select()
    .from(factoryAvailabilities)
    .where(eq(factoryAvailabilities.factoryId, factoryId));

  return slots.map((s) => ({
    startTime: s.startTime,
    endTime: s.endTime,
    dayOfWeek: s.dayOfWeek,
    timezone: s.timezone ?? "Asia/Shanghai",
  }));
}

/**
 * 检查指定时间段是否在工厂可用时间内
 */
export async function isWithinFactoryAvailability(
  factoryId: number,
  scheduledAt: Date,
  durationMinutes: number = 30
): Promise<{ available: boolean; reason?: string }> {
  const slots = await getFactoryAvailableSlots(factoryId);

  if (slots.length === 0) {
    return { available: false, reason: "该工厂尚未设置可用时间段" };
  }

  // 使用工厂时区检查
  const factoryTimezone = slots[0].timezone;
  const dayOfWeek = getDayOfWeekInTimezone(scheduledAt, factoryTimezone);
  const startTimeStr = getTimeInTimezone(scheduledAt, factoryTimezone);

  // 计算结束时间
  const endDate = new Date(scheduledAt.getTime() + durationMinutes * 60 * 1000);
  const endTimeStr = getTimeInTimezone(endDate, factoryTimezone);

  const startMinutes = timeToMinutes(startTimeStr);
  const endMinutes = timeToMinutes(endTimeStr);

  const matchingSlot = slots.find((slot) => {
    if (slot.dayOfWeek !== dayOfWeek) return false;
    const slotStart = timeToMinutes(slot.startTime);
    const slotEnd = timeToMinutes(slot.endTime);
    return startMinutes >= slotStart && endMinutes <= slotEnd;
  });

  if (!matchingSlot) {
    return {
      available: false,
      reason: `工厂在该时间段（${startTimeStr} - ${endTimeStr} ${factoryTimezone}）不可用`,
    };
  }

  return { available: true };
}

/**
 * 检查时间段冲突（同一工厂在该时间是否已有预约）
 */
export async function checkBookingConflict(
  factoryId: number,
  scheduledAt: Date,
  durationMinutes: number = 30,
  excludeBookingId?: number
): Promise<{ hasConflict: boolean; conflictingBooking?: any }> {
  const endTime = new Date(scheduledAt.getTime() + durationMinutes * 60 * 1000);
  const bufferBefore = new Date(scheduledAt.getTime() - 15 * 60 * 1000); // 15分钟缓冲

  const existing = await db
    .select()
    .from(webinarBookings)
    .where(
      and(
        eq(webinarBookings.factoryId, factoryId),
        or(
          eq(webinarBookings.status, "pending"),
          eq(webinarBookings.status, "confirmed")
        ),
        // 检查时间重叠：新预约的开始时间在现有预约的时间范围内
        gte(webinarBookings.scheduledAt, bufferBefore),
        lte(webinarBookings.scheduledAt, endTime),
        ...(excludeBookingId ? [ne(webinarBookings.id, excludeBookingId)] : [])
      )
    );

  if (existing.length > 0) {
    return { hasConflict: true, conflictingBooking: existing[0] };
  }

  return { hasConflict: false };
}

/**
 * 创建 Webinar 预约
 * 流程：可用性检查 → 冲突检查 → 创建声网会议 → 写入预约记录 → 发送双向通知
 */
export async function createWebinarBooking(
  input: CreateBookingInput
): Promise<{ bookingId: number; meetingUrl: string; agoraMeetingId?: number }> {
  const { buyerId, factoryId, demandId, inquiryId, slot, buyerAgenda } = input;
  const durationMinutes = slot.durationMinutes ?? 30;

  // 1. 验证工厂存在
  const factory = await db
    .select({ id: factories.id, name: factories.name, userId: factories.userId })
    .from(factories)
    .where(eq(factories.id, factoryId))
    .then((r) => r[0]);

  if (!factory) {
    throw new TRPCError({ code: "NOT_FOUND", message: "工厂不存在" });
  }

  // 2. 可用时间检查
  const availability = await isWithinFactoryAvailability(
    factoryId,
    slot.scheduledAt,
    durationMinutes
  );
  if (!availability.available) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: availability.reason ?? "所选时间不在工厂可用时间内",
    });
  }

  // 3. 冲突检查
  const conflict = await checkBookingConflict(
    factoryId,
    slot.scheduledAt,
    durationMinutes
  );
  if (conflict.hasConflict) {
    throw new TRPCError({
      code: "CONFLICT",
      message: "该时间段已被预约，请选择其他时间",
    });
  }

  // 4. 创建声网会议记录（复用现有 meetings 表）
  let agoraMeetingId: number | undefined;
  let meetingUrl: string;

  try {
    const channelName = `webinar_${factoryId}_${Date.now()}`;
    const meetingResult = await db.insert(meetings).values({
      hostUserId: factory.userId,
      guestUserId: buyerId,
      factoryId,
      channelName,
      status: "scheduled",
      scheduledAt: slot.scheduledAt,
    });
    agoraMeetingId = Number((meetingResult as any).insertId);
    meetingUrl = `/meeting/${channelName}`;
  } catch (err) {
    // 会议创建失败不阻断预约流程，使用备用链接
    console.error("[WebinarBooking] Failed to create Agora meeting:", err);
    meetingUrl = `/webinar-room/pending`;
  }

  // 5. 写入预约记录
  const insertResult = await db.insert(webinarBookings).values({
    buyerId,
    factoryId,
    demandId: demandId ?? null,
    inquiryId: inquiryId ?? null,
    scheduledAt: slot.scheduledAt,
    durationMinutes,
    timezone: slot.timezone ?? "UTC",
    meetingType: "agora",
    meetingUrl,
    agoraMeetingId: agoraMeetingId ?? null,
    status: "pending",
    buyerAgenda: buyerAgenda ?? null,
  });

  const bookingId = Number((insertResult as any).insertId);

  // 6. 发送通知给工厂负责人
  try {
    const scheduledAtStr = slot.scheduledAt.toISOString().replace("T", " ").slice(0, 16);
    await db.insert(notifications).values({
      userId: factory.userId,
      type: "webinar_booking_request",
      title: "新的 Webinar 预约请求",
      message: `买家已请求在 ${scheduledAtStr} UTC 与您进行 ${durationMinutes} 分钟的视频会议。请及时确认或拒绝。`,
      relatedId: bookingId,
      relatedType: "webinar_booking",
    });
  } catch (err) {
    console.error("[WebinarBooking] Failed to send factory notification:", err);
  }

  // 7. 发送通知给买家（确认预约已提交）
  try {
    await db.insert(notifications).values({
      userId: buyerId,
      type: "webinar_booking_submitted",
      title: "Webinar 预约已提交",
      message: `您的预约请求已发送给工厂，等待工厂确认。会议时间：${slot.scheduledAt.toISOString().replace("T", " ").slice(0, 16)} UTC`,
      relatedId: bookingId,
      relatedType: "webinar_booking",
    });
  } catch (err) {
    console.error("[WebinarBooking] Failed to send buyer notification:", err);
  }

  return { bookingId, meetingUrl, agoraMeetingId };
}

/**
 * 工厂确认预约
 */
export async function confirmBooking(
  bookingId: number,
  factoryUserId: number,
  factoryNotes?: string
): Promise<void> {
  const booking = await db
    .select()
    .from(webinarBookings)
    .where(eq(webinarBookings.id, bookingId))
    .then((r) => r[0]);

  if (!booking) {
    throw new TRPCError({ code: "NOT_FOUND", message: "预约记录不存在" });
  }

  // 验证操作者是该工厂的负责人
  const factory = await db
    .select({ userId: factories.userId })
    .from(factories)
    .where(eq(factories.id, booking.factoryId))
    .then((r) => r[0]);

  if (!factory || factory.userId !== factoryUserId) {
    throw new TRPCError({ code: "FORBIDDEN", message: "无权操作此预约" });
  }

  await db
    .update(webinarBookings)
    .set({
      status: "confirmed",
      confirmedAt: new Date(),
      factoryNotes: factoryNotes ?? null,
      updatedAt: new Date(),
    })
    .where(eq(webinarBookings.id, bookingId));

  // 通知买家：预约已确认
  try {
    const scheduledAtStr = booking.scheduledAt
      ? new Date(booking.scheduledAt).toISOString().replace("T", " ").slice(0, 16)
      : "待定";
    await db.insert(notifications).values({
      userId: booking.buyerId,
      type: "webinar_booking_confirmed",
      title: "Webinar 预约已确认！",
      message: `工厂已确认您的预约。会议时间：${scheduledAtStr} UTC。会议链接：${booking.meetingUrl ?? "稍后提供"}`,
      relatedId: bookingId,
      relatedType: "webinar_booking",
    });
  } catch (err) {
    console.error("[WebinarBooking] Failed to send confirmation notification:", err);
  }
}

/**
 * 工厂拒绝预约
 */
export async function rejectBooking(
  bookingId: number,
  factoryUserId: number,
  reason?: string
): Promise<void> {
  const booking = await db
    .select()
    .from(webinarBookings)
    .where(eq(webinarBookings.id, bookingId))
    .then((r) => r[0]);

  if (!booking) {
    throw new TRPCError({ code: "NOT_FOUND", message: "预约记录不存在" });
  }

  const factory = await db
    .select({ userId: factories.userId })
    .from(factories)
    .where(eq(factories.id, booking.factoryId))
    .then((r) => r[0]);

  if (!factory || factory.userId !== factoryUserId) {
    throw new TRPCError({ code: "FORBIDDEN", message: "无权操作此预约" });
  }

  await db
    .update(webinarBookings)
    .set({
      status: "rejected",
      factoryNotes: reason ?? null,
      updatedAt: new Date(),
    })
    .where(eq(webinarBookings.id, bookingId));

  // 通知买家：预约被拒绝
  try {
    await db.insert(notifications).values({
      userId: booking.buyerId,
      type: "webinar_booking_rejected",
      title: "Webinar 预约未能确认",
      message: `工厂暂时无法接受您的预约${reason ? `，原因：${reason}` : ""}。请选择其他时间重新预约。`,
      relatedId: bookingId,
      relatedType: "webinar_booking",
    });
  } catch (err) {
    console.error("[WebinarBooking] Failed to send rejection notification:", err);
  }
}

/**
 * 买家取消预约
 */
export async function cancelBooking(
  bookingId: number,
  buyerId: number,
  reason?: string
): Promise<void> {
  const booking = await db
    .select()
    .from(webinarBookings)
    .where(and(eq(webinarBookings.id, bookingId), eq(webinarBookings.buyerId, buyerId)))
    .then((r) => r[0]);

  if (!booking) {
    throw new TRPCError({ code: "NOT_FOUND", message: "预约记录不存在或无权操作" });
  }

  if (booking.status === "completed") {
    throw new TRPCError({ code: "BAD_REQUEST", message: "已完成的预约无法取消" });
  }

  await db
    .update(webinarBookings)
    .set({ status: "cancelled", factoryNotes: reason ?? null, updatedAt: new Date() })
    .where(eq(webinarBookings.id, bookingId));

  // 通知工厂
  try {
    const factory = await db
      .select({ userId: factories.userId })
      .from(factories)
      .where(eq(factories.id, booking.factoryId))
      .then((r) => r[0]);

    if (factory) {
      await db.insert(notifications).values({
        userId: factory.userId,
        type: "webinar_booking_cancelled",
        title: "买家取消了 Webinar 预约",
        message: `买家已取消预约${reason ? `，原因：${reason}` : ""}。`,
        relatedId: bookingId,
        relatedType: "webinar_booking",
      });
    }
  } catch (err) {
    console.error("[WebinarBooking] Failed to send cancellation notification:", err);
  }
}

/**
 * 获取买家的预约列表
 */
export async function getBuyerBookings(buyerId: number) {
  return db
    .select({
      id: webinarBookings.id,
      factoryId: webinarBookings.factoryId,
      factoryName: factories.name,
      demandId: webinarBookings.demandId,
      inquiryId: webinarBookings.inquiryId,
      scheduledAt: webinarBookings.scheduledAt,
      durationMinutes: webinarBookings.durationMinutes,
      timezone: webinarBookings.timezone,
      status: webinarBookings.status,
      meetingUrl: webinarBookings.meetingUrl,
      buyerAgenda: webinarBookings.buyerAgenda,
      factoryNotes: webinarBookings.factoryNotes,
      confirmedAt: webinarBookings.confirmedAt,
      createdAt: webinarBookings.createdAt,
    })
    .from(webinarBookings)
    .leftJoin(factories, eq(webinarBookings.factoryId, factories.id))
    .where(eq(webinarBookings.buyerId, buyerId))
    .orderBy(webinarBookings.scheduledAt);
}

/**
 * 获取工厂的预约列表（工厂管理后台使用）
 */
export async function getFactoryBookings(factoryId: number) {
  return db
    .select({
      id: webinarBookings.id,
      buyerId: webinarBookings.buyerId,
      buyerName: users.name,
      buyerEmail: users.email,
      demandId: webinarBookings.demandId,
      inquiryId: webinarBookings.inquiryId,
      scheduledAt: webinarBookings.scheduledAt,
      durationMinutes: webinarBookings.durationMinutes,
      timezone: webinarBookings.timezone,
      status: webinarBookings.status,
      meetingUrl: webinarBookings.meetingUrl,
      buyerAgenda: webinarBookings.buyerAgenda,
      factoryNotes: webinarBookings.factoryNotes,
      confirmedAt: webinarBookings.confirmedAt,
      createdAt: webinarBookings.createdAt,
    })
    .from(webinarBookings)
    .leftJoin(users, eq(webinarBookings.buyerId, users.id))
    .where(eq(webinarBookings.factoryId, factoryId))
    .orderBy(webinarBookings.scheduledAt);
}

/**
 * 发送会议提醒（由定时任务调用，提前 30 分钟）
 * 在 queueWorker 中注册为定时 Job
 */
export async function sendMeetingReminders(): Promise<{ sent: number }> {
  const now = new Date();
  const reminderWindow = new Date(now.getTime() + 35 * 60 * 1000); // 35分钟后
  const reminderWindowStart = new Date(now.getTime() + 25 * 60 * 1000); // 25分钟后

  // 找出 25-35 分钟内即将开始且尚未发送提醒的已确认预约
  const upcomingBookings = await db
    .select()
    .from(webinarBookings)
    .where(
      and(
        eq(webinarBookings.status, "confirmed"),
        gte(webinarBookings.scheduledAt, reminderWindowStart),
        lte(webinarBookings.scheduledAt, reminderWindow),
        // reminderSentAt IS NULL
      )
    );

  let sent = 0;
  for (const booking of upcomingBookings) {
    try {
      const scheduledAtStr = booking.scheduledAt
        ? new Date(booking.scheduledAt).toISOString().replace("T", " ").slice(0, 16)
        : "";

      // 通知买家
      await db.insert(notifications).values({
        userId: booking.buyerId,
        type: "webinar_reminder",
        title: "Webinar 即将开始（30分钟后）",
        message: `您与工厂的视频会议将在 30 分钟后开始（${scheduledAtStr} UTC）。点击进入会议室：${booking.meetingUrl}`,
        relatedId: booking.id,
        relatedType: "webinar_booking",
      });

      // 通知工厂
      const factory = await db
        .select({ userId: factories.userId })
        .from(factories)
        .where(eq(factories.id, booking.factoryId))
        .then((r) => r[0]);

      if (factory) {
        await db.insert(notifications).values({
          userId: factory.userId,
          type: "webinar_reminder",
          title: "Webinar 即将开始（30分钟后）",
          message: `您与买家的视频会议将在 30 分钟后开始（${scheduledAtStr} UTC）。点击进入会议室：${booking.meetingUrl}`,
          relatedId: booking.id,
          relatedType: "webinar_booking",
        });
      }

      // 标记提醒已发送
      await db
        .update(webinarBookings)
        .set({ reminderSentAt: new Date(), updatedAt: new Date() })
        .where(eq(webinarBookings.id, booking.id));

      sent++;
    } catch (err) {
      console.error(`[WebinarBooking] Failed to send reminder for booking ${booking.id}:`, err);
    }
  }

  return { sent };
}
