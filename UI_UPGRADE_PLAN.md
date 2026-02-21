# RealSourcing UI/UX 升级实施计划

## 升级方向总结

### 核心设计决策
- **主题**：从"深黑+紫色光晕"升级为"专业蓝白"主题（B2B SaaS 行业标准）
- **色彩**：主色从紫色 `oklch(0.70 0.25 280)` 升级为专业蓝 `oklch(0.55 0.18 260)`
- **背景**：从深黑渐变升级为近白色 `oklch(0.98 0.005 240)`
- **卡片**：从玻璃态半透明升级为纯白色 + 轻柔阴影

### 安全边界（严格遵守）
- App.tsx 路由配置：**不得修改**
- server/routers.ts：**不得修改**
- drizzle/schema.ts：**不得修改**
- 所有 tRPC 调用逻辑：**不得修改**
- 所有 useLocation/useParams 路由逻辑：**不得修改**

## 文件变更清单

| 文件 | 变更类型 | 说明 |
|------|---------|------|
| `client/src/index.css` | 修改 | 色彩变量、字体工具类、背景 |
| `components/ui/button.tsx` | 修改 | xl 尺寸、蓝色主色 |
| `components/ui/card.tsx` | 修改 | 白色背景、轻柔阴影 |
| `components/ui/badge.tsx` | 修改 | live/upcoming/past 语义变体 |
| `pages/Home.tsx` | 重构 | 蓝白主题 Hero + 功能展示 |
| `pages/Login.tsx` | 修改 | 两栏布局视觉精简 |
| `pages/Register.tsx` | 修改 | 与 Login 一致 |
| `pages/Dashboard.tsx` | 修改 | 数据卡片视觉升级 |
| `pages/Webinars.tsx` | 重构 | 卡片式网格布局 |
| `pages/WebinarLiveRoom.tsx` | 重构 | 三栏式布局 |
| `pages/Factories.tsx` | 修改 | 统一卡片风格 |
| `components/BuyerSidebar.tsx` | 修改 | 深蓝灰侧边栏 |
| `App.tsx` | **不变** | 路由配置冻结 |
