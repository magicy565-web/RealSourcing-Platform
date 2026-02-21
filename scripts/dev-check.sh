#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# RealSourcing 开发环境健康检查与自动修复脚本
# 用法：bash scripts/dev-check.sh [--fix]
#
# 检查项目：
#   1. 端口 3000 是否被多个进程占用（僵尸进程检测）
#   2. tsx/node 进程数量是否异常
#   3. 端口是否固定在 3000（未发生漂移）
#
# --fix 参数：自动修复所有发现的问题
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

TARGET_PORT="${PORT:-3000}"
FIX_MODE=false
ISSUES=0

if [[ "${1:-}" == "--fix" ]]; then
  FIX_MODE=true
fi

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  RealSourcing 开发环境健康检查${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# ── 检查 1：端口漂移检测 ──────────────────────────────────────────────────────
echo -e "${BLUE}[1/3] 检查端口占用情况...${NC}"

OCCUPIED_PORTS=$(netstat -tlnp 2>/dev/null | grep node | grep -oP ':::\K\d+' | sort -n || true)
PORT_COUNT=$(echo "$OCCUPIED_PORTS" | grep -c '.' || echo 0)

if [[ $PORT_COUNT -eq 0 ]]; then
  echo -e "  ${YELLOW}⚠ 没有运行中的开发服务器${NC}"
elif [[ $PORT_COUNT -eq 1 ]]; then
  ACTUAL_PORT=$(echo "$OCCUPIED_PORTS" | head -1)
  if [[ "$ACTUAL_PORT" == "$TARGET_PORT" ]]; then
    echo -e "  ${GREEN}✓ 服务器正常运行在端口 $TARGET_PORT${NC}"
  else
    echo -e "  ${RED}✗ 端口漂移！服务器运行在 $ACTUAL_PORT，应为 $TARGET_PORT${NC}"
    ISSUES=$((ISSUES + 1))
  fi
else
  echo -e "  ${RED}✗ 检测到端口漂移！以下端口被 node 进程占用：${NC}"
  echo "$OCCUPIED_PORTS" | while read -r p; do
    echo -e "    - 端口 $p"
  done
  ISSUES=$((ISSUES + 1))
fi

# ── 检查 2：僵尸进程检测 ──────────────────────────────────────────────────────
echo ""
echo -e "${BLUE}[2/3] 检查 node/tsx 进程数量...${NC}"

# tsx watch 正常启动时会产生 3 个进程：sh + tsx CLI + node 实际进程
# 因此用「tsx watch 实例数」来判断，而非总进程数
# 每个 tsx watch 实例 = 1 个 "tsx watch server/_core/index.ts" 命令
TSX_INSTANCE_COUNT=$(pgrep -f "tsx watch server/_core/index" 2>/dev/null | wc -l | tr -d ' ')
TSX_INSTANCE_COUNT=${TSX_INSTANCE_COUNT:-0}

if [[ "$TSX_INSTANCE_COUNT" -le 1 ]]; then
  echo -e "  ${GREEN}✓ 进程数量正常（$TSX_INSTANCE_COUNT 个服务实例运行中）${NC}"
else
  echo -e "  ${RED}✗ 检测到 $TSX_INSTANCE_COUNT 个服务实例（应为 1 个），存在僵尸进程！${NC}"
  pgrep -af "tsx watch server/_core/index" 2>/dev/null | while read -r line; do
    echo -e "    - $line"
  done
  ISSUES=$((ISSUES + 1))
fi

# ── 检查 3：端口范围扫描（3000-3009）──────────────────────────────────────────
echo ""
echo -e "${BLUE}[3/3] 扫描 3000-3009 端口范围...${NC}"

EXTRA_PORTS=""
for p in $(seq 3001 3009); do
  if netstat -tlnp 2>/dev/null | grep -q ":$p "; then
    EXTRA_PORTS="$EXTRA_PORTS $p"
  fi
done

if [[ -z "$EXTRA_PORTS" ]]; then
  echo -e "  ${GREEN}✓ 3001-3009 端口均未被占用，无漂移风险${NC}"
else
  echo -e "  ${RED}✗ 以下端口被意外占用（可能是漂移残留）：$EXTRA_PORTS${NC}"
  ISSUES=$((ISSUES + 1))
fi

# ── 汇总报告 ──────────────────────────────────────────────────────────────────
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [[ $ISSUES -eq 0 ]]; then
  echo -e "${GREEN}✅ 开发环境健康，无问题发现${NC}"
else
  echo -e "${RED}❌ 发现 $ISSUES 个问题${NC}"

  if [[ "$FIX_MODE" == true ]]; then
    echo ""
    echo -e "${YELLOW}🔧 正在自动修复...${NC}"
    # Kill 所有开发进程
    pkill -f "tsx watch" 2>/dev/null || true
    pkill -f "server/_core/index" 2>/dev/null || true
    sleep 1
    # 释放 3000-3009 所有端口
    for p in $(seq 3000 3009); do
      fuser -k ${p}/tcp 2>/dev/null || true
    done
    sleep 1
    echo -e "${GREEN}✓ 修复完成。请运行 pnpm dev 重新启动服务器。${NC}"
  else
    echo ""
    echo -e "  运行 ${YELLOW}bash scripts/dev-check.sh --fix${NC} 自动修复"
    echo -e "  或运行 ${YELLOW}pnpm kill:dev${NC} 手动清理后重启"
  fi
fi

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
