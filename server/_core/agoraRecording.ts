/**
 * Agora Cloud Recording Service
 * 声网云端录制服务
 */

import { ENV } from './env';

export interface RecordingConfig {
  channelName: string;
  uid: number | string;
  clientRequest?: {
    recordingFileS3?: {
      accessKey: string;
      secretKey: string;
      bucket: string;
      region: string;
      fileNamePrefix?: string[];
    };
    recordingFileOss?: {
      accessKey: string;
      secretKey: string;
      bucket: string;
      fileNamePrefix?: string[];
    };
  };
  recordingMode?: 'composite' | 'individual'; // 合流或单流
  videoProfile?: 'HD' | 'SD' | 'FHD' | '4K';
  audioProfile?: 'SPEECH_LOW' | 'SPEECH_MEDIUM' | 'MUSIC_STANDARD' | 'MUSIC_HIGH_QUALITY';
}

export interface RecordingStartResponse {
  resourceId: string;
  sid: string;
  status: 'started' | 'failed';
  message?: string;
}

export interface RecordingStopResponse {
  resourceId: string;
  sid: string;
  status: 'stopped' | 'not_found';
  message?: string;
}

export interface RecordingStatusResponse {
  resourceId: string;
  sid: string;
  status: 'started' | 'stopped' | 'not_found';
  serverResponse?: any;
  message?: string;
}

/**
 * Agora Cloud Recording Service
 */
export class AgoraRecordingService {
  private customerId: string;
  private customerSecret: string;
  private apiBaseUrl = 'https://api.agora.io';
  private activeRecordings: Map<string, { resourceId: string; sid: string; config: RecordingConfig }> = new Map();

  constructor() {
    this.customerId = ENV.agoraCustomerId;
    this.customerSecret = ENV.agoraCustomerSecret;

    if (!this.customerId || !this.customerSecret) {
      console.warn('⚠️ Agora Customer ID or Secret is missing for Cloud Recording service');
    }
  }

  /**
   * 生成 Basic Auth 头
   */
  private getAuthHeader(): string {
    const credentials = `${this.customerId}:${this.customerSecret}`;
    const encoded = Buffer.from(credentials).toString('base64');
    return `Basic ${encoded}`;
  }

