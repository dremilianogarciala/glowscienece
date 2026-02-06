const RULES = [
  { id: 'sales-agent', keywords: ['precio', 'cotización', 'compra', 'plan'] },
  { id: 'agenda-agent', keywords: ['agenda', 'horario', 'cita', 'disponible'] },
  { id: 'support-agent', keywords: ['error', 'fallo', 'ayuda', 'soporte'] },
];

export function routeAgent(text) {
  const normalized = (text || '').toLowerCase();
  for (const rule of RULES) {
    if (rule.keywords.some((k) => normalized.includes(k))) {
      return { agentId: rule.id, confidence: 0.8, reason: `keyword:${rule.id}` };
    }
  }
  return { agentId: 'general-agent', confidence: 0.5, reason: 'fallback-general' };
}
