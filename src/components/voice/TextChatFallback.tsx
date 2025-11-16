/**
 * TextChatFallback - Text-based chat interface as fallback for voice
 */
import React, { useState, useRef, useEffect, memo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send } from 'lucide-react';
import { motion } from 'framer-motion';
import type { ConversationEntry } from '@/types/voice';

interface TextChatFallbackProps {
  transcriptions: ConversationEntry[];
  onSendMessage: (message: string) => void;
  isConnected: boolean;
  isProcessing: boolean;
}

export const TextChatFallback = memo(function TextChatFallback({
  transcriptions,
  onSendMessage,
  isConnected,
  isProcessing,
}: TextChatFallbackProps) {
  const [message, setMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcriptions]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && isConnected && !isProcessing) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  return (
    <Card className="w-full max-w-2xl bg-black/50 backdrop-blur-sm border-white/10 p-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white mb-1">Modo Texto</h3>
        <p className="text-sm text-white/60">
          Converse com o agente por texto
        </p>
      </div>

      {/* Messages */}
      <ScrollArea className="h-[400px] mb-4 pr-4" ref={scrollRef}>
        <div className="space-y-3">
          {transcriptions.length === 0 ? (
            <p className="text-white/40 text-center py-8">
              Nenhuma mensagem ainda. Digite algo para começar.
            </p>
          ) : (
            transcriptions.map((entry) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-3 rounded-lg ${
                  entry.speaker === 'user'
                    ? 'bg-blue-500/20 ml-8'
                    : 'bg-green-500/20 mr-8'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-white/80">
                    {entry.speaker === 'user' ? 'Você' : 'RENUS'}
                  </span>
                  <span className="text-xs text-white/40">
                    {entry.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm text-white leading-relaxed">{entry.text}</p>
              </motion.div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={
            isConnected
              ? 'Digite sua mensagem...'
              : 'Aguardando conexão...'
          }
          disabled={!isConnected || isProcessing}
          className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/40"
          aria-label="Campo de mensagem"
        />
        <Button
          type="submit"
          disabled={!isConnected || isProcessing || !message.trim()}
          aria-label="Enviar mensagem"
        >
          <Send className="w-4 h-4" aria-hidden="true" />
        </Button>
      </form>

      {/* Status */}
      {!isConnected && (
        <p className="text-xs text-red-400 mt-2">
          Desconectado. Tentando reconectar...
        </p>
      )}
      {isProcessing && (
        <p className="text-xs text-blue-400 mt-2">
          Processando...
        </p>
      )}
    </Card>
  );
});
