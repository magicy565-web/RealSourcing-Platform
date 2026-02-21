/**
 * AgoraManager - Unified lifecycle management for Agora RTC and RTM
 * 
 * Responsibilities:
 * - Initialize and manage RTC engine (video/audio)
 * - Initialize and manage RTM client (messaging)
 * - Handle connection state transitions
 * - Provide cleanup and error recovery
 * - Prevent zombie connections and resource leaks
 */

import { toast } from 'sonner';

export type ConnectionState = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'disconnecting' | 'error';

export interface AgoraConfig {
  appId: string;
  token?: string;
  channelName: string;
  uid: number;
  role: 'host' | 'subscriber';
}

export interface AgoraManagerCallbacks {
  onStateChange?: (state: ConnectionState) => void;
  onError?: (error: Error) => void;
  onUserJoined?: (uid: number) => void;
  onUserLeft?: (uid: number) => void;
  onMessageReceived?: (message: string, userId: number) => void;
}

class AgoraManagerImpl {
  private state: ConnectionState = 'idle';
  private config: AgoraConfig | null = null;
  private callbacks: AgoraManagerCallbacks = {};
  
  // Agora SDK instances (lazy loaded)
  private rtcEngine: any = null;
  private rtmClient: any = null;
  
  // Connection tracking
  private connectionAttempts = 0;
  private maxRetries = 3;
  private retryDelay = 2000;
  private reconnectTimer: NodeJS.Timeout | null = null;
  
  // Resource cleanup tracking
  private eventListeners: Array<{ target: any; event: string; handler: any }> = [];
  private timers: NodeJS.Timeout[] = [];

  /**
   * Initialize Agora connections (RTC + RTM)
   */
  async initialize(config: AgoraConfig, callbacks: AgoraManagerCallbacks = {}): Promise<void> {
    if (this.state !== 'idle') {
      console.warn(`[AgoraManager] Cannot initialize in state: ${this.state}`);
      return;
    }

    this.config = config;
    this.callbacks = callbacks;
    this.setState('connecting');

    try {
      // Import Agora SDK dynamically
      const { default: AgoraRtc } = await import('agora-rtc-sdk-ng');
      const { default: AgoraRtm } = await import('agora-rtm-sdk');

      // Initialize RTC
      this.rtcEngine = AgoraRtc.createClient({ 
        mode: 'live', 
        codec: 'vp8' 
      });

      // Setup RTC event listeners
      this.setupRTCListeners();

      // Join RTC channel
      await this.rtcEngine.join(
        config.appId,
        config.channelName,
        config.token || null,
        config.uid
      );

      // Set client role
      await this.rtcEngine.setClientRole(config.role === 'host' ? 'host' : 'audience');

      // Initialize RTM
      this.rtmClient = new AgoraRtm.RTM(config.appId, String(config.uid));
      this.setupRTMListeners();

      // Login RTM
      await this.rtmClient.login({ uid: String(config.uid) });

      // Join RTM channel
      const rtmChannel = await this.rtmClient.subscribe(config.channelName);
      this.setupRTMChannelListeners(rtmChannel);

      this.setState('connected');
      this.connectionAttempts = 0;
      console.log('[AgoraManager] Connected successfully');
    } catch (error) {
      console.error('[AgoraManager] Initialization failed:', error);
      this.setState('error');
      this.callbacks.onError?.(error as Error);
      
      // Attempt reconnection
      this.scheduleReconnect();
    }
  }

