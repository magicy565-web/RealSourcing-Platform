/**
 * Agora Real-Time Speech-to-Text & Translation Service
 * 声网实时转录翻译服务
 */

import { ENV } from './env';

export interface AgoraSTTConfig {
  channelName: string;
  uid: number | string;
  subscribeUid?: number | string; // 要转录的用户 UID，不指定则转录所有用户
  language?: string; // 语言代码，如 'en', 'zh', 'es' 等
  translateLanguage?: string; // 翻译目标语言
  maxIdleTime?: number; // 最大空闲时间（毫秒）
}

export interface AgoraSTTStartResponse {
  taskId: string;
  channelName: string;
  uid: number | string;
  status: 'started' | 'failed';
  message?: string;
}

export interface AgoraSTTStopResponse {
  taskId: string;
  status: 'stopped' | 'not_found';
  message?: string;
}

export interface AgoraSTTSegment {
  uid: string;
  text: string;
  isFinal: boolean;
  timestamp: number;
  language?: string;
  translatedText?: string;
  translatedLanguage?: string;
}

/**
 * Agora Real-Time Speech-to-Text & Translation Service
 */
export class AgoraTranslationService {
  private customerId: string;
  private customerSecret: string;
  private apiBaseUrl = 'https://api.agora.io';
  private activeTasks: Map<string, AgoraSTTConfig> = new Map();

  constructor() {
    this.customerId = ENV.agoraCustomerId;
    this.customerSecret = ENV.agoraCustomerSecret;

    if (!this.customerId || !this.customerSecret) {
      console.warn('⚠️ Agora Customer ID or Secret is missing for STT service');
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
   * 启动实时转录翻译任务
   */
  async startSTT(config: AgoraSTTConfig): Promise<AgoraSTTStartResponse> {
    try {
      if (!this.customerId || !this.customerSecret) {
        return {
          taskId: '',
          channelName: config.channelName,
          uid: config.uid,
          status: 'failed',
          message: 'Agora credentials not configured',
        };
      }

      // 构建请求体
      const requestBody = {
        appId: ENV.agoraAppId,
        channel: config.channelName,
        uid: typeof config.uid === 'string' ? parseInt(config.uid) : config.uid,
        subscribeUid: config.subscribeUid ? (typeof config.subscribeUid === 'string' ? parseInt(config.subscribeUid) : config.subscribeUid) : 0,
        language: config.language || 'en',
        translateLanguage: config.translateLanguage,
        maxIdleTime: config.maxIdleTime || 60000,
      };

      // 调用 Agora STT API
      const response = await fetch(`${this.apiBaseUrl}/v1/projects/${ENV.agoraAppId}/rtsc/speech-to-text/tasks`, {
        method: 'POST',
        headers: {
          'Authorization': this.getAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        console.error('❌ Failed to start STT task:', response.status, errorText);
        return {
          taskId: '',
          channelName: config.channelName,
          uid: config.uid,
          status: 'failed',
          message: `Failed to start STT: ${response.status} ${response.statusText}`,
        };
      }

      const data = await response.json() as any;
      const taskId = data.taskId || data.id;

      if (!taskId) {
        return {
          taskId: '',
          channelName: config.channelName,
          uid: config.uid,
          status: 'failed',
          message: 'No task ID returned from Agora',
        };
      }

      // 保存任务信息
      this.activeTasks.set(taskId, config);

      console.log(`✅ Started STT task: ${taskId}`);
      return {
        taskId,
        channelName: config.channelName,
        uid: config.uid,
        status: 'started',
      };
    } catch (error) {
      console.error('❌ Error starting STT task:', error);
      return {
        taskId: '',
        channelName: config.channelName,
        uid: config.uid,
        status: 'failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 停止实时转录翻译任务
   */
  async stopSTT(taskId: string): Promise<AgoraSTTStopResponse> {
    try {
      if (!this.customerId || !this.customerSecret) {
        return {
          taskId,
          status: 'not_found',
          message: 'Agora credentials not configured',
        };
      }

      // 调用 Agora STT API 停止任务
      const response = await fetch(`${this.apiBaseUrl}/v1/projects/${ENV.agoraAppId}/rtsc/speech-to-text/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': this.getAuthHeader(),
        },
      });

      if (!response.ok && response.status !== 404) {
        const errorText = await response.text().catch(() => '');
        console.error('❌ Failed to stop STT task:', response.status, errorText);
        return {
          taskId,
          status: 'not_found',
          message: `Failed to stop STT: ${response.status}`,
        };
      }

      // 移除任务记录
      this.activeTasks.delete(taskId);

      console.log(`✅ Stopped STT task: ${taskId}`);
      return {
        taskId,
        status: 'stopped',
      };
    } catch (error) {
      console.error('❌ Error stopping STT task:', error);
      return {
        taskId,
        status: 'not_found',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 获取活跃任务列表
   */
  getActiveTasks(): Array<{ taskId: string; config: AgoraSTTConfig }> {
    return Array.from(this.activeTasks.entries()).map(([taskId, config]) => ({
      taskId,
      config,
    }));
  }

  /**
   * 检查任务是否活跃
   */
  isTaskActive(taskId: string): boolean {
    return this.activeTasks.has(taskId);
  }
}

// 导出单例
export const agoraTranslationService = new AgoraTranslationService();
