/**
 * Agora Cloud Recording Webhook Handler
 * 声网云端录制 Webhook 回调处理器
 *
 * 声网录制完成后会向配置的 Webhook URL 发送 POST 请求，
 * 本模块解析回调事件，提取真实 S3 文件 URL，并写入数据库。
 *
 * 配置方式：在声网控制台 -> 云端录制 -> Webhook 中填入：
 *   https://your-domain.com/api/webhooks/agora-recording
 *
 * 参考文档：https://docs.agora.io/en/cloud-recording/reference/rest-api/rest-api-overview
 */

import type { Request, Response, Express } from "express";
import crypto from "crypto";
import { ENV } from "./env";

// ── Agora Webhook Event Types ─────────────────────────────────────────────────
export interface AgoraWebhookPayload {
  noticeId: string;
  productId: number;
  eventType: number;
  notifyMs: number;
  payload: {
    cname: string;           // 频道名（即 meetingId 或 channelName）
    uid: string;
    sid: string;             // 录制 Session ID
    resourceId: string;
    sequence: number;
    sendts: number;
    serviceType: number;
    details: {
      msgName: string;       // 事件名称
      status: number;
      fileList?: AgoraFileInfo[];
      fileListMode?: string;
      uploadingStatus?: string;
    };
  };
}

export interface AgoraFileInfo {
  filename: string;          // S3 文件名（如 recording/channel_name/xxx.mp4）
  trackType: string;         // "audio" | "video" | "audio_and_video"
  uid: string;
  mixedAllUser: boolean;
  isPlayable: boolean;
  sliceStartTime: number;
}

// ── Event Type Constants ──────────────────────────────────────────────────────
const AGORA_EVENT_TYPES = {
  RECORDING_STARTED: 1,
  RECORDING_STOPPED: 2,
  UPLOAD_COMPLETED: 31,      // 所有文件上传完成
  UPLOAD_BACKUP: 32,         // 备份上传完成
  SCREENSHOT_GENERATED: 40,
  RECORDING_FAILED: 11,
  UPLOAD_FAILED: 12,
} as const;

// ── S3 URL Builder ────────────────────────────────────────────────────────────
function buildS3Url(filename: string): string {
  const bucket = process.env.S3_BUCKET_NAME || "realsourcing-recordings";
  const region = process.env.AWS_REGION || "ap-southeast-1";
  // Standard S3 URL format
  return `https://${bucket}.s3.${region}.amazonaws.com/${filename}`;
}

// ── Channel Name to Meeting ID Resolver ──────────────────────────────────────
// 频道名格式约定：meeting_{meetingId}_{timestamp}
// 例如：meeting_42_1700000000000
function extractMeetingIdFromChannel(cname: string): number | null {
  const match = cname.match(/^meeting_(\d+)_/);
  if (match) return parseInt(match[1], 10);

  // 也支持纯数字频道名（直接是 meetingId）
  const numericMatch = cname.match(/^(\d+)$/);
  if (numericMatch) return parseInt(numericMatch[1], 10);

  return null;
}

// ── Signature Verification ────────────────────────────────────────────────────
function verifyAgoraSignature(
  req: Request,
  secret: string
): boolean {
  if (!secret) {
    // 未配置 secret 时跳过验证（开发环境）
    console.warn("⚠️ AGORA_WEBHOOK_SECRET not configured, skipping signature verification");
    return true;
  }

  const signature = req.headers["agora-signature-v2"] as string;
  if (!signature) {
    console.warn("⚠️ Missing Agora-Signature-V2 header");
    return false;
  }

  const body = JSON.stringify(req.body);
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(body);
  const expectedSig = hmac.digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature, "hex"),
    Buffer.from(expectedSig, "hex")
  );
}

// ── Webhook Route Registration ────────────────────────────────────────────────
export function registerAgoraWebhookRoute(
  app: Express,
  updateMeetingFn: (id: number, data: any) => Promise<any>
): void {
  const webhookSecret = process.env.AGORA_WEBHOOK_SECRET || "";

  app.post("/api/webhooks/agora-recording", async (req: Request, res: Response) => {
    // 立即返回 200，防止声网重试
    res.status(200).json({ code: 0, message: "OK" });

    try {
      const payload = req.body as AgoraWebhookPayload;

      if (!payload || !payload.payload) {
        console.warn("⚠️ Invalid Agora webhook payload");
        return;
      }

      const { eventType, payload: eventPayload } = payload;
      const { cname, sid, resourceId, details } = eventPayload;

      console.log(`📡 Agora Webhook: eventType=${eventType}, cname=${cname}, sid=${sid}`);

      // 只处理上传完成事件
      if (eventType !== AGORA_EVENT_TYPES.UPLOAD_COMPLETED &&
          eventType !== AGORA_EVENT_TYPES.UPLOAD_BACKUP) {
        return;
      }

      // 验证签名（生产环境必须）
      if (!verifyAgoraSignature(req, webhookSecret)) {
        console.error("❌ Agora webhook signature verification failed");
        return;
      }

      // 提取 meetingId
      const meetingId = extractMeetingIdFromChannel(cname);
      if (!meetingId) {
        console.warn(`⚠️ Cannot extract meetingId from channel: ${cname}`);
        return;
      }

      // 提取文件列表，找到主录制文件（audio_and_video 或 video）
      const fileList = details.fileList || [];
      const mainFile = fileList.find(
        f => f.trackType === "audio_and_video" || f.trackType === "video"
      ) || fileList[0];

      if (!mainFile) {
        console.warn(`⚠️ No recording files found for meeting #${meetingId}`);
        return;
      }

      // 构建真实 S3 URL
      const recordingUrl = buildS3Url(mainFile.filename);

      // 写入数据库
      await updateMeetingFn(meetingId, {
        recordingUrl,
        status: "completed",
      });

      console.log(`✅ Meeting #${meetingId} recording URL updated: ${recordingUrl}`);
      console.log(`   Files: ${fileList.map(f => f.filename).join(", ")}`);

    } catch (error) {
      console.error("❌ Error processing Agora webhook:", error);
    }
  });

  // 健康检查端点（用于声网控制台验证 Webhook URL 可达性）
  app.get("/api/webhooks/agora-recording", (req: Request, res: Response) => {
    res.status(200).json({
      status: "ok",
      service: "RealSourcing Agora Recording Webhook",
      timestamp: new Date().toISOString(),
    });
  });

  console.log("✅ Agora Recording Webhook registered at /api/webhooks/agora-recording");
}