  /**
   * 获取录制资源
   */
  async acquireRecordingResource(channelName: string): Promise<{ resourceId: string } | null> {
    try {
      if (!this.customerId || !this.customerSecret) {
        console.error('❌ Agora credentials not configured');
        return null;
      }

      const requestBody = {
        cname: channelName,
        uid: '0',
        clientRequest: {},
      };

      const response = await fetch(
        `${this.apiBaseUrl}/v1/projects/${ENV.agoraAppId}/cloud_recording/acquire`,
        {
          method: 'POST',
          headers: {
            'Authorization': this.getAuthHeader(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        console.error('❌ Failed to acquire recording resource:', response.status, errorText);
        return null;
      }

      const data = await response.json() as any;
      return { resourceId: data.resourceId };
    } catch (error) {
      console.error('❌ Error acquiring recording resource:', error);
      return null;
    }
  }

  /**
   * 启动云端录制
   */
  async startRecording(config: RecordingConfig): Promise<RecordingStartResponse> {
    try {
      if (!this.customerId || !this.customerSecret) {
        return {
          resourceId: '',
          sid: '',
          status: 'failed',
          message: 'Agora credentials not configured',
        };
      }

      // 第一步：获取录制资源
      const resourceInfo = await this.acquireRecordingResource(config.channelName);
      if (!resourceInfo) {
        return {
          resourceId: '',
          sid: '',
          status: 'failed',
          message: 'Failed to acquire recording resource',
        };
      }

      const resourceId = resourceInfo.resourceId;

      // 第二步：启动录制
      const clientRequest: any = {
        recordingConfig: {
          maxIdleTime: 30,
          streamTypes: 2, // 1: audio only, 2: video only, 3: audio + video
          audioProfile: config.audioProfile || 'MUSIC_STANDARD',
          channelType: 0,
          videoStreamType: 0,
          transcodingConfig: {
            width: config.videoProfile === '4K' ? 3840 : config.videoProfile === 'FHD' ? 1920 : config.videoProfile === 'HD' ? 1280 : 640,
            height: config.videoProfile === '4K' ? 2160 : config.videoProfile === 'FHD' ? 1080 : config.videoProfile === 'HD' ? 720 : 360,
            fps: 30,
            bitrate: 500,
            mixedAudioBitrate: 128,
            backgroundColor: '#000000',
            defaultUserBackgroundImage: '',
            layoutConfig: [
              {
                uid: 'string',
                x_axis: 0.0,
                y_axis: 0.0,
                width: 0.5,
                height: 1.0,
                alpha: 1.0,
                render_mode: 0,
              },
            ],
          },
        },
        storageConfig: config.clientRequest?.recordingFileS3 || config.clientRequest?.recordingFileOss || {
          vendor: 1, // 1: Qiniu, 2: AWS S3, 3: Alibaba OSS
          region: 0,
          bucket: 'default-bucket',
          accessKey: 'default-access-key',
          secretKey: 'default-secret-key',
          fileNamePrefix: ['recording', config.channelName],
        },
      };

      const response = await fetch(
        `${this.apiBaseUrl}/v1/projects/${ENV.agoraAppId}/cloud_recording/resourceid/${resourceId}/start`,
        {
          method: 'POST',
          headers: {
            'Authorization': this.getAuthHeader(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            cname: config.channelName,
            uid: '0',
            clientRequest,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        console.error('❌ Failed to start recording:', response.status, errorText);
        return {
          resourceId,
          sid: '',
          status: 'failed',
          message: `Failed to start recording: ${response.status}`,
        };
      }

      const data = await response.json() as any;
      const sid = data.sid;

      if (!sid) {
        return {
          resourceId,
          sid: '',
          status: 'failed',
          message: 'No session ID returned from Agora',
        };
      }

      // 保存录制信息
      this.activeRecordings.set(`${resourceId}:${sid}`, {
        resourceId,
        sid,
        config,
      });

      console.log(`✅ Started cloud recording: ${resourceId}:${sid}`);
      return {
        resourceId,
        sid,
        status: 'started',
      };
    } catch (error) {
      console.error('❌ Error starting recording:', error);
      return {
        resourceId: '',
        sid: '',
        status: 'failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 停止云端录制
   */
  async stopRecording(resourceId: string, sid: string): Promise<RecordingStopResponse> {
    try {
      if (!this.customerId || !this.customerSecret) {
        return {
          resourceId,
          sid,
          status: 'not_found',
          message: 'Agora credentials not configured',
        };
      }

      const recording = this.activeRecordings.get(`${resourceId}:${sid}`);
      if (!recording) {
        console.warn(`⚠️ Recording not found: ${resourceId}:${sid}`);
      }

      const response = await fetch(
        `${this.apiBaseUrl}/v1/projects/${ENV.agoraAppId}/cloud_recording/resourceid/${resourceId}/sid/${sid}/stop`,
        {
          method: 'POST',
          headers: {
            'Authorization': this.getAuthHeader(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            cname: recording?.config.channelName || 'unknown',
            uid: '0',
            clientRequest: {},
          }),
        }
      );

      if (!response.ok && response.status !== 404) {
        const errorText = await response.text().catch(() => '');
        console.error('❌ Failed to stop recording:', response.status, errorText);
        return {
          resourceId,
          sid,
          status: 'not_found',
          message: `Failed to stop recording: ${response.status}`,
        };
      }

      // 移除录制记录
      this.activeRecordings.delete(`${resourceId}:${sid}`);

      console.log(`✅ Stopped cloud recording: ${resourceId}:${sid}`);
      return {
        resourceId,
        sid,
        status: 'stopped',
      };
    } catch (error) {
      console.error('❌ Error stopping recording:', error);
      return {
        resourceId,
        sid,
        status: 'not_found',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 获取录制状态
   */
  async getRecordingStatus(resourceId: string, sid: string): Promise<RecordingStatusResponse> {
    try {
      if (!this.customerId || !this.customerSecret) {
        return {
          resourceId,
          sid,
          status: 'not_found',
          message: 'Agora credentials not configured',
        };
      }

      const response = await fetch(
        `${this.apiBaseUrl}/v1/projects/${ENV.agoraAppId}/cloud_recording/resourceid/${resourceId}/sid/${sid}/status`,
        {
          method: 'GET',
          headers: {
            'Authorization': this.getAuthHeader(),
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          return {
            resourceId,
            sid,
            status: 'not_found',
          };
        }
        const errorText = await response.text().catch(() => '');
        console.error('❌ Failed to get recording status:', response.status, errorText);
        return {
          resourceId,
          sid,
          status: 'not_found',
          message: `Failed to get status: ${response.status}`,
        };
      }

      const data = await response.json() as any;
      return {
        resourceId,
        sid,
        status: data.serverResponse?.status === 'started' ? 'started' : 'stopped',
        serverResponse: data.serverResponse,
      };
    } catch (error) {
      console.error('❌ Error getting recording status:', error);
      return {
        resourceId,
        sid,
        status: 'not_found',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 获取活跃录制列表
   */
  getActiveRecordings(): Array<{ key: string; resourceId: string; sid: string; config: RecordingConfig }> {
    return Array.from(this.activeRecordings.entries()).map(([key, value]) => ({
      key,
      ...value,
    }));
  }

  /**
   * 检查录制是否活跃
   */
  isRecordingActive(resourceId: string, sid: string): boolean {
    return this.activeRecordings.has(`${resourceId}:${sid}`);
  }
}

// 导出单例
export const agoraRecordingService = new AgoraRecordingService();
