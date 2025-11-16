/**
 * Voice interaction types for RENUS ChromeSphere
 */

export type AgentState = 'idle' | 'listening' | 'thinking' | 'speaking';

export interface VoiceMessage {
  type: 'response' | 'state' | 'error' | 'audio_chunk' | 'transcription' | 'response_complete';
  state?: AgentState;
  text?: string;
  audio_base64?: string;
  conversation_id?: string;
  functionalities?: string[];
  lead_id?: string;
  latency?: LatencyMetrics;
  error?: string;
  code?: string;
  recoverable?: boolean;
  timestamp?: string;
  sequence?: number;
  is_final?: boolean;
}

export interface LatencyMetrics {
  stt: number;
  agent: number;
  tts: number;
  total: number;
}

export interface AudioChunk {
  data: string; // base64
  sequence: number;
  timestamp: number;
}

export interface ConversationEntry {
  id: string;
  timestamp: Date;
  speaker: 'user' | 'agent';
  text: string;
  audioUrl?: string;
  state: AgentState;
}

export interface AudioConfig {
  sampleRate: number;
  channels: number;
  chunkSize: number;
  chunkInterval: number;
  silenceThreshold: number;
  silenceDuration: number;
}

export const DEFAULT_AUDIO_CONFIG: AudioConfig = {
  sampleRate: 16000,
  channels: 1,
  chunkSize: 1600,
  chunkInterval: 100,
  silenceThreshold: 0.01,
  silenceDuration: 1500,
};

export interface VoiceInteractionState {
  agentState: AgentState;
  conversationId: string | null;
  leadId: string | null;
  transcriptions: ConversationEntry[];
  functionalities: string[];
  isActive: boolean;
  isConnected: boolean;
  error: string | null;
}
