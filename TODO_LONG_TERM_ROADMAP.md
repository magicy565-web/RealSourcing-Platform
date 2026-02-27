# RealSourcing 长期开发路线图 (4.1-5.0)

## 核心愿景
OpenClaw 是部署在工厂侧的 **AI 超级员工**，RealSourcing 是它的 **任务调度中心**。
报价只是第一个被自动化的场景，最终目标是把工厂与买家之间所有重复性的信息交换全部自动化。

---

## 🎯 4.1 阶段：飞书检索 → 标准报价自动生成 → 工厂确认

### 核心目标
实现"30分钟内收到报价"的承诺，通过飞书 Bitable 检索 + AI 生成 + 工厂一键确认的完整闭环。

### 4.1 详细任务清单

#### Phase 1: 基础架构 (✅ 已完成)
- [x] OpenClaw Agent 注册协议 (`OPEN_CLAW_AGENT_PROTOCOL.md`)
- [x] 飞书/ERP 数据源适配器框架
- [x] 握手 → 自动发 RFQ 触发链路
- [x] 工厂侧 Agent 配置 UI (`AgentConfigTab`)
- [x] 买家侧报价卡片 UI (`QuoteCard`)
- [x] 运营后台 Agent 监控 (`OpsAgentMonitor`)

#### Phase 2: 报价流程 UI (✅ 已完成)
- [x] 买家侧 QuoteCard（阶梯报价、有效期倒计时、接受/拒绝）
- [x] SourcingRoom 集成 QuoteCard（15s 轮询报价）
- [x] OpsAgentMonitor 运营后台（Agent 监控、RFQ 队列、握手统计）

#### Phase 3: 报价闭环 UI (✅ 已完成)

**P0 - 工厂侧报价提交与审核**
- [x] QuoteSubmitForm 组件（单价、MOQ、交期、阶梯报价、样品信息）
- [x] 工厂端"报价审核确认"界面 (QuoteReviewPanel)
  - 显示 AI 生成的报价草稿和置信度
  - 支持一键确认或快速微调（单价直接输入 + ±5% 快捷按钮、交期直接输入 + ±1/±3 天快捷按钮）
  - 微调后自动重新计算阶梯报价
  - 提交后自动推送买家
- [x] 飞书 Bitable 字段对齐
  - 已确认字段：factory_id / factory_name / category / product_name / unit_price / currency / moq / lead_time / tier_pricing / is_verified / last_updated / notes
  - App Token: GOKtb2LIkaBSzss4hzWcgbzpnid | Table ID: tblQRCtsWu4KpXLj
  - 实现高效的"工厂ID + 产品品类"检索逻辑

**P0 - 买家侧报价展示与对比**
- [x] MatchingQuoteDisplay 组件（在工厂卡片上展示报价）
- [x] MyQuotes 页面（报价管理总览）
- [x] 报价对比功能 (QuoteComparePanel)
  - 支持同时查看多个工厂的报价
  - 显示"单价对比"、"MOQ 对比"、"交期对比"
  - 自动标注"最低价"、"最快交期"、"最低 MOQ"
- [x] 报价接受/拒绝后的流程
  - 买家接受报价 → 自动生成采购单（purchaseOrders 表 + 飞书采购单卡片）
  - 买家拒绝报价 → 自动推送飞书卡片给工厂（sendQuoteRejectedCard）

**P0 - AI 报价生成核心**
- [x] 实现 `autoSendRfq` 完整链路
  - 握手成功 → 自动调用 `autoSendRfq`
  - 飞书极速路径：检索 Bitable → 自动提交报价 → 推送飞书卡片（2分钟内）
  - OpenClaw 降级路径：入队 BullMQ → Agent 处理 → 回调提交报价
  - 30分钟超时自动降级（推送飞书超时告警）

**P1 - 实时进度推送**
- [x] WebSocket 实时进度事件（4 个阶段）
  - `rfq_processing_started`：AI 正在联络工厂
  - `rfq_data_found`：已从工厂报价库提取数据
  - `rfq_generated`：报价已生成，等待工厂确认
  - `rfq_sent_to_buyer`：报价已推送给买家
- [x] 买家侧 RFQ 进度追踪组件 (RfqProgressTracker)
  - 实时显示进度状态和预计剩余时间
  - 超时后自动显示"工厂未及时回复"提示

**P1 - 运营后台增强**
- [x] 任务操作按钮（重试、查看日志、取消）
- [x] 报价成功率统计面板 (QuoteSuccessStatsPanel)
  - 按工厂、按产品品类统计
  - 显示平均生成时间、工厂确认率、买家接受率
- [x] 后端统计 API (ops.getQuoteStats)
- [ ] Agent 任务日志查询接口

