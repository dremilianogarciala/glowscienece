import { createServer } from './app.js';
import { config } from './config.js';
import { log } from './logger.js';

const server = createServer();
server.listen(config.port, '0.0.0.0', () => {
  log('info', 'backend_started', { port: config.port, webhook: '/api/webhook', healthz: '/healthz' });
});
