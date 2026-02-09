export const config = {
  port: Number(process.env.PORT || process.env.BACKEND_PORT || 3001),
  metaVerifyToken: process.env.META_VERIFY_TOKEN || '',
  metaAppSecret: process.env.META_APP_SECRET || '',
  metaAccessToken: process.env.META_ACCESS_TOKEN || '',
  metaPhoneNumberId: process.env.META_PHONE_NUMBER_ID || '',
  geminiApiKey: process.env.GEMINI_API_KEY || process.env.API_KEY || '',
  maxHistoryMessages: Number(process.env.MAX_HISTORY_MESSAGES || 12),
  dedupeTtlMs: Number(process.env.DEDUPE_TTL_MS || 10 * 60 * 1000),
  replayWindowMs: Number(process.env.REPLAY_WINDOW_MS || 5 * 60 * 1000),
};

export function validateRequiredConfig() {
  const warnings = [];
  if (!config.metaVerifyToken) warnings.push('META_VERIFY_TOKEN is missing');
  if (!config.metaAppSecret) warnings.push('META_APP_SECRET is missing (signature validation will fail closed)');
  if (!config.geminiApiKey) warnings.push('GEMINI_API_KEY/API_KEY is missing');
  return warnings;
}
