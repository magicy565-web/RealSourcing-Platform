# Commander H5 交互原型

RealSourcing 5.0 指挥官系统交互原型，基于 React + TailwindCSS 构建。

## 原型地址

> 在线预览：通过 Manus WebDev 部署，见项目管理面板

## 包含页面

### 手机端 (`CommanderPhone.tsx`)
5 个 Tab 的完整指挥台界面：

| Tab | 功能 |
|-----|------|
| 战报 | 今日询盘摘要、积分余额、OpenClaw 状态 |
| 指令 | 6 种指令模板，填写目标市场+产品后一键发起 |
| 任务 | 查看 AI Agent 执行进度和战报 |
| 账号 | OpenClaw 托管的 LinkedIn/Facebook 账号状态和消息 |
| 资产 | 飞书数字资产库数据汇总 |

**核心交互流程：询盘回复**
1. 老板在"战报"或"账号"Tab 看到买家消息
2. 点击"回复询盘"弹出底部抽屉
3. 用中文输入回复内容
4. 点击"翻译预览"→ OpenClaw AI 翻译+商务语气优化
5. 确认后 OpenClaw 以老板账号发出，对话同步至飞书

### Web 管理端 (`WebDashboard.tsx`)
6 个模块的全局管理仪表盘：

| 模块 | 功能 |
|------|------|
| 增长总览 | 询盘趋势图、市场分布、最新询盘列表 |
| 询盘管理 | 全部询盘的 CRM 视图 |
| Agent 任务 | 任务执行状态和进度 |
| **OpenClaw 管理** | 云端实例状态、账号托管详情、操作日志、资源监控 |
| 数字资产库 | 飞书同步的 6 类核心资产 |
| GEO 监控 | AI 搜索引擎可见度评分 |

## 设计风格

**暗夜指挥官** (Night Commander)
- 背景：深海军蓝 `oklch(0.12 0.02 250)`
- 主色：橙色 `#f97316`（行动/积分）
- 成功：青绿 `#10b981`
- 数据：蓝色 `#3b82f6`
- 字体：Space Grotesk（标题）+ Roboto Mono（数字）

## 技术栈

- React 19 + TypeScript
- TailwindCSS 4
- shadcn/ui 组件
- Recharts（图表）
- Wouter（路由）
- Sonner（Toast 通知）
