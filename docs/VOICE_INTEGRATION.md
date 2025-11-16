# RENUS Voice Integration - Documentação de Uso

## Visão Geral

A integração de voz do RENUS permite interação natural por voz com o agente, utilizando tecnologias de Speech-to-Text (STT), processamento de linguagem natural e Text-to-Speech (TTS) com voz personalizada ElevenLabs.

## Componentes Principais

### 1. VoiceInteraction (Página Principal)

Página principal que orquestra toda a interação por voz.

**Localização:** `src/pages/VoiceInteraction.tsx`

**Funcionalidades:**
- Gerenciamento de estado da interação
- Integração com WebSocket para comunicação em tempo real
- Captura e reprodução de áudio
- Histórico de conversação
- Modo de fallback texto
- Analytics e logging

**Uso:**
```typescript
// Acessível via rota /voice
// Navegação automática via sidebar
```

### 2. VoiceChromeSphere (Avatar Visual)

Componente visual animado que representa o estado do agente.

**Localização:** `src/components/voice/VoiceChromeSphere.tsx`

**Estados:**
- `idle`: Aguardando interação
- `listening`: Capturando áudio do usuário
- `thinking`: Processando resposta
- `speaking`: Reproduzindo resposta

**Props:**
```typescript
interface VoiceChromeSphereProps {
  state: AgentState;
  audioLevel?: number;
  transcription?: string;
  isConnected: boolean;
  size?: number;
  onActivate?: () => void;
  onDeactivate?: () => void;
  showTranscription?: boolean;
  showConnectionStatus?: boolean;
}
```

### 3. useVoiceWebSocket (Hook de WebSocket)

Hook para gerenciamento de conexão WebSocket com o backend.

**Localização:** `src/hooks/useVoiceWebSocket.ts`

**Funcionalidades:**
- Conexão/desconexão automática
- Reconexão com backoff exponencial
- Envio de chunks de áudio
- Recebimento de mensagens (estados, transcrições, respostas)
- Tratamento de erros

**Uso:**
```typescript
const {
  isConnected,
  connectionState,
  sendAudio,
  lastMessage,
  error,
  reconnect,
} = useVoiceWebSocket({
  autoConnect: true,
  onStateChange: (state) => console.log(state),
  onMessage: (message) => console.log(message),
  onError: (error) => console.error(error),
});
```

### 4. useAudioManager (Hook de Áudio)

Hook para captura e reprodução de áudio.

**Localização:** `src/hooks/useAudioManager.ts`

**Funcionalidades:**
- Captura de áudio via MediaRecorder
- Detecção de silêncio
- Encoding para formato compatível
- Reprodução de áudio base64
- Fila de reprodução para streaming

**Uso:**
```typescript
const {
  isRecording,
  isPlaying,
  audioLevel,
  startRecording,
  stopRecording,
  playAudio,
  error,
} = useAudioManager({
  onAudioChunk: (data) => sendAudio(data),
  onRecordingComplete: (data) => console.log('Complete'),
});
```

### 5. useSessionPersistence (Hook de Persistência)

Hook para persistência de sessão no localStorage.

**Localização:** `src/hooks/useSessionPersistence.ts`

**Funcionalidades:**
- Salvar conversation_id e lead_id
- Restaurar contexto ao reconectar
- Limpeza automática de sessões expiradas
- Timeout configurável (padrão: 30 minutos)

**Uso:**
```typescript
const {
  conversationId,
  leadId,
  saveSession,
  clearSession,
  refreshSession,
  isSessionValid,
} = useSessionPersistence({
  sessionTimeout: 30 * 60 * 1000,
});
```

### 6. Analytics Service

Serviço para tracking de eventos e métricas.

**Localização:** `src/services/analytics.ts`

**Eventos Rastreados:**
- Início/fim de sessão
- Início/fim de gravação
- Resposta recebida
- Erros
- Reconexões
- Mudanças de estado

**Uso:**
```typescript
import { analytics } from '@/services/analytics';

analytics.startSession(sessionId);
analytics.startRecording(sessionId);
analytics.trackError(error, sessionId);
analytics.endSession(sessionId);
```

## Fluxo de Interação

### 1. Conexão Inicial
```
Usuário acessa /voice
  → WebSocket conecta automaticamente
  → Estado: idle
  → Avatar em modo aguardando
```

### 2. Gravação de Voz
```
Usuário clica em "Falar" (ou pressiona Espaço)
  → Solicita permissão de microfone
  → Inicia captura de áudio
  → Estado: listening
  → Avatar reage ao nível de áudio
  → Chunks de áudio enviados via WebSocket
```