**P2 - 数据监控与分析**
- [x] 报价成功率统计
  - 按工厂、按产品品类、按时间段统计
  - 显示"平均生成时间"、"工厂确认率"、"买家接受率"
- [ ] 异常告警
  - 工厂超时未回复 → 自动推送飞书提醒
  - AI 生成失败 → 自动降级到人工处理

---

## 🎯 4.2 阶段：数据接入层扩展 - ERP/阿里国际站集成

### 核心目标
让 OpenClaw 不仅能检索飞书，还能接入工厂的 ERP、阿里国际站等多个数据源，提升报价准确率。

### 4.2 详细任务清单

#### 数据源适配器
- [ ] ERP 系统适配器
  - 支持常见 ERP（用友、金蝶、SAP）
  - 实时同步库存、产能、成本数据
  - 自动更新工厂在 RealSourcing 上的"库存状态"
- [ ] 阿里国际站适配器
  - 同步工厂的询盘记录、评价、响应率
  - 抓取工厂的历史报价数据
  - 监控工厂的在线状态和响应时间
- [ ] 邮件/微信记录适配器
  - 从工厂的历史邮件中提取报价条款
  - 识别常见的付款方式、交期模式
  - 建立"谈判历史"知识库

#### 报价准确率提升
- [ ] 多源数据融合
  - 当飞书、ERP、邮件都有数据时，AI 自动选择最新/最可信的版本
  - 显示数据来源和更新时间
- [ ] 成本模型学习
  - 基于历史成交数据，AI 学习工厂的成本结构
  - 当库中无现成报价时，AI 能根据成本模型生成更准确的"草稿报价"
- [ ] 产能实时可见
  - 工厂的库存、产能在 RealSourcing 上实时显示
  - 买家能看到"该产品当前库存 500 件，可立即发货"

---

## 🎯 4.3 阶段：定制报价 + 设计稿解析

### 核心目标
支持独立设计师上传设计稿，AI 自动解析工艺要求，生成定制报价。

### 4.3 详细任务清单

#### 设计稿解析
- [x] 设计稿上传与存储
  - 支持 PDF、PNG、AI、PSD 格式
  - 自动转换为标准格式（PNG）供 AI 分析
- [x] AI 设计稿解析 (rfq.parseDesignFile)
  - 识别产品类型、材料、尺寸、工艺
  - 提取"需要特殊处理"的工艺（刺绣、烫印、丝印等）
  - 生成"定制需求说明书"（中文）
  - 生成置信度评分
- [ ] 工艺成本计算（待实现）
  - 基于工厂的工艺库，AI 自动计算定制成本增加
  - 生成"基础价格 + 定制加价"的分项报价

#### 定制报价流程
- [x] 买家侧定制询价向导 (CustomQuoteWizard)
  - 上传设计稿（支持拖拽）
  - AI 实时解析设计稿，显示识别结果
  - 填写定制需求（材料、尺寸、工艺）
  - 自动匹配并发送给 5 家最相关工厂
- [x] 后端定制 RFQ 创建 API (rfq.createCustomRfq)
  - 自动匹配工厂 (autoMatchFactoriesForCustomRfq)
  - 推送飞书通知给工厂 (sendCustomRfqToFactory)
- [ ] 工厂侧定制报价审核（待实现）
  - 显示 AI 解析的设计稿和工艺要求
  - 支持工厂拒绝（"无法做这个工艺"）或确认报价
  - 支持工厂提出替代方案（"可以用烫印替代刺绣，成本更低"）
- [ ] 定制报价历史（待实现）
  - 记录每个设计稿的报价历史
  - 便于买家快速复用之前的工厂和工艺方案

---

## 🎯 4.4 阶段：动态议价 AI + 历史成交数据学习 (✅ 已完成)

### 核心目标
平台开始具备"定价智能"，支持自动议价和智能降价建议。

### 4.4 详细任务清单

#### 动态议价
- [x] 买家议价请求处理 (`NegotiationPanel`)
  - 买家填写议价请求、目标单价/MOQ/交期
  - AI 分析工厂历史成交数据，生成反提案（`negotiationService.ts`）
  - 自动生成 accept/counter/reject 三种策略和置信度评分
  - 工厂通过 `NegotiationReplyPanel` 一键确认或提出替代方案
- [x] 智能降价建议
  - AI 基于历史成交价格弹性自动计算可接受降价幅度
  - 反提案中包含"增加 MOQ 换取降价"的折中方案
- [x] 谈判历史学习
  - `negotiation_rounds` 表记录每轮谈判详情
  - AI 推理依据包含工厂历史谈判风格分析

