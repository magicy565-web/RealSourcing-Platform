#!/usr/bin/env bash
# ─── RealSourcing 4.0 - 一键开发环境启动脚本 ─────────────────────────────────
# 用途：自动检测并启动 Redis，然后启动开发服务器
# 使用：chmod +x scripts/start-dev.sh && ./scripts/start-dev.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$ROOT_DIR/.env"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   RealSourcing 4.0 - 开发环境启动脚本       ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════╝${NC}"
echo ""

# ── 1. 检查 .env 文件 ─────────────────────────────────────────────────────────
echo -e "${YELLOW}[1/4] 检查环境变量配置...${NC}"
if [ ! -f "$ENV_FILE" ]; then
  echo -e "${RED}❌ 未找到 .env 文件，请先创建 .env 文件${NC}"
  echo "   参考: cp .env.example .env"
  exit 1
fi

# 检查关键环境变量
source "$ENV_FILE" 2>/dev/null || true
if [ -z "$DATABASE_URL" ]; then
  echo -e "${RED}❌ DATABASE_URL 未配置${NC}"
  exit 1
fi
if [ -z "$OPENAI_API_KEY" ]; then
  echo -e "${YELLOW}⚠️  OPENAI_API_KEY 未配置，AI 功能将降级为后备方案${NC}"
fi
echo -e "${GREEN}✅ 环境变量检查通过${NC}"

# ── 2. 检查并启动 Redis ────────────────────────────────────────────────────────
echo ""
echo -e "${YELLOW}[2/4] 检查 Redis 服务...${NC}"

REDIS_RUNNING=false
if command -v redis-cli &>/dev/null; then
  if redis-cli ping &>/dev/null 2>&1; then
    REDIS_RUNNING=true
    echo -e "${GREEN}✅ Redis 已在运行${NC}"
  fi
fi

if [ "$REDIS_RUNNING" = false ]; then
  echo -e "${YELLOW}   Redis 未运行，尝试启动...${NC}"
  
  if command -v redis-server &>/dev/null; then
    # 本地安装了 Redis
    redis-server --daemonize yes --logfile /tmp/redis-realsourcing.log
    sleep 1
    if redis-cli ping &>/dev/null 2>&1; then
      echo -e "${GREEN}✅ Redis 已成功启动（本地）${NC}"
      REDIS_RUNNING=true
    else
      echo -e "${RED}❌ Redis 启动失败，请检查 /tmp/redis-realsourcing.log${NC}"
    fi
  elif command -v docker &>/dev/null; then
    # 使用 Docker 启动 Redis
    echo "   使用 Docker 启动 Redis..."
    docker run -d --name realsourcing-redis \
      -p 6379:6379 \
      --restart unless-stopped \
      redis:7-alpine redis-server --save "" --appendonly no \
      2>/dev/null || docker start realsourcing-redis 2>/dev/null || true
    sleep 2
    if redis-cli ping &>/dev/null 2>&1; then
      echo -e "${GREEN}✅ Redis 已成功启动（Docker）${NC}"
      REDIS_RUNNING=true
    else
      echo -e "${YELLOW}⚠️  Redis 启动失败，队列功能将不可用${NC}"
      echo "   请手动安装 Redis: sudo apt-get install redis-server"
    fi
  else
    echo -e "${YELLOW}⚠️  未找到 Redis 或 Docker，队列功能将不可用${NC}"
    echo "   安装 Redis: sudo apt-get install redis-server"
    echo "   或安装 Docker 后重试"
  fi
fi

# ── 3. 运行数据库 Migration ────────────────────────────────────────────────────
echo ""
echo -e "${YELLOW}[3/4] 检查数据库 Migration...${NC}"
cd "$ROOT_DIR"

# 检查是否有待执行的 migration
if [ -f "drizzle/migrations/0006_add_production_category.sql" ]; then
  echo "   发现新 migration: 0006_add_production_category.sql"
  echo "   正在执行..."
  
  # 从 DATABASE_URL 解析连接信息并执行 SQL
  # 格式: mysql://user:pass@host:port/dbname
  DB_URL="${DATABASE_URL:-}"
  if [ -n "$DB_URL" ]; then
    # 使用 Node.js 执行 migration（更可靠）
    node -e "
const mysql = require('mysql2/promise');
const fs = require('fs');
async function run() {
  const conn = await mysql.createConnection('$DB_URL');
  const sql = fs.readFileSync('drizzle/migrations/0006_add_production_category.sql', 'utf8');
  const statements = sql.split(';').filter(s => s.trim() && !s.trim().startsWith('--'));
  for (const stmt of statements) {
    if (stmt.trim()) {
      try {
        await conn.execute(stmt);
        console.log('  ✅ Executed:', stmt.trim().slice(0, 60) + '...');
      } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') {
          console.log('  ℹ️  Column already exists, skipping');
        } else {
          console.warn('  ⚠️ ', e.message);
        }
      }
    }
  }
  await conn.end();
}
run().catch(console.error);
" 2>/dev/null && echo -e "${GREEN}✅ Migration 执行完成${NC}" || echo -e "${YELLOW}⚠️  Migration 执行失败，请手动运行${NC}"
  fi
fi

# ── 4. 启动开发服务器 ─────────────────────────────────────────────────────────
echo ""
echo -e "${YELLOW}[4/4] 启动开发服务器...${NC}"
echo -e "${GREEN}   服务器地址: http://localhost:3001${NC}"
echo -e "${GREEN}   前端地址:   http://localhost:5173${NC}"
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
echo ""

exec pnpm dev
