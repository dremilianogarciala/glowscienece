# OmniAgent AI — Auditoría técnica y plan mínimo production-ready

## Sección A: Arquitectura detectada

### Stack real detectado
- **Frontend:** React 19 + TypeScript + Vite (`index.tsx`, `App.tsx`).
- **Backend legacy:** `server.js` (Express/CommonJS) con webhook Meta + Gemini + SSE in-memory.
- **Backend nuevo (scaffold PR):** `backend/src/*` en Node ESM con `http` nativo.
- **Modelo LLM:** Gemini vía `@google/genai` (en frontend y backend).
- **Persistencia real actual:** memoria en proceso (`messagesDB`, `userContexts` en `server.js`; stores TTL en backend nuevo).

### Árbol de módulos (resumen)
- `App.tsx` → enruta vistas Dashboard/Inbox/Router/Marketing/Agenda/Conexiones.
- `components/*` → UI principal, mayormente mock/simulada.
- `services/geminiService.ts` → chat, imagen, video, edición con Gemini desde frontend.
- `server.js` → webhook `/api/webhook`, verify GET challenge, IA y envío WhatsApp.
- `backend/src/*` (nuevo): webhook seguro + dedupe + router + orquestación + logging.

### Flujo actual de ejecución
1. Frontend Vite arranca en `3000`.
2. Backend legacy (si se ejecuta manualmente) escucha `3001`.
3. Meta llama `/api/webhook`.
4. Se parsea el primer mensaje, se guarda en memoria y se llama Gemini.
5. Se responde por Graph API WhatsApp si hay credenciales.

## Sección B: Top issues priorizados

| # | Issue | Severidad | Evidencia | Fix recomendado |
|---|---|---|---|---|
| 1 | Verificación de firma ausente en webhook | Crítica | `server.js` POST `/api/webhook` no usa `x-hub-signature-256` | Verificar HMAC SHA256 con `META_APP_SECRET` y fail-closed. |
| 2 | Verify token inseguro por default | Crítica | `META_VERIFY_TOKEN || 'omni_secret_123'` | Eliminar defaults sensibles; exigir env vars en prod. |
| 3 | Sin idempotencia/dedupe | Crítica | `server.js` procesa cada retry | Dedupe por `message.id` + TTL (Redis/DB). |
| 4 | Sin replay protection | Alta | No validación de timestamp | Ventana máxima (`REPLAY_WINDOW_MS`) y rechazo de eventos viejos. |
| 5 | Estado in-memory no durable | Alta | `messagesDB`, `userContexts` arrays | Persistencia en Postgres + Redis para locks/TTL. |
| 6 | Riesgo de respuestas múltiples | Alta | `handleSmartReply` puede correrse por reintentos | Regla “1 reply por incoming message_id”. |
| 7 | backend inconsistente con package | Alta | `server.js` usa deps no declaradas | Unificar backend ESM soportado por scripts/package. |
| 8 | Sin cola async real | Alta | procesamiento inline tras `200` | ACK rápido + queue worker (BullMQ/SQS/Rabbit). |
| 9 | Sin controles de rate/costo LLM | Alta | llamadas directas a Gemini | límites por usuario/canal + budget diario + truncado de contexto. |
|10| Datos sensibles en frontend | Alta | `services/geminiService.ts` usa API key en cliente | Mover inferencia al backend; no exponer llaves en browser. |
|11| Sin sanitización y policy de adjuntos | Media-Alta | no validación de payload/media | whitelists MIME/tamaño + antivirus + política OCR explícita. |
|12| Sin observabilidad operativa | Media-Alta | logs sueltos `console.log` | logs estructurados + correlation_id + métricas. |
|13| Sin manejo robusto de errores Meta | Media | envío sin retry/backoff formal | retry exponencial + DLQ + clasificación 4xx/5xx. |
|14| UX: estado conexión ambiguo | Media | vistas con simulaciones y “Sin conexiones” | health checks reales, test webhook, pasos guiados. |
|15| Sin CI/tests de regresión | Media | no workflow ni pruebas backend | GitHub Actions con lint/typecheck/test en PR. |

