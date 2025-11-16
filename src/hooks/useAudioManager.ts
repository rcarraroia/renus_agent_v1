/**
 * useAudioManager - Hook for managing audio recording and playback
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import { DEFAULT_AUDIO_CONFIG, type AudioConfig } from '../types/voice';

interface UseAudioManagerReturn {
  isRecording: boolean;
  isPlaying: boolean;
  audioLevel: number;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  playAudio: (base64Audio: string) => Promise<void>;
  error: Error | null;
}

interface UseAudioManagerOptions {
  config?: Partial<AudioConfig>;
  onAudioChunk?: (audioData: string) => void;
  onRecordingComplete?: (audioData: string) => void;
}

export function useAudioManager(options: UseAudioManagerOptions = {}): UseAudioManagerReturn {
  const {
    config: userConfig,
    onAudioChunk,
    onRecordingComplete,
  } = options;

  const config = { ...DEFAULT_AUDIO_CONFIG, ...userConfig };

  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioQueueRef = useRef<string[]>([]);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout>();
  const chunkIntervalRef = useRef<NodeJS.Timeout>();

  // Audio level monitoring
  const monitorAudioLevel = useCallback(() => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Calculate RMS (Root Mean Square) for audio level
    const sum = dataArray.reduce((acc, val) => acc + val * val, 0);
    const rms = Math.sqrt(sum / dataArray.length);
    const level = Math.min(100, (rms / 255) * 100);

    setAudioLevel(level);

    // Check for silence
    if (level < config.silenceThreshold * 100) {
      if (!silenceTimeoutRef.current) {
        silenceTimeoutRef.current = setTimeout(() => {
          console.log('[AudioManager] Silence detected, stopping recording');
          stopRecording();
        }, config.silenceDuration);
      }
    } else {
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = undefined;
      }
    }

    if (isRecording) {
      requestAnimationFrame(monitorAudioLevel);
    }
  }, [isRecording, config.silenceThreshold, config.silenceDuration]);

  const startRecording = useCallback(async () => {
    try {
      console.log('[AudioManager] Starting recording...');
      setError(null);

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: config.sampleRate,
          channelCount: config.channels,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;

      // Setup audio context for level monitoring
      const audioContext = new AudioContext({ sampleRate: config.sampleRate });
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Setup MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        console.log('[AudioManager] Recording stopped');
        
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        
        reader.onloadend = () => {
          const base64Audio = (reader.result as string).split(',')[1];
          if (onRecordingComplete) {
            onRecordingComplete(base64Audio);
          }
        };
        
        reader.readAsDataURL(audioBlob);
        chunksRef.current = [];
      };

      // Start recording
      mediaRecorder.start();
      setIsRecording(true);

      // Start audio level monitoring
      monitorAudioLevel();

      // Send chunks periodically if callback provided
      if (onAudioChunk) {
        chunkIntervalRef.current = setInterval(() => {
          if (mediaRecorder.state === 'recording') {
            mediaRecorder.requestData();
          }
        }, config.chunkInterval);
      }

      console.log('[AudioManager] Recording started');
    } catch (err) {
      console.error('[AudioManager] Failed to start recording:', err);
      const error = err instanceof Error ? err : new Error('Failed to start recording');
      setError(error);
      throw error;
    }
  }, [config, onAudioChunk, onRecordingComplete, monitorAudioLevel]);

  const stopRecording = useCallback(() => {
    console.log('[AudioManager] Stopping recording...');

    if (chunkIntervalRef.current) {
      clearInterval(chunkIntervalRef.current);
      chunkIntervalRef.current = undefined;
    }

    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = undefined;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    setIsRecording(false);
    setAudioLevel(0);
  }, []);

  const playAudio = useCallback(async (base64Audio: string): Promise<void> => {
    try {
      console.log('[AudioManager] Playing audio...');
      setError(null);

      // Add to queue if already playing
      if (isPlaying) {
        console.log('[AudioManager] Audio already playing, adding to queue');
        audioQueueRef.current.push(base64Audio);
        return;
      }

      setIsPlaying(true);

      // Convert base64 to blob
      const audioData = atob(base64Audio);
      const arrayBuffer = new ArrayBuffer(audioData.length);
      const view = new Uint8Array(arrayBuffer);
      for (let i = 0; i < audioData.length; i++) {
        view[i] = audioData.charCodeAt(i);
      }
      const blob = new Blob([arrayBuffer], { type: 'audio/mp3' });
      const audioUrl = URL.createObjectURL(blob);

      // Create and play audio element
      const audio = new Audio(audioUrl);
      currentAudioRef.current = audio;

      await new Promise<void>((resolve, reject) => {
        audio.onended = () => {
          console.log('[AudioManager] Audio playback ended');
          URL.revokeObjectURL(audioUrl);
          setIsPlaying(false);
          currentAudioRef.current = null;

          // Play next in queue
          const nextAudio = audioQueueRef.current.shift();
          if (nextAudio) {
            playAudio(nextAudio);
          }

          resolve();
        };

        audio.onerror = (err) => {
          console.error('[AudioManager] Audio playback error:', err);
          URL.revokeObjectURL(audioUrl);
          setIsPlaying(false);
          currentAudioRef.current = null;
          reject(new Error('Audio playback failed'));
        };

        audio.play().catch(reject);
      });
    } catch (err) {
      console.error('[AudioManager] Failed to play audio:', err);
      const error = err instanceof Error ? err : new Error('Failed to play audio');
      setError(error);
      setIsPlaying(false);
      throw error;
    }
  }, [isPlaying]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording();
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
      audioQueueRef.current = [];
    };
  }, [stopRecording]);

  return {
    isRecording,
    isPlaying,
    audioLevel,
    startRecording,
    stopRecording,
    playAudio,
    error,
  };
}
