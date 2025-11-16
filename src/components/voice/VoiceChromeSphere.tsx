/**
 * VoiceChromeSphere - Enhanced ChromeSphere with voice interaction states
 */
import React, { useEffect, useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { AgentState } from '@/types/voice';

interface VoiceChromeSphereProps {
  state: AgentState;
  audioLevel?: number; // 0-100
  transcription?: string;
  isConnected: boolean;
  size?: number;
  onActivate?: () => void;
  onDeactivate?: () => void;
  showTranscription?: boolean;
  showConnectionStatus?: boolean;
}

const SPHERE_SIZE = 320;

export const VoiceChromeSphere = memo(function VoiceChromeSphere({
  state,
  audioLevel = 0,
  transcription,
  isConnected,
  size = SPHERE_SIZE,
  onActivate,
  onDeactivate,
  showTranscription = true,
  showConnectionStatus = true,
}: VoiceChromeSphereProps) {
  const [glowIntensity, setGlowIntensity] = useState(0);
  const [waveExpansion, setWaveExpansion] = useState(1);

  // Update glow and wave based on state and audio level
  useEffect(() => {
    switch (state) {
      case 'idle':
        setGlowIntensity(0.3);
        setWaveExpansion(1);
        break;
      case 'listening':
        // Reactive to audio level
        setGlowIntensity(0.5 + (audioLevel / 200));
        setWaveExpansion(1 + (audioLevel / 100));
        break;
      case 'thinking':
        setGlowIntensity(0.6);
        setWaveExpansion(1.2);
        break;
      case 'speaking':
        setGlowIntensity(0.9);
        setWaveExpansion(1.5);
        break;
    }
  }, [state, audioLevel]);

  // Sphere core variants
  const sphereVariants = {
    idle: {
      scale: 1,
      filter: 'brightness(1) blur(0px)',
      transition: { duration: 0.5, ease: 'easeOut' },
    },
    listening: {
      scale: 0.95 + (audioLevel / 500),
      filter: `brightness(${1 + audioLevel / 200}) blur(0px)`,
      transition: { duration: 0.1, ease: 'easeOut' },
    },
    speaking: {
      scale: [1, 1.05, 1],
      filter: ['brightness(1.2)', 'brightness(1.5)', 'brightness(1.2)'],
      transition: {
        duration: 0.6,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
    thinking: {
      scale: 1,
      filter: 'brightness(1.3) blur(0px)',
      rotate: 360,
      transition: {
        scale: { duration: 0.5 },
        filter: { duration: 0.5 },
        rotate: { duration: 8, repeat: Infinity, ease: 'linear' },
      },
    },
  };

  // Glow variants
  const glowVariants = {
    idle: {
      opacity: 0.3,
      scale: 1,
    },
    listening: {
      opacity: 0.5 + (audioLevel / 200),
      scale: 1 + (audioLevel / 200),
      transition: { duration: 0.1 },
    },
    speaking: {
      opacity: [0.7, 0.9, 0.7],
      scale: [1.2, 1.4, 1.2],
      transition: {
        duration: 0.6,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
    thinking: {
      opacity: 0.6,
      scale: 1.3,
      transition: { duration: 0.5 },
    },
  };

  // Wave variants (concentric circles)
  const waveVariants = {
    idle: {
      scale: 0,
      opacity: 0,
    },
    listening: {
      scale: [1, 1.5],
      opacity: [0.3, 0],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeOut',
      },
    },
    speaking: {
      scale: [1, 2],
      opacity: [0.5, 0],
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: 'easeOut',
      },
    },
    thinking: {
      scale: [1, 1.8],
      opacity: [0.4, 0],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeOut',
      },
    },
  };

  // Particle variants (for thinking state)
  const particleVariants = {
    thinking: {
      rotate: 360,
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: 'linear',
      },
    },
  };

  const handleClick = () => {
    if (state === 'idle' && onActivate) {
      onActivate();
    } else if (state === 'listening' && onDeactivate) {
      onDeactivate();
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center gap-6">
      {/* Connection Status */}
      {showConnectionStatus && (
        <div className="absolute top-0 right-0 flex items-center gap-2 px-3 py-1 rounded-full bg-black/50 backdrop-blur-sm">
          <div
            className={cn(
              'w-2 h-2 rounded-full',
              isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
            )}
          />
          <span className="text-xs text-white/80">
            {isConnected ? 'Conectado' : 'Desconectado'}
          </span>
        </div>
      )}

      {/* Main Sphere Container */}
      <div
        className="relative flex items-center justify-center cursor-pointer"
        style={{ width: size, height: size }}
        onClick={handleClick}
      >
        {/* Concentric Waves */}
        <AnimatePresence>
          {(state === 'listening' || state === 'speaking' || state === 'thinking') && (
            <>
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={`wave-${i}`}
                  className="absolute inset-0 rounded-full border-2"
                  style={{
                    borderColor: state === 'speaking' ? 'rgba(59, 130, 246, 0.5)' : 'rgba(34, 197, 94, 0.5)',
                  }}
                  variants={waveVariants}
                  initial="idle"
                  animate={state}
                  exit="idle"
                  custom={i}
                  transition={{ delay: i * 0.3 }}
                />
              ))}
            </>
          )}
        </AnimatePresence>

        {/* Outer Glow */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle, rgba(59, 130, 246, ${glowIntensity}) 0%, transparent 70%)`,
            filter: 'blur(40px)',
          }}
          variants={glowVariants}
          animate={state}
        />

        {/* Thinking Particles */}
        <AnimatePresence>
          {state === 'thinking' && (
            <motion.div
              className="absolute inset-0"
              variants={particleVariants}
              animate="thinking"
            >
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={`particle-${i}`}
                  className="absolute w-2 h-2 bg-blue-400 rounded-full"
                  style={{
                    top: '50%',
                    left: '50%',
                    transform: `rotate(${i * 90}deg) translateX(${size / 3}px)`,
                  }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Core Sphere Image */}
        <motion.div
          className="relative z-10"
          style={{ width: size, height: size }}
          variants={sphereVariants}
          animate={state}
        >
          <img
            src="/renus-chrome-sphere.png"
            alt="RENUS AI Core"
            className="w-full h-full object-contain"
            style={{ willChange: 'transform, filter' }}
          />
        </motion.div>

        {/* Audio Level Indicator (for listening state) */}
        {state === 'listening' && audioLevel > 5 && (
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-32 h-2 bg-black/50 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-green-500 to-blue-500"
              style={{ width: `${audioLevel}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
        )}
      </div>

      {/* Transcription Display */}
      {showTranscription && transcription && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="max-w-md px-4 py-2 rounded-lg bg-black/70 backdrop-blur-sm text-white text-center"
        >
          <p className="text-sm">{transcription}</p>
        </motion.div>
      )}

      {/* State Label */}
      <div className="text-center">
        <p className="text-sm text-white/60 capitalize">
          {state === 'idle' && 'Clique para falar'}
          {state === 'listening' && 'Ouvindo...'}
          {state === 'thinking' && 'Processando...'}
          {state === 'speaking' && 'Falando...'}
        </p>
      </div>
    </div>
  );
});