#### 历史成交数据学习
- [x] 成交数据收集 (`transaction_history` 表)
  - 记录"报价 vs 最终成交价"的差异（`priceDiscountPct`）
  - 记录"承诺交期 vs 实际交期"的差异（`actualLeadDays`）
  - 记录"买家评价"（质量、服务、交期三维评分）
- [x] AI 模型持续学习
  - 每次成交后自动更新 `factory_scores`（综合评分）
  - 下次议价时 AI 优先参考该工厂的历史价格弹性
  - 工厂评分越来越真实（基于实际成交数据）

#### 新增组件与服务
- [x] `negotiationService.ts` - AI 议价核心服务（反提案生成、工厂评分更新、成交记录）
- [x] `NegotiationPanel.tsx` - 买家侧议价请求 + 反提案展示
- [x] `NegotiationReplyPanel.tsx` - 工厂侧议价确认 + 替代方案提交
- [x] `NegotiationStatsPanel.tsx` - 运营后台议价成功率、AI 置信度、数据飞轮状态
- [x] 数据库新增 4 张表：`negotiation_sessions`、`negotiation_rounds`、`transaction_history`、`factory_scores`
- [x] `negotiation` 路由（9 个 API：create、getSession、getBuyerSessions、getFactoryPendingSessions、factoryRespond、buyerRespond、submitReview、getFactoryScore、getStats）
- [x] OpsAgentMonitor 新增"议价分析" Tab（集成 NegotiationStatsPanel）

---

## 🎯 5.0 阶段：OpenClaw 主动推送 + Dropshipping 选品助手

### 核心目标
从"被动响应"升级到"主动创造交易"。OpenClaw 能主动发现商机，推送给匹配的买家。

### 5.0 详细任务清单

#### 工厂库存主动推送
- [ ] 库存监控
  - OpenClaw 定期检查工厂的库存、产能
  - 识别"库存积压"、"新品上架"、"限时特价"
- [ ] 智能推送
  - 基于买家的历史采购记录，AI 识别"最可能感兴趣的买家"
  - 自动推送"限时特价"通知
  - 推送中包含"预计利润率"（针对 Dropshipping 买家）

#### Dropshipping 选品助手
- [ ] 竞品价格扫描
  - 当工厂报价出来后，AI 自动搜索速卖通/亚马逊上的同款售价
  - 计算出粗略的利润率
  - 标注"高利润潜力"产品
- [ ] 小单友好工厂发现
  - 定期爬取 1688、阿里国际站，识别"支持定制"、"MOQ ≤ 100"的供应商
  - 建立"小单友好工厂"专属库
  - 推荐给 Dropshipping 买家
- [ ] 样品费用透明化
  - 自动查询 DHL/顺丰国际的样品寄送报价
  - 结合工厂样品费，生成"样品总费用"
  - 买家不需要自己查，直接拿到一个数字就能决策

#### 工厂沟通语言自动化
- [ ] 需求说明书自动生成
  - 买家上传设计稿 → AI 自动生成中文"定制需求说明书"
  - 推送给工厂，工厂直接理解需求
- [ ] 报价单翻译与标注
  - 工厂回复的中文报价单 → 实时翻译成英文
  - 自动标注关键条款（MOQ、交期、付款方式）
  - 买家能快速理解

---

## 📊 长期架构：三层模型

### 第一层：数据接入层（OpenClaw 负责）

| 数据源 | 内容 | 更新频率 | 4.1 | 4.2 | 4.3+ |
|--------|------|---------|-----|-----|------|
| 飞书 Bitable | 历史报价、客户档案 | 实时 | ✅ | ✅ | ✅ |
| ERP 系统 | 库存、产能、成本 | 每日同步 | ❌ | ✅ | ✅ |
| 邮件/微信记录 | 历史谈判条款 | 按需检索 | ❌ | ✅ | ✅ |
| 工厂官网/产品目录 | 产品规格、图片 | 每周更新 | ❌ | ✅ | ✅ |
| 阿里国际站后台 | 询盘记录、评价 | 每日同步 | ❌ | ✅ | ✅ |

### 第二层：智能响应层（AI 负责）

| 场景 | 4.1 | 4.2 | 4.3 | 4.4 | 5.0 |
|------|-----|-----|-----|-----|-----|
| 标准报价 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 定制报价 | ❌ | ❌ | ✅ | ✅ | ✅ |
| 动态议价 | ❌ | ❌ | ❌ | ✅ | ✅ |
| 主动推送 | ❌ | ❌ | ❌ | ❌ | ✅ |

### 第三层：学习进化层（数据飞轮）

