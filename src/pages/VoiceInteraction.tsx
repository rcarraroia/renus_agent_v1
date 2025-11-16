/**
 * VoiceInteraction - Main page for voice interaction with RENUS
 */
import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { VoiceChromeSphere } from '@/components/voice/VoiceChromeSphere';
import { ConversationHistory } from '@/components/voice/ConversationHistory';
import { TextChatFallback } from '@/components/voice/TextChatFallback';
import { useVoiceWebSocket } from '@/hooks/useVoiceWebSocket';
import { useAudioManager } from '@/hooks/useAudioManager';
import { useSessionPersistence } from '@/hooks/useSessionPersistence';
import { useToast } from '@/hooks/use-toast';
import { analytics } from '@/services/analytics';
import type { AgentState, VoiceInteractionState, ConversationEntry } from '@/types/voice';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, RefreshCw, MessageSquare, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function VoiceInteraction() {
  const { toast } = useToast();
  const sessionIdRef = useRef<string>(`session_${Date.now()}`);
  
  // Session persistence
  const {
    conversationId: savedConversationId,
    leadId: savedLeadId,
    saveSession,
    clearSession,
    refreshSession,
    cleanupOldSessions,
    isSessionValid,
  } = useSessionPersistence({
    sessionTimeout: 30 * 60 * 1000, // 30 minutes
  });

  const [interactionState, setInteractionState] = useState<VoiceInteractionState>({
    agentState: 'idle',
    conversationId: savedConversationId,
    leadId: savedLeadId,
    transcriptions: [],
    functionalities: [],
    isActive: false,
    isConnected: false,
    error: null,
  });

  const [currentTranscription, setCurrentTranscription] = useState<string>('');
  const [showHistory, setShowHistory] = useState(false);
  const [useTextMode, setUseTextMode] = useState(false);

  // Start analytics session on mount
  useEffect(() => {
    analytics.startSession(sessionIdRef.current);
    cleanupOldSessions();

    return () => {
      analytics.endSession(sessionIdRef.current, interactionState.conversationId || undefined);
    };
  }, [cleanupOldSessions]);

  // WebSocket connection
  const {
    isConnected,
    connectionState,
    sendAudio,
    lastMessage,
    error: wsError,
    reconnect,
  } = useVoiceWebSocket({
    autoConnect: true,
    onStateChange: (state: AgentState) => {
      console.log('[VoiceInteraction] State changed:', state);
      setInteractionState(prev => ({ ...prev, agentState: state }));
      analytics.trackStateChange(state, sessionIdRef.current, interactionState.conversationId || undefined);
    },
    onMessage: (message) => {
      console.log('[VoiceInteraction] Message received:', message.type);
      
      // Handle different message types
      if (message.type === 'response' && message.text) {
        // Add agent response to history
        const entry: ConversationEntry = {
          id: `${Date.now()}-agent`,
          timestamp: new Date(),
          speaker: 'agent',
          text: message.text,
          state: message.state || 'speaking',
        };
        
        const newConversationId = message.conversation_id || prev.conversationId;
        const newLeadId = message.lead_id || prev.leadId;
        
        setInteractionState(prev => ({
          ...prev,
          transcriptions: [...prev.transcriptions, entry],
          conversationId: newConversationId,
          leadId: newLeadId,
          functionalities: message.functionalities || prev.functionalities,
        }));

        // Save session to localStorage
        if (newConversationId) {
          saveSession(newConversationId, newLeadId);
        }

        // Track response received
        analytics.responseReceived(sessionIdRef.current, newConversationId || undefined);

        // Play audio response
        if (message.audio_base64) {
          playAudio(message.audio_base64);
        }

        setCurrentTranscription('');
      }

      if (message.type === 'transcription' && message.text) {
        setCurrentTranscription(message.text);
      }

      if (message.type === 'error') {
        toast({
          title: 'Erro',
          description: message.error || 'Ocorreu um erro',
          variant: 'destructive',
        });
        setInteractionState(prev => ({ ...prev, error: message.error || null }));
        analytics.trackError(message.error || 'Unknown error', sessionIdRef.current, interactionState.conversationId || undefined);
      }
    },
    onError: (error) => {
      console.error('[VoiceInteraction] WebSocket error:', error);
      toast({
        title: 'Erro de Conexão',
        description: 'Falha na conexão com o servidor',
        variant: 'destructive',
      });
      analytics.trackError(error, sessionIdRef.current, interactionState.conversationId || undefined);
    },
  });

  // Audio management
  const {
    isRecording,
    isPlaying,
    audioLevel,
    startRecording,
    stopRecording,
    playAudio,
    error: audioError,
  } = useAudioManager({
    onAudioChunk: (audioData) => {
      // Send audio chunks to backend
      if (isConnected) {
        sendAudio(audioData, 'webm');
      }
    },
    onRecordingComplete: (audioData) => {
      console.log('[VoiceInteraction] Recording complete');
      
      // Add user transcription to history (will be updated when we get actual transcription)
      const entry: ConversationEntry = {
        id: `${Date.now()}-user`,
        timestamp: new Date(),
        speaker: 'user',
        text: currentTranscription || 'Processando...',
        state: 'listening',
      };
      
      setInteractionState(prev => ({
        ...prev,
        transcriptions: [...prev.transcriptions, entry],
      }));
    },
  });

  // Update connection state
  useEffect(() => {
    setInteractionState(prev => ({ ...prev, isConnected }));
  }, [isConnected]);

  // Handle activation (start recording)
  const handleActivate = useCallback(async () => {
    try {
      console.log('[VoiceInteraction] Activating voice input');
      await startRecording();
      setInteractionState(prev => ({ ...prev, isActive: true }));
      analytics.startRecording(sessionIdRef.current);
    } catch (error) {
      console.error('[VoiceInteraction] Failed to start recording:', error);
      toast({
        title: 'Erro no Microfone',
        description: 'Não foi possível acessar o microfone. Verifique as permissões.',
        variant: 'destructive',
      });
      analytics.trackError(error as Error, sessionIdRef.current, interactionState.conversationId || undefined);
    }
  }, [startRecording, toast, interactionState.conversationId]);

  // Handle deactivation (stop recording)
  const handleDeactivate = useCallback(() => {
    console.log('[VoiceInteraction] Deactivating voice input');
    stopRecording();
    setInteractionState(prev => ({ ...prev, isActive: false }));
    analytics.stopRecording(sessionIdRef.current);
  }, [stopRecording]);

  // Handle reconnection
  const handleReconnect = useCallback(() => {
    console.log('[VoiceInteraction] Manual reconnect');
    reconnect();
    analytics.trackReconnect(sessionIdRef.current);
    toast({
      title: 'Reconectando',
      description: 'Tentando reconectar ao servidor...',
    });
  }, [reconnect, toast]);

  // Handle text message send
  const handleSendTextMessage = useCallback(async (text: string) => {
    try {
      console.log('[VoiceInteraction] Sending text message:', text);
      
      // Add user message to history
      const userEntry: ConversationEntry = {
        id: `${Date.now()}-user`,
        timestamp: new Date(),
        speaker: 'user',
        text,
        state: 'listening',
      };
      
      setInteractionState(prev => ({
        ...prev,
        transcriptions: [...prev.transcriptions, userEntry],
      }));

      // Send as text via WebSocket (backend should handle text input)
      // For now, we'll simulate by sending empty audio with text metadata
      // In production, backend should have a text-only endpoint
      const textMessage = {
        type: 'text',
        text,
        conversation_id: interactionState.conversationId,
      };
      
      // This would need backend support for text messages
      // sendAudio would need to be extended or we need a sendText method
      console.log('[VoiceInteraction] Text message prepared:', textMessage);
      
      toast({
        title: 'Modo Texto',
        description: 'Funcionalidade em desenvolvimento. Use o modo de voz.',
        variant: 'default',
      });
    } catch (error) {
      console.error('[VoiceInteraction] Failed to send text message:', error);
      analytics.trackError(error as Error, sessionIdRef.current, interactionState.conversationId || undefined);
    }
  }, [interactionState.conversationId, toast]);

  // Clear history
  const handleClearHistory = useCallback(() => {
    setInteractionState(prev => ({
      ...prev,
      transcriptions: [],
      functionalities: [],
      conversationId: null,
      leadId: null,
    }));
    clearSession();
    toast({
      title: 'Histórico Limpo',
      description: 'O histórico de conversação foi limpo',
    });
  }, [clearSession, toast]);

  // Refresh session on activity
  useEffect(() => {
    if (isRecording || isPlaying) {
      refreshSession();
    }
  }, [isRecording, isPlaying, refreshSession]);

  // Restore session context on reconnect
  useEffect(() => {
    if (isConnected && savedConversationId && isSessionValid()) {
      console.log('[VoiceInteraction] Restoring session context:', savedConversationId);
      toast({
        title: 'Sessão Restaurada',
        description: 'Contexto da conversa anterior foi restaurado',
      });
    }
  }, [isConnected, savedConversationId, isSessionValid, toast]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Space bar to toggle recording (when not typing in input)
      if (event.code === 'Space' && event.target === document.body) {
        event.preventDefault();
        if (isConnected && !isPlaying) {
          if (isRecording) {
            handleDeactivate();
          } else {
            handleActivate();
          }
        }
      }

      // Escape to stop recording
      if (event.code === 'Escape' && isRecording) {
        handleDeactivate();
      }

      // H to toggle history
      if (event.code === 'KeyH' && event.ctrlKey) {
        event.preventDefault();
        setShowHistory(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isConnected, isPlaying, isRecording, handleActivate, handleDeactivate]);

  return (
    <div 
      className="min-h-screen bg-gradient-to-b from-gray-900 via-blue-900 to-gray-900 flex flex-col items-center justify-center p-8"
      role="main"
      aria-label="Página de interação por voz com RENUS"
    >
      {/* Header */}
      <header className="w-full max-w-6xl mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">RENUS Voice Agent</h1>
          <p className="text-white/60">Converse com o agente por voz</p>
        </div>
        
        <div className="flex gap-2" role="toolbar" aria-label="Controles de navegação">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setUseTextMode(!useTextMode)}
            title={useTextMode ? "Modo de voz" : "Modo de texto"}
            aria-label={useTextMode ? "Alternar para modo de voz" : "Alternar para modo de texto"}
          >
            <MessageCircle className="w-4 h-4" aria-hidden="true" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={handleReconnect}
            disabled={isConnected}
            title="Reconectar ao servidor"
            aria-label="Reconectar ao servidor"
            aria-disabled={isConnected}
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowHistory(!showHistory)}
            title={showHistory ? "Ocultar histórico" : "Mostrar histórico"}
            aria-label={showHistory ? "Ocultar histórico de conversação" : "Mostrar histórico de conversação"}
            aria-expanded={showHistory}
          >
            <MessageSquare className="w-4 h-4" aria-hidden="true" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="w-full max-w-6xl flex gap-8">
        {/* Voice or Text Mode */}
        <div className="flex-1 flex items-center justify-center">
          {useTextMode ? (
            <TextChatFallback
              transcriptions={interactionState.transcriptions}
              onSendMessage={handleSendTextMessage}
              isConnected={isConnected}
              isProcessing={interactionState.agentState === 'thinking'}
            />
          ) : (
            <VoiceChromeSphere
              state={interactionState.agentState}
              audioLevel={audioLevel}
              transcription={currentTranscription}
              isConnected={isConnected}
              onActivate={handleActivate}
              onDeactivate={handleDeactivate}
              showTranscription={true}
              showConnectionStatus={true}
            />
          )}
        </div>

        {/* Conversation History */}
        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="w-96"
            >
              <ConversationHistory
                transcriptions={interactionState.transcriptions}
                functionalities={interactionState.functionalities}
                onClear={handleClearHistory}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="mt-8 flex gap-4" role="group" aria-label="Controles de gravação">
        <Button
          size="lg"
          variant={isRecording ? 'destructive' : 'default'}
          onClick={isRecording ? handleDeactivate : handleActivate}
          disabled={!isConnected || isPlaying}
          className="gap-2"
          aria-label={isRecording ? "Parar gravação de voz" : "Iniciar gravação de voz"}
          aria-pressed={isRecording}
          aria-disabled={!isConnected || isPlaying}
        >
          {isRecording ? (
            <>
              <MicOff className="w-5 h-5" aria-hidden="true" />
              Parar
            </>
          ) : (
            <>
              <Mic className="w-5 h-5" aria-hidden="true" />
              Falar
            </>
          )}
        </Button>
      </div>

      {/* Status Bar */}
      <div className="mt-8 flex items-center gap-4 text-sm text-white/60" role="status" aria-live="polite">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`}
            role="status"
            aria-label={isConnected ? "Conectado" : "Desconectado"}
          />
          <span>{connectionState}</span>
        </div>
        
        {interactionState.conversationId && (
          <div aria-label={`ID da conversa: ${interactionState.conversationId}`}>
            Conversa: {interactionState.conversationId.slice(0, 8)}...
          </div>
        )}
        
        {isRecording && (
          <div className="flex items-center gap-2" role="status">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" aria-hidden="true" />
            <span>Gravando</span>
          </div>
        )}
        
        {isPlaying && (
          <div className="flex items-center gap-2" role="status">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" aria-hidden="true" />
            <span>Reproduzindo</span>
          </div>
        )}

        <div className="ml-auto text-xs text-white/40" aria-label="Atalhos de teclado">
          Atalhos: Espaço (gravar), Esc (parar), Ctrl+H (histórico)
        </div>
      </div>

      {/* Error Display */}
      {(wsError || audioError || interactionState.error) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg max-w-md"
          role="alert"
          aria-live="assertive"
        >
          <p className="text-red-300 text-sm">
            {wsError?.message || audioError?.message || interactionState.error}
          </p>
        </motion.div>
      )}
    </div>
  );
}
