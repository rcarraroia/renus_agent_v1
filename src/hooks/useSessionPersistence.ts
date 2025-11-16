/**
 * useSessionPersistence - Hook for managing session persistence
 * Saves and restores conversation_id and session data from localStorage
 */
import { useState, useEffect, useCallback } from 'react';

interface SessionData {
  conversationId: string | null;
  leadId: string | null;
  timestamp: number;
  expiresAt: number;
}

interface UseSessionPersistenceOptions {
  sessionTimeout?: number; // in milliseconds, default 30 minutes
  storageKey?: string;
}

const DEFAULT_SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const DEFAULT_STORAGE_KEY = 'renus_voice_session';

export function useSessionPersistence(options: UseSessionPersistenceOptions = {}) {
  const {
    sessionTimeout = DEFAULT_SESSION_TIMEOUT,
    storageKey = DEFAULT_STORAGE_KEY,
  } = options;

  const [sessionData, setSessionData] = useState<SessionData | null>(null);

  // Load session from localStorage on mount
  useEffect(() => {
    const loadSession = () => {
      try {
        const stored = localStorage.getItem(storageKey);
        if (!stored) return;

        const data: SessionData = JSON.parse(stored);
        
        // Check if session has expired
        if (Date.now() > data.expiresAt) {
          console.log('[SessionPersistence] Session expired, clearing');
          localStorage.removeItem(storageKey);
          return;
        }

        console.log('[SessionPersistence] Loaded session:', data.conversationId);
        setSessionData(data);
      } catch (error) {
        console.error('[SessionPersistence] Failed to load session:', error);
        localStorage.removeItem(storageKey);
      }
    };

    loadSession();
  }, [storageKey]);

  // Save session to localStorage
  const saveSession = useCallback((conversationId: string, leadId: string | null = null) => {
    try {
      const data: SessionData = {
        conversationId,
        leadId,
        timestamp: Date.now(),
        expiresAt: Date.now() + sessionTimeout,
      };

      localStorage.setItem(storageKey, JSON.stringify(data));
      setSessionData(data);
      console.log('[SessionPersistence] Saved session:', conversationId);
    } catch (error) {
      console.error('[SessionPersistence] Failed to save session:', error);
    }
  }, [storageKey, sessionTimeout]);

  // Clear session from localStorage
  const clearSession = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
      setSessionData(null);
      console.log('[SessionPersistence] Cleared session');
    } catch (error) {
      console.error('[SessionPersistence] Failed to clear session:', error);
    }
  }, [storageKey]);

  // Update session expiration
  const refreshSession = useCallback(() => {
    if (!sessionData) return;

    try {
      const updatedData: SessionData = {
        ...sessionData,
        expiresAt: Date.now() + sessionTimeout,
      };

      localStorage.setItem(storageKey, JSON.stringify(updatedData));
      setSessionData(updatedData);
      console.log('[SessionPersistence] Refreshed session');
    } catch (error) {
      console.error('[SessionPersistence] Failed to refresh session:', error);
    }
  }, [sessionData, storageKey, sessionTimeout]);

  // Clean up old sessions (can be called periodically)
  const cleanupOldSessions = useCallback(() => {
    try {
      const keys = Object.keys(localStorage);
      const sessionKeys = keys.filter(key => key.startsWith('renus_voice_session'));
      
      let cleaned = 0;
      sessionKeys.forEach(key => {
        try {
          const stored = localStorage.getItem(key);
          if (!stored) return;

          const data: SessionData = JSON.parse(stored);
          if (Date.now() > data.expiresAt) {
            localStorage.removeItem(key);
            cleaned++;
          }
        } catch {
          // Invalid data, remove it
          localStorage.removeItem(key);
          cleaned++;
        }
      });

      if (cleaned > 0) {
        console.log(`[SessionPersistence] Cleaned up ${cleaned} old sessions`);
      }
    } catch (error) {
      console.error('[SessionPersistence] Failed to cleanup old sessions:', error);
    }
  }, []);

  // Check if session is valid
  const isSessionValid = useCallback(() => {
    if (!sessionData) return false;
    return Date.now() < sessionData.expiresAt;
  }, [sessionData]);

  return {
    sessionData,
    conversationId: sessionData?.conversationId || null,
    leadId: sessionData?.leadId || null,
    saveSession,
    clearSession,
    refreshSession,
    cleanupOldSessions,
    isSessionValid,
  };
}