```
每一次报价 → 记录"报价 vs 最终成交价"
每一次谈判 → 记录"哪些条款被接受/拒绝"
每一次交付 → 记录"实际交期 vs 承诺交期"
        ↓
AI 模型持续学习
        ↓
报价越来越准确
谈判建议越来越有效
工厂评分越来越真实
        ↓
用了 RealSourcing 越久的工厂，它的 OpenClaw 就越聪明
```

---

## 🚀 关键里程碑

| 时间 | 目标 | 关键指标 |
|------|------|---------|
| 4.1 完成 | 30分钟报价承诺落地 | 平均报价生成时间 < 15 分钟 |
| 4.2 完成 | 报价准确率大幅提升 | 工厂确认率 > 95%，买家接受率 > 70% |
| 4.3 完成 | 独立设计师核心场景打通 | 定制报价占比 > 20% |
| 4.4 完成 | 平台具备"定价智能" | 动态议价成功率 > 60% |
| 5.0 完成 | 从"被动响应"到"主动创造交易" | 主动推送转化率 > 15% |

---

## 💡 最关键的一个判断

**OpenClaw 不应该只是 RealSourcing 的一个功能模块，它应该是一个可以独立销售给工厂的 SaaS 产品。**

工厂付费订阅 OpenClaw，获得"AI 超级员工"。而 RealSourcing 是 OpenClaw 最重要的任务来源之一。

这样就形成了一个双边飞轮：
- **RealSourcing** 获得更快、更准的报价，平台体验更好
- **OpenClaw** 获得真实业务场景驱动，产品越来越强
- **工厂** 降低人力成本，响应速度提升，在平台上获得更多订单

---

## 📝 当前状态（4.4 已完成）

> 最后更新：2026-02-27

### ✅ 已完成（全部）

**4.1 Phase 1-3 + 4.3 + 4.4 全部完成**

**工厂侧**
- [x] `QuoteSubmitForm`、`QuoteReviewPanel`（单价/交期直接输入 + 快捷按鈕）
- [x] `NegotiationReplyPanel`（议价确认、拒绝、提出替代方案）

**买家侧**
- [x] `MatchingQuoteDisplay`、`MyQuotes`、`RfqProgressTracker`、`QuoteComparePanel`
- [x] `NegotiationPanel`（发起议价请求、查看 AI 反提案、接受/拒绝）
- [x] `CustomQuoteWizard`（设计稿上传 + AI 解析 + 自动匹配工厂）

**后端与服务**
- [x] `negotiationService.ts`（AI 议价核心：反提案生成、工厂评分、成交记录）
- [x] `rfqService.ts`：`autoSendRfq` 完整链路 + WebSocket 进度推送
- [x] 飞书 Bitable 字段对齐（App Token: `GOKtb2LIkaBSzss4hzWcgbzpnid`， Table ID: `tblQRCtsWu4KpXLj`）
- [x] 报价接受后自动生成采购单 + 飞书卡片
- [x] 报价拒绝后自动推送飞书卡片给工厂

**数据库**
- [x] 新增 4 张表：`negotiation_sessions`、`negotiation_rounds`、`transaction_history`、`factory_scores`、`purchaseOrders`

**运营后台**
- [x] `QuoteSuccessStatsPanel`（报价成功率统计）
- [x] `NegotiationStatsPanel`（议价成功率、AI 置信度、数据飞轮状态）
- [x] OpsAgentMonitor 新增"议价分析" Tab

### ⏳ 待开始（5.0 阶段）
- [ ] 4.2 阶段：跳过（暂不开发 ERP/阿里国际站集成）
- [ ] 4.3 待完成：工厂侧定制报价审核界面、定制报价历史、工艺成本计算
- [ ] 5.0 阶段：OpenClaw 主动推送 + Dropshipping 选品助手

---

## 🎓 开发指南

### 代码组织
- `server/_core/services/quoteGenerationService.ts` - AI 报价生成核心
- `server/_core/services/rfqService.ts` - RFQ 状态机和业务逻辑
- `server/_core/services/feishuService.ts` - 飞书数据接入
- `client/src/components/factories/QuoteReviewPanel.tsx` - 工厂报价审核 UI
- `client/src/pages/MyQuotes.tsx` - 买家报价管理页面

### 设计模式
- 所有异步操作使用 tRPC mutations
- 所有实时推送使用 WebSocket 事件
- 所有 UI 动画使用 framer-motion
- 所有表单使用 react-hook-form + zod 校验

### 测试策略
- 单元测试：AI Prompt 的准确率测试
- 集成测试：握手 → 报价生成 → 工厂确认的完整流程
- E2E 测试：买家从握手到接受报价的完整体验

---

## 📞 反馈与迭代

本文档将随着开发进度持续更新。如有任何问题或调整，请及时反馈。
