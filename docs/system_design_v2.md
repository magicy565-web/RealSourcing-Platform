# RealSourcing Platform - 系统设计蓝图 (V2)

**作者**: Manus AI
**日期**: 2026-02-20

## 1. 数据库 Schema 扩展

为支持新功能，将在现有数据库基础上进行扩展。所有新字段都将设置为 `NULLABLE` 并提供合理的 `DEFAULT` 值，以确保向后兼容性。

| 表名 (Table) | 新增/修改字段 | 数据类型 | 描述 |
|---|---|---|---|
| `users` | `interestedCategories` | `JSON` | 用户感兴趣的品类 (onboarding 步骤) |
| | `orderScale` | `VARCHAR(50)` | 订单规模偏好 (onboarding 步骤) |
| | `targetMarkets` | `JSON` | 目标市场偏好 (onboarding 步骤) |
| | `certifications` | `JSON` | 认证偏好 (onboarding 步骤) |
| | `onboardingCompleted` | `BOOLEAN` | 是否完成 onboarding 流程 |
| `webinarReels` | *新表* | - | AI 生成的 Webinar 切片 |
| | `webinarId` | `INT` | 关联的 Webinar ID |
| | `userId` | `INT` | 创建者 ID |
| | `clips` | `JSON` | 选中的视频片段（时间戳） |
| | `bgm` | `VARCHAR(255)` | 背景音乐 URL |
| | `subtitlesEnabled` | `BOOLEAN` | 是否启用字幕 |
| | `aiCopy` | `TEXT` | AI 生成的营销文案 |
| | `hashtags` | `JSON` | AI 生成的标签 |
| | `status` | `VARCHAR(50)` | 状态 (draft, published) |
| | `publishedPlatforms` | `JSON` | 已发布的平台 (tiktok, linkedin) |
| `webinarParticipants` | *新表* | - | Webinar 参会记录 |
| | `webinarId` | `INT` | 关联的 Webinar ID |
| | `userId` | `INT` | 参会用户 ID |
| | `raisedHand` | `BOOLEAN` | 是否举手 |
| `webinarLikes` | *新表* | - | Webinar 点赞记录 |
| | `webinarId` | `INT` | 关联的 Webinar ID |
| | `userId` | `INT` | 点赞用户 ID |
| `factoryFollows` | *新表* | - | 用户关注工厂记录 |
| | `factoryId` | `INT` | 工厂 ID |
| | `userId` | `INT` | 用户 ID |

## 2. 后端 tRPC API 路由规划

所有新的后端逻辑将通过 tRPC 路由暴露给前端。

| 模块 | 路由 | 输入参数 (Input) | 输出 (Output) | 描述 |
|---|---|---|---|---|
| **Auth** | `auth.register` | `role, email, company, password, categories` | `success` | 注册新用户（买家/工厂） |
| **Onboarding** | `onboarding.savePreferences` | `categories, orderScale, ...` | `success` | 保存用户的采购偏好 |
| | `onboarding.complete` | - | `success` | 标记用户完成 onboarding |
| **Webinar** | `webinar.like` | `webinarId` | `likeCount` | 点赞 Webinar |
| | `webinar.raiseHand` | `webinarId` | `success` | 在 Webinar 中举手 |
| **AI Reel** | `reel.generateClips` | `webinarId` | `Clip[]` | AI 推荐的精彩片段 |
| | `reel.generateCopy` | `clips, productInfo` | `string` | AI 生成营销文案 |
| | `reel.saveDraft` | `ReelData` | `reelId` | 保存 AI Reel 草稿 |
| | `reel.publish` | `reelId, platforms` | `success` | 发布 AI Reel 到社交媒体 |
| **Factory** | `factory.list` | `filters, page` | `Factory[]` | 获取筛选/分页的工厂列表 |
| | `factory.startMeeting` | `factoryId` | `meetingId` | 与工厂发起 1:1 会议 |

## 3. AI 应用层设计

AI 功能将作为独立模块，通过 tRPC API 与核心业务逻辑解耦。

- **AI 推荐片段 (`reel.generateClips`)**: 
  - **输入**: Webinar 录像的音频转录文本、产品展示时间戳。
  - **模型**: 使用大型语言模型 (LLM, e.g., `gpt-4.1-mini`) 分析转录文本，识别出问答、产品亮点、价格讨论等关键对话片段。
  - **输出**: 返回多个推荐的视频时间戳（`{ start, end }`）。

- **AI 生成文案 (`reel.generateCopy`)**:
  - **输入**: 用户选中的视频片段、产品信息。
  - **模型**: 使用 LLM 根据视频内容和产品信息，生成符合 TikTok/LinkedIn 风格的营销文案和 hashtags。
  - **输出**: 返回生成的文案字符串和标签数组。

## 4. 页面开发与交互逻辑

将按照原型逐一开发新页面，并实现完整的交互逻辑。

- **注册页 (`/register`)**: 实现 Buyer/Factory 角色切换，根据角色显示不同表单。注册成功后跳转到 `/onboarding/step1`。
- **Onboarding 流程 (`/onboarding/...`)**: 多步骤表单，用于收集用户偏好。完成后跳转到 `/dashboard`。
- **工厂列表页 (`/factories`)**: 实现复杂的筛选和排序逻辑，所有筛选条件通过 URL 参数管理，方便分享和刷新。
- **直播间 (`/webinar/:id`)**: 使用 WebSocket (或 tRPC subscription) 实现实时聊天、点赞、举手等功能。
- **AI Reel 编辑器 (`/ai-reel-editor/:id`)**: 前端实现视频剪辑预览、字幕叠加、BGM 选择等功能，后端通过 tRPC 调用 AI 服务。