  /**
   * Gracefully cleanup all connections and resources
   */
  async cleanup(): Promise<void> {
    if (this.state === 'idle' || this.state === 'disconnecting') {
      return;
    }

    this.setState('disconnecting');

    try {
      // Clear all timers
      this.timers.forEach(timer => clearTimeout(timer));
      this.timers = [];

      // Clear reconnect timer
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }

      // Remove all event listeners
      this.eventListeners.forEach(({ target, event, handler }) => {
        target?.off?.(event, handler);
      });
      this.eventListeners = [];

      // Leave RTC channel
      if (this.rtcEngine) {
        try {
          await this.rtcEngine.leave();
        } catch (error) {
          console.warn('[AgoraManager] RTC leave error:', error);
        }
      }

      // Logout and cleanup RTM
      if (this.rtmClient) {
        try {
          await this.rtmClient.logout();
        } catch (error) {
          console.warn('[AgoraManager] RTM logout error:', error);
        }
      }

      // Release SDK instances
      this.rtcEngine = null;
      this.rtmClient = null;
      this.config = null;

      this.setState('idle');
      console.log('[AgoraManager] Cleanup completed');
    } catch (error) {
      console.error('[AgoraManager] Cleanup failed:', error);
      this.setState('error');
      throw error;
    }
  }

  /**
   * Get current connection state
   */
  getState(): ConnectionState {
    return this.state;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.state === 'connected';
  }

  /**
   * Get RTC engine for direct access if needed
   */
  getRTCEngine(): any {
    return this.rtcEngine;
  }

  /**
   * Get RTM client for direct access if needed
   */
  getRTMClient(): any {
    return this.rtmClient;
  }

  // ─────────────────────────────────────────────────────────────
  // Private methods
  // ─────────────────────────────────────────────────────────────

  private setState(newState: ConnectionState): void {
    if (this.state === newState) return;
    
    this.state = newState;
    console.log(`[AgoraManager] State: ${this.state}`);
    this.callbacks.onStateChange?.(newState);
  }

  private setupRTCListeners(): void {
    if (!this.rtcEngine) return;

    const listeners = [
      {
        event: 'user-joined',
        handler: (user: any) => {
          console.log('[AgoraManager] User joined:', user.uid);
          this.callbacks.onUserJoined?.(user.uid);
        },
      },
      {
        event: 'user-left',
        handler: (user: any) => {
          console.log('[AgoraManager] User left:', user.uid);
          this.callbacks.onUserLeft?.(user.uid);
        },
      },
      {
        event: 'connection-state-change',
        handler: (curState: string, prevState: string, reason: string) => {
          console.log(`[AgoraManager] RTC connection state: ${prevState} → ${curState} (${reason})`);
          
          if (curState === 'DISCONNECTED') {
            this.scheduleReconnect();
          }
        },
      },
    ];

    listeners.forEach(({ event, handler }) => {
      this.rtcEngine.on(event, handler);
      this.eventListeners.push({ target: this.rtcEngine, event, handler });
    });
  }

  private setupRTMListeners(): void {
    if (!this.rtmClient) return;

    const listeners = [
      {
        event: 'connection-state-change',
        handler: (newState: string, reason: string) => {
          console.log(`[AgoraManager] RTM connection state: ${newState} (${reason})`);
          
          if (newState === 'DISCONNECTED') {
            this.scheduleReconnect();
          }
        },
      },
    ];

    listeners.forEach(({ event, handler }) => {
      this.rtmClient.addEventListener(event, handler);
      this.eventListeners.push({ target: this.rtmClient, event, handler });
    });
  }

  private setupRTMChannelListeners(channel: any): void {
    if (!channel) return;

    const handler = (message: any) => {
      console.log('[AgoraManager] RTM message received:', message);
      this.callbacks.onMessageReceived?.(message.text, parseInt(message.from));
    };

    channel.addEventListener('message', handler);
    this.eventListeners.push({ target: channel, event: 'message', handler });
  }

  private scheduleReconnect(): void {
    if (this.connectionAttempts >= this.maxRetries) {
      console.error('[AgoraManager] Max reconnection attempts reached');
      this.setState('error');
      return;
    }

    this.connectionAttempts++;
    this.setState('reconnecting');

    const delay = this.retryDelay * Math.pow(2, this.connectionAttempts - 1); // Exponential backoff
    console.log(`[AgoraManager] Scheduling reconnect in ${delay}ms (attempt ${this.connectionAttempts}/${this.maxRetries})`);

    this.reconnectTimer = setTimeout(async () => {
      if (this.config) {
        try {
          await this.initialize(this.config, this.callbacks);
        } catch (error) {
          console.error('[AgoraManager] Reconnection failed:', error);
          this.scheduleReconnect();
        }
      }
    }, delay);

    this.timers.push(this.reconnectTimer);
  }
}

// Singleton instance
let agoraManagerInstance: AgoraManagerImpl | null = null;

/**
 * Get or create AgoraManager singleton
 */
export function getAgoraManager(): AgoraManagerImpl {
  if (!agoraManagerInstance) {
    agoraManagerInstance = new AgoraManagerImpl();
  }
  return agoraManagerInstance;
}

/**
 * Reset AgoraManager (for testing)
 */
export function resetAgoraManager(): void {
  agoraManagerInstance = null;
}

export default getAgoraManager;
