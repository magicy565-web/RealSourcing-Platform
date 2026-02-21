# RealSourcing 3.1 详细开发行动计划 (Next Steps Plan)

| 阶段 | 重点任务 | 负责人 | 预计工期 | 优先级 |
| :--- | :--- | :--- | :--- | :--- |
| **Phase 1: 核心链路闭环** | 实时翻译前端集成、云端录制自动化、样品单深度融合 | Manus AI | 3 Days | **P0** |
| **Phase 2: AI 赋能升级** | GPT-4o 会议摘要、Meeting Reel 自动剪辑、AI 降噪 | Manus AI | 4 Days | **P1** |
| **Phase 3: 体验与性能优化** | 美颜特效、Webinar 互动增强、多端适配 | Manus AI | 3 Days | **P2** |

---

## 1. P0 核心任务分解 (Must-Have)

### 1.1 实时翻译前端深度集成
- **目标**：将后端 `agoraTranslationService` 的实时输出通过 WebSocket/RTM 推送到前端 `AgoraTranscription.tsx`。
- **验收标准**：买家和工厂在 PrivateMeetingRoom 中能实时看到对方说话的翻译字幕。
- **依赖**：`agora-rtm-sdk`, `server/routers.ts`。

### 1.2 云端录制自动化与 S3 存储
- **目标**：会议开始自动触发 `startRecording`，会议结束自动触发 `stopRecording` 并将文件 URL 存入数据库。
- **验收标准**：在 `MeetingDetail.tsx` 页面能直接播放会议录像。
- **依赖**：AWS S3 配置, `agoraRecordingService`。

### 1.3 会议中一键申请样品 (SampleOrder Integration)
- **目标**：在 `PrivateMeetingRoom.tsx` 的产品侧边栏添加“Request Sample”按钮，点击后弹出简易表单并生成 `SampleOrder`。
- **验收标准**：买家在通话中即可完成样品申请，无需退出房间。
- **依赖**：`SampleOrder.tsx` 逻辑复用。

---

## 2. P1 AI 赋能任务 (Should-Have)

### 2.1 GPT-4o 会议摘要提取
- **目标**：会议结束后，调用 GPT-4o 对录制转录文本进行分析，提取价格、MOQ、交期等关键商务条款。
- **验收标准**：在 `Reports.tsx` 中显示结构化的会议纪要。
- **依赖**：OpenAI API, `agoraTranslationService`。

### 2.2 Meeting Reel 自动剪辑 (MVP)
- **目标**：根据 AI 识别的关键时刻（Highlights），自动截取录制视频片段，生成 30-60 秒的产品展示短视频。
- **验收标准**：买家可下载或分享包含核心产品展示的 Meeting Reel。
- **依赖**：FFmpeg (Server-side), `MeetingReelGenerator.tsx`。

---

## 3. P2 体验优化任务 (Could-Have)

### 3.1 美颜特效与 AI 降噪面板
- **目标**：在 `AgoraEnhancements.tsx` 中实现真实的美颜参数调节和 AI 降噪开关。
- **验收标准**：用户可实时看到美颜效果，并能明显感受到背景噪音的降低。
- **依赖**：`agora-extension-beauty-effect`。

### 3.2 Webinar 互动增强
- **目标**：在 `WebinarLiveRoom.tsx` 中添加实时点赞动画、礼物特效和主播推送商品的弹窗。
- **验收标准**：提升直播间的活跃度和商品点击率。
- **依赖**：Framer Motion (动画), RTM (信令)。

---

## 4. 风险评估与对策

| 风险点 | 影响程度 | 对策 |
| :--- | :--- | :--- |
| **声网 Token 过期** | 高 | 实现 Token 自动刷新机制（Frontend Heartbeat）。 |
| **AI 摘要准确性** | 中 | 提供人工修正入口，允许工厂/买家微调摘要内容。 |
| **录制文件存储成本** | 低 | 设置过期自动清理策略（例如 30 天后转为冷存储）。 |

---

**执行状态追踪：**
- [x] 声网基础集成 (RTC, RTM, Whiteboard, STT) - **DONE**
- [ ] P0 核心链路闭环 - **IN PROGRESS**
- [ ] P1 AI 赋能升级 - **TODO**
- [ ] P2 体验与性能优化 - **TODO**
