/**
 * ConversationHistory - Optimized conversation history component
 */
import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import type { ConversationEntry } from '@/types/voice';

interface ConversationHistoryProps {
  transcriptions: ConversationEntry[];
  functionalities: string[];
  onClear: () => void;
}

const ConversationEntry = memo(function ConversationEntry({ entry }: { entry: ConversationEntry }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-3 rounded-lg ${
        entry.speaker === 'user'
          ? 'bg-blue-500/20 ml-4'
          : 'bg-green-500/20 mr-4'
      }`}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs text-white/60">
          {entry.speaker === 'user' ? 'Você' : 'RENUS'}
        </span>
        <span className="text-xs text-white/40">
          {entry.timestamp.toLocaleTimeString()}
        </span>
      </div>
      <p className="text-sm text-white">{entry.text}</p>
    </motion.div>
  );
});

export const ConversationHistory = memo(function ConversationHistory({
  transcriptions,
  functionalities,
  onClear,
}: ConversationHistoryProps) {
  return (
    <Card className="bg-black/50 backdrop-blur-sm border-white/10 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Histórico</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          disabled={transcriptions.length === 0}
        >
          Limpar
        </Button>
      </div>

      <ScrollArea className="h-[500px]">
        <div className="space-y-4">
          {transcriptions.length === 0 ? (
            <p className="text-white/40 text-center py-8">
              Nenhuma conversa ainda
            </p>
          ) : (
            transcriptions.map((entry) => (
              <ConversationEntry key={entry.id} entry={entry} />
            ))
          )}
        </div>
      </ScrollArea>

      {/* Functionalities */}
      {functionalities.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <h4 className="text-sm font-semibold text-white mb-2">
            Funcionalidades Identificadas
          </h4>
          <div className="flex flex-wrap gap-2">
            {functionalities.map((func, idx) => (
              <span
                key={idx}
                className="px-2 py-1 text-xs bg-purple-500/20 text-purple-300 rounded"
              >
                {func}
              </span>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
});
