/**
 * Analytics Service - Track voice interaction events and metrics
 */

export type AnalyticsEventType =
  | 'voice_session_start'
  | 'voice_session_end'
  | 'voice_recording_start'
  | 'voice_recording_stop'
  | 'voice_response_received'
  | 'voice_error'
  | 'voice_reconnect'
  | 'voice_state_change';

export interface AnalyticsEvent {
  type: AnalyticsEventType;
  timestamp: number;
  sessionId?: string;
  conversationId?: string;
  leadId?: string;
  metadata?: Record<string, any>;
}

export interface AnalyticsMetrics {
  sessionDuration: number;
  recordingDuration: number;
  responseLatency: number;
  errorCount: number;
  reconnectCount: number;
  interactionCount: number;
}

class AnalyticsService {
  private events: AnalyticsEvent[] = [];
  private sessionStartTime: number | null = null;
  private recordingStartTime: number | null = null;
  private lastRequestTime: number | null = null;
  private metrics: AnalyticsMetrics = {
    sessionDuration: 0,
    recordingDuration: 0,
    responseLatency: 0,
    errorCount: 0,
    reconnectCount: 0,
    interactionCount: 0,
  };

  /**
   * Track an analytics event
   */
  track(
    type: AnalyticsEventType,
    metadata?: Record<string, any>,
    sessionId?: string,
    conversationId?: string,
    leadId?: string
  ): void {
    const event: AnalyticsEvent = {
      type,
      timestamp: Date.now(),
      sessionId,
      conversationId,
      leadId,
      metadata,
    };

    this.events.push(event);
    this.updateMetrics(event);
    this.logEvent(event);

    // Send to backend if configured
    this.sendToBackend(event);
  }

  /**
   * Start tracking a session
   */
  startSession(sessionId: string): void {
    this.sessionStartTime = Date.now();
    this.track('voice_session_start', { sessionId }, sessionId);
  }

  /**
   * End tracking a session
   */
  endSession(sessionId: string, conversationId?: string): void {
    if (this.sessionStartTime) {
      const duration = Date.now() - this.sessionStartTime;
      this.metrics.sessionDuration = duration;
      this.track(
        'voice_session_end',
        { sessionId, duration, metrics: this.metrics },
        sessionId,
        conversationId
      );
      this.sessionStartTime = null;
    }
  }

  /**
   * Track recording start
   */
  startRecording(sessionId: string): void {
    this.recordingStartTime = Date.now();
    this.lastRequestTime = Date.now();
    this.track('voice_recording_start', {}, sessionId);
  }

  /**
   * Track recording stop
   */
  stopRecording(sessionId: string): void {
    if (this.recordingStartTime) {
      const duration = Date.now() - this.recordingStartTime;
      this.metrics.recordingDuration += duration;
      this.track('voice_recording_stop', { duration }, sessionId);
      this.recordingStartTime = null;
    }
  }

  /**
   * Track response received
   */
  responseReceived(sessionId: string, conversationId?: string): void {
    if (this.lastRequestTime) {
      const latency = Date.now() - this.lastRequestTime;
      this.metrics.responseLatency = latency;
      this.metrics.interactionCount++;
      this.track(
        'voice_response_received',
        { latency },
        sessionId,
        conversationId
      );
      this.lastRequestTime = null;
    }
  }

  /**
   * Track error
   */
  trackError(
    error: Error | string,
    sessionId?: string,
    conversationId?: string
  ): void {
    this.metrics.errorCount++;
    this.track(
      'voice_error',
      {
        error: typeof error === 'string' ? error : error.message,
        stack: typeof error === 'object' ? error.stack : undefined,
      },
      sessionId,
      conversationId
    );
  }

  /**
   * Track reconnection
   */
  trackReconnect(sessionId: string): void {
    this.metrics.reconnectCount++;
    this.track('voice_reconnect', {}, sessionId);
  }

  /**
   * Track state change
   */
  trackStateChange(
    state: string,
    sessionId: string,
    conversationId?: string
  ): void {
    this.track('voice_state_change', { state }, sessionId, conversationId);
  }

  /**
   * Get current metrics
   */
  getMetrics(): AnalyticsMetrics {
    return { ...this.metrics };
  }

  /**
   * Get all events
   */
  getEvents(): AnalyticsEvent[] {
    return [...this.events];
  }

  /**
   * Clear all events and metrics
   */
  clear(): void {
    this.events = [];
    this.metrics = {
      sessionDuration: 0,
      recordingDuration: 0,
      responseLatency: 0,
      errorCount: 0,
      reconnectCount: 0,
      interactionCount: 0,
    };
    this.sessionStartTime = null;
    this.recordingStartTime = null;
    this.lastRequestTime = null;
  }

  /**
   * Update metrics based on event
   */
  private updateMetrics(event: AnalyticsEvent): void {
    // Metrics are updated in specific tracking methods
  }

  /**
   * Log event to console (structured logging)
   */
  private logEvent(event: AnalyticsEvent): void {
    const logData = {
      timestamp: new Date(event.timestamp).toISOString(),
      event: event.type,
      sessionId: event.sessionId,
      conversationId: event.conversationId,
      leadId: event.leadId,
      ...event.metadata,
    };

    console.log('[Analytics]', JSON.stringify(logData));
  }

  /**
   * Send event to backend
   */
  private async sendToBackend(event: AnalyticsEvent): Promise<void> {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
      const endpoint = `${backendUrl}/api/v1/analytics/events`;

      // Only send in production or if explicitly enabled
      if (import.meta.env.PROD || import.meta.env.VITE_ANALYTICS_ENABLED === 'true') {
        await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(event),
        });
      }
    } catch (error) {
      // Silently fail - analytics should not break the app
      console.debug('[Analytics] Failed to send event to backend:', error);
    }
  }
}

// Export singleton instance
export const analytics = new AnalyticsService();
