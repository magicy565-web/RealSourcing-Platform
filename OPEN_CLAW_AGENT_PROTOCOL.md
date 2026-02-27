# Open Claw Agent Protocol v4.1

**作者**: Manus AI
**版本**: 1.0
**日期**: 2026-02-27

---

## 1. 概述

本文档定义了 **Open Claw Agent** 与 **RealSourcing 平台**之间的通信协议。Agent 是一个部署在工厂本地环境（或云端）的客户端程序，负责自动从工厂内部系统（如飞书、ERP）获取报价信息，并将其提交给 RealSourcing 平台，以实现对买家询价的自动化响应。

所有 API 端点都基于 HTTPS，请求和响应体均为 JSON 格式。所有请求都需要在 Header 中携带 `Authorization: Bearer <AGENT_SECRET>` 以进行身份验证。

### 基础 URL

- **生产环境**: `https://app.realsourcing.com/api/trpc`
- **开发环境**: `http://localhost:3000/api/trpc`

### 核心流程

1.  **注册 (Register)**: Agent 启动后，首先向平台注册，声明其能力和部署环境。
2.  **心跳 (Heartbeat)**: Agent 定期（建议 30 秒一次）向平台发送心跳，以表明其在线状态。
3.  **任务轮询 (Poll Tasks)**: Agent 定期轮询平台，获取分配给它的新报价任务 (RFQ)。
4.  **提交报价 (Submit Quote)**: Agent 在本地处理完报价任务后，将结果通过回调接口提交给平台。

---

## 2. 认证 (Authentication)

所有对 Open Claw API 的请求都必须经过认证。认证通过在 HTTP Header 中提供一个 Bearer Token 来完成。

`Authorization: Bearer <AGENT_SECRET>`

`AGENT_SECRET` 是在 RealSourcing 平台为每个工厂 Agent 生成的唯一密钥。Agent 必须妥善保管此密钥。

---

## 3. API 端点详解

### 3.1. Agent 注册

Agent 在首次启动或配置变更后，需要调用此接口进行注册。

- **Endpoint**: `claw.register` (tRPC procedure)
- **Method**: `POST`
- **URL**: `/api/trpc/claw.register`

#### 请求体 (Request Body)

```json
{
  "factoryId": 123,
  "agentId": "agent-uuid-xxxx-yyyy-zzzz",
  "version": "1.0.2",
  "deployEnv": "aliyun_wuying",
  "deployEnvDetail": {
    "instanceId": "i-xxxx",
    "region": "cn-hangzhou"
  },
  "capabilities": [
    {
      "type": "feishu_bitable",
      "isConfigured": true,
      "priority": 1,
      "metadata": { "appId": "cli_xxxx", "tableId": "tbl_yyyy" }
    },
    {
      "type": "erp_api",
      "isConfigured": false,
      "priority": 2
    },
    {
      "type": "email_parser",
      "isConfigured": false,
      "priority": 3
    },
    {
      "type": "manual",
      "isConfigured": true,
      "priority": 4
    }
  ]
}
```

| 字段 | 类型 | 描述 |
| --- | --- | --- |
| `factoryId` | `number` | **必需**. 工厂在 RealSourcing 平台的唯一 ID。 |
| `agentId` | `string` | **必需**. Agent 实例的唯一标识符 (UUID)。 |
| `version` | `string` | **必需**. Agent 客户端的版本号。 |
| `deployEnv` | `string` | **必需**. 部署环境类型。可选值: `aliyun_wuying`, `docker`, `local`。 |
| `deployEnvDetail` | `object` | 部署环境的详细信息。 |
| `capabilities` | `array` | **必需**. Agent 的能力声明数组。 |

**`capabilities` 对象结构:**

| 字段 | 类型 | 描述 |
| --- | --- | --- |
| `type` | `string` | **必需**. 能力类型。可选值: `feishu_bitable`, `erp_api`, `email_parser`, `manual`。 |
| `isConfigured` | `boolean` | **必需**. 该能力是否已在 Agent 端配置完成。 |
| `priority` | `number` | **必需**. 平台调用该能力的优先级，数字越小优先级越高。 |
| `metadata` | `object` | 与该能力相关的元数据，如飞书 App ID 等。 |

#### 响应体 (Response Body)

```json
{
  "status": "ok",
  "message": "Agent registered successfully",
  "config": {
    "heartbeatInterval": 30000, // ms
    "taskPollInterval": 10000, // ms
    "serverUrl": "https://app.realsourcing.com/api/trpc"
  }
}
```

