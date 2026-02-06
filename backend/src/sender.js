export function createMetaSender(config, log) {
  return async function sendReply(normalizedEvent, text) {
    if (!config.metaAccessToken || !config.metaPhoneNumberId) {
      log('info', 'reply_dry_run', { to: normalizedEvent.senderId, text });
      return;
    }

    await fetch(`https://graph.facebook.com/v18.0/${config.metaPhoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.metaAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: normalizedEvent.senderId,
        text: { body: text.slice(0, 4096) },
      }),
    });
  };
}
