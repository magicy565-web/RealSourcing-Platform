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
};
