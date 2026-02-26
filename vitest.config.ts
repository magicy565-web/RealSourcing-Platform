import { defineConfig } from "vitest/config";
import path from "path";
import { loadEnv } from "vite";

const templateRoot = path.resolve(import.meta.dirname);

export default defineConfig(({ mode }) => {
  // 加载 .env 文件，确保测试环境能读取 DATABASE_URL、JWT_SECRET 等变量
  const env = loadEnv(mode ?? "test", templateRoot, "");
  return {
    root: templateRoot,
    resolve: {
      alias: {
        "@": path.resolve(templateRoot, "client", "src"),
        "@shared": path.resolve(templateRoot, "shared"),
        "@assets": path.resolve(templateRoot, "attached_assets"),
      },
    },
    test: {
      environment: "node",
      include: ["server/**/*.test.ts", "server/**/*.spec.ts"],
      env,
    },
  };
});
