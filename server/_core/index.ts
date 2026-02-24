import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { execSync } from "child_process";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import uploadRouter from "./uploadRouter";
import { initSocketService } from "./socketService";
import { registerAgoraWebhookRoute } from "./agoraWebhook";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { initBrowserWorker, shutdownBrowserWorker } from "./browserWorker";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

// ─────────────────────────────────────────────────────────────────────────────
// 端口管理：强制锁定，防止漂移
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 强制释放指定端口：kill 所有占用该端口的旧进程。
 * 这是防止 tsx watch 热重载时端口漂移的第一道防线。
 */
function forceReleasePort(port: number): void {
  try {
    execSync(`fuser -k ${port}/tcp 2>/dev/null || true`, { stdio: "ignore" });
    // 等待 OS 完全释放端口（TIME_WAIT 状态清除）
    execSync("sleep 0.8", { stdio: "ignore" });
  } catch {
    // fuser 在端口未被占用时返回非零退出码，属于正常情况，忽略即可
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 优雅退出：确保进程退出时端口被彻底释放
// ─────────────────────────────────────────────────────────────────────────────

function setupGracefulShutdown(server: ReturnType<typeof createServer>, port: number): void {
  let isShuttingDown = false;

  const shutdown = (signal: string) => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    console.log(`\n[Server] Received ${signal}. Gracefully shutting down on port ${port}...`);

    // 停止接受新连接
    server.close((err) => {
      if (err) {
        console.error("[Server] Error during shutdown:", err);
        process.exit(1);
      }
      console.log(`[Server] Port ${port} released. Goodbye.`);
      process.exit(0);
    });

    // 强制退出超时保障（5 秒后强制 kill，防止连接挂起导致端口无法释放）
    setTimeout(() => {
      console.error("[Server] Forced shutdown after timeout.");
      process.exit(1);
    }, 5000).unref(); // unref() 确保此 timer 不会阻止正常退出
  };

  // 监听所有可能导致进程退出的信号
  process.on("SIGTERM", () => shutdown("SIGTERM")); // Docker / PM2 停止
  process.on("SIGINT",  () => shutdown("SIGINT"));  // Ctrl+C
  process.on("SIGHUP",  () => shutdown("SIGHUP"));  // tsx watch 热重载触发的重启信号

  // 捕获未处理的异常，防止进程崩溃后端口残留
  process.on("uncaughtException", (err) => {
    console.error("[Server] Uncaught exception:", err);
    shutdown("uncaughtException");
  });

  process.on("unhandledRejection", (reason) => {
    console.error("[Server] Unhandled rejection:", reason);
    // 不强制退出，仅记录日志，避免因单个 Promise 错误导致服务崩溃
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 主服务启动
// ─────────────────────────────────────────────────────────────────────────────

async function startServer() {
  const app = express();
  const server = createServer(app);

  // ── Security Middleware ─────────────────────────────────────────────────────
  // Helmet: sets secure HTTP headers (XSS, MIME sniffing, clickjacking, etc.)
  app.use(helmet({
    contentSecurityPolicy: false, // Disabled to allow Vite HMR in dev
    crossOriginEmbedderPolicy: false, // Disabled for Agora SDK compatibility
  }));

  // Global rate limiter: max 300 requests per minute per IP
  const globalLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' },
  });
  app.use('/api', globalLimiter);

  // Strict rate limiter for Agora token endpoints: max 30 per minute per IP
  // Prevents credential abuse and billing attacks on Agora account
  const agoraLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Agora token rate limit exceeded.' },
  });
  app.use('/api/trpc/agora', agoraLimiter);

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);

  // File Upload REST API
  app.use('/api/upload', uploadRouter);

  // Agora Cloud Recording Webhook
  // 声网录制完成后回调，提取真实 S3 URL 写入数据库
  const { updateMeeting } = await import("../db");
  registerAgoraWebhookRoute(app, updateMeeting);

  // ── Dev-only: instant login endpoint (bypasses DB) ──────────────────────────
  if (process.env.NODE_ENV === "development") {
    const { SignJWT } = await import("jose");
    const { COOKIE_NAME } = await import("../../shared/const");
    const { ENV } = await import("./env");
    const { getSessionCookieOptions } = await import("./sdk") as any;
    app.get("/api/dev-login", async (req, res) => {
      try {
        const secretKey = new TextEncoder().encode(ENV.cookieSecret || "dev-secret");
        const token = await new SignJWT({
          openId: "dev-user-001",
          appId: ENV.appId || "dev-app",
          name: "Alice Wang (Dev)",
        })
          .setProtectedHeader({ alg: "HS256", typ: "JWT" })
          .setExpirationTime("365d")
          .sign(secretKey);
        const cookieOpts = {
          httpOnly: true,
          secure: false,
          sameSite: "lax" as const,
          path: "/",
          maxAge: 365 * 24 * 60 * 60 * 1000,
        };
        res.cookie(COOKIE_NAME, token, cookieOpts);
        const redirect = (req.query.returnTo as string) || "/";
        res.redirect(redirect);
      } catch (e) {
        res.status(500).send("Dev login failed: " + String(e));
      }
    });
  }

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // Development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ── 端口锁定：强制使用固定端口，绝不漂移 ──────────────────────────────────
  const port = parseInt(process.env.PORT || "3000");

  // 第一道防线：启动前强制释放目标端口
  forceReleasePort(port);

  // 第二道防线：注册优雅退出处理，确保进程退出时端口被彻底释放
  setupGracefulShutdown(server, port);

  // 初始化 WebSocket 服务（工厂在线心跳）
  initSocketService(server);

  // 初始化 Browser Worker（云端 AI 浏览器自动化）
  initBrowserWorker();

  // 初始化 BullMQ Queue Workers（工厂匹配 + Embedding 生成 + 需求 AI 解析）
  // Redis 不可用时降级为同步模式，不影响主服务启动
  let queueWorkers: {
    factoryMatchingWorker: any;
    factoryEmbeddingWorker: any;
    demandProcessingWorker: any;
  } | null = null;
  try {
    queueWorkers = await import('./queueWorker');
    console.log('[Queue] BullMQ workers initialized (matching + embedding + demand-processing)');
  } catch (err) {
    console.warn('[Queue] Redis not available, queue workers disabled. Matching will run synchronously.');
  }

  // ── Fix 4: Webinar 提醒定时任务（每 5 分钟）───────────────────────────────────────
  // 检查未来 25-35 分钟内即将开始的预约，发送 Agora 入场链接提醒
  const WEBINAR_REMINDER_INTERVAL_MS = 5 * 60 * 1000; // 5 分钟
  const webinarReminderTimer = setInterval(async () => {
    try {
      const { sendMeetingReminders } = await import('./webinarBookingService');
      const result = await sendMeetingReminders();
      if (result.sent > 0) {
        console.log(`[Scheduler] Webinar reminders sent: ${result.sent}`);
      }
    } catch (err) {
      console.error('[Scheduler] Webinar reminder task failed:', err);
    }
  }, WEBINAR_REMINDER_INTERVAL_MS);
  webinarReminderTimer.unref(); // 不阻止进程退出
  console.log('[Scheduler] Webinar reminder task registered (every 5 min)');

  // ── Fix 5: AMR 批量刷新定时任务（每日凌晨2点）─────────────────────────────
  // 重新计算所有工厂的 AMR 分数，确保匹配权重始终反映真实行为数据
  function scheduleDailyAMR() {
    const now = new Date();
    // 计算到今日凌晨2:00（或明日凌晨2:00）的毫秒数
    const next2AM = new Date(now);
    next2AM.setHours(2, 0, 0, 0);
    if (next2AM <= now) {
      next2AM.setDate(next2AM.getDate() + 1); // 已过凌晨2点，安排到明天
    }
    const msUntilNext2AM = next2AM.getTime() - now.getTime();
    console.log(`[Scheduler] AMR batch refresh scheduled at ${next2AM.toISOString()} (in ${Math.round(msUntilNext2AM / 60000)} min)`);

    setTimeout(async () => {
      try {
        const { batchCalculateAMR } = await import('./amrService');
        const result = await batchCalculateAMR();
        console.log(`[Scheduler] AMR batch complete: ${result.processed} processed, ${result.errors} errors`);
      } catch (err) {
        console.error('[Scheduler] AMR batch refresh failed:', err);
      } finally {
        scheduleDailyAMR(); // 完成后安排下一次
      }
    }, msUntilNext2AM).unref();
  }
  scheduleDailyAMR();
  console.log('[Scheduler] Daily AMR batch refresh registered (02:00 CST)');

  // 优雅关闭时同时关闭浏览器、队列和定时器
  process.on('exit', () => {
    shutdownBrowserWorker().catch(() => {});
    clearInterval(webinarReminderTimer);
    queueWorkers?.factoryMatchingWorker?.close().catch(() => {});
    queueWorkers?.factoryEmbeddingWorker?.close().catch(() => {});
    queueWorkers?.demandProcessingWorker?.close().catch(() => {});
  });

  server.listen(port, () => {
    console.log(`[Server] Running on http://localhost:${port}/`);
    if (process.env.NODE_ENV === "development") {
      console.log(`[Server] Dev login: http://localhost:${port}/api/dev-login`);
    }
  });

  // 第三道防线：监听 EADDRINUSE 错误，提供明确的错误信息而非静默漂移
  server.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      console.error(
        `[Server] FATAL: Port ${port} is already in use.\n` +
        `  Run "pnpm kill:dev" to release the port, then restart.\n` +
        `  Or set a different port: PORT=3001 pnpm dev`
      );
      process.exit(1); // 明确失败，而非静默漂移到其他端口
    } else {
      console.error("[Server] Unexpected error:", err);
      process.exit(1);
    }
  });
}

startServer().catch((err) => {
  console.error("[Server] Failed to start:", err);
  process.exit(1);
});
