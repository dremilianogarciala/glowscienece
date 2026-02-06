export class TTLStore {
  constructor(ttlMs) {
    this.ttlMs = ttlMs;
    this.map = new Map();
  }

  has(key) {
    this.#cleanup(key);
    return this.map.has(key);
  }

  set(key, value = true) {
    this.map.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }

  get(key) {
    this.#cleanup(key);
    return this.map.get(key)?.value;
  }

  #cleanup(key) {
    const item = this.map.get(key);
    if (item && item.expiresAt < Date.now()) {
      this.map.delete(key);
    }
  }
}

export class ConversationStore {
  constructor(maxHistoryMessages = 12) {
    this.maxHistoryMessages = maxHistoryMessages;
    this.histories = new Map();
  }

  append(conversationId, event) {
    const history = this.histories.get(conversationId) || [];
    history.push(event);
    if (history.length > this.maxHistoryMessages) {
      history.splice(0, history.length - this.maxHistoryMessages);
    }
    this.histories.set(conversationId, history);
  }

  get(conversationId) {
    return this.histories.get(conversationId) || [];
  }
}
