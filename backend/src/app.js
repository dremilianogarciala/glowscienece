import http from 'node:http';
import crypto from 'node:crypto';
import { config, validateRequiredConfig } from './config.js';
import { log } from './logger.js';
import { TTLStore, ConversationStore } from './store.js';
import { verifyMetaSignature, normalizeMetaEvent } from './meta.js';
import { createMetaSender } from './sender.js';
import { createOrchestrator } from './agentOrchestrator.js';

export function createServer() {
  const dedupeStore = new TTLStore(config.dedupeTtlMs);
  const conversationStore = new ConversationStore(config.maxHistoryMessages);
  const oneReplyRuleStore = new TTLStore(config.dedupeTtlMs);
  const sender = createMetaSender(config, log);
  const queue = [];
  const sseClients = new Set();
  const messages = [];

  const notifyClients = (message) => {
    const payload = `data: ${JSON.stringify(message)}\n\n`;
    sseClients.forEach((res) => res.write(payload));
  };

  const pushMessage = (message) => {
    messages.unshift(message);
    if (messages.length > 200) messages.splice(200);
    notifyClients(message);
  };

  const orchestrate = createOrchestrator({
    config,
    conversationStore,
    sendReply: async (normalizedEvent, text) => {
      await sender(normalizedEvent, text);
      pushMessage({
        id: `out_${Date.now()}`,
        contactName: 'OmniAgent',
        lastMessage: text,
        timestamp: new Date().toISOString(),
        platform: normalizedEvent.platform === 'whatsapp' ? 'whatsapp' : 'messenger',
        unread: false,
        avatar: 'OA',
      });
    },
    log,
  });

  let processing = false;
  const processQueue = async () => {
    if (processing) return;
    processing = true;
    while (queue.length) {
      const job = queue.shift();
      try {
        if (oneReplyRuleStore.has(job.normalizedEvent.eventId)) continue;
        await orchestrate(job.normalizedEvent, job.correlationId);
        oneReplyRuleStore.set(job.normalizedEvent.eventId, true);
      } catch (error) {
        log('error', 'job_failed', { correlationId: job.correlationId, error: String(error) });
      }
    }
    processing = false;
  };

  validateRequiredConfig().forEach((warning) => log('info', 'config_warning', { warning }));

  return http.createServer(async (req, res) => {
    const url = new URL(req.url || '/', `http://${req.headers.host}`);

    if (handleCors(req, res)) return;

    if (req.method === 'GET' && url.pathname === '/healthz') {
      return json(res, 200, { status: 'ok' });
    }

    if (req.method === 'GET' && url.pathname === '/api/messages') {
      return json(res, 200, messages);
    }

    if (req.method === 'GET' && url.pathname === '/api/events') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        Connection: 'keep-alive',
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*',
      });
      sseClients.add(res);
      res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);
      req.on('close', () => sseClients.delete(res));
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/webhook') {
      const mode = url.searchParams.get('hub.mode');
      const token = url.searchParams.get('hub.verify_token');
      const challenge = url.searchParams.get('hub.challenge');
      if (mode === 'subscribe' && token === config.metaVerifyToken) {
        return text(res, 200, challenge || '');
      }
      return text(res, 403, 'Forbidden');
    }

    if (req.method === 'POST' && url.pathname === '/api/webhook') {
      const correlationId = req.headers['x-correlation-id'] || crypto.randomUUID();
      const rawBody = await readBody(req);
      const signatureHeader = req.headers['x-hub-signature-256'];
      const signature = Array.isArray(signatureHeader) ? signatureHeader[0] : signatureHeader;

      if (!verifyMetaSignature({ rawBody, signatureHeader: signature, appSecret: config.metaAppSecret })) {
        log('error', 'invalid_signature', { correlationId });
        return json(res, 401, { error: 'invalid_signature' });
      }

      let body;
      try {
        body = JSON.parse(rawBody.toString('utf8') || '{}');
      } catch {
        return json(res, 400, { error: 'invalid_json' });
      }

      const normalizedEvent = normalizeMetaEvent(body);
      if (!normalizedEvent) return json(res, 200, { ignored: true });

      pushMessage({
        id: normalizedEvent.eventId,
        contactName: normalizedEvent.contactName,
        lastMessage: normalizedEvent.text || `[${normalizedEvent.messageType}]`,
        timestamp: new Date().toISOString(),
        platform: normalizedEvent.platform === 'whatsapp' ? 'whatsapp' : 'messenger',
        unread: true,
        avatar: normalizedEvent.platform === 'whatsapp' ? 'WA' : 'IG',
      });

      const eventAge = Date.now() - normalizedEvent.timestampMs;
      if (eventAge > config.replayWindowMs) {
        return json(res, 202, { replay: true });
      }

      if (dedupeStore.has(normalizedEvent.eventId)) {
        return json(res, 200, { duplicate: true });
      }

      dedupeStore.set(normalizedEvent.eventId, true);
      queue.push({ normalizedEvent, correlationId });
      setImmediate(processQueue);
      return json(res, 200, { accepted: true, correlationId });
    }

    return text(res, 404, 'Not found');
  });
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function handleCors(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,x-hub-signature-256,x-correlation-id');
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return true;
  }
  return false;
}

function json(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function text(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'text/plain' });
  res.end(data);
}
