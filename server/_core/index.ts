import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { execSync } from "child_process";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

/**
 * 强制释放指定端口：kill 所有占用该端口的进程（当前进程除外）。
 * 这确保 tsx watch 热重载时，旧进程不会导致端口漂移。
 */
function forceReleasePort(port: number): void {
  try {
    // fuser -k 会 kill 占用该端口的所有进程
    execSync(`fuser -k ${port}/tcp 2>/dev/null || true`, { stdio: "ignore" });
    // 等待端口完全释放
    execSync("sleep 0.5", { stdio: "ignore" });
  } catch {
    // 忽略错误（端口本来就没被占用时 fuser 会返回非零退出码）
  }
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);

  // ── Dev-only: instant login endpoint (bypasses DB) ──────────────────────────
  // This sets a valid JWT cookie so protected routes work without a live DB.
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
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = parseInt(process.env.PORT || "3000");

  // 强制释放端口，确保热重载时不会漂移到其他端口
  forceReleasePort(port);

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
