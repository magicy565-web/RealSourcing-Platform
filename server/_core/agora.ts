/**
 * Agora RTC/RTM Token Generation Service
 * 声网 RTC/RTM Token 生成服务
 */

import pkg from 'agora-access-token';
const { RtcTokenBuilder, RtmTokenBuilder, RtcRole, RtmRole } = pkg;
import { ENV } from './env';

export interface AgoraTokenResponse {
  rtcToken: string;
  rtmToken: string;
  appId: string;
  channel: string;
  uid: number | string;
}

export interface AgoraTokenConfig {
  channel: string;
  uid: number | string;
  role?: 'publisher' | 'subscriber';
  expirationTimeInSeconds?: number;
}

/**
 * Agora Token 生成服务
 */
export class AgoraTokenService {
  private appId: string;
  private appCertificate: string;
  private defaultExpiration = 3600; // 1 hour

  constructor() {
    this.appId = ENV.agoraAppId;
    this.appCertificate = ENV.agoraAppCertificate;

    if (!this.appId || !this.appCertificate) {
      throw new Error('Missing Agora App ID or App Certificate in environment variables');
    }
  }

  /**
   * 生成 RTC Token（用于视频/音频通话）
   */
  generateRtcToken(config: AgoraTokenConfig): string {
    const {
      channel,
      uid,
      role = 'publisher',
      expirationTimeInSeconds = this.defaultExpiration,
    } = config;

    const rtcRole = role === 'publisher' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;

    try {
      const token = RtcTokenBuilder.buildTokenWithUid(
        this.appId,
        this.appCertificate,
        channel,
        typeof uid === 'string' ? parseInt(uid) : uid,
        rtcRole,
        expirationTimeInSeconds
      );

      console.log(`✅ Generated RTC Token for channel: ${channel}, uid: ${uid}`);
      return token;
    } catch (error) {
      console.error('❌ Failed to generate RTC Token:', error);
      throw new Error(`Failed to generate RTC Token: ${error}`);
    }
  }

  /**
   * 生成 RTM Token（用于实时消息）
   */
  generateRtmToken(
    uid: string | number,
    expirationTimeInSeconds = this.defaultExpiration
  ): string {
    try {
      const token = RtmTokenBuilder.buildToken(
        this.appId,
        this.appCertificate,
        typeof uid === 'number' ? uid.toString() : uid,
        RtmRole.Rtm_User,
        expirationTimeInSeconds
      );

      console.log(`✅ Generated RTM Token for uid: ${uid}`);
      return token;
    } catch (error) {
      console.error('❌ Failed to generate RTM Token:', error);
      throw new Error(`Failed to generate RTM Token: ${error}`);
    }
  }

  /**
   * 生成 RTC 和 RTM 双 Token
   */
  generateDualTokens(config: AgoraTokenConfig): AgoraTokenResponse {
    const rtcToken = this.generateRtcToken(config);
    const rtmToken = this.generateRtmToken(config.uid, config.expirationTimeInSeconds);

    return {
      rtcToken,
      rtmToken,
      appId: this.appId,
      channel: config.channel,
      uid: config.uid,
    };
  }

  /**
   * 获取 App ID
   */
  getAppId(): string {
    return this.appId;
  }
}

// 导出单例
export const agoraTokenService = new AgoraTokenService();
