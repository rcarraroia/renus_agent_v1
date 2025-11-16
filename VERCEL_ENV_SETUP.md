# Vercel Environment Variables Setup

Este documento descreve as variáveis de ambiente que devem ser configuradas no Vercel Dashboard para o deployment de produção.

## Como Configurar

1. Acesse o projeto no Vercel Dashboard
2. Vá em **Settings** → **Environment Variables**
3. Adicione as seguintes variáveis:

## Variáveis Obrigatórias

### API Configuration
```
VITE_API_BASE_URL=http://72.60.151.78:8080
VITE_API_TIMEOUT=30000
VITE_WS_URL=ws://72.60.151.78:8080/api/v1/agent/voice-stream
```

### Audio Configuration
```
VITE_AUDIO_SAMPLE_RATE=16000
VITE_AUDIO_CHUNK_INTERVAL=100
VITE_SILENCE_THRESHOLD=0.01
VITE_SILENCE_DURATION=1500
```

### Feature Flags
```
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_DEBUG=false
VITE_ENABLE_AUDIO_VISUALIZATION=true
VITE_ENABLE_TRANSCRIPTION_DISPLAY=true
VITE_ENABLE_PERFORMANCE_METRICS=false
```

### Environment
```
VITE_ENVIRONMENT=production
VITE_LOG_LEVEL=error
```

## Notas Importantes

- Todas as variáveis devem ser configuradas para o ambiente **Production**
- O arquivo `.env.production` local é apenas para referência
- As variáveis no Vercel sobrescrevem as locais durante o build
- Após adicionar/modificar variáveis, é necessário fazer redeploy

## Verificação

Após configurar, verifique que:
1. Build completa sem erros
2. Console do navegador não mostra erros de variáveis undefined
3. API requests apontam para http://72.60.151.78:8080
4. WebSocket conecta em ws://72.60.151.78:8080/api/v1/agent/voice-stream
