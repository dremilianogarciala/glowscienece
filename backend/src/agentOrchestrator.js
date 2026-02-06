import { GoogleGenAI } from '@google/genai';
import { routeAgent } from './router.js';

export function createOrchestrator({ config, conversationStore, sendReply, log }) {
  let ai = null;

  return async function orchestrate(normalizedEvent, correlationId) {
    const route = routeAgent(normalizedEvent.text);
    const history = conversationStore.get(normalizedEvent.conversationId);

    if (normalizedEvent.messageType !== 'text') {
      await sendReply(normalizedEvent, 'Recibí tu archivo. Puedo procesar texto e imágenes; para OCR avanzado aún no está habilitado.');
      return { route, skippedLlm: true };
    }

    if (!config.geminiApiKey) {
      const fallback = 'Gracias por escribir. Un agente te responderá pronto.';
      await sendReply(normalizedEvent, fallback);
      return { route, skippedLlm: true };
    }

    ai ??= new GoogleGenAI({ apiKey: config.geminiApiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [...history, { role: 'user', parts: [{ text: normalizedEvent.text }] }],
      config: { systemInstruction: `Eres ${route.agentId}. Responde breve y útil.`, temperature: 0.4 },
    });

    const output = response.text || 'Gracias por tu mensaje.';
    conversationStore.append(normalizedEvent.conversationId, { role: 'user', parts: [{ text: normalizedEvent.text }] });
    conversationStore.append(normalizedEvent.conversationId, { role: 'model', parts: [{ text: output }] });
    await sendReply(normalizedEvent, output);
    log('info', 'reply_sent', { correlationId, route: route.agentId, eventId: normalizedEvent.eventId });
    return { route, skippedLlm: false };
  };
}