## Sección C: Cambios propuestos como PRs

### PR1 — Webhooks + validación + dedupe
- [x] Endpoint GET challenge `/api/webhook`.
- [x] Verificación HMAC de firma Meta.
- [x] Replay protection por timestamp.
- [x] ACK rápido y procesamiento en cola interna.
- [x] Dedupe TTL por `eventId`.
- Archivos: `backend/src/app.js`, `backend/src/meta.js`, `backend/src/store.js`, `backend/src/config.js`.

### PR2 — Orquestación agente + router + 1-reply rule
- [x] Pipeline receive → normalize → route → LLM → send.
- [x] Router por keywords + fallback general.
- [x] Regla “1 respuesta por mensaje entrante”.
- Archivos: `backend/src/agentOrchestrator.js`, `backend/src/router.js`, `backend/src/app.js`.

### PR3 — Persistencia (DB) + esquema mínimo
- [ ] Pendiente implementación real (no DB en repo).
- Sugerido (mínimo): tablas `conversations`, `messages`, `processed_events`, `agent_runs`.
- Acción inmediata: agregar Prisma/Drizzle + Postgres + migraciones.

### PR4 — Observabilidad + errores + rate limits
- [x] Logger estructurado JSON con `correlationId`.
- [x] Clasificación de errores en worker.
- [ ] Rate limit distribuido (pendiente Redis/API gateway).
- Archivos: `backend/src/logger.js`, `backend/src/app.js`.

### PR5 — Tests + CI
- [x] Tests de firma, router, TTL dedupe y webhook dedupe.
- [x] Workflow GitHub Actions (lint/typecheck/test/build).
- Archivos: `backend/tests/*.test.js`, `.github/workflows/ci.yml`, `package.json`.

### PR6 — UX improvements
- [ ] No implementado en código UI en este PR.
- Propuesta priorizada (10):
  1. Empty state Inbox con CTA “Conectar canal”.
  2. Estado salud webhook (Verified / Pending / Error).
  3. Diagnóstico en Conexiones: firma válida, último evento, latencia.
  4. “Agent status” (activo/pausado/fallback humano).
  5. Historial por conversación con trazabilidad de agente/router.
  6. Banners de errores visibles (Meta 401/403/429).
  7. Wizard de onboarding por canal con checklist.
  8. Confirmación explícita al cambiar Router activo.
  9. Panel de costo/tokens por agente.
  10. Indicador SLA “mensajes sin responder” en Dashboard.

## Sección D: Cómo correr y desplegar

### Dev local
1. `npm run dev` (frontend)
2. `npm run backend:start` (backend)
3. Configurar env:
   - `META_VERIFY_TOKEN`
   - `META_APP_SECRET`
   - `META_ACCESS_TOKEN`
   - `META_PHONE_NUMBER_ID`
   - `GEMINI_API_KEY`
4. Exponer backend con ngrok:
   - `ngrok http 3001`
   - usar URL pública en Meta Webhook callback: `https://<id>.ngrok-free.app/api/webhook`

### Opción deploy A (Render)
- Web service Node para backend + static/Vite frontend separado.
- Ventajas: setup simple, env vars seguras, logs básicos.

### Opción deploy B (Railway)
- Un servicio para backend y otro para frontend.
- Ventajas: DX rápida, variables por entorno, fácil Postgres add-on.

## Sección E: Riesgos restantes y próximos pasos
- Falta DB real + migraciones + retención PII configurable.
- Falta OAuth real Meta/Google Calendar (solo lectura agenda).
- Falta tool-calling seguro y sandbox para acciones externas.
- Voice: definir arquitectura ASR/TTS + costos + QoS.
- Seguridad adicional: WAF, secret rotation, SAST/DAST, borrado por solicitud (DSAR).

