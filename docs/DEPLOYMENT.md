# RENUS Frontend Deployment Guide

Este documento descreve o processo completo de deployment do frontend RENUS via Vercel e configuração do Nginx como proxy de API.

## Arquitetura

```
Internet
   │
   ├─> Vercel (Frontend)
   │   └─> https://renus-frontend.vercel.app
   │
   └─> VPS (Backend API)
       └─> http://72.60.151.78:8080
           └─> Nginx (Proxy) → FastAPI Backend
```

## Pré-requisitos

- Conta no Vercel
- Acesso SSH à VPS (72.60.151.78)
- Backend rodando em localhost:8080 na VPS
- Repositório GitHub: https://github.com/rcarraroia/renus_frontend

---

## Parte 1: Deploy do Frontend (Vercel)

### 1.1 Conectar Repositório ao Vercel

1. Acesse [vercel.com](https://vercel.com) e faça login
2. Clique em "Add New Project"
3. Selecione "Import Git Repository"
4. Escolha o repositório `rcarraroia/renus_frontend`
5. Clique em "Import"

### 1.2 Configurar Build Settings

Na tela de configuração do projeto:

- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 1.3 Configurar Environment Variables

Adicione as seguintes variáveis de ambiente no Vercel Dashboard:

```bash
# API Configuration
VITE_API_BASE_URL=http://72.60.151.78:8080
VITE_API_TIMEOUT=30000
VITE_WS_URL=ws://72.60.151.78:8080/api/v1/agent/voice-stream

# Audio Configuration
VITE_AUDIO_SAMPLE_RATE=16000
VITE_AUDIO_CHUNK_INTERVAL=100
VITE_SILENCE_THRESHOLD=0.01
VITE_SILENCE_DURATION=1500

# Feature Flags
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_DEBUG=false
VITE_ENABLE_AUDIO_VISUALIZATION=true
VITE_ENABLE_TRANSCRIPTION_DISPLAY=true
VITE_ENABLE_PERFORMANCE_METRICS=false

# Environment
VITE_ENVIRONMENT=production
VITE_LOG_LEVEL=error
```

**Importante**: Certifique-se de que todas as variáveis estão configuradas para o ambiente **Production**.

### 1.4 Deploy

1. Clique em "Deploy"
2. Aguarde o build completar (geralmente 2-3 minutos)
3. Anote a URL de produção (ex: `https://renus-frontend.vercel.app`)

### 1.5 Configurar Domínio Customizado (Opcional)

1. Vá em "Settings" → "Domains"
2. Adicione seu domínio customizado
3. Configure DNS conforme instruções do Vercel

---

## Parte 2: Configurar Nginx na VPS

### 2.1 Conectar à VPS

```bash
ssh root@72.60.151.78
```

### 2.2 Atualizar CORS no Backend

Edite o arquivo de configuração do backend:

```bash
nano /path/to/backend/app/config.py
```

Atualize a variável `CORS_ORIGINS` para incluir o domínio Vercel:

```python
CORS_ORIGINS: str = "http://localhost:5173,http://localhost:8080,https://renus-frontend.vercel.app,https://renus-frontend-git-main.vercel.app"
```

Reinicie o backend:

```bash
docker restart renus-backend
```

### 2.3 Fazer Backup da Configuração Atual

```bash
cd /path/to/renus-backend
sudo bash scripts/backup-nginx.sh
```

### 2.4 Aplicar Nova Configuração do Nginx

```bash
sudo bash scripts/setup-nginx-api.sh
```

O script irá:
- Criar backup da configuração anterior
- Copiar nova configuração
- Criar symlink
- Testar configuração
- Recarregar Nginx

### 2.5 Verificar Nginx

```bash
# Verificar status
sudo systemctl status nginx

# Verificar logs
sudo tail -f /var/log/nginx/renus-api-access.log
sudo tail -f /var/log/nginx/renus-api-error.log

# Testar health endpoint
curl http://72.60.151.78/health
```

---

## Parte 3: Validação

### 3.1 Testes Manuais

1. **Frontend carrega**:
   - Acesse https://renus-frontend.vercel.app
   - Verifique que não há erros no console do navegador

2. **API funciona**:
   - Abra DevTools → Network
   - Navegue pela aplicação
   - Verifique que requisições para `/api/*` retornam 200

3. **WebSocket conecta**:
   - Inicie uma entrevista de voz
   - Verifique que WebSocket estabelece conexão
   - Teste gravação e reprodução de áudio

### 3.2 Smoke Tests Automatizados

Execute os smoke tests:

```bash
cd renus-frontend
npm run smoke-test
```

Todos os testes devem passar:
- ✓ Frontend Loads
- ✓ API Health Check
- ✓ CORS Validation
- ✓ WebSocket Connection
- ✓ Leads API
- ✓ Performance Metrics

### 3.3 Monitorar Logs

```bash
cd /path/to/renus-backend
sudo bash scripts/monitor-logs.sh
```

Observe por 5-10 minutos e verifique:
- Sem erros 500
- CORS headers presentes
- Requisições sendo processadas corretamente

---

## Parte 4: Rollback (Se Necessário)

### 4.1 Rollback do Nginx

Se algo der errado com o Nginx:

```bash
# Listar backups disponíveis
sudo bash scripts/rollback-nginx.sh

# Restaurar backup específico
sudo bash scripts/rollback-nginx.sh 20241116_143022
```

### 4.2 Rollback do Vercel

Se algo der errado com o frontend:

1. Acesse Vercel Dashboard
2. Vá em "Deployments"
3. Encontre o deployment anterior que funcionava
4. Clique em "..." → "Promote to Production"

---

## Troubleshooting

### Problema: Frontend não carrega

**Sintomas**: Página em branco, erro 404

**Soluções**:
1. Verifique build no Vercel Dashboard
2. Verifique variáveis de ambiente
3. Verifique logs do build

### Problema: API requests falham (CORS)

**Sintomas**: Erro CORS no console do navegador

**Soluções**:
1. Verifique CORS_ORIGINS no backend
2. Verifique headers do Nginx
3. Teste CORS manualmente:
   ```bash
   curl -H "Origin: https://renus-frontend.vercel.app" \
        -H "Access-Control-Request-Method: GET" \
        -X OPTIONS \
        http://72.60.151.78/api/v1/leads -v
   ```

### Problema: WebSocket não conecta

**Sintomas**: Erro ao iniciar entrevista de voz

**Soluções**:
1. Verifique URL do WebSocket nas variáveis de ambiente
2. Verifique headers de upgrade no Nginx
3. Teste WebSocket manualmente:
   ```javascript
   const ws = new WebSocket('ws://72.60.151.78:8080/api/v1/agent/voice-stream');
   ws.onopen = () => console.log('Connected');
   ws.onerror = (e) => console.error('Error:', e);
   ```

### Problema: Backend não responde

**Sintomas**: Timeout, erro 502/504

**Soluções**:
1. Verifique se backend está rodando:
   ```bash
   docker ps | grep renus-backend
   ```
2. Verifique logs do backend:
   ```bash
   docker logs renus-backend --tail 100
   ```
3. Reinicie backend se necessário:
   ```bash
   docker restart renus-backend
   ```

### Problema: Performance lenta

**Sintomas**: Carregamento > 3s, API > 500ms

**Soluções**:
1. Verifique métricas no Vercel Dashboard
2. Verifique recursos da VPS:
   ```bash
   htop
   df -h
   ```
3. Verifique logs do Nginx para gargalos

---

## Checklist de Deployment

### Pré-Deployment

- [ ] Backend está rodando e saudável
- [ ] CORS atualizado no backend
- [ ] Variáveis de ambiente configuradas no Vercel
- [ ] Backup do Nginx criado
- [ ] Equipe notificada

### Deployment

- [ ] Frontend deployado no Vercel
- [ ] Build completou com sucesso
- [ ] Nginx configurado na VPS
- [ ] Nginx recarregado sem erros

### Pós-Deployment

- [ ] Frontend carrega sem erros
- [ ] API requests funcionam
- [ ] WebSocket conecta
- [ ] Smoke tests passam
- [ ] Logs sem erros críticos
- [ ] Performance dentro dos targets
- [ ] Equipe notificada do sucesso

---

## Próximos Passos

### Melhorias Futuras

1. **HTTPS**: Configurar SSL/TLS com Let's Encrypt
2. **CDN**: Configurar CloudFlare para cache adicional
3. **Monitoring**: Implementar Grafana + Prometheus
4. **CI/CD**: Automatizar deployment com GitHub Actions
5. **Backup Automático**: Cron job para backups diários

### Manutenção

- **Logs**: Revisar logs semanalmente
- **Backups**: Manter últimos 10 backups
- **Updates**: Atualizar dependências mensalmente
- **Performance**: Monitorar métricas continuamente

---

## Contato

Para suporte ou dúvidas:
- Email: admin@renus.com
- GitHub: https://github.com/rcarraroia/renus_frontend

---

**Última atualização**: 2024-11-16
