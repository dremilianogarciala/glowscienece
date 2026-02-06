import crypto from 'node:crypto';

export function verifyMetaSignature({ rawBody, signatureHeader, appSecret }) {
  if (!appSecret || !signatureHeader) return false;
  const [algo, signature] = signatureHeader.split('=');
  if (algo !== 'sha256' || !signature) return false;

  const expected = crypto
    .createHmac('sha256', appSecret)
    .update(rawBody)
    .digest('hex');

  const sigBuf = Buffer.from(signature, 'hex');
  const expectedBuf = Buffer.from(expected, 'hex');
  if (sigBuf.length !== expectedBuf.length) return false;
  return crypto.timingSafeEqual(sigBuf, expectedBuf);
}

export function normalizeMetaEvent(body) {
  const value = body?.entry?.[0]?.changes?.[0]?.value;
  const message = value?.messages?.[0];
  if (!value || !message) return null;

  const platform = value.messaging_product === 'whatsapp' ? 'whatsapp' : 'instagram_or_messenger';
  const messageText = message?.text?.body || '';

  return {
    eventId: message.id,
    platform,
    senderId: message.from,
    contactName: value?.contacts?.[0]?.profile?.name || 'Unknown',
    conversationId: `${platform}:${message.from}`,
    messageType: message.type,
    text: messageText,
    attachments: mapAttachments(message),
    timestampMs: Number(message.timestamp || Date.now()) * 1000,
    raw: body,
  };
}

function mapAttachments(message) {
  if (message.type === 'image') return [{ type: 'image', mediaId: message.image?.id }];
  if (message.type === 'document') return [{ type: 'pdf_or_file', mediaId: message.document?.id }];
  if (message.type === 'audio') return [{ type: 'audio', mediaId: message.audio?.id }];
  return [];
}
