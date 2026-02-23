export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  // Agora Configuration
  agoraAppId: process.env.AGORA_APP_ID ?? "",
  agoraAppCertificate: process.env.AGORA_APP_CERTIFICATE ?? "",
  agoraCustomerId: process.env.AGORA_CUSTOMER_ID ?? "",
  agoraCustomerSecret: process.env.AGORA_CUSTOMER_SECRET ?? "",
  // Agora Whiteboard
  whiteboardAk: process.env.WHITEBOARD_AK ?? "",
  whiteboardSk: process.env.WHITEBOARD_SK ?? "",
  // AI Configuration
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",
  openaiBaseUrl: process.env.OPENAI_BASE_URL ?? "https://once.novai.su/v1",
  openaiModel: process.env.OPENAI_MODEL ?? "gpt-5.1",
  // 备用 AI：阿里云百炼（通义千问）
  dashscopeApiKey: process.env.DASHSCOPE_API_KEY ?? "",
  dashscopeModel: process.env.DASHSCOPE_MODEL ?? "qwen-plus",
  // 备用 AI：Google Gemini
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  // 阿里云 OSS 配置（用于存储用户上传文件、AI 渲染图等媒体资产）
  ossRegion: process.env.OSS_REGION ?? "oss-cn-hangzhou",
  ossAccessKeyId: process.env.OSS_ACCESS_KEY_ID ?? "",
  ossAccessKeySecret: process.env.OSS_ACCESS_KEY_SECRET ?? "",
  ossBucket: process.env.OSS_BUCKET ?? "demand-os-discord",
  ossEndpoint: process.env.OSS_ENDPOINT ?? "oss-cn-hangzhou.aliyuncs.com",
};
