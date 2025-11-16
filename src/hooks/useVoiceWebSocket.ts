/**
 * useVoiceWebSocket - Hook for managing WebSocket connection to RENUS Voice Agent
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import type { VoiceMessage, AgentState } from '../types/voice';

type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error';

interface UseVoiceWebSocketReturn {
  isConnected: boolean;
  connectionState: ConnectionState;
  sendAudio: (audioData: string, format: string) => void;
  sendText: (text: string) => void;
  lastMessage: VoiceMessage | null;
  error: Error | null;
  reconnect: () => void;
}

interface UseVoiceWebSocketOptions {
  url?: string;
  autoConnect?: boolean;
  reconnectAttempts?: number;
  reconnectDelay?: number;
  token?: string; // Optional JWT token for authentication
  onStateChange?: (state: AgentState) => void;
  onMessage?: (message: VoiceMessage) => void;
  onError?: (error: Error) => void;
}

export function useVoiceWebSocket(options: UseVoiceWebSocketOptions = {}): UseVoiceWebSocketReturn {
  const {
    url = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/api/v1/agent/voice-stream',
    autoConnect = true,
    reconnectAttempts = 3,
    reconnectDelay = 1000,
    token,
    onStateChange,
    onMessage,
    onError,
  } = options;

  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [lastMessage, setLastMessage] = useState<VoiceMessage | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectCountRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const messageQueueRef = useRef<Array<{ type: string; data: any }>>([]);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('[WebSocket] Already connected');
      return;
    }

    console.log('[WebSocket] Connecting to:', url);
    setConnectionState('connecting');
    setError(null);

    try {
      // Add token to URL if provided
      const wsUrl = token ? `${url}?token=${token}` : url;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[WebSocket] Connected');
        setConnectionState('connected');
        reconnectCountRef.current = 0;

        // Send queued messages
        while (messageQueueRef.current.length > 0) {
          const msg = messageQueueRef.current.shift();
          if (msg && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(msg));
          }
        }
      };

      ws.onmessage = (event) => {
        try {
          const message: VoiceMessage = JSON.parse(event.data);
          console.log('[WebSocket] Message received:', message.type);

          setLastMessage(message);

          // Handle state changes
          if (message.type === 'state' && message.state && onStateChange) {
            onStateChange(message.state);
          }

          // Call message callback
          if (onMessage) {
            onMessage(message);
          }
        } catch (err) {
          console.error('[WebSocket] Failed to parse message:', err);
        }
      };

      ws.onerror = (event) => {
        console.error('[WebSocket] Error:', event);
        const err = new Error('WebSocket error');
        setError(err);
        setConnectionState('error');
        if (onError) {
          onError(err);
        }
      };

      ws.onclose = (event) => {
        console.log('[WebSocket] Closed:', event.code, event.reason);
        setConnectionState('disconnected');
        wsRef.current = null;

        // Attempt reconnection
        if (reconnectCountRef.current < reconnectAttempts) {
          const delay = reconnectDelay * Math.pow(2, reconnectCountRef.current);
          console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${reconnectCountRef.current + 1}/${reconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectCountRef.current++;
            connect();
          }, delay);
        } else {
          console.log('[WebSocket] Max reconnection attempts reached');
          const err = new Error('Failed to reconnect after maximum attempts');
          setError(err);
          if (onError) {
            onError(err);
          }
        }
      };
    } catch (err) {
      console.error('[WebSocket] Connection error:', err);
      const error = err instanceof Error ? err : new Error('Failed to connect');
      setError(error);
      setConnectionState('error');
      if (onError) {
        onError(error);
      }
    }
  }, [url, token, reconnectAttempts, reconnectDelay, onStateChange, onMessage, onError]);

  const disconnect = useCallback(() => {
    console.log('[WebSocket] Disconnecting');
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setConnectionState('disconnected');
    reconnectCountRef.current = 0;
  }, []);

  const sendMessage = useCallback((message: { type: string; [key: string]: any }) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('[WebSocket] Not connected, queueing message');
      messageQueueRef.current.push(message);
    }
  }, []);

  const sendAudio = useCallback((audioData: string, format: string = 'wav') => {
    sendMessage({
      type: 'audio',
      audio: audioData,
      format,
    });
  }, [sendMessage]);

  const sendText = useCallback((text: string) => {
    sendMessage({
      type: 'text',
      text,
    });
  }, [sendMessage]);

  const reconnect = useCallback(() => {
    console.log('[WebSocket] Manual reconnect triggered');
    disconnect();
    reconnectCountRef.current = 0;
    setTimeout(connect, 100);
  }, [connect, disconnect]);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  return {
    isConnected: connectionState === 'connected',
    connectionState,
    sendAudio,
    sendText,
    lastMessage,
    error,
    reconnect,
  };
}