### 3. Detecção de Silêncio
```
1.5s de silêncio detectado
  → Para gravação automaticamente
  → Envia áudio final
  → Estado: thinking
  → Avatar em modo processamento
```

### 4. Resposta do Agente
```
Backend processa e responde
  → Recebe transcrição do usuário
  → Recebe resposta em texto
  → Recebe áudio base64
  → Estado: speaking
  → Reproduz áudio automaticamente
  → Avatar sincronizado com áudio
```

### 5. Finalização
```
Áudio termina de reproduzir
  → Estado: idle
  → Pronto para nova interação
  → Histórico atualizado
```

## Atalhos de Teclado

- **Espaço**: Iniciar/parar gravação
- **Esc**: Parar gravação
- **Ctrl+H**: Mostrar/ocultar histórico

## Modo de Fallback Texto

Caso o usuário não possa usar voz (sem microfone, ambiente barulhento, etc.), há um modo de texto disponível.

**Ativação:**
- Clicar no ícone de mensagem no header
- Interface de chat texto aparece
- Histórico unificado mantido

## Acessibilidade

### ARIA Labels
Todos os componentes interativos possuem labels apropriados:
- Botões com `aria-label`
- Estados com `aria-live`
- Erros com `role="alert"`

### Navegação por Teclado
- Todos os controles acessíveis via Tab
- Atalhos de teclado disponíveis
- Focus visível em todos os elementos

### Screen Readers
- Anúncios de mudança de estado
- Descrições de ações
- Feedback de erros

## Configuração

### Variáveis de Ambiente

```env
# Frontend (.env.local)
VITE_BACKEND_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
VITE_ANALYTICS_ENABLED=false

# Backend (.env)
ELEVENLABS_API_KEY=your_api_key
RENUS_TTS_VOICE_ID=your_voice_id
VOICE_PROVIDER=elevenlabs
```

### Permissões Necessárias

- **Microfone**: Necessário para captura de áudio
- **Autoplay**: Necessário para reprodução automática de respostas

## Troubleshooting

### Problema: Microfone não funciona
**Solução:**
1. Verificar permissões do navegador
2. Verificar se outro app está usando o microfone
3. Tentar recarregar a página
4. Usar modo de texto como fallback

### Problema: Áudio não reproduz
**Solução:**
1. Verificar se autoplay está habilitado
2. Verificar volume do sistema
3. Verificar console para erros
4. Tentar interagir com a página primeiro (requisito de autoplay)

### Problema: Conexão WebSocket falha
**Solução:**
1. Verificar se backend está rodando
2. Verificar URL do WebSocket em .env
3. Verificar firewall/proxy
4. Usar botão de reconexão

### Problema: Latência alta
**Solução:**
1. Verificar conexão de internet
2. Verificar métricas no console
3. Considerar usar OpenAI TTS como fallback
4. Verificar logs do backend

## Performance

### Otimizações Implementadas

1. **React.memo**: Componentes otimizados para evitar re-renders
2. **Lazy Loading**: Página carregada sob demanda
3. **Code Splitting**: Bundle otimizado
4. **Audio Streaming**: Chunks de áudio para resposta mais rápida
5. **Cache de TTS**: Respostas comuns em cache

### Métricas Monitoradas

- Latência total (target: < 7s para 90% dos casos)
- Latência STT
- Latência Agent
- Latência TTS
- Taxa de erro
- Taxa de reconexão

## Exemplos de Uso

### Integração Básica

```typescript
import VoiceInteraction from '@/pages/VoiceInteraction';

// Já integrado no roteamento
// Acessível via /voice
```

### Uso Programático dos Hooks

```typescript
// WebSocket
const { sendAudio, isConnected } = useVoiceWebSocket({
  autoConnect: true,
  onMessage: handleMessage,
});

// Audio
const { startRecording, stopRecording } = useAudioManager({
  onAudioChunk: sendAudio,
});

// Session
const { saveSession, conversationId } = useSessionPersistence();

// Fluxo
await startRecording();
// ... usuário fala ...
stopRecording();
// ... resposta recebida ...
saveSession(conversationId, leadId);
```

## Próximos Passos

1. Implementar testes E2E
2. Adicionar suporte a múltiplos idiomas
3. Implementar interrupção de resposta
4. Adicionar visualização de forma de onda
5. Implementar modo offline com cache

## Suporte

Para problemas ou dúvidas:
1. Verificar logs do console (modo debug)
2. Verificar métricas de analytics
3. Consultar documentação do backend
4. Abrir issue no repositório