### 3.2. Agent 心跳

Agent 通过定期发送心跳来维持其 `online` 状态。

- **Endpoint**: `claw.heartbeat`
- **Method**: `POST`
- **URL**: `/api/trpc/claw.heartbeat`

#### 请求体 (Request Body)

```json
{
  "agentId": "agent-uuid-xxxx-yyyy-zzzz",
  "activeJobs": 2,
  "memoryUsage": 128.5, // MB
  "cpuUsage": 15.2 // %
}
```

#### 响应体 (Response Body)

```json
{
  "status": "ok"
}
```

### 3.3. 任务轮询

Agent 定期调用此接口，获取平台下发的新报价任务。

- **Endpoint**: `claw.pollTasks`
- **Method**: `POST`
- **URL**: `/api/trpc/claw.pollTasks`

#### 请求体 (Request Body)

```json
{
  "agentId": "agent-uuid-xxxx-yyyy-zzzz",
  "maxTasks": 5 // 本次最多获取的任务数量
}
```

#### 响应体 (Response Body)

响应一个任务数组，如果当前没有任务，则返回空数组 `[]`。

```json
[
  {
    "taskId": "task-uuid-abc-def-ghi",
    "inquiryId": 5678,
    "demandId": 101,
    "productCategory": "Injection Molding",
    "productName": "Custom ABS Plastic Enclosure",
    "quantity": 10000,
    "targetPrice": "1.25",
    "currency": "USD",
    "specifications": {
      "material": "ABS",
      "color": "Black",
      "dimensions": "120x80x40mm",
      "drawingUrl": "https://realsourcing.s3.amazonaws.com/drawings/xyz.pdf"
    },
    "enqueuedAt": "2026-02-27T10:00:00Z"
  }
]
```

### 3.4. 提交报价

Agent 在本地处理完报价任务后，通过此接口将报价结果提交给平台。

- **Endpoint**: `claw.submitQuote`
- **Method**: `POST`
- **URL**: `/api/trpc/claw.submitQuote`

#### 请求体 (Request Body)

```json
{
  "taskId": "task-uuid-abc-def-ghi",
  "inquiryId": 5678,
  "status": "completed", // "completed" or "failed"
  "quote": {
    "currency": "USD",
    "moq": 5000,
    "leadTimeDays": 25,
    "validUntil": "2026-03-27T23:59:59Z",
    "tierPricing": [
      { "qty": 5000, "unitPrice": 1.35 },
      { "qty": 10000, "unitPrice": 1.22 },
      { "qty": 50000, "unitPrice": 1.10 }
    ],
    "paymentTerms": "T/T, 30% deposit, 70% before shipment",
    "shippingTerms": "FOB Shanghai",
    "sampleAvailable": 1, // 1 for true, 0 for false
    "samplePrice": "50.00",
    "sampleLeadDays": 10,
    "factoryNotes": "Tooling cost is $5000, refundable after 100k pcs order."
  },
  "failureReason": null, // or e.g., "Product not found in ERP"
  "processedAt": "2026-02-27T10:05:12Z",
  "dataSource": "feishu_bitable"
}
```

**`quote` 对象结构:**

| 字段 | 类型 | 描述 |
| --- | --- | --- |
| `currency` | `string` | **必需**. 币种 (ISO 4217)。 |
| `moq` | `number` | 最小起订量。 |
| `leadTimeDays` | `number` | 生产交货期（天）。 |
| `validUntil` | `string` | 报价有效期 (ISO 8601)。 |
| `tierPricing` | `array` | **必需**. 阶梯报价数组。 |
| `paymentTerms` | `string` | 付款条款。 |
| `shippingTerms` | `string` | 装运条款。 |
| `sampleAvailable` | `number` | 是否可提供样品 (1/0)。 |
| `samplePrice` | `string` | 样品价格。 |
| `sampleLeadDays` | `number` | 样品交期（天）。 |
| `factoryNotes` | `string` | 工厂备注。 |

#### 响应体 (Response Body)

```json
{
  "status": "ok",
  "message": "Quote submitted successfully"
}
```

---

## 4. 错误处理

API 遵循标准的 HTTP 状态码。对于客户端错误 (4xx) 或服务器错误 (5xx)，响应体将包含一个错误对象。

```json
{
  "error": {
    "message": "Invalid agent secret",
    "code": "UNAUTHORIZED"
  }
}
```
